// TODO: Fixar audio element ref types
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  Square, 
  SkipBack, 
  SkipForward,
  Volume2,
  VolumeX,
  Activity as Waveform,
  Eye,
  Settings,
  Download,
  Upload,
  Zap,
  Target,
  Clock,
  BarChart3,
  Layers
} from 'lucide-react';
import { toast } from 'sonner';

// Interfaces
interface AudioData {
  url: string;
  duration: number;
  waveform: number[];
  sampleRate: number;
}

interface VisemeFrame {
  timestamp: number;
  viseme: string;
  intensity: number;
  duration: number;
}

interface PhonemeSegment {
  start: number;
  end: number;
  phoneme: string;
  confidence: number;
}

interface BlendShape {
  name: string;
  value: number;
  target: string;
}

interface SyncData {
  visemes: VisemeFrame[];
  phonemes: PhonemeSegment[];
  blendShapes: BlendShape[];
  emotions: EmotionFrame[];
  breathing: BreathingEvent[];
}

interface EmotionFrame {
  timestamp: number;
  emotion: 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised' | 'fear';
  intensity: number;
}

interface BreathingEvent {
  timestamp: number;
  type: 'inhale' | 'exhale' | 'pause';
  intensity: number;
}

interface SyncSettings {
  sensitivity: number;
  smoothing: number;
  emotionDetection: boolean;
  breathingDetection: boolean;
  microExpressions: boolean;
  lipSyncAccuracy: 'fast' | 'balanced' | 'precise';
}

export default function SyncEditor() {
  // Estados
  const [audioData, setAudioData] = useState<AudioData | null>(null);
  const [syncData, setSyncData] = useState<SyncData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [selectedViseme, setSelectedViseme] = useState<VisemeFrame | null>(null);
  const [settings, setSettings] = useState<SyncSettings>({
    sensitivity: 0.8,
    smoothing: 0.6,
    emotionDetection: true,
    breathingDetection: true,
    microExpressions: false,
    lipSyncAccuracy: 'balanced'
  });
  const [zoom, setZoom] = useState(1);
  const [viewMode, setViewMode] = useState<'waveform' | 'visemes' | 'phonemes' | 'emotions'>('waveform');

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);

  // Carregar arquivo de áudio
  const handleAudioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    
    // Simular carregamento e análise do áudio
    const mockAudioData: AudioData = {
      url,
      duration: 30, // 30 segundos
      waveform: Array.from({ length: 1000 }, () => Math.random() * 100),
      sampleRate: 44100
    };

    setAudioData(mockAudioData);
    toast.success('Áudio carregado com sucesso!');
  };

  // Processar sincronização
  const processSynchronization = async () => {
    if (!audioData) {
      toast.error('Carregue um arquivo de áudio primeiro');
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      // Simular processamento com progresso
      const steps = [
        'Analisando áudio...',
        'Extraindo características MFCC...',
        'Detectando fonemas...',
        'Mapeando visemas...',
        'Gerando blend shapes...',
        'Detectando emoções...',
        'Aplicando suavização...',
        'Finalizando...'
      ];

      for (let i = 0; i < steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setProcessingProgress(((i + 1) / steps.length) * 100);
        toast.info(steps[i]);
      }

      // Gerar dados de sincronização simulados
      const mockSyncData: SyncData = {
        visemes: generateMockVisemes(audioData.duration),
        phonemes: generateMockPhonemes(audioData.duration),
        blendShapes: generateMockBlendShapes(),
        emotions: generateMockEmotions(audioData.duration),
        breathing: generateMockBreathing(audioData.duration)
      };

      setSyncData(mockSyncData);
      toast.success('Sincronização processada com sucesso!');

    } catch (error) {
      toast.error('Erro ao processar sincronização');
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  // Gerar dados simulados
  const generateMockVisemes = (duration: number): VisemeFrame[] => {
    const visemes = ['sil', 'aa', 'ae', 'ah', 'ao', 'aw', 'ay', 'b', 'ch', 'd', 'dh', 'eh', 'er', 'ey', 'f', 'g', 'hh', 'ih', 'iy', 'jh', 'k', 'l', 'm', 'n', 'ng', 'ow', 'oy', 'p', 'r', 's', 'sh', 't', 'th', 'uh', 'uw', 'v', 'w', 'y', 'z', 'zh'];
    const frames: VisemeFrame[] = [];
    
    for (let t = 0; t < duration; t += 0.1) {
      frames.push({
        timestamp: t,
        viseme: visemes[Math.floor(Math.random() * visemes.length)],
        intensity: Math.random() * 0.8 + 0.2,
        duration: 0.1
      });
    }
    
    return frames;
  };

  const generateMockPhonemes = (duration: number): PhonemeSegment[] => {
    const phonemes = ['p', 'b', 't', 'd', 'k', 'g', 'f', 'v', 's', 'z', 'ʃ', 'ʒ', 'm', 'n', 'ŋ', 'l', 'r', 'a', 'e', 'i', 'o', 'u'];
    const segments: PhonemeSegment[] = [];
    
    let currentTime = 0;
    while (currentTime < duration) {
      const segmentDuration = Math.random() * 0.3 + 0.1;
      segments.push({
        start: currentTime,
        end: Math.min(currentTime + segmentDuration, duration),
        phoneme: phonemes[Math.floor(Math.random() * phonemes.length)],
        confidence: Math.random() * 0.4 + 0.6
      });
      currentTime += segmentDuration;
    }
    
    return segments;
  };

  const generateMockBlendShapes = (): BlendShape[] => {
    const shapes = [
      'mouthOpen', 'mouthSmile', 'mouthFrown', 'eyeBlinkLeft', 'eyeBlinkRight',
      'browInnerUp', 'browDownLeft', 'browDownRight', 'cheekPuff', 'jawOpen'
    ];
    
    return shapes.map(name => ({
      name,
      value: Math.random(),
      target: name
    }));
  };

  const generateMockEmotions = (duration: number): EmotionFrame[] => {
    const emotions: EmotionFrame['emotion'][] = ['neutral', 'happy', 'sad', 'angry', 'surprised', 'fear'];
    const frames: EmotionFrame[] = [];
    
    for (let t = 0; t < duration; t += 1) {
      frames.push({
        timestamp: t,
        emotion: emotions[Math.floor(Math.random() * emotions.length)],
        intensity: Math.random() * 0.8 + 0.2
      });
    }
    
    return frames;
  };

  const generateMockBreathing = (duration: number): BreathingEvent[] => {
    const events: BreathingEvent[] = [];
    const types: BreathingEvent['type'][] = ['inhale', 'exhale', 'pause'];
    
    for (let t = 0; t < duration; t += Math.random() * 3 + 1) {
      events.push({
        timestamp: t,
        type: types[Math.floor(Math.random() * types.length)],
        intensity: Math.random() * 0.6 + 0.4
      });
    }
    
    return events;
  };

  // Controles de reprodução
  const togglePlayback = () => {
    if (!audioRef.current || !audioData) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const stopPlayback = () => {
    if (!audioRef.current) return;
    
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const seekTo = (time: number) => {
    if (!audioRef.current || !audioData) return;
    
    const clampedTime = Math.max(0, Math.min(time, audioData.duration));
    audioRef.current.currentTime = clampedTime;
    setCurrentTime(clampedTime);
  };

  // Atualizar tempo atual
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioData]);

  // Atualizar volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Renderizar timeline
  const renderTimeline = () => {
    if (!audioData || !syncData) return null;

    const timelineWidth = 800;
    const pixelsPerSecond = timelineWidth / audioData.duration;

    return (
      <div className="relative bg-muted rounded-lg p-4 overflow-x-auto">
        <div className="relative" style={{ width: timelineWidth, height: 200 }}>
          {/* Waveform */}
          {viewMode === 'waveform' && (
            <div className="absolute inset-0">
              <canvas
                ref={canvasRef}
                width={timelineWidth}
                height={200}
                className="w-full h-full"
              />
            </div>
          )}

          {/* Visemes */}
          {viewMode === 'visemes' && (
            <div className="absolute inset-0">
              {syncData.visemes.map((viseme, index) => (
                <div
                  key={index}
                  className={`absolute bg-blue-500/30 border border-blue-500 rounded cursor-pointer hover:bg-blue-500/50 ${
                    selectedViseme === viseme ? 'bg-blue-500/70' : ''
                  }`}
                  style={{
                    left: viseme.timestamp * pixelsPerSecond,
                    width: viseme.duration * pixelsPerSecond,
                    height: viseme.intensity * 100,
                    top: 200 - viseme.intensity * 100
                  }}
                  onClick={() => setSelectedViseme(viseme)}
                  title={`${viseme.viseme} (${viseme.intensity.toFixed(2)})`}
                />
              ))}
            </div>
          )}

          {/* Phonemes */}
          {viewMode === 'phonemes' && (
            <div className="absolute inset-0">
              {syncData.phonemes.map((phoneme, index) => (
                <div
                  key={index}
                  className="absolute bg-green-500/30 border border-green-500 rounded text-xs flex items-center justify-center"
                  style={{
                    left: phoneme.start * pixelsPerSecond,
                    width: (phoneme.end - phoneme.start) * pixelsPerSecond,
                    height: phoneme.confidence * 100,
                    top: 200 - phoneme.confidence * 100
                  }}
                  title={`${phoneme.phoneme} (${phoneme.confidence.toFixed(2)})`}
                >
                  {phoneme.phoneme}
                </div>
              ))}
            </div>
          )}

          {/* Emotions */}
          {viewMode === 'emotions' && (
            <div className="absolute inset-0">
              {syncData.emotions.map((emotion, index) => (
                <div
                  key={index}
                  className="absolute bg-purple-500/30 border border-purple-500 rounded text-xs flex items-center justify-center"
                  style={{
                    left: emotion.timestamp * pixelsPerSecond,
                    width: pixelsPerSecond,
                    height: emotion.intensity * 100,
                    top: 200 - emotion.intensity * 100
                  }}
                  title={`${emotion.emotion} (${emotion.intensity.toFixed(2)})`}
                >
                  {emotion.emotion}
                </div>
              ))}
            </div>
          )}

          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
            style={{ left: currentTime * pixelsPerSecond }}
          />

          {/* Time markers */}
          <div className="absolute bottom-0 left-0 right-0 h-4 border-t">
            {Array.from({ length: Math.ceil(audioData.duration) + 1 }, (_, i) => (
              <div
                key={i}
                className="absolute text-xs text-muted-foreground"
                style={{ left: i * pixelsPerSecond }}
              >
                {i}s
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Exportar dados
  const exportSyncData = () => {
    if (!syncData) {
      toast.error('Nenhum dado de sincronização para exportar');
      return;
    }

    const dataStr = JSON.stringify(syncData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sync-data.json';
    link.click();
    
    URL.revokeObjectURL(url);
    toast.success('Dados exportados com sucesso!');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Editor de Sincronização</h1>
          <p className="text-muted-foreground">
            Edite e ajuste a sincronização labial com precisão
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportSyncData} disabled={!syncData}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </Button>
        </div>
      </div>

      {/* Upload de Áudio */}
      {!audioData && (
        <Card>
          <CardHeader>
            <CardTitle>Carregar Áudio</CardTitle>
            <CardDescription>
              Faça upload de um arquivo de áudio para começar a edição
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Arraste um arquivo de áudio aqui</h3>
              <p className="text-muted-foreground mb-4">
                Suporta MP3, WAV, M4A e outros formatos
              </p>
              <Label htmlFor="audio-upload">
                <Button variant="outline" className="cursor-pointer">
                  Selecionar Arquivo
                </Button>
                <Input
                  id="audio-upload"
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioUpload}
                  className="hidden"
                />
              </Label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Interface Principal */}
      {audioData && (
        <>
          {/* Controles de Reprodução */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => seekTo(currentTime - 5)}
                  >
                    <SkipBack className="w-4 h-4" />
                  </Button>
                  
                  <Button onClick={togglePlayback}>
                    {isPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>
                  
                  <Button variant="outline" size="sm" onClick={stopPlayback}>
                    <Square className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => seekTo(currentTime + 5)}
                  >
                    <SkipForward className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsMuted(!isMuted)}
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </Button>
                    <Slider
                      value={[isMuted ? 0 : volume * 100]}
                      onValueChange={([value]) => {
                        setVolume(value / 100);
                        setIsMuted(value === 0);
                      }}
                      max={100}
                      step={1}
                      className="w-20"
                    />
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(1).padStart(4, '0')} / {Math.floor(audioData.duration / 60)}:{(audioData.duration % 60).toFixed(1).padStart(4, '0')}
                  </div>
                </div>
              </div>

              {/* Barra de Progresso */}
              <div className="space-y-2">
                <Slider
                  value={[currentTime]}
                  onValueChange={([value]) => seekTo(value)}
                  max={audioData.duration}
                  step={0.1}
                  className="w-full"
                />
                <Progress value={(currentTime / audioData.duration) * 100} />
              </div>
            </CardContent>
          </Card>

          {/* Processamento */}
          {!syncData && (
            <Card>
              <CardHeader>
                <CardTitle>Processar Sincronização</CardTitle>
                <CardDescription>
                  Analise o áudio e gere dados de sincronização labial
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Precisão da Sincronização</Label>
                    <div className="flex gap-2 mt-1">
                      {(['fast', 'balanced', 'precise'] as const).map((mode) => (
                        <Button
                          key={mode}
                          variant={settings.lipSyncAccuracy === mode ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSettings(prev => ({ ...prev, lipSyncAccuracy: mode }))}
                        >
                          {mode === 'fast' && 'Rápido'}
                          {mode === 'balanced' && 'Balanceado'}
                          {mode === 'precise' && 'Preciso'}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label>Sensibilidade: {settings.sensitivity.toFixed(1)}</Label>
                    <Slider
                      value={[settings.sensitivity * 100]}
                      onValueChange={([value]) => setSettings(prev => ({ ...prev, sensitivity: value / 100 }))}
                      max={100}
                      step={1}
                      className="mt-1"
                    />
                  </div>
                </div>

                {isProcessing && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Processando...</span>
                      <span>{Math.round(processingProgress)}%</span>
                    </div>
                    <Progress value={processingProgress} />
                  </div>
                )}

                <Button 
                  onClick={processSynchronization} 
                  disabled={isProcessing}
                  className="w-full"
                >
                  {isProcessing ? (
                    <>
                      <Zap className="w-4 h-4 mr-2 animate-pulse" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Target className="w-4 h-4 mr-2" />
                      Processar Sincronização
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Timeline e Edição */}
          {syncData && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Timeline de Sincronização</CardTitle>
                    <CardDescription>
                      Visualize e edite os dados de sincronização
                    </CardDescription>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Label>Visualização:</Label>
                    <div className="flex gap-1">
                      {([
                        { mode: 'waveform', icon: Waveform, label: 'Waveform' },
                        { mode: 'visemes', icon: Eye, label: 'Visemas' },
                        { mode: 'phonemes', icon: BarChart3, label: 'Fonemas' },
                        { mode: 'emotions', icon: Layers, label: 'Emoções' }
                      ] as const).map(({ mode, icon: Icon, label }) => (
                        <Button
                          key={mode}
                          variant={viewMode === mode ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setViewMode(mode)}
                          title={label}
                        >
                          <Icon className="w-4 h-4" />
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {renderTimeline()}
              </CardContent>
            </Card>
          )}

          {/* Detalhes do Visema Selecionado */}
          {selectedViseme && (
            <Card>
              <CardHeader>
                <CardTitle>Detalhes do Visema</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Visema</Label>
                    <Input value={selectedViseme.viseme} readOnly />
                  </div>
                  <div>
                    <Label>Timestamp</Label>
                    <Input value={`${selectedViseme.timestamp.toFixed(2)}s`} readOnly />
                  </div>
                  <div>
                    <Label>Intensidade</Label>
                    <Input value={selectedViseme.intensity.toFixed(2)} readOnly />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Estatísticas */}
          {syncData && (
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas de Sincronização</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">{syncData.visemes.length}</div>
                    <div className="text-sm text-muted-foreground">Visemas</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{syncData.phonemes.length}</div>
                    <div className="text-sm text-muted-foreground">Fonemas</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {(syncData.phonemes.reduce((sum, p) => sum + p.confidence, 0) / syncData.phonemes.length * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Confiança Média</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{syncData.emotions.length}</div>
                    <div className="text-sm text-muted-foreground">Frames de Emoção</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Áudio Element */}
      {audioData && (
        <audio
          ref={audioRef}
          src={audioData.url}
          onLoadedMetadata={() => {
            if (audioRef.current) {
              setCurrentTime(0);
            }
          }}
        />
      )}
    </div>
  );
}
