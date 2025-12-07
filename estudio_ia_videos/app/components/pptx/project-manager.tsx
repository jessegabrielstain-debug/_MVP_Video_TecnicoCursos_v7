'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileText, 
  Play, 
  Pause, 
  Download, 
  Share2, 
  Settings,
  Eye,
  Edit3,
  Clock,
  User,
  Calendar,
  Layers,
  Volume2,
  Subtitles,
  Video,
  Image,
  Palette,
  Wand2
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface ProjectSlide {
  id: string
  title: string
  content: string
  notes: string
  thumbnail: string
  duration: number
  animations: string[]
  voiceover?: {
    text: string
    voice: string
    speed: number
    pitch: number
  }
}

interface ProjectData {
  id: string
  name: string
  fileName: string
  status: 'processing' | 'ready' | 'rendering' | 'completed' | 'error'
  createdAt: string
  updatedAt: string
  totalSlides: number
  totalDuration: number
  progress: number
  slides: ProjectSlide[]
  settings: {
    resolution: string
    fps: number
    quality: string
    theme: string,
    voiceSettings: {
      enabled: boolean
      voice: string
      speed: number
      pitch: number
    }
    transitions: {
      type: string
      duration: number
    }
  }
}

interface ProjectManagerProps {
  projectId?: string
  onProjectUpdate?: (project: ProjectData) => void
}

export function ProjectManager({ projectId, onProjectUpdate }: ProjectManagerProps) {
  const [project, setProject] = useState<ProjectData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeSlide, setActiveSlide] = useState(0)
  const [isRendering, setIsRendering] = useState(false)

  // Mock project data - em produção viria de uma API
  const mockProject: ProjectData = {
    id: projectId || 'proj-001',
    name: 'Treinamento NR-35 - Trabalho em Altura',
    fileName: 'nr35-treinamento.pptx',
    status: 'ready',
    createdAt: '2024-10-11T10:30:00Z',
    updatedAt: '2024-10-11T11:15:00Z',
    totalSlides: 25,
    totalDuration: 320, // segundos
    progress: 100,
    slides: [
      {
        id: 'slide-001',
        title: 'Introdução ao Trabalho em Altura',
        content: 'Conceitos básicos e importância da segurança em trabalhos em altura conforme NR-35.',
        notes: 'Enfatizar estatísticas de acidentes e importância do treinamento.',
        thumbnail: '/slides/slide-001-thumb.jpg',
        duration: 15,
        animations: ['fadeIn', 'slideFromLeft'],
        voiceover: {
          text: 'Bem-vindos ao treinamento de Trabalho em Altura conforme NR-35.',
          voice: 'pt-BR-Francisca',
          speed: 1.0,
          pitch: 1.0
        }
      },
      {
        id: 'slide-002',
        title: 'Definições e Conceitos',
        content: 'Definição legal de trabalho em altura e principais riscos associados.',
        notes: 'Mostrar exemplos práticos de situações que se enquadram na NR-35.',
        thumbnail: '/slides/slide-002-thumb.jpg',
        duration: 18,
        animations: ['fadeIn', 'zoomIn'],
        voiceover: {
          text: 'Considera-se trabalho em altura toda atividade executada acima de 2 metros.',
          voice: 'pt-BR-Francisca',
          speed: 1.0,
          pitch: 1.0
        }
      },
      {
        id: 'slide-003',
        title: 'Equipamentos de Proteção Individual',
        content: 'EPIs obrigatórios para trabalho em altura e suas especificações técnicas.',
        notes: 'Demonstrar uso correto de cada EPI.',
        thumbnail: '/slides/slide-003-thumb.jpg',
        duration: 22,
        animations: ['slideFromRight', 'bounceIn'],
        voiceover: {
          text: 'Os EPIs são fundamentais para garantir a segurança do trabalhador.',
          voice: 'pt-BR-Francisca',
          speed: 1.0,
          pitch: 1.0
        }
      }
    ],
    settings: {
      resolution: '1920x1080',
      fps: 30,
      quality: 'high',
      theme: 'professional-blue',
      voiceSettings: {
        enabled: true,
        voice: 'pt-BR-Francisca',
        speed: 1.0,
        pitch: 1.0
      },
      transitions: {
        type: 'fade',
        duration: 0.5
      }
    }
  }

  useEffect(() => {
    // Simular carregamento do projeto
    const loadProject = async () => {
      setIsLoading(true)
      await new Promise(resolve => setTimeout(resolve, 1000))
      setProject(mockProject)
      setIsLoading(false)
    }

    if (projectId) {
      loadProject()
    }
  }, [projectId])

  const handleSlideUpdate = (slideId: string, updates: Partial<ProjectSlide>) => {
    if (!project) return

    const updatedSlides = project.slides.map(slide =>
      slide.id === slideId ? { ...slide, ...updates } : slide
    )

    const updatedProject = {
      ...project,
      slides: updatedSlides,
      updatedAt: new Date().toISOString()
    }

    setProject(updatedProject)
    if (onProjectUpdate) {
      onProjectUpdate(updatedProject)
    }
    toast.success('Slide atualizado!')
  }

  const handleProjectSettings = (settings: Partial<ProjectData['settings']>) => {
    if (!project) return

    const updatedProject = {
      ...project,
      settings: { ...project.settings, ...settings },
      updatedAt: new Date().toISOString()
    }

    setProject(updatedProject)
    if (onProjectUpdate) {
      onProjectUpdate(updatedProject)
    }
    toast.success('Configurações atualizadas!')
  }

  const handleRenderVideo = async () => {
    if (!project) return

    setIsRendering(true)
    toast('Iniciando renderização do vídeo...', { icon: 'ℹ️' })

    try {
      // Simular processo de renderização
      for (let progress = 0; progress <= 100; progress += 5) {
        await new Promise(resolve => setTimeout(resolve, 200))
        // Aqui atualizaria o progresso real da renderização
      }

      toast.success('Vídeo renderizado com sucesso!')
      // Aqui iniciaria o download ou mostraria o link do vídeo
    } catch (error) {
      toast.error('Erro na renderização do vídeo')
    } finally {
      setIsRendering(false)
    }
  }

  const handlePreviewSlide = (slideIndex: number) => {
    setActiveSlide(slideIndex)
    toast(`Visualizando slide ${slideIndex + 1}`, { icon: 'ℹ️' })
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Video className="mr-2 h-5 w-5 text-blue-600" />
            Editor de Projeto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Carregando projeto...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!project) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Video className="mr-2 h-5 w-5 text-blue-600" />
            Editor de Projeto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="font-medium text-gray-700 mb-2">Nenhum projeto selecionado</h3>
            <p className="text-sm text-gray-500">
              Faça upload de um arquivo PPTX para começar
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header do Projeto */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Video className="mr-2 h-5 w-5 text-blue-600" />
                {project.name}
              </CardTitle>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-1" />
                  {project.fileName}
                </div>
                <div className="flex items-center">
                  <Layers className="h-4 w-4 mr-1" />
                  {project.totalSlides} slides
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {formatDuration(project.totalDuration)}
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(project.updatedAt).toLocaleDateString('pt-BR')}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={project.status === 'ready' ? 'default' : 'secondary'}>
                {project.status === 'ready' ? 'Pronto' : 'Processando'}
              </Badge>
              <Button
                onClick={handleRenderVideo}
                disabled={isRendering || project.status !== 'ready'}
                className="flex items-center"
              >
                {isRendering ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Renderizando...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Gerar Vídeo
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs do Editor */}
      <Tabs defaultValue="slides" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="slides">
            <Layers className="mr-2 h-4 w-4" />
            Slides
          </TabsTrigger>
          <TabsTrigger value="voice">
            <Volume2 className="mr-2 h-4 w-4" />
            Áudio
          </TabsTrigger>
          <TabsTrigger value="design">
            <Palette className="mr-2 h-4 w-4" />
            Design
          </TabsTrigger>
          <TabsTrigger value="export">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </TabsTrigger>
        </TabsList>

        {/* Tab de Slides */}
        <TabsContent value="slides" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lista de Slides */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Slides ({project.slides.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                  {project.slides.map((slide, index) => (
                    <div
                      key={slide.id}
                      className={`p-3 border rounded cursor-pointer transition-colors ${
                        activeSlide === index 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handlePreviewSlide(index)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-12 h-8 bg-gray-100 rounded flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm line-clamp-1">
                            {slide.title}
                          </h4>
                          <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                            {slide.content}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-400">
                              {formatDuration(slide.duration)}
                            </span>
                            {slide.voiceover && (
                              <Volume2 className="h-3 w-3 text-green-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Preview do Slide */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      Slide {activeSlide + 1}: {project.slides[activeSlide]?.title}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline">
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit3 className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Preview Area */}
                  <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Image className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                      <h3 className="font-medium text-gray-700 mb-2">
                        {project.slides[activeSlide]?.title}
                      </h3>
                      <p className="text-sm text-gray-500 max-w-md">
                        {project.slides[activeSlide]?.content}
                      </p>
                    </div>
                  </div>

                  {/* Controles do Slide */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Duração</label>
                        <div className="text-lg font-bold text-blue-600">
                          {formatDuration(project.slides[activeSlide]?.duration || 0)}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Animações</label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {project.slides[activeSlide]?.animations.map(animation => (
                            <Badge key={animation} variant="outline" className="text-xs">
                              {animation}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Notas do Apresentador */}
                    <div>
                      <label className="text-sm font-medium">Notas do Apresentador</label>
                      <p className="text-sm text-gray-600 mt-1 p-2 bg-gray-50 rounded">
                        {project.slides[activeSlide]?.notes}
                      </p>
                    </div>

                    {/* Configuração de Voz */}
                    {project.slides[activeSlide]?.voiceover && (
                      <div className="border rounded p-3 bg-green-50">
                        <label className="text-sm font-medium flex items-center">
                          <Volume2 className="mr-2 h-4 w-4 text-green-600" />
                          Narração Configurada
                        </label>
                        <p className="text-sm text-gray-600 mt-1">
                          "{project.slides[activeSlide].voiceover?.text}"
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>Voz: {project.slides[activeSlide].voiceover?.voice}</span>
                          <span>Velocidade: {project.slides[activeSlide].voiceover?.speed}x</span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Tab de Áudio */}
        <TabsContent value="voice" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Volume2 className="mr-2 h-5 w-5 text-blue-600" />
                Configurações de Áudio e Narração
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Configurações Globais</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">Voz Padrão</label>
                      <select className="w-full mt-1 p-2 border rounded">
                        <option value="pt-BR-Francisca">Francisca (Feminina)</option>
                        <option value="pt-BR-Antonio">Antonio (Masculino)</option>
                        <option value="pt-BR-Camila">Camila (Feminina)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Velocidade</label>
                      <input 
                        type="range" 
                        min="0.5" 
                        max="2" 
                        step="0.1" 
                        defaultValue="1"
                        className="w-full mt-1"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-medium">Estatísticas</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Slides com narração:</span>
                      <span className="text-sm font-medium">
                        {project.slides.filter(s => s.voiceover).length}/{project.slides.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Duração total:</span>
                      <span className="text-sm font-medium">
                        {formatDuration(project.totalDuration)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Design */}
        <TabsContent value="design" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Palette className="mr-2 h-5 w-5 text-blue-600" />
                Configurações de Design
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Tema Visual</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {['professional-blue', 'corporate-gray', 'modern-green', 'elegant-purple'].map(theme => (
                      <div 
                        key={theme}
                        className={`p-3 border rounded cursor-pointer ${
                          project.settings.theme === theme ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                        onClick={() => handleProjectSettings({ theme })}
                      >
                        <div className="h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded mb-2"></div>
                        <p className="text-xs text-center">{theme.replace('-', ' ')}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-medium">Transições</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">Tipo de Transição</label>
                      <select 
                        className="w-full mt-1 p-2 border rounded"
                        value={project.settings.transitions.type}
                        onChange={(e) => handleProjectSettings({
                          transitions: { ...project.settings.transitions, type: e.target.value }
                        })}
                      >
                        <option value="fade">Fade</option>
                        <option value="slide">Slide</option>
                        <option value="zoom">Zoom</option>
                        <option value="flip">Flip</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Duração (segundos)</label>
                      <input 
                        type="number" 
                        min="0.1" 
                        max="3" 
                        step="0.1"
                        value={project.settings.transitions.duration}
                        onChange={(e) => handleProjectSettings({
                          transitions: { ...project.settings.transitions, duration: parseFloat(e.target.value) }
                        })}
                        className="w-full mt-1 p-2 border rounded"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Exportação */}
        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Download className="mr-2 h-5 w-5 text-blue-600" />
                Exportar Vídeo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Configurações de Vídeo</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">Resolução</label>
                      <select 
                        className="w-full mt-1 p-2 border rounded"
                        value={project.settings.resolution}
                        onChange={(e) => handleProjectSettings({ resolution: e.target.value })}
                      >
                        <option value="1920x1080">1920x1080 (Full HD)</option>
                        <option value="1280x720">1280x720 (HD)</option>
                        <option value="3840x2160">3840x2160 (4K)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">FPS</label>
                      <select 
                        className="w-full mt-1 p-2 border rounded"
                        value={project.settings.fps}
                        onChange={(e) => handleProjectSettings({ fps: parseInt(e.target.value) })}
                      >
                        <option value="24">24 fps</option>
                        <option value="30">30 fps</option>
                        <option value="60">60 fps</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Qualidade</label>
                      <select 
                        className="w-full mt-1 p-2 border rounded"
                        value={project.settings.quality}
                        onChange={(e) => handleProjectSettings({ quality: e.target.value })}
                      >
                        <option value="high">Alta</option>
                        <option value="medium">Média</option>
                        <option value="low">Baixa</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-medium">Previsão</h3>
                  <div className="space-y-3 p-4 bg-gray-50 rounded">
                    <div className="flex justify-between">
                      <span className="text-sm">Duração:</span>
                      <span className="text-sm font-medium">
                        {formatDuration(project.totalDuration)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Tamanho estimado:</span>
                      <span className="text-sm font-medium">
                        ~{Math.round(project.totalDuration * 2.5)} MB
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Tempo de renderização:</span>
                      <span className="text-sm font-medium">
                        ~{Math.round(project.totalDuration / 10)} min
                      </span>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleRenderVideo}
                    disabled={isRendering}
                    className="w-full"
                    size="lg"
                  >
                    {isRendering ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Renderizando... 
                      </>
                    ) : (
                      <>
                        <Wand2 className="mr-2 h-4 w-4" />
                        Gerar Vídeo Final
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}