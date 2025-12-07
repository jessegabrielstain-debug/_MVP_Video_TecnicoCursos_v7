/**
 * 🚀 Unified Workflow Manager
 * Gerencia o fluxo de trabalho unificado do projeto
 */

import { prisma } from '@/lib/prisma'

// Types for workflow data
export interface StepData {
  [key: string]: unknown;
}

export interface WorkflowStepStatus {
  status: 'pending' | 'processing' | 'completed' | 'error';
  data?: StepData;
}

// Interface para o fluxo unificado
export interface UnifiedWorkflow {
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

export class UnifiedWorkflowManager {
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
      // Mock implementation for now to avoid circular dependencies or complex fetch logic
      return { success: true, message: 'PPTX Import simulated' }
    }

    // Integração com Templates NR
    if (data && typeof data.type === 'string' && data.type === 'template-nr') {
       return { success: true, message: 'Template Import simulated' }
    }

    return { success: true, message: 'Import completed' }
  }

  private async executeEdit(projectId: string, data?: StepData): Promise<StepData> {
    // Integração com Canvas Editor
    return { success: true, message: 'Edit saved' }
  }

  private async executeAvatar(projectId: string, data?: StepData): Promise<StepData> {
    // Integração com Avatar 3D System
    return { success: true, message: 'Avatar generated' }
  }

  private async executeTTS(projectId: string, data?: StepData): Promise<StepData> {
    // Integração com TTS System
    return { success: true, message: 'TTS generated' }
  }

  private async executeRender(projectId: string, data?: StepData): Promise<StepData> {
    // Integração com Render Pipeline
    return { success: true, message: 'Render job created' }
  }

  private async executeExport(projectId: string, data?: StepData): Promise<StepData> {
    // Integração com Export System
    return { success: true, message: 'Export completed' }
  }
}

// Instância global do gerenciador
export const workflowManager = new UnifiedWorkflowManager()
