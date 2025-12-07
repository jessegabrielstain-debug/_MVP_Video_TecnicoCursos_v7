/**
 * 🎬 Advanced Timeline Editor - Motionity Integration PoC
 * Professional timeline with keyframes, animations, and advanced controls
 */

'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward,
  Volume2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Copy,
  Plus,
  Settings,
  Save,
  Download,
  Film,
  Music,
  Type,
  Image as ImageIcon,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCw,
  Move,
  Square,
  Circle,
  Triangle,
  Star,
  Palette,
  Sliders,
  Clock,
  TrendingUp,
  Zap,
  Sparkles
} from 'lucide-react';

// Advanced Types for Motionity-style Timeline
interface Keyframe {
  id: string;
  time: number;
  value: unknown;
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce' | 'elastic';
  interpolation: 'discrete' | 'linear' | 'bezier';
}

interface AnimationProperty {
  id: string;
  name: string;
  type: 'number' | 'color' | 'position' | 'rotation' | 'scale' | 'opacity';
  keyframes: Keyframe[];
  defaultValue: unknown;
}

interface AdvancedTimelineElement {
  id: string;
  type: 'image' | 'text' | 'audio' | 'video' | 'shape' | 'avatar';
  name: string;
  duration: number;
  startTime: number;
  layer: number;
  visible: boolean;
  locked: boolean;
  selected: boolean;
  properties: {
    transform: {
      x: AnimationProperty;
      y: AnimationProperty;
      scaleX: AnimationProperty;
      scaleY: AnimationProperty;
      rotation: AnimationProperty;
    };
    appearance: {
      opacity: AnimationProperty;
      color: AnimationProperty;
      borderRadius: AnimationProperty;
    };
    content?: {
      text?: string;
      fontSize?: AnimationProperty;
      fontWeight?: AnimationProperty;
    };
  };
}

interface AdvancedTimelineTrack {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'overlay' | 'effects';
  visible: boolean;
  locked: boolean;
  height: number;
  elements: AdvancedTimelineElement[];
}

interface AdvancedTimelineProject {
  id: string;
  name: string;
  duration: number;
  fps: number;
  width: number;
  height: number;
  currentTime: number;
  isPlaying: boolean;
  zoom: number;
  selectedElements: string[];
  tracks: AdvancedTimelineTrack[];
}

const isAnimationProperty = (value: unknown): value is AnimationProperty => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<AnimationProperty>;

  return (
    typeof candidate?.id === 'string' &&
    Array.isArray(candidate.keyframes) &&
    'defaultValue' in candidate
  );
};

// Easing functions for animations
const EASING_FUNCTIONS = {
  'linear': 'cubic-bezier(0, 0, 1, 1)',
  'ease-in': 'cubic-bezier(0.42, 0, 1, 1)',
  'ease-out': 'cubic-bezier(0, 0, 0.58, 1)',
  'ease-in-out': 'cubic-bezier(0.42, 0, 0.58, 1)',
  'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  'elastic': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
};

export default function AdvancedTimelineEditor() {
  const [project, setProject] = useState<AdvancedTimelineProject>({
    id: 'advanced-project',
    name: 'Projeto Motionity PoC',
    duration: 60,
    fps: 30,
    width: 1920,
    height: 1080,
    currentTime: 0,
    isPlaying: false,
    zoom: 1,
    selectedElements: [],
    tracks: [
      {
        id: 'track-main',
        name: 'Camada Principal',
        type: 'video',
        visible: true,
        locked: false,
        height: 80,
        elements: [
          {
            id: 'element-demo',
            type: 'text',
            name: 'Texto Animado',
            duration: 10,
            startTime: 0,
            layer: 0,
            visible: true,
            locked: false,
            selected: false,
            properties: {
              transform: {
                x: {
                  id: 'x-prop',
                  name: 'Position X',
                  type: 'number',
                  defaultValue: 0,
                  keyframes: [
                    { id: 'x-kf-1', time: 0, value: -200, easing: 'ease-out', interpolation: 'bezier' },
                    { id: 'x-kf-2', time: 2, value: 0, easing: 'bounce', interpolation: 'bezier' }
                  ]
                },
                y: {
                  id: 'y-prop',
                  name: 'Position Y',
                  type: 'number',
                  defaultValue: 0,
                  keyframes: []
                },
                scaleX: {
                  id: 'sx-prop',
                  name: 'Scale X',
                  type: 'number',
                  defaultValue: 1,
                  keyframes: [
                    { id: 'sx-kf-1', time: 0, value: 0, easing: 'elastic', interpolation: 'bezier' },
                    { id: 'sx-kf-2', time: 1.5, value: 1, easing: 'ease-out', interpolation: 'bezier' }
                  ]
                },
                scaleY: {
                  id: 'sy-prop',
                  name: 'Scale Y',
                  type: 'number',
                  defaultValue: 1,
                  keyframes: [
                    { id: 'sy-kf-1', time: 0, value: 0, easing: 'elastic', interpolation: 'bezier' },
                    { id: 'sy-kf-2', time: 1.5, value: 1, easing: 'ease-out', interpolation: 'bezier' }
                  ]
                },
                rotation: {
                  id: 'rot-prop',
                  name: 'Rotation',
                  type: 'rotation',
                  defaultValue: 0,
                  keyframes: []
                }
              },
              appearance: {
                opacity: {
                  id: 'opacity-prop',
                  name: 'Opacity',
                  type: 'opacity',
                  defaultValue: 1,
                  keyframes: [
                    { id: 'op-kf-1', time: 0, value: 0, easing: 'ease-in', interpolation: 'linear' },
                    { id: 'op-kf-2', time: 1, value: 1, easing: 'ease-out', interpolation: 'linear' }
                  ]
                },
                color: {
                  id: 'color-prop',
                  name: 'Color',
                  type: 'color',
                  defaultValue: '#ffffff',
                  keyframes: []
                },
                borderRadius: {
                  id: 'br-prop',
                  name: 'Border Radius',
                  type: 'number',
                  defaultValue: 0,
                  keyframes: []
                }
              },
              content: {
                text: 'Texto Animado Motionity',
                fontSize: {
                  id: 'fs-prop',
                  name: 'Font Size',
                  type: 'number',
                  defaultValue: 24,
                  keyframes: []
                },
                fontWeight: {
                  id: 'fw-prop',
                  name: 'Font Weight',
                  type: 'number',
                  defaultValue: 400,
                  keyframes: []
                }
              }
            }
          }
        ]
      },
      {
        id: 'track-audio',
        name: 'Áudio',
        type: 'audio',
        visible: true,
        locked: false,
        height: 60,
        elements: []
      },
      {
        id: 'track-effects',
        name: 'Efeitos',
        type: 'effects',
        visible: true,
        locked: false,
        height: 50,
        elements: []
      }
    ]
  });

  const [activeTab, setActiveTab] = useState<'timeline' | 'keyframes' | 'properties'>('timeline');
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const playbackTimer = useRef<NodeJS.Timeout | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Advanced playback controls
  const togglePlayback = useCallback(() => {
    if (project.isPlaying) {
      if (playbackTimer.current) {
        clearInterval(playbackTimer.current);
      }
      setProject(prev => ({ ...prev, isPlaying: false }));
    } else {
      setProject(prev => ({ ...prev, isPlaying: true }));
      
      playbackTimer.current = setInterval(() => {
        setProject(prev => {
          if (!prev.isPlaying) return prev;
          
          const newTime = prev.currentTime + (1 / prev.fps);
          if (newTime >= prev.duration) {
            if (playbackTimer.current) {
              clearInterval(playbackTimer.current);
            }
            return { ...prev, currentTime: prev.duration, isPlaying: false };
          }
          
          return { ...prev, currentTime: newTime };
        });
      }, 1000 / project.fps);
    }
  }, [project.isPlaying, project.fps]);

  const seekTo = useCallback((time: number) => {
    setProject(prev => ({
      ...prev,
      currentTime: Math.max(0, Math.min(time, prev.duration))
    }));
  }, []);

  const stopPlayback = useCallback(() => {
    if (playbackTimer.current) {
      clearInterval(playbackTimer.current);
    }
    setProject(prev => ({ ...prev, currentTime: 0, isPlaying: false }));
  }, []);

  // Element selection
  const selectElement = useCallback((elementId: string, multi = false) => {
    setProject(prev => {
      const newSelectedElements = multi 
        ? prev.selectedElements.includes(elementId)
          ? prev.selectedElements.filter(id => id !== elementId)
          : [...prev.selectedElements, elementId]
        : [elementId];

      return {
        ...prev,
        selectedElements: newSelectedElements,
        tracks: prev.tracks.map(track => ({
          ...track,
          elements: track.elements.map(element => ({
            ...element,
            selected: newSelectedElements.includes(element.id)
          }))
        }))
      };
    });
  }, []);

  // Add keyframe
  const addKeyframe = useCallback((elementId: string, propertyPath: string, time: number) => {
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => ({
        ...track,
        elements: track.elements.map(element => {
          if (element.id !== elementId) return element;
          
          // Navigate to the property using the path
          const pathParts = propertyPath.split('.');
          let currentProp: unknown = element.properties;

          for (let i = 0; i < pathParts.length - 1; i++) {
            if (typeof currentProp !== 'object' || currentProp === null) {
              return element;
            }

            currentProp = (currentProp as Record<string, unknown>)[pathParts[i]];
          }

          if (typeof currentProp !== 'object' || currentProp === null) {
            return element;
          }

          const target = (currentProp as Record<string, unknown>)[
            pathParts[pathParts.length - 1]
          ];

          if (!isAnimationProperty(target)) {
            return element;
          }

          const finalProp = target;
          
          // Add keyframe if it doesn't exist at this time
          const existingKeyframe = finalProp.keyframes.find(kf => Math.abs(kf.time - time) < 0.1);
          if (!existingKeyframe) {
            const newKeyframe: Keyframe = {
              id: `kf-${Date.now()}`,
              time,
              value: finalProp.defaultValue,
              easing: 'ease-out',
              interpolation: 'bezier'
            };
            
            finalProp.keyframes.push(newKeyframe);
            finalProp.keyframes.sort((a, b) => a.time - b.time);
          }
          
          return element;
        })
      }))
    }));
  }, []);

  // Get current value for a property at current time
  const getCurrentPropertyValue = useCallback((property: AnimationProperty, currentTime: number) => {
    if (property.keyframes.length === 0) {
      return property.defaultValue;
    }
    
    // Find keyframes before and after current time
    const beforeKeyframes = property.keyframes.filter(kf => kf.time <= currentTime);
    const afterKeyframes = property.keyframes.filter(kf => kf.time > currentTime);
    
    if (beforeKeyframes.length === 0) {
      return afterKeyframes[0]?.value || property.defaultValue;
    }
    
    if (afterKeyframes.length === 0) {
      return beforeKeyframes[beforeKeyframes.length - 1].value;
    }
    
    const before = beforeKeyframes[beforeKeyframes.length - 1];
    const after = afterKeyframes[0];
    
    // Linear interpolation for now (can be enhanced with easing)
    const progress = (currentTime - before.time) / (after.time - before.time);
    
    if (typeof before.value === 'number' && typeof after.value === 'number') {
      return before.value + (after.value - before.value) * progress;
    }
    
    return before.value;
  }, []);

  // Render timeline element with advanced styling
  const renderAdvancedElement = (element: AdvancedTimelineElement, trackIndex: number) => {
    const elementWidth = (element.duration / project.duration) * 1000 * project.zoom;
    const elementLeft = (element.startTime / project.duration) * 1000 * project.zoom;
    
    const getElementColor = (type: string) => {
      switch (type) {
        case 'image': return 'from-blue-500 to-blue-600';
        case 'text': return 'from-green-500 to-green-600';
        case 'audio': return 'from-orange-500 to-orange-600';
        case 'video': return 'from-purple-500 to-purple-600';
        case 'shape': return 'from-pink-500 to-pink-600';
        case 'avatar': return 'from-cyan-500 to-cyan-600';
        default: return 'from-gray-500 to-gray-600';
      }
    };

    const hasKeyframes = Object.values(element.properties.transform).some(prop => prop.keyframes.length > 0) ||
                        Object.values(element.properties.appearance).some(prop => prop.keyframes.length > 0);

    return (
      <div
        key={element.id}
        className={`absolute rounded-lg cursor-pointer border-2 transition-all duration-200 ${
          element.selected 
            ? 'border-yellow-400 shadow-lg shadow-yellow-400/25' 
            : 'border-transparent hover:border-white/30'
        } bg-gradient-to-r ${getElementColor(element.type)} relative overflow-hidden`}
        style={{
          width: `${elementWidth}px`,
          left: `${elementLeft}px`,
          top: `${trackIndex * 90 + 10}px`,
          height: '70px'
        }}
        onClick={(e) => selectElement(element.id, e.ctrlKey)}
        title={`${element.name} (${element.duration}s)`}
      >
        {/* Element content */}
        <div className="p-3 text-white text-sm font-medium h-full flex flex-col justify-between">
          <div className="flex items-center gap-2">
            {element.type === 'text' && <Type className="h-4 w-4" />}
            {element.type === 'image' && <ImageIcon className="h-4 w-4" />}
            {element.type === 'video' && <Film className="h-4 w-4" />}
            {element.type === 'audio' && <Music className="h-4 w-4" />}
            {element.type === 'shape' && <Square className="h-4 w-4" />}
            {element.type === 'avatar' && <Sparkles className="h-4 w-4" />}
            
            <span className="truncate text-xs">{element.name}</span>
            
            {hasKeyframes && (
              <Badge variant="secondary" className="text-[10px] px-1 py-0 bg-yellow-500/20 text-yellow-300">
                <Zap className="h-2 w-2 mr-1" />
                K
              </Badge>
            )}
          </div>
          
          <div className="text-[10px] text-white/70">
            {element.startTime.toFixed(1)}s - {(element.startTime + element.duration).toFixed(1)}s
          </div>
        </div>

        {/* Keyframe indicators */}
        {hasKeyframes && (
          <div className="absolute bottom-1 left-2 right-2 h-1 bg-yellow-400/30 rounded-full">
            <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-pulse"></div>
          </div>
        )}
      </div>
    );
  };

  // Keyframes timeline view
  const renderKeyframesView = () => {
    const selectedElement = project.tracks
      .flatMap(track => track.elements)
      .find(el => project.selectedElements.includes(el.id));

    if (!selectedElement) {
      return (
        <div className="flex items-center justify-center h-96 text-gray-400">
          <div className="text-center">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Selecione um elemento para ver os keyframes</p>
          </div>
        </div>
      );
    }

    const allProperties = [
      ...Object.entries(selectedElement.properties.transform),
      ...Object.entries(selectedElement.properties.appearance)
    ];

    return (
      <ScrollArea className="h-96">
        <div className="space-y-4 p-4">
          {allProperties.map(([key, property]) => (
            <div key={property.id} className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {property.type}
                  </Badge>
                  <span className="font-medium">{property.name}</span>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addKeyframe(selectedElement.id, `transform.${key}`, project.currentTime)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Keyframe
                </Button>
              </div>

              {/* Keyframes timeline */}
              <div className="relative h-12 bg-gray-700 rounded">
                <div className="absolute inset-0 flex items-center">
                  {/* Timeline markers */}
                  {Array.from({ length: Math.ceil(selectedElement.duration) + 1 }, (_, i) => (
                    <div
                      key={i}
                      className="absolute top-0 bottom-0 border-l border-gray-600 text-xs text-gray-400"
                      style={{ left: `${(i / selectedElement.duration) * 100}%` }}
                    >
                      <span className="absolute -top-5 left-1">{i}s</span>
                    </div>
                  ))}
                  
                  {/* Keyframes */}
                  {property.keyframes.map((keyframe) => (
                    <div
                      key={keyframe.id}
                      className="absolute w-3 h-3 bg-yellow-400 rounded-full border-2 border-white cursor-pointer hover:scale-125 transition-transform"
                      style={{ 
                        left: `${(keyframe.time / selectedElement.duration) * 100}%`,
                        top: '50%',
                        transform: 'translateY(-50%)'
                      }}
                      title={`${keyframe.time}s: ${keyframe.value}`}
                    />
                  ))}
                  
                  {/* Current time indicator */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500"
                    style={{ left: `${(project.currentTime / selectedElement.duration) * 100}%` }}
                  />
                </div>
              </div>

              {/* Property value at current time */}
              <div className="mt-2 text-sm text-gray-400">
                Current value: {String(getCurrentPropertyValue(property, project.currentTime))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    );
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (playbackTimer.current) {
        clearInterval(playbackTimer.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Advanced Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-yellow-400" />
              <div>
                <h1 className="text-lg font-semibold">{project.name}</h1>
                <p className="text-sm text-gray-400">
                  Motionity Integration PoC • {project.width}x{project.height} • {project.fps}fps
                </p>
              </div>
            </div>
            
            <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-300">
              <Zap className="mr-1 h-3 w-3" />
              Advanced Timeline
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Save className="mr-2 h-4 w-4" />
              Salvar
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Renderizar
            </Button>
          </div>
        </div>
      </div>

      <div className="flex h-screen pt-0">
        {/* Main Timeline Area */}
        <div className="flex-1 flex flex-col">
          {/* Enhanced Playback Controls */}
          <div className="bg-gray-800 border-b border-gray-700 p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={stopPlayback}>
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button
                  variant={project.isPlaying ? "default" : "outline"}
                  size="sm"
                  onClick={togglePlayback}
                  className={project.isPlaying ? "bg-green-600 hover:bg-green-700" : ""}
                >
                  {project.isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                <Button variant="outline" size="sm" onClick={() => seekTo(project.duration)}>
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex-1 max-w-md">
                <Slider
                  value={[project.currentTime]}
                  onValueChange={([value]) => seekTo(value)}
                  max={project.duration}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <div className="text-sm font-mono bg-gray-700 px-3 py-1 rounded">
                {project.currentTime.toFixed(1)}s / {project.duration}s
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm min-w-[50px] text-center">{Math.round(project.zoom * 100)}%</span>
                <Button variant="outline" size="sm">
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Tabs for different views */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'timeline' | 'keyframes' | 'properties')} className="flex-1 flex flex-col">
            <div className="bg-gray-800 border-b border-gray-700 px-4">
              <TabsList className="bg-gray-700">
                <TabsTrigger value="timeline" className="flex items-center gap-2">
                  <Film className="h-4 w-4" />
                  Timeline
                </TabsTrigger>
                <TabsTrigger value="keyframes" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Keyframes
                </TabsTrigger>
                <TabsTrigger value="properties" className="flex items-center gap-2">
                  <Sliders className="h-4 w-4" />
                  Properties
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="timeline" className="flex-1 m-0">
              {/* Advanced Timeline Canvas */}
              <div className="flex-1 bg-gray-900 relative overflow-auto" ref={timelineRef}>
                {/* Enhanced Time Ruler */}
                <div className="h-12 bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
                  <div className="relative h-full">
                    {Array.from({ length: Math.ceil(project.duration * project.zoom) + 1 }, (_, i) => (
                      <div
                        key={i}
                        className="absolute top-0 h-full border-l border-gray-600 text-xs text-gray-400 pl-1 flex flex-col justify-center"
                        style={{ left: `${(i / (project.duration * project.zoom)) * 1000}px` }}
                      >
                        <span>{(i / project.zoom).toFixed(1)}s</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Advanced Tracks */}
                <div className="relative min-h-96">
                  {project.tracks.map((track, trackIndex) => (
                    <div key={track.id} className="relative" style={{ height: `${track.height + 20}px` }}>
                      {/* Enhanced Track Header */}
                      <div 
                        className="bg-gray-800 border-b border-gray-700 flex items-center px-4 sticky left-0 z-20 w-64"
                        style={{ height: `${track.height + 20}px` }}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className="flex items-center gap-2">
                            {track.type === 'video' && <Film className="h-5 w-5 text-blue-400" />}
                            {track.type === 'audio' && <Music className="h-5 w-5 text-orange-400" />}
                            {track.type === 'overlay' && <Layers className="h-5 w-5 text-purple-400" />}
                            {track.type === 'effects' && <Sparkles className="h-5 w-5 text-yellow-400" />}
                            
                            <div>
                              <span className="text-sm font-medium">{track.name}</span>
                              <div className="text-xs text-gray-400">{track.elements.length} elementos</div>
                            </div>
                          </div>

                          <div className="ml-auto flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newTracks = [...project.tracks];
                                newTracks[trackIndex].visible = !newTracks[trackIndex].visible;
                                setProject(prev => ({ ...prev, tracks: newTracks }));
                              }}
                            >
                              {track.visible ? (
                                <Eye className="h-3 w-3" />
                              ) : (
                                <EyeOff className="h-3 w-3" />
                              )}
                            </Button>
                            
                            <Button variant="ghost" size="sm">
                              {track.locked ? (
                                <Lock className="h-3 w-3" />
                              ) : (
                                <Unlock className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Enhanced Track Lane with Grid */}
                      <div 
                        className="bg-gray-800/50 border-b border-gray-600/50 relative"
                        style={{ height: `${track.height + 20}px` }}
                      >
                        {/* Grid lines */}
                        <div className="absolute inset-0 opacity-20">
                          {Array.from({ length: Math.ceil(project.duration) + 1 }, (_, i) => (
                            <div
                              key={i}
                              className="absolute top-0 bottom-0 border-l border-gray-500"
                              style={{ left: `${(i / project.duration) * 1000 * project.zoom}px` }}
                            />
                          ))}
                        </div>
                        
                        {track.elements.map(element => renderAdvancedElement(element, trackIndex))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Enhanced Playhead */}
                <div
                  className="absolute top-12 bottom-0 w-0.5 bg-red-500 z-40 pointer-events-none"
                  style={{
                    left: `${(project.currentTime / project.duration) * 1000 * project.zoom}px`
                  }}
                >
                  <div className="w-4 h-4 bg-red-500 -ml-1.5 -mt-2 rounded-full border-2 border-white shadow-lg"></div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="keyframes" className="flex-1 m-0">
              {renderKeyframesView()}
            </TabsContent>

            <TabsContent value="properties" className="flex-1 m-0 p-4">
              <div className="text-center text-gray-400">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Advanced properties panel coming soon...</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Enhanced Properties Panel */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 p-4">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Propriedades Avançadas
          </h3>
          
          {project.selectedElements.length > 0 ? (
            <ScrollArea className="h-96">
              <div className="space-y-4">
                <Card className="bg-gray-700 border-gray-600">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Move className="h-4 w-4" />
                      Transform
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs">Position X</Label>
                      <Slider defaultValue={[0]} max={1920} step={1} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs">Position Y</Label>
                      <Slider defaultValue={[0]} max={1080} step={1} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs">Scale</Label>
                      <Slider defaultValue={[100]} max={300} step={1} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs">Rotation</Label>
                      <Slider defaultValue={[0]} max={360} step={1} className="mt-1" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-700 border-gray-600">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      Appearance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs">Opacity</Label>
                      <Slider defaultValue={[100]} max={100} step={1} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs">Blur</Label>
                      <Slider defaultValue={[0]} max={50} step={1} className="mt-1" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-700 border-gray-600">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Animation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs">Easing</Label>
                      <Select defaultValue="ease-out">
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(EASING_FUNCTIONS).map(easing => (
                            <SelectItem key={easing} value={easing}>
                              {easing}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button className="w-full" variant="outline">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Keyframe
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center text-gray-400">
              <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Selecione elementos para editar propriedades avançadas</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}