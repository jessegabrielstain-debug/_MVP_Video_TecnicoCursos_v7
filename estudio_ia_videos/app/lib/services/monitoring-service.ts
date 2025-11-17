/**
 * Monitoring Service
 * Sistema de monitoramento e métricas (stub para integração futura com Sentry)
 */

export interface MetricData {
  name: string;
  value: number;
  tags?: Record<string, string>;
  timestamp?: Date;
}

export interface ErrorContext {
  user?: { id: string; email?: string };
  request?: { url: string; method: string };
  extra?: Record<string, unknown>;
}

/**
 * Registra métrica customizada
 */
export function recordMetric(metric: MetricData): void {
  // Stub para implementação futura
  if (process.env.NODE_ENV === 'development') {
    console.log('[Metric]', metric);
  }
}

/**
 * Registra erro com contexto
 */
export function captureError(error: Error, context?: ErrorContext): void {
  // Stub para integração com Sentry
  console.error('[Error Captured]', {
    message: error.message,
    stack: error.stack,
    context,
  });
}

/**
 * Registra exceção com severidade
 */
export function captureException(
  error: Error,
  level: 'fatal' | 'error' | 'warning' | 'info' = 'error'
): void {
  console.error(`[${level.toUpperCase()}]`, error);
}

/**
 * Adiciona breadcrumb para rastreamento
 */
export function addBreadcrumb(message: string, category?: string, data?: Record<string, unknown>): void {
  // Stub para Sentry breadcrumbs
  if (process.env.NODE_ENV === 'development') {
    console.log('[Breadcrumb]', { message, category, data });
  }
}

export default {
  recordMetric,
  captureError,
  captureException,
  addBreadcrumb,
};
