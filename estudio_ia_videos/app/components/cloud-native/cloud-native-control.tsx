
/**
 * ☁️ Estúdio IA de Vídeos - Sprint 9
 * Cloud Native Control Center
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Cloud,
  Server,
  Database,
  Activity,
  TrendingUp,
  Zap,
  Shield,
  RefreshCw,
  Settings,
  AlertTriangle,
  CheckCircle,
  Cpu,
  HardDrive,
  Network,
  Users,
  Lock,
  Unlock,
  Play,
  Pause,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  Monitor,
  Terminal,
  BarChart3,
  Globe
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ClusterNode {
  name: string;
  status: string;
  cpu: string;
  memory: string;
  pods: string;
}

interface ClusterStatus {
  nodes: ClusterNode[];
  overall: {
    health: string;
    version: string;
    uptime: string;
  };
}

interface ServiceMetrics {
  cpu: number;
  memory: number;
  requests: number;
  latency: number;
}

interface Service {
  id: string;
  name: string;
  status: string;
  instances: number;
  version: string;
  endpoint: string;
  metrics: ServiceMetrics;
}

interface Deployment {
  name: string;
  namespace: string;
  replicas: {
    desired: number;
    ready: number;
    available: number;
  };
  status: string;
  age: string;
  image: string;
}

interface ClusterMetrics {
  cpuUsage: number;
  memoryUsage: number;
  storageUsage: number;
  networkIO: {
    inbound: string;
    outbound: string;
  };
  requests: number;
  errors: number;
  latency: number;
}

interface AutoscalingMetrics {
  events: number;
  lastScale: Date;
  predictions: {
    nextScaleEvent: Date;
    reason: string;
  };
}

interface Metrics {
  cluster: ClusterMetrics;
  autoscaling: AutoscalingMetrics;
}

interface Log {
  timestamp: Date;
  level: string;
  service: string;
  message: string;
}

export default function CloudNativeControl() {
  const [clusterStatus, setClusterStatus] = useState<ClusterStatus | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  useEffect(() => {
    loadClusterStatus();
    loadServices();
    loadDeployments();
    loadMetrics();
    loadLogs();
  }, []);

  const loadClusterStatus = async () => {
    try {
      const response = await fetch('/api/v2/cloud-native/cluster/status');
      if (response.ok) {
        const status = await response.json();
        setClusterStatus(status);
      }
    } catch (error) {
      // Mock data
      setClusterStatus({
        nodes: [
          { name: 'node-001', status: 'Ready', cpu: '4 cores', memory: '16Gi', pods: '12/110' },
          { name: 'node-002', status: 'Ready', cpu: '4 cores', memory: '16Gi', pods: '15/110' },
          { name: 'node-003', status: 'Ready', cpu: '4 cores', memory: '16Gi', pods: '8/110' }
        ],
        overall: {
          health: 'healthy',
          version: 'v1.28.3',
          uptime: '15d 4h 32m'
        }
      });
    }
  };

  const loadServices = async () => {
    try {
      const response = await fetch('/api/v2/cloud-native/services');
      if (response.ok) {
        const servicesData = await response.json();
        setServices(servicesData);
      }
    } catch (error) {
      // Mock data
      setServices([
        {
          id: 'ai-processing',
          name: 'AI Processing Service',
          status: 'healthy',
          instances: 2,
          version: '2.1.0',
          endpoint: 'ai-service:8001',
          metrics: { cpu: 45, memory: 62, requests: 1250, latency: 180 }
        },
        {
          id: 'video-processing',
          name: 'Video Processing Service',
          status: 'healthy',
          instances: 3,
          version: '1.8.0',
          endpoint: 'video-service:8002',
          metrics: { cpu: 68, memory: 78, requests: 890, latency: 450 }
        },
        {
          id: 'analytics',
          name: 'Analytics Service',
          status: 'degraded',
          instances: 2,
          version: '1.3.0',
          endpoint: 'analytics-service:8005',
          metrics: { cpu: 58, memory: 65, requests: 450, latency: 220 }
        }
      ]);
    }
  };

  const loadDeployments = async () => {
    try {
      const response = await fetch('/api/v2/cloud-native/deployments');
      if (response.ok) {
        const deploymentData = await response.json();
        setDeployments(deploymentData);
      }
    } catch (error) {
      // Mock data
      setDeployments([
        {
          name: 'ai-processing-service',
          namespace: 'estudio-ia',
          replicas: { desired: 2, ready: 2, available: 2 },
          status: 'running',
          age: '3d',
          image: 'estudio-ai/ai-processing:2.1.0'
        },
        {
          name: 'video-processing-service',
          namespace: 'estudio-ia',
          replicas: { desired: 3, ready: 3, available: 3 },
          status: 'running',
          age: '1d',
          image: 'estudio-ai/video-processing:1.8.0'
        },
        {
          name: 'analytics-service',
          namespace: 'estudio-ia',
          replicas: { desired: 2, ready: 1, available: 1 },
          status: 'updating',
          age: '5m',
          image: 'estudio-ai/analytics:1.3.1'
        }
      ]);
    }
  };

  const loadMetrics = async () => {
    try {
      const response = await fetch('/api/v2/cloud-native/metrics');
      if (response.ok) {
        const metricsData = await response.json();
        setMetrics(metricsData);
      }
    } catch (error) {
      // Mock data
      setMetrics({
        cluster: {
          cpuUsage: 68,
          memoryUsage: 72,
          storageUsage: 45,
          networkIO: { inbound: '2.5 GB/h', outbound: '1.8 GB/h' },
          requests: 15420,
          errors: 23,
          latency: 245
        },
        autoscaling: {
          events: 12,
          lastScale: new Date(Date.now() - 1800000),
          predictions: {
            nextScaleEvent: new Date(Date.now() + 3600000),
            reason: 'Traffic increase predicted'
          }
        }
      });
    }
  };

  const loadLogs = async () => {
    try {
      const response = await fetch('/api/v2/cloud-native/logs');
      if (response.ok) {
        const logsData = await response.json();
        setLogs(logsData);
      }
    } catch (error) {
      // Mock logs
      setLogs([
        { timestamp: new Date(), level: 'info', service: 'ai-processing', message: 'Model inference completed successfully' },
        { timestamp: new Date(Date.now() - 60000), level: 'warn', service: 'analytics', message: 'High memory usage detected' },
        { timestamp: new Date(Date.now() - 120000), level: 'info', service: 'video-processing', message: 'Video encoding job finished' },
        { timestamp: new Date(Date.now() - 180000), level: 'error', service: 'storage', message: 'Temporary connection timeout' },
        { timestamp: new Date(Date.now() - 240000), level: 'info', service: 'gateway', message: 'Rate limit policy updated' }
      ]);
    }
  };

  const scaleService = async (serviceId: string, replicas: number) => {
    try {
      const response = await fetch(`/api/v2/cloud-native/services/${serviceId}/scale`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ replicas })
      });

      if (response.ok) {
        toast.success(`Serviço ${serviceId} escalado para ${replicas} réplicas`);
        await loadDeployments();
      } else {
        throw new Error('Falha no scaling');
      }
    } catch (error) {
      toast.error('Erro no scaling: ' + (error as Error).message);
    }
  };

  const restartService = async (serviceId: string) => {
    try {
      const response = await fetch(`/api/v2/cloud-native/services/${serviceId}/restart`, {
        method: 'POST'
      });

      if (response.ok) {
        toast.success(`Serviço ${serviceId} reiniciado`);
        await loadServices();
      } else {
        throw new Error('Falha no restart');
      }
    } catch (error) {
      toast.error('Erro no restart: ' + (error as Error).message);
    }
  };

  const deployNewVersion = async (serviceName: string, version: string) => {
    try {
      const response = await fetch('/api/v2/cloud-native/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service: serviceName, version })
      });

      if (response.ok) {
        toast.success(`Deploy ${serviceName}:${version} iniciado`);
        await loadDeployments();
      } else {
        throw new Error('Falha no deploy');
      }
    } catch (error) {
      toast.error('Erro no deploy: ' + (error as Error).message);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'running':
      case 'deployed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'degraded':
      case 'updating':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'unavailable':
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-600';
      case 'warn': return 'text-yellow-600';
      case 'info': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <Cloud className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Cloud Native Control Center
            </h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Gerenciamento completo de microserviços, containers e infraestrutura cloud
          </p>
        </div>

        {/* Cluster Overview */}
        {clusterStatus && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Server className="h-5 w-5 mr-2" />
                Status do Cluster Kubernetes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-lg font-semibold text-green-600">
                    {clusterStatus.nodes.length}
                  </div>
                  <div className="text-sm text-gray-600">Nodes Ativos</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-lg font-semibold text-blue-600">
                    {clusterStatus.overall.version}
                  </div>
                  <div className="text-sm text-gray-600">Kubernetes</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-lg font-semibold text-purple-600">
                    {clusterStatus.overall.uptime}
                  </div>
                  <div className="text-sm text-gray-600">Uptime</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-lg font-semibold text-orange-600">
                    {clusterStatus.overall.health}
                  </div>
                  <div className="text-sm text-gray-600">Status</div>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-medium mb-3">Nodes do Cluster:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {clusterStatus.nodes.map((node, index) => (
                    <div key={index} className="p-3 border rounded-lg bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{node.name}</span>
                        {getStatusIcon(node.status.toLowerCase())}
                      </div>
                      <div className="space-y-1 text-xs text-gray-600">
                        <div>CPU: {node.cpu}</div>
                        <div>Memory: {node.memory}</div>
                        <div>Pods: {node.pods}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="services" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="services">Microserviços</TabsTrigger>
            <TabsTrigger value="deployments">Deployments</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoramento</TabsTrigger>
            <TabsTrigger value="scaling">Auto-Scaling</TabsTrigger>
          </TabsList>

          {/* Tab: Microserviços */}
          <TabsContent value="services" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {services.map((service) => (
                <Card key={service.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Database className="h-5 w-5 text-blue-600" />
                        <div>
                          <div className="font-semibold">{service.name}</div>
                          <div className="text-sm text-gray-600">{service.endpoint}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={service.status === 'healthy' ? 'default' : 'destructive'}>
                          {service.status}
                        </Badge>
                        {getStatusIcon(service.status)}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">Instâncias</div>
                        <div className="text-lg font-semibold">{service.instances}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Versão</div>
                        <div className="text-lg font-mono">{service.version}</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>CPU</span>
                          <span>{service.metrics.cpu}%</span>
                        </div>
                        <Progress value={service.metrics.cpu} />
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Memory</span>
                          <span>{service.metrics.memory}%</span>
                        </div>
                        <Progress value={service.metrics.memory} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Requests:</span>
                        <span className="ml-2 font-semibold">{service.metrics.requests}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Latency:</span>
                        <span className="ml-2 font-semibold">{service.metrics.latency}ms</span>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setSelectedService(service)}
                        className="flex-1"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Configurar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => restartService(service.id)}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => scaleService(service.id, service.instances + 1)}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Tab: Deployments */}
          <TabsContent value="deployments" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Deployments Ativos</h3>
              <Button>
                <Play className="h-4 w-4 mr-2" />
                Novo Deploy
              </Button>
            </div>

            <div className="space-y-4">
              {deployments.map((deployment, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(deployment.status)}
                          <div>
                            <div className="font-semibold">{deployment.name}</div>
                            <div className="text-sm text-gray-600">{deployment.namespace}</div>
                          </div>
                        </div>
                        
                        <div className="text-sm">
                          <Badge variant="outline">{deployment.image}</Badge>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <div className="text-lg font-semibold">
                            {deployment.replicas.ready}/{deployment.replicas.desired}
                          </div>
                          <div className="text-xs text-gray-600">Replicas</div>
                        </div>

                        <div className="text-center">
                          <div className="text-lg font-semibold">{deployment.age}</div>
                          <div className="text-xs text-gray-600">Age</div>
                        </div>

                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <BarChart3 className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Terminal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {deployment.status === 'updating' && (
                      <div className="mt-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span>Rolling Update Progress</span>
                          <span>50%</span>
                        </div>
                        <Progress value={50} />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Tab: Monitoramento */}
          <TabsContent value="monitoring" className="space-y-6">
            {metrics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Cpu className="h-5 w-5 mr-2" />
                      CPU Cluster
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {metrics.cluster.cpuUsage}%
                    </div>
                    <Progress value={metrics.cluster.cpuUsage} className="mb-4" />
                    <div className="text-sm text-gray-600">
                      8.5/12 cores utilizados
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <HardDrive className="h-5 w-5 mr-2" />
                      Memory Cluster
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {metrics.cluster.memoryUsage}%
                    </div>
                    <Progress value={metrics.cluster.memoryUsage} className="mb-4" />
                    <div className="text-sm text-gray-600">
                      32/48 Gi utilizados
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Network className="h-5 w-5 mr-2" />
                      Network I/O
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Inbound:</span>
                        <span className="font-semibold">{metrics.cluster.networkIO.inbound}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Outbound:</span>
                        <span className="font-semibold">{metrics.cluster.networkIO.outbound}</span>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="text-sm text-gray-600">Requests/hora:</div>
                        <div className="text-lg font-semibold text-purple-600">
                          {metrics.cluster.requests.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Logs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Terminal className="h-5 w-5 mr-2" />
                    Logs do Sistema
                  </div>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Atualizar
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-2 font-mono text-sm">
                    {logs.map((log, index) => (
                      <div key={index} className="flex space-x-3 p-2 hover:bg-gray-50 rounded">
                        <span className="text-gray-400 w-16">
                          {log.timestamp.toLocaleTimeString('pt-BR').slice(0, 5)}
                        </span>
                        <span className={`w-12 font-semibold ${getLogLevelColor(log.level)}`}>
                          {log.level.toUpperCase()}
                        </span>
                        <span className="text-purple-600 w-24">{log.service}</span>
                        <span className="text-gray-700 flex-1">{log.message}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Auto-Scaling */}
          <TabsContent value="scaling" className="space-y-6">
            {metrics && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2" />
                      Auto-Scaling Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-lg font-semibold text-blue-600">
                          {metrics.autoscaling.events}
                        </div>
                        <div className="text-xs text-gray-600">Eventos Hoje</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-lg font-semibold text-green-600">2.3x</div>
                        <div className="text-xs text-gray-600">Eficiência</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="text-sm font-medium mb-2">Último Scaling:</div>
                        <div className="text-sm text-gray-600">
                          {metrics.autoscaling.lastScale.toLocaleString('pt-BR')}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium mb-2">Próximo Previsto:</div>
                        <div className="text-sm text-gray-600">
                          {metrics.autoscaling.predictions.nextScaleEvent.toLocaleString('pt-BR')}
                        </div>
                        <div className="text-xs text-blue-600 mt-1">
                          {metrics.autoscaling.predictions.reason}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Configurações de Scaling</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium">CPU Threshold:</label>
                        <div className="flex items-center space-x-2 mt-1">
                          <Input type="number" defaultValue="70" className="w-20" />
                          <span className="text-sm text-gray-600">%</span>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium">Memory Threshold:</label>
                        <div className="flex items-center space-x-2 mt-1">
                          <Input type="number" defaultValue="80" className="w-20" />
                          <span className="text-sm text-gray-600">%</span>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium">Min Replicas:</label>
                        <div className="flex items-center space-x-2 mt-1">
                          <Input type="number" defaultValue="2" className="w-20" />
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium">Max Replicas:</label>
                        <div className="flex items-center space-x-2 mt-1">
                          <Input type="number" defaultValue="10" className="w-20" />
                        </div>
                      </div>
                    </div>

                    <Button className="w-full">
                      <Settings className="h-4 w-4 mr-2" />
                      Atualizar Configurações
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Service Configuration Modal */}
        {selectedService && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Configurações - {selectedService.name}</span>
                <Button variant="outline" onClick={() => setSelectedService(null)}>
                  Fechar
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Réplicas:</label>
                  <Input type="number" defaultValue={selectedService.instances} />
                </div>
                <div>
                  <label className="text-sm font-medium">Versão:</label>
                  <Select defaultValue={selectedService.version}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={selectedService.version}>{selectedService.version}</SelectItem>
                      <SelectItem value="latest">latest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button onClick={() => scaleService(selectedService.id, selectedService.instances + 1)}>
                  <Zap className="h-4 w-4 mr-2" />
                  Aplicar Mudanças
                </Button>
                <Button variant="outline" onClick={() => deployNewVersion(selectedService.name, 'latest')}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Deploy Nova Versão
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

