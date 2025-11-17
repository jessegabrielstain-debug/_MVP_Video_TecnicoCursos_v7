

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Progress } from '../ui/progress'
import { Separator } from '../ui/separator'
import { 
  Download,
  Settings,
  Play,
  Pause,
  FileVideo,
  Image,
  Package,
  Upload,
  Youtube,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap,
  Sparkles,
  Eye,
  BarChart3
} from 'lucide-react'
import { MultiFormatExportEngine, ExportConfiguration, ExportJob, ExportTemplate } from '../../lib/export/multi-format-engine'

const FPS_VALUES = [24, 30, 60] as const
type FpsValue = (typeof FPS_VALUES)[number]

const isFpsValue = (value: number): value is FpsValue =>
  FPS_VALUES.some((fps) => fps === value)

interface ExportStudioProps {
  projectId: string
  projectData: {
    title: string
    duration: number
    scenes: number
    thumbnail: string
  }
}

export default function ExportStudio({ projectId, projectData }: ExportStudioProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<ExportTemplate | null>(null)
  const [configuration, setConfiguration] = useState<Partial<ExportConfiguration>>({
    project_id: projectId,
    export_format: 'mp4',
    quality_settings: {
      resolution: '1080p',
      bitrate: 5000,
      fps: 30,
      audio_quality: 'high'
    },
    advanced_options: {
      include_captions: true,
      include_transcripts: true,
      include_interactive_elements: true,
      brand_watermark: true
    }
  })
  const [activeJobs, setActiveJobs] = useState<ExportJob[]>([])
  const [isExporting, setIsExporting] = useState(false)
  const [exportHistory, setExportHistory] = useState<ExportJob[]>([])

  useEffect(() => {
    loadExportHistory()
    loadActiveJobs()
  }, [projectId])

  const loadExportHistory = async () => {
    // Simular histórico de exportações
    const mockHistory: ExportJob[] = [
      {
        id: 'export-1',
        project_id: projectId,
        configuration: configuration as ExportConfiguration,
        status: 'completed',
        progress: 100,
        started_at: new Date(Date.now() - 3600000).toISOString(),
        completed_at: new Date(Date.now() - 3300000).toISOString(),
        output_files: [
          {
            format: 'mp4',
            url: '/downloads/video.mp4',
            size_bytes: 125 * 1024 * 1024,
            duration_seconds: 300
          }
        ],
        metadata: {
          total_scenes: 8,
          total_duration: 300,
          file_size_estimate: 125 * 1024 * 1024,
          processing_time_estimate: 180
        }
      }
    ]
    setExportHistory(mockHistory)
  }

  const loadActiveJobs = async () => {
    // Verificar jobs ativos
    setActiveJobs([])
  }

  const handleTemplateSelect = (template: ExportTemplate) => {
    setSelectedTemplate(template)
    setConfiguration({
      ...configuration,
      ...template.configuration
    })
  }

  const handleStartExport = async () => {
    if (!configuration.export_format) return

    setIsExporting(true)
    try {
      const job = await MultiFormatExportEngine.startExport(configuration as ExportConfiguration)
      setActiveJobs(prev => [...prev, job])
      
      // Simular atualizações de progresso
      const progressInterval = setInterval(async () => {
        const updatedJob = await MultiFormatExportEngine.getExportStatus(job.id)
        
        setActiveJobs(prev => 
          prev.map(j => j.id === job.id ? updatedJob : j)
        )

        if (updatedJob.status === 'completed' || updatedJob.status === 'failed') {
          clearInterval(progressInterval)
          setExportHistory(prev => [updatedJob, ...prev])
          setActiveJobs(prev => prev.filter(j => j.id !== job.id))
        }
      }, 2000)

    } catch (error) {
      console.error('Erro ao iniciar exportação:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleOptimizeConfiguration = (target: 'speed' | 'quality' | 'size' | 'compatibility') => {
    const optimized = MultiFormatExportEngine.optimizeConfiguration(
      configuration as ExportConfiguration,
      target
    )
    setConfiguration(optimized)
  }

  const formatFileSize = (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 B'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Download className="h-6 w-6 text-blue-600" />
            Export Studio Multi-formato
          </h3>
          <p className="text-muted-foreground">
            Sistema profissional de exportação para múltiplas plataformas
          </p>
        </div>
        
        <div className="text-right text-sm text-muted-foreground">
          <p><strong>{projectData.title}</strong></p>
          <p>{formatDuration(projectData.duration)} • {projectData.scenes} cenas</p>
        </div>
      </div>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="custom">Personalizado</TabsTrigger>
          <TabsTrigger value="batch">Lote</TabsTrigger>
          <TabsTrigger value="active">Em Progresso</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        {/* Templates de Exportação */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Templates de Exportação</CardTitle>
              <CardDescription>
                Configurações pré-definidas otimizadas para diferentes usos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {MultiFormatExportEngine.EXPORT_TEMPLATES.map((template) => (
                  <Card 
                    key={template.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedTemplate?.id === template.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{template.name}</h4>
                          <p className="text-sm text-muted-foreground">{template.description}</p>
                        </div>
                        {template.popular && (
                          <Badge variant="secondary" className="text-xs">
                            Popular
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-2 text-xs text-muted-foreground">
                        <p>• Formato: {template.configuration.export_format?.toUpperCase()}</p>
                        <p>• Resolução: {template.configuration.quality_settings?.resolution}</p>
                        <p>• Qualidade: {template.configuration.quality_settings?.audio_quality}</p>
                      </div>
                      
                      <Button 
                        size="sm" 
                        className="w-full mt-3"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleTemplateSelect(template)
                        }}
                      >
                        Usar Template
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuração Personalizada */}
        <TabsContent value="custom" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Configurações Básicas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configurações Básicas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Formato de Exportação</label>
                  <Select 
                    value={configuration.export_format}
                    onValueChange={(value) => setConfiguration(prev => ({...prev, export_format: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mp4">🎥 MP4 - Vídeo Universal</SelectItem>
                      <SelectItem value="webm">🌐 WebM - Web Otimizado</SelectItem>
                      <SelectItem value="scorm">📚 SCORM - LMS Package</SelectItem>
                      <SelectItem value="html5">💻 HTML5 - Interactive</SelectItem>
                      <SelectItem value="gif">🎞️ GIF - Animação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Resolução</label>
                    <Select 
                      value={configuration.quality_settings?.resolution}
                      onValueChange={(value) => setConfiguration(prev => ({
                        ...prev, 
                        quality_settings: {...prev.quality_settings!, resolution: value}
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="720p">HD (720p)</SelectItem>
                        <SelectItem value="1080p">Full HD (1080p)</SelectItem>
                        <SelectItem value="4k">4K Ultra HD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">FPS</label>
                    <Select 
                      value={configuration.quality_settings?.fps?.toString()}
                      onValueChange={(value) =>
                        setConfiguration((prev) => {
                          if (!prev.quality_settings) {
                            return prev
                          }

                          const numericValue = Number(value)

                          if (!Number.isFinite(numericValue) || !isFpsValue(numericValue)) {
                            return prev
                          }

                          return {
                            ...prev,
                            quality_settings: {
                              ...prev.quality_settings,
                              fps: numericValue,
                            },
                          }
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24">24 FPS (Cinema)</SelectItem>
                        <SelectItem value="30">30 FPS (Standard)</SelectItem>
                        <SelectItem value="60">60 FPS (Smooth)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Bitrate (kbps)</label>
                  <Input
                    type="number"
                    value={configuration.quality_settings?.bitrate}
                    onChange={(e) => setConfiguration(prev => ({
                      ...prev, 
                      quality_settings: {...prev.quality_settings!, bitrate: parseInt(e.target.value)}
                    }))}
                    min="1000"
                    max="50000"
                    step="500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Qualidade do Áudio</label>
                  <Select 
                    value={configuration.quality_settings?.audio_quality}
                    onValueChange={(value) => setConfiguration(prev => ({
                      ...prev, 
                      quality_settings: {...prev.quality_settings!, audio_quality: value}
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard (128 kbps)</SelectItem>
                      <SelectItem value="high">High (256 kbps)</SelectItem>
                      <SelectItem value="lossless">Lossless (FLAC)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Opções Avançadas */}
            <Card>
              <CardHeader>
                <CardTitle>Opções Avançadas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Recursos Inclusos</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Legendas (SRT)</span>
                      <input 
                        type="checkbox"
                        checked={configuration.advanced_options?.include_captions}
                        onChange={(e) => setConfiguration(prev => ({
                          ...prev,
                          advanced_options: {...prev.advanced_options!, include_captions: e.target.checked}
                        }))}
                        className="rounded"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Transcrição Completa</span>
                      <input 
                        type="checkbox"
                        checked={configuration.advanced_options?.include_transcripts}
                        onChange={(e) => setConfiguration(prev => ({
                          ...prev,
                          advanced_options: {...prev.advanced_options!, include_transcripts: e.target.checked}
                        }))}
                        className="rounded"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Elementos Interativos</span>
                      <input 
                        type="checkbox"
                        checked={configuration.advanced_options?.include_interactive_elements}
                        onChange={(e) => setConfiguration(prev => ({
                          ...prev,
                          advanced_options: {...prev.advanced_options!, include_interactive_elements: e.target.checked}
                        }))}
                        className="rounded"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Marca D'água</span>
                      <input 
                        type="checkbox"
                        checked={configuration.advanced_options?.brand_watermark}
                        onChange={(e) => setConfiguration(prev => ({
                          ...prev,
                          advanced_options: {...prev.advanced_options!, brand_watermark: e.target.checked}
                        }))}
                        className="rounded"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Otimizações Rápidas</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleOptimizeConfiguration('speed')}
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      Velocidade
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleOptimizeConfiguration('quality')}
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      Qualidade
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleOptimizeConfiguration('size')}
                    >
                      <Package className="h-3 w-3 mr-1" />
                      Tamanho
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleOptimizeConfiguration('compatibility')}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Compatibilidade
                    </Button>
                  </div>
                </div>

                <Separator />

                <Button 
                  onClick={handleStartExport}
                  disabled={isExporting || !configuration.export_format}
                  className="w-full h-12"
                >
                  {isExporting ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Iniciando Exportação...
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
          </div>

          {/* Preview de Configuração */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview da Configuração
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Tamanho Estimado:</span>
                  <p>{formatFileSize(125 * 1024 * 1024)}</p>
                </div>
                <div>
                  <span className="font-medium">Tempo de Processamento:</span>
                  <p>{formatDuration(180)}</p>
                </div>
                <div>
                  <span className="font-medium">Formato Final:</span>
                  <p>{configuration.export_format?.toUpperCase()}</p>
                </div>
                <div>
                  <span className="font-medium">Qualidade:</span>
                  <p>{configuration.quality_settings?.resolution}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Exportação em Lote */}
        <TabsContent value="batch" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Exportação em Lote</CardTitle>
              <CardDescription>
                Exporte em múltiplos formatos simultaneamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Funcionalidade de lote em desenvolvimento</p>
                <p className="text-xs">Em breve você poderá exportar em vários formatos de uma vez</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Jobs Ativos */}
        <TabsContent value="active" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Exportações em Progresso</CardTitle>
            </CardHeader>
            <CardContent>
              {activeJobs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma exportação em progresso</p>
                  <p className="text-xs">Inicie uma nova exportação para acompanhar aqui</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeJobs.map((job) => (
                    <Card key={job.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium">{job.configuration.export_format?.toUpperCase()}</h4>
                            <p className="text-sm text-muted-foreground">
                              {job.configuration.quality_settings?.resolution} • {formatFileSize(job.metadata.file_size_estimate)}
                            </p>
                          </div>
                          <Badge variant={job.status === 'processing' ? 'default' : 'secondary'}>
                            {job.status}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progresso</span>
                            <span>{job.progress}%</span>
                          </div>
                          <Progress value={job.progress} className="h-2" />
                        </div>
                        
                        <div className="flex justify-between text-xs text-muted-foreground mt-2">
                          <span>Iniciado: {new Date(job.started_at).toLocaleTimeString()}</span>
                          <span>Tempo estimado: {formatDuration(job.metadata.processing_time_estimate)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Histórico */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Exportações</CardTitle>
            </CardHeader>
            <CardContent>
              {exportHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileVideo className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma exportação anterior</p>
                  <p className="text-xs">Suas exportações aparecerão aqui</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {exportHistory.map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          job.status === 'completed' ? 'bg-green-500' : 
                          job.status === 'failed' ? 'bg-red-500' : 'bg-gray-400'
                        }`} />
                        <div>
                          <h4 className="font-medium text-sm">
                            {job.configuration.export_format?.toUpperCase()} • {job.configuration.quality_settings?.resolution}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {new Date(job.started_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {formatFileSize(job.output_files[0]?.size_bytes || 0)}
                        </span>
                        {job.status === 'completed' && job.output_files.length > 0 && (
                          <Button size="sm" variant="outline">
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

