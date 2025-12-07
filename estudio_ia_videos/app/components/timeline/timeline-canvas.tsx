/**
 * Timeline Canvas - Enhanced with Multi-Selection and Advanced Interactions
 * Main canvas area where timeline elements are rendered and manipulated
 */

'use client'

import React, { useCallback, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { 
  TimelineProject, 
  TimelineSelection, 
  TimelineElement,
  TimelineLayer,
  TimelineTrack,
  TimelineMarker
} from '@/lib/types/timeline-types'
import { TimelineElementCard } from './timeline-element-card'
import { TimelineElement as TimelineElementComponent } from './timeline-element'

// Placeholder components
const TimelineMarkers: React.FC<{
  markers?: TimelineMarker[];
  pixelsPerSecond: number;
  scrollX: number;
  height: number;
}> = () => null;

const TimelineWaveform: React.FC<{
  audioUrl: string;
  startTime?: number;
  duration: number;
  pixelsPerSecond: number;
  height: number;
}> = () => null;

interface TimelineCanvasProps {
  project: TimelineProject
  currentTime: number
  zoom: number
  scrollX: number
  pixelsPerSecond: number
  selection: TimelineSelection
  onElementClick: (elementId: string, event: React.MouseEvent) => void
  onTimelineClick: (event: React.MouseEvent) => void
  showKeyframes: boolean
  readOnly?: boolean
}

export const TimelineCanvas: React.FC<TimelineCanvasProps> = ({
  project,
  currentTime,
  zoom,
  scrollX,
  pixelsPerSecond,
  selection,
  onElementClick,
  onTimelineClick,
  showKeyframes,
  readOnly = false
}) => {
  // Droppable area for timeline
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: 'timeline-canvas',
    data: {
      type: 'timeline',
      time: currentTime
    }
  })

  // Calculate visible time range for performance optimization
  const visibleTimeRange = useMemo(() => {
    const canvasWidth = 1200 // Assuming canvas width
    const startTime = scrollX / pixelsPerSecond
    const endTime = (scrollX + canvasWidth) / pixelsPerSecond
    return { startTime, endTime }
  }, [scrollX, pixelsPerSecond])

  // Normalize tracks/layers
  const tracks = useMemo(() => {
    if (project.tracks && project.tracks.length > 0) return project.tracks;
    return [{
      id: 'default-track',
      name: 'Default Track',
      type: 'default',
      layers: project.layers
    }];
  }, [project.tracks, project.layers]);

  // Filter visible elements for performance
  const visibleElements = useMemo(() => {
    const elements: Array<{ element: TimelineElement; layerId: string; trackId: string }> = []
    
    tracks.forEach(track => {
      track.layers.forEach(layer => {
        layer.elements.forEach(element => {
          const startTime = element.startTime ?? element.start;
          const endTime = element.endTime ?? (startTime + element.duration);
          
          // Only include elements that intersect with visible time range
          if (endTime >= visibleTimeRange.startTime && 
              startTime <= visibleTimeRange.endTime) {
            elements.push({ element, layerId: layer.id, trackId: track.id })
          }
        })
      })
    })
    
    return elements
  }, [tracks, visibleTimeRange])

  // Calculate layer positions
  const layerPositions = useMemo(() => {
    const positions = new Map<string, { top: number; height: number }>()
    let currentTop = 0
    
    tracks.forEach(track => {
      track.layers.forEach(layer => {
        positions.set(layer.id, {
          top: currentTop,
          height: layer.height || 100 // Default height if undefined
        })
        currentTop += (layer.height || 100)
      })
    })
    
    return positions
  }, [tracks])

  const handleElementClick = useCallback((elementId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    onElementClick(elementId, event)
  }, [onElementClick])

  const getElementStyle = useCallback((element: TimelineElement) => {
    const layerPos = layerPositions.get(element.layerId || '')
    if (!layerPos) return {}

    const startTime = element.startTime ?? element.start;
    const left = startTime * pixelsPerSecond - scrollX
    const width = element.duration * pixelsPerSecond
    
    return {
      left: `${left}px`,
      top: `${layerPos.top}px`,
      width: `${width}px`,
      height: `${layerPos.height - 4}px`, // 2px margin top/bottom
      position: 'absolute' as const
    }
  }, [layerPositions, pixelsPerSecond, scrollX])

  // Grid lines for visual alignment
  const renderGridLines = () => {
    const lines = []
    const totalWidth = project.duration * pixelsPerSecond
    const startTime = Math.floor(visibleTimeRange.startTime)
    const endTime = Math.ceil(visibleTimeRange.endTime)
    
    // Major grid lines (seconds)
    for (let time = startTime; time <= endTime; time++) {
      const x = time * pixelsPerSecond - scrollX
      if (x >= -1 && x <= 1201) { // Canvas width + 1px buffer
        lines.push(
          <div
            key={`major-${time}`}
            className="absolute top-0 bottom-0 w-px bg-gray-300 dark:bg-gray-600 opacity-30"
            style={{ left: `${x}px` }}
          />
        )
      }
    }
    
    // Minor grid lines (frames)
    if (zoom > 0.5 && project.framerate) {
      const frameInterval = 1 / project.framerate
      for (let time = startTime; time <= endTime; time += frameInterval) {
        const x = time * pixelsPerSecond - scrollX
        if (x >= -1 && x <= 1201) {
          lines.push(
            <div
              key={`minor-${time}`}
              className="absolute top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700 opacity-20"
              style={{ left: `${x}px` }}
            />
          )
        }
      }
    }
    
    return lines
  }

  // Render track backgrounds
  const renderTrackBackgrounds = () => {
    let currentTop = 0
    return tracks.map((track, index) => {
      const trackHeight = track.layers.reduce((sum, layer) => sum + (layer.height || 100), 0)
      const bg = (
        <div
          key={track.id}
          className={`absolute left-0 right-0 ${
            index % 2 === 0 
              ? 'bg-gray-50 dark:bg-gray-800' 
              : 'bg-white dark:bg-gray-900'
          }`}
          style={{
            top: `${currentTop}px`,
            height: `${trackHeight}px`
          }}
        />
      )
      currentTop += trackHeight
      return bg
    })
  }

  // Render layer separators
  const renderLayerSeparators = () => {
    const separators: React.ReactNode[] = []
    let currentTop = 0
    
    tracks.forEach(track => {
      track.layers.forEach((layer, index) => {
        if (index > 0) { // Don't add separator before first layer
          separators.push(
            <div
              key={`separator-${layer.id}`}
              className="absolute left-0 right-0 h-px bg-gray-200 dark:bg-gray-700"
              style={{ top: `${currentTop}px` }}
            />
          )
        }
        currentTop += (layer.height || 100)
      })
    })
    
    return separators
  }

  const totalHeight = useMemo(() => {
    return tracks.reduce((sum, track) => 
      sum + track.layers.reduce((layerSum, layer) => layerSum + (layer.height || 100), 0), 0
    ) || 0
  }, [tracks])

  return (
    <div
      ref={setDroppableRef}
      className={`timeline-canvas relative overflow-hidden cursor-crosshair select-none ${
        isOver ? 'bg-blue-50 dark:bg-blue-900/20' : ''
      }`}
      style={{ height: `${totalHeight}px` }}
      onClick={onTimelineClick}
    >
      {/* Grid Lines */}
      {renderGridLines()}
      
      {/* Track Backgrounds */}
      {renderTrackBackgrounds()}
      
      {/* Layer Separators */}
      {renderLayerSeparators()}
      
      {/* Timeline Markers */}
      <TimelineMarkers
        markers={project.markers}
        pixelsPerSecond={pixelsPerSecond}
        scrollX={scrollX}
        height={totalHeight}
      />

      {/* Timeline Elements */}
      {visibleElements.map(({ element, layerId }) => {
        const isSelected = selection.elementIds.includes(element.id)
        
        return (
          <motion.div
            key={element.id}
            style={getElementStyle(element)}
            initial={false}
            animate={{
              scale: isSelected ? 1.02 : 1,
              zIndex: isSelected ? 10 : 1
            }}
            transition={{ duration: 0.15 }}
          >
            <TimelineElementCard
              element={element}
              isSelected={isSelected}
              isDragging={false}
              zoom={zoom}
              pixelsPerSecond={pixelsPerSecond}
              onClick={(event) => handleElementClick(element.id, event)}
              readOnly={readOnly}
              showWaveform={element.type === 'audio' && zoom > 0.3}
            />
            
            {/* Waveform for audio elements */}
            {element.type === 'audio' && zoom > 0.3 && (
              <TimelineWaveform
                audioUrl={element.sourceUrl || ''}
                startTime={element.startTime}
                duration={element.duration}
                pixelsPerSecond={pixelsPerSecond}
                height={layerPositions.get(layerId)?.height || 60}
              />
            )}
          </motion.div>
        )
      })}

      {/* Selection Rectangle (for multi-select) */}
      {/* TODO: Implement selection rectangle for drag-to-select */}
      
      {/* Drop Zone Indicator */}
      {isOver && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 border-2 border-blue-400 border-dashed bg-blue-50 dark:bg-blue-900/20 pointer-events-none"
        />
      )}
    </div>
  )
}