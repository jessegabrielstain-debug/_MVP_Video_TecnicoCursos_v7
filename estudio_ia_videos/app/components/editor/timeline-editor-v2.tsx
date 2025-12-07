/**
 * ⏱️ Timeline Editor v2.0 - Multi-Track Professional
 * Timeline com camadas independentes, keyframes, e controles avançados
 */

'use client'

import React, { forwardRef, useImperativeHandle, useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward,
  Square,
  Volume2,
  VolumeX,
  Scissors,
  Copy,
  Trash2,
  Plus,
  Layers,
  Clock,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Settings,
  ZoomIn,
  ZoomOut
} from 'lucide-react'
import { UnifiedSlide, UnifiedTimeline, EditorState, EditorEvent } from '@/lib/types-unified-v2'

type TimelineTrackType = 'scene' | 'audio' | 'effects' | 'text' | 'video';

interface TimelineTrack {
  id: string
  type: TimelineTrackType
  name: string
  items: TimelineItem[]
  height: number
  color: string
  visible: boolean
  locked: boolean
  muted?: boolean
  volume?: number
}

interface TimelineItem {
  id: string
  name: string
  elementId?: string
  slideId?: string
  startTime: number
  duration: number
  color: string
  thumbnail?: string
  keyframes: Keyframe[]
}

interface Keyframe {
  id: string
  time: number
  property: string
  value: unknown
  easing: string
}

interface ElementAnimation {
  id: string;
  delay: number;
  duration: number;
  type: string;
  easing: string;
  [key: string]: unknown;
}

interface TimelineEditorProps {
  slides: UnifiedSlide[]
  timeline: UnifiedTimeline
  editorState: EditorState
  onTimeUpdate: (time: number) => void
  onSlideSelect: (slideIndex: number) => void
  onTimelineUpdate: (timeline: UnifiedTimeline) => void
  onEventEmit?: (event: EditorEvent) => void
}

export interface TimelineEditorHandle {
  togglePlayback: () => void;
  stop: () => void;
  seek: (time: number) => void;
  addTrack: (type: string) => void;
  deleteSelectedItems: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
}

const TIMELINE_TRACK_TYPES: TimelineTrackType[] = ['scene', 'audio', 'effects', 'text', 'video']

const isTimelineTrackType = (value: string): value is TimelineTrackType => {
  return TIMELINE_TRACK_TYPES.includes(value as TimelineTrackType)
}

const TimelineEditorV2 = forwardRef<TimelineEditorHandle, TimelineEditorProps>(({ 
  slides,
  timeline,
  editorState,
  onTimeUpdate,
  onSlideSelect,
  onTimelineUpdate,
  onEventEmit
}, ref) => {
  const timelineRef = useRef<HTMLDivElement>(null)
  const [pixelsPerSecond, setPixelsPerSecond] = useState(50)
  const [trackHeight] = useState(60)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [playheadPosition, setPlayheadPosition] = useState(0)

  // Tracks iniciais baseadas nos slides
  const [tracks, setTracks] = useState<TimelineTrack[]>(() => {
    const sceneTracks: TimelineTrack[] = timeline.scenes.map((scene, index) => {
      const slide = slides.find(s => s.id === scene.slideId)
      
      return {
        id: `scene-${scene.slideId}`,
        type: 'scene',
        name: slide?.title || `Slide ${index + 1}`,
        height: trackHeight,
        color: '#3b82f6',
        visible: true,
        locked: false,
        items: [{
          id: `scene-item-${scene.slideId}`,
          name: slide?.title || `Slide ${index + 1}`,
          slideId: scene.slideId,
          startTime: scene.startTime,
          duration: scene.duration,
          color: '#3b82f6',
          keyframes: []
        }]
      }
    })

    // Adicionar tracks para elementos com animações
    const elementTracks: TimelineTrack[] = []
    slides.forEach(slide => {
      slide.elements.forEach(element => {
        const animations = element.animations as unknown as ElementAnimation[];
        if (animations.length > 0) {
          const trackType = ['text', 'video', 'audio'].includes(element.type) ? element.type as 'text' | 'video' | 'audio' : 'effects'
          elementTracks.push({
            id: `element-${element.id}`,
            type: trackType,
            name: element.content || `${element.type} ${element.id.slice(-8)}`,
            height: trackHeight,
            color: getElementColor(element.type),
            visible: true,
            locked: false,
            items: [{
              id: `element-item-${element.id}`,
              name: element.content || element.type,
              elementId: element.id,
              startTime: 0, // TODO: Calcular com base nas animações
              duration: animations[0]?.duration || 2,
              color: getElementColor(element.type),
              keyframes: animations.map(anim => ({
                id: `kf-${anim.id}`,
                time: anim.delay,
                property: anim.type,
                value: anim,
                easing: anim.easing
              }))
            }]
          })
        }
      })
    })

    return [...sceneTracks, ...elementTracks]
  })

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    togglePlayback: () => handlePlayPause(),
    stop: () => handleStop(),
    seek: (time: number) => handleSeek(time),
    addTrack: (type: string) => handleAddTrack(type),
    deleteSelectedItems: () => handleDeleteSelected(),
    zoomIn: () => setPixelsPerSecond(prev => Math.min(prev * 1.5, 200)),
    zoomOut: () => setPixelsPerSecond(prev => Math.max(prev / 1.5, 10))
  }))

  // Playback controls
  const handlePlayPause = useCallback(() => {
    if (onEventEmit) {
      onEventEmit({
        type: 'timeline_update',
        data: { action: editorState.playback.isPlaying ? 'pause' : 'play' },
        timestamp: Date.now()
      })
    }
  }, [editorState.playback.isPlaying, onEventEmit])

  const handleStop = useCallback(() => {
    onTimeUpdate(0)
    setPlayheadPosition(0)
    
    if (onEventEmit) {
      onEventEmit({
        type: 'timeline_update',
        data: { action: 'stop' },
        timestamp: Date.now()
      })
    }
  }, [onTimeUpdate, onEventEmit])

  const handleSeek = useCallback((time: number) => {
    const clampedTime = Math.max(0, Math.min(time, timeline.totalDuration))
    onTimeUpdate(clampedTime)
    setPlayheadPosition(clampedTime * pixelsPerSecond)
    
    // Determinar slide atual baseado no tempo
    const currentScene = timeline.scenes.find(scene => 
      time >= scene.startTime && time < scene.startTime + scene.duration
    )
    
    if (currentScene) {
      const slideIndex = slides.findIndex(s => s.id === currentScene.slideId)
      if (slideIndex >= 0) {
        onSlideSelect(slideIndex)
      }
    }
  }, [timeline.totalDuration, timeline.scenes, pixelsPerSecond, onTimeUpdate, onSlideSelect, slides])

  // Timeline interaction
  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (!timelineRef.current) return

    const rect = timelineRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const time = clickX / pixelsPerSecond
    
    handleSeek(time)
  }, [pixelsPerSecond, handleSeek])

  const handleItemDrag = useCallback((itemId: string, newStartTime: number) => {
    setTracks(prevTracks => 
      prevTracks.map(track => ({
        ...track,
        items: track.items.map(item => 
          item.id === itemId 
            ? { ...item, startTime: Math.max(0, newStartTime) }
            : item
        )
      }))
    )
  }, [])

  const handleItemResize = useCallback((itemId: string, newDuration: number) => {
    setTracks(prevTracks => 
      prevTracks.map(track => ({
        ...track,
        items: track.items.map(item => 
          item.id === itemId 
            ? { ...item, duration: Math.max(0.1, newDuration) }
            : item
        )
      }))
    )
  }, [])

  // Track management
  const handleAddTrack = useCallback((type: string) => {
    const trackType: TimelineTrackType = isTimelineTrackType(type) ? type : 'effects'

    const newTrack: TimelineTrack = {
      id: `track-${Date.now()}`,
      type: trackType,
      name: `Nova ${trackType}`,
      height: trackHeight,
      color: getElementColor(type),
      visible: true,
      locked: false,
      items: []
    }

    setTracks(prev => [...prev, newTrack])
  }, [])

  const handleDeleteTrack = useCallback((trackId: string) => {
    setTracks(prev => prev.filter(track => track.id !== trackId))
  }, [])

  const handleToggleTrackVisibility = useCallback((trackId: string) => {
    setTracks(prev => 
      prev.map(track => 
        track.id === trackId 
          ? { ...track, visible: !track.visible }
          : track
      )
    )
  }, [])

  const handleToggleTrackLock = useCallback((trackId: string) => {
    setTracks(prev => 
      prev.map(track => 
        track.id === trackId 
          ? { ...track, locked: !track.locked }
          : track
      )
    )
  }, [])

  const handleDeleteSelected = useCallback(() => {
    if (selectedItems.length > 0) {
      setTracks(prevTracks =>
        prevTracks.map(track => ({
          ...track,
          items: track.items.filter(item => !selectedItems.includes(item.id))
        }))
      )
      setSelectedItems([])
    }
  }, [selectedItems])

  // Update playhead position based on current time
  useEffect(() => {
    setPlayheadPosition(editorState.playback.currentTime * pixelsPerSecond)
  }, [editorState.playback.currentTime, pixelsPerSecond])

  // Render timeline item
  const renderTimelineItem = (item: TimelineItem, trackColor: string) => {
    const isSelected = selectedItems.includes(item.id)
    const itemWidth = item.duration * pixelsPerSecond
    const itemLeft = item.startTime * pixelsPerSecond

    return (
      <div
        key={item.id}
        className={`absolute h-10 rounded-md flex items-center px-2 text-white text-xs font-medium cursor-move select-none ${
          isSelected ? 'ring-2 ring-white ring-offset-1' : ''
        }`}
        style={{
          left: itemLeft,
          width: itemWidth,
          backgroundColor: item.color || trackColor,
          top: '50%',
          transform: 'translateY(-50%)',
          minWidth: 40
        }}
        onClick={(e) => {
          e.stopPropagation()
          if (e.shiftKey) {
            setSelectedItems(prev => 
              prev.includes(item.id) 
                ? prev.filter(id => id !== item.id)
                : [...prev, item.id]
            )
          } else {
            setSelectedItems([item.id])
          }
        }}
      >
        <span className="truncate">{item.name}</span>
        
        {/* Keyframes indicators */}
        {item.keyframes.map(keyframe => (
          <div
            key={keyframe.id}
            className="absolute top-0 w-1 h-full bg-yellow-400 opacity-80"
            style={{ left: keyframe.time * pixelsPerSecond }}
          />
        ))}

        {/* Resize handles */}
        {isSelected && (
          <>
            <div className="absolute left-0 top-0 w-2 h-full bg-white opacity-50 cursor-w-resize" />
            <div className="absolute right-0 top-0 w-2 h-full bg-white opacity-50 cursor-e-resize" />
          </>
        )}
      </div>
    )
  }

  // Render track
  const renderTrack = (track: TimelineTrack, index: number) => (
    <div key={track.id} className="border-b border-gray-700">
      {/* Track header */}
      <div className="flex items-center h-15 px-3 bg-gray-800 border-r border-gray-700">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          {/* Track icon */}
          <div 
            className="w-4 h-4 rounded-full flex-shrink-0" 
            style={{ backgroundColor: track.color }}
          />
          
          {/* Track name */}
          <span className="text-sm text-white truncate flex-1">{track.name}</span>
          
          {/* Track controls */}
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-6 h-6 p-0 text-gray-400 hover:text-white"
              onClick={() => handleToggleTrackVisibility(track.id)}
            >
              {track.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="w-6 h-6 p-0 text-gray-400 hover:text-white"
              onClick={() => handleToggleTrackLock(track.id)}
            >
              {track.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            </Button>

            {track.type === 'audio' && (
              <Button
                variant="ghost"
                size="sm"
                className="w-6 h-6 p-0 text-gray-400 hover:text-white"
              >
                {track.muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Track content */}
      <div 
        className="relative bg-gray-900" 
        style={{ height: track.height }}
        onClick={handleTimelineClick}
      >
        {/* Track items */}
        {track.items.map(item => renderTimelineItem(item, track.color))}
        
        {/* Track time markers */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: Math.ceil(timeline.totalDuration) + 1 }, (_, i) => (
            <div
              key={i}
              className="absolute top-0 h-full border-l border-gray-700 opacity-30"
              style={{ left: i * pixelsPerSecond }}
            />
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div className="bg-gray-900 text-white flex flex-col h-full">
      {/* Timeline header */}
      <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Playback controls */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleStop}
              className="text-white hover:bg-gray-700"
            >
              <Square className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSeek(Math.max(0, editorState.playback.currentTime - 5))}
              className="text-white hover:bg-gray-700"
            >
              <SkipBack className="w-4 h-4" />
            </Button>
            
            <Button
              onClick={handlePlayPause}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {editorState.playback.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSeek(Math.min(timeline.totalDuration, editorState.playback.currentTime + 5))}
              className="text-white hover:bg-gray-700"
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>

          {/* Time display */}
          <div className="text-sm font-mono">
            {formatTime(editorState.playback.currentTime)} / {formatTime(timeline.totalDuration)}
          </div>

          <Separator orientation="vertical" className="h-6 bg-gray-600" />

          {/* Zoom controls */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPixelsPerSecond(prev => Math.max(prev / 1.5, 10))}
              className="text-white hover:bg-gray-700"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            
            <span className="text-xs text-gray-400">{Math.round(pixelsPerSecond)}px/s</span>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPixelsPerSecond(prev => Math.min(prev * 1.5, 200))}
              className="text-white hover:bg-gray-700"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Timeline actions */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleAddTrack('audio')}
            className="text-white hover:bg-gray-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Áudio
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleAddTrack('effects')}
            className="text-white hover:bg-gray-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Efeitos
          </Button>

          {selectedItems.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteSelected}
              className="text-red-400 hover:bg-red-600 hover:text-white"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Timeline ruler */}
      <div className="bg-gray-800 px-3 py-1 border-b border-gray-700 relative">
        <div className="flex items-center h-6">
          {/* Track header spacer */}
          <div className="w-48 border-r border-gray-700" />
          
          {/* Time ruler */}
          <div className="flex-1 relative" ref={timelineRef}>
            {Array.from({ length: Math.ceil(timeline.totalDuration) + 1 }, (_, i) => (
              <div key={i} className="absolute top-0 h-full" style={{ left: i * pixelsPerSecond }}>
                <div className="border-l border-gray-600 h-full" />
                <span className="absolute top-0 left-1 text-xs text-gray-400">
                  {formatTime(i)}
                </span>
              </div>
            ))}
            
            {/* Playhead */}
            <div
              className="absolute top-0 w-0.5 h-full bg-red-500 z-10 pointer-events-none"
              style={{ left: playheadPosition }}
            />
          </div>
        </div>
      </div>

      {/* Timeline tracks */}
      <ScrollArea className="flex-1">
        <div className="relative">
          {tracks.map((track, index) => renderTrack(track, index))}
          
          {/* Playhead extension */}
          <div
            className="absolute top-0 w-0.5 bg-red-500 z-10 pointer-events-none"
            style={{ 
              left: 192 + playheadPosition, // 192px = track header width
              height: tracks.length * (trackHeight + 1) 
            }}
          />
        </div>
      </ScrollArea>

      {/* Selection info */}
      {selectedItems.length > 0 && (
        <div className="bg-gray-800 px-4 py-2 border-t border-gray-700 flex items-center justify-between text-sm">
          <span>{selectedItems.length} item(s) selecionado(s)</span>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="text-white hover:bg-gray-700">
              <Copy className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-white hover:bg-gray-700">
              <Scissors className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
})

TimelineEditorV2.displayName = 'TimelineEditorV2'

// Utility functions
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 100)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
}

function getElementColor(type: string): string {
  const colors: Record<string, string> = {
    text: '#10b981',
    image: '#f59e0b',
    video: '#8b5cf6',
    shape: '#3b82f6',
    audio: '#ef4444',
    scene: '#6366f1',
    effects: '#ec4899'
  }
  return colors[type] || '#6b7280'
}

export { TimelineEditorV2 }
export default TimelineEditorV2
