/**
 * Timeline Element Card - Representação visual de um elemento na timeline
 */

'use client'

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Video,
  Music,
  Image,
  Type,
  Square,
  FileText,
  User,
  Zap,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Lock,
  Unlock
} from 'lucide-react'
import { TimelineElement } from '@/lib/types/timeline-types'

interface TimelineElementCardProps {
  element: TimelineElement
  isSelected: boolean
  isDragging: boolean
  zoom: number
  pixelsPerSecond: number
  onClick?: (event: React.MouseEvent) => void
  readOnly?: boolean
  showWaveform?: boolean
}

export const TimelineElementCard: React.FC<TimelineElementCardProps> = ({
  element,
  isSelected,
  isDragging,
  zoom,
  pixelsPerSecond,
  onClick,
  readOnly = false,
  showWaveform = false
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging
  } = useSortable({
    id: element.id,
    disabled: readOnly || element.locked
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  // Element type icon
  const getElementIcon = () => {
    switch (element.type) {
      case 'video':
        return <Video size={14} />
      case 'audio':
        return <Music size={14} />
      case 'image':
        return <Image size={14} />
      case 'text':
        return <Type size={14} />
      case 'shape':
        return <Square size={14} />
      case 'pptx-slide':
        return <FileText size={14} />
      case 'avatar-3d':
        return <User size={14} />
      case 'effect':
        return <Zap size={14} />
      default:
        return <Square size={14} />
    }
  }

  // Element type color
  const getElementColor = () => {
    switch (element.type) {
      case 'video':
        return 'bg-blue-500'
      case 'audio':
        return 'bg-green-500'
      case 'image':
        return 'bg-purple-500'
      case 'text':
        return 'bg-yellow-500'
      case 'shape':
        return 'bg-gray-500'
      case 'pptx-slide':
        return 'bg-orange-500'
      case 'avatar-3d':
        return 'bg-pink-500'
      case 'effect':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  // Element background color based on type and state
  const getBackgroundColor = () => {
    if (isDragging || isSortableDragging) {
      return 'bg-blue-100 dark:bg-blue-900/50'
    }
    if (isSelected) {
      return 'bg-blue-50 dark:bg-blue-900/30'
    }
    
    switch (element.type) {
      case 'video':
        return 'bg-blue-100 dark:bg-blue-900/20'
      case 'audio':
        return 'bg-green-100 dark:bg-green-900/20'
      case 'image':
        return 'bg-purple-100 dark:bg-purple-900/20'
      case 'text':
        return 'bg-yellow-100 dark:bg-yellow-900/20'
      case 'shape':
        return 'bg-gray-100 dark:bg-gray-900/20'
      case 'pptx-slide':
        return 'bg-orange-100 dark:bg-orange-900/20'
      case 'avatar-3d':
        return 'bg-pink-100 dark:bg-pink-900/20'
      case 'effect':
        return 'bg-red-100 dark:bg-red-900/20'
      default:
        return 'bg-gray-100 dark:bg-gray-900/20'
    }
  }

  // Border color based on selection and type
  const getBorderColor = () => {
    if (isSelected) {
      return 'border-blue-400 dark:border-blue-500'
    }
    return 'border-gray-300 dark:border-gray-600'
  }

  // Calculate if element name should be shown based on width
  const showElementName = useMemo(() => {
    const elementWidth = element.duration * pixelsPerSecond
    return elementWidth > 80 // Show name if wider than 80px
  }, [element.duration, pixelsPerSecond])

  // Calculate if details should be shown
  const showDetails = useMemo(() => {
    const elementWidth = element.duration * pixelsPerSecond
    return elementWidth > 120 && zoom > 0.5
  }, [element.duration, pixelsPerSecond, zoom])

  // Truncate text based on available width
  const getTruncatedText = (text: string, maxWidth: number) => {
    if (text.length * 8 <= maxWidth) return text
    const maxChars = Math.floor(maxWidth / 8) - 3
    return text.substring(0, maxChars) + '...'
  }

  const elementWidth = element.duration * pixelsPerSecond

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        timeline-element relative h-full rounded border-2 cursor-pointer select-none overflow-hidden
        ${getBackgroundColor()}
        ${getBorderColor()}
        ${element.locked ? 'opacity-60' : ''}
        ${isDragging || isSortableDragging ? 'shadow-lg z-50' : ''}
        ${isSelected ? 'shadow-md' : ''}
        transition-all duration-150
      `}
      onClick={onClick}
      whileHover={!readOnly && !element.locked ? { scale: 1.02 } : {}}
      whileTap={!readOnly && !element.locked ? { scale: 0.98 } : {}}
    >
      {/* Element Type Indicator */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${getElementColor()}`} />

      {/* Thumbnail (if available) */}
      {!!element.data?.thumbnail && showDetails && (
        <div className="absolute left-2 top-1 w-8 h-8 rounded overflow-hidden bg-black/20">
          <img
            src={element.data?.thumbnail as string}
            alt={element.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Main Content */}
      <div className="flex items-center h-full px-2 py-1">
        {/* Icon */}
        <div className="flex-shrink-0 text-gray-600 dark:text-gray-400 mr-2">
          {getElementIcon()}
        </div>

        {/* Element Info */}
        <div className="flex-1 min-w-0">
          {showElementName && (
            <div className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
              {getTruncatedText(element.name || 'Element', elementWidth - 40)}
            </div>
          )}
          
          {showDetails && (
            <div className="text-xs text-gray-500 dark:text-gray-500 truncate">
              {element.duration.toFixed(1)}s
              {element.sourceUrl && (
                <span className="ml-1">
                  • {element.sourceType || 'media'}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Status Icons */}
        {showDetails && (
          <div className="flex-shrink-0 flex items-center space-x-1 ml-1">
            {element.muted && (
              <div title="Muted">
                <VolumeX size={10} className="text-red-500" />
              </div>
            )}
            {!element.visible && (
              <div title="Hidden">
                <EyeOff size={10} className="text-gray-500" />
              </div>
            )}
            {element.locked && (
              <div title="Locked">
                <Lock size={10} className="text-yellow-500" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Waveform Background (for audio elements) */}
      {showWaveform && element.type === 'audio' && (
        <div className="absolute inset-0 opacity-30">
          {/* Simplified waveform visualization */}
          <svg className="w-full h-full">
            {Array.from({ length: Math.floor(elementWidth / 4) }).map((_, i) => {
              const height = Math.random() * 20 + 5
              return (
                <rect
                  key={i}
                  x={i * 4}
                  y={(40 - height) / 2}
                  width={2}
                  height={height}
                  fill="currentColor"
                  className="text-green-400"
                />
              )
            })}
          </svg>
        </div>
      )}

      {/* Progress Indicator (if playing) */}
      {/* TODO: Add playback progress indicator */}

      {/* Resize Handles */}
      {isSelected && !readOnly && !element.locked && (
        <>
          {/* Left resize handle */}
          <div className="absolute left-0 top-0 bottom-0 w-2 cursor-w-resize bg-blue-400 opacity-0 hover:opacity-100 transition-opacity" />
          
          {/* Right resize handle */}
          <div className="absolute right-0 top-0 bottom-0 w-2 cursor-e-resize bg-blue-400 opacity-0 hover:opacity-100 transition-opacity" />
        </>
      )}

      {/* Keyframes Indicator */}
      {(element.keyframes?.length ?? 0) > 0 && showDetails && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-yellow-400 to-orange-400" />
      )}

      {/* Error State */}
      {element.metadata?.hasError && (
        <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" title="Element has errors" />
      )}
    </motion.div>
  )
}