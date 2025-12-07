// TODO: Fixar value unknown type
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Activity,
  BarChart3,
  Clock,
  Cpu,
  Database,
  HardDrive,
  MemoryStick,
  Network,
  Server,
  TrendingUp,
  TrendingDown,
  Users,
  Video,
  Mic,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Zap,
  Globe,
  Download,
  RefreshCw,
  Settings,
  Filter
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Interfaces
interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: {
    upload: number;
    download: number;
  };
  uptime: number;
}

interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  availability: number;
}

interface TTSMetrics {
  totalRequests: number;
  successRate: number;
  averageLatency: number;
  charactersProcessed: number;
  topEngines: Array<{ name: string; usage: number; }>;
}

interface AvatarMetrics {
  totalRenders: number;
  averageRenderTime: number;
  successRate: number;
  topAvatars: Array<{ name: string; usage: number; }>;
}

interface VideoMetrics {
  totalVideos: number;
  totalDuration: number;
  averageGenerationTime: number;
  resolutionDistribution: Array<{ resolution: string; count: number; }>;
}

interface UserMetrics {
  activeUsers: number;
  totalUsers: number;
  newUsers: number;
  userGrowth: number;
}

interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
}

interface HistoricalDataPoint {
  time: string;
  cpu: number;
  memory: number;
  requests: number;
  errors: number;
}

export default function MetricsDashboard() {
  // Estados
  const [timeRange, setTimeRange] = useState('24h');
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    cpu: 0,
    memory: 0,
    disk: 0,
    network: { upload: 0, download: 0 },
    uptime: 0
  });
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    responseTime: 0,
    throughput: 0,
    errorRate: 0,
    availability: 0
  });
  const [ttsMetrics, setTTSMetrics] = useState<TTSMetrics>({
    totalRequests: 0,
    successRate: 0,
    averageLatency: 0,
    charactersProcessed: 0,
    topEngines: []
  });
  const [avatarMetrics, setAvatarMetrics] = useState<AvatarMetrics>({
    totalRenders: 0,
    averageRenderTime: 0,
    successRate: 0,
    topAvatars: []
  });
  const [videoMetrics, setVideoMetrics] = useState<VideoMetrics>({
    totalVideos: 0,
    totalDuration: 0,
    averageGenerationTime: 0,
    resolutionDistribution: []
  });
  const [userMetrics, setUserMetrics] = useState<UserMetrics>({
    activeUsers: 0,
    totalUsers: 0,
    newUsers: 0,
    userGrowth: 0
  });
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);

  // Gerar dados simulados
  const generateMockData = () => {
    // Métricas do sistema
    setSystemMetrics({
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
      disk: Math.random() * 100,
      network: {
        upload: Math.random() * 1000,
        download: Math.random() * 5000
      },
      uptime: Math.random() * 30 * 24 * 60 * 60 // até 30 dias em segundos
    });

    // Métricas de performance
    setPerformanceMetrics({
      responseTime: Math.random() * 500 + 50,
      throughput: Math.random() * 1000 + 100,
      errorRate: Math.random() * 5,
      availability: 95 + Math.random() * 5
    });

    // Métricas TTS
    setTTSMetrics({
      totalRequests: Math.floor(Math.random() * 10000) + 1000,
      successRate: 95 + Math.random() * 5,
      averageLatency: Math.random() * 2000 + 500,
      charactersProcessed: Math.floor(Math.random() * 1000000) + 100000,
      topEngines: [
        { name: 'ElevenLabs', usage: Math.random() * 40 + 30 },
        { name: 'Azure', usage: Math.random() * 30 + 20 },
        { name: 'Google', usage: Math.random() * 20 + 10 },
        { name: 'AWS', usage: Math.random() * 15 + 5 }
      ]
    });

    // Métricas Avatar
    setAvatarMetrics({
      totalRenders: Math.floor(Math.random() * 5000) + 500,
      averageRenderTime: Math.random() * 10 + 2,
      successRate: 90 + Math.random() * 10,
      topAvatars: [
        { name: 'Emma', usage: Math.random() * 30 + 25 },
        { name: 'Marcus', usage: Math.random() * 25 + 20 },
        { name: 'Yuki', usage: Math.random() * 20 + 15 },
        { name: 'Diego', usage: Math.random() * 15 + 10 }
      ]
    });

    // Métricas de Vídeo
    setVideoMetrics({
      totalVideos: Math.floor(Math.random() * 2000) + 200,
      totalDuration: Math.floor(Math.random() * 100000) + 10000,
      averageGenerationTime: Math.random() * 30 + 10,
      resolutionDistribution: [
        { resolution: '720p', count: Math.floor(Math.random() * 500) + 100 },
        { resolution: '1080p', count: Math.floor(Math.random() * 800) + 200 },
        { resolution: '4K', count: Math.floor(Math.random() * 200) + 50 }
      ]
    });

    // Métricas de Usuário
    setUserMetrics({
      activeUsers: Math.floor(Math.random() * 500) + 50,
      totalUsers: Math.floor(Math.random() * 5000) + 1000,
      newUsers: Math.floor(Math.random() * 50) + 10,
      userGrowth: (Math.random() - 0.5) * 20
    });

    // Alertas
    const mockAlerts: Alert[] = [
      {
        id: '1',
        type: 'warning',
        title: 'Alto uso de CPU',
        message: 'CPU está em 85% de uso nos últimos 10 minutos',
        timestamp: new Date(Date.now() - 300000),
        resolved: false
      },
      {
        id: '2',
        type: 'error',
        title: 'Falha no TTS Engine',
        message: 'ElevenLabs API retornando erro 503',
        timestamp: new Date(Date.now() - 600000),
        resolved: false
      },
      {
        id: '3',
        type: 'info',
        title: 'Cache otimizado',
        message: 'Taxa de hit do cache aumentou para 85%',
        timestamp: new Date(Date.now() - 900000),
        resolved: true
      }
    ];
    setAlerts(mockAlerts);

    // Dados históricos para gráficos
    const historical = Array.from({ length: 24 }, (_, i) => ({
      time: `${23 - i}h`,
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
      requests: Math.floor(Math.random() * 1000),
      errors: Math.floor(Math.random() * 50),
      responseTime: Math.random() * 500 + 100
    }));
    setHistoricalData(historical);
  };

  // Atualizar dados
  useEffect(() => {
    generateMockData();
    
    if (isAutoRefresh) {
      const interval = setInterval(generateMockData, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [isAutoRefresh, refreshInterval]);

  // Formatar tempo de uptime
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  // Formatar bytes
  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Cores para gráficos
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Métricas</h1>
          <p className="text-muted-foreground">
            Monitore o desempenho e uso do sistema em tempo real
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Última hora</SelectItem>
              <SelectItem value="24h">Últimas 24h</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isAutoRefresh ? 'animate-spin' : ''}`} />
            {isAutoRefresh ? 'Pausar' : 'Auto'}
          </Button>
          
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Configurar
          </Button>
        </div>
      </div>

      {/* Alertas */}
      {alerts.filter(a => !a.resolved).length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Alertas Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.filter(a => !a.resolved).map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 bg-white rounded border">
                  <div className="flex items-center gap-3">
                    {alert.type === 'error' && <XCircle className="w-4 h-4 text-red-500" />}
                    {alert.type === 'warning' && <AlertTriangle className="w-4 h-4 text-orange-500" />}
                    {alert.type === 'info' && <CheckCircle className="w-4 h-4 text-blue-500" />}
                    <div>
                      <div className="font-medium">{alert.title}</div>
                      <div className="text-sm text-muted-foreground">{alert.message}</div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {alert.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Usuários Ativos</p>
                <p className="text-2xl font-bold">{userMetrics.activeUsers}</p>
                <p className="text-xs text-muted-foreground">
                  {userMetrics.userGrowth > 0 ? '+' : ''}{userMetrics.userGrowth.toFixed(1)}% vs ontem
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Vídeos Gerados</p>
                <p className="text-2xl font-bold">{videoMetrics.totalVideos}</p>
                <p className="text-xs text-muted-foreground">
                  {Math.floor(videoMetrics.totalDuration / 60)} min total
                </p>
              </div>
              <Video className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Requisições TTS</p>
                <p className="text-2xl font-bold">{ttsMetrics.totalRequests.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  {ttsMetrics.successRate.toFixed(1)}% sucesso
                </p>
              </div>
              <Mic className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Renders Avatar</p>
                <p className="text-2xl font-bold">{avatarMetrics.totalRenders.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  {avatarMetrics.averageRenderTime.toFixed(1)}s médio
                </p>
              </div>
              <Eye className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Métricas */}
      <Tabs defaultValue="system" className="space-y-6">
        <TabsList>
          <TabsTrigger value="system">Sistema</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="tts">TTS</TabsTrigger>
          <TabsTrigger value="avatar">Avatar</TabsTrigger>
          <TabsTrigger value="video">Vídeo</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
        </TabsList>

        {/* Sistema */}
        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recursos do Sistema */}
            <Card>
              <CardHeader>
                <CardTitle>Recursos do Sistema</CardTitle>
                <CardDescription>Uso atual de CPU, memória e disco</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4" />
                      <span>CPU</span>
                    </div>
                    <span>{systemMetrics.cpu.toFixed(1)}%</span>
                  </div>
                  <Progress value={systemMetrics.cpu} />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <MemoryStick className="w-4 h-4" />
                      <span>Memória</span>
                    </div>
                    <span>{systemMetrics.memory.toFixed(1)}%</span>
                  </div>
                  <Progress value={systemMetrics.memory} />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <HardDrive className="w-4 h-4" />
                      <span>Disco</span>
                    </div>
                    <span>{systemMetrics.disk.toFixed(1)}%</span>
                  </div>
                  <Progress value={systemMetrics.disk} />
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>Uptime</span>
                    </div>
                    <span>{formatUptime(systemMetrics.uptime)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rede */}
            <Card>
              <CardHeader>
                <CardTitle>Tráfego de Rede</CardTitle>
                <CardDescription>Upload e download em tempo real</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span>Upload</span>
                    </div>
                    <span>{formatBytes(systemMetrics.network.upload)}/s</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-blue-500" />
                      <span>Download</span>
                    </div>
                    <span>{formatBytes(systemMetrics.network.download)}/s</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico Histórico do Sistema */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico do Sistema</CardTitle>
              <CardDescription>CPU e memória nas últimas 24 horas</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="cpu" stroke="#3B82F6" name="CPU %" />
                  <Line type="monotone" dataKey="memory" stroke="#10B981" name="Memória %" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold">{performanceMetrics.responseTime.toFixed(0)}ms</div>
                <div className="text-sm text-muted-foreground">Tempo de Resposta</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold">{performanceMetrics.throughput.toFixed(0)}</div>
                <div className="text-sm text-muted-foreground">Req/min</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold">{performanceMetrics.errorRate.toFixed(2)}%</div>
                <div className="text-sm text-muted-foreground">Taxa de Erro</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold">{performanceMetrics.availability.toFixed(2)}%</div>
                <div className="text-sm text-muted-foreground">Disponibilidade</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Requisições e Erros</CardTitle>
              <CardDescription>Volume de requisições e taxa de erro</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="requests" stackId="1" stroke="#3B82F6" fill="#3B82F6" name="Requisições" />
                  <Area type="monotone" dataKey="errors" stackId="2" stroke="#EF4444" fill="#EF4444" name="Erros" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TTS */}
        <TabsContent value="tts" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Engines TTS Mais Usados</CardTitle>
                <CardDescription>Distribuição de uso por engine</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={ttsMetrics.topEngines}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }: { name: string; value: number }) => `${name}: ${value.toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="usage"
                    >
                      {ttsMetrics.topEngines.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estatísticas TTS</CardTitle>
                <CardDescription>Métricas detalhadas do serviço TTS</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Total de Requisições</span>
                  <span className="font-bold">{ttsMetrics.totalRequests.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxa de Sucesso</span>
                  <span className="font-bold">{ttsMetrics.successRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Latência Média</span>
                  <span className="font-bold">{ttsMetrics.averageLatency.toFixed(0)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Caracteres Processados</span>
                  <span className="font-bold">{ttsMetrics.charactersProcessed.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Avatar */}
        <TabsContent value="avatar" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Avatares Mais Populares</CardTitle>
                <CardDescription>Uso por avatar</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={avatarMetrics.topAvatars}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="usage" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estatísticas de Renderização</CardTitle>
                <CardDescription>Performance dos renders 3D</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Total de Renders</span>
                  <span className="font-bold">{avatarMetrics.totalRenders.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tempo Médio</span>
                  <span className="font-bold">{avatarMetrics.averageRenderTime.toFixed(1)}s</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxa de Sucesso</span>
                  <span className="font-bold">{avatarMetrics.successRate.toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Vídeo */}
        <TabsContent value="video" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Resolução</CardTitle>
                <CardDescription>Vídeos gerados por qualidade</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={videoMetrics.resolutionDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ resolution, count }) => `${resolution}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {videoMetrics.resolutionDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estatísticas de Vídeo</CardTitle>
                <CardDescription>Métricas de geração de vídeo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Total de Vídeos</span>
                  <span className="font-bold">{videoMetrics.totalVideos.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Duração Total</span>
                  <span className="font-bold">{Math.floor(videoMetrics.totalDuration / 60)}h {videoMetrics.totalDuration % 60}m</span>
                </div>
                <div className="flex justify-between">
                  <span>Tempo Médio de Geração</span>
                  <span className="font-bold">{videoMetrics.averageGenerationTime.toFixed(1)}s</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Usuários */}
        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold">{userMetrics.activeUsers}</div>
                <div className="text-sm text-muted-foreground">Usuários Ativos</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold">{userMetrics.totalUsers.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total de Usuários</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold">{userMetrics.newUsers}</div>
                <div className="text-sm text-muted-foreground">Novos Usuários (hoje)</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className={`text-2xl font-bold ${userMetrics.userGrowth > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {userMetrics.userGrowth > 0 ? '+' : ''}{userMetrics.userGrowth.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Crescimento</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
