

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Progress } from '../ui/progress'
import { Badge } from '../ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Slider } from '../ui/slider'
import { Switch } from '../ui/switch'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Separator } from '../ui/separator'
import { Alert, AlertDescription } from '../ui/alert'
import { 
  Play, 
  Pause, 
  Square, 
  Download, 
  Upload,
  Settings, 
  Video, 
  Mic,
  Users,
  Eye,
  BarChart3,
  Clock,
  DollarSign,
  Zap,
  CheckCircle,
  AlertCircle,
  Loader2,
  Monitor,
  Smartphone,
  Film,
  VolumeX,
  Volume2,
  RotateCcw,
  Save,
  Share2,
  Sparkles
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface RenderProject {
  id: string
  name: string
  slides: Array<{
    id: string
    title: string
    content: string
    duration: number
  }>
  settings: RenderSettings
}

interface RenderSettings {
  resolution: '720p' | '1080p' | '1440p'
  format: 'mp4' | 'webm' | 'mov'
  quality: 'draft' | 'standard' | 'high' | 'premium'
  fps: number
  avatarId: string
  voiceId: string
  background: string
  watermark: boolean
  subtitles: boolean
}

interface RenderJob {
  id: string
  projectId: string
  status: 'queued' | 'processing' | 'rendering' | 'uploading' | 'completed' | 'failed'
  progress: number
  currentStep: string
  currentSlide?: number
  totalSlides?: number
  estimatedTime?: number
  cost: number
  startTime: Date
  endTime?: Date
}

export default function AdvancedRenderStudio() {
  // State management
  const [currentProject, setCurrentProject] = useState<RenderProject | null>(null)
  const [renderJobs, setRenderJobs] = useState<RenderJob[]>([])
  const [isRendering, setIsRendering] = useState(false)
  const [activeJob, setActiveJob] = useState<RenderJob | null>(null)
  const [renderSettings, setRenderSettings] = useState<RenderSettings>({
    resolution: '1080p',
    format: 'mp4',
    quality: 'standard',
    fps: 30,
    avatarId: 'avatar-female-1',
    voiceId: 'br-female-1',
    background: 'office',
    watermark: false,
    subtitles: true
  })

  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [realTimeStats, setRealTimeStats] = useState({
    queueLength: 2,
    activeWorkers: 3,
    avgRenderTime: 45,
    successRate: 97.3
  })

  // Available options
  const availableAvatars = [
    { id: 'avatar-female-1', name: 'Ana Silva', gender: 'Feminino', style: 'Profissional' },
    { id: 'avatar-male-1', name: 'Carlos Santos', gender: 'Masculino', style: 'Corporativo' },
    { id: 'avatar-female-2', name: 'Maria Eduarda', gender: 'Feminino', style: 'Jovem' },
  ]

  const availableVoices = [
    { id: 'br-female-1', name: 'Ana (Brasileira)', gender: 'Feminino', naturalness: 95 },
    { id: 'br-male-1', name: 'Carlos (Brasileiro)', gender: 'Masculino', naturalness: 93 },
    { id: 'br-female-2', name: 'Maria (Jovem)', gender: 'Feminino', naturalness: 97 },
  ]

  // Real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time updates
      if (activeJob && activeJob.status === 'processing') {
        setActiveJob(prev => prev ? {
          ...prev,
          progress: Math.min(100, prev.progress + Math.random() * 5),
          currentStep: getRandomRenderStep(prev.progress)
        } : null)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [activeJob])

  // Start render process
  const handleStartRender = useCallback(async () => {
    if (!currentProject) {
      toast.error('Nenhum projeto selecionado')
      return
    }

    setIsRendering(true)

    try {
      const response = await fetch('/api/render/submit-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: currentProject.id,
          scenes: currentProject.slides.map(slide => ({
            id: slide.id,
            type: 'slide',
            content: { title: slide.title, text: slide.content },
            duration: slide.duration,
            order: parseInt(slide.id.split('-')[1])
          })),
          output_settings: {
            resolution: renderSettings.resolution,
            fps: renderSettings.fps,
            format: renderSettings.format,
            quality: renderSettings.quality,
            watermark: renderSettings.watermark ? {
              enabled: true,
              type: 'text',
              content: 'Estúdio IA',
              position: 'bottom-right'
            } : undefined
          },
          priority: 'normal'
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      const data = await response.json()
      
      const newJob: RenderJob = {
        id: data.data.job_id,
        projectId: currentProject.id,
        status: 'queued',
        progress: 0,
        currentStep: 'Job na fila de processamento',
        totalSlides: currentProject.slides.length,
        estimatedTime: data.data.eta_minutes,
        cost: data.data.estimates.total_cost,
        startTime: new Date()
      }

      setActiveJob(newJob)
      setRenderJobs(prev => [newJob, ...prev])
      
      toast.success('Renderização iniciada!')
      
      // Start polling job status
      pollJobStatus(newJob.id)

    } catch (error) {
      console.error('Render start error:', error)
      toast.error('Erro ao iniciar renderização')
      setIsRendering(false)
    }
  }, [currentProject, renderSettings])

  // Poll job status
  const pollJobStatus = useCallback(async (jobId: string) => {
    const poll = async () => {
      try {
        const response = await fetch(`/api/render/status/${jobId}`)
        if (response.ok) {
          const data = await response.json()
          
          if (data.success) {
            const updatedJob: RenderJob = {
              ...activeJob!,
              status: mapJobStatus(data.data.stage),
              progress: data.data.progress,
              currentStep: data.data.current_step,
              cost: data.data.cost_so_far
            }

            setActiveJob(updatedJob)
            
            if (data.data.stage === 'complete') {
              updatedJob.endTime = new Date()
              setIsRendering(false)
              toast.success('Renderização concluída!')
              return
            }

            if (data.data.stage === 'failed') {
              setIsRendering(false)
              toast.error('Renderização falhou')
              return
            }
          }
        }
      } catch (error) {
        console.error('Polling error:', error)
      }

      // Continue polling if job is still active
      setTimeout(poll, 3000)
    }

    poll()
  }, [activeJob])

  // Utility functions
  const getRandomRenderStep = (progress: number): string => {
    if (progress < 20) return 'Carregando assets do projeto'
    if (progress < 40) return 'Gerando narração com IA'
    if (progress < 60) return 'Renderizando avatar 3D'
    if (progress < 80) return 'Compondo cenas com FFmpeg'
    if (progress < 95) return 'Fazendo upload para CDN'
    return 'Finalizando processamento'
  }

  const mapJobStatus = (stage: string): RenderJob['status'] => {
    switch (stage) {
      case 'queued': return 'queued'
      case 'processing': return 'processing'
      case 'composing': return 'rendering'
      case 'uploading': return 'uploading'
      case 'complete': return 'completed'
      case 'failed': return 'failed'
      default: return 'queued'
    }
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const estimateRenderCost = (): number => {
    if (!currentProject) return 0
    
    const baseCost = 0.15 // Base cost per slide
    const slideCost = currentProject.slides.length * baseCost
    
    // Quality multiplier
    const qualityMultiplier = {
      'draft': 0.5,
      'standard': 1.0,
      'high': 1.5,
      'premium': 2.0
    }[renderSettings.quality]
    
    // Resolution multiplier
    const resolutionMultiplier = {
      '720p': 1.0,
      '1080p': 1.5,
      '1440p': 2.0
    }[renderSettings.resolution]
    
    return slideCost * qualityMultiplier * resolutionMultiplier
  }

  // Mock project for demo
  useEffect(() => {
    if (!currentProject) {
      setCurrentProject({
        id: 'demo-project-1',
        name: 'Treinamento NR-12: Segurança em Máquinas',
        slides: [
          { id: 'slide-1', title: 'Introdução à NR-12', content: 'Norma Regulamentadora sobre segurança em máquinas e equipamentos de trabalho.', duration: 15 },
          { id: 'slide-2', title: 'Objetivos Principais', content: 'Estabelecer requisitos mínimos para prevenção de acidentes e doenças do trabalho.', duration: 12 },
          { id: 'slide-3', title: 'Responsabilidades', content: 'Definir as responsabilidades do empregador e do trabalhador.', duration: 18 },
          { id: 'slide-4', title: 'Medidas de Proteção', content: 'Implementar medidas preventivas e sistemas de proteção coletiva.', duration: 20 },
          { id: 'slide-5', title: 'Conclusão', content: 'Importância do cumprimento da NR-12 para um ambiente de trabalho seguro.', duration: 10 }
        ],
        settings: renderSettings
      })
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-3">
              <Video className="w-8 h-8 text-purple-600" />
              Advanced Render Studio
            </h1>
            <p className="text-muted-foreground mt-1">
              Sistema profissional de renderização de vídeos com IA
            </p>
          </div>
          
          {/* Real-time stats */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Fila</div>
              <div className="text-lg font-bold text-orange-600">{realTimeStats.queueLength}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Workers</div>
              <div className="text-lg font-bold text-green-600">{realTimeStats.activeWorkers}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Tempo Médio</div>
              <div className="text-lg font-bold text-blue-600">{realTimeStats.avgRenderTime}s</div>
            </div>
            <Badge className="bg-green-100 text-green-700 border-green-300">
              {realTimeStats.successRate}% Success
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="project" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="project">Projeto</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="render">Renderização</TabsTrigger>
            <TabsTrigger value="results">Resultados</TabsTrigger>
          </TabsList>

          {/* Project Tab */}
          <TabsContent value="project">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Project Info */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Film className="w-5 h-5" />
                      Projeto Atual
                    </CardTitle>
                    <CardDescription>
                      {currentProject ? currentProject.name : 'Nenhum projeto selecionado'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {currentProject ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-2xl font-bold text-blue-600">
                              {currentProject.slides.length}
                            </div>
                            <div className="text-sm text-muted-foreground">Slides</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-green-600">
                              {formatDuration(currentProject.slides.reduce((acc, slide) => acc + slide.duration, 0))}
                            </div>
                            <div className="text-sm text-muted-foreground">Duração</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-purple-600">
                              ${estimateRenderCost().toFixed(2)}
                            </div>
                            <div className="text-sm text-muted-foreground">Custo Est.</div>
                          </div>
                        </div>

                        <Separator />

                        {/* Slides list */}
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                          {currentProject.slides.map((slide, index) => (
                            <div key={slide.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                              <Badge variant="outline" className="mt-1">
                                {index + 1}
                              </Badge>
                              <div className="flex-1">
                                <h4 className="font-medium text-sm">{slide.title}</h4>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {slide.content}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Clock className="w-3 h-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">
                                    {slide.duration}s
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-semibold mb-2">Nenhum projeto carregado</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Importe um arquivo PPTX ou crie um novo projeto
                        </p>
                        <Button>
                          <Upload className="w-4 h-4 mr-2" />
                          Importar PPTX
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Ações Rápidas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      disabled={!currentProject}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Preview Rápido
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      disabled={!currentProject}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Salvar Template
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      disabled={!currentProject}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Compartilhar
                    </Button>
                    <Separator />
                    <Button 
                      className="w-full"
                      onClick={handleStartRender}
                      disabled={!currentProject || isRendering}
                    >
                      {isRendering ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Renderizando...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Iniciar Renderização
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Video Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Configurações de Vídeo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {/* Resolution */}
                  <div className="space-y-2">
                    <Label>Resolução</Label>
                    <Select 
                      value={renderSettings.resolution} 
                      onValueChange={(value: string) => setRenderSettings(prev => ({ ...prev, resolution: value as RenderSettings['resolution'] }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="720p">HD 720p (1280x720)</SelectItem>
                        <SelectItem value="1080p">Full HD 1080p (1920x1080)</SelectItem>
                        <SelectItem value="1440p">QHD 1440p (2560x1440)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Format */}
                  <div className="space-y-2">
                    <Label>Formato</Label>
                    <Select 
                      value={renderSettings.format} 
                      onValueChange={(value: string) => setRenderSettings(prev => ({ ...prev, format: value as RenderSettings['format'] }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mp4">MP4 (Recomendado)</SelectItem>
                        <SelectItem value="webm">WebM</SelectItem>
                        <SelectItem value="mov">MOV</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Quality */}
                  <div className="space-y-2">
                    <Label>Qualidade</Label>
                    <Select 
                      value={renderSettings.quality} 
                      onValueChange={(value: string) => setRenderSettings(prev => ({ ...prev, quality: value as RenderSettings['quality'] }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft (Rápido)</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* FPS */}
                  <div className="space-y-3">
                    <Label>Frames por Segundo: {renderSettings.fps}</Label>
                    <Slider
                      value={[renderSettings.fps]}
                      onValueChange={([value]) => setRenderSettings(prev => ({ ...prev, fps: value }))}
                      min={24}
                      max={60}
                      step={6}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>24 fps</span>
                      <span>30 fps</span>
                      <span>60 fps</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AI Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Avatar & Voz
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {/* Avatar Selection */}
                  <div className="space-y-2">
                    <Label>Avatar Apresentador</Label>
                    <Select 
                      value={renderSettings.avatarId} 
                      onValueChange={(value: string) => setRenderSettings(prev => ({ ...prev, avatarId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableAvatars.map((avatar) => (
                          <SelectItem key={avatar.id} value={avatar.id}>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              {avatar.name} ({avatar.gender})
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Voice Selection */}
                  <div className="space-y-2">
                    <Label>Voz para Narração</Label>
                    <Select 
                      value={renderSettings.voiceId} 
                      onValueChange={(value: string) => setRenderSettings(prev => ({ ...prev, voiceId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableVoices.map((voice) => (
                          <SelectItem key={voice.id} value={voice.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{voice.name}</span>
                              <Badge variant="secondary" className="ml-2">
                                {voice.naturalness}%
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Background */}
                  <div className="space-y-2">
                    <Label>Cenário</Label>
                    <Select 
                      value={renderSettings.background} 
                      onValueChange={(value: string) => setRenderSettings(prev => ({ ...prev, background: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="office">Escritório</SelectItem>
                        <SelectItem value="studio">Estúdio</SelectItem>
                        <SelectItem value="modern">Moderno</SelectItem>
                        <SelectItem value="industrial">Industrial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Options */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="watermark">Marca d'água</Label>
                      <Switch
                        id="watermark"
                        checked={renderSettings.watermark}
                        onCheckedChange={(checked) => setRenderSettings(prev => ({ ...prev, watermark: checked }))}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="subtitles">Legendas automáticas</Label>
                      <Switch
                        id="subtitles"
                        checked={renderSettings.subtitles}
                        onCheckedChange={(checked) => setRenderSettings(prev => ({ ...prev, subtitles: checked }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      Preview do Projeto
                    </CardTitle>
                    <CardDescription>
                      Visualize como ficará o vídeo antes da renderização
                    </CardDescription>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant={previewMode === 'desktop' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPreviewMode('desktop')}
                    >
                      <Monitor className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={previewMode === 'mobile' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setPreviewMode('mobile')}
                    >
                      <Smartphone className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Preview Area */}
                  <div className={`mx-auto bg-gray-900 rounded-lg overflow-hidden ${
                    previewMode === 'mobile' ? 'max-w-sm' : 'max-w-4xl'
                  }`}>
                    <div className="aspect-video bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white">
                      <div className="text-center">
                        <Play className="w-16 h-16 mx-auto mb-4 opacity-80" />
                        <h3 className="text-xl font-semibold mb-2">Preview do Vídeo</h3>
                        <p className="text-sm opacity-80">
                          {currentProject ? currentProject.name : 'Carregue um projeto'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Controls */}
                    <div className="bg-gray-800 p-4">
                      <div className="flex items-center gap-4">
                        <Button size="sm" variant="outline" className="text-white border-gray-600">
                          <Play className="w-4 h-4" />
                        </Button>
                        <div className="flex-1 bg-gray-700 h-1 rounded-full">
                          <div className="bg-blue-500 h-1 rounded-full w-1/3"></div>
                        </div>
                        <span className="text-white text-sm">1:23 / 3:45</span>
                        <Button size="sm" variant="outline" className="text-white border-gray-600">
                          <Volume2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Preview Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Video className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                        <div className="text-lg font-semibold">{renderSettings.resolution}</div>
                        <div className="text-sm text-muted-foreground">Resolução</div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Mic className="w-8 h-8 text-green-600 mx-auto mb-2" />
                        <div className="text-lg font-semibold">
                          {availableVoices.find(v => v.id === renderSettings.voiceId)?.name.split('(')[0] || 'Ana'}
                        </div>
                        <div className="text-sm text-muted-foreground">Narrador</div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                        <div className="text-lg font-semibold">
                          {availableAvatars.find(a => a.id === renderSettings.avatarId)?.name.split(' ')[0] || 'Ana'}
                        </div>
                        <div className="text-sm text-muted-foreground">Avatar</div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Render Tab */}
          <TabsContent value="render">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Render Status */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      Status da Renderização
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {activeJob ? (
                      <div className="space-y-6">
                        {/* Progress */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Progresso Geral</span>
                            <span className="text-sm text-muted-foreground">
                              {activeJob.progress.toFixed(1)}%
                            </span>
                          </div>
                          <Progress value={activeJob.progress} className="h-3" />
                        </div>

                        {/* Current Step */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                            <span className="text-sm font-medium">{activeJob.currentStep}</span>
                          </div>
                          
                          {activeJob.currentSlide && (
                            <div className="text-xs text-muted-foreground ml-6">
                              Slide {activeJob.currentSlide} de {activeJob.totalSlides}
                            </div>
                          )}
                        </div>

                        {/* Pipeline Stages */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {[
                            { stage: 'TTS', icon: Mic, complete: activeJob.progress > 25 },
                            { stage: 'Avatar', icon: Users, complete: activeJob.progress > 50 },
                            { stage: 'FFmpeg', icon: Film, complete: activeJob.progress > 75 },
                            { stage: 'Upload', icon: Upload, complete: activeJob.progress >= 100 }
                          ].map((item) => (
                            <div key={item.stage} className="text-center space-y-2">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${
                                item.complete ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
                              }`}>
                                <item.icon className="w-6 h-6" />
                              </div>
                              <p className="text-sm font-medium">{item.stage}</p>
                            </div>
                          ))}
                        </div>

                        {/* Job Details */}
                        <div className="bg-muted p-4 rounded-lg">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <div className="text-muted-foreground">Job ID</div>
                              <div className="font-mono">{activeJob.id.slice(-8)}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Custo</div>
                              <div className="flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />
                                ${activeJob.cost.toFixed(3)}
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Tempo</div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {Math.floor((Date.now() - activeJob.startTime.getTime()) / 1000)}s
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Status</div>
                              <Badge className={
                                activeJob.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                                activeJob.status === 'completed' ? 'bg-green-100 text-green-700' :
                                'bg-gray-100 text-gray-700'
                              }>
                                {activeJob.status === 'processing' ? 'Processando' :
                                 activeJob.status === 'completed' ? 'Concluído' :
                                 activeJob.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-semibold mb-2">Nenhuma renderização ativa</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Configure seu projeto e clique em "Iniciar Renderização"
                        </p>
                        <Button 
                          onClick={handleStartRender}
                          disabled={!currentProject}
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          Iniciar Renderização
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Render Queue */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Fila de Render
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      {renderJobs.slice(0, 5).map((job) => (
                        <div key={job.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <div>
                            <div className="font-medium text-sm">Job {job.id.slice(-6)}</div>
                            <div className="text-xs text-muted-foreground">
                              {job.status === 'completed' ? 'Concluído' : 
                               job.status === 'processing' ? 'Processando' : 
                               'Na fila'}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">{job.progress.toFixed(0)}%</div>
                            <Badge variant="outline" className="text-xs">
                              ${job.cost.toFixed(2)}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {renderJobs.length === 0 && (
                      <div className="text-center text-muted-foreground text-sm py-4">
                        Nenhum job na fila
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Resultados da Renderização
                </CardTitle>
                <CardDescription>
                  Histórico de vídeos renderizados e downloads
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderJobs.filter(job => job.status === 'completed').length > 0 ? (
                  <div className="space-y-4">
                    {renderJobs
                      .filter(job => job.status === 'completed')
                      .map((job) => (
                        <div key={job.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold">Projeto {job.projectId.slice(-8)}</h3>
                              <p className="text-sm text-muted-foreground">
                                Concluído em {job.endTime?.toLocaleString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4 mr-1" />
                                Preview
                              </Button>
                              <Button size="sm">
                                <Download className="w-4 h-4 mr-1" />
                                Download
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Nenhum vídeo renderizado ainda</h3>
                    <p className="text-sm text-muted-foreground">
                      Seus vídeos concluídos aparecerão aqui
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

