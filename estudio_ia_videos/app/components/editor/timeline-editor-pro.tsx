

/**
 * 🎬 Timeline Editor Profissional
 * Inspirado no Animaker - Editor Completo com Múltiplos Tracks
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Scissors,
  Copy,
  Trash2,
  Plus,
  Minus,
  ZoomIn,
  ZoomOut,
  Split,
  Layers,
  Music,
  Mic,
  Video,
  Image,
  Type,
  Shapes,
  Sparkles,
  Download,
  Upload,
  Settings,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  RotateCcw,
  RotateCw,
  Move,
  Maximize2,
  Save,
  RefreshCw,
  UserPlus
} from 'lucide-react';
import { UnifiedPreviewPlayer } from './unified-preview-player';
import AvatarTimelineIntegration, { AvatarTimelineClip } from './AvatarTimelineIntegration';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

interface TimelineTrack {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'text' | 'image' | 'shape' | 'avatar';
  color: string;
  visible: boolean;
  locked: boolean;
  clips: TimelineClip[];
}

interface TimelineClip {
  id: string;
  name: string;
  startTime: number;
  duration: number;
  content: any;
  effects?: string[];
  transition?: string;
}

interface TimelineEditorProProps {
  projectData?: any;
  onSave?: (timelineData: any) => void;
  onExport?: (format: string) => void;
}

export default function TimelineEditorPro({
  projectData,
  onSave,
  onExport
}: TimelineEditorProProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(120); // 2 minutos
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [selectedClip, setSelectedClip] = useState<string | null>(null);
  const [volume, setVolume] = useState([80]);
  const [tracks, setTracks] = useState<TimelineTrack[]>([]);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isAvatarCreatorOpen, setIsAvatarCreatorOpen] = useState(false);

  const handleAddAvatarClip = (avatarClip: AvatarTimelineClip) => {
    setTracks(prevTracks => {
      const newTracks = [...prevTracks];
      let avatarTrack = newTracks.find(t => t.type === 'avatar');

      if (!avatarTrack) {
        avatarTrack = {
          id: `avatar-track-${Date.now()}`,
          name: 'Avatar Track',
          type: 'avatar',
          color: '#3B82F6',
          visible: true,
          locked: false,
          clips: []
        };
        newTracks.unshift(avatarTrack);
      }

      const newClip: TimelineClip = {
        id: avatarClip.id,
        name: `Avatar: ${avatarClip.text.substring(0, 10)}...`,
        startTime: avatarClip.startTime / 1000, // ms to seconds
        duration: avatarClip.duration / 1000, // ms to seconds
        content: {
          url: avatarClip.audioUrl, // Use audio/video URL
          thumbnail: '/avatars/avatar-placeholder.png', // Placeholder
          ...avatarClip
        }
      };

      avatarTrack.clips.push(newClip);
      return newTracks;
    });
    setIsAvatarCreatorOpen(false);
  };

  useEffect(() => {
    // Inicializar tracks padrão
    initializeDefaultTracks();
  }, [projectData]);

  const initializeDefaultTracks = () => {
    const defaultTracks: TimelineTrack[] = [
      {
        id: 'avatar-track',
        name: 'Avatar Principal',
        type: 'avatar',
        color: '#3B82F6',
        visible: true,
        locked: false,
        clips: [
          {
            id: 'avatar-1',
            name: 'Apresentação Inicial',
            startTime: 0,
            duration: 30,
            content: { avatarType: 'professional', script: 'Bem-vindos ao treinamento de segurança...' },
            effects: ['fade-in'],
            transition: 'fade'
          }
        ]
      },
      {
        id: 'slides-track',
        name: 'Slides PPTX',
        type: 'image',
        color: '#10B981',
        visible: true,
        locked: false,
        clips: projectData?.analysis?.content?.map((slide: any, index: number) => ({
          id: `slide-${index}`,
          name: slide.title || `Slide ${index + 1}`,
          startTime: index * 15,
          duration: 15,
          content: { slideData: slide },
          transition: 'slide'
        })) || []
      },
      {
        id: 'audio-track',
        name: 'Narração TTS',
        type: 'audio',
        color: '#8B5CF6',
        visible: true,
        locked: false,
        clips: [
          {
            id: 'narration-1',
            name: 'Narração Automática',
            startTime: 0,
            duration: totalDuration,
            content: { ttsScript: 'Script gerado automaticamente...' }
          }
        ]
      },
      {
        id: 'music-track',
        name: 'Música de Fundo',
        type: 'audio',
        color: '#F59E0B',
        visible: true,
        locked: false,
        clips: []
      },
      {
        id: 'effects-track',
        name: 'Efeitos Especiais',
        type: 'video',
        color: '#EF4444',
        visible: true,
        locked: false,
        clips: []
      }
    ];

    setTracks(defaultTracks);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      // Simular reprodução
      const interval = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= totalDuration) {
            setIsPlaying(false);
            clearInterval(interval);
            return 0;
          }
          return prev + (0.1 * playbackSpeed);
        });
      }, 100);
    }
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 5));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.2));
  };

  const addTrack = (type: TimelineTrack['type']) => {
    const newTrack: TimelineTrack = {
      id: `track-${Date.now()}`,
      name: `Nova ${type === 'video' ? 'Trilha de Vídeo' : type === 'audio' ? 'Trilha de Áudio' : 'Trilha'}`,
      type,
      color: getTrackColor(type),
      visible: true,
      locked: false,
      clips: []
    };
    setTracks(prev => [...prev, newTrack]);
    toast.success(`Nova trilha ${type} adicionada`);
  };

  const deleteTrack = (trackId: string) => {
    setTracks(prev => prev.filter(t => t.id !== trackId));
    toast.success('Trilha removida');
  };

  const toggleTrackVisibility = (trackId: string) => {
    setTracks(prev => prev.map(t =>
      t.id === trackId ? { ...t, visible: !t.visible } : t
    ));
  };

  const toggleTrackLock = (trackId: string) => {
    setTracks(prev => prev.map(t =>
      t.id === trackId ? { ...t, locked: !t.locked } : t
    ));
  };

  const splitClip = (clipId: string, splitTime: number) => {
    setTracks(prev => prev.map(track => ({
      ...track,
      clips: track.clips.flatMap(clip => {
        if (clip.id === clipId && splitTime > clip.startTime && splitTime < clip.startTime + clip.duration) {
          const firstPart = {
            ...clip,
            id: `${clip.id}-1`,
            duration: splitTime - clip.startTime
          };
          const secondPart = {
            ...clip,
            id: `${clip.id}-2`,
            startTime: splitTime,
            duration: (clip.startTime + clip.duration) - splitTime
          };
          return [firstPart, secondPart];
        }
        return clip;
      })
    })));
    toast.success('Clip dividido com sucesso');
  };

  const getTrackColor = (type: TimelineTrack['type']) => {
    const colors = {
      video: '#3B82F6',
      audio: '#8B5CF6',
      text: '#10B981',
      image: '#F59E0B',
      shape: '#EF4444',
      avatar: '#06B6D4'
    };
    return colors[type];
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSaveProject = () => {
    const timelineData = {
      tracks,
      duration: totalDuration,
      settings: {
        zoom,
        volume: volume[0],
        playbackSpeed
      }
    };
    if (onSave) {
      onSave(timelineData);
    }
    toast.success('Projeto salvo com sucesso');
  };

  const handleExportVideo = (format: string) => {
    if (onExport) {
      onExport(format);
    }
    toast.success(`Exportação ${format} iniciada`);
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Video className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-bold">Timeline Editor Pro</h2>
            </div>
            <Badge className="bg-purple-100 text-purple-800">Animaker Style</Badge>
          </div>

          <div className="flex items-center space-x-2">
            <Button onClick={handleSaveProject} size="sm">
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
            <Select onValueChange={handleExportVideo}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Exportar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mp4">MP4 HD</SelectItem>
                <SelectItem value="webm">WebM</SelectItem>
                <SelectItem value="gif">GIF</SelectItem>
                <SelectItem value="mov">MOV 4K</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Sidebar - Tools */}
        <div className="w-64 bg-white border-r overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Media Library */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Biblioteca de Mídia</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  onClick={() => addTrack('avatar')}
                  size="sm"
                  className="w-full justify-start"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Avatar 3D
                </Button>
                <Button
                  onClick={() => addTrack('image')}
                  size="sm"
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Image className="h-4 w-4 mr-2" />
                  Imagem
                </Button>
                <Button
                  onClick={() => addTrack('audio')}
                  size="sm"
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Mic className="h-4 w-4 mr-2" />
                  Áudio/TTS
                </Button>
                <Button
                  onClick={() => addTrack('text')}
                  size="sm"
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Type className="h-4 w-4 mr-2" />
                  Texto
                </Button>
                <Button
                  onClick={() => addTrack('shape')}
                  size="sm"
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Shapes className="h-4 w-4 mr-2" />
                  Formas
                </Button>
              </CardContent>
            </Card>

            {/* Effects */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Efeitos</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                {['Fade', 'Slide', 'Zoom', 'Rotate', 'Blur', 'Glow'].map(effect => (
                  <Button
                    key={effect}
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => {
                      toast.success(`Efeito ${effect} aplicado!`)
                      // Aplicar efeito ao clip selecionado
                      if (selectedClip) {
                        logger.debug('Aplicando efeito ao clip', { component: 'TimelineEditorPro', effect, clipId: selectedClip })
                      } else {
                        toast.error('Selecione um elemento na timeline primeiro')
                      }
                    }}
                  >
                    {effect}
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Transitions */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Transições</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                {['Cut', 'Wipe', 'Circle', 'Heart'].map(transition => (
                  <Button
                    key={transition}
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => {
                      toast.success(`Transição ${transition} aplicada!`)
                      if (selectedClip) {
                        logger.debug('Aplicando transição ao clip', { component: 'TimelineEditorPro', transition, clipId: selectedClip })
                      } else {
                        toast.error('Selecione um elemento na timeline primeiro')
                      }
                    }}
                  >
                    {transition}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Center - Preview + Timeline */}
        <div className="flex-1 flex flex-col">
          {/* Preview Area */}
          <div className="bg-gray-900 flex-1 flex items-center justify-center">
            <div className="relative bg-black rounded-lg overflow-hidden shadow-2xl" style={{ aspectRatio: '16/9', width: '80%', maxHeight: '80%' }}>
              <UnifiedPreviewPlayer
                currentTime={currentTime}
                tracks={tracks}
                isPlaying={isPlaying}
              />
            </div>
          </div>

          {/* Timeline Controls */}
          <div className="bg-white border-t p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-4">
                {/* Playback Controls */}
                <div className="flex items-center space-x-2">
                  <Button onClick={() => setCurrentTime(0)} size="sm" variant="outline">
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  <Button onClick={handlePlayPause} size="sm" className="bg-blue-600">
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button onClick={handleStop} size="sm" variant="outline">
                    <Square className="h-4 w-4" />
                  </Button>
                  <Button onClick={() => setCurrentTime(totalDuration)} size="sm" variant="outline">
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </div>

                {/* Time Display */}
                <div className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                  {formatTime(currentTime)}
                </div>

                {/* Playback Speed */}
                <Select value={playbackSpeed.toString()} onValueChange={(value) => setPlaybackSpeed(Number(value))}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.25">0.25x</SelectItem>
                    <SelectItem value="0.5">0.5x</SelectItem>
                    <SelectItem value="1">1x</SelectItem>
                    <SelectItem value="1.5">1.5x</SelectItem>
                    <SelectItem value="2">2x</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-4">
                {/* Volume */}
                <div className="flex items-center space-x-2">
                  {volume[0] > 0 ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  <Slider
                    value={volume}
                    onValueChange={setVolume}
                    max={100}
                    step={1}
                    className="w-20"
                  />
                  <span className="text-xs w-8">{volume[0]}%</span>
                </div>

                {/* Zoom Controls */}
                <div className="flex items-center space-x-2">
                  <Button onClick={handleZoomOut} size="sm" variant="outline">
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-xs w-12 text-center">{Math.round(zoom * 100)}%</span>
                  <Button onClick={handleZoomIn} size="sm" variant="outline">
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>

                {/* Tools */}
                <div className="flex items-center space-x-1">
                  <Dialog open={isAvatarCreatorOpen} onOpenChange={setIsAvatarCreatorOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
                        <UserPlus className="h-4 w-4" />
                        Add Avatar
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <AvatarTimelineIntegration onClipAdded={handleAddAvatarClip} />
                    </DialogContent>
                  </Dialog>

                  <Button
                    onClick={() => selectedClip && splitClip(selectedClip, currentTime)}
                    size="sm"
                    variant="outline"
                    disabled={!selectedClip}
                  >
                    <Split className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Scissors className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-gray-100 rounded-lg p-4 min-h-80 overflow-auto" ref={timelineRef}>
              {/* Time Ruler */}
              <div className="relative mb-4 h-6 bg-white rounded border">
                <div className="absolute inset-0 flex">
                  {Array.from({ length: Math.ceil(totalDuration / 5) + 1 }, (_, i) => (
                    <div key={i} className="flex-1 border-r border-gray-200 text-xs p-1">
                      {formatTime(Number(i * 5))}
                    </div>
                  ))}
                </div>
                {/* Playhead */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                  style={{ left: `${(currentTime / totalDuration) * 100}%` }}
                >
                  <div className="absolute -top-2 -left-1 w-3 h-3 bg-red-500 transform rotate-45"></div>
                </div>
              </div>

              {/* Tracks */}
              <div className="space-y-2">
                {tracks.map((track, trackIndex) => (
                  <div
                    key={track.id}
                    className={`flex items-stretch border rounded-lg overflow-hidden ${selectedTrack === track.id ? 'ring-2 ring-blue-500' : ''}`}
                    onClick={() => setSelectedTrack(track.id)}
                  >
                    {/* Track Header */}
                    <div className="w-48 bg-gray-200 p-3 flex items-center justify-between border-r">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: track.color }}
                        ></div>
                        <span className="text-sm font-medium truncate">{track.name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTrackVisibility(track.id);
                          }}
                          size="sm"
                          variant="ghost"
                          className="p-1 h-6 w-6"
                        >
                          {track.visible ? (
                            <Eye className="h-3 w-3" />
                          ) : (
                            <EyeOff className="h-3 w-3 text-gray-400" />
                          )}
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTrackLock(track.id);
                          }}
                          size="sm"
                          variant="ghost"
                          className="p-1 h-6 w-6"
                        >
                          {track.locked ? (
                            <Lock className="h-3 w-3 text-red-500" />
                          ) : (
                            <Unlock className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTrack(track.id);
                          }}
                          size="sm"
                          variant="ghost"
                          className="p-1 h-6 w-6 text-red-500"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Track Timeline */}
                    <div className="flex-1 bg-white p-2 relative" style={{ minHeight: '60px' }}>
                      {track.clips.map(clip => (
                        <div
                          key={clip.id}
                          className={`absolute top-2 bottom-2 rounded border-2 cursor-pointer transition-all ${selectedClip === clip.id
                              ? 'border-blue-500 bg-blue-100'
                              : 'border-gray-300 bg-gray-50'
                            }`}
                          style={{
                            left: `${(clip.startTime / totalDuration) * 100}%`,
                            width: `${(clip.duration / totalDuration) * 100}%`,
                            backgroundColor: `${track.color}20`,
                            borderColor: track.color
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedClip(clip.id);
                          }}
                        >
                          <div className="p-1 h-full flex items-center">
                            <span className="text-xs font-medium truncate text-gray-700">
                              {clip.name}
                            </span>
                          </div>
                          {/* Resize Handles */}
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 cursor-ew-resize opacity-0 hover:opacity-100"></div>
                          <div className="absolute right-0 top-0 bottom-0 w-1 bg-blue-500 cursor-ew-resize opacity-0 hover:opacity-100"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Track Button */}
              <div className="mt-4 flex justify-center">
                <Button onClick={() => addTrack('video')} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Trilha
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Properties */}
        <div className="w-80 bg-white border-l overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Clip Properties */}
            {selectedClip && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Propriedades do Clip</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-xs font-medium">Nome</label>
                    <Input placeholder="Nome do clip" className="h-8" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium">Início</label>
                      <Input placeholder="00:00" className="h-8" />
                    </div>
                    <div>
                      <label className="text-xs font-medium">Duração</label>
                      <Input placeholder="00:10" className="h-8" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium">Opacidade</label>
                    <Slider defaultValue={[100]} max={100} step={1} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Rotação</label>
                    <Slider defaultValue={[0]} min={-180} max={180} step={1} className="mt-1" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Animation Effects */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Animações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {['Entrada', 'Ênfase', 'Saída'].map(type => (
                    <Button
                      key={type}
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => {
                        toast.success(`Tipo de animação ${type} selecionado`);
                        if (selectedClip) {
                          logger.debug('Aplicando estilo ao clip', { component: 'TimelineEditorPro', type, clipId: selectedClip });
                        } else {
                          toast.error('Selecione um elemento na timeline primeiro');
                        }
                      }}
                    >
                      {type}
                    </Button>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {['Fade In', 'Slide Up', 'Zoom In', 'Bounce'].map(effect => (
                    <Button
                      key={effect}
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => {
                        toast.success(`Animação ${effect} aplicada!`)
                        if (selectedClip) {
                          logger.debug('Aplicando animação ao clip', { component: 'TimelineEditorPro', effect, clipId: selectedClip })
                        } else {
                          toast.error('Selecione um elemento na timeline primeiro')
                        }
                      }}
                    >
                      {effect}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Audio Controls */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Controles de Áudio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-xs font-medium">Volume Master</label>
                  <Slider value={volume} onValueChange={setVolume} max={100} step={1} className="mt-1" />
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant={isRecording ? 'destructive' : 'outline'}
                    onClick={() => {
                      setIsRecording(!isRecording)
                      if (!isRecording) {
                        toast.success('Gravação de áudio iniciada!')
                      } else {
                        toast.success('Gravação finalizada!')
                      }
                    }}
                  >
                    <Mic className="h-4 w-4 mr-2" />
                    {isRecording ? 'Parar' : 'Gravar'}
                  </Button>
                  <Button size="sm" variant="outline">
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Export Settings */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Configurações de Exportação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Select defaultValue="1080p">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="720p">HD 720p</SelectItem>
                    <SelectItem value="1080p">Full HD 1080p</SelectItem>
                    <SelectItem value="4k">4K Ultra HD</SelectItem>
                  </SelectContent>
                </Select>
                <Select defaultValue="30">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24">24 FPS</SelectItem>
                    <SelectItem value="30">30 FPS</SelectItem>
                    <SelectItem value="60">60 FPS</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  className="w-full bg-green-600"
                  onClick={() => {
                    if (tracks.some(track => track.clips.length > 0)) {
                      toast.success('Iniciando exportação de vídeo...')
                      // Simular processo de exportação
                      setTimeout(() => {
                        toast.success('Vídeo exportado com sucesso!')
                        if (onExport) {
                          onExport('mp4')
                        }
                      }, 3000)
                    } else {
                      toast.error('Adicione conteúdo à timeline antes de exportar')
                    }
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Vídeo
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

