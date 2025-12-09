
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  Scissors, 
  Copy, 
  Layers3,
  Settings,
  Zap,
  MoveHorizontal,
  Clock,
  BarChart,
  Camera,
  Mic,
  Type,
  Image as ImageIcon,
  MousePointer,
  Sparkles
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface TimelineTrack {
  id: string;
  type: 'video' | 'audio' | 'text' | 'image' | 'effect';
  name: string;
  duration: number;
  startTime: number;
  color: string;
  keyframes: TimelineKeyframe[];
  locked: boolean;
  muted: boolean;
  visible: boolean;
}

interface TimelineKeyframe {
  id: string;
  time: number;
  properties: {
    opacity?: number;
    scale?: number;
    x?: number;
    y?: number;
    rotation?: number;
    volume?: number;
  };
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

export default function TimelineMultiTrackEditor() {
  const [tracks, setTracks] = useState<TimelineTrack[]>([
    {
      id: 'track1',
      type: 'video',
      name: 'Avatar Principal NR-12',
      duration: 45,
      startTime: 0,
      color: '#3B82F6',
      keyframes: [
        { id: 'kf1', time: 0, properties: { opacity: 0, scale: 0.8 }, easing: 'ease-in' },
        { id: 'kf2', time: 2, properties: { opacity: 1, scale: 1 }, easing: 'ease-out' },
        { id: 'kf3', time: 43, properties: { opacity: 1, scale: 1 }, easing: 'linear' },
        { id: 'kf4', time: 45, properties: { opacity: 0, scale: 0.8 }, easing: 'ease-in' }
      ],
      locked: false,
      muted: false,
      visible: true
    },
    {
      id: 'track2',
      type: 'audio',
      name: 'Narração ElevenLabs - Português BR',
      duration: 42,
      startTime: 1,
      color: '#10B981',
      keyframes: [
        { id: 'kf5', time: 1, properties: { volume: 0 }, easing: 'ease-in' },
        { id: 'kf6', time: 3, properties: { volume: 85 }, easing: 'ease-out' },
        { id: 'kf7', time: 40, properties: { volume: 85 }, easing: 'linear' },
        { id: 'kf8', time: 42, properties: { volume: 0 }, easing: 'ease-in' }
      ],
      locked: false,
      muted: false,
      visible: true
    },
    {
      id: 'track3',
      type: 'text',
      name: 'Títulos NR - Segurança Máquinas',
      duration: 8,
      startTime: 5,
      color: '#F59E0B',
      keyframes: [
        { id: 'kf9', time: 5, properties: { opacity: 0, y: 50 }, easing: 'ease-out' },
        { id: 'kf10', time: 6, properties: { opacity: 1, y: 0 }, easing: 'ease-out' },
        { id: 'kf11', time: 11, properties: { opacity: 1, y: 0 }, easing: 'linear' },
        { id: 'kf12', time: 13, properties: { opacity: 0, y: -50 }, easing: 'ease-in' }
      ],
      locked: false,
      muted: false,
      visible: true
    },
    {
      id: 'track4',
      type: 'image',
      name: 'Background NR-12 Industrial',
      duration: 45,
      startTime: 0,
      color: '#8B5CF6',
      keyframes: [
        { id: 'kf13', time: 0, properties: { opacity: 0.7, scale: 1.1 }, easing: 'linear' },
        { id: 'kf14', time: 45, properties: { opacity: 0.7, scale: 1 }, easing: 'linear' }
      ],
      locked: false,
      muted: false,
      visible: true
    },
    {
      id: 'track5',
      type: 'effect',
      name: 'Efeitos de Transição Pro',
      duration: 3,
      startTime: 15,
      color: '#EF4444',
      keyframes: [
        { id: 'kf15', time: 15, properties: { opacity: 0 }, easing: 'ease-in' },
        { id: 'kf16', time: 16.5, properties: { opacity: 1 }, easing: 'ease-out' },
        { id: 'kf17', time: 18, properties: { opacity: 0 }, easing: 'ease-in' }
      ],
      locked: false,
      muted: false,
      visible: true
    }
  ]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(45);
  const [zoom, setZoom] = useState(10);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [selectedKeyframe, setSelectedKeyframe] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const timelineRef = useRef<HTMLDivElement>(null);
  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Playback Control
  const togglePlayback = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    } else {
      setIsPlaying(true);
      playbackIntervalRef.current = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= totalDuration) {
            setIsPlaying(false);
            if (playbackIntervalRef.current) {
              clearInterval(playbackIntervalRef.current);
            }
            return totalDuration;
          }
          return prev + 0.1;
        });
      }, 100);
    }
  };

  const resetPlayback = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
    }
  };

  // Track Management
  const addTrack = (type: TimelineTrack['type']) => {
    const colors = {
      video: '#3B82F6',
      audio: '#10B981',
      text: '#F59E0B',
      image: '#8B5CF6',
      effect: '#EF4444'
    };

    const newTrack: TimelineTrack = {
      id: `track_${Date.now()}`,
      type,
      name: `Nova ${type === 'video' ? 'Camada de Vídeo' : 
                  type === 'audio' ? 'Camada de Áudio' : 
                  type === 'text' ? 'Camada de Texto' : 
                  type === 'image' ? 'Camada de Imagem' : 'Camada de Efeito'}`,
      duration: 10,
      startTime: currentTime,
      color: colors[type],
      keyframes: [],
      locked: false,
      muted: false,
      visible: true
    };

    setTracks(prev => [...prev, newTrack]);
    toast.success(`${type === 'video' ? 'Camada de vídeo' : 
                    type === 'audio' ? 'Camada de áudio' : 
                    type === 'text' ? 'Camada de texto' : 
                    type === 'image' ? 'Camada de imagem' : 'Camada de efeito'} adicionada`);
  };

  // Keyframe Management
  const addKeyframe = (trackId: string) => {
    const newKeyframe: TimelineKeyframe = {
      id: `kf_${Date.now()}`,
      time: currentTime,
      properties: { opacity: 1, scale: 1, x: 0, y: 0, rotation: 0 },
      easing: 'ease-out'
    };

    setTracks(prev => prev.map(track => 
      track.id === trackId 
        ? { ...track, keyframes: [...track.keyframes, newKeyframe].sort((a, b) => a.time - b.time) }
        : track
    ));
    
    toast.success('Keyframe adicionado');
  };

  // Export Timeline
  const exportTimeline = async () => {
    setIsLoading(true);
    try {
      const timelineData = {
        tracks,
        duration: totalDuration,
        fps: 30,
        resolution: '1920x1080',
        exportFormat: 'mp4'
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Timeline exportada com sucesso!');
      logger.info('Timeline exported', { tracksCount: tracks.length, duration: totalDuration, component: 'TimelineMultiTrackEditor' });
    } catch (error) {
      toast.error('Erro ao exportar timeline');
    } finally {
      setIsLoading(false);
    }
  };

  const renderTrackIcon = (type: TimelineTrack['type']) => {
    switch (type) {
      case 'video': return <Camera className="w-4 h-4" />;
      case 'audio': return <Mic className="w-4 h-4" />;
      case 'text': return <Type className="w-4 h-4" />;
      case 'image': return <ImageIcon className="w-4 h-4" />;
      case 'effect': return <Sparkles className="w-4 h-4" />;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${mins}:${secs.padStart(4, '0')}`;
  };

  useEffect(() => {
    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Layers3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Timeline Multi-Track Editor
                  </h1>
                  <p className="text-sm text-muted-foreground">Editor profissional de timeline com keyframes</p>
                </div>
              </div>
              <Badge variant="secondary" className="ml-4">
                <Zap className="w-3 h-3 mr-1" />
                Pro V3
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-green-600 border-green-200">
                {tracks.length} Tracks
              </Badge>
              <Badge variant="outline" className="text-blue-600 border-blue-200">
                {tracks.reduce((acc, track) => acc + track.keyframes.length, 0)} Keyframes
              </Badge>
              <Button 
                onClick={exportTimeline} 
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                {isLoading ? 'Exportando...' : 'Exportar Timeline'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Timeline Controls */}
          <div className="lg:col-span-3">
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Controles de Reprodução
                  </CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{formatTime(currentTime)}</span>
                    <span>/</span>
                    <span>{formatTime(totalDuration)}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Playback Controls */}
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetPlayback}
                    >
                      <SkipBack className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={togglePlayback}
                      size="sm"
                      className={isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentTime(Math.min(currentTime + 5, totalDuration))}
                    >
                      <SkipForward className="w-4 h-4" />
                    </Button>

                    <div className="flex items-center gap-2 ml-6">
                      <Volume2 className="w-4 h-4" />
                      <Slider
                        value={[75]}
                        max={100}
                        step={1}
                        className="w-20"
                      />
                    </div>

                    <div className="flex items-center gap-2 ml-6">
                      <MoveHorizontal className="w-4 h-4" />
                      <span className="text-sm">Zoom:</span>
                      <Slider
                        value={[zoom]}
                        max={50}
                        min={1}
                        step={1}
                        className="w-20"
                        onValueChange={(value) => setZoom(value[0])}
                      />
                    </div>
                  </div>

                  {/* Timeline Scrubber */}
                  <div className="relative">
                    <Progress 
                      value={(currentTime / totalDuration) * 100} 
                      className="h-2 cursor-pointer"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const clickX = e.clientX - rect.left;
                        const percentage = clickX / rect.width;
                        setCurrentTime(percentage * totalDuration);
                      }}
                    />
                    <div 
                      className="absolute top-0 w-0.5 h-full bg-red-500 pointer-events-none"
                      style={{ left: `${(currentTime / totalDuration) * 100}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline Tracks */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Layers3 className="w-5 h-5" />
                    Timeline Multi-Track
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => addTrack('video')}>
                      <Camera className="w-4 h-4 mr-2" />
                      Vídeo
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => addTrack('audio')}>
                      <Mic className="w-4 h-4 mr-2" />
                      Áudio
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => addTrack('text')}>
                      <Type className="w-4 h-4 mr-2" />
                      Texto
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tracks.map((track, index) => (
                    <div 
                      key={track.id}
                      className={`border rounded-lg p-3 transition-all duration-200 ${
                        selectedTrack === track.id 
                          ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20' 
                          : 'border-border hover:border-blue-300'
                      }`}
                      onClick={() => setSelectedTrack(track.id)}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          {renderTrackIcon(track.type)}
                          <span className="font-medium text-sm">{track.name}</span>
                        </div>
                        <div className="flex items-center gap-1 ml-auto">
                          <Badge 
                            variant="secondary" 
                            style={{ backgroundColor: `${track.color}20`, color: track.color }}
                          >
                            {track.keyframes.length} keyframes
                          </Badge>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={(e) => {
                              e.stopPropagation();
                              addKeyframe(track.id);
                            }}
                          >
                            <MousePointer className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Track Timeline Visualization */}
                      <div className="relative h-8 bg-slate-100 dark:bg-slate-800 rounded-md overflow-hidden">
                        {/* Track Duration Bar */}
                        <div
                          className="absolute h-full rounded-md opacity-60"
                          style={{
                            backgroundColor: track.color,
                            left: `${(track.startTime / totalDuration) * 100}%`,
                            width: `${(track.duration / totalDuration) * 100}%`,
                          }}
                        />
                        
                        {/* Keyframes */}
                        {track.keyframes.map(keyframe => (
                          <div
                            key={keyframe.id}
                            className="absolute w-1 h-full bg-white border border-gray-400 cursor-pointer hover:bg-yellow-300 transition-colors"
                            style={{
                              left: `${(keyframe.time / totalDuration) * 100}%`,
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedKeyframe(keyframe.id);
                              setCurrentTime(keyframe.time);
                            }}
                            title={`Keyframe em ${formatTime(keyframe.time)}`}
                          />
                        ))}
                        
                        {/* Current Time Indicator */}
                        <div
                          className="absolute w-0.5 h-full bg-red-500 pointer-events-none z-10"
                          style={{ left: `${(currentTime / totalDuration) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Properties Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Propriedades
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="track" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="track">Track</TabsTrigger>
                    <TabsTrigger value="keyframe">Keyframe</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="track" className="space-y-4">
                    {selectedTrack ? (
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Nome</label>
                          <Input 
                            value={tracks.find(t => t.id === selectedTrack)?.name || ''}
                            onChange={(e) => {
                              setTracks(prev => prev.map(track => 
                                track.id === selectedTrack 
                                  ? { ...track, name: e.target.value }
                                  : track
                              ));
                            }}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Duração (s)</label>
                          <Input 
                            type="number"
                            value={tracks.find(t => t.id === selectedTrack)?.duration || 0}
                            onChange={(e) => {
                              setTracks(prev => prev.map(track => 
                                track.id === selectedTrack 
                                  ? { ...track, duration: parseFloat(e.target.value) }
                                  : track
                              ));
                            }}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Início (s)</label>
                          <Input 
                            type="number"
                            value={tracks.find(t => t.id === selectedTrack)?.startTime || 0}
                            onChange={(e) => {
                              setTracks(prev => prev.map(track => 
                                track.id === selectedTrack 
                                  ? { ...track, startTime: parseFloat(e.target.value) }
                                  : track
                              ));
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Selecione um track para editar</p>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="keyframe" className="space-y-4">
                    {selectedKeyframe ? (
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Opacidade</label>
                          <Slider
                            value={[75]}
                            max={100}
                            step={1}
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Escala</label>
                          <Slider
                            value={[100]}
                            max={200}
                            min={10}
                            step={1}
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Rotação</label>
                          <Slider
                            value={[0]}
                            max={360}
                            min={-360}
                            step={1}
                            className="mt-2"
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Selecione um keyframe para editar</p>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Timeline Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="w-5 h-5" />
                  Estatísticas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm">Total de Tracks:</span>
                  <Badge variant="secondary">{tracks.length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Keyframes:</span>
                  <Badge variant="secondary">{tracks.reduce((acc, track) => acc + track.keyframes.length, 0)}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Duração:</span>
                  <Badge variant="secondary">{formatTime(totalDuration)}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">FPS:</span>
                  <Badge variant="secondary">30 fps</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Resolução:</span>
                  <Badge variant="secondary">1920x1080</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
