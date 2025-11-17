/**
 * API: Slides Management
 * GET /api/slides?projectId=xxx - Lista slides do projeto
 * POST /api/slides - Criar novo slide
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const createSlideSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(1).max(500),
  content: z.string().optional(),
  duration: z.number().int().positive().default(5),
  orderIndex: z.number().int().nonnegative(),
})

// Mock storage
const mockSlides = new Map<string, any>()

export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get('projectId')

  if (!projectId) {
    return NextResponse.json({ error: 'projectId query param is required' }, { status: 400 })
  }

  const projectSlides = Array.from(mockSlides.values())
    .filter(s => s.project_id === projectId)
    .sort((a, b) => a.order_index - b.order_index)

  return NextResponse.json({
    slides: projectSlides,
    total: projectSlides.length,
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const parseResult = createSlideSchema.safeParse(body)

  if (!parseResult.success) {
    return NextResponse.json({
      error: 'Invalid payload',
      details: parseResult.error.flatten().fieldErrors,
    }, { status: 400 })
  }

  const { projectId, title, content, duration, orderIndex } = parseResult.data
  
  const slideId = `slide-${Date.now()}-${Math.random().toString(36).substring(7)}`
  const slide = {
    id: slideId,
    project_id: projectId,
    order_index: orderIndex,
    title,
    content: content || '',
    duration,
    background_color: '#FFFFFF',
    background_image: null,
    avatar_config: {},
    audio_config: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  mockSlides.set(slideId, slide)

  return NextResponse.json({ slide }, { status: 201 })
}
