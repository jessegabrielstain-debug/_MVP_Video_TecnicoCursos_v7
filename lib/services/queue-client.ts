/**
 * Queue Client - Serviço centralizado para gerenciamento de filas BullMQ
 * 
 * Responsabilidades:
 * - Gerenciar filas de processamento assíncrono
 * - Fornecer interface unificada para adicionar jobs
 * - Monitorar saúde e métricas das filas
 * - Logging estruturado de operações
 * 
 * @module lib/services/queue-client
 */

import { Queue, QueueEvents, JobsOptions } from 'bullmq';
import { redisClient } from './redis-client';

interface QueueConfig {
  name: string;
  connection?: {
    host: string;
    port: number;
    password?: string;
  };
  defaultJobOptions?: JobsOptions;
}

interface JobData {
  type: string;
  payload: Record<string, unknown>;
  metadata?: {
    userId?: string;
    projectId?: string;
    priority?: 'low' | 'normal' | 'high';
  };
}

interface QueueMetrics {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
}

class QueueClientService {
  private queues: Map<string, Queue> = new Map();
  private queueEvents: Map<string, QueueEvents> = new Map();
  private isInitialized: boolean = false;

  /**
   * Inicializa uma fila específica
   */
  private async initializeQueue(config: QueueConfig): Promise<Queue> {
    const { name, connection, defaultJobOptions } = config;

    // Usa conexão Redis existente se disponível
    const redisConnection = connection || this.getRedisConnection();

    const queue = new Queue(name, {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: 100, // Mantém últimos 100 jobs completados
        removeOnFail: 500, // Mantém últimos 500 jobs falhados
        ...defaultJobOptions,
      },
    });

    // Configura eventos para monitoramento
    const events = new QueueEvents(name, { connection: redisConnection });

    events.on('completed', ({ jobId }) => {
      console.log(`[QueueClient][${name}] Job completado: ${jobId}`);
    });

    events.on('failed', ({ jobId, failedReason }) => {
      console.error(`[QueueClient][${name}] Job falhou: ${jobId}`, failedReason);
    });

    events.on('progress', ({ jobId, data }) => {
      console.log(`[QueueClient][${name}] Progresso do job ${jobId}:`, data);
    });

    this.queues.set(name, queue);
    this.queueEvents.set(name, events);

    console.log(`[QueueClient] Fila inicializada: ${name}`);
    return queue;
  }

  /**
   * Obtém configuração de conexão Redis
   */
  private getRedisConnection() {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      throw new Error('[QueueClient] Variáveis de ambiente Redis ausentes');
    }

    // Parse URL para extrair host e port
    const urlObj = new URL(url);
    
    return {
      host: urlObj.hostname,
      port: parseInt(urlObj.port || '6379', 10),
      password: token,
    };
  }

  /**
   * Obtém ou cria uma fila
   */
  public async getQueue(name: string, config?: Partial<QueueConfig>): Promise<Queue> {
    if (this.queues.has(name)) {
      return this.queues.get(name)!;
    }

    return this.initializeQueue({
      name,
      ...config,
    });
  }

  /**
   * Adiciona job à fila
   */
  public async addJob(
    queueName: string,
    jobData: JobData,
    options?: JobsOptions
  ): Promise<string | null> {
    try {
      const queue = await this.getQueue(queueName);
      
      const job = await queue.add(
        jobData.type,
        {
          ...jobData.payload,
          metadata: jobData.metadata,
        },
        {
          ...options,
          priority: this.getPriorityValue(jobData.metadata?.priority),
        }
      );

      console.log(`[QueueClient][${queueName}] Job adicionado: ${job.id}`);
      return job.id || null;
    } catch (error) {
      console.error(`[QueueClient] Erro ao adicionar job:`, error);
      return null;
    }
  }

  /**
   * Converte prioridade string para número
   */
  private getPriorityValue(priority?: string): number {
    switch (priority) {
      case 'high':
        return 1;
      case 'normal':
        return 5;
      case 'low':
        return 10;
      default:
        return 5;
    }
  }

  /**
   * Obtém métricas de uma fila
   */
  public async getMetrics(queueName: string): Promise<QueueMetrics | null> {
    try {
      const queue = await this.getQueue(queueName);

      const [waiting, active, completed, failed, delayed, isPaused] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
        queue.getDelayedCount(),
        queue.isPaused(),
      ]);

      return {
        waiting,
        active,
        completed,
        failed,
        delayed,
        paused: isPaused,
      };
    } catch (error) {
      console.error(`[QueueClient] Erro ao obter métricas:`, error);
      return null;
    }
  }

  /**
   * Pausa uma fila
   */
  public async pauseQueue(queueName: string): Promise<boolean> {
    try {
      const queue = await this.getQueue(queueName);
      await queue.pause();
      console.log(`[QueueClient] Fila pausada: ${queueName}`);
      return true;
    } catch (error) {
      console.error(`[QueueClient] Erro ao pausar fila:`, error);
      return false;
    }
  }

  /**
   * Resume uma fila
   */
  public async resumeQueue(queueName: string): Promise<boolean> {
    try {
      const queue = await this.getQueue(queueName);
      await queue.resume();
      console.log(`[QueueClient] Fila resumida: ${queueName}`);
      return true;
    } catch (error) {
      console.error(`[QueueClient] Erro ao resumir fila:`, error);
      return false;
    }
  }

  /**
   * Remove job específico
   */
  public async removeJob(queueName: string, jobId: string): Promise<boolean> {
    try {
      const queue = await this.getQueue(queueName);
      const job = await queue.getJob(jobId);
      
      if (job) {
        await job.remove();
        console.log(`[QueueClient][${queueName}] Job removido: ${jobId}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`[QueueClient] Erro ao remover job:`, error);
      return false;
    }
  }

  /**
   * Limpa jobs completados e falhados
   */
  public async cleanQueue(
    queueName: string,
    grace: number = 3600000 // 1 hora em ms
  ): Promise<boolean> {
    try {
      const queue = await this.getQueue(queueName);
      
      await Promise.all([
        queue.clean(grace, 100, 'completed'),
        queue.clean(grace, 100, 'failed'),
      ]);

      console.log(`[QueueClient][${queueName}] Fila limpa (grace: ${grace}ms)`);
      return true;
    } catch (error) {
      console.error(`[QueueClient] Erro ao limpar fila:`, error);
      return false;
    }
  }

  /**
   * Health check de uma fila
   */
  public async healthCheck(queueName: string): Promise<{
    healthy: boolean;
    metrics?: QueueMetrics;
    error?: string;
  }> {
    try {
      if (!this.queues.has(queueName)) {
        return { healthy: false, error: 'Fila não inicializada' };
      }

      const metrics = await this.getMetrics(queueName);
      
      if (!metrics) {
        return { healthy: false, error: 'Não foi possível obter métricas' };
      }

      // Considera unhealthy se tiver muitos jobs falhados ou ativos travados
      const healthy = metrics.failed < 100 && metrics.active < 50;

      return {
        healthy,
        metrics,
        error: healthy ? undefined : 'Métricas fora dos limites aceitáveis',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      return { healthy: false, error: errorMessage };
    }
  }

  /**
   * Encerra todas as conexões
   */
  public async close(): Promise<void> {
    const closePromises: Promise<void>[] = [];

    for (const [name, queue] of this.queues.entries()) {
      closePromises.push(
        queue.close().then(() => {
          console.log(`[QueueClient] Fila fechada: ${name}`);
        })
      );
    }

    for (const [name, events] of this.queueEvents.entries()) {
      closePromises.push(
        events.close().then(() => {
          console.log(`[QueueClient] Eventos fechados: ${name}`);
        })
      );
    }

    await Promise.all(closePromises);
    
    this.queues.clear();
    this.queueEvents.clear();
    this.isInitialized = false;
  }

  /**
   * Obtém lista de filas ativas
   */
  public getActiveQueues(): string[] {
    return Array.from(this.queues.keys());
  }
}

// Singleton instance
export const queueClient = new QueueClientService();

// Re-exporta tipos úteis
export type { JobData, QueueMetrics, QueueConfig };
