
/**
 * 🎬 Animaker Timeline Multi-Camadas
 * Timeline completa com layers independentes, keyframes e controles avançados
 */

'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Play, 
  Pause, 
  Square,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Plus,
  Trash2,
  Copy,
  Scissors,
  RotateCcw,
  Settings,
  Layers,
  Music,
  Mic,
  Video,
  Type,
  Image as ImageIcon,
  Sparkles
} from 'lucide-react'
import { UnifiedParseResult, UnifiedSlide, UnifiedElement } from '@/lib/types-unified-v2'

interface TimelineLayer {
  id: string
  name: string
  type: 'background' | 'text' | 'image' | 'shape' | 'video' | 'audio' | 'effects'
  elements: TimelineElement[]
  visible: boolean
  locked: boolean
  muted?: boolean
  volume: number
  color: string
}

interface TimelineElement {
  id: string
  elementId: string
  startTime: number
  duration: number
  endTime: number
  layer: string
  keyframes: Keyframe[]
  selected: boolean
  clipped?: boolean
}

interface Keyframe {
  time: number
  property: string
  value: unknown
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'
}

interface ElementAnimation {
  delay?: number
  duration?: number
  type?: string
  easing?: string
}

interface AnimakerTimelineMulticamProps {
  project: UnifiedParseResult
  currentTime: number
  isPlaying: boolean
  zoom: number
  onTimeChange: (time: number) => void
  onPlayStateChange: (playing: boolean) => void
  onZoomChange: (zoom: number) => void
  onLayersChange: (layers: TimelineLayer[]) => void
  onElementsChange: (elements: TimelineElement[]) => void
}

export function AnimakerTimelineMulticam({
  project,
  currentTime,
  isPlaying,
  zoom,
  onTimeChange,
  onPlayStateChange,
  onZoomChange,
  onLayersChange,
  onElementsChange
}: AnimakerTimelineMulticamProps) {
  const timelineRef = useRef<HTMLDivElement>(null)
  const [selectedElements, setSelectedElements] = useState<string[]>([])
  const [layers, setLayers] = useState<TimelineLayer[]>([])
  const [dragState, setDragState] = useState<{
    isDragging: boolean
    elementId: string | null
    startX: number
    originalStartTime: number
  }>({
    isDragging: false,
    elementId: null,
    startX: 0,
    originalStartTime: 0
  })

  // Initialize layers from project
  useEffect(() => {
    if (project) {
      initializeLayers()
    }
  }, [project])

  const initializeLayers = () => {
    const initialLayers: TimelineLayer[] = [
      {
        id: 'bg_layer',
        name: 'Background',
        type: 'background',
        elements: [],
        visible: true,
        locked: false,
        volume: 1.0,
        color: '#8B5CF6'
      },
      {
        id: 'text_layer',
        name: 'Textos',
        type: 'text',
        elements: [],
        visible: true,
        locked: false,
        volume: 1.0,
        color: '#06B6D4'
      },
      {
        id: 'image_layer',
        name: 'Imagens',
        type: 'image',
        elements: [],
        visible: true,
        locked: false,
        volume: 1.0,
        color: '#10B981'
      },
      {
        id: 'shape_layer',
        name: 'Formas',
        type: 'shape',
        elements: [],
        visible: true,
        locked: false,
        volume: 1.0,
        color: '#F59E0B'
      },
      {
        id: 'video_layer',
        name: 'Vídeos',
        type: 'video',
        elements: [],
        visible: true,
        locked: false,
        volume: 0.8,
        color: '#EF4444'
      },
      {
        id: 'audio_layer',
        name: 'Áudio',
        type: 'audio',
        elements: [],
        visible: true,
        locked: false,
        volume: 0.7,
        color: '#8B5CF6'
      }
    ]

    // Populate layers with elements from slides
    project.slides.forEach((slide: UnifiedSlide, slideIndex: number) => {
      let slideStartTime = 0
      if (slideIndex > 0) {
        slideStartTime = project.slides.slice(0, slideIndex).reduce((acc: number, s: UnifiedSlide) => acc + (s.duration || 5), 0)
      }

      const slideDuration = slide.duration || 5;

      // Background layer
      initialLayers[0].elements.push({
        id: `bg_${slide.id}`,
        elementId: slide.id,
        startTime: slideStartTime,
        duration: slideDuration,
        endTime: slideStartTime + slideDuration,
        layer: 'bg_layer',
        keyframes: [],
        selected: false
      })

      // Element layers
      slide.elements.forEach((element: UnifiedElement) => {
        const targetLayer = initialLayers.find(layer => layer.type === element.type)
        if (targetLayer) {
          const animData = element.animations[0] as ElementAnimation | undefined
          const delay = animData?.delay ?? 0
          const animDuration = animData?.duration ?? 1000

          targetLayer.elements.push({
            id: `timeline_${element.id}`,
            elementId: element.id,
            startTime: slideStartTime + delay / 1000,
            duration: animDuration / 1000,
            endTime: slideStartTime + delay / 1000 + animDuration / 1000,
            layer: targetLayer.id,
            keyframes: [
              {
                time: 0,
                property: 'opacity',
                value: 0,
                easing: 'ease-in-out'
              },
              {
                time: animDuration / 1000,
                property: 'opacity',
                value: 1,
                easing: 'ease-in-out'
              }
            ],
            selected: false
          })
        }
      })
    })

    setLayers(initialLayers)
  }

  // Time to pixel conversion
  const timeToPixel = (time: number) => time * zoom * 100 // 100px per second at zoom 1.0
  const pixelToTime = (pixel: number) => pixel / (zoom * 100)

  // Handle timeline click
  const handleTimelineClick = (event: React.MouseEvent) => {
    if (!timelineRef.current) return
    
    const rect = timelineRef.current.getBoundingClientRect()
    const clickX = event.clientX - rect.left - 200 // Subtract layer name width
    const newTime = Math.max(0, pixelToTime(clickX))
    
    onTimeChange(newTime)
  }

  // Handle element selection
  const handleElementClick = (elementId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    
    if (event.ctrlKey || event.metaKey) {
      // Multi-select
      setSelectedElements(prev => 
        prev.includes(elementId)
          ? prev.filter(id => id !== elementId)
          : [...prev, elementId]
      )
    } else {
      // Single select
      setSelectedElements([elementId])
    }
  }

  // Handle element drag start
  const handleElementDragStart = (elementId: string, event: React.MouseEvent) => {
    event.preventDefault()
    
    const element = layers.flatMap(l => l.elements).find(e => e.id === elementId)
    if (!element) return
    
    setDragState({
      isDragging: true,
      elementId,
      startX: event.clientX,
      originalStartTime: element.startTime
    })
  }

  // Handle mouse move for dragging
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!dragState.isDragging || !dragState.elementId) return
    
    const deltaX = event.clientX - dragState.startX
    const deltaTime = pixelToTime(deltaX)
    const newStartTime = Math.max(0, dragState.originalStartTime + deltaTime)
    
    // Update element position
    const updatedLayers = layers.map(layer => ({
      ...layer,
      elements: layer.elements.map(element =>
        element.id === dragState.elementId
          ? {
              ...element,
              startTime: newStartTime,
              endTime: newStartTime + element.duration
            }
          : element
      )
    }))
    
    setLayers(updatedLayers)
  }, [dragState, layers, pixelToTime])

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setDragState({
      isDragging: false,
      elementId: null,
      startX: 0,
      originalStartTime: 0
    })
  }, [])

  // Add event listeners for dragging
  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [dragState.isDragging, handleMouseMove, handleMouseUp])

  // Layer visibility toggle
  const toggleLayerVisibility = (layerId: string) => {
    const updatedLayers = layers.map(layer =>
      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
    )
    setLayers(updatedLayers)
    onLayersChange(updatedLayers)
  }

  // Layer lock toggle
  const toggleLayerLock = (layerId: string) => {
    const updatedLayers = layers.map(layer =>
      layer.id === layerId ? { ...layer, locked: !layer.locked } : layer
    )
    setLayers(updatedLayers)
    onLayersChange(updatedLayers)
  }

  // Layer volume change
  const handleLayerVolumeChange = (layerId: string, volume: number) => {
    const updatedLayers = layers.map(layer =>
      layer.id === layerId ? { ...layer, volume: volume / 100 } : layer
    )
    setLayers(updatedLayers)
    onLayersChange(updatedLayers)
  }

  // Add new layer
  const addNewLayer = (type: TimelineLayer['type']) => {
    const newLayer: TimelineLayer = {
      id: `layer_${Date.now()}`,
      name: `Nova ${type}`,
      type,
      elements: [],
      visible: true,
      locked: false,
      volume: 1.0,
      color: '#6B7280'
    }
    
    const updatedLayers = [...layers, newLayer]
    setLayers(updatedLayers)
    onLayersChange(updatedLayers)
  }

  // Delete selected elements
  const deleteSelectedElements = () => {
    const updatedLayers = layers.map(layer => ({
      ...layer,
      elements: layer.elements.filter(el => !selectedElements.includes(el.id))
    }))
    
    setLayers(updatedLayers)
    setSelectedElements([])
    onLayersChange(updatedLayers)
  }

  // Get layer icon
  const getLayerIcon = (type: TimelineLayer['type']) => {
    switch (type) {
      case 'background': return <Layers className="h-4 w-4" />
      case 'text': return <Type className="h-4 w-4" />
      case 'image': return <ImageIcon className="h-4 w-4" />
      case 'shape': return <Sparkles className="h-4 w-4" />
      case 'video': return <Video className="h-4 w-4" />
      case 'audio': return <Music className="h-4 w-4" />
      default: return <Layers className="h-4 w-4" />
    }
  }

  // Generate time markers
  const generateTimeMarkers = () => {
    const markers = []
    const totalDuration = project.timeline.totalDuration
    const markerInterval = zoom < 0.5 ? 10 : zoom < 1 ? 5 : 1 // Adjust marker density
    
    for (let time = 0; time <= totalDuration; time += markerInterval) {
      markers.push(
        <div
          key={time}
          className="absolute top-0 bottom-0 border-l border-gray-600"
          style={{ left: timeToPixel(time) }}
        >
          <div className="text-xs text-gray-400 px-1">
            {Math.floor(time / 60)}:{(time % 60).toFixed(0).padStart(2, '0')}
          </div>
        </div>
      )
    }
    
    return markers
  }

  return (
    <div className="flex flex-col h-full bg-gray-800 border-t border-gray-700">
      {/* Timeline Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <h3 className="font-medium text-white">Timeline Multi-Camadas</h3>
          <Badge variant="outline" className="text-gray-300">
            {layers.length} layers
          </Badge>
        </div>

        {/* Timeline Controls */}
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="ghost" onClick={() => onPlayStateChange(!isPlaying)}>
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onTimeChange(0)}>
            <Square className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost">
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost">
            <SkipForward className="h-4 w-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-6" />
          
          <div className="flex items-center space-x-2 text-sm text-gray-300">
            <span>{Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(1).padStart(4, '0')}</span>
            <span>/</span>
            <span>{Math.floor(project.timeline.totalDuration / 60)}:{(project.timeline.totalDuration % 60).toFixed(0).padStart(2, '0')}</span>
          </div>
          
          <Separator orientation="vertical" className="h-6" />
          
          {/* Zoom Controls */}
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="ghost" onClick={() => onZoomChange(Math.max(0.1, zoom - 0.1))}>
              -
            </Button>
            <span className="text-sm text-gray-300 min-w-[50px] text-center">
              {(zoom * 100).toFixed(0)}%
            </span>
            <Button size="sm" variant="ghost" onClick={() => onZoomChange(Math.min(5, zoom + 0.1))}>
              +
            </Button>
          </div>
          
          {/* Actions */}
          {selectedElements.length > 0 && (
            <>
              <Separator orientation="vertical" className="h-6" />
              <Button size="sm" variant="ghost" onClick={deleteSelectedElements}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Timeline Content */}
      <div className="flex-1 flex">
        {/* Layer Panel */}
        <div className="w-48 bg-gray-900 border-r border-gray-700 flex flex-col">
          <div className="p-3 border-b border-gray-700">
            <h4 className="text-sm font-medium text-white mb-2">Layers</h4>
            <Button size="sm" variant="outline" onClick={() => addNewLayer('text')}>
              <Plus className="h-3 w-3 mr-1" />
              Layer
            </Button>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="space-y-1 p-2">
              {layers.map(layer => (
                <LayerControls
                  key={layer.id}
                  layer={layer}
                  onVisibilityToggle={() => toggleLayerVisibility(layer.id)}
                  onLockToggle={() => toggleLayerLock(layer.id)}
                  onVolumeChange={(volume) => handleLayerVolumeChange(layer.id, volume)}
                  icon={getLayerIcon(layer.type)}
                />
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Timeline Grid */}
        <div className="flex-1 relative overflow-auto" ref={timelineRef} onClick={handleTimelineClick}>
          {/* Time Ruler */}
          <div className="sticky top-0 bg-gray-800 border-b border-gray-700 h-12 z-10">
            {generateTimeMarkers()}
          </div>

          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 w-px bg-red-500 z-20 pointer-events-none"
            style={{ left: timeToPixel(currentTime) }}
          >
            <div className="w-3 h-3 bg-red-500 rounded-full -ml-1.5 -mt-1" />
          </div>

          {/* Layer Tracks */}
          <div className="relative">
            {layers.map((layer, layerIndex) => (
              <div
                key={layer.id}
                className="relative border-b border-gray-700"
                style={{ height: 60 }}
              >
                {/* Layer Background */}
                <div
                  className={`absolute inset-0 ${
                    layer.visible ? 'opacity-100' : 'opacity-50'
                  } ${layer.locked ? 'bg-gray-700' : 'bg-gray-800'}`}
                />

                {/* Layer Elements */}
                {layer.elements.map(element => (
                  <TimelineElementBlock
                    key={element.id}
                    element={element}
                    layer={layer}
                    isSelected={selectedElements.includes(element.id)}
                    zoom={zoom}
                    timeToPixel={timeToPixel}
                    onClick={(e) => handleElementClick(element.id, e)}
                    onDragStart={(e) => handleElementDragStart(element.id, e)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Layer Controls Component
interface LayerControlsProps {
  layer: TimelineLayer
  onVisibilityToggle: () => void
  onLockToggle: () => void
  onVolumeChange: (volume: number) => void
  icon: React.ReactNode
}

function LayerControls({
  layer,
  onVisibilityToggle,
  onLockToggle,
  onVolumeChange,
  icon
}: LayerControlsProps) {
  return (
    <Card className="p-2 bg-gray-800 border-gray-700">
      <div className="flex items-center space-x-2">
        <div
          className="w-3 h-3 rounded"
          style={{ backgroundColor: layer.color }}
        />
        {icon}
        <span className="text-xs text-white flex-1 truncate">{layer.name}</span>
      </div>
      
      <div className="flex items-center justify-between mt-2">
        <div className="flex space-x-1">
          <Button size="sm" variant="ghost" onClick={onVisibilityToggle}>
            {layer.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          </Button>
          <Button size="sm" variant="ghost" onClick={onLockToggle}>
            {layer.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
          </Button>
        </div>
        
        {(layer.type === 'video' || layer.type === 'audio') && (
          <div className="flex items-center space-x-1">
            <Volume2 className="h-3 w-3 text-gray-400" />
            <Slider
              value={[layer.volume * 100]}
              onValueChange={([value]) => onVolumeChange(value)}
              max={100}
              step={1}
              className="w-12"
            />
          </div>
        )}
      </div>
    </Card>
  )
}

// Timeline Element Block Component
interface TimelineElementBlockProps {
  element: TimelineElement
  layer: TimelineLayer
  isSelected: boolean
  zoom: number
  timeToPixel: (time: number) => number
  onClick: (event: React.MouseEvent) => void
  onDragStart: (event: React.MouseEvent) => void
}

function TimelineElementBlock({
  element,
  layer,
  isSelected,
  zoom,
  timeToPixel,
  onClick,
  onDragStart
}: TimelineElementBlockProps) {
  return (
    <div
      className={`absolute rounded cursor-move border-2 ${
        isSelected ? 'border-blue-400' : 'border-transparent'
      } ${layer.locked ? 'cursor-not-allowed opacity-50' : ''}`}
      style={{
        left: timeToPixel(element.startTime),
        width: Math.max(20, timeToPixel(element.duration)),
        top: 8,
        height: 44,
        backgroundColor: `${layer.color}aa`,
        borderColor: isSelected ? '#60A5FA' : 'transparent'
      }}
      onClick={onClick}
      onMouseDown={layer.locked ? undefined : onDragStart}
    >
      <div className="px-2 py-1 text-xs text-white truncate">
        {element.elementId}
      </div>
      
      {/* Keyframe indicators */}
      {element.keyframes.map((keyframe, index) => (
        <div
          key={index}
          className="absolute top-1 w-1 h-1 bg-yellow-400 rounded-full"
          style={{ left: timeToPixel(keyframe.time) }}
        />
      ))}
      
      {/* Resize handles */}
      {isSelected && !layer.locked && (
        <>
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400 cursor-w-resize" />
          <div className="absolute right-0 top-0 bottom-0 w-1 bg-blue-400 cursor-e-resize" />
        </>
      )}
    </div>
  )
}
