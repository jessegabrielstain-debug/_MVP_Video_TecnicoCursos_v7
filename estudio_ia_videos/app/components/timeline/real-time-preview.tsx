'use client'

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Play, 
  Pause, 
  Square,
  SkipBack,
  SkipForward,
  FastForward,
  Rewind,
  Volume2, 
  VolumeX,
  Settings,
  Monitor,
  Maximize,
  Minimize,
  RotateCw,
  Download,
  Upload,
  Eye,
  EyeOff,
  Layers,
  Grid,
  Crosshair,
  Zap,
  Activity,
  Clock,
  Timer,
  Gauge,
  Target,
  Cpu,
  HardDrive,
  Wifi,
  Signal,
  AlertTriangle,
  CheckCircle,
  Info,
  Camera,
  Video,
  Mic,
  Music,
  Image,
  Type,
  Sparkles,
  Palette,
  Filter,
  Sliders,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Repeat,
  Shuffle,
  Lock,
  Unlock,
  Bookmark,
  Flag,
  Star,
  Heart,
  Share,
  Copy,
  Scissors,
  Move,
  CornerDownRight,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// Preview Types
interface PreviewSettings {
  quality: 'low' | 'medium' | 'high' | 'ultra'
  resolution: '480p' | '720p' | '1080p' | '4K'
  frameRate: 24 | 30 | 60 | 120
  bitrate: number
  realTimeProcessing: boolean
  hardwareAcceleration: boolean
  previewMode: 'full' | 'proxy' | 'draft'
  colorSpace: 'sRGB' | 'Rec709' | 'Rec2020' | 'DCI-P3'
}

interface PlaybackState {
  isPlaying: boolean
  currentTime: number
  duration: number
  playbackRate: number
  volume: number
  muted: boolean
  loop: boolean
  shuffle: boolean
  buffering: boolean
  bufferProgress: number
}

interface PreviewMetrics {
  fps: number
  droppedFrames: number
  cpuUsage: number
  memoryUsage: number
  renderTime: number
  bufferHealth: number
  networkLatency?: number
  quality: 'excellent' | 'good' | 'fair' | 'poor'
}

interface TimelineMarker {
  id: string
  time: number
  type: 'in' | 'out' | 'chapter' | 'bookmark' | 'error' | 'warning'
  label: string
  color: string
}

interface ViewportSettings {
  zoom: number
  panX: number
  panY: number
  rotation: number
  showGrid: boolean
  showSafeAreas: boolean
  showRulers: boolean
  aspectRatio: '16:9' | '4:3' | '21:9' | '1:1' | 'custom'
  overlays: string[]
}

const previewQualityOptions: PreviewSettings['quality'][] = ['low', 'medium', 'high', 'ultra']
const previewResolutionOptions: PreviewSettings['resolution'][] = ['480p', '720p', '1080p', '4K']
const previewFrameRateOptions: PreviewSettings['frameRate'][] = [24, 30, 60, 120]
const aspectRatioOptions: ViewportSettings['aspectRatio'][] = ['16:9', '4:3', '21:9', '1:1', 'custom']

const isPreviewQuality = (value: string): value is PreviewSettings['quality'] =>
  previewQualityOptions.some((option) => option === value)

const isPreviewResolution = (value: string): value is PreviewSettings['resolution'] =>
  previewResolutionOptions.some((option) => option === value)

const isPreviewFrameRate = (value: number): value is PreviewSettings['frameRate'] =>
  previewFrameRateOptions.some((option) => option === value)

const isAspectRatio = (value: string): value is ViewportSettings['aspectRatio'] =>
  aspectRatioOptions.some((option) => option === value)

// Real-time Preview Component
export default function RealTimePreview() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const scrubberRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number>()

  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    currentTime: 0,
    duration: 120, // 2 minutes demo
    playbackRate: 1,
    volume: 80,
    muted: false,
    loop: false,
    shuffle: false,
    buffering: false,
    bufferProgress: 85
  })

  const [previewSettings, setPreviewSettings] = useState<PreviewSettings>({
    quality: 'high',
    resolution: '1080p',
    frameRate: 30,
    bitrate: 8000,
    realTimeProcessing: true,
    hardwareAcceleration: true,
    previewMode: 'full',
    colorSpace: 'Rec709'
  })

  const [previewMetrics, setPreviewMetrics] = useState<PreviewMetrics>({
    fps: 29.97,
    droppedFrames: 0,
    cpuUsage: 45,
    memoryUsage: 62,
    renderTime: 16.7,
    bufferHealth: 85,
    quality: 'excellent'
  })

  const [viewportSettings, setViewportSettings] = useState<ViewportSettings>({
    zoom: 100,
    panX: 0,
    panY: 0,
    rotation: 0,
    showGrid: false,
    showSafeAreas: true,
    showRulers: false,
    aspectRatio: '16:9',
    overlays: []
  })

  const [markers, setMarkers] = useState<TimelineMarker[]>([
    { id: '1', time: 15, type: 'in', label: 'Início', color: 'green' },
    { id: '2', time: 45, type: 'chapter', label: 'Capítulo 1', color: 'blue' },
    { id: '3', time: 75, type: 'bookmark', label: 'Bookmark', color: 'yellow' },
    { id: '4', time: 105, type: 'out', label: 'Fim', color: 'red' }
  ])

  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [showMetrics, setShowMetrics] = useState(false)

  // Real-time metrics monitoring
  useEffect(() => {
    const metricsInterval = setInterval(() => {
      setPreviewMetrics(prev => ({
        ...prev,
        fps: 29.97 + (Math.random() - 0.5) * 2,
        droppedFrames: Math.max(0, prev.droppedFrames + (Math.random() > 0.95 ? 1 : 0)),
        cpuUsage: Math.max(20, Math.min(80, prev.cpuUsage + (Math.random() - 0.5) * 10)),
        memoryUsage: Math.max(40, Math.min(90, prev.memoryUsage + (Math.random() - 0.5) * 5)),
        renderTime: 16.7 + (Math.random() - 0.5) * 3,
        bufferHealth: Math.max(60, Math.min(100, prev.bufferHealth + (Math.random() - 0.5) * 10))
      }))
    }, 1000)

    return () => clearInterval(metricsInterval)
  }, [])

  // Playback animation loop
  useEffect(() => {
    if (playbackState.isPlaying && !playbackState.buffering) {
      const animate = () => {
        setPlaybackState(prev => {
          const newTime = Math.min(
            prev.duration,
            prev.currentTime + (1/30) * prev.playbackRate
          )
          
          if (newTime >= prev.duration) {
            if (prev.loop) {
              return { ...prev, currentTime: 0 }
            } else {
              return { ...prev, currentTime: newTime, isPlaying: false }
            }
          }
          
          return { ...prev, currentTime: newTime }
        })
        
        animationFrameRef.current = requestAnimationFrame(animate)
      }
      
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [playbackState.isPlaying, playbackState.buffering, playbackState.playbackRate, playbackState.loop])

  const togglePlayback = useCallback(() => {
    setPlaybackState(prev => ({ ...prev, isPlaying: !prev.isPlaying }))
  }, [])

  const seekTo = useCallback((time: number) => {
    setPlaybackState(prev => ({ 
      ...prev, 
      currentTime: Math.max(0, Math.min(prev.duration, time))
    }))
  }, [])

  const changePlaybackRate = useCallback((rate: number) => {
    setPlaybackState(prev => ({ ...prev, playbackRate: rate }))
    toast.success(`Velocidade: ${rate}x`)
  }, [])

  const toggleMute = useCallback(() => {
    setPlaybackState(prev => ({ ...prev, muted: !prev.muted }))
  }, [])

  const setVolume = useCallback((volume: number) => {
    setPlaybackState(prev => ({ ...prev, volume, muted: volume === 0 }))
  }, [])

  const addMarker = useCallback((time: number, type: TimelineMarker['type']) => {
    const newMarker: TimelineMarker = {
      id: Date.now().toString(),
      time,
      type,
      label: `${type} ${time.toFixed(1)}s`,
      color: type === 'in' ? 'green' : type === 'out' ? 'red' : type === 'chapter' ? 'blue' : 'yellow'
    }
    
    setMarkers(prev => [...prev, newMarker].sort((a, b) => a.time - b.time))
    toast.success(`Marcador ${type} adicionado`)
  }, [])

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const frames = Math.floor((seconds % 1) * previewSettings.frameRate)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`
  }, [previewSettings.frameRate])

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-400'
      case 'good': return 'text-blue-400'
      case 'fair': return 'text-yellow-400'
      case 'poor': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const handleScrubberClick = useCallback((e: React.MouseEvent) => {
    if (!scrubberRef.current) return
    
    const rect = scrubberRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    const newTime = percentage * playbackState.duration
    
    seekTo(newTime)
  }, [playbackState.duration, seekTo])

  const handleScrubberDrag = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !scrubberRef.current) return
    
    const rect = scrubberRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = Math.max(0, Math.min(1, x / rect.width))
    const newTime = percentage * playbackState.duration
    
    seekTo(newTime)
  }, [isDragging, playbackState.duration, seekTo])

  const playbackRates = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4]

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Header */}
      <div className="p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">Preview em Tempo Real</h2>
            <Badge variant="outline" className={cn("border-green-400", getQualityColor(previewMetrics.quality))}>
              <Activity className="w-3 h-3 mr-1" />
              {previewMetrics.quality.toUpperCase()}
            </Badge>
            <Badge variant="outline" className="bg-blue-600/20 text-blue-400 border-blue-400">
              <Monitor className="w-3 h-3 mr-1" />
              {previewSettings.resolution}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMetrics(!showMetrics)}
            >
              <Gauge className="w-4 h-4 mr-2" />
              Métricas
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Real-time Metrics */}
        <AnimatePresence>
          {showMetrics && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 grid grid-cols-6 gap-4"
            >
              <div className="text-center">
                <div className="text-xs text-gray-400">FPS</div>
                <div className="text-lg font-mono text-green-400">
                  {previewMetrics.fps.toFixed(1)}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-xs text-gray-400">Frames Perdidos</div>
                <div className="text-lg font-mono text-red-400">
                  {previewMetrics.droppedFrames}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-xs text-gray-400">CPU</div>
                <div className="text-lg font-mono text-purple-400">
                  {previewMetrics.cpuUsage.toFixed(0)}%
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-xs text-gray-400">Memória</div>
                <div className="text-lg font-mono text-orange-400">
                  {previewMetrics.memoryUsage.toFixed(0)}%
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-xs text-gray-400">Render (ms)</div>
                <div className="text-lg font-mono text-blue-400">
                  {previewMetrics.renderTime.toFixed(1)}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-xs text-gray-400">Buffer</div>
                <div className="text-lg font-mono text-yellow-400">
                  {previewMetrics.bufferHealth.toFixed(0)}%
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Preview Area */}
        <div className="flex-1 flex flex-col bg-black relative">
          {/* Preview Canvas */}
          <div className="flex-1 flex items-center justify-center relative">
            <div 
              className="relative bg-gray-800 rounded-lg overflow-hidden"
              style={{
                width: isFullscreen ? '100%' : '80%',
                height: isFullscreen ? '100%' : '80%',
                transform: `scale(${viewportSettings.zoom / 100}) rotate(${viewportSettings.rotation}deg)`,
                transformOrigin: 'center'
              }}
            >
              {/* Video/Canvas Element */}
              <canvas
                ref={canvasRef}
                className="w-full h-full"
                style={{ aspectRatio: viewportSettings.aspectRatio.replace(':', '/') }}
              />

              {/* Overlays */}
              {viewportSettings.showGrid && (
                <div className="absolute inset-0 opacity-30">
                  <svg className="w-full h-full">
                    <defs>
                      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="white" strokeWidth="0.5"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                  </svg>
                </div>
              )}

              {viewportSettings.showSafeAreas && (
                <div className="absolute inset-0">
                  <div className="absolute inset-[10%] border border-yellow-400/50 rounded"></div>
                  <div className="absolute inset-[5%] border border-red-400/30 rounded"></div>
                </div>
              )}

              {/* Buffering Indicator */}
              <AnimatePresence>
                {playbackState.buffering && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center bg-black/50"
                  >
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
                      <div className="text-white">Carregando...</div>
                      <Progress value={playbackState.bufferProgress} className="w-32 mt-2" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Viewport Controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewportSettings(prev => ({ 
                  ...prev, 
                  zoom: Math.min(400, prev.zoom + 25) 
                }))}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewportSettings(prev => ({ 
                  ...prev, 
                  zoom: Math.max(25, prev.zoom - 25) 
                }))}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewportSettings(prev => ({ 
                  ...prev, 
                  zoom: 100, 
                  panX: 0, 
                  panY: 0, 
                  rotation: 0 
                }))}
              >
                <Target className="w-4 h-4" />
              </Button>
            </div>

            {/* Viewport Info */}
            <div className="absolute bottom-4 left-4 bg-black/70 rounded px-3 py-2 text-sm">
              <div>Zoom: {viewportSettings.zoom}%</div>
              <div>Resolução: {previewSettings.resolution}</div>
              <div>Aspect: {viewportSettings.aspectRatio}</div>
            </div>
          </div>

          {/* Timeline Scrubber */}
          <div className="p-4 bg-gray-800 border-t border-gray-700">
            <div className="space-y-3">
              {/* Time Display */}
              <div className="flex items-center justify-between text-sm">
                <div className="font-mono">
                  {formatTime(playbackState.currentTime)} / {formatTime(playbackState.duration)}
                </div>
                <div className="flex items-center gap-4">
                  <div>Taxa: {playbackState.playbackRate}x</div>
                  <div>Volume: {playbackState.muted ? 'Mudo' : `${playbackState.volume}%`}</div>
                </div>
              </div>

              {/* Scrubber */}
              <div 
                ref={scrubberRef}
                className="relative h-8 bg-gray-700 rounded cursor-pointer"
                onClick={handleScrubberClick}
                onMouseMove={handleScrubberDrag}
                onMouseDown={() => setIsDragging(true)}
                onMouseUp={() => setIsDragging(false)}
                onMouseLeave={() => setIsDragging(false)}
              >
                {/* Progress Bar */}
                <div 
                  className="absolute top-0 left-0 h-full bg-blue-500 rounded"
                  style={{ width: `${(playbackState.currentTime / playbackState.duration) * 100}%` }}
                />

                {/* Buffer Progress */}
                <div 
                  className="absolute top-0 left-0 h-full bg-gray-600 rounded"
                  style={{ width: `${playbackState.bufferProgress}%` }}
                />

                {/* Markers */}
                {markers.map((marker) => (
                  <div
                    key={marker.id}
                    className="absolute top-0 w-1 h-full cursor-pointer"
                    style={{ 
                      left: `${(marker.time / playbackState.duration) * 100}%`,
                      backgroundColor: marker.color
                    }}
                    title={marker.label}
                  />
                ))}

                {/* Playhead */}
                <div 
                  className="absolute top-0 w-1 h-full bg-white shadow-lg"
                  style={{ left: `${(playbackState.currentTime / playbackState.duration) * 100}%` }}
                />
              </div>

              {/* Playback Controls */}
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => seekTo(playbackState.currentTime - 10)}
                >
                  <Rewind className="w-4 h-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => seekTo(Math.max(0, playbackState.currentTime - 1/previewSettings.frameRate))}
                >
                  <SkipBack className="w-4 h-4" />
                </Button>

                <Button
                  onClick={togglePlayback}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {playbackState.isPlaying ? 
                    <Pause className="w-6 h-6" /> : 
                    <Play className="w-6 h-6" />
                  }
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => seekTo(Math.min(playbackState.duration, playbackState.currentTime + 1/previewSettings.frameRate))}
                >
                  <SkipForward className="w-4 h-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => seekTo(playbackState.currentTime + 10)}
                >
                  <FastForward className="w-4 h-4" />
                </Button>

                <Separator orientation="vertical" className="h-6" />

                {/* Playback Rate */}
                <select
                  value={playbackState.playbackRate}
                  onChange={(e) => changePlaybackRate(Number(e.target.value))}
                  className="bg-gray-700 text-white text-sm rounded px-2 py-1"
                >
                  {playbackRates.map(rate => (
                    <option key={rate} value={rate}>{rate}x</option>
                  ))}
                </select>

                <Separator orientation="vertical" className="h-6" />

                {/* Volume Control */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleMute}
                >
                  {playbackState.muted ? 
                    <VolumeX className="w-4 h-4" /> : 
                    <Volume2 className="w-4 h-4" />
                  }
                </Button>

                <Slider
                  min={0}
                  max={100}
                  step={1}
                  value={[playbackState.muted ? 0 : playbackState.volume]}
                  onValueChange={([value]) => setVolume(value)}
                  className="w-20"
                />

                <Separator orientation="vertical" className="h-6" />

                {/* Loop and Markers */}
                <Button
                  variant={playbackState.loop ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPlaybackState(prev => ({ ...prev, loop: !prev.loop }))}
                >
                  <Repeat className="w-4 h-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addMarker(playbackState.currentTime, 'bookmark')}
                >
                  <Bookmark className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Panel */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 overflow-y-auto">
          <Tabs defaultValue="preview" className="h-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="viewport">Viewport</TabsTrigger>
              <TabsTrigger value="markers">Marcadores</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="p-4 space-y-4">
              <Card className="bg-gray-700 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-sm">Configurações de Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Qualidade</Label>
                    <select 
                      value={previewSettings.quality}
                      onChange={(e) => {
                        const value = e.target.value
                        if (isPreviewQuality(value)) {
                          setPreviewSettings(prev => ({ ...prev, quality: value }))
                        }
                      }}
                      className="w-full mt-1 bg-gray-600 text-white text-sm rounded px-3 py-2"
                    >
                      <option value="low">Baixa</option>
                      <option value="medium">Média</option>
                      <option value="high">Alta</option>
                      <option value="ultra">Ultra</option>
                    </select>
                  </div>

                  <div>
                    <Label className="text-xs">Resolução</Label>
                    <select 
                      value={previewSettings.resolution}
                      onChange={(e) => {
                        const value = e.target.value
                        if (isPreviewResolution(value)) {
                          setPreviewSettings(prev => ({ ...prev, resolution: value }))
                        }
                      }}
                      className="w-full mt-1 bg-gray-600 text-white text-sm rounded px-3 py-2"
                    >
                      <option value="480p">480p</option>
                      <option value="720p">720p</option>
                      <option value="1080p">1080p</option>
                      <option value="4K">4K</option>
                    </select>
                  </div>

                  <div>
                    <Label className="text-xs">Frame Rate</Label>
                    <select 
                      value={previewSettings.frameRate}
                      onChange={(e) => {
                        const value = Number(e.target.value)
                        if (isPreviewFrameRate(value)) {
                          setPreviewSettings(prev => ({ ...prev, frameRate: value }))
                        }
                      }}
                      className="w-full mt-1 bg-gray-600 text-white text-sm rounded px-3 py-2"
                    >
                      <option value={24}>24 fps</option>
                      <option value={30}>30 fps</option>
                      <option value={60}>60 fps</option>
                      <option value={120}>120 fps</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Processamento Tempo Real</Label>
                    <Switch
                      checked={previewSettings.realTimeProcessing}
                      onCheckedChange={(checked) => setPreviewSettings(prev => ({ 
                        ...prev, 
                        realTimeProcessing: checked 
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Aceleração Hardware</Label>
                    <Switch
                      checked={previewSettings.hardwareAcceleration}
                      onCheckedChange={(checked) => setPreviewSettings(prev => ({ 
                        ...prev, 
                        hardwareAcceleration: checked 
                      }))}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="viewport" className="p-4 space-y-4">
              <Card className="bg-gray-700 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-sm">Configurações de Viewport</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Zoom (%)</Label>
                    <Slider
                      min={25}
                      max={400}
                      step={25}
                      value={[viewportSettings.zoom]}
                      onValueChange={([value]) => setViewportSettings(prev => ({ 
                        ...prev, 
                        zoom: value 
                      }))}
                      className="mt-2"
                    />
                    <div className="text-xs text-gray-400 mt-1">
                      {viewportSettings.zoom}%
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">Aspect Ratio</Label>
                    <select 
                      value={viewportSettings.aspectRatio}
                      onChange={(e) => {
                        const value = e.target.value
                        if (isAspectRatio(value)) {
                          setViewportSettings(prev => ({ ...prev, aspectRatio: value }))
                        }
                      }}
                      className="w-full mt-1 bg-gray-600 text-white text-sm rounded px-3 py-2"
                    >
                      <option value="16:9">16:9</option>
                      <option value="4:3">4:3</option>
                      <option value="21:9">21:9</option>
                      <option value="1:1">1:1</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Mostrar Grade</Label>
                    <Switch
                      checked={viewportSettings.showGrid}
                      onCheckedChange={(checked) => setViewportSettings(prev => ({ 
                        ...prev, 
                        showGrid: checked 
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Áreas Seguras</Label>
                    <Switch
                      checked={viewportSettings.showSafeAreas}
                      onCheckedChange={(checked) => setViewportSettings(prev => ({ 
                        ...prev, 
                        showSafeAreas: checked 
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Réguas</Label>
                    <Switch
                      checked={viewportSettings.showRulers}
                      onCheckedChange={(checked) => setViewportSettings(prev => ({ 
                        ...prev, 
                        showRulers: checked 
                      }))}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="markers" className="p-4">
              <Card className="bg-gray-700 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-sm">Marcadores da Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {markers.map((marker) => (
                        <div key={marker.id} className="flex items-center gap-3 p-2 bg-gray-600 rounded">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: marker.color }}
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium">{marker.label}</div>
                            <div className="text-xs text-gray-400">
                              {formatTime(marker.time)} • {marker.type}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => seekTo(marker.time)}
                          >
                            <Play className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addMarker(playbackState.currentTime, 'in')}
                      className="flex-1"
                    >
                      <Flag className="w-3 h-3 mr-1" />
                      In
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addMarker(playbackState.currentTime, 'out')}
                      className="flex-1"
                    >
                      <Flag className="w-3 h-3 mr-1" />
                      Out
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}