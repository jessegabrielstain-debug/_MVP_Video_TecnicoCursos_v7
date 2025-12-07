'use client';

import React, { useState, useEffect } from 'react';
import { PPTXUploader } from '@/components/pptx/PPTXUploader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Upload,
  PlayCircle,
  Settings,
  Download,
  Eye,
  FileText,
  Video,
  Clock,
  BarChart3,
  Zap,
  CheckCircle2,
  Activity,
  Layers,
  Monitor,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface ProjectStats {
  totalProjects: number;
  totalSlides: number;
  totalDuration: number;
  completedVideos: number;
  processingVideos: number;
}

interface ProcessedProject {
  id: string;
  name: string;
  slideCount: number;
  duration: number;
  status: 'uploaded' | 'processing' | 'completed' | 'error';
  createdAt: Date;
  timelineData?: any;
  videoUrl?: string;
  render_settings?: any;
}

export default function Dashboard() {
  const [projects, setProjects] = useState<ProcessedProject[]>([]);
  const [activeTab, setActiveTab] = useState('upload');
  const [stats, setStats] = useState<ProjectStats>({
    totalProjects: 0,
    totalSlides: 0,
    totalDuration: 0,
    completedVideos: 0,
    processingVideos: 0
  });
  
  // New Project State
  const [newProjectName, setNewProjectName] = useState('');
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  // Fetch Projects
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/timeline/projects');
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const mappedProjects = result.data.map((p: any) => ({
            id: p.id,
            name: p.name,
            slideCount: p.metadata?.timeline?.tracks?.[0]?.elements?.length || 0,
            duration: p.render_settings?.duration || 0,
            status: p.status === 'completed' ? 'completed' : 'uploaded', // Simplified mapping
            createdAt: new Date(p.created_at),
            timelineData: p.metadata?.timeline,
            // Check if there is a completed render job for this project
            // This would require another API call or including it in the project fetch
          }));
          setProjects(mappedProjects);
          updateStats(mappedProjects);
        }
      }
    } catch (error) {
      console.error('Error fetching projects', error);
    }
  };

  // Atualizar estatísticas
  const updateStats = (newProjects: ProcessedProject[]) => {
    const newStats: ProjectStats = {
      totalProjects: newProjects.length,
      totalSlides: newProjects.reduce((sum, p) => sum + p.slideCount, 0),
      totalDuration: newProjects.reduce((sum, p) => sum + p.duration, 0),
      completedVideos: newProjects.filter(p => p.status === 'completed').length,
      processingVideos: newProjects.filter(p => p.status === 'processing').length
    };
    setStats(newStats);
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
        toast.error('Nome do projeto é obrigatório');
        return;
    }
    
    setIsCreatingProject(true);
    try {
        const response = await fetch('/api/timeline/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: newProjectName,
                duration: 60, // Default
                fps: 30,
                width: 1920,
                height: 1080,
                tracks: []
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                setCurrentProjectId(result.data.id);
                toast.success('Projeto criado! Agora faça o upload do PPTX.');
            }
        } else {
            toast.error('Erro ao criar projeto');
        }
    } catch (error) {
        toast.error('Erro ao criar projeto');
    } finally {
        setIsCreatingProject(false);
    }
  };

  // Manipular upload concluído
  const handleUploadComplete = (file: any) => {
    toast.success(`Upload concluído: ${file.name}`);
  };

  // Manipular processamento concluído
  const handleProcessingComplete = (file: any) => {
    toast.success(`Projeto processado: ${file.processedData?.slideCount} slides encontrados`);
    fetchProjects(); // Refresh list
    setActiveTab('timeline');
    setCurrentProjectId(null); // Reset
    setNewProjectName('');
  };

  // Componente de estatísticas
  const StatsCard: React.FC<{
    title: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
    subtitle?: string;
  }> = ({ title, value, icon, color, subtitle }) => (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-600">
            {title}
          </CardTitle>
          <div className={`p-2 rounded-md ${color}`}>
            {icon}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-gray-600 mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );

  // Componente de projeto
  const ProjectCard: React.FC<{ project: ProcessedProject }> = ({ project }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-500" />
            <div>
              <CardTitle className="text-sm">{project.name}</CardTitle>
              <p className="text-xs text-gray-500">
                {project.slideCount} slides • {Math.floor(project.duration / 60)}:{(project.duration % 60).toString().padStart(2, '0')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {project.status === 'completed' && (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Pronto
              </Badge>
            )}
            {project.status === 'processing' && (
              <Badge className="bg-yellow-100 text-yellow-800">
                <Activity className="w-3 h-3 mr-1 animate-spin" />
                Processando
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Link href={`/editor-simple?project=${project.id}`} passHref>
            <Button size="sm" variant="outline">
                <Eye className="w-4 h-4 mr-2" />
                Editar / Preview
            </Button>
          </Link>
          
          {project.videoUrl && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => window.open(project.videoUrl, '_blank')}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Monitor className="w-7 h-7 text-blue-600" />
                Studio IA Vídeos (Real)
              </h1>
              <p className="text-gray-600 text-sm">
                Sistema completo PPTX → Timeline → Vídeo
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge className="bg-green-100 text-green-800">
                <Zap className="w-3 h-3 mr-1" />
                Sistema Operacional
              </Badge>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total de Projetos"
            value={stats.totalProjects}
            icon={<FileText className="w-4 h-4" />}
            color="bg-blue-100 text-blue-600"
            subtitle="Apresentações processadas"
          />
          
          <StatsCard
            title="Total de Slides"
            value={stats.totalSlides}
            icon={<Layers className="w-4 h-4" />}
            color="bg-green-100 text-green-600"
            subtitle="Slides convertidos"
          />
          
          <StatsCard
            title="Duração Total"
            value={`${Math.floor(stats.totalDuration / 60)}:${(stats.totalDuration % 60).toString().padStart(2, '0')}`}
            icon={<Clock className="w-4 h-4" />}
            color="bg-purple-100 text-purple-600"
            subtitle="Tempo de conteúdo"
          />
          
          <StatsCard
            title="Vídeos Gerados"
            value={stats.completedVideos}
            icon={<Video className="w-4 h-4" />}
            color="bg-orange-100 text-orange-600"
            subtitle="Renderizações concluídas"
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Novo Projeto
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <PlayCircle className="w-4 h-4" />
              Meus Projetos
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              Galeria
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Criar Novo Projeto</CardTitle>
                <p className="text-sm text-gray-600">
                  Comece criando um projeto e enviando sua apresentação
                </p>
              </CardHeader>
              <CardContent>
                {!currentProjectId ? (
                    <div className="max-w-md mx-auto space-y-4 py-8">
                        <div className="space-y-2">
                            <Label htmlFor="projectName">Nome do Projeto</Label>
                            <Input 
                                id="projectName" 
                                placeholder="Ex: Treinamento NR-12" 
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                            />
                        </div>
                        <Button 
                            className="w-full" 
                            onClick={handleCreateProject}
                            disabled={isCreatingProject || !newProjectName.trim()}
                        >
                            {isCreatingProject ? <Activity className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                            Criar Projeto
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg">
                            <div>
                                <h3 className="font-medium text-blue-900">Projeto: {newProjectName}</h3>
                                <p className="text-sm text-blue-700">ID: {currentProjectId}</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setCurrentProjectId(null)}>
                                Cancelar
                            </Button>
                        </div>
                        <PPTXUploader
                          projectId={currentProjectId}
                          onUploadComplete={handleUploadComplete}
                          onProcessingComplete={handleProcessingComplete}
                          allowMultiple={false}
                          maxFileSize={50}
                        />
                    </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Projetos Recentes</CardTitle>
                <p className="text-sm text-gray-600">
                  Gerencie seus projetos e crie vídeos
                </p>
              </CardHeader>
              <CardContent>
                {projects.length === 0 ? (
                  <div className="text-center py-12">
                    <PlayCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Nenhum projeto ainda
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Crie um novo projeto para começar
                    </p>
                    <Button onClick={() => setActiveTab('upload')}>
                      <Plus className="w-4 h-4 mr-2" />
                      Novo Projeto
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projects.map(project => (
                      <ProjectCard key={project.id} project={project} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Galeria de Vídeos</CardTitle>
                <p className="text-sm text-gray-600">
                  Seus vídeos renderizados estão aqui
                </p>
              </CardHeader>
              <CardContent>
                 <div className="text-center py-12 text-gray-500">
                    Funcionalidade de galeria em desenvolvimento.
                    <br/>
                    Acesse os vídeos através da aba "Meus Projetos".
                 </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance do Sistema</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Taxa de Sucesso</span>
                    <span className="font-medium">100%</span>
                  </div>
                  <Progress value={100} className="h-2" />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}