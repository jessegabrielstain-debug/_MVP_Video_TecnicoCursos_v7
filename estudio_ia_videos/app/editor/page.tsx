'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Video,
  Sparkles,
  Play,
  Users,
  Settings,
  FileText,
  Layers,
  Clock,
  Download,
  Plus,
  FolderOpen,
  Zap,
  Target,
  BarChart3,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useProjects, Project } from '@/hooks/use-projects';
import { CreateProjectDialog } from '@/components/dashboard/create-project-dialog';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'draft': return 'bg-gray-100 text-gray-800';
    case 'in-progress': return 'bg-blue-100 text-blue-800';
    case 'completed': return 'bg-green-100 text-green-800';
    case 'rendering': return 'bg-yellow-100 text-yellow-800';
    case 'error': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'draft': return 'Rascunho';
    case 'in-progress': return 'Em Progresso';
    case 'completed': return 'Concluído';
    case 'rendering': return 'Renderizando';
    case 'error': return 'Erro';
    default: return status;
  }
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'video': return <Video className="w-4 h-4" />;
    case 'pptx': return <FileText className="w-4 h-4" />;
    case 'talking-photo': return <Users className="w-4 h-4" />;
    case 'avatar': return <Sparkles className="w-4 h-4" />;
    default: return <Video className="w-4 h-4" />;
  }
};

const formatTimeAgo = (dateString: string) => {
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: ptBR });
  } catch (e) {
    return 'Recentemente';
  }
};

export default function EditorDashboard() {
  const [selectedTab, setSelectedTab] = useState('overview');
  const { projects, isLoading, total } = useProjects({ limit: 10 });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Editor de Vídeo & PPTX
            </h1>
            <p className="text-lg text-gray-600 mt-2">
              Plataforma profissional de criação de conteúdo com IA
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="lg">
              <FolderOpen className="w-5 h-5 mr-2" />
              Abrir Projeto
            </Button>

            <CreateProjectDialog
              open={isDialogOpen}
              onOpenChange={setIsDialogOpen}
              trigger={
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600">
                  <Plus className="w-5 h-5 mr-2" />
                  Novo Projeto
                </Button>
              }
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Projetos Ativos</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : total}
                    </p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Video className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Horas Renderizadas</p>
                    <p className="text-3xl font-bold text-gray-900">--</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-lg">
                    <Clock className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Colaboradores</p>
                    <p className="text-3xl font-bold text-gray-900">--</p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Eficiência IA</p>
                    <p className="text-3xl font-bold text-gray-900">98%</p>
                  </div>
                  <div className="bg-yellow-100 p-3 rounded-lg">
                    <Zap className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="projects">Projetos</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Projects */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="w-5 h-5" />
                    Projetos Recentes
                  </CardTitle>
                  <CardDescription>
                    Seus projetos mais recentes e em andamento
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    </div>
                  ) : projects.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Nenhum projeto encontrado. Crie o seu primeiro!
                    </div>
                  ) : (
                    projects.slice(0, 3).map((project) => (
                      <motion.div
                        key={project.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            {getTypeIcon(project.type)}
                          </div>
                          <div>
                            <h4 className="font-medium">{project.name}</h4>
                            <p className="text-sm text-gray-600">{formatTimeAgo(project.updated_at)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(project.status)}>
                            {getStatusText(project.status)}
                          </Badge>
                          <Link href={`/editor/timeline/${project.id}`}>
                            <Button variant="ghost" size="sm">
                              <Play className="w-4 h-4" />
                            </Button>
                          </Link>
                        </div>
                      </motion.div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Ações Rápidas</CardTitle>
                  <CardDescription>
                    Acesse rapidamente as principais funcionalidades
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link href="/editor/timeline">
                      <Button variant="outline" className="w-full h-20 flex-col gap-2">
                        <Layers className="w-6 h-6" />
                        Timeline Editor
                      </Button>
                    </Link>
                    <Link href="/editor/pptx">
                      <Button variant="outline" className="w-full h-20 flex-col gap-2">
                        <FileText className="w-6 h-6" />
                        PPTX Studio
                      </Button>
                    </Link>
                    <Link href="/editor/avatars">
                      <Button variant="outline" className="w-full h-20 flex-col gap-2">
                        <Sparkles className="w-6 h-6" />
                        Avatar 3D
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="projects">
            <Card>
              <CardHeader>
                <CardTitle>Todos os Projetos</CardTitle>
                <CardDescription>
                  Gerencie todos os seus projetos de vídeo e PPTX
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project) => (
                      <motion.div
                        key={project.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.02 }}
                        className="border rounded-lg p-6 hover:shadow-lg transition-all cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            {getTypeIcon(project.type)}
                          </div>
                          <Badge className={getStatusColor(project.status)}>
                            {getStatusText(project.status)}
                          </Badge>
                        </div>
                        <h3 className="font-semibold mb-2">{project.name}</h3>
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{project.description || 'Sem descrição'}</p>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>{formatTimeAgo(project.updated_at)}</span>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <Link href={`/editor/timeline/${project.id}`} className="flex-1">
                            <Button size="sm" className="w-full">
                              <Play className="w-4 h-4 mr-1" />
                              Abrir
                            </Button>
                          </Link>
                          <Button variant="outline" size="sm">
                            <Settings className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates">
            <Card>
              <CardHeader>
                <CardTitle>Biblioteca de Templates</CardTitle>
                <CardDescription>
                  Templates profissionais para diferentes tipos de conteúdo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Templates em Desenvolvimento
                  </h3>
                  <p className="text-gray-600 mb-6">
                    A biblioteca de templates estará disponível em breve
                  </p>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Template Personalizado
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Analytics & Métricas</CardTitle>
                <CardDescription>
                  Acompanhe o desempenho e uso da plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Dashboard de Analytics
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Métricas detalhadas e relatórios em desenvolvimento
                  </p>
                  <Button>
                    <Target className="w-4 h-4 mr-2" />
                    Ver Relatórios Básicos
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}