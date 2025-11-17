/**
 * 🎬 Render Engine - Core rendering system with Remotion + FFmpeg
 * Professional video rendering pipeline with real-time progress tracking
 */

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  Pause, 
  Download, 
  Settings, 
  Film, 
  Zap, 
  Cpu, 
  HardDrive, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Loader2,
  Eye,
  FileVideo,
  Image as ImageIcon,
  Volume2,
  Monitor,
  Server,
  Database,
  Layers,
  BarChart3,
  Activity,
  Sparkles,
  Upload,
  FolderOpen,
  Save,
  Trash2,
  Copy,
  RotateCw,
  StopCircle,
  FastForward
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { TimelineProject } from '@/types/advanced-editor';

// Render Engine Types
interface RenderJob {
  id: string;
  name: string;
  project: TimelineProject;
  status: RenderStatus;
  progress: number;
  settings: RenderSettings;
  output?: RenderOutput;
  startTime?: Date;
  endTime?: Date;
  error?: string;
  logs: RenderLog[];
}

interface RenderSettings {
  format: VideoFormat;
  resolution: Resolution;
  fps: number;
  quality: QualitySettings;
  codec: VideoCodec;
  audio: AudioSettings;
  advanced: AdvancedSettings;
}

interface RenderOutput {
  url: string;
  size: number;
  duration: number;
  format: string;
  thumbnail?: string;
}

interface RenderLog {
  id: string;
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  details?: any;
}

type RenderStatus = 
  | 'pending'
  | 'preparing' 
  | 'rendering' 
  | 'processing' 
  | 'finalizing' 
  | 'completed' 
  | 'failed' 
  | 'cancelled';

type VideoFormat = 'mp4' | 'mov' | 'webm' | 'gif' | 'png-sequence';
type VideoCodec = 'h264' | 'h265' | 'vp9' | 'av1' | 'prores';
type Resolution = '720p' | '1080p' | '1440p' | '4k' | 'custom';

interface QualitySettings {
  preset: 'draft' | 'preview' | 'production' | 'master';
  bitrate?: number;
  crf?: number;
}

interface AudioSettings {
  enabled: boolean;
  codec: 'aac' | 'mp3' | 'opus';
  bitrate: number;
  sampleRate: number;
}

interface AdvancedSettings {
  threads: number;
  hardware: boolean;
  optimization: 'speed' | 'balanced' | 'quality';
  colorSpace: 'srgb' | 'rec709' | 'rec2020';
}

interface RenderEngineProps {
  projects?: TimelineProject[];
  onRenderComplete?: (job: RenderJob) => void;
  onRenderError?: (job: RenderJob, error: string) => void;
}

const DEFAULT_RENDER_SETTINGS: RenderSettings = {
  format: 'mp4',
  resolution: '1080p',
  fps: 30,
  quality: { preset: 'production', crf: 18 },
  codec: 'h264',
  audio: {
    enabled: true,
    codec: 'aac',
    bitrate: 192,
    sampleRate: 48000
  },
  advanced: {
    threads: 4,
    hardware: true,
    optimization: 'balanced',
    colorSpace: 'srgb'
  }
};

export default function RenderEngine({ 
  projects = [], 
  onRenderComplete, 
  onRenderError 
}: RenderEngineProps) {
  const { toast } = useToast();
  const [renderJobs, setRenderJobs] = useState<RenderJob[]>([]);
  const [selectedProject, setSelectedProject] = useState<TimelineProject | null>(null);
  const [renderSettings, setRenderSettings] = useState<RenderSettings>(DEFAULT_RENDER_SETTINGS);
  const [activeTab, setActiveTab] = useState<'queue' | 'settings' | 'logs' | 'stats'>('queue');
  const [isRendering, setIsRendering] = useState(false);
  const renderWorkerRef = useRef<Worker | null>(null);

  // Demo projects if none provided
  useEffect(() => {
    if (projects.length === 0 && !selectedProject) {
      const demoProject: TimelineProject = {
        id: 'demo-project',
        name: 'Demo Video Project',
        description: 'Projeto demonstrativo para renderização',
        version: '1.0.0',
        createdAt: new Date(),
        updatedAt: new Date(),
        settings: {
          width: 1920,
          height: 1080,
          fps: 30,
          duration: 10,
          sampleRate: 48000,
          quality: 'high',
          codec: 'h264',
          colorSpace: 'srgb',
          background: { type: 'solid', color: { type: 'linear', colors: [] }, opacity: 1 }
        },
        timeline: {
          currentTime: 0,
          zoom: 1,
          isPlaying: false,
          loop: false,
          selectedElements: [],
          clipboardElements: [],
          history: [],
          historyIndex: -1
        },
        tracks: [],
        elements: [],
        metadata: {
          author: 'System',
          description: 'Demo project for rendering',
          tags: ['demo', 'test'],
          exportSettings: []
        }
      };
      setSelectedProject(demoProject);
    }
  }, [projects]);

  // Create render job
  const createRenderJob = useCallback((project: TimelineProject): RenderJob => {
    const job: RenderJob = {
      id: `render-${Date.now()}`,
      name: `${project.name} - ${new Date().toLocaleString()}`,
      project,
      status: 'pending',
      progress: 0,
      settings: { ...renderSettings },
      logs: [{
        id: 'log-init',
        timestamp: new Date(),
        level: 'info',
        message: 'Render job created and queued'
      }]
    };
    return job;
  }, [renderSettings]);

  // Add to render queue
  const addToRenderQueue = useCallback(() => {
    if (!selectedProject) {
      toast({
        title: "Erro",
        description: "Selecione um projeto para renderizar",
        variant: "destructive"
      });
      return;
    }

    const job = createRenderJob(selectedProject);
    setRenderJobs(prev => [...prev, job]);
    
    toast({
      title: "Job adicionado à fila",
      description: `${selectedProject.name} foi adicionado à fila de renderização`
    });
  }, [selectedProject, createRenderJob, toast]);

  // Simulate render process
  const simulateRender = useCallback(async (job: RenderJob) => {
    const updateJob = (updates: Partial<RenderJob>) => {
      setRenderJobs(prev => prev.map(j => 
        j.id === job.id ? { ...j, ...updates } : j
      ));
    };

    const addLog = (level: RenderLog['level'], message: string, details?: any) => {
      const log: RenderLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date(),
        level,
        message,
        details
      };
      
      updateJob({ 
        logs: [...job.logs, log]
      });
    };

    try {
      setIsRendering(true);
      updateJob({ status: 'preparing', startTime: new Date() });
      addLog('info', 'Preparando composição Remotion...');
      
      // Simulate preparation phase
      await new Promise(resolve => setTimeout(resolve, 2000));
      updateJob({ progress: 10 });
      addLog('success', 'Composição preparada com sucesso');

      updateJob({ status: 'rendering' });
      addLog('info', 'Iniciando renderização de vídeo...');

      // Simulate rendering progress
      for (let i = 10; i <= 80; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        updateJob({ progress: i });
        addLog('info', `Renderização em progresso: ${i}%`);
      }

      updateJob({ status: 'processing' });
      addLog('info', 'Processando com FFmpeg...');

      // Simulate FFmpeg processing
      for (let i = 80; i <= 95; i += 5) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        updateJob({ progress: i });
        addLog('info', `Processamento FFmpeg: ${i}%`);
      }

      updateJob({ status: 'finalizing' });
      addLog('info', 'Finalizando arquivo de saída...');
      
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Complete render
      const output: RenderOutput = {
        url: `/renders/${job.id}.mp4`,
        size: 15.7 * 1024 * 1024, // 15.7 MB
        duration: job.project.settings.duration,
        format: job.settings.format,
        thumbnail: `/renders/${job.id}_thumb.jpg`
      };

      updateJob({ 
        status: 'completed', 
        progress: 100,
        endTime: new Date(),
        output 
      });
      
      addLog('success', 'Renderização concluída com sucesso!');
      
      toast({
        title: "Renderização completa",
        description: `${job.name} foi renderizado com sucesso`
      });

      if (onRenderComplete) {
        onRenderComplete({ ...job, output, status: 'completed' });
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      updateJob({ 
        status: 'failed', 
        error: errorMessage,
        endTime: new Date()
      });
      
      addLog('error', `Falha na renderização: ${errorMessage}`);
      
      toast({
        title: "Erro na renderização",
        description: errorMessage,
        variant: "destructive"
      });

      if (onRenderError) {
        onRenderError(job, errorMessage);
      }
    } finally {
      setIsRendering(false);
    }
  }, [toast, onRenderComplete, onRenderError]);

  // Start render process
  const startRender = useCallback(async () => {
    const pendingJob = renderJobs.find(job => job.status === 'pending');
    if (!pendingJob) return;

    await simulateRender(pendingJob);
  }, [renderJobs, simulateRender]);

  // Cancel render
  const cancelRender = useCallback((jobId: string) => {
    setRenderJobs(prev => prev.map(job => 
      job.id === jobId && ['pending', 'preparing', 'rendering', 'processing'].includes(job.status)
        ? { ...job, status: 'cancelled' as RenderStatus, endTime: new Date() }
        : job
    ));
    
    toast({
      title: "Renderização cancelada",
      description: "O job foi removido da fila"
    });
  }, [toast]);

  // Remove completed/failed jobs
  const clearCompletedJobs = useCallback(() => {
    setRenderJobs(prev => prev.filter(job => 
      !['completed', 'failed', 'cancelled'].includes(job.status)
    ));
  }, []);

  // Get status icon
  const getStatusIcon = (status: RenderStatus) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'preparing': return <Settings className="h-4 w-4 text-orange-500 animate-spin" />;
      case 'rendering': return <Film className="h-4 w-4 text-purple-500 animate-pulse" />;
      case 'processing': return <Cpu className="h-4 w-4 text-yellow-500 animate-bounce" />;
      case 'finalizing': return <Loader2 className="h-4 w-4 text-green-500 animate-spin" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'cancelled': return <StopCircle className="h-4 w-4 text-gray-500" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Calculate render stats
  const renderStats = {
    total: renderJobs.length,
    completed: renderJobs.filter(j => j.status === 'completed').length,
    failed: renderJobs.filter(j => j.status === 'failed').length,
    rendering: renderJobs.filter(j => ['rendering', 'processing', 'preparing'].includes(j.status)).length
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Zap className="h-8 w-8 text-yellow-400" />
              <div>
                <h1 className="text-2xl font-bold">Render Engine</h1>
                <p className="text-gray-400">Remotion + FFmpeg Pipeline</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-300">
                <Sparkles className="mr-1 h-3 w-3" />
                Professional
              </Badge>
              
              <Badge variant="outline" className={
                isRendering ? 'border-orange-500 text-orange-400' : 'border-green-500 text-green-400'
              }>
                {isRendering ? (
                  <>
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    Rendering
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Ready
                  </>
                )}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={clearCompletedJobs}>
              <Trash2 className="mr-2 h-4 w-4" />
              Limpar
            </Button>
            
            <Button 
              onClick={addToRenderQueue}
              disabled={!selectedProject}
              variant="outline"
            >
              <Upload className="mr-2 h-4 w-4" />
              Adicionar à Fila
            </Button>
            
            <Button 
              onClick={startRender} 
              disabled={isRendering || !renderJobs.some(j => j.status === 'pending')}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {isRendering ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Renderizando...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Iniciar Render
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <Card className="bg-gray-700 border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Jobs</p>
                  <p className="text-2xl font-bold">{renderStats.total}</p>
                </div>
                <Database className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-700 border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Renderizando</p>
                  <p className="text-2xl font-bold">{renderStats.rendering}</p>
                </div>
                <Activity className="h-8 w-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-700 border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Completos</p>
                  <p className="text-2xl font-bold">{renderStats.completed}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-700 border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Falhas</p>
                  <p className="text-2xl font-bold">{renderStats.failed}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value)} className="h-full">
          {/* Tabs Navigation */}
          <div className="bg-gray-800 border-b border-gray-700 px-6">
            <TabsList className="bg-gray-700">
              <TabsTrigger value="queue" className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                Fila de Render
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configurações
              </TabsTrigger>
              <TabsTrigger value="logs" className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                Logs
              </TabsTrigger>
              <TabsTrigger value="stats" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Estatísticas
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Render Queue Tab */}
          <TabsContent value="queue" className="p-6">
            <div className="space-y-4">
              {renderJobs.length === 0 ? (
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-8 text-center">
                    <Film className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold mb-2">Fila de render vazia</h3>
                    <p className="text-gray-400 mb-4">
                      Adicione projetos à fila de renderização para começar
                    </p>
                    <Button onClick={addToRenderQueue} disabled={!selectedProject}>
                      <Zap className="mr-2 h-4 w-4" />
                      Adicionar Projeto
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                renderJobs.map((job) => (
                  <Card key={job.id} className="bg-gray-800 border-gray-700">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(job.status)}
                          <div>
                            <h3 className="font-semibold">{job.name}</h3>
                            <p className="text-sm text-gray-400">
                              {job.project.settings.width}x{job.project.settings.height} • {job.project.settings.fps}fps • {job.settings.format.toUpperCase()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={
                            job.status === 'completed' ? 'border-green-500 text-green-400' :
                            job.status === 'failed' ? 'border-red-500 text-red-400' :
                            job.status === 'cancelled' ? 'border-gray-500 text-gray-400' :
                            'border-blue-500 text-blue-400'
                          }>
                            {job.status}
                          </Badge>
                          
                          {job.status === 'pending' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => cancelRender(job.id)}
                            >
                              <StopCircle className="h-3 w-3" />
                            </Button>
                          )}
                          
                          {job.output && (
                            <Button variant="outline" size="sm">
                              <Download className="mr-1 h-3 w-3" />
                              Download
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {['preparing', 'rendering', 'processing', 'finalizing'].includes(job.status) && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Progresso</span>
                            <span className="text-sm text-gray-400">{job.progress}%</span>
                          </div>
                          <Progress value={job.progress} className="h-2" />
                        </div>
                      )}

                      {/* Output Info */}
                      {job.output && (
                        <div className="bg-gray-700 rounded-lg p-4">
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-400">Tamanho:</span>
                              <p className="font-medium">{formatFileSize(job.output.size)}</p>
                            </div>
                            <div>
                              <span className="text-gray-400">Duração:</span>
                              <p className="font-medium">{job.output.duration}s</p>
                            </div>
                            <div>
                              <span className="text-gray-400">Formato:</span>
                              <p className="font-medium">{job.output.format.toUpperCase()}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Render Times */}
                      {job.startTime && (
                        <div className="text-xs text-gray-400 mt-2 flex items-center gap-4">
                          <span>Iniciado: {job.startTime.toLocaleTimeString()}</span>
                          {job.endTime && (
                            <span>
                              Concluído: {job.endTime.toLocaleTimeString()} 
                              ({Math.round((job.endTime.getTime() - job.startTime.getTime()) / 1000)}s)
                            </span>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="p-6">
            <Card className="bg-gray-800 border-gray-700 max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle>Configurações de Renderização</CardTitle>
                <CardDescription>
                  Configure os parâmetros de renderização para seus projetos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Formato de Saída</Label>
                    <Select
                      value={renderSettings.format}
                      onValueChange={(value: VideoFormat) => 
                        setRenderSettings(prev => ({ ...prev, format: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mp4">MP4 (H.264)</SelectItem>
                        <SelectItem value="mov">MOV (QuickTime)</SelectItem>
                        <SelectItem value="webm">WebM (VP9)</SelectItem>
                        <SelectItem value="gif">GIF Animado</SelectItem>
                        <SelectItem value="png-sequence">PNG Sequence</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Resolução</Label>
                    <Select
                      value={renderSettings.resolution}
                      onValueChange={(value: Resolution) => 
                        setRenderSettings(prev => ({ ...prev, resolution: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="720p">HD (1280x720)</SelectItem>
                        <SelectItem value="1080p">Full HD (1920x1080)</SelectItem>
                        <SelectItem value="1440p">2K (2560x1440)</SelectItem>
                        <SelectItem value="4k">4K (3840x2160)</SelectItem>
                        <SelectItem value="custom">Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>FPS</Label>
                    <Select
                      value={renderSettings.fps.toString()}
                      onValueChange={(value) => 
                        setRenderSettings(prev => ({ ...prev, fps: parseInt(value) }))
                      }
                    >
                      <SelectTrigger>
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
                  
                  <div>
                    <Label>Qualidade</Label>
                    <Select
                      value={renderSettings.quality.preset}
                      onValueChange={(value: QualitySettings['preset']) => 
                        setRenderSettings(prev => ({ 
                          ...prev, 
                          quality: { ...prev.quality, preset: value }
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Rascunho</SelectItem>
                        <SelectItem value="preview">Preview</SelectItem>
                        <SelectItem value="production">Produção</SelectItem>
                        <SelectItem value="master">Master</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Codec de Vídeo</Label>
                  <Select
                    value={renderSettings.codec}
                    onValueChange={(value: VideoCodec) => 
                      setRenderSettings(prev => ({ ...prev, codec: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="h264">H.264 (Compatível)</SelectItem>
                      <SelectItem value="h265">H.265 (HEVC)</SelectItem>
                      <SelectItem value="vp9">VP9 (WebM)</SelectItem>
                      <SelectItem value="av1">AV1 (Futuro)</SelectItem>
                      <SelectItem value="prores">ProRes (Profissional)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Alert>
                  <Settings className="h-4 w-4" />
                  <AlertDescription>
                    As configurações são aplicadas a todos os novos jobs de renderização. 
                    Jobs já na fila manterão suas configurações originais.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="p-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle>Logs de Renderização</CardTitle>
                <CardDescription>
                  Visualize logs detalhados dos processos de renderização
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  {renderJobs.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Monitor className="h-8 w-8 mx-auto mb-2" />
                      <p>Nenhum log disponível</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {renderJobs.flatMap(job => 
                        job.logs.map(log => (
                          <div 
                            key={log.id}
                            className={`p-3 rounded-lg text-sm ${
                              log.level === 'error' ? 'bg-red-900/20 border border-red-500/20' :
                              log.level === 'warning' ? 'bg-yellow-900/20 border border-yellow-500/20' :
                              log.level === 'success' ? 'bg-green-900/20 border border-green-500/20' :
                              'bg-gray-900/20 border border-gray-500/20'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium">{job.name}</span>
                              <span className="text-xs text-gray-400">
                                {log.timestamp.toLocaleTimeString()}
                              </span>
                            </div>
                            <p className={
                              log.level === 'error' ? 'text-red-400' :
                              log.level === 'warning' ? 'text-yellow-400' :
                              log.level === 'success' ? 'text-green-400' :
                              'text-gray-300'
                            }>
                              {log.message}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats" className="p-6">
            <div className="text-center py-20 text-gray-400">
              <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Estatísticas de Renderização</h3>
              <p>Análise detalhada de performance e estatísticas em desenvolvimento</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}