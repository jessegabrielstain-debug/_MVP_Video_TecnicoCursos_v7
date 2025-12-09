/**
 * System Health Dashboard Component
 * 
 * Exibe status completo do sistema em tempo real:
 * - Health checks de todos os serviços
 * - Métricas de performance (CPU, memória, requests)
 * - Alertas ativos
 * - Estatísticas de cache
 * - Uptime e disponibilidade
 * 
 * @component SystemHealthDashboard
 */

'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Cpu,
  HardDrive,
  TrendingUp,
  Clock,
  Zap,
  Database,
  Server,
  Bell
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface HealthCheck {
  status: 'up' | 'down' | 'degraded';
  responseTime: number;
  message?: string;
  lastCheck: Date;
}

interface SystemMetrics {
  cpu: {
    usage: number;
    load: number[];
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  requests: {
    total: number;
    perMinute: number;
    avgResponseTime: number;
    errorRate: number;
  };
  database: {
    connections: number;
    activeQueries: number;
    slowQueries: number;
  };
  cache: {
    hitRate: number;
    missRate: number;
    evictions: number;
  };
}

interface Alert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: string;
  resolved: boolean;
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    database: HealthCheck;
    redis: HealthCheck;
    s3: HealthCheck;
    workers: HealthCheck;
    api: HealthCheck;
  };
  metrics: SystemMetrics;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function SystemHealthDashboard() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(10); // segundos

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchHealthStatus = async () => {
    try {
      const response = await fetch('/api/health?type=detailed');
      const data = await response.json();
      setHealthStatus(data);
    } catch (error) {
      logger.error('Failed to fetch health status', error instanceof Error ? error : new Error(String(error)), { component: 'SystemHealthDashboard' });
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/health?type=alerts');
      const data = await response.json();
      setAlerts(data.active || []);
    } catch (error) {
      logger.error('Failed to fetch alerts', error instanceof Error ? error : new Error(String(error)), { component: 'SystemHealthDashboard' });
    }
  };

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchHealthStatus(), fetchAlerts()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchData, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // ============================================================================
  // HELPERS
  // ============================================================================

  const formatUptime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'up':
        return 'text-green-600 bg-green-100';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100';
      case 'unhealthy':
      case 'down':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-100 border-red-300';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100 border-yellow-300';
      case 'info':
        return 'text-blue-600 bg-blue-100 border-blue-300';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'up':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'degraded':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'unhealthy':
      case 'down':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading && !healthStatus) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Activity className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando status do sistema...</p>
        </div>
      </div>
    );
  }

  if (!healthStatus) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">
            Falha ao carregar status do sistema
          </h3>
          <p className="text-red-700">Não foi possível conectar ao servidor de monitoramento.</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Activity className="w-8 h-8 text-blue-600" />
              System Health Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Monitoramento em tempo real dos serviços e métricas do sistema
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Auto-refresh toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm text-gray-700">Auto-refresh</span>
            </label>

            {/* Refresh interval */}
            {autoRefresh && (
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value={5}>5s</option>
                <option value={10}>10s</option>
                <option value={30}>30s</option>
                <option value={60}>60s</option>
              </select>
            )}

            {/* Manual refresh */}
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Activity className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>
        </div>
      </div>

      {/* Overall Status Card */}
      <div className={`mb-8 rounded-xl border-2 p-6 ${
        healthStatus.status === 'healthy' 
          ? 'bg-green-50 border-green-300' 
          : healthStatus.status === 'degraded'
          ? 'bg-yellow-50 border-yellow-300'
          : 'bg-red-50 border-red-300'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {getStatusIcon(healthStatus.status)}
            <div>
              <h2 className="text-2xl font-bold capitalize">
                {healthStatus.status === 'healthy' ? 'Sistema Operacional' :
                 healthStatus.status === 'degraded' ? 'Sistema com Degradação' :
                 'Sistema Inoperante'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Última verificação: {new Date(healthStatus.timestamp).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Clock className="w-5 h-5" />
            Uptime: {formatUptime(healthStatus.uptime)}
          </div>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="mb-8 bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold">Alertas Ativos ({alerts.length})</h3>
          </div>
          
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border-2 ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold uppercase">
                        {alert.severity}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(alert.timestamp).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <p className="font-medium">{alert.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Service Health Checks */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {Object.entries(healthStatus.checks).map(([service, check]) => (
          <div key={service} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {service === 'database' && <Database className="w-6 h-6 text-blue-600" />}
                {service === 'redis' && <Server className="w-6 h-6 text-red-600" />}
                {service === 's3' && <HardDrive className="w-6 h-6 text-orange-600" />}
                {service === 'workers' && <Cpu className="w-6 h-6 text-purple-600" />}
                {service === 'api' && <Zap className="w-6 h-6 text-green-600" />}
                
                <h3 className="font-semibold text-lg capitalize">{service}</h3>
              </div>
              
              {getStatusIcon(check.status)}
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`font-semibold px-2 py-1 rounded ${getStatusColor(check.status)}`}>
                  {check.status.toUpperCase()}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Resposta:</span>
                <span className="font-mono">{check.responseTime.toFixed(0)}ms</span>
              </div>
              
              {check.message && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                  {check.message}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CPU & Memory */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-600" />
            CPU & Memória
          </h3>
          
          <div className="space-y-4">
            {/* CPU */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">CPU Usage</span>
                <span className="text-sm font-semibold">
                  {healthStatus.metrics.cpu.usage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    healthStatus.metrics.cpu.usage > 90 ? 'bg-red-600' :
                    healthStatus.metrics.cpu.usage > 70 ? 'bg-yellow-600' :
                    'bg-green-600'
                  }`}
                  style={{ width: `${Math.min(healthStatus.metrics.cpu.usage, 100)}%` }}
                />
              </div>
            </div>

            {/* Memory */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Memory Usage</span>
                <span className="text-sm font-semibold">
                  {formatBytes(healthStatus.metrics.memory.used)} / {formatBytes(healthStatus.metrics.memory.total)}
                  {' '}({healthStatus.metrics.memory.percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    healthStatus.metrics.memory.percentage > 90 ? 'bg-red-600' :
                    healthStatus.metrics.memory.percentage > 70 ? 'bg-yellow-600' :
                    'bg-blue-600'
                  }`}
                  style={{ width: `${Math.min(healthStatus.metrics.memory.percentage, 100)}%` }}
                />
              </div>
            </div>

            {/* Load Average */}
            <div className="grid grid-cols-3 gap-4 pt-2">
              {healthStatus.metrics.cpu.load.map((load, i) => (
                <div key={i} className="text-center p-3 bg-gray-50 rounded">
                  <div className="text-xs text-gray-600 mb-1">
                    {i === 0 ? '1 min' : i === 1 ? '5 min' : '15 min'}
                  </div>
                  <div className="text-lg font-semibold">{load.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Requests */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Requests
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Total</div>
              <div className="text-2xl font-bold text-blue-600">
                {healthStatus.metrics.requests.total.toLocaleString()}
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Por Minuto</div>
              <div className="text-2xl font-bold text-green-600">
                {healthStatus.metrics.requests.perMinute}
              </div>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Avg Response</div>
              <div className="text-2xl font-bold text-purple-600">
                {healthStatus.metrics.requests.avgResponseTime.toFixed(0)}ms
              </div>
            </div>

            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Error Rate</div>
              <div className={`text-2xl font-bold ${
                healthStatus.metrics.requests.errorRate > 10 ? 'text-red-600' :
                healthStatus.metrics.requests.errorRate > 5 ? 'text-yellow-600' :
                'text-green-600'
              }`}>
                {healthStatus.metrics.requests.errorRate.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Database */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            Database
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between p-3 bg-gray-50 rounded">
              <span className="text-gray-600">Conexões</span>
              <span className="font-semibold">{healthStatus.metrics.database.connections}</span>
            </div>

            <div className="flex justify-between p-3 bg-gray-50 rounded">
              <span className="text-gray-600">Queries Ativas</span>
              <span className="font-semibold">{healthStatus.metrics.database.activeQueries}</span>
            </div>

            <div className="flex justify-between p-3 bg-gray-50 rounded">
              <span className="text-gray-600">Slow Queries</span>
              <span className={`font-semibold ${
                healthStatus.metrics.database.slowQueries > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {healthStatus.metrics.database.slowQueries}
              </span>
            </div>
          </div>
        </div>

        {/* Cache */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-600" />
            Cache Performance
          </h3>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Hit Rate</span>
                <span className="text-sm font-semibold text-green-600">
                  {healthStatus.metrics.cache.hitRate.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="h-3 rounded-full bg-green-600 transition-all"
                  style={{ width: `${Math.min(healthStatus.metrics.cache.hitRate, 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Miss Rate</span>
                <span className="text-sm font-semibold text-red-600">
                  {healthStatus.metrics.cache.missRate.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="h-3 rounded-full bg-red-600 transition-all"
                  style={{ width: `${Math.min(healthStatus.metrics.cache.missRate, 100)}%` }}
                />
              </div>
            </div>

            <div className="flex justify-between p-3 bg-gray-50 rounded">
              <span className="text-gray-600">Evictions</span>
              <span className="font-semibold">{healthStatus.metrics.cache.evictions}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
