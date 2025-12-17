import { NextResponse } from 'next/server'
import { getSupabaseForRequest, logger } from '@/lib/services'
import { shouldUseMockRenderJobs, getMockUserId, computeMockStats } from '@/lib/render-jobs/mock-store'
import { VideoJobStatsQuerySchema } from '~lib/validation/schemas'

// Type for cached stats payload
interface CachedStatsPayload {
  metadata?: {
    cache?: string;
    ttl_ms?: number;
    source?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// Cache in-memory simples com TTL por usuário
const CACHE_TTL_MS = 30_000
const cache = new Map<string, { expiresAt: number; payload: CachedStatsPayload }>()

function getCache(key: string): CachedStatsPayload | null {
  const hit = cache.get(key)
  if (!hit) return null
  if (Date.now() > hit.expiresAt) {
    cache.delete(key)
    return null
  }
  return hit.payload
}

function setCache(key: string, payload: CachedStatsPayload) {
  cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, payload })
}

export async function GET(req: Request) {
  const fallbackEnabled = process.env.ALLOW_RENDER_JOBS_FALLBACK !== 'false'
  let buildMockResponse: (() => NextResponse) | null = null
  let userId = ''
  let queryParams: import('zod').infer<typeof VideoJobStatsQuerySchema> | null = null
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

    // Parse de query (compatível com ausência de parâmetros)
    const url = new URL(req.url)
    const rawParams: Record<string, unknown> = {}
    url.searchParams.forEach((v, k) => { rawParams[k] = v })
    const parsed = VideoJobStatsQuerySchema.safeParse(rawParams)
    if (!parsed.success) {
      return NextResponse.json({ code: 'VALIDATION_ERROR', message: 'Parâmetros inválidos', details: parsed.error.issues }, { status: 400 })
    }
    queryParams = parsed.data
    const { period, status, projectId, limit, includeErrors, includePerformance } = queryParams

    const cacheKey = `stats:${userId}:${period}:${status || 'all'}:${projectId || 'all'}:${limit}:${includeErrors ? 1 : 0}:${includePerformance ? 1 : 0}`
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
      return new NextResponse(JSON.stringify({
        ...cached,
        metadata: { ...cached.metadata, cache: 'HIT', ttl_ms: CACHE_TTL_MS }
      }), {
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

    if (!queryParams) {
      throw new Error('Parâmetros de stats não inicializados')
    }

    // Janela baseada em "period" (fallback 60 minutos)
    const windowMs = (() => {
      switch (period) {
        case '24h': return 24 * 60 * 60 * 1000
        case '7d': return 7 * 24 * 60 * 60 * 1000
        case '30d': return 30 * 24 * 60 * 60 * 1000
        case 'all': return 365 * 24 * 60 * 60 * 1000 // limite prático
        default: return 60 * 60 * 1000
      }
    })()
    const sinceIso = new Date(Date.now() - windowMs).toISOString()

    // Total de jobs (head=true para retornar apenas count)
    let baseQuery = supabase
      .from('render_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (queryParams.status) {
      baseQuery = baseQuery.eq('status', queryParams.status)
    }
    if (queryParams.projectId) {
      baseQuery = baseQuery.eq('project_id', queryParams.projectId)
    }

    const totalQuery = await baseQuery

    const total_jobs = totalQuery.count ?? 0

    // Buscar status (limit para evitar exaustão – segue padrão MAX_ROWS=5000 usado em analytics)
    type SupabaseQueryBuilder = ReturnType<typeof supabase.from>
    let statusQuery: SupabaseQueryBuilder = supabase
      .from('render_jobs')
      .select('status')
      .eq('user_id', userId)
      .limit(queryParams.limit)

    if (queryParams.status) {
      statusQuery = statusQuery.eq('status', queryParams.status)
    }
    if (queryParams.projectId) {
      statusQuery = statusQuery.eq('project_id', queryParams.projectId)
    }

    const { data: statusRows, error: statusErr } = await statusQuery

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
    let completedQueryBuilder: SupabaseQueryBuilder = supabase
      .from('render_jobs')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('completed_at', sinceIso)

    if (queryParams.projectId) {
      completedQueryBuilder = completedQueryBuilder.eq('project_id', queryParams.projectId)
    }

    const completedQuery = await completedQueryBuilder

    const jobs_completed_last_60m = completedQuery.count || (completedQuery.data?.length ?? 0)
    const jobs_per_min = Number(((jobs_completed_last_60m || 0) / 60).toFixed(3))

    // Duração média (ms) para completados recentes (limitado a 5000)
    let durationQuery: SupabaseQueryBuilder = supabase
      .from('render_jobs')
      .select('duration_ms')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .limit(queryParams.limit)

    if (queryParams.projectId) {
      durationQuery = durationQuery.eq('project_id', queryParams.projectId)
    }

    const { data: durationRows, error: durationErr } = await durationQuery

    if (durationErr) {
      logger.warn('video-jobs-stats', 'fallback: duration query error', { message: durationErr.message })
      if (fallbackEnabled && buildMockResponse) {
        return buildMockResponse()
      }
      return NextResponse.json({ code: 'DB_ERROR', message: 'Falha ao obter métricas de duração', details: durationErr.message }, { status: 500 })
    }

    const durations = (durationRows || []).map((r: { duration_ms: number | null }) => (typeof r.duration_ms === 'number' ? r.duration_ms : null)).filter((v: number | null) => typeof v === 'number') as number[]
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
        window_minutes: Math.round(windowMs / 60000),
        jobs_completed_last_60m,
        jobs_per_min
      },
      performance: {
        avg_duration_ms,
        p50_ms,
        p90_ms,
        p95_ms
      },
      metadata: {
        cache: 'MISS' as const,
        ttl_ms: CACHE_TTL_MS,
        period: queryParams.period,
        include_errors: queryParams.includeErrors,
        include_performance: queryParams.includePerformance,
        limit: queryParams.limit,
        filters: {
          status: queryParams.status ?? null,
          projectId: queryParams.projectId ?? null,
        }
      }
    }

    setCache(cacheKey, payload)

    return new NextResponse(JSON.stringify(payload), {
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

