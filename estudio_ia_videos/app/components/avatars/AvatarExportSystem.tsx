/**
 * 🎬 Avatar Export System - Sistema de Exportação de Avatares
 * Exportação profissional de avatares para vídeo com múltiplos formatos
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Download, 
  Video,
  Image,
  Settings,
  Play,
  Pause,
  Square,
  RotateCcw,
  FileVideo,
  FileImage,
  Zap,
  Clock,
  HardDrive,
  Monitor,
  Smartphone,
  Tv,
  Globe,
  Share2,
  Upload,
  CheckCircle,
  AlertCircle,
  Loader2,
  Camera,
  Film,
  Clapperboard,
  Volume2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ExportSettings {
  // Configurações de Vídeo
  video: {
    format: 'mp4' | 'webm' | 'avi' | 'mov' | 'gif';
    resolution: '480p' | '720p' | '1080p' | '1440p' | '4k';
    fps: 24 | 30 | 60;
    bitrate: number; // kbps
    codec: 'h264' | 'h265' | 'vp9' | 'av1';
    duration: number; // segundos
    loop: boolean;
  };
  
  // Configurações de Áudio
  audio: {
    enabled: boolean;
    format: 'aac' | 'mp3' | 'wav' | 'ogg';
    bitrate: number; // kbps
    sampleRate: 44100 | 48000 | 96000;
    channels: 1 | 2; // mono/stereo
  };
  
  // Configurações de Renderização
  rendering: {
    quality: 'draft' | 'standard' | 'high' | 'ultra';
    antialiasing: boolean;
    motionBlur: boolean;
    shadows: boolean;
    reflections: boolean;
    postProcessing: boolean;
  };
  
  // Configurações de Saída
  output: {
    filename: string;
    watermark: boolean;
    metadata: {
      title: string;
      description: string;
      tags: string[];
      author: string;
    };
  };
  
  // Configurações de Plataforma
  platform: {
    preset: 'custom' | 'youtube' | 'instagram' | 'tiktok' | 'linkedin' | 'twitter' | 'facebook';
    optimizeFor: 'web' | 'mobile' | 'desktop' | 'tv';
  };
}

interface ExportJob {
  id: string;
  avatarId: string;
  settings: ExportSettings;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  startTime?: Date;
  endTime?: Date;
  outputFile?: string;
  fileSize?: number;
  error?: string;
}

interface AvatarExportSystemProps {
  avatarId: string;
  avatarData?: any;
  onExportComplete?: (job: ExportJob) => void;
}

const PLATFORM_TARGETS = ['web', 'mobile', 'desktop', 'tv'] as const;
type PlatformTarget = (typeof PLATFORM_TARGETS)[number];

const VIDEO_FORMAT_OPTIONS = ['mp4', 'webm', 'avi', 'mov', 'gif'] as const;
type VideoFormatOption = (typeof VIDEO_FORMAT_OPTIONS)[number];

const VIDEO_RESOLUTION_OPTIONS = ['480p', '720p', '1080p', '1440p', '4k'] as const;
type VideoResolutionOption = (typeof VIDEO_RESOLUTION_OPTIONS)[number];

const VIDEO_FPS_OPTIONS = [24, 30, 60] as const;
type VideoFpsOption = (typeof VIDEO_FPS_OPTIONS)[number];

const VIDEO_CODEC_OPTIONS = ['h264', 'h265', 'vp9', 'av1'] as const;
type VideoCodecOption = (typeof VIDEO_CODEC_OPTIONS)[number];

const AUDIO_FORMAT_OPTIONS = ['aac', 'mp3', 'wav', 'ogg'] as const;
type AudioFormatOption = (typeof AUDIO_FORMAT_OPTIONS)[number];

const AUDIO_SAMPLE_RATE_OPTIONS = [44100, 48000, 96000] as const;
type AudioSampleRateOption = (typeof AUDIO_SAMPLE_RATE_OPTIONS)[number];

const RENDER_QUALITY_OPTIONS = ['draft', 'standard', 'high', 'ultra'] as const;
type RenderQualityOption = (typeof RENDER_QUALITY_OPTIONS)[number];

export default function AvatarExportSystem({ 
  avatarId, 
  avatarData,
  onExportComplete 
}: AvatarExportSystemProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Estado das configurações de exportação
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    video: {
      format: 'mp4',
      resolution: '1080p',
      fps: 30,
      bitrate: 5000,
      codec: 'h264',
      duration: 10,
      loop: false
    },
    audio: {
      enabled: true,
      format: 'aac',
      bitrate: 128,
      sampleRate: 44100,
      channels: 2
    },
    rendering: {
      quality: 'high',
      antialiasing: true,
      motionBlur: true,
      shadows: true,
      reflections: false,
      postProcessing: true
    },
    output: {
      filename: `avatar-${avatarId}-${Date.now()}`,
      watermark: false,
      metadata: {
        title: 'Avatar Export',
        description: 'Exported from Avatar Studio',
        tags: ['avatar', '3d', 'ai'],
        author: 'Avatar Studio'
      }
    },
    platform: {
      preset: 'custom',
      optimizeFor: 'web'
    }
  });

  // Estado dos trabalhos de exportação
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [currentJob, setCurrentJob] = useState<ExportJob | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Presets de plataforma
  const platformPresets = {
    youtube: {
      video: { format: 'mp4' as const, resolution: '1080p' as const, fps: 30, bitrate: 8000, codec: 'h264' as const },
      audio: { enabled: true, format: 'aac' as const, bitrate: 128 },
      rendering: { quality: 'high' as const },
      platform: { optimizeFor: 'web' as const }
    },
    instagram: {
      video: { format: 'mp4' as const, resolution: '1080p' as const, fps: 30, bitrate: 3500, codec: 'h264' as const },
      audio: { enabled: true, format: 'aac' as const, bitrate: 128 },
      rendering: { quality: 'standard' as const },
      platform: { optimizeFor: 'mobile' as const }
    },
    tiktok: {
      video: { format: 'mp4' as const, resolution: '1080p' as const, fps: 30, bitrate: 2500, codec: 'h264' as const },
      audio: { enabled: true, format: 'aac' as const, bitrate: 96 },
      rendering: { quality: 'standard' as const },
      platform: { optimizeFor: 'mobile' as const }
    },
    linkedin: {
      video: { format: 'mp4' as const, resolution: '720p' as const, fps: 30, bitrate: 2000, codec: 'h264' as const },
      audio: { enabled: true, format: 'aac' as const, bitrate: 128 },
      rendering: { quality: 'standard' as const },
      platform: { optimizeFor: 'web' as const }
    },
    twitter: {
      video: { format: 'mp4' as const, resolution: '720p' as const, fps: 30, bitrate: 2000, codec: 'h264' as const },
      audio: { enabled: true, format: 'aac' as const, bitrate: 96 },
      rendering: { quality: 'standard' as const },
      platform: { optimizeFor: 'web' as const }
    },
    facebook: {
      video: { format: 'mp4' as const, resolution: '1080p' as const, fps: 30, bitrate: 4000, codec: 'h264' as const },
      audio: { enabled: true, format: 'aac' as const, bitrate: 128 },
      rendering: { quality: 'high' as const },
      platform: { optimizeFor: 'web' as const }
    }
  };

  // Configurações de resolução
  const resolutionSettings = {
    '480p': { width: 854, height: 480, label: '480p (SD)' },
    '720p': { width: 1280, height: 720, label: '720p (HD)' },
    '1080p': { width: 1920, height: 1080, label: '1080p (Full HD)' },
    '1440p': { width: 2560, height: 1440, label: '1440p (2K)' },
    '4k': { width: 3840, height: 2160, label: '4K (Ultra HD)' }
  };

  const resolutionEntries = VIDEO_RESOLUTION_OPTIONS.map((key) => ({
    key,
    value: resolutionSettings[key]
  }));

  // Aplicar preset de plataforma
  const applyPlatformPreset = (platform: keyof typeof platformPresets) => {
    const preset = platformPresets[platform];
    setExportSettings(prev => ({
      ...prev,
      video: { ...prev.video, ...preset.video },
      audio: { ...prev.audio, ...preset.audio },
      rendering: { ...prev.rendering, ...preset.rendering },
      platform: { ...prev.platform, preset: platform, ...preset.platform }
    }));
    toast.success(`Preset ${platform} aplicado!`);
  };

  // Calcular tamanho estimado do arquivo
  const calculateEstimatedFileSize = () => {
    const { video, audio } = exportSettings;
    const videoBitrate = video.bitrate * 1000; // Convert to bps
    const audioBitrate = audio.enabled ? audio.bitrate * 1000 : 0;
    const totalBitrate = videoBitrate + audioBitrate;
    const fileSizeBytes = (totalBitrate * video.duration) / 8;
    return fileSizeBytes / (1024 * 1024); // Convert to MB
  };

  // Calcular tempo estimado de renderização
  const calculateEstimatedRenderTime = () => {
    const { video, rendering } = exportSettings;
    const resolution = resolutionSettings[video.resolution];
    const pixels = resolution.width * resolution.height;
    const frames = video.duration * video.fps;
    
    // Fator de complexidade baseado na qualidade
    const qualityFactor = {
      draft: 0.5,
      standard: 1,
      high: 2,
      ultra: 4
    }[rendering.quality];
    
    // Estimativa baseada em pixels, frames e qualidade
    const baseTime = (pixels * frames * qualityFactor) / 1000000; // segundos
    return Math.max(baseTime, video.duration * 0.5); // Mínimo de 0.5x a duração
  };

  // Iniciar exportação
  const startExport = async () => {
    const newJob: ExportJob = {
      id: `export-${Date.now()}`,
      avatarId,
      settings: exportSettings,
      status: 'queued',
      progress: 0,
      startTime: new Date()
    };

    setExportJobs(prev => [...prev, newJob]);
    setCurrentJob(newJob);
    setIsExporting(true);

    // Simular processo de exportação
    try {
      await simulateExportProcess(newJob);
    } catch (error) {
      console.error('Export failed:', error);
      updateJobStatus(newJob.id, 'failed', { error: 'Export failed' });
    }
  };

  // Simular processo de exportação
  const simulateExportProcess = async (job: ExportJob) => {
    const steps = [
      { name: 'Preparando renderização...', duration: 1000 },
      { name: 'Renderizando frames...', duration: 5000 },
      { name: 'Processando áudio...', duration: 2000 },
      { name: 'Codificando vídeo...', duration: 3000 },
      { name: 'Aplicando pós-processamento...', duration: 2000 },
      { name: 'Finalizando exportação...', duration: 1000 }
    ];

    let totalProgress = 0;
    const progressStep = 100 / steps.length;

    for (const step of steps) {
      updateJobStatus(job.id, 'processing', { progress: totalProgress });
      
      // Simular progresso gradual
      const stepDuration = step.duration;
      const progressInterval = stepDuration / 10;
      
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, progressInterval));
        const stepProgress = (i + 1) * (progressStep / 10);
        updateJobStatus(job.id, 'processing', { progress: totalProgress + stepProgress });
      }
      
      totalProgress += progressStep;
    }

    // Finalizar exportação
    const outputFile = `${exportSettings.output.filename}.${exportSettings.video.format}`;
    const fileSize = calculateEstimatedFileSize();
    
    updateJobStatus(job.id, 'completed', {
      progress: 100,
      endTime: new Date(),
      outputFile,
      fileSize
    });

    setIsExporting(false);
    toast.success('Exportação concluída com sucesso!');
    
    if (onExportComplete) {
      const completedJob = exportJobs.find(j => j.id === job.id);
      if (completedJob) {
        onExportComplete(completedJob);
      }
    }
  };

  // Atualizar status do trabalho
  const updateJobStatus = (jobId: string, status: ExportJob['status'], updates: Partial<ExportJob> = {}) => {
    setExportJobs(prev => prev.map(job => 
      job.id === jobId 
        ? { ...job, status, ...updates }
        : job
    ));
    
    if (currentJob?.id === jobId) {
      setCurrentJob(prev => prev ? { ...prev, status, ...updates } : null);
    }
  };

  // Cancelar exportação
  const cancelExport = () => {
    if (currentJob) {
      updateJobStatus(currentJob.id, 'cancelled');
      setCurrentJob(null);
      setIsExporting(false);
      toast.info('Exportação cancelada');
    }
  };

  // Download do arquivo
  const downloadFile = (job: ExportJob) => {
    if (job.status === 'completed' && job.outputFile) {
      // Simular download
      const link = document.createElement('a');
      link.href = '#'; // Em uma implementação real, seria a URL do arquivo
      link.download = job.outputFile;
      link.click();
      toast.success('Download iniciado!');
    }
  };

  // Renderizar preview
  const renderPreview = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resolution = resolutionSettings[exportSettings.video.resolution];
    canvas.width = Math.min(400, resolution.width / 4);
    canvas.height = Math.min(300, resolution.height / 4);

    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fundo
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1e293b');
    gradient.addColorStop(1, '#0f172a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Simular avatar
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Avatar placeholder
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, 60, 80, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Informações de resolução
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${resolution.width}x${resolution.height}`, centerX, canvas.height - 10);
    ctx.fillText(`${exportSettings.video.fps} FPS`, centerX, canvas.height - 25);
  };

  useEffect(() => {
    renderPreview();
  }, [exportSettings.video.resolution, exportSettings.video.fps]);

  return (
    <div className="space-y-6">
      {/* Preview e Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              Preview de Exportação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-center">
                <canvas
                  ref={canvasRef}
                  className="border-2 border-gray-200 rounded-lg shadow-lg bg-gray-900"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Resolução:</span>
                    <Badge variant="outline">{exportSettings.video.resolution}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>FPS:</span>
                    <Badge variant="outline">{exportSettings.video.fps}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Formato:</span>
                    <Badge variant="outline">{exportSettings.video.format.toUpperCase()}</Badge>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Duração:</span>
                    <Badge variant="outline">{exportSettings.video.duration}s</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Tamanho:</span>
                    <Badge variant="outline">{calculateEstimatedFileSize().toFixed(1)} MB</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Tempo:</span>
                    <Badge variant="outline">{calculateEstimatedRenderTime().toFixed(1)}s</Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status de Exportação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clapperboard className="w-5 h-5" />
              Status de Exportação
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentJob ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Exportando...</span>
                  <Badge 
                    variant={currentJob.status === 'completed' ? 'default' : 'secondary'}
                    className="flex items-center gap-1"
                  >
                    {currentJob.status === 'processing' && <Loader2 className="w-3 h-3 animate-spin" />}
                    {currentJob.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                    {currentJob.status === 'failed' && <AlertCircle className="w-3 h-3" />}
                    {currentJob.status}
                  </Badge>
                </div>
                
                <Progress value={currentJob.progress} className="w-full" />
                
                <div className="text-sm text-gray-600">
                  <div>Progresso: {currentJob.progress.toFixed(1)}%</div>
                  {currentJob.startTime && (
                    <div>Iniciado: {currentJob.startTime.toLocaleTimeString()}</div>
                  )}
                  {currentJob.endTime && (
                    <div>Concluído: {currentJob.endTime.toLocaleTimeString()}</div>
                  )}
                </div>

                <div className="flex gap-2">
                  {currentJob.status === 'processing' && (
                    <Button variant="outline" size="sm" onClick={cancelExport}>
                      <Square className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                  )}
                  
                  {currentJob.status === 'completed' && (
                    <Button size="sm" onClick={() => downloadFile(currentJob)}>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Video className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma exportação em andamento</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Configurações de Exportação */}
      <Tabs defaultValue="platform" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="platform">Plataforma</TabsTrigger>
          <TabsTrigger value="video">Vídeo</TabsTrigger>
          <TabsTrigger value="audio">Áudio</TabsTrigger>
          <TabsTrigger value="rendering">Renderização</TabsTrigger>
          <TabsTrigger value="output">Saída</TabsTrigger>
        </TabsList>

        <TabsContent value="platform" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Presets de Plataforma
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.keys(platformPresets).map((platform) => (
                  <Button
                    key={platform}
                    variant={exportSettings.platform.preset === platform ? "default" : "outline"}
                    size="sm"
                    onClick={() => applyPlatformPreset(platform as keyof typeof platformPresets)}
                    className="h-auto p-3 flex flex-col items-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="text-xs capitalize">{platform}</span>
                  </Button>
                ))}
              </div>

              <div className="mt-4">
                <Label>Otimizar para</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {PLATFORM_TARGETS.map((target) => (
                    <Button
                      key={target}
                      variant={exportSettings.platform.optimizeFor === target ? "default" : "outline"}
                      size="sm"
                      onClick={() => setExportSettings(prev => ({
                        ...prev,
                        platform: { ...prev.platform, optimizeFor: target }
                      }))}
                    >
                      {target === 'web' && <Globe className="w-4 h-4 mr-1" />}
                      {target === 'mobile' && <Smartphone className="w-4 h-4 mr-1" />}
                      {target === 'desktop' && <Monitor className="w-4 h-4 mr-1" />}
                      {target === 'tv' && <Tv className="w-4 h-4 mr-1" />}
                      {target.charAt(0).toUpperCase() + target.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="video" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="w-5 h-5" />
                Configurações de Vídeo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Formato</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {VIDEO_FORMAT_OPTIONS.map((format) => (
                      <Button
                        key={format}
                        variant={exportSettings.video.format === format ? "default" : "outline"}
                        size="sm"
                        onClick={() => setExportSettings(prev => ({
                          ...prev,
                          video: { ...prev.video, format }
                        }))}
                      >
                        {format.toUpperCase()}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Resolução</Label>
                  <div className="space-y-2 mt-2">
                    {resolutionEntries.map(({ key, value }) => (
                      <Button
                        key={key}
                        variant={exportSettings.video.resolution === key ? "default" : "outline"}
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setExportSettings(prev => ({
                          ...prev,
                          video: { ...prev.video, resolution: key }
                        }))}
                      >
                        {value.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>FPS</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {VIDEO_FPS_OPTIONS.map((fps) => (
                      <Button
                        key={fps}
                        variant={exportSettings.video.fps === fps ? "default" : "outline"}
                        size="sm"
                        onClick={() => setExportSettings(prev => ({
                          ...prev,
                          video: { ...prev.video, fps }
                        }))}
                      >
                        {fps}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Bitrate: {exportSettings.video.bitrate} kbps</Label>
                  <Slider
                    value={[exportSettings.video.bitrate]}
                    onValueChange={([bitrate]) => setExportSettings(prev => ({
                      ...prev,
                      video: { ...prev.video, bitrate }
                    }))}
                    min={500}
                    max={20000}
                    step={500}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Duração: {exportSettings.video.duration}s</Label>
                  <Slider
                    value={[exportSettings.video.duration]}
                    onValueChange={([duration]) => setExportSettings(prev => ({
                      ...prev,
                      video: { ...prev.video, duration }
                    }))}
                    min={1}
                    max={300}
                    step={1}
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label>Codec</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {VIDEO_CODEC_OPTIONS.map((codec) => (
                    <Button
                      key={codec}
                      variant={exportSettings.video.codec === codec ? "default" : "outline"}
                      size="sm"
                      onClick={() => setExportSettings(prev => ({
                        ...prev,
                        video: { ...prev.video, codec }
                      }))}
                    >
                      {codec.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="loop"
                  checked={exportSettings.video.loop}
                  onChange={(e) => setExportSettings(prev => ({
                    ...prev,
                    video: { ...prev.video, loop: e.target.checked }
                  }))}
                />
                <Label htmlFor="loop">Loop automático</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audio" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="w-5 h-5" />
                Configurações de Áudio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="audioEnabled"
                  checked={exportSettings.audio.enabled}
                  onChange={(e) => setExportSettings(prev => ({
                    ...prev,
                    audio: { ...prev.audio, enabled: e.target.checked }
                  }))}
                />
                <Label htmlFor="audioEnabled">Incluir áudio</Label>
              </div>

              {exportSettings.audio.enabled && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Formato</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {AUDIO_FORMAT_OPTIONS.map((format) => (
                          <Button
                            key={format}
                            variant={exportSettings.audio.format === format ? "default" : "outline"}
                            size="sm"
                            onClick={() => setExportSettings(prev => ({
                              ...prev,
                              audio: { ...prev.audio, format }
                            }))}
                          >
                            {format.toUpperCase()}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Canais</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <Button
                          variant={exportSettings.audio.channels === 1 ? "default" : "outline"}
                          size="sm"
                          onClick={() => setExportSettings(prev => ({
                            ...prev,
                            audio: { ...prev.audio, channels: 1 }
                          }))}
                        >
                          Mono
                        </Button>
                        <Button
                          variant={exportSettings.audio.channels === 2 ? "default" : "outline"}
                          size="sm"
                          onClick={() => setExportSettings(prev => ({
                            ...prev,
                            audio: { ...prev.audio, channels: 2 }
                          }))}
                        >
                          Stereo
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Bitrate: {exportSettings.audio.bitrate} kbps</Label>
                      <Slider
                        value={[exportSettings.audio.bitrate]}
                        onValueChange={([bitrate]) => setExportSettings(prev => ({
                          ...prev,
                          audio: { ...prev.audio, bitrate }
                        }))}
                        min={64}
                        max={320}
                        step={32}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label>Sample Rate</Label>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {AUDIO_SAMPLE_RATE_OPTIONS.map((rate) => (
                          <Button
                            key={rate}
                            variant={exportSettings.audio.sampleRate === rate ? "default" : "outline"}
                            size="sm"
                            onClick={() => setExportSettings(prev => ({
                              ...prev,
                              audio: { ...prev.audio, sampleRate: rate }
                            }))}
                          >
                            {rate / 1000}k
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rendering" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Configurações de Renderização
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Qualidade</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {RENDER_QUALITY_OPTIONS.map((quality) => (
                    <Button
                      key={quality}
                      variant={exportSettings.rendering.quality === quality ? "default" : "outline"}
                      size="sm"
                      onClick={() => setExportSettings(prev => ({
                        ...prev,
                        rendering: { ...prev.rendering, quality }
                      }))}
                    >
                      {quality.charAt(0).toUpperCase() + quality.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { key: 'antialiasing', label: 'Anti-aliasing' },
                  { key: 'motionBlur', label: 'Motion Blur' },
                  { key: 'shadows', label: 'Sombras' },
                  { key: 'reflections', label: 'Reflexões' },
                  { key: 'postProcessing', label: 'Pós-processamento' }
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={key}
                      checked={exportSettings.rendering[key as keyof typeof exportSettings.rendering] as boolean}
                      onChange={(e) => setExportSettings(prev => ({
                        ...prev,
                        rendering: { ...prev.rendering, [key]: e.target.checked }
                      }))}
                    />
                    <Label htmlFor={key}>{label}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="output" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileVideo className="w-5 h-5" />
                Configurações de Saída
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nome do arquivo</Label>
                <Input
                  value={exportSettings.output.filename}
                  onChange={(e) => setExportSettings(prev => ({
                    ...prev,
                    output: { ...prev.output, filename: e.target.value }
                  }))}
                  placeholder="nome-do-arquivo"
                  className="mt-2"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="watermark"
                  checked={exportSettings.output.watermark}
                  onChange={(e) => setExportSettings(prev => ({
                    ...prev,
                    output: { ...prev.output, watermark: e.target.checked }
                  }))}
                />
                <Label htmlFor="watermark">Incluir marca d'água</Label>
              </div>

              <div className="space-y-3">
                <div>
                  <Label>Título</Label>
                  <Input
                    value={exportSettings.output.metadata.title}
                    onChange={(e) => setExportSettings(prev => ({
                      ...prev,
                      output: {
                        ...prev.output,
                        metadata: { ...prev.output.metadata, title: e.target.value }
                      }
                    }))}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Descrição</Label>
                  <Input
                    value={exportSettings.output.metadata.description}
                    onChange={(e) => setExportSettings(prev => ({
                      ...prev,
                      output: {
                        ...prev.output,
                        metadata: { ...prev.output.metadata, description: e.target.value }
                      }
                    }))}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Autor</Label>
                  <Input
                    value={exportSettings.output.metadata.author}
                    onChange={(e) => setExportSettings(prev => ({
                      ...prev,
                      output: {
                        ...prev.output,
                        metadata: { ...prev.output.metadata, author: e.target.value }
                      }
                    }))}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Botão de Exportação */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-sm text-gray-600">
                Tamanho estimado: {calculateEstimatedFileSize().toFixed(1)} MB
              </div>
              <div className="text-sm text-gray-600">
                Tempo estimado: {calculateEstimatedRenderTime().toFixed(1)} segundos
              </div>
            </div>
            
            <Button
              onClick={startExport}
              disabled={isExporting}
              size="lg"
              className="flex items-center gap-2"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Iniciar Exportação
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Exportações */}
      {exportJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Histórico de Exportações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {exportJobs.slice().reverse().map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">{job.settings.output.filename}.{job.settings.video.format}</div>
                    <div className="text-sm text-gray-600">
                      {job.settings.video.resolution} • {job.settings.video.fps} FPS • {job.settings.video.duration}s
                    </div>
                    {job.startTime && (
                      <div className="text-xs text-gray-500">
                        {job.startTime.toLocaleString()}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant={job.status === 'completed' ? 'default' : 
                              job.status === 'failed' ? 'destructive' : 'secondary'}
                    >
                      {job.status}
                    </Badge>
                    
                    {job.status === 'completed' && (
                      <Button size="sm" variant="outline" onClick={() => downloadFile(job)}>
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}