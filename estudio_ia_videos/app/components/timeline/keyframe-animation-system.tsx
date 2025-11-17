'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Pause, 
  Square, 
  SkipBack, 
  SkipForward,
  Plus,
  Trash2,
  Copy,
  Move,
  RotateCcw,
  RotateCw,
  Zap,
  Target,
  Layers,
  Settings,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Maximize2,
  Minimize2
} from 'lucide-react';

// Interfaces para o sistema de keyframes
type KeyframePropertyValue = 
  | number 
  | string 
  | { x: number; y: number } 
  | { r: number; g: number; b: number; a?: number };

interface KeyframeProperty {
  id: string;
  name: string;
  type: 'number' | 'color' | 'position' | 'rotation' | 'scale' | 'opacity' | 'text';
  value: KeyframePropertyValue;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
}

interface EasingCurve {
  id: string;
  name: string;
  type: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'cubic-bezier' | 'spring' | 'bounce';
  parameters?: number[];
  preview?: string;
}

interface Keyframe {
  id: string;
  time: number;
  properties: KeyframeProperty[];
  easing: EasingCurve;
  selected: boolean;
  locked: boolean;
  visible: boolean;
  interpolation: 'linear' | 'smooth' | 'hold' | 'bezier';
  tension?: number;
  bias?: number;
  continuity?: number;
}

interface AnimationTrack {
  id: string;
  name: string;
  type: 'transform' | 'opacity' | 'color' | 'text' | 'effect' | 'custom';
  keyframes: Keyframe[];
  enabled: boolean;
  locked: boolean;
  visible: boolean;
  color: string;
  height: number;
  expanded: boolean;
}

interface AnimationLayer {
  id: string;
  name: string;
  tracks: AnimationTrack[];
  enabled: boolean;
  locked: boolean;
  visible: boolean;
  opacity: number;
  blendMode: string;
}

interface AnimationSettings {
  duration: number;
  fps: number;
  resolution: { width: number; height: number };
  timeUnit: 'frames' | 'seconds' | 'milliseconds';
  snapToFrames: boolean;
  autoKeyframe: boolean;
  onionSkinning: boolean;
  motionBlur: boolean;
  qualityPreset: 'draft' | 'preview' | 'final';
}

interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  playbackSpeed: number;
  loop: boolean;
  loopStart: number;
  loopEnd: number;
  preroll: number;
  postroll: number;
}

interface KeyframeClipboard {
  keyframes: Keyframe[];
  tracks: AnimationTrack[];
  operation: 'copy' | 'cut';
  timestamp: number;
}

const EASING_PRESETS: EasingCurve[] = [
  { id: 'linear', name: 'Linear', type: 'linear' },
  { id: 'ease', name: 'Ease', type: 'ease' },
  { id: 'ease-in', name: 'Ease In', type: 'ease-in' },
  { id: 'ease-out', name: 'Ease Out', type: 'ease-out' },
  { id: 'ease-in-out', name: 'Ease In Out', type: 'ease-in-out' },
  { id: 'bounce', name: 'Bounce', type: 'bounce' },
  { id: 'spring', name: 'Spring', type: 'spring', parameters: [1, 0.5] },
  { id: 'custom', name: 'Custom Bezier', type: 'cubic-bezier', parameters: [0.25, 0.1, 0.25, 1] }
];

const PROPERTY_TEMPLATES: Record<string, KeyframeProperty[]> = {
  transform: [
    { id: 'x', name: 'Position X', type: 'number', value: 0, unit: 'px' },
    { id: 'y', name: 'Position Y', type: 'number', value: 0, unit: 'px' },
    { id: 'scaleX', name: 'Scale X', type: 'number', value: 1, min: 0, max: 5, step: 0.1 },
    { id: 'scaleY', name: 'Scale Y', type: 'number', value: 1, min: 0, max: 5, step: 0.1 },
    { id: 'rotation', name: 'Rotation', type: 'number', value: 0, unit: 'deg', min: -360, max: 360 }
  ],
  opacity: [
    { id: 'opacity', name: 'Opacity', type: 'number', value: 1, min: 0, max: 1, step: 0.01 }
  ],
  color: [
    { id: 'color', name: 'Color', type: 'color', value: '#ffffff' }
  ]
};

export function KeyframeAnimationSystem() {
  // Estados principais
  const [layers, setLayers] = useState<AnimationLayer[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<string>('');
  const [selectedTrack, setSelectedTrack] = useState<string>('');
  const [selectedKeyframes, setSelectedKeyframes] = useState<string[]>([]);
  const [settings, setSettings] = useState<AnimationSettings>({
    duration: 10,
    fps: 30,
    resolution: { width: 1920, height: 1080 },
    timeUnit: 'seconds',
    snapToFrames: true,
    autoKeyframe: false,
    onionSkinning: false,
    motionBlur: false,
    qualityPreset: 'preview'
  });
  const [playback, setPlayback] = useState<PlaybackState>({
    isPlaying: false,
    currentTime: 0,
    playbackSpeed: 1,
    loop: false,
    loopStart: 0,
    loopEnd: 10,
    preroll: 0,
    postroll: 0
  });
  const [clipboard, setClipboard] = useState<KeyframeClipboard | null>(null);
  const [zoom, setZoom] = useState(1);
  const [viewportOffset, setViewportOffset] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [showCurveEditor, setShowCurveEditor] = useState(false);

  // Refs
  const timelineRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();

  // Funções de controle de reprodução
  const togglePlayback = useCallback(() => {
    setPlayback(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, []);

  const stopPlayback = useCallback(() => {
    setPlayback(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
  }, []);

  const seekTo = useCallback((time: number) => {
    setPlayback(prev => ({ ...prev, currentTime: Math.max(0, Math.min(time, settings.duration)) }));
  }, [settings.duration]);

  // Funções de gerenciamento de layers
  const addLayer = useCallback(() => {
    const newLayer: AnimationLayer = {
      id: `layer_${Date.now()}`,
      name: `Layer ${layers.length + 1}`,
      tracks: [],
      enabled: true,
      locked: false,
      visible: true,
      opacity: 1,
      blendMode: 'normal'
    };
    setLayers(prev => [...prev, newLayer]);
    setSelectedLayer(newLayer.id);
  }, [layers.length]);

  const deleteLayer = useCallback((layerId: string) => {
    setLayers(prev => prev.filter(layer => layer.id !== layerId));
    if (selectedLayer === layerId) {
      setSelectedLayer('');
    }
  }, [selectedLayer]);

  // Funções de gerenciamento de tracks
  const addTrack = useCallback((layerId: string, trackType: AnimationTrack['type']) => {
    const newTrack: AnimationTrack = {
      id: `track_${Date.now()}`,
      name: `${trackType.charAt(0).toUpperCase() + trackType.slice(1)} Track`,
      type: trackType,
      keyframes: [],
      enabled: true,
      locked: false,
      visible: true,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
      height: 40,
      expanded: false
    };

    setLayers(prev => prev.map(layer => 
      layer.id === layerId 
        ? { ...layer, tracks: [...layer.tracks, newTrack] }
        : layer
    ));
    setSelectedTrack(newTrack.id);
  }, []);

  const deleteTrack = useCallback((layerId: string, trackId: string) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId 
        ? { ...layer, tracks: layer.tracks.filter(track => track.id !== trackId) }
        : layer
    ));
    if (selectedTrack === trackId) {
      setSelectedTrack('');
    }
  }, [selectedTrack]);

  // Funções de gerenciamento de keyframes
  const addKeyframe = useCallback((trackId: string, time: number, properties?: KeyframeProperty[]) => {
    const newKeyframe: Keyframe = {
      id: `keyframe_${Date.now()}`,
      time,
      properties: properties || PROPERTY_TEMPLATES.transform,
      easing: EASING_PRESETS[0],
      selected: false,
      locked: false,
      visible: true,
      interpolation: 'smooth'
    };

    setLayers(prev => prev.map(layer => ({
      ...layer,
      tracks: layer.tracks.map(track => 
        track.id === trackId 
          ? { ...track, keyframes: [...track.keyframes, newKeyframe].sort((a, b) => a.time - b.time) }
          : track
      )
    })));
  }, []);

  const deleteKeyframe = useCallback((trackId: string, keyframeId: string) => {
    setLayers(prev => prev.map(layer => ({
      ...layer,
      tracks: layer.tracks.map(track => 
        track.id === trackId 
          ? { ...track, keyframes: track.keyframes.filter(kf => kf.id !== keyframeId) }
          : track
      )
    })));
    setSelectedKeyframes(prev => prev.filter(id => id !== keyframeId));
  }, []);

  const updateKeyframe = useCallback((trackId: string, keyframeId: string, updates: Partial<Keyframe>) => {
    setLayers(prev => prev.map(layer => ({
      ...layer,
      tracks: layer.tracks.map(track => 
        track.id === trackId 
          ? { 
              ...track, 
              keyframes: track.keyframes.map(kf => 
                kf.id === keyframeId ? { ...kf, ...updates } : kf
              )
            }
          : track
      )
    })));
  }, []);

  // Funções de interpolação e easing
  const interpolateValue = useCallback((
    startValue: number, 
    endValue: number, 
    progress: number, 
    easing: EasingCurve
  ): number => {
    let easedProgress = progress;

    switch (easing.type) {
      case 'linear':
        easedProgress = progress;
        break;
      case 'ease-in':
        easedProgress = progress * progress;
        break;
      case 'ease-out':
        easedProgress = 1 - Math.pow(1 - progress, 2);
        break;
      case 'ease-in-out':
        easedProgress = progress < 0.5 
          ? 2 * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        break;
      case 'bounce':
        if (progress < 1 / 2.75) {
          easedProgress = 7.5625 * progress * progress;
        } else if (progress < 2 / 2.75) {
          easedProgress = 7.5625 * (progress -= 1.5 / 2.75) * progress + 0.75;
        } else if (progress < 2.5 / 2.75) {
          easedProgress = 7.5625 * (progress -= 2.25 / 2.75) * progress + 0.9375;
        } else {
          easedProgress = 7.5625 * (progress -= 2.625 / 2.75) * progress + 0.984375;
        }
        break;
      case 'spring':
        const [amplitude = 1, period = 0.5] = easing.parameters || [1, 0.5];
        easedProgress = 1 - amplitude * Math.pow(2, -10 * progress) * Math.sin((progress - period / 4) * (2 * Math.PI) / period);
        break;
    }

    return startValue + (endValue - startValue) * easedProgress;
  }, []);

  // Função para calcular valores interpolados em um tempo específico
  const getInterpolatedValues = useCallback((track: AnimationTrack, time: number) => {
    const keyframes = track.keyframes.sort((a, b) => a.time - b.time);
    
    if (keyframes.length === 0) return {};
    if (keyframes.length === 1) return keyframes[0].properties.reduce((acc, prop) => ({ ...acc, [prop.name]: prop.value }), {});

    // Encontrar keyframes adjacentes
    let startKeyframe = keyframes[0];
    let endKeyframe = keyframes[keyframes.length - 1];

    for (let i = 0; i < keyframes.length - 1; i++) {
      if (time >= keyframes[i].time && time <= keyframes[i + 1].time) {
        startKeyframe = keyframes[i];
        endKeyframe = keyframes[i + 1];
        break;
      }
    }

    if (time <= startKeyframe.time) {
      return startKeyframe.properties.reduce((acc, prop) => ({ ...acc, [prop.name]: prop.value }), {});
    }

    if (time >= endKeyframe.time) {
      return endKeyframe.properties.reduce((acc, prop) => ({ ...acc, [prop.name]: prop.value }), {});
    }

    // Interpolar entre keyframes
    const progress = (time - startKeyframe.time) / (endKeyframe.time - startKeyframe.time);
    const result: Record<string, unknown> = {};

    startKeyframe.properties.forEach(startProp => {
      const endProp = endKeyframe.properties.find(p => p.name === startProp.name);
      if (endProp && startProp.type === 'number') {
        result[startProp.name] = interpolateValue(
          startProp.value,
          endProp.value,
          progress,
          startKeyframe.easing
        );
      } else {
        result[startProp.name] = startProp.value;
      }
    });

    return result;
  }, [interpolateValue]);

  // Loop de animação
  useEffect(() => {
    if (playback.isPlaying) {
      const animate = () => {
        setPlayback(prev => {
          const deltaTime = 1 / settings.fps * prev.playbackSpeed;
          let newTime = prev.currentTime + deltaTime;

          if (prev.loop) {
            if (newTime > prev.loopEnd) {
              newTime = prev.loopStart;
            }
          } else if (newTime > settings.duration) {
            newTime = settings.duration;
            return { ...prev, currentTime: newTime, isPlaying: false };
          }

          return { ...prev, currentTime: newTime };
        });

        animationFrameRef.current = requestAnimationFrame(animate);
      };

      animationFrameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [playback.isPlaying, playback.playbackSpeed, settings.fps, settings.duration]);

  // Funções de clipboard
  const copyKeyframes = useCallback(() => {
    const selectedKfs = layers.flatMap(layer => 
      layer.tracks.flatMap(track => 
        track.keyframes.filter(kf => selectedKeyframes.includes(kf.id))
      )
    );

    if (selectedKfs.length > 0) {
      setClipboard({
        keyframes: selectedKfs,
        tracks: [],
        operation: 'copy',
        timestamp: Date.now()
      });
    }
  }, [layers, selectedKeyframes]);

  const pasteKeyframes = useCallback((targetTrackId: string, targetTime: number) => {
    if (!clipboard || clipboard.keyframes.length === 0) return;

    const timeOffset = targetTime - Math.min(...clipboard.keyframes.map(kf => kf.time));

    clipboard.keyframes.forEach(kf => {
      const newKeyframe: Keyframe = {
        ...kf,
        id: `keyframe_${Date.now()}_${Math.random()}`,
        time: kf.time + timeOffset,
        selected: false
      };

      addKeyframe(targetTrackId, newKeyframe.time, newKeyframe.properties);
    });
  }, [clipboard, addKeyframe]);

  return (
    <div className="w-full h-full bg-gray-900 text-white flex flex-col">
      {/* Header com controles principais */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold">Sistema de Keyframes</h2>
            <Badge variant="outline" className="text-blue-400 border-blue-400">
              {layers.length} Layers • {layers.reduce((acc, layer) => acc + layer.tracks.length, 0)} Tracks
            </Badge>
          </div>

          {/* Controles de reprodução */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => seekTo(0)}
              className="text-white border-gray-600 hover:bg-gray-700"
            >
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={togglePlayback}
              className="text-white border-gray-600 hover:bg-gray-700"
            >
              {playback.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={stopPlayback}
              className="text-white border-gray-600 hover:bg-gray-700"
            >
              <Square className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => seekTo(settings.duration)}
              className="text-white border-gray-600 hover:bg-gray-700"
            >
              <SkipForward className="w-4 h-4" />
            </Button>

            <div className="flex items-center space-x-2 ml-4">
              <Label className="text-sm">Tempo:</Label>
              <Input
                type="number"
                value={playback.currentTime.toFixed(2)}
                onChange={(e) => seekTo(parseFloat(e.target.value) || 0)}
                className="w-20 bg-gray-700 border-gray-600 text-white"
                step="0.01"
                min="0"
                max={settings.duration}
              />
              <span className="text-sm text-gray-400">/ {settings.duration}s</span>
            </div>
          </div>
        </div>

        {/* Timeline de tempo */}
        <div className="mt-4">
          <Slider
            value={[playback.currentTime]}
            onValueChange={([value]) => seekTo(value)}
            max={settings.duration}
            step={1 / settings.fps}
            className="w-full"
          />
        </div>
      </div>

      {/* Área principal */}
      <div className="flex-1 flex">
        {/* Painel lateral esquerdo */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
          <Tabs defaultValue="layers" className="flex-1">
            <TabsList className="grid w-full grid-cols-3 bg-gray-700">
              <TabsTrigger value="layers">Layers</TabsTrigger>
              <TabsTrigger value="properties">Propriedades</TabsTrigger>
              <TabsTrigger value="settings">Config</TabsTrigger>
            </TabsList>

            <TabsContent value="layers" className="flex-1 p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Layers</h3>
                  <Button
                    onClick={addLayer}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar
                  </Button>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {layers.map((layer) => (
                    <Card 
                      key={layer.id} 
                      className={`bg-gray-700 border-gray-600 cursor-pointer transition-colors ${
                        selectedLayer === layer.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => setSelectedLayer(layer.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLayers(prev => prev.map(l => 
                                  l.id === layer.id ? { ...l, visible: !l.visible } : l
                                ));
                              }}
                            >
                              {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLayers(prev => prev.map(l => 
                                  l.id === layer.id ? { ...l, locked: !l.locked } : l
                                ));
                              }}
                            >
                              {layer.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                            </Button>
                            <span className="font-medium">{layer.name}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteLayer(layer.id);
                            }}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="mt-2 space-y-1">
                          {layer.tracks.map((track) => (
                            <div 
                              key={track.id}
                              className={`flex items-center justify-between p-2 rounded bg-gray-600 cursor-pointer ${
                                selectedTrack === track.id ? 'ring-1 ring-blue-400' : ''
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTrack(track.id);
                              }}
                            >
                              <div className="flex items-center space-x-2">
                                <div 
                                  className="w-3 h-3 rounded"
                                  style={{ backgroundColor: track.color }}
                                />
                                <span className="text-sm">{track.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {track.keyframes.length}
                                </Badge>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteTrack(layer.id, track.id);
                                }}
                                className="text-red-400 hover:text-red-300"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              addTrack(layer.id, 'transform');
                            }}
                            className="w-full text-gray-300 border-gray-600 hover:bg-gray-600"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Adicionar Track
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="properties" className="flex-1 p-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Propriedades do Keyframe</h3>
                
                {selectedKeyframes.length > 0 ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Curva de Easing</Label>
                      <Select>
                        <SelectTrigger className="bg-gray-700 border-gray-600">
                          <SelectValue placeholder="Selecionar easing" />
                        </SelectTrigger>
                        <SelectContent>
                          {EASING_PRESETS.map((preset) => (
                            <SelectItem key={preset.id} value={preset.id}>
                              {preset.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Interpolação</Label>
                      <Select>
                        <SelectTrigger className="bg-gray-700 border-gray-600">
                          <SelectValue placeholder="Tipo de interpolação" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="linear">Linear</SelectItem>
                          <SelectItem value="smooth">Suave</SelectItem>
                          <SelectItem value="hold">Manter</SelectItem>
                          <SelectItem value="bezier">Bézier</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      onClick={() => setShowCurveEditor(true)}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      <Target className="w-4 h-4 mr-2" />
                      Editor de Curvas
                    </Button>
                  </div>
                ) : (
                  <p className="text-gray-400">Selecione um keyframe para editar propriedades</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="settings" className="flex-1 p-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Configurações</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Duração (segundos)</Label>
                    <Input
                      type="number"
                      value={settings.duration}
                      onChange={(e) => setSettings(prev => ({ ...prev, duration: parseFloat(e.target.value) || 10 }))}
                      className="bg-gray-700 border-gray-600"
                      min="0.1"
                      step="0.1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>FPS</Label>
                    <Select
                      value={settings.fps.toString()}
                      onValueChange={(value) => setSettings(prev => ({ ...prev, fps: parseInt(value) }))}
                    >
                      <SelectTrigger className="bg-gray-700 border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24">24 FPS</SelectItem>
                        <SelectItem value="30">30 FPS</SelectItem>
                        <SelectItem value="60">60 FPS</SelectItem>
                        <SelectItem value="120">120 FPS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Velocidade de Reprodução</Label>
                    <Slider
                      value={[playback.playbackSpeed]}
                      onValueChange={([value]) => setPlayback(prev => ({ ...prev, playbackSpeed: value }))}
                      min={0.1}
                      max={3}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="text-sm text-gray-400 text-center">
                      {playback.playbackSpeed.toFixed(1)}x
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Auto Keyframe</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSettings(prev => ({ ...prev, autoKeyframe: !prev.autoKeyframe }))}
                        className={settings.autoKeyframe ? 'bg-red-600 text-white' : 'text-gray-300 border-gray-600'}
                      >
                        {settings.autoKeyframe ? 'ON' : 'OFF'}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Snap to Frames</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSettings(prev => ({ ...prev, snapToFrames: !prev.snapToFrames }))}
                        className={settings.snapToFrames ? 'bg-blue-600 text-white' : 'text-gray-300 border-gray-600'}
                      >
                        {settings.snapToFrames ? 'ON' : 'OFF'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Área da timeline */}
        <div className="flex-1 bg-gray-900 flex flex-col">
          {/* Toolbar da timeline */}
          <div className="bg-gray-800 border-b border-gray-700 p-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRecording(!isRecording)}
                className={isRecording ? 'bg-red-600 text-white' : 'text-gray-300 border-gray-600'}
              >
                <Zap className="w-4 h-4 mr-1" />
                {isRecording ? 'Gravando' : 'Gravar'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={copyKeyframes}
                disabled={selectedKeyframes.length === 0}
                className="text-gray-300 border-gray-600 hover:bg-gray-700"
              >
                <Copy className="w-4 h-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  selectedKeyframes.forEach(kfId => {
                    const track = layers.flatMap(l => l.tracks).find(t => 
                      t.keyframes.some(kf => kf.id === kfId)
                    );
                    if (track) {
                      deleteKeyframe(track.id, kfId);
                    }
                  });
                }}
                disabled={selectedKeyframes.length === 0}
                className="text-red-400 border-gray-600 hover:bg-gray-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Label className="text-sm">Zoom:</Label>
              <Slider
                value={[zoom]}
                onValueChange={([value]) => setZoom(value)}
                min={0.1}
                max={5}
                step={0.1}
                className="w-32"
              />
              <span className="text-sm text-gray-400">{zoom.toFixed(1)}x</span>
            </div>
          </div>

          {/* Timeline principal */}
          <div className="flex-1 overflow-auto" ref={timelineRef}>
            <div className="min-h-full" style={{ width: `${settings.duration * 100 * zoom}px` }}>
              {/* Régua de tempo */}
              <div className="h-8 bg-gray-800 border-b border-gray-700 relative">
                {Array.from({ length: Math.ceil(settings.duration) + 1 }, (_, i) => (
                  <div
                    key={i}
                    className="absolute top-0 h-full border-l border-gray-600 flex items-center pl-1"
                    style={{ left: `${i * 100 * zoom}px` }}
                  >
                    <span className="text-xs text-gray-400">{i}s</span>
                  </div>
                ))}
                
                {/* Playhead */}
                <div
                  className="absolute top-0 w-0.5 h-full bg-red-500 z-10"
                  style={{ left: `${playback.currentTime * 100 * zoom}px` }}
                />
              </div>

              {/* Tracks */}
              <div className="space-y-1">
                {layers.map((layer) => (
                  <div key={layer.id}>
                    {layer.tracks.map((track) => (
                      <div
                        key={track.id}
                        className="h-12 bg-gray-800 border-b border-gray-700 relative"
                        style={{ opacity: layer.visible ? 1 : 0.5 }}
                      >
                        {/* Keyframes */}
                        {track.keyframes.map((keyframe) => (
                          <div
                            key={keyframe.id}
                            className={`absolute top-1 w-3 h-10 rounded cursor-pointer transition-all ${
                              selectedKeyframes.includes(keyframe.id) 
                                ? 'ring-2 ring-blue-400 scale-110' 
                                : 'hover:scale-105'
                            }`}
                            style={{ 
                              left: `${keyframe.time * 100 * zoom - 6}px`,
                              backgroundColor: track.color
                            }}
                            onClick={() => {
                              setSelectedKeyframes(prev => 
                                prev.includes(keyframe.id)
                                  ? prev.filter(id => id !== keyframe.id)
                                  : [...prev, keyframe.id]
                              );
                            }}
                            onDoubleClick={() => seekTo(keyframe.time)}
                          />
                        ))}

                        {/* Área clicável para adicionar keyframes */}
                        <div
                          className="absolute inset-0 cursor-crosshair"
                          onClick={(e) => {
                            if (e.target === e.currentTarget) {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const x = e.clientX - rect.left;
                              const time = (x / (100 * zoom));
                              addKeyframe(track.id, time);
                            }
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="bg-gray-800 border-t border-gray-700 p-2 flex items-center justify-between text-sm text-gray-400">
        <div className="flex items-center space-x-4">
          <span>Keyframes selecionados: {selectedKeyframes.length}</span>
          <span>Tempo atual: {playback.currentTime.toFixed(2)}s</span>
          <span>Frame: {Math.round(playback.currentTime * settings.fps)}</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>FPS: {settings.fps}</span>
          <span>Duração: {settings.duration}s</span>
          <span>Zoom: {zoom.toFixed(1)}x</span>
        </div>
      </div>
    </div>
  );
}