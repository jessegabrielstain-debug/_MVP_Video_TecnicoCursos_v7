
/**
 * 🎙️ API de Auto-Narração
 * POST: Gera narração automática para um projeto PPTX
 * Sprint 45 - Fase 1
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AutoNarrationService } from '@/lib/pptx/auto-narration-service'

export async function POST(request: NextRequest) {
  console.log('🎙️ [Auto-Narrate] Iniciando geração de narração...')

  try {
    const body = await request.json()
    const { projectId, options } = body

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId é obrigatório' },
        { status: 400 }
      )
    }

    // 1. Buscar projeto no banco
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        timeline: true,
        slides: true
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Projeto não encontrado' },
        { status: 404 }
      )
    }

    // 2. Converter slides para formato esperado
    // Priorizar slides do modelo Slide, depois slidesData JSON
    let slides: Array<{ slideNumber: number; notes?: string; elements: unknown[] }> = []

    if (project.slides && project.slides.length > 0) {
      // Usar slides do modelo Slide
      slides = project.slides.map((slide: Record<string, unknown>, index: number) => {
        const content = slide.content as Record<string, unknown> | null;
        const notes = typeof content?.notes === 'string' ? content?.notes : '';
        const elements = Array.isArray(content?.elements) ? (content?.elements as unknown[]) : [];
        return {
          slideNumber: index + 1,
          notes,
          elements
        };
      })
    } else if (project.slidesData) {
      // Usar slidesData JSON
      const slidesDataUnknown = project.slidesData as unknown
      if (Array.isArray(slidesDataUnknown)) {
        const slidesData = slidesDataUnknown as Array<Record<string, unknown>>
        slides = slidesData.map((slide, index: number) => ({
          slideNumber: index + 1,
          notes: typeof slide.notes === 'string' ? (slide.notes as string) : '',
          elements: Array.isArray(slide.elements) ? (slide.elements as unknown[]) : []
        }))
      }
    } else if (project.timeline?.tracks) {
      // Usar timeline tracks
      const tracksUnknown = project.timeline.tracks as unknown
      if (Array.isArray(tracksUnknown)) {
        const tracks = tracksUnknown as Array<Record<string, unknown>>
        const videoTrack = tracks.find((t) => t?.type === 'video' || t?.type === 'main') as Record<string, unknown> | undefined
        const elems = (videoTrack?.elements as unknown[]) || []
        if (Array.isArray(elems)) {
          slides = elems.map((element, index: number) => {
            const el = element as Record<string, unknown>
            return {
              slideNumber: index + 1,
              notes: typeof el?.notes === 'string' ? (el?.notes as string) : '',
              elements: Array.isArray(el?.children) ? (el?.children as unknown[]) : []
            }
          })
        }
      }
    }

    if (slides.length === 0) {
      return NextResponse.json(
        { error: 'Projeto não possui slides para narração' },
        { status: 400 }
      )
    }

    // 3. Configurar opções de narração
    const narrationOptions = {
      provider: options?.provider || 'azure',
      voice: options?.voice || 'pt-BR-FranciscaNeural',
      speed: options?.speed || 1.0,
      pitch: options?.pitch || 1.0,
      preferNotes: options?.preferNotes !== false // default true
    }

    console.log(`📊 Gerando narração para ${slides.length} slides...`)
    console.log('⚙️ Opções:', narrationOptions)

    // 4. Gerar narrações
    const autoNarrationService = new AutoNarrationService()
    const result = await autoNarrationService.generateNarrations(
      slides,
      projectId,
      narrationOptions
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erro ao gerar narração' },
        { status: 500 }
      )
    }

    // 5. Atualizar slidesData com as narrações
    if (project.slidesData) {
      const slidesDataUnknown = project.slidesData as unknown
      
      if (Array.isArray(slidesDataUnknown)) {
        const slidesData = slidesDataUnknown as Array<Record<string, unknown>>
        for (const narration of result.narrations) {
          const slideIndex = narration.slideNumber - 1
          if (slidesData[slideIndex]) {
            slidesData[slideIndex].voiceover = {
              audioUrl: narration.audioUrl,
              script: narration.script,
              provider: narration.provider,
              voice: narration.voice,
              duration: narration.duration
            }
          }
        }

        // Atualizar projeto com slidesData modificado
        await prisma.project.update({
          where: { id: projectId },
          data: {
            slidesData: slidesData,
            autoNarration: true,
            updatedAt: new Date()
          }
        })
      }
    } else {
      // Se não há slidesData, apenas marcar autoNarration como true
      await prisma.project.update({
        where: { id: projectId },
        data: {
          autoNarration: true,
          updatedAt: new Date()
        }
      })
    }

    console.log(`✅ Narração gerada com sucesso: ${result.narrations.length} slides`)

    return NextResponse.json({
      success: true,
      narrations: result.narrations,
      totalDuration: result.totalDuration,
      stats: {
        totalSlides: slides.length,
        narratedSlides: result.narrations.length,
        skippedSlides: slides.length - result.narrations.length,
        totalDurationSeconds: Math.round(result.totalDuration / 1000),
        averageDurationPerSlide: Math.round(result.totalDuration / result.narrations.length / 1000)
      }
    })

  } catch (error) {
    console.error('❌ [Auto-Narrate] Erro:', error)
    return NextResponse.json(
      { 
        error: 'Erro ao gerar narração',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

/**
 * GET: Verifica status da narração de um projeto
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId é obrigatório' },
        { status: 400 }
      )
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        name: true,
        autoNarration: true,
        slidesData: true,
        totalSlides: true
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Projeto não encontrado' },
        { status: 404 }
      )
    }

    let narratedSlides = 0
    let totalSlides = project.totalSlides || 0

    if (project.slidesData) {
      const slidesDataUnknown = project.slidesData as unknown
      if (Array.isArray(slidesDataUnknown)) {
        const slidesData = slidesDataUnknown as Array<Record<string, unknown>>
        totalSlides = slidesData.length
        narratedSlides = slidesData.filter((slide) => 
          Boolean((slide as Record<string, unknown>)?.voiceover && (slide as Record<string, unknown>).voiceover && (slide as Record<string, unknown>).voiceover as Record<string, unknown> && ((slide as Record<string, unknown>).voiceover as Record<string, unknown>).audioUrl)
        ).length
      }
    }

    return NextResponse.json({
      projectId: project.id,
      projectName: project.name,
      autoNarration: project.autoNarration,
      narratedSlides,
      totalSlides,
      progress: totalSlides > 0 ? (narratedSlides / totalSlides) * 100 : 0
    })

  } catch (error) {
    console.error('❌ [Auto-Narrate] Erro ao buscar status:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar status' },
      { status: 500 }
    )
  }
}
