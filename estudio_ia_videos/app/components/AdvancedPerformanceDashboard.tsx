'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Cpu,
  Download,
  HardDrive,
  MemoryStick,
  Monitor,
  Network,
  Play,
  Pause,
  RefreshCw,
  Settings,
  TrendingDown,
  TrendingUp,
  Wifi,
  Zap,
  AlertCircle,
  BarChart3,
  Eye,
  FileText,
  Filter,
  Search,
  X
} from 'lucide-react';
import { usePerformanceMonitor, PerformanceMetrics, PerformanceAlert } from '@/hooks/usePerformanceMonitor';
import { useToast } from '@/hooks/use-toast';

interface MetricCardProps {
  title: string;
  value: number;
  unit: string;
  icon: React.ReactNode;
  trend?: 'improving' | 'stable' | 'degrading';
  threshold?: { warning: number; critical: number };
  color?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  icon,
  trend,
  threshold,
  color = 'blue'
}) => {
  const getStatusColor = () => {
    if (!threshold) return 'green';
    if (value >= threshold.critical) return 'red';
    if (value >= threshold.warning) return 'yellow';
    return 'green';
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'degrading':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const statusColor = getStatusColor();

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="flex items-center space-x-2">
          {getTrendIcon()}
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value.toFixed(1)}{unit}
        </div>
        {threshold && (
          <div className="mt-2">
            <Progress 
              value={Math.min(100, (value / threshold.critical) * 100)} 
              className="h-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0</span>
              <span className="text-yellow-500">{threshold.warning}</span>
              <span className="text-red-500">{threshold.critical}</span>
            </div>
          </div>
        )}
        <div className={`absolute top-0 right-0 w-1 h-full bg-${statusColor}-500`} />
      </CardContent>
    </Card>
  );
};

interface AlertItemProps {
  alert: PerformanceAlert;
  onAcknowledge: (alertId: string) => void;
}

const AlertItem: React.FC<AlertItemProps> = ({ alert, onAcknowledge }) => {
  const getAlertIcon = () => {
    switch (alert.type) {
      case 'critical':
        return <AlertCircle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getAlertVariant = (): 'default' | 'destructive' => {
    return alert.type === 'critical' ? 'destructive' : 'default';
  };

  return (
    <Alert variant={getAlertVariant()} className="mb-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getAlertIcon()}
          <div>
            <AlertTitle className="text-sm">{alert.message}</AlertTitle>
            <AlertDescription className="text-xs">
              {alert.timestamp.toLocaleString()}
            </AlertDescription>
          </div>
        </div>
        {!alert.resolved && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAcknowledge(alert.id)}
          >
            <CheckCircle className="h-3 w-3" />
          </Button>
        )}
      </div>
    </Alert>
  );
};

export const AdvancedPerformanceDashboard: React.FC = () => {
  const {
    currentMetrics,
    historicalMetrics,
    alerts,
    thresholds,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    clearHistory,
    acknowledgeAlert,
    updateThresholds,
    generateReport,
    exportMetrics,
    getMetricTrend,
    getPerformanceScore,
    getBottlenecks
  } = usePerformanceMonitor();

  const { toast } = useToast();
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('1h');
  const [showSettings, setShowSettings] = useState(false);
  const [alertFilter, setAlertFilter] = useState<'all' | 'unresolved' | 'critical'>('unresolved');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (autoRefresh && !isMonitoring) {
      startMonitoring();
    }
  }, [autoRefresh, isMonitoring, startMonitoring]);

  const handleToggleMonitoring = () => {
    if (isMonitoring) {
      stopMonitoring();
      toast({
        title: "Monitoramento pausado",
        description: "O monitoramento de performance foi pausado."
      });
    } else {
      startMonitoring();
      toast({
        title: "Monitoramento iniciado",
        description: "O monitoramento de performance foi iniciado."
      });
    }
  };

  const handleExportData = (format: 'json' | 'csv') => {
    const blob = exportMetrics(format);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance_metrics.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Dados exportados",
      description: `Métricas exportadas em formato ${format.toUpperCase()}.`
    });
  };

  const handleGenerateReport = (period: 'hour' | 'day' | 'week' | 'month') => {
    const report = generateReport(period);
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance_report_${period}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Relatório gerado",
      description: `Relatório de ${period} foi gerado e baixado.`
    });
  };

  const getFilteredAlerts = () => {
    switch (alertFilter) {
      case 'unresolved':
        return alerts.filter(alert => !alert.resolved);
      case 'critical':
        return alerts.filter(alert => alert.type === 'critical');
      default:
        return alerts;
    }
  };

  const getTimeRangeData = () => {
    const now = new Date();
    const ranges = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000
    };
    
    const cutoff = new Date(now.getTime() - ranges[selectedTimeRange]);
    return historicalMetrics.filter(metric => metric.timestamp >= cutoff);
  };

  const chartData = getTimeRangeData().map(metric => ({
    time: metric.timestamp.toLocaleTimeString(),
    cpu: metric.cpuUsage,
    memory: metric.memoryUsage,
    render: metric.renderTime,
    network: metric.networkLatency
  }));

  const performanceScore = getPerformanceScore();
  const bottlenecks = getBottlenecks();
  const filteredAlerts = getFilteredAlerts();

  const pieData = currentMetrics ? [
    { name: 'CPU', value: currentMetrics.cpuUsage, color: '#8884d8' },
    { name: 'Memória', value: currentMetrics.memoryUsage, color: '#82ca9d' },
    { name: 'Rede', value: Math.min(100, currentMetrics.networkLatency / 5), color: '#ffc658' },
    { name: 'Disco', value: currentMetrics.diskUsage, color: '#ff7300' }
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Performance</h1>
          <p className="text-muted-foreground">
            Monitoramento avançado de performance do sistema
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={isMonitoring ? "destructive" : "default"}
            onClick={handleToggleMonitoring}
          >
            {isMonitoring ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {isMonitoring ? 'Pausar' : 'Iniciar'}
          </Button>
          <Button variant="outline" onClick={() => setShowSettings(!showSettings)}>
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </Button>
        </div>
      </div>

      {/* Performance Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Score de Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="text-4xl font-bold">
              {performanceScore.toFixed(0)}
            </div>
            <div className="flex-1">
              <Progress value={performanceScore} className="h-4" />
              <div className="flex justify-between text-sm text-muted-foreground mt-1">
                <span>Crítico</span>
                <span>Bom</span>
                <span>Excelente</span>
              </div>
            </div>
            <Badge variant={performanceScore >= 80 ? "default" : performanceScore >= 60 ? "secondary" : "destructive"}>
              {performanceScore >= 80 ? 'Excelente' : performanceScore >= 60 ? 'Bom' : 'Crítico'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Cards */}
      {currentMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="CPU"
            value={currentMetrics.cpuUsage}
            unit="%"
            icon={<Cpu className="h-4 w-4" />}
            trend={getMetricTrend('cpuUsage', 10)}
            threshold={thresholds.cpuUsage}
          />
          <MetricCard
            title="Memória"
            value={currentMetrics.memoryUsage}
            unit="%"
            icon={<MemoryStick className="h-4 w-4" />}
            trend={getMetricTrend('memoryUsage', 10)}
            threshold={thresholds.memoryUsage}
          />
          <MetricCard
            title="Renderização"
            value={currentMetrics.renderTime}
            unit="ms"
            icon={<Monitor className="h-4 w-4" />}
            trend={getMetricTrend('renderTime', 10)}
            threshold={thresholds.renderTime}
          />
          <MetricCard
            title="Latência de Rede"
            value={currentMetrics.networkLatency}
            unit="ms"
            icon={<Wifi className="h-4 w-4" />}
            trend={getMetricTrend('networkLatency', 10)}
            threshold={thresholds.networkLatency}
          />
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="charts">Gráficos</TabsTrigger>
          <TabsTrigger value="alerts">
            Alertas
            {filteredAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {filteredAlerts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="bottlenecks">Gargalos</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Visão Geral do Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                {currentMetrics && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-muted-foreground">Tempo de Carregamento</Label>
                        <div className="text-lg font-semibold">{currentMetrics.loadTime.toFixed(0)}ms</div>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Taxa de Erro</Label>
                        <div className="text-lg font-semibold">{currentMetrics.errorRate.toFixed(2)}%</div>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Cache Hit Rate</Label>
                        <div className="text-lg font-semibold">{currentMetrics.cacheHitRate.toFixed(1)}%</div>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">API Response</Label>
                        <div className="text-lg font-semibold">{currentMetrics.apiResponseTime.toFixed(0)}ms</div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Resource Usage */}
            <Card>
              <CardHeader>
                <CardTitle>Uso de Recursos</CardTitle>
              </CardHeader>
              <CardContent>
                {pieData.length > 0 && (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="charts" className="space-y-4">
          {/* Time Range Selector */}
          <div className="flex items-center space-x-2">
            <Label>Período:</Label>
            {(['1h', '6h', '24h', '7d'] as const).map((range) => (
              <Button
                key={range}
                variant={selectedTimeRange === range ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTimeRange(range)}
              >
                {range}
              </Button>
            ))}
          </div>

          {/* Performance Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>CPU e Memória</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="cpu" stroke="#8884d8" name="CPU %" />
                    <Line type="monotone" dataKey="memory" stroke="#82ca9d" name="Memória %" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Renderização e Rede</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="render" stackId="1" stroke="#ffc658" fill="#ffc658" name="Render (ms)" />
                    <Area type="monotone" dataKey="network" stackId="2" stroke="#ff7300" fill="#ff7300" name="Rede (ms)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          {/* Alert Filters */}
          <div className="flex items-center space-x-2">
            <Label>Filtrar:</Label>
            {(['all', 'unresolved', 'critical'] as const).map((filter) => (
              <Button
                key={filter}
                variant={alertFilter === filter ? "default" : "outline"}
                size="sm"
                onClick={() => setAlertFilter(filter)}
              >
                {filter === 'all' ? 'Todos' : filter === 'unresolved' ? 'Não Resolvidos' : 'Críticos'}
              </Button>
            ))}
          </div>

          {/* Alerts List */}
          <ScrollArea className="h-[400px]">
            {filteredAlerts.length > 0 ? (
              <div className="space-y-2">
                {filteredAlerts.map((alert) => (
                  <AlertItem
                    key={alert.id}
                    alert={alert}
                    onAcknowledge={acknowledgeAlert}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum alerta encontrado
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="bottlenecks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gargalos Identificados</CardTitle>
              <CardDescription>
                Problemas de performance que requerem atenção
              </CardDescription>
            </CardHeader>
            <CardContent>
              {bottlenecks.length > 0 ? (
                <div className="space-y-3">
                  {bottlenecks.map((bottleneck, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          bottleneck.severity === 3 ? 'bg-red-500' : 
                          bottleneck.severity === 2 ? 'bg-yellow-500' : 'bg-blue-500'
                        }`} />
                        <div>
                          <div className="font-medium">{bottleneck.metric}</div>
                          <div className="text-sm text-muted-foreground">{bottleneck.description}</div>
                        </div>
                      </div>
                      <Badge variant={bottleneck.severity === 3 ? "destructive" : "secondary"}>
                        {bottleneck.severity === 3 ? 'Crítico' : 'Alto'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum gargalo identificado
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Generate Reports */}
            <Card>
              <CardHeader>
                <CardTitle>Gerar Relatórios</CardTitle>
                <CardDescription>
                  Crie relatórios detalhados de performance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(['hour', 'day', 'week', 'month'] as const).map((period) => (
                  <Button
                    key={period}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleGenerateReport(period)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Relatório de {period === 'hour' ? '1 Hora' : period === 'day' ? '1 Dia' : period === 'week' ? '1 Semana' : '1 Mês'}
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Export Data */}
            <Card>
              <CardHeader>
                <CardTitle>Exportar Dados</CardTitle>
                <CardDescription>
                  Exporte métricas em diferentes formatos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleExportData('json')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar JSON
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleExportData('csv')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
                <Separator />
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={clearHistory}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Limpar Histórico
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Settings Panel */}
      {showSettings && (
        <Card>
          <CardHeader>
            <CardTitle>Configurações de Monitoramento</CardTitle>
            <CardDescription>
              Configure thresholds e preferências de monitoramento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="auto-refresh"
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
              />
              <Label htmlFor="auto-refresh">Atualização automática</Label>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>CPU - Aviso (%)</Label>
                <Input
                  type="number"
                  value={thresholds.cpuUsage.warning}
                  onChange={(e) => updateThresholds({
                    cpuUsage: { ...thresholds.cpuUsage, warning: Number(e.target.value) }
                  })}
                />
              </div>
              <div>
                <Label>CPU - Crítico (%)</Label>
                <Input
                  type="number"
                  value={thresholds.cpuUsage.critical}
                  onChange={(e) => updateThresholds({
                    cpuUsage: { ...thresholds.cpuUsage, critical: Number(e.target.value) }
                  })}
                />
              </div>
              <div>
                <Label>Memória - Aviso (%)</Label>
                <Input
                  type="number"
                  value={thresholds.memoryUsage.warning}
                  onChange={(e) => updateThresholds({
                    memoryUsage: { ...thresholds.memoryUsage, warning: Number(e.target.value) }
                  })}
                />
              </div>
              <div>
                <Label>Memória - Crítico (%)</Label>
                <Input
                  type="number"
                  value={thresholds.memoryUsage.critical}
                  onChange={(e) => updateThresholds({
                    memoryUsage: { ...thresholds.memoryUsage, critical: Number(e.target.value) }
                  })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};