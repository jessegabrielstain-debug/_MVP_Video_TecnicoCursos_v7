
/**
 * POST /api/compliance/check
 * Verifica conformidade de um projeto com uma NR específica
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth/auth-config'
import { prisma } from '@/lib/db'
import type { Prisma } from '@prisma/client'
import { checkCompliance } from '@/lib/compliance/nr-engine'
import { type NRCode } from '@/lib/compliance/templates'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { projectId, nr } = await req.json()

    if (!projectId || !nr) {
      return NextResponse.json(
        { error: 'projectId e nr são obrigatórios' },
        { status: 400 }
      )
    }

    // Busca projeto
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        slides: {
          orderBy: { slideNumber: 'asc' }
        }
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 })
    }

    // Verifica permissão
    if (project.userId !== session.user.id) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    // Prepara conteúdo para análise
    const projectContent = {
      slides: project.slides.map((slide) => ({
        number: slide.slideNumber,
        title: slide.title,
        content: slide.content,
        duration: slide.duration || 5,
        imageUrls: slide.imageUrls || [],
        audioPath: slide.audioPath || null
      })),
      totalDuration: project.duration || 0,
      imageUrls: project.slides.flatMap((slide) => slide.imageUrls || []),
      audioFiles: project.slides.map((slide) => slide.audioPath).filter(Boolean)
    }

    // Executa análise de conformidade com IA
    const result = await checkCompliance(nr as NRCode, projectContent, true)

    // Salva resultado no banco
    const complianceRecord = await prisma.nRComplianceRecord.create({
      data: {
        projectId,
        nr: result.nr,
        nrName: result.nrName,
        status: result.status,
        score: result.score,
        finalScore: result.finalScore || result.score,
        requirementsMet: result.requirementsMet,
        requirementsTotal: result.requirementsTotal,
        validatedAt: new Date(),
        validatedBy: 'AI',
        recommendations: result.recommendations as unknown as Prisma.JsonValue,
        criticalPoints: result.criticalPoints as unknown as Prisma.JsonValue,
        aiAnalysis: result.aiAnalysis as unknown as Prisma.JsonValue,
        aiScore: result.aiScore,
        confidence: result.confidence
      }
    })

    return NextResponse.json({
      success: true,
      recordId: complianceRecord.id,
      result
    })

  } catch (error: unknown) {
    console.error('[COMPLIANCE_CHECK_ERROR]', error)
    return NextResponse.json(
      { error: 'Erro ao verificar conformidade' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId é obrigatório' },
        { status: 400 }
      )
    }

    // Busca registros de conformidade
    const records = await prisma.nRComplianceRecord.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ records })

  } catch (error: unknown) {
    console.error('[COMPLIANCE_GET_ERROR]', error)
    return NextResponse.json(
      { error: 'Erro ao buscar registros de conformidade' },
      { status: 500 }
    )
  }
}
