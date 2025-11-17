import { NextResponse } from 'next/server'
import { getSupabaseForRequest, logger } from '@/lib/services'
import { checkRateLimit } from '@/lib/utils/rate-limit'
import { recordRateLimitHit, recordError } from '~lib/utils/metrics'
import { parseRequeueJob } from '~lib/handlers/video-jobs-requeue'

function badRequest(details: unknown) {
  return NextResponse.json({ code: 'VALIDATION_ERROR', message: 'Payload inválido', details }, { status: 400 })
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseForRequest(req)
    const { data: userData, error: userErr } = await supabase.auth.getUser()
    if (userErr || !userData.user) return NextResponse.json({ code: 'UNAUTHORIZED', message: 'Usuário não autenticado' }, { status: 401 })

    // Rate limiting por usuário (20/min)
    const rl = checkRateLimit(`requeue:${userData.user.id}`, 20, 60_000)
    if (!rl.allowed) {
      recordRateLimitHit();
      return new NextResponse(JSON.stringify({ code: 'RATE_LIMITED', message: 'Muitas requisições de requeue. Tente novamente em breve.' }), { status: 429, headers: { 'content-type': 'application/json', 'Retry-After': String(rl.retryAfterSec) } })
    }

    const json = await req.json()
    const parsed = parseRequeueJob(json)
    if (!parsed.success) {
      const err = parsed as import('zod').SafeParseError<unknown>
      return badRequest(err.error.issues)
    }
    const { jobId, priority, resetProgress } = parsed.data

    const { data: existing, error: fetchErr } = await supabase
      .from('render_jobs')
      .select('id,status,user_id')
      .eq('id', jobId)
      .single()

    if (fetchErr || !existing) return NextResponse.json({ code: 'NOT_FOUND', message: 'Job não encontrado' }, { status: 404 })
    type RenderJobRow = {
      id: string
      status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled'
      user_id?: string | null
      attempts?: number | null
      project_id?: string | null
      created_at?: string | null
      progress?: number | null
      duration_ms?: number | null
      render_settings?: unknown
      priority?: string | null
    }
    const row = existing as unknown as RenderJobRow
    if (row.user_id && row.user_id !== userData.user.id) return NextResponse.json({ code: 'FORBIDDEN', message: 'Sem permissão' }, { status: 403 })
    if (!['failed','cancelled'].includes(row.status)) return NextResponse.json({ code: 'CONFLICT', message: 'Somente jobs failed/cancelled podem ser reenfileirados' }, { status: 409 })
    // Cap de tentativas
    const MAX_ATTEMPTS = 5
    if (typeof row.attempts === 'number' && row.attempts >= MAX_ATTEMPTS) {
      return NextResponse.json({ code: 'MAX_ATTEMPTS_REACHED', message: `Limite de tentativas atingido (${MAX_ATTEMPTS}).` }, { status: 409 })
    }

    const nextAttempts = resetProgress ? 1 : (row.attempts ? row.attempts + 1 : 2)
    const updatePayload = {
      status: 'queued',
      progress: 0,
      attempts: nextAttempts,
      started_at: null,
      completed_at: null,
      duration_ms: null,
      error_message: null,
      priority,
    }

    if (resetProgress) {
      (updatePayload as Record<string, unknown>).progress = 0
    }

    const { data: updated, error: updateErr } = await supabase
      .from('render_jobs')
      .update(updatePayload)
      .eq('id', jobId)
      .select('id,status,project_id,created_at,progress,render_settings,attempts,duration_ms,priority')
      .single()

  if (updateErr || !updated) {
    recordError('DB_ERROR');
    logger.error('video-jobs-requeue', 'db-update-failed', updateErr as Error)
    return NextResponse.json({ code: 'DB_ERROR', message: 'Falha ao reenfileirar job', details: updateErr?.message }, { status: 500 })
  }
  const updatedRow = updated as unknown as RenderJobRow
  const jobResp = { id: updatedRow.id, status: updatedRow.status, project_id: updatedRow.project_id, created_at: updatedRow.created_at, progress: updatedRow.progress, attempts: updatedRow.attempts, duration_ms: updatedRow.duration_ms ?? null, settings: updatedRow.render_settings }
  return NextResponse.json({ job: jobResp })
  } catch (err) {
    recordError('UNEXPECTED');
    logger.error('video-jobs-requeue', 'unexpected-error', err as Error)
    return NextResponse.json({ code: 'UNEXPECTED', message: 'Erro inesperado', details: (err as Error).message }, { status: 500 })
  }
}

export function GET() {
  return NextResponse.json({ code: 'METHOD_NOT_ALLOWED', message: 'Use POST para reenfileirar job' }, { status: 405 })
}
