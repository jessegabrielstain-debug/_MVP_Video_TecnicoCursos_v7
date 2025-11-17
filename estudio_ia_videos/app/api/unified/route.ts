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

// Types for workflow data
interface StepData {
  [key: string]: unknown;
}

interface WorkflowStepStatus {
  status: 'pending' | 'processing' | 'completed' | 'error';
  data?: StepData;
}

// Interface para o fluxo unificado
interface UnifiedWorkflow {
  projectId: string
  currentStep: 'import' | 'edit' | 'avatar' | 'tts' | 'render' | 'export' | 'complete'
  steps: {
    import: WorkflowStepStatus
    edit: WorkflowStepStatus
    avatar: WorkflowStepStatus
    tts: WorkflowStepStatus
    render: WorkflowStepStatus
    export: WorkflowStepStatus
  }
  metadata: {
    createdAt: Date
    updatedAt: Date
    userId: string
    totalDuration?: number
    outputUrl?: string
  }
}

class UnifiedWorkflowManager {
  private workflows: Map<string, UnifiedWorkflow> = new Map()

  async createWorkflow(projectId: string, userId: string): Promise<UnifiedWorkflow> {
    const workflow: UnifiedWorkflow = {
      projectId,
      currentStep: 'import',
      steps: {
        import: { status: 'pending' },
        edit: { status: 'pending' },
        avatar: { status: 'pending' },
        tts: { status: 'pending' },
        render: { status: 'pending' },
        export: { status: 'pending' }
      },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        userId
      }
    }

    this.workflows.set(projectId, workflow)
    return workflow
  }

  async updateWorkflowStep(
    projectId: string,
    step: keyof UnifiedWorkflow['steps'],
    status: 'pending' | 'processing' | 'completed' | 'error',
    data?: StepData
  ): Promise<UnifiedWorkflow | null> {
    const workflow = this.workflows.get(projectId)
    if (!workflow) return null

    workflow.steps[step] = { status, data }
    workflow.metadata.updatedAt = new Date()

    // Auto-advance to next step if completed
    if (status === 'completed') {
      const stepOrder: (keyof UnifiedWorkflow['steps'])[] = ['import', 'edit', 'avatar', 'tts', 'render', 'export']
      const currentIndex = stepOrder.indexOf(step)
      if (currentIndex < stepOrder.length - 1) {
        workflow.currentStep = stepOrder[currentIndex + 1]
      } else {
        workflow.currentStep = 'complete'
      }
    }

    this.workflows.set(projectId, workflow)
    return workflow
  }

  getWorkflow(projectId: string): UnifiedWorkflow | null {
    return this.workflows.get(projectId) || null
  }

  async executeStep(projectId: string, step: keyof UnifiedWorkflow['steps'], data?: StepData): Promise<StepData> {
    const workflow = this.workflows.get(projectId)
    if (!workflow) throw new Error('Workflow not found')

    await this.updateWorkflowStep(projectId, step, 'processing')

    try {
      let result: StepData

      switch (step) {
        case 'import':
          result = await this.executeImport(projectId, data)
          break
        case 'edit':
          result = await this.executeEdit(projectId, data)
          break
        case 'avatar':
          result = await this.executeAvatar(projectId, data)
          break
        case 'tts':
          result = await this.executeTTS(projectId, data)
          break
        case 'render':
          result = await this.executeRender(projectId, data)
          break
        case 'export':
          result = await this.executeExport(projectId, data)
          break
        default:
          throw new Error(`Unknown step: ${step}`)
      }

      await this.updateWorkflowStep(projectId, step, 'completed', result)
      return result

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.updateWorkflowStep(projectId, step, 'error', { error: errorMessage })
      throw error
    }
  }

  private async executeImport(projectId: string, data?: StepData): Promise<StepData> {
    // Integração com PPTX Studio
    if (data && typeof data.type === 'string' && data.type === 'pptx') {
      const response = await fetch('/api/pptx/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, file: data.file })
      })
      return await response.json()
    }

    // Integração com Templates NR
    if (data && typeof data.type === 'string' && data.type === 'template-nr') {
      const response = await fetch('/api/templates/nr/load', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, template: data.template })
      })
      return await response.json()
    }

    return { success: true, message: 'Import completed' }
  }

  private async executeEdit(projectId: string, data?: StepData): Promise<StepData> {
    // Integração com Canvas Editor
    const response = await fetch('/api/editor/canvas/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, editorData: data })
    })
    return await response.json()
  }

  private async executeAvatar(projectId: string, data?: StepData): Promise<StepData> {
    // Integração com Avatar 3D System
    const response = await fetch('/api/avatars/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        avatarConfig: (data && typeof data.avatar === 'object') ? data.avatar : { model: 'default' },
        script: (data && typeof data.script === 'string') ? data.script : 'Texto padrão'
      })
    })
    return await response.json()
  }

  private async executeTTS(projectId: string, data?: StepData): Promise<StepData> {
    // Integração com TTS System
    const response = await fetch('/api/tts/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        text: (data && typeof data.text === 'string') ? data.text : 'Texto padrão',
        voice: (data && typeof data.voice === 'string') ? data.voice : 'pt-BR-female-1',
        language: (data && typeof data.language === 'string') ? data.language : 'pt-BR'
      })
    })
    return await response.json()
  }

  private async executeRender(projectId: string, data?: StepData): Promise<StepData> {
    // Integração com Render Pipeline
    const response = await fetch('/api/render/video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        renderConfig: data || {
          resolution: { width: 1920, height: 1080 },
          fps: 30,
          quality: 'high',
          format: 'mp4',
          codec: 'h264'
        }
      })
    })
    return await response.json()
  }

  private async executeExport(projectId: string, data?: StepData): Promise<StepData> {
    // Integração com Export System
    const response = await fetch('/api/export/mp4', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        exportConfig: data || {
          format: 'mp4',
          quality: '1080p',
          compression: 'medium',
          includeSubtitles: false
        }
      })
    })
    return await response.json()
  }
}

// Instância global do gerenciador
const workflowManager = new UnifiedWorkflowManager()

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
        name: validatedData.name,
        type: validatedData.type,
        status: 'DRAFT',
        userId: session.user.id,
        description: '',
        organizationId: '',
        originalFileName: '',
        fileSize: 0,
        filePath: '',
        thumbnailUrl: '',
        duration: 0,
        views: 0,
        likes: 0,
        shares: 0,
        comments: 0,
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
      }
    })

    // Criar workflow unificado
    const workflow = await workflowManager.createWorkflow(project.id, session.user.id)

    // Auto-iniciar importação se houver dados
    if (validatedData.source.data) {
      await workflowManager.executeStep(project.id, 'import', validatedData.source.data)
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
        result = await workflowManager.executeStep(validatedData.id, 'edit', validatedData.data)
        break
      case 'render':
        // Executar sequência: avatar -> tts -> render
        const renderData = validatedData.data as StepData | undefined;
        await workflowManager.executeStep(validatedData.id, 'avatar', renderData?.avatar as StepData | undefined)
        await workflowManager.executeStep(validatedData.id, 'tts', renderData?.tts as StepData | undefined)
        result = await workflowManager.executeStep(validatedData.id, 'render', renderData?.render as StepData | undefined)
        break
      case 'export':
        result = await workflowManager.executeStep(validatedData.id, 'export', validatedData.data)
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

export { workflowManager }