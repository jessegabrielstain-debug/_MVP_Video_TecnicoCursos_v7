// @ts-nocheck
// TODO: Backup - fix types
'use server'

import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getServiceRoleClient } from '@/lib/supabase'
import { getRenderQueue } from '@/lib/queue/render-queue'

const startRenderSchema = z.object({
  projectId: z.string().uuid('ID de projeto inválido.'),
  ownerId: z.string().uuid('ID do usuário inválido.').optional(),
})

export type StartRenderInput = z.infer<typeof startRenderSchema>
export type StartRenderResult = {
  ok: boolean
  message: string
  jobId?: string
}

function buildDefaultPaths(projectId: string, jobId: string) {
  return {
    slidesBucketPath: `slides/${projectId}`,
    outputBucketPath: `videos/${projectId}/${jobId}.mp4`,
  }
}

export async function startRenderJobAction(rawInput: StartRenderInput): Promise<StartRenderResult> {
  const parsed = startRenderSchema.safeParse(rawInput)

  if (!parsed.success) {
    const message = parsed.error.issues.at(0)?.message ?? 'Dados inválidos.'
    return { ok: false, message }
  }

  const { projectId, ownerId } = parsed.data
  const supabase = getServiceRoleClient()
  const jobId = randomUUID()
  const { slidesBucketPath, outputBucketPath } = buildDefaultPaths(projectId, jobId)

  const { error: insertError } = await supabase.from('render_jobs').insert({
    id: jobId,
    project_id: projectId,
    status: 'pending',
    progress: 0,
    output_url: null,
    error_message: null,
  })

  if (insertError) {
    return {
      ok: false,
      message: `Não foi possível criar o job de render: ${insertError.message}`,
    }
  }

  const { error: projectUpdateError } = await supabase
    .from('projects')
    .update({ status: 'processing', updated_at: new Date().toISOString() })
    .eq('id', projectId)

  if (projectUpdateError) {
    // Falha em atualizar o status do projeto não impede a continuação do fluxo
  }

  try {
    const queue = getRenderQueue()
    await queue.add(jobId, {
      projectId,
      userId: ownerId ?? 'system',
      slidesBucketPath,
      outputBucketPath,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido na fila.'

    await supabase
      .from('render_jobs')
      .update({
        status: 'failed',
        error_message: errorMessage,
      })
      .eq('id', jobId)

    return {
      ok: false,
      message: `Fila de render indisponível: ${errorMessage}`,
    }
  }

  revalidatePath('/dashboard')
  revalidatePath('/editor')

  return {
    ok: true,
    message: 'Renderização iniciada. Acompanhe o progresso no dashboard.',
    jobId,
  }
}
