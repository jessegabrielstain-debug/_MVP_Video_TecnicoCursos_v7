import { NextResponse } from 'next/server'
import { getSupabaseForRequest, logger } from '@/lib/services'
import { checkRateLimit } from '@/lib/utils/rate-limit'
import { recordRateLimitHit, recordError } from '~lib/utils/metrics'
import { parseUpdateProgress } from '~lib/handlers/video-jobs-progress'


interface RenderJobRow {
  id: string;
  status: string;
  project_id: string;
  created_at: string;
  progress: number;
  attempts: number;
  duration_ms?: number | null;
  render_settings: unknown;
  started_at?: string;
}
function badRequest(details: unknown) {
  return NextResponse.json({ code: 'VALIDATION_ERROR', message: 'Payload inválido', details }, { status: 400 })
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseForRequest(req)
    const { data: userData, error: userErr } = await supabase.auth.getUser()
    if (userErr || !userData.user) {
      return NextResponse.json({ code: 'UNAUTHORIZED', message: 'Usuário não autenticado' }, { status: 401 })
    }

    // Rate limiting por usuário para updates de progresso (120/min)
    const rl = checkRateLimit(`progress:${userData.user.id}`, 120, 60_000)
    if (!rl.allowed) {
      recordRateLimitHit();
      return new NextResponse(JSON.stringify({ code: 'RATE_LIMITED', message: 'Muitas requisições de progresso. Tente novamente em breve.' }), { status: 429, headers: { 'content-type': 'application/json', 'Retry-After': String(rl.retryAfterSec) } })
    }

    const json = await req.json()
    const parsed = parseUpdateProgress(json)
    if (!parsed.success) {
      const err = parsed as import('zod').SafeParseError<unknown>
      return badRequest(err.error.issues)
    }
    const { jobId, progress, status } = parsed.data

    const { data: existing, error: fetchErr } = await supabase
      .from('render_jobs')
      .select('id,status,user_id')
      .eq('id', jobId)
      .single()

    if (fetchErr || !existing) return NextResponse.json({ code: 'NOT_FOUND', message: 'Job não encontrado' }, { status: 404 })
    type RenderJobRow = { id: string; status: string; progress?: number | null; error_message?: string | null };
    const row = existing as unknown as RenderJobRow
    if (row.user_id && row.user_id !== userData.user.id) {
      return NextResponse.json({ code: 'FORBIDDEN', message: 'Sem permissão para atualizar este job' }, { status: 403 })
    }
    if (!['queued','processing'].includes(row.status)) {
      return NextResponse.json({ code: 'CONFLICT', message: 'Job não pode ser atualizado neste status' }, { status: 409 })
    }

    const patch: Record<string, unknown> = { progress }
    if (status) patch.status = status
    // Auto set started_at quando entrar em processing
    if (status === 'processing') {
      const { data: currentRow } = await supabase.from('render_jobs').select('started_at').eq('id', jobId).single()
      if (currentRow && !(currentRow as RenderJobRow).started_at) {
        patch.started_at = new Date().toISOString()
      }
    }
    // Se completou, calcular duration_ms (started_at já deve existir; se não, ignorar) e set completed_at
    if (status === 'completed' || status === 'failed') {
      patch.completed_at = new Date().toISOString()
    }

    // Usa RPC de update simples via raw SQL se tipos inferidos bloquearem update
    // Obter registro para cálculo de duração se necessário
    let baseRow: any = null
    if (status === 'completed') {
      const { data: existingForDuration } = await supabase.from('render_jobs').select('id,started_at').eq('id', jobId).single()
      baseRow = existingForDuration
      if (existingForDuration && (existingForDuration as RenderJobRow).started_at) {
        const startedAtMs = Date.parse((existingForDuration as RenderJobRow).started_at)
        const dur = Date.now() - startedAtMs
        patch.duration_ms = dur
      }
    }
    const { data: updated, error: updateErr } = await supabase
      .from('render_jobs')
      .update(patch)
      .eq('id', jobId)
      .select('id,status,project_id,created_at,progress,render_settings,attempts,duration_ms')
      .single()

    if (updateErr || !updated) {
      recordError('DB_ERROR');
      logger.error('video-jobs-progress', 'db-update-failed', updateErr as Error)
      return NextResponse.json({ code: 'DB_ERROR', message: 'Falha ao atualizar job', details: updateErr?.message }, { status: 500 })
    }
  const jobResp = { id: (updated as RenderJobRow).id, status: (updated as RenderJobRow).status, project_id: (updated as RenderJobRow).project_id, created_at: (updated as RenderJobRow).created_at, progress: (updated as RenderJobRow).progress, attempts: (updated as RenderJobRow).attempts, duration_ms: (updated as RenderJobRow).duration_ms ?? null, settings: (updated as RenderJobRow).render_settings }
  return NextResponse.json({ job: jobResp })
  } catch (err) {
    recordError('UNEXPECTED');
    logger.error('video-jobs-progress', 'unexpected-error', err as Error)
    return NextResponse.json({ code: 'UNEXPECTED', message: 'Erro inesperado', details: (err as Error).message }, { status: 500 })
  }
}

export function GET() {
  return NextResponse.json({ code: 'METHOD_NOT_ALLOWED', message: 'Use POST para atualizar progresso' }, { status: 405 })
}
