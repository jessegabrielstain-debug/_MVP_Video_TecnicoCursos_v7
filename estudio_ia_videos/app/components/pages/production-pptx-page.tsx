
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProductionPPTXUpload from '@/components/pptx/production-pptx-upload';
import { AnimakerEditorV2 as AnimakerEditor } from '@/components/editor/animaker-editor-v2';
import { 
  Upload, 
  FileText, 
  Video, 
  Settings, 
  BarChart3, 
  Download,
  Play,
  Share,
  Clock,
  Users,
  Zap
} from 'lucide-react';

interface ProjectData {
  id: string;
  name: string;
  slides: number;
  assets: number;
  duration: number;
  compliance?: string[];
  status: 'draft' | 'processing' | 'ready' | 'rendering';
  createdAt: string;
  lastModified: string;
}

const ProductionPPTXPage: React.FC = () => {
  const [currentProject, setCurrentProject] = useState<ProjectData | null>(null);
  const [activeTab, setActiveTab] = useState('upload');
  const [projects, setProjects] = useState<ProjectData[]>([]);

  // Handler para upload concluído
  const handleUploadComplete = (processedData: any) => {
    const newProject: ProjectData = {
      id: processedData.projectInfo.id,
      name: processedData.projectInfo.name,
      slides: processedData.slides.length,
      assets: processedData.assets.length,
      duration: processedData.timeline.totalDuration,
      compliance: processedData.compliance?.nrType,
      status: 'ready',
      createdAt: processedData.projectInfo.createdAt,
      lastModified: new Date().toISOString()
    };

    setProjects(prev => [newProject, ...prev]);
    setCurrentProject(newProject);
    setActiveTab('editor');
  };

  // Renderizar estatísticas
  const renderStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold">{projects.length}</p>
              <p className="text-gray-600 text-sm">Projetos</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <Video className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold">
                {projects.reduce((acc, p) => acc + p.slides, 0)}
              </p>
              <p className="text-gray-600 text-sm">Total Slides</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold">
                {Math.round(projects.reduce((acc, p) => acc + p.duration, 0) / 60)}m
              </p>
              <p className="text-gray-600 text-sm">Duração Total</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <Zap className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-2xl font-bold">
                {projects.filter(p => p.status === 'ready').length}
              </p>
              <p className="text-gray-600 text-sm">Prontos</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Renderizar lista de projetos
  const renderProjectsList = () => (
    <Card>
      <CardHeader>
        <CardTitle>Projetos Recentes</CardTitle>
        <CardDescription>
          Gerencie seus projetos de treinamento
        </CardDescription>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <div className="text-center py-8">
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Nenhum projeto ainda</p>
            <p className="text-sm text-gray-400">
              Faça upload de um arquivo PPTX para começar
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <div 
                key={project.id} 
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => {
                  setCurrentProject(project);
                  setActiveTab('editor');
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{project.name}</h3>
                    <p className="text-sm text-gray-500">
                      {project.slides} slides • {Math.round(project.duration / 60)}min
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant={project.status === 'ready' ? 'default' : 'secondary'}>
                        {project.status}
                      </Badge>
                      {project.compliance && (
                        <Badge variant="outline">
                          {project.compliance.join(', ')}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Share className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Estúdio IA - Produção PPTX</h1>
          <p className="text-gray-600">
            Transforme apresentações PowerPoint em vídeos de treinamento profissionais
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </Button>
          <Button variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      {renderStats()}

      {/* Tabs Principal */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload" className="flex items-center space-x-2">
            <Upload className="h-4 w-4" />
            <span>Upload</span>
          </TabsTrigger>
          <TabsTrigger 
            value="editor" 
            className="flex items-center space-x-2"
            disabled={!currentProject}
          >
            <Video className="h-4 w-4" />
            <span>Editor</span>
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Projetos</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab Upload */}
        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload PPTX Profissional</CardTitle>
              <CardDescription>
                Carregue seus arquivos PowerPoint para conversão em vídeos de treinamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProductionPPTXUpload
                onUploadComplete={handleUploadComplete}
                maxFileSize={100} // 100MB
                maxFiles={5}
              />
            </CardContent>
          </Card>

          {/* Recursos da Versão Profissional */}
          <Card>
            <CardHeader>
              <CardTitle>Recursos Profissionais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <h4 className="font-medium">Upload Direto S3</h4>
                  <p className="text-sm text-gray-600">
                    Storage em nuvem com backup automático
                  </p>
                </div>
                
                <div className="text-center p-4">
                  <Zap className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                  <h4 className="font-medium">Processamento IA</h4>
                  <p className="text-sm text-gray-600">
                    Extração inteligente de conteúdo
                  </p>
                </div>
                
                <div className="text-center p-4">
                  <Users className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <h4 className="font-medium">Compliance NR</h4>
                  <p className="text-sm text-gray-600">
                    Detecção automática de normas
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Editor */}
        <TabsContent value="editor" className="space-y-4">
          {currentProject ? (
            <div>
              <Card className="mb-4">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>{currentProject.name}</CardTitle>
                      <CardDescription>
                        {currentProject.slides} slides • {Math.round(currentProject.duration / 60)}min
                      </CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      <Badge>{currentProject.status}</Badge>
                      {currentProject.compliance?.map(nr => (
                        <Badge key={nr} variant="outline">{nr}</Badge>
                      ))}
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Editor Animaker */}
              <AnimakerEditor 
                projectData={{
                  fileInfo: {
                    name: currentProject.name,
                    size: 0, // Seria obtido dos dados reais
                    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                    s3Key: 'placeholder-s3-key'
                  },
                  slides: [], // Seria carregado dos dados processados
                  assets: {
                    images: [],
                    videos: [],
                    audio: [],
                    fonts: []
                  },
                  metadata: {
                    title: currentProject.name,
                    author: 'Estúdio IA',
                    created: new Date().toISOString(),
                    slideCount: currentProject.slides,
                    slideSize: { width: 1920, height: 1080 },
                    theme: 'default'
                  },
                  timeline: {
                    totalDuration: currentProject.duration,
                    scenes: []
                  },
                  statistics: {
                    totalElements: 0,
                    elementsByType: {},
                    editableElements: 0
                  }
                }}
              />
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Video className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-medium mb-2">Nenhum projeto selecionado</h3>
                <p className="text-gray-600 mb-4">
                  Selecione um projeto ou faça upload de um novo arquivo PPTX
                </p>
                <Button onClick={() => setActiveTab('upload')}>
                  <Upload className="h-4 w-4 mr-2" />
                  Fazer Upload
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab Projetos */}
        <TabsContent value="projects">
          {renderProjectsList()}
        </TabsContent>

        {/* Tab Analytics */}
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics de Produção</CardTitle>
              <CardDescription>
                Métricas e estatísticas dos seus projetos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-4">Taxa de Sucesso</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Uploads Concluídos</span>
                      <span>100%</span>
                    </div>
                    <Progress value={100} />
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-4">Processamento Médio</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Tempo por Slide</span>
                      <span>2.5s</span>
                    </div>
                    <Progress value={85} />
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-medium mb-4">Compliance NR Detectada</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge>NR-12: 40%</Badge>
                  <Badge>NR-33: 25%</Badge>
                  <Badge>NR-35: 35%</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductionPPTXPage;
