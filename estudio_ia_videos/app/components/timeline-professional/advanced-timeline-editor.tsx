
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { 
  Play, 
  Pause, 
  Square, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  Layers,
  Sparkles,
  Zap,
  Clock,
  Download,
  Upload,
  Settings,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Copy,
  Scissors,
  RotateCcw,
  RotateCw,
  MousePointer,
  Move3D,
  Palette,
  Radio as Waveform
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Tipos para o Timeline Profissional
interface TimelineElement {
  id: string;
  type: 'video' | 'audio' | 'image' | 'text' | 'effect' | 'transition';
  name: string;
  startTime: number;
  duration: number;
  layer: number;
  locked: boolean;
  visible: boolean;
  opacity: number;
  color: string;
  keyframes?: Keyframe[];
}

interface Keyframe {
  id: string;
  time: number;
  property: string;
  value: number | string;
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce';
}

interface TimelineTrack {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'overlay' | 'effects';
  height: number;
  visible: boolean;
  locked: boolean;
  solo: boolean;
  muted: boolean;
  elements: TimelineElement[];
}

export default function AdvancedTimelineEditor() {
  // Estados principais
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(300); // 5 minutos padrão
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [dragState, setDragState] = useState<unknown>(null);

  // Timeline Tracks
  const [tracks, setTracks] = useState<TimelineTrack[]>([
    {
      id: 'video1',
      name: 'Video Principal',
      type: 'video',
      height: 60,
      visible: true,
      locked: false,
      solo: false,
      muted: false,
      elements: [
        {
          id: 'vid1',
          type: 'video',
          name: 'Slide 1: Introdução NR-12',
          startTime: 0,
          duration: 45,
          layer: 1,
          locked: false,
          visible: true,
          opacity: 100,
          color: '#3b82f6',
          keyframes: [
            { id: 'kf1', time: 0, property: 'scale', value: 1.0, easing: 'ease-in-out' },
            { id: 'kf2', time: 10, property: 'scale', value: 1.1, easing: 'ease-in-out' },
            { id: 'kf3', time: 45, property: 'scale', value: 1.0, easing: 'ease-in-out' }
          ]
        },
        {
          id: 'vid2',
          type: 'video',
          name: 'Slide 2: Equipamentos',
          startTime: 45,
          duration: 60,
          layer: 1,
          locked: false,
          visible: true,
          opacity: 100,
          color: '#10b981',
          keyframes: []
        }
      ]
    },
    {
      id: 'audio1',
      name: 'Narração Principal',
      type: 'audio',
      height: 50,
      visible: true,
      locked: false,
      solo: false,
      muted: false,
      elements: [
        {
          id: 'aud1',
          type: 'audio',
          name: 'Narração PT-BR (ElevenLabs)',
          startTime: 2,
          duration: 98,
          layer: 1,
          locked: false,
          visible: true,
          opacity: 100,
          color: '#f59e0b',
          keyframes: [
            { id: 'akf1', time: 0, property: 'volume', value: 0, easing: 'ease-in' },
            { id: 'akf2', time: 3, property: 'volume', value: 0.8, easing: 'linear' },
            { id: 'akf3', time: 95, property: 'volume', value: 0.8, easing: 'linear' },
            { id: 'akf4', time: 98, property: 'volume', value: 0, easing: 'ease-out' }
          ]
        }
      ]
    },
    {
      id: 'overlay1',
      name: 'Elementos Overlay',
      type: 'overlay',
      height: 45,
      visible: true,
      locked: false,
      solo: false,
      muted: false,
      elements: [
        {
          id: 'ov1',
          type: 'text',
          name: 'Título: "Segurança em Máquinas"',
          startTime: 15,
          duration: 25,
          layer: 2,
          locked: false,
          visible: true,
          opacity: 90,
          color: '#8b5cf6',
          keyframes: [
            { id: 'okf1', time: 15, property: 'opacity', value: 0, easing: 'ease-in' },
            { id: 'okf2', time: 17, property: 'opacity', value: 1, easing: 'ease-out' },
            { id: 'okf3', time: 38, property: 'opacity', value: 1, easing: 'ease-in' },
            { id: 'okf4', time: 40, property: 'opacity', value: 0, easing: 'ease-out' }
          ]
        }
      ]
    },
    {
      id: 'effects1',
      name: 'Efeitos e Transições',
      type: 'effects',
      height: 40,
      visible: true,
      locked: false,
      solo: false,
      muted: false,
      elements: [
        {
          id: 'ef1',
          type: 'transition',
          name: 'Fade In/Out',
          startTime: 43,
          duration: 4,
          layer: 3,
          locked: false,
          visible: true,
          opacity: 100,
          color: '#ef4444',
          keyframes: []
        }
      ]
    }
  ]);

  // Refs para controle
  const timelineRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);

  // Função para converter tempo para posição X
  const timeToX = useCallback((time: number) => {
    return (time / totalDuration) * 800 * zoomLevel;
  }, [totalDuration, zoomLevel]);

  // Função para converter posição X para tempo
  const xToTime = useCallback((x: number) => {
    return (x / (800 * zoomLevel)) * totalDuration;
  }, [totalDuration, zoomLevel]);

  // Controles de reprodução
  const handlePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (time: number) => {
    setCurrentTime(Math.max(0, Math.min(totalDuration, time)));
  };

  // Auto-play simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && currentTime < totalDuration) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 0.1;
          if (newTime >= totalDuration) {
            setIsPlaying(false);
            return totalDuration;
          }
          return newTime;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentTime, totalDuration]);

  // Toggle track visibility
  const toggleTrackVisibility = (trackId: string) => {
    setTracks(prev => prev.map(track => 
      track.id === trackId ? { ...track, visible: !track.visible } : track
    ));
  };

  // Toggle track lock
  const toggleTrackLock = (trackId: string) => {
    setTracks(prev => prev.map(track => 
      track.id === trackId ? { ...track, locked: !track.locked } : track
    ));
  };

  // Smart IA Features
  const [aiOptimizations, setAiOptimizations] = useState({
    autoSync: true,
    smartCuts: true,
    motionSmoothing: true,
    audioBalance: true
  });

  const [aiAnalytics, setAiAnalytics] = useState({
    pacing: 8.7,
    engagement: 9.2,
    flow: 8.9,
    audioQuality: 9.5
  });

  // Render elemento da timeline
  const renderTimelineElement = (element: TimelineElement, trackId: string) => {
    const width = timeToX(element.duration);
    const left = timeToX(element.startTime);
    
    return (
      <motion.div
        key={element.id}
        className={`absolute h-full rounded cursor-pointer border-2 transition-all duration-200 ${
          selectedElements.includes(element.id) 
            ? 'border-white shadow-lg z-10' 
            : 'border-transparent hover:border-gray-300'
        }`}
        style={{
          left: `${left}px`,
          width: `${width}px`,
          backgroundColor: element.color + '90',
        }}
        onClick={() => {
          if (selectedElements.includes(element.id)) {
            setSelectedElements(prev => prev.filter(id => id !== element.id));
          } else {
            setSelectedElements(prev => [...prev, element.id]);
          }
        }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <div className="p-1 h-full flex flex-col justify-center">
          <div className="text-xs font-medium text-white truncate">
            {element.name}
          </div>
          <div className="text-xs text-gray-200 opacity-75">
            {element.duration}s
          </div>
        </div>
        
        {/* Keyframes indicators */}
        {element.keyframes?.map((kf, idx) => (
          <div
            key={kf.id}
            className="absolute top-0 w-1 h-full bg-yellow-400 opacity-80"
            style={{ left: `${timeToX(kf.time - element.startTime)}px` }}
          >
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-yellow-400 rounded-full"></div>
          </div>
        ))}
        
        {/* Element controls */}
        <div className="absolute top-1 right-1 flex space-x-1 opacity-0 hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="ghost"
            className="h-4 w-4 p-0 text-white hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              toggleElementVisibility(element.id);
            }}
          >
            {element.visible ? <Eye className="h-2 w-2" /> : <EyeOff className="h-2 w-2" />}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-4 w-4 p-0 text-white hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              toggleElementLock(element.id);
            }}
          >
            {element.locked ? <Lock className="h-2 w-2" /> : <Unlock className="h-2 w-2" />}
          </Button>
        </div>
      </motion.div>
    );
  };

  // Helper functions
  const toggleElementVisibility = (elementId: string) => {
    setTracks(prev => prev.map(track => ({
      ...track,
      elements: track.elements.map(el => 
        el.id === elementId ? { ...el, visible: !el.visible } : el
      )
    })));
  };

  const toggleElementLock = (elementId: string) => {
    setTracks(prev => prev.map(track => ({
      ...track,
      elements: track.elements.map(el => 
        el.id === elementId ? { ...el, locked: !el.locked } : el
      )
    })));
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Timeline Editor Profissional
            </h1>
            <p className="text-gray-400">
              Editor timeline multi-track com IA integrada e keyframes avançados
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
              <Sparkles className="mr-1 h-3 w-3" />
              IA Ativo
            </Badge>
            <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
              {tracks.reduce((acc, track) => acc + track.elements.length, 0)} Elementos
            </Badge>
            <Button variant="outline" size="sm">
              <Upload className="mr-2 h-4 w-4" />
              Importar
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>

        {/* IA Analytics Quick View */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Ritmo</p>
                  <p className="text-lg font-bold text-blue-400">{aiAnalytics.pacing}/10</p>
                </div>
                <Clock className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Engajamento</p>
                  <p className="text-lg font-bold text-green-400">{aiAnalytics.engagement}/10</p>
                </div>
                <Zap className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Fluxo</p>
                  <p className="text-lg font-bold text-purple-400">{aiAnalytics.flow}/10</p>
                </div>
                <Layers className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Áudio</p>
                  <p className="text-lg font-bold text-yellow-400">{aiAnalytics.audioQuality}/10</p>
                </div>
                <Waveform className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
        {/* Timeline Main Area */}
        <div className="col-span-9">
          <Card className="bg-gray-900 border-gray-800 h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Timeline Multi-Track</CardTitle>
                
                {/* Playback Controls */}
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSeek(currentTime - 10)}
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePlay}
                    className={isPlaying ? 'text-red-400' : 'text-green-400'}
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleStop}
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSeek(currentTime + 10)}
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>

                  {/* Time Display */}
                  <div className="text-sm font-mono px-3 py-1 bg-gray-800 rounded">
                    {Math.floor(currentTime / 60).toString().padStart(2, '0')}:{Math.floor(currentTime % 60).toString().padStart(2, '0')} / {Math.floor(totalDuration / 60).toString().padStart(2, '0')}:{Math.floor(totalDuration % 60).toString().padStart(2, '0')}
                  </div>
                </div>

                {/* Zoom Controls */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">Zoom:</span>
                  <Slider
                    value={[zoomLevel]}
                    onValueChange={([value]) => setZoomLevel(value)}
                    min={0.1}
                    max={5}
                    step={0.1}
                    className="w-20"
                  />
                  <span className="text-sm text-gray-400">{zoomLevel.toFixed(1)}x</span>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              <div className="relative" ref={timelineRef}>
                {/* Timeline Header */}
                <div className="h-8 bg-gray-800 border-b border-gray-700 relative">
                  {/* Time markers */}
                  {Array.from({ length: Math.ceil(totalDuration / 10) }, (_, i) => (
                    <div
                      key={i}
                      className="absolute top-0 h-full flex items-center"
                      style={{ left: `${timeToX(i * 10)}px` }}
                    >
                      <div className="text-xs text-gray-400 font-mono ml-1">
                        {Math.floor((i * 10) / 60).toString().padStart(2, '0')}:{((i * 10) % 60).toString().padStart(2, '0')}
                      </div>
                      <div className="w-px h-4 bg-gray-600 ml-12"></div>
                    </div>
                  ))}
                </div>

                {/* Tracks */}
                <ScrollArea className="h-[500px]">
                  {tracks.map((track, trackIndex) => (
                    <div key={track.id} className="border-b border-gray-800">
                      {/* Track Header */}
                      <div className="flex">
                        <div className="w-48 bg-gray-800 p-2 border-r border-gray-700 flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-sm">{track.name}</h4>
                            <p className="text-xs text-gray-400 capitalize">{track.type}</p>
                          </div>
                          
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-6 w-6 p-0 ${track.visible ? 'text-green-400' : 'text-gray-600'}`}
                              onClick={() => toggleTrackVisibility(track.id)}
                            >
                              {track.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-6 w-6 p-0 ${track.locked ? 'text-red-400' : 'text-gray-400'}`}
                              onClick={() => toggleTrackLock(track.id)}
                            >
                              {track.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                            </Button>
                          </div>
                        </div>

                        {/* Track Timeline */}
                        <div 
                          className="flex-1 relative bg-gray-900"
                          style={{ height: `${track.height}px` }}
                        >
                          {track.elements.map(element => renderTimelineElement(element, track.id))}
                        </div>
                      </div>
                    </div>
                  ))}
                </ScrollArea>

                {/* Playhead */}
                <div
                  ref={playheadRef}
                  className="absolute top-0 w-0.5 bg-red-500 z-20 pointer-events-none"
                  style={{ 
                    left: `${timeToX(currentTime) + 192}px`,
                    height: '100%'
                  }}
                >
                  <div className="absolute -top-1 -left-1 w-3 h-3 bg-red-500 rounded-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar - Properties & IA */}
        <div className="col-span-3 space-y-4">
          <Tabs defaultValue="properties" className="h-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="properties">Propriedades</TabsTrigger>
              <TabsTrigger value="keyframes">Keyframes</TabsTrigger>
              <TabsTrigger value="ai">IA Assist</TabsTrigger>
            </TabsList>

            <TabsContent value="properties">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-sm">Elemento Selecionado</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedElements.length > 0 ? (
                    <>
                      <div>
                        <label className="text-xs text-gray-400">Opacidade</label>
                        <Slider defaultValue={[100]} max={100} step={1} />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">Volume</label>
                        <Slider defaultValue={[80]} max={100} step={1} />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">Velocidade</label>
                        <Slider defaultValue={[100]} min={50} max={200} step={10} />
                      </div>
                      <Button size="sm" className="w-full">
                        <Palette className="mr-2 h-3 w-3" />
                        Alterar Cor
                      </Button>
                    </>
                  ) : (
                    <p className="text-sm text-gray-400">Selecione um elemento para editar</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="keyframes">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-sm">Sistema de Keyframes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button size="sm" className="w-full" variant="outline">
                    <Move3D className="mr-2 h-3 w-3" />
                    Adicionar Keyframe
                  </Button>
                  <Button size="sm" className="w-full" variant="outline">
                    <MousePointer className="mr-2 h-3 w-3" />
                    Auto-Keyframe
                  </Button>
                  <div className="space-y-2">
                    <p className="text-xs text-gray-400">Keyframes Ativos:</p>
                    <div className="text-xs bg-gray-800 p-2 rounded">
                      • 00:15 - Fade In<br/>
                      • 00:38 - Scale 110%<br/>
                      • 01:25 - Fade Out
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ai">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-sm">Assistente IA</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
                    <Sparkles className="mr-2 h-3 w-3" />
                    Auto-Sincronizar Áudio
                  </Button>
                  <Button size="sm" className="w-full bg-green-600 hover:bg-green-700">
                    <Zap className="mr-2 h-3 w-3" />
                    Otimizar Ritmo
                  </Button>
                  <Button size="sm" className="w-full bg-purple-600 hover:bg-purple-700">
                    <Layers className="mr-2 h-3 w-3" />
                    Gerar Transições
                  </Button>
                  
                  <div className="mt-4 space-y-2">
                    <h4 className="text-xs font-medium text-gray-400">Sugestões IA:</h4>
                    <div className="text-xs bg-gray-800 p-2 rounded">
                      🎯 Adicione uma pausa de 2s aos 45s<br/>
                      🔊 Volume do áudio pode ser 15% maior<br/>
                      ⚡ Transição suave recomendada
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <Progress 
          value={(currentTime / totalDuration) * 100} 
          className="h-2 bg-gray-800"
        />
      </div>
    </div>
  );
}
