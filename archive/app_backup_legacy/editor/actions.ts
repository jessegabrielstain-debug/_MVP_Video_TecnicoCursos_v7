// @ts-nocheck
// TODO: Backup - fix types
'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getServiceRoleClient } from '@/lib/supabase'

const slideUpdateSchema = z.object({
  id: z.string().uuid('ID de slide inválido.'),
  title: z
    .string()
    .trim()
    .max(200, 'O título deve ter no máximo 200 caracteres.')
    .optional()
    .nullable(),
  order_index: z.number().int().min(0, 'A ordem deve ser positiva.'),
  duration: z
    .number({ invalid_type_error: 'A duração deve ser um número.' })
    .int('A duração deve ser um número inteiro.')
    .min(0, 'A duração não pode ser negativa.')
    .nullable()
    .optional(),
})

const updateSlidesSchema = z.object({
  projectId: z.string().uuid('ID do projeto inválido.'),
  slides: z.array(slideUpdateSchema).max(500, 'Limite de 500 slides por projeto.'),
})

export type UpdateSlidesInput = z.infer<typeof updateSlidesSchema>
export type UpdateSlidesResult = { ok: boolean; message: string }

export async function updateSlidesAction(input: UpdateSlidesInput): Promise<UpdateSlidesResult> {
  const parsed = updateSlidesSchema.safeParse(input)

  if (!parsed.success) {
    const message = parsed.error.issues.at(0)?.message ?? 'Dados inválidos.'
    return { ok: false, message }
  }

  const { projectId, slides } = parsed.data

  if (slides.length === 0) {
    return { ok: true, message: 'Nenhum slide para atualizar.' }
  }

  const supabase = getServiceRoleClient()

  const payload = slides.map((slide) => ({
    id: slide.id,
    project_id: projectId,
    title: slide.title?.length ? slide.title : null,
    order_index: slide.order_index,
    duration: slide.duration ?? null,
  }))

  const { error } = await supabase.from('slides').upsert(payload, { onConflict: 'id' })

  if (error) {
    return { ok: false, message: `Falha ao salvar slides: ${error.message}` }
  }

  // Tocar updated_at do projeto para refletir edição
  const { error: projectUpdateError } = await supabase
    .from('projects')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', projectId)

  if (projectUpdateError) {
    // Atualização de timestamp é desejável, mas não bloqueia o fluxo principal
  }

  revalidatePath('/dashboard')
  revalidatePath('/editor')

  return { ok: true, message: 'Slides atualizados com sucesso.' }
}
