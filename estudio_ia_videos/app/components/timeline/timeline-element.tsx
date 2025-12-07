/**
 * Timeline Element Component
 * Individual draggable and resizable element in the timeline
 */

'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { 
  Video, 
  AudioLines, 
  Type, 
  Image as ImageIcon, 
  Shapes, 
  User, 
  FileText,
  Volume2,
  VolumeX,
  Lock,
  Eye,
  EyeOff,
  MoreHorizontal
} from 'lucide-react';
import type { TimelineElement as TimelineElementModel } from '@/lib/types/timeline-types';

interface TimelineElementProps {
  element: TimelineElementModel;
  pixelsPerMs: number;
  isSelected: boolean;
  isDragging: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<TimelineElementModel>) => void;
  onMove?: (newStartTime: number) => void;
  onResize?: (newDuration: number) => void;
}

const ELEMENT_ICONS = {
  video: Video,
  audio: AudioLines,
  text: Type,
  image: ImageIcon,
  shape: Shapes,
  transition: MoreHorizontal,
  effect: Shapes,
  avatar: User,
  'avatar-3d': User,
  'pptx-slide': FileText
};

const ELEMENT_COLORS = {
  video: 'bg-blue-600',
  audio: 'bg-green-600',
  text: 'bg-purple-600',
  image: 'bg-yellow-600',
  shape: 'bg-red-600',
  transition: 'bg-gray-600',
  effect: 'bg-pink-600',
  avatar: 'bg-indigo-600',
  'avatar-3d': 'bg-indigo-700',
  'pptx-slide': 'bg-orange-600'
};

export function TimelineElement({
  element,
  pixelsPerMs,
  isSelected,
  isDragging,
  onSelect,
  onUpdate,
  onMove,
  onResize
}: TimelineElementProps) {
  const [isResizing, setIsResizing] = useState<'left' | 'right' | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const resizeStartRef = useRef({ startX: 0, originalDuration: 0, originalStartTime: 0 });

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: sortableIsDragging
  } = useSortable({
    id: element.id,
    data: {
      type: 'timeline-element',
      element
    }
  });

  const width = element.duration * pixelsPerMs;
  const minWidth = 20; // Minimum width in pixels

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    width: Math.max(width, minWidth),
    opacity: isDragging || sortableIsDragging ? 0.6 : 1
  };

  const Icon = ELEMENT_ICONS[element.type];
  const colorClass = ELEMENT_COLORS[element.type];

  // Handle resize start
  const handleResizeStart = useCallback((e: React.MouseEvent, side: 'left' | 'right') => {
    e.stopPropagation();
    setIsResizing(side);
    resizeStartRef.current = {
      startX: e.clientX,
      originalDuration: element.duration,
      originalStartTime: element.startTime ?? element.start
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - resizeStartRef.current.startX;
      const deltaTime = deltaX / pixelsPerMs;

      if (side === 'right') {
        // Resize from right (change duration)
        const newDuration = Math.max(100, resizeStartRef.current.originalDuration + deltaTime);
        onResize?.(newDuration);
      } else {
        // Resize from left (change start time and duration)
        const newStartTime = Math.max(0, resizeStartRef.current.originalStartTime + deltaTime);
        const newDuration = Math.max(100, resizeStartRef.current.originalDuration - deltaTime);
        
        onMove?.(newStartTime);
        onResize?.(newDuration);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [element.duration, element.startTime, pixelsPerMs, onResize, onMove]);

  // Format duration for display
  const formatDuration = (ms: number) => {
    const seconds = ms / 1000;
    if (seconds < 60) {
      return `${seconds.toFixed(1)}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Handle element properties toggle
  const toggleProperty = useCallback((property: string) => {
    if (!element.properties) return;
    onUpdate({
      properties: {
        ...element.properties,
        [property]: !element.properties[property]
      }
    });
  }, [element.properties, onUpdate]);

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`timeline-element relative rounded-md overflow-hidden cursor-move select-none group
        ${colorClass} ${isSelected ? 'ring-2 ring-white ring-opacity-80' : ''}
        ${element.properties?.locked ? 'cursor-not-allowed' : ''}
        ${!element.properties?.visible ? 'opacity-50' : ''}
        shadow-sm hover:shadow-md transition-all duration-200`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
      
      {/* Content */}
      <div className="relative h-full flex items-center px-2 space-x-2">
        {/* Icon */}
        <Icon size={16} className="text-white/90 flex-shrink-0" />
        
        {/* Name and info */}
        <div className="flex-1 min-w-0">
          <div className="text-white/90 text-xs font-medium truncate">
            {element.name}
          </div>
          {width > 80 && (
            <div className="text-white/60 text-xs truncate">
              {formatDuration(element.duration)}
            </div>
          )}
        </div>

        {/* Status indicators */}
        {(isHovered || isSelected) && width > 60 && (
          <div className="flex items-center space-x-1">
            {!element.properties?.visible && (
              <EyeOff size={12} className="text-white/60" />
            )}
            {element.properties?.locked && (
              <Lock size={12} className="text-white/60" />
            )}
            {element.type === 'audio' && element.data?.volume === 0 && (
              <VolumeX size={12} className="text-white/60" />
            )}
          </div>
        )}
      </div>

      {/* Waveform for audio elements */}
      {element.type === 'audio' && width > 100 && (
        <div className="absolute bottom-1 left-2 right-2 h-3 opacity-30">
          <div className="h-full bg-white/20 rounded-sm flex items-center justify-center">
            <div className="w-full h-1 bg-white/40 rounded-full" />
          </div>
        </div>
      )}

      {/* Thumbnail for video/image elements */}
      {(element.type === 'video' || element.type === 'image') && element.data?.imageUrl && width > 80 && (
        <div className="absolute top-1 right-1 w-8 h-6 rounded overflow-hidden opacity-60">
          <img 
            src={element.data.imageUrl} 
            alt="Thumbnail" 
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* PPTX slide preview */}
      {element.type === 'pptx-slide' && element.data?.slideData?.backgroundImage && width > 100 && (
        <div className="absolute top-1 right-1 w-12 h-8 rounded overflow-hidden opacity-60 border border-white/20">
          <img 
            src={element.data.slideData.backgroundImage} 
            alt="Slide preview" 
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Keyframe indicators */}
      {(element.keyframes?.length ?? 0) > 0 && width > 60 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 to-orange-400 opacity-60" />
      )}

      {/* Resize handles */}
      {!element.properties?.locked && (isHovered || isSelected || isResizing) && (
        <>
          {/* Left resize handle */}
          <div
            className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize bg-white/20 hover:bg-blue-400 transition-colors opacity-0 group-hover:opacity-100"
            onMouseDown={(e) => handleResizeStart(e, 'left')}
          />
          
          {/* Right resize handle */}
          <div
            className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize bg-white/20 hover:bg-blue-400 transition-colors opacity-0 group-hover:opacity-100"
            onMouseDown={(e) => handleResizeStart(e, 'right')}
          />
        </>
      )}

      {/* Selection indicator */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full shadow-lg"
        />
      )}

      {/* Context menu trigger (would integrate with a context menu system) */}
      {isHovered && (
        <div className="absolute top-1 left-1">
          <button
            className="w-4 h-4 bg-black/40 rounded hover:bg-black/60 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              // Context menu would be triggered here
            }}
          >
            <MoreHorizontal size={10} className="text-white" />
          </button>
        </div>
      )}
    </motion.div>
  );
}