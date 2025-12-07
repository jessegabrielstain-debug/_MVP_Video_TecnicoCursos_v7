/**
 * 📊 Render Monitor Component v2 - Hiper-Realista
 * Monitor em tempo real para jobs de renderização de avatares 3D
 * FASE 2: Sprint 1 - Audio2Face Integration
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Monitor,
  Play,
  Pause,
  Square,
  Download,
  Share2,
  Trash2,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  Zap,
  Eye,
  BarChart3,
  Activity,
  Server,
  Cpu,
  HardDrive,
  Wifi,
  Search,
  Filter,
  MoreVertical,
  ExternalLink,
  Copy,
  FileText,
  Image as ImageIcon,
  Video,
  Headphones,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';

interface RenderJob {
  id: string;
  avatarId: string;
  avatarName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  estimatedTime: number;
  elapsedTime: number;
  startTime: string;
  endTime?: string;
  settings: {
    text: string;
    animation: string;
    resolution: string;
    quality: string;
    language: string;
    rayTracing: boolean;
    realTimeLipSync: boolean;
    audio2FaceEnabled: boolean;
    voiceCloning: boolean;
    cameraAngle: string;
    lighting: string;
  };
  output?: {
    videoUrl: string;
    audioUrl: string;
    lipSyncData: Record<string, unknown>;
    thumbnailUrl: string;
    fileSize: number;
    duration: number;
  };
  error?: string;
  logs: string[];
  metrics: {
    renderTime: number;
    lipSyncAccuracy: number;
    frameRate: number;
    memoryUsage: number;
    gpuUsage: number;
  };
}

interface ApiJob {
  id: string;
  avatarId: string;
  avatarName?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress?: number;
  createdAt: string;
  completedAt?: string;
  estimatedTime: number;
  elapsedTime?: number;
  settings: {
    text: string;
    animation?: string;
    resolution: string;
    quality: string;
    language: string;
    rayTracing: boolean;
    realTimeLipSync: boolean;
    audio2FaceEnabled: boolean;
    voiceCloning: boolean;
    cameraAngle?: string;
    lighting?: string;
  };
  output?: {
    videoUrl: string;
    audioUrl: string;
    lipSyncData: Record<string, unknown>;
    thumbnailUrl: string;
    fileSize: number;
    duration: number;
  };
  error?: string;
  logs?: string[];
  metrics?: {
    renderTime?: number;
    lipSyncAccuracy?: number;
    frameRate?: number;
    memoryUsage?: number;
    gpuUsage?: number;
  };
}

interface SystemStats {
  audio2FaceStatus: 'active' | 'inactive' | 'error';
  activeJobs: number;
  completedJobs: number;
  failedJobs: number;
  totalJobs: number;
  averageRenderTime: number;
  systemLoad: {
    cpu: number;
    memory: number;
    gpu: number;
    disk: number;
  };
  queueSize: number;
}

interface RenderMonitorProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
  showSystemStats?: boolean;
}

export default function RenderMonitor({ 
  autoRefresh = true, 
  refreshInterval = 5000,
  showSystemStats = true 
}: RenderMonitorProps) {
  const [jobs, setJobs] = useState<RenderJob[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedJob, setSelectedJob] = useState<RenderJob | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    loadRenderJobs();
    if (showSystemStats) {
      loadSystemStats();
    }

    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        loadRenderJobs();
        if (showSystemStats) {
          loadSystemStats();
        }
      }, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, showSystemStats]);

  // Carregar jobs de renderização
  const loadRenderJobs = async () => {
    try {
      setLoading(true);
      
      // Carregar jobs da API v2 com filtros
      const params = new URLSearchParams({
        status: statusFilter !== 'all' ? statusFilter : '',
        search: searchTerm,
        page: '1',
        limit: '50',
        sortBy: sortBy,
        sortOrder: 'desc'
      });

      const response = await fetch(`/api/v2/avatars/render/jobs?${params}`);
      const data = await response.json();
      
      if (data.success) {
        // Mapear dados da API v2 para o formato do componente
        const mappedJobs = (data.data.jobs as ApiJob[]).map((job) => ({
          id: job.id,
          avatarId: job.avatarId,
          avatarName: job.avatarName || 'Avatar Desconhecido',
          status: job.status,
          progress: job.progress || 0,
          startTime: job.createdAt,
          endTime: job.completedAt,
          estimatedTime: job.estimatedTime,
          elapsedTime: job.elapsedTime || 0,
          settings: {
            text: job.settings.text,
            animation: job.settings.animation || 'default',
            resolution: job.settings.resolution,
            quality: job.settings.quality,
            language: job.settings.language,
            rayTracing: job.settings.rayTracing,
            realTimeLipSync: job.settings.realTimeLipSync,
            audio2FaceEnabled: job.settings.audio2FaceEnabled,
            voiceCloning: job.settings.voiceCloning,
            cameraAngle: job.settings.cameraAngle || 'front',
            lighting: job.settings.lighting || 'natural'
          },
          output: job.output ? {
            videoUrl: job.output.videoUrl,
            audioUrl: job.output.audioUrl,
            lipSyncData: job.output.lipSyncData,
            thumbnailUrl: job.output.thumbnailUrl,
            fileSize: job.output.fileSize,
            duration: job.output.duration
          } : undefined,
          error: job.error,
          logs: job.logs || [],
          metrics: {
            renderTime: job.metrics?.renderTime || 0,
            lipSyncAccuracy: job.metrics?.lipSyncAccuracy || 0,
            frameRate: job.metrics?.frameRate || 0,
            memoryUsage: job.metrics?.memoryUsage || 0,
            gpuUsage: job.metrics?.gpuUsage || 0
          }
        }));

        setJobs(mappedJobs);
        
        // Atualizar estatísticas do sistema
        if (data.data.systemStats) {
          setSystemStats(data.data.systemStats);
        }
      } else {
        console.error('Erro ao carregar jobs:', data.error);
        // Fallback para dados mock
        setJobs(generateMockJobs());
      }
    } catch (error) {
      console.error('Erro ao carregar jobs de renderização:', error);
      // Fallback para dados mock
      setJobs(generateMockJobs());
    } finally {
      setLoading(false);
    }
  };

  // Função para gerar jobs mock para demonstração
  const generateMockJobs = (): RenderJob[] => {
    return [
      {
        id: 'job-hyperreal-001',
        avatarId: 'avatar-hyperreal-1',
        avatarName: 'Sofia Executiva',
        status: 'completed',
        progress: 100,
        estimatedTime: 240,
        elapsedTime: 225,
        startTime: '2024-01-20T10:30:00Z',
        endTime: '2024-01-20T10:33:45Z',
        settings: {
          text: 'Bem-vindos ao nosso curso de liderança empresarial.',
          animation: 'professional',
          resolution: '4K',
          quality: 'hyperreal',
          language: 'pt-BR',
          rayTracing: true,
          realTimeLipSync: true,
          audio2FaceEnabled: true,
          voiceCloning: true,
          cameraAngle: 'front',
          lighting: 'studio'
        },
        output: {
          videoUrl: '/renders/sofia-executive-001.mp4',
          audioUrl: '/renders/sofia-executive-001.wav',
          lipSyncData: { accuracy: 98.5 },
          thumbnailUrl: '/renders/sofia-executive-001-thumb.jpg',
          fileSize: 47185920,
          duration: 15
        },
        logs: [
          '[10:30:00] Iniciando renderização...',
          '[10:30:15] Audio2Face processamento iniciado',
          '[10:31:30] Lip sync gerado com 98.5% de precisão',
          '[10:33:45] Renderização concluída'
        ],
        metrics: {
          renderTime: 225,
          lipSyncAccuracy: 98.5,
          frameRate: 30,
          memoryUsage: 12.5,
          gpuUsage: 92
        }
      },
      {
        id: 'job-cinematic-002',
        avatarId: 'avatar-cinematic-1',
        avatarName: 'Dr. Carlos Médico',
        status: 'processing',
        progress: 65,
        estimatedTime: 180,
        elapsedTime: 117,
        startTime: '2024-01-20T11:15:00Z',
        settings: {
          text: 'A prevenção é sempre o melhor remédio para sua saúde.',
          animation: 'medical',
          resolution: '4K',
          quality: 'cinematic',
          language: 'pt-BR',
          rayTracing: true,
          realTimeLipSync: true,
          audio2FaceEnabled: true,
          voiceCloning: false,
          cameraAngle: 'slight-angle',
          lighting: 'clinical'
        },
        logs: [
          '[11:15:00] Job iniciado na fila',
          '[11:15:08] Processamento Audio2Face iniciado',
          '[11:16:45] Renderização em progresso - 65%'
        ],
        metrics: {
          renderTime: 0,
          lipSyncAccuracy: 96.2,
          frameRate: 30,
          memoryUsage: 10.2,
          gpuUsage: 88
        }
      },
      {
        id: 'job-premium-003',
        avatarId: 'avatar-premium-1',
        avatarName: 'Ana Professora',
        status: 'pending',
        progress: 0,
        estimatedTime: 150,
        elapsedTime: 0,
        startTime: '2024-01-20T11:45:00Z',
        settings: {
          text: 'Vamos aprender sobre matemática de forma divertida!',
          animation: 'educational',
          resolution: '1080p',
          quality: 'premium',
          language: 'pt-BR',
          rayTracing: false,
          realTimeLipSync: true,
          audio2FaceEnabled: true,
          voiceCloning: false,
          cameraAngle: 'front',
          lighting: 'classroom'
        },
        logs: [
          '[11:45:00] Job adicionado à fila'
        ],
        metrics: {
          renderTime: 0,
          lipSyncAccuracy: 0,
          frameRate: 0,
          memoryUsage: 0,
          gpuUsage: 0
        }
      }
    ];
  };

  const loadSystemStats = async () => {
    try {
      const response = await fetch('/api/v2/avatars/render?stats=true');
      const data = await response.json();
      
      if (data.success) {
        setSystemStats(data.systemStats);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  // Função para cancelar job
  const handleCancelJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/v2/avatars/render/${jobId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        setJobs(prev => prev.map(job => 
          job.id === jobId 
            ? { ...job, status: 'cancelled', progress: 0 }
            : job
        ));
        
        toast.success('Job cancelado com sucesso');
        
        // Recarregar jobs para atualizar estatísticas
        loadRenderJobs();
      } else {
        toast.error('Erro ao cancelar job');
      }
    } catch (error) {
      console.error('Erro ao cancelar job:', error);
      toast.error('Erro ao cancelar job');
    }
  };

  // Função para fazer download do resultado
  const handleDownload = async (job: RenderJob) => {
    if (!job.output?.videoUrl) {
      toast.error('Arquivo não disponível para download');
      return;
    }

    try {
      const response = await fetch(job.output.videoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `avatar-render-${job.avatarName}-${job.id}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Download iniciado');
    } catch (error) {
      console.error('Erro no download:', error);
      toast.error('Erro ao fazer download');
    }
  };

  // Função para reprocessar job
  const handleReprocess = async (jobId: string) => {
    try {
      const response = await fetch(`/api/v2/avatars/render/${jobId}/reprocess`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const result = await response.json();
        
        setJobs(prev => prev.map(job => 
          job.id === jobId 
            ? { ...job, status: 'pending', progress: 0, error: undefined }
            : job
        ));
        
        toast.success('Job reprocessado com sucesso');
        
        // Recarregar jobs
        loadRenderJobs();
      } else {
        toast.error('Erro ao reprocessar job');
      }
    } catch (error) {
      console.error('Erro ao reprocessar job:', error);
      toast.error('Erro ao reprocessar job');
    }
  };

  // Função para visualizar detalhes do job
  const handleViewDetails = (job: RenderJob) => {
    setSelectedJob(job);
  };

  // Função para fechar detalhes
  const handleCloseDetails = () => {
    setSelectedJob(null);
  };

  const copyJobId = (jobId: string) => {
    navigator.clipboard.writeText(jobId);
    toast.success('ID do job copiado');
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.avatarName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.settings.text.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      case 'progress':
        return b.progress - a.progress;
      case 'duration':
        return (b.output?.duration || 0) - (a.output?.duration || 0);
      default: // newest
        return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'processing': return 'text-blue-600 bg-blue-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'cancelled': return 'text-gray-600 bg-gray-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'processing': return Activity;
      case 'failed': return AlertCircle;
      case 'cancelled': return Square;
      default: return Clock;
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando monitor de renderização...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Monitor de Renderização</h2>
          <p className="text-gray-600">
            Acompanhe o progresso dos jobs de renderização em tempo real
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={loadRenderJobs} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <div className="flex items-center space-x-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <span className="text-gray-600">Auto-refresh {autoRefresh ? 'ON' : 'OFF'}</span>
          </div>
        </div>
      </div>

      {/* System Stats */}
      {showSystemStats && systemStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Audio2Face</p>
                  <p className="text-2xl font-bold">
                    {systemStats.audio2FaceStatus === 'active' ? 'Ativo' : 'Inativo'}
                  </p>
                </div>
                <div className={`w-3 h-3 rounded-full ${
                  systemStats.audio2FaceStatus === 'active' ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Jobs Ativos</p>
                  <p className="text-2xl font-bold">{systemStats.activeJobs}</p>
                </div>
                <Activity className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Taxa de Sucesso</p>
                  <p className="text-2xl font-bold">
                    {systemStats.totalJobs > 0 
                      ? Math.round((systemStats.completedJobs / systemStats.totalJobs) * 100)
                      : 0
                    }%
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tempo Médio</p>
                  <p className="text-2xl font-bold">{systemStats.averageRenderTime}s</p>
                </div>
                <Clock className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* System Load */}
      {showSystemStats && systemStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Server className="h-5 w-5" />
              <span>Carga do Sistema</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">CPU</span>
                  <span className="text-sm font-medium">{systemStats.systemLoad.cpu}%</span>
                </div>
                <Progress value={systemStats.systemLoad.cpu} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Memória</span>
                  <span className="text-sm font-medium">{systemStats.systemLoad.memory}%</span>
                </div>
                <Progress value={systemStats.systemLoad.memory} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">GPU</span>
                  <span className="text-sm font-medium">{systemStats.systemLoad.gpu}%</span>
                </div>
                <Progress value={systemStats.systemLoad.gpu} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Disco</span>
                  <span className="text-sm font-medium">{systemStats.systemLoad.disk}%</span>
                </div>
                <Progress value={systemStats.systemLoad.disk} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por avatar, ID ou texto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="processing">Processando</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="failed">Falhou</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Mais Recente</SelectItem>
                  <SelectItem value="oldest">Mais Antigo</SelectItem>
                  <SelectItem value="progress">Progresso</SelectItem>
                  <SelectItem value="duration">Duração</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Jobs List */}
      <div className="space-y-4">
        {sortedJobs.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Nenhum job encontrado</p>
              <p className="text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Tente ajustar os filtros de busca'
                  : 'Jobs de renderização aparecerão aqui'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          sortedJobs.map((job) => {
            const StatusIcon = getStatusIcon(job.status);
            const statusColor = getStatusColor(job.status);
            
            return (
              <Card key={job.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <StatusIcon className={`h-6 w-6 ${statusColor.split(' ')[0]}`} />
                      <div>
                        <h3 className="font-semibold text-lg">{job.avatarName}</h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <span>Job #{job.id.slice(0, 8)}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0"
                            onClick={() => copyJobId(job.id)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={statusColor}>
                        {job.status}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {job.status === 'processing' && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span>Progresso</span>
                        <span>{job.progress}%</span>
                      </div>
                      <Progress value={job.progress} className="h-3" />
                      <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                        <span>Tempo decorrido: {formatDuration(job.elapsedTime)}</span>
                        <span>Estimado: {formatDuration(job.estimatedTime)}</span>
                      </div>
                    </div>
                  )}

                  {/* Job Details */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-gray-500">Resolução:</span>
                      <span className="ml-2 font-medium">{job.settings.resolution}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Qualidade:</span>
                      <span className="ml-2 font-medium">{job.settings.quality}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Audio2Face:</span>
                      <span className="ml-2 font-medium">{job.settings.audio2FaceEnabled ? 'Sim' : 'Não'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Iniciado:</span>
                      <span className="ml-2 font-medium">{new Date(job.startTime).toLocaleTimeString()}</span>
                    </div>
                  </div>

                  {/* Metrics */}
                  {job.status === 'completed' && job.metrics && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4 text-sm">
                      <div>
                        <span className="text-gray-500">Tempo Render:</span>
                        <span className="ml-2 font-medium">{job.metrics.renderTime}s</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Lip Sync:</span>
                        <span className="ml-2 font-medium">{job.metrics.lipSyncAccuracy}%</span>
                      </div>
                      <div>
                        <span className="text-gray-500">FPS:</span>
                        <span className="ml-2 font-medium">{job.metrics.frameRate}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Tamanho:</span>
                        <span className="ml-2 font-medium">{job.output ? formatFileSize(job.output.fileSize) : '-'}</span>
                      </div>
                    </div>
                  )}

                  {/* Text Preview */}
                  {job.settings.text && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-700 line-clamp-2">{job.settings.text}</p>
                    </div>
                  )}

                  {/* Error Message */}
                  {job.status === 'failed' && job.error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-800">{job.error}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {job.status === 'completed' && job.output && (
                        <>
                          <Button size="sm" onClick={() => handleDownload(job)}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </Button>
                          <Button size="sm" variant="outline">
                            <Share2 className="h-4 w-4 mr-2" />
                            Compartilhar
                          </Button>
                        </>
                      )}
                      
                      {job.status === 'failed' && (
                        <Button size="sm" onClick={() => handleReprocess(job.id)}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Tentar Novamente
                        </Button>
                      )}
                      
                      {job.status === 'processing' && (
                        <Button size="sm" variant="destructive" onClick={() => handleCancelJob(job.id)}>
                          <Square className="h-4 w-4 mr-2" />
                          Cancelar
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => selectedJob?.id === job.id ? handleCloseDetails() : handleViewDetails(job)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        {selectedJob?.id === job.id ? 'Ocultar' : 'Detalhes'}
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {selectedJob?.id === job.id && (
                    <div className="mt-4 pt-4 border-t">
                      <Tabs defaultValue="settings" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="settings">Configurações</TabsTrigger>
                          <TabsTrigger value="logs">Logs</TabsTrigger>
                          <TabsTrigger value="output">Output</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="settings" className="mt-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <h4 className="font-medium mb-2">Renderização</h4>
                              <div className="space-y-1">
                                <div>Ray Tracing: {job.settings.rayTracing ? 'Sim' : 'Não'}</div>
                                <div>Lip Sync: {job.settings.realTimeLipSync ? 'Tempo Real' : 'Padrão'}</div>
                                <div>Voice Cloning: {job.settings.voiceCloning ? 'Sim' : 'Não'}</div>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium mb-2">Câmera</h4>
                              <div className="space-y-1">
                                <div>Ângulo: {job.settings.cameraAngle}</div>
                                <div>Iluminação: {job.settings.lighting}</div>
                                <div>Animação: {job.settings.animation}</div>
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="logs" className="mt-4">
                          <div className="bg-black text-green-400 p-4 rounded-md font-mono text-xs max-h-40 overflow-y-auto">
                            {job.logs.length > 0 ? (
                              job.logs.map((log, index) => (
                                <div key={index}>{log}</div>
                              ))
                            ) : (
                              <div>Nenhum log disponível</div>
                            )}
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="output" className="mt-4">
                          {job.output ? (
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <h4 className="font-medium mb-2">Arquivos</h4>
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <Video className="h-4 w-4" />
                                    <span>Vídeo: {formatFileSize(job.output.fileSize)}</span>
                                  </div>
                                  {job.output.audioUrl && (
                                    <div className="flex items-center space-x-2">
                                      <Headphones className="h-4 w-4" />
                                      <span>Áudio separado</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div>
                                <h4 className="font-medium mb-2">Informações</h4>
                                <div className="space-y-1">
                                  <div>Duração: {formatDuration(job.output.duration)}</div>
                                  <div>Qualidade: {job.settings.quality}</div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-gray-500">Nenhum output disponível</div>
                          )}
                        </TabsContent>
                      </Tabs>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}