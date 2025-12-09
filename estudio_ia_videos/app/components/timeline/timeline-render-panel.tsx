
/**
 * Painel de Renderização na Timeline
 */
'use client';

import { useState } from 'react';
import { logger } from '@/lib/logger';
import { useTimelineRender } from '@/lib/hooks/use-timeline-render';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Play, 
  Loader2, 
  Download, 
  X, 
  CheckCircle,
  Film,
  Settings as SettingsIcon,
} from 'lucide-react';

interface TimelineRenderPanelProps {
  projectId: string;
  timelineId: string;
  projectName: string;
  duration: number;
  clips: unknown[];
}

export function TimelineRenderPanel({
  projectId,
  timelineId,
  projectName,
  duration,
  clips,
}: TimelineRenderPanelProps) {
  const {
    isRendering,
    renderProgress,
    renderJobId,
    error,
    startTimelineRender,
    cancelRender,
    reset,
  } = useTimelineRender();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [settings, setSettings] = useState({
    resolution: '1080p' as '720p' | '1080p' | '4k',
    fps: 30 as 24 | 30 | 60,
    format: 'mp4' as 'mp4' | 'webm' | 'mov',
    quality: 'high' as 'low' | 'medium' | 'high' | 'ultra',
    audio: true,
  });

  const handleRender = async () => {
    try {
      await startTimelineRender({
        projectId,
        timelineId,
        projectName,
        duration,
        clips,
        settings,
      });
      setIsDialogOpen(false);
    } catch (error) {
      logger.error('Erro ao renderizar', error instanceof Error ? error : new Error(String(error)), { projectId, timelineId, settings, component: 'TimelineRenderPanel' });
    }
  };

  const handleCancel = async () => {
    await cancelRender();
    reset();
  };

  return (
    <>
      {/* Botão Renderizar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button size="lg" className="gap-2">
            <Film className="w-5 h-5" />
            Renderizar Vídeo
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configurações de Renderização</DialogTitle>
            <DialogDescription>
              Ajuste as configurações antes de renderizar seu vídeo
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Resumo */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Resumo do Projeto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Projeto:</span>
                  <span className="font-medium">{projectName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duração:</span>
                  <span className="font-medium">{duration}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Clips:</span>
                  <span className="font-medium">{clips.length}</span>
                </div>
              </CardContent>
            </Card>

            {/* Configurações */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Resolução</Label>
                <Select
                  value={settings.resolution}
                  onValueChange={(value: string) => setSettings({ ...settings, resolution: value as '720p' | '1080p' | '4k' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="720p">720p (HD)</SelectItem>
                    <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                    <SelectItem value="4k">4K (Ultra HD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>FPS</Label>
                <Select
                  value={String(settings.fps)}
                  onValueChange={(value) => setSettings({ ...settings, fps: parseInt(value) as 24 | 30 | 60 })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24">24 fps (Cinema)</SelectItem>
                    <SelectItem value="30">30 fps (Padrão)</SelectItem>
                    <SelectItem value="60">60 fps (Smooth)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Formato</Label>
                <Select
                  value={settings.format}
                  onValueChange={(value: string) => setSettings({ ...settings, format: value as 'mp4' | 'webm' | 'mov' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mp4">MP4 (Universal)</SelectItem>
                    <SelectItem value="webm">WebM (Web)</SelectItem>
                    <SelectItem value="mov">MOV (Apple)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Qualidade</Label>
                <Select
                  value={settings.quality}
                  onValueChange={(value: string) => setSettings({ ...settings, quality: value as 'low' | 'medium' | 'high' | 'ultra' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa (Rápido)</SelectItem>
                    <SelectItem value="medium">Média (Balanceado)</SelectItem>
                    <SelectItem value="high">Alta (Recomendado)</SelectItem>
                    <SelectItem value="ultra">Ultra (Lento)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={settings.audio}
                onCheckedChange={(checked) => setSettings({ ...settings, audio: checked })}
              />
              <Label>Incluir Áudio</Label>
            </div>

            {/* Estimativa */}
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <SettingsIcon className="w-4 h-4" />
                  <span>
                    Tempo estimado: ~{Math.ceil(duration / 10)} minutos
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleRender} disabled={isRendering}>
              {isRendering ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Renderizando...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Iniciar Renderização
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Status de Renderização */}
      {isRendering && (
        <Card className="mt-4 border-blue-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                <CardTitle>Renderizando Vídeo...</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Progresso</span>
                <span className="font-medium">{renderProgress}%</span>
              </div>
              <Progress value={renderProgress} className="h-2" />
            </div>
            <div className="text-sm text-muted-foreground">
              Job ID: {renderJobId?.slice(0, 20)}...
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sucesso */}
      {renderProgress === 100 && !isRendering && (
        <Card className="mt-4 border-green-500 bg-green-50 dark:bg-green-950">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-500" />
              <div className="flex-1">
                <div className="font-medium">Renderização Concluída!</div>
                <div className="text-sm text-muted-foreground">
                  Seu vídeo está pronto para download
                </div>
              </div>
              <Button size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Erro */}
      {error && (
        <Card className="mt-4 border-red-500 bg-red-50 dark:bg-red-950">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <X className="w-6 h-6 text-red-500" />
              <div className="flex-1">
                <div className="font-medium">Erro na Renderização</div>
                <div className="text-sm text-muted-foreground">{error}</div>
              </div>
              <Button size="sm" variant="outline" onClick={reset}>
                Tentar Novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
