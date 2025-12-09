/**
 * 📊 ANALYTICS DASHBOARD - Dashboard de Métricas e Analytics
 * 
 * Dashboard completo para visualização de métricas do sistema.
 * Mostra estatísticas de uso, performance, usuários e renderizações.
 * 
 * Features:
 * - Métricas em tempo real
 * - Gráficos interativos
 * - Filtros por período
 * - Export de dados
 * - Alertas e notificações
 * - Comparação de períodos
 * 
 * @version 1.0.0
 */

'use client'

import React, { useState, useEffect } from 'react'
import { logger } from '@/lib/logger'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import {
  Activity,
  Users,
  Video,
  TrendingUp,
  TrendingDown,
  Clock,
  HardDrive,
  Zap,
  AlertCircle,
  Download,
  Filter,
  Calendar,
  RefreshCw,
} from 'lucide-react'

// ============================================================================
// TIPOS
// ============================================================================

interface DashboardMetrics {
  overview: {
    totalUsers: number
    activeUsers: number
    totalProjects: number
    totalRenders: number
    storageUsed: number
    storageLimit: number
  }
  trends: {
    usersChange: number
    projectsChange: number
    rendersChange: number
    storageChange: number
  }
  renders: {
    total: number
    completed: number
    failed: number
    inProgress: number
    avgDuration: number
    successRate: number
  }
  performance: {
    avgResponseTime: number
    uptime: number
    errorRate: number
    cacheHitRate: number
  }
  usage: {
    dailyActiveUsers: Array<{ date: string; count: number }>
    rendersByDay: Array<{ date: string; count: number; failed: number }>
    storageByUser: Array<{ userId: string; name: string; usage: number }>
    popularTemplates: Array<{ id: string; name: string; uses: number }>
  }
}

type TimeRange = '7d' | '30d' | '90d' | 'all'

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

const MetricCard: React.FC<{
  title: string
  value: string | number
  change?: number
  icon: React.ReactNode
  color: string
}> = ({ title, value, change, icon, color }) => (
  <div className="bg-white rounded-lg shadow p-6 border-l-4" style={{ borderColor: color }}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {change !== undefined && (
          <div className="flex items-center mt-2">
            {change >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
            )}
            <span className={change >= 0 ? 'text-green-500' : 'text-red-500'}>
              {Math.abs(change)}%
            </span>
            <span className="text-gray-500 text-sm ml-1">vs período anterior</span>
          </div>
        )}
      </div>
      <div className="p-4 rounded-full" style={{ backgroundColor: `${color}20` }}>
        {icon}
      </div>
    </div>
  </div>
)

const StatCard: React.FC<{
  label: string
  value: string | number
  sublabel?: string
}> = ({ label, value, sublabel }) => (
  <div className="bg-gray-50 rounded-lg p-4">
    <p className="text-sm text-gray-600 mb-1">{label}</p>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    {sublabel && <p className="text-xs text-gray-500 mt-1">{sublabel}</p>}
  </div>
)

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<TimeRange>('7d')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  // ============================================================================
  // CARREGAR DADOS
  // ============================================================================

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics/dashboard?range=${timeRange}`)
      const data = await response.json()
      setMetrics(data)
      setLastUpdate(new Date())
    } catch (error) {
      logger.error('Erro ao carregar métricas', error instanceof Error ? error : new Error(String(error)), { component: 'AnalyticsDashboard' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
  }, [timeRange])

  // Auto-refresh a cada 30 segundos
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchMetrics()
    }, 30000)

    return () => clearInterval(interval)
  }, [autoRefresh, timeRange])

  // ============================================================================
  // EXPORT DE DADOS
  // ============================================================================

  const handleExport = async (format: 'csv' | 'json' | 'pdf') => {
    try {
      const response = await fetch(`/api/analytics/export?format=${format}&range=${timeRange}`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `analytics-${timeRange}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      logger.error('Erro ao exportar', error instanceof Error ? error : new Error(String(error)), { component: 'AnalyticsDashboard', format })
    }
  }

  // ============================================================================
  // CORES
  // ============================================================================

  const COLORS = {
    primary: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    purple: '#8b5cf6',
    pink: '#ec4899',
  }

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (loading && !metrics) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando métricas...</p>
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Erro ao carregar métricas</p>
        </div>
      </div>
    )
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Última atualização: {lastUpdate.toLocaleTimeString()}
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Auto-refresh toggle */}
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  autoRefresh ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                Auto-refresh
              </button>

              {/* Time range selector */}
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                className="px-4 py-2 border rounded-lg"
              >
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
                <option value="90d">Últimos 90 dias</option>
                <option value="all">Todos os períodos</option>
              </select>

              {/* Export menu */}
              <div className="relative group">
                <button className="px-4 py-2 bg-gray-800 text-white rounded-lg flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Exportar
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <button
                    onClick={() => handleExport('csv')}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    Exportar CSV
                  </button>
                  <button
                    onClick={() => handleExport('json')}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    Exportar JSON
                  </button>
                  <button
                    onClick={() => handleExport('pdf')}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    Exportar PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total de Usuários"
            value={metrics.overview.totalUsers.toLocaleString()}
            change={metrics.trends.usersChange}
            icon={<Users className="w-8 h-8" style={{ color: COLORS.primary }} />}
            color={COLORS.primary}
          />
          <MetricCard
            title="Projetos Criados"
            value={metrics.overview.totalProjects.toLocaleString()}
            change={metrics.trends.projectsChange}
            icon={<Video className="w-8 h-8" style={{ color: COLORS.success }} />}
            color={COLORS.success}
          />
          <MetricCard
            title="Renderizações"
            value={metrics.overview.totalRenders.toLocaleString()}
            change={metrics.trends.rendersChange}
            icon={<Zap className="w-8 h-8" style={{ color: COLORS.warning }} />}
            color={COLORS.warning}
          />
          <MetricCard
            title="Armazenamento"
            value={`${(metrics.overview.storageUsed / 1024 / 1024 / 1024).toFixed(1)} GB`}
            change={metrics.trends.storageChange}
            icon={<HardDrive className="w-8 h-8" style={{ color: COLORS.purple }} />}
            color={COLORS.purple}
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Daily Active Users */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Usuários Ativos Diários</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={metrics.usage.dailyActiveUsers}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke={COLORS.primary}
                  fill={COLORS.primary}
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Renders by Day */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Renderizações por Dia</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.usage.rendersByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill={COLORS.success} name="Sucesso" />
                <Bar dataKey="failed" fill={COLORS.danger} name="Falhas" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-4">Renderizações</h3>
            <div className="space-y-3">
              <StatCard
                label="Taxa de Sucesso"
                value={`${metrics.renders.successRate.toFixed(1)}%`}
              />
              <StatCard
                label="Tempo Médio"
                value={`${metrics.renders.avgDuration.toFixed(0)}s`}
              />
              <StatCard
                label="Em Progresso"
                value={metrics.renders.inProgress}
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-4">Performance</h3>
            <div className="space-y-3">
              <StatCard
                label="Tempo de Resposta"
                value={`${metrics.performance.avgResponseTime.toFixed(0)}ms`}
              />
              <StatCard
                label="Uptime"
                value={`${metrics.performance.uptime.toFixed(2)}%`}
              />
              <StatCard
                label="Cache Hit Rate"
                value={`${metrics.performance.cacheHitRate.toFixed(1)}%`}
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
            <h3 className="text-sm font-semibold text-gray-600 mb-4">Templates Populares</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={metrics.usage.popularTemplates.slice(0, 5)}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="uses" fill={COLORS.purple} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Storage by User */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Top 10 Usuários por Armazenamento</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Uso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    % do Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Progresso
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {metrics.usage.storageByUser.slice(0, 10).map((user) => {
                  const percentage = (user.usage / metrics.overview.storageUsed) * 100
                  return (
                    <tr key={user.userId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(user.usage / 1024 / 1024 / 1024).toFixed(2)} GB
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {percentage.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
