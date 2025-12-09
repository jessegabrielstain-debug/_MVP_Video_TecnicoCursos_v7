/**
 * BullMQ Metrics Service
 * Instrumentação e métricas para filas BullMQ
 */

import { Queue, QueueEvents } from 'bullmq';
import { captureException, captureMessage } from '../monitoring/sentry.server';
import { logger } from '@/lib/logger';

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
    
    logger.info(`✅ BullMQ metrics registrado para fila: ${queueName}`, { component: 'BullMQMetricsService' });
  }

  /**
   * Configura listeners de eventos da fila
   */
  private setupQueueEventListeners(queueName: string, queueEvents: QueueEvents) {
    // Job completado
    queueEvents.on('completed', ({ jobId, returnvalue }) => {
      logger.info(`✅ [${queueName}] Job ${jobId} completado`, { component: 'BullMQMetricsService' });
      captureMessage(`Job completado: ${jobId}`, 'info');
    });

    // Job falhou
    queueEvents.on('failed', ({ jobId, failedReason }) => {
      logger.error(`❌ [${queueName}] Job ${jobId} falhou:`, new Error(failedReason), { component: 'BullMQMetricsService' });
      captureException(new Error(failedReason || 'Job failed'), {
        queueName,
        jobId,
      });
      
      // Alertar se muitos jobs falhando
      this.checkFailedJobsThreshold(queueName);
    });

    // Job travado (stalled)
    queueEvents.on('stalled', ({ jobId }) => {
      logger.warn(`⚠️ [${queueName}] Job ${jobId} travado`, { component: 'BullMQMetricsService' });
      captureMessage(`Job travado: ${jobId}`, 'warning');
    });

    // Job progresso
    queueEvents.on('progress', ({ jobId, data }) => {
      logger.info(`📊 [${queueName}] Job ${jobId} progresso: ${JSON.stringify(data)}`, { component: 'BullMQMetricsService' });
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
        logger.error(`Erro ao coletar métricas da fila ${queueName}:`, error instanceof Error ? error : new Error(String(error)), { component: 'BullMQMetricsService' });
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
      logger.warn(`⚠️ Threshold de waiting jobs excedido: ${metrics.queueName}`, { component: 'BullMQMetricsService' });
    }

    // Alerta: muitos jobs falhando
    if (metrics.failed > this.alertThresholds.failedJobs) {
      captureMessage(
        `ALERTA: Fila ${metrics.queueName} com ${metrics.failed} jobs falhados`,
        'error'
      );
      logger.error(`❌ Threshold de failed jobs excedido: ${metrics.queueName}`, new Error(`Threshold exceeded for ${metrics.queueName}`), { component: 'BullMQMetricsService' });
    }

    // Alerta: fila pausada
    if (metrics.paused) {
      captureMessage(
        `ALERTA: Fila ${metrics.queueName} está pausada`,
        'warning'
      );
      logger.warn(`⏸️ Fila pausada: ${metrics.queueName}`, { component: 'BullMQMetricsService' });
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
      logger.info('📊 BullMQ Metrics:', { component: 'BullMQMetricsService', metrics });
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
      logger.info(`🔌 QueueEvents fechado: ${queueName}`, { component: 'BullmqMetrics' });
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
      logger.info(`🧹 Cleanup executado na fila ${queueName}`, { component: 'BullmqMetrics' });
    } catch (error) {
      logger.error(`Erro ao fazer cleanup da fila ${queueName}`, error instanceof Error ? error : new Error(String(error)), { component: 'BullmqMetrics' });
      captureException(error as Error, { queueName });
    }
  }
}

// Singleton instance
export const bullMQMetrics = new BullMQMetricsService();
