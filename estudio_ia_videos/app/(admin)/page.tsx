'use client';

import { useEffect, useState } from 'react';
import { 
  Server, 
  Database, 
  Key, 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Activity,
  Cpu,
  HardDrive,
  Clock
} from 'lucide-react';
import Link from 'next/link';

interface SystemStatus {
  database: 'healthy' | 'degraded' | 'unhealthy';
  redis: 'healthy' | 'degraded' | 'unhealthy' | 'not_configured';
  api: 'healthy' | 'degraded' | 'unhealthy';
  storage: 'healthy' | 'degraded' | 'unhealthy';
}

interface DashboardStats {
  totalUsers: number;
  totalProjects: number;
  apiCalls24h: number;
  storageUsed: string;
  uptime: string;
}

export default function AdminDashboardPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statusRes, statsRes] = await Promise.all([
        fetch('/api/admin/system/status'),
        fetch('/api/admin/system/stats')
      ]);

      if (statusRes.ok) {
        setStatus(await statusRes.json());
      }
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'unhealthy':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500/10 border-green-500/20 text-green-400';
      case 'degraded':
        return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400';
      case 'unhealthy':
        return 'bg-red-500/10 border-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/10 border-gray-500/20 text-gray-400';
    }
  };

  const quickActions = [
    { href: '/admin/credentials', icon: Key, label: 'Gerenciar APIs', color: 'bg-blue-600' },
    { href: '/admin/environment', icon: Server, label: 'Variáveis de Ambiente', color: 'bg-purple-600' },
    { href: '/admin/users', icon: Users, label: 'Gerenciar Usuários', color: 'bg-green-600' },
    { href: '/admin/database', icon: Database, label: 'Banco de Dados', color: 'bg-orange-600' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400">Visão geral do sistema e status dos serviços</p>
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`rounded-xl border p-4 ${getStatusColor(status?.database || 'unhealthy')}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Database className="w-8 h-8" />
              <div>
                <p className="font-medium">Database</p>
                <p className="text-sm opacity-75 capitalize">{status?.database || 'Verificando...'}</p>
              </div>
            </div>
            {getStatusIcon(status?.database || 'unhealthy')}
          </div>
        </div>

        <div className={`rounded-xl border p-4 ${getStatusColor(status?.redis || 'not_configured')}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Server className="w-8 h-8" />
              <div>
                <p className="font-medium">Redis</p>
                <p className="text-sm opacity-75 capitalize">{status?.redis || 'Verificando...'}</p>
              </div>
            </div>
            {getStatusIcon(status?.redis || 'not_configured')}
          </div>
        </div>

        <div className={`rounded-xl border p-4 ${getStatusColor(status?.api || 'unhealthy')}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Activity className="w-8 h-8" />
              <div>
                <p className="font-medium">API</p>
                <p className="text-sm opacity-75 capitalize">{status?.api || 'Verificando...'}</p>
              </div>
            </div>
            {getStatusIcon(status?.api || 'unhealthy')}
          </div>
        </div>

        <div className={`rounded-xl border p-4 ${getStatusColor(status?.storage || 'unhealthy')}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <HardDrive className="w-8 h-8" />
              <div>
                <p className="font-medium">Storage</p>
                <p className="text-sm opacity-75 capitalize">{status?.storage || 'Verificando...'}</p>
              </div>
            </div>
            {getStatusIcon(status?.storage || 'unhealthy')}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Usuários Totais</p>
              <p className="text-3xl font-bold text-white mt-1">{stats?.totalUsers || 0}</p>
            </div>
            <Users className="w-10 h-10 text-blue-500 opacity-50" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Projetos</p>
              <p className="text-3xl font-bold text-white mt-1">{stats?.totalProjects || 0}</p>
            </div>
            <Cpu className="w-10 h-10 text-purple-500 opacity-50" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Chamadas API (24h)</p>
              <p className="text-3xl font-bold text-white mt-1">{stats?.apiCalls24h || 0}</p>
            </div>
            <Activity className="w-10 h-10 text-green-500 opacity-50" />
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Uptime</p>
              <p className="text-3xl font-bold text-white mt-1">{stats?.uptime || '---'}</p>
            </div>
            <Clock className="w-10 h-10 text-orange-500 opacity-50" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="bg-gray-800 hover:bg-gray-750 rounded-xl border border-gray-700 p-6 transition-all hover:border-gray-600 group"
              >
                <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <p className="font-medium text-white">{action.label}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Alerts Section */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Alertas do Sistema</h2>
        <div className="space-y-3">
          {status?.redis === 'not_configured' && (
            <div className="flex items-center space-x-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
              <p className="text-yellow-400 text-sm">
                Redis não está configurado. Configure em{' '}
                <Link href="/admin/credentials" className="underline">Credenciais & APIs</Link>
              </p>
            </div>
          )}
          {status?.database === 'unhealthy' && (
            <div className="flex items-center space-x-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-400 text-sm">
                Banco de dados com problemas. Verifique as credenciais do Supabase.
              </p>
            </div>
          )}
          {status?.database === 'healthy' && status?.api === 'healthy' && (
            <div className="flex items-center space-x-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <p className="text-green-400 text-sm">
                Todos os sistemas estão operando normalmente.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
