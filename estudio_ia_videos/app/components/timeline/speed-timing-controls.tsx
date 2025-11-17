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
  Clock, 
  Zap, 
  Target, 
  RotateCcw, 
  RotateCw,
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  FastForward,
  Rewind,
  Timer,
  Gauge,
  Settings,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  Layers,
  Maximize2,
  Minimize2,
  RefreshCw,
  Scissors,
  Copy,
  Move3D,
  Trash2
} from 'lucide-react';

// Interfaces para controles de velocidade e timing
interface TimingSettings {
  fps: number;
  timebase: number;
  dropFrame: boolean;
  pulldown: '2:3' | '3:2' | 'none';
  frameBlending: boolean;
  motionBlur: boolean;
  shutterAngle: number;
  shutterPhase: number;
}

interface SpeedControl {
  id: string;
  name: string;
  type: 'constant' | 'ramp' | 'curve' | 'keyframed';
  startTime: number;
  endTime: number;
  startSpeed: number;
  endSpeed: number;
  curve?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'custom';
  keyframes?: SpeedKeyframe[];
  enabled: boolean;
  locked: boolean;
}

interface SpeedKeyframe {
  id: string;
  time: number;
  speed: number;
  interpolation: 'linear' | 'smooth' | 'hold' | 'bezier';
  handleIn?: { x: number; y: number };
  handleOut?: { x: number; y: number };
}

interface TimeRemapping {
  id: string;
  name: string;
  sourceStart: number;
  sourceEnd: number;
  targetStart: number;
  targetEnd: number;
  method: 'stretch' | 'speed' | 'frame-blend' | 'optical-flow';
  quality: 'draft' | 'preview' | 'best';
  preservePitch: boolean;
  reverseTime: boolean;
}

interface FrameRate {
  fps: number;
  name: string;
  standard: 'NTSC' | 'PAL' | 'FILM' | 'WEB' | 'CUSTOM';
  dropFrame: boolean;
  pulldown?: string;
}

interface TimecodeSettings {
  format: 'SMPTE' | 'frames' | 'seconds' | 'milliseconds';
  startTimecode: string;
  dropFrame: boolean;
  showSubframes: boolean;
  colorCoding: boolean;
}

interface PlaybackMetrics {
  currentFrame: number;
  totalFrames: number;
  currentTime: number;
  totalTime: number;
  playbackSpeed: number;
  actualFPS: number;
  droppedFrames: number;
  renderTime: number;
  memoryUsage: number;
  cpuUsage: number;
}

interface SpeedCurve {
  id: string;
  name: string;
  points: { time: number; speed: number }[];
  smoothing: number;
  tension: number;
  bias: number;
  continuity: number;
}

const speedControlTypes: SpeedControl['type'][] = ['constant', 'ramp', 'curve', 'keyframed']
const timecodeFormats: TimecodeSettings['format'][] = ['SMPTE', 'frames', 'seconds', 'milliseconds']
const pulldownOptions: TimingSettings['pulldown'][] = ['2:3', '3:2', 'none']

const isSpeedControlType = (value: string): value is SpeedControl['type'] =>
  speedControlTypes.some((type) => type === value)

const isTimecodeFormat = (value: string): value is TimecodeSettings['format'] =>
  timecodeFormats.some((format) => format === value)

const isPulldownOption = (value: string): value is TimingSettings['pulldown'] =>
  pulldownOptions.some((option) => option === value)

const FRAME_RATES: FrameRate[] = [
  { fps: 23.976, name: '23.976 fps (Film)', standard: 'FILM', dropFrame: false },
  { fps: 24, name: '24 fps (Cinema)', standard: 'FILM', dropFrame: false },
  { fps: 25, name: '25 fps (PAL)', standard: 'PAL', dropFrame: false },
  { fps: 29.97, name: '29.97 fps (NTSC)', standard: 'NTSC', dropFrame: true },
  { fps: 30, name: '30 fps', standard: 'NTSC', dropFrame: false },
  { fps: 50, name: '50 fps (PAL)', standard: 'PAL', dropFrame: false },
  { fps: 59.94, name: '59.94 fps (NTSC)', standard: 'NTSC', dropFrame: true },
  { fps: 60, name: '60 fps', standard: 'WEB', dropFrame: false },
  { fps: 120, name: '120 fps (High Speed)', standard: 'WEB', dropFrame: false },
  { fps: 240, name: '240 fps (Ultra High Speed)', standard: 'WEB', dropFrame: false }
];

const SPEED_PRESETS = [
  { name: 'Slow Motion 50%', speed: 0.5 },
  { name: 'Slow Motion 25%', speed: 0.25 },
  { name: 'Normal Speed', speed: 1.0 },
  { name: 'Fast Motion 2x', speed: 2.0 },
  { name: 'Fast Motion 4x', speed: 4.0 },
  { name: 'Time Lapse 10x', speed: 10.0 },
  { name: 'Freeze Frame', speed: 0.0 }
];

export function SpeedTimingControls() {
  // Estados principais
  const [timingSettings, setTimingSettings] = useState<TimingSettings>({
    fps: 30,
    timebase: 30,
    dropFrame: false,
    pulldown: 'none',
    frameBlending: true,
    motionBlur: false,
    shutterAngle: 180,
    shutterPhase: 0
  });

  const [speedControls, setSpeedControls] = useState<SpeedControl[]>([]);
  const [selectedSpeedControl, setSelectedSpeedControl] = useState<string>('');
  const [timeRemappings, setTimeRemappings] = useState<TimeRemapping[]>([]);
  const [selectedRemapping, setSelectedRemapping] = useState<string>('');

  const [timecodeSettings, setTimecodeSettings] = useState<TimecodeSettings>({
    format: 'SMPTE',
    startTimecode: '00:00:00:00',
    dropFrame: false,
    showSubframes: false,
    colorCoding: true
  });

  const [playbackMetrics, setPlaybackMetrics] = useState<PlaybackMetrics>({
    currentFrame: 0,
    totalFrames: 3000,
    currentTime: 0,
    totalTime: 100,
    playbackSpeed: 1.0,
    actualFPS: 30,
    droppedFrames: 0,
    renderTime: 16.67,
    memoryUsage: 512,
    cpuUsage: 25
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [globalSpeed, setGlobalSpeed] = useState(1.0);
  const [frameAccurate, setFrameAccurate] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [realTimePlayback, setRealTimePlayback] = useState(true);

  // Refs
  const animationFrameRef = useRef<number>();
  const lastFrameTimeRef = useRef<number>(0);

  // Funções de conversão de tempo
  const frameToTime = useCallback((frame: number, fps: number = timingSettings.fps): number => {
    return frame / fps;
  }, [timingSettings.fps]);

  const timeToFrame = useCallback((time: number, fps: number = timingSettings.fps): number => {
    return Math.round(time * fps);
  }, [timingSettings.fps]);

  const formatTimecode = useCallback((time: number, format: string = timecodeSettings.format): string => {
    switch (format) {
      case 'SMPTE':
        const hours = Math.floor(time / 3600);
        const minutes = Math.floor((time % 3600) / 60);
        const seconds = Math.floor(time % 60);
        const frames = Math.floor((time % 1) * timingSettings.fps);
        const separator = timecodeSettings.dropFrame ? ';' : ':';
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}${separator}${frames.toString().padStart(2, '0')}`;
      
      case 'frames':
        return timeToFrame(time).toString();
      
      case 'seconds':
        return time.toFixed(3) + 's';
      
      case 'milliseconds':
        return Math.round(time * 1000).toString() + 'ms';
      
      default:
        return time.toFixed(2);
    }
  }, [timingSettings.fps, timecodeSettings.format, timecodeSettings.dropFrame, timeToFrame]);

  // Funções de controle de velocidade
  const addSpeedControl = useCallback((type: SpeedControl['type'] = 'constant') => {
    const newControl: SpeedControl = {
      id: `speed_${Date.now()}`,
      name: `Speed Control ${speedControls.length + 1}`,
      type,
      startTime: currentTime,
      endTime: currentTime + 5,
      startSpeed: 1.0,
      endSpeed: type === 'constant' ? 1.0 : 2.0,
      curve: 'linear',
      keyframes: [],
      enabled: true,
      locked: false
    };

    setSpeedControls(prev => [...prev, newControl]);
    setSelectedSpeedControl(newControl.id);
  }, [speedControls.length, currentTime]);

  const updateSpeedControl = useCallback((id: string, updates: Partial<SpeedControl>) => {
    setSpeedControls(prev => prev.map(control => 
      control.id === id ? { ...control, ...updates } : control
    ));
  }, []);

  const deleteSpeedControl = useCallback((id: string) => {
    setSpeedControls(prev => prev.filter(control => control.id !== id));
    if (selectedSpeedControl === id) {
      setSelectedSpeedControl('');
    }
  }, [selectedSpeedControl]);

  // Função para calcular velocidade em um tempo específico
  const getSpeedAtTime = useCallback((time: number): number => {
    let resultSpeed = globalSpeed;

    speedControls.forEach(control => {
      if (!control.enabled || time < control.startTime || time > control.endTime) {
        return;
      }

      const progress = (time - control.startTime) / (control.endTime - control.startTime);
      let localSpeed = control.startSpeed;

      switch (control.type) {
        case 'constant':
          localSpeed = control.startSpeed;
          break;

        case 'ramp':
          localSpeed = control.startSpeed + (control.endSpeed - control.startSpeed) * progress;
          break;

        case 'curve':
          let easedProgress = progress;
          switch (control.curve) {
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
          }
          localSpeed = control.startSpeed + (control.endSpeed - control.startSpeed) * easedProgress;
          break;

        case 'keyframed':
          if (control.keyframes && control.keyframes.length > 0) {
            const keyframes = control.keyframes.sort((a, b) => a.time - b.time);
            
            // Encontrar keyframes adjacentes
            let startKf = keyframes[0];
            let endKf = keyframes[keyframes.length - 1];

            for (let i = 0; i < keyframes.length - 1; i++) {
              if (time >= keyframes[i].time && time <= keyframes[i + 1].time) {
                startKf = keyframes[i];
                endKf = keyframes[i + 1];
                break;
              }
            }

            if (time <= startKf.time) {
              localSpeed = startKf.speed;
            } else if (time >= endKf.time) {
              localSpeed = endKf.speed;
            } else {
              const kfProgress = (time - startKf.time) / (endKf.time - startKf.time);
              localSpeed = startKf.speed + (endKf.speed - startKf.speed) * kfProgress;
            }
          }
          break;
      }

      resultSpeed *= localSpeed;
    });

    return resultSpeed;
  }, [globalSpeed, speedControls]);

  // Funções de time remapping
  const addTimeRemapping = useCallback(() => {
    const newRemapping: TimeRemapping = {
      id: `remap_${Date.now()}`,
      name: `Time Remap ${timeRemappings.length + 1}`,
      sourceStart: 0,
      sourceEnd: 10,
      targetStart: 0,
      targetEnd: 5,
      method: 'stretch',
      quality: 'preview',
      preservePitch: true,
      reverseTime: false
    };

    setTimeRemappings(prev => [...prev, newRemapping]);
    setSelectedRemapping(newRemapping.id);
  }, [timeRemappings.length]);

  // Loop de animação para métricas em tempo real
  useEffect(() => {
    if (isPlaying) {
      const animate = (timestamp: number) => {
        const deltaTime = timestamp - lastFrameTimeRef.current;
        lastFrameTimeRef.current = timestamp;

        const speed = getSpeedAtTime(currentTime);
        const frameTime = 1000 / timingSettings.fps;
        const adjustedDelta = deltaTime * speed * globalSpeed;

        setCurrentTime(prev => {
          const newTime = prev + adjustedDelta / 1000;
          return Math.min(newTime, playbackMetrics.totalTime);
        });

        // Atualizar métricas
        setPlaybackMetrics(prev => ({
          ...prev,
          currentFrame: timeToFrame(currentTime),
          currentTime,
          playbackSpeed: speed,
          actualFPS: deltaTime > 0 ? 1000 / deltaTime : 0,
          renderTime: deltaTime,
          droppedFrames: deltaTime > frameTime * 1.5 ? prev.droppedFrames + 1 : prev.droppedFrames
        }));

        if (currentTime < playbackMetrics.totalTime) {
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          setIsPlaying(false);
        }
      };

      lastFrameTimeRef.current = performance.now();
      animationFrameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, currentTime, getSpeedAtTime, globalSpeed, timingSettings.fps, playbackMetrics.totalTime, timeToFrame]);

  // Funções de controle de reprodução
  const togglePlayback = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const stopPlayback = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  const seekToFrame = useCallback((frame: number) => {
    const time = frameToTime(frame);
    setCurrentTime(Math.max(0, Math.min(time, playbackMetrics.totalTime)));
  }, [frameToTime, playbackMetrics.totalTime]);

  const stepFrame = useCallback((direction: 1 | -1) => {
    const currentFrame = timeToFrame(currentTime);
    seekToFrame(currentFrame + direction);
  }, [currentTime, timeToFrame, seekToFrame]);

  return (
    <div className="w-full h-full bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold">Controles de Velocidade e Timing</h2>
            <Badge variant="outline" className="text-green-400 border-green-400">
              {formatTimecode(currentTime)} • {getSpeedAtTime(currentTime).toFixed(2)}x
            </Badge>
          </div>

          {/* Controles de reprodução */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => stepFrame(-1)}
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
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
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
              onClick={() => stepFrame(1)}
              className="text-white border-gray-600 hover:bg-gray-700"
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Timeline de tempo */}
        <div className="mt-4 space-y-2">
          <Slider
            value={[currentTime]}
            onValueChange={([value]) => setCurrentTime(value)}
            max={playbackMetrics.totalTime}
            step={frameAccurate ? 1 / timingSettings.fps : 0.01}
            className="w-full"
          />
          
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>{formatTimecode(0)}</span>
            <span>Frame: {timeToFrame(currentTime)} / {playbackMetrics.totalFrames}</span>
            <span>{formatTimecode(playbackMetrics.totalTime)}</span>
          </div>
        </div>
      </div>

      {/* Área principal */}
      <div className="flex-1 flex">
        {/* Painel lateral */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
          <Tabs defaultValue="speed" className="flex-1">
            <TabsList className="grid w-full grid-cols-4 bg-gray-700">
              <TabsTrigger value="speed">Velocidade</TabsTrigger>
              <TabsTrigger value="timing">Timing</TabsTrigger>
              <TabsTrigger value="remap">Remap</TabsTrigger>
              <TabsTrigger value="metrics">Métricas</TabsTrigger>
            </TabsList>

            <TabsContent value="speed" className="flex-1 p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Controles de Velocidade</h3>
                  <Button
                    onClick={() => addSpeedControl()}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Zap className="w-4 h-4 mr-1" />
                    Adicionar
                  </Button>
                </div>

                {/* Velocidade global */}
                <Card className="bg-gray-700 border-gray-600">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <Label>Velocidade Global</Label>
                      <Slider
                        value={[globalSpeed]}
                        onValueChange={([value]) => setGlobalSpeed(value)}
                        min={0}
                        max={10}
                        step={0.1}
                        className="w-full"
                      />
                      <div className="flex items-center justify-between text-sm">
                        <span>{globalSpeed.toFixed(1)}x</span>
                        <div className="flex space-x-1">
                          {SPEED_PRESETS.map((preset) => (
                            <Button
                              key={preset.name}
                              variant="outline"
                              size="sm"
                              onClick={() => setGlobalSpeed(preset.speed)}
                              className="text-xs px-2 py-1 text-gray-300 border-gray-600 hover:bg-gray-600"
                            >
                              {preset.speed}x
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Lista de controles de velocidade */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {speedControls.map((control) => (
                    <Card 
                      key={control.id}
                      className={`bg-gray-700 border-gray-600 cursor-pointer transition-colors ${
                        selectedSpeedControl === control.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => setSelectedSpeedControl(control.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{control.name}</h4>
                            <p className="text-sm text-gray-400">
                              {control.type} • {control.startSpeed.toFixed(1)}x → {control.endSpeed.toFixed(1)}x
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSpeedControl(control.id);
                            }}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        {selectedSpeedControl === control.id && (
                          <div className="mt-3 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs">Início</Label>
                                <Input
                                  type="number"
                                  value={control.startSpeed}
                                  onChange={(e) => updateSpeedControl(control.id, { startSpeed: parseFloat(e.target.value) || 0 })}
                                  className="bg-gray-600 border-gray-500 text-white text-sm"
                                  step="0.1"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Fim</Label>
                                <Input
                                  type="number"
                                  value={control.endSpeed}
                                  onChange={(e) => updateSpeedControl(control.id, { endSpeed: parseFloat(e.target.value) || 0 })}
                                  className="bg-gray-600 border-gray-500 text-white text-sm"
                                  step="0.1"
                                />
                              </div>
                            </div>

                            <div>
                              <Label className="text-xs">Tipo</Label>
                              <Select
                                value={control.type}
                                onValueChange={(value) => {
                                  if (isSpeedControlType(value)) {
                                    updateSpeedControl(control.id, { type: value })
                                  }
                                }}
                              >
                                <SelectTrigger className="bg-gray-600 border-gray-500 text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="constant">Constante</SelectItem>
                                  <SelectItem value="ramp">Rampa</SelectItem>
                                  <SelectItem value="curve">Curva</SelectItem>
                                  <SelectItem value="keyframed">Keyframes</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="timing" className="flex-1 p-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Configurações de Timing</h3>
                
                <Card className="bg-gray-700 border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-sm">Frame Rate</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Select
                      value={timingSettings.fps.toString()}
                      onValueChange={(value) => {
                        const selectedRate = FRAME_RATES.find(rate => rate.fps.toString() === value);
                        if (selectedRate) {
                          setTimingSettings(prev => ({
                            ...prev,
                            fps: selectedRate.fps,
                            dropFrame: selectedRate.dropFrame
                          }));
                        }
                      }}
                    >
                      <SelectTrigger className="bg-gray-600 border-gray-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FRAME_RATES.map((rate) => (
                          <SelectItem key={rate.fps} value={rate.fps.toString()}>
                            {rate.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Drop Frame</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTimingSettings(prev => ({ ...prev, dropFrame: !prev.dropFrame }))}
                        className={timingSettings.dropFrame ? 'bg-yellow-600 text-white' : 'text-gray-300 border-gray-600'}
                      >
                        {timingSettings.dropFrame ? 'ON' : 'OFF'}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Frame Blending</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTimingSettings(prev => ({ ...prev, frameBlending: !prev.frameBlending }))}
                        className={timingSettings.frameBlending ? 'bg-green-600 text-white' : 'text-gray-300 border-gray-600'}
                      >
                        {timingSettings.frameBlending ? 'ON' : 'OFF'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-700 border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-sm">Timecode</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm">Formato</Label>
                      <Select
                        value={timecodeSettings.format}
                        onValueChange={(value) => {
                          if (isTimecodeFormat(value)) {
                            setTimecodeSettings(prev => ({ ...prev, format: value }))
                          }
                        }}
                      >
                        <SelectTrigger className="bg-gray-600 border-gray-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SMPTE">SMPTE</SelectItem>
                          <SelectItem value="frames">Frames</SelectItem>
                          <SelectItem value="seconds">Segundos</SelectItem>
                          <SelectItem value="milliseconds">Milissegundos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm">Timecode Inicial</Label>
                      <Input
                        value={timecodeSettings.startTimecode}
                        onChange={(e) => setTimecodeSettings(prev => ({ ...prev, startTimecode: e.target.value }))}
                        className="bg-gray-600 border-gray-500 text-white"
                        placeholder="00:00:00:00"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="remap" className="flex-1 p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Time Remapping</h3>
                  <Button
                    onClick={addTimeRemapping}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Clock className="w-4 h-4 mr-1" />
                    Adicionar
                  </Button>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {timeRemappings.map((remap) => (
                    <Card 
                      key={remap.id}
                      className={`bg-gray-700 border-gray-600 cursor-pointer transition-colors ${
                        selectedRemapping === remap.id ? 'ring-2 ring-purple-500' : ''
                      }`}
                      onClick={() => setSelectedRemapping(remap.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{remap.name}</h4>
                            <p className="text-sm text-gray-400">
                              {remap.method} • {remap.sourceEnd - remap.sourceStart}s → {remap.targetEnd - remap.targetStart}s
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTimeRemappings(prev => prev.filter(r => r.id !== remap.id));
                            }}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="metrics" className="flex-1 p-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Métricas de Performance</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-gray-700 border-gray-600">
                    <CardContent className="p-3">
                      <div className="flex items-center space-x-2">
                        <Activity className="w-4 h-4 text-green-400" />
                        <div>
                          <p className="text-sm text-gray-400">FPS Atual</p>
                          <p className="text-lg font-bold">{playbackMetrics.actualFPS.toFixed(1)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-700 border-gray-600">
                    <CardContent className="p-3">
                      <div className="flex items-center space-x-2">
                        <Timer className="w-4 h-4 text-blue-400" />
                        <div>
                          <p className="text-sm text-gray-400">Render Time</p>
                          <p className="text-lg font-bold">{playbackMetrics.renderTime.toFixed(1)}ms</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-700 border-gray-600">
                    <CardContent className="p-3">
                      <div className="flex items-center space-x-2">
                        <TrendingDown className="w-4 h-4 text-red-400" />
                        <div>
                          <p className="text-sm text-gray-400">Frames Perdidos</p>
                          <p className="text-lg font-bold">{playbackMetrics.droppedFrames}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-700 border-gray-600">
                    <CardContent className="p-3">
                      <div className="flex items-center space-x-2">
                        <Gauge className="w-4 h-4 text-yellow-400" />
                        <div>
                          <p className="text-sm text-gray-400">CPU Usage</p>
                          <p className="text-lg font-bold">{playbackMetrics.cpuUsage}%</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-gray-700 border-gray-600">
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Reprodução em Tempo Real</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRealTimePlayback(!realTimePlayback)}
                          className={realTimePlayback ? 'bg-green-600 text-white' : 'text-gray-300 border-gray-600'}
                        >
                          {realTimePlayback ? 'ON' : 'OFF'}
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Frame Accurate</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setFrameAccurate(!frameAccurate)}
                          className={frameAccurate ? 'bg-blue-600 text-white' : 'text-gray-300 border-gray-600'}
                        >
                          {frameAccurate ? 'ON' : 'OFF'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Área principal - Visualização da timeline de velocidade */}
        <div className="flex-1 bg-gray-900 flex flex-col">
          <div className="bg-gray-800 border-b border-gray-700 p-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold">Timeline de Velocidade</h3>
              <Badge variant="outline" className="text-blue-400 border-blue-400">
                Velocidade Atual: {getSpeedAtTime(currentTime).toFixed(2)}x
              </Badge>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-gray-300 border-gray-600 hover:bg-gray-700"
            >
              <Settings className="w-4 h-4 mr-1" />
              {showAdvanced ? 'Ocultar' : 'Avançado'}
            </Button>
          </div>

          <div className="flex-1 p-4">
            <div className="h-64 bg-gray-800 rounded border border-gray-700 relative overflow-hidden">
              {/* Gráfico de velocidade */}
              <svg className="w-full h-full">
                {/* Linha base (velocidade 1x) */}
                <line
                  x1="0"
                  y1="50%"
                  x2="100%"
                  y2="50%"
                  stroke="#4B5563"
                  strokeWidth="1"
                  strokeDasharray="5,5"
                />

                {/* Curva de velocidade global */}
                <line
                  x1="0"
                  y1={`${50 - (globalSpeed - 1) * 20}%`}
                  x2="100%"
                  y2={`${50 - (globalSpeed - 1) * 20}%`}
                  stroke="#3B82F6"
                  strokeWidth="2"
                />

                {/* Controles de velocidade */}
                {speedControls.map((control, index) => {
                  const startX = (control.startTime / playbackMetrics.totalTime) * 100;
                  const endX = (control.endTime / playbackMetrics.totalTime) * 100;
                  const startY = 50 - (control.startSpeed - 1) * 20;
                  const endY = 50 - (control.endSpeed - 1) * 20;

                  return (
                    <g key={control.id}>
                      <line
                        x1={`${startX}%`}
                        y1={`${startY}%`}
                        x2={`${endX}%`}
                        y2={`${endY}%`}
                        stroke={control.enabled ? '#10B981' : '#6B7280'}
                        strokeWidth="3"
                        opacity={selectedSpeedControl === control.id ? 1 : 0.7}
                      />
                      <circle
                        cx={`${startX}%`}
                        cy={`${startY}%`}
                        r="4"
                        fill={control.enabled ? '#10B981' : '#6B7280'}
                      />
                      <circle
                        cx={`${endX}%`}
                        cy={`${endY}%`}
                        r="4"
                        fill={control.enabled ? '#10B981' : '#6B7280'}
                      />
                    </g>
                  );
                })}

                {/* Indicador de tempo atual */}
                <line
                  x1={`${(currentTime / playbackMetrics.totalTime) * 100}%`}
                  y1="0"
                  x2={`${(currentTime / playbackMetrics.totalTime) * 100}%`}
                  y2="100%"
                  stroke="#EF4444"
                  strokeWidth="2"
                />
              </svg>

              {/* Labels de velocidade */}
              <div className="absolute left-2 top-2 text-xs text-gray-400">5x</div>
              <div className="absolute left-2 top-1/2 text-xs text-gray-400">1x</div>
              <div className="absolute left-2 bottom-2 text-xs text-gray-400">0x</div>
            </div>

            {showAdvanced && (
              <div className="mt-4 grid grid-cols-3 gap-4">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-sm">Motion Blur</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Ativado</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTimingSettings(prev => ({ ...prev, motionBlur: !prev.motionBlur }))}
                        className={timingSettings.motionBlur ? 'bg-blue-600 text-white' : 'text-gray-300 border-gray-600'}
                      >
                        {timingSettings.motionBlur ? 'ON' : 'OFF'}
                      </Button>
                    </div>
                    <div>
                      <Label className="text-sm">Shutter Angle</Label>
                      <Slider
                        value={[timingSettings.shutterAngle]}
                        onValueChange={([value]) => setTimingSettings(prev => ({ ...prev, shutterAngle: value }))}
                        min={0}
                        max={360}
                        step={1}
                        className="w-full"
                      />
                      <div className="text-xs text-gray-400 text-center">{timingSettings.shutterAngle}°</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-sm">Pulldown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Select
                      value={timingSettings.pulldown}
                      onValueChange={(value) => {
                        if (isPulldownOption(value)) {
                          setTimingSettings(prev => ({ ...prev, pulldown: value }))
                        }
                      }}
                    >
                      <SelectTrigger className="bg-gray-700 border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        <SelectItem value="2:3">2:3 Pulldown</SelectItem>
                        <SelectItem value="3:2">3:2 Pulldown</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-sm">Qualidade</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Select defaultValue="preview">
                      <SelectTrigger className="bg-gray-700 border-gray-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Rascunho</SelectItem>
                        <SelectItem value="preview">Preview</SelectItem>
                        <SelectItem value="best">Melhor</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="bg-gray-800 border-t border-gray-700 p-2 flex items-center justify-between text-sm text-gray-400">
        <div className="flex items-center space-x-4">
          <span>Velocidade: {getSpeedAtTime(currentTime).toFixed(2)}x</span>
          <span>Frame: {timeToFrame(currentTime)}</span>
          <span>Timecode: {formatTimecode(currentTime)}</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>FPS: {timingSettings.fps}</span>
          <span>Controles: {speedControls.length}</span>
          <span>Remaps: {timeRemappings.length}</span>
        </div>
      </div>
    </div>
  );
}