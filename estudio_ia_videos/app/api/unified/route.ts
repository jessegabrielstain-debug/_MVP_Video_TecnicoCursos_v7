// TODO: Fix Prisma types
/**
 * 🚀 API GATEWAY UNIFICADO - Estúdio IA de Vídeos
 * Coordena todos os módulos em um fluxo único e contínuo
 *
 * Módulos Integrados:
 * - PPTX Studio (Importação e processamento)
 * - Editor de Vídeo (Canvas e timeline)
 * - Avatar 3D (Geração de avatares)
 * - TTS (Text-to-Speech)
 * - Render (Pipeline de renderização)
 * - Export (Exportação MP4)
 * - Dashboard (Interface unificada)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { workflowManager, StepData } from '@/lib/workflow/unified-workflow-manager'

// Schemas de validação
const ProjectCreateSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['pptx', 'template-nr', 'talking-photo', 'custom']),
  source: z.object({
    type: z.enum(['upload', 'template', 'blank']),
    data: z.unknown().optional()
  })
})

const ProjectUpdateSchema = z.object({
  id: z.string(),
  action: z.enum(['edit', 'render', 'export', 'delete']),
  data: z.unknown().optional()
})

// GET - Obter status do workflow
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 })
    }

    const workflow = workflowManager.getWorkflow(projectId)
    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    return NextResponse.json({ workflow })

  } catch (error) {
    console.error('Unified API GET Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Criar novo projeto e workflow
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = ProjectCreateSchema.parse(body)

    // Criar projeto no banco
    const project = await prisma.project.create({
      data: {
        title: validatedData.name,
        metadata: {
            type: validatedData.type,
            fileSize: 0,
            views: 0,
            likes: 0,
            shares: 0,
            downloads: 0,
            isPublic: false,
            isTemplate: false,
            templateCategory: '',
            tags: [],
            customFields: {},
            version: '1.0',
            lastEditedBy: session.user.id,
            collaborators: [],
            permissions: {},
            exportFormats: [],
            renderSettings: {},
            aiSettings: {},
            complianceData: {},
            analyticsData: {}
        },
        status: 'DRAFT',
        userId: session.user.id,
        description: '',
        originalFileName: '',
        thumbnailUrl: '',
        duration: 0,
      }
    })

    // Criar workflow unificado
    const workflow = await workflowManager.createWorkflow(project.id, session.user.id)

    // Auto-iniciar importação se houver dados
    if (validatedData.source.data) {
      await workflowManager.executeStep(project.id, 'import', validatedData.source.data as StepData)
    }

    return NextResponse.json({ 
      project, 
      workflow,
      message: 'Project created and workflow initialized'
    })

  } catch (error) {
    console.error('Unified API POST Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Atualizar projeto e avançar workflow
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = ProjectUpdateSchema.parse(body)

    const project = await prisma.project.findFirst({
      where: {
        id: validatedData.id,
        userId: session.user.id
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    let result: StepData | undefined

    switch (validatedData.action) {
      case 'edit':
        result = await workflowManager.executeStep(validatedData.id, 'edit', validatedData.data as StepData)
        break
      case 'render':
        // Executar sequência: avatar -> tts -> render
        const renderData = validatedData.data as StepData | undefined;
        await workflowManager.executeStep(validatedData.id, 'avatar', (renderData?.avatar as StepData) || undefined)
        await workflowManager.executeStep(validatedData.id, 'tts', (renderData?.tts as StepData) || undefined)
        result = await workflowManager.executeStep(validatedData.id, 'render', (renderData?.render as StepData) || undefined)
        break
      case 'export':
        result = await workflowManager.executeStep(validatedData.id, 'export', validatedData.data as StepData)
        break
      case 'delete':
        await prisma.project.delete({ where: { id: validatedData.id } })
        return NextResponse.json({ message: 'Project deleted' })
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const workflow = workflowManager.getWorkflow(validatedData.id)

    return NextResponse.json({ 
      result, 
      workflow,
      message: `Action ${validatedData.action} completed`
    })

  } catch (error) {
    console.error('Unified API PUT Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Remover projeto e workflow
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 })
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Remover do banco
    await prisma.project.delete({ where: { id: projectId } })

    return NextResponse.json({ message: 'Project and workflow deleted' })

  } catch (error) {
    console.error('Unified API DELETE Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

