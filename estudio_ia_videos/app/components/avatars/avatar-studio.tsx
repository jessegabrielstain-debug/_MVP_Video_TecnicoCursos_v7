/**
 * 🎬 Avatar Studio Component v2 - Hiper-Realista
 * Estúdio completo para criação e renderização de avatares 3D
 * FASE 2: Sprint 1 - Audio2Face Integration
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Play,
  Pause,
  Square,
  Download,
  Upload,
  Settings,
  Mic,
  Volume2,
  Camera,
  Monitor,
  Zap,
  Sparkles,
  Eye,
  RotateCcw,
  Save,
  Share2,
  FileText,
  Image as ImageIcon,
  Video,
  Headphones,
  Sliders,
  Palette,
  Layers,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface RenderJob {
  id: string;
  avatarId: string;
  avatarName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  estimatedTime: number;
  startTime: string;
  endTime?: string;
  settings: RenderSettings;
  output?: {
    videoUrl: string;
    audioUrl: string;
    lipSyncData: any;
  };
  error?: string;
}

interface RenderSettings {
  text: string;
  audioFile?: File;
  animation: string;
  resolution: string;
  quality: string;
  language: string;
  rayTracing: boolean;
  realTimeLipSync: boolean;
  audio2FaceEnabled: boolean;
  voiceCloning: boolean;
  backgroundMusic?: string;
  cameraAngle: string;
  lighting: string;
}

interface AvatarStudioProps {
  selectedAvatar?: any;
  onAvatarChange?: (avatar: any) => void;
}

export default function AvatarStudio({ selectedAvatar, onAvatarChange }: AvatarStudioProps) {
  const [activeTab, setActiveTab] = useState('script');
  const [renderSettings, setRenderSettings] = useState<RenderSettings>({
    text: '',
    animation: 'talking',
    resolution: '1920x1080',
    quality: 'high',
    language: 'pt-BR',
    rayTracing: true,
    realTimeLipSync: true,
    audio2FaceEnabled: true,
    voiceCloning: false,
    cameraAngle: 'front',
    lighting: 'studio'
  });
  const [renderJobs, setRenderJobs] = useState<RenderJob[]>([]);
  const [isRendering, setIsRendering] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [audio2FaceStatus, setAudio2FaceStatus] = useState<'active' | 'inactive' | 'loading'>('loading');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkAudio2FaceStatus();
    loadRenderJobs();
  }, []);

  const checkAudio2FaceStatus = async () => {
    try {
      const response = await fetch('/api/v2/avatars/render');
      const data = await response.json();
      setAudio2FaceStatus(data.audio2FaceStatus || 'inactive');
    } catch (error) {
      logger.error('Erro ao verificar status do Audio2Face', error instanceof Error ? error : new Error(String(error)), { component: 'AvatarStudio' });
      setAudio2FaceStatus('inactive');
    }
  };

  const loadRenderJobs = async () => {
    try {
      const response = await fetch('/api/v2/avatars/render');
      const data = await response.json();
      if (data.success) {
        setRenderJobs(data.jobs || []);
      }
    } catch (error) {
      logger.error('Erro ao carregar jobs de renderização', error instanceof Error ? error : new Error(String(error)), { component: 'AvatarStudio' });
    }
  };

  const handleRender = async () => {
    if (!selectedAvatar) {
      toast.error('Selecione um avatar primeiro');
      return;
    }

    try {
      setIsRendering(true);
      
      // Validar configurações de renderização
      const validationErrors = validateRenderSettings();
      if (validationErrors.length > 0) {
        toast.error(`Configurações inválidas: ${validationErrors.join(', ')}`);
        return;
      }

      // Verificar disponibilidade do Audio2Face
      const audio2FaceStatus = await fetch('/api/v2/avatars/audio2face/status');
      const statusData = await audio2FaceStatus.json();
      
      if (!statusData.available && renderSettings.audio2FaceEnabled) {
        toast.error('Audio2Face não está disponível. Desabilite a opção ou aguarde.');
        return;
      }

      // Preparar dados para renderização
      const renderData = new FormData();
      renderData.append('avatarId', selectedAvatar.id);
      renderData.append('text', renderSettings.text);
      renderData.append('language', renderSettings.language);
      renderData.append('resolution', renderSettings.resolution);
      renderData.append('quality', renderSettings.quality);
      renderData.append('rayTracing', renderSettings.rayTracing.toString());
      renderData.append('audio2FaceEnabled', renderSettings.audio2FaceEnabled.toString());
      renderData.append('realTimeLipSync', renderSettings.realTimeLipSync.toString());
      renderData.append('voiceCloning', renderSettings.voiceCloning.toString());
      renderData.append('cameraAngle', renderSettings.cameraAngle);
      renderData.append('lighting', renderSettings.lighting);
      
      if (renderSettings.audioFile) {
        renderData.append('audioFile', renderSettings.audioFile);
      }

      // Iniciar renderização via API v2
      const response = await fetch('/api/v2/avatars/render', {
        method: 'POST',
        body: renderData
      });

      const result = await response.json();
      
      if (result.success) {
        // Criar novo job de renderização
        const newJob: RenderJob = {
          id: result.data.jobId,
          avatarId: selectedAvatar.id,
          avatarName: selectedAvatar.name,
          status: 'pending',
          progress: 0,
          estimatedTime: result.data.estimatedTime,
          startTime: new Date().toISOString(),
          settings: { ...renderSettings }
        };

        // Adicionar job à lista
        setRenderJobs(prev => [newJob, ...prev]);
        
        // Iniciar monitoramento do job
        startJobMonitoring(newJob.id);
        
        toast.success(`Renderização iniciada! Job ID: ${newJob.id}`);
        
        // Mudar para aba de monitoramento
        setActiveTab('monitor');
      } else {
        toast.error(`Erro na renderização: ${result.error}`);
      }
    } catch (error) {
      logger.error('Erro ao iniciar renderização', error instanceof Error ? error : new Error(String(error)), { component: 'AvatarStudio' });
      toast.error('Erro ao conectar com o serviço de renderização');
    } finally {
      setIsRendering(false);
    }
  };

  // Função para validar configurações de renderização
  const validateRenderSettings = (): string[] => {
    const errors: string[] = [];
    
    if (!renderSettings.text.trim() && !renderSettings.audioFile) {
      errors.push('Texto ou arquivo de áudio é obrigatório');
    }
    
    if (renderSettings.text.length > 5000) {
      errors.push('Texto muito longo (máximo 5000 caracteres)');
    }
    
    if (renderSettings.audioFile && renderSettings.audioFile.size > 50 * 1024 * 1024) {
      errors.push('Arquivo de áudio muito grande (máximo 50MB)');
    }
    
    return errors;
  };

  // Função para monitorar progresso do job
  const startJobMonitoring = (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/v2/avatars/render/status/${jobId}`);
        const data = await response.json();
        
        if (data.success) {
          const jobUpdate = data.data;
          
          setRenderJobs(prev => prev.map(job => 
            job.id === jobId 
              ? {
                  ...job,
                  status: jobUpdate.status,
                  progress: jobUpdate.progress,
                  output: jobUpdate.output,
                  error: jobUpdate.error,
                  endTime: jobUpdate.endTime
                }
              : job
          ));
          
          // Parar monitoramento se job terminou
          if (['completed', 'failed'].includes(jobUpdate.status)) {
            clearInterval(interval);
            
            if (jobUpdate.status === 'completed') {
              toast.success(`Renderização concluída! Job ${jobId}`);
            } else if (jobUpdate.status === 'failed') {
              toast.error(`Renderização falhou: ${jobUpdate.error}`);
            }
          }
        }
      } catch (error) {
        logger.error('Erro ao monitorar job', error instanceof Error ? error : new Error(String(error)), { component: 'AvatarStudio', jobId });
      }
    }, 2000); // Verificar a cada 2 segundos
    
    // Limpar interval após 30 minutos
    setTimeout(() => clearInterval(interval), 30 * 60 * 1000);
  };

  // Função para cancelar job
  const handleCancelJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/v2/avatars/render/${jobId}/cancel`, {
        method: 'POST'
      });
      
      if (response.ok) {
        setRenderJobs(prev => prev.map(job => 
          job.id === jobId ? { ...job, status: 'failed', error: 'Cancelado pelo usuário' } : job
        ));
        toast.success('Job cancelado com sucesso');
      }
    } catch (error) {
      logger.error('Erro ao cancelar job', error instanceof Error ? error : new Error(String(error)), { component: 'AvatarStudio', jobId });
      toast.error('Erro ao cancelar job');
    }
  };

  // Função para fazer download do resultado
  const handleDownloadResult = async (job: RenderJob) => {
    if (!job.output?.videoUrl) return;
    
    try {
      const response = await fetch(job.output.videoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `avatar-render-${job.id}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Download iniciado');
    } catch (error) {
      logger.error('Erro no download', error instanceof Error ? error : new Error(String(error)), { component: 'AvatarStudio', jobId: job.id });
      toast.error('Erro ao fazer download');
    }
  };

  const handlePreview = async () => {
    if (!selectedAvatar) {
      toast.error('Selecione um avatar primeiro');
      return;
    }

    setPreviewMode(true);
    
    try {
      const response = await fetch('/api/v2/avatars/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'preview',
          avatarId: selectedAvatar.id,
          text: renderSettings.text || 'Preview do avatar com sincronização labial.',
          settings: {
            animation: renderSettings.animation,
            cameraAngle: renderSettings.cameraAngle,
            lighting: renderSettings.lighting
          }
        })
      });

      const result = await response.json();
      if (result.success) {
        toast.success('Preview gerado!');
      }
    } catch (error) {
      logger.error('Erro ao gerar preview', error instanceof Error ? error : new Error(String(error)), { component: 'AvatarStudio', avatarId: selectedAvatar?.id });
      toast.error('Erro ao gerar preview');
    } finally {
      setPreviewMode(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('audio/')) {
        setRenderSettings(prev => ({ ...prev, audioFile: file }));
        toast.success('Arquivo de áudio carregado');
      } else {
        toast.error('Apenas arquivos de áudio são suportados');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'processing': return 'text-blue-600';
      case 'failed': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'processing': return Clock;
      case 'failed': return AlertCircle;
      default: return Info;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Avatar Studio</h2>
          <p className="text-gray-600">
            Criação e renderização de avatares 3D hiper-realistas
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              audio2FaceStatus === 'active' ? 'bg-green-500' : 
              audio2FaceStatus === 'loading' ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
            <span className="text-sm text-gray-600">
              Audio2Face {audio2FaceStatus === 'active' ? 'Ativo' : audio2FaceStatus === 'loading' ? 'Carregando' : 'Inativo'}
            </span>
          </div>
          {selectedAvatar && (
            <Badge className="bg-purple-100 text-purple-800">
              {selectedAvatar.name}
            </Badge>
          )}
        </div>
      </div>

      {/* Avatar Selection */}
      {!selectedAvatar && (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-gray-500 mb-4">
              <Camera className="h-12 w-12 mx-auto mb-2" />
              <p>Selecione um avatar para começar</p>
              <p className="text-sm">Escolha um avatar da galeria para iniciar a criação</p>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedAvatar && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="script" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Script</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Configurações</span>
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center space-x-2">
              <Eye className="h-4 w-4" />
              <span>Preview</span>
            </TabsTrigger>
            <TabsTrigger value="monitor" className="flex items-center space-x-2">
              <Monitor className="h-4 w-4" />
              <span>Monitor</span>
            </TabsTrigger>
          </TabsList>

          {/* Script Tab */}
          <TabsContent value="script" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Conteúdo do Vídeo</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="script-text">Texto para Fala</Label>
                  <Textarea
                    id="script-text"
                    placeholder="Digite o texto que o avatar irá falar..."
                    value={renderSettings.text}
                    onChange={(e) => setRenderSettings(prev => ({ ...prev, text: e.target.value }))}
                    rows={6}
                    className="mt-2"
                  />
                  <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                    <span>{renderSettings.text.length} caracteres</span>
                    <span>~{Math.ceil(renderSettings.text.length / 150)} segundos</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <Label>Ou carregue um arquivo de áudio</Label>
                  <div className="mt-2 flex items-center space-x-4">
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center space-x-2"
                    >
                      <Upload className="h-4 w-4" />
                      <span>Carregar Áudio</span>
                    </Button>
                    {renderSettings.audioFile && (
                      <div className="flex items-center space-x-2">
                        <Headphones className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-600">{renderSettings.audioFile.name}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setRenderSettings(prev => ({ ...prev, audioFile: undefined }))}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="animation">Animação</Label>
                    <Select value={renderSettings.animation} onValueChange={(value) => setRenderSettings(prev => ({ ...prev, animation: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="talking">Falando</SelectItem>
                        <SelectItem value="presenting">Apresentando</SelectItem>
                        <SelectItem value="explaining">Explicando</SelectItem>
                        <SelectItem value="greeting">Cumprimentando</SelectItem>
                        <SelectItem value="professional">Profissional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="language">Idioma</Label>
                    <Select value={renderSettings.language} onValueChange={(value) => setRenderSettings(prev => ({ ...prev, language: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                        <SelectItem value="en-US">English (US)</SelectItem>
                        <SelectItem value="es-ES">Español</SelectItem>
                        <SelectItem value="fr-FR">Français</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Qualidade e Renderização */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Sliders className="h-5 w-5" />
                    <span>Qualidade e Renderização</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Resolução</Label>
                    <Select value={renderSettings.resolution} onValueChange={(value) => setRenderSettings(prev => ({ ...prev, resolution: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1280x720">HD (1280x720)</SelectItem>
                        <SelectItem value="1920x1080">Full HD (1920x1080)</SelectItem>
                        <SelectItem value="2560x1440">2K (2560x1440)</SelectItem>
                        <SelectItem value="3840x2160">4K (3840x2160)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Qualidade</Label>
                    <Select value={renderSettings.quality} onValueChange={(value) => setRenderSettings(prev => ({ ...prev, quality: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Rascunho (Rápido)</SelectItem>
                        <SelectItem value="standard">Padrão</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="ultra">Ultra (Lento)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="ray-tracing">Ray Tracing</Label>
                    <Switch
                      id="ray-tracing"
                      checked={renderSettings.rayTracing}
                      onCheckedChange={(checked) => setRenderSettings(prev => ({ ...prev, rayTracing: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="real-time-sync">Lip Sync em Tempo Real</Label>
                    <Switch
                      id="real-time-sync"
                      checked={renderSettings.realTimeLipSync}
                      onCheckedChange={(checked) => setRenderSettings(prev => ({ ...prev, realTimeLipSync: checked }))}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Audio2Face e Voz */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Mic className="h-5 w-5" />
                    <span>Audio2Face e Voz</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="audio2face">Audio2Face</Label>
                      <p className="text-sm text-gray-500">Sincronização labial avançada</p>
                    </div>
                    <Switch
                      id="audio2face"
                      checked={renderSettings.audio2FaceEnabled}
                      onCheckedChange={(checked) => setRenderSettings(prev => ({ ...prev, audio2FaceEnabled: checked }))}
                      disabled={audio2FaceStatus !== 'active'}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="voice-cloning">Voice Cloning</Label>
                      <p className="text-sm text-gray-500">Clonagem de voz personalizada</p>
                    </div>
                    <Switch
                      id="voice-cloning"
                      checked={renderSettings.voiceCloning}
                      onCheckedChange={(checked) => setRenderSettings(prev => ({ ...prev, voiceCloning: checked }))}
                    />
                  </div>

                  {audio2FaceStatus !== 'active' && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <div className="flex items-center space-x-2 text-yellow-800">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">Audio2Face não está ativo</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Câmera e Iluminação */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Camera className="h-5 w-5" />
                    <span>Câmera e Iluminação</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Ângulo da Câmera</Label>
                    <Select value={renderSettings.cameraAngle} onValueChange={(value) => setRenderSettings(prev => ({ ...prev, cameraAngle: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="front">Frontal</SelectItem>
                        <SelectItem value="slight-left">Levemente à Esquerda</SelectItem>
                        <SelectItem value="slight-right">Levemente à Direita</SelectItem>
                        <SelectItem value="profile-left">Perfil Esquerdo</SelectItem>
                        <SelectItem value="profile-right">Perfil Direito</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Iluminação</Label>
                    <Select value={renderSettings.lighting} onValueChange={(value) => setRenderSettings(prev => ({ ...prev, lighting: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="studio">Estúdio</SelectItem>
                        <SelectItem value="natural">Natural</SelectItem>
                        <SelectItem value="dramatic">Dramática</SelectItem>
                        <SelectItem value="soft">Suave</SelectItem>
                        <SelectItem value="cinematic">Cinematográfica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="h-5 w-5" />
                  <span>Preview do Avatar</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Preview do avatar será exibido aqui</p>
                    <Button onClick={handlePreview} disabled={previewMode}>
                      {previewMode ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Gerando Preview...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Gerar Preview
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Monitor Tab */}
          <TabsContent value="monitor" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Jobs de Renderização</h3>
              <Button onClick={loadRenderJobs} variant="outline" size="sm">
                <RotateCcw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </div>

            <div className="space-y-4">
              {renderJobs.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Nenhum job de renderização encontrado</p>
                  </CardContent>
                </Card>
              ) : (
                renderJobs.map((job) => {
                  const StatusIcon = getStatusIcon(job.status);
                  return (
                    <Card key={job.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <StatusIcon className={`h-5 w-5 ${getStatusColor(job.status)}`} />
                            <div>
                              <h4 className="font-medium">{job.avatarName}</h4>
                              <p className="text-sm text-gray-500">Job #{job.id.slice(0, 8)}</p>
                            </div>
                          </div>
                          <Badge variant={job.status === 'completed' ? 'default' : 'secondary'}>
                            {job.status}
                          </Badge>
                        </div>

                        {job.status === 'processing' && (
                          <div className="mb-3">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span>Progresso</span>
                              <span>{job.progress}%</span>
                            </div>
                            <Progress value={job.progress} className="h-2" />
                            <p className="text-xs text-gray-500 mt-1">
                              Tempo estimado: {job.estimatedTime}s
                            </p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Resolução:</span>
                            <span className="ml-2">{job.settings.resolution}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Qualidade:</span>
                            <span className="ml-2">{job.settings.quality}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Audio2Face:</span>
                            <span className="ml-2">{job.settings.audio2FaceEnabled ? 'Sim' : 'Não'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Iniciado:</span>
                            <span className="ml-2">{new Date(job.startTime).toLocaleTimeString()}</span>
                          </div>
                        </div>

                        {job.status === 'completed' && job.output && (
                          <div className="flex space-x-2 mt-4">
                            <Button size="sm" variant="outline" onClick={() => handleDownloadResult(job)}>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                            <Button size="sm" variant="outline">
                              <Share2 className="h-4 w-4 mr-2" />
                              Compartilhar
                            </Button>
                          </div>
                        )}

                        {job.status === 'processing' && (
                          <div className="flex space-x-2 mt-4">
                            <Button size="sm" variant="outline" onClick={() => handleCancelJob(job.id)}>
                              <X className="h-4 w-4 mr-2" />
                              Cancelar
                            </Button>
                          </div>
                        )}

                        {job.status === 'failed' && job.error && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm text-red-800">{job.error}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Action Buttons */}
      {selectedAvatar && (
        <div className="flex items-center justify-between pt-6 border-t">
          <div className="flex items-center space-x-4">
            <Button onClick={handlePreview} variant="outline" disabled={previewMode}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button onClick={() => setRenderSettings({
              text: '',
              animation: 'talking',
              resolution: '1920x1080',
              quality: 'high',
              language: 'pt-BR',
              rayTracing: true,
              realTimeLipSync: true,
              audio2FaceEnabled: true,
              voiceCloning: false,
              cameraAngle: 'front',
              lighting: 'studio'
            })} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Button onClick={handleRender} disabled={isRendering} className="bg-purple-600 hover:bg-purple-700">
              {isRendering ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Renderizando...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Renderizar
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}