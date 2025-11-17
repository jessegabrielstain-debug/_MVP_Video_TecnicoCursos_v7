import { NextResponse } from 'next/server'
import { getSupabaseForRequest, logger } from '@/lib/services'
import { parseUuidParam } from '~lib/handlers/route-params'

export async function GET(req: Request, ctx: { params: { id: string } }) {
  try {
    const supabase = getSupabaseForRequest(req)
    const { data: userData, error: userErr } = await supabase.auth.getUser()
    if (userErr || !userData.user) {
      return NextResponse.json({ code: 'UNAUTHORIZED', message: 'Usuário não autenticado' }, { status: 401 })
    }

    const parsed = parseUuidParam(ctx.params)
    if (!parsed.success) {
      const err = parsed as import('zod').SafeParseError<unknown>
      return NextResponse.json({ code: 'VALIDATION_ERROR', message: 'Parâmetro inválido', details: err.error.issues }, { status: 400 })
    }
    const { id } = parsed.data

    const { data, error } = await supabase
      .from('render_jobs')
      .select('id,status,project_id,created_at,progress,user_id,render_settings,attempts,duration_ms')
      .eq('id', id)
      .single()

  if (error || !data) return NextResponse.json({ code: 'NOT_FOUND', message: 'Job não encontrado' }, { status: 404 })
  type RenderJobRow = { id: string; status: string; project_id?: string | null; created_at?: string | null; progress?: number | null; user_id: string; render_settings?: unknown; attempts?: number | null; duration_ms?: number | null };
  const row = data as unknown as RenderJobRow
  if (row.user_id !== userData.user.id) return NextResponse.json({ code: 'FORBIDDEN', message: 'Sem permissão' }, { status: 403 })

    // Ocultar user_id no retorno público
  const { user_id, render_settings, ...rest } = row
    return NextResponse.json({ job: { ...rest, status: row.status, project_id: row.project_id, created_at: row.created_at, progress: row.progress, attempts: row.attempts, duration_ms: row.duration_ms ?? null, settings: render_settings } })
  } catch (err) {
    logger.error('video-jobs-id', 'unexpected-error', err as Error)
    return NextResponse.json({ code: 'UNEXPECTED', message: 'Erro inesperado', details: (err as Error).message }, { status: 500 })
  }
}
