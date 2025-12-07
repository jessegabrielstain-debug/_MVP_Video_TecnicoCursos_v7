// @ts-nocheck
// TODO: Backup - fix types
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getNrTemplateByNumber } from '@/lib/nr/catalog'
import { addProject } from '@/lib/projects/mockStore'
import { addSlidesBulk } from '@/lib/slides/mockStore'

export const dynamic = 'force-dynamic'

const payloadSchema = z.object({
  nr_number: z.string().regex(/^NR-\d{2}$/),
  title: z.string().min(1).max(500).optional(),
  description: z.string().optional(),
})

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const parsed = payloadSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({
      error: 'Invalid payload',
      details: parsed.error.flatten().fieldErrors,
    }, { status: 400 })
  }

  const { nr_number, title, description } = parsed.data
  const tpl = getNrTemplateByNumber(nr_number)
  if (!tpl) {
    return NextResponse.json({ error: 'NR template not found' }, { status: 404 })
  }

  const userId = request.headers.get('x-user-id') || 'demo-user'
  const projectId = `proj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

  const project = {
    id: projectId,
    user_id: userId,
    title: title || `${tpl.nr_number} · ${tpl.title}`,
    description: description || tpl.description,
    status: 'draft' as const,
    settings: {
      source: 'nr_template',
      nr_number: tpl.nr_number,
      slide_count: tpl.slide_count,
      duration_seconds: tpl.duration_seconds,
      template_config: tpl.template_config,
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  addProject(project)

  // Criar slides iniciais a partir dos tópicos do template (quando disponível)
  const topics: string[] = Array.isArray((tpl as any).template_config?.topics)
    ? (tpl as any).template_config.topics
    : []

  const slideBase = {
    project_id: projectId,
    background_color: '#FFFFFF',
    background_image: null as string | null,
    avatar_config: {} as Record<string, any>,
    audio_config: {} as Record<string, any>,
  }

  const now = new Date().toISOString()
  const slides = (topics.length > 0 ? topics : Array.from({ length: tpl.slide_count }, (_, i) => `Slide ${i + 1}`))
    .map((title, idx) => ({
      id: `slide-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${idx}`,
      order_index: idx,
      title: String(title),
      content: '',
      duration: Math.max(5, Math.round(tpl.duration_seconds / Math.max(1, (topics.length || tpl.slide_count)))) ,
      created_at: now,
      updated_at: now,
      ...slideBase,
    }))

  addSlidesBulk(slides as any)

  return NextResponse.json({ project }, { status: 201 })
}
