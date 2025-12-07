'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { 
  Activity, 
  BarChart3, 
  Clock, 
  Download, 
  FileVideo, 
  Play, 
  Settings, 
  Users, 
  Zap,
  Wifi,
  WifiOff
} from 'lucide-react';

// Import client-only WebSocket hooks
import { useWebSocketStore } from '../../lib/stores/websocket-store';
import { useRenderPipeline } from '../../hooks/use-render-pipeline';
import { useNotifications } from '../../hooks/use-notifications';

// Import other components
import { RealTimeNotifications } from './real-time-notifications';
import { RenderProgressMonitor } from './render-progress-monitor';

export function UnifiedDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  // WebSocket connection for real-time updates
  const { isConnected } = useWebSocketStore();

  // Real-time data hooks
  const { renderQueue } = useRenderPipeline();
  const { realTimeNotifications: notifications } = useNotifications();

  const activeJob = renderQueue?.processing?.[0];
  const isRendering = !!activeJob;
  
  const progress = activeJob ? {
    jobId: activeJob.id,
    progress: activeJob.progress,
    status: activeJob.status
  } : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard Unificado</h1>
            <p className="text-slate-600 mt-1">Sistema Integrado de Criação de Vídeos</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {isConnected ? (
                <>
                  <Wifi className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600">Conectado</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-600">Desconectado</span>
                </>
              )}
            </div>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </Button>
          </div>
        </div>

        {/* Main Dashboard */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="projects">Projetos</TabsTrigger>
            <TabsTrigger value="render">Renderização</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="realtime">Tempo Real</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Projetos Ativos</CardTitle>
                  <FileVideo className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12</div>
                  <p className="text-xs text-muted-foreground">+2 desde ontem</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Vídeos Renderizados</CardTitle>
                  <Play className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">48</div>
                  <p className="text-xs text-muted-foreground">+12% este mês</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3.2min</div>
                  <p className="text-xs text-muted-foreground">-15% melhoria</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">8</div>
                  <p className="text-xs text-muted-foreground">Online agora</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
                <CardDescription>Acesso rápido às principais funcionalidades</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button className="h-20 flex flex-col gap-2">
                  <FileVideo className="h-6 w-6" />
                  Novo Projeto
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <Download className="h-6 w-6" />
                  Importar PPTX
                </Button>
                <Button variant="outline" className="h-20 flex flex-col gap-2">
                  <BarChart3 className="h-6 w-6" />
                  Ver Relatórios
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Projetos Recentes</CardTitle>
                <CardDescription>Seus projetos mais recentes e status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <FileVideo className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-medium">Projeto {i}</h3>
                          <p className="text-sm text-muted-foreground">Criado há 2 horas</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Em Progresso</Badge>
                        <Button size="sm" variant="outline">Abrir</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Render Tab */}
          <TabsContent value="render" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Status de Renderização</CardTitle>
                <CardDescription>Acompanhe o progresso dos seus vídeos</CardDescription>
              </CardHeader>
              <CardContent>
                {isRendering && progress ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Renderizando: {progress.jobId}</span>
                      <span className="text-sm text-muted-foreground">{progress.progress}%</span>
                    </div>
                    <Progress value={progress.progress} className="w-full" />
                    <p className="text-sm text-muted-foreground">{progress.status}</p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhuma renderização em andamento</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Analytics</CardTitle>
                  <CardDescription>Métricas de desempenho do sistema</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>CPU Usage</span>
                      <span>45%</span>
                    </div>
                    <Progress value={45} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Memory Usage</span>
                      <span>62%</span>
                    </div>
                    <Progress value={62} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Storage Usage</span>
                      <span>78%</span>
                    </div>
                    <Progress value={78} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Metrics</CardTitle>
                  <CardDescription>Estatísticas do sistema em tempo real</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Active Connections</span>
                    <Badge variant="outline">{isConnected ? '1' : '0'}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Render Queue</span>
                    <Badge variant="outline">0</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">System Status</span>
                    <Badge variant={isConnected ? 'default' : 'destructive'}>
                      {isConnected ? 'Online' : 'Offline'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Real-time Tab */}
          <TabsContent value="realtime" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RenderProgressMonitor />
              <RealTimeNotifications />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}