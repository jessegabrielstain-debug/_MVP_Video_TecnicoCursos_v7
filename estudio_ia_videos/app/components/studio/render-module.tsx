/**
 * 🎬 RENDER MODULE
 * Módulo de Renderização para o Studio Unificado
 */

'use client'

import React, { useState, useEffect } from 'react'
import { logger } from '@/lib/logger'
import { 
  Play, 
  Pause, 
  Square, 
  Download, 
  Settings, 
  Zap,
  RotateCcw,
  Film,
  Clock,
  HardDrive,
  Monitor,
  Cpu,
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye,
  Share2,
  FileVideo,
  Layers,
  Volume2,
  Image as ImageIcon,
  User,
  Sparkles
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

import type { UnifiedProject, RenderConfig } from '@/lib/stores/unified-project-store'

interface RenderModuleProps {
  project: UnifiedProject
  onRenderUpdate: (render: RenderConfig) => void
  onExecuteStep: (data: any) => Promise<void>
}

interface RenderJob {
  id: string
  status: 'pending' | 'preparing' | 'rendering' | 'completed' | 'error'
  progress: number
  currentStep: string
  estimatedTime?: number
  outputUrl?: string
  error?: string
  startTime?: Date
  endTime?: Date
  fileSize?: number
}

interface RenderPreset {
  id: string
  name: string
  description: string
  resolution: string
  fps: number
  bitrate: number
  quality: 'draft' | 'standard' | 'high' | 'ultra'
  estimatedSize: string
  renderTime: string
}

const renderPresets: RenderPreset[] = [
  {
    id: 'draft',
    name: 'Rascunho',
    description: 'Qualidade baixa para testes rápidos',
    resolution: '720p',
    fps: 24,
    bitrate: 2000,
    quality: 'draft',
    estimatedSize: '~50MB',
    renderTime: '~2min'
  },
  {
    id: 'standard',
    name: 'Padrão',
    description: 'Qualidade equilibrada para uso geral',
    resolution: '1080p',
    fps: 30,
    bitrate: 5000,
    quality: 'standard',
    estimatedSize: '~150MB',
    renderTime: '~5min'
  },
  {
    id: 'high',
    name: 'Alta Qualidade',
    description: 'Qualidade superior para apresentações',
    resolution: '1080p',
    fps: 60,
    bitrate: 8000,
    quality: 'high',
    estimatedSize: '~300MB',
    renderTime: '~8min'
  },
  {
    id: 'ultra',
    name: 'Ultra HD',
    description: 'Máxima qualidade para produção',
    resolution: '4K',
    fps: 60,
    bitrate: 15000,
    quality: 'ultra',
    estimatedSize: '~800MB',
    renderTime: '~15min'
  }
]

export default function RenderModule({ 
  project, 
  onRenderUpdate, 
  onExecuteStep 
}: RenderModuleProps) {
  const [renderConfig, setRenderConfig] = useState<RenderConfig>(
    project.render || {
      resolution: '1080p',
      fps: 30,
      quality: 'standard',
      format: 'mp4',
      bitrate: 5000
    }
  )
  
  const [selectedPreset, setSelectedPreset] = useState<RenderPreset>(
    renderPresets.find(p => p.quality === renderConfig.quality) || renderPresets[1]
  )
  
  const [renderJob, setRenderJob] = useState<RenderJob | null>(null)
  const [isRendering, setIsRendering] = useState(false)
  const [renderHistory, setRenderHistory] = useState<RenderJob[]>([])
  
  // Advanced settings
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [enableSubtitles, setEnableSubtitles] = useState(true)
  const [enableWatermark, setEnableWatermark] = useState(false)
  const [enableTransitions, setEnableTransitions] = useState(true)
  const [enableAvatarSync, setEnableAvatarSync] = useState(true)

  // Update render config when project changes
  useEffect(() => {
    if (project.render) {
      setRenderConfig(project.render)
      const preset = renderPresets.find(p => p.quality === project.render?.quality)
      if (preset) {
        setSelectedPreset(preset)
      }
    }
  }, [project.render])

  // Handle preset selection
  const handlePresetSelect = (preset: RenderPreset) => {
    setSelectedPreset(preset)
    const newConfig: RenderConfig = {
      ...renderConfig,
      resolution: preset.resolution,
      fps: preset.fps,
      quality: preset.quality,
      bitrate: preset.bitrate
    }
    setRenderConfig(newConfig)
    onRenderUpdate(newConfig)
  }

  // Handle render parameter changes
  const updateRenderParameter = (key: keyof RenderConfig, value: any) => {
    const newConfig = { ...renderConfig, [key]: value }
    setRenderConfig(newConfig)
    onRenderUpdate(newConfig)
  }

  // Start render process
  const startRender = async () => {
    if (!project.slides.length) {
      toast.error('Projeto não possui slides para renderizar')
      return
    }

    setIsRendering(true)
    
    const jobId = `render_${Date.now()}`
    const newJob: RenderJob = {
      id: jobId,
      status: 'preparing',
      progress: 0,
      currentStep: 'Preparando renderização...',
      startTime: new Date()
    }
    
    setRenderJob(newJob)

    try {
      // Simulate render process with realistic steps
      const steps = [
        { step: 'Preparando assets...', duration: 2000, progress: 10 },
        { step: 'Processando slides...', duration: 3000, progress: 25 },
        { step: 'Sincronizando avatar...', duration: 4000, progress: 45 },
        { step: 'Aplicando áudio...', duration: 3000, progress: 65 },
        { step: 'Renderizando vídeo...', duration: 8000, progress: 90 },
        { step: 'Finalizando...', duration: 2000, progress: 100 }
      ]

      for (const { step, duration, progress } of steps) {
        setRenderJob(prev => prev ? {
          ...prev,
          currentStep: step,
          status: 'rendering'
        } : null)

        // Simulate gradual progress
        const startProgress = renderJob?.progress || 0
        const progressDiff = progress - startProgress
        const progressInterval = setInterval(() => {
          setRenderJob(prev => {
            if (!prev) return null
            const newProgress = Math.min(prev.progress + 2, progress)
            return { ...prev, progress: newProgress }
          })
        }, duration / (progressDiff / 2))

        await new Promise(resolve => setTimeout(resolve, duration))
        clearInterval(progressInterval)
      }

      // Complete render
      const completedJob: RenderJob = {
        ...newJob,
        status: 'completed',
        progress: 100,
        currentStep: 'Renderização concluída!',
        endTime: new Date(),
        outputUrl: `/api/renders/${jobId}/download`,
        fileSize: Math.round(Math.random() * 500 + 100) // Simulate file size
      }

      setRenderJob(completedJob)
      setRenderHistory(prev => [completedJob, ...prev])
      
      toast.success('Vídeo renderizado com sucesso!')

    } catch (error: any) {
      logger.error('Render error', error instanceof Error ? error : new Error(String(error)), { component: 'RenderModule' })
      setRenderJob(prev => prev ? {
        ...prev,
        status: 'error',
        error: error.message
      } : null)
      toast.error('Erro na renderização: ' + error.message)
    } finally {
      setIsRendering(false)
    }
  }

  // Cancel render
  const cancelRender = () => {
    if (renderJob && renderJob.status === 'rendering') {
      setRenderJob(prev => prev ? {
        ...prev,
        status: 'error',
        error: 'Renderização cancelada pelo usuário'
      } : null)
      setIsRendering(false)
      toast.info('Renderização cancelada')
    }
  }

  // Download rendered video
  const downloadVideo = (job: RenderJob) => {
    if (job.outputUrl) {
      // Simulate download
      const link = document.createElement('a')
      link.href = job.outputUrl
      link.download = `video_${project.name}_${job.id}.mp4`
      link.click()
      toast.success('Download iniciado!')
    }
  }

  // Handle execute step
  const handleExecuteStep = async () => {
    if (!renderJob || renderJob.status !== 'completed') {
      toast.error('Complete a renderização antes de continuar')
      return
    }

    try {
      await onExecuteStep({
        renderConfig,
        outputUrl: renderJob.outputUrl,
        fileSize: renderJob.fileSize,
        settings: {
          enableSubtitles,
          enableWatermark,
          enableTransitions,
          enableAvatarSync
        }
      })
      toast.success('Render concluído! Prosseguindo para Export...')
    } catch (error: any) {
      toast.error('Erro ao finalizar render: ' + error.message)
    }
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Format duration
  const formatDuration = (start: Date, end: Date) => {
    const diff = end.getTime() - start.getTime()
    const minutes = Math.floor(diff / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Render preset selection
  const renderPresetSelection = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {renderPresets.map((preset) => (
        <Card 
          key={preset.id}
          className={`cursor-pointer transition-all hover:shadow-md ${
            selectedPreset.id === preset.id 
              ? 'ring-2 ring-blue-500 bg-blue-50' 
              : 'hover:bg-gray-50'
          }`}
          onClick={() => handlePresetSelect(preset)}
        >
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">{preset.name}</h4>
                {selectedPreset.id === preset.id && (
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                )}
              </div>
              
              <p className="text-xs text-gray-600">{preset.description}</p>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Resolução:</span>
                  <span className="font-medium">{preset.resolution}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">FPS:</span>
                  <span className="font-medium">{preset.fps}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Tamanho:</span>
                  <span className="font-medium">{preset.estimatedSize}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Tempo:</span>
                  <span className="font-medium">{preset.renderTime}</span>
                </div>
              </div>
              
              <Badge 
                variant={
                  preset.quality === 'draft' ? 'secondary' :
                  preset.quality === 'standard' ? 'outline' :
                  preset.quality === 'high' ? 'default' : 'destructive'
                }
                className="text-xs"
              >
                {preset.quality === 'draft' ? 'Rascunho' :
                 preset.quality === 'standard' ? 'Padrão' :
                 preset.quality === 'high' ? 'Alta' : 'Ultra'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  // Render advanced settings
  const renderAdvancedSettings = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Configurações Avançadas</span>
          </CardTitle>
          <Switch
            checked={showAdvanced}
            onCheckedChange={setShowAdvanced}
          />
        </div>
      </CardHeader>
      {showAdvanced && (
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Resolução</Label>
              <Select
                value={renderConfig.resolution}
                onValueChange={(value) => updateRenderParameter('resolution', value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="720p">720p (HD)</SelectItem>
                  <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                  <SelectItem value="1440p">1440p (2K)</SelectItem>
                  <SelectItem value="4K">4K (Ultra HD)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Taxa de Quadros (FPS)</Label>
              <Select
                value={renderConfig.fps.toString()}
                onValueChange={(value) => updateRenderParameter('fps', parseInt(value))}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24">24 FPS</SelectItem>
                  <SelectItem value="30">30 FPS</SelectItem>
                  <SelectItem value="60">60 FPS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Formato de Saída</Label>
              <Select
                value={renderConfig.format}
                onValueChange={(value) => updateRenderParameter('format', value)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mp4">MP4</SelectItem>
                  <SelectItem value="mov">MOV</SelectItem>
                  <SelectItem value="avi">AVI</SelectItem>
                  <SelectItem value="webm">WebM</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Bitrate: {renderConfig.bitrate} kbps</Label>
              <Slider
                min={1000}
                max={20000}
                step={500}
                value={[renderConfig.bitrate]}
                onValueChange={([value]) => updateRenderParameter('bitrate', value)}
                className="mt-2"
              />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <div>
                <Label>Legendas Automáticas</Label>
                <p className="text-sm text-gray-500">Gerar legendas do áudio</p>
              </div>
              <Switch
                checked={enableSubtitles}
                onCheckedChange={setEnableSubtitles}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Marca d'água</Label>
                <p className="text-sm text-gray-500">Adicionar logo da empresa</p>
              </div>
              <Switch
                checked={enableWatermark}
                onCheckedChange={setEnableWatermark}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Transições</Label>
                <p className="text-sm text-gray-500">Efeitos entre slides</p>
              </div>
              <Switch
                checked={enableTransitions}
                onCheckedChange={setEnableTransitions}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Sincronia Avatar</Label>
                <p className="text-sm text-gray-500">Sincronizar com áudio</p>
              </div>
              <Switch
                checked={enableAvatarSync}
                onCheckedChange={setEnableAvatarSync}
              />
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  )

  // Render current job status
  const renderCurrentJob = () => {
    if (!renderJob) return null

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Film className="w-5 h-5" />
            <span>Status da Renderização</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {renderJob.status === 'rendering' && (
                <RotateCcw className="w-4 h-4 animate-spin text-blue-500" />
              )}
              {renderJob.status === 'completed' && (
                <CheckCircle className="w-4 h-4 text-green-500" />
              )}
              {renderJob.status === 'error' && (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
              <span className="font-medium">{renderJob.currentStep}</span>
            </div>
            
            <Badge 
              variant={
                renderJob.status === 'completed' ? 'default' :
                renderJob.status === 'error' ? 'destructive' : 'secondary'
              }
            >
              {renderJob.status === 'preparing' ? 'Preparando' :
               renderJob.status === 'rendering' ? 'Renderizando' :
               renderJob.status === 'completed' ? 'Concluído' : 'Erro'}
            </Badge>
          </div>

          <Progress value={renderJob.progress} className="w-full" />
          
          <div className="flex justify-between text-sm text-gray-500">
            <span>{renderJob.progress}% concluído</span>
            {renderJob.startTime && (
              <span>
                Iniciado: {renderJob.startTime.toLocaleTimeString()}
              </span>
            )}
          </div>

          {renderJob.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{renderJob.error}</p>
            </div>
          )}

          {renderJob.status === 'completed' && (
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <HardDrive className="w-4 h-4" />
                  <span>{renderJob.fileSize ? formatFileSize(renderJob.fileSize * 1024 * 1024) : 'N/A'}</span>
                </div>
                {renderJob.startTime && renderJob.endTime && (
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatDuration(renderJob.startTime, renderJob.endTime)}</span>
                  </div>
                )}
              </div>
              
              <Button
                size="sm"
                onClick={() => downloadVideo(renderJob)}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            {renderJob.status === 'rendering' && (
              <Button
                variant="outline"
                size="sm"
                onClick={cancelRender}
              >
                <Square className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Preset Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Monitor className="w-5 h-5" />
            <span>Qualidade de Renderização</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderPresetSelection()}
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      {renderAdvancedSettings()}

      {/* Current Job Status */}
      {renderCurrentJob()}

      {/* Project Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Layers className="w-5 h-5" />
            <span>Resumo do Projeto</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="space-y-1">
              <div className="flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-2xl font-bold">{project.slides.length}</p>
              <p className="text-sm text-gray-500">Slides</p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-center">
                <User className="w-5 h-5 text-green-500" />
              </div>
              <p className="text-2xl font-bold">{project.avatar3D ? '1' : '0'}</p>
              <p className="text-sm text-gray-500">Avatar</p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-center">
                <Volume2 className="w-5 h-5 text-purple-500" />
              </div>
              <p className="text-2xl font-bold">{project.tts ? '1' : '0'}</p>
              <p className="text-sm text-gray-500">TTS</p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-orange-500" />
              </div>
              <p className="text-2xl font-bold">{selectedPreset.name}</p>
              <p className="text-sm text-gray-500">Qualidade</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <Button 
          variant="outline"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <Settings className="w-4 h-4 mr-2" />
          Configurações
        </Button>
        
        <Button 
          onClick={startRender}
          disabled={isRendering || !project.slides.length}
          size="lg"
        >
          {isRendering ? (
            <>
              <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
              Renderizando...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Iniciar Renderização
            </>
          )}
        </Button>
        
        {renderJob?.status === 'completed' && (
          <Button 
            onClick={handleExecuteStep}
          >
            <Zap className="w-4 h-4 mr-2" />
            Continuar para Export
          </Button>
        )}
      </div>
    </div>
  )
}