'use client'

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { 
  Play, 
  Pause, 
  Square, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Scissors,
  Copy,
  Trash2,
  Plus,
  Download,
  Upload,
  Settings,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Layers,
  Type,
  Mic,
  Music,
  Image as ImageIcon,
  Video,
  Zap,
  Timer,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  FileText,
  Presentation,
  Clock,
  PlayCircle,
  Wand2
} from 'lucide-react'

// Types for PPTX integration
interface PPTXSlide {
  id: string
  title: string
  content: string
  notes: string
  duration: number
  order: number
  thumbnail?: string
  audioText?: string
  voiceSettings?: VoiceSettings
}

interface VoiceSettings {
  voice: string
  speed: number
  pitch: number
  volume: number
}

interface TimelineTrack {
  id: string
  type: 'video' | 'audio' | 'text' | 'slide' | 'avatar'
  name: string
  visible: boolean
  locked: boolean
  muted?: boolean
  color: string
  clips: TimelineClip[]
}

interface TimelineClip {
  id: string
  trackId: string
  type: 'slide' | 'audio' | 'avatar' | 'transition'
  name: string
  startTime: number
  duration: number
  slideData?: PPTXSlide
  voiceGenerated?: boolean
  avatarEnabled?: boolean
  transitionType?: string
  properties: Record<string, unknown>
}

interface PPTXIntegratedTimelineProps {
  projectId: string
  slides?: PPTXSlide[]
  onSave?: (timelineData: unknown) => void
  onExport?: () => void
  onPreview?: () => void
}

// Drag and Drop Types
const ItemTypes = {
  SLIDE: 'slide',
  CLIP: 'clip',
  TRACK: 'track'
}

// Default track colors
const TRACK_COLORS = {
  video: '#3b82f6',
  audio: '#10b981',
  text: '#f59e0b',
  slide: '#8b5cf6',
  avatar: '#ec4899'
}

export default function PPTXIntegratedTimeline({ 
  projectId, 
  slides = [], 
  onSave, 
  onExport,
  onPreview 
}: PPTXIntegratedTimelineProps) {
  // Timeline State
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [selectedClips, setSelectedClips] = useState<string[]>([])
  const [tracks, setTracks] = useState<TimelineTrack[]>([])
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  
  // PPTX-specific state
  const [autoGenerateVoice, setAutoGenerateVoice] = useState(true)
  const [defaultVoiceSettings, setDefaultVoiceSettings] = useState<VoiceSettings>({
    voice: 'pt-BR-Wavenet-A',
    speed: 1.0,
    pitch: 0,
    volume: 0.8
  })
  const [slideDuration, setSlideDuration] = useState(5) // seconds per slide
  const [enableAvatars, setEnableAvatars] = useState(true)
  const [transitionType, setTransitionType] = useState('fade')

  // Refs
  const timelineRef = useRef<HTMLDivElement>(null)
  const playheadRef = useRef<HTMLDivElement>(null)

  // Initialize timeline with PPTX slides
  useEffect(() => {
    if (slides.length > 0 && tracks.length === 0) {
      initializeTimelineFromPPTX()
    }
  }, [slides])

  // Calculate total duration based on slides
  useEffect(() => {
    const totalDuration = slides.reduce((acc, slide) => acc + (slide.duration || slideDuration), 0)
    setDuration(totalDuration)
  }, [slides, slideDuration])

  const initializeTimelineFromPPTX = useCallback(() => {
    const slideTrack: TimelineTrack = {
      id: 'slides',
      type: 'slide',
      name: 'Slides PPTX',
      visible: true,
      locked: false,
      color: TRACK_COLORS.slide,
      clips: []
    }

    const audioTrack: TimelineTrack = {
      id: 'audio',
      type: 'audio',
      name: 'Narração TTS',
      visible: true,
      locked: false,
      muted: false,
      color: TRACK_COLORS.audio,
      clips: []
    }

    const avatarTrack: TimelineTrack = {
      id: 'avatar',
      type: 'avatar',
      name: 'Avatar 3D',
      visible: enableAvatars,
      locked: false,
      color: TRACK_COLORS.avatar,
      clips: []
    }

    let currentTime = 0

    // Create clips for each slide
    slides.forEach((slide, index) => {
      const slideClip: TimelineClip = {
        id: `slide-${slide.id}`,
        trackId: 'slides',
        type: 'slide',
        name: slide.title || `Slide ${index + 1}`,
        startTime: currentTime,
        duration: slide.duration || slideDuration,
        slideData: slide,
        properties: {
          thumbnail: slide.thumbnail,
          title: slide.title,
          content: slide.content
        }
      }

      // Audio clip for TTS narration
      const audioClip: TimelineClip = {
        id: `audio-${slide.id}`,
        trackId: 'audio',
        type: 'audio',
        name: `Narração ${index + 1}`,
        startTime: currentTime,
        duration: slide.duration || slideDuration,
        voiceGenerated: autoGenerateVoice,
        properties: {
          text: slide.audioText || slide.content,
          voice: defaultVoiceSettings.voice,
          speed: defaultVoiceSettings.speed,
          pitch: defaultVoiceSettings.pitch,
          volume: defaultVoiceSettings.volume
        }
      }

      // Avatar clip (if enabled)
      const avatarClip: TimelineClip = {
        id: `avatar-${slide.id}`,
        trackId: 'avatar',
        type: 'avatar',
        name: `Avatar ${index + 1}`,
        startTime: currentTime,
        duration: slide.duration || slideDuration,
        avatarEnabled: enableAvatars,
        properties: {
          lipSync: true,
          emotion: 'neutral',
          gesture: 'talking'
        }
      }

      slideTrack.clips.push(slideClip)
      audioTrack.clips.push(audioClip)
      if (enableAvatars) {
        avatarTrack.clips.push(avatarClip)
      }

      currentTime += slide.duration || slideDuration
    })

    const newTracks = [slideTrack, audioTrack]
    if (enableAvatars) {
      newTracks.push(avatarTrack)
    }

    setTracks(newTracks)
    toast.success(`Timeline criada com ${slides.length} slides`)
  }, [slides, slideDuration, autoGenerateVoice, defaultVoiceSettings, enableAvatars])

  // Playback controls
  const handlePlay = useCallback(() => {
    setIsPlaying(true)
    toast.success('Reproduzindo vídeo...')
  }, [])

  const handlePause = useCallback(() => {
    setIsPlaying(false)
    toast.info('Vídeo pausado')
  }, [])

  const handleStop = useCallback(() => {
    setIsPlaying(false)
    setCurrentTime(0)
    toast.info('Reprodução parada')
  }, [])

  const handleSeek = useCallback((time: number) => {
    setCurrentTime(Math.max(0, Math.min(time, duration)))
  }, [duration])

  // Timeline zoom controls
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev * 1.5, 5))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev / 1.5, 0.1))
  }, [])

  // Generate voice for specific slide
  const handleGenerateVoice = useCallback(async (slideId: string) => {
    const slide = slides.find(s => s.id === slideId)
    if (!slide) return

    toast.loading('Gerando narração...', { id: 'tts-generation' })
    
    try {
      // Call TTS API - integrate with existing API
      const response = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: slide.audioText || slide.content,
          voice: defaultVoiceSettings.voice,
          speed: defaultVoiceSettings.speed,
          pitch: defaultVoiceSettings.pitch
        })
      })

      if (response.ok) {
        const audioData = await response.json()
        
        // Update track with generated audio
        setTracks(prev => prev.map(track => {
          if (track.id === 'audio') {
            return {
              ...track,
              clips: track.clips.map(clip => 
                clip.id === `audio-${slideId}` 
                  ? { ...clip, voiceGenerated: true, properties: { ...clip.properties, audioUrl: audioData.url } }
                  : clip
              )
            }
          }
          return track
        }))

        toast.success('Narração gerada com sucesso!', { id: 'tts-generation' })
      } else {
        throw new Error('Erro ao gerar narração')
      }
    } catch (error) {
      toast.error('Falha ao gerar narração', { id: 'tts-generation' })
    }
  }, [slides, defaultVoiceSettings])

  // Regenerate all voices
  const handleRegenerateAllVoices = useCallback(async () => {
    toast.loading('Regenerando todas as narrações...', { id: 'tts-all' })
    
    for (const slide of slides) {
      await handleGenerateVoice(slide.id)
    }
    
    toast.success(`${slides.length} narrações regeneradas!`, { id: 'tts-all' })
  }, [slides, handleGenerateVoice])

  // Save timeline data
  const handleSave = useCallback(() => {
    const timelineData = {
      projectId,
      tracks,
      settings: {
        slideDuration,
        autoGenerateVoice,
        defaultVoiceSettings,
        enableAvatars,
        transitionType
      },
      metadata: {
        duration,
        slideCount: slides.length,
        trackCount: tracks.length,
        lastModified: new Date().toISOString()
      }
    }

    if (onSave) {
      onSave(timelineData)
    }
    
    toast.success('Timeline salva com sucesso!')
  }, [projectId, tracks, slideDuration, autoGenerateVoice, defaultVoiceSettings, enableAvatars, transitionType, duration, slides.length, onSave])

  // Timeline clip component with drag support
  const TimelineClipComponent = ({ clip, track }: { clip: TimelineClip; track: TimelineTrack }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
      type: ItemTypes.CLIP,
      item: { id: clip.id, trackId: track.id },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }))

    const clipWidth = (clip.duration / duration) * 100 * zoom
    const clipLeft = (clip.startTime / duration) * 100 * zoom

    return (
      <motion.div
        ref={drag}
        className={`absolute h-8 bg-opacity-80 rounded border-2 cursor-move overflow-hidden ${
          selectedClips.includes(clip.id) ? 'border-white' : 'border-transparent'
        } ${isDragging ? 'opacity-50' : ''}`}
        style={{
          left: `${clipLeft}%`,
          width: `${clipWidth}%`,
          backgroundColor: track.color,
          minWidth: '40px'
        }}
        onClick={() => {
          setSelectedClips(prev => 
            prev.includes(clip.id) 
              ? prev.filter(id => id !== clip.id)
              : [...prev, clip.id]
          )
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="p-1 text-xs text-white font-medium truncate">
          {clip.name}
        </div>
        
        {/* Clip type indicators */}
        <div className="absolute top-0 right-1 flex space-x-1">
          {clip.type === 'slide' && <FileText className="w-3 h-3 text-white" />}
          {clip.type === 'audio' && clip.voiceGenerated && <Mic className="w-3 h-3 text-green-300" />}
          {clip.type === 'avatar' && clip.avatarEnabled && <Video className="w-3 h-3 text-pink-300" />}
        </div>
      </motion.div>
    )
  }

  // Track component with drop support
  const TimelineTrackComponent = ({ track }: { track: TimelineTrack }) => {
    const [{ isOver }, drop] = useDrop(() => ({
      accept: ItemTypes.CLIP,
      drop: (item: { id: string; trackId: string }) => {
        // Handle clip movement between tracks
        console.log('Clip dropped:', item)
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
    }))

    return (
      <div className={`relative border-b border-border ${isOver ? 'bg-accent' : ''}`}>
        <div className="flex items-center p-2 bg-muted/50 border-r border-border w-48">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setTracks(prev => prev.map(t => 
                t.id === track.id ? { ...t, visible: !t.visible } : t
              ))
            }}
          >
            {track.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setTracks(prev => prev.map(t => 
                t.id === track.id ? { ...t, locked: !t.locked } : t
              ))
            }}
          >
            {track.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </Button>
          
          <div 
            className="w-3 h-3 rounded mr-2"
            style={{ backgroundColor: track.color }}
          />
          
          <span className="text-sm font-medium truncate">{track.name}</span>
        </div>
        
        <div ref={drop} className="relative h-12 bg-background/50">
          {track.clips.map(clip => (
            <TimelineClipComponent key={clip.id} clip={clip} track={track} />
          ))}
        </div>
      </div>
    )
  }

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-screen bg-background">
        {/* Left sidebar - PPTX Controls */}
        <div className="w-80 border-r border-border bg-muted/30 p-4 overflow-y-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Presentation className="mr-2 h-5 w-5" />
                Configurações PPTX
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Slide Duration */}
              <div>
                <Label className="text-sm font-medium">Duração por Slide (segundos)</Label>
                <Slider
                  value={[slideDuration]}
                  onValueChange={([value]) => setSlideDuration(value)}
                  min={1}
                  max={30}
                  step={1}
                  className="mt-2"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {slideDuration}s por slide
                </div>
              </div>

              <Separator />

              {/* Voice Settings */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">Narração TTS</Label>
                  <Switch
                    checked={autoGenerateVoice}
                    onCheckedChange={setAutoGenerateVoice}
                  />
                </div>
                
                {autoGenerateVoice && (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs">Voz</Label>
                      <select 
                        className="w-full mt-1 p-2 border rounded text-sm"
                        value={defaultVoiceSettings.voice}
                        onChange={(e) => setDefaultVoiceSettings(prev => ({ ...prev, voice: e.target.value }))}
                      >
                        <option value="pt-BR-Wavenet-A">Portuguesa (Feminina)</option>
                        <option value="pt-BR-Wavenet-B">Portuguesa (Masculina)</option>
                        <option value="en-US-Wavenet-D">Inglês (Masculino)</option>
                        <option value="en-US-Wavenet-F">Inglês (Feminino)</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label className="text-xs">Velocidade: {defaultVoiceSettings.speed}x</Label>
                      <Slider
                        value={[defaultVoiceSettings.speed]}
                        onValueChange={([value]) => setDefaultVoiceSettings(prev => ({ ...prev, speed: value }))}
                        min={0.5}
                        max={2}
                        step={0.1}
                        className="mt-1"
                      />
                    </div>
                    
                    <Button 
                      onClick={handleRegenerateAllVoices}
                      className="w-full"
                      size="sm"
                    >
                      <Wand2 className="mr-2 h-4 w-4" />
                      Regenerar Todas as Vozes
                    </Button>
                  </div>
                )}
              </div>

              <Separator />

              {/* Avatar Settings */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">Avatar 3D</Label>
                  <Switch
                    checked={enableAvatars}
                    onCheckedChange={setEnableAvatars}
                  />
                </div>
              </div>

              <Separator />

              {/* Transition Settings */}
              <div>
                <Label className="text-sm font-medium">Transições</Label>
                <select 
                  className="w-full mt-1 p-2 border rounded text-sm"
                  value={transitionType}
                  onChange={(e) => setTransitionType(e.target.value)}
                >
                  <option value="fade">Fade</option>
                  <option value="slide">Slide</option>
                  <option value="zoom">Zoom</option>
                  <option value="dissolve">Dissolve</option>
                </select>
              </div>

              <Separator />

              {/* Stats */}
              <div className="text-xs text-muted-foreground space-y-1">
                <div>📊 {slides.length} slides carregados</div>
                <div>⏱️ Duração total: {formatTime(duration)}</div>
                <div>🎭 {tracks.length} tracks criadas</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main timeline area */}
        <div className="flex-1 flex flex-col">
          {/* Transport controls */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
            <div className="flex items-center space-x-2">
              <Button
                variant={isPlaying ? "default" : "outline"}
                size="sm"
                onClick={isPlaying ? handlePause : handlePlay}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              
              <Button variant="outline" size="sm" onClick={handleStop}>
                <Square className="h-4 w-4" />
              </Button>
              
              <Button variant="outline" size="sm" onClick={() => handleSeek(0)}>
                <SkipBack className="h-4 w-4" />
              </Button>
              
              <Button variant="outline" size="sm" onClick={() => handleSeek(duration)}>
                <SkipForward className="h-4 w-4" />
              </Button>
              
              <Separator orientation="vertical" className="h-6" />
              
              <div className="text-sm font-mono">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              
              <div className="text-xs px-2">
                {Math.round(zoom * 100)}%
              </div>
              
              <Button variant="outline" size="sm" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              
              <Separator orientation="vertical" className="h-6" />
              
              <Button variant="outline" size="sm" onClick={handleSave}>
                <Download className="h-4 w-4 mr-2" />
                Salvar
              </Button>
              
              {onPreview && (
                <Button variant="outline" size="sm" onClick={onPreview}>
                  <PlayCircle className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              )}
              
              {onExport && (
                <Button size="sm" onClick={onExport}>
                  <Video className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="flex-1 overflow-auto">
            <div className="relative">
              {/* Time ruler */}
              <div className="sticky top-0 z-10 bg-background border-b border-border">
                <div className="flex h-8 text-xs text-muted-foreground">
                  <div className="w-48 border-r border-border flex items-center justify-center font-medium">
                    Timeline
                  </div>
                  <div className="flex-1 relative">
                    {Array.from({ length: Math.ceil(duration) }, (_, i) => (
                      <div
                        key={i}
                        className="absolute top-0 h-full border-l border-border/50 flex items-center pl-1"
                        style={{ left: `${(i / duration) * 100 * zoom}%` }}
                      >
                        {formatTime(i)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tracks */}
              <div ref={timelineRef} className="relative">
                {tracks.map(track => (
                  <TimelineTrackComponent key={track.id} track={track} />
                ))}
              </div>

              {/* Playhead */}
              <div
                ref={playheadRef}
                className="absolute top-0 w-0.5 bg-red-500 z-20 pointer-events-none"
                style={{
                  left: `calc(12rem + ${(currentTime / duration) * 100 * zoom}%)`,
                  height: `${tracks.length * 48 + 32}px`
                }}
              >
                <div className="w-3 h-3 bg-red-500 rounded-full -translate-x-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  )
}