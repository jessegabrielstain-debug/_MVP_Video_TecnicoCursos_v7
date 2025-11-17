
'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
// Timeline editor uses custom drag/resize implementation
import ReactPlayer from 'react-player'
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
  Minimize
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

interface TimelineTrack {
  id: string
  type: 'video' | 'audio' | 'text' | 'image' | 'effect'
  name: string
  color: string
  items: TimelineItem[]
  visible: boolean
  locked: boolean
  muted?: boolean
  volume?: number
}

interface TimelineItem {
  id: string
  start: number
  duration: number
  content: string
  properties?: Record<string, unknown>
  selected?: boolean
}

interface TimelineState {
  currentTime: number
  duration: number
  playing: boolean
  zoom: number
  tracks: TimelineTrack[]
  selectedItems: string[]
}

const TRACK_HEIGHT = 60
const PIXELS_PER_SECOND = 30
const MAX_ZOOM = 5
const MIN_ZOOM = 0.1

export default function ProfessionalTimelineEditor() {
  const [timelineState, setTimelineState] = useState<TimelineState>({
    currentTime: 0,
    duration: 300, // 5 minutes
    playing: false,
    zoom: 1,
    tracks: [
      {
        id: 'video-1',
        type: 'video',
        name: 'Vídeo Principal',
        color: '#3B82F6',
        visible: true,
        locked: false,
        items: [
          { id: 'v1', start: 0, duration: 120, content: 'Intro.mp4' },
          { id: 'v2', start: 130, duration: 80, content: 'Conteudo.mp4' }
        ]
      },
      {
        id: 'audio-1',
        type: 'audio',
        name: 'Narração TTS',
        color: '#10B981',
        visible: true,
        locked: false,
        volume: 80,
        items: [
          { id: 'a1', start: 0, duration: 200, content: 'Narração completa' }
        ]
      },
      {
        id: 'audio-2',
        type: 'audio',
        name: 'Música de Fundo',
        color: '#8B5CF6',
        visible: true,
        locked: false,
        volume: 30,
        items: [
          { id: 'a2', start: 0, duration: 300, content: 'Background.mp3' }
        ]
      },
      {
        id: 'text-1',
        type: 'text',
        name: 'Legendas',
        color: '#F59E0B',
        visible: true,
        locked: false,
        items: [
          { id: 't1', start: 10, duration: 30, content: 'Introdução ao tema' },
          { id: 't2', start: 50, duration: 40, content: 'Conceitos principais' }
        ]
      },
      {
        id: 'effect-1',
        type: 'effect',
        name: 'Transições',
        color: '#EF4444',
        visible: true,
        locked: false,
        items: [
          { id: 'e1', start: 120, duration: 3, content: 'Fade In' },
          { id: 'e2', start: 207, duration: 3, content: 'Fade Out' }
        ]
      }
    ],
    selectedItems: []
  })

  const timelineRef = useRef<HTMLDivElement>(null)
  const playheadRef = useRef<HTMLDivElement>(null)

  // Timeline controls
  const togglePlayback = useCallback(() => {
    setTimelineState(prev => ({ ...prev, playing: !prev.playing }))
  }, [])

  const setCurrentTime = useCallback((time: number) => {
    setTimelineState(prev => ({ 
      ...prev, 
      currentTime: Math.max(0, Math.min(time, prev.duration))
    }))
  }, [])

  const setZoom = useCallback((zoom: number) => {
    setTimelineState(prev => ({ 
      ...prev, 
      zoom: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom))
    }))
  }, [])

  // Track management
  const toggleTrackVisibility = useCallback((trackId: string) => {
    setTimelineState(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => 
        track.id === trackId ? { ...track, visible: !track.visible } : track
      )
    }))
  }, [])

  const toggleTrackLock = useCallback((trackId: string) => {
    setTimelineState(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => 
        track.id === trackId ? { ...track, locked: !track.locked } : track
      )
    }))
  }, [])

  const updateTrackVolume = useCallback((trackId: string, volume: number) => {
    setTimelineState(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => 
        track.id === trackId ? { ...track, volume } : track
      )
    }))
  }, [])

  // Item management
  const selectItem = useCallback((itemId: string, multiSelect = false) => {
    setTimelineState(prev => ({
      ...prev,
      selectedItems: multiSelect 
        ? prev.selectedItems.includes(itemId)
          ? prev.selectedItems.filter(id => id !== itemId)
          : [...prev.selectedItems, itemId]
        : [itemId]
    }))
  }, [])

  const moveItem = useCallback((trackId: string, itemId: string, newStart: number) => {
    setTimelineState(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => 
        track.id === trackId ? {
          ...track,
          items: track.items.map(item =>
            item.id === itemId ? { ...item, start: Math.max(0, newStart) } : item
          )
        } : track
      )
    }))
  }, [])

  const resizeItem = useCallback((trackId: string, itemId: string, newDuration: number) => {
    setTimelineState(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => 
        track.id === trackId ? {
          ...track,
          items: track.items.map(item =>
            item.id === itemId ? { ...item, duration: Math.max(1, newDuration) } : item
          )
        } : track
      )
    }))
  }, [])

  const duplicateItem = useCallback((trackId: string, itemId: string) => {
    setTimelineState(prev => {
      const track = prev.tracks.find(t => t.id === trackId)
      const item = track?.items.find(i => i.id === itemId)
      if (!item) return prev

      const newItem = {
        ...item,
        id: `${item.id}-copy-${Date.now()}`,
        start: item.start + item.duration + 1
      }

      return {
        ...prev,
        tracks: prev.tracks.map(t => 
          t.id === trackId ? { ...t, items: [...t.items, newItem] } : t
        )
      }
    })
  }, [])

  const deleteSelectedItems = useCallback(() => {
    setTimelineState(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => ({
        ...track,
        items: track.items.filter(item => !prev.selectedItems.includes(item.id))
      })),
      selectedItems: []
    }))
  }, [])

  // Export functionality
  const exportTimeline = useCallback(() => {
    const exportData = {
      version: '1.0',
      duration: timelineState.duration,
      tracks: timelineState.tracks,
      exported: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `timeline-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [timelineState])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return

      switch (e.key) {
        case ' ':
          e.preventDefault()
          togglePlayback()
          break
        case 'Delete':
        case 'Backspace':
          deleteSelectedItems()
          break
        case 'c':
          if (e.ctrlKey || e.metaKey) {
            // Copy functionality
          }
          break
        case 'v':
          if (e.ctrlKey || e.metaKey) {
            // Paste functionality
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [togglePlayback, deleteSelectedItems])

  // Format time display
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  const getTrackIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4" />
      case 'audio': return <Mic className="w-4 h-4" />
      case 'text': return <Type className="w-4 h-4" />
      case 'image': return <ImageIcon className="w-4 h-4" />
      case 'effect': return <Zap className="w-4 h-4" />
      default: return <Layers className="w-4 h-4" />
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">Timeline Professional</h1>
          <Badge variant="secondary">v2.0</Badge>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentTime(0)}
            className="text-white hover:bg-gray-700"
          >
            <SkipBack className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={togglePlayback}
            className="text-white hover:bg-gray-700"
          >
            {timelineState.playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setTimelineState(prev => ({ ...prev, playing: false }))
              setCurrentTime(0)
            }}
            className="text-white hover:bg-gray-700"
          >
            <Square className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentTime(timelineState.duration)}
            className="text-white hover:bg-gray-700"
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>

        {/* Time Display */}
        <div className="flex items-center gap-4">
          <div className="text-sm font-mono">
            {formatTime(timelineState.currentTime)} / {formatTime(timelineState.duration)}
          </div>
          
          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <Label htmlFor="zoom" className="text-sm">Zoom</Label>
            <Slider
              id="zoom"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.1}
              value={[timelineState.zoom]}
              onValueChange={([zoom]) => setZoom(zoom)}
              className="w-20"
            />
            <span className="text-xs text-gray-400">
              {Math.round(timelineState.zoom * 100)}%
            </span>
          </div>

          {/* Export */}
          <Button onClick={exportTimeline} className="bg-blue-600 hover:bg-blue-700">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Track Controls */}
        <div className="w-64 bg-gray-800 border-r border-gray-700">
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-sm font-semibold mb-2">Tracks</h3>
            <Button size="sm" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Track
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2">
              {timelineState.tracks.map((track) => (
                <Card key={track.id} className="mb-2 bg-gray-700 border-gray-600">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getTrackIcon(track.type)}
                        <span className="text-sm font-medium">{track.name}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleTrackVisibility(track.id)}
                          className="w-6 h-6"
                        >
                          {track.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleTrackLock(track.id)}
                          className="w-6 h-6"
                        >
                          {track.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                        </Button>
                      </div>
                    </div>

                    <div 
                      className="w-full h-2 rounded mb-2"
                      style={{ backgroundColor: track.color + '40' }}
                    >
                      <div 
                        className="h-full rounded"
                        style={{ 
                          backgroundColor: track.color,
                          width: `${(track.items.reduce((acc, item) => acc + item.duration, 0) / timelineState.duration) * 100}%`
                        }}
                      />
                    </div>

                    {track.type === 'audio' && (
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-3 h-3" />
                        <Slider
                          min={0}
                          max={100}
                          value={[track.volume || 80]}
                          onValueChange={([volume]) => updateTrackVolume(track.id, volume)}
                          className="flex-1"
                        />
                        <span className="text-xs text-gray-400">
                          {track.volume || 80}%
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Timeline */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Timeline Ruler */}
          <div className="h-12 bg-gray-800 border-b border-gray-700 relative">
            <div className="absolute inset-0 overflow-hidden">
              {Array.from({ length: Math.ceil(timelineState.duration / 10) }, (_, i) => (
                <div
                  key={i}
                  className="absolute border-l border-gray-600"
                  style={{
                    left: `${i * 10 * PIXELS_PER_SECOND * timelineState.zoom}px`,
                    height: '100%'
                  }}
                >
                  <span className="absolute top-1 left-1 text-xs text-gray-400">
                    {formatTime(i * 10)}
                  </span>
                </div>
              ))}
            </div>

            {/* Playhead */}
            <div
              className="absolute top-0 w-0.5 h-full bg-red-500 z-10 cursor-pointer"
              style={{
                left: `${timelineState.currentTime * PIXELS_PER_SECOND * timelineState.zoom}px`,
                transform: 'translateX(-1px)'
              }}
              onClick={(e) => {
                const rect = e.currentTarget.parentElement!.getBoundingClientRect()
                const x = e.clientX - rect.left
                const time = x / (PIXELS_PER_SECOND * timelineState.zoom)
                setCurrentTime(time)
              }}
            >
              <div className="w-2 h-3 bg-red-500 -translate-x-1 rounded-b-sm" />
            </div>
          </div>

          {/* Timeline Tracks */}
          <ScrollArea className="flex-1">
            <div 
              ref={timelineRef}
              className="relative"
              style={{ 
                width: `${timelineState.duration * PIXELS_PER_SECOND * timelineState.zoom}px`,
                minHeight: `${timelineState.tracks.length * TRACK_HEIGHT}px`
              }}
            >
              {timelineState.tracks.map((track, trackIndex) => (
                <div
                  key={track.id}
                  className={cn(
                    "absolute border-b border-gray-700",
                    !track.visible && "opacity-50"
                  )}
                  style={{
                    top: trackIndex * TRACK_HEIGHT,
                    left: 0,
                    right: 0,
                    height: TRACK_HEIGHT
                  }}
                >
                  {track.items.map((item) => (
                    <div
                      key={item.id}
                      className="absolute top-1"
                      style={{
                        left: item.start * PIXELS_PER_SECOND * timelineState.zoom,
                        width: item.duration * PIXELS_PER_SECOND * timelineState.zoom,
                        height: TRACK_HEIGHT - 8,
                        minWidth: 20
                      }}
                    >
                      <div
                        className={cn(
                          "h-full rounded px-2 py-1 cursor-pointer transition-all duration-200",
                          "border-2 border-transparent hover:border-white/20",
                          timelineState.selectedItems.includes(item.id) && "border-blue-400 bg-blue-600/20"
                        )}
                        style={{ backgroundColor: track.color + '80' }}
                        onClick={(e) => selectItem(item.id, e.ctrlKey || e.metaKey)}
                        onDoubleClick={() => {
                          // Open edit modal
                        }}
                      >
                        <div className="text-xs font-medium truncate">{item.content}</div>
                        <div className="text-xs text-gray-300">
                          {formatTime(item.duration)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}

              {/* Playhead extending through all tracks */}
              <div
                className="absolute top-0 w-0.5 bg-red-500 z-20 pointer-events-none"
                style={{
                  left: `${timelineState.currentTime * PIXELS_PER_SECOND * timelineState.zoom}px`,
                  height: `${timelineState.tracks.length * TRACK_HEIGHT}px`,
                  transform: 'translateX(-1px)'
                }}
              />
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Status Bar */}
      <div className="h-8 bg-gray-800 border-t border-gray-700 flex items-center justify-between px-4 text-xs text-gray-400">
        <div className="flex items-center gap-4">
          <span>Items selecionados: {timelineState.selectedItems.length}</span>
          <span>Tracks: {timelineState.tracks.length}</span>
          <span>Duração total: {formatTime(timelineState.duration)}</span>
        </div>
        
        <div className="flex items-center gap-4">
          <span>Resolução: {Math.round(timelineState.zoom * 100)}%</span>
          <span>FPS: 30</span>
          <Badge variant="outline" className="text-green-400 border-green-400">
            <Timer className="w-3 h-3 mr-1" />
            Timeline Ready
          </Badge>
        </div>
      </div>
    </div>
  )
}
