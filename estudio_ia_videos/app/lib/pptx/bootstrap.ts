import type { SupabaseClient } from '@supabase/supabase-js'
import { parsePptxSlides, type ParsedPptxSlideSummary } from './parser'
import type { Database, Json } from '../supabase/types'

export type BootstrapSlidesResult = {
  ok: boolean
  inserted: number
  message?: string
}

const ASSETS_BUCKET = 'assets'

function buildSlideContent(textContent: string, notes: string | null): Json {
  return {
    type: 'pptx-extracted',
    body: textContent,
    notes,
  } as Json
}

export async function bootstrapSlidesFromPptx(
  supabase: SupabaseClient<Database>,
  projectId: string,
  sourcePath: string,
  previousSettings?: Database['public']['Tables']['projects']['Row']['settings'],
): Promise<BootstrapSlidesResult> {
  const download = await supabase.storage.from(ASSETS_BUCKET).download(sourcePath)

  if (download.error || !download.data) {
    return {
      ok: false,
      inserted: 0,
      message: download.error?.message ?? 'Não foi possível baixar o PPTX do storage.',
    }
  }

  const arrayBuffer = await download.data.arrayBuffer()
  const slides: ParsedPptxSlideSummary[] = await parsePptxSlides(arrayBuffer)

  if (slides.length === 0) {
    return {
      ok: false,
      inserted: 0,
      message: 'Nenhum slide encontrado no arquivo PPTX.',
    }
  }

  const payload: Database['public']['Tables']['slides']['Insert'][] = slides.map((slide, index) => ({
    project_id: projectId,
    title: slide.title.slice(0, 200),
    content: buildSlideContent(slide.textContent, slide.notes),
    order_index: index,
    duration: null,
  }))

  const { error: deleteError } = await supabase
    .from('slides')
    .delete()
    .eq('project_id', projectId)
  if (deleteError) {
    return {
      ok: false,
      inserted: 0,
      message: `Falha ao limpar slides anteriores: ${deleteError.message}`,
    }
  }

  const { error: insertError } = await supabase.from('slides').insert(payload)
  if (insertError) {
    return {
      ok: false,
      inserted: 0,
      message: `Falha ao criar slides: ${insertError.message}`,
    }
  }

  const baseSettings =
    previousSettings && typeof previousSettings === 'object' && !Array.isArray(previousSettings)
      ? (previousSettings as Record<string, unknown>)
      : {}

  const mergedSettings: Record<string, unknown> = {
    ...baseSettings,
    source_pptx_path: sourcePath,
    parsed_slide_count: slides.length,
    last_parsed_at: new Date().toISOString(),
  }

  const projectUpdate: Database['public']['Tables']['projects']['Update'] = {
    status: 'draft',
    settings: mergedSettings as Json,
    updated_at: new Date().toISOString(),
  }

  const { error: updateError } = await supabase
    .from('projects')
    .update(projectUpdate)
    .eq('id', projectId)

  if (updateError) {
    return {
      ok: false,
      inserted: 0,
      message: `Slides criados, mas falhou ao atualizar projeto: ${updateError.message}`,
    }
  }

  return {
    ok: true,
    inserted: slides.length,
  }
}
