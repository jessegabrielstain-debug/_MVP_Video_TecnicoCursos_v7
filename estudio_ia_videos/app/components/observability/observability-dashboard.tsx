/**
 * Dashboard de Observabilidade
 * 
 * Interface visual para monitoramento de métricas e saúde do sistema
 */

'use client';

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';

// ==========================================
// TIPOS
// ==========================================

interface MetricSummary {
  type: string;
  count: number;
  avg: number;
  min: number;
  max: number;
  p50: number;
  p95: number;
  p99: number;
  period: string;
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    database: boolean;
    storage: boolean;
    queue: boolean;
    tts: boolean;
  };
  timestamp: string;
}

interface TimeSeriesData {
  timestamp: string;
  avg: number;
  count: number;
}

interface MetricData {
  summary: MetricSummary;
  [key: string]: unknown;
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export default function ObservabilityDashboard() {
  const [period, setPeriod] = useState(24); // 24 horas
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [metrics, setMetrics] = useState<MetricSummary[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<Record<string, TimeSeriesData[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<string>('api_response_time');

  // ==========================================
  // FETCH DE DADOS
  // ==========================================

  useEffect(() => {
    fetchAllData();

    // Atualizar a cada 1 minuto
    const interval = setInterval(fetchAllData, 60000);

    return () => clearInterval(interval);
  }, [period]);

  async function fetchAllData() {
    setLoading(true);

    try {
      // Fetch métricas e health
      const response = await fetch(`/api/metrics?action=all&period=${period}`);
      const data = await response.json();

      setHealth(data.health);
      setMetrics(data.metrics.map((m: MetricData) => m.summary));

      // Fetch séries temporais para métrica selecionada
      await fetchTimeSeries(selectedMetric);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchTimeSeries(metricType: string) {
    try {
      const response = await fetch(
        `/api/metrics?action=timeseries&type=${metricType}&period=${period}`
      );
      const data = await response.json();

      setTimeSeriesData((prev) => ({
        ...prev,
        [metricType]: data.data,
      }));
    } catch (error) {
      console.error('Erro ao buscar série temporal:', error);
    }
  }

  // ==========================================
  // HANDLERS
  // ==========================================

  function handlePeriodChange(newPeriod: number) {
    setPeriod(newPeriod);
  }

  function handleMetricChange(metricType: string) {
    setSelectedMetric(metricType);
    fetchTimeSeries(metricType);
  }

  // ==========================================
  // FORMATAÇÃO
  // ==========================================

  function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}min`;
  }

  function getMetricLabel(type: string): string {
    const labels: Record<string, string> = {
      api_response_time: 'Tempo de Resposta da API',
      upload_duration: 'Duração de Upload',
      tts_generation_time: 'Tempo de Geração TTS',
      render_duration: 'Duração de Renderização',
      queue_wait_time: 'Tempo de Fila',
      error_rate: 'Taxa de Erro',
    };

    return labels[type] || type;
  }

  function getHealthColor(status: string): string {
    const colors: Record<string, string> = {
      healthy: '#10b981', // green-500
      degraded: '#f59e0b', // amber-500
      unhealthy: '#ef4444', // red-500
    };

    return colors[status] || '#6b7280'; // gray-500
  }

  // ==========================================
  // RENDERIZAÇÃO
  // ==========================================

  if (loading && !health) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Observabilidade do Sistema
        </h1>
        <p className="text-gray-600">
          Monitoramento de métricas de performance e saúde da aplicação
        </p>
      </div>

      {/* Seletor de Período */}
      <div className="mb-6 flex gap-2">
        {[1, 6, 12, 24, 48, 168].map((hours) => (
          <button
            key={hours}
            onClick={() => handlePeriodChange(hours)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              period === hours
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {hours === 1 ? '1h' : hours === 168 ? '7d' : `${hours}h`}
          </button>
        ))}
      </div>

      {/* Status de Saúde */}
      {health && (
        <div className="mb-8 p-6 bg-white rounded-lg shadow-md border-l-4"
          style={{ borderLeftColor: getHealthColor(health.status) }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Status do Sistema
            </h2>
            <span
              className="px-4 py-2 rounded-full text-white font-medium"
              style={{ backgroundColor: getHealthColor(health.status) }}
            >
              {health.status.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(health.checks).map(([service, status]) => (
              <div
                key={service}
                className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"
              >
                <div
                  className={`w-3 h-3 rounded-full ${
                    status ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
                <span className="font-medium capitalize">{service}</span>
              </div>
            ))}
          </div>

          <p className="mt-4 text-sm text-gray-500">
            Última atualização: {format(new Date(health.timestamp), 'dd/MM/yyyy HH:mm:ss')}
          </p>
        </div>
      )}

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {metrics.map((metric) => (
          <div
            key={metric.type}
            className={`p-6 bg-white rounded-lg shadow-md cursor-pointer transition-all ${
              selectedMetric === metric.type
                ? 'ring-2 ring-blue-500'
                : 'hover:shadow-lg'
            }`}
            onClick={() => handleMetricChange(metric.type)}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {getMetricLabel(metric.type)}
            </h3>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Média:</span>
                <span className="font-medium">{formatDuration(metric.avg)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">P50:</span>
                <span className="font-medium">{formatDuration(metric.p50)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">P95:</span>
                <span className="font-medium text-amber-600">
                  {formatDuration(metric.p95)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">P99:</span>
                <span className="font-medium text-red-600">
                  {formatDuration(metric.p99)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Min/Max:</span>
                <span className="font-medium text-sm">
                  {formatDuration(metric.min)} / {formatDuration(metric.max)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-sm text-gray-600">Amostras:</span>
                <span className="font-medium">{metric.count.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Gráfico de Série Temporal */}
      {timeSeriesData[selectedMetric] && timeSeriesData[selectedMetric].length > 0 && (
        <div className="p-6 bg-white rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {getMetricLabel(selectedMetric)} - Histórico
          </h2>

          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={timeSeriesData[selectedMetric]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(value) => format(new Date(value), 'HH:mm')}
              />
              <YAxis
                tickFormatter={(value) => formatDuration(value)}
              />
              <Tooltip
                labelFormatter={(value) => format(new Date(value), 'dd/MM HH:mm')}
                formatter={(value: number) => [formatDuration(value), 'Média']}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="avg"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                name="Tempo Médio"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Gráfico de Volume */}
      {timeSeriesData[selectedMetric] && timeSeriesData[selectedMetric].length > 0 && (
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Volume de Requisições
          </h2>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={timeSeriesData[selectedMetric]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(value) => format(new Date(value), 'HH:mm')}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(value) => format(new Date(value), 'dd/MM HH:mm')}
              />
              <Legend />
              <Bar dataKey="count" fill="#10b981" name="Contagem" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Footer com Informações */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg text-center text-sm text-gray-600">
        Atualização automática a cada 1 minuto • Período: últimas {period} horas
      </div>
    </div>
  );
}
