/**
 * Hybrid Cloud Rendering Panel
 * UI component for managing hybrid rendering workflow
 */

import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { 
  Play, 
  Pause, 
  Square as Stop, 
  Download, 
  Settings, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useHybridRendering, HybridRenderSettings } from '@/hooks/useHybridRendering';

interface TimelineData {
  duration: number;
  tracks: Array<{ id: string; type: string; elements: unknown[] }>;
}

interface AssetData {
  images: Array<{ id: string; url: string }>;
  audio: Array<{ id: string; url: string }>;
  video: Array<{ id: string; url: string }>;
}

interface HybridRenderPanelProps {
  projectId: string;
  timeline: TimelineData;
  assets: AssetData;
  onRenderComplete?: (outputUrl: string) => void;
}

export function HybridRenderPanel({ 
  projectId, 
  timeline, 
  assets, 
  onRenderComplete 
}: HybridRenderPanelProps) {
  const {
    jobs,
    currentJob,
    isLoading,
    error,
    startHybridRender,
    cancelJob
  } = useHybridRendering();

  const [settings, setSettings] = useState<HybridRenderSettings>({
    proxyResolution: '720p',
    finalResolution: '1080p',
    enableSmartFlow: false,
    quality: 'production'
  });

  const [isStarting, setIsStarting] = useState(false);

  const handleStartRender = async () => {
    setIsStarting(true);
    try {
      await startHybridRender(projectId, timeline, assets, settings);
    } catch (error) {
      console.error('Failed to start render:', error);
    } finally {
      setIsStarting(false);
    }
  };

  const handleCancelJob = async (jobId: string) => {
    try {
      await cancelJob(jobId);
    } catch (error) {
      console.error('Failed to cancel job:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'proxy_ready':
        return <Play className="h-4 w-4" />;
      case 'rendering':
        return <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'bg-yellow-100 text-yellow-800',
      proxy_ready: 'bg-blue-100 text-blue-800',
      rendering: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    };

    const labels = {
      pending: 'Pendente',
      proxy_ready: 'Proxies Prontos',
      rendering: 'Renderizando',
      completed: 'Concluído',
      failed: 'Falhou'
    };

    return (
      <Badge className={variants[status as keyof typeof variants] || ''}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Renderização Híbrida em Nuvem</CardTitle>
            <CardDescription>
              Edite com proxies leves e renderize em alta qualidade no servidor
            </CardDescription>
          </div>
          <Settings className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Settings */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Resolução Proxy</label>
            <Select
              value={settings.proxyResolution}
              onValueChange={(value: any) => setSettings(prev => ({ ...prev, proxyResolution: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="360p">360p (Leve)</SelectItem>
                <SelectItem value="480p">480p (Médio)</SelectItem>
                <SelectItem value="720p">720p (Alta)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Resolução Final</label>
            <Select
              value={settings.finalResolution}
              onValueChange={(value: any) => setSettings(prev => ({ ...prev, finalResolution: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1080p">1080p Full HD</SelectItem>
                <SelectItem value="4k">4K Ultra HD</SelectItem>
                <SelectItem value="8k">8K Ultra HD</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Qualidade</label>
            <Select
              value={settings.quality}
              onValueChange={(value: any) => setSettings(prev => ({ ...prev, quality: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Rascunho (Rápido)</SelectItem>
                <SelectItem value="production">Produção (Equilibrado)</SelectItem>
                <SelectItem value="ultra">Ultra (Máxima Qualidade)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Smart Flow</label>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="smartFlow"
                checked={settings.enableSmartFlow}
                onChange={(e) => setSettings(prev => ({ ...prev, enableSmartFlow: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <label htmlFor="smartFlow" className="text-sm">
                Ativar otimizações de ritmo e continuidade
              </label>
            </div>
          </div>
        </div>

        {/* Start Render Button */}
        <Button
          onClick={handleStartRender}
          disabled={isLoading || isStarting || currentJob?.status === 'rendering'}
          className="w-full"
          size="lg"
        >
          {isStarting ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Iniciando...
            </>
          ) : currentJob?.status === 'rendering' ? (
            <>
              <Stop className="mr-2 h-4 w-4" />
              Renderizando...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Iniciar Renderização Híbrida
            </>
          )}
        </Button>

        {/* Current Job Status */}
        {currentJob && (
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getStatusIcon(currentJob.status)}
                <span className="font-medium">Job Atual</span>
                {getStatusBadge(currentJob.status)}
              </div>
              {currentJob.status !== 'completed' && currentJob.status !== 'failed' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCancelJob(currentJob.id)}
                >
                  <Stop className="h-4 w-4 mr-1" />
                  Cancelar
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso</span>
                <span>{currentJob.progress}%</span>
              </div>
              <Progress value={currentJob.progress} className="h-2" />
            </div>

            {currentJob.status === 'completed' && currentJob.outputUrl && (
              <Button
                variant="outline"
                onClick={() => window.open(currentJob.outputUrl, '_blank')}
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                Baixar Vídeo
              </Button>
            )}

            {currentJob.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{currentJob.error}</p>
              </div>
            )}
          </div>
        )}

        {/* Recent Jobs */}
        {jobs.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Jobs Recentes</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {jobs.slice(0, 5).map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-2 border rounded-md hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(job.status)}
                    <div>
                      <p className="text-sm font-medium">
                        {new Date(job.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {job.progress}% concluído
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(job.status)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}