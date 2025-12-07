/**
 * 🎬 Motionity Integration Component
 * Professional timeline engine integration for advanced video editing
 */

'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  Sparkles, 
  Zap, 
  TrendingUp, 
  Settings, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward,
  Save,
  Download,
  Upload,
  FileVideo,
  Clock,
  Layers,
  Move,
  Palette,
  RotateCw,
  Scale,
  Eye,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Plus,
  Trash2,
  Copy,
  Film,
  Type,
  Image as ImageIcon,
  Music,
  Square
} from 'lucide-react';
import { useAdvancedKeyframes } from '@/hooks/useAdvancedKeyframes';
import { useToast } from '@/hooks/use-toast';

// Motionity-style Project Structure
interface MotionityProject {
  id: string;
  name: string;
  description: string;
  version: string;
  settings: {
    width: number;
    height: number;
    fps: number;
    duration: number;
    quality: 'draft' | 'preview' | 'final';
    codec: 'h264' | 'h265' | 'vp9' | 'av1';
  };
  timeline: {
    currentTime: number;
    zoom: number;
    isPlaying: boolean;
  };
  elements: MotionityElement[];
  status: 'editing' | 'rendering' | 'complete' | 'error';
}

interface MotionityElement {
  id: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'shape' | 'avatar';
  name: string;
  layer: number;
  duration: number;
  startTime: number;
  locked: boolean;
  visible: boolean;
  properties: {
    [key: string]: unknown;
  };
  animations: {
    [property: string]: MotionityAnimation;
  };
}

interface MotionityAnimation {
  property: string;
  keyframes: MotionityKeyframe[];
  easing: string;
  loop: boolean;
  pingPong: boolean;
}

interface MotionityKeyframe {
  time: number;
  value: unknown;
  easing: string;
}

interface MotionityIntegrationProps {
  onProjectCreate?: (project: MotionityProject) => void;
  onProjectUpdate?: (project: MotionityProject) => void;
  initialProject?: MotionityProject;
}

export default function MotionityIntegration({ 
  onProjectCreate, 
  onProjectUpdate, 
  initialProject 
}: MotionityIntegrationProps) {
  const { toast } = useToast();
  const {
    tracks,
    setTracks,
    addKeyframe,
    removeKeyframe,
    updateKeyframe,
    getValuesAtTime,
    createTrack,
    ADVANCED_EASING
  } = useAdvancedKeyframes();

  const [project, setProject] = useState<MotionityProject>(
    initialProject || {
      id: `motionity-${Date.now()}`,
      name: 'Novo Projeto Motionity',
      description: 'Projeto criado com integração Motionity PoC',
      version: '1.0.0',
      settings: {
        width: 1920,
        height: 1080,
        fps: 30,
        duration: 60,
        quality: 'preview',
        codec: 'h264'
      },
      timeline: {
        currentTime: 0,
        zoom: 1,
        isPlaying: false
      },
      elements: [],
      status: 'editing'
    }
  );

  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'keyframes' | 'settings'>('overview');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const playbackTimer = useRef<NodeJS.Timeout | null>(null);

  // Initialize demo elements
  useEffect(() => {
    if (project.elements.length === 0) {
      const demoElements: MotionityElement[] = [
        {
          id: 'demo-text',
          type: 'text',
          name: 'Título Animado',
          layer: 2,
          duration: 8,
          startTime: 0,
          locked: false,
          visible: true,
          properties: {
            text: 'Motionity Integration PoC',
            fontSize: 48,
            fontWeight: 700,
            color: '#ffffff',
            x: 960,
            y: 540,
            scaleX: 1,
            scaleY: 1,
            rotation: 0,
            opacity: 1
          },
          animations: {
            x: {
              property: 'x',
              keyframes: [
                { time: 0, value: 400, easing: 'ease-out' },
                { time: 2, value: 960, easing: 'bounce' }
              ],
              easing: 'ease-out',
              loop: false,
              pingPong: false
            },
            scaleX: {
              property: 'scaleX',
              keyframes: [
                { time: 0, value: 0, easing: 'elastic' },
                { time: 1.5, value: 1, easing: 'ease-out' }
              ],
              easing: 'elastic',
              loop: false,
              pingPong: false
            },
            opacity: {
              property: 'opacity',
              keyframes: [
                { time: 0, value: 0, easing: 'ease-in' },
                { time: 1, value: 1, easing: 'ease-out' },
                { time: 7, value: 1, easing: 'ease-in' },
                { time: 8, value: 0, easing: 'ease-out' }
              ],
              easing: 'ease-in-out',
              loop: false,
              pingPong: false
            }
          }
        },
        {
          id: 'demo-shape',
          type: 'shape',
          name: 'Background Shape',
          layer: 1,
          duration: 10,
          startTime: 1,
          locked: false,
          visible: true,
          properties: {
            shape: 'rectangle',
            width: 800,
            height: 400,
            x: 960,
            y: 540,
            color: '#3b82f6',
            borderRadius: 20,
            opacity: 0.8,
            rotation: 0,
            scaleX: 1,
            scaleY: 1
          },
          animations: {
            rotation: {
              property: 'rotation',
              keyframes: [
                { time: 1, value: 0, easing: 'linear' },
                { time: 11, value: 360, easing: 'linear' }
              ],
              easing: 'linear',
              loop: true,
              pingPong: false
            },
            scaleX: {
              property: 'scaleX',
              keyframes: [
                { time: 1, value: 0.5, easing: 'ease-in-out' },
                { time: 6, value: 1.2, easing: 'ease-in-out' },
                { time: 11, value: 0.5, easing: 'ease-in-out' }
              ],
              easing: 'ease-in-out',
              loop: true,
              pingPong: true
            }
          }
        }
      ];

      setProject(prev => ({ ...prev, elements: demoElements }));
    }
  }, []);

  // Playback controls
  const togglePlayback = useCallback(() => {
    if (project.timeline.isPlaying) {
      if (playbackTimer.current) {
        clearInterval(playbackTimer.current);
      }
      setProject(prev => ({
        ...prev,
        timeline: { ...prev.timeline, isPlaying: false }
      }));
    } else {
      setProject(prev => ({
        ...prev,
        timeline: { ...prev.timeline, isPlaying: true }
      }));
      
      playbackTimer.current = setInterval(() => {
        setProject(prev => {
          if (!prev.timeline.isPlaying) return prev;
          
          const newTime = prev.timeline.currentTime + (1 / prev.settings.fps);
          if (newTime >= prev.settings.duration) {
            if (playbackTimer.current) {
              clearInterval(playbackTimer.current);
            }
            return {
              ...prev,
              timeline: { 
                ...prev.timeline, 
                currentTime: prev.settings.duration, 
                isPlaying: false 
              }
            };
          }
          
          return {
            ...prev,
            timeline: { ...prev.timeline, currentTime: newTime }
          };
        });
      }, 1000 / project.settings.fps);
    }
  }, [project.timeline.isPlaying, project.settings.fps]);

  const seekTo = useCallback((time: number) => {
    setProject(prev => ({
      ...prev,
      timeline: {
        ...prev.timeline,
        currentTime: Math.max(0, Math.min(time, prev.settings.duration))
      }
    }));
  }, []);

  const stopPlayback = useCallback(() => {
    if (playbackTimer.current) {
      clearInterval(playbackTimer.current);
    }
    setProject(prev => ({
      ...prev,
      timeline: { ...prev.timeline, currentTime: 0, isPlaying: false }
    }));
  }, []);

  // Create new element
  const createElement = useCallback((type: MotionityElement['type']) => {
    const newElement: MotionityElement = {
      id: `element-${Date.now()}`,
      type,
      name: `Novo ${type}`,
      layer: project.elements.length + 1,
      duration: 5,
      startTime: project.timeline.currentTime,
      locked: false,
      visible: true,
      properties: {
        x: project.settings.width / 2,
        y: project.settings.height / 2,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        opacity: 1,
        ...(type === 'text' && {
          text: 'Novo Texto',
          fontSize: 32,
          fontWeight: 400,
          color: '#ffffff'
        }),
        ...(type === 'shape' && {
          shape: 'rectangle',
          width: 200,
          height: 200,
          color: '#3b82f6',
          borderRadius: 0
        })
      },
      animations: {}
    };

    setProject(prev => ({
      ...prev,
      elements: [...prev.elements, newElement]
    }));

    toast({
      title: "Elemento criado",
      description: `${type} adicionado ao projeto`
    });
  }, [project.elements.length, project.timeline.currentTime, project.settings, toast]);

  // Process project (simulate Motionity processing)
  const processProject = useCallback(async () => {
    setIsProcessing(true);
    setProcessingProgress(0);
    
    try {
      // Simulate processing steps
      const steps = [
        'Validando elementos...',
        'Processando animações...',
        'Otimizando keyframes...',
        'Gerando preview...',
        'Finalizando...'
      ];

      for (let i = 0; i < steps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setProcessingProgress(((i + 1) / steps.length) * 100);
        
        toast({
          title: "Processando",
          description: steps[i]
        });
      }

      setProject(prev => ({ ...prev, status: 'complete' }));
      
      toast({
        title: "Processamento concluído",
        description: "Projeto processado com sucesso!"
      });

      if (onProjectUpdate) {
        onProjectUpdate(project);
      }

    } catch (error) {
      setProject(prev => ({ ...prev, status: 'error' }));
      
      toast({
        title: "Erro no processamento",
        description: "Falha ao processar o projeto",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  }, [project, onProjectUpdate, toast]);

  // Export project
  const exportProject = useCallback(() => {
    const exportData = {
      ...project,
      exportDate: new Date().toISOString(),
      motionityVersion: '1.0.0-poc'
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/\s+/g, '_')}_motionity.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Projeto exportado",
      description: "Arquivo JSON salvo com sucesso"
    });
  }, [project, toast]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (playbackTimer.current) {
        clearInterval(playbackTimer.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-yellow-400" />
              <div>
                <h1 className="text-2xl font-bold">{project.name}</h1>
                <p className="text-gray-400">{project.description}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-300">
                <Zap className="mr-1 h-3 w-3" />
                Motionity PoC
              </Badge>
              
              <Badge variant="outline" className={
                project.status === 'editing' ? 'border-blue-500 text-blue-400' :
                project.status === 'rendering' ? 'border-orange-500 text-orange-400' :
                project.status === 'complete' ? 'border-green-500 text-green-400' :
                'border-red-500 text-red-400'
              }>
                {project.status === 'editing' && <Settings className="mr-1 h-3 w-3" />}
                {project.status === 'rendering' && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                {project.status === 'complete' && <CheckCircle className="mr-1 h-3 w-3" />}
                {project.status === 'error' && <AlertTriangle className="mr-1 h-3 w-3" />}
                {project.status}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={exportProject}>
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            
            <Button 
              onClick={processProject} 
              disabled={isProcessing}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Processar
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Processing Progress */}
        {isProcessing && (
          <div className="mt-4">
            <Progress value={processingProgress} className="h-2" />
            <p className="text-sm text-gray-400 mt-1">
              Processando projeto... {Math.round(processingProgress)}%
            </p>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'overview' | 'timeline' | 'keyframes' | 'settings')} className="h-full">
          {/* Tabs Navigation */}
          <div className="bg-gray-800 border-b border-gray-700 px-6">
            <TabsList className="bg-gray-700">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="timeline" className="flex items-center gap-2">
                <Film className="h-4 w-4" />
                Timeline
              </TabsTrigger>
              <TabsTrigger value="keyframes" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Keyframes
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configurações
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Project Info */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileVideo className="h-5 w-5" />
                    Informações do Projeto
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs text-gray-400">Nome</Label>
                    <p className="font-medium">{project.name}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400">Resolução</Label>
                    <p className="font-medium">{project.settings.width}x{project.settings.height}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400">FPS</Label>
                    <p className="font-medium">{project.settings.fps}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-400">Duração</Label>
                    <p className="font-medium">{project.settings.duration}s</p>
                  </div>
                </CardContent>
              </Card>

              {/* Elements Overview */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    Elementos ({project.elements.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-40">
                    <div className="space-y-2">
                      {project.elements.map((element) => (
                        <div
                          key={element.id}
                          className="flex items-center gap-3 p-2 rounded bg-gray-700 cursor-pointer hover:bg-gray-600"
                          onClick={() => setSelectedElements([element.id])}
                        >
                          {element.type === 'text' && <Type className="h-4 w-4 text-green-400" />}
                          {element.type === 'image' && <ImageIcon className="h-4 w-4 text-blue-400" />}
                          {element.type === 'video' && <Film className="h-4 w-4 text-purple-400" />}
                          {element.type === 'audio' && <Music className="h-4 w-4 text-orange-400" />}
                          {element.type === 'shape' && <Square className="h-4 w-4 text-pink-400" />}
                          
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{element.name}</p>
                            <p className="text-xs text-gray-400">
                              {element.startTime}s - {element.startTime + element.duration}s
                            </p>
                          </div>
                          
                          {Object.keys(element.animations).length > 0 && (
                            <Badge variant="secondary" className="text-xs bg-yellow-500/20 text-yellow-300">
                              <Zap className="h-2 w-2 mr-1" />
                              {Object.keys(element.animations).length}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Adicionar Elemento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => createElement('text')}
                  >
                    <Type className="mr-2 h-4 w-4" />
                    Texto
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => createElement('shape')}
                  >
                    <Square className="mr-2 h-4 w-4" />
                    Forma
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => createElement('image')}
                  >
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Imagem
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => createElement('video')}
                  >
                    <Film className="mr-2 h-4 w-4" />
                    Vídeo
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Playback Controls */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Controles de Reprodução
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={stopPlayback}>
                      <SkipBack className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={project.timeline.isPlaying ? "default" : "outline"}
                      size="sm"
                      onClick={togglePlayback}
                      className={project.timeline.isPlaying ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                      {project.timeline.isPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => seekTo(project.settings.duration)}>
                      <SkipForward className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex-1">
                    <input
                      type="range"
                      min="0"
                      max={project.settings.duration}
                      step="0.1"
                      value={project.timeline.currentTime}
                      onChange={(e) => seekTo(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div className="text-sm font-mono bg-gray-700 px-3 py-1 rounded">
                    {project.timeline.currentTime.toFixed(1)}s / {project.settings.duration}s
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="m-0 h-full">
            <div className="text-center py-20 text-gray-400">
              <Film className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Timeline Avançada</h3>
              <p>Interface de timeline profissional será renderizada aqui</p>
              <p className="text-sm mt-2">Use o componente AdvancedTimelineEditor para visualização completa</p>
            </div>
          </TabsContent>

          {/* Keyframes Tab */}
          <TabsContent value="keyframes" className="m-0 h-full">
            <div className="text-center py-20 text-gray-400">
              <TrendingUp className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Editor de Keyframes</h3>
              <p>Sistema avançado de keyframes em desenvolvimento</p>
              <div className="mt-4 text-left max-w-md mx-auto text-sm">
                <p className="font-medium mb-2">Recursos disponíveis:</p>
                <ul className="space-y-1 text-gray-300">
                  <li>• Interpolação Bezier</li>
                  <li>• Easing avançado (bounce, elastic, spring)</li>
                  <li>• Múltiplas propriedades animáveis</li>
                  <li>• Copy/paste de keyframes</li>
                  <li>• Otimização automática</li>
                </ul>
              </div>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="p-6">
            <div className="max-w-2xl mx-auto space-y-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>Configurações do Projeto</CardTitle>
                  <CardDescription>
                    Defina as configurações básicas do seu projeto Motionity
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Largura</Label>
                      <Input
                        type="number"
                        value={project.settings.width}
                        onChange={(e) => setProject(prev => ({
                          ...prev,
                          settings: { ...prev.settings, width: parseInt(e.target.value) }
                        }))}
                      />
                    </div>
                    <div>
                      <Label>Altura</Label>
                      <Input
                        type="number"
                        value={project.settings.height}
                        onChange={(e) => setProject(prev => ({
                          ...prev,
                          settings: { ...prev.settings, height: parseInt(e.target.value) }
                        }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>FPS</Label>
                      <Select
                        value={project.settings.fps.toString()}
                        onValueChange={(value) => setProject(prev => ({
                          ...prev,
                          settings: { ...prev.settings, fps: parseInt(value) }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="24">24 FPS</SelectItem>
                          <SelectItem value="30">30 FPS</SelectItem>
                          <SelectItem value="60">60 FPS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Duração (segundos)</Label>
                      <Input
                        type="number"
                        value={project.settings.duration}
                        onChange={(e) => setProject(prev => ({
                          ...prev,
                          settings: { ...prev.settings, duration: parseInt(e.target.value) }
                        }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Qualidade</Label>
                      <Select
                        value={project.settings.quality}
                        onValueChange={(value: string) => setProject(prev => ({
                          ...prev,
                          settings: { ...prev.settings, quality: value as 'draft' | 'preview' | 'final' }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Rascunho</SelectItem>
                          <SelectItem value="preview">Preview</SelectItem>
                          <SelectItem value="final">Final</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Codec</Label>
                      <Select
                        value={project.settings.codec}
                        onValueChange={(value: string) => setProject(prev => ({
                          ...prev,
                          settings: { ...prev.settings, codec: value as 'h264' | 'h265' | 'vp9' | 'av1' }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="h264">H.264</SelectItem>
                          <SelectItem value="h265">H.265</SelectItem>
                          <SelectItem value="vp9">VP9</SelectItem>
                          <SelectItem value="av1">AV1</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>Informações da Integração</CardTitle>
                </CardHeader>
                <CardContent>
                  <Alert>
                    <Sparkles className="h-4 w-4" />
                    <AlertDescription>
                      Esta é uma Prova de Conceito (PoC) da integração com Motionity. 
                      O sistema demonstra recursos avançados de timeline, keyframes e animações 
                      profissionais para edição de vídeo.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}