// Instrumentation para Next.js App Router
// Executado em edge/server conforme documentação Next 13+/14.
// Responsável por marcar bootstrap e permitir inicialização futura de tracing.

import { addBreadcrumb, ensureMonitoringReady } from './lib/services/monitoring-service';
import { startQueueMetricsPolling } from './lib/services/bullmq-service';
import { bullMQMetrics } from './lib/services/bullmq-metrics';
import { initSentry } from './lib/monitoring/sentry.server';
import { logger } from './lib/services/logger-service-centralized';

export async function register() {
  // Inicializa Sentry (produção)
  if (process.env.NODE_ENV === 'production') {
    initSentry();
  }

  // Marca início da aplicação
  addBreadcrumb('app-start', 'lifecycle');
  await ensureMonitoringReady();
  
  if (typeof process !== 'undefined') {
    process.on('unhandledRejection', (reason: unknown) => {
      const error = reason instanceof Error ? reason : new Error(String(reason));
      const context = typeof reason === 'object' && reason !== null 
        ? (reason as Record<string, unknown>) 
        : { value: reason };
      logger.error('Process: unhandledRejection', error, context);
      addBreadcrumb('unhandled-rejection', 'error');
    });
    process.on('uncaughtException', (err: unknown) => {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Process: uncaughtException', error);
      addBreadcrumb('uncaught-exception', 'error');
    });
  }
  
  // Inicia polling de métricas BullMQ (ajustar para somente ambiente server)
  if (process.env.NODE_ENV !== 'test') {
    startQueueMetricsPolling(parseInt(process.env.BULLMQ_POLL_INTERVAL_MS || '30000', 10));
    bullMQMetrics.startPolling(30000); // 30s
  }
}
