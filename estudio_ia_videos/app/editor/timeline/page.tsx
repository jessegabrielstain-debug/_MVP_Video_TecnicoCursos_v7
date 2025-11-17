'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// UI Components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';

// Icons
import {
  ArrowLeft, Save, Download, Play, Pause, Square, SkipBack, SkipForward,
  ZoomIn, ZoomOut, Scissors, Copy, Trash2, Magnet, Minimize, Maximize,
  Video, Mic, Type, ImageIcon, FileVideo, Sparkles, Eye, EyeOff, Lock, Unlock,
  Target, Clock, Clapperboard, Loader2, AlertTriangle
} from 'lucide-react';

// Hooks
import { useTimelineRender } from '@/hooks/use-remotion-render';
import { useEditorStore } from '@/lib/stores/editor-store'; // Import the new store

interface TimelineTrack {
  id: string;
  type: 'video' | 'audio' | 'text' | 'image' | 'effect' | 'pptx' | '3d';
  name: string;
  color: string;
  items: TimelineItem[];
  visible: boolean;
  locked: boolean;
  muted?: boolean;
  volume?: number;
  height?: number;
  collapsed?: boolean;
}

interface TimelineItem {
  id: string;
  start: number;
  duration: number;
  content: string;
  properties?: Record<string, unknown>;
  selected?: boolean;
  keyframes?: Keyframe[];
  effects?: Effect[];
  locked?: boolean;
  thumbnail?: string;
}

interface Keyframe {
  id: string;
  time: number;
  properties: Record<string, unknown>;
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'cubic-bezier';
}

interface Effect {
  id: string;
  type: 'fade' | 'slide' | 'zoom' | 'rotate' | 'blur' | 'color';
  parameters: Record<string, unknown>;
  enabled: boolean;
}

interface TimelineState {
  currentTime: number;
  duration: number;
  playing: boolean;
  zoom: number;
  tracks: TimelineTrack[];
  selectedItems: string[];
  playbackSpeed: number;
  snapToGrid: boolean;
  gridSize: number;
  previewQuality: 'low' | 'medium' | 'high';
}

// Constants
const TRACK_HEIGHT = 80;
const PIXELS_PER_SECOND = 50;
const MAX_ZOOM = 10;
const MIN_ZOOM = 0.1;
const GRID_SNAP_THRESHOLD = 5;

// Timeline Item Component
const TimelineItemComponent: React.FC<{
  item: TimelineItem;
  track: TimelineTrack;
  zoom: number;
  onSelect: (id: string, multi: boolean) => void;
  selected: boolean;
}> = ({ item, track, zoom, onSelect, selected }) => {
  const width = item.duration * PIXELS_PER_SECOND * zoom;
  const left = item.start * PIXELS_PER_SECOND * zoom;

  const getItemIcon = () => {
    switch (track.type) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'audio': return <Waveform className="w-4 h-4" />;
      case 'text': return <Type className="w-4 h-4" />;
      case 'image': return <ImageIcon className="w-4 h-4" />;
      case 'pptx': return <FileVideo className="w-4 h-4" />;
      case '3d': return <Sparkles className="w-4 h-4" />;
      default: return <Video className="w-4 h-4" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'absolute top-2 h-16 rounded-lg border-2 cursor-pointer transition-all',
        'flex items-center px-3 text-white text-sm font-medium',
        selected ? 'border-white shadow-lg' : 'border-transparent',
        'hover:shadow-md'
      )}
      style={{
        left: `${left}px`,
        width: `${Math.max(width, 60)}px`,
        backgroundColor: track.color,
      }}
      onClick={(e) => onSelect(item.id, e.ctrlKey || e.metaKey)}
    >
      <div className="flex items-center gap-2 truncate">
        {getItemIcon()}
        <span className="truncate">{item.content}</span>
      </div>
      
      {/* Resize handles */}
      <div className="absolute left-0 top-0 w-2 h-full cursor-ew-resize bg-white/20 opacity-0 hover:opacity-100 transition-opacity" />
      <div className="absolute right-0 top-0 w-2 h-full cursor-ew-resize bg-white/20 opacity-0 hover:opacity-100 transition-opacity" />
    </motion.div>
  );
};

// Track Component
const TrackComponent: React.FC<{
  track: TimelineTrack;
  zoom: number;
  duration: number;
  selectedItems: string[];
  onSelectItem: (id: string, multi: boolean) => void;
  onToggleVisibility: (trackId: string) => void;
  onToggleLock: (trackId: string) => void;
}> = ({ track, zoom, duration, selectedItems, onSelectItem, onToggleVisibility, onToggleLock }) => {
  const trackWidth = duration * PIXELS_PER_SECOND * zoom;

  return (
    <div className="flex border-b border-gray-200">
      {/* Track Header */}
      <div className="w-64 bg-gray-50 border-r border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div 
            className="w-4 h-4 rounded"
            style={{ backgroundColor: track.color }}
          />
          <div>
            <h4 className="font-medium text-sm">{track.name}</h4>
            <p className="text-xs text-gray-500">{track.type.toUpperCase()}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleVisibility(track.id)}
            className="p-1"
          >
            {track.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleLock(track.id)}
            className="p-1"
          >
            {track.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Track Content */}
      <div 
        className="relative bg-white"
        style={{ 
          height: `${track.height}px`,
          minWidth: `${Math.max(trackWidth, 800)}px`
        }}
      >
        {/* Grid lines */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: Math.ceil(duration) }).map((_, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 w-px bg-gray-200"
              style={{ left: `${i * PIXELS_PER_SECOND * zoom}px` }}
            />
          ))}
        </div>

        {/* Track items */}
        {track.items.map((item) => (
          <TimelineItemComponent
            key={item.id}
            item={item}
            track={track}
            zoom={zoom}
            onSelect={onSelectItem}
            selected={selectedItems.includes(item.id)}
          />
        ))}
      </div>
    </div>
  );
};

// Playhead Component
const Playhead: React.FC<{
  currentTime: number;
  zoom: number;
  duration: number;
  onSeek: (time: number) => void;
}> = ({ currentTime, zoom, duration, onSeek }) => {
  const position = currentTime * PIXELS_PER_SECOND * zoom;

  return (
    <div
      className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 cursor-pointer"
      style={{ left: `${position + 256}px` }}
    >
      <div className="absolute -top-2 -left-2 w-4 h-4 bg-red-500 rounded-full" />
    </div>
  );
};

export default function TimelineEditor() {
  // Replace local state with Zustand store
  const { 
    slides, 
    generateTTS, 
    setSlides, // Assuming you add this to your store to initialize it
  } = useEditorStore();

  // Local UI state can remain
  const [timelineState, setTimelineState] = useState<Omit<TimelineState, 'tracks'>>({
    currentTime: 0,
    duration: 120, // This should probably be calculated from slides
    playing: false,
    zoom: 1,
    selectedItems: [],
    playbackSpeed: 1,
    snapToGrid: true,
    gridSize: 1,
    previewQuality: 'medium'
  });

  // Adapt slides from store to tracks format
  const tracks = slides.map(slide => ({
    id: `track-${slide.id}`,
    type: 'pptx' as const, // Or determine from slide data
    name: slide.title || `Slide ${slide.order_index}`,
    color: '#8b5cf6',
    visible: true,
    locked: false,
    height: TRACK_HEIGHT,
    items: [{
      id: slide.id,
      start: (slide.order_index || 0) * 10, // Example: 10 seconds per slide
      duration: slide.duration || 10,
      content: slide.content || '',
      properties: { ...slide.visualSettings, ttsState: slide.ttsState, audioUrl: slide.audioUrl },
      thumbnail: slide.visualSettings.backgroundImageUrl || '/api/placeholder/120/60'
    }]
  }));
  
  const [showPreview, setShowPreview] = useState(true);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Remotion rendering hook
  const { renderVideo, isRendering, progress, result, error, reset } = useTimelineRender();

  // Initialize store with some data if it's empty
  useEffect(() => {
    if (useEditorStore.getState().slides.length === 0) {
      // This is where you would fetch initial project data
      // For now, we can use a simplified version of the old mock data
      const initialSlides = [
        { id: 'item-1', order_index: 0, title: 'Intro Slide', content: 'Bem-vindo ao nosso vídeo de treinamento.', duration: 10, ttsState: 'idle', visualSettings: {} },
        { id: 'item-2', order_index: 1, title: 'Conteúdo Principal', content: 'Nesta seção, vamos cobrir os pontos mais importantes.', duration: 15, ttsState: 'idle', visualSettings: {} },
        { id: 'item-3', order_index: 2, title: 'Conclusão', content: 'Obrigado por assistir.', duration: 5, ttsState: 'idle', visualSettings: {} },
      ];
      // @ts-ignore
      setSlides(initialSlides); 
    }
  }, [setSlides]);


  // Handle video rendering
  const handleRenderVideo = useCallback(async () => {
    try {
      const projectData = {
        id: 'timeline-project-1',
        name: 'Treinamento NR-35',
        duration: timelineState.duration,
        fps: 30,
        width: 1920,
        height: 1080,
        tracks: tracks.map(track => ({ // Use the derived tracks
          id: track.id,
          type: track.type,
          name: track.name,
          visible: track.visible,
          locked: track.locked,
          elements: track.items.map(item => ({
            id: item.id,
            type: track.type,
            start: item.start,
            duration: item.duration,
            content: item.content,
            properties: {}
          }))
        }))
      };

      toast.info('Iniciando renderização do vídeo...');
      await renderVideo(projectData);
      
      if (result) {
        toast.success('Vídeo renderizado com sucesso!');
      }
    } catch (err) {
      console.error('Erro na renderização:', err);
      toast.error('Erro ao renderizar vídeo');
    }
  }, [timelineState, renderVideo, result, tracks]); // Add tracks to dependency array

  // Playback controls
  const handlePlay = useCallback(() => {
    setTimelineState(prev => ({ ...prev, playing: !prev.playing }));
    if (!timelineState.playing) {
      toast.success('Reprodução iniciada');
    } else {
      toast.info('Reprodução pausada');
    }
  }, [timelineState.playing]);

  const handleStop = useCallback(() => {
    setTimelineState(prev => ({ ...prev, playing: false, currentTime: 0 }));
    toast.info('Reprodução parada');
  }, []);

  const handleSeek = useCallback((time: number) => {
    setTimelineState(prev => ({ ...prev, currentTime: Math.max(0, Math.min(time, prev.duration)) }));
  }, []);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setTimelineState(prev => ({ 
      ...prev, 
      zoom: Math.min(prev.zoom * 1.5, MAX_ZOOM) 
    }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setTimelineState(prev => ({ 
      ...prev, 
      zoom: Math.max(prev.zoom / 1.5, MIN_ZOOM) 
    }));
  }, []);

  // Track controls (These might need to be adapted to modify the store's state)
  const handleToggleTrackVisibility = useCallback((trackId: string) => {
    // This logic will need to be moved to the store
    console.log("Toggling visibility for", trackId);
  }, []);

  const handleToggleTrackLock = useCallback((trackId: string) => {
    // This logic will need to be moved to the store
    console.log("Toggling lock for", trackId);
  }, []);

  // Item selection
  const handleSelectItem = useCallback((itemId: string, multi: boolean) => {
    setTimelineState(prev => ({
      ...prev,
      selectedItems: multi 
        ? prev.selectedItems.includes(itemId)
          ? prev.selectedItems.filter(id => id !== itemId)
          : [...prev.selectedItems, itemId]
        : [itemId]
    }));
  }, []);

  // Add new track (This will now add a new slide to the store)
  const handleAddTrack = useCallback((type: TimelineTrack['type']) => {
    // This logic will need to be moved to the store
    console.log("Adding new track of type", type);
    toast.success(`Função de adicionar slide pendente.`);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          handlePlay();
          break;
        case 'Escape':
          handleStop();
          break;
        case 'Delete':
        case 'Backspace':
          if (timelineState.selectedItems.length > 0) {
            // Delete selected items
            toast.info('Itens selecionados removidos');
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePlay, handleStop, timelineState.selectedItems]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-screen bg-gray-900 text-white flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/editor">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <h1 className="text-xl font-bold">Timeline Editor Profissional</h1>
              <Badge variant="secondary">Projeto: Treinamento NR-35</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRenderVideo}
                disabled={isRendering}
              >
                <Clapperboard className="w-4 h-4 mr-2" />
                {isRendering ? `Renderizando... ${Math.round(progress)}%` : 'Renderizar'}
              </Button>
              <Button size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Tools */}
          <div className="w-64 bg-gray-800 border-r border-gray-700 p-4">
            <Tabs defaultValue="media" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="media">Mídia</TabsTrigger>
                <TabsTrigger value="effects">Efeitos</TabsTrigger>
                <TabsTrigger value="text">Texto</TabsTrigger>
              </TabsList>

              <TabsContent value="media" className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Adicionar Track</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleAddTrack('video')}
                    >
                      <Video className="w-4 h-4 mr-1" />
                      Vídeo
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleAddTrack('audio')}
                    >
                      <Mic className="w-4 h-4 mr-1" />
                      Áudio
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleAddTrack('text')}
                    >
                      <Type className="w-4 h-4 mr-1" />
                      Texto
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleAddTrack('pptx')}
                    >
                      <FileVideo className="w-4 h-4 mr-1" />
                      PPTX
                    </Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-medium">Biblioteca de Mídia</Label>
                  <ScrollArea className="h-64 mt-2">
                    <div className="space-y-2">
                      {['video1.mp4', 'audio1.wav', 'slide1.pptx'].map((file) => (
                        <div
                          key={file}
                          className="p-2 bg-gray-700 rounded cursor-pointer hover:bg-gray-600 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Video className="w-4 h-4" />
                            <span className="text-sm truncate">{file}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </TabsContent>

              <TabsContent value="effects" className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Transições</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Button variant="outline" size="sm">Fade</Button>
                    <Button variant="outline" size="sm">Slide</Button>
                    <Button variant="outline" size="sm">Zoom</Button>
                    <Button variant="outline" size="sm">Rotate</Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="text" className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Estilos de Texto</Label>
                  <div className="space-y-2 mt-2">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      Título Principal
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      Subtítulo
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      Legenda
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Preview Area */}
            {showPreview && (
              <div className="h-64 bg-black border-b border-gray-700 flex items-center justify-center">
                <div className="text-center">
                  <Play className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-400">Preview do Vídeo</p>
                  <p className="text-sm text-gray-500">
                    {Math.floor(timelineState.currentTime / 60)}:
                    {(timelineState.currentTime % 60).toFixed(0).padStart(2, '0')} / 
                    {Math.floor(timelineState.duration / 60)}:
                    {(timelineState.duration % 60).toFixed(0).padStart(2, '0')}
                  </p>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="bg-gray-800 border-b border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Playback Controls */}
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={handleStop}>
                      <Square className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <SkipBack className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handlePlay}>
                      {timelineState.playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <SkipForward className="w-4 h-4" />
                    </Button>
                  </div>

                  <Separator orientation="vertical" className="h-6" />

                  {/* Zoom Controls */}
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={handleZoomOut}>
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <span className="text-sm w-12 text-center">
                      {Math.round(timelineState.zoom * 100)}%
                    </span>
                    <Button variant="ghost" size="sm" onClick={handleZoomIn}>
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                  </div>

                  <Separator orientation="vertical" className="h-6" />

                  {/* Tools */}
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Scissors className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Snap to Grid */}
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={timelineState.snapToGrid}
                      onCheckedChange={(checked) =>
                        setTimelineState(prev => ({ ...prev, snapToGrid: checked }))
                      }
                    />
                    <Label className="text-sm">
                      <Magnet className="w-4 h-4 inline mr-1" />
                      Snap
                    </Label>
                  </div>

                  {/* Preview Toggle */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    {showPreview ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="flex-1 overflow-auto bg-gray-100" ref={timelineRef}>
              {/* Time Ruler */}
              <div className="sticky top-0 z-20 bg-gray-200 border-b border-gray-300">
                <div className="flex">
                  <div className="w-64 bg-gray-300 border-r border-gray-400 p-2">
                    <span className="text-sm font-medium text-gray-700">Timeline</span>
                  </div>
                  <div className="relative flex-1">
                    {Array.from({ length: Math.ceil(timelineState.duration) }).map((_, i) => (
                      <div
                        key={i}
                        className="absolute top-0 bottom-0 flex flex-col justify-between py-1"
                        style={{ left: `${i * PIXELS_PER_SECOND * timelineState.zoom}px` }}
                      >
                        <div className="text-xs text-gray-600">
                          {Math.floor(i / 60)}:{(i % 60).toString().padStart(2, '0')}
                        </div>
                        <div className="w-px h-2 bg-gray-400" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tracks */}
              <div className="relative">
                <Playhead
                  currentTime={timelineState.currentTime}
                  zoom={timelineState.zoom}
                  duration={timelineState.duration}
                  onSeek={handleSeek}
                />
                
                {tracks.map((track) => (
                  <TrackComponent
                    key={track.id}
                    track={track}
                    zoom={timelineState.zoom}
                    duration={timelineState.duration}
                    selectedItems={timelineState.selectedItems}
                    onSelectItem={handleSelectItem}
                    onToggleVisibility={handleToggleTrackVisibility}
                    onToggleLock={handleToggleTrackLock}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Properties */}
          <div className="w-80 bg-gray-800 border-l border-gray-700 p-4">
            <Tabs defaultValue="properties" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="properties">Propriedades</TabsTrigger>
                <TabsTrigger value="keyframes">Keyframes</TabsTrigger>
                <TabsTrigger value="render">Renderização</TabsTrigger>
              </TabsList>

              <TabsContent value="properties" className="space-y-4">
                {timelineState.selectedItems.length > 0 ? (
                  <div>
                    <Label className="text-sm font-medium">Item Selecionado</Label>
                    <div className="space-y-3 mt-2">
                      {(() => {
                        const selectedId = timelineState.selectedItems[0];
                        const selectedSlide = slides.find(s => s.id === selectedId);
                        if (!selectedSlide) return null;

                        return (
                          <>
                            <div>
                              <Label className="text-xs">Posição</Label>
                              <Input type="number" defaultValue={selectedSlide.order_index * 10} placeholder="0" className="mt-1" />
                            </div>
                            <div>
                              <Label className="text-xs">Duração</Label>
                              <Input type="number" defaultValue={selectedSlide.duration} placeholder="10" className="mt-1" />
                            </div>
                            <div>
                              <Label className="text-xs">Opacidade</Label>
                              <Slider defaultValue={[100]} max={100} step={1} className="mt-1" />
                            </div>
                            <div>
                              <Label className="text-xs">Volume</Label>
                              <Slider defaultValue={[80]} max={100} step={1} className="mt-1" />
                            </div>
                            <Separator />
                            <div>
                              <Label className="text-sm font-medium">Narração (TTS)</Label>
                              <div className="flex items-center gap-2 mt-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => generateTTS(selectedSlide.id, selectedSlide.content)}
                                  disabled={selectedSlide.ttsState === 'generating'}
                                >
                                  {selectedSlide.ttsState === 'generating' ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  ) : (
                                    <Mic className="w-4 h-4 mr-2" />
                                  )}
                                  Gerar Áudio
                                </Button>
                                {selectedSlide.ttsState === 'success' && selectedSlide.audioUrl && (
                                  <Button size="sm" variant="ghost" onClick={() => new Audio(selectedSlide.audioUrl).play()}>
                                    <Play className="w-4 h-4" />
                                  </Button>
                                )}
                                {selectedSlide.ttsState === 'error' && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <AlertTriangle className="w-4 h-4 text-red-500" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Erro ao gerar áudio.</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-400">
                      Selecione um item para editar propriedades
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="keyframes" className="space-y-4">
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-400">
                    Sistema de keyframes em desenvolvimento
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="render" className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Status da Renderização</Label>
                  <div className="space-y-3 mt-2">
                    {isRendering && (
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Progresso</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    )}
                    
                    {result && (
                      <div className="p-3 bg-green-900/20 border border-green-700 rounded">
                        <p className="text-sm text-green-400 mb-2">✅ Renderização concluída!</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => window.open(result.outputPath, '_blank')}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Baixar Vídeo
                        </Button>
                      </div>
                    )}
                    
                    {error && (
                      <div className="p-3 bg-red-900/20 border border-red-700 rounded">
                        <p className="text-sm text-red-400 mb-2">❌ Erro na renderização</p>
                        <p className="text-xs text-red-300">{error}</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full mt-2"
                          onClick={reset}
                        >
                          Tentar Novamente
                        </Button>
                      </div>
                    )}
                    
                    {!isRendering && !result && !error && (
                      <div className="text-center py-8">
                        <Clapperboard className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-400 mb-3">
                          Clique em "Renderizar" para gerar o vídeo
                        </p>
                        <Button 
                          onClick={handleRenderVideo}
                          className="w-full"
                        >
                          <Clapperboard className="w-4 h-4 mr-2" />
                          Iniciar Renderização
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </DndProvider>
  );
}