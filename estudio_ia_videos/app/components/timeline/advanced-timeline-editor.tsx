/**
 * Advanced Timeline Editor - Componente principal do editor de vídeo
 * Inspirado no Motionity com extensões para PPTX e Avatar 3D
 */

'use client'

import React, { useEffect, useRef, useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  closestCorners,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useTimelineStore } from '@/lib/stores/timeline-store'
import { TimelineElement, TimelineLayer, DragData } from '@/lib/types/timeline-types'

// Sub-components
import { TimelineToolbar } from './timeline-toolbar'
import { TimelinePlayhead } from './timeline-playhead'
import { TimelineRuler } from './timeline-ruler'
import { TimelineTrackList } from './timeline-track-list'
import { TimelineCanvas } from './timeline-canvas'
import { TimelineElementCard } from './timeline-element-card'
import { TimelineKeyframes, TimelinePropertyPanel, TimelineCollaborationOverlay } from './timeline-stubs'

interface AdvancedTimelineEditorProps {
  projectId?: string
  className?: string
  onElementSelect?: (elementId: string) => void
  onTimeChange?: (time: number) => void
  showPropertyPanel?: boolean
  showCollaboration?: boolean
  readOnly?: boolean
}

export const AdvancedTimelineEditor: React.FC<AdvancedTimelineEditorProps> = ({
  projectId,
  className = '',
  onElementSelect,
  onTimeChange,
  showPropertyPanel = true,
  showCollaboration = true,
  readOnly = false
}) => {
  // ==================== STORE & STATE ====================
  const {
    project,
    currentTime,
    isPlaying,
    zoom,
    scrollX,
    pixelsPerSecond,
    selection,
    dragData,
    isDragging,
    collaborators,
    
    // Actions
    loadProject,
    play,
    pause,
    seekTo,
    setZoom,
    setScrollX,
    selectElement,
    selectLayer,
    clearSelection,
    startDrag,
    endDrag,
    addElement,
    moveElement,
    updateElement,
  } = useTimelineStore()

  // ==================== REFS & LOCAL STATE ====================
  const timelineRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 400 })
  const [showKeyframes, setShowKeyframes] = useState(false)
  const [activeElementId, setActiveElementId] = useState<string | null>(null)

  // ==================== DRAG & DROP SENSORS ====================
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  )

  // ==================== EFFECTS ====================
  
  // Load project if projectId provided
  useEffect(() => {
    if (projectId && !project) {
      // Load project from API or localStorage
      loadProject({
        id: projectId,
        name: 'Timeline Project',
        duration: 120,
        fps: 30,
        framerate: 30,
        resolution: { width: 1920, height: 1080 },
        currentTime: 0,
        zoomLevel: 1,
        selectedElementIds: [],
        clipboardElements: [],
        layers: [],
        tracks: [],
        markers: [],
        isPlaying: false,
        loop: false,
        volume: 1,
        zoom: 1,
        scrollX: 0,
        previewQuality: 'preview' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: '1.0.0'
      })
    }
  }, [projectId, project, loadProject])

  // Update canvas size on window resize
  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect()
        setCanvasSize({ width: rect.width, height: rect.height })
      }
    }

    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)
    return () => window.removeEventListener('resize', updateCanvasSize)
  }, [])

  // Playback animation loop
  useEffect(() => {
    if (!isPlaying || !project) return

    const interval = setInterval(() => {
      const framerate = project.framerate || 30
      const newTime = currentTime + (1 / framerate)
      if (newTime >= project.duration) {
        pause()
        seekTo(0)
      } else {
        seekTo(newTime)
        onTimeChange?.(newTime)
      }
    }, 1000 / (project.framerate || 30))

    return () => clearInterval(interval)
  }, [isPlaying, currentTime, project, pause, seekTo, onTimeChange])

  // ==================== EVENT HANDLERS ====================

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      pause()
    } else {
      play()
    }
  }, [isPlaying, play, pause])

  const handleTimelineClick = useCallback((event: React.MouseEvent) => {
    if (readOnly) return

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const clickX = event.clientX - rect.left + scrollX
    const newTime = clickX / pixelsPerSecond

    seekTo(Math.max(0, Math.min(newTime, project?.duration || 120)))
  }, [readOnly, scrollX, pixelsPerSecond, project?.duration, seekTo])

  const handleElementClick = useCallback((elementId: string, event: React.MouseEvent) => {
    if (readOnly) return

    event.stopPropagation()
    
    const isMultiSelect = event.shiftKey || event.ctrlKey || event.metaKey
    selectElement(elementId, isMultiSelect)
    setActiveElementId(elementId)
    onElementSelect?.(elementId)
  }, [readOnly, selectElement, onElementSelect])

  const handleLayerClick = useCallback((layerId: string, event: React.MouseEvent) => {
    if (readOnly) return

    event.stopPropagation()
    
    const isMultiSelect = event.shiftKey || event.ctrlKey || event.metaKey
    selectLayer(layerId, isMultiSelect)
  }, [readOnly, selectLayer])

  const handleCanvasClick = useCallback((event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      clearSelection()
      setActiveElementId(null)
    }
  }, [clearSelection])

  // ==================== DRAG & DROP HANDLERS ====================

  const handleDragStart = useCallback((event: DragStartEvent) => {
    if (readOnly) return

    const { active } = event
    const elementId = active.id as string
    
    // Find the element being dragged
    let draggedElement: TimelineElement | undefined;
    const tracks = project?.tracks || []
    
    for (const track of tracks) {
      for (const layer of track.layers) {
        const element = layer.elements.find(el => el.id === elementId)
        if (element) {
          draggedElement = element
          break
        }
      }
      if (draggedElement) break
    }

    if (draggedElement) {
      const dragData: DragData = {
        type: 'element',
        sourceId: elementId,
        sourceType: draggedElement.type,
        data: draggedElement,
        thumbnail: draggedElement.thumbnail
      }
      
      startDrag(dragData)
    }
  }, [readOnly, project, startDrag])

  const handleDragOver = useCallback((event: DragOverEvent) => {
    // Handle drag over for visual feedback
    console.log('Drag over:', event)
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    if (readOnly) return

    const { active, over } = event
    
    if (!over || !dragData) {
      endDrag()
      return
    }

    const elementId = active.id as string
    const targetData = over.data.current

    if (targetData?.type === 'layer') {
      // Move element to different layer
      const newLayerId = targetData.layerId
      const newTime = targetData.time || currentTime
      
      moveElement(elementId, newLayerId, newTime)
    } else if (targetData?.type === 'timeline') {
      // Move element within same layer
      const newTime = targetData.time || currentTime
      
      // Find current layer
      let currentLayerId = ''
      const tracks = project?.tracks || []
      tracks.forEach(track => {
        track.layers.forEach(layer => {
          if (layer.elements.find(el => el.id === elementId)) {
            currentLayerId = layer.id
          }
        })
      })

      if (currentLayerId) {
        moveElement(elementId, currentLayerId, newTime)
      }
    }

    endDrag()
  }, [readOnly, dragData, currentTime, project, moveElement, endDrag])

  // ==================== KEYBOARD SHORTCUTS ====================
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (readOnly) return

      switch (event.key) {
        case ' ':
          event.preventDefault()
          handlePlayPause()
          break
        case 'Delete':
        case 'Backspace':
          selection.elementIds.forEach(elementId => {
            // Delete selected elements
          })
          break
        case 'z':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            // Undo
          }
          break
        case 'c':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            // Copy
          }
          break
        case 'v':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            // Paste
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [readOnly, handlePlayPause, selection])

  // ==================== ZOOM & SCROLL HANDLERS ====================
  const handleZoom = useCallback((delta: number, centerX?: number) => {
    if (readOnly) return

    const newZoom = Math.max(0.1, Math.min(zoom + delta, 10))
    setZoom(newZoom)

    // Adjust scroll to maintain center point
    if (centerX !== undefined) {
      const timeAtCenter = (centerX + scrollX) / pixelsPerSecond
      const newScrollX = timeAtCenter * (100 * newZoom) - centerX
      setScrollX(Math.max(0, newScrollX))
    }
  }, [readOnly, zoom, scrollX, pixelsPerSecond, setZoom, setScrollX])

  const handleScroll = useCallback((deltaX: number) => {
    if (readOnly) return

    const newScrollX = Math.max(0, scrollX + deltaX)
    setScrollX(newScrollX)
  }, [readOnly, scrollX, setScrollX])

  const handleWheel = useCallback((event: React.WheelEvent) => {
    event.preventDefault()

    if (event.ctrlKey || event.metaKey) {
      // Zoom
      const delta = -event.deltaY * 0.01
      const rect = canvasRef.current?.getBoundingClientRect()
      const centerX = rect ? event.clientX - rect.left : undefined
      handleZoom(delta, centerX)
    } else {
      // Scroll
      handleScroll(event.deltaX)
    }
  }, [handleZoom, handleScroll])

  // ==================== RENDER ====================
  if (!project) {
    return (
      <div className={`flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-800 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading timeline...</p>
        </div>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div 
        ref={timelineRef}
        className={`timeline-editor flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden ${className}`}
      >
        {/* Toolbar */}
        <TimelineToolbar 
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={project.duration}
          zoomLevel={zoom}
          onPlay={play}
          onPause={pause}
          onStop={() => { pause(); seekTo(0) }}
          onSeek={seekTo}
          onZoomIn={() => setZoom(Math.min(zoom * 1.2, 10))}
          onZoomOut={() => setZoom(Math.max(zoom / 1.2, 0.1))}
          onPlayPause={handlePlayPause}
          onZoomChange={handleZoom}
          onShowKeyframes={() => setShowKeyframes(!showKeyframes)}
          showKeyframes={showKeyframes}
          readOnly={readOnly}
        />

        {/* Main Timeline Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Track List */}
          <TimelineTrackList 
            tracks={project.tracks || []}
            onLayerClick={handleLayerClick}
            selectedLayers={selection.layerIds}
            readOnly={readOnly}
          />

          {/* Timeline Canvas */}
          <div 
            ref={canvasRef}
            className="flex-1 relative overflow-hidden"
            onClick={handleCanvasClick}
            onWheel={handleWheel}
          >
            {/* Ruler */}
            <TimelineRuler 
              duration={project.duration}
              currentTime={currentTime}
              zoom={zoom}
              scrollX={scrollX}
              pixelsPerSecond={pixelsPerSecond}
              onTimeClick={(time) => seekTo(time)}
            />

            {/* Timeline Canvas */}
            <TimelineCanvas
              project={project}
              currentTime={currentTime}
              zoom={zoom}
              scrollX={scrollX}
              pixelsPerSecond={pixelsPerSecond}
              selection={selection}
              onElementClick={handleElementClick}
              onTimelineClick={handleTimelineClick}
              showKeyframes={showKeyframes}
              readOnly={readOnly}
            />

            {/* Playhead */}
            <TimelinePlayhead 
              currentTime={currentTime}
              scrollX={scrollX}
              pixelsPerSecond={pixelsPerSecond}
              height={canvasSize.height}
              onSeek={seekTo}
              readOnly={readOnly}
            />

            {/* Collaboration Overlay */}
            {showCollaboration && (
              <TimelineCollaborationOverlay 
                collaborators={collaborators}
                scrollX={scrollX}
                pixelsPerSecond={pixelsPerSecond}
              />
            )}
          </div>

          {/* Property Panel */}
          {showPropertyPanel && activeElementId && (
            <TimelinePropertyPanel 
              elementId={activeElementId}
              onClose={() => setActiveElementId(null)}
              readOnly={readOnly}
            />
          )}
        </div>

        {/* Keyframes Panel */}
        <AnimatePresence>
          {showKeyframes && activeElementId && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 200 }}
              exit={{ height: 0 }}
              className="border-t border-gray-200 dark:border-gray-700"
            >
              <TimelineKeyframes 
                elementId={activeElementId}
                currentTime={currentTime}
                zoom={zoom}
                scrollX={scrollX}
                pixelsPerSecond={pixelsPerSecond}
                readOnly={readOnly}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {isDragging && dragData && (
          <TimelineElementCard
            element={dragData.data}
            isSelected={false}
            isDragging={true}
            zoom={zoom}
            pixelsPerSecond={pixelsPerSecond}
          />
        )}
      </DragOverlay>
    </DndContext>
  )
}

export default AdvancedTimelineEditor