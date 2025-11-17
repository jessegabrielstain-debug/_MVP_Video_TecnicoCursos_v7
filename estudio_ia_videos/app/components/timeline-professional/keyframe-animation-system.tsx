
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Play, 
  Pause, 
  Plus,
  Minus,
  RotateCcw,
  RotateCw,
  Move,
  Scale,
  Eye,
  Palette,
  Volume2,
  Sparkles,
  Target,
  Zap,
  Clock,
  Layers,
  MousePointer,
  Move3D,
  SkipBack,
  SkipForward,
  Copy,
  Scissors,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Tipos para sistema de keyframes
interface KeyframeProperty {
  id: string;
  name: string;
  type: 'number' | 'color' | 'position' | 'scale' | 'rotation' | 'opacity';
  min?: number;
  max?: number;
  unit?: string;
  icon: React.ElementType;
}

interface Keyframe {
  id: string;
  time: number;
  property: string;
  value: any;
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce' | 'elastic' | 'back';
  interpolation: 'linear' | 'bezier' | 'step';
}

interface AnimationTrack {
  id: string;
  elementId: string;
  elementName: string;
  property: string;
  keyframes: Keyframe[];
  color: string;
  visible: boolean;
  locked: boolean;
}

const KEYFRAME_PROPERTIES: KeyframeProperty[] = [
  { id: 'opacity', name: 'Opacidade', type: 'number', min: 0, max: 100, unit: '%', icon: Eye },
  { id: 'scale', name: 'Escala', type: 'scale', min: 0.1, max: 5, unit: 'x', icon: Scale },
  { id: 'rotation', name: 'Rotação', type: 'rotation', min: -360, max: 360, unit: '°', icon: RotateCcw },
  { id: 'positionX', name: 'Posição X', type: 'position', min: -500, max: 500, unit: 'px', icon: Move },
  { id: 'positionY', name: 'Posição Y', type: 'position', min: -300, max: 300, unit: 'px', icon: Move },
  { id: 'volume', name: 'Volume', type: 'number', min: 0, max: 100, unit: '%', icon: Volume2 },
  { id: 'color', name: 'Cor', type: 'color', icon: Palette },
];

const EASING_OPTIONS = [
  { value: 'linear', label: 'Linear' },
  { value: 'ease-in', label: 'Ease In' },
  { value: 'ease-out', label: 'Ease Out' },
  { value: 'ease-in-out', label: 'Ease In-Out' },
  { value: 'bounce', label: 'Bounce' },
  { value: 'elastic', label: 'Elastic' },
  { value: 'back', label: 'Back' }
];

export default function KeyframeAnimationSystem() {
  // Estados principais
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedKeyframes, setSelectedKeyframes] = useState<string[]>([]);
  const [activeProperty, setActiveProperty] = useState('opacity');

  // Animation tracks
  const [animationTracks, setAnimationTracks] = useState<AnimationTrack[]>([
    {
      id: 'track1',
      elementId: 'video1',
      elementName: 'Slide Principal',
      property: 'opacity',
      color: '#3b82f6',
      visible: true,
      locked: false,
      keyframes: [
        {
          id: 'kf1',
          time: 0,
          property: 'opacity',
          value: 0,
          easing: 'ease-in',
          interpolation: 'bezier'
        },
        {
          id: 'kf2',
          time: 15,
          property: 'opacity',
          value: 100,
          easing: 'ease-out',
          interpolation: 'bezier'
        },
        {
          id: 'kf3',
          time: 105,
          property: 'opacity',
          value: 100,
          easing: 'ease-in',
          interpolation: 'linear'
        },
        {
          id: 'kf4',
          time: 120,
          property: 'opacity',
          value: 0,
          easing: 'ease-out',
          interpolation: 'bezier'
        }
      ]
    },
    {
      id: 'track2',
      elementId: 'video1',
      elementName: 'Slide Principal',
      property: 'scale',
      color: '#10b981',
      visible: true,
      locked: false,
      keyframes: [
        {
          id: 'kf5',
          time: 20,
          property: 'scale',
          value: 1.0,
          easing: 'ease-in-out',
          interpolation: 'bezier'
        },
        {
          id: 'kf6',
          time: 40,
          property: 'scale',
          value: 1.1,
          easing: 'bounce',
          interpolation: 'bezier'
        },
        {
          id: 'kf7',
          time: 80,
          property: 'scale',
          value: 0.95,
          easing: 'elastic',
          interpolation: 'bezier'
        }
      ]
    },
    {
      id: 'track3',
      elementId: 'audio1',
      elementName: 'Narração',
      property: 'volume',
      color: '#f59e0b',
      visible: true,
      locked: false,
      keyframes: [
        {
          id: 'kf8',
          time: 0,
          property: 'volume',
          value: 0,
          easing: 'ease-in',
          interpolation: 'bezier'
        },
        {
          id: 'kf9',
          time: 5,
          property: 'volume',
          value: 85,
          easing: 'linear',
          interpolation: 'linear'
        },
        {
          id: 'kf10',
          time: 115,
          property: 'volume',
          value: 85,
          easing: 'linear',
          interpolation: 'linear'
        },
        {
          id: 'kf11',
          time: 120,
          property: 'volume',
          value: 0,
          easing: 'ease-out',
          interpolation: 'bezier'
        }
      ]
    }
  ]);

  // IA Analytics para keyframes
  const [keyframeAnalytics, setKeyframeAnalytics] = useState({
    totalKeyframes: 11,
    smoothness: 8.9,
    timing: 9.2,
    performance: 8.7,
    suggestions: [
      'Adicione ease-in-out aos keyframes de escala',
      'Volume pode ter transição mais suave',
      'Considere bounce animation no início'
    ]
  });

  // Convert time to pixel position
  const timeToX = (time: number) => {
    return (time / totalDuration) * 600 * zoomLevel;
  };

  // Convert pixel position to time
  const xToTime = (x: number) => {
    return (x / (600 * zoomLevel)) * totalDuration;
  };

  // Playback control
  const handlePlay = () => setIsPlaying(!isPlaying);

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

  // Add new keyframe
  const addKeyframe = (trackId: string, time: number = currentTime) => {
    setAnimationTracks(prev => prev.map(track => {
      if (track.id === trackId) {
        const newKeyframe: Keyframe = {
          id: `kf${Date.now()}`,
          time: time,
          property: track.property,
          value: track.property === 'opacity' ? 100 : track.property === 'scale' ? 1 : 0,
          easing: 'ease-in-out',
          interpolation: 'bezier'
        };
        return {
          ...track,
          keyframes: [...track.keyframes, newKeyframe].sort((a, b) => a.time - b.time)
        };
      }
      return track;
    }));
  };

  // Remove keyframe
  const removeKeyframe = (trackId: string, keyframeId: string) => {
    setAnimationTracks(prev => prev.map(track => {
      if (track.id === trackId) {
        return {
          ...track,
          keyframes: track.keyframes.filter(kf => kf.id !== keyframeId)
        };
      }
      return track;
    }));
  };

  // Update keyframe
  const updateKeyframe = (trackId: string, keyframeId: string, updates: Partial<Keyframe>) => {
    setAnimationTracks(prev => prev.map(track => {
      if (track.id === trackId) {
        return {
          ...track,
          keyframes: track.keyframes.map(kf => 
            kf.id === keyframeId ? { ...kf, ...updates } : kf
          )
        };
      }
      return track;
    }));
  };

  // Get current value for property at current time
  const getCurrentValue = (track: AnimationTrack): number => {
    const { keyframes } = track;
    if (keyframes.length === 0) return 0;

    // Find surrounding keyframes
    const beforeKf = keyframes.filter(kf => kf.time <= currentTime).pop();
    const afterKf = keyframes.find(kf => kf.time > currentTime);

    if (!beforeKf) return keyframes[0].value;
    if (!afterKf) return beforeKf.value;

    // Interpolate between keyframes
    const progress = (currentTime - beforeKf.time) / (afterKf.time - beforeKf.time);
    const easedProgress = applyEasing(progress, beforeKf.easing);
    
    return beforeKf.value + (afterKf.value - beforeKf.value) * easedProgress;
  };

  // Apply easing function
  const applyEasing = (t: number, easing: string): number => {
    switch (easing) {
      case 'linear': return t;
      case 'ease-in': return t * t;
      case 'ease-out': return 1 - Math.pow(1 - t, 2);
      case 'ease-in-out': return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      case 'bounce': return 1 - Math.pow(1 - t, 2) * Math.cos(t * Math.PI * 7);
      case 'elastic': return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI);
      case 'back': return 2.7 * t * t * t - 1.7 * t * t;
      default: return t;
    }
  };

  // Render keyframe curve
  const renderKeyframeCurve = (track: AnimationTrack) => {
    const points: { x: number; y: number }[] = [];
    const steps = 100;
    
    for (let i = 0; i <= steps; i++) {
      const time = (i / steps) * totalDuration;
      const value = interpolateValueAtTime(track, time);
      points.push({
        x: timeToX(time),
        y: 60 - (value / (track.property === 'scale' ? 2 : 100)) * 40
      });
    }

    const pathData = points.reduce((acc, point, index) => {
      return acc + (index === 0 ? `M ${point.x} ${point.y}` : ` L ${point.x} ${point.y}`);
    }, '');

    return (
      <path
        d={pathData}
        stroke={track.color}
        strokeWidth="2"
        fill="none"
        opacity={track.visible ? 1 : 0.3}
      />
    );
  };

  // Interpolate value at specific time
  const interpolateValueAtTime = (track: AnimationTrack, time: number): number => {
    const { keyframes } = track;
    if (keyframes.length === 0) return 0;

    const beforeKf = keyframes.filter(kf => kf.time <= time).pop();
    const afterKf = keyframes.find(kf => kf.time > time);

    if (!beforeKf) return keyframes[0].value;
    if (!afterKf) return beforeKf.value;

    const progress = (time - beforeKf.time) / (afterKf.time - beforeKf.time);
    const easedProgress = applyEasing(progress, beforeKf.easing);
    
    return beforeKf.value + (afterKf.value - beforeKf.value) * easedProgress;
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              Sistema de Keyframes Avançado
            </h1>
            <p className="text-gray-400">
              Controle preciso de animações com curvas de interpolação e IA
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
              <Target className="mr-1 h-3 w-3" />
              {keyframeAnalytics.totalKeyframes} Keyframes
            </Badge>
            <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
              <Sparkles className="mr-1 h-3 w-3" />
              Suavidade: {keyframeAnalytics.smoothness}/10
            </Badge>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Keyframes</p>
                  <p className="text-lg font-bold text-purple-400">{keyframeAnalytics.totalKeyframes}</p>
                </div>
                <Target className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Suavidade</p>
                  <p className="text-lg font-bold text-green-400">{keyframeAnalytics.smoothness}/10</p>
                </div>
                <Zap className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Timing</p>
                  <p className="text-lg font-bold text-blue-400">{keyframeAnalytics.timing}/10</p>
                </div>
                <Clock className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Performance</p>
                  <p className="text-lg font-bold text-yellow-400">{keyframeAnalytics.performance}/10</p>
                </div>
                <Layers className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-250px)]">
        {/* Main Keyframe Editor */}
        <div className="col-span-8">
          <Card className="bg-gray-900 border-gray-800 h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Editor de Keyframes</CardTitle>
                
                {/* Playback Controls */}
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSeek(currentTime - 5)}
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
                    onClick={() => handleSeek(currentTime + 5)}
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>

                  <div className="text-sm font-mono px-3 py-1 bg-gray-800 rounded">
                    {Math.floor(currentTime / 60).toString().padStart(2, '0')}:{(currentTime % 60).toFixed(1).padStart(4, '0')}
                  </div>
                </div>

                {/* Zoom */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">Zoom:</span>
                  <Slider
                    value={[zoomLevel]}
                    onValueChange={([value]) => setZoomLevel(value)}
                    min={0.1}
                    max={3}
                    step={0.1}
                    className="w-20"
                  />
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <ScrollArea className="h-[500px]">
                {animationTracks.map((track, trackIndex) => (
                  <div key={track.id} className="mb-6 border border-gray-800 rounded-lg overflow-hidden">
                    {/* Track Header */}
                    <div className="bg-gray-800 p-3 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: track.color }}
                        />
                        <div>
                          <h4 className="font-medium text-sm">{track.elementName}</h4>
                          <p className="text-xs text-gray-400">{track.property.toUpperCase()}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {track.keyframes.length} keys
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-400">
                          Atual: {getCurrentValue(track).toFixed(1)}
                          {KEYFRAME_PROPERTIES.find(p => p.id === track.property)?.unit}
                        </span>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => addKeyframe(track.id)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Keyframe Timeline */}
                    <div className="relative bg-gray-950 p-4" style={{ height: '120px' }}>
                      {/* Timeline grid */}
                      <svg className="absolute inset-0 w-full h-full">
                        {/* Time grid lines */}
                        {Array.from({ length: Math.ceil(totalDuration / 10) }, (_, i) => (
                          <line
                            key={i}
                            x1={timeToX(i * 10)}
                            y1={0}
                            x2={timeToX(i * 10)}
                            y2={120}
                            stroke="#374151"
                            strokeWidth="1"
                            opacity="0.3"
                          />
                        ))}
                        
                        {/* Value grid lines */}
                        {[25, 50, 75].map(percent => (
                          <line
                            key={percent}
                            x1={0}
                            y1={80 - (percent / 100) * 60}
                            x2={600 * zoomLevel}
                            y2={80 - (percent / 100) * 60}
                            stroke="#374151"
                            strokeWidth="1"
                            opacity="0.2"
                          />
                        ))}

                        {/* Animation curve */}
                        {renderKeyframeCurve(track)}

                        {/* Keyframe points */}
                        {track.keyframes.map((keyframe) => {
                          const x = timeToX(keyframe.time);
                          const y = 60 - (keyframe.value / (track.property === 'scale' ? 2 : 100)) * 40;
                          
                          return (
                            <g key={keyframe.id}>
                              <circle
                                cx={x}
                                cy={y}
                                r={selectedKeyframes.includes(keyframe.id) ? 6 : 4}
                                fill={track.color}
                                stroke="white"
                                strokeWidth={selectedKeyframes.includes(keyframe.id) ? 2 : 1}
                                className="cursor-pointer hover:scale-125 transition-transform"
                                onClick={() => {
                                  if (selectedKeyframes.includes(keyframe.id)) {
                                    setSelectedKeyframes(prev => prev.filter(id => id !== keyframe.id));
                                  } else {
                                    setSelectedKeyframes([keyframe.id]);
                                  }
                                }}
                              />
                              
                              {/* Value label */}
                              <text
                                x={x}
                                y={y - 12}
                                textAnchor="middle"
                                fontSize="10"
                                fill="white"
                                className="font-mono"
                              >
                                {keyframe.value.toFixed(track.property === 'scale' ? 1 : 0)}
                              </text>
                            </g>
                          );
                        })}

                        {/* Current time indicator */}
                        <line
                          x1={timeToX(currentTime)}
                          y1={0}
                          x2={timeToX(currentTime)}
                          y2={120}
                          stroke="#ef4444"
                          strokeWidth="2"
                        />
                      </svg>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar - Properties & Tools */}
        <div className="col-span-4 space-y-4">
          <Tabs defaultValue="properties">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="properties">Propriedades</TabsTrigger>
              <TabsTrigger value="tools">Ferramentas</TabsTrigger>
            </TabsList>

            <TabsContent value="properties">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-sm">Keyframe Selecionado</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedKeyframes.length > 0 ? (
                    <>
                      {selectedKeyframes.map(keyframeId => {
                        const track = animationTracks.find(t => 
                          t.keyframes.some(kf => kf.id === keyframeId)
                        );
                        const keyframe = track?.keyframes.find(kf => kf.id === keyframeId);
                        
                        if (!track || !keyframe) return null;

                        return (
                          <div key={keyframeId} className="space-y-3 pb-4 border-b border-gray-800 last:border-0">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{track.property}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeKeyframe(track.id, keyframe.id)}
                              >
                                <Trash2 className="h-3 w-3 text-red-400" />
                              </Button>
                            </div>
                            
                            <div>
                              <label className="text-xs text-gray-400">Tempo (s)</label>
                              <Slider
                                value={[keyframe.time]}
                                onValueChange={([value]) => 
                                  updateKeyframe(track.id, keyframe.id, { time: value })
                                }
                                max={totalDuration}
                                step={0.1}
                              />
                              <div className="text-xs text-gray-400 mt-1">
                                {keyframe.time.toFixed(1)}s
                              </div>
                            </div>
                            
                            <div>
                              <label className="text-xs text-gray-400">Valor</label>
                              <Slider
                                value={[keyframe.value]}
                                onValueChange={([value]) => 
                                  updateKeyframe(track.id, keyframe.id, { value })
                                }
                                min={KEYFRAME_PROPERTIES.find(p => p.id === track.property)?.min || 0}
                                max={KEYFRAME_PROPERTIES.find(p => p.id === track.property)?.max || 100}
                                step={track.property === 'scale' ? 0.1 : 1}
                              />
                              <div className="text-xs text-gray-400 mt-1">
                                {keyframe.value.toFixed(track.property === 'scale' ? 1 : 0)}
                                {KEYFRAME_PROPERTIES.find(p => p.id === track.property)?.unit}
                              </div>
                            </div>
                            
                            <div>
                              <label className="text-xs text-gray-400">Easing</label>
                              <Select
                                value={keyframe.easing}
                                onValueChange={(value: string) => 
                                  updateKeyframe(track.id, keyframe.id, { easing: value })
                                }
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {EASING_OPTIONS.map(option => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  ) : (
                    <p className="text-sm text-gray-400">
                      Selecione um keyframe para editar
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tools">
              <div className="space-y-4">
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-sm">Ferramentas IA</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
                      <Sparkles className="mr-2 h-3 w-3" />
                      Auto-Suavizar Curvas
                    </Button>
                    <Button size="sm" className="w-full bg-green-600 hover:bg-green-700">
                      <Target className="mr-2 h-3 w-3" />
                      Otimizar Timing
                    </Button>
                    <Button size="sm" className="w-full bg-purple-600 hover:bg-purple-700">
                      <Zap className="mr-2 h-3 w-3" />
                      Gerar Keyframes
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-sm">Sugestões IA</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {keyframeAnalytics.suggestions.map((suggestion, index) => (
                        <div key={index} className="text-xs bg-gray-800 p-2 rounded">
                          💡 {suggestion}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
