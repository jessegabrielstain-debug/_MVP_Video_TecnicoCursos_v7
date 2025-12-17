// TODO: Fix GeneratorSlide type and buffer property

/**
 * 🎨 API de Geração PPTX Real - Sistema Completo
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateRealPptxFromProject, RealPptxGenerator, PptxGenerationOptions, GeneratorSlide } from '@/lib/pptx-real-generator'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, template, customOptions } = body

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID é obrigatório' },
        { status: 400 }
      )
    }

    logger.info(`🎨 Iniciando geração PPTX real para projeto: ${projectId}`, { component: 'API: v1/pptx/generate-real' })

    // Gerar PPTX real usando o sistema completo
    const result = await generateRealPptxFromProject(projectId, {
      template: template || 'corporate',
      ...customOptions
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erro na geração PPTX' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      pptxUrl: result.pptxUrl,
      metadata: result.metadata,
      message: 'PPTX real gerado com sucesso!'
    })

  } catch (error) {
    logger.error('❌ Erro na API de geração PPTX:', error instanceof Error ? error : new Error(String(error)), { component: 'API: v1/pptx/generate-real' })
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar status do projeto
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        title: true,
        pptxUrl: true,
        status: true,
        metadata: true
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Projeto não encontrado' },
        { status: 404 }
      )
    }

  const projectMetadata = project.metadata as Record<string, unknown> | null

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        name: project.title,
        hasPptx: !!project.pptxUrl,
        pptxUrl: project.pptxUrl,
        status: project.status,
        pptxGenerated: projectMetadata?.pptxGenerated || false,
        generatedAt: projectMetadata?.generatedAt
      }
    })

  } catch (error) {
    logger.error('❌ Erro ao verificar status PPTX:', error instanceof Error ? error : new Error(String(error)), { component: 'API: v1/pptx/generate-real' })
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * Endpoint para geração customizada de PPTX
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { slides, options } = body as { 
      slides: Record<string, unknown>[], 
      options: PptxGenerationOptions 
    }

    if (!slides || slides.length === 0) {
      return NextResponse.json(
        { error: 'Slides são obrigatórios' },
        { status: 400 }
      )
    }

    logger.info(`🎨 Gerando PPTX customizado com ${slides.length} slides`, { component: 'API: v1/pptx/generate-real' })

    // Convert slides to GeneratorSlide format
    const generatorSlides: GeneratorSlide[] = slides.map((slide) => ({
      title: String(slide.title || ''),
      content: String(slide.content || ''),
      layout: (slide.layout as 'title' | 'content' | 'blank') || undefined,
      notes: slide.notes ? String(slide.notes) : undefined
    }))

    const generator = new RealPptxGenerator()
    const result = await generator.generateRealPptx({
      title: options.title || 'Apresentação Customizada',
      slides: generatorSlides,
      template: options.template || 'corporate',
      branding: options.branding,
      metadata: options.metadata || {
        author: 'Estúdio IA de Vídeos',
        subject: options.title || 'Apresentação Customizada'
      }
    })

    // Upload manual (já feito internamente na função)
    return NextResponse.json({
      success: true,
      filename: result.filename,
      slideCount: result.slideCount,
      fileSize: result.buffer?.length || 0,
      message: 'PPTX customizado gerado com sucesso!'
    })

  } catch (error) {
    logger.error('❌ Erro na geração PPTX customizada:', error instanceof Error ? error : new Error(String(error)), { component: 'API: v1/pptx/generate-real' })
    return NextResponse.json(
      { 
        error: 'Erro na geração customizada',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

