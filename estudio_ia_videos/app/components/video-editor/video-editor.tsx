'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Slider } from '../ui/slider'
import { Badge } from '../ui/badge'
import { Separator } from '../ui/separator'
import { Progress } from '../ui/progress'
import { Alert, AlertDescription } from '../ui/alert'
import { 
  Play, 
  Pause, 
  Square, 
  Download, 
  Upload,
  Trash2,
  Edit,
  Volume2,
  Image,
  Type,
  Palette,
  Clock,
  User,
  Settings,
  Eye,
  Zap,
  Loader2,
  CheckCircle,
  AlertCircle,
  Plus
} from 'lucide-react'
import { SlideData, VideoConfig, DEFAULT_VIDEO_CONFIG } from '../../lib/ai-services'
import { VideoProcessor, VideoScene } from '../../lib/video-processor'
import { AvatarService } from '../../lib/avatar-service'
import { TTSService } from '../../lib/tts-service'
import { Analytics } from '../../lib/analytics'
import { toast } from 'react-hot-toast'

interface VideoEditorProps {
  initialSlides?: SlideData[]
  projectId?: string
  onSave: (slides: SlideData[], config: VideoConfig) => void
  onPreview: (slides: SlideData[], config: VideoConfig) => void
  onExport: (slides: SlideData[], config: VideoConfig) => void
}

interface RenderJobStatus {
  id: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  progress: number
  outputUrl?: string
  error?: string
}

export default function VideoEditor({ 
  initialSlides = [], 
  projectId = `project_${Date.now()}`,
  onSave, 
  onPreview, 
  onExport 
}: VideoEditorProps) {
  // Estados principais
  const [slides, setSlides] = useState<SlideData[]>(initialSlides)
  const [selectedSlide, setSelectedSlide] = useState<string | null>(null)
  const [videoConfig, setVideoConfig] = useState<VideoConfig>(DEFAULT_VIDEO_CONFIG)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Estados para funcionalidades avançadas
  const [scenes, setScenes] = useState<VideoScene[]>([])
  const [previewJob, setPreviewJob] = useState<RenderJobStatus | null>(null)
  const [renderJob, setRenderJob] = useState<RenderJobStatus | null>(null)
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false)
  const [isGeneratingFinal, setIsGeneratingFinal] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState<string>('instructor-male')
  const [selectedVoice, setSelectedVoice] = useState<string>('pt-BR-AntonioNeural')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Inicializar analytics quando editor carrega
  useEffect(() => {
    Analytics.editorStarted(projectId)
  }, [projectId])

  // Atualizar cenas quando slides mudarem
  useEffect(() => {
    if (slides.length > 0) {
      convertSlidesToScenes()
    }
  }, [slides, selectedAvatar, selectedVoice])

  // Converter slides em cenas para processamento
  const convertSlidesToScenes = useCallback(async () => {
    try {
      const newScenes = await VideoProcessor.convertSlidesToScenes(slides, {
        ...videoConfig,
        avatarStyle: selectedAvatar,
        voiceModel: selectedVoice
      })
      setScenes(newScenes)
    } catch (error) {
      console.error('Erro ao converter slides em cenas:', error)
    }
  }, [slides, videoConfig, selectedAvatar, selectedVoice])

  // Gerenciar reordenação de slides via drag and drop
  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return

    const items = Array.from(slides)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setSlides(items)
    Analytics.track('slide_reordered', {
      project_id: projectId,
      from_index: result.source.index,
      to_index: result.destination.index
    })
  }, [slides, projectId])

  // Gerar preview rápido (<10s)
  const generateQuickPreview = useCallback(async () => {
    if (scenes.length === 0) {
      toast.error('Adicione slides antes de gerar preview')
      return
    }

    setIsGeneratingPreview(true)
    setPreviewJob(null)
    setPreviewUrl(null)

    try {
      const response = await fetch('/api/videos/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenes: scenes,
          projectId: projectId
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setPreviewJob({
          id: data.jobId,
          status: data.status,
          progress: data.progress
        })
        
        // Simular polling para status do preview
        pollPreviewStatus(data.jobId)
        toast.success('Preview iniciado! Aguarde alguns segundos...')
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Erro no preview:', error)
      toast.error('Erro ao gerar preview')
      setIsGeneratingPreview(false)
    }
  }, [scenes, projectId])

  // Poll status do preview
  const pollPreviewStatus = useCallback(async (jobId: string) => {
    const maxAttempts = 30 // 30 tentativas = ~30 segundos
    let attempts = 0

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setIsGeneratingPreview(false)
        toast.error('Timeout na geração do preview')
        return
      }

      try {
        const response = await fetch(`/api/render-status/${jobId}`)
        const data = await response.json()
        
        if (data.success) {
          const job = data.job
          setPreviewJob(job)

          if (job.status === 'completed') {
            setPreviewUrl(job.outputUrl)
            setIsGeneratingPreview(false)
            toast.success('Preview concluído!')
            return
          } else if (job.status === 'failed') {
            setIsGeneratingPreview(false)
            toast.error(`Erro no preview: ${job.error}`)
            return
          }
        }

        attempts++
        setTimeout(poll, 1000) // Poll a cada 1 segundo
      } catch (error) {
        console.error('Erro ao verificar status:', error)
        attempts++
        setTimeout(poll, 1000)
      }
    }

    poll()
  }, [])

  // Gerar vídeo final (1080p)
  const generateFinalVideo = useCallback(async () => {
    if (scenes.length === 0) {
      toast.error('Adicione slides antes de renderizar')
      return
    }

    setIsGeneratingFinal(true)
    setRenderJob(null)

    try {
      const response = await fetch('/api/render/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          type: 'video',
          priority: 'normal',
          metadata: {
            slides: slides,
            renderConfig: {
              resolution: '1080p',
              quality: 'high',
              format: 'mp4',
              fps: 30,
              includeSubtitles: true,
              includeWatermark: false,
              transitionStyle: 'fade',
              avatarSync: true
            }
          }
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setRenderJob({
          id: data.renderJob.id,
          status: data.renderJob.status,
          progress: data.renderJob.progress
        })
        
        toast.success(`Renderização iniciada!`)
        pollRenderStatus(data.renderJob.id)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Erro na renderização:', error)
      toast.error('Erro ao iniciar renderização')
      setIsGeneratingFinal(false)
    }
  }, [scenes, projectId, slides])

  // Poll status da renderização final
  const pollRenderStatus = useCallback(async (jobId: string) => {
    const maxAttempts = 300 // 300 tentativas = ~5 minutos
    let attempts = 0

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setIsGeneratingFinal(false)
        toast.error('Timeout na renderização final')
        return
      }

      try {
        const response = await fetch(`/api/render/jobs?jobId=${jobId}`)
        const data = await response.json()
        
        if (data.success) {
          const job = data.renderJob
          setRenderJob(job)

          if (job.status === 'completed') {
            setIsGeneratingFinal(false)
            toast.success('Vídeo final concluído! 🎉')
            onExport(slides, videoConfig)
            return
          } else if (job.status === 'failed') {
            setIsGeneratingFinal(false)
            toast.error(`Erro na renderização: ${job.errorMessage}`)
            return
          }
        }

        attempts++
        setTimeout(poll, 1000) // Poll a cada 1 segundo
      } catch (error) {
        console.error('Erro ao verificar status:', error)
        attempts++
        setTimeout(poll, 1000)
      }
    }

    poll()
  }, [slides, videoConfig, onExport])

  // Upload e conversão de PPTX melhorada
  const handlePPTXUpload = useCallback(async (file: File) => {
    if (!file) return

    const startTime = Date.now()
    Analytics.pptxImportStarted(file.name, file.size)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/upload/pptx', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      const duration = Date.now() - startTime

      if (data.success) {
        setSlides(data.slides)
        Analytics.pptxImportCompleted(file.name, data.slides.length, duration)
        toast.success(`${data.slides.length} slides importados com sucesso!`)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      
      Analytics.pptxImportFailed(file.name, errorMessage, duration)
      toast.error(`Erro na importação: ${errorMessage}`)
    }
  }, [])

  // Adicionar novo slide
  const addSlide = useCallback(() => {
    const newSlide: SlideData = {
      id: `slide_${Date.now()}`,
      title: 'Novo Slide',
      content: 'Digite o conteúdo do slide aqui...',
      duration: 15
    }
    setSlides([...slides, newSlide])
    setSelectedSlide(newSlide.id)
    
    Analytics.track('slide_added', {
      project_id: projectId,
      slides_count: slides.length + 1
    })
  }, [slides, projectId])

  // Remover slide
  const removeSlide = useCallback((slideId: string) => {
    setSlides(slides.filter(slide => slide.id !== slideId))
    if (selectedSlide === slideId) {
      setSelectedSlide(null)
    }
  }, [slides, selectedSlide])

  // Atualizar slide selecionado
  const updateSlide = useCallback((slideId: string, updates: Partial<SlideData>) => {
    setSlides(slides.map(slide => 
      slide.id === slideId ? { ...slide, ...updates } : slide
    ))
  }, [slides])

  // Calcular duração total do vídeo
  const totalDuration = slides.reduce((sum, slide) => sum + (slide.duration || 0), 0)

  const currentSlide = slides.find(slide => slide.id === selectedSlide)

  return (
    <div className="h-screen flex flex-col">
      {/* Header com controles principais */}
      <div className="border-b bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">Editor de Vídeo IA</h1>
            <Badge variant="outline">
              {slides.length} slides • {Math.floor(totalDuration / 60)}:{(totalDuration % 60).toString().padStart(2, '0')}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onPreview(slides, videoConfig)}>
              <Play className="w-4 h-4 mr-1" />
              Preview
            </Button>
            <Button variant="outline" size="sm" onClick={() => onSave(slides, videoConfig)}>
              Salvar
            </Button>
            <Button size="sm" onClick={() => onExport(slides, videoConfig)}>
              <Download className="w-4 h-4 mr-1" />
              Exportar
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Timeline lateral com slides */}
        <div className="w-80 border-r bg-gray-50 flex flex-col">
          <div className="p-4 border-b bg-white">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">Timeline</h3>
              <Button size="sm" variant="outline" onClick={addSlide}>
                + Slide
              </Button>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Importar PPTX
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pptx,.ppt"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  handlePPTXUpload(file)
                  // Reset file input
                  e.target.value = ''
                }
              }}
            />
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="slides">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    {slides.map((slide, index) => (
                      <Draggable key={slide.id} draggableId={slide.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`mb-2 p-3 bg-white rounded-lg border cursor-pointer transition-all ${
                              selectedSlide === slide.id 
                                ? 'border-blue-500 shadow-sm' 
                                : 'border-gray-200 hover:border-gray-300'
                            } ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                            onClick={() => setSelectedSlide(slide.id)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">
                                  {slide.title}
                                </div>
                                <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                                  {slide.content}
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                  <Clock className="w-3 h-3 text-gray-400" />
                                  <span className="text-xs text-gray-500">
                                    {slide.duration}s
                                  </span>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  removeSlide(slide.id)
                                }}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        </div>

        {/* Área principal de edição */}
        <div className="flex-1 flex flex-col">
          {/* Preview do vídeo */}
          <div className="flex-1 bg-gray-900 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl mx-4" style={{ aspectRatio: '16/9' }}>
              {currentSlide ? (
                <div className="w-full h-full p-8 flex flex-col items-center justify-center text-center">
                  <h2 className="text-2xl font-bold mb-4">{currentSlide.title}</h2>
                  <p className="text-gray-700 leading-relaxed">{currentSlide.content}</p>
                  {currentSlide.imageUrl && (
                    <div className="mt-4 w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Image className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  Selecione um slide para editar
                </div>
              )}
            </div>
          </div>

          {/* Controles de reprodução */}
          <div className="border-t bg-white p-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button variant="outline" size="sm">
                <Square className="w-4 h-4" />
              </Button>
              
              <div className="flex-1">
                <Slider
                  value={[currentTime]}
                  onValueChange={([value]) => setCurrentTime(value)}
                  max={totalDuration}
                  step={1}
                  className="w-full"
                />
              </div>
              
              <span className="text-sm text-gray-500 tabular-nums">
                {Math.floor(currentTime / 60)}:{(currentTime % 60).toString().padStart(2, '0')} / {Math.floor(totalDuration / 60)}:{(totalDuration % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>

        {/* Painel de propriedades */}
        <div className="w-80 border-l bg-gray-50">
          <div className="p-4 border-b bg-white">
            <h3 className="font-medium">Propriedades</h3>
          </div>
          
          <div className="p-4 space-y-6">
            {/* Configurações do slide atual */}
            {currentSlide && (
              <>
                <div>
                  <label className="text-sm font-medium mb-2 block">Título</label>
                  <Input
                    value={currentSlide.title}
                    onChange={(e) => updateSlide(currentSlide.id, { title: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Conteúdo</label>
                  <Textarea
                    value={currentSlide.content}
                    onChange={(e) => updateSlide(currentSlide.id, { content: e.target.value })}
                    rows={4}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Duração: {currentSlide.duration}s
                  </label>
                  <Slider
                    value={[currentSlide.duration || 5]}
                    onValueChange={([value]) => updateSlide(currentSlide.id, { duration: value })}
                    min={5}
                    max={60}
                    step={1}
                  />
                </div>
                
                <Separator />
              </>
            )}
            
            {/* Configurações gerais do vídeo */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Configurações do Vídeo
              </h4>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Modelo de Voz</label>
                  <Select
                    value={videoConfig.voiceModel}
                    onValueChange={(value) => setVideoConfig({ ...videoConfig, voiceModel: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR-AntonioNeural">Antonio (Masculino)</SelectItem>
                      <SelectItem value="pt-BR-FranciscaNeural">Francisca (Feminino)</SelectItem>
                      <SelectItem value="pt-BR-BrendaNeural">Brenda (Feminino)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Estilo do Avatar</label>
                  <Select
                    value={videoConfig.avatarStyle}
                    onValueChange={(value) => setVideoConfig({ ...videoConfig, avatarStyle: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="profissional">Profissional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="tecnico">Técnico</SelectItem>
                      <SelectItem value="instrutor">Instrutor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Fundo</label>
                  <Select
                    value={videoConfig.background}
                    onValueChange={(value) => setVideoConfig({ ...videoConfig, background: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="escritorio">Escritório</SelectItem>
                      <SelectItem value="industria">Ambiente Industrial</SelectItem>
                      <SelectItem value="sala-treinamento">Sala de Treinamento</SelectItem>
                      <SelectItem value="neutro">Fundo Neutro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
