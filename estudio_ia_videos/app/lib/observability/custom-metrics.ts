/**
 * Custom Metrics Module
 * 
 * Métricas de aplicação para monitoramento de performance e saúde.
 * Implementa padrão Prometheus-compatible para integração com Grafana.
 * 
 * @module lib/observability/custom-metrics
 */

import { Logger } from '@/lib/logger';

const logger = new Logger('CustomMetrics');

// =====================================
// Metric Types
// =====================================

export type MetricType = 'counter' | 'gauge' | 'histogram';

export interface MetricLabels {
  [key: string]: string | number | boolean;
}

export interface MetricValue {
  value: number;
  timestamp: Date;
  labels?: MetricLabels;
}

export interface HistogramBuckets {
  [bucket: string]: number;
}

interface MetricData {
  name: string;
  type: MetricType;
  help: string;
  values: MetricValue[];
  buckets?: number[]; // For histograms
}

// =====================================
// Metrics Registry
// =====================================

class MetricsRegistry {
  private metrics = new Map<string, MetricData>();
  private readonly maxValuesPerMetric = 1000;
  
  /**
   * Registra uma nova métrica
   */
  register(name: string, type: MetricType, help: string, buckets?: number[]): void {
    if (this.metrics.has(name)) {
      return; // Already registered
    }
    
    this.metrics.set(name, {
      name,
      type,
      help,
      values: [],
      buckets,
    });
    
    logger.debug('Metric registered', { name, type });
  }
  
  /**
   * Incrementa um counter
   */
  inc(name: string, value = 1, labels?: MetricLabels): void {
    const metric = this.metrics.get(name);
    if (!metric || metric.type !== 'counter') {
      logger.warn('Invalid counter operation', { name, type: metric?.type });
      return;
    }
    
    this.addValue(name, value, labels);
  }
  
  /**
   * Define valor de um gauge
   */
  set(name: string, value: number, labels?: MetricLabels): void {
    const metric = this.metrics.get(name);
    if (!metric || metric.type !== 'gauge') {
      logger.warn('Invalid gauge operation', { name, type: metric?.type });
      return;
    }
    
    this.addValue(name, value, labels);
  }
  
  /**
   * Observa valor em um histogram
   */
  observe(name: string, value: number, labels?: MetricLabels): void {
    const metric = this.metrics.get(name);
    if (!metric || metric.type !== 'histogram') {
      logger.warn('Invalid histogram operation', { name, type: metric?.type });
      return;
    }
    
    this.addValue(name, value, labels);
  }
  
  private addValue(name: string, value: number, labels?: MetricLabels): void {
    const metric = this.metrics.get(name);
    if (!metric) return;
    
    metric.values.push({
      value,
      timestamp: new Date(),
      labels,
    });
    
    // Trim old values
    if (metric.values.length > this.maxValuesPerMetric) {
      metric.values = metric.values.slice(-this.maxValuesPerMetric);
    }
  }
  
  /**
   * Obtém todas as métricas em formato Prometheus
   */
  getPrometheusFormat(): string {
    const lines: string[] = [];
    
    for (const metric of this.metrics.values()) {
      lines.push(`# HELP ${metric.name} ${metric.help}`);
      lines.push(`# TYPE ${metric.name} ${metric.type}`);
      
      if (metric.type === 'histogram') {
        const bucketCounts = this.calculateHistogramBuckets(metric);
        for (const [bucket, count] of Object.entries(bucketCounts)) {
          lines.push(`${metric.name}_bucket{le="${bucket}"} ${count}`);
        }
        lines.push(`${metric.name}_count ${metric.values.length}`);
        lines.push(`${metric.name}_sum ${metric.values.reduce((s, v) => s + v.value, 0)}`);
      } else {
        const latest = metric.values[metric.values.length - 1];
        if (latest) {
          const labelsStr = latest.labels 
            ? `{${Object.entries(latest.labels).map(([k, v]) => `${k}="${v}"`).join(',')}}`
            : '';
          lines.push(`${metric.name}${labelsStr} ${latest.value}`);
        }
      }
    }
    
    return lines.join('\n');
  }
  
  /**
   * Obtém métricas em formato JSON
   */
  getJsonFormat(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    
    for (const metric of this.metrics.values()) {
      if (metric.type === 'histogram') {
        result[metric.name] = {
          type: metric.type,
          buckets: this.calculateHistogramBuckets(metric),
          count: metric.values.length,
          sum: metric.values.reduce((s, v) => s + v.value, 0),
          avg: metric.values.length > 0 
            ? metric.values.reduce((s, v) => s + v.value, 0) / metric.values.length 
            : 0,
        };
      } else {
        const latest = metric.values[metric.values.length - 1];
        result[metric.name] = {
          type: metric.type,
          value: latest?.value ?? 0,
          labels: latest?.labels,
          timestamp: latest?.timestamp,
        };
      }
    }
    
    return result;
  }
  
  private calculateHistogramBuckets(metric: MetricData): HistogramBuckets {
    const buckets = metric.buckets || [0.1, 0.5, 1, 2.5, 5, 10, 30, 60, 120];
    const counts: HistogramBuckets = {};
    
    for (const bucket of buckets) {
      counts[bucket.toString()] = metric.values.filter(v => v.value <= bucket).length;
    }
    counts['+Inf'] = metric.values.length;
    
    return counts;
  }
  
  /**
   * Limpa todas as métricas
   */
  clear(): void {
    for (const metric of this.metrics.values()) {
      metric.values = [];
    }
  }
}

// =====================================
// Global Registry Instance
// =====================================

export const metricsRegistry = new MetricsRegistry();

// =====================================
// Pre-defined Application Metrics
// =====================================

// Render metrics
metricsRegistry.register('render_jobs_total', 'counter', 'Total number of render jobs processed');
metricsRegistry.register('render_jobs_active', 'gauge', 'Number of currently active render jobs');
metricsRegistry.register('render_duration_seconds', 'histogram', 'Render job duration in seconds', [1, 5, 10, 30, 60, 120, 300, 600]);
metricsRegistry.register('render_queue_depth', 'gauge', 'Number of jobs waiting in render queue');

// API metrics
metricsRegistry.register('api_requests_total', 'counter', 'Total API requests');
metricsRegistry.register('api_request_duration_seconds', 'histogram', 'API request duration', [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]);
metricsRegistry.register('api_errors_total', 'counter', 'Total API errors');

// Database metrics
metricsRegistry.register('db_query_duration_seconds', 'histogram', 'Database query duration', [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1]);
metricsRegistry.register('db_connections_active', 'gauge', 'Active database connections');

// TTS metrics
metricsRegistry.register('tts_requests_total', 'counter', 'Total TTS generation requests');
metricsRegistry.register('tts_duration_seconds', 'histogram', 'TTS generation duration', [0.5, 1, 2, 5, 10, 30]);
metricsRegistry.register('tts_characters_total', 'counter', 'Total characters processed by TTS');

// Storage metrics
metricsRegistry.register('storage_uploads_total', 'counter', 'Total file uploads');
metricsRegistry.register('storage_bytes_uploaded', 'counter', 'Total bytes uploaded');

// =====================================
// Helper Functions
// =====================================

/**
 * Incrementa contador de render jobs
 */
export function incRenderJobs(status: 'started' | 'completed' | 'failed' | 'cancelled'): void {
  metricsRegistry.inc('render_jobs_total', 1, { status });
}

/**
 * Define número de render jobs ativos
 */
export function setActiveRenderJobs(count: number): void {
  metricsRegistry.set('render_jobs_active', count);
}

/**
 * Observa duração de render
 */
export function observeRenderDuration(seconds: number, status: string): void {
  metricsRegistry.observe('render_duration_seconds', seconds, { status });
}

/**
 * Define profundidade da fila de render
 */
export function setRenderQueueDepth(depth: number): void {
  metricsRegistry.set('render_queue_depth', depth);
}

/**
 * Registra requisição API
 */
export function recordApiRequest(route: string, method: string, statusCode: number, durationMs: number): void {
  metricsRegistry.inc('api_requests_total', 1, { route, method, status: statusCode.toString() });
  metricsRegistry.observe('api_request_duration_seconds', durationMs / 1000, { route, method });
  
  if (statusCode >= 400) {
    metricsRegistry.inc('api_errors_total', 1, { route, method, status: statusCode.toString() });
  }
}

/**
 * Registra query de banco de dados
 */
export function recordDbQuery(operation: string, table: string, durationMs: number): void {
  metricsRegistry.observe('db_query_duration_seconds', durationMs / 1000, { operation, table });
}

/**
 * Registra requisição TTS
 */
export function recordTtsRequest(provider: string, characters: number, durationMs: number, success: boolean): void {
  metricsRegistry.inc('tts_requests_total', 1, { provider, success: success.toString() });
  metricsRegistry.inc('tts_characters_total', characters, { provider });
  metricsRegistry.observe('tts_duration_seconds', durationMs / 1000, { provider });
}

/**
 * Registra upload de arquivo
 */
export function recordUpload(type: string, bytes: number): void {
  metricsRegistry.inc('storage_uploads_total', 1, { type });
  metricsRegistry.inc('storage_bytes_uploaded', bytes, { type });
}

/**
 * Timer helper para medir duração
 */
export function startTimer(): () => number {
  const start = performance.now();
  return () => (performance.now() - start) / 1000;
}

// =====================================
// Export
// =====================================

export const customMetrics = {
  registry: metricsRegistry,
  incRenderJobs,
  setActiveRenderJobs,
  observeRenderDuration,
  setRenderQueueDepth,
  recordApiRequest,
  recordDbQuery,
  recordTtsRequest,
  recordUpload,
  startTimer,
};

export default customMetrics;
