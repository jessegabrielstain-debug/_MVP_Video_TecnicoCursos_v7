
'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Download,
  Video,
  FileVideo,
  Image,
  Settings,
  Cloud,
  Folder,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap,
  Cpu,
  HardDrive,
  Eye,
  Share2
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface ExportFormat {
  id: string
  name: string
  extension: string
  icon: React.ReactNode
  description: string
  quality: 'low' | 'medium' | 'high' | 'ultra'
  size: 'small' | 'medium' | 'large'
  speed: 'slow' | 'medium' | 'fast'
  compatibility: 'universal' | 'modern' | 'web'
  features: string[]
}

interface ExportOptions {
  format: ExportFormat
  quality: {
    resolution: string
    bitrate: number
    fps: number
  }
  compression: {
    level: number
    method: string
  }
  watermark: boolean
  trimming: {
    enabled: boolean
    start: number
    end: number
  }
  effects: {
    fadeIn: boolean
    fadeOut: boolean
    stabilization: boolean
    colorCorrection: boolean
  }
  audio: {
    enabled: boolean
    quality: string
    normalize: boolean
  }
}

interface ExportJob {
  id: string
  format: ExportFormat
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress: number
  startTime: number
  estimatedTime: number
  outputUrl?: string
  error?: string
}

interface CloudProvider {
  id: string
  name: string
  icon: React.ReactNode
  connected: boolean
  quota: { used: number; total: number }
}

const exportFormats: ExportFormat[] = [
  {
    id: 'mp4-h264',
    name: 'MP4 (H.264)',
    extension: 'mp4',
    icon: <Video className="h-5 w-5" />,
    description: 'Formato universal, compatível com todos os dispositivos',
    quality: 'high',
    size: 'medium',
    speed: 'medium',
    compatibility: 'universal',
    features: ['Streaming', 'Mobile', 'Desktop', 'TV']
  },
  {
    id: 'webm-vp9',
    name: 'WebM (VP9)',
    extension: 'webm',
    icon: <FileVideo className="h-5 w-5" />,
    description: 'Otimizado para web, menor tamanho de arquivo',
    quality: 'high',
    size: 'small',
    speed: 'slow',
    compatibility: 'web',
    features: ['Web optimized', 'Transparent background', 'High compression']
  },
  {
    id: 'mov-prores',
    name: 'MOV (ProRes)',
    extension: 'mov',
    icon: <Video className="h-5 w-5" />,
    description: 'Qualidade profissional para edição',
    quality: 'ultra',
    size: 'large',
    speed: 'slow',
    compatibility: 'modern',
    features: ['Professional', '4K support', 'Color accuracy', 'Lossless']
  },
  {
    id: 'gif-animated',
    name: 'GIF Animado',
    extension: 'gif',
    icon: <Image className="h-5 w-5" />,
    description: 'Para compartilhamento em redes sociais',
    quality: 'medium',
    size: 'small',
    speed: 'fast',
    compatibility: 'universal',
    features: ['Social media', 'Looping', 'No audio', 'Universal']
  },
  {
    id: 'webm-av1',
    name: 'WebM (AV1)',
    extension: 'webm',
    icon: <Zap className="h-5 w-5" />,
    description: 'Próxima geração, máxima compressão',
    quality: 'ultra',
    size: 'small',
    speed: 'slow',
    compatibility: 'modern',
    features: ['Next-gen codec', 'Ultra compression', 'HDR support', 'Future-proof']
  }
]

const resolutions = [
  { value: '1920x1080', label: 'Full HD (1080p)', bitrate: 5000 },
  { value: '1280x720', label: 'HD (720p)', bitrate: 2500 },
  { value: '3840x2160', label: '4K UHD', bitrate: 15000 },
  { value: '2560x1440', label: 'QHD (1440p)', bitrate: 8000 },
  { value: '854x480', label: 'SD (480p)', bitrate: 1000 }
]

const cloudProviders: CloudProvider[] = [
  {
    id: 'google-drive',
    name: 'Google Drive',
    icon: <Cloud className="h-4 w-4" />,
    connected: false,
    quota: { used: 2.1, total: 15 }
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    icon: <Cloud className="h-4 w-4" />,
    connected: false,
    quota: { used: 1.2, total: 2 }
  },
  {
    id: 'onedrive',
    name: 'OneDrive',
    icon: <Cloud className="h-4 w-4" />,
    connected: false,
    quota: { used: 0.8, total: 5 }
  }
]

export function MultiFormatExporter({ 
  videoData, 
  onExportComplete 
}: { 
  videoData?: Record<string, unknown>
  onExportComplete?: (result: ExportJob[]) => void 
}) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>(exportFormats[0])
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: exportFormats[0],
    quality: {
      resolution: '1920x1080',
      bitrate: 5000,
      fps: 30
    },
    compression: {
      level: 50,
      method: 'standard'
    },
    watermark: false,
    trimming: {
      enabled: false,
      start: 0,
      end: 100
    },
    effects: {
      fadeIn: false,
      fadeOut: false,
      stabilization: false,
      colorCorrection: false
    },
    audio: {
      enabled: true,
      quality: 'high',
      normalize: true
    }
  })

  const [exportJobs, setExportJobs] = useState<ExportJob[]>([])
  const [isExporting, setIsExporting] = useState(false)
  const [batchMode, setBatchMode] = useState(false)
  const [selectedFormats, setSelectedFormats] = useState<string[]>([])
  const [cloudProviders_, setCloudProviders] = useState(cloudProviders)

  const updateExportOptions = (updates: Partial<ExportOptions>) => {
    setExportOptions(prev => ({ ...prev, ...updates }))
  }

  const getEstimatedFileSize = (): string => {
    const baseSize = 50 // MB base
    const resolutionMultiplier = exportOptions.quality.resolution === '3840x2160' ? 4 : 
                                exportOptions.quality.resolution === '1920x1080' ? 2 : 1
    const compressionDivider = exportOptions.compression.level / 50
    const formatMultiplier = selectedFormat.id === 'mov-prores' ? 3 : 
                           selectedFormat.id === 'gif-animated' ? 0.3 : 1

    const estimatedSize = (baseSize * resolutionMultiplier * formatMultiplier) / compressionDivider
    
    return estimatedSize > 1000 ? 
      `${(estimatedSize / 1000).toFixed(1)}GB` : 
      `${Math.round(estimatedSize)}MB`
  }

  const getEstimatedTime = (): string => {
    const baseTime = 60 // seconds base
    const qualityMultiplier = selectedFormat.quality === 'ultra' ? 3 : 
                             selectedFormat.quality === 'high' ? 2 : 1
    const speedDivider = selectedFormat.speed === 'fast' ? 2 : 
                        selectedFormat.speed === 'slow' ? 0.5 : 1

    const estimatedSeconds = (baseTime * qualityMultiplier) / speedDivider
    
    if (estimatedSeconds > 3600) {
      return `${Math.round(estimatedSeconds / 3600)}h ${Math.round((estimatedSeconds % 3600) / 60)}m`
    } else if (estimatedSeconds > 60) {
      return `${Math.round(estimatedSeconds / 60)}m ${Math.round(estimatedSeconds % 60)}s`
    }
    return `${Math.round(estimatedSeconds)}s`
  }

  const startExport = async () => {
    if (batchMode && selectedFormats.length === 0) {
      toast.error('Selecione pelo menos um formato para exportação em lote')
      return
    }

    setIsExporting(true)
    
    const formatsToExport = batchMode ? 
      exportFormats.filter(f => selectedFormats.includes(f.id)) : 
      [selectedFormat]

    const newJobs: ExportJob[] = formatsToExport.map(format => ({
      id: `export_${Date.now()}_${format.id}`,
      format,
      status: 'pending',
      progress: 0,
      startTime: Date.now(),
      estimatedTime: parseInt(getEstimatedTime()) * 1000
    }))

    setExportJobs(prev => [...prev, ...newJobs])

    // Simular processo de exportação
    for (const job of newJobs) {
      updateJobStatus(job.id, 'processing')
      
      // Simular progresso
      for (let progress = 0; progress <= 100; progress += Math.random() * 10 + 5) {
        await new Promise(resolve => setTimeout(resolve, 200))
        updateJobProgress(job.id, Math.min(progress, 100))
      }

      // Finalizar job
      updateJobStatus(job.id, 'completed', `https://example.com/video.${job.format.extension}`)
      toast.success(`${job.format.name} exportado com sucesso!`)
    }

    setIsExporting(false)
    onExportComplete?.(newJobs)
  }

  const updateJobStatus = (jobId: string, status: ExportJob['status'], outputUrl?: string, error?: string) => {
    setExportJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, status, outputUrl, error } : job
    ))
  }

  const updateJobProgress = (jobId: string, progress: number) => {
    setExportJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, progress } : job
    ))
  }

  const cancelExport = (jobId: string) => {
    updateJobStatus(jobId, 'error', undefined, 'Cancelado pelo usuário')
    toast.success('Exportação cancelada')
  }

  const downloadFile = (job: ExportJob) => {
    if (job.outputUrl) {
      // Simular download
      const link = document.createElement('a')
      link.href = job.outputUrl
      link.download = `video.${job.format.extension}`
      link.click()
      toast.success('Download iniciado!')
    }
  }

  const connectCloudProvider = (providerId: string) => {
    // Simular conexão
    setCloudProviders(prev => prev.map(provider => 
      provider.id === providerId ? { ...provider, connected: true } : provider
    ))
    toast.success('Conectado com sucesso!')
  }

  const uploadToCloud = async (job: ExportJob, providerId: string) => {
    toast.success(`Enviando para ${cloudProviders_.find(p => p.id === providerId)?.name}...`)
    // Simular upload
    await new Promise(resolve => setTimeout(resolve, 2000))
    toast.success('Upload concluído!')
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportador Multi-Formato
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Format Selection */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Formatos de Exportação</h3>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm">Lote</Label>
                    <Switch
                      checked={batchMode}
                      onCheckedChange={setBatchMode}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {exportFormats.map((format) => (
                    <motion.div
                      key={format.id}
                      className={`
                        p-4 border-2 rounded-lg cursor-pointer transition-all
                        ${(!batchMode && selectedFormat.id === format.id) || 
                          (batchMode && selectedFormats.includes(format.id)) ? 
                          'border-blue-500 bg-blue-50 dark:bg-blue-950' : 
                          'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                        }
                      `}
                      onClick={() => {
                        if (batchMode) {
                          setSelectedFormats(prev => 
                            prev.includes(format.id) ? 
                            prev.filter(id => id !== format.id) :
                            [...prev, format.id]
                          )
                        } else {
                          setSelectedFormat(format)
                          updateExportOptions({ format })
                        }
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {format.icon}
                          <div>
                            <h4 className="font-semibold">{format.name}</h4>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">
                              .{format.extension}
                            </p>
                          </div>
                        </div>
                        {batchMode && (
                          <Checkbox
                            checked={selectedFormats.includes(format.id)}
                            onChange={() => {}}
                          />
                        )}
                      </div>

                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                        {format.description}
                      </p>

                      <div className="flex flex-wrap gap-1 mb-3">
                        {format.features.slice(0, 3).map((feature, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-3">
                          <div className={`
                            px-2 py-1 rounded-full text-xs font-medium
                            ${format.quality === 'ultra' ? 'bg-purple-100 text-purple-800' :
                              format.quality === 'high' ? 'bg-green-100 text-green-800' :
                              format.quality === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'}
                          `}>
                            {format.quality}
                          </div>
                          <div className="flex items-center gap-1 text-gray-500">
                            <HardDrive className="h-3 w-3" />
                            {format.size}
                          </div>
                          <div className="flex items-center gap-1 text-gray-500">
                            <Cpu className="h-3 w-3" />
                            {format.speed}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Export Options */}
              {!batchMode && (
                <Tabs defaultValue="quality" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="quality">Qualidade</TabsTrigger>
                    <TabsTrigger value="effects">Efeitos</TabsTrigger>
                    <TabsTrigger value="trim">Cortes</TabsTrigger>
                    <TabsTrigger value="audio">Áudio</TabsTrigger>
                  </TabsList>

                  <TabsContent value="quality" className="space-y-4">
                    <div>
                      <Label>Resolução</Label>
                      <Select 
                        value={exportOptions.quality.resolution} 
                        onValueChange={(value) => {
                          const resolution = resolutions.find(r => r.value === value)
                          updateExportOptions({ 
                            quality: { 
                              ...exportOptions.quality, 
                              resolution: value,
                              bitrate: resolution?.bitrate || 5000
                            }
                          })
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {resolutions.map(res => (
                            <SelectItem key={res.value} value={res.value}>
                              {res.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>FPS</Label>
                      <Select 
                        value={exportOptions.quality.fps.toString()} 
                        onValueChange={(value) => updateExportOptions({ 
                          quality: { ...exportOptions.quality, fps: parseInt(value) }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="24">24 FPS (Cinema)</SelectItem>
                          <SelectItem value="30">30 FPS (Padrão)</SelectItem>
                          <SelectItem value="60">60 FPS (Suave)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Compressão ({exportOptions.compression.level}%)</Label>
                      <Slider
                        value={[exportOptions.compression.level]}
                        onValueChange={([value]) => updateExportOptions({
                          compression: { ...exportOptions.compression, level: value }
                        })}
                        min={10}
                        max={100}
                        step={10}
                        className="mt-2"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Menor arquivo</span>
                        <span>Melhor qualidade</span>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="effects" className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Fade In/Out</Label>
                        <div className="flex gap-2">
                          <Switch
                            checked={exportOptions.effects.fadeIn}
                            onCheckedChange={(checked) => updateExportOptions({
                              effects: { ...exportOptions.effects, fadeIn: checked }
                            })}
                          />
                          <Label className="text-sm">In</Label>
                          <Switch
                            checked={exportOptions.effects.fadeOut}
                            onCheckedChange={(checked) => updateExportOptions({
                              effects: { ...exportOptions.effects, fadeOut: checked }
                            })}
                          />
                          <Label className="text-sm">Out</Label>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>Estabilização de Vídeo</Label>
                        <Switch
                          checked={exportOptions.effects.stabilization}
                          onCheckedChange={(checked) => updateExportOptions({
                            effects: { ...exportOptions.effects, stabilization: checked }
                          })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>Correção de Cor</Label>
                        <Switch
                          checked={exportOptions.effects.colorCorrection}
                          onCheckedChange={(checked) => updateExportOptions({
                            effects: { ...exportOptions.effects, colorCorrection: checked }
                          })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label>Aplicar Watermark</Label>
                        <Switch
                          checked={exportOptions.watermark}
                          onCheckedChange={(checked) => updateExportOptions({ watermark: checked })}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="trim" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Ativar Corte</Label>
                      <Switch
                        checked={exportOptions.trimming.enabled}
                        onCheckedChange={(checked) => updateExportOptions({
                          trimming: { ...exportOptions.trimming, enabled: checked }
                        })}
                      />
                    </div>

                    {exportOptions.trimming.enabled && (
                      <>
                        <div>
                          <Label>Início ({exportOptions.trimming.start}%)</Label>
                          <Slider
                            value={[exportOptions.trimming.start]}
                            onValueChange={([value]) => updateExportOptions({
                              trimming: { ...exportOptions.trimming, start: value }
                            })}
                            min={0}
                            max={exportOptions.trimming.end - 1}
                            step={1}
                            className="mt-2"
                          />
                        </div>

                        <div>
                          <Label>Fim ({exportOptions.trimming.end}%)</Label>
                          <Slider
                            value={[exportOptions.trimming.end]}
                            onValueChange={([value]) => updateExportOptions({
                              trimming: { ...exportOptions.trimming, end: value }
                            })}
                            min={exportOptions.trimming.start + 1}
                            max={100}
                            step={1}
                            className="mt-2"
                          />
                        </div>
                      </>
                    )}
                  </TabsContent>

                  <TabsContent value="audio" className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Incluir Áudio</Label>
                      <Switch
                        checked={exportOptions.audio.enabled}
                        onCheckedChange={(checked) => updateExportOptions({
                          audio: { ...exportOptions.audio, enabled: checked }
                        })}
                      />
                    </div>

                    {exportOptions.audio.enabled && (
                      <>
                        <div>
                          <Label>Qualidade do Áudio</Label>
                          <Select 
                            value={exportOptions.audio.quality} 
                            onValueChange={(value) => updateExportOptions({
                              audio: { ...exportOptions.audio, quality: value }
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Baixa (128 kbps)</SelectItem>
                              <SelectItem value="medium">Média (192 kbps)</SelectItem>
                              <SelectItem value="high">Alta (320 kbps)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center justify-between">
                          <Label>Normalizar Áudio</Label>
                          <Switch
                            checked={exportOptions.audio.normalize}
                            onCheckedChange={(checked) => updateExportOptions({
                              audio: { ...exportOptions.audio, normalize: checked }
                            })}
                          />
                        </div>
                      </>
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </div>

            {/* Export Summary & Actions */}
            <div className="space-y-6">
              {/* Export Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Resumo da Exportação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Formato(s):</span>
                      <span className="text-sm font-medium">
                        {batchMode ? `${selectedFormats.length} formatos` : selectedFormat.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Resolução:</span>
                      <span className="text-sm font-medium">{exportOptions.quality.resolution}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Tamanho estimado:</span>
                      <span className="text-sm font-medium">{getEstimatedFileSize()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Tempo estimado:</span>
                      <span className="text-sm font-medium">{getEstimatedTime()}</span>
                    </div>
                  </div>

                  <Button 
                    onClick={startExport}
                    disabled={isExporting || (batchMode && selectedFormats.length === 0)}
                    className="w-full"
                    size="lg"
                  >
                    {isExporting ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Exportando...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Iniciar Exportação
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Cloud Storage */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Cloud className="h-4 w-4" />
                    Armazenamento na Nuvem
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {cloudProviders_.map(provider => (
                    <div key={provider.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        {provider.icon}
                        <div>
                          <p className="text-sm font-medium">{provider.name}</p>
                          <p className="text-xs text-gray-500">
                            {provider.quota.used}GB / {provider.quota.total}GB
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={provider.connected ? "outline" : "default"}
                        onClick={() => provider.connected ? null : connectCloudProvider(provider.id)}
                      >
                        {provider.connected ? 'Conectado' : 'Conectar'}
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Export Queue */}
              {exportJobs.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Fila de Exportação</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <AnimatePresence>
                      {exportJobs.slice(-3).map(job => (
                        <motion.div
                          key={job.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className="p-3 border rounded-lg"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {job.format.icon}
                              <div>
                                <p className="text-sm font-medium">{job.format.name}</p>
                                <p className="text-xs text-gray-500">
                                  {job.status === 'completed' && job.outputUrl ? 'Pronto para download' :
                                   job.status === 'processing' ? `${Math.round(job.progress)}% concluído` :
                                   job.status === 'error' ? job.error :
                                   'Na fila'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {job.status === 'completed' ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => downloadFile(job)}
                                  >
                                    <Download className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {/* Share logic */}}
                                  >
                                    <Share2 className="h-3 w-3" />
                                  </Button>
                                </>
                              ) : job.status === 'processing' ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => cancelExport(job.id)}
                                >
                                  ✕
                                </Button>
                              ) : job.status === 'error' ? (
                                <AlertCircle className="h-4 w-4 text-red-500" />
                              ) : (
                                <Clock className="h-4 w-4 text-gray-400" />
                              )}
                            </div>
                          </div>
                          
                          {job.status === 'processing' && (
                            <Progress value={job.progress} className="h-2" />
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
