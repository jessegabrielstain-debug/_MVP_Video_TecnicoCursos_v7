#!/usr/bin/env ts-node
/**
 * Script: worker-health.ts
 * Objetivo: verificar saúde do worker de render BullMQ.
 * - Lê métricas via getQueueMetrics
 * - Detecta condições de alerta (failed alto, ausência de active quando há waiting)
 * - FUTURO: reiniciar worker (placeholder hook)
 * Saída: JSON estruturado + grava evidência opcional em evidencias/fase-2/worker-health.json
 */
import { getQueueMetrics, closeBullMQ } from '../../estudio_ia_videos/app/lib/services/bullmq-service';
import { promises as fs } from 'fs';
import path from 'path';

interface HealthReport {
  ts: string;
  metrics: {
    waiting: number; active: number; completed: number; failed: number; delayed: number; total: number;
  };
  status: 'OK' | 'DEGRADADO' | 'CRITICO';
  alerts: string[];
  autoRestartAttempted: boolean;
}

async function main() {
  const metrics = await getQueueMetrics();
  const alerts: string[] = [];
  let status: HealthReport['status'] = 'OK';

  const failedThreshold = parseInt(process.env.WORKER_FAILED_THRESHOLD || '10', 10);
  const waitingStallThreshold = parseInt(process.env.WORKER_WAITING_STALL_THRESHOLD || '50', 10);

  if (metrics.failed > failedThreshold) {
    alerts.push(`failed>${failedThreshold}`);
    status = 'DEGRADADO';
  }
  if (metrics.waiting > waitingStallThreshold && metrics.active === 0) {
    alerts.push(`waiting>${waitingStallThreshold} sem active`);
    status = 'CRITICO';
  }
  if (metrics.active === 0 && metrics.waiting > 0) {
    alerts.push('Fila parada (waiting>0, active=0)');
  }

  let autoRestartAttempted = false;
  if (status === 'CRITICO' && process.env.WORKER_AUTO_RESTART === 'true') {
    // Placeholder: aqui entrar lógica real (ex: enviar sinal, recriar container, chamar script PM2/Kubernetes)
    autoRestartAttempted = true;
    alerts.push('Auto-restart placeholder executado');
  }

  const report: HealthReport = {
    ts: new Date().toISOString(),
    metrics,
    status,
    alerts,
    autoRestartAttempted,
  };
  console.log(JSON.stringify(report, null, 2));

  const evidenceDir = path.join(process.cwd(), 'evidencias', 'fase-2');
  await fs.mkdir(evidenceDir, { recursive: true });
  await fs.writeFile(path.join(evidenceDir, 'worker-health.json'), JSON.stringify(report, null, 2), 'utf8');
  await closeBullMQ();
}

main().catch(err => {
  console.error('Falha worker-health:', err);
  process.exit(1);
});
