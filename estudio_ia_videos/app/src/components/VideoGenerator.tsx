'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { 
  Play, 
  Pause, 
  Download, 
  Upload,
  Video,
  Settings,
  Mic,
  User,
  Palette,
  Clock,
  Zap,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  Share2,
  RotateCcw,
  Trash2,
  Copy,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

// Interfaces
interface VideoProject {
  id: string;
  name: string;
  text: string;
  voice: string;
  avatar: string;
  background: string;
  resolution: string;
  fps: number;
  duration: number;
  status: 'draft' | 'processing' | 'completed' | 'error';
  progress: number;
  createdAt: Date;
  updatedAt: Date;
  videoUrl?: string;
  thumbnailUrl?: string;
}

interface VideoSettings {
  resolution: '720p' | '1080p' | '4K';
  fps: 24 | 30 | 60;
  quality: 'draft' | 'standard' | 'high' | 'ultra';
  format: 'mp4' | 'webm' | 'mov';
  background: string;
  lighting: 'natural' | 'studio' | 'dramatic' | 'soft';
  cameraAngle: 'front' | 'slight-left' | 'slight-right' | 'close-up';
  avatarScale: number;
  backgroundBlur: number;
}

interface ProcessingStage {
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  duration?: number;
  error?: string;
}

interface Voice {
  id: string;
  name: string;
  language: string;
  gender: 'male' | 'female';
  age: 'young' | 'adult' | 'mature';
  style: 'natural' | 'professional' | 'casual' | 'energetic';
  preview?: string;
}

interface Avatar {
  id: string;
  name: string;
  gender: 'male' | 'female';
  ethnicity: string;
  style: 'realistic' | 'cartoon' | 'anime';
  thumbnailUrl: string;
  modelUrl: string;
}

export default function VideoGenerator() {
  // Estados
  const [currentProject, setCurrentProject] = useState<VideoProject | null>(null);
  const [projects, setProjects] = useState<VideoProject[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [processingStages, setProcessingStages] = useState<ProcessingStage[]>([]);
  const [settings, setSettings] = useState<VideoSettings>({
    resolution: '1080p',
    fps: 30,
    quality: 'standard',
    format: 'mp4',
    background: 'studio-blue',
    lighting: 'studio',
    cameraAngle: 'front',
    avatarScale: 1,
    backgroundBlur: 0
  });
  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [activeTab, setActiveTab] = useState('create');

  // Dados simulados
  const voices: Voice[] = [
    { id: 'voice-1', name: 'Ana', language: 'pt-BR', gender: 'female', age: 'adult', style: 'professional' },
    { id: 'voice-2', name: 'Carlos', language: 'pt-BR', gender: 'male', age: 'adult', style: 'natural' },
    { id: 'voice-3', name: 'Sofia', language: 'pt-BR', gender: 'female', age: 'young', style: 'energetic' },
    { id: 'voice-4', name: 'Roberto', language: 'pt-BR', gender: 'male', age: 'mature', style: 'casual' },
  ];

  const avatars: Avatar[] = [
    { 
      id: 'avatar-1', 
      name: 'Emma', 
      gender: 'female', 
      ethnicity: 'Caucasian', 
      style: 'realistic',
      thumbnailUrl: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20woman%20avatar%20headshot%20realistic%203D&image_size=square',
      modelUrl: '/models/emma.glb'
    },
    { 
      id: 'avatar-2', 
      name: 'Marcus', 
      gender: 'male', 
      ethnicity: 'African', 
      style: 'realistic',
      thumbnailUrl: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20man%20avatar%20headshot%20realistic%203D&image_size=square',
      modelUrl: '/models/marcus.glb'
    },
    { 
      id: 'avatar-3', 
      name: 'Yuki', 
      gender: 'female', 
      ethnicity: 'Asian', 
      style: 'anime',
      thumbnailUrl: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=anime%20style%20woman%20avatar%20headshot%203D&image_size=square',
      modelUrl: '/models/yuki.glb'
    },
    { 
      id: 'avatar-4', 
      name: 'Diego', 
      gender: 'male', 
      ethnicity: 'Hispanic', 
      style: 'cartoon',
      thumbnailUrl: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=cartoon%20style%20man%20avatar%20headshot%203D&image_size=square',
      modelUrl: '/models/diego.glb'
    },
  ];

  const backgrounds = [
    { id: 'studio-blue', name: 'Estúdio Azul', color: '#3B82F6' },
    { id: 'studio-green', name: 'Estúdio Verde', color: '#10B981' },
    { id: 'office', name: 'Escritório', color: '#6B7280' },
    { id: 'classroom', name: 'Sala de Aula', color: '#F59E0B' },
    { id: 'nature', name: 'Natureza', color: '#059669' },
    { id: 'tech', name: 'Tecnologia', color: '#8B5CF6' },
  ];

  // Carregar projetos simulados
  useEffect(() => {
    const mockProjects: VideoProject[] = [
      {
        id: '1',
        name: 'Apresentação Corporativa',
        text: 'Bem-vindos à nossa empresa. Hoje vamos apresentar nossos novos produtos.',
        voice: 'voice-1',
        avatar: 'avatar-1',
        background: 'studio-blue',
        resolution: '1080p',
        fps: 30,
        duration: 45,
        status: 'completed',
        progress: 100,
        createdAt: new Date(Date.now() - 86400000),
        updatedAt: new Date(Date.now() - 86400000),
        videoUrl: '/videos/project-1.mp4',
        thumbnailUrl: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=corporate%20presentation%20video%20thumbnail&image_size=landscape_16_9'
      },
      {
        id: '2',
        name: 'Tutorial de Produto',
        text: 'Neste tutorial, vamos aprender como usar nossa nova ferramenta.',
        voice: 'voice-2',
        avatar: 'avatar-2',
        background: 'tech',
        resolution: '720p',
        fps: 24,
        duration: 120,
        status: 'processing',
        progress: 65,
        createdAt: new Date(Date.now() - 3600000),
        updatedAt: new Date(),
        thumbnailUrl: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=product%20tutorial%20video%20thumbnail&image_size=landscape_16_9'
      },
      {
        id: '3',
        name: 'Curso Online',
        text: 'Bem-vindos ao nosso curso de programação. Vamos começar com os conceitos básicos.',
        voice: 'voice-3',
        avatar: 'avatar-3',
        background: 'classroom',
        resolution: '1080p',
        fps: 30,
        duration: 300,
        status: 'draft',
        progress: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    setProjects(mockProjects);
  }, []);

  // Criar novo projeto
  const createNewProject = () => {
    const newProject: VideoProject = {
      id: Date.now().toString(),
      name: 'Novo Projeto',
      text: '',
      voice: '',
      avatar: '',
      background: 'studio-blue',
      resolution: settings.resolution,
      fps: settings.fps,
      duration: 0,
      status: 'draft',
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setCurrentProject(newProject);
    setActiveTab('create');
    setText('');
    setSelectedVoice('');
    setSelectedAvatar('');
  };

  // Gerar vídeo
  const generateVideo = async () => {
    if (!text.trim() || !selectedVoice || !selectedAvatar) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setIsGenerating(true);
    
    // Definir estágios de processamento
    const stages: ProcessingStage[] = [
      { name: 'Análise de Texto', status: 'pending', progress: 0 },
      { name: 'Síntese de Voz', status: 'pending', progress: 0 },
      { name: 'Processamento de Lip-Sync', status: 'pending', progress: 0 },
      { name: 'Renderização 3D', status: 'pending', progress: 0 },
      { name: 'Composição de Vídeo', status: 'pending', progress: 0 },
      { name: 'Finalização', status: 'pending', progress: 0 }
    ];
    
    setProcessingStages(stages);

    try {
      // Simular processamento de cada estágio
      for (let i = 0; i < stages.length; i++) {
        const updatedStages = [...stages];
        updatedStages[i].status = 'processing';
        setProcessingStages(updatedStages);

        // Simular progresso do estágio
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 200));
          updatedStages[i].progress = progress;
          setProcessingStages([...updatedStages]);
        }

        updatedStages[i].status = 'completed';
        updatedStages[i].duration = Math.random() * 5 + 2; // 2-7 segundos
        setProcessingStages([...updatedStages]);
      }

      // Criar projeto completo
      const completedProject: VideoProject = {
        id: currentProject?.id || Date.now().toString(),
        name: currentProject?.name || 'Novo Vídeo',
        text,
        voice: selectedVoice,
        avatar: selectedAvatar,
        background: settings.background,
        resolution: settings.resolution,
        fps: settings.fps,
        duration: Math.ceil(text.length / 10), // Estimativa baseada no texto
        status: 'completed',
        progress: 100,
        createdAt: currentProject?.createdAt || new Date(),
        updatedAt: new Date(),
        videoUrl: `/videos/generated-${Date.now()}.mp4`,
        thumbnailUrl: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=generated%20video%20thumbnail&image_size=landscape_16_9'
      };

      // Atualizar lista de projetos
      setProjects(prev => {
        const existing = prev.find(p => p.id === completedProject.id);
        if (existing) {
          return prev.map(p => p.id === completedProject.id ? completedProject : p);
        }
        return [completedProject, ...prev];
      });

      setCurrentProject(completedProject);
      setActiveTab('projects');
      toast.success('Vídeo gerado com sucesso!');

    } catch (error) {
      toast.error('Erro ao gerar vídeo');
      const errorStages = stages.map(stage => ({
        ...stage,
        status: stage.status === 'processing' ? 'error' as const : stage.status,
        error: stage.status === 'processing' ? 'Erro no processamento' : undefined
      }));
      setProcessingStages(errorStages);
    } finally {
      setIsGenerating(false);
    }
  };

  // Duplicar projeto
  const duplicateProject = (project: VideoProject) => {
    const duplicated: VideoProject = {
      ...project,
      id: Date.now().toString(),
      name: `${project.name} (Cópia)`,
      status: 'draft',
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      videoUrl: undefined,
      thumbnailUrl: undefined
    };
    
    setProjects(prev => [duplicated, ...prev]);
    toast.success('Projeto duplicado com sucesso!');
  };

  // Deletar projeto
  const deleteProject = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    if (currentProject?.id === projectId) {
      setCurrentProject(null);
    }
    toast.success('Projeto deletado com sucesso!');
  };

  // Renderizar estágios de processamento
  const renderProcessingStages = () => {
    if (processingStages.length === 0) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle>Progresso da Geração</CardTitle>
          <CardDescription>
            Acompanhe o progresso da geração do seu vídeo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {processingStages.map((stage, index) => (
            <div key={index} className="flex items-center gap-4">
              <div className="flex-shrink-0">
                {stage.status === 'pending' && (
                  <div className="w-6 h-6 rounded-full border-2 border-muted" />
                )}
                {stage.status === 'processing' && (
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                )}
                {stage.status === 'completed' && (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                )}
                {stage.status === 'error' && (
                  <AlertCircle className="w-6 h-6 text-red-500" />
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium">{stage.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {stage.duration && `${stage.duration.toFixed(1)}s`}
                  </span>
                </div>
                
                {stage.status !== 'pending' && (
                  <Progress value={stage.progress} className="h-2" />
                )}
                
                {stage.error && (
                  <p className="text-sm text-red-500 mt-1">{stage.error}</p>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  };

  // Renderizar lista de projetos
  const renderProjectsList = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Meus Projetos</h3>
        <Button onClick={createNewProject}>
          <Video className="w-4 h-4 mr-2" />
          Novo Projeto
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <Card key={project.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              {project.thumbnailUrl && (
                <img
                  src={project.thumbnailUrl}
                  alt={project.name}
                  className="w-full h-32 object-cover rounded-lg mb-3"
                />
              )}
              
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium truncate">{project.name}</h4>
                  <Badge variant={
                    project.status === 'completed' ? 'default' :
                    project.status === 'processing' ? 'secondary' :
                    project.status === 'error' ? 'destructive' : 'outline'
                  }>
                    {project.status === 'completed' && 'Concluído'}
                    {project.status === 'processing' && 'Processando'}
                    {project.status === 'error' && 'Erro'}
                    {project.status === 'draft' && 'Rascunho'}
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {project.text}
                </p>
                
                {project.status === 'processing' && (
                  <Progress value={project.progress} className="h-2" />
                )}
                
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>{project.duration}s</span>
                  <span>{project.resolution}</span>
                </div>
                
                <div className="flex gap-1 pt-2">
                  {project.status === 'completed' && project.videoUrl && (
                    <>
                      <Button size="sm" variant="outline">
                        <Play className="w-3 h-3 mr-1" />
                        Assistir
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="w-3 h-3 mr-1" />
                        Baixar
                      </Button>
                    </>
                  )}
                  
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => duplicateProject(project)}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => deleteProject(project.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gerador de Vídeos</h1>
          <p className="text-muted-foreground">
            Crie vídeos com avatares 3D e sincronização labial
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </Button>
          <Button onClick={createNewProject}>
            <Video className="w-4 h-4 mr-2" />
            Novo Projeto
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="create">Criar Vídeo</TabsTrigger>
          <TabsTrigger value="projects">Meus Projetos</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        {/* Criar Vídeo */}
        <TabsContent value="create" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Configuração do Conteúdo */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Conteúdo do Vídeo</CardTitle>
                  <CardDescription>
                    Digite o texto que será falado pelo avatar
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="project-name">Nome do Projeto</Label>
                    <Input
                      id="project-name"
                      value={currentProject?.name || ''}
                      onChange={(e) => setCurrentProject(prev => 
                        prev ? { ...prev, name: e.target.value } : null
                      )}
                      placeholder="Digite o nome do projeto"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="video-text">Texto do Vídeo</Label>
                    <Textarea
                      id="video-text"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Digite o texto que será falado pelo avatar..."
                      rows={6}
                    />
                    <div className="text-sm text-muted-foreground mt-1">
                      {text.length} caracteres • ~{Math.ceil(text.length / 10)} segundos
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Seleção de Voz */}
              <Card>
                <CardHeader>
                  <CardTitle>Voz do Avatar</CardTitle>
                  <CardDescription>
                    Escolha a voz que será usada para o áudio
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {voices.map((voice) => (
                      <div
                        key={voice.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedVoice === voice.id 
                            ? 'border-primary bg-primary/5' 
                            : 'border-muted hover:border-muted-foreground/50'
                        }`}
                        onClick={() => setSelectedVoice(voice.id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{voice.name}</span>
                          <Badge variant="outline">{voice.gender}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {voice.style} • {voice.age}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Seleção de Avatar */}
              <Card>
                <CardHeader>
                  <CardTitle>Avatar 3D</CardTitle>
                  <CardDescription>
                    Escolha o avatar que aparecerá no vídeo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {avatars.map((avatar) => (
                      <div
                        key={avatar.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedAvatar === avatar.id 
                            ? 'border-primary bg-primary/5' 
                            : 'border-muted hover:border-muted-foreground/50'
                        }`}
                        onClick={() => setSelectedAvatar(avatar.id)}
                      >
                        <img
                          src={avatar.thumbnailUrl}
                          alt={avatar.name}
                          className="w-full h-24 object-cover rounded mb-2"
                        />
                        <div className="text-center">
                          <div className="font-medium">{avatar.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {avatar.style}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Configurações e Preview */}
            <div className="space-y-6">
              {/* Configurações de Vídeo */}
              <Card>
                <CardHeader>
                  <CardTitle>Configurações de Vídeo</CardTitle>
                  <CardDescription>
                    Ajuste a qualidade e aparência do vídeo
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Resolução</Label>
                      <Select 
                        value={settings.resolution} 
                        onValueChange={(value: string) => setSettings(prev => ({ ...prev, resolution: value as VideoSettings['resolution'] }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="720p">720p (HD)</SelectItem>
                          <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                          <SelectItem value="4K">4K (Ultra HD)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>FPS</Label>
                      <Select 
                        value={settings.fps.toString()} 
                        onValueChange={(value) => setSettings(prev => ({ ...prev, fps: parseInt(value) as VideoSettings['fps'] }))}
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
                  </div>

                  <div>
                    <Label>Fundo</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {backgrounds.map((bg) => (
                        <div
                          key={bg.id}
                          className={`p-2 border rounded cursor-pointer text-center ${
                            settings.background === bg.id 
                              ? 'border-primary bg-primary/5' 
                              : 'border-muted hover:border-muted-foreground/50'
                          }`}
                          onClick={() => setSettings(prev => ({ ...prev, background: bg.id }))}
                        >
                          <div 
                            className="w-full h-8 rounded mb-1"
                            style={{ backgroundColor: bg.color }}
                          />
                          <div className="text-xs">{bg.name}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Qualidade</Label>
                    <Select 
                      value={settings.quality} 
                      onValueChange={(value: string) => setSettings(prev => ({ ...prev, quality: value as VideoSettings['quality'] }))}
                    >
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
                </CardContent>
              </Card>

              {/* Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                  <CardDescription>
                    Visualize como ficará seu vídeo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                    {selectedAvatar && text ? (
                      <div className="text-center">
                        <Eye className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Preview será exibido aqui
                        </p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Video className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Selecione avatar e adicione texto para ver o preview
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Botão de Geração */}
              <Button 
                onClick={generateVideo} 
                disabled={isGenerating || !text.trim() || !selectedVoice || !selectedAvatar}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando Vídeo...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Gerar Vídeo
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Progresso de Processamento */}
          {isGenerating && renderProcessingStages()}
        </TabsContent>

        {/* Meus Projetos */}
        <TabsContent value="projects">
          {renderProjectsList()}
        </TabsContent>

        {/* Configurações */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Padrão</CardTitle>
              <CardDescription>
                Configure as preferências padrão para novos projetos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Resolução Padrão</Label>
                  <Select 
                    value={settings.resolution} 
                    onValueChange={(value: string) => setSettings(prev => ({ ...prev, resolution: value as VideoSettings['resolution'] }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="720p">720p (HD)</SelectItem>
                      <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                      <SelectItem value="4K">4K (Ultra HD)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Qualidade Padrão</Label>
                  <Select 
                    value={settings.quality} 
                    onValueChange={(value: string) => setSettings(prev => ({ ...prev, quality: value as VideoSettings['quality'] }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Rascunho</SelectItem>
                      <SelectItem value="standard">Padrão</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="ultra">Ultra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
