/**
 * 🎨 API CANVAS EDITOR - Integrada ao Workflow Unificado
 * Editor de canvas para criação e edição de vídeos
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { workflowManager } from '@/lib/workflow/unified-workflow-manager'
import { z } from 'zod'

// Schemas de validação
const CanvasDataSchema = z.object({
  projectId: z.string(),
  canvas: z.object({
    width: z.number(),
    height: z.number(),
    background: z.string(),
    elements: z.array(z.object({
      id: z.string(),
      type: z.enum(['text', 'image', 'video', 'shape', 'avatar']),
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
      properties: z.record(z.unknown()),
      layer: z.number()
    }))
  }),
  timeline: z.array(z.object({
    id: z.string(),
    elementId: z.string(),
    startTime: z.number(),
    duration: z.number(),
    animations: z.array(z.record(z.unknown())).optional()
  }))
})

// Interface para elementos do canvas
interface CanvasElement {
  id: string
  type: 'text' | 'image' | 'video' | 'shape' | 'avatar'
  x: number
  y: number
  width: number
  height: number
  properties: Record<string, unknown>
  layer: number
}

interface TimelineItem {
  id: string
  elementId: string
  startTime: number
  duration: number
  animations?: Record<string, unknown>[]
}

interface CanvasData {
  width: number
  height: number
  background: string
  elements: CanvasElement[]
}

interface SaveCanvasResult {
  canvas: CanvasData
  timeline: TimelineItem[]
  totalDuration: number
}

interface VideoConfig {
  resolution: {
    width: number
    height: number
  }
  background: string
  scenes: Record<string, unknown>[]
  totalDuration: number
}

class CanvasEditor {
  async saveCanvasData(projectId: string, canvasData: CanvasData, timeline: TimelineItem[]): Promise<SaveCanvasResult> {
    try {
      // Validar elementos do canvas
      const validatedElements = canvasData.elements.map(element => {
        // Aplicar validações específicas por tipo
        switch (element.type) {
          case 'text':
            return {
              ...element,
              properties: {
                text: element.properties.text || '',
                fontSize: element.properties.fontSize || 16,
                fontFamily: element.properties.fontFamily || 'Arial',
                color: element.properties.color || '#000000',
                textAlign: element.properties.textAlign || 'left'
              }
            }
          case 'avatar':
            return {
              ...element,
              properties: {
                model: element.properties.model || 'default',
                animation: element.properties.animation || 'idle',
                voice: element.properties.voice || 'pt-BR-female',
                script: element.properties.script || ''
              }
            }
          default:
            return element
        }
      })

      // Calcular duração total do vídeo
      const totalDuration = Math.max(...timeline.map(item => item.startTime + item.duration), 0)

      // Salvar no banco
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      const currentMetadata = (project?.metadata as any) || {};

      await prisma.project.update({
        where: { id: projectId },
        data: {
          metadata: {
            ...currentMetadata,
            canvas: {
              ...canvasData,
              elements: validatedElements
            },
            timeline,
            totalDuration,
            editedAt: new Date().toISOString()
          }
        }
      })

      return {
        canvas: { ...canvasData, elements: validatedElements },
        timeline,
        totalDuration
      }

    } catch (error) {
      console.error('Error saving canvas data:', error)
      throw new Error('Failed to save canvas data')
    }
  }

  async generateVideoConfig(canvasData: CanvasData, timeline: TimelineItem[]): Promise<VideoConfig> {
    // Converter dados do canvas para configuração de vídeo
    const scenes = timeline.map(item => {
      const element = canvasData.elements.find(el => el.id === item.elementId)
      if (!element) return null

      return {
        id: item.id,
        type: element.type,
        startTime: item.startTime,
        duration: item.duration,
        position: { x: element.x, y: element.y },
        size: { width: element.width, height: element.height },
        properties: element.properties,
        animations: item.animations || []
      }
    }).filter(Boolean) as Record<string, unknown>[]

    return {
      resolution: {
        width: canvasData.width,
        height: canvasData.height
      },
      background: canvasData.background,
      scenes,
      totalDuration: Math.max(...timeline.map(item => item.startTime + item.duration), 0)
    }
  }

  async addElement(projectId: string, element: CanvasElement): Promise<CanvasElement> {
    try {
      const project = await prisma.project.findUnique({
        where: { id: projectId }
      })

      if (!project) {
        throw new Error('Project not found')
      }

      const currentCanvas = (project.metadata as any)?.canvas || { elements: [] }
      const updatedElements = [...currentCanvas.elements, element]

      await prisma.project.update({
        where: { id: projectId },
        data: {
          metadata: {
            ...(project.metadata as any || {}),
            canvas: {
              ...currentCanvas,
              elements: updatedElements
            }
          }
        }
      })

      return element

    } catch (error) {
      console.error('Error adding element:', error)
      throw new Error('Failed to add element')
    }
  }
}

const canvasEditor = new CanvasEditor()

// POST - Salvar dados do canvas
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = CanvasDataSchema.parse(body)

    // Verificar se o projeto existe e pertence ao usuário
    const project = await prisma.project.findFirst({
      where: {
        id: validatedData.projectId,
        userId: session.user.id
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Salvar dados do canvas
    const result = await canvasEditor.saveCanvasData(
      validatedData.projectId,
      validatedData.canvas,
      validatedData.timeline
    )

    // Gerar configuração de vídeo
    const videoConfig = await canvasEditor.generateVideoConfig(
      validatedData.canvas,
      validatedData.timeline
    )

    // Atualizar workflow
    await workflowManager.updateWorkflowStep(validatedData.projectId, 'edit', 'completed', {
      canvas: result.canvas,
      timeline: result.timeline,
      videoConfig
    })

    return NextResponse.json({
      success: true,
      result,
      videoConfig,
      message: 'Canvas data saved successfully'
    })

  } catch (error) {
    console.error('Canvas Editor API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Adicionar elemento ao canvas
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { projectId, element } = body

    if (!projectId || !element) {
      return NextResponse.json({ error: 'Project ID and element required' }, { status: 400 })
    }

    // Verificar se o projeto existe e pertence ao usuário
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Adicionar elemento
    const addedElement = await canvasEditor.addElement(projectId, element)

    return NextResponse.json({
      success: true,
      element: addedElement,
      message: 'Element added successfully'
    })

  } catch (error) {
    console.error('Canvas Editor PUT Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - Obter dados do canvas
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

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json({
      canvas: (project.metadata as any)?.canvas || null,
      timeline: (project.metadata as any)?.timeline || [],
      totalDuration: (project.metadata as any)?.totalDuration || 0
    })

  } catch (error) {
    console.error('Canvas Editor GET Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
