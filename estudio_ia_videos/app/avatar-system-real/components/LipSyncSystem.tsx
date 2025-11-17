'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Mic, 
  Play, 
  Pause, 
  Square, 
  Upload,
  Download,
  Volume2,
  Mic,
  Settings,
  Eye,
  RotateCcw
} from 'lucide-react';

interface Phoneme {
  phoneme: string;
  start: number;
  end: number;
  viseme: string;
  intensity: number;
}

interface LipSyncData {
  duration: number;
  phonemes: Phoneme[];
  visemes: Record<string, number>[];
  sampleRate: number;
  frameRate: number;
}

interface LipSyncSystemProps {
  avatar?: any;
  onLipSyncGenerated?: (lipSyncData: LipSyncData) => void;
}

export default function LipSyncSystem({ avatar, onLipSyncGenerated }: LipSyncSystemProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [lipSyncData, setLipSyncData] = useState<LipSyncData | null>(null);
  
  // Configurações
  const [sensitivity, setSensitivity] = useState(0.8);
  const [smoothing, setSmoothing] = useState(0.6);
  const [frameRate, setFrameRate] = useState(30);
  const [visemeIntensity, setVisemeIntensity] = useState(1.0);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  // Mapeamento de visemas para blend shapes
  const visemeMapping = {
    'sil': { jawOpen: 0, mouthSmile: 0, mouthPucker: 0 }, // Silêncio
    'PP': { jawOpen: 0.1, mouthSmile: 0, mouthPucker: 0.8 }, // P, B, M
    'FF': { jawOpen: 0.2, mouthSmile: 0, mouthPucker: 0.3 }, // F, V
    'TH': { jawOpen: 0.3, mouthSmile: 0, mouthPucker: 0.1 }, // TH
    'DD': { jawOpen: 0.4, mouthSmile: 0, mouthPucker: 0 }, // T, D, N, L
    'kk': { jawOpen: 0.3, mouthSmile: 0, mouthPucker: 0 }, // K, G
    'CH': { jawOpen: 0.2, mouthSmile: 0.2, mouthPucker: 0.4 }, // CH, SH, J
    'SS': { jawOpen: 0.1, mouthSmile: 0.3, mouthPucker: 0 }, // S, Z
    'nn': { jawOpen: 0.2, mouthSmile: 0, mouthPucker: 0 }, // N, NG
    'RR': { jawOpen: 0.3, mouthSmile: 0, mouthPucker: 0.2 }, // R
    'aa': { jawOpen: 0.8, mouthSmile: 0, mouthPucker: 0 }, // A
    'E': { jawOpen: 0.4, mouthSmile: 0.3, mouthPucker: 0 }, // E
    'I': { jawOpen: 0.2, mouthSmile: 0.6, mouthPucker: 0 }, // I
    'O': { jawOpen: 0.6, mouthSmile: 0, mouthPucker: 0.7 }, // O
    'U': { jawOpen: 0.3, mouthSmile: 0, mouthPucker: 0.9 }  // U
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const file = new File([blob], 'recording.wav', { type: 'audio/wav' });
        setAudioFile(file);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      alert('Erro ao acessar o microfone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAudioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAudioFile(file);
      setAudioUrl(URL.createObjectURL(file));
    }
  };

  const processLipSync = async () => {
    if (!audioFile) {
      alert('Por favor, forneça um arquivo de áudio');
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      const steps = [
        'Carregando arquivo de áudio...',
        'Analisando frequências...',
        'Detectando fonemas...',
        'Mapeando visemas...',
        'Calculando intensidades...',
        'Gerando keyframes...',
        'Aplicando suavização...',
        'Finalizando...'
      ];

      for (let i = 0; i < steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setProcessingProgress(((i + 1) / steps.length) * 100);
      }

      // Simular análise de áudio e geração de lip-sync
      const audioDuration = 10; // Simular duração
      const phonemes: Phoneme[] = [];
      const visemes: Record<string, number>[] = [];

      // Gerar dados simulados de fonemas
      const phonemeTypes = ['sil', 'PP', 'FF', 'DD', 'aa', 'E', 'I', 'O', 'U', 'SS', 'RR'];
      
      for (let t = 0; t < audioDuration; t += 0.1) {
        const randomPhoneme = phonemeTypes[Math.floor(Math.random() * phonemeTypes.length)];
        const intensity = Math.random() * sensitivity;
        
        phonemes.push({
          phoneme: randomPhoneme,
          start: t,
          end: t + 0.1,
          viseme: randomPhoneme,
          intensity
        });

        // Converter para blend shapes
        const baseViseme = visemeMapping[randomPhoneme as keyof typeof visemeMapping] || visemeMapping.sil;
        const visemeFrame: Record<string, number> = {};
        
        Object.entries(baseViseme).forEach(([key, value]) => {
          visemeFrame[key] = value * intensity * visemeIntensity;
        });

        visemes.push(visemeFrame);
      }

      const lipSyncResult: LipSyncData = {
        duration: audioDuration,
        phonemes,
        visemes,
        sampleRate: 44100,
        frameRate
      };

      setLipSyncData(lipSyncResult);
      setDuration(audioDuration);
      onLipSyncGenerated?.(lipSyncResult);

    } catch (error) {
      console.error('Erro ao processar lip-sync:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const playLipSync = () => {
    if (!lipSyncData || !audioRef.current) return;
    
    audioRef.current.play();
    setIsPlaying(true);
    setCurrentTime(0);

    const updateTime = () => {
      if (audioRef.current && isPlaying) {
        const time = audioRef.current.currentTime;
        setCurrentTime(time);
        
        // Aplicar visemas baseado no tempo atual
        const frameIndex = Math.floor(time * frameRate);
        if (frameIndex < lipSyncData.visemes.length) {
          const currentViseme = lipSyncData.visemes[frameIndex];
          // Aqui você aplicaria os valores aos blend shapes do avatar
          console.log('Aplicando viseme:', currentViseme);
        }
        
        if (time < duration) {
          animationFrameRef.current = requestAnimationFrame(updateTime);
        } else {
          setIsPlaying(false);
        }
      }
    };

    animationFrameRef.current = requestAnimationFrame(updateTime);
  };

  const stopLipSync = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTime(0);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const exportLipSync = (format: 'json' | 'csv' | 'fbx') => {
    if (!lipSyncData) return;
    
    let data: string;
    let filename: string;
    let mimeType: string;

    switch (format) {
      case 'json':
        data = JSON.stringify(lipSyncData, null, 2);
        filename = 'lipsync_data.json';
        mimeType = 'application/json';
        break;
      case 'csv':
        const csvHeader = 'time,phoneme,viseme,intensity,jawOpen,mouthSmile,mouthPucker\n';
        const csvRows = lipSyncData.phonemes.map((phoneme, index) => {
          const viseme = lipSyncData.visemes[index] || {};
          return `${phoneme.start},${phoneme.phoneme},${phoneme.viseme},${phoneme.intensity},${viseme.jawOpen || 0},${viseme.mouthSmile || 0},${viseme.mouthPucker || 0}`;
        }).join('\n');
        data = csvHeader + csvRows;
        filename = 'lipsync_data.csv';
        mimeType = 'text/csv';
        break;
      case 'fbx':
        data = JSON.stringify(lipSyncData, null, 2); // Simplificado para demo
        filename = 'lipsync_animation.fbx';
        mimeType = 'application/octet-stream';
        break;
      default:
        return;
    }
    
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  // Visualização da forma de onda
  useEffect(() => {
    if (lipSyncData && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      
      ctx.clearRect(0, 0, width, height);
      
      // Desenhar forma de onda simulada
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      lipSyncData.phonemes.forEach((phoneme, index) => {
        const x = (phoneme.start / duration) * width;
        const y = height / 2 + (Math.sin(index * 0.5) * phoneme.intensity * height * 0.3);
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
      
      // Desenhar indicador de tempo atual
      if (isPlaying) {
        const currentX = (currentTime / duration) * width;
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(currentX, 0);
        ctx.lineTo(currentX, height);
        ctx.stroke();
      }
    }
  }, [lipSyncData, currentTime, isPlaying, duration]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Sistema de Sincronização Labial (Lip-Sync)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Controles de Entrada */}
            <div className="space-y-4">
              <Tabs defaultValue="upload" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="upload">Upload</TabsTrigger>
                  <TabsTrigger value="record">Gravar</TabsTrigger>
                  <TabsTrigger value="settings">Config</TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="space-y-4">
                  <div>
                    <Label>Upload de Áudio</Label>
                    <div className="mt-2">
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={handleAudioUpload}
                        className="hidden"
                        id="audio-upload"
                      />
                      <label
                        htmlFor="audio-upload"
                        className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400"
                      >
                        <div className="text-center">
                          <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm text-gray-600">
                            {audioFile ? audioFile.name : 'Clique para fazer upload de áudio'}
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {audioFile && (
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Volume2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-800">Áudio carregado: {audioFile.name}</span>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="record" className="space-y-4">
                  <div className="text-center">
                    <div className="mb-4">
                      <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${isRecording ? 'bg-red-100 animate-pulse' : 'bg-gray-100'}`}>
                        <Mic className={`h-10 w-10 ${isRecording ? 'text-red-600' : 'text-gray-400'}`} />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {!isRecording ? (
                        <Button onClick={startRecording} className="w-full">
                          <Mic className="h-4 w-4 mr-2" />
                          Iniciar Gravação
                        </Button>
                      ) : (
                        <Button onClick={stopRecording} variant="destructive" className="w-full">
                          <Square className="h-4 w-4 mr-2" />
                          Parar Gravação
                        </Button>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                  <div>
                    <Label>Sensibilidade: {Math.round(sensitivity * 100)}%</Label>
                    <Slider
                      value={[sensitivity]}
                      onValueChange={(value) => setSensitivity(value[0])}
                      min={0.1}
                      max={1}
                      step={0.1}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Suavização: {Math.round(smoothing * 100)}%</Label>
                    <Slider
                      value={[smoothing]}
                      onValueChange={(value) => setSmoothing(value[0])}
                      min={0}
                      max={1}
                      step={0.1}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Taxa de Quadros: {frameRate} fps</Label>
                    <Slider
                      value={[frameRate]}
                      onValueChange={(value) => setFrameRate(value[0])}
                      min={15}
                      max={60}
                      step={15}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Intensidade dos Visemas: {Math.round(visemeIntensity * 100)}%</Label>
                    <Slider
                      value={[visemeIntensity]}
                      onValueChange={(value) => setVisemeIntensity(value[0])}
                      min={0.1}
                      max={2}
                      step={0.1}
                      className="mt-2"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex gap-2">
                <Button 
                  onClick={processLipSync} 
                  disabled={isProcessing || !audioFile}
                  className="flex-1"
                >
                  {isProcessing ? (
                    <>
                      <Mic className="h-4 w-4 mr-2 animate-pulse" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4 mr-2" />
                      Processar Lip-Sync
                    </>
                  )}
                </Button>
              </div>

              {isProcessing && (
                <div className="space-y-2">
                  <Progress value={processingProgress} />
                  <p className="text-xs text-gray-500 text-center">
                    {Math.round(processingProgress)}% - Analisando áudio...
                  </p>
                </div>
              )}
            </div>

            {/* Visualização e Controles */}
            <div className="space-y-4">
              {/* Forma de Onda */}
              <div className="bg-gray-50 rounded-lg p-4">
                <Label className="text-sm font-medium mb-2 block">Forma de Onda</Label>
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={100}
                  className="w-full h-24 bg-white rounded border"
                />
              </div>

              {/* Preview do Avatar */}
              <div className="aspect-square bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center relative overflow-hidden">
                {avatar ? (
                  <div className="w-full h-full relative">
                    <div 
                      className="w-full h-full flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                    >
                      <div className="text-white text-center">
                        <Eye className="h-16 w-16 mx-auto mb-4" />
                        <p className="text-sm">Avatar com Lip-Sync</p>
                      </div>
                    </div>
                    
                    {lipSyncData && (
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="bg-black/50 rounded-lg p-2 text-white text-xs">
                          <div className="flex justify-between items-center mb-1">
                            <span>Lip-Sync Ativo</span>
                            <span>{currentTime.toFixed(1)}s / {duration.toFixed(1)}s</span>
                          </div>
                          <div className="w-full bg-gray-600 rounded-full h-1">
                            <div 
                              className="bg-blue-500 h-1 rounded-full transition-all duration-100"
                              style={{ width: `${(currentTime / duration) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    <Volume2 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Selecione um avatar para preview</p>
                  </div>
                )}
              </div>

              {/* Controles de Reprodução */}
              {lipSyncData && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Button 
                      onClick={playLipSync} 
                      disabled={isPlaying}
                      variant="outline"
                      size="sm"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Play
                    </Button>
                    <Button 
                      onClick={stopLipSync}
                      variant="outline"
                      size="sm"
                    >
                      <Square className="h-4 w-4 mr-1" />
                      Stop
                    </Button>
                    <Button 
                      onClick={() => setCurrentTime(0)}
                      variant="outline"
                      size="sm"
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Reset
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-gray-50 p-2 rounded">
                      <span className="font-medium">Duração:</span> {duration.toFixed(1)}s
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <span className="font-medium">Fonemas:</span> {lipSyncData.phonemes.length}
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <span className="font-medium">Taxa:</span> {frameRate} fps
                    </div>
                    <div className="bg-gray-50 p-2 rounded">
                      <span className="font-medium">Precisão:</span> {Math.round(sensitivity * 100)}%
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => exportLipSync('json')}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      JSON
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => exportLipSync('csv')}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      CSV
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => exportLipSync('fbx')}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      FBX
                    </Button>
                  </div>
                </div>
              )}

              {/* Player de Áudio */}
              {audioUrl && (
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onLoadedMetadata={() => {
                    if (audioRef.current) {
                      setDuration(audioRef.current.duration);
                    }
                  }}
                  onEnded={() => setIsPlaying(false)}
                  className="hidden"
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
