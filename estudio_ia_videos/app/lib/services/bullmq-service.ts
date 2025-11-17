/**
 * BullMQ Service
 * Serviço centralizado para filas BullMQ
 * Conforme padrão estabelecido em supabase-client.ts
 */

import { Queue, Worker, QueueEvents, ConnectionOptions, Job } from 'bullmq';
import { getRedisClient } from './redis-service';

// =====================================
// Types
// =====================================

export interface VideoRenderJobData {
  projectId: string;
  userId: string;
  settings: {
    resolution: string;
    fps: number;
    format: string;
    quality: string;
  };
  slides: Array<{
    id: string;
    content: string;
    duration: number;
  }>;
}

export interface JobProgress {
  percentage: number;
  currentStep: string;
  totalSlides?: number;
  currentSlide?: number;
}

// =====================================
// Queue Configuration
// =====================================

const QUEUE_NAME = 'video-render-queue';

function getConnectionOptions(): ConnectionOptions {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const url = new URL(redisUrl);

  return {
    host: url.hostname,
    port: parseInt(url.port || '6379', 10),
    password: url.password || undefined,
    maxRetriesPerRequest: 3,
  };
}

// =====================================
// Queue Instances (Singleton Pattern)
// =====================================

let queueInstance: Queue<VideoRenderJobData> | null = null;
let eventsInstance: QueueEvents | null = null;
let metricsInterval: NodeJS.Timer | null = null;

/**
 * Obtém instância singleton da fila de renderização
 */
export function getVideoRenderQueue(): Queue<VideoRenderJobData> {
  if (!queueInstance) {
    queueInstance = new Queue<VideoRenderJobData>(QUEUE_NAME, {
      connection: getConnectionOptions(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: {
          count: 100, // Mantém últimos 100 jobs completados
        },
        removeOnFail: {
          count: 500, // Mantém últimos 500 jobs falhos
        },
      },
    });

    queueInstance.on('error', (err) => {
      console.error('[BullMQ Queue] Error:', err);
    });
  }

  return queueInstance;
}

/**
 * Obtém instância de eventos da fila
 */
export function getQueueEvents(): QueueEvents {
  if (!eventsInstance) {
    eventsInstance = new QueueEvents(QUEUE_NAME, {
      connection: getConnectionOptions(),
    });

    eventsInstance.on('error', (err) => {
      console.error('[BullMQ Events] Error:', err);
    });
  }

  return eventsInstance;
}

/**
 * Cria worker para processar jobs de renderização
 * @param processor Função que processa cada job
 */
export function createVideoRenderWorker(
  processor: (job: Job<VideoRenderJobData>) => Promise<unknown>
): Worker<VideoRenderJobData> {
  const worker = new Worker<VideoRenderJobData>(QUEUE_NAME, processor, {
    connection: getConnectionOptions(),
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '2', 10),
  });

  worker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err);
  });

  worker.on('error', (err) => {
    console.error('[Worker] Error:', err);
  });

  return worker;
}

// =====================================
// Queue Operations
// =====================================

/**
 * Adiciona job de renderização à fila
 */
export async function addRenderJob(
  data: VideoRenderJobData,
  options?: {
    priority?: number;
    delay?: number;
    jobId?: string;
  }
) {
  const queue = getVideoRenderQueue();
  
  return queue.add('render-video', data, {
    priority: options?.priority,
    delay: options?.delay,
    jobId: options?.jobId,
  });
}

/**
 * Obtém status de um job
 */
export async function getJobStatus(jobId: string) {
  const queue = getVideoRenderQueue();
  const job = await queue.getJob(jobId);
  
  if (!job) {
    return null;
  }

  const state = await job.getState();
  const progress = job.progress;

  return {
    id: job.id,
    state,
    progress,
    data: job.data,
    returnvalue: job.returnvalue,
    failedReason: job.failedReason,
    processedOn: job.processedOn,
    finishedOn: job.finishedOn,
  };
}

/**
 * Cancela um job
 */
export async function cancelJob(jobId: string): Promise<boolean> {
  const queue = getVideoRenderQueue();
  const job = await queue.getJob(jobId);
  
  if (!job) {
    return false;
  }

  await job.remove();
  return true;
}

/**
 * Obtém métricas da fila
 */
export async function getQueueMetrics() {
  const queue = getVideoRenderQueue();
  
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    total: waiting + active + completed + failed + delayed,
  };
}

/**
 * Inicia polling periódico de métricas da fila.
 * Loga JSON estruturado (pode ser ingerido por agregadores). Futuro: enviar para Sentry/Grafana.
 */
export function startQueueMetricsPolling(intervalMs: number = 30000) {
  if (metricsInterval) return; // já ativo
  metricsInterval = setInterval(async () => {
    try {
      const m = await getQueueMetrics();
      // Formato estruturado para futura ingestão
      console.log(
        JSON.stringify({
          ts: new Date().toISOString(),
          type: 'bullmq.metrics',
          queue: QUEUE_NAME,
          ...m,
        })
      );
    } catch (err) {
      console.error('[BullMQ Metrics Polling] Error:', err);
    }
  }, intervalMs);
}

/** Para encerrar polling manualmente (ex.: em testes) */
export function stopQueueMetricsPolling() {
  if (metricsInterval) {
    clearInterval(metricsInterval);
    metricsInterval = null;
  }
}

/**
 * Limpa jobs antigos
 */
export async function cleanQueue(options?: {
  grace?: number;
  status?: 'completed' | 'failed';
}) {
  const queue = getVideoRenderQueue();
  
  await queue.clean(
    options?.grace || 24 * 3600 * 1000, // 24 horas por padrão
    100,
    options?.status || 'completed'
  );
}

/**
 * Fecha todas as conexões BullMQ
 */
export async function closeBullMQ(): Promise<void> {
  const promises: Promise<void>[] = [];

  if (queueInstance) {
    promises.push(queueInstance.close());
    queueInstance = null;
  }

  if (eventsInstance) {
    promises.push(eventsInstance.close());
    eventsInstance = null;
  }
  if (metricsInterval) {
    clearInterval(metricsInterval);
    metricsInterval = null;
  }

  await Promise.all(promises);
}
