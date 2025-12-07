
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { 
  Play, Pause, RotateCcw, Download, Upload, Settings, 
  Film, Clapperboard, MonitorPlay, Smartphone, 
  Youtube, Instagram, Linkedin, Globe, Zap, Clock,
  CheckCircle2, AlertTriangle, Loader2, BarChart3,
  FileVideo, FileImage, Layers, Volume2, Sparkles,
  ListOrdered, Timer, Target, TrendingUp, Award, Calendar
} from 'lucide-react'
import { toast } from 'sonner'

interface RenderJob {
  id: string
  name: string
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'paused'
  progress: number
  preset: string
  format: string
  resolution: string
  fps: number
  duration: number
  file_size?: number
  created_at: Date
  started_at?: Date
  completed_at?: Date
  estimated_time?: number
  priority: 'low' | 'normal' | 'high' | 'urgent'
}

interface ExportPreset {
  id: string
  name: string
  description: string
  platform: string
  resolution: string
  fps: number
  bitrate: string
  format: string
  codec: string
  audio_codec: string
  quality: 'low' | 'medium' | 'high' | 'ultra'
  file_size_estimate: string
  recommended_for: string[]
  processing_time: string
  icon: React.ReactNode
}

interface PipelineSettings {
  hardware_acceleration: boolean
  parallel_processing: boolean
  max_concurrent_jobs: number
  priority_queue: boolean
  auto_retry: boolean
  notification_webhook: string
  quality_preset: 'draft' | 'preview' | 'production' | 'master'
}

const AdvancedVideoPipeline: React.FC = () => {
  // State Management
  const [jobs, setJobs] = useState<RenderJob[]>([])
  const [selectedJob, setSelectedJob] = useState<RenderJob | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [queueStatus, setQueueStatus] = useState({
    active: 0,
    queued: 0,
    completed: 0,
    failed: 0
  })

  // Export Presets
  const [exportPresets] = useState<ExportPreset[]>([
    {
      id: 'youtube_4k',
      name: 'YouTube 4K Premium',
      description: 'Ultra alta qualidade para YouTube',
      platform: 'YouTube',
      resolution: '3840x2160',
      fps: 60,
      bitrate: '35-45 Mbps',
      format: 'MP4',
      codec: 'H.264 High Profile',
      audio_codec: 'AAC 320kbps',
      quality: 'ultra',
      file_size_estimate: '~2.5GB/min',
      recommended_for: ['Documentários', 'Apresentações Premium', 'Demonstrações Técnicas'],
      processing_time: '8-12 min',
      icon: <Youtube className="h-4 w-4" />
    },
    {
      id: 'youtube_1080p',
      name: 'YouTube Full HD',
      description: 'Qualidade profissional para YouTube',
      platform: 'YouTube',
      resolution: '1920x1080',
      fps: 30,
      bitrate: '8-12 Mbps',
      format: 'MP4',
      codec: 'H.264 Main Profile',
      audio_codec: 'AAC 192kbps',
      quality: 'high',
      file_size_estimate: '~500MB/min',
      recommended_for: ['Treinamentos', 'Webinars', 'Tutoriais'],
      processing_time: '3-5 min',
      icon: <Youtube className="h-4 w-4" />
    },
    {
      id: 'instagram_stories',
      name: 'Instagram Stories',
      description: 'Formato vertical para Stories',
      platform: 'Instagram',
      resolution: '1080x1920',
      fps: 30,
      bitrate: '3-5 Mbps',
      format: 'MP4',
      codec: 'H.264 Baseline',
      audio_codec: 'AAC 128kbps',
      quality: 'medium',
      file_size_estimate: '~200MB/min',
      recommended_for: ['Stories', 'Conteúdo Vertical', 'Mobile'],
      processing_time: '2-3 min',
      icon: <Instagram className="h-4 w-4" />
    },
    {
      id: 'instagram_feed',
      name: 'Instagram Feed',
      description: 'Formato quadrado para feed',
      platform: 'Instagram',
      resolution: '1080x1080',
      fps: 30,
      bitrate: '3-5 Mbps',
      format: 'MP4',
      codec: 'H.264 Main Profile',
      audio_codec: 'AAC 160kbps',
      quality: 'medium',
      file_size_estimate: '~180MB/min',
      recommended_for: ['Posts', 'Anúncios', 'Carousel'],
      processing_time: '2-4 min',
      icon: <Instagram className="h-4 w-4" />
    },
    {
      id: 'linkedin_video',
      name: 'LinkedIn Professional',
      description: 'Formato profissional para LinkedIn',
      platform: 'LinkedIn',
      resolution: '1920x1080',
      fps: 30,
      bitrate: '5-8 Mbps',
      format: 'MP4',
      codec: 'H.264 Main Profile',
      audio_codec: 'AAC 192kbps',
      quality: 'high',
      file_size_estimate: '~400MB/min',
      recommended_for: ['Apresentações', 'Corporativo', 'B2B'],
      processing_time: '3-6 min',
      icon: <Linkedin className="h-4 w-4" />
    },
    {
      id: 'mobile_optimized',
      name: 'Mobile Optimized',
      description: 'Otimizado para dispositivos móveis',
      platform: 'Mobile',
      resolution: '1280x720',
      fps: 30,
      bitrate: '2-4 Mbps',
      format: 'MP4',
      codec: 'H.264 Baseline',
      audio_codec: 'AAC 128kbps',
      quality: 'medium',
      file_size_estimate: '~150MB/min',
      recommended_for: ['WhatsApp', 'Telegram', 'Apps'],
      processing_time: '1-3 min',
      icon: <Smartphone className="h-4 w-4" />
    },
    {
      id: 'gif_animated',
      name: 'GIF Animado',
      description: 'GIF de alta qualidade para web',
      platform: 'Web',
      resolution: '800x600',
      fps: 15,
      bitrate: 'N/A',
      format: 'GIF',
      codec: 'GIF89a',
      audio_codec: 'N/A',
      quality: 'medium',
      file_size_estimate: '~50MB/min',
      recommended_for: ['Demos', 'Previews', 'Web'],
      processing_time: '1-2 min',
      icon: <FileImage className="h-4 w-4" />
    },
    {
      id: 'master_quality',
      name: 'Master Archive',
      description: 'Qualidade máxima para arquivo',
      platform: 'Archive',
      resolution: '3840x2160',
      fps: 60,
      bitrate: '50-80 Mbps',
      format: 'MOV',
      codec: 'ProRes 422',
      audio_codec: 'PCM 48kHz',
      quality: 'ultra',
      file_size_estimate: '~4GB/min',
      recommended_for: ['Arquivo', 'Edição Futura', 'Backup'],
      processing_time: '15-25 min',
      icon: <Award className="h-4 w-4" />
    }
  ])

  // Pipeline Settings
  const [pipelineSettings, setPipelineSettings] = useState<PipelineSettings>({
    hardware_acceleration: true,
    parallel_processing: true,
    max_concurrent_jobs: 4,
    priority_queue: true,
    auto_retry: true,
    notification_webhook: '',
    quality_preset: 'production'
  })

  // Current Export Settings
  const [exportSettings, setExportSettings] = useState({
    preset_id: 'youtube_1080p',
    custom_resolution: '1920x1080',
    custom_fps: 30,
    custom_bitrate: '8',
    custom_format: 'mp4',
    include_watermark: false,
    start_time: 0,
    end_time: 0,
    filters: {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      noise_reduction: 0
    }
  })

  // Sample Jobs for Demo
  useEffect(() => {
    const sampleJobs: RenderJob[] = [
      {
        id: 'job_001',
        name: 'NR-12 Segurança em Máquinas - Módulo 1',
        status: 'processing',
        progress: 67,
        preset: 'YouTube Full HD',
        format: 'MP4',
        resolution: '1920x1080',
        fps: 30,
        duration: 420,
        created_at: new Date(Date.now() - 1800000),
        started_at: new Date(Date.now() - 900000),
        estimated_time: 180,
        priority: 'high'
      },
      {
        id: 'job_002',
        name: 'NR-33 Espaços Confinados - Completo',
        status: 'queued',
        progress: 0,
        preset: 'YouTube 4K Premium',
        format: 'MP4',
        resolution: '3840x2160',
        fps: 60,
        duration: 1800,
        created_at: new Date(Date.now() - 600000),
        estimated_time: 720,
        priority: 'normal'
      },
      {
        id: 'job_003',
        name: 'NR-35 Trabalho em Altura - Instagram',
        status: 'completed',
        progress: 100,
        preset: 'Instagram Feed',
        format: 'MP4',
        resolution: '1080x1080',
        fps: 30,
        duration: 180,
        file_size: 156000000,
        created_at: new Date(Date.now() - 3600000),
        started_at: new Date(Date.now() - 3300000),
        completed_at: new Date(Date.now() - 3000000),
        priority: 'low'
      },
      {
        id: 'job_004',
        name: 'Treinamento Corporativo - Executivos',
        status: 'failed',
        progress: 23,
        preset: 'LinkedIn Professional',
        format: 'MP4',
        resolution: '1920x1080',
        fps: 30,
        duration: 900,
        created_at: new Date(Date.now() - 7200000),
        started_at: new Date(Date.now() - 6900000),
        priority: 'urgent'
      }
    ]
    
    setJobs(sampleJobs)
    
    // Update queue status
    setQueueStatus({
      active: sampleJobs.filter(job => job.status === 'processing').length,
      queued: sampleJobs.filter(job => job.status === 'queued').length,
      completed: sampleJobs.filter(job => job.status === 'completed').length,
      failed: sampleJobs.filter(job => job.status === 'failed').length
    })
  }, [])

  // Start Processing
  const startProcessing = async () => {
    const selectedPreset = exportPresets.find(p => p.id === exportSettings.preset_id)
    if (!selectedPreset) return

    setIsProcessing(true)
    
    const newJob: RenderJob = {
      id: `job_${Date.now()}`,
      name: `Novo Projeto - ${selectedPreset.name}`,
      status: 'processing',
      progress: 0,
      preset: selectedPreset.name,
      format: selectedPreset.format,
      resolution: selectedPreset.resolution,
      fps: selectedPreset.fps,
      duration: 300, // 5 minutes
      created_at: new Date(),
      started_at: new Date(),
      estimated_time: parseInt(selectedPreset.processing_time) * 60,
      priority: 'normal'
    }

    setJobs(prev => [newJob, ...prev])
    toast.success('Renderização iniciada!')

    // Simulate processing
    const progressInterval = setInterval(() => {
      setJobs(prev => prev.map(job => {
        if (job.id === newJob.id && job.progress < 100) {
          const newProgress = job.progress + Math.random() * 10
          if (newProgress >= 100) {
            clearInterval(progressInterval)
            setIsProcessing(false)
            toast.success('Vídeo renderizado com sucesso!')
            return { 
              ...job, 
              progress: 100, 
              status: 'completed' as const,
              completed_at: new Date(),
              file_size: Math.floor(Math.random() * 500000000 + 100000000)
            }
          }
          return { ...job, progress: Math.min(newProgress, 100) }
        }
        return job
      }))
    }, 2000)
  }

  // Retry Failed Job
  const retryJob = (jobId: string) => {
    setJobs(prev => prev.map(job => 
      job.id === jobId 
        ? { ...job, status: 'queued' as const, progress: 0 }
        : job
    ))
    toast.success('Job adicionado à fila novamente')
  }

  // Cancel Job
  const cancelJob = (jobId: string) => {
    setJobs(prev => prev.filter(job => job.id !== jobId))
    toast.success('Job cancelado')
  }

  // Format File Size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Format Duration
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  // Get Status Color
  const getStatusColor = (status: RenderJob['status']) => {
    switch (status) {
      case 'queued': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
      case 'processing': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20'
      case 'completed': return 'text-green-600 bg-green-100 dark:bg-green-900/20'
      case 'failed': return 'text-red-600 bg-red-100 dark:bg-red-900/20'
      case 'paused': return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20'
    }
  }

  // Get Priority Color
  const getPriorityColor = (priority: RenderJob['priority']) => {
    switch (priority) {
      case 'low': return 'border-gray-400'
      case 'normal': return 'border-blue-400'
      case 'high': return 'border-orange-400'
      case 'urgent': return 'border-red-400'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-indigo-950 dark:to-purple-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Advanced Video Pipeline
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Pipeline profissional de renderização com FFmpeg, múltiplos formatos e sistema de filas inteligente
          </p>
        </div>

        {/* Pipeline Status */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Processando</p>
                  <p className="text-2xl font-bold text-yellow-600">{queueStatus.active}</p>
                </div>
                <div className="h-12 w-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                  <Loader2 className="h-6 w-6 text-yellow-600 animate-spin" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Na Fila</p>
                  <p className="text-2xl font-bold text-blue-600">{queueStatus.queued}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <ListOrdered className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Concluídos</p>
                  <p className="text-2xl font-bold text-green-600">{queueStatus.completed}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Falharam</p>
                  <p className="text-2xl font-bold text-red-600">{queueStatus.failed}</p>
                </div>
                <div className="h-12 w-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Export Presets */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clapperboard className="h-5 w-5" />
                  Presets de Exportação Profissionais
                </CardTitle>
                <CardDescription>
                  8 presets otimizados para diferentes plataformas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  {exportPresets.map((preset) => (
                    <div
                      key={preset.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                        exportSettings.preset_id === preset.id
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                      }`}
                      onClick={() => setExportSettings(prev => ({ ...prev, preset_id: preset.id }))}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {preset.icon}
                          <h4 className="font-semibold">{preset.name}</h4>
                        </div>
                        <Badge variant={preset.quality === 'ultra' ? 'default' : preset.quality === 'high' ? 'secondary' : 'outline'}>
                          {preset.quality}
                        </Badge>
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {preset.description}
                      </p>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Resolução:</span>
                          <span className="font-medium">{preset.resolution}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Bitrate:</span>
                          <span className="font-medium">{preset.bitrate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Tamanho:</span>
                          <span className="font-medium">{preset.file_size_estimate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Tempo:</span>
                          <span className="font-medium">{preset.processing_time}</span>
                        </div>
                      </div>

                      <div className="mt-3">
                        <p className="text-xs text-gray-500 mb-1">Recomendado para:</p>
                        <div className="flex flex-wrap gap-1">
                          {preset.recommended_for.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {preset.recommended_for.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{preset.recommended_for.length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Export Settings */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configurações de Export
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Quality Preset */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Preset de Qualidade
                  </label>
                  <Select 
                    value={pipelineSettings.quality_preset} 
                    onValueChange={(value: string) => 
                      setPipelineSettings(prev => ({ ...prev, quality_preset: value as PipelineSettings['quality_preset'] }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Rascunho (Rápido)</SelectItem>
                      <SelectItem value="preview">Preview (Médio)</SelectItem>
                      <SelectItem value="production">Produção (Alto)</SelectItem>
                      <SelectItem value="master">Master (Ultra)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Concurrent Jobs */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Jobs Simultâneos: {pipelineSettings.max_concurrent_jobs}
                  </label>
                  <Slider
                    value={[pipelineSettings.max_concurrent_jobs]}
                    onValueChange={([value]) => 
                      setPipelineSettings(prev => ({ ...prev, max_concurrent_jobs: value }))
                    }
                    min={1}
                    max={8}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Hardware Settings */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">
                      Aceleração por Hardware
                    </label>
                    <Switch
                      checked={pipelineSettings.hardware_acceleration}
                      onCheckedChange={(checked) => 
                        setPipelineSettings(prev => ({ ...prev, hardware_acceleration: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">
                      Processamento Paralelo
                    </label>
                    <Switch
                      checked={pipelineSettings.parallel_processing}
                      onCheckedChange={(checked) => 
                        setPipelineSettings(prev => ({ ...prev, parallel_processing: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">
                      Fila de Prioridade
                    </label>
                    <Switch
                      checked={pipelineSettings.priority_queue}
                      onCheckedChange={(checked) => 
                        setPipelineSettings(prev => ({ ...prev, priority_queue: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">
                      Auto-retry em Falhas
                    </label>
                    <Switch
                      checked={pipelineSettings.auto_retry}
                      onCheckedChange={(checked) => 
                        setPipelineSettings(prev => ({ ...prev, auto_retry: checked }))
                      }
                    />
                  </div>
                </div>

                {/* Start Processing */}
                <Button 
                  onClick={startProcessing}
                  disabled={isProcessing}
                  className="w-full"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Iniciar Renderização
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Performance Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">CPU Usage</span>
                  <span className="text-sm font-medium">67%</span>
                </div>
                <Progress value={67} />

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">GPU Usage</span>
                  <span className="text-sm font-medium">84%</span>
                </div>
                <Progress value={84} />

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">RAM Usage</span>
                  <span className="text-sm font-medium">12.3/32 GB</span>
                </div>
                <Progress value={38} />

                <div className="pt-2 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Throughput:</span>
                    <span className="font-medium">2.3x tempo real</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">ETA Fila:</span>
                    <span className="font-medium">23 min</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Render Queue */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListOrdered className="h-5 w-5" />
              Fila de Renderização
            </CardTitle>
            <CardDescription>
              Sistema de filas inteligente com priorização automática
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {jobs.map((job) => (
                <div 
                  key={job.id} 
                  className={`p-4 border-l-4 ${getPriorityColor(job.priority)} bg-white dark:bg-gray-800 rounded-lg shadow-sm`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{job.name}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>{job.preset}</span>
                        <span>{job.resolution}</span>
                        <span>{job.format}</span>
                        <span>{formatDuration(job.duration)}</span>
                        {job.file_size && (
                          <span>{formatFileSize(job.file_size)}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(job.status)}>
                        {job.status === 'queued' && 'Na Fila'}
                        {job.status === 'processing' && 'Processando'}
                        {job.status === 'completed' && 'Concluído'}
                        {job.status === 'failed' && 'Falhou'}
                        {job.status === 'paused' && 'Pausado'}
                      </Badge>
                      
                      <Badge variant="outline" className={`text-xs ${getPriorityColor(job.priority)}`}>
                        {job.priority === 'low' && 'Baixa'}
                        {job.priority === 'normal' && 'Normal'}
                        {job.priority === 'high' && 'Alta'}
                        {job.priority === 'urgent' && 'Urgente'}
                      </Badge>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {(job.status === 'processing' || job.status === 'queued') && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          Progresso: {job.progress.toFixed(0)}%
                        </span>
                        {job.estimated_time && job.status === 'processing' && (
                          <span className="text-gray-600 dark:text-gray-400">
                            ETA: {Math.ceil((100 - job.progress) / 100 * job.estimated_time / 60)} min
                          </span>
                        )}
                      </div>
                      <Progress value={job.progress} />
                    </div>
                  )}

                  {/* Timestamps */}
                  <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                    <span>
                      Criado: {job.created_at.toLocaleTimeString('pt-BR')}
                    </span>
                    {job.completed_at && (
                      <span>
                        Concluído: {job.completed_at.toLocaleTimeString('pt-BR')}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3">
                    {job.status === 'failed' && (
                      <Button size="sm" variant="outline" onClick={() => retryJob(job.id)}>
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Tentar Novamente
                      </Button>
                    )}
                    {job.status === 'completed' && (
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    )}
                    {(job.status === 'queued' || job.status === 'failed') && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => cancelJob(job.id)}
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AdvancedVideoPipeline
