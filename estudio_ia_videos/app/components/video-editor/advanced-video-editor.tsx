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
  Plus,
  FileVideo,
  School
} from 'lucide-react'
import { SlideData, VideoConfig, DEFAULT_VIDEO_CONFIG } from '../../lib/ai-services'
import { VideoProcessor, VideoScene } from '../../lib/video-processor'
import { AvatarService, AvatarDefinition } from '../../lib/avatar-service'
import { TTSService } from '../../lib/tts-service'
import { AdvancedVoiceLibrary } from '../../lib/voice-library-advanced'
import { Analytics } from '../../lib/analytics'
import AdvancedVoiceSelector from '../voice-selector-advanced'
import LMSExportInterface from '../lms-export-interface'
import { toast } from 'react-hot-toast'

interface AdvancedVideoEditorProps {
  initialSlides?: SlideData[]
  projectId?: string
  onSave: (slides: SlideData[], config: VideoConfig) => void
  onPreview: (slides: SlideData[], config: VideoConfig) => void
  onExport: (slides: SlideData[], config: VideoConfig) => void
}

interface Voice {
  id: string;
  name: string;
}

interface RenderJobStatus {
  id: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  progress: number
  outputUrl?: string
  error?: string
}

export default function AdvancedVideoEditor({ 
  initialSlides = [], 
  projectId = `project_${Date.now()}`,
  onSave, 
  onPreview, 
  onExport 
}: AdvancedVideoEditorProps) {
  // Estados principais
  const [slides, setSlides] = useState<SlideData[]>(initialSlides)
  const [selectedSlide, setSelectedSlide] = useState<string | null>(null)
  const [videoConfig, setVideoConfig] = useState<VideoConfig>(DEFAULT_VIDEO_CONFIG)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Estados avançados
  const [scenes, setScenes] = useState<VideoScene[]>([])
  const [previewJob, setPreviewJob] = useState<RenderJobStatus | null>(null)
  const [renderJob, setRenderJob] = useState<RenderJobStatus | null>(null)
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false)
  const [isGeneratingFinal, setIsGeneratingFinal] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState<string>('instructor-male')
  const [selectedVoice, setSelectedVoice] = useState<string>('pt-BR-AntonioNeural')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [showLMSExport, setShowLMSExport] = useState(false)

  // Obter dados dos serviços
  const avatars = AvatarService.getAllAvatars()
  const voices = TTSService.getAvailableVoices('pt-BR')

  useEffect(() => {
    Analytics.editorStarted(projectId)
  }, [projectId])

  // Gerar preview rápido
  const generateQuickPreview = useCallback(async () => {
    if (slides.length === 0) {
      toast.error('Adicione slides antes de gerar preview')
      return
    }

    setIsGeneratingPreview(true)
    try {
      const mockScenes = slides.map(slide => ({
        id: slide.id,
        type: 'slide' as const,
        content: slide.content,
        duration: (slide.duration || 5) * 1000,
        position: 0
      }))

      const response = await fetch('/api/videos/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenes: mockScenes, projectId })
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Preview gerado com sucesso!')
        setPreviewUrl(`/api/videos/preview/${data.jobId}.mp4`)
      }
    } catch (error) {
      toast.error('Erro ao gerar preview')
    } finally {
      setTimeout(() => setIsGeneratingPreview(false), 2000)
    }
  }, [slides, projectId])

  // Gerar vídeo final
  const generateFinalVideo = useCallback(async () => {
    if (slides.length === 0) {
      toast.error('Adicione slides antes de renderizar')
      return
    }

    setIsGeneratingFinal(true)
    try {
      const mockScenes = slides.map(slide => ({
        id: slide.id,
        type: 'slide' as const,
        content: slide.content,
        duration: (slide.duration || 5) * 1000,
        position: 0
      }))

      const response = await fetch('/api/videos/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenes: mockScenes, projectId, quality: 'fhd' })
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Renderização iniciada! Aguarde...')
        // Simular conclusão após 5 segundos
        setTimeout(() => {
          setIsGeneratingFinal(false)
          toast.success('Vídeo final concluído! 🎉')
          onExport(slides, videoConfig)
        }, 5000)
      }
    } catch (error) {
      toast.error('Erro na renderização')
      setIsGeneratingFinal(false)
    }
  }, [slides, projectId, videoConfig, onExport])

  // Upload PPTX
  const handlePPTXUpload = useCallback(async (file: File) => {
    if (!file) return

    Analytics.pptxImportStarted(file.name, file.size)
    
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/upload/pptx', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      if (data.success) {
        setSlides(data.slides)
        Analytics.pptxImportCompleted(file.name, data.slides.length, 1000)
        toast.success(`${data.slides.length} slides importados!`)
      }
    } catch (error) {
      Analytics.pptxImportFailed(file.name, 'Erro de upload', 1000)
      toast.error('Erro na importação')
    }
  }, [])

  // Drag and Drop
  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return

    const items = Array.from(slides)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setSlides(items)
    Analytics.track('slide_reordered', { project_id: projectId })
  }, [slides, projectId])

  // Adicionar slide
  const addSlide = useCallback(() => {
    const newSlide: SlideData = {
      id: `slide_${Date.now()}`,
      title: 'Novo Slide',
      content: 'Digite o conteúdo aqui...',
      duration: 15
    }
    setSlides([...slides, newSlide])
    setSelectedSlide(newSlide.id)
    Analytics.track('slide_added', { project_id: projectId })
  }, [slides, projectId])

  const removeSlide = useCallback((slideId: string) => {
    setSlides(slides.filter(slide => slide.id !== slideId))
    if (selectedSlide === slideId) setSelectedSlide(null)
  }, [slides, selectedSlide])

  const updateSlide = useCallback((slideId: string, updates: Partial<SlideData>) => {
    setSlides(slides.map(slide => 
      slide.id === slideId ? { ...slide, ...updates } : slide
    ))
  }, [slides])

  const totalDuration = slides.reduce((sum, slide) => sum + (slide.duration || 0), 0)
  const currentSlide = slides.find(slide => slide.id === selectedSlide)

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header Avançado */}
      <div className="border-b bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">Editor Avançado de Vídeo IA</h1>
            <Badge variant="outline">
              {slides.length} slides • {Math.floor(totalDuration / 60)}:{(totalDuration % 60).toString().padStart(2, '0')}
            </Badge>
            {scenes.length > 0 && (
              <Badge variant="secondary">
                {scenes.length} cenas processadas
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={generateQuickPreview}
              disabled={isGeneratingPreview || slides.length === 0}
            >
              {isGeneratingPreview ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Gerando Preview...
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-1" />
                  Preview Rápido
                </>
              )}
            </Button>
            
            <Button variant="outline" size="sm" onClick={() => onSave(slides, videoConfig)}>
              Salvar
            </Button>

            <Button 
              variant="outline"
              size="sm" 
              onClick={() => setShowLMSExport(true)}
              disabled={slides.length === 0}
            >
              <School className="w-4 h-4 mr-1" />
              Export LMS
            </Button>
            
            <Button 
              size="sm" 
              onClick={generateFinalVideo}
              disabled={isGeneratingFinal || slides.length === 0}
              className="bg-gradient-to-r from-blue-600 to-purple-600"
            >
              {isGeneratingFinal ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Renderizando...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-1" />
                  Gerar Final (1080p)
                </>
              )}
            </Button>
          </div>
        </div>
        
        {/* Progress Bars */}
        {(isGeneratingPreview || isGeneratingFinal) && (
          <div className="mt-3 space-y-2">
            {isGeneratingPreview && previewJob && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Preview (360p)</span>
                  <span>{previewJob.progress}%</span>
                </div>
                <Progress value={previewJob.progress} className="h-2" />
              </div>
            )}
            
            {isGeneratingFinal && renderJob && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Render Final (1080p)</span>
                  <span>{renderJob.progress}%</span>
                </div>
                <Progress value={renderJob.progress} className="h-2" />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 flex">
        {/* Timeline Lateral com Drag & Drop */}
        <div className="w-80 border-r bg-white flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">Timeline de Slides</h3>
              <Button size="sm" variant="outline" onClick={addSlide}>
                <Plus className="w-4 h-4 mr-1" />
                Slide
              </Button>
            </div>
            
            <div className="space-y-2">
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
                  if (file) handlePPTXUpload(file)
                }}
              />
            </div>
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
                                ? 'border-blue-500 shadow-md ring-2 ring-blue-100' 
                                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                            } ${snapshot.isDragging ? 'shadow-lg rotate-1 scale-105' : ''}`}
                            onClick={() => setSelectedSlide(slide.id)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate mb-1">
                                  {slide.title}
                                </div>
                                <div className="text-xs text-gray-500 line-clamp-2 mb-2">
                                  {slide.content}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-gray-400">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {slide.duration}s
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Type className="w-3 h-3" />
                                    {slide.content.length} chars
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  removeSlide(slide.id)
                                }}
                              >
                                <Trash2 className="w-3 h-3 text-red-500" />
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
            
            {slides.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <FileVideo className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm">Nenhum slide ainda</p>
                <p className="text-xs">Adicione slides ou importe um PPTX</p>
              </div>
            )}
          </div>
        </div>

        {/* Preview Central */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 bg-gray-900 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl" style={{ aspectRatio: '16/9' }}>
              {previewUrl ? (
                <div className="w-full h-full rounded-lg overflow-hidden">
                  <video 
                    src={previewUrl} 
                    controls 
                    className="w-full h-full"
                    poster="/images/video-placeholder.jpg"
                  />
                </div>
              ) : currentSlide ? (
                <div className="w-full h-full p-8 flex flex-col items-center justify-center text-center">
                  <div className="max-w-2xl">
                    <h2 className="text-3xl font-bold mb-6 text-gray-800">
                      {currentSlide.title}
                    </h2>
                    <div className="prose prose-lg text-gray-700 leading-relaxed">
                      {currentSlide.content}
                    </div>
                    {currentSlide.imageUrl && (
                      <div className="mt-6 w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center mx-auto">
                        <Image className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Avatar Preview */}
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-center gap-3 text-sm text-blue-700">
                        <User className="w-4 h-4" />
                        <span>
                          Avatar: {avatars.find((a: AvatarDefinition) => a.id === selectedAvatar)?.name ?? 'Avatar padrão'}
                        </span>
                        <Volume2 className="w-4 h-4" />
                        <span>
                          Voz: {voices.find((v: Voice) => v.id === selectedVoice)?.name ?? 'Voz padrão'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Eye className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">Área de Preview</p>
                    <p className="text-sm">Selecione um slide para editar ou gere um preview</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Controles de Reprodução */}
          <div className="border-t bg-white p-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPlaying(!isPlaying)}
                disabled={!previewUrl}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button variant="outline" size="sm" disabled={!previewUrl}>
                <Square className="w-4 h-4" />
              </Button>
              
              <div className="flex-1">
                <Slider
                  value={[currentTime]}
                  onValueChange={([value]) => setCurrentTime(value)}
                  max={totalDuration}
                  step={1}
                  className="w-full"
                  disabled={!previewUrl}
                />
              </div>
              
              <span className="text-sm text-gray-500 tabular-nums min-w-[100px]">
                {Math.floor(currentTime / 60)}:{(currentTime % 60).toString().padStart(2, '0')} / {Math.floor(totalDuration / 60)}:{(totalDuration % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>

        {/* Painel de Configurações Avançadas */}
        <div className="w-80 border-l bg-white">
          <div className="p-4 border-b">
            <h3 className="font-medium flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Configurações IA
            </h3>
          </div>
          
          <div className="p-4 space-y-6 overflow-y-auto">
            {/* Editor de Slide Atual */}
            {currentSlide && (
              <>
                <div>
                  <label className="text-sm font-medium mb-2 block">Título</label>
                  <Input
                    value={currentSlide.title}
                    onChange={(e) => updateSlide(currentSlide.id, { title: e.target.value })}
                    placeholder="Título do slide"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Conteúdo</label>
                  <Textarea
                    value={currentSlide.content}
                    onChange={(e) => updateSlide(currentSlide.id, { content: e.target.value })}
                    rows={6}
                    placeholder="Digite o conteúdo que será narrado..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {currentSlide.content.length} caracteres • ~{Math.ceil(currentSlide.content.length / 150)}s de fala
                  </p>
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
            
            {/* Avatar Selection */}
            <div>
              <label className="text-sm font-medium mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                Avatar Falante
              </label>
              
              <div className="space-y-2">
                {avatars.map((avatar: AvatarDefinition) => (
                  <div
                    key={avatar.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedAvatar === avatar.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => {
                      setSelectedAvatar(avatar.id)
                      Analytics.avatarSelected(avatar.id, projectId)
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        <User className="w-6 h-6 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{avatar.name}</div>
                        <div className="text-xs text-gray-500 mt-1">{avatar.description ?? 'Descrição não disponível'}</div>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {avatar.style ?? 'custom'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />
            
            {/* Advanced Voice Selection */}
            <div>
              <AdvancedVoiceSelector
                selectedVoiceId={selectedVoice}
                onVoiceSelect={(voiceId) => {
                  setSelectedVoice(voiceId)
                  Analytics.voiceSelected(voiceId, 'pt-BR', projectId)
                }}
                contentType="technical"
                showRecommendations={true}
              />
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
                  <SelectItem value="office">Escritório</SelectItem>
                  <SelectItem value="industrial">Ambiente Industrial</SelectItem>
                  <SelectItem value="training-room">Sala de Treinamento</SelectItem>
                  <SelectItem value="neutral">Fundo Neutro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status de Renderização */}
            {(renderJob || previewJob) && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Status de Processamento</h4>
                  
                  {previewJob && (
                    <Alert>
                      <Eye className="w-4 h-4" />
                      <AlertDescription>
                        Preview: {previewJob.status}
                        {previewJob.progress > 0 && ` (${previewJob.progress}%)`}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {renderJob && (
                    <Alert>
                      <Zap className="w-4 h-4" />
                      <AlertDescription>
                        Render Final: {renderJob.status}
                        {renderJob.progress > 0 && ` (${renderJob.progress}%)`}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* LMS Export Modal */}
      {showLMSExport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto m-4 w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Exportar para LMS</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLMSExport(false)}
                >
                  ✕
                </Button>
              </div>
              
              <LMSExportInterface
                slides={slides}
                config={videoConfig}
                projectTitle="Treinamento de Segurança"
                videoUrl={previewUrl || "/videos/demo.mp4"}
                onExport={(format, packageUrl) => {
                  Analytics.track('lms_export_completed', {
                    project_id: projectId,
                    format: format,
                    slides_count: slides.length
                  })
                  toast.success(`Pacote ${format} exportado com sucesso!`)
                  setShowLMSExport(false)
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
