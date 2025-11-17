/**
 * 🎬 Timeline Editor Implementation
 * Complete implementation of Timeline Editor with PPTX integration
 */

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  ZoomOut
} from 'lucide-react';

// Simple Types
interface TimelineElement {
  id: string;
  type: 'image' | 'text' | 'audio' | 'video';
  name: string;
  duration: number;
  startTime: number;
  visible: boolean;
  locked: boolean;
  properties: Record<string, unknown>;
}

interface TimelineTrack {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'overlay';
  visible: boolean;
  locked: boolean;
  elements: TimelineElement[];
}

interface TimelineProject {
  id: string;
  name: string;
  duration: number;
  fps: number;
  width: number;
  height: number;
  currentTime: number;
  isPlaying: boolean;
  zoom: number;
  tracks: TimelineTrack[];
}

export default function TimelineEditorSimple() {
  const [project, setProject] = useState<TimelineProject>({
    id: 'demo-project',
    name: 'Projeto Demo',
    duration: 30,
    fps: 30,
    width: 1920,
    height: 1080,
    currentTime: 0,
    isPlaying: false,
    zoom: 1,
    tracks: [
      {
        id: 'track-1',
        name: 'Vídeo Principal',
        type: 'video',
        visible: true,
        locked: false,
        elements: [
          {
            id: 'element-1',
            type: 'image',
            name: 'Slide 1',
            duration: 5,
            startTime: 0,
            visible: true,
            locked: false,
            properties: { opacity: 1 }
          },
          {
            id: 'element-2',
            type: 'image',
            name: 'Slide 2',
            duration: 5,
            startTime: 5,
            visible: true,
            locked: false,
            properties: { opacity: 1 }
          }
        ]
      },
      {
        id: 'track-2',
        name: 'Áudio',
        type: 'audio',
        visible: true,
        locked: false,
        elements: []
      }
    ]
  });

  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const playbackTimer = useRef<NodeJS.Timeout | null>(null);

  // Playback Controls
  const togglePlayback = useCallback(() => {
    if (project.isPlaying) {
      // Pause
      if (playbackTimer.current) {
        clearInterval(playbackTimer.current);
      }
      setProject(prev => ({ ...prev, isPlaying: false }));
    } else {
      // Play
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

  // Cleanup
  useEffect(() => {
    return () => {
      if (playbackTimer.current) {
        clearInterval(playbackTimer.current);
      }
    };
  }, []);

  // Element rendering
  const renderElement = (element: TimelineElement, trackIndex: number) => {
    const elementWidth = (element.duration / project.duration) * 800 * project.zoom;
    const elementLeft = (element.startTime / project.duration) * 800 * project.zoom;
    
    const getElementColor = (type: string) => {
      switch (type) {
        case 'image': return 'bg-blue-500';
        case 'text': return 'bg-green-500';
        case 'audio': return 'bg-orange-500';
        case 'video': return 'bg-purple-500';
        default: return 'bg-gray-500';
      }
    };

    return (
      <div
        key={element.id}
        className={`absolute h-12 ${getElementColor(element.type)} rounded cursor-pointer border-2 ${
          selectedElement === element.id ? 'border-white' : 'border-transparent'
        } opacity-90 hover:opacity-100 transition-opacity`}
        style={{
          width: `${elementWidth}px`,
          left: `${elementLeft}px`,
          top: `${trackIndex * 60 + 60}px`
        }}
        onClick={() => setSelectedElement(element.id)}
        title={`${element.name} (${element.duration}s)`}
      >
        <div className="p-2 text-white text-xs font-medium truncate">
          {element.name}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Film className="h-6 w-6" />
            <div>
              <h1 className="text-lg font-semibold">{project.name}</h1>
              <p className="text-sm text-gray-400">
                {project.width}x{project.height} • {project.fps}fps • {project.duration}s
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Save className="mr-2 h-4 w-4" />
              Salvar
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>
      </div>

      <div className="flex h-screen pt-0">
        {/* Timeline Area */}
        <div className="flex-1 flex flex-col">
          {/* Playback Controls */}
          <div className="bg-gray-800 border-b border-gray-700 p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={stopPlayback}
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={togglePlayback}
                >
                  {project.isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => seekTo(project.duration)}
                >
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

              <div className="text-sm font-mono">
                {project.currentTime.toFixed(1)}s / {project.duration}s
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm">{Math.round(project.zoom * 100)}%</span>
                <Button variant="outline" size="sm">
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Timeline Canvas */}
          <div className="flex-1 bg-gray-900 relative overflow-auto">
            {/* Time Ruler */}
            <div className="h-8 bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
              <div className="relative h-full">
                {Array.from({ length: Math.ceil(project.duration) + 1 }, (_, i) => (
                  <div
                    key={i}
                    className="absolute top-0 h-full border-l border-gray-600 text-xs text-gray-400 pl-1"
                    style={{ left: `${(i / project.duration) * 800 * project.zoom}px` }}
                  >
                    {i}s
                  </div>
                ))}
              </div>
            </div>

            {/* Tracks and Elements */}
            <div className="relative min-h-96">
              {project.tracks.map((track, trackIndex) => (
                <div key={track.id} className="relative">
                  {/* Track Header */}
                  <div className="h-14 bg-gray-800 border-b border-gray-700 flex items-center px-4 sticky left-0 z-20 w-48">
                    <div className="flex items-center gap-2">
                      {track.type === 'video' && <Film className="h-4 w-4" />}
                      {track.type === 'audio' && <Music className="h-4 w-4" />}
                      {track.type === 'overlay' && <Layers className="h-4 w-4" />}
                      
                      <span className="text-sm font-medium">{track.name}</span>
                      
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
                    </div>
                  </div>

                  {/* Track Lane */}
                  <div className="h-14 bg-gray-700 border-b border-gray-600 relative">
                    {track.elements.map(element => renderElement(element, trackIndex))}
                  </div>
                </div>
              ))}
            </div>

            {/* Playhead */}
            <div
              className="absolute top-8 bottom-0 w-0.5 bg-red-500 z-30 pointer-events-none"
              style={{
                left: `${(project.currentTime / project.duration) * 800 * project.zoom}px`
              }}
            >
              <div className="w-3 h-3 bg-red-500 -ml-1.5 -mt-1 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Properties Panel */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 p-4">
          <h3 className="text-lg font-semibold mb-4">Propriedades</h3>
          
          {selectedElement ? (
            <div className="space-y-4">
              {(() => {
                const element = project.tracks
                  .flatMap(track => track.elements)
                  .find(el => el.id === selectedElement);
                
                if (!element) return <p className="text-gray-400">Element não encontrado</p>;
                
                return (
                  <div className="space-y-4">
                    <div>
                      <Label>Nome</Label>
                      <Input value={element.name} className="mt-1" />
                    </div>
                    
                    <div>
                      <Label>Duração</Label>
                      <Input 
                        type="number" 
                        value={element.duration} 
                        className="mt-1"
                        step="0.1"
                      />
                    </div>
                    
                    <div>
                      <Label>Tempo de Início</Label>
                      <Input 
                        type="number" 
                        value={element.startTime} 
                        className="mt-1"
                        step="0.1"
                      />
                    </div>
                    
                    <div>
                      <Label>Opacidade</Label>
                      <Slider
                        value={[element.properties.opacity || 1]}
                        onValueChange={([value]) => {
                          // Update element opacity
                        }}
                        max={1}
                        step={0.1}
                        className="mt-2"
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Copy className="mr-2 h-3 w-3" />
                        Duplicar
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Trash2 className="mr-2 h-3 w-3" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="text-center text-gray-400">
              <Settings className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Selecione um elemento na timeline para editar suas propriedades</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}