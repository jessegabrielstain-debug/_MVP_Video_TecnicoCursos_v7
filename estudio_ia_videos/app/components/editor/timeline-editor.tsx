
/**
 * ⏱️ Timeline Editor - Múltiplas Tracks
 * Timeline profissional com layers, keyframes e controles de reprodução
 */

'use client'

import React, { forwardRef, useImperativeHandle, useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
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
  Unlock
} from 'lucide-react'
import { UnifiedSlide } from '@/lib/types-unified-v2'

interface TimelineTrack {
  id: string
  type: 'scene' | 'audio' | 'effects' | 'text' | 'video'
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
  startTime: number
  duration: number
  endTime: number
  thumbnail?: string
  color: string
  selected?: boolean
  type: string
}

interface TimelineEditorProps {
  scenes: UnifiedSlide[]
  currentTime: number
  totalTime: number
  isPlaying: boolean
  onTimeUpdate: (time: number) => void
  onPlay: () => void
  onSceneSelect: (sceneIndex: number) => void
}

export interface TimelineEditorRef {
  play: () => void
  pause: () => void
  stop: () => void
  seekTo: (time: number) => void
}

export const TimelineEditor = forwardRef<TimelineEditorRef, TimelineEditorProps>(
  ({ scenes, currentTime, totalTime, isPlaying, onTimeUpdate, onPlay, onSceneSelect }, ref) => {
    const timelineRef = useRef<HTMLDivElement>(null)
    const [tracks, setTracks] = useState<TimelineTrack[]>([])
    const [selectedItems, setSelectedItems] = useState<string[]>([])
    const [zoom, setZoom] = useState([1])
    const [isDragging, setIsDragging] = useState(false)
    const [playbackSpeed, setPlaybackSpeed] = useState([1])

    // Configuração das tracks
    useEffect(() => {
      const sceneTracks: TimelineTrack[] = [
        {
          id: 'scenes',
          type: 'scene',
          name: 'Cenas',
          height: 60,
          color: '#3b82f6',
          visible: true,
          locked: false,
          items: scenes.map((scene, index) => ({
            id: scene.id,
            name: scene.title || `Cena ${index + 1}`,
            startTime: index > 0 ? scenes.slice(0, index).reduce((acc, s) => acc + (s.duration || 0), 0) : 0,
            duration: scene.duration || 0,
            endTime: scenes.slice(0, index + 1).reduce((acc, s) => acc + (s.duration || 0), 0),
            thumbnail: `/api/thumbnail/${scene.id}.jpg`,
            color: '#3b82f6',
            type: 'scene'
          }))
        },
        {
          id: 'audio',
          type: 'audio',
          name: 'Áudio',
          height: 40,
          color: '#10b981',
          visible: true,
          locked: false,
          muted: false,
          volume: 80,
          items: []
        },
        {
          id: 'effects',
          type: 'effects',
          name: 'Efeitos',
          height: 35,
          color: '#8b5cf6',
          visible: true,
          locked: false,
          items: []
        },
        {
          id: 'text',
          type: 'text',
          name: 'Texto/Legendas',
          height: 35,
          color: '#f59e0b',
          visible: true,
          locked: false,
          items: []
        }
      ]
      
      setTracks(sceneTracks)
    }, [scenes])

    // Expor métodos via ref
    useImperativeHandle(ref, () => ({
      play: onPlay,
      pause: onPlay,
      stop: () => onTimeUpdate(0),
      seekTo: (time: number) => onTimeUpdate(Math.max(0, Math.min(totalTime, time)))
    }), [onPlay, onTimeUpdate, totalTime])

    // Conversões de tempo
    const timeToPixels = useCallback((time: number) => {
      return (time / totalTime) * 800 * zoom[0]
    }, [totalTime, zoom])

    const pixelsToTime = useCallback((pixels: number) => {
      return (pixels / (800 * zoom[0])) * totalTime
    }, [totalTime, zoom])

    const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    // Handler para seek na timeline
    const handleTimelineClick = (e: React.MouseEvent) => {
      if (!timelineRef.current) return
      
      const rect = timelineRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left - 200 // Subtrair largura dos labels
      const newTime = pixelsToTime(x)
      
      onTimeUpdate(Math.max(0, Math.min(totalTime, newTime)))
    }

    // Handler para drag de itens
    const handleItemMouseDown = (e: React.MouseEvent, item: TimelineItem) => {
      e.stopPropagation()
      setIsDragging(true)
      
      if (!selectedItems.includes(item.id)) {
        setSelectedItems([item.id])
      }
    }

    // Renderizar ruler/régua
    const renderRuler = () => {
      const tickCount = Math.floor(totalTime / 5) + 1
      const ticks = []
      
      for (let i = 0; i < tickCount; i++) {
        const time = i * 5
        const x = timeToPixels(time)
        
        ticks.push(
          <div key={i} className="absolute flex flex-col items-center">
            <div 
              className="w-px h-3 bg-gray-400"
              style={{ left: x }}
            />
            <span 
              className="text-xs text-gray-600 mt-1"
              style={{ left: x - 15 }}
            >
              {formatTime(time)}
            </span>
          </div>
        )
      }
      
      return (
        <div className="relative h-8 border-b bg-gray-50">
          <div className="ml-200">{ticks}</div>
        </div>
      )
    }

    // Renderizar playhead
    const renderPlayhead = () => {
      const x = timeToPixels(currentTime)
      
      return (
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
          style={{ left: x + 200 }}
        >
          <div className="absolute -top-2 -left-2 w-4 h-4 bg-red-500 rotate-45" />
        </div>
      )
    }

    // Renderizar track
    const renderTrack = (track: TimelineTrack) => {
      return (
        <div key={track.id} className="flex border-b">
          {/* Track Header */}
          <div 
            className="w-200 flex-shrink-0 bg-gray-100 border-r p-2 flex items-center justify-between"
            style={{ minHeight: track.height }}
          >
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTracks(prev => prev.map(t => 
                  t.id === track.id ? { ...t, visible: !t.visible } : t
                ))}
              >
                {track.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </Button>
              
              <span className="text-sm font-medium truncate">
                {track.name}
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              {track.type === 'audio' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTracks(prev => prev.map(t => 
                    t.id === track.id ? { ...t, muted: !t.muted } : t
                  ))}
                >
                  {track.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTracks(prev => prev.map(t => 
                  t.id === track.id ? { ...t, locked: !t.locked } : t
                ))}
              >
                {track.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Track Content */}
          <div 
            className="flex-1 relative bg-white"
            style={{ minHeight: track.height }}
          >
            {track.items.map(item => {
              const x = timeToPixels(item.startTime)
              const width = timeToPixels(item.duration)
              const isSelected = selectedItems.includes(item.id)
              
              return (
                <div
                  key={item.id}
                  className={`absolute h-full border rounded cursor-move select-none ${
                    isSelected ? 'ring-2 ring-blue-500' : ''
                  }`}
                  style={{
                    left: x,
                    width: width,
                    backgroundColor: item.color,
                    top: 4,
                    height: track.height - 8,
                    minWidth: 20
                  }}
                  onMouseDown={(e) => handleItemMouseDown(e, item)}
                  onClick={() => {
                    if (track.type === 'scene') {
                      const sceneIndex = scenes.findIndex(s => s.id === item.id)
                      if (sceneIndex !== -1) {
                        onSceneSelect(sceneIndex)
                      }
                    }
                  }}
                >
                  <div className="p-1 h-full flex items-center">
                    <span className="text-xs text-white font-medium truncate">
                      {item.name}
                    </span>
                  </div>
                  
                  {/* Resize handles */}
                  <div className="absolute top-0 left-0 w-2 h-full cursor-ew-resize bg-white bg-opacity-20" />
                  <div className="absolute top-0 right-0 w-2 h-full cursor-ew-resize bg-white bg-opacity-20" />
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    return (
      <div className="h-full flex flex-col bg-white">
        {/* Controles de Reprodução */}
        <div className="h-12 border-b flex items-center justify-between px-4 bg-gray-50">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <SkipBack className="w-4 h-4" />
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onPlay}
              className={isPlaying ? 'bg-blue-100' : ''}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            
            <Button variant="outline" size="sm">
              <SkipForward className="w-4 h-4" />
            </Button>
            
            <Button variant="outline" size="sm">
              <Square className="w-4 h-4" />
            </Button>
            
            <div className="ml-4 flex items-center gap-2">
              <span className="text-sm font-mono">
                {formatTime(currentTime)}
              </span>
              <span className="text-sm text-gray-400">/</span>
              <span className="text-sm font-mono text-gray-600">
                {formatTime(totalTime)}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm">Zoom:</span>
              <Slider
                value={zoom}
                onValueChange={setZoom}
                min={0.1}
                max={5}
                step={0.1}
                className="w-20"
              />
              <span className="text-sm text-gray-600 min-w-[30px]">
                {zoom[0].toFixed(1)}x
              </span>
            </div>
            
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Timeline */}
        <div className="flex-1 flex flex-col">
          {/* Ruler */}
          <div className="relative">
            {renderRuler()}
            {renderPlayhead()}
          </div>
          
          {/* Tracks */}
          <div 
            ref={timelineRef}
            className="flex-1 relative overflow-auto cursor-pointer"
            onClick={handleTimelineClick}
          >
            {tracks.map(renderTrack)}
            {renderPlayhead()}
          </div>
        </div>

        {/* Status Bar */}
        <div className="h-8 border-t bg-gray-50 flex items-center justify-between px-4 text-xs text-gray-600">
          <div className="flex items-center gap-4">
            <span>{scenes.length} cenas</span>
            <span>{selectedItems.length} selecionados</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span>Velocidade:</span>
            <Slider
              value={playbackSpeed}
              onValueChange={setPlaybackSpeed}
              min={0.25}
              max={4}
              step={0.25}
              className="w-16"
            />
            <span>{playbackSpeed[0]}x</span>
          </div>
        </div>
      </div>
    )
  }
)

TimelineEditor.displayName = 'TimelineEditor'
