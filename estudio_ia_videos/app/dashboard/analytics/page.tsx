'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAnalytics } from './hooks/useAnalytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  Activity, 
  Users, 
  TrendingUp, 
  Clock, 
  AlertTriangle, 
  Download,
  FileText,
  Video,
  Mic,
  Zap,
  Eye,
  MousePointer,
  Timer,
  Settings
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AnalyticsData {
  overview: {
    totalEvents: number;
    eventsLast7Days: number;
    errorEvents: number;
    errorRate: string;
    activeUsers: number;
    avgSessionDuration: number;
    conversionRate: number;
    totalProjects: number;
  };
  eventsByCategory: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  eventsByAction: Array<{
    action: string;
    count: number;
  }>;
  timelineData: Array<{
    date: string;
    events: number;
    errors: number;
    users: number;
  }>;
  performanceMetrics: {
    avgLoadTime: number;
    avgRenderTime: number;
    avgProcessingTime: number;
    slowestEndpoints: Array<{
      endpoint: string;
      avgTime: number;
      calls: number;
    }>;
  };
  userBehavior: {
    topPages: Array<{
      page: string;
      views: number;
      avgTimeOnPage: number;
    }>;
    deviceTypes: Array<{
      type: string;
      count: number;
    }>;
    browserStats: Array<{
      browser: string;
      count: number;
    }>;
  };
  recentEvents: Array<{
    id: string;
    category: string;
    action: string;
    label?: string;
    status: string;
    duration?: number;
    createdAt: string;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function AnalyticsDashboard() {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [timeRange, setTimeRange] = useState('7d');
  
  const { data, loading, refreshing, fetchAnalytics } = useAnalytics<AnalyticsData>({ timeRange });

  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getUser();
        if (!isMounted) return;
        setUser(sessionData.user ?? null);
      } catch (error) {
        console.error('[Analytics] Falha ao carregar usuário:', error);
      }
    };

    void loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      listener?.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user, timeRange, fetchAnalytics]);

  const exportData = async (format: 'csv' | 'json' | 'pdf') => {
    try {
      const response = await fetch(`/api/analytics/export?format=${format}&period=${timeRange}`);
      if (!response.ok) throw new Error('Failed to export data');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${timeRange}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(`Dados exportados em ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Erro ao exportar dados');
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Acesso restrito</h2>
          <p className="text-gray-600">Faça login para visualizar o dashboard de analytics.</p>
        </div>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Dados não disponíveis</h2>
          <p className="text-gray-600">Não foi possível carregar os dados de analytics.</p>
          <Button onClick={() => fetchAnalytics()} className="mt-4">
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-600">Métricas completas e insights em tempo real</p>
        </div>
        <div className="flex gap-2">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
          </select>
          <Button 
            onClick={fetchAnalytics} 
            disabled={refreshing}
            variant="outline"
          >
            {refreshing ? 'Atualizando...' : 'Atualizar'}
          </Button>
          
          {/* Dropdown de Exportação Rápida */}
          <div className="relative group">
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
            <div className="absolute right-0 top-full mt-1 w-48 bg-white border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="p-2 space-y-1">
                <button
                  onClick={() => exportData('csv')}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Exportar CSV
                </button>
                <button
                  onClick={() => exportData('json')}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Exportar JSON
                </button>
                <button
                  onClick={() => exportData('pdf')}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Exportar PDF
                </button>
                <div className="border-t my-1"></div>
                <Link
                  href="/dashboard/analytics/export"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded flex items-center gap-2 text-blue-600"
                >
                  <Settings className="h-4 w-4" />
                  Exportação Avançada
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.totalEvents.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{data.overview.eventsLast7Days} nos últimos 7 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Erro</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.errorRate}%</div>
            <p className="text-xs text-muted-foreground">
              {data.overview.errorEvents} erros registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              Sessão média: {Math.round(data.overview.avgSessionDuration / 60)}min
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {data.overview.totalProjects} projetos criados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="events">Eventos</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="behavior">Comportamento</TabsTrigger>
          <TabsTrigger value="realtime">Tempo Real</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Timeline Chart */}
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Atividade ao Longo do Tempo</CardTitle>
                <CardDescription>Eventos, erros e usuários por dia</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.timelineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="events" stackId="1" stroke="#8884d8" fill="#8884d8" />
                    <Area type="monotone" dataKey="users" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                    <Area type="monotone" dataKey="errors" stackId="1" stroke="#ffc658" fill="#ffc658" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Events by Category */}
            <Card>
              <CardHeader>
                <CardTitle>Eventos por Categoria</CardTitle>
                <CardDescription>Distribuição dos tipos de eventos</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.eventsByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, percentage }) => `${category} (${percentage}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {data.eventsByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Mais Frequentes</CardTitle>
                <CardDescription>Top 10 ações realizadas</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.eventsByAction.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="action" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Eventos Recentes</CardTitle>
              <CardDescription>Últimos eventos registrados no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.recentEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge variant={event.status === 'error' ? 'destructive' : 'default'}>
                        {event.category}
                      </Badge>
                      <span className="font-medium">{event.action}</span>
                      {event.label && <span className="text-gray-600">- {event.label}</span>}
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      {event.duration && (
                        <span className="flex items-center">
                          <Timer className="h-3 w-3 mr-1" />
                          {event.duration}ms
                        </span>
                      )}
                      <span>{new Date(event.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Métricas de Performance</CardTitle>
                <CardDescription>Tempos médios de resposta</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Tempo de Carregamento</span>
                  <Badge variant="outline">{data.performanceMetrics.avgLoadTime}ms</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Tempo de Renderização</span>
                  <Badge variant="outline">{data.performanceMetrics.avgRenderTime}ms</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Tempo de Processamento</span>
                  <Badge variant="outline">{data.performanceMetrics.avgProcessingTime}ms</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Slowest Endpoints */}
            <Card>
              <CardHeader>
                <CardTitle>Endpoints Mais Lentos</CardTitle>
                <CardDescription>APIs com maior tempo de resposta</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.performanceMetrics.slowestEndpoints.map((endpoint, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span className="font-mono text-sm">{endpoint.endpoint}</span>
                      <div className="text-right">
                        <div className="font-medium">{endpoint.avgTime}ms</div>
                        <div className="text-xs text-gray-500">{endpoint.calls} calls</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="behavior" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top Pages */}
            <Card>
              <CardHeader>
                <CardTitle>Páginas Mais Visitadas</CardTitle>
                <CardDescription>Páginas com mais visualizações</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.userBehavior.topPages.map((page, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span className="font-medium">{page.page}</span>
                      <div className="text-right">
                        <div className="font-medium">{page.views}</div>
                        <div className="text-xs text-gray-500">{Math.round(page.avgTimeOnPage / 1000)}s</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Device Types */}
            <Card>
              <CardHeader>
                <CardTitle>Tipos de Dispositivo</CardTitle>
                <CardDescription>Distribuição por dispositivo</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={data.userBehavior.deviceTypes}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      fill="#8884d8"
                      dataKey="count"
                      label={({ type, count }) => `${type}: ${count}`}
                    >
                      {data.userBehavior.deviceTypes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Browser Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Navegadores</CardTitle>
                <CardDescription>Distribuição por navegador</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.userBehavior.browserStats.map((browser, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span className="font-medium">{browser.browser}</span>
                      <Badge variant="outline">{browser.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="realtime" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monitoramento em Tempo Real</CardTitle>
              <CardDescription>Eventos acontecendo agora</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Zap className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Tempo Real</h3>
                <p className="text-gray-600">Funcionalidade de tempo real será implementada em breve</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}