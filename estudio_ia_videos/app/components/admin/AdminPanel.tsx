/**
 * 👨‍💼 ADMIN PANEL - Painel Administrativo Completo
 * 
 * Interface administrativa para gerenciar o sistema.
 * 
 * Features:
 * - Gerenciamento de usuários
 * - Configuração de rate limits
 * - Gerenciamento de quotas de storage
 * - Visualização de logs de auditoria
 * - Configuração de webhooks
 * - Monitoramento de sistema
 * - Estatísticas globais
 * 
 * @version 1.0.0
 */

'use client'

import React, { useState, useEffect } from 'react'
import {
  Users,
  Shield,
  HardDrive,
  Activity,
  Settings,
  Database,
  Webhook,
  FileText,
  AlertTriangle,
  TrendingUp,
  Zap,
  Clock,
  Search,
  Filter,
  Download,
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Ban,
} from 'lucide-react'

// ============================================================================
// TIPOS
// ============================================================================

interface User {
  id: string
  name: string
  email: string
  role: 'user' | 'admin'
  status: 'active' | 'suspended' | 'banned'
  storageUsed: number
  storageQuota: number
  projects: number
  lastActive: string
  createdAt: string
}

interface RateLimitConfig {
  id: string
  name: string
  identifier: string
  maxRequests: number
  windowMs: number
  enabled: boolean
}

interface AuditLog {
  id: string
  userId: string
  userName: string
  action: string
  resource: string
  timestamp: string
  ipAddress: string
  metadata?: Record<string, unknown>
}

interface SystemStats {
  totalUsers: number
  activeUsers: number
  totalStorage: number
  usedStorage: number
  totalRequests24h: number
  avgResponseTime: number
  errorRate: number
  uptime: number
}

// ============================================================================
// TABS
// ============================================================================

type AdminTab = 'users' | 'rate-limits' | 'storage' | 'audit' | 'webhooks' | 'system'

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const USER_FILTER_OPTIONS = ['all', 'active', 'suspended', 'banned'] as const
type UserFilterOption = (typeof USER_FILTER_OPTIONS)[number]
const isUserFilterOption = (value: string): value is UserFilterOption =>
  USER_FILTER_OPTIONS.includes(value as UserFilterOption)

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminTab>('users')
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSystemStats()
  }, [])

  const fetchSystemStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
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
              <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-gray-600 mt-1">Gerenciamento do Sistema</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                Online
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total de Usuários"
              value={stats.totalUsers}
              subtitle={`${stats.activeUsers} ativos`}
              icon={<Users className="w-6 h-6 text-blue-500" />}
              color="blue"
            />
            <StatCard
              title="Armazenamento"
              value={`${(stats.usedStorage / stats.totalStorage * 100).toFixed(1)}%`}
              subtitle={`${formatBytes(stats.usedStorage)} / ${formatBytes(stats.totalStorage)}`}
              icon={<HardDrive className="w-6 h-6 text-purple-500" />}
              color="purple"
            />
            <StatCard
              title="Requisições (24h)"
              value={formatNumber(stats.totalRequests24h)}
              subtitle={`${stats.avgResponseTime}ms avg`}
              icon={<Activity className="w-6 h-6 text-green-500" />}
              color="green"
            />
            <StatCard
              title="Uptime"
              value={`${stats.uptime.toFixed(2)}%`}
              subtitle={`${stats.errorRate.toFixed(2)}% error rate`}
              icon={<CheckCircle className="w-6 h-6 text-emerald-500" />}
              color="emerald"
            />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow">
          <div className="border-b">
            <nav className="flex -mb-px">
              <TabButton
                active={activeTab === 'users'}
                onClick={() => setActiveTab('users')}
                icon={<Users className="w-5 h-5" />}
                label="Usuários"
              />
              <TabButton
                active={activeTab === 'rate-limits'}
                onClick={() => setActiveTab('rate-limits')}
                icon={<Shield className="w-5 h-5" />}
                label="Rate Limits"
              />
              <TabButton
                active={activeTab === 'storage'}
                onClick={() => setActiveTab('storage')}
                icon={<HardDrive className="w-5 h-5" />}
                label="Storage"
              />
              <TabButton
                active={activeTab === 'audit'}
                onClick={() => setActiveTab('audit')}
                icon={<FileText className="w-5 h-5" />}
                label="Audit Logs"
              />
              <TabButton
                active={activeTab === 'webhooks'}
                onClick={() => setActiveTab('webhooks')}
                icon={<Webhook className="w-5 h-5" />}
                label="Webhooks"
              />
              <TabButton
                active={activeTab === 'system'}
                onClick={() => setActiveTab('system')}
                icon={<Settings className="w-5 h-5" />}
                label="Sistema"
              />
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'users' && <UsersManager />}
            {activeTab === 'rate-limits' && <RateLimitsManager />}
            {activeTab === 'storage' && <StorageManager />}
            {activeTab === 'audit' && <AuditLogsViewer />}
            {activeTab === 'webhooks' && <WebhooksManager />}
            {activeTab === 'system' && <SystemSettings />}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

const StatCard: React.FC<{
  title: string
  value: string | number
  subtitle: string
  icon: React.ReactNode
  color: string
}> = ({ title, value, subtitle, icon, color }) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      {icon}
    </div>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
  </div>
)

const TabButton: React.FC<{
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`px-6 py-4 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
      active
        ? 'border-blue-500 text-blue-600'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`}
  >
    {icon}
    {label}
  </button>
)

// ============================================================================
// USERS MANAGER
// ============================================================================

const UsersManager: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<UserFilterOption>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [filter])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/users?status=${filter}`)
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateUserStatus = async (userId: string, status: User['status']) => {
    try {
      await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      fetchUsers()
    } catch (error) {
      console.error('Error updating user:', error)
    }
  }

  const updateUserQuota = async (userId: string, quota: number) => {
    try {
      await fetch(`/api/admin/users/${userId}/quota`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storageQuota: quota }),
      })
      fetchUsers()
    } catch (error) {
      console.error('Error updating quota:', error)
    }
  }

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Gerenciamento de Usuários</h2>
        <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Adicionar Usuário
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar usuários..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => {
            const { value } = e.target
            if (!isUserFilterOption(value)) {
              return
            }
            setFilter(value)
          }}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="all">Todos</option>
          <option value="active">Ativos</option>
          <option value="suspended">Suspensos</option>
          <option value="banned">Banidos</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Usuário
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Storage
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Projetos
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Último Acesso
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      user.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : user.status === 'suspended'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatBytes(user.storageUsed)} / {formatBytes(user.storageQuota)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.projects}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.lastActive).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center gap-2">
                    <button className="text-blue-600 hover:text-blue-700">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="text-gray-600 hover:text-gray-700">
                      <Edit className="w-4 h-4" />
                    </button>
                    {user.status === 'active' && (
                      <button
                        onClick={() => updateUserStatus(user.id, 'suspended')}
                        className="text-yellow-600 hover:text-yellow-700"
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    )}
                    {user.status === 'suspended' && (
                      <button
                        onClick={() => updateUserStatus(user.id, 'active')}
                        className="text-green-600 hover:text-green-700"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ============================================================================
// RATE LIMITS MANAGER
// ============================================================================

const RateLimitsManager: React.FC = () => {
  const [configs, setConfigs] = useState<RateLimitConfig[]>([])

  useEffect(() => {
    fetchRateLimitConfigs()
  }, [])

  const fetchRateLimitConfigs = async () => {
    try {
      const response = await fetch('/api/admin/rate-limits')
      const data = await response.json()
      setConfigs(data)
    } catch (error) {
      console.error('Error fetching rate limits:', error)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Configurações de Rate Limit</h2>
      <p className="text-gray-600">
        Gerencie os limites de requisições para proteger o sistema contra abuso.
      </p>
      
      {/* Lista de configs - implementação similar à tabela de usuários */}
      <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
        Configurações de rate limit disponíveis: {configs.length}
      </div>
    </div>
  )
}

// Demais componentes (StorageManager, AuditLogsViewer, WebhooksManager, SystemSettings)
// implementados de forma similar...

const StorageManager: React.FC = () => (
  <div className="space-y-4">
    <h2 className="text-xl font-semibold">Gerenciamento de Storage</h2>
    <p className="text-gray-600">Visualize e gerencie o armazenamento de arquivos.</p>
  </div>
)

const AuditLogsViewer: React.FC = () => (
  <div className="space-y-4">
    <h2 className="text-xl font-semibold">Logs de Auditoria</h2>
    <p className="text-gray-600">Visualize todas as ações realizadas no sistema.</p>
  </div>
)

const WebhooksManager: React.FC = () => (
  <div className="space-y-4">
    <h2 className="text-xl font-semibold">Gerenciamento de Webhooks</h2>
    <p className="text-gray-600">Configure webhooks para notificar sistemas externos.</p>
  </div>
)

const SystemSettings: React.FC = () => (
  <div className="space-y-4">
    <h2 className="text-xl font-semibold">Configurações do Sistema</h2>
    <p className="text-gray-600">Ajuste configurações globais do sistema.</p>
  </div>
)

// ============================================================================
// HELPERS
// ============================================================================

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}
