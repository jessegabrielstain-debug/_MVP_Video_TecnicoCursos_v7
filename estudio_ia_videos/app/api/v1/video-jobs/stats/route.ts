import { NextResponse } from 'next/server'
import { getSupabaseForRequest } from '~lib/services/supabase-server'
import { shouldUseMockRenderJobs, getMockUserId, computeMockStats } from '@/lib/render-jobs/mock-store'
import { logger } from '~lib/services/logger'

// Cache in-memory simples com TTL por usuário
const CACHE_TTL_MS = 30_000
const cache = new Map<string, { expiresAt: number; payload: any }>()

function getCache(key: string) {
  const hit = cache.get(key)
  if (!hit) return null
  if (Date.now() > hit.expiresAt) {
    cache.delete(key)
    return null
  }
  return hit.payload
}

function setCache(key: string, payload: any) {
  cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, payload })
}

export async function GET(req: Request) {
  const fallbackEnabled = process.env.ALLOW_RENDER_JOBS_FALLBACK !== 'false'
  let buildMockResponse: (() => NextResponse) | null = null
  let userId = ''
  try {
    const authHeader = (req.headers.get('authorization') ?? req.headers.get('Authorization') ?? '').trim()
    const authToken = authHeader.toLowerCase().startsWith('bearer ')
      ? authHeader.slice(7).trim()
      : authHeader
    const hasAuth = authToken.length > 0
    const mockMode = shouldUseMockRenderJobs() || !hasAuth

    let supabase: ReturnType<typeof getSupabaseForRequest> | null = null
    if (mockMode) {
      userId = getMockUserId(req)
    } else {
      supabase = getSupabaseForRequest(req)
      const { data: userData, error: userErr } = await supabase.auth.getUser()
      if (userErr || !userData?.user) {
        return NextResponse.json({ code: 'UNAUTHORIZED', message: 'Usuário não autenticado' }, { status: 401 })
      }
      userId = userData.user.id
    }

    const cacheKey = `stats:${userId}`
    const createMockResponse = (cacheTag: 'MISS' | 'HIT' = 'MISS') => {
      const payload = computeMockStats(userId)
      setCache(cacheKey, payload)
      return new NextResponse(JSON.stringify({ ...payload, metadata: { cache: cacheTag, ttl_ms: CACHE_TTL_MS, source: 'mock' } }), {
        status: 200,
        headers: { 'content-type': 'application/json', 'X-Cache': cacheTag }
      })
    }
    buildMockResponse = () => createMockResponse('MISS')

    const cached = getCache(cacheKey)
    if (cached) {
      return new NextResponse(JSON.stringify({ ...cached, metadata: { cache: 'HIT', ttl_ms: CACHE_TTL_MS } }), {
        status: 200,
        headers: { 'content-type': 'application/json', 'X-Cache': 'HIT' }
      })
    }

    if (mockMode) {
      return createMockResponse('MISS')
    }

    if (!supabase) {
      throw new Error('Supabase client não inicializado')
    }

    // Janela de 60 minutos para throughput
    const sinceIso = new Date(Date.now() - 60 * 60 * 1000).toISOString()

    // Total de jobs (head=true para retornar apenas count)
    const totalQuery = await supabase
      .from('render_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    const total_jobs = totalQuery.count ?? 0

    // Buscar status (limit para evitar exaustão – segue padrão MAX_ROWS=5000 usado em analytics)
    const { data: statusRows, error: statusErr } = await supabase
      .from('render_jobs')
      .select('status')
      .eq('user_id', userId)
      .limit(5000)

    if (statusErr) {
      logger.warn('video-jobs-stats', 'fallback: status query error', { message: statusErr.message })
      if (fallbackEnabled && buildMockResponse) {
        return buildMockResponse()
      }
      return NextResponse.json({ code: 'DB_ERROR', message: 'Falha ao obter contagem por status', details: statusErr.message }, { status: 500 })
    }

    const counts: Record<string, number> = {}
    for (const r of statusRows || []) {
      const s = (r as Record<string, unknown>).status as string
      counts[s] = (counts[s] || 0) + 1
    }

    const by_status = {
      queued: counts['queued'] || 0,
      processing: counts['processing'] || 0,
      completed: counts['completed'] || 0,
      failed: counts['failed'] || 0,
      cancelled: counts['cancelled'] || 0,
      other: Object.entries(counts).reduce((acc, [k, v]) => (['queued','processing','completed','failed','cancelled'].includes(k) ? acc : acc + v), 0)
    }

    // Throughput: completados nos últimos 60 minutos
    const completedQuery = await supabase
      .from('render_jobs')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('completed_at', sinceIso)

    const jobs_completed_last_60m = completedQuery.count || (completedQuery.data?.length ?? 0)
    const jobs_per_min = Number(((jobs_completed_last_60m || 0) / 60).toFixed(3))

    // Duração média (ms) para completados recentes (limitado a 5000)
    const { data: durationRows, error: durationErr } = await supabase
      .from('render_jobs')
      .select('duration_ms')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .limit(5000)

    if (durationErr) {
      logger.warn('video-jobs-stats', 'fallback: duration query error', { message: durationErr.message })
      if (fallbackEnabled && buildMockResponse) {
        return buildMockResponse()
      }
      return NextResponse.json({ code: 'DB_ERROR', message: 'Falha ao obter métricas de duração', details: durationErr.message }, { status: 500 })
    }

    const durations = (durationRows || []).map((r: any) => (typeof r.duration_ms === 'number' ? r.duration_ms : null)).filter((v: any) => typeof v === 'number') as number[]
    const avg_duration_ms = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0

    // Percentis (p50/p90/p95) sobre durations
    const sorted = durations.slice().sort((a, b) => a - b)
    const pct = (p: number) => {
      if (!sorted.length) return 0
      const idx = Math.min(sorted.length - 1, Math.floor(p * (sorted.length - 1)))
      return sorted[idx]
    }
    const p50_ms = pct(0.5)
    const p90_ms = pct(0.9)
    const p95_ms = pct(0.95)

    const payload = {
      totals: { total_jobs },
      by_status,
      throughput: {
        window_minutes: 60,
        jobs_completed_last_60m,
        jobs_per_min
      },
      performance: {
        avg_duration_ms,
        p50_ms,
        p90_ms,
        p95_ms
      }
    }

    setCache(cacheKey, payload)

    return new NextResponse(JSON.stringify({ ...payload, metadata: { cache: 'MISS', ttl_ms: CACHE_TTL_MS } }), {
      status: 200,
      headers: { 'content-type': 'application/json', 'X-Cache': 'MISS' }
    })
  } catch (err) {
    logger.error('video-jobs-stats', 'unexpected-error', err as Error)
    if (fallbackEnabled && buildMockResponse) {
      return buildMockResponse()
    }
    return NextResponse.json({ code: 'UNEXPECTED', message: 'Erro inesperado', details: (err as Error).message }, { status: 500 })
  }
}
