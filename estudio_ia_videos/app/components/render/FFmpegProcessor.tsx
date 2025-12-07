/**
 * 🎬 FFmpeg Processor - Advanced video processing with FFmpeg
 * Professional video processing pipeline with real-time monitoring
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
  Cpu, 
  Play, 
  Pause, 
  StopCircle, 
  Download, 
  Settings, 
  Activity, 
  BarChart3, 
  HardDrive, 
  Clock, 
  Zap, 
  CheckCircle, 
  AlertTriangle, 
  Loader2,
  Monitor,
  FileVideo,
  Volume2,
  Image as ImageIcon,
  Film,
  Layers,
  Maximize2,
  Minimize2,
  RotateCw,
  Scissors,
  Palette,
  Sliders,
  Database,
  Server,
  Terminal
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// FFmpeg Processing Types
interface FFmpegJob {
  id: string;
  name: string;
  inputFile: string;
  outputFile: string;
  command: string;
  status: ProcessingStatus;
  progress: number;
  settings: FFmpegSettings;
  startTime?: Date;
  endTime?: Date;
  error?: string;
  logs: ProcessingLog[];
  stats?: ProcessingStats;
}

interface FFmpegSettings {
  format: OutputFormat;
  video: VideoSettings;
  audio: AudioSettings;
  filters: FilterChain[];
  optimization: OptimizationSettings;
}

interface VideoSettings {
  codec: VideoCodec;
  bitrate: string;
  crf: number;
  preset: string;
  resolution: string;
  fps: number;
  aspectRatio: string;
}

interface AudioSettings {
  codec: AudioCodec;
  bitrate: string;
  sampleRate: number;
  channels: number;
  normalize: boolean;
}

interface FilterChain {
  id: string;
  name: string;
  type: FilterType;
  enabled: boolean;
  parameters: { [key: string]: any };
}

interface OptimizationSettings {
  threads: number;
  hardware: boolean;
  preset: 'ultrafast' | 'superfast' | 'veryfast' | 'faster' | 'fast' | 'medium' | 'slow' | 'slower' | 'veryslow';
  tune: 'film' | 'animation' | 'grain' | 'stillimage' | 'fastdecode' | 'zerolatency';
}

interface ProcessingLog {
  id: string;
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  details?: any;
}

interface ProcessingStats {
  inputSize: number;
  outputSize: number;
  compressionRatio: number;
  processingTime: number;
  avgFps: number;
  quality: number;
}

type ProcessingStatus = 
  | 'pending'
  | 'preparing' 
  | 'processing' 
  | 'postprocessing' 
  | 'completed' 
  | 'failed' 
  | 'cancelled';

type OutputFormat = 'mp4' | 'mov' | 'webm' | 'mkv' | 'avi' | 'gif' | 'mp3' | 'wav' | 'png' | 'jpg';
type VideoCodec = 'libx264' | 'libx265' | 'libvpx-vp9' | 'libaom-av1';
type AudioCodec = 'aac' | 'libmp3lame' | 'libopus' | 'pcm_s16le';
type FilterType = 'video' | 'audio' | 'overlay' | 'transition' | 'effect';

interface FFmpegProcessorProps {
  onJobComplete?: (job: FFmpegJob) => void;
  onJobError?: (job: FFmpegJob, error: string) => void;
}

const DEFAULT_FFMPEG_SETTINGS: FFmpegSettings = {
  format: 'mp4',
  video: {
    codec: 'libx264',
    bitrate: '2M',
    crf: 23,
    preset: 'medium',
    resolution: '1920x1080',
    fps: 30,
    aspectRatio: '16:9'
  },
  audio: {
    codec: 'aac',
    bitrate: '192k',
    sampleRate: 48000,
    channels: 2,
    normalize: true
  },
  filters: [],
  optimization: {
    threads: 4,
    hardware: true,
    preset: 'medium',
    tune: 'film'
  }
};

export default function FFmpegProcessor({ 
  onJobComplete, 
  onJobError 
}: FFmpegProcessorProps) {
  const { toast } = useToast();
  const [processingJobs, setProcessingJobs] = useState<FFmpegJob[]>([]);
  const [ffmpegSettings, setFFmpegSettings] = useState<FFmpegSettings>(DEFAULT_FFMPEG_SETTINGS);
  const [activeTab, setActiveTab] = useState<'jobs' | 'settings' | 'filters' | 'logs' | 'monitor'>('jobs');
  const [isProcessing, setIsProcessing] = useState(false);
  const [systemStats, setSystemStats] = useState({
    cpu: 0,
    memory: 0,
    disk: 0,
    temperature: 0
  });
  const processingWorkerRef = useRef<Worker | null>(null);

  // Demo processing jobs
  useEffect(() => {
    const demoJobs: FFmpegJob[] = [
      {
        id: 'demo-job-1',
        name: 'Video Compression',
        inputFile: 'input/raw_video.mov',
        outputFile: 'output/compressed_video.mp4',
        command: 'ffmpeg -i input/raw_video.mov -c:v libx264 -crf 23 -preset medium output/compressed_video.mp4',
        status: 'completed',
        progress: 100,
        settings: DEFAULT_FFMPEG_SETTINGS,
        logs: [
          {
            id: 'log-1',
            timestamp: new Date(Date.now() - 300000),
            level: 'info',
            message: 'Starting video compression...'
          },
          {
            id: 'log-2',
            timestamp: new Date(Date.now() - 200000),
            level: 'info',
            message: 'Processing frames... 50%'
          },
          {
            id: 'log-3',
            timestamp: new Date(Date.now() - 100000),
            level: 'info',
            message: 'Compression completed successfully'
          }
        ],
        stats: {
          inputSize: 500 * 1024 * 1024, // 500MB
          outputSize: 50 * 1024 * 1024,  // 50MB
          compressionRatio: 0.9,
          processingTime: 120,
          avgFps: 45,
          quality: 0.95
        },
        startTime: new Date(Date.now() - 300000),
        endTime: new Date(Date.now() - 100000)
      }
    ];
    
    setProcessingJobs(demoJobs);
  }, []);

  // Simulate system monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemStats({
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        disk: Math.random() * 100,
        temperature: 45 + Math.random() * 20
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Generate FFmpeg command
  const generateFFmpegCommand = useCallback((
    inputFile: string,
    outputFile: string,
    settings: FFmpegSettings
  ): string => {
    let command = `ffmpeg -i ${inputFile}`;
    
    // Video settings
    if (settings.video) {
      command += ` -c:v ${settings.video.codec}`;
      command += ` -crf ${settings.video.crf}`;
      command += ` -preset ${settings.video.preset}`;
      command += ` -b:v ${settings.video.bitrate}`;
      
      if (settings.video.resolution !== 'original') {
        command += ` -s ${settings.video.resolution}`;
      }
      
      if (settings.video.fps > 0) {
        command += ` -r ${settings.video.fps}`;
      }
    }
    
    // Audio settings
    if (settings.audio) {
      command += ` -c:a ${settings.audio.codec}`;
      command += ` -b:a ${settings.audio.bitrate}`;
      command += ` -ar ${settings.audio.sampleRate}`;
      command += ` -ac ${settings.audio.channels}`;
      
      if (settings.audio.normalize) {
        command += ` -af "volume=0.5"`;
      }
    }
    
    // Filters
    if (settings.filters.length > 0) {
      const videoFilters = settings.filters
        .filter(f => f.enabled && f.type === 'video')
        .map(f => f.name)
        .join(',');
      
      if (videoFilters) {
        command += ` -vf "${videoFilters}"`;
      }
    }
    
    // Optimization
    if (settings.optimization) {
      command += ` -threads ${settings.optimization.threads}`;
      
      if (settings.optimization.hardware) {
        command += ` -hwaccel auto`;
      }
      
      if (settings.optimization.tune) {
        command += ` -tune ${settings.optimization.tune}`;
      }
    }
    
    command += ` ${outputFile}`;
    return command;
  }, []);

  // Create processing job
  const createProcessingJob = useCallback((
    name: string,
    inputFile: string,
    outputFile: string
  ): FFmpegJob => {
    const command = generateFFmpegCommand(inputFile, outputFile, ffmpegSettings);
    
    return {
      id: `job-${Date.now()}`,
      name,
      inputFile,
      outputFile,
      command,
      status: 'pending',
      progress: 0,
      settings: { ...ffmpegSettings },
      logs: [{
        id: 'log-init',
        timestamp: new Date(),
        level: 'info',
        message: 'Processing job created and queued'
      }]
    };
  }, [ffmpegSettings, generateFFmpegCommand]);

  // Add processing job
  const addJobToQueue = useCallback(() => {
    const job = createProcessingJob(
      'Demo Processing Job',
      'input/demo_video.mp4',
      'output/processed_video.mp4'
    );
    
    setProcessingJobs(prev => [...prev, job]);
    
    toast({
      title: "Job adicionado",
      description: `${job.name} foi adicionado à fila de processamento`
    });
  }, [createProcessingJob, toast]);

  // Simulate processing
  const simulateProcessing = useCallback(async (job: FFmpegJob) => {
    const updateJob = (updates: Partial<FFmpegJob>) => {
      setProcessingJobs(prev => prev.map(j => 
        j.id === job.id ? { ...j, ...updates } : j
      ));
    };

    const addLog = (level: ProcessingLog['level'], message: string) => {
      const log: ProcessingLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date(),
        level,
        message
      };
      
      updateJob({ 
        logs: [...job.logs, log]
      });
    };

    try {
      setIsProcessing(true);
      updateJob({ status: 'preparing', startTime: new Date() });
      addLog('info', 'Preparing FFmpeg processing...');
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      updateJob({ progress: 5 });
      addLog('info', 'Input file analyzed successfully');

      updateJob({ status: 'processing' });
      addLog('info', 'Starting video processing...');

      // Simulate processing progress
      for (let i = 5; i <= 90; i += 5) {
        await new Promise(resolve => setTimeout(resolve, 800));
        updateJob({ progress: i });
        addLog('debug', `Processing frames... ${i}%`);
      }

      updateJob({ status: 'postprocessing' });
      addLog('info', 'Finalizing output file...');

      for (let i = 90; i <= 100; i += 2) {
        await new Promise(resolve => setTimeout(resolve, 500));
        updateJob({ progress: i });
      }

      // Complete processing
      const stats: ProcessingStats = {
        inputSize: 100 * 1024 * 1024, // 100MB
        outputSize: 45 * 1024 * 1024,  // 45MB
        compressionRatio: 0.55,
        processingTime: 15,
        avgFps: 28.5,
        quality: 0.92
      };

      updateJob({ 
        status: 'completed', 
        progress: 100,
        endTime: new Date(),
        stats
      });
      
      addLog('info', 'FFmpeg processing completed successfully!');
      
      toast({
        title: "Processamento completo",
        description: `${job.name} foi processado com sucesso`
      });

      if (onJobComplete) {
        onJobComplete({ ...job, status: 'completed', stats });
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      updateJob({ 
        status: 'failed', 
        error: errorMessage,
        endTime: new Date()
      });
      
      addLog('error', `Processing failed: ${errorMessage}`);
      
      toast({
        title: "Erro no processamento",
        description: errorMessage,
        variant: "destructive"
      });

      if (onJobError) {
        onJobError(job, errorMessage);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [toast, onJobComplete, onJobError]);

  // Start processing
  const startProcessing = useCallback(async () => {
    const pendingJob = processingJobs.find(job => job.status === 'pending');
    if (!pendingJob) return;

    await simulateProcessing(pendingJob);
  }, [processingJobs, simulateProcessing]);

  // Cancel processing
  const cancelProcessing = useCallback((jobId: string) => {
    setProcessingJobs(prev => prev.map(job => 
      job.id === jobId && ['pending', 'preparing', 'processing'].includes(job.status)
        ? { ...job, status: 'cancelled' as ProcessingStatus, endTime: new Date() }
        : job
    ));
    
    toast({
      title: "Processamento cancelado",
      description: "O job foi removido da fila"
    });
  }, [toast]);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Get status icon
  const getStatusIcon = (status: ProcessingStatus) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'preparing': return <Settings className="h-4 w-4 text-orange-500 animate-spin" />;
      case 'processing': return <Cpu className="h-4 w-4 text-purple-500 animate-pulse" />;
      case 'postprocessing': return <Loader2 className="h-4 w-4 text-green-500 animate-spin" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'cancelled': return <StopCircle className="h-4 w-4 text-gray-500" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Cpu className="h-8 w-8 text-purple-400" />
              <div>
                <h1 className="text-2xl font-bold">FFmpeg Processor</h1>
                <p className="text-gray-400">Professional Video Processing Pipeline</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
                <Terminal className="mr-1 h-3 w-3" />
                FFmpeg
              </Badge>
              
              <Badge variant="outline" className={
                isProcessing ? 'border-orange-500 text-orange-400' : 'border-green-500 text-green-400'
              }>
                {isProcessing ? (
                  <>
                    <Activity className="mr-1 h-3 w-3 animate-pulse" />
                    Processing
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
            <Button variant="outline" onClick={addJobToQueue}>
              <Zap className="mr-2 h-4 w-4" />
              Adicionar Job
            </Button>
            
            <Button 
              onClick={startProcessing} 
              disabled={isProcessing || !processingJobs.some(j => j.status === 'pending')}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Iniciar
                </>
              )}
            </Button>
          </div>
        </div>

        {/* System Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <Card className="bg-gray-700 border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">CPU</p>
                  <p className="text-2xl font-bold">{Math.round(systemStats.cpu)}%</p>
                </div>
                <Cpu className="h-8 w-8 text-blue-400" />
              </div>
              <Progress value={systemStats.cpu} className="h-1 mt-2" />
            </CardContent>
          </Card>
          
          <Card className="bg-gray-700 border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Memória</p>
                  <p className="text-2xl font-bold">{Math.round(systemStats.memory)}%</p>
                </div>
                <Server className="h-8 w-8 text-green-400" />
              </div>
              <Progress value={systemStats.memory} className="h-1 mt-2" />
            </CardContent>
          </Card>
          
          <Card className="bg-gray-700 border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Disco</p>
                  <p className="text-2xl font-bold">{Math.round(systemStats.disk)}%</p>
                </div>
                <HardDrive className="h-8 w-8 text-orange-400" />
              </div>
              <Progress value={systemStats.disk} className="h-1 mt-2" />
            </CardContent>
          </Card>
          
          <Card className="bg-gray-700 border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Temp</p>
                  <p className="text-2xl font-bold">{Math.round(systemStats.temperature)}°C</p>
                </div>
                <Activity className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'jobs' | 'settings' | 'filters' | 'logs' | 'monitor')} className="h-full">
          {/* Tabs Navigation */}
          <div className="bg-gray-800 border-b border-gray-700 px-6">
            <TabsList className="bg-gray-700">
              <TabsTrigger value="jobs" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Jobs ({processingJobs.length})
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configurações
              </TabsTrigger>
              <TabsTrigger value="filters" className="flex items-center gap-2">
                <Sliders className="h-4 w-4" />
                Filtros
              </TabsTrigger>
              <TabsTrigger value="logs" className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                Logs
              </TabsTrigger>
              <TabsTrigger value="monitor" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Monitor
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="p-6">
            <div className="space-y-4">
              {processingJobs.length === 0 ? (
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-8 text-center">
                    <Cpu className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold mb-2">Fila de processamento vazia</h3>
                    <p className="text-gray-400 mb-4">
                      Adicione jobs de processamento FFmpeg para começar
                    </p>
                    <Button onClick={addJobToQueue}>
                      <Zap className="mr-2 h-4 w-4" />
                      Adicionar Job
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                processingJobs.map((job) => (
                  <Card key={job.id} className="bg-gray-800 border-gray-700">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(job.status)}
                          <div>
                            <h3 className="font-semibold">{job.name}</h3>
                            <p className="text-sm text-gray-400">
                              {job.inputFile} → {job.outputFile}
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
                              onClick={() => cancelProcessing(job.id)}
                            >
                              <StopCircle className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {['preparing', 'processing', 'postprocessing'].includes(job.status) && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Progresso</span>
                            <span className="text-sm text-gray-400">{job.progress}%</span>
                          </div>
                          <Progress value={job.progress} className="h-2" />
                        </div>
                      )}

                      {/* Command Preview */}
                      <div className="bg-gray-900 rounded p-3 mb-4">
                        <code className="text-xs text-green-400 break-all">
                          {job.command}
                        </code>
                      </div>

                      {/* Stats */}
                      {job.stats && (
                        <div className="bg-gray-700 rounded p-4 grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-400">Input:</span>
                            <p className="font-medium">{formatFileSize(job.stats.inputSize)}</p>
                          </div>
                          <div>
                            <span className="text-gray-400">Output:</span>
                            <p className="font-medium">{formatFileSize(job.stats.outputSize)}</p>
                          </div>
                          <div>
                            <span className="text-gray-400">Compressão:</span>
                            <p className="font-medium">{Math.round(job.stats.compressionRatio * 100)}%</p>
                          </div>
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
            <div className="max-w-4xl mx-auto space-y-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>Configurações de Vídeo</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Codec</Label>
                    <Select
                      value={ffmpegSettings.video.codec}
                      onValueChange={(value: VideoCodec) => 
                        setFFmpegSettings(prev => ({
                          ...prev,
                          video: { ...prev.video, codec: value }
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="libx264">H.264 (libx264)</SelectItem>
                        <SelectItem value="libx265">H.265 (libx265)</SelectItem>
                        <SelectItem value="libvpx-vp9">VP9 (libvpx-vp9)</SelectItem>
                        <SelectItem value="libaom-av1">AV1 (libaom-av1)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Preset</Label>
                    <Select
                      value={ffmpegSettings.video.preset}
                      onValueChange={(value) => 
                        setFFmpegSettings(prev => ({
                          ...prev,
                          video: { ...prev.video, preset: value }
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ultrafast">Ultra Fast</SelectItem>
                        <SelectItem value="superfast">Super Fast</SelectItem>
                        <SelectItem value="veryfast">Very Fast</SelectItem>
                        <SelectItem value="faster">Faster</SelectItem>
                        <SelectItem value="fast">Fast</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="slow">Slow</SelectItem>
                        <SelectItem value="slower">Slower</SelectItem>
                        <SelectItem value="veryslow">Very Slow</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>CRF (Qualidade)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="51"
                      value={ffmpegSettings.video.crf}
                      onChange={(e) => 
                        setFFmpegSettings(prev => ({
                          ...prev,
                          video: { ...prev.video, crf: parseInt(e.target.value) }
                        }))
                      }
                    />
                  </div>
                  
                  <div>
                    <Label>Bitrate</Label>
                    <Input
                      value={ffmpegSettings.video.bitrate}
                      onChange={(e) => 
                        setFFmpegSettings(prev => ({
                          ...prev,
                          video: { ...prev.video, bitrate: e.target.value }
                        }))
                      }
                      placeholder="2M"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>Configurações de Áudio</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Codec</Label>
                    <Select
                      value={ffmpegSettings.audio.codec}
                      onValueChange={(value: AudioCodec) => 
                        setFFmpegSettings(prev => ({
                          ...prev,
                          audio: { ...prev.audio, codec: value }
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aac">AAC</SelectItem>
                        <SelectItem value="libmp3lame">MP3</SelectItem>
                        <SelectItem value="libopus">Opus</SelectItem>
                        <SelectItem value="pcm_s16le">PCM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Bitrate</Label>
                    <Input
                      value={ffmpegSettings.audio.bitrate}
                      onChange={(e) => 
                        setFFmpegSettings(prev => ({
                          ...prev,
                          audio: { ...prev.audio, bitrate: e.target.value }
                        }))
                      }
                      placeholder="192k"
                    />
                  </div>
                  
                  <div>
                    <Label>Sample Rate</Label>
                    <Select
                      value={ffmpegSettings.audio.sampleRate.toString()}
                      onValueChange={(value) => 
                        setFFmpegSettings(prev => ({
                          ...prev,
                          audio: { ...prev.audio, sampleRate: parseInt(value) }
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="44100">44.1 kHz</SelectItem>
                        <SelectItem value="48000">48 kHz</SelectItem>
                        <SelectItem value="96000">96 kHz</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Canais</Label>
                    <Select
                      value={ffmpegSettings.audio.channels.toString()}
                      onValueChange={(value) => 
                        setFFmpegSettings(prev => ({
                          ...prev,
                          audio: { ...prev.audio, channels: parseInt(value) }
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Mono</SelectItem>
                        <SelectItem value="2">Stereo</SelectItem>
                        <SelectItem value="6">5.1</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Other tabs with placeholder content */}
          <TabsContent value="filters" className="p-6">
            <div className="text-center py-20 text-gray-400">
              <Sliders className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Editor de Filtros FFmpeg</h3>
              <p>Sistema avançado de filtros em desenvolvimento</p>
            </div>
          </TabsContent>

          <TabsContent value="logs" className="p-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle>Logs de Processamento</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {processingJobs.flatMap(job => 
                      job.logs.map(log => (
                        <div 
                          key={log.id}
                          className={`p-3 rounded text-sm ${
                            log.level === 'error' ? 'bg-red-900/20 border border-red-500/20' :
                            log.level === 'warning' ? 'bg-yellow-900/20 border border-yellow-500/20' :
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
                            'text-gray-300'
                          }>
                            {log.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monitor" className="p-6">
            <div className="text-center py-20 text-gray-400">
              <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Monitor de Sistema</h3>
              <p>Monitoramento avançado de performance em desenvolvimento</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}