

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { Alert, AlertDescription } from '../ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Label } from '../ui/label'
import { SlideEditor } from './slide-editor'
import PPTXImportWizard from './pptx-import-wizard'
import { 
  FileText, 
  Play, 
  Download, 
  Settings, 
  BarChart3,
  Clock,
  Volume2,
  User,
  Layers,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  RefreshCw
} from 'lucide-react'
import { useToast } from '../ui/use-toast'
import { Logger } from '@/lib/logger'

const logger = new Logger('PPTXProjectManager')

/** Slide processado do PPTX */
interface PPTXSlide {
  slideNumber: number;
  title?: string;
  content?: string;
  notes?: string;
  background?: string;
  elements?: unknown[];
}

/** Configuração de narração */
interface NarrationConfig {
  slideNumber: number;
  text: string;
  duration?: number;
}

/** Configuração de voz TTS */
interface VoiceConfig {
  voiceId?: string;
  provider?: string;
  speed?: number;
  pitch?: number;
}

/** Configuração de avatar */
interface AvatarConfig {
  avatarId?: string;
  provider?: string;
  position?: string;
}

/** Metadados do projeto */
interface ProjectMetadata {
  createdAt?: Date;
  updatedAt?: Date;
  version?: string;
  source?: string;
}

interface PPTXProjectData {
  title: string
  description: string
  slides: PPTXSlide[]
  narration: NarrationConfig[]
  voiceConfig: VoiceConfig
  avatarConfig: AvatarConfig
  metadata: ProjectMetadata
}

interface PPTXProjectManagerProps {
  onProjectReady: (projectData: PPTXProjectData) => void
  onBack: () => void
}

export function PPTXProjectManager({ onProjectReady, onBack }: PPTXProjectManagerProps) {
  const [currentView, setCurrentView] = useState<'wizard' | 'editor'>('wizard')
  const [projectData, setProjectData] = useState<PPTXProjectData | null>(null)
  const [availableTemplates, setAvailableTemplates] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const { toast } = useToast()

  // Load available templates
  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/pptx/templates')
      if (!response.ok) throw new Error('Failed to load templates')
      
      const data = await response.json()
      setAvailableTemplates(data.templates || [])
    } catch (error) {
      logger.error('Error loading templates', error instanceof Error ? error : undefined)
      toast({
        title: "Erro ao carregar templates",
        description: "Falha ao carregar templates disponíveis",
        variant: "destructive"
      })
    }
  }

  // Handle wizard completion
  const handleWizardComplete = (data: PPTXProjectData) => {
    setProjectData(data)
    setCurrentView('editor')
    
    toast({
      title: "Projeto PPTX criado!",
      description: `${data.slides.length} slides prontos para edição`,
    })
  }

  // Handle slide updates
  const handleSlideUpdate = (slideId: string, updates: Partial<PPTXSlide>) => {
    if (!projectData) return

    setProjectData(prev => ({
      ...prev!,
      slides: prev!.slides.map(slide => 
        slide.slideNumber.toString() === slideId ? { ...slide, ...updates } : slide
      )
    }))
  }

  // Handle template changes
  const handleTemplateChange = (slideId: string, templateId: string) => {
    // Implementation would update the scene mapping for the slide
    toast({
      title: "Template atualizado",
      description: `Slide ${slideId} agora usa ${templateId}`,
    })
  }

  // Handle slide preview
  const handleSlidePreview = async (slideId: string) => {
    try {
      const slide = projectData?.slides.find(s => s.slideNumber.toString() === slideId)
      if (!slide) return

      // Implementation would generate a preview of the slide
      toast({
        title: "Preview gerado",
        description: `Preview do slide ${slideId} em preparação`,
      })
    } catch (error) {
      toast({
        title: "Erro no preview",
        description: "Falha ao gerar preview do slide",
        variant: "destructive"
      })
    }
  }

  // Generate final video project
  const handleGenerateProject = async () => {
    if (!projectData) return

    setIsGenerating(true)
    setGenerationProgress(0)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 500)

      // In production, this would integrate with the render pipeline
      await new Promise(resolve => setTimeout(resolve, 5000))
      
      setGenerationProgress(100)
      clearInterval(progressInterval)
      
      // Complete project creation
      onProjectReady(projectData)
      
      toast({
        title: "Projeto criado com sucesso!",
        description: "Vídeo está sendo processado no pipeline de render",
      })

    } catch (error) {
      toast({
        title: "Erro na geração",
        description: "Falha ao criar projeto de vídeo",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // Show wizard if no project data
  if (currentView === 'wizard') {
    return (
      <PPTXImportWizard
        onComplete={handleWizardComplete}
        onCancel={onBack}
      />
    )
  }

  // Show editor if project data exists
  if (!projectData) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
        <p>Carregando projeto...</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      
      {/* Project Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              {projectData.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {projectData.description}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setCurrentView('wizard')}>
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </Button>
            <Button 
              onClick={handleGenerateProject}
              disabled={isGenerating}
              className="bg-green-600 hover:bg-green-700"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Gerando... {generationProgress}%
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Criar Vídeo
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Project Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{projectData.slides.length}</p>
                  <p className="text-sm text-gray-600">Slides</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">
                    {Math.round((projectData.metadata.totalDuration || 0) / 60) || 2}min
                  </p>
                  <p className="text-sm text-gray-600">Duração</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{projectData.narration.length}</p>
                  <p className="text-sm text-gray-600">Narrações</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">{projectData.metadata.qualityScore || 85}%</p>
                  <p className="text-sm text-gray-600">Qualidade</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Generation Progress */}
        {isGenerating && (
          <Alert className="mb-6">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <AlertDescription>
              <div className="space-y-2">
                <p>Gerando projeto de vídeo... {generationProgress}%</p>
                <Progress value={generationProgress} className="w-full" />
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Slides Editor */}
      <Tabs defaultValue="slides" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="slides">
            <Layers className="w-4 h-4 mr-2" />
            Slides ({projectData.slides.length})
          </TabsTrigger>
          <TabsTrigger value="narration">
            <Volume2 className="w-4 h-4 mr-2" />
            Narração
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="slides" className="space-y-4">
          {projectData.slides.map((slide, index) => (
            <SlideEditor
              key={slide.slideNumber}
              slide={slide}
              sceneMapping={projectData.metadata.sceneMappings?.[index]}
              narrationResult={projectData.narration[index]}
              availableTemplates={availableTemplates}
              onSlideUpdate={handleSlideUpdate}
              onTemplateChange={handleTemplateChange}
              onPreview={handleSlidePreview}
            />
          ))}
        </TabsContent>

        <TabsContent value="narration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuração de Narração</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Voz Selecionada</Label>
                  <p className="text-sm font-medium">{projectData.voiceConfig.voiceId}</p>
                </div>
                <div>
                  <Label>Velocidade</Label>
                  <p className="text-sm font-medium">{projectData.voiceConfig.speed}x</p>
                </div>
              </div>
              
              <div>
                <Label>Resumo da Narração</Label>
                <div className="mt-2 space-y-2">
                  {projectData.narration.map((narration, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-3 rounded">
                      <span className="text-sm">Slide {index + 1}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{narration.segments?.length || 0} segmentos</Badge>
                        <Badge variant="outline">{Math.round(narration.totalDuration || 0)}s</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Projeto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Avatar</Label>
                  <p className="text-sm font-medium">
                    {projectData.avatarConfig.enabled ? 'Ativado' : 'Desativado'}
                  </p>
                  {projectData.avatarConfig.enabled && (
                    <p className="text-xs text-gray-600">
                      Posição: {projectData.avatarConfig.position}
                    </p>
                  )}
                </div>
                
                <div>
                  <Label>Qualidade</Label>
                  <p className="text-sm font-medium">{projectData.metadata.qualityScore}%</p>
                </div>
              </div>
              
              <div>
                <Label>Arquivo Original</Label>
                <p className="text-sm font-medium">{projectData.metadata.sourceFile}</p>
                <p className="text-xs text-gray-600">
                  Processado em: {new Date(projectData.metadata.createdAt).toLocaleString('pt-BR')}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Bar */}
      <div className="fixed bottom-6 right-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg border p-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onBack}>
            Voltar
          </Button>
          <Button 
            onClick={handleGenerateProject}
            disabled={isGenerating}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <ArrowRight className="w-4 h-4 mr-2" />
                Finalizar Projeto
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
