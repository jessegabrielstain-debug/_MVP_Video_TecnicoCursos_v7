'use client'

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Download,
  Share,
  Settings,
  Eye,
  Monitor,
  Smartphone,
  Tablet,
  RefreshCw,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
  Mic,
  Video,
  Image as ImageIcon,
  Wand2,
  PlayCircle,
  StopCircle
} from 'lucide-react'

// Types matching the PPTX system
interface PPTXSlide {
  id: string
  title: string
  content: string
  notes: string
  duration: number
  order: number
  thumbnail?: string
  audioText?: string
  backgroundImage?: string
  layoutType?: 'title' | 'content' | 'image' | 'mixed'
}

interface PreviewSettings {
  resolution: '1920x1080' | '1280x720' | '854x480'
  aspectRatio: '16:9' | '4:3' | '1:1'
  quality: 'high' | 'medium' | 'low'
  fps: 30 | 24 | 60
  enableAudio: boolean
  enableAvatar: boolean
  avatarPosition: 'bottom-right' | 'bottom-left' | 'center' | 'full-screen'
  backgroundColor: string
  transition: 'fade' | 'slide' | 'zoom' | 'dissolve'
  transitionDuration: number
}

interface RealTimePreviewProps {
  projectId: string
  slides: PPTXSlide[]
  isVisible?: boolean
  onClose?: () => void
  onExport?: (settings: PreviewSettings) => void
}

const RESOLUTION_OPTIONS = ['1920x1080', '1280x720', '854x480'] as const
type ResolutionOption = (typeof RESOLUTION_OPTIONS)[number]

const QUALITY_OPTIONS = ['high', 'medium', 'low'] as const
type QualityOption = (typeof QUALITY_OPTIONS)[number]

const AVATAR_POSITIONS = ['bottom-right', 'bottom-left', 'center', 'full-screen'] as const
type AvatarPositionOption = (typeof AVATAR_POSITIONS)[number]

const TRANSITION_OPTIONS = ['fade', 'slide', 'zoom', 'dissolve'] as const
type TransitionOption = (typeof TRANSITION_OPTIONS)[number]

const createOptionGuard = <T extends readonly string[]>(options: T) =>
  (value: string): value is T[number] => options.includes(value as T[number])

const isResolutionOption = createOptionGuard(RESOLUTION_OPTIONS)
const isQualityOption = createOptionGuard(QUALITY_OPTIONS)
const isAvatarPositionOption = createOptionGuard(AVATAR_POSITIONS)
const isTransitionOption = createOptionGuard(TRANSITION_OPTIONS)

interface RenderProgress {
  stage: 'preparing' | 'rendering' | 'audio' | 'encoding' | 'complete' | 'error'
  progress: number
  message: string
  currentSlide?: number
  totalSlides?: number
}

export default function PPTXRealTimePreview({ 
  projectId, 
  slides = [], 
  isVisible = true,
  onClose,
  onExport 
}: RealTimePreviewProps) {
  // Preview state
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [totalDuration, setTotalDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [muted, setMuted] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  
  // Preview settings
  const [previewSettings, setPreviewSettings] = useState<PreviewSettings>({
    resolution: '1920x1080',
    aspectRatio: '16:9',
    quality: 'medium',
    fps: 30,
    enableAudio: true,
    enableAvatar: true,
    avatarPosition: 'bottom-right',
    backgroundColor: '#000000',
    transition: 'fade',
    transitionDuration: 0.5
  })

  // Rendering state
  const [isRendering, setIsRendering] = useState(false)
  const [renderProgress, setRenderProgress] = useState<RenderProgress>({
    stage: 'preparing',
    progress: 0,
    message: 'Preparando renderização...'
  })

  // Preview mode
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile' | 'tablet'>('desktop')
  const [fullscreen, setFullscreen] = useState(false)
  const [autoPlay, setAutoPlay] = useState(false)

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const intervalRef = useRef<NodeJS.Timeout>()

  // Calculate total duration
  useEffect(() => {
    const duration = slides.reduce((acc, slide) => acc + slide.duration, 0)
    setTotalDuration(duration)
  }, [slides])

  // Auto-play setup
  useEffect(() => {
    if (autoPlay && slides.length > 0) {
      handlePlay()
    }
  }, [slides, autoPlay])

  // Current slide calculation
  useEffect(() => {
    let accumulatedTime = 0
    for (let i = 0; i < slides.length; i++) {
      if (currentTime >= accumulatedTime && currentTime < accumulatedTime + slides[i].duration) {
        setCurrentSlide(i)
        break
      }
      accumulatedTime += slides[i].duration
    }
  }, [currentTime, slides])

  // Playback control
  const handlePlay = useCallback(() => {
    if (!slides.length) return
    
    setIsPlaying(true)
    intervalRef.current = setInterval(() => {
      setCurrentTime(prev => {
        const newTime = prev + (1 * playbackSpeed)
        return newTime >= totalDuration ? 0 : newTime
      })
    }, 1000)
    
    toast.success('Preview iniciado')
  }, [slides, totalDuration, playbackSpeed])

  const handlePause = useCallback(() => {
    setIsPlaying(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    toast.info('Preview pausado')
  }, [])

  const handleStop = useCallback(() => {
    setIsPlaying(false)
    setCurrentTime(0)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    toast.info('Preview parado')
  }, [])

  const handleSeek = useCallback((time: number) => {
    setCurrentTime(Math.max(0, Math.min(time, totalDuration)))
  }, [totalDuration])

  // Navigate to specific slide
  const goToSlide = useCallback((slideIndex: number) => {
    if (slideIndex < 0 || slideIndex >= slides.length) return
    
    let accumulatedTime = 0
    for (let i = 0; i < slideIndex; i++) {
      accumulatedTime += slides[i].duration
    }
    
    setCurrentTime(accumulatedTime)
    setCurrentSlide(slideIndex)
  }, [slides])

  // Real-time rendering simulation
  const renderPreview = useCallback(async () => {
    if (isRendering) return
    
    setIsRendering(true)
    setRenderProgress({
      stage: 'preparing',
      progress: 0,
      message: 'Preparando renderização...',
      totalSlides: slides.length
    })

    try {
      // Stage 1: Preparing
      await new Promise(resolve => setTimeout(resolve, 1000))
      setRenderProgress(prev => ({
        ...prev,
        stage: 'rendering',
        progress: 10,
        message: 'Renderizando slides...'
      }))

      // Stage 2: Rendering slides
      for (let i = 0; i < slides.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 500))
        const progress = 10 + ((i + 1) / slides.length) * 50
        setRenderProgress(prev => ({
          ...prev,
          progress,
          message: `Renderizando slide ${i + 1} de ${slides.length}`,
          currentSlide: i + 1
        }))
      }

      // Stage 3: Audio processing
      if (previewSettings.enableAudio) {
        setRenderProgress(prev => ({
          ...prev,
          stage: 'audio',
          progress: 70,
          message: 'Processando áudio e narração...'
        }))
        await new Promise(resolve => setTimeout(resolve, 2000))
      }

      // Stage 4: Encoding
      setRenderProgress(prev => ({
        ...prev,
        stage: 'encoding',
        progress: 90,
        message: 'Codificando vídeo final...'
      }))
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Complete
      setRenderProgress(prev => ({
        ...prev,
        stage: 'complete',
        progress: 100,
        message: 'Renderização concluída!'
      }))

      toast.success('Preview renderizado com sucesso!')
      
    } catch (error) {
      setRenderProgress(prev => ({
        ...prev,
        stage: 'error',
        progress: 0,
        message: 'Erro na renderização'
      }))
      toast.error('Falha na renderização do preview')
    } finally {
      setTimeout(() => {
        setIsRendering(false)
      }, 2000)
    }
  }, [slides, previewSettings, isRendering])

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Get device dimensions for preview
  const getPreviewDimensions = () => {
    switch (previewMode) {
      case 'mobile':
        return { width: 375, height: 667 }
      case 'tablet':
        return { width: 768, height: 1024 }
      default:
        return { width: 1920, height: 1080 }
    }
  }

  const previewDimensions = getPreviewDimensions()
  const aspectRatio = previewDimensions.width / previewDimensions.height

  // Current slide data
  const currentSlideData = slides[currentSlide]

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex">
      {/* Preview Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold">Preview em Tempo Real</h2>
            <Badge variant="outline">
              {slides.length} slides • {formatTime(totalDuration)}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Device preview modes */}
            <Button
              variant={previewMode === 'desktop' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPreviewMode('desktop')}
            >
              <Monitor className="h-4 w-4" />
            </Button>
            <Button
              variant={previewMode === 'tablet' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPreviewMode('tablet')}
            >
              <Tablet className="h-4 w-4" />
            </Button>
            <Button
              variant={previewMode === 'mobile' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPreviewMode('mobile')}
            >
              <Smartphone className="h-4 w-4" />
            </Button>
            
            <Separator orientation="vertical" className="h-6" />
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFullscreen(!fullscreen)}
            >
              {fullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
            
            {onClose && (
              <Button variant="outline" size="sm" onClick={onClose}>
                ✕
              </Button>
            )}
          </div>
        </div>

        {/* Main Preview Area */}
        <div className="flex-1 flex items-center justify-center p-8 bg-gray-100 dark:bg-gray-900">
          <div className="relative">
            {/* Preview Frame */}
            <motion.div
              className="relative bg-black rounded-lg overflow-hidden shadow-2xl border-4 border-gray-800"
              style={{
                width: Math.min(previewDimensions.width * 0.5, 800),
                height: Math.min(previewDimensions.height * 0.5, 450)
              }}
              animate={{ scale: fullscreen ? 1.2 : 1 }}
              transition={{ duration: 0.3 }}
            >
              {/* Current Slide Content */}
              <div className="absolute inset-0 flex items-center justify-center">
                {currentSlideData ? (
                  <motion.div
                    key={currentSlide}
                    className="w-full h-full flex flex-col items-center justify-center p-8 text-white"
                    style={{ backgroundColor: previewSettings.backgroundColor }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: previewSettings.transitionDuration }}
                  >
                    {/* Slide Title */}
                    {currentSlideData.title && (
                      <h1 className="text-4xl font-bold mb-6 text-center">
                        {currentSlideData.title}
                      </h1>
                    )}
                    
                    {/* Slide Content */}
                    {currentSlideData.content && (
                      <div className="text-xl text-center max-w-4xl leading-relaxed">
                        {currentSlideData.content}
                      </div>
                    )}
                    
                    {/* Avatar Position */}
                    {previewSettings.enableAvatar && (
                      <div 
                        className={`absolute w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center ${
                          previewSettings.avatarPosition === 'bottom-right' ? 'bottom-4 right-4' :
                          previewSettings.avatarPosition === 'bottom-left' ? 'bottom-4 left-4' :
                          previewSettings.avatarPosition === 'center' ? 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2' :
                          'inset-0 w-full h-full rounded-none'
                        }`}
                      >
                        <Video className="h-12 w-12 text-white" />
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <div className="text-white text-center">
                    <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Nenhum slide carregado</p>
                  </div>
                )}
              </div>

              {/* Slide Progress Indicator */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800">
                <div 
                  className="h-full bg-blue-500 transition-all duration-1000"
                  style={{ 
                    width: `${currentSlideData ? 
                      ((currentTime - slides.slice(0, currentSlide).reduce((acc, slide) => acc + slide.duration, 0)) / currentSlideData.duration) * 100 
                      : 0}%` 
                  }}
                />
              </div>
            </motion.div>

            {/* Slide Counter */}
            <div className="absolute -top-8 left-0 text-sm text-muted-foreground">
              Slide {currentSlide + 1} de {slides.length}
            </div>
          </div>
        </div>

        {/* Transport Controls */}
        <div className="p-4 border-t border-border bg-muted/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Button
                variant={isPlaying ? "default" : "outline"}
                size="sm"
                onClick={isPlaying ? handlePause : handlePlay}
                disabled={!slides.length}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              
              <Button variant="outline" size="sm" onClick={handleStop}>
                <Square className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => goToSlide(Math.max(0, currentSlide - 1))}
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => goToSlide(Math.min(slides.length - 1, currentSlide + 1))}
              >
                <SkipForward className="h-4 w-4" />
              </Button>
              
              <Separator orientation="vertical" className="h-6" />
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMuted(!muted)}
              >
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              
              <Slider
                value={[muted ? 0 : volume * 100]}
                onValueChange={([value]) => {
                  setVolume(value / 100)
                  setMuted(value === 0)
                }}
                max={100}
                step={1}
                className="w-24"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="text-sm font-mono">
                {formatTime(currentTime)} / {formatTime(totalDuration)}
              </div>
              
              <Separator orientation="vertical" className="h-6" />
              
              <Button variant="outline" size="sm" onClick={renderPreview} disabled={isRendering}>
                {isRendering ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Renderizar
              </Button>
              
              {onExport && (
                <Button size="sm" onClick={() => onExport(previewSettings)}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              )}
            </div>
          </div>
          
          {/* Timeline */}
          <div className="relative">
            <Slider
              value={[currentTime]}
              onValueChange={([value]) => handleSeek(value)}
              max={totalDuration}
              step={0.1}
              className="w-full"
            />
            
            {/* Slide markers */}
            <div className="absolute top-0 left-0 right-0 h-full pointer-events-none">
              {slides.reduce((markers, slide, index) => {
                const startTime = slides.slice(0, index).reduce((acc, s) => acc + s.duration, 0)
                const position = (startTime / totalDuration) * 100
                
                return [
                  ...markers,
                  <div
                    key={`marker-${index}`}
                    className="absolute top-0 w-0.5 h-full bg-blue-500 opacity-60"
                    style={{ left: `${position}%` }}
                  />
                ]
              }, [] as JSX.Element[])}
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Settings & Progress */}
      <div className="w-80 border-l border-border bg-muted/30 p-4 overflow-y-auto">
        <div className="space-y-4">
          {/* Rendering Progress */}
          {isRendering && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-sm">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Renderizando
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Progress value={renderProgress.progress} className="w-full" />
                  <div className="text-xs text-muted-foreground">
                    {renderProgress.message}
                  </div>
                  {renderProgress.currentSlide && renderProgress.totalSlides && (
                    <div className="text-xs">
                      Slide {renderProgress.currentSlide} de {renderProgress.totalSlides}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preview Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Configurações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs">Resolução</Label>
                <select 
                  className="w-full mt-1 p-2 border rounded text-sm"
                  value={previewSettings.resolution}
                  onChange={(e) => {
                    const value = e.target.value
                    if (!isResolutionOption(value)) {
                      return
                    }

                    setPreviewSettings(prev => ({
                      ...prev,
                      resolution: value
                    }))
                  }}
                >
                  <option value="1920x1080">1920x1080 (Full HD)</option>
                  <option value="1280x720">1280x720 (HD)</option>
                  <option value="854x480">854x480 (SD)</option>
                </select>
              </div>
              
              <div>
                <Label className="text-xs">Qualidade</Label>
                <select 
                  className="w-full mt-1 p-2 border rounded text-sm"
                  value={previewSettings.quality}
                  onChange={(e) => {
                    const value = e.target.value
                    if (!isQualityOption(value)) {
                      return
                    }

                    setPreviewSettings(prev => ({
                      ...prev,
                      quality: value
                    }))
                  }}
                >
                  <option value="high">Alta</option>
                  <option value="medium">Média</option>
                  <option value="low">Baixa</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <Label className="text-xs">Áudio</Label>
                <Switch
                  checked={previewSettings.enableAudio}
                  onCheckedChange={(checked) => setPreviewSettings(prev => ({ 
                    ...prev, 
                    enableAudio: checked 
                  }))}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label className="text-xs">Avatar 3D</Label>
                <Switch
                  checked={previewSettings.enableAvatar}
                  onCheckedChange={(checked) => setPreviewSettings(prev => ({ 
                    ...prev, 
                    enableAvatar: checked 
                  }))}
                />
              </div>
              
              {previewSettings.enableAvatar && (
                <div>
                  <Label className="text-xs">Posição do Avatar</Label>
                  <select 
                    className="w-full mt-1 p-2 border rounded text-sm"
                    value={previewSettings.avatarPosition}
                    onChange={(e) => {
                      const value = e.target.value
                      if (!isAvatarPositionOption(value)) {
                        return
                      }

                      setPreviewSettings(prev => ({
                        ...prev,
                        avatarPosition: value
                      }))
                    }}
                  >
                    <option value="bottom-right">Canto Inferior Direito</option>
                    <option value="bottom-left">Canto Inferior Esquerdo</option>
                    <option value="center">Centro</option>
                    <option value="full-screen">Tela Cheia</option>
                  </select>
                </div>
              )}
              
              <div>
                <Label className="text-xs">Transição</Label>
                <select 
                  className="w-full mt-1 p-2 border rounded text-sm"
                  value={previewSettings.transition}
                  onChange={(e) => {
                    const value = e.target.value
                    if (!isTransitionOption(value)) {
                      return
                    }

                    setPreviewSettings(prev => ({
                      ...prev,
                      transition: value
                    }))
                  }}
                >
                  <option value="fade">Fade</option>
                  <option value="slide">Slide</option>
                  <option value="zoom">Zoom</option>
                  <option value="dissolve">Dissolve</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Slide List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Slides ({slides.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {slides.map((slide, index) => (
                    <motion.div
                      key={slide.id}
                      className={`p-2 rounded border cursor-pointer transition-colors ${
                        currentSlide === index 
                          ? 'bg-primary text-primary-foreground border-primary' 
                          : 'border-border hover:bg-accent'
                      }`}
                      onClick={() => goToSlide(index)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center space-x-2">
                        <div className="text-xs font-mono bg-muted px-1 rounded">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate">
                            {slide.title || `Slide ${index + 1}`}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatTime(slide.duration)}
                          </div>
                        </div>
                        {currentSlide === index && (
                          <PlayCircle className="h-3 w-3" />
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}