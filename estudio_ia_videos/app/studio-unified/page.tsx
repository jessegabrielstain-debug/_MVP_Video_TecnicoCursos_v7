/**
 * 🎬 UNIFIED STUDIO
 * Interface unificada para criação de vídeos com IA
 */

'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { 
  FileText, 
  Edit3, 
  User, 
  Mic, 
  Film, 
  Download,
  Save,
  Play,
  Settings,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertCircle,
  Zap,
  Layers,
  RotateCcw,
  Eye,
  Share2
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

// Store imports
import { useUnifiedProjectStore } from '@/lib/stores/unified-project-store'
import { useWebSocketStore } from '@/lib/stores/websocket-store'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

// Module imports
import PPTXImportModule from '@/components/studio/pptx-import-module'
import ContentEditorModule from '@/components/studio/content-editor-module'
import Avatar3DModule from '@/components/studio/avatar-3d-module'
import TTSModule from '@/components/studio/tts-module'
import RenderModule from '@/components/studio/render-module'
import ExportModule from '@/components/studio/export-module'

type WorkflowStep = 'import' | 'edit' | 'avatar' | 'tts' | 'render' | 'export'

interface StepConfig {
  id: WorkflowStep
  name: string
  description: string
  icon: React.ReactNode
  status: 'pending' | 'active' | 'completed' | 'error'
  required: boolean
}

export default function UnifiedStudioPage() {
  const supabase = useMemo(() => createClient(), [])
  const [user, setUser] = useState<User | null>(null)
  
  // Store hooks
  const {
    currentProject,
    isLoading,
    createProject,
    updateProject,
    executeWorkflowStep,
    saveProject
  } = useUnifiedProjectStore()
  
  const {
    isConnected,
    renderProgress,
    notifications,
    connect,
    disconnect
  } = useWebSocketStore()

  // Local state
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('import')
  const [isExecutingStep, setIsExecutingStep] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [autoSave, setAutoSave] = useState(true)

  // Workflow steps configuration
  const [steps, setSteps] = useState<StepConfig[]>([
    {
      id: 'import',
      name: 'Importar',
      description: 'Importar PPTX ou criar slides',
      icon: <FileText className="w-5 h-5" />,
      status: 'active',
      required: true
    },
    {
      id: 'edit',
      name: 'Editar',
      description: 'Editar conteúdo dos slides',
      icon: <Edit3 className="w-5 h-5" />,
      status: 'pending',
      required: true
    },
    {
      id: 'avatar',
      name: 'Avatar',
      description: 'Configurar avatar 3D',
      icon: <User className="w-5 h-5" />,
      status: 'pending',
      required: false
    },
    {
      id: 'tts',
      name: 'TTS',
      description: 'Gerar áudio com IA',
      icon: <Mic className="w-5 h-5" />,
      status: 'pending',
      required: true
    },
    {
      id: 'render',
      name: 'Render',
      description: 'Renderizar vídeo final',
      icon: <Film className="w-5 h-5" />,
      status: 'pending',
      required: true
    },
    {
      id: 'export',
      name: 'Export',
      description: 'Exportar e compartilhar',
      icon: <Download className="w-5 h-5" />,
      status: 'pending',
      required: true
    }
  ])

  // Initialize WebSocket connection
  useEffect(() => {
    if (!isConnected) {
      connect()
    }
    
    return () => {
      if (isConnected) {
        disconnect()
      }
    }
  }, [isConnected, connect, disconnect])

  useEffect(() => {
    let isMounted = true

    const loadUser = async () => {
      try {
        const { data } = await supabase.auth.getUser()
        if (!isMounted) return
        setUser(data.user ?? null)
      } catch (error) {
        console.error('Erro ao verificar sessão:', error)
      }
    }

    void loadUser()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return
      setUser(session?.user ?? null)
    })

    return () => {
      isMounted = false
      listener?.subscription.unsubscribe()
    }
  }, [supabase])

  useEffect(() => {
    if (user && !isConnected) {
      connect()
    }
    
    return () => {
      if (isConnected) {
        disconnect()
      }
    }
  }, [user, isConnected, connect, disconnect])

  // Auto-save functionality
  useEffect(() => {
    if (autoSave && currentProject && currentProject.id) {
      const saveInterval = setInterval(() => {
        saveProject()
      }, 30000) // Auto-save every 30 seconds

      return () => clearInterval(saveInterval)
    }
  }, [autoSave, currentProject, saveProject])

  // Handle project creation
  const handleCreateProject = async (name: string, description?: string) => {
    try {
      await createProject({
        name,
        description: description || `Projeto criado em ${new Date().toLocaleDateString()}`,
        slides: [],
        settings: {
          autoSave: true,
          quality: 'standard',
          language: 'pt-BR'
        }
      })
      
      setProjectName(name)
      updateStepStatus('import', 'completed')
      setCurrentStep('edit')
      
      toast.success('Projeto criado com sucesso!')
    } catch (error: any) {
      toast.error('Erro ao criar projeto: ' + error.message)
    }
  }

  // Handle step execution
  const handleExecuteStep = async (stepData: any) => {
    if (!currentProject) {
      toast.error('Nenhum projeto ativo')
      return
    }

    setIsExecutingStep(true)

    try {
      await executeWorkflowStep(currentStep, stepData)
      
      // Update step status
      updateStepStatus(currentStep, 'completed')
      
      // Move to next step
      const nextStep = getNextStep(currentStep)
      if (nextStep) {
        setCurrentStep(nextStep)
        updateStepStatus(nextStep, 'active')
      }
      
      toast.success(`Etapa ${currentStep} concluída!`)
      
    } catch (error: any) {
      console.error('Step execution error:', error)
      updateStepStatus(currentStep, 'error')
      toast.error('Erro na execução: ' + error.message)
    } finally {
      setIsExecutingStep(false)
    }
  }

  // Update step status
  const updateStepStatus = (stepId: WorkflowStep, status: StepConfig['status']) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status } : step
    ))
  }

  // Get next step
  const getNextStep = (current: WorkflowStep): WorkflowStep | null => {
    const stepOrder: WorkflowStep[] = ['import', 'edit', 'avatar', 'tts', 'render', 'export']
    const currentIndex = stepOrder.indexOf(current)
    return currentIndex < stepOrder.length - 1 ? stepOrder[currentIndex + 1] : null
  }

  // Get previous step
  const getPreviousStep = (current: WorkflowStep): WorkflowStep | null => {
    const stepOrder: WorkflowStep[] = ['import', 'edit', 'avatar', 'tts', 'render', 'export']
    const currentIndex = stepOrder.indexOf(current)
    return currentIndex > 0 ? stepOrder[currentIndex - 1] : null
  }

  // Navigate to step
  const navigateToStep = (stepId: WorkflowStep) => {
    const step = steps.find(s => s.id === stepId)
    if (step && (step.status === 'completed' || step.status === 'active')) {
      setCurrentStep(stepId)
      updateStepStatus(stepId, 'active')
    }
  }

  // Handle manual save
  const handleSaveProject = async () => {
    try {
      await saveProject()
      toast.success('Projeto salvo!')
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message)
    }
  }

  // Render step navigation
  const renderStepNavigation = () => (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Layers className="w-5 h-5" />
            <span>Fluxo de Trabalho</span>
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            {currentProject && (
              <Badge variant="outline" className="text-xs">
                {currentProject.name}
              </Badge>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveProject}
              disabled={!currentProject || isLoading}
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center space-x-2 p-3 rounded-lg cursor-pointer transition-all ${
                  step.status === 'active' 
                    ? 'bg-blue-100 border-2 border-blue-500' 
                    : step.status === 'completed'
                    ? 'bg-green-100 border-2 border-green-500'
                    : step.status === 'error'
                    ? 'bg-red-100 border-2 border-red-500'
                    : 'bg-gray-100 border-2 border-gray-300'
                }`}
                onClick={() => navigateToStep(step.id)}
              >
                <div className={`p-2 rounded-full ${
                  step.status === 'active' ? 'bg-blue-500 text-white' :
                  step.status === 'completed' ? 'bg-green-500 text-white' :
                  step.status === 'error' ? 'bg-red-500 text-white' :
                  'bg-gray-400 text-white'
                }`}>
                  {step.status === 'completed' ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : step.status === 'error' ? (
                    <AlertCircle className="w-4 h-4" />
                  ) : (
                    step.icon
                  )}
                </div>
                
                <div className="text-left">
                  <p className="font-medium text-sm">{step.name}</p>
                  <p className="text-xs text-gray-600">{step.description}</p>
                </div>
              </div>
              
              {index < steps.length - 1 && (
                <ArrowRight className="w-4 h-4 text-gray-400 mx-2" />
              )}
            </div>
          ))}
        </div>
        
        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progresso do Projeto</span>
            <span>{Math.round((steps.filter(s => s.status === 'completed').length / steps.length) * 100)}%</span>
          </div>
          <Progress 
            value={(steps.filter(s => s.status === 'completed').length / steps.length) * 100} 
            className="w-full"
          />
        </div>
      </CardContent>
    </Card>
  )

  // Render current step content
  const renderStepContent = () => {
    if (!currentProject && currentStep !== 'import') {
      return (
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum projeto ativo
            </h3>
            <p className="text-gray-600 mb-4">
              Crie um novo projeto ou importe um PPTX para começar.
            </p>
            <Button onClick={() => setCurrentStep('import')}>
              <FileText className="w-4 h-4 mr-2" />
              Criar Projeto
            </Button>
          </CardContent>
        </Card>
      )
    }

    switch (currentStep) {
      case 'import':
        return (
          <PPTXImportModule
            onProjectCreate={handleCreateProject}
            onProjectUpdate={(project) => updateProject(project)}
          />
        )

      case 'edit':
        return currentProject ? (
          <ContentEditorModule
            project={currentProject}
            onProjectUpdate={(project) => updateProject(project)}
            onExecuteStep={handleExecuteStep}
          />
        ) : null

      case 'avatar':
        return currentProject ? (
          <Avatar3DModule
            project={currentProject}
            onAvatarUpdate={(avatar) => updateProject({ ...currentProject, avatar3D: avatar })}
            onExecuteStep={handleExecuteStep}
          />
        ) : null

      case 'tts':
        return currentProject ? (
          <TTSModule
            project={currentProject}
            onTTSUpdate={(tts) => updateProject({ ...currentProject, tts })}
            onExecuteStep={handleExecuteStep}
          />
        ) : null

      case 'render':
        return currentProject ? (
          <RenderModule
            project={currentProject}
            onRenderUpdate={(render) => updateProject({ ...currentProject, render })}
            onExecuteStep={handleExecuteStep}
          />
        ) : null

      case 'export':
        return currentProject ? (
          <ExportModule
            project={currentProject}
            onComplete={() => {
              updateStepStatus('export', 'completed')
              toast.success('Projeto finalizado com sucesso!')
            }}
          />
        ) : null

      default:
        return null
    }
  }

  // Render navigation buttons
  const renderNavigationButtons = () => {
    const previousStep = getPreviousStep(currentStep)
    const nextStep = getNextStep(currentStep)
    const currentStepConfig = steps.find(s => s.id === currentStep)

    return (
      <div className="flex justify-between items-center mt-6">
        <Button
          variant="outline"
          onClick={() => previousStep && navigateToStep(previousStep)}
          disabled={!previousStep}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Anterior
        </Button>

        <div className="flex items-center space-x-2">
          {isExecutingStep && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <RotateCcw className="w-4 h-4 animate-spin" />
              <span>Processando...</span>
            </div>
          )}
        </div>

        <Button
          onClick={() => nextStep && navigateToStep(nextStep)}
          disabled={!nextStep || currentStepConfig?.status !== 'completed'}
        >
          Próximo
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    )
  }

  // Render real-time status
  const renderRealTimeStatus = () => {
    if (!isConnected) return null

    return (
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-gray-600">Conectado em tempo real</span>
            </div>
            
            {renderProgress && renderProgress.progress > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Renderizando:</span>
                <Progress value={renderProgress.progress} className="w-24" />
                <span className="text-sm font-medium">{renderProgress.progress}%</span>
              </div>
            )}
            
            {notifications.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {notifications.length} notificações
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Acesso Restrito
            </h3>
            <p className="text-gray-600">
              Faça login para acessar o Studio Unificado.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Studio Unificado
          </h1>
          <p className="text-gray-600">
            Crie vídeos profissionais com IA em um fluxo integrado
          </p>
        </div>

        {/* Real-time Status */}
        {renderRealTimeStatus()}

        {/* Step Navigation */}
        {renderStepNavigation()}

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        {currentProject && renderNavigationButtons()}
      </div>
    </div>
  )
}