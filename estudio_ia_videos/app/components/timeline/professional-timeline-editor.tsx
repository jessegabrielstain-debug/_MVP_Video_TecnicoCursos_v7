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
  Save,
  FileVideo,
  Waveform,
  Sparkles,
  Target,
  Clock,
  FastForward,
  Rewind
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { toast } from 'sonner'

// Types
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
  height?: number
  collapsed?: boolean
}

interface TimelineItem {
  id: string
  start: number
  duration: number
  content: string
  properties?: Record<string, unknown>
  selected?: boolean
  keyframes?: Keyframe[]
  effects?: Effect[]
  locked?: boolean
}

interface Keyframe {
  id: string
  time: number
  properties: Record<string, unknown>
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'cubic-bezier'
}

interface Effect {
  id: string
  type: 'fade' | 'slide' | 'zoom' | 'rotate' | 'blur' | 'color'
  parameters: Record<string, unknown>
  enabled: boolean
}

interface TimelineState {
  currentTime: number
  duration: number
  playing: boolean
  zoom: number
  tracks: TimelineTrack[]
  selectedItems: string[]
  playbackSpeed: number
  snapToGrid: boolean
  gridSize: number
  previewQuality: 'low' | 'medium' | 'high'
  renderSettings: RenderSettings
}

interface RenderSettings {
  resolution: '720p' | '1080p' | '4K'
  fps: 24 | 30 | 60
  format: 'mp4' | 'mov' | 'avi'
  quality: 'low' | 'medium' | 'high' | 'ultra'
  audioSampleRate: 44100 | 48000
  audioBitrate: 128 | 256 | 320
}

interface HistoryState {
  action: string
  timestamp: number
  state: Partial<TimelineState>
}

const previewQualityOptions: TimelineState['previewQuality'][] = ['low', 'medium', 'high']

const isPreviewQuality = (value: string): value is TimelineState['previewQuality'] =>
  previewQualityOptions.some((option) => option === value)

// Constants
const TRACK_HEIGHT = 80
const PIXELS_PER_SECOND = 50
const MAX_ZOOM = 10
const MIN_ZOOM = 0.1
const GRID_SNAP_THRESHOLD = 5
const MAX_HISTORY = 50

// Drag and Drop Types
const ItemTypes = {
  TIMELINE_ITEM: 'timeline_item',
  TRACK: 'track'
}

// Timeline Item Component with Drag
const DraggableTimelineItem: React.FC<{
  item: TimelineItem
  track: TimelineTrack
  zoom: number
  onSelect: (id: string, multi: boolean) => void
  onMove: (trackId: string, itemId: string, newStart: number) => void
  onResize: (trackId: string, itemId: string, newDuration: number) => void
  selected: boolean
  snapToGrid: boolean
  gridSize: number
}> = ({ item, track, zoom, onSelect, onMove, onResize, selected, snapToGrid, gridSize }) => {
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.TIMELINE_ITEM,
    item: { id: item.id, trackId: track.id, type: 'move' },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const [isResizing, setIsResizing] = useState(false)
  const itemRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.detail === 2) {
      // Double click - open edit modal
      return
    }
    onSelect(item.id, e.ctrlKey || e.metaKey)
  }, [item.id, onSelect])

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsResizing(true)
    
    const startX = e.clientX
    const startDuration = item.duration
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX
      const deltaTime = deltaX / (PIXELS_PER_SECOND * zoom)
      let newDuration = startDuration + deltaTime
      
      if (snapToGrid) {
        newDuration = Math.round(newDuration / gridSize) * gridSize
      }
      
      newDuration = Math.max(0.1, newDuration)
      onResize(track.id, item.id, newDuration)
    }
    
    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [item.duration, item.id, track.id, zoom, onResize, snapToGrid, gridSize])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div
      ref={drag}
      className={cn(
        "absolute top-2 rounded-lg border-2 transition-all duration-200 cursor-pointer group",
        "hover:shadow-lg hover:scale-105",
        selected ? "border-blue-400 bg-blue-600/20 shadow-blue-400/50" : "border-transparent",
        isDragging && "opacity-50",
        track.locked && "cursor-not-allowed opacity-60"
      )}
      style={{
        left: item.start * PIXELS_PER_SECOND * zoom,
        width: Math.max(item.duration * PIXELS_PER_SECOND * zoom, 60),
        height: TRACK_HEIGHT - 16,
        backgroundColor: track.color + '80',
        minWidth: 60
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="h-full flex flex-col justify-between p-2 relative">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold text-white truncate">
            {item.content}
          </div>
          {item.keyframes && item.keyframes.length > 0 && (
            <Sparkles className="w-3 h-3 text-yellow-400" />
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-200">
            {formatTime(item.duration)}
          </div>
          {item.effects && item.effects.length > 0 && (
            <Zap className="w-3 h-3 text-purple-400" />
          )}
        </div>

        {/* Resize Handle */}
        <div
          className="absolute right-0 top-0 w-2 h-full cursor-ew-resize bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
          onMouseDown={handleResizeStart}
        />

        {/* Keyframe indicators */}
        {item.keyframes?.map((keyframe) => (
          <div
            key={keyframe.id}
            className="absolute top-0 w-1 h-full bg-yellow-400"
            style={{
              left: (keyframe.time - item.start) * PIXELS_PER_SECOND * zoom
            }}
          />
        ))}
      </div>
    </div>
  )
}

// Track Component with Drop
const DroppableTrack: React.FC<{
  track: TimelineTrack
  zoom: number
  duration: number
  selectedItems: string[]
  onItemSelect: (id: string, multi: boolean) => void
  onItemMove: (trackId: string, itemId: string, newStart: number) => void
  onItemResize: (trackId: string, itemId: string, newDuration: number) => void
  snapToGrid: boolean
  gridSize: number
}> = ({ track, zoom, duration, selectedItems, onItemSelect, onItemMove, onItemResize, snapToGrid, gridSize }) => {
  const [{ isOver }, drop] = useDrop({
    accept: ItemTypes.TIMELINE_ITEM,
    drop: (item: unknown, monitor) => {
      const offset = monitor.getClientOffset()
      if (!offset) return

      const trackElement = document.getElementById(`track-${track.id}`)
      if (!trackElement) return

      const rect = trackElement.getBoundingClientRect()
      const x = offset.x - rect.left
      let newStart = x / (PIXELS_PER_SECOND * zoom)

      if (snapToGrid) {
        newStart = Math.round(newStart / gridSize) * gridSize
      }

      newStart = Math.max(0, newStart)
      onItemMove(track.id, item.id, newStart)
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  })

  return (
    <div
      ref={drop}
      id={`track-${track.id}`}
      className={cn(
        "relative border-b border-gray-700 transition-colors",
        !track.visible && "opacity-50",
        isOver && "bg-blue-500/10"
      )}
      style={{
        height: track.height || TRACK_HEIGHT,
        width: duration * PIXELS_PER_SECOND * zoom
      }}
    >
      {/* Grid lines */}
      {snapToGrid && Array.from({ length: Math.ceil(duration / gridSize) }, (_, i) => (
        <div
          key={i}
          className="absolute top-0 h-full w-px bg-gray-600/30"
          style={{ left: i * gridSize * PIXELS_PER_SECOND * zoom }}
        />
      ))}

      {/* Track items */}
      {track.items.map((item) => (
        <DraggableTimelineItem
          key={item.id}
          item={item}
          track={track}
          zoom={zoom}
          onSelect={onItemSelect}
          onMove={onItemMove}
          onResize={onItemResize}
          selected={selectedItems.includes(item.id)}
          snapToGrid={snapToGrid}
          gridSize={gridSize}
        />
      ))}
    </div>
  )
}

export default function ProfessionalTimelineEditor() {
  const [timelineState, setTimelineState] = useState<TimelineState>({
    currentTime: 0,
    duration: 300,
    playing: false,
    zoom: 1,
    playbackSpeed: 1,
    snapToGrid: true,
    gridSize: 1,
    previewQuality: 'medium',
    tracks: [
      {
        id: 'video-1',
        type: 'video',
        name: 'Vídeo Principal',
        color: '#3B82F6',
        visible: true,
        locked: false,
        height: TRACK_HEIGHT,
        items: [
          { 
            id: 'v1', 
            start: 0, 
            duration: 120, 
            content: 'Intro.mp4',
            keyframes: [
              { id: 'kf1', time: 0, properties: { opacity: 0 }, easing: 'ease-in' },
              { id: 'kf2', time: 2, properties: { opacity: 1 }, easing: 'ease-out' }
            ]
          },
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
        height: TRACK_HEIGHT,
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
        height: TRACK_HEIGHT,
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
        height: TRACK_HEIGHT,
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
        height: TRACK_HEIGHT,
        items: [
          { 
            id: 'e1', 
            start: 120, 
            duration: 3, 
            content: 'Fade In',
            effects: [
              { id: 'fx1', type: 'fade', parameters: { direction: 'in' }, enabled: true }
            ]
          },
          { id: 'e2', start: 207, duration: 3, content: 'Fade Out' }
        ]
      }
    ],
    selectedItems: [],
    renderSettings: {
      resolution: '1080p',
      fps: 30,
      format: 'mp4',
      quality: 'high',
      audioSampleRate: 48000,
      audioBitrate: 256
    }
  })

  const [history, setHistory] = useState<HistoryState[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [showRenderSettings, setShowRenderSettings] = useState(false)

  const timelineRef = useRef<HTMLDivElement>(null)
  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // History management
  const saveToHistory = useCallback((action: string, state: Partial<TimelineState>) => {
    const newHistoryItem: HistoryState = {
      action,
      timestamp: Date.now(),
      state
    }

    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1)
      newHistory.push(newHistoryItem)
      return newHistory.slice(-MAX_HISTORY)
    })
    setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY - 1))
  }, [historyIndex])

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1]
      setTimelineState(prev => ({ ...prev, ...prevState.state }))
      setHistoryIndex(prev => prev - 1)
      toast.success(`Desfez: ${prevState.action}`)
    }
  }, [history, historyIndex])

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1]
      setTimelineState(prev => ({ ...prev, ...nextState.state }))
      setHistoryIndex(prev => prev + 1)
      toast.success(`Refez: ${nextState.action}`)
    }
  }, [history, historyIndex])

  // Playback controls
  const togglePlayback = useCallback(() => {
    const newPlaying = !timelineState.playing
    setTimelineState(prev => ({ ...prev, playing: newPlaying }))

    if (newPlaying) {
      playbackIntervalRef.current = setInterval(() => {
        setTimelineState(prev => {
          const newTime = prev.currentTime + (0.1 * prev.playbackSpeed)
          if (newTime >= prev.duration) {
            if (playbackIntervalRef.current) {
              clearInterval(playbackIntervalRef.current)
            }
            return { ...prev, playing: false, currentTime: prev.duration }
          }
          return { ...prev, currentTime: newTime }
        })
      }, 100)
    } else {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current)
      }
    }
  }, [timelineState.playing])

  const setCurrentTime = useCallback((time: number) => {
    setTimelineState(prev => ({ 
      ...prev, 
      currentTime: Math.max(0, Math.min(time, prev.duration))
    }))
  }, [])

  const setZoom = useCallback((zoom: number) => {
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom))
    setTimelineState(prev => ({ ...prev, zoom: newZoom }))
    saveToHistory('Zoom alterado', { zoom: newZoom })
  }, [saveToHistory])

  const setPlaybackSpeed = useCallback((speed: number) => {
    setTimelineState(prev => ({ ...prev, playbackSpeed: speed }))
  }, [])

  // Track management
  const toggleTrackVisibility = useCallback((trackId: string) => {
    setTimelineState(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => 
        track.id === trackId ? { ...track, visible: !track.visible } : track
      )
    }))
    saveToHistory('Visibilidade da track alterada', {})
  }, [saveToHistory])

  const toggleTrackLock = useCallback((trackId: string) => {
    setTimelineState(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => 
        track.id === trackId ? { ...track, locked: !track.locked } : track
      )
    }))
    saveToHistory('Lock da track alterado', {})
  }, [saveToHistory])

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
    saveToHistory('Item movido', {})
  }, [saveToHistory])

  const resizeItem = useCallback((trackId: string, itemId: string, newDuration: number) => {
    setTimelineState(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => 
        track.id === trackId ? {
          ...track,
          items: track.items.map(item =>
            item.id === itemId ? { ...item, duration: Math.max(0.1, newDuration) } : item
          )
        } : track
      )
    }))
    saveToHistory('Item redimensionado', {})
  }, [saveToHistory])

  const duplicateSelectedItems = useCallback(() => {
    setTimelineState(prev => {
      const newTracks = prev.tracks.map(track => {
        const newItems = [...track.items]
        track.items.forEach(item => {
          if (prev.selectedItems.includes(item.id)) {
            const newItem = {
              ...item,
              id: `${item.id}-copy-${Date.now()}`,
              start: item.start + item.duration + 1
            }
            newItems.push(newItem)
          }
        })
        return { ...track, items: newItems }
      })
      return { ...prev, tracks: newTracks, selectedItems: [] }
    })
    saveToHistory('Itens duplicados', {})
    toast.success('Itens duplicados com sucesso')
  }, [saveToHistory])

  const deleteSelectedItems = useCallback(() => {
    setTimelineState(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => ({
        ...track,
        items: track.items.filter(item => !prev.selectedItems.includes(item.id))
      })),
      selectedItems: []
    }))
    saveToHistory('Itens deletados', {})
    toast.success('Itens deletados com sucesso')
  }, [saveToHistory])

  // Export functionality
  const exportTimeline = useCallback(() => {
    const exportData = {
      version: '2.0',
      metadata: {
        name: 'Timeline Professional Export',
        duration: timelineState.duration,
        fps: timelineState.renderSettings.fps,
        resolution: timelineState.renderSettings.resolution,
        exported: new Date().toISOString(),
        totalTracks: timelineState.tracks.length,
        totalItems: timelineState.tracks.reduce((acc, track) => acc + track.items.length, 0)
      },
      renderSettings: timelineState.renderSettings,
      tracks: timelineState.tracks.map(track => ({
        ...track,
        items: track.items.map(item => ({
          ...item,
          absoluteStart: item.start,
          absoluteEnd: item.start + item.duration,
          trackType: track.type,
          renderProperties: {
            visible: track.visible,
            volume: track.volume || 100,
            effects: item.effects || [],
            keyframes: item.keyframes || []
          }
        }))
      })),
      timeline: {
        currentTime: timelineState.currentTime,
        zoom: timelineState.zoom,
        snapToGrid: timelineState.snapToGrid,
        gridSize: timelineState.gridSize
      }
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `timeline-professional-${format(new Date(), 'yyyy-MM-dd-HH-mm-ss')}.json`
    a.click()
    URL.revokeObjectURL(url)
    
    toast.success('Timeline exportada com sucesso!')
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
            duplicateSelectedItems()
          }
          break
        case 'z':
          if (e.ctrlKey || e.metaKey) {
            if (e.shiftKey) {
              redo()
            } else {
              undo()
            }
          }
          break
        case 'a':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            const allItems = timelineState.tracks.flatMap(track => track.items.map(item => item.id))
            setTimelineState(prev => ({ ...prev, selectedItems: allItems }))
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [togglePlayback, deleteSelectedItems, duplicateSelectedItems, undo, redo, timelineState.tracks])

  // Format time display
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const frames = Math.floor((seconds % 1) * timelineState.renderSettings.fps)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`
  }, [timelineState.renderSettings.fps])

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

  // Memoized timeline ruler
  const timelineRuler = useMemo(() => {
    const markers = []
    const step = timelineState.gridSize
    for (let i = 0; i <= timelineState.duration; i += step) {
      markers.push(
        <div
          key={i}
          className="absolute border-l border-gray-600"
          style={{
            left: `${i * PIXELS_PER_SECOND * timelineState.zoom}px`,
            height: '100%'
          }}
        >
          <span className="absolute top-1 left-1 text-xs text-gray-400">
            {formatTime(i)}
          </span>
        </div>
      )
    }
    return markers
  }, [timelineState.duration, timelineState.zoom, timelineState.gridSize, formatTime])

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col h-screen bg-gray-900 text-white">
        {/* Enhanced Toolbar */}
        <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">Timeline Professional</h1>
            <Badge variant="secondary" className="bg-blue-600">v5.0 - FASE 5</Badge>
            <Badge variant="outline" className="text-green-400 border-green-400">
              <Timer className="w-3 h-3 mr-1" />
              Real-time Sync
            </Badge>
          </div>

          {/* Enhanced Playback Controls */}
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
              onClick={() => setCurrentTime(Math.max(0, timelineState.currentTime - 10))}
              className="text-white hover:bg-gray-700"
            >
              <Rewind className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePlayback}
              className="text-white hover:bg-gray-700 bg-blue-600"
            >
              {timelineState.playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentTime(Math.min(timelineState.duration, timelineState.currentTime + 10))}
              className="text-white hover:bg-gray-700"
            >
              <FastForward className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentTime(timelineState.duration)}
              className="text-white hover:bg-gray-700"
            >
              <SkipForward className="w-4 h-4" />
            </Button>

            <Separator orientation="vertical" className="h-6" />

            {/* Playback Speed */}
            <div className="flex items-center gap-2">
              <Label className="text-xs">Speed</Label>
              <select
                value={timelineState.playbackSpeed}
                onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                className="bg-gray-700 text-white text-xs rounded px-2 py-1"
              >
                <option value={0.25}>0.25x</option>
                <option value={0.5}>0.5x</option>
                <option value={1}>1x</option>
                <option value={1.5}>1.5x</option>
                <option value={2}>2x</option>
              </select>
            </div>
          </div>

          {/* Time Display and Controls */}
          <div className="flex items-center gap-4">
            <div className="text-sm font-mono bg-gray-700 px-3 py-1 rounded">
              {formatTime(timelineState.currentTime)} / {formatTime(timelineState.duration)}
            </div>
            
            {/* Zoom Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setZoom(timelineState.zoom - 0.2)}
                className="text-white hover:bg-gray-700"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              
              <Slider
                min={MIN_ZOOM}
                max={MAX_ZOOM}
                step={0.1}
                value={[timelineState.zoom]}
                onValueChange={([zoom]) => setZoom(zoom)}
                className="w-20"
              />
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setZoom(timelineState.zoom + 0.2)}
                className="text-white hover:bg-gray-700"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              
              <span className="text-xs text-gray-400 min-w-[40px]">
                {Math.round(timelineState.zoom * 100)}%
              </span>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Undo/Redo */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={undo}
                disabled={historyIndex <= 0}
                className="text-white hover:bg-gray-700"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                className="text-white hover:bg-gray-700"
              >
                <RotateCw className="w-4 h-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Export and Settings */}
            <Button
              onClick={() => setShowRenderSettings(true)}
              variant="ghost"
              className="text-white hover:bg-gray-700"
            >
              <Settings className="w-4 h-4 mr-2" />
              Render
            </Button>

            <Button onClick={exportTimeline} className="bg-blue-600 hover:bg-blue-700">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Settings Panel */}
        <div className="flex items-center justify-between p-2 bg-gray-800/50 border-b border-gray-700">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={timelineState.snapToGrid}
                onCheckedChange={(checked) => 
                  setTimelineState(prev => ({ ...prev, snapToGrid: checked }))
                }
              />
              <Label className="text-xs">Snap to Grid</Label>
            </div>
            
            <div className="flex items-center gap-2">
              <Label className="text-xs">Grid</Label>
              <select
                value={timelineState.gridSize}
                onChange={(e) => 
                  setTimelineState(prev => ({ ...prev, gridSize: Number(e.target.value) }))
                }
                className="bg-gray-700 text-white text-xs rounded px-2 py-1"
              >
                <option value={0.1}>0.1s</option>
                <option value={0.5}>0.5s</option>
                <option value={1}>1s</option>
                <option value={5}>5s</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Label className="text-xs">Preview</Label>
              <select
                value={timelineState.previewQuality}
                onChange={(e) => 
                  setTimelineState(prev => (
                    isPreviewQuality(e.target.value)
                      ? { ...prev, previewQuality: e.target.value }
                      : prev
                  ))
                }
                className="bg-gray-700 text-white text-xs rounded px-2 py-1"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-blue-400 border-blue-400">
              <Target className="w-3 h-3 mr-1" />
              {timelineState.selectedItems.length} selecionados
            </Badge>
            
            <Badge variant="outline" className="text-green-400 border-green-400">
              <Layers className="w-3 h-3 mr-1" />
              {timelineState.tracks.length} tracks
            </Badge>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Enhanced Track Controls */}
          <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">Tracks</h3>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Track
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={duplicateSelectedItems}>
                  <Copy className="w-4 h-4 mr-1" />
                  Duplicate
                </Button>
                <Button size="sm" variant="outline" onClick={deleteSelectedItems}>
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-2">
                {timelineState.tracks.map((track, index) => (
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
                          className="h-full rounded transition-all duration-300"
                          style={{ 
                            backgroundColor: track.color,
                            width: `${(track.items.reduce((acc, item) => acc + item.duration, 0) / timelineState.duration) * 100}%`
                          }}
                        />
                      </div>

                      <div className="text-xs text-gray-400 mb-2">
                        {track.items.length} items • {Math.round(track.items.reduce((acc, item) => acc + item.duration, 0))}s
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
                          <span className="text-xs text-gray-400 min-w-[30px]">
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

          {/* Enhanced Timeline */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Timeline Ruler */}
            <div className="h-16 bg-gray-800 border-b border-gray-700 relative overflow-hidden">
              <div className="absolute inset-0">
                {timelineRuler}
              </div>

              {/* Enhanced Playhead */}
              <div
                className="absolute top-0 w-0.5 h-full bg-red-500 z-20 cursor-pointer shadow-lg"
                style={{
                  left: `${timelineState.currentTime * PIXELS_PER_SECOND * timelineState.zoom}px`,
                  transform: 'translateX(-1px)',
                  boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)'
                }}
                onClick={(e) => {
                  const rect = e.currentTarget.parentElement!.getBoundingClientRect()
                  const x = e.clientX - rect.left
                  const time = x / (PIXELS_PER_SECOND * timelineState.zoom)
                  setCurrentTime(time)
                }}
              >
                <div className="w-3 h-4 bg-red-500 -translate-x-1 rounded-b-sm shadow-lg" />
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs px-1 rounded whitespace-nowrap">
                  {formatTime(timelineState.currentTime)}
                </div>
              </div>
            </div>

            {/* Timeline Tracks */}
            <ScrollArea className="flex-1">
              <div 
                ref={timelineRef}
                className="relative bg-gray-900"
                style={{ 
                  width: `${timelineState.duration * PIXELS_PER_SECOND * timelineState.zoom}px`,
                  minHeight: `${timelineState.tracks.length * TRACK_HEIGHT}px`
                }}
              >
                {timelineState.tracks.map((track, trackIndex) => (
                  <DroppableTrack
                    key={track.id}
                    track={track}
                    zoom={timelineState.zoom}
                    duration={timelineState.duration}
                    selectedItems={timelineState.selectedItems}
                    onItemSelect={selectItem}
                    onItemMove={moveItem}
                    onItemResize={resizeItem}
                    snapToGrid={timelineState.snapToGrid}
                    gridSize={timelineState.gridSize}
                  />
                ))}

                {/* Enhanced Playhead extending through all tracks */}
                <div
                  className="absolute top-0 w-0.5 bg-red-500 z-10 pointer-events-none"
                  style={{
                    left: `${timelineState.currentTime * PIXELS_PER_SECOND * timelineState.zoom}px`,
                    height: `${timelineState.tracks.length * TRACK_HEIGHT}px`,
                    transform: 'translateX(-1px)',
                    boxShadow: '0 0 5px rgba(239, 68, 68, 0.3)'
                  }}
                />
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Enhanced Status Bar */}
        <div className="h-10 bg-gray-800 border-t border-gray-700 flex items-center justify-between px-4 text-xs text-gray-400">
          <div className="flex items-center gap-6">
            <span>Items selecionados: {timelineState.selectedItems.length}</span>
            <span>Tracks: {timelineState.tracks.length}</span>
            <span>Duração total: {formatTime(timelineState.duration)}</span>
            <span>FPS: {timelineState.renderSettings.fps}</span>
            <span>Resolução: {timelineState.renderSettings.resolution}</span>
          </div>
          
          <div className="flex items-center gap-6">
            <span>Zoom: {Math.round(timelineState.zoom * 100)}%</span>
            <span>Grid: {timelineState.gridSize}s</span>
            <span>Speed: {timelineState.playbackSpeed}x</span>
            <Badge variant="outline" className="text-green-400 border-green-400">
              <Clock className="w-3 h-3 mr-1" />
              Sync Active
            </Badge>
          </div>
        </div>
      </div>
    </DndProvider>
  )
}