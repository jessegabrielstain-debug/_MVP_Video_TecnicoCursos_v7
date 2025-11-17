// Instrumentation para Next.js App Router
// Executado em edge/server conforme documentação Next 13+/14.
// Responsável por marcar bootstrap e permitir inicialização futura de tracing.

import { addBreadcrumb, ensureMonitoringReady } from './lib/services/monitoring-service';
import { startQueueMetricsPolling } from './lib/services/bullmq-service';

export async function register() {
  // Marca início da aplicação
  addBreadcrumb('app-start', 'lifecycle');
  await ensureMonitoringReady();
  if (typeof process !== 'undefined') {
    process.on('unhandledRejection', (reason: any) => {
      console.error('[unhandledRejection]', reason);
      addBreadcrumb('unhandled-rejection', 'error');
    });
    process.on('uncaughtException', (err: any) => {
      console.error('[uncaughtException]', err);
      addBreadcrumb('uncaught-exception', 'error');
    });
  }
  // Inicia polling de métricas BullMQ (ajustar para somente ambiente server)
  if (process.env.NODE_ENV !== 'test') {
    startQueueMetricsPolling(parseInt(process.env.BULLMQ_POLL_INTERVAL_MS || '30000', 10));
  }
}
