/**
 * 📊 Dashboard de Performance Real-Time
 * Interface visual para monitoramento de métricas do sistema
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Activity,
  Cpu,
  MemoryStick,
  Network,
  AlertTriangle,
  CheckCircle,
  Zap,
  Settings,
  Gauge,
  TrendingUp,
  Download,
  RefreshCw,
  Pause,
  Play,
  Trash2
} from 'lucide-react';
import { performanceMonitor, PerformanceMetrics, AlertThresholds } from '@/lib/performance/performance-monitor';

interface Alert {
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
type BadgeVariant = NonNullable<BadgeProps['variant']>;

export function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<Partial<PerformanceMetrics>>({});
  const [history, setHistory] = useState<PerformanceMetrics[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [thresholds, setThresholds] = useState<AlertThresholds>({
    cpu: 80,
    memory: 85,
    latency: 2000,
    errorRate: 10
  });

  useEffect(() => {
    const handleMetrics = (data: PerformanceMetrics) => {
      setMetrics(data);
      setHistory(prev => [...prev.slice(-59), data]); // Mantém últimos 60 pontos
    };

    const handleAlerts = (alertData: any[]) => {
      const newAlerts = alertData.map(alert => ({
        ...alert,
        timestamp: Date.now()
      }));
      setAlerts(prev => [...newAlerts, ...prev].slice(0, 50)); // Últimos 50 alertas
    };

    performanceMonitor.on('metrics', handleMetrics as any);
    performanceMonitor.on('alerts', handleAlerts as any);

    return () => {
      performanceMonitor.off('metrics', handleMetrics as any);
      performanceMonitor.off('alerts', handleAlerts as any);
    };
  }, []);

  const toggleMonitoring = () => {
    if (isMonitoring) {
      performanceMonitor.stop();
    } else {
      performanceMonitor.start();
    }
    setIsMonitoring(!isMonitoring);
  };

  const clearHistory = () => {
    performanceMonitor.clearHistory();
    setHistory([]);
    setAlerts([]);
  };

  const updateThresholds = () => {
    performanceMonitor.setThresholds(thresholds);
  };

  const exportData = () => {
    const data = performanceMonitor.exportMetrics();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-metrics-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getSeverityColor = (severity: Alert['severity']): BadgeVariant => {
    const severityMap: Record<Alert['severity'], BadgeVariant> = {
      high: 'destructive',
      medium: 'secondary',
      low: 'outline'
    };

    return severityMap[severity] ?? 'outline';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              📊 Performance Dashboard
            </h1>
            <p className="text-gray-300">
              Monitoramento em tempo real do sistema
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button
              onClick={toggleMonitoring}
              variant={isMonitoring ? "destructive" : "default"}
              size="sm"
            >
              {isMonitoring ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              {isMonitoring ? 'Pausar' : 'Iniciar'}
            </Button>
            
            <Button onClick={clearHistory} variant="outline" size="sm">
              <Trash2 className="w-4 h-4 mr-2" />
              Limpar
            </Button>
            
            <Button onClick={exportData} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* CPU */}
          <Card className="bg-white/10 backdrop-blur-sm border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-200">CPU Usage</CardTitle>
              <Cpu className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white mb-2">
                {metrics.cpu?.usage || 0}%
              </div>
              <Progress 
                value={metrics.cpu?.usage || 0} 
                className="mb-2"
              />
              <p className="text-xs text-gray-400">
                {metrics.cpu?.threads || 0} threads disponíveis
              </p>
            </CardContent>
          </Card>

          {/* Memory */}
          <Card className="bg-white/10 backdrop-blur-sm border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-200">Memory Usage</CardTitle>
              <MemoryStick className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white mb-2">
                {metrics.memory?.percentage || 0}%
              </div>
              <Progress 
                value={metrics.memory?.percentage || 0} 
                className="mb-2"
              />
              <p className="text-xs text-gray-400">
                {formatBytes(metrics.memory?.used || 0)} / {formatBytes(metrics.memory?.total || 0)}
              </p>
            </CardContent>
          </Card>

          {/* Network */}
          <Card className="bg-white/10 backdrop-blur-sm border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-200">Network</CardTitle>
              <Network className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white mb-2">
                {metrics.network?.avgLatency || 0}ms
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>{metrics.network?.requests || 0} requests</span>
                <span>{metrics.network?.errors || 0} errors</span>
              </div>
            </CardContent>
          </Card>

          {/* Performance */}
          <Card className="bg-white/10 backdrop-blur-sm border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-200">Performance</CardTitle>
              <Gauge className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white mb-2">
                {metrics.performance?.fps || 0} FPS
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>{metrics.performance?.domNodes || 0} DOM nodes</span>
                <span>{metrics.performance?.renderTime || 0}ms render</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <Card className="bg-red-900/20 backdrop-blur-sm border-red-700">
            <CardHeader>
              <CardTitle className="flex items-center text-red-300">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Alertas Ativos ({alerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {alerts.slice(0, 5).map((alert, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded">
                    <span className="text-sm text-gray-200">{alert.message}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant={getSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {formatTime(alert.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Charts */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-white/10 backdrop-blur-sm">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="detailed">Detalhado</TabsTrigger>
            <TabsTrigger value="apis">APIs</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* CPU/Memory Chart */}
              <Card className="bg-white/10 backdrop-blur-sm border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">CPU & Memory Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={history}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="timestamp" 
                        tickFormatter={formatTime}
                        stroke="#9CA3AF"
                      />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="cpu.usage" 
                        stroke="#3B82F6" 
                        strokeWidth={2}
                        name="CPU %"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="memory.percentage" 
                        stroke="#10B981" 
                        strokeWidth={2}
                        name="Memory %"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Network Chart */}
              <Card className="bg-white/10 backdrop-blur-sm border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Network Latency</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={history}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="timestamp" 
                        tickFormatter={formatTime}
                        stroke="#9CA3AF"
                      />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="network.avgLatency" 
                        stroke="#F59E0B" 
                        fill="#F59E0B"
                        fillOpacity={0.3}
                        name="Latency (ms)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="detailed">
            {/* Detailed metrics views */}
            <div className="space-y-6">
              <Card className="bg-white/10 backdrop-blur-sm border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Métricas Detalhadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Heap Size</p>
                      <p className="text-white font-mono">
                        {formatBytes(metrics.memory?.heap?.used || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">DOM Nodes</p>
                      <p className="text-white font-mono">
                        {metrics.performance?.domNodes || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Render Time</p>
                      <p className="text-white font-mono">
                        {metrics.performance?.renderTime || 0}ms
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Requests</p>
                      <p className="text-white font-mono">
                        {metrics.network?.requests || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="apis">
            <Card className="bg-white/10 backdrop-blur-sm border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">API Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.apis && Object.entries(metrics.apis).map(([endpoint, data]) => (
                    <div key={endpoint} className="p-4 bg-white/5 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <code className="text-sm text-blue-300">{endpoint}</code>
                        <Badge variant="outline">
                          {data.calls} calls
                        </Badge>
                      </div>
                      <div className="flex justify-between text-sm text-gray-400">
                        <span>Avg: {data.avgResponseTime}ms</span>
                        <span>Errors: {data.errors}</span>
                        <span>Last: {formatTime(data.lastCall)}</span>
                      </div>
                    </div>
                  ))}
                  {(!metrics.apis || Object.keys(metrics.apis).length === 0) && (
                    <p className="text-gray-400 text-center py-8">
                      Nenhuma chamada de API detectada
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="bg-white/10 backdrop-blur-sm border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Configurações de Alerta</CardTitle>
                <CardDescription className="text-gray-400">
                  Configure os thresholds para alertas de performance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-200 mb-2 block">
                      CPU Threshold (%)
                    </label>
                    <input
                      type="number"
                      value={thresholds.cpu}
                      onChange={(e) => setThresholds(prev => ({ ...prev, cpu: Number(e.target.value) }))}
                      className="w-full p-2 bg-white/10 border border-gray-600 rounded text-white"
                      min="0"
                      max="100"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-200 mb-2 block">
                      Memory Threshold (%)
                    </label>
                    <input
                      type="number"
                      value={thresholds.memory}
                      onChange={(e) => setThresholds(prev => ({ ...prev, memory: Number(e.target.value) }))}
                      className="w-full p-2 bg-white/10 border border-gray-600 rounded text-white"
                      min="0"
                      max="100"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-200 mb-2 block">
                      Latency Threshold (ms)
                    </label>
                    <input
                      type="number"
                      value={thresholds.latency}
                      onChange={(e) => setThresholds(prev => ({ ...prev, latency: Number(e.target.value) }))}
                      className="w-full p-2 bg-white/10 border border-gray-600 rounded text-white"
                      min="0"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-200 mb-2 block">
                      Error Rate Threshold (%)
                    </label>
                    <input
                      type="number"
                      value={thresholds.errorRate}
                      onChange={(e) => setThresholds(prev => ({ ...prev, errorRate: Number(e.target.value) }))}
                      className="w-full p-2 bg-white/10 border border-gray-600 rounded text-white"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
                
                <Button onClick={updateThresholds} className="w-full">
                  <Settings className="w-4 h-4 mr-2" />
                  Aplicar Configurações
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default PerformanceDashboard;