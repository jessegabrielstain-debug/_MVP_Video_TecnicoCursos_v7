'use client';

/**
 * Analytics Dashboard - Dashboard de Métricas e Estatísticas
 * 
 * Dashboard completo com métricas em tempo real, gráficos interativos
 * e filtros de data.
 */

import { useEffect, useState } from 'react';
import { logger } from '@/lib/logger';
import { useAuth } from '@/lib/auth/hooks';
import {
  getOverallMetrics,
  getDailyStats,
  getProjectStats,
  getRenderStats,
  getTTSStats,
  getEventTypeBreakdown,
  getTrends,
  type AnalyticsMetrics,
  type DailyStats,
  type ProjectStats,
  type RenderStats,
  type TTSStats,
  type EventTypeBreakdown,
} from '@/lib/analytics/queries';
import { subDays } from 'date-fns';
import MetricsCards from './metrics-cards';
import ChartsSection from './charts-section';
import ProjectsTable from './projects-table';
import DateRangeFilter from './date-range-filter';

// ==========================================
// TIPOS
// ==========================================

interface DashboardData {
  metrics: AnalyticsMetrics;
  dailyStats: DailyStats[];
  projectStats: ProjectStats[];
  renderStats: RenderStats;
  ttsStats: TTSStats;
  eventBreakdown: EventTypeBreakdown[];
  trends: {
    uploads: { current: number; previous: number; trend: number };
    renders: { current: number; previous: number; trend: number };
    tts: { current: number; previous: number; trend: number };
  };
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export default function AnalyticsDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  
  // Estado de filtros
  const [dateRange, setDateRange] = useState({
    startDate: subDays(new Date(), 30),
    endDate: new Date(),
  });
  const [days, setDays] = useState(30);

  // ==========================================
  // CARREGAR DADOS
  // ==========================================

  const loadDashboardData = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      // Executar todas as queries em paralelo
      const [
        metrics,
        dailyStats,
        projectStats,
        renderStats,
        ttsStats,
        eventBreakdown,
        trends,
      ] = await Promise.all([
        getOverallMetrics(user.id, dateRange),
        getDailyStats(user.id, days),
        getProjectStats(user.id, 10),
        getRenderStats(user.id, dateRange),
        getTTSStats(user.id, dateRange),
        getEventTypeBreakdown(user.id, dateRange),
        getTrends(user.id, 7),
      ]);

      setData({
        metrics,
        dailyStats,
        projectStats,
        renderStats,
        ttsStats,
        eventBreakdown,
        trends,
      });
    } catch (err) {
      logger.error('Error loading dashboard data', err instanceof Error ? err : new Error(String(err)), { component: 'AnalyticsDashboard' });
      setError(err instanceof Error ? err.message : 'Erro ao carregar dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user?.id, dateRange, days]);

  // ==========================================
  // HANDLERS
  // ==========================================

  const handleDateRangeChange = (start: Date, end: Date) => {
    setDateRange({ startDate: start, endDate: end });
  };

  const handleDaysChange = (newDays: number) => {
    setDays(newDays);
    setDateRange({
      startDate: subDays(new Date(), newDays),
      endDate: new Date(),
    });
  };

  const handleRefresh = () => {
    loadDashboardData();
  };

  // ==========================================
  // ESTADOS DE LOADING/ERROR
  // ==========================================

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Faça login para visualizar o dashboard
          </p>
        </div>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Carregando dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg
              className="h-12 w-12 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-gray-800 dark:text-gray-200 font-semibold mb-2">
            Erro ao carregar dashboard
          </p>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Dashboard de Analytics
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Métricas e estatísticas de uso do sistema
              </p>
            </div>

            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <svg
                className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>Atualizar</span>
            </button>
          </div>

          {/* Date Range Filter */}
          <div className="mt-4">
            <DateRangeFilter
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              days={days}
              onDateRangeChange={handleDateRangeChange}
              onDaysChange={handleDaysChange}
            />
          </div>
        </div>

        {/* Metrics Cards */}
        <MetricsCards
          metrics={data.metrics}
          trends={data.trends}
          loading={loading}
        />

        {/* Charts Section */}
        <ChartsSection
          dailyStats={data.dailyStats}
          renderStats={data.renderStats}
          ttsStats={data.ttsStats}
          eventBreakdown={data.eventBreakdown}
          loading={loading}
        />

        {/* Projects Table */}
        <ProjectsTable
          projects={data.projectStats}
          loading={loading}
        />

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          Última atualização: {new Date().toLocaleString('pt-BR')}
        </div>
      </div>
    </div>
  );
}
