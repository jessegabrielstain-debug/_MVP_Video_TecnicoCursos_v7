/**
 * Monitoring Service
 * Sistema de monitoramento e métricas com integração opcional Sentry.
 *
 * - Se `SENTRY_DSN` estiver definido e o pacote estiver instalado,
 *   inicializa Sentry (server-side) sob demanda.
 * - Em desenvolvimento ou sem DSN, mantém comportamento de stub seguro.
 */
let sentryReady = false;
// Usamos `any` para não exigir tipagens/instalação de @sentry/node em ambientes sem Sentry
let sentry: any | null = null;

export async function ensureMonitoringReady() {
  if (sentryReady) return true;
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return false;
  try {
    // Import dinâmico para não impor dependência direta
    const mod: any = await import('@sentry/node');
    sentry = mod;
    if (!mod.isEnabled()) {
      mod.init({
        dsn,
        tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.0'),
        environment: process.env.NODE_ENV || 'development',
        release: process.env.APP_VERSION,
      });
    }
    sentryReady = true;
    sentry?.addBreadcrumb({ category: 'lifecycle', message: 'sentry-initialized' });
    return true;
  } catch {
    // Pacote não instalado ou falha na init — mantém stub
    sentry = null;
    sentryReady = false;
    return false;
  }
}

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
  ensureMonitoringReady().then((ok) => {
    if (ok && sentry) {
      sentry?.addBreadcrumb({
        category: 'metric',
        message: metric.name,
        data: { value: metric.value, tags: metric.tags },
        level: 'info',
      });
    } else if (process.env.NODE_ENV === 'development') {
      console.log('[Metric]', metric);
    }
  });
}

/**
 * Registra erro com contexto
 */
export function captureError(error: Error, context?: ErrorContext): void {
  ensureMonitoringReady().then((ok) => {
    if (ok && sentry) {
      sentry?.captureException(error, (scope) => {
        if (context?.user) scope.setUser({ id: context.user.id, email: context.user.email });
        if (context?.request) scope.setContext('request', context.request as Record<string, unknown>);
        if (context?.extra) scope.setExtras(context.extra);
        return scope;
      });
    } else {
      console.error('[Error Captured]', {
        message: error.message,
        stack: error.stack,
        context,
      });
    }
  });
}

/**
 * Registra exceção com severidade
 */
export function captureException(
  error: Error,
  level: 'fatal' | 'error' | 'warning' | 'info' = 'error'
): void {
  ensureMonitoringReady().then((ok) => {
    if (ok && sentry) {
      const lvl = level === 'fatal' ? 'fatal' : level;
      sentry?.captureException(error, (scope) => {
        scope.setLevel(lvl as any);
        return scope;
      });
    } else {
      console.error(`[${level.toUpperCase()}]`, error);
    }
  });
}

/**
 * Adiciona breadcrumb para rastreamento
 */
export function addBreadcrumb(message: string, category?: string, data?: Record<string, unknown>): void {
  ensureMonitoringReady().then((ok) => {
    if (ok && sentry) {
      sentry?.addBreadcrumb({ message, category, data });
    } else if (process.env.NODE_ENV === 'development') {
      console.log('[Breadcrumb]', { message, category, data });
    }
  });
}

export default {
  ensureMonitoringReady,
  recordMetric,
  captureError,
  captureException,
  addBreadcrumb,
};
