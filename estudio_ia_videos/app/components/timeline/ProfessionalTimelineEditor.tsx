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
import { UnifiedPreviewPlayer } from '../editor/unified-preview-player';

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

// Main Professional Timeline Editor Component
export default function ProfessionalTimelineEditor() {
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
    const x = e.clientX - rect.left; // Account for track headers offset in UI logic if needed, but here we click on timeline area
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

  // Helper to convert tracks for preview player
  const getPreviewTracks = useCallback(() => {
    const validTypes = ['video', 'audio', 'text', 'image', 'shape', 'avatar'] as const
    type ValidType = typeof validTypes[number]
    
    return project.tracks.map(track => {
      const trackType: ValidType = validTypes.includes(track.type as ValidType) 
        ? (track.type as ValidType) 
        : 'video'
      
      return {
        id: track.id,
        name: track.name,
        type: trackType,
        color: track.color,
        visible: track.visible,
        locked: track.locked,
        clips: track.elements.map(el => ({
          id: el.id,
          name: el.name,
          startTime: el.startTime,
          duration: el.duration,
          content: el.content,
          effects: [] as string[]
        }))
      }
    })
  }, [project.tracks])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex flex-col h-screen">
          {/* Header Toolbar */}
          <div className="bg-gray-900 border-b border-gray-800 p-2 shrink-0 z-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    🎬 Timeline Pro
                  </h1>
                </div>
                
                {/* Project Info */}
                <div className="text-xs text-gray-500 space-x-2 hidden md:block">
                  <span>{project.resolution.width}x{project.resolution.height}</span>
                  <span>•</span>
                  <span>{project.fps}fps</span>
                </div>
              </div>
              
              {/* Main Controls */}
              <div className="flex items-center gap-2">
                {/* Playback Controls */}
                <div className="flex items-center gap-1 bg-gray-800 rounded-md p-1 border border-gray-700">
                  <Button size="sm" variant="ghost" onClick={skipBack} className="h-8 w-8 p-0">
                    <SkipBack className="w-4 h-4" />
                  </Button>
                  <Button size="sm" onClick={togglePlayback} className={`h-8 w-8 p-0 ${project.isPlaying ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                    {project.isPlaying ? 
                      <Pause className="w-4 h-4" /> : 
                      <Play className="w-4 h-4" />
                    }
                  </Button>
                  <Button size="sm" variant="ghost" onClick={skipForward} className="h-8 w-8 p-0">
                    <SkipForward className="w-4 h-4" />
                  </Button>
                </div>

                {/* Time Display */}
                <div className="text-sm text-blue-400 font-mono bg-black/50 px-3 py-1.5 rounded border border-gray-800 min-w-[100px] text-center">
                  {Math.floor(project.currentTime / 60)}:{(project.currentTime % 60).toFixed(1).padStart(4, '0')}
                </div>

                <div className="h-6 w-px bg-gray-700 mx-2" />

                <Button size="sm" variant="outline" onClick={exportProject} className="h-8 text-xs border-gray-700 hover:bg-gray-800">
                  <Download className="w-3 h-3 mr-2" />
                  Exportar
                </Button>
              </div>
            </div>
          </div>

          {/* Main Workspace Area (Preview + Properties) */}
          <div className="flex-1 flex min-h-0 bg-black/50">
             {/* Left: Preview Player */}
             <div className="flex-1 relative bg-black flex items-center justify-center p-4 border-r border-gray-800">
                <div className="aspect-video w-full max-h-full bg-gray-900 rounded-lg overflow-hidden shadow-2xl border border-gray-800 relative">
                  <UnifiedPreviewPlayer 
                    currentTime={project.currentTime}
                    tracks={getPreviewTracks()}
                    isPlaying={project.isPlaying}
                  />
                  
                  {/* Safe Area Guides (Optional) */}
                  <div className="absolute inset-0 pointer-events-none opacity-20 border-[40px] border-transparent">
                    <div className="w-full h-full border border-white/50 border-dashed"></div>
                  </div>
                </div>
             </div>

             {/* Right: Properties Panel */}
             {showProperties && (
                <div className="w-80 bg-gray-900 border-l border-gray-800 flex flex-col overflow-y-auto">
                  <div className="p-4 border-b border-gray-800">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Settings className="w-4 h-4 text-blue-400" />
                      Propriedades
                    </h3>
                  </div>
                  
                  {selectedElement ? (
                    <div className="p-4 space-y-6">
                      <div className="space-y-2">
                        <label className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Geral</label>
                        <div className="space-y-3">
                          <div>
                            <span className="text-xs text-gray-400 block mb-1">Nome</span>
                            <Input 
                              value={selectedElement.name} 
                              onChange={(e) => updateElement({ ...selectedElement, name: e.target.value })}
                              className="h-8 bg-gray-800 border-gray-700"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                             <div>
                                <span className="text-xs text-gray-400 block mb-1">Início</span>
                                <Input 
                                  type="number"
                                  value={selectedElement.startTime.toFixed(1)} 
                                  onChange={(e) => updateElement({ ...selectedElement, startTime: parseFloat(e.target.value) })}
                                  className="h-8 bg-gray-800 border-gray-700"
                                  step="0.1"
                                />
                             </div>
                             <div>
                                <span className="text-xs text-gray-400 block mb-1">Duração</span>
                                <Input 
                                  type="number"
                                  value={selectedElement.duration.toFixed(1)} 
                                  onChange={(e) => updateElement({ ...selectedElement, duration: parseFloat(e.target.value) })}
                                  className="h-8 bg-gray-800 border-gray-700"
                                  step="0.1"
                                />
                             </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                         <label className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Transformação</label>
                         <div className="grid grid-cols-2 gap-3">
                            <div>
                              <span className="text-xs text-gray-400 block mb-1">Posição X</span>
                              <Input type="number" className="h-8 bg-gray-800 border-gray-700" defaultValue={0} />
                            </div>
                            <div>
                              <span className="text-xs text-gray-400 block mb-1">Posição Y</span>
                              <Input type="number" className="h-8 bg-gray-800 border-gray-700" defaultValue={0} />
                            </div>
                            <div>
                              <span className="text-xs text-gray-400 block mb-1">Escala</span>
                              <Input type="number" className="h-8 bg-gray-800 border-gray-700" defaultValue={100} />
                            </div>
                            <div>
                              <span className="text-xs text-gray-400 block mb-1">Rotação</span>
                              <Input type="number" className="h-8 bg-gray-800 border-gray-700" defaultValue={0} />
                            </div>
                         </div>
                      </div>
                      
                      <div className="pt-4 border-t border-gray-800">
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          className="w-full"
                          onClick={() => selectedElements.forEach(deleteElement)}
                        >
                          <Trash2 className="w-3 h-3 mr-2" />
                          Remover Elemento
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-60 text-gray-600 p-4 text-center">
                      <Move className="w-10 h-10 mb-3 opacity-20" />
                      <p className="text-sm">Selecione um clipe na timeline para editar suas propriedades</p>
                    </div>
                  )}
                </div>
             )}
          </div>

          {/* Timeline Area (Bottom) */}
          <div className="h-[40vh] flex flex-col border-t border-gray-800 bg-gray-900 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.5)] z-40">
            
            {/* Timeline Toolbar */}
            <div className="flex items-center justify-between p-2 bg-gray-800 border-b border-gray-700 text-xs">
               <div className="flex items-center gap-2">
                 <Button size="sm" variant="ghost" onClick={() => addTrack('video')} className="h-7 px-2 hover:bg-blue-900/30 hover:text-blue-400">
                   <Plus className="w-3 h-3 mr-1" /> Track de Vídeo
                 </Button>
                 <Button size="sm" variant="ghost" onClick={() => addTrack('audio')} className="h-7 px-2 hover:bg-green-900/30 hover:text-green-400">
                   <Plus className="w-3 h-3 mr-1" /> Track de Áudio
                 </Button>
               </div>
               
               <div className="flex items-center gap-2">
                  <span className="text-gray-500">Zoom</span>
                  <Slider 
                    value={[project.zoom * 100]} 
                    min={10} max={300} 
                    onValueChange={([v]) => setProject(p => ({...p, zoom: v/100}))}
                    className="w-24"
                  />
               </div>
            </div>

            {/* Tracks Container */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar relative">
               <div className="flex min-w-full min-h-full relative">
                  {/* Track Headers Column */}
                  <div className="w-60 shrink-0 bg-gray-900 border-r border-gray-800 sticky left-0 z-20 shadow-lg">
                    {project.tracks.map(track => (
                      <div key={track.id} style={{ height: track.collapsed ? 40 : track.height }} className="border-b border-gray-800 p-2 flex flex-col justify-center relative group">
                         <div className="flex items-center justify-between mb-1">
                           <span className="font-medium text-xs truncate text-gray-300 w-32" title={track.name}>{track.name}</span>
                           <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => updateTrack({...track, muted: !track.muted})}>
                                {track.muted ? <VolumeX className="w-3 h-3 text-red-400"/> : <Volume2 className="w-3 h-3 text-gray-400"/>}
                              </Button>
                              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => updateTrack({...track, locked: !track.locked})}>
                                {track.locked ? <Lock className="w-3 h-3 text-red-400"/> : <Unlock className="w-3 h-3 text-gray-400"/>}
                              </Button>
                           </div>
                         </div>
                         <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: track.color }}></div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Tracks Content Area */}
                  <div className="flex-1 relative bg-gray-900/50 overflow-x-auto" ref={timelineRef} onClick={handleTimelineClick}>
                     <div style={{ width: totalWidth, minWidth: '100%' }} className="relative h-full">
                        {/* Time Ruler */}
                        <div className="h-6 border-b border-gray-700 bg-gray-900 sticky top-0 z-10 flex items-end text-[10px] text-gray-500 select-none">
                           {Array.from({ length: Math.ceil(project.duration) }).map((_, i) => (
                              <div key={i} className="absolute bottom-0 border-l border-gray-600 pl-1" style={{ left: i * pixelsPerSecond }}>
                                 {i % 5 === 0 ? `${Math.floor(i/60)}:${(i%60).toString().padStart(2, '0')}` : '|'}
                              </div>
                           ))}
                        </div>
                        
                        {/* Playhead Line */}
                        <div 
                          className="absolute top-0 bottom-0 w-px bg-red-500 z-30 pointer-events-none"
                          style={{ left: project.currentTime * pixelsPerSecond }}
                        >
                           <div className="w-3 h-3 bg-red-500 -ml-1.5 rounded-full shadow-sm" />
                        </div>

                        {/* Render Tracks */}
                        {project.tracks.map(track => (
                          <div key={track.id} style={{ height: track.collapsed ? 40 : track.height }} className="border-b border-gray-800 relative group">
                             {/* Grid Lines */}
                             <div className="absolute inset-0 pointer-events-none opacity-10" 
                                  style={{ backgroundImage: `linear-gradient(90deg, #333 1px, transparent 1px)`, backgroundSize: `${pixelsPerSecond}px 100%` }}>
                             </div>
                             
                             <SortableContext items={track.elements.map(e => e.id)} strategy={verticalListSortingStrategy}>
                                {track.elements.map(element => (
                                  <TimelineElementComponent
                                    key={element.id}
                                    element={element}
                                    track={track}
                                    pixelsPerSecond={pixelsPerSecond}
                                    onSelect={selectElement}
                                    onEdit={() => {}} // Open properties
                                    onDelete={deleteElement}
                                    onDurationChange={updateElementDuration}
                                    isSelected={selectedElements.includes(element.id)}
                                  />
                                ))}
                             </SortableContext>
                          </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </DndContext>
    </div>
  );
}
