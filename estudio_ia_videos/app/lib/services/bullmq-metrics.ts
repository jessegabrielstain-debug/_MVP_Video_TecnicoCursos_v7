/**
 * BullMQ Metrics Service
 * Instrumentação e métricas para filas BullMQ
 */

import { Queue, QueueEvents } from 'bullmq';
import { captureException, captureMessage } from '../monitoring/sentry.server';

interface QueueMetrics {
  queueName: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
  timestamp: Date;
}

interface JobMetrics {
  jobId: string;
  queueName: string;
  status: string;
  attempts: number;
  progress: number;
  timestamp: Date;
  duration?: number;
}

/**
 * Service para coletar métricas de BullMQ
 */
export class BullMQMetricsService {
  private queues: Map<string, Queue> = new Map();
  private queueEvents: Map<string, QueueEvents> = new Map();
  private metricsInterval?: NodeJS.Timeout;
  private alertThresholds = {
    waitingJobs: 100,
    failedJobs: 10,
    activeJobsStuck: 5, // minutos
  };

  constructor() {
    this.startPolling();
  }

  /**
   * Registra uma fila para monitoramento
   */
  registerQueue(queueName: string, queue: Queue) {
    this.queues.set(queueName, queue);
    
    // Criar QueueEvents para escutar eventos
    const queueEvents = new QueueEvents(queueName, {
      connection: queue.opts.connection,
    });
    
    this.queueEvents.set(queueName, queueEvents);
    this.setupQueueEventListeners(queueName, queueEvents);
    
    console.log(`✅ BullMQ metrics registrado para fila: ${queueName}`);
  }

  /**
   * Configura listeners de eventos da fila
   */
  private setupQueueEventListeners(queueName: string, queueEvents: QueueEvents) {
    // Job completado
    queueEvents.on('completed', ({ jobId, returnvalue }) => {
      console.log(`✅ [${queueName}] Job ${jobId} completado`);
      captureMessage(`Job completado: ${jobId}`, 'info');
    });

    // Job falhou
    queueEvents.on('failed', ({ jobId, failedReason }) => {
      console.error(`❌ [${queueName}] Job ${jobId} falhou:`, failedReason);
      captureException(new Error(failedReason || 'Job failed'), {
        queueName,
        jobId,
      });
      
      // Alertar se muitos jobs falhando
      this.checkFailedJobsThreshold(queueName);
    });

    // Job travado (stalled)
    queueEvents.on('stalled', ({ jobId }) => {
      console.warn(`⚠️ [${queueName}] Job ${jobId} travado`);
      captureMessage(`Job travado: ${jobId}`, 'warning');
    });

    // Job progresso
    queueEvents.on('progress', ({ jobId, data }) => {
      console.log(`📊 [${queueName}] Job ${jobId} progresso: ${JSON.stringify(data)}`);
    });
  }

  /**
   * Coleta métricas de todas as filas
   */
  async collectMetrics(): Promise<QueueMetrics[]> {
    const metrics: QueueMetrics[] = [];

    for (const [queueName, queue] of this.queues) {
      try {
        const counts = await queue.getJobCounts();
        const isPaused = await queue.isPaused();

        const queueMetrics: QueueMetrics = {
          queueName,
          waiting: counts.waiting || 0,
          active: counts.active || 0,
          completed: counts.completed || 0,
          failed: counts.failed || 0,
          delayed: counts.delayed || 0,
          paused: isPaused,
          timestamp: new Date(),
        };

        metrics.push(queueMetrics);

        // Verificar thresholds
        this.checkThresholds(queueMetrics);
      } catch (error) {
        console.error(`Erro ao coletar métricas da fila ${queueName}:`, error);
        captureException(error as Error, { queueName });
      }
    }

    return metrics;
  }

  /**
   * Verifica thresholds e dispara alertas
   */
  private checkThresholds(metrics: QueueMetrics) {
    // Alerta: muitos jobs esperando
    if (metrics.waiting > this.alertThresholds.waitingJobs) {
      captureMessage(
        `ALERTA: Fila ${metrics.queueName} com ${metrics.waiting} jobs esperando`,
        'warning'
      );
      console.warn(`⚠️ Threshold de waiting jobs excedido: ${metrics.queueName}`);
    }

    // Alerta: muitos jobs falhando
    if (metrics.failed > this.alertThresholds.failedJobs) {
      captureMessage(
        `ALERTA: Fila ${metrics.queueName} com ${metrics.failed} jobs falhados`,
        'error'
      );
      console.error(`❌ Threshold de failed jobs excedido: ${metrics.queueName}`);
    }

    // Alerta: fila pausada
    if (metrics.paused) {
      captureMessage(
        `ALERTA: Fila ${metrics.queueName} está pausada`,
        'warning'
      );
      console.warn(`⏸️ Fila pausada: ${metrics.queueName}`);
    }
  }

  /**
   * Verifica se há muitos jobs falhando
   */
  private async checkFailedJobsThreshold(queueName: string) {
    const queue = this.queues.get(queueName);
    if (!queue) return;

    const counts = await queue.getJobCounts();
    if (counts.failed && counts.failed > this.alertThresholds.failedJobs) {
      // Disparar alerta crítico
      captureMessage(
        `CRÍTICO: ${counts.failed} jobs falhados na fila ${queueName}`,
        'error'
      );
    }
  }

  /**
   * Inicia coleta periódica de métricas
   */
  public startPolling(intervalMs: number = 30000) {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    // Coletar métricas periodicamente
    this.metricsInterval = setInterval(async () => {
      const metrics = await this.collectMetrics();
      
      // Log das métricas para dashboard
      console.log('📊 BullMQ Metrics:', JSON.stringify(metrics, null, 2));
    }, intervalMs);
  }

  /**
   * Para coleta de métricas
   */
  stopMetricsCollection() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = undefined;
    }

    // Fechar QueueEvents
    for (const [queueName, queueEvents] of this.queueEvents) {
      queueEvents.close();
      console.log(`🔌 QueueEvents fechado: ${queueName}`);
    }
  }

  /**
   * Obtém métricas de uma fila específica
   */
  async getQueueMetrics(queueName: string): Promise<QueueMetrics | null> {
    const queue = this.queues.get(queueName);
    if (!queue) return null;

    const counts = await queue.getJobCounts();
    const isPaused = await queue.isPaused();

    return {
      queueName,
      waiting: counts.waiting || 0,
      active: counts.active || 0,
      completed: counts.completed || 0,
      failed: counts.failed || 0,
      delayed: counts.delayed || 0,
      paused: isPaused,
      timestamp: new Date(),
    };
  }

  /**
   * Obtém jobs ativos com tempo de execução
   */
  async getActiveJobs(queueName: string): Promise<JobMetrics[]> {
    const queue = this.queues.get(queueName);
    if (!queue) return [];

    const jobs = await queue.getJobs(['active']);
    const now = Date.now();

    return jobs.map(job => ({
      jobId: job.id || 'unknown',
      queueName,
      status: 'active',
      attempts: job.attemptsMade,
      progress: job.progress as number || 0,
      timestamp: new Date(job.timestamp),
      duration: job.processedOn ? now - job.processedOn : undefined,
    }));
  }

  /**
   * Limpa jobs completados/falhados antigos
   */
  async cleanupOldJobs(queueName: string, olderThan: number = 7 * 24 * 60 * 60 * 1000) {
    const queue = this.queues.get(queueName);
    if (!queue) return;

    try {
      await queue.clean(olderThan, 100, 'completed');
      await queue.clean(olderThan, 100, 'failed');
      console.log(`🧹 Cleanup executado na fila ${queueName}`);
    } catch (error) {
      console.error(`Erro ao fazer cleanup da fila ${queueName}:`, error);
      captureException(error as Error, { queueName });
    }
  }
}

// Singleton instance
export const bullMQMetrics = new BullMQMetricsService();
