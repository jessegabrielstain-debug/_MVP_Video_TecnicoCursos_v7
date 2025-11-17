/**
 * 🎬 RenderQueue - Sistema de Filas para Processamento de Vídeos
 * Implementação robusta usando Redis para gerenciar filas de renderização
 */

import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

export interface RenderJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  type: 'video' | 'presentation';
  data: {
    userId: string;
    projectId: string;
    sourceFile: string;
    outputFormat: string;
    quality: string;
    settings: Record<string, unknown>;
  };
  progress: number;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export class RenderQueue {
  private static instance: RenderQueue;
  private redis: Redis;
  private readonly queueKey = 'render:queue';
  private readonly jobsKey = 'render:jobs';
  private readonly jobLockKey = 'render:locks';

  private constructor() {
    if (!process.env.REDIS_URL) {
      throw new Error('REDIS_URL não configurada');
    }

    this.redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      enableOfflineQueue: false
    });

    this.setupErrorHandling();
  }

  public static getInstance(): RenderQueue {
    if (!RenderQueue.instance) {
      RenderQueue.instance = new RenderQueue();
    }
    return RenderQueue.instance;
  }

  private setupErrorHandling(): void {
    this.redis.on('error', (error) => {
      console.error('❌ Erro na conexão Redis:', error);
    });

    this.redis.on('connect', () => {
      console.log('✅ Conectado ao Redis');
    });
  }

  /**
   * Adiciona um novo job à fila de renderização
   */
  public async addJob(jobData: Omit<RenderJob['data'], 'id'>): Promise<string> {
    const jobId = uuidv4();
    const job: RenderJob = {
      id: jobId,
      status: 'pending',
      type: jobData.sourceFile.endsWith('.pptx') ? 'presentation' : 'video',
      data: {
        ...jobData,
      },
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const multi = this.redis.multi();
    
    // Salva os detalhes do job
    multi.hset(
      `${this.jobsKey}:${jobId}`,
      'data',
      JSON.stringify(job)
    );

    // Adiciona à fila de processamento
    multi.lpush(this.queueKey, jobId);

    await multi.exec();
    
    console.log(`✨ Novo job adicionado: ${jobId}`);
    return jobId;
  }

  /**
   * Obtém o próximo job da fila para processamento
   */
  public async getNextJob(): Promise<RenderJob | null> {
    const jobId = await this.redis.rpop(this.queueKey);
    if (!jobId) return null;

    const jobData = await this.redis.hget(`${this.jobsKey}:${jobId}`, 'data');
    if (!jobData) return null;

    return JSON.parse(jobData);
  }

  /**
   * Atualiza o status e progresso de um job
   */
  public async updateJobProgress(
    jobId: string,
    progress: number,
    status?: RenderJob['status']
  ): Promise<void> {
    const jobData = await this.redis.hget(`${this.jobsKey}:${jobId}`, 'data');
    if (!jobData) throw new Error(`Job não encontrado: ${jobId}`);

    const job: RenderJob = JSON.parse(jobData);
    job.progress = progress;
    job.updatedAt = new Date();
    
    if (status) {
      job.status = status;
      if (status === 'processing' && !job.startedAt) {
        job.startedAt = new Date();
      } else if (['completed', 'failed', 'cancelled'].includes(status)) {
        job.completedAt = new Date();
      }
    }

    await this.redis.hset(
      `${this.jobsKey}:${jobId}`,
      'data',
      JSON.stringify(job)
    );
  }

  /**
   * Obtém o status atual de um job
   */
  public async getJobStatus(jobId: string): Promise<RenderJob | null> {
    const jobData = await this.redis.hget(`${this.jobsKey}:${jobId}`, 'data');
    if (!jobData) return null;
    return JSON.parse(jobData);
  }

  /**
   * Cancela um job em execução
   */
  public async cancelJob(jobId: string): Promise<boolean> {
    const jobData = await this.redis.hget(`${this.jobsKey}:${jobId}`, 'data');
    if (!jobData) return false;

    const job: RenderJob = JSON.parse(jobData);
    if (['completed', 'failed', 'cancelled'].includes(job.status)) {
      return false;
    }

    job.status = 'cancelled';
    job.completedAt = new Date();
    job.updatedAt = new Date();

    await this.redis.hset(
      `${this.jobsKey}:${jobId}`,
      'data',
      JSON.stringify(job)
    );

    return true;
  }

  /**
   * Lista todos os jobs ativos
   */
  public async listActiveJobs(): Promise<RenderJob[]> {
    const jobs: RenderJob[] = [];
    const cursor = '0';
    const pattern = `${this.jobsKey}:*`;
    
    do {
      const [newCursor, keys] = await this.redis.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100
      );

      for (const key of keys) {
        const jobData = await this.redis.hget(key, 'data');
        if (jobData) {
          const job: RenderJob = JSON.parse(jobData);
          if (['pending', 'processing'].includes(job.status)) {
            jobs.push(job);
          }
        }
      }

      if (newCursor === '0') break;
    } while (true);

    return jobs;
  }

  /**
   * Remove jobs antigos concluídos
   */
  public async cleanupOldJobs(olderThanDays: number = 7): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    
    let removedCount = 0;
    const cursor = '0';
    const pattern = `${this.jobsKey}:*`;

    do {
      const [newCursor, keys] = await this.redis.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100
      );

      for (const key of keys) {
        const jobData = await this.redis.hget(key, 'data');
        if (jobData) {
          const job: RenderJob = JSON.parse(jobData);
          if (
            ['completed', 'failed', 'cancelled'].includes(job.status) &&
            job.completedAt &&
            new Date(job.completedAt) < cutoffDate
          ) {
            await this.redis.del(key);
            removedCount++;
          }
        }
      }

      if (newCursor === '0') break;
    } while (true);

    return removedCount;
  }
}