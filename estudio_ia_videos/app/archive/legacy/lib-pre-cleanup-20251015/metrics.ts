/**
 * Sistema de Métricas e Observabilidade
 * 
 * Coleta e armazena métricas de performance e uso da aplicação
 */

import { createClient } from '@/lib/supabase/client';

// ==========================================
// TIPOS
// ==========================================

export type MetricType =
  | 'api_response_time'
  | 'upload_duration'
  | 'tts_generation_time'
  | 'render_duration'
  | 'queue_wait_time'
  | 'error_rate'
  | 'memory_usage'
  | 'cpu_usage';

export interface Metric {
  type: MetricType;
  value: number;
  unit: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
  tags?: Record<string, string>;
}

export interface MetricsSummary {
  type: MetricType;
  count: number;
  avg: number;
  min: number;
  max: number;
  p50: number; // Mediana
  p95: number; // Percentil 95
  p99: number; // Percentil 99
  period: string;
}

// ==========================================
// ARMAZENAMENTO DE MÉTRICAS
// ==========================================

/**
 * Registrar métrica no database
 */
export async function recordMetric(metric: Omit<Metric, 'timestamp'>) {
  const supabase = createClient();

  try {
    const { error } = await supabase.from('metrics').insert({
      type: metric.type,
      value: metric.value,
      unit: metric.unit,
      metadata: metric.metadata || {},
      tags: metric.tags || {},
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Erro ao registrar métrica:', error);
    }
  } catch (error) {
    console.error('Erro ao registrar métrica:', error);
  }
}

// ==========================================
// CONSULTA DE MÉTRICAS
// ==========================================

/**
 * Obter resumo de métricas por tipo e período
 */
export async function getMetricsSummary(
  type: MetricType,
  periodHours: number = 24
): Promise<MetricsSummary | null> {
  const supabase = createClient();

  try {
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - periodHours);

    const { data, error } = await supabase
      .from('metrics')
      .select('value')
      .eq('type', type)
      .gte('created_at', startDate.toISOString())
      .order('value', { ascending: true });

    if (error || !data || data.length === 0) {
      return null;
    }

    const values = data.map((m) => m.value);
    const count = values.length;
    const avg = values.reduce((a, b) => a + b, 0) / count;
    const min = values[0];
    const max = values[count - 1];

    // Calcular percentis
    const p50Index = Math.floor(count * 0.5);
    const p95Index = Math.floor(count * 0.95);
    const p99Index = Math.floor(count * 0.99);

    const p50 = values[p50Index];
    const p95 = values[p95Index];
    const p99 = values[p99Index];

    return {
      type,
      count,
      avg,
      min,
      max,
      p50,
      p95,
      p99,
      period: `${periodHours}h`,
    };
  } catch (error) {
    console.error('Erro ao consultar métricas:', error);
    return null;
  }
}

/**
 * Obter séries temporais de métricas
 */
export async function getMetricsTimeSeries(
  type: MetricType,
  periodHours: number = 24,
  bucketMinutes: number = 60
): Promise<Array<{ timestamp: string; avg: number; count: number }>> {
  const supabase = createClient();

  try {
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - periodHours);

    const { data, error } = await supabase
      .from('metrics')
      .select('value, created_at')
      .eq('type', type)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error || !data || data.length === 0) {
      return [];
    }

    // Agrupar por buckets de tempo
    const buckets = new Map<string, number[]>();

    data.forEach((metric) => {
      const timestamp = new Date(metric.created_at);
      timestamp.setMinutes(
        Math.floor(timestamp.getMinutes() / bucketMinutes) * bucketMinutes,
        0,
        0
      );

      const key = timestamp.toISOString();
      if (!buckets.has(key)) {
        buckets.set(key, []);
      }
      buckets.get(key)!.push(metric.value);
    });

    // Calcular médias por bucket
    return Array.from(buckets.entries()).map(([timestamp, values]) => ({
      timestamp,
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      count: values.length,
    }));
  } catch (error) {
    console.error('Erro ao consultar séries temporais:', error);
    return [];
  }
}

// ==========================================
// MÉTRICAS PRÉ-DEFINIDAS
// ==========================================

/**
 * Registrar tempo de resposta de API
 */
export async function recordApiResponseTime(
  method: string,
  path: string,
  duration: number,
  statusCode: number
) {
  await recordMetric({
    type: 'api_response_time',
    value: duration,
    unit: 'ms',
    tags: {
      method,
      path,
      status: statusCode.toString(),
    },
  });
}

/**
 * Registrar duração de upload
 */
export async function recordUploadDuration(
  userId: string,
  fileSize: number,
  duration: number
) {
  await recordMetric({
    type: 'upload_duration',
    value: duration,
    unit: 'ms',
    metadata: {
      userId,
      fileSize,
      speed: fileSize / duration, // bytes/ms
    },
  });
}

/**
 * Registrar tempo de geração de TTS
 */
export async function recordTTSGenerationTime(
  provider: string,
  textLength: number,
  duration: number
) {
  await recordMetric({
    type: 'tts_generation_time',
    value: duration,
    unit: 'ms',
    tags: {
      provider,
    },
    metadata: {
      textLength,
      charsPerSecond: (textLength / duration) * 1000,
    },
  });
}

/**
 * Registrar duração de renderização
 */
export async function recordRenderDuration(
  projectId: string,
  slideCount: number,
  resolution: string,
  duration: number
) {
  await recordMetric({
    type: 'render_duration',
    value: duration,
    unit: 'ms',
    tags: {
      resolution,
    },
    metadata: {
      projectId,
      slideCount,
      avgPerSlide: duration / slideCount,
    },
  });
}

/**
 * Registrar tempo de espera na fila
 */
export async function recordQueueWaitTime(
  queueName: string,
  jobId: string,
  waitTime: number
) {
  await recordMetric({
    type: 'queue_wait_time',
    value: waitTime,
    unit: 'ms',
    tags: {
      queue: queueName,
    },
    metadata: {
      jobId,
    },
  });
}

/**
 * Registrar taxa de erro
 */
export async function recordErrorRate(
  errorType: string,
  context: string
) {
  await recordMetric({
    type: 'error_rate',
    value: 1,
    unit: 'count',
    tags: {
      error_type: errorType,
      context,
    },
  });
}

/**
 * Registrar uso de memória
 */
export async function recordMemoryUsage(
  usedMemory: number,
  totalMemory: number
) {
  await recordMetric({
    type: 'memory_usage',
    value: usedMemory,
    unit: 'bytes',
    metadata: {
      totalMemory,
      percentUsed: (usedMemory / totalMemory) * 100,
    },
  });
}

// ==========================================
// ALERTAS BASEADOS EM MÉTRICAS
// ==========================================

/**
 * Verificar limites de métricas e gerar alertas
 */
export async function checkMetricThresholds() {
  const checks = [
    {
      type: 'api_response_time' as MetricType,
      threshold: 5000, // 5s
      message: 'API com tempo de resposta elevado',
    },
    {
      type: 'render_duration' as MetricType,
      threshold: 600000, // 10 minutos
      message: 'Renderização muito lenta',
    },
    {
      type: 'queue_wait_time' as MetricType,
      threshold: 300000, // 5 minutos
      message: 'Tempo de fila muito alto',
    },
  ];

  for (const check of checks) {
    const summary = await getMetricsSummary(check.type, 1); // Última hora

    if (summary && summary.p95 > check.threshold) {
      console.warn(`ALERTA: ${check.message} (P95: ${summary.p95}ms)`);

      // TODO: Enviar notificação (email, Slack, etc.)
    }
  }
}

// ==========================================
// LIMPEZA DE MÉTRICAS ANTIGAS
// ==========================================

/**
 * Remover métricas antigas para economizar espaço
 */
export async function cleanupOldMetrics(daysToKeep: number = 30) {
  const supabase = createClient();

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const { error } = await supabase
      .from('metrics')
      .delete()
      .lt('created_at', cutoffDate.toISOString());

    if (error) {
      console.error('Erro ao limpar métricas antigas:', error);
    } else {
      console.log(`Métricas anteriores a ${cutoffDate.toISOString()} removidas`);
    }
  } catch (error) {
    console.error('Erro ao limpar métricas antigas:', error);
  }
}

// ==========================================
// EXPORT DEFAULT
// ==========================================

export default {
  record: recordMetric,
  getSummary: getMetricsSummary,
  getTimeSeries: getMetricsTimeSeries,
  api: {
    responseTime: recordApiResponseTime,
  },
  upload: {
    duration: recordUploadDuration,
  },
  tts: {
    generationTime: recordTTSGenerationTime,
  },
  render: {
    duration: recordRenderDuration,
  },
  queue: {
    waitTime: recordQueueWaitTime,
  },
  error: {
    rate: recordErrorRate,
  },
  memory: {
    usage: recordMemoryUsage,
  },
  checkThresholds: checkMetricThresholds,
  cleanup: cleanupOldMetrics,
};
