

/**
 * ⚡ Performance Dashboard - Métricas em Tempo Real
 * Monitoramento avançado do sistema
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Users,
  Video,
  Clock,
  Server,
  Cpu,
  HardDrive,
  Wifi,
  Zap,
  Eye,
  Play,
  Download,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart,
  LineChart,
  RefreshCw,
  Settings,
  Filter,
  Calendar,
  Globe
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  status: 'good' | 'warning' | 'critical';
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

interface SystemResource {
  name: string;
  usage: number;
  limit: number;
  status: 'optimal' | 'high' | 'critical';
  details: { [key: string]: unknown };
}

interface UserMetric {
  period: string;
  activeUsers: number;
  videosWatched: number;
  completionRate: number;
  avgSessionDuration: number;
}

export default function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [systemResources, setSystemResources] = useState<SystemResource[]>([]);
  const [userMetrics, setUserMetrics] = useState<UserMetric[]>([]);
  const [isRealTime, setIsRealTime] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);

  useEffect(() => {
    // Inicializar dados
    initializeMetrics();
    initializeSystemResources();
    initializeUserMetrics();

    // Configurar atualização em tempo real
    if (isRealTime) {
      const interval = setInterval(() => {
        updateMetrics();
        updateSystemResources();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [isRealTime, refreshInterval]);

  const initializeMetrics = () => {
    const initialMetrics: PerformanceMetric[] = [
      {
        id: 'response-time',
        name: 'Tempo de Resposta',
        value: 245,
        unit: 'ms',
        trend: 'down',
        trendPercentage: -12,
        status: 'good',
        icon: Clock,
        description: 'Latência média da API'
      },
      {
        id: 'active-users',
        name: 'Usuários Ativos',
        value: 1247,
        unit: 'users',
        trend: 'up',
        trendPercentage: 23,
        status: 'good',
        icon: Users,
        description: 'Usuários conectados no momento'
      },
      {
        id: 'video-renders',
        name: 'Renderizações/hora',
        value: 89,
        unit: 'videos',
        trend: 'up',
        trendPercentage: 15,
        status: 'good',
        icon: Video,
        description: 'Vídeos processados na última hora'
      },
      {
        id: 'error-rate',
        name: 'Taxa de Erro',
        value: 0.2,
        unit: '%',
        trend: 'down',
        trendPercentage: -45,
        status: 'good',
        icon: AlertTriangle,
        description: 'Percentual de erros nas requisições'
      },
      {
        id: 'throughput',
        name: 'Throughput',
        value: 1543,
        unit: 'req/min',
        trend: 'stable',
        trendPercentage: 2,
        status: 'good',
        icon: Activity,
        description: 'Requisições processadas por minuto'
      },
      {
        id: 'storage-usage',
        name: 'Uso de Armazenamento',
        value: 73.5,
        unit: '%',
        trend: 'up',
        trendPercentage: 8,
        status: 'warning',
        icon: HardDrive,
        description: 'Percentual do storage utilizado'
      }
    ];

    setMetrics(initialMetrics);
  };

  const initializeSystemResources = () => {
    const resources: SystemResource[] = [
      {
        name: 'CPU',
        usage: 45,
        limit: 100,
        status: 'optimal',
        details: {
          cores: 8,
          frequency: '3.2 GHz',
          temperature: '52°C',
          processes: 234
        }
      },
      {
        name: 'Memory',
        usage: 68,
        limit: 100,
        status: 'high',
        details: {
          used: '13.6 GB',
          total: '20 GB',
          swap: '2.1 GB',
          cached: '4.2 GB'
        }
      },
      {
        name: 'Storage',
        usage: 73.5,
        limit: 100,
        status: 'high',
        details: {
          used: '734 GB',
          total: '1 TB',
          free: '266 GB',
          iops: '1,200/s'
        }
      },
      {
        name: 'Network',
        usage: 25,
        limit: 100,
        status: 'optimal',
        details: {
          bandwidth: '1 Gbps',
          incoming: '125 Mbps',
          outgoing: '89 Mbps',
          latency: '12ms'
        }
      },
      {
        name: 'Database',
        usage: 82,
        limit: 100,
        status: 'critical',
        details: {
          connections: '164/200',
          queries: '2,450/min',
          cache: '89%',
          locks: 12
        }
      }
    ];

    setSystemResources(resources);
  };

  const initializeUserMetrics = () => {
    const metrics: UserMetric[] = [
      { period: '00:00', activeUsers: 892, videosWatched: 1234, completionRate: 87, avgSessionDuration: 12 },
      { period: '01:00', activeUsers: 745, videosWatched: 1089, completionRate: 89, avgSessionDuration: 14 },
      { period: '02:00', activeUsers: 623, videosWatched: 892, completionRate: 92, avgSessionDuration: 15 },
      { period: '03:00', activeUsers: 589, videosWatched: 756, completionRate: 85, avgSessionDuration: 11 },
      { period: '04:00', activeUsers: 712, videosWatched: 1045, completionRate: 88, avgSessionDuration: 13 },
      { period: '05:00', activeUsers: 1123, videosWatched: 1567, completionRate: 91, avgSessionDuration: 16 }
    ];

    setUserMetrics(metrics);
  };

  const updateMetrics = () => {
    setMetrics(prev => prev.map(metric => ({
      ...metric,
      value: metric.value + (Math.random() - 0.5) * (metric.value * 0.1),
      trendPercentage: (Math.random() - 0.5) * 20
    })));
  };

  const updateSystemResources = () => {
    setSystemResources(prev => prev.map(resource => ({
      ...resource,
      usage: Math.max(0, Math.min(100, resource.usage + (Math.random() - 0.5) * 10))
    })));
  };

  const getStatusColor = (status: string) => {
    const colors = {
      good: 'text-green-600 bg-green-100',
      optimal: 'text-green-600 bg-green-100',
      warning: 'text-yellow-600 bg-yellow-100',
      high: 'text-yellow-600 bg-yellow-100',
      critical: 'text-red-600 bg-red-100'
    };
    return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return TrendingUp;
    if (trend === 'down') return TrendingDown;
    return Activity;
  };

  const handleRefresh = () => {
    updateMetrics();
    updateSystemResources();
    toast.success('Métricas atualizadas');
  };

  const toggleRealTime = () => {
    setIsRealTime(!isRealTime);
    toast(isRealTime ? 'Tempo real desativado' : 'Tempo real ativado');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Performance Dashboard</h2>
          <p className="text-gray-600 mt-2">
            Monitoramento em tempo real do sistema
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Badge className={isRealTime ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
            <div className={`w-2 h-2 rounded-full mr-2 ${isRealTime ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            {isRealTime ? 'Tempo Real' : 'Manual'}
          </Badge>
          
          <Button onClick={toggleRealTime} variant="outline" size="sm">
            <Activity className="h-4 w-4 mr-2" />
            {isRealTime ? 'Pausar' : 'Ativar'}
          </Button>
          
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="videos">Vídeos</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Métricas Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {metrics.map((metric) => {
              const TrendIcon = getTrendIcon(metric.trend);
              
              return (
                <Card key={metric.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {metric.name}
                    </CardTitle>
                    <metric.icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {typeof metric.value === 'number' 
                        ? metric.value.toLocaleString()
                        : metric.value
                      }
                      <span className="text-sm font-normal ml-1 text-gray-600">
                        {metric.unit}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 mt-2">
                      <TrendIcon className={`h-3 w-3 ${
                        metric.trend === 'up' ? 'text-green-600' :
                        metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                      }`} />
                      <span className={`text-xs ${
                        metric.trendPercentage > 0 ? 'text-green-600' :
                        metric.trendPercentage < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {metric.trendPercentage > 0 ? '+' : ''}
                        {metric.trendPercentage.toFixed(1)}%
                      </span>
                      <Badge className={getStatusColor(metric.status)}>
                        {metric.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      {metric.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Status Geral do Sistema */}
          <Card>
            <CardHeader>
              <CardTitle>Status do Sistema</CardTitle>
              <CardDescription>
                Recursos e performance em tempo real
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {systemResources.map((resource) => (
                  <div key={resource.name} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{resource.name}</span>
                      <Badge className={getStatusColor(resource.status)}>
                        {resource.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Uso</span>
                        <span>{resource.usage.toFixed(1)}%</span>
                      </div>
                      <Progress 
                        value={resource.usage} 
                        className={`h-2 ${
                          resource.status === 'critical' ? 'bg-red-100' :
                          resource.status === 'high' ? 'bg-yellow-100' : 'bg-green-100'
                        }`}
                      />
                    </div>

                    <div className="space-y-1">
                      {Object.entries(resource.details).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-xs">
                          <span className="text-gray-600 capitalize">{key}:</span>
                          <span className="font-medium">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          {/* Detalhamento do Sistema */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {systemResources.map((resource) => (
              <Card key={resource.name}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{resource.name}</span>
                    <Badge className={getStatusColor(resource.status)}>
                      {resource.status}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Uso atual: {resource.usage.toFixed(1)}%
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Progress value={resource.usage} className="h-4" />
                    
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(resource.details).map(([key, value]) => (
                        <div key={key} className="space-y-1">
                          <div className="text-sm text-gray-600 capitalize">{key}</div>
                          <div className="font-bold">{String(value)}</div>
                        </div>
                      ))}
                    </div>

                    {/* Alertas específicos */}
                    {resource.status === 'critical' && (
                      <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <span className="text-sm font-medium text-red-800">
                            Atenção Crítica
                          </span>
                        </div>
                        <p className="text-xs text-red-700 mt-1">
                          Este recurso está próximo do limite. Considere otimização.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          {/* Métricas de Usuários */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Usuários Online</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">1,247</div>
                <div className="text-xs text-green-600 flex items-center mt-2">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +23% vs ontem
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Taxa de Conclusão</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">87%</div>
                <div className="text-xs text-green-600 flex items-center mt-2">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +5% vs semana passada
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Sessão Média</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">14min</div>
                <div className="text-xs text-gray-600 flex items-center mt-2">
                  <Activity className="h-3 w-3 mr-1" />
                  Estável
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Novos Usuários</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">156</div>
                <div className="text-xs text-blue-600 flex items-center mt-2">
                  <Users className="h-3 w-3 mr-1" />
                  Hoje
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de Usuários por Hora */}
          <Card>
            <CardHeader>
              <CardTitle>Atividade por Hora</CardTitle>
              <CardDescription>
                Últimas 6 horas de atividade dos usuários
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userMetrics.map((metric) => (
                  <div key={metric.period} className="flex items-center space-x-4">
                    <div className="w-12 text-sm font-mono">{metric.period}</div>
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Usuários: {metric.activeUsers}</span>
                        <span>Vídeos: {metric.videosWatched}</span>
                        <span>Conclusão: {metric.completionRate}%</span>
                      </div>
                      <Progress value={(metric.activeUsers / 1200) * 100} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="videos" className="space-y-6">
          {/* Métricas de Vídeo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Vídeos Processados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">2,134</div>
                <div className="text-xs text-gray-600">Últimas 24h</div>
                <Progress value={85} className="mt-3" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Tempo Médio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">4.2min</div>
                <div className="text-xs text-gray-600">Por renderização</div>
                <div className="text-xs text-green-600 mt-2">
                  -15% vs semana passada
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Taxa de Sucesso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">99.7%</div>
                <div className="text-xs text-gray-600">Renderizações OK</div>
                <div className="text-xs text-green-600 mt-2">
                  <CheckCircle className="h-3 w-3 inline mr-1" />
                  Excelente
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Queue Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status da Fila de Renderização</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Processando</span>
                  <Badge className="bg-blue-100 text-blue-800">12 vídeos</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Na Fila</span>
                  <Badge className="bg-yellow-100 text-yellow-800">8 vídeos</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Concluídos (hoje)</span>
                  <Badge className="bg-green-100 text-green-800">1,247 vídeos</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Com Erro</span>
                  <Badge className="bg-red-100 text-red-800">3 vídeos</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Analytics Avançados */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top NRs Mais Acessadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { nr: 'NR-35', name: 'Trabalho em Altura', views: 1247, percentage: 89 },
                    { nr: 'NR-10', name: 'Segurança Elétrica', views: 987, percentage: 71 },
                    { nr: 'NR-12', name: 'Máquinas', views: 856, percentage: 61 },
                    { nr: 'NR-06', name: 'EPIs', views: 743, percentage: 53 },
                    { nr: 'NR-23', name: 'Proteção Incêndios', views: 634, percentage: 45 }
                  ].map((item) => (
                    <div key={item.nr} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium">{item.nr}</span>
                          <span className="text-sm text-gray-600 ml-2">{item.name}</span>
                        </div>
                        <span className="text-sm font-bold">{item.views}</span>
                      </div>
                      <Progress value={item.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dispositivos Mais Usados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { device: 'Desktop', percentage: 67, color: 'bg-blue-500' },
                    { device: 'Mobile', percentage: 28, color: 'bg-green-500' },
                    { device: 'Tablet', percentage: 5, color: 'bg-orange-500' }
                  ].map((item) => (
                    <div key={item.device} className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                      <span className="flex-1">{item.device}</span>
                      <span className="font-bold">{item.percentage}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

