'use client';

/**
 * Charts Section - Seção de Gráficos do Dashboard
 * 
 * Gráficos interativos com Recharts mostrando estatísticas diárias,
 * breakdown de renderizações, uso de TTS e distribuição de eventos.
 */

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  type DailyStats,
  type RenderStats,
  type TTSStats,
  type EventTypeBreakdown,
} from '@/lib/analytics/queries';

// ==========================================
// TIPOS
// ==========================================

interface ChartsSectionProps {
  dailyStats: DailyStats[];
  renderStats: RenderStats;
  ttsStats: TTSStats;
  eventBreakdown: EventTypeBreakdown[];
  loading?: boolean;
}

// ==========================================
// CORES
// ==========================================

const COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  pink: '#EC4899',
  indigo: '#6366F1',
  teal: '#14B8A6',
};

const PIE_COLORS = [
  COLORS.primary,
  COLORS.success,
  COLORS.warning,
  COLORS.purple,
  COLORS.pink,
  COLORS.indigo,
  COLORS.teal,
  COLORS.danger,
];

// ==========================================
// CUSTOM TOOLTIP
// ==========================================

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg">
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
          {label}
        </p>
        {payload.map((entry: any, index: number) => (
          <p
            key={index}
            className="text-sm text-gray-600 dark:text-gray-400"
            style={{ color: entry.color }}
          >
            {entry.name}: <span className="font-semibold">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export default function ChartsSection({
  dailyStats,
  renderStats,
  ttsStats,
  eventBreakdown,
  loading,
}: ChartsSectionProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse"
          >
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  // Preparar dados para gráfico de linha
  const lineChartData = dailyStats.map((stat) => ({
    date: new Date(stat.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    Uploads: stat.uploads,
    Renders: stat.renders,
    TTS: stat.ttsGenerations,
  }));

  // Preparar dados para gráfico de status de renders
  const renderStatusData = [
    { name: 'Completos', value: renderStats.completed, color: COLORS.success },
    { name: 'Falhos', value: renderStats.failed, color: COLORS.danger },
    { name: 'Processando', value: renderStats.processing, color: COLORS.primary },
  ].filter((item) => item.value > 0);

  // Preparar dados para gráfico de providers TTS
  const ttsProvidersData = ttsStats.providerBreakdown.map((provider: any) => ({
    name: provider.provider,
    Gerações: provider.count,
    Créditos: provider.credits,
  }));

  // Preparar dados para gráfico de eventos
  const eventsData = eventBreakdown.map((event, index) => ({
    name: event.eventType.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
    value: event.count,
    percentage: event.percentage,
  }));

  return (
    <div className="space-y-6 mb-8">
      {/* Gráfico de Linha - Atividades Diárias */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Atividades Diárias
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={lineChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="date"
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="Uploads"
              stroke={COLORS.primary}
              strokeWidth={2}
              dot={{ fill: COLORS.primary, r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="Renders"
              stroke={COLORS.success}
              strokeWidth={2}
              dot={{ fill: COLORS.success, r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="TTS"
              stroke={COLORS.warning}
              strokeWidth={2}
              dot={{ fill: COLORS.warning, r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Pizza - Status de Renders */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Status de Renderizações
          </h3>
          {renderStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={renderStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props) => {
                    const { name, value, percent } = props as unknown as { name: string; value: number; percent: number };
                    return `${name}: ${value} (${(percent * 100).toFixed(0)}%)`;
                  }}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {renderStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-300 flex items-center justify-center text-gray-500 dark:text-gray-400">
              Sem dados de renderização
            </div>
          )}
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <span className="text-gray-600 dark:text-gray-400">Duração Média:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {Math.floor(renderStats.avgDuration / 60)}m {renderStats.avgDuration % 60}s
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <span className="text-gray-600 dark:text-gray-400">Tamanho Total:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {(renderStats.totalSize / 1024).toFixed(2)} GB
              </span>
            </div>
          </div>
        </div>

        {/* Gráfico de Barras - Providers TTS */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Uso de Providers TTS
          </h3>
          {ttsProvidersData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ttsProvidersData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="name"
                  stroke="#6B7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="Gerações" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Créditos" fill={COLORS.success} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-300 flex items-center justify-center text-gray-500 dark:text-gray-400">
              Sem dados de TTS
            </div>
          )}
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <span className="text-gray-600 dark:text-gray-400">Total de Caracteres:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {ttsStats.totalCharacters.toLocaleString('pt-BR')}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <span className="text-gray-600 dark:text-gray-400">Cache Hit Rate:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {ttsStats.cacheHitRate}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de Pizza - Distribuição de Eventos */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Distribuição de Eventos
        </h3>
        {eventsData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={eventsData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {eventsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-300 flex items-center justify-center text-gray-500 dark:text-gray-400">
            Sem dados de eventos
          </div>
        )}
      </div>
    </div>
  );
}
