/**
 * 🎬 Editor de Timeline Profissional - Nova Implementação
 * Sistema completo com drag-and-drop, múltiplas tracks e preview em tempo real
 */

'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DndContext, DragEndEvent, DragStartEvent, DragOverEvent, useDraggable, useDroppable } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Layers,
  Plus,
  Scissors,
  Copy,
  Trash2,
  Download,
  Upload,
  Zap,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Move,
  Square,
  Circle,
  Type,
  Image as ImageIcon,
  Video,
  Music,
  Mic,
  Settings,
  Grid,
  Maximize2,
  ChevronRight,
  ChevronDown
} from 'lucide-react';

// Types
interface TimelineElement {
  id: string;
  type: 'video' | 'audio' | 'image' | 'text' | 'shape';
  name: string;
  startTime: number;
  duration: number;
  content: string | null;
  properties: {
    volume?: number;
    opacity?: number;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    rotation?: number;
    scale?: number;
    color?: string;
    fontSize?: number;
    fontFamily?: string;
  };
  keyframes?: Keyframe[];
  locked: boolean;
  visible: boolean;
}

interface TimelineTrack {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'composite';
  elements: TimelineElement[];
  height: number;
  color: string;
  muted: boolean;
  locked: boolean;
  visible: boolean;
  volume: number;
  collapsed: boolean;
}

interface Keyframe {
  id: string;
  time: number;
  property: string;
  value: unknown;
  easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
}

interface TimelineProject {
  id: string;
  name: string;
  duration: number;
  fps: number;
  resolution: { width: number; height: number };
  tracks: TimelineTrack[];
  currentTime: number;
  zoom: number;
  isPlaying: boolean;
  volume: number;
  muted: boolean;
}

// Sample Elements for Testing
const sampleElements: TimelineElement[] = [
  {
    id: 'elem-1',
    type: 'video',
    name: 'Intro Video',
    startTime: 0,
    duration: 10,
    content: 'intro.mp4',
    properties: { volume: 1, opacity: 1 },
    keyframes: [],
    locked: false,
    visible: true
  },
  {
    id: 'elem-2',
    type: 'audio',
    name: 'Background Music',
    startTime: 0,
    duration: 30,
    content: 'music.mp3',
    properties: { volume: 0.3 },
    keyframes: [],
    locked: false,
    visible: true
  },
  {
    id: 'elem-3',
    type: 'text',
    name: 'Title Text',
    startTime: 2,
    duration: 5,
    content: 'Título do Vídeo',
    properties: { 
      x: 100, 
      y: 50, 
      fontSize: 48, 
      color: '#ffffff',
      fontFamily: 'Arial'
    },
    keyframes: [],
    locked: false,
    visible: true
  }
];

// Initial project data
const initialProject: TimelineProject = {
  id: 'project-1',
  name: 'Projeto de Demonstração',
  duration: 60,
  fps: 30,
  resolution: { width: 1920, height: 1080 },
  tracks: [
    {
      id: 'track-1',
      name: 'Vídeo Principal',
      type: 'video',
      elements: [sampleElements[0], sampleElements[2]],
      height: 80,
      color: '#3B82F6',
      muted: false,
      locked: false,
      visible: true,
      volume: 1,
      collapsed: false
    },
    {
      id: 'track-2',
      name: 'Áudio e Música',
      type: 'audio',
      elements: [sampleElements[1]],
      height: 60,
      color: '#10B981',
      muted: false,
      locked: false,
      visible: true,
      volume: 1,
      collapsed: false
    }
  ],
  currentTime: 0,
  zoom: 1,
  isPlaying: false,
  volume: 1,
  muted: false
};

// Timeline Element Component with Drag Support
function TimelineElementComponent({ 
  element, 
  track, 
  pixelsPerSecond, 
  onSelect, 
  onEdit, 
  onDelete, 
  isSelected,
  onDurationChange 
}: {
  element: TimelineElement;
  track: TimelineTrack;
  pixelsPerSecond: number;
  onSelect: (id: string, multiSelect?: boolean) => void;
  onEdit: (element: TimelineElement) => void;
  onDelete: (id: string) => void;
  isSelected: boolean;
  onDurationChange?: (elementId: string, newDuration: number) => void;
}) {
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ 
    id: element.id,
    disabled: element.locked || track.locked
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    left: element.startTime * pixelsPerSecond,
    width: Math.max(element.duration * pixelsPerSecond, 40),
    opacity: isDragging ? 0.5 : 1,
  };

  const getElementIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-3 h-3" />;
      case 'audio': return <Music className="w-3 h-3" />;
      case 'image': return <ImageIcon className="w-3 h-3" />;
      case 'text': return <Type className="w-3 h-3" />;
      case 'shape': return <Square className="w-3 h-3" />;
      default: return <Square className="w-3 h-3" />;
    }
  };

  const handleResizeStart = (e: React.MouseEvent, direction: 'left' | 'right') => {
    e.stopPropagation();
    setIsResizing(true);
    
    const startX = e.clientX;
    const startWidth = element.duration * pixelsPerSecond;
    const startLeft = element.startTime * pixelsPerSecond;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      
      if (direction === 'right') {
        const newWidth = Math.max(40, startWidth + deltaX);
        const newDuration = newWidth / pixelsPerSecond;
        onDurationChange?.(element.id, newDuration);
      } else if (direction === 'left') {
        const newLeft = Math.max(0, startLeft + deltaX);
        const newStartTime = newLeft / pixelsPerSecond;
        const newDuration = element.duration + (element.startTime - newStartTime);
        
        if (newDuration > 0.1) {
          // Would need to implement start time change
          onEdit({ ...element, startTime: newStartTime, duration: newDuration });
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`
        absolute top-1 h-[calc(100%-8px)] 
        rounded cursor-move select-none
        flex items-center px-2 gap-1
        text-xs font-medium text-white
        border-2 transition-all
        ${isSelected ? 'border-yellow-400 shadow-lg ring-2 ring-yellow-400/20' : 'border-transparent'}
        ${element.visible ? 'opacity-100' : 'opacity-50'}
        ${element.locked || track.locked ? 'cursor-not-allowed opacity-60' : 'cursor-move'}
        ${isResizing ? 'cursor-ew-resize' : ''}
        hover:shadow-md
        group
      `}
      style={{
        ...style,
        backgroundColor: track.color,
        backgroundImage: `linear-gradient(45deg, transparent 25%, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.1) 50%, transparent 50%, transparent 75%, rgba(255,255,255,0.1) 75%)`,
        backgroundSize: '8px 8px',
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(element.id, e.ctrlKey || e.metaKey);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onEdit(element);
      }}
    >
      {/* Element Icon and Name */}
      <div className="flex items-center gap-1 flex-1 min-w-0">
        {getElementIcon(element.type)}
        <span className="truncate">{element.name}</span>
        {element.locked && <Lock className="w-3 h-3 flex-shrink-0" />}
      </div>
      
      {/* Duration indicator */}
      <span className="text-xs opacity-70 flex-shrink-0">
        {element.duration.toFixed(1)}s
      </span>

      {/* Resize handles */}
      {!element.locked && !track.locked && (
        <>
          <div 
            className="absolute left-0 top-0 w-2 h-full cursor-w-resize opacity-0 group-hover:opacity-100 bg-white/20 transition-opacity"
            onMouseDown={(e) => handleResizeStart(e, 'left')}
          />
          <div 
            className="absolute right-0 top-0 w-2 h-full cursor-e-resize opacity-0 group-hover:opacity-100 bg-white/20 transition-opacity"
            onMouseDown={(e) => handleResizeStart(e, 'right')}
          />
        </>
      )}

      {/* Keyframe indicators */}
      {element.keyframes && element.keyframes.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow-400" />
      )}
    </div>
  );
}

// Timeline Track Component
function TimelineTrackComponent({ 
  track, 
  pixelsPerSecond, 
  duration, 
  selectedElements, 
  onElementSelect, 
  onElementEdit, 
  onElementDelete,
  onElementDurationChange,
  onTrackUpdate,
  onAddElement
}: {
  track: TimelineTrack;
  pixelsPerSecond: number;
  duration: number;
  selectedElements: string[];
  onElementSelect: (id: string, multiSelect?: boolean) => void;
  onElementEdit: (element: TimelineElement) => void;
  onElementDelete: (id: string) => void;
  onElementDurationChange: (elementId: string, newDuration: number) => void;
  onTrackUpdate: (track: TimelineTrack) => void;
  onAddElement: (trackId: string, type: TimelineElement['type']) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: track.id,
  });

  return (
    <div className={`flex border-b border-gray-700 ${isOver ? 'bg-blue-900/20' : ''}`}>
      {/* Track Header */}
      <div className="w-60 flex-shrink-0 bg-gray-800 border-r border-gray-700 p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onTrackUpdate({ ...track, collapsed: !track.collapsed })}
              className="w-5 h-5 p-0"
            >
              {track.collapsed ? 
                <ChevronRight className="w-3 h-3" /> : 
                <ChevronDown className="w-3 h-3" />
              }
            </Button>
            <h3 className="text-sm font-medium text-white truncate">{track.name}</h3>
          </div>
          
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onTrackUpdate({ ...track, visible: !track.visible })}
              className="w-6 h-6 p-0"
              title={track.visible ? 'Ocultar track' : 'Mostrar track'}
            >
              {track.visible ? 
                <Eye className="w-3 h-3 text-gray-400" /> : 
                <EyeOff className="w-3 h-3 text-gray-500" />
              }
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onTrackUpdate({ ...track, locked: !track.locked })}
              className="w-6 h-6 p-0"
              title={track.locked ? 'Desbloquear track' : 'Bloquear track'}
            >
              {track.locked ? 
                <Lock className="w-3 h-3 text-red-400" /> : 
                <Unlock className="w-3 h-3 text-gray-400" />
              }
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-xs" style={{ borderColor: track.color }}>
            {track.type}
          </Badge>
          <span className="text-xs text-gray-400">
            {track.elements.length} elementos
          </span>
        </div>
        
        {/* Audio controls for audio tracks */}
        {track.type === 'audio' && !track.collapsed && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onTrackUpdate({ ...track, muted: !track.muted })}
                className="w-6 h-6 p-0"
              >
                {track.muted ? 
                  <VolumeX className="w-3 h-3 text-red-400" /> : 
                  <Volume2 className="w-3 h-3 text-gray-400" />
                }
              </Button>
              <Slider
                value={[track.volume * 100]}
                onValueChange={([value]) => onTrackUpdate({ ...track, volume: value / 100 })}
                max={100}
                step={1}
                className="flex-1"
                disabled={track.muted}
              />
              <span className="text-xs text-gray-400 w-8">
                {Math.round(track.volume * 100)}%
              </span>
            </div>
          </div>
        )}

        {/* Add Element Buttons */}
        {!track.collapsed && (
          <div className="flex gap-1 mt-2">
            {track.type === 'video' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAddElement(track.id, 'video')}
                  className="text-xs px-2 py-1 h-auto"
                >
                  <Video className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAddElement(track.id, 'text')}
                  className="text-xs px-2 py-1 h-auto"
                >
                  <Type className="w-3 h-3" />
                </Button>
              </>
            )}
            {track.type === 'audio' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAddElement(track.id, 'audio')}
                className="text-xs px-2 py-1 h-auto"
              >
                <Music className="w-3 h-3" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Track Timeline */}
      <div 
        ref={setNodeRef}
        className="flex-1 relative bg-gray-900"
        style={{ 
          height: track.collapsed ? 40 : track.height, 
          minWidth: duration * pixelsPerSecond 
        }}
      >
        {/* Grid lines */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: Math.ceil(duration) }).map((_, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 w-px bg-gray-700"
              style={{ left: i * pixelsPerSecond }}
            />
          ))}
          {/* Sub-grid lines (half seconds) */}
          {Array.from({ length: Math.ceil(duration * 2) }).map((_, i) => (
            <div
              key={`sub-${i}`}
              className="absolute top-0 bottom-0 w-px bg-gray-800"
              style={{ left: (i * 0.5) * pixelsPerSecond }}
            />
          ))}
        </div>

        {/* Track color indicator */}
        <div 
          className="absolute left-0 top-0 bottom-0 w-1 opacity-50"
          style={{ backgroundColor: track.color }}
        />

        {/* Elements */}
        {!track.collapsed && (
          <SortableContext items={track.elements.map(e => e.id)} strategy={verticalListSortingStrategy}>
            {track.elements.map((element) => (
              <TimelineElementComponent
                key={element.id}
                element={element}
                track={track}
                pixelsPerSecond={pixelsPerSecond}
                onSelect={onElementSelect}
                onEdit={onElementEdit}
                onDelete={onElementDelete}
                onDurationChange={onElementDurationChange}
                isSelected={selectedElements.includes(element.id)}
              />
            ))}
          </SortableContext>
        )}

        {/* Drop indicator */}
        {isOver && (
          <div className="absolute inset-0 border-2 border-dashed border-blue-400 bg-blue-400/10 pointer-events-none" />
        )}
      </div>
    </div>
  );
}

// Main Professional Timeline Editor Component
export function ProfessionalTimelineEditor() {
  const [project, setProject] = useState<TimelineProject>(initialProject);
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [draggedElement, setDraggedElement] = useState<TimelineElement | null>(null);
  const [playInterval, setPlayInterval] = useState<NodeJS.Timeout | null>(null);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [showProperties, setShowProperties] = useState(true);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Calculated values
  const pixelsPerSecond = 60 * project.zoom;
  const totalWidth = project.duration * pixelsPerSecond;
  const snapInterval = snapToGrid ? 0.5 : 0.1; // Snap to half seconds or 0.1s

  // Utility function to snap time to grid
  const snapTime = useCallback((time: number) => {
    if (!snapToGrid) return time;
    return Math.round(time / snapInterval) * snapInterval;
  }, [snapToGrid, snapInterval]);

  // Playback controls
  const togglePlayback = useCallback(() => {
    if (project.isPlaying) {
      if (playInterval) {
        clearInterval(playInterval);
        setPlayInterval(null);
      }
      setProject(prev => ({ ...prev, isPlaying: false }));
    } else {
      const interval = setInterval(() => {
        setProject(prev => {
          const newTime = prev.currentTime + (1 / prev.fps);
          if (newTime >= prev.duration) {
            return { ...prev, currentTime: 0, isPlaying: false };
          }
          return { ...prev, currentTime: newTime };
        });
      }, 1000 / project.fps);
      
      setPlayInterval(interval);
      setProject(prev => ({ ...prev, isPlaying: true }));
    }
  }, [project.isPlaying, playInterval, project.fps]);

  const seekTo = useCallback((time: number) => {
    const snappedTime = snapTime(Math.max(0, Math.min(time, project.duration)));
    setProject(prev => ({ ...prev, currentTime: snappedTime }));
  }, [snapTime, project.duration]);

  const skipBack = useCallback(() => {
    seekTo(Math.max(0, project.currentTime - 5));
  }, [project.currentTime, seekTo]);

  const skipForward = useCallback(() => {
    seekTo(Math.min(project.duration, project.currentTime + 5));
  }, [project.currentTime, project.duration, seekTo]);

  // Track management
  const addTrack = useCallback((type: 'video' | 'audio' | 'composite') => {
    const newTrack: TimelineTrack = {
      id: `track-${Date.now()}`,
      name: `Nova Track ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      type,
      elements: [],
      height: type === 'audio' ? 60 : 80,
      color: type === 'video' ? '#3B82F6' : type === 'audio' ? '#10B981' : '#8B5CF6',
      muted: false,
      locked: false,
      visible: true,
      volume: 1,
      collapsed: false
    };

    setProject(prev => ({
      ...prev,
      tracks: [...prev.tracks, newTrack]
    }));
  }, []);

  const updateTrack = useCallback((updatedTrack: TimelineTrack) => {
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => 
        track.id === updatedTrack.id ? updatedTrack : track
      )
    }));
  }, []);

  const deleteTrack = useCallback((trackId: string) => {
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.filter(track => track.id !== trackId)
    }));
  }, []);

  // Element management
  const addElement = useCallback((trackId: string, type: TimelineElement['type']) => {
    const newElement: TimelineElement = {
      id: `element-${Date.now()}`,
      type,
      name: `Novo ${type}`,
      startTime: snapTime(project.currentTime),
      duration: 5,
      content: type === 'text' ? 'Novo texto' : null,
      properties: {
        volume: 1,
        opacity: 1,
        x: 0,
        y: 0,
        width: 200,
        height: 100,
        rotation: 0,
        scale: 1,
        color: '#ffffff',
        fontSize: 24,
        fontFamily: 'Arial'
      },
      keyframes: [],
      locked: false,
      visible: true
    };

    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => 
        track.id === trackId 
          ? { ...track, elements: [...track.elements, newElement] }
          : track
      )
    }));
  }, [project.currentTime, snapTime]);

  const updateElement = useCallback((element: TimelineElement) => {
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => ({
        ...track,
        elements: track.elements.map(el => 
          el.id === element.id ? element : el
        )
      }))
    }));
  }, []);

  const updateElementDuration = useCallback((elementId: string, newDuration: number) => {
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => ({
        ...track,
        elements: track.elements.map(el => 
          el.id === elementId ? { ...el, duration: Math.max(0.1, newDuration) } : el
        )
      }))
    }));
  }, []);

  const deleteElement = useCallback((elementId: string) => {
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => ({
        ...track,
        elements: track.elements.filter(el => el.id !== elementId)
      }))
    }));
    setSelectedElements(prev => prev.filter(id => id !== elementId));
  }, []);

  const duplicateElement = useCallback((elementId: string) => {
    const element = project.tracks
      .flatMap(track => track.elements)
      .find(el => el.id === elementId);
    
    if (!element) return;

    const track = project.tracks.find(t => t.elements.some(el => el.id === elementId));
    if (!track) return;

    const duplicated: TimelineElement = {
      ...element,
      id: `element-${Date.now()}`,
      name: `${element.name} (cópia)`,
      startTime: snapTime(element.startTime + element.duration)
    };

    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(t => 
        t.id === track.id 
          ? { ...t, elements: [...t.elements, duplicated] }
          : t
      )
    }));
  }, [project.tracks, snapTime]);

  // Selection management
  const selectElement = useCallback((elementId: string, multiSelect = false) => {
    if (multiSelect) {
      setSelectedElements(prev => 
        prev.includes(elementId) 
          ? prev.filter(id => id !== elementId)
          : [...prev, elementId]
      );
    } else {
      setSelectedElements([elementId]);
    }
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedElements([]);
  }, []);

  // Drag & Drop handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const elementId = event.active.id as string;
    const element = project.tracks
      .flatMap(track => track.elements)
      .find(el => el.id === elementId);
    
    setDraggedElement(element || null);
  }, [project.tracks]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || !draggedElement) {
      setDraggedElement(null);
      return;
    }

    const elementId = active.id as string;
    const targetTrackId = over.id as string;

    // Move element between tracks
    setProject(prev => {
      const sourceTrack = prev.tracks.find(track => 
        track.elements.some(el => el.id === elementId)
      );
      const targetTrack = prev.tracks.find(track => track.id === targetTrackId);

      if (!sourceTrack || !targetTrack || sourceTrack.id === targetTrack.id) {
        return prev;
      }

      const element = sourceTrack.elements.find(el => el.id === elementId);
      if (!element) return prev;

      return {
        ...prev,
        tracks: prev.tracks.map(track => {
          if (track.id === sourceTrack.id) {
            return {
              ...track,
              elements: track.elements.filter(el => el.id !== elementId)
            };
          }
          if (track.id === targetTrack.id) {
            return {
              ...track,
              elements: [...track.elements, element]
            };
          }
          return track;
        })
      };
    });

    setDraggedElement(null);
  }, [draggedElement]);

  // Export functionality
  const exportProject = useCallback(() => {
    const exportData = {
      project,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [project]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent if typing in input
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlayback();
      } else if (e.code === 'Delete' && selectedElements.length > 0) {
        selectedElements.forEach(deleteElement);
      } else if (e.ctrlKey && e.code === 'KeyD' && selectedElements.length > 0) {
        e.preventDefault();
        selectedElements.forEach(duplicateElement);
      } else if (e.ctrlKey && e.code === 'KeyA') {
        e.preventDefault();
        const allElementIds = project.tracks.flatMap(t => t.elements.map(e => e.id));
        setSelectedElements(allElementIds);
      } else if (e.code === 'Escape') {
        clearSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayback, selectedElements, deleteElement, duplicateElement, project.tracks, clearSelection]);

  // Timeline click handler
  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - 240; // Account for track headers
    const time = x / pixelsPerSecond;
    
    seekTo(time);
    if (!e.ctrlKey && !e.metaKey) {
      clearSelection();
    }
  }, [pixelsPerSecond, seekTo, clearSelection]);

  // Get selected element for properties panel
  const selectedElement = selectedElements.length === 1 
    ? project.tracks.flatMap(t => t.elements).find(e => e.id === selectedElements[0])
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex flex-col h-screen">
          {/* Header Toolbar */}
          <div className="bg-gray-800 border-b border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-xl font-bold text-white">🎬 Timeline Profissional</h1>
                  <p className="text-sm text-gray-400">{project.name}</p>
                </div>
                
                {/* Project Info */}
                <div className="text-xs text-gray-400 space-y-1">
                  <div>{project.resolution.width}x{project.resolution.height} • {project.fps}fps</div>
                  <div>{project.tracks.length} tracks • {project.tracks.flatMap(t => t.elements).length} elementos</div>
                </div>
              </div>
              
              {/* Main Controls */}
              <div className="flex items-center gap-4">
                {/* Playback Controls */}
                <div className="flex items-center gap-2 bg-gray-700 rounded-lg p-2">
                  <Button size="sm" variant="ghost" onClick={skipBack}>
                    <SkipBack className="w-4 h-4" />
                  </Button>
                  <Button size="sm" onClick={togglePlayback} className="bg-blue-600 hover:bg-blue-700">
                    {project.isPlaying ? 
                      <Pause className="w-4 h-4" /> : 
                      <Play className="w-4 h-4" />
                    }
                  </Button>
                  <Button size="sm" variant="ghost" onClick={skipForward}>
                    <SkipForward className="w-4 h-4" />
                  </Button>
                </div>

                {/* Time Display */}
                <div className="text-sm text-gray-300 font-mono bg-gray-700 px-3 py-2 rounded">
                  {Math.floor(project.currentTime / 60)}:{(project.currentTime % 60).toFixed(1).padStart(4, '0')} / {Math.floor(project.duration / 60)}:{(project.duration % 60).toFixed(0).padStart(2, '0')}
                </div>

                {/* Track Management */}
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => addTrack('video')}>
                    <Plus className="w-4 h-4 mr-1" />
                    Vídeo
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => addTrack('audio')}>
                    <Plus className="w-4 h-4 mr-1" />
                    Áudio
                  </Button>
                </div>

                {/* Zoom Controls */}
                <div className="flex items-center gap-2 bg-gray-700 rounded-lg p-2">
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => setProject(prev => ({ ...prev, zoom: Math.max(0.1, prev.zoom - 0.2) }))}
                  >
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <span className="text-xs text-gray-300 w-12 text-center">
                    {Math.round(project.zoom * 100)}%
                  </span>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => setProject(prev => ({ ...prev, zoom: Math.min(3, prev.zoom + 0.2) }))}
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                </div>

                {/* Utility Controls */}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={snapToGrid ? "default" : "outline"}
                    onClick={() => setSnapToGrid(!snapToGrid)}
                    title="Snap to Grid"
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowProperties(!showProperties)}
                    title="Toggle Properties Panel"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>

                  <Button size="sm" variant="outline" onClick={exportProject}>
                    <Download className="w-4 h-4 mr-1" />
                    Exportar
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Container */}
          <div className="flex-1 flex flex-col">
            {/* Ruler */}
            <div className="bg-gray-800 border-b border-gray-700 flex">
              <div className="w-60 flex-shrink-0 bg-gray-800 border-r border-gray-700 p-2">
                <div className="text-xs text-gray-400 flex items-center gap-2">
                  <Layers className="w-3 h-3" />
                  Timeline
                </div>
              </div>
              <div className="flex-1 relative h-10 bg-gray-800 overflow-hidden">
                {/* Time markers */}
                <div className="absolute inset-0">
                  {Array.from({ length: Math.ceil(project.duration) + 1 }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute top-0 bottom-0 flex flex-col justify-center text-xs text-gray-400"
                      style={{ left: i * pixelsPerSecond }}
                    >
                      <div className="w-px h-full bg-gray-600" />
                      <span className="absolute top-1 left-1 bg-gray-800 px-1 rounded text-xs">
                        {i}s
                      </span>
                    </div>
                  ))}
                  
                  {/* Sub-markers (half seconds) */}
                  {Array.from({ length: Math.ceil(project.duration * 2) }).map((_, i) => (
                    <div
                      key={`sub-${i}`}
                      className="absolute top-0 bottom-0"
                      style={{ left: (i * 0.5) * pixelsPerSecond }}
                    >
                      <div className="w-px h-3 bg-gray-700 mt-2" />
                    </div>
                  ))}
                </div>
                
                {/* Playhead */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
                  style={{ left: project.currentTime * pixelsPerSecond }}
                >
                  <div className="absolute -top-1 -left-2 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                  <div className="absolute top-0 left-0.5 w-px h-full bg-red-300 opacity-50" />
                </div>
              </div>
            </div>

            {/* Tracks */}
            <div 
              ref={timelineRef}
              className="flex-1 overflow-auto"
              onClick={handleTimelineClick}
            >
              {project.tracks.map((track) => (
                <TimelineTrackComponent
                  key={track.id}
                  track={track}
                  pixelsPerSecond={pixelsPerSecond}
                  duration={project.duration}
                  selectedElements={selectedElements}
                  onElementSelect={selectElement}
                  onElementEdit={updateElement}
                  onElementDelete={deleteElement}
                  onElementDurationChange={updateElementDuration}
                  onTrackUpdate={updateTrack}
                  onAddElement={addElement}
                />
              ))}
              
              {/* Empty state */}
              {project.tracks.length === 0 && (
                <div className="flex-1 flex items-center justify-center text-gray-500 py-20">
                  <div className="text-center">
                    <Layers className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">Nenhuma track criada</p>
                    <p className="text-sm mb-4">Adicione uma track de vídeo ou áudio para começar</p>
                    <div className="flex gap-2 justify-center">
                      <Button size="sm" onClick={() => addTrack('video')}>
                        <Plus className="w-4 h-4 mr-1" />
                        Adicionar Vídeo
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => addTrack('audio')}>
                        <Plus className="w-4 h-4 mr-1" />
                        Adicionar Áudio
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Properties Panel */}
          {showProperties && (
            <div className="h-64 bg-gray-800 border-t border-gray-700 flex">
              {/* Selection Info */}
              <div className="w-60 border-r border-gray-700 p-4">
                <h3 className="text-sm font-medium text-white mb-3">
                  Seleção ({selectedElements.length})
                </h3>
                
                {selectedElements.length === 0 ? (
                  <p className="text-xs text-gray-400">
                    Nenhum elemento selecionado
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedElements.map(id => {
                      const element = project.tracks.flatMap(t => t.elements).find(e => e.id === id);
                      return element ? (
                        <div key={id} className="text-xs text-gray-300 p-2 bg-gray-700 rounded">
                          <div className="font-medium">{element.name}</div>
                          <div className="text-gray-400">{element.type} • {element.duration.toFixed(1)}s</div>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}

                {/* Selection Actions */}
                {selectedElements.length > 0 && (
                  <div className="flex flex-col gap-2 mt-4">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => selectedElements.forEach(duplicateElement)}
                      className="justify-start"
                    >
                      <Copy className="w-3 h-3 mr-2" />
                      Duplicar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => selectedElements.forEach(deleteElement)}
                      className="justify-start text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-3 h-3 mr-2" />
                      Excluir
                    </Button>
                  </div>
                )}
              </div>

              {/* Properties */}
              <div className="flex-1 p-4">
                {selectedElement ? (
                  <Tabs defaultValue="general" className="h-full">
                    <TabsList className="mb-4">
                      <TabsTrigger value="general">Geral</TabsTrigger>
                      <TabsTrigger value="transform">Transformação</TabsTrigger>
                      <TabsTrigger value="effects">Efeitos</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Nome</label>
                          <Input 
                            value={selectedElement.name} 
                            onChange={(e) => updateElement({ ...selectedElement, name: e.target.value })}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Tipo</label>
                          <div className="h-8 px-3 py-2 bg-gray-700 rounded text-sm text-gray-300">
                            {selectedElement.type}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Início (s)</label>
                          <Input 
                            type="number" 
                            value={selectedElement.startTime.toFixed(1)} 
                            onChange={(e) => updateElement({ 
                              ...selectedElement, 
                              startTime: parseFloat(e.target.value) || 0 
                            })}
                            className="h-8 text-sm"
                            step="0.1"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Duração (s)</label>
                          <Input 
                            type="number" 
                            value={selectedElement.duration.toFixed(1)} 
                            onChange={(e) => updateElement({ 
                              ...selectedElement, 
                              duration: Math.max(0.1, parseFloat(e.target.value) || 0.1)
                            })}
                            className="h-8 text-sm"
                            step="0.1"
                            min="0.1"
                          />
                        </div>
                      </div>

                      {selectedElement.type === 'text' && (
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Conteúdo</label>
                          <Input 
                            value={selectedElement.content || ''} 
                            onChange={(e) => updateElement({ ...selectedElement, content: e.target.value })}
                            className="h-8 text-sm"
                          />
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="transform" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">X</label>
                          <Input 
                            type="number" 
                            value={selectedElement.properties.x || 0} 
                            onChange={(e) => updateElement({ 
                              ...selectedElement, 
                              properties: { 
                                ...selectedElement.properties, 
                                x: parseFloat(e.target.value) || 0 
                              }
                            })}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Y</label>
                          <Input 
                            type="number" 
                            value={selectedElement.properties.y || 0} 
                            onChange={(e) => updateElement({ 
                              ...selectedElement, 
                              properties: { 
                                ...selectedElement.properties, 
                                y: parseFloat(e.target.value) || 0 
                              }
                            })}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Largura</label>
                          <Input 
                            type="number" 
                            value={selectedElement.properties.width || 200} 
                            onChange={(e) => updateElement({ 
                              ...selectedElement, 
                              properties: { 
                                ...selectedElement.properties, 
                                width: parseFloat(e.target.value) || 200 
                              }
                            })}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Altura</label>
                          <Input 
                            type="number" 
                            value={selectedElement.properties.height || 100} 
                            onChange={(e) => updateElement({ 
                              ...selectedElement, 
                              properties: { 
                                ...selectedElement.properties, 
                                height: parseFloat(e.target.value) || 100 
                              }
                            })}
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Rotação</label>
                          <Input 
                            type="number" 
                            value={selectedElement.properties.rotation || 0} 
                            onChange={(e) => updateElement({ 
                              ...selectedElement, 
                              properties: { 
                                ...selectedElement.properties, 
                                rotation: parseFloat(e.target.value) || 0 
                              }
                            })}
                            className="h-8 text-sm"
                            step="1"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Escala</label>
                          <Input 
                            type="number" 
                            value={selectedElement.properties.scale || 1} 
                            onChange={(e) => updateElement({ 
                              ...selectedElement, 
                              properties: { 
                                ...selectedElement.properties, 
                                scale: parseFloat(e.target.value) || 1 
                              }
                            })}
                            className="h-8 text-sm"
                            step="0.1"
                            min="0.1"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Opacidade</label>
                          <Slider
                            value={[(selectedElement.properties.opacity || 1) * 100]}
                            onValueChange={([value]) => updateElement({ 
                              ...selectedElement, 
                              properties: { 
                                ...selectedElement.properties, 
                                opacity: value / 100 
                              }
                            })}
                            max={100}
                            step={1}
                            className="mt-2"
                          />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="effects" className="space-y-4">
                      <p className="text-sm text-gray-400">
                        Painel de efeitos em desenvolvimento...
                      </p>
                      
                      {selectedElement.type === 'audio' && (
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Volume</label>
                          <Slider
                            value={[(selectedElement.properties.volume || 1) * 100]}
                            onValueChange={([value]) => updateElement({ 
                              ...selectedElement, 
                              properties: { 
                                ...selectedElement.properties, 
                                volume: value / 100 
                              }
                            })}
                            max={100}
                            step={1}
                            className="mt-2"
                          />
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Selecione um elemento para editar suas propriedades</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DndContext>
    </div>
  );
}

export default ProfessionalTimelineEditor;