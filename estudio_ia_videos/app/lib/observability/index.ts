/**
 * Observability Module Index
 * 
 * Exportações centralizadas para observabilidade, métricas e tracing.
 * 
 * @module lib/observability
 */

// Core observability (Sentry)
export { 
  initObservability,
  captureError,
  captureMessage,
  setUserContext,
  clearUserContext,
  startTransaction,
  observability,
} from '../observability';

// Custom metrics
export {
  metricsRegistry,
  customMetrics,
  incRenderJobs,
  setActiveRenderJobs,
  observeRenderDuration,
  setRenderQueueDepth,
  recordApiRequest,
  recordDbQuery,
  recordTtsRequest,
  recordUpload,
  startTimer,
} from './custom-metrics';

// Re-export types
export type { MetricType, MetricLabels, MetricValue } from './custom-metrics';
