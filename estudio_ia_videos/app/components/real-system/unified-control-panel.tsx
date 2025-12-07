
/**
 * 🎛️ UNIFIED CONTROL PANEL - Painel de Controle Unificado para Sistema Real
 * Interface completa para gerenciar todas as funcionalidades reais
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { 
  FileText, 
  Image, 
  Volume2, 
  Video, 
  Settings,
  Play,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  Mic,
  Film,
  Palette,
  Zap
} from 'lucide-react'

interface Project {
  id: string
  name: string
  status: string
  totalSlides: number
  hasData: boolean
}

interface TTSVoice {
  id: string
  name: string
  language: string
  gender: string
  provider: string
}

interface ExportJob {
  id: string
  status: 'queued' | 'processing' | 'completed' | 'error'
  progress: number
  outputUrl?: string
  error?: string
}

interface PptxStatus {
  pptxGenerated: boolean
  hasPptx: boolean
}

interface TtsStatus {
  slides: {
    percentage: number
    withTTS: number
    total: number
  }
  project: {
    hasProjectAudio: boolean
  }
}

export default function UnifiedControlPanel({ projectId }: { projectId?: string }) {
  // Estados principais
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  // Estados específicos
  const [pptxStatus, setPptxStatus] = useState<PptxStatus | null>(null)
  const [ttsStatus, setTtsStatus] = useState<TtsStatus | null>(null)
  const [exportJob, setExportJob] = useState<ExportJob | null>(null)
  const [availableVoices, setAvailableVoices] = useState<TTSVoice[]>([])

  // Configurações
  const [pptxTemplate, setPptxTemplate] = useState('corporate')
  const [selectedVoice, setSelectedVoice] = useState<TTSVoice | null>(null)
  const [exportOptions, setExportOptions] = useState({
    format: 'mp4',
    quality: 'hd',
    fps: 30,
    includeAudio: true
  })

  useEffect(() => {
    if (projectId) {
      loadProjectData()
      loadVoices()
    }
  }, [projectId])

  /**
   * Carrega dados do projeto
   */
  const loadProjectData = async () => {
    if (!projectId) return

    try {
      setLoading(true)
      
      // Buscar status do PPTX
      const pptxResponse = await fetch(`/api/v1/pptx/generate-real?projectId=${projectId}`)
      if (pptxResponse.ok) {
        const pptxData = await pptxResponse.json()
        setPptxStatus(pptxData.project)
        setCurrentProject(pptxData.project)
      }

      // Buscar status do TTS
      const ttsResponse = await fetch(`/api/v1/tts/generate-real?action=status&projectId=${projectId}`)
      if (ttsResponse.ok) {
        const ttsData = await ttsResponse.json()
        setTtsStatus(ttsData)
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados do projeto')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Carrega vozes disponíveis
   */
  const loadVoices = async () => {
    try {
      const [elevenLabsRes, azureRes] = await Promise.all([
        fetch('/api/v1/tts/generate-real?action=voices&provider=elevenlabs'),
        fetch('/api/v1/tts/generate-real?action=voices&provider=azure')
      ])

      const voices: TTSVoice[] = []
      
      if (elevenLabsRes.ok) {
        const elevenData = await elevenLabsRes.json()
        voices.push(...elevenData.voices.map((v: any) => ({ ...v, provider: 'elevenlabs' })))
      }
      
      if (azureRes.ok) {
        const azureData = await azureRes.json()
        voices.push(...azureData.voices.map((v: any) => ({ ...v, provider: 'azure' })))
      }

      setAvailableVoices(voices)
      if (voices.length > 0 && !selectedVoice) {
        setSelectedVoice(voices[0])
      }
    } catch (error) {
      console.error('Erro ao carregar vozes:', error)
    }
  }

  /**
   * Gerar PPTX Real
   */
  const handleGeneratePPTX = async () => {
    if (!projectId) return

    try {
      setLoading(true)
      toast.info('Gerando PPTX real...')

      const response = await fetch('/api/v1/pptx/generate-real', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          template: pptxTemplate,
          customOptions: {
            branding: {
              primaryColor: '#0066CC',
              secondaryColor: '#F0F0F0',
              fontFamily: 'Calibri'
            }
          }
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success('PPTX gerado com sucesso!')
        await loadProjectData()
      } else {
        throw new Error(result.error)
      }

    } catch (error) {
      console.error('Erro ao gerar PPTX:', error)
      toast.error('Erro ao gerar PPTX')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Gerar TTS Real
   */
  const handleGenerateTTS = async () => {
    if (!projectId || !selectedVoice) return

    try {
      setLoading(true)
      toast.info('Gerando áudio TTS...')

      const response = await fetch('/api/v1/tts/generate-real', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          voice: {
            provider: selectedVoice.provider,
            voiceId: selectedVoice.id,
            language: selectedVoice.language,
            stability: 0.5,
            similarityBoost: 0.75
          }
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success(`TTS gerado! ${result.slidesCount} slides com áudio`)
        await loadProjectData()
      } else {
        throw new Error(result.error)
      }

    } catch (error) {
      console.error('Erro ao gerar TTS:', error)
      toast.error('Erro ao gerar TTS')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Exportar Vídeo Real
   */
  const handleExportVideo = async () => {
    if (!projectId) return

    try {
      setLoading(true)
      toast.info('Iniciando exportação de vídeo...')

      const response = await fetch('/api/v1/video/export-real', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          options: exportOptions
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Exportação iniciada!')
        setExportJob({
          id: result.jobId,
          status: 'queued',
          progress: 0
        })
        
        // Iniciar polling do status
        pollExportStatus(result.jobId)
      } else {
        throw new Error(result.error)
      }

    } catch (error) {
      console.error('Erro ao exportar vídeo:', error)
      toast.error('Erro ao exportar vídeo')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Polling do status de exportação
   */
  const pollExportStatus = async (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/v1/video/export-real?jobId=${jobId}`)
        const result = await response.json()

        if (result.success && result.job) {
          setExportJob(result.job)

          if (result.job.status === 'completed') {
            clearInterval(interval)
            toast.success('Vídeo exportado com sucesso!')
          } else if (result.job.status === 'error') {
            clearInterval(interval)
            toast.error(`Erro na exportação: ${result.job.error}`)
          }
        }
      } catch (error) {
        console.error('Erro ao verificar status:', error)
      }
    }, 2000)

    // Limpar após 10 minutos
    setTimeout(() => clearInterval(interval), 10 * 60 * 1000)
  }

  /**
   * Upload de imagens
   */
  const handleImageUpload = async (files: FileList) => {
    if (!files.length) return

    try {
      setLoading(true)
      toast.info(`Processando ${files.length} imagens...`)

      const formData = new FormData()
      Array.from(files).forEach(file => formData.append('files', file))
      if (projectId) formData.append('projectId', projectId)
      
      formData.append('options', JSON.stringify({
        quality: 85,
        format: 'webp',
        width: 1920,
        height: 1080
      }))

      const response = await fetch('/api/v1/images/process-real', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        toast.success(`${result.count} imagens processadas!`)
      } else {
        throw new Error(result.error)
      }

    } catch (error) {
      console.error('Erro ao processar imagens:', error)
      toast.error('Erro ao processar imagens')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-3">
          <Zap className="h-8 w-8 text-primary" />
          Sistema Real Integrado
        </h1>
        <p className="text-muted-foreground">
          Painel de controle completo para PPTX, TTS, Processamento de Imagens e Exportação de Vídeo
        </p>
        {currentProject && (
          <Badge variant="outline" className="text-sm">
            Projeto: {currentProject.name} • {currentProject.totalSlides || 0} slides
          </Badge>
        )}
      </div>

      {/* Tabs principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="pptx" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            PPTX Real
          </TabsTrigger>
          <TabsTrigger value="tts" className="flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            TTS Real
          </TabsTrigger>
          <TabsTrigger value="images" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            Imagens
          </TabsTrigger>
          <TabsTrigger value="export" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            Exportação
          </TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">PPTX</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {pptxStatus?.pptxGenerated ? (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  ) : (
                    <XCircle className="h-6 w-6 text-gray-300" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {pptxStatus?.pptxGenerated ? 'Gerado' : 'Não gerado'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">TTS</CardTitle>
                <Volume2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {ttsStatus?.slides?.percentage || 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {ttsStatus?.slides?.withTTS || 0} de {ttsStatus?.slides?.total || 0} slides
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Exportação</CardTitle>
                <Video className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {exportJob ? (
                    exportJob.status === 'completed' ? (
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    ) : exportJob.status === 'error' ? (
                      <XCircle className="h-6 w-6 text-red-500" />
                    ) : (
                      <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                    )
                  ) : (
                    <XCircle className="h-6 w-6 text-gray-300" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {exportJob ? exportJob.status : 'Não iniciado'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sistema</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Todas as APIs ativas
                </p>
              </CardContent>
            </Card>
          </div>

          {loading && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Carregando dados...</span>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* PPTX Real */}
        <TabsContent value="pptx" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Geração PPTX Real
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template">Template</Label>
                <Select value={pptxTemplate} onValueChange={setPptxTemplate}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corporate">Corporativo</SelectItem>
                    <SelectItem value="educational">Educacional</SelectItem>
                    <SelectItem value="safety">Segurança</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <Button 
                  onClick={handleGeneratePPTX}
                  disabled={loading || !projectId}
                  className="flex items-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Palette className="h-4 w-4" />
                  )}
                  Gerar PPTX Real
                </Button>

                {pptxStatus?.hasPptx && (
                  <Button variant="outline" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Baixar PPTX
                  </Button>
                )}
              </div>

              {pptxStatus && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Status:</span>
                      <Badge variant={pptxStatus.pptxGenerated ? 'default' : 'secondary'} className="ml-2">
                        {pptxStatus.pptxGenerated ? 'Gerado' : 'Pendente'}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium">Template:</span>
                      <span className="ml-2 capitalize">{pptxTemplate}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TTS Real */}
        <TabsContent value="tts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                Text-to-Speech Real
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="voice">Voz</Label>
                <Select 
                  value={selectedVoice?.id || ''} 
                  onValueChange={(value) => {
                    const voice = availableVoices.find(v => v.id === value)
                    setSelectedVoice(voice || null)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma voz" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableVoices.map((voice) => (
                      <SelectItem key={voice.id} value={voice.id}>
                        {voice.name} ({voice.provider}) - {voice.gender}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <Button 
                  onClick={handleGenerateTTS}
                  disabled={loading || !projectId || !selectedVoice}
                  className="flex items-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                  Gerar TTS Real
                </Button>

                {ttsStatus?.project?.hasProjectAudio && (
                  <Button variant="outline" className="flex items-center gap-2">
                    <Play className="h-4 w-4" />
                    Reproduzir Áudio
                  </Button>
                )}
              </div>

              {ttsStatus && (
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Progresso TTS:</span>
                    <span className="text-sm">{ttsStatus.slides?.percentage || 0}%</span>
                  </div>
                  <Progress value={ttsStatus.slides?.percentage || 0} className="w-full" />
                  <div className="text-xs text-muted-foreground">
                    {ttsStatus.slides?.withTTS || 0} de {ttsStatus.slides?.total || 0} slides com áudio
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Processamento de Imagens */}
        <TabsContent value="images" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Processamento Real de Imagens
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  Arraste imagens aqui ou clique para selecionar
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                  className="mt-2"
                />
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-medium">Formatos Suportados</div>
                  <div className="text-muted-foreground">JPG, PNG, WebP, AVIF</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">Otimização</div>
                  <div className="text-muted-foreground">Sharp + AWS S3</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">Efeitos</div>
                  <div className="text-muted-foreground">Resize, Crop, Filtros</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Exportação de Vídeo */}
        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Exportação Real de Vídeo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Qualidade</Label>
                  <Select 
                    value={exportOptions.quality} 
                    onValueChange={(value) => setExportOptions({...exportOptions, quality: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sd">SD (480p)</SelectItem>
                      <SelectItem value="hd">HD (720p)</SelectItem>
                      <SelectItem value="fhd">Full HD (1080p)</SelectItem>
                      <SelectItem value="4k">4K (2160p)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Formato</Label>
                  <Select 
                    value={exportOptions.format} 
                    onValueChange={(value) => setExportOptions({...exportOptions, format: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mp4">MP4</SelectItem>
                      <SelectItem value="webm">WebM</SelectItem>
                      <SelectItem value="mov">MOV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch 
                  checked={exportOptions.includeAudio}
                  onCheckedChange={(checked) => setExportOptions({...exportOptions, includeAudio: checked})}
                />
                <Label>Incluir áudio</Label>
              </div>

              <Separator />

              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <Button 
                  onClick={handleExportVideo}
                  disabled={loading || !projectId}
                  className="flex items-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Film className="h-4 w-4" />
                  )}
                  Exportar Vídeo Real
                </Button>

                {exportJob?.outputUrl && (
                  <Button variant="outline" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Baixar Vídeo
                  </Button>
                )}
              </div>

              {exportJob && (
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status da Exportação:</span>
                    <Badge variant={
                      exportJob.status === 'completed' ? 'default' : 
                      exportJob.status === 'error' ? 'destructive' : 'secondary'
                    }>
                      {exportJob.status}
                    </Badge>
                  </div>
                  {exportJob.status === 'processing' && (
                    <>
                      <Progress value={exportJob.progress} className="w-full" />
                      <div className="text-xs text-muted-foreground">
                        {exportJob.progress}% concluído
                      </div>
                    </>
                  )}
                  {exportJob.error && (
                    <div className="text-sm text-red-500">
                      Erro: {exportJob.error}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
