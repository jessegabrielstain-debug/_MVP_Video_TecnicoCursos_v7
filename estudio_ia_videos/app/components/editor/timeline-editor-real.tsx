'use client'

/**
 * 🎬 EDITOR TIMELINE FUNCIONAL - Sprint 17
 * Editor visual profissional inspirado no Animaker
 * Converte mockup em funcionalidade real
 */

import React, { useState, useRef, useEffect } from 'react'
import { logger } from '@/lib/logger'
import { useDrag, useDrop, DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Download,
  Upload,
  Save,
  Undo,
  Redo,
  Copy,
  Trash2,
  Plus,
  Settings,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Layers,
  Type,
  Image,
  Video,
  Mic,
  Music,
  Zap,
  Crop,
  RotateCw,
  Move,
  MousePointer,
  Hand,
  Scissors,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Maximize,
  Grid,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Users,
  MessageCircle,
  Share2
} from 'lucide-react'
import { PropertiesPanel } from './properties-panel'
import { ExportDialog, ExportOptions } from './export-dialog'
import { ExportHistoryDialog } from './export-history-dialog'
import { RenderProgressDialog } from './render-progress-dialog'
import { HeyGenCreditsWidget } from './heygen-credits-widget'
import { useToast } from '@/components/ui/use-toast'

interface TimelineElement {
  id: string
  type: 'video' | 'image' | 'text' | 'audio' | 'voice' | 'effect' | 'avatar'
  name: string
  startTime: number
  duration: number
  track: number
  content: {
    src?: string
    text?: string
    style?: any
    volume?: number
    effects?: string[]
  }
  // Visual properties for canvas
  x?: number
  y?: number
  width?: number
  height?: number
  rotation?: number
  opacity?: number
  style?: any
  metadata?: any
  animation?: any
  
  locked: boolean
  visible: boolean
}

interface Track {
  id: string
  type: 'video' | 'audio' | 'text' | 'effect'
  name: string
  locked: boolean
  visible: boolean
  height: number
}

const TIMELINE_SCALE = 10 // pixels per second
const TRACK_HEIGHT = 60

export default function TimelineEditorReal() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [totalDuration, setTotalDuration] = useState(300) // 5 minutes
  const [volume, setVolume] = useState([80])
  const [zoom, setZoom] = useState(100)
  const [selectedElements, setSelectedElements] = useState<string[]>([])
  const [draggedElement, setDraggedElement] = useState<TimelineElement | null>(null)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [tool, setTool] = useState<'select' | 'move' | 'cut' | 'zoom'>('select')
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [isExportHistoryOpen, setIsExportHistoryOpen] = useState(false)
  const [isRenderProgressOpen, setIsRenderProgressOpen] = useState(false)
  const [currentRenderJobId, setCurrentRenderJobId] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()
  
  const timelineRef = useRef<HTMLDivElement>(null)
  const playheadRef = useRef<HTMLDivElement>(null)

  const [tracks, setTracks] = useState<Track[]>([
    { id: 'video-1', type: 'video', name: 'Vídeo Principal', locked: false, visible: true, height: TRACK_HEIGHT },
    { id: 'text-1', type: 'text', name: 'Títulos e Textos', locked: false, visible: true, height: TRACK_HEIGHT },
    { id: 'avatar-1', type: 'video', name: 'Avatar IA', locked: false, visible: true, height: TRACK_HEIGHT },
    { id: 'audio-1', type: 'audio', name: 'Narração (TTS)', locked: false, visible: true, height: TRACK_HEIGHT },
    { id: 'music-1', type: 'audio', name: 'Música de Fundo', locked: false, visible: true, height: TRACK_HEIGHT },
    { id: 'effects-1', type: 'effect', name: 'Efeitos Especiais', locked: false, visible: true, height: TRACK_HEIGHT }
  ])

  const [elements, setElements] = useState<TimelineElement[]>([
    {
      id: 'element-1',
      type: 'image',
      name: 'Slide 1 - Introdução NR-12',
      startTime: 0,
      duration: 30,
      track: 0,
      content: { src: '/nr12-intro.jpg' },
      x: 0, y: 0, width: 1920, height: 1080,
      locked: false,
      visible: true
    },
    {
      id: 'element-avatar-1',
      type: 'avatar',
      name: 'Avatar Instrutor',
      startTime: 0,
      duration: 30,
      track: 2,
      content: { src: '' },
      x: 1200, y: 300, width: 600, height: 800,
      metadata: {
        engine: 'heygen',
        avatarId: 'default_avatar',
        avatarName: 'Instrutor Padrão',
        voiceId: '2d5b0e6cf361460aa7fc47e3eee4ba54' // Default voice
      },
      locked: false,
      visible: true
    },
    {
      id: 'element-2',
      type: 'text',
      name: 'Título: Segurança em Máquinas',
      startTime: 2,
      duration: 28,
      track: 1,
      content: { 
        text: 'NR-12: Segurança em Máquinas e Equipamentos',
        style: { fontSize: 32, fontWeight: 'bold', color: '#ffffff' }
      },
      x: 100, y: 100, width: 800, height: 200,
      style: { fontSize: 32, fontWeight: 'bold', color: '#ffffff' },
      locked: false,
      visible: true
    },
    {
      id: 'element-3',
      type: 'voice',
      name: 'Narração - Introdução',
      startTime: 5,
      duration: 25,
      track: 3,
      content: { 
        text: 'Bem-vindos ao treinamento sobre segurança em máquinas e equipamentos...',
        volume: 85
      },
      locked: false,
      visible: true
    },
    {
      id: 'element-4',
      type: 'image',
      name: 'Slide 2 - Objetivos',
      startTime: 30,
      duration: 25,
      track: 0,
      content: { src: '/nr12-objetivos.jpg' },
      x: 0, y: 0, width: 1920, height: 1080,
      locked: false,
      visible: true
    },
    {
      id: 'element-5',
      type: 'audio',
      name: 'Música de Fundo',
      startTime: 0,
      duration: 300,
      track: 4,
      content: { src: '/background-music.mp3', volume: 20 },
      locked: false,
      visible: true
    }
  ])

  // Colaboração
  const [collaborators] = useState([
    { id: '1', name: 'Ana Silva', avatar: '', status: 'online', cursor: { x: 100, y: 50 } },
    { id: '2', name: 'Carlos Santos', avatar: '', status: 'online', cursor: { x: 200, y: 100 } }
  ])

  const [comments] = useState([
    {
      id: 'comment-1',
      author: 'Ana Silva',
      timestamp: '2024-09-24T15:30:00Z',
      position: { time: 15, track: 1 },
      text: 'O título poderia ter um tamanho maior aqui?',
      resolved: false,
      replies: [
        {
          id: 'reply-1',
          author: 'Carlos Santos',
          timestamp: '2024-09-24T15:32:00Z',
          text: 'Concordo, vou ajustar o tamanho da fonte.'
        }
      ]
    }
  ])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= totalDuration) {
            setIsPlaying(false)
            return totalDuration
          }
          return prev + 0.1 * playbackSpeed
        })
      }, 100)
    }
    return () => clearInterval(interval)
  }, [isPlaying, totalDuration, playbackSpeed])

  const handlePlay = () => {
    if (currentTime >= totalDuration) {
      setCurrentTime(0)
    }
    setIsPlaying(!isPlaying)
  }

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return
    
    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const newTime = (x / TIMELINE_SCALE) * (100 / zoom)
    
    setCurrentTime(Math.max(0, Math.min(newTime, totalDuration)))
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 100)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
  }

  const getElementStyle = (element: TimelineElement) => {
    return {
      left: `${element.startTime * TIMELINE_SCALE * (zoom / 100)}px`,
      width: `${element.duration * TIMELINE_SCALE * (zoom / 100)}px`,
      height: `${TRACK_HEIGHT - 8}px`,
      top: '4px'
    }
  }

  const getElementColor = (type: string) => {
    switch (type) {
      case 'video': return 'bg-blue-500'
      case 'image': return 'bg-green-500'
      case 'text': return 'bg-purple-500'
      case 'voice': return 'bg-orange-500'
      case 'audio': return 'bg-cyan-500'
      case 'effect': return 'bg-pink-500'
      case 'avatar': return 'bg-indigo-500'
      default: return 'bg-gray-500'
    }
  }

  const TimelineElement = ({ element, trackIndex }: { element: TimelineElement; trackIndex: number }) => {
    const [{ isDragging }, drag] = useDrag({
      type: 'timeline-element',
      item: { element, trackIndex },
      collect: (monitor) => ({
        isDragging: monitor.isDragging()
      })
    })

    return (
      <div
        ref={drag as unknown as React.LegacyRef<HTMLDivElement>}
        className={cn(
          "absolute rounded cursor-move border border-white/20 text-white text-xs font-medium flex items-center px-2 select-none",
          getElementColor(element.type),
          isDragging && 'opacity-50',
          selectedElements.includes(element.id) && 'ring-2 ring-white',
          element.locked && 'cursor-not-allowed opacity-60'
        )}
        style={getElementStyle(element)}
        onClick={() => {
          if (!selectedElements.includes(element.id)) {
            setSelectedElements([element.id])
          }
        }}
      >
        <div className="truncate">
          {element.name}
        </div>
        {element.locked && <Lock className="h-3 w-3 ml-1" />}
        {!element.visible && <EyeOff className="h-3 w-3 ml-1" />}
      </div>
    )
  }

  const TrackHeader = ({ track, index }: { track: Track; index: number }) => (
    <div className="w-48 h-16 border-b border-gray-200 bg-gray-50 flex items-center px-3 gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          const newTracks = [...tracks]
          newTracks[index].visible = !newTracks[index].visible
          setTracks(newTracks)
        }}
      >
        {track.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          const newTracks = [...tracks]
          newTracks[index].locked = !newTracks[index].locked
          setTracks(newTracks)
        }}
      >
        {track.locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
      </Button>
      
      <span className="text-sm font-medium truncate flex-1">{track.name}</span>
    </div>
  )

  const handleUpdateElement = (elementId: string, updates: any) => {
    setElements(prev => prev.map(el => 
      el.id === elementId ? { ...el, ...updates } : el
    ))
  }

  const handleDeleteElement = (elementId: string) => {
    setElements(prev => prev.filter(el => el.id !== elementId))
    setSelectedElements(prev => prev.filter(id => id !== elementId))
  }

  const handleDuplicateElement = (elementId: string) => {
    const element = elements.find(el => el.id === elementId)
    if (element) {
      const newElement = {
        ...element,
        id: `element-${Date.now()}`,
        name: `${element.name} (Cópia)`,
        startTime: element.startTime + 5 // Offset slightly
      }
      setElements(prev => [...prev, newElement])
    }
  }

  const handleExport = async (options: ExportOptions) => {
    setIsExporting(true)
    try {
      // Validate slides before export
      const validSlides = elements.filter(el => 
        (el.type === 'image' || el.type === 'video' || el.type === 'avatar') && el.visible
      )
      
      if (validSlides.length === 0) {
        toast({
          title: "Nenhum Conteúdo",
          description: "Adicione pelo menos uma imagem, vídeo ou avatar antes de exportar.",
          variant: "destructive"
        })
        return
      }

      // Prepare slides data for API
      const slidesData = validSlides.map((el, index) => ({
        id: el.id,
        imageUrl: el.content?.src || '',
        duration: el.duration,
        title: el.name,
        content: el.content?.text || '',
        avatar_config: el.type === 'avatar' ? {
          engine: el.metadata?.engine,
          avatarId: el.metadata?.avatarId,
          voiceId: el.metadata?.voiceId,
        } : undefined,
        transition: 'fade' as const,
        transitionDuration: 0.5,
      }))

      const projectId = 'editor-project-' + Date.now()
      
      const response = await fetch('/api/render/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          slides: slidesData,
          config: {
            test: options.mode === 'draft',
            quality: options.mode === 'production' ? 'high' : 'low',
            resolution: options.resolution === '1080p' ? 1080 : 720,
            format: options.format,
            width: options.resolution === '1080p' ? 1920 : 1280,
            height: options.resolution === '1080p' ? 1080 : 720,
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to start render job')
      }

      const data = await response.json()
      
      // Show progress dialog
      setCurrentRenderJobId(data.jobId)
      setIsRenderProgressOpen(true)
      
      toast({
        title: "Renderização Iniciada",
        description: `Modo: ${options.mode === 'draft' ? 'Rascunho' : 'Produção'}`,
      })

    } catch (error) {
      logger.error('Export failed', error instanceof Error ? error : new Error(String(error)), { component: 'TimelineEditorReal' })
      toast({
        title: "Erro na Exportação",
        description: error instanceof Error ? error.message : "Não foi possível iniciar a renderização.",
        variant: "destructive"
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleRenderComplete = (url: string) => {
    toast({
      title: "Vídeo Pronto!",
      description: "Seu vídeo foi renderizado com sucesso.",
    })
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-screen flex flex-col bg-gray-900 text-white">
        {/* Top Toolbar */}
        <div className="h-14 bg-gray-800 border-b border-gray-700 flex items-center px-4 gap-2">
          <div className="flex items-center gap-2 mr-4">
            <Button variant="ghost" size="sm">
              <Save className="h-4 w-4 mr-1" />
              Salvar
            </Button>
            <Button variant="ghost" size="sm">
              <Undo className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Redo className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="h-6 w-px bg-gray-600" />
          
          <div className="flex items-center gap-2 mr-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={tool === 'select' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setTool('select')}
                  >
                    <MousePointer className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Selecionar</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={tool === 'move' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setTool('move')}
                  >
                    <Move className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Mover</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={tool === 'cut' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setTool('cut')}
                  >
                    <Scissors className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Cortar</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="h-6 w-px bg-gray-600" />
          
          <div className="flex items-center gap-2 mr-4">
            <Button variant="ghost" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Texto
            </Button>
            <Button variant="ghost" size="sm">
              <Image className="h-4 w-4 mr-1" />
              Imagem
            </Button>
            <Button variant="ghost" size="sm">
              <Mic className="h-4 w-4 mr-1" />
              Áudio
            </Button>
            <Button variant="ghost" size="sm">
              <Zap className="h-4 w-4 mr-1" />
              Efeito
            </Button>
          </div>
          
          <div className="flex-1" />
          
          {/* Colaboração */}
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {collaborators.map((collaborator) => (
                <div
                  key={collaborator.id}
                  className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold border-2 border-gray-800"
                >
                  {collaborator.name.charAt(0)}
                </div>
              ))}
            </div>
            
            <Button variant="ghost" size="sm">
              <Users className="h-4 w-4 mr-1" />
              Colaborar
            </Button>
            
            <Button variant="ghost" size="sm">
              <MessageCircle className="h-4 w-4 mr-1" />
              {comments.filter(c => !c.resolved).length}
            </Button>
            
            <Button variant="ghost" size="sm">
              <Share2 className="h-4 w-4 mr-1" />
              Compartilhar
            </Button>

            <div className="h-6 w-px bg-gray-600 mx-2" />

            <HeyGenCreditsWidget />

            <Button 
              variant="outline" 
              size="sm" 
              className="ml-2"
              onClick={() => setIsExportHistoryOpen(true)}
            >
              <Video className="h-4 w-4 mr-1" />
              Histórico
            </Button>

            <Button 
              variant="default" 
              size="sm" 
              className="bg-blue-600 hover:bg-blue-700 ml-2"
              onClick={() => setIsExportDialogOpen(true)}
            >
              <Download className="h-4 w-4 mr-1" />
              Exportar
            </Button>
          </div>
        </div>

        <div className="flex-1 flex">
          {/* Left Panel - Assets */}
          <div className="w-64 bg-gray-800 border-r border-gray-700">
            <Tabs defaultValue="media" className="h-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="media">Mídia</TabsTrigger>
                <TabsTrigger value="text">Texto</TabsTrigger>
                <TabsTrigger value="audio">Áudio</TabsTrigger>
              </TabsList>
              
              <TabsContent value="media" className="p-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold mb-2">Biblioteca de Mídia</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[

                      { name: 'NR-12 Intro', src: '/nr12-intro.jpg' },
                      { name: 'Objetivos', src: '/nr12-objetivos.jpg' },
                      { name: 'Segurança', src: '/nr12-seguranca.jpg' },
                      { name: 'Procedimentos', src: '/nr12-procedimentos.jpg' }
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="aspect-video bg-gray-700 rounded cursor-pointer hover:bg-gray-600 flex items-center justify-center text-xs p-2"
                        draggable
                      >
                        <span className="text-center">{item.name}</span>
                      </div>
                    ))}

                  </div>
                  
                  <Button className="w-full mt-4" variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Mídia
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="text" className="p-4">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold">Estilos de Texto</h3>
                  <div className="space-y-2">
                    {[

                      { name: 'Título Principal', style: 'text-2xl font-bold' },
                      { name: 'Subtítulo', style: 'text-lg font-medium' },
                      { name: 'Texto Normal', style: 'text-base' },
                      { name: 'Texto Pequeno', style: 'text-sm' }
                    ].map((textStyle, index) => (
                      <div
                        key={index}
                        className="p-2 bg-gray-700 rounded cursor-pointer hover:bg-gray-600"
                        draggable
                      >
                        <span className={textStyle.style}>{textStyle.name}</span>
                      </div>
                    ))}

                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="audio" className="p-4">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold">Áudio e TTS</h3>
                  <div className="space-y-2">
                    <Button className="w-full" variant="outline">
                      <Mic className="h-4 w-4 mr-2" />
                      Gravar Áudio
                    </Button>
                    <Button className="w-full" variant="outline">
                      <Type className="h-4 w-4 mr-2" />
                      Texto para Voz
                    </Button>
                    <Button className="w-full" variant="outline">
                      <Music className="h-4 w-4 mr-2" />
                      Música de Fundo
                    </Button>
                  </div>
                  
                  <div className="space-y-2 pt-4">
                    <h4 className="text-xs font-medium text-gray-400">TTS Disponível</h4>
                    {[

                      { name: 'Voz Feminina BR', provider: 'ElevenLabs' },
                      { name: 'Voz Masculina BR', provider: 'Azure' },
                      { name: 'Narrador Profissional', provider: 'Google' }
                    ].map((voice, index) => (
                      <div key={index} className="p-2 bg-gray-700 rounded text-xs">
                        <div>{voice.name}</div>
                        <div className="text-gray-400">{voice.provider}</div>
                      </div>
                    ))}

                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Main Editing Area */}
          <div className="flex-1 flex flex-col">
            {/* Canvas/Preview */}
            <div className="flex-1 bg-black flex items-center justify-center relative">
              <div className="w-full max-w-4xl aspect-video bg-gray-800 rounded-lg flex items-center justify-center relative">
                <div className="text-gray-400">
                  Canvas de Visualização
                  <br />
                  <span className="text-sm">1920 x 1080</span>
                </div>
                
                {/* Cursors dos Colaboradores */}
                {collaborators.map((collaborator) => (
                  <div
                    key={collaborator.id}
                    className="absolute pointer-events-none"
                    style={{
                      left: collaborator.cursor.x,
                      top: collaborator.cursor.y
                    }}
                  >
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-blue-500 rounded-full" />
                      <span className="text-xs bg-blue-500 text-white px-1 rounded">
                        {collaborator.name}
                      </span>
                    </div>
                  </div>
                ))}
                
                {/* Comentários no Canvas */}
                {comments.filter(c => !c.resolved).map((comment) => (
                  <div
                    key={comment.id}
                    className="absolute w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center cursor-pointer"
                    style={{
                      left: `${(comment.position.time / totalDuration) * 100}%`,

                      top: `${comment.position.track * 20}%`
                    }}
                  >
                    <MessageCircle className="h-3 w-3 text-white" />
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline Controls */}
            <div className="h-16 bg-gray-800 border-t border-gray-700 flex items-center px-4 gap-4">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setCurrentTime(0)}>
                  <SkipBack className="h-4 w-4" />
                </Button>
                
                <Button variant="ghost" size="sm" onClick={handlePlay}>
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                
                <Button variant="ghost" size="sm" onClick={() => setIsPlaying(false)}>
                  <Square className="h-4 w-4" />
                </Button>
                
                <Button variant="ghost" size="sm" onClick={() => setCurrentTime(totalDuration)}>
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono">{formatTime(currentTime)}</span>
                <span className="text-gray-500">/</span>
                <span className="text-sm font-mono text-gray-400">{formatTime(totalDuration)}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Label className="text-xs">Velocidade:</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      {playbackSpeed}x
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {[0.25, 0.5, 1, 1.25, 1.5, 2].map(speed => (
                      <DropdownMenuItem
                        key={speed}
                        onClick={() => setPlaybackSpeed(speed)}
                      >
                        {speed}x
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  {volume[0] > 0 ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}

                </Button>
                <Slider
                  value={volume}
                  onValueChange={setVolume}
                  max={100}
                  step={1}
                  className="w-20"
                />
              </div>
              
              <div className="flex-1" />
              
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setZoom(Math.max(25, zoom - 25))}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-xs w-12 text-center">{zoom}%</span>
                <Button variant="ghost" size="sm" onClick={() => setZoom(Math.min(400, zoom + 25))}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                
                <Button variant="ghost" size="sm">
                  <Grid className="h-4 w-4" />
                </Button>
                
                <Button variant="ghost" size="sm">
                  <Maximize className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Timeline */}
            <div className="h-64 bg-gray-900 border-t border-gray-700 flex">
              {/* Track Headers */}
              <div className="w-48 border-r border-gray-700">
                {tracks.map((track, index) => (
                  <TrackHeader key={track.id} track={track} index={index} />
                ))}
              </div>
              
              {/* Timeline Content */}
              <div className="flex-1 relative overflow-auto">
                {/* Time Ruler */}
                <div className="h-8 bg-gray-800 border-b border-gray-700 relative">
                  {Array.from({ length: Math.ceil(totalDuration / 10) + 1 }, (_, i) => (
                    <div
                      key={i}
                      className="absolute border-l border-gray-600 h-full flex items-center"
                      style={{ left: `${i * 10 * TIMELINE_SCALE * (zoom / 100)}px` }}
                    >
                      <span className="text-xs text-gray-400 ml-1">{formatTime(i * 10)}</span>
                    </div>
                  ))}
                  
                  {/* Playhead */}
                  <div
                    ref={playheadRef}
                    className="absolute top-0 h-full w-0.5 bg-red-500 z-50 pointer-events-none"
                    style={{ left: `${currentTime * TIMELINE_SCALE * (zoom / 100)}px` }}
                  />
                </div>
                
                {/* Tracks */}
                <div
                  ref={timelineRef}
                  className="relative cursor-pointer"
                  onClick={handleTimelineClick}
                >
                  {tracks.map((track, trackIndex) => (
                    <div
                      key={track.id}
                      className={cn(
                        "border-b border-gray-700 relative",
                        !track.visible && "opacity-30"
                      )}
                      style={{ height: track.height }}
                    >
                      {/* Grid Lines */}
                      {Array.from({ length: Math.ceil(totalDuration / 5) }, (_, i) => (
                        <div
                          key={i}
                          className="absolute border-l border-gray-800 h-full opacity-30"
                          style={{ left: `${i * 5 * TIMELINE_SCALE * (zoom / 100)}px` }}
                        />
                      ))}
                      
                      {/* Elements */}
                      {elements
                        .filter(el => el.track === trackIndex)
                        .map(element => (
                          <TimelineElement
                            key={element.id}
                            element={element}
                            trackIndex={trackIndex}
                          />
                        ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Properties */}
          <div className="w-80 bg-gray-800 border-l border-gray-700">
            <Tabs defaultValue="properties" className="h-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="properties">Propriedades</TabsTrigger>
                <TabsTrigger value="comments">
                  Comentários ({comments.filter(c => !c.resolved).length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="properties" className="p-4 h-[calc(100%-40px)] overflow-y-auto">
                <PropertiesPanel
                  selectedElement={elements.find(el => el.id === selectedElements[0]) as any}
                  onUpdateElement={handleUpdateElement}
                  onDeleteElement={handleDeleteElement}
                  onDuplicateElement={handleDuplicateElement}
                />
              </TabsContent>
              
              <TabsContent value="comments" className="p-4">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold">Comentários e Revisões</h3>
                  
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      className={cn(
                        "p-3 rounded-lg border",
                        comment.resolved 
                          ? "bg-green-900/20 border-green-700"
                          : "bg-yellow-900/20 border-yellow-700"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold">
                          {comment.author.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span>{comment.author}</span>
                            <span>•</span>
                            <span>{formatTime(comment.position.time)}</span>
                          </div>
                          <p className="text-sm mt-1">{comment.text}</p>
                          
                          {comment.replies && comment.replies.length > 0 && (
                            <div className="mt-2 pl-4 border-l border-gray-600 space-y-2">
                              {comment.replies.map(reply => (
                                <div key={reply.id} className="text-xs">
                                  <div className="font-medium">{reply.author}:</div>
                                  <div className="text-gray-400">{reply.text}</div>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 mt-2">
                            <Button variant="ghost" size="sm" className="text-xs">
                              Responder
                            </Button>
                            {!comment.resolved && (
                              <Button variant="ghost" size="sm" className="text-xs text-green-400">
                                Resolver
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <Button className="w-full" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Comentário
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Bottom Status Bar */}
        <div className="h-8 bg-gray-800 border-t border-gray-700 flex items-center px-4 text-xs text-gray-400">
          <span>Elementos: {elements.length}</span>
          <span className="mx-2">•</span>
          <span>Duração: {formatTime(totalDuration)}</span>
          <span className="mx-2">•</span>
          <span>Resolução: 1920x1080</span>
          <span className="mx-2">•</span>
          <span>FPS: 30</span>
          
          <div className="flex-1" />
          
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Salvo automaticamente às {new Date().toLocaleTimeString()}
          </span>
        </div>

        <ExportDialog 
          open={isExportDialogOpen} 
          onOpenChange={setIsExportDialogOpen}
          onExport={handleExport}
          isExporting={isExporting}
        />

        <ExportHistoryDialog 
          open={isExportHistoryOpen} 
          onOpenChange={setIsExportHistoryOpen}
        />

        <RenderProgressDialog 
          open={isRenderProgressOpen} 
          onOpenChange={setIsRenderProgressOpen}
          jobId={currentRenderJobId}
          onComplete={handleRenderComplete}
        />
      </div>
    </DndProvider>
  )
}
