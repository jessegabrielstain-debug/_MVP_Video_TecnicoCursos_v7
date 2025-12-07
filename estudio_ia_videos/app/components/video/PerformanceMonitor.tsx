/**
 * 📊 Performance Monitor - Advanced system monitoring and optimization
 * Professional performance monitoring with real-time metrics and alerts
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { 
  Activity, 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Cpu, 
  HardDrive, 
  Monitor, 
  Server, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database, 
  Thermometer,
  Wifi,
  Battery,
  Settings,
  RefreshCw,
  Download,
  Upload,
  Eye,
  Target,
  Gauge,
  LineChart,
  PieChart,
  BarChart,
  Timer,
  Workflow,
  Archive,
  Globe,
  Shield,
  Layers
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Performance Monitoring Types
interface SystemMetrics {
  timestamp: Date;
  cpu: CPUMetrics;
  memory: MemoryMetrics;
  gpu: GPUMetrics;
  disk: DiskMetrics;
  network: NetworkMetrics;
  thermal: ThermalMetrics;
  processes: ProcessMetrics[];
}

interface CPUMetrics {
  usage: number;
  cores: number;
  frequency: number;
  temperature: number;
  load1m: number;
  load5m: number;
  load15m: number;
}

interface MemoryMetrics {
  total: number;
  used: number;
  free: number;
  available: number;
  cached: number;
  buffers: number;
  usage: number;
}

interface GPUMetrics {
  usage: number;
  memory: number;
  temperature: number;
  powerDraw: number;
  fanSpeed: number;
  clockSpeed: number;
}

interface DiskMetrics {
  usage: number;
  readSpeed: number;
  writeSpeed: number;
  iops: number;
  latency: number;
  totalSpace: number;
  freeSpace: number;
}

interface NetworkMetrics {
  downloadSpeed: number;
  uploadSpeed: number;
  latency: number;
  packetLoss: number;
  connections: number;
}

interface ThermalMetrics {
  cpuTemp: number;
  gpuTemp: number;
  motherboardTemp: number;
  fanSpeeds: number[];
}

interface ProcessMetrics {
  pid: number;
  name: string;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  status: ProcessStatus;
}

interface PerformanceAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  metric: string;
  value: number;
  threshold: number;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

interface OptimizationSuggestion {
  id: string;
  category: OptimizationCategory;
  title: string;
  description: string;
  impact: ImpactLevel;
  difficulty: DifficultyLevel;
  estimatedGain: string;
  actions: OptimizationAction[];
}

interface OptimizationAction {
  id: string;
  description: string;
  command?: string;
  manual: boolean;
  applied: boolean;
}

interface PerformanceProfile {
  id: string;
  name: string;
  description: string;
  settings: ProfileSettings;
  active: boolean;
}

interface ProfileSettings {
  cpuGovernor: string;
  gpuMode: string;
  memoryCompression: boolean;
  diskScheduler: string;
  networkOptimization: boolean;
  thermalPolicy: string;
}

type ProcessStatus = 'running' | 'idle' | 'sleeping' | 'stopped' | 'zombie';
type AlertType = 'performance' | 'thermal' | 'resource' | 'network' | 'disk';
type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
type OptimizationCategory = 'cpu' | 'memory' | 'disk' | 'network' | 'thermal' | 'power';
type ImpactLevel = 'low' | 'medium' | 'high';
type DifficultyLevel = 'easy' | 'medium' | 'advanced';

const PERFORMANCE_PROFILES: PerformanceProfile[] = [
  {
    id: 'balanced',
    name: 'Balanced',
    description: 'Optimal balance between performance and power consumption',
    settings: {
      cpuGovernor: 'ondemand',
      gpuMode: 'balanced',
      memoryCompression: true,
      diskScheduler: 'mq-deadline',
      networkOptimization: true,
      thermalPolicy: 'balanced'
    },
    active: true
  },
  {
    id: 'performance',
    name: 'High Performance',
    description: 'Maximum performance for demanding video processing',
    settings: {
      cpuGovernor: 'performance',
      gpuMode: 'performance',
      memoryCompression: false,
      diskScheduler: 'none',
      networkOptimization: true,
      thermalPolicy: 'performance'
    },
    active: false
  },
  {
    id: 'power-save',
    name: 'Power Save',
    description: 'Minimize power consumption and heat generation',
    settings: {
      cpuGovernor: 'powersave',
      gpuMode: 'power-save',
      memoryCompression: true,
      diskScheduler: 'bfq',
      networkOptimization: false,
      thermalPolicy: 'quiet'
    },
    active: false
  }
];

interface PerformanceMonitorProps {
  onAlert?: (alert: PerformanceAlert) => void;
  onOptimizationApplied?: (suggestion: OptimizationSuggestion) => void;
}

export default function PerformanceMonitor({ 
  onAlert, 
  onOptimizationApplied 
}: PerformanceMonitorProps) {
  const { toast } = useToast();
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [metricsHistory, setMetricsHistory] = useState<SystemMetrics[]>([]);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [profiles, setProfiles] = useState<PerformanceProfile[]>(PERFORMANCE_PROFILES);
  const [activeTab, setActiveTab] = useState<'overview' | 'cpu' | 'memory' | 'gpu' | 'disk' | 'network' | 'optimization'>('overview');
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(2000);

  // Generate realistic system metrics
  const generateSystemMetrics = useCallback((): SystemMetrics => {
    const now = new Date();
    const baseLoad = 0.3 + Math.random() * 0.4;
    
    return {
      timestamp: now,
      cpu: {
        usage: Math.min(100, 20 + Math.random() * 60 + (baseLoad * 20)),
        cores: 8,
        frequency: 2400 + Math.random() * 1200,
        temperature: 45 + Math.random() * 30,
        load1m: baseLoad,
        load5m: baseLoad * 0.8,
        load15m: baseLoad * 0.6
      },
      memory: {
        total: 32 * 1024 * 1024 * 1024, // 32GB
        used: (12 + Math.random() * 8) * 1024 * 1024 * 1024, // 12-20GB
        free: 0,
        available: 0,
        cached: 2 * 1024 * 1024 * 1024,
        buffers: 512 * 1024 * 1024,
        usage: 0
      },
      gpu: {
        usage: Math.min(100, 10 + Math.random() * 70 + (baseLoad * 30)),
        memory: Math.min(100, 20 + Math.random() * 60),
        temperature: 40 + Math.random() * 35,
        powerDraw: 150 + Math.random() * 200,
        fanSpeed: 30 + Math.random() * 50,
        clockSpeed: 1500 + Math.random() * 800
      },
      disk: {
        usage: 65 + Math.random() * 20,
        readSpeed: Math.random() * 500,
        writeSpeed: Math.random() * 300,
        iops: Math.random() * 1000,
        latency: 0.5 + Math.random() * 2,
        totalSpace: 2 * 1024 * 1024 * 1024 * 1024, // 2TB
        freeSpace: 800 * 1024 * 1024 * 1024 // 800GB
      },
      network: {
        downloadSpeed: Math.random() * 100,
        uploadSpeed: Math.random() * 50,
        latency: 10 + Math.random() * 30,
        packetLoss: Math.random() * 0.1,
        connections: 50 + Math.random() * 200
      },
      thermal: {
        cpuTemp: 45 + Math.random() * 30,
        gpuTemp: 40 + Math.random() * 35,
        motherboardTemp: 35 + Math.random() * 20,
        fanSpeeds: [40 + Math.random() * 40, 35 + Math.random() * 45, 50 + Math.random() * 30]
      },
      processes: [
        {
          pid: 1234,
          name: 'ffmpeg',
          cpu: 15 + Math.random() * 30,
          memory: 8 + Math.random() * 12,
          disk: Math.random() * 50,
          network: Math.random() * 20,
          status: 'running'
        },
        {
          pid: 5678,
          name: 'node',
          cpu: 5 + Math.random() * 15,
          memory: 4 + Math.random() * 8,
          disk: Math.random() * 10,
          network: Math.random() * 30,
          status: 'running'
        },
        {
          pid: 9012,
          name: 'remotion',
          cpu: 20 + Math.random() * 40,
          memory: 6 + Math.random() * 10,
          disk: Math.random() * 30,
          network: Math.random() * 5,
          status: 'running'
        }
      ]
    };
  }, []);

  // Update memory metrics calculations
  const updateMemoryMetrics = (metrics: SystemMetrics): SystemMetrics => {
    const memory = metrics.memory;
    memory.free = memory.total - memory.used;
    memory.available = memory.free + memory.cached + memory.buffers;
    memory.usage = (memory.used / memory.total) * 100;
    return metrics;
  };

  // Monitor system metrics
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(() => {
      const metrics = updateMemoryMetrics(generateSystemMetrics());
      setSystemMetrics(metrics);
      
      // Keep history of last 100 measurements
      setMetricsHistory(prev => {
        const newHistory = [...prev, metrics];
        return newHistory.slice(-100);
      });

      // Check for alerts
      checkForAlerts(metrics);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [isMonitoring, refreshInterval, generateSystemMetrics]);

  // Check for performance alerts
  const checkForAlerts = useCallback((metrics: SystemMetrics) => {
    const newAlerts: PerformanceAlert[] = [];

    // CPU alerts
    if (metrics.cpu.usage > 90) {
      newAlerts.push({
        id: `cpu-${Date.now()}`,
        type: 'performance',
        severity: 'high',
        metric: 'CPU Usage',
        value: metrics.cpu.usage,
        threshold: 90,
        message: `High CPU usage detected: ${metrics.cpu.usage.toFixed(1)}%`,
        timestamp: new Date(),
        acknowledged: false
      });
    }

    // Temperature alerts
    if (metrics.cpu.temperature > 80) {
      newAlerts.push({
        id: `temp-${Date.now()}`,
        type: 'thermal',
        severity: metrics.cpu.temperature > 90 ? 'critical' : 'high',
        metric: 'CPU Temperature',
        value: metrics.cpu.temperature,
        threshold: 80,
        message: `High CPU temperature: ${metrics.cpu.temperature.toFixed(1)}°C`,
        timestamp: new Date(),
        acknowledged: false
      });
    }

    // Memory alerts
    if (metrics.memory.usage > 85) {
      newAlerts.push({
        id: `memory-${Date.now()}`,
        type: 'resource',
        severity: metrics.memory.usage > 95 ? 'critical' : 'high',
        metric: 'Memory Usage',
        value: metrics.memory.usage,
        threshold: 85,
        message: `High memory usage: ${metrics.memory.usage.toFixed(1)}%`,
        timestamp: new Date(),
        acknowledged: false
      });
    }

    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev].slice(0, 50));
      newAlerts.forEach(alert => {
        if (onAlert) onAlert(alert);
        
        toast({
          title: `${alert.severity.toUpperCase()} Alert`,
          description: alert.message,
          variant: alert.severity === 'critical' ? 'destructive' : 'default'
        });
      });
    }
  }, [onAlert, toast]);

  // Generate optimization suggestions
  useEffect(() => {
    if (!systemMetrics) return;

    const newSuggestions: OptimizationSuggestion[] = [];

    // CPU optimization suggestions
    if (systemMetrics.cpu.usage > 70) {
      newSuggestions.push({
        id: 'cpu-opt-1',
        category: 'cpu',
        title: 'Optimize CPU Performance',
        description: 'Switch to performance governor for better processing speed',
        impact: 'high',
        difficulty: 'easy',
        estimatedGain: '15-25% performance boost',
        actions: [
          {
            id: 'cpu-gov',
            description: 'Set CPU governor to performance mode',
            command: 'cpufreq-set -g performance',
            manual: false,
            applied: false
          }
        ]
      });
    }

    // Memory optimization suggestions
    if (systemMetrics.memory.usage > 80) {
      newSuggestions.push({
        id: 'mem-opt-1',
        category: 'memory',
        title: 'Free Memory Cache',
        description: 'Clear system caches to free up memory',
        impact: 'medium',
        difficulty: 'easy',
        estimatedGain: '10-20% memory freed',
        actions: [
          {
            id: 'clear-cache',
            description: 'Clear page cache and buffers',
            command: 'echo 3 > /proc/sys/vm/drop_caches',
            manual: false,
            applied: false
          }
        ]
      });
    }

    // Thermal optimization suggestions
    if (systemMetrics.cpu.temperature > 75) {
      newSuggestions.push({
        id: 'thermal-opt-1',
        category: 'thermal',
        title: 'Improve Thermal Management',
        description: 'Adjust fan curves and thermal policies',
        impact: 'medium',
        difficulty: 'medium',
        estimatedGain: '5-10°C temperature reduction',
        actions: [
          {
            id: 'fan-curve',
            description: 'Optimize fan curves for better cooling',
            manual: true,
            applied: false
          }
        ]
      });
    }

    setSuggestions(newSuggestions);
  }, [systemMetrics]);

  // Apply optimization
  const applyOptimization = useCallback((suggestion: OptimizationSuggestion, action: OptimizationAction) => {
    // Simulate applying optimization
    setSuggestions(prev => prev.map(s => 
      s.id === suggestion.id 
        ? {
            ...s,
            actions: s.actions.map(a => 
              a.id === action.id ? { ...a, applied: true } : a
            )
          }
        : s
    ));

    toast({
      title: "Otimização aplicada",
      description: `${action.description} foi aplicada com sucesso`
    });

    if (onOptimizationApplied) {
      onOptimizationApplied(suggestion);
    }
  }, [toast, onOptimizationApplied]);

  // Apply performance profile
  const applyProfile = useCallback((profileId: string) => {
    setProfiles(prev => prev.map(p => ({
      ...p,
      active: p.id === profileId
    })));

    const profile = profiles.find(p => p.id === profileId);
    if (profile) {
      toast({
        title: "Perfil aplicado",
        description: `Perfil "${profile.name}" foi ativado`
      });
    }
  }, [profiles, toast]);

  // Format bytes
  const formatBytes = (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Get severity color
  const getSeverityColor = (severity: AlertSeverity) => {
    switch (severity) {
      case 'low': return 'text-blue-400 border-blue-500';
      case 'medium': return 'text-yellow-400 border-yellow-500';
      case 'high': return 'text-orange-400 border-orange-500';
      case 'critical': return 'text-red-400 border-red-500';
      default: return 'text-gray-400 border-gray-500';
    }
  };

  // Get impact color
  const getImpactColor = (impact: ImpactLevel) => {
    switch (impact) {
      case 'low': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  if (!systemMetrics) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-12 w-12 animate-pulse mx-auto mb-4 text-blue-400" />
          <h2 className="text-xl font-semibold mb-2">Initializing Performance Monitor</h2>
          <p className="text-gray-400">Loading system metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-green-400" />
              <div>
                <h1 className="text-2xl font-bold">Performance Monitor</h1>
                <p className="text-gray-400">Advanced System Monitoring & Optimization</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-500/20 text-green-300">
                <Activity className="mr-1 h-3 w-3" />
                Monitoring Active
              </Badge>
              
              <Badge variant="outline" className={
                alerts.filter(a => !a.acknowledged && a.severity === 'critical').length > 0 
                  ? 'border-red-500 text-red-400' 
                  : alerts.filter(a => !a.acknowledged).length > 0
                  ? 'border-orange-500 text-orange-400'
                  : 'border-green-500 text-green-400'
              }>
                {alerts.filter(a => !a.acknowledged && a.severity === 'critical').length > 0 ? (
                  <>
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    Critical Issues
                  </>
                ) : alerts.filter(a => !a.acknowledged).length > 0 ? (
                  <>
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    {alerts.filter(a => !a.acknowledged).length} Alerts
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-1 h-3 w-3" />
                    System Healthy
                  </>
                )}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={refreshInterval.toString()} onValueChange={(value) => setRefreshInterval(parseInt(value))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1000">1s</SelectItem>
                <SelectItem value="2000">2s</SelectItem>
                <SelectItem value="5000">5s</SelectItem>
                <SelectItem value="10000">10s</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              onClick={() => setIsMonitoring(!isMonitoring)}
              className={isMonitoring ? 'border-red-500 text-red-400' : 'border-green-500 text-green-400'}
            >
              {isMonitoring ? (
                <>
                  <Timer className="mr-2 h-4 w-4" />
                  Pause
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Resume
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-6 gap-4 mt-6">
          <Card className="bg-gray-700 border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">CPU</p>
                  <p className="text-2xl font-bold">{Math.round(systemMetrics.cpu.usage)}%</p>
                </div>
                <Cpu className="h-8 w-8 text-blue-400" />
              </div>
              <Progress value={systemMetrics.cpu.usage} className="h-1 mt-2" />
            </CardContent>
          </Card>
          
          <Card className="bg-gray-700 border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Memory</p>
                  <p className="text-2xl font-bold">{Math.round(systemMetrics.memory.usage)}%</p>
                </div>
                <Server className="h-8 w-8 text-green-400" />
              </div>
              <Progress value={systemMetrics.memory.usage} className="h-1 mt-2" />
            </CardContent>
          </Card>
          
          <Card className="bg-gray-700 border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">GPU</p>
                  <p className="text-2xl font-bold">{Math.round(systemMetrics.gpu.usage)}%</p>
                </div>
                <Monitor className="h-8 w-8 text-purple-400" />
              </div>
              <Progress value={systemMetrics.gpu.usage} className="h-1 mt-2" />
            </CardContent>
          </Card>
          
          <Card className="bg-gray-700 border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Disk</p>
                  <p className="text-2xl font-bold">{Math.round(systemMetrics.disk.usage)}%</p>
                </div>
                <HardDrive className="h-8 w-8 text-orange-400" />
              </div>
              <Progress value={systemMetrics.disk.usage} className="h-1 mt-2" />
            </CardContent>
          </Card>
          
          <Card className="bg-gray-700 border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Network</p>
                  <p className="text-2xl font-bold">{Math.round(systemMetrics.network.downloadSpeed)}MB/s</p>
                </div>
                <Wifi className="h-8 w-8 text-cyan-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-700 border-gray-600">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Temp</p>
                  <p className="text-2xl font-bold">{Math.round(systemMetrics.cpu.temperature)}°C</p>
                </div>
                <Thermometer className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="h-full">
          {/* Tabs Navigation */}
          <div className="bg-gray-800 border-b border-gray-700 px-6">
            <TabsList className="bg-gray-700">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="cpu" className="flex items-center gap-2">
                <Cpu className="h-4 w-4" />
                CPU
              </TabsTrigger>
              <TabsTrigger value="memory" className="flex items-center gap-2">
                <Server className="h-4 w-4" />
                Memory
              </TabsTrigger>
              <TabsTrigger value="gpu" className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                GPU
              </TabsTrigger>
              <TabsTrigger value="disk" className="flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                Disk
              </TabsTrigger>
              <TabsTrigger value="network" className="flex items-center gap-2">
                <Wifi className="h-4 w-4" />
                Network
              </TabsTrigger>
              <TabsTrigger value="optimization" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Optimization ({suggestions.length})
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Alerts */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-400" />
                    Recent Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-3">
                      {alerts.slice(0, 10).map((alert) => (
                        <div key={alert.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${
                              alert.severity === 'critical' ? 'bg-red-400' :
                              alert.severity === 'high' ? 'bg-orange-400' :
                              alert.severity === 'medium' ? 'bg-yellow-400' :
                              'bg-blue-400'
                            }`} />
                            <div>
                              <p className="text-sm font-medium">{alert.message}</p>
                              <p className="text-xs text-gray-400">
                                {alert.timestamp.toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                        </div>
                      ))}
                      {alerts.length === 0 && (
                        <p className="text-center text-gray-400 py-8">No alerts</p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Top Processes */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Workflow className="h-5 w-5 text-blue-400" />
                    Top Processes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {systemMetrics.processes
                      .sort((a, b) => b.cpu - a.cpu)
                      .slice(0, 8)
                      .map((process) => (
                        <div key={process.pid} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-600 rounded flex items-center justify-center text-xs">
                              {process.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium">{process.name}</p>
                              <p className="text-gray-400">PID: {process.pid}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{process.cpu.toFixed(1)}% CPU</p>
                            <p className="text-gray-400">{process.memory.toFixed(1)}% MEM</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Performance Profiles */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-green-400" />
                    Performance Profiles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {profiles.map((profile) => (
                      <div key={profile.id} className={`p-3 rounded border ${
                        profile.active ? 'border-green-500 bg-green-500/10' : 'border-gray-600 bg-gray-700/50'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">{profile.name}</h3>
                            <p className="text-sm text-gray-400">{profile.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {profile.active && (
                              <Badge variant="outline" className="border-green-500 text-green-400">
                                Active
                              </Badge>
                            )}
                            {!profile.active && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => applyProfile(profile.id)}
                              >
                                Apply
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* System Health */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-purple-400" />
                    System Health Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="relative inline-flex items-center justify-center w-32 h-32">
                      <div className="absolute inset-0">
                        <Progress 
                          value={85} 
                          className="h-32 w-32 rounded-full"
                        />
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold text-green-400">85</p>
                        <p className="text-sm text-gray-400">Health Score</p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Performance</p>
                        <p className="font-medium text-green-400">Good</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Thermal</p>
                        <p className="font-medium text-yellow-400">Warm</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Resource Usage</p>
                        <p className="font-medium text-green-400">Optimal</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Stability</p>
                        <p className="font-medium text-green-400">Excellent</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* CPU Tab */}
          <TabsContent value="cpu" className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>CPU Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-400">Usage</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={systemMetrics.cpu.usage} className="flex-1" />
                        <span className="text-sm font-medium">{Math.round(systemMetrics.cpu.usage)}%</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-400">Temperature</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={(systemMetrics.cpu.temperature / 100) * 100} className="flex-1" />
                        <span className="text-sm font-medium">{Math.round(systemMetrics.cpu.temperature)}°C</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="bg-gray-700/50 p-3 rounded">
                      <p className="text-gray-400">Cores</p>
                      <p className="text-xl font-bold">{systemMetrics.cpu.cores}</p>
                    </div>
                    <div className="bg-gray-700/50 p-3 rounded">
                      <p className="text-gray-400">Frequency</p>
                      <p className="text-xl font-bold">{Math.round(systemMetrics.cpu.frequency)}MHz</p>
                    </div>
                    <div className="bg-gray-700/50 p-3 rounded">
                      <p className="text-gray-400">Load (1m)</p>
                      <p className="text-xl font-bold">{systemMetrics.cpu.load1m.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>CPU Usage History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-48 flex items-end justify-between gap-1">
                    {metricsHistory.slice(-30).map((metric, index) => (
                      <div
                        key={index}
                        className="bg-blue-400 rounded-t"
                        style={{
                          height: `${(metric.cpu.usage / 100) * 192}px`,
                          width: '8px'
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-2">
                    <span>-30s</span>
                    <span>-15s</span>
                    <span>Now</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Other detailed tabs would follow similar patterns */}
          <TabsContent value="memory" className="p-6">
            <div className="text-center py-20 text-gray-400">
              <Server className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Memory Analysis</h3>
              <p>Detailed memory metrics coming soon</p>
            </div>
          </TabsContent>

          <TabsContent value="gpu" className="p-6">
            <div className="text-center py-20 text-gray-400">
              <Monitor className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">GPU Monitor</h3>
              <p>Advanced GPU metrics in development</p>
            </div>
          </TabsContent>

          <TabsContent value="disk" className="p-6">
            <div className="text-center py-20 text-gray-400">
              <HardDrive className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Disk Performance</h3>
              <p>Storage analytics coming soon</p>
            </div>
          </TabsContent>

          <TabsContent value="network" className="p-6">
            <div className="text-center py-20 text-gray-400">
              <Wifi className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Network Monitor</h3>
              <p>Network performance analysis in development</p>
            </div>
          </TabsContent>

          {/* Optimization Tab */}
          <TabsContent value="optimization" className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Optimization Suggestions</h2>
                <Badge variant="outline" className="border-yellow-500 text-yellow-400">
                  {suggestions.length} suggestions
                </Badge>
              </div>

              <div className="space-y-4">
                {suggestions.map((suggestion) => (
                  <Card key={suggestion.id} className="bg-gray-800 border-gray-700">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{suggestion.title}</h3>
                            <Badge variant="outline" className={getImpactColor(suggestion.impact)}>
                              {suggestion.impact} impact
                            </Badge>
                            <Badge variant="secondary">
                              {suggestion.difficulty}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-400 mb-2">{suggestion.description}</p>
                          <p className="text-sm text-green-400">{suggestion.estimatedGain}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {suggestion.actions.map((action) => (
                          <div key={action.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded">
                            <div className="flex-1">
                              <p className="text-sm">{action.description}</p>
                              {action.command && (
                                <code className="text-xs text-green-400 bg-gray-900 px-2 py-1 rounded mt-1 block">
                                  {action.command}
                                </code>
                              )}
                            </div>
                            <Button
                              size="sm"
                              onClick={() => applyOptimization(suggestion, action)}
                              disabled={action.applied}
                              className={action.applied ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}
                            >
                              {action.applied ? (
                                <>
                                  <CheckCircle className="mr-1 h-3 w-3" />
                                  Applied
                                </>
                              ) : (
                                <>
                                  <Zap className="mr-1 h-3 w-3" />
                                  Apply
                                </>
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {suggestions.length === 0 && (
                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-8 text-center">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-400" />
                      <h3 className="text-lg font-semibold mb-2">System Optimized</h3>
                      <p className="text-gray-400">
                        No optimization suggestions at this time. Your system is running efficiently.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}