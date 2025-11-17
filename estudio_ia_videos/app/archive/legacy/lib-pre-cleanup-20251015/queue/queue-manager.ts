/**
 * Sistema de Gerenciamento de Filas Avançado
 * Queue Manager com retry, DLQ, priorização e processamento paralelo
 * @module QueueManager
 * @version 1.0.0
 * @author Sistema IA Videos
 * @date 2025-10-11
 */

import Redis from 'ioredis';
import { EventEmitter } from 'events';

// ====================================
// TYPES & INTERFACES
// ====================================

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'retrying' | 'dead';
export type JobPriority = 'low' | 'normal' | 'high' | 'critical';

export interface Job<T = any> {
  id: string;
  type: string;
  data: T;
  priority: JobPriority;
  status: JobStatus;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  error?: string;
  result?: any;
  metadata?: Record<string, unknown>;
}

export interface QueueConfig {
  name: string;
  redis?: {
    host?: string;
    port?: number;
    password?: string;
    db?: number;
  };
  concurrency?: number;
  maxAttempts?: number;
  retryDelay?: number;
  retryBackoff?: 'fixed' | 'exponential' | 'linear';
  timeout?: number;
  enableDLQ?: boolean;
  enableMetrics?: boolean;
  cleanupInterval?: number;
  jobTTL?: number;
}

export interface QueueMetrics {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  retrying: number;
  dead: number;
  throughput: number;
  avgProcessingTime: number;
  successRate: number;
}

export interface JobProcessor<T = any> {
  (job: Job<T>): Promise<any>;
}

// ====================================
// QUEUE MANAGER CLASS
// ====================================

export class QueueManager extends EventEmitter {
  private config: Required<QueueConfig>;
  private redis: Redis;
  private processors: Map<string, JobProcessor>;
  private activeJobs: Set<string>;
  private metrics: Map<string, number>;
  private processingTimes: number[];
  private cleanupTimer?: NodeJS.Timeout;
  private isProcessing: boolean;

  constructor(config: QueueConfig) {
    super();
    
    this.config = {
      name: config.name,
      redis: config.redis || {},
      concurrency: config.concurrency ?? 5,
      maxAttempts: config.maxAttempts ?? 3,
      retryDelay: config.retryDelay ?? 1000,
      retryBackoff: config.retryBackoff ?? 'exponential',
      timeout: config.timeout ?? 30000,
      enableDLQ: config.enableDLQ ?? true,
      enableMetrics: config.enableMetrics ?? true,
      cleanupInterval: config.cleanupInterval ?? 60000,
      jobTTL: config.jobTTL ?? 86400000, // 24 horas
    };

    this.redis = new Redis({
      host: this.config.redis.host || process.env.REDIS_HOST || 'localhost',
      port: this.config.redis.port || parseInt(process.env.REDIS_PORT || '6379'),
      password: this.config.redis.password || process.env.REDIS_PASSWORD,
      db: this.config.redis.db || 0,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });

    this.processors = new Map();
    this.activeJobs = new Set();
    this.metrics = new Map();
    this.processingTimes = [];
    this.isProcessing = false;

    this.initializeMetrics();
    this.startCleanup();
  }

  // ====================================
  // JOB MANAGEMENT
  // ====================================

  /**
   * Adiciona job à fila
   */
  async addJob<T = any>(
    type: string,
    data: T,
    options: {
      priority?: JobPriority;
      maxAttempts?: number;
      metadata?: Record<string, unknown>;
    } = {}
  ): Promise<Job<T>> {
    const job: Job<T> = {
      id: this.generateJobId(),
      type,
      data,
      priority: options.priority || 'normal',
      status: 'pending',
      attempts: 0,
      maxAttempts: options.maxAttempts || this.config.maxAttempts,
      createdAt: new Date(),
      metadata: options.metadata,
    };

    // Salvar job no Redis
    await this.saveJob(job);

    // Adicionar à fila apropriada baseado na prioridade
    const queueKey = this.getQueueKey(job.priority);
    await this.redis.lpush(queueKey, job.id);

    this.incrementMetric('pending');
    this.emit('job:added', job);

    // Iniciar processamento se não estiver rodando
    if (!this.isProcessing) {
      this.startProcessing().catch(error => {
        this.emit('error', error);
      });
    }

    return job;
  }

  /**
   * Registra processador para tipo de job
   */
  registerProcessor<T = any>(type: string, processor: JobProcessor<T>): void {
    this.processors.set(type, processor as JobProcessor);
    this.emit('processor:registered', type);
  }

  /**
   * Remove processador
   */
  unregisterProcessor(type: string): void {
    this.processors.delete(type);
    this.emit('processor:unregistered', type);
  }

  /**
   * Obtém job por ID
   */
  async getJob(jobId: string): Promise<Job | null> {
    const key = this.getJobKey(jobId);
    const data = await this.redis.get(key);
    
    if (!data) return null;

    return JSON.parse(data, this.reviver);
  }

  /**
   * Obtém métricas da fila
   */
  async getMetrics(): Promise<QueueMetrics> {
    const pending = await this.getMetric('pending');
    const processing = await this.getMetric('processing');
    const completed = await this.getMetric('completed');
    const failed = await this.getMetric('failed');
    const retrying = await this.getMetric('retrying');
    const dead = await this.getMetric('dead');

    const total = completed + failed;
    const successRate = total > 0 ? (completed / total) * 100 : 0;

    const avgProcessingTime = this.processingTimes.length > 0
      ? this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length
      : 0;

    return {
      pending,
      processing,
      completed,
      failed,
      retrying,
      dead,
      throughput: completed,
      avgProcessingTime,
      successRate,
    };
  }

  /**
   * Limpa jobs completados antigos
   */
  async cleanup(olderThan?: number): Promise<number> {
    const maxAge = olderThan || this.config.jobTTL;
    const cutoff = Date.now() - maxAge;
    let cleaned = 0;

    // Buscar todos os jobs completados
    const pattern = `${this.config.name}:job:*`;
    const keys = await this.redis.keys(pattern);

    for (const key of keys) {
      const data = await this.redis.get(key);
      if (!data) continue;

      const job = JSON.parse(data, this.reviver);
      
      if (
        (job.status === 'completed' || job.status === 'dead') &&
        job.completedAt &&
        new Date(job.completedAt).getTime() < cutoff
      ) {
        await this.redis.del(key);
        cleaned++;
      }
    }

    this.emit('cleanup:completed', cleaned);
    return cleaned;
  }

  /**
   * Pausa processamento da fila
   */
  pause(): void {
    this.isProcessing = false;
    this.emit('queue:paused');
  }

  /**
   * Retoma processamento da fila
   */
  resume(): void {
    if (!this.isProcessing) {
      this.startProcessing().catch(error => {
        this.emit('error', error);
      });
    }
  }

  /**
   * Encerra queue manager
   */
  async close(): Promise<void> {
    this.pause();
    
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    // Aguardar jobs ativos finalizarem
    while (this.activeJobs.size > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    await this.redis.quit();
    this.emit('queue:closed');
  }

  // ====================================
  // INTERNAL METHODS
  // ====================================

  /**
   * Inicia processamento de jobs
   */
  private async startProcessing(): Promise<void> {
    this.isProcessing = true;
    this.emit('queue:started');

    while (this.isProcessing) {
      // Respeitar limite de concorrência
      if (this.activeJobs.size >= this.config.concurrency) {
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      }

      // Buscar próximo job (prioridade)
      const job = await this.getNextJob();
      
      if (!job) {
        await new Promise(resolve => setTimeout(resolve, 500));
        continue;
      }

      // Processar job de forma assíncrona
      this.processJob(job).catch(error => {
        this.emit('error', error);
      });
    }
  }

  /**
   * Obtém próximo job da fila (baseado em prioridade)
   */
  private async getNextJob(): Promise<Job | null> {
    const priorities: JobPriority[] = ['critical', 'high', 'normal', 'low'];

    for (const priority of priorities) {
      const queueKey = this.getQueueKey(priority);
      const jobId = await this.redis.rpop(queueKey);

      if (jobId) {
        const job = await this.getJob(jobId);
        if (job) return job;
      }
    }

    return null;
  }

  /**
   * Processa um job
   */
  private async processJob(job: Job): Promise<void> {
    this.activeJobs.add(job.id);
    const startTime = Date.now();

    try {
      // Atualizar status
      job.status = 'processing';
      job.processedAt = new Date();
      await this.saveJob(job);

      this.decrementMetric('pending');
      this.incrementMetric('processing');
      this.emit('job:processing', job);

      // Obter processador
      const processor = this.processors.get(job.type);
      
      if (!processor) {
        throw new Error(`No processor registered for job type: ${job.type}`);
      }

      // Executar com timeout
      const result = await Promise.race([
        processor(job),
        this.timeout(this.config.timeout, `Job timeout after ${this.config.timeout}ms`),
      ]);

      // Job completado com sucesso
      job.status = 'completed';
      job.completedAt = new Date();
      job.result = result;
      await this.saveJob(job);

      this.decrementMetric('processing');
      this.incrementMetric('completed');

      const processingTime = Date.now() - startTime;
      this.recordProcessingTime(processingTime);

      this.emit('job:completed', job, result);
    } catch (error) {
      await this.handleJobFailure(job, error as Error);
    } finally {
      this.activeJobs.delete(job.id);
    }
  }

  /**
   * Trata falha no processamento
   */
  private async handleJobFailure(job: Job, error: Error): Promise<void> {
    job.attempts++;
    job.error = error.message;
    job.failedAt = new Date();

    this.decrementMetric('processing');

    // Verificar se deve fazer retry
    if (job.attempts < job.maxAttempts) {
      job.status = 'retrying';
      await this.saveJob(job);

      const delay = this.calculateRetryDelay(job.attempts);
      
      this.incrementMetric('retrying');
      this.emit('job:retrying', job, delay);

      // Re-adicionar à fila após delay
      setTimeout(async () => {
        const queueKey = this.getQueueKey(job.priority);
        await this.redis.lpush(queueKey, job.id);
        
        job.status = 'pending';
        await this.saveJob(job);

        this.decrementMetric('retrying');
        this.incrementMetric('pending');
      }, delay);
    } else {
      // Job falhou definitivamente
      job.status = 'failed';
      await this.saveJob(job);

      this.incrementMetric('failed');
      this.emit('job:failed', job, error);

      // Mover para Dead Letter Queue se habilitado
      if (this.config.enableDLQ) {
        await this.moveToDLQ(job);
      }
    }
  }

  /**
   * Move job para Dead Letter Queue
   */
  private async moveToDLQ(job: Job): Promise<void> {
    const dlqKey = `${this.config.name}:dlq`;
    await this.redis.lpush(dlqKey, job.id);

    job.status = 'dead';
    await this.saveJob(job);

    this.incrementMetric('dead');
    this.emit('job:dead', job);
  }

  /**
   * Calcula delay para retry
   */
  private calculateRetryDelay(attempt: number): number {
    const baseDelay = this.config.retryDelay;

    switch (this.config.retryBackoff) {
      case 'fixed':
        return baseDelay;
      case 'linear':
        return baseDelay * attempt;
      case 'exponential':
        return baseDelay * Math.pow(2, attempt - 1);
      default:
        return baseDelay;
    }
  }

  /**
   * Salva job no Redis
   */
  private async saveJob(job: Job): Promise<void> {
    const key = this.getJobKey(job.id);
    await this.redis.set(key, JSON.stringify(job), 'EX', 604800); // 7 dias
  }

  /**
   * Inicializa métricas
   */
  private initializeMetrics(): void {
    const metrics: JobStatus[] = ['pending', 'processing', 'completed', 'failed', 'retrying', 'dead'];
    metrics.forEach(metric => {
      this.metrics.set(metric, 0);
    });
  }

  /**
   * Incrementa métrica
   */
  private incrementMetric(metric: string): void {
    const current = this.metrics.get(metric) || 0;
    this.metrics.set(metric, current + 1);
  }

  /**
   * Decrementa métrica
   */
  private decrementMetric(metric: string): void {
    const current = this.metrics.get(metric) || 0;
    this.metrics.set(metric, Math.max(0, current - 1));
  }

  /**
   * Obtém valor de métrica
   */
  private async getMetric(metric: string): Promise<number> {
    return this.metrics.get(metric) || 0;
  }

  /**
   * Registra tempo de processamento
   */
  private recordProcessingTime(time: number): void {
    this.processingTimes.push(time);
    
    // Manter apenas últimos 1000 registros
    if (this.processingTimes.length > 1000) {
      this.processingTimes.shift();
    }
  }

  /**
   * Inicia limpeza automática
   */
  private startCleanup(): void {
    if (this.config.cleanupInterval > 0) {
      this.cleanupTimer = setInterval(() => {
        this.cleanup().catch(error => {
          this.emit('error', error);
        });
      }, this.config.cleanupInterval);
    }
  }

  /**
   * Gera ID único para job
   */
  private generateJobId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Obtém chave Redis para job
   */
  private getJobKey(jobId: string): string {
    return `${this.config.name}:job:${jobId}`;
  }

  /**
   * Obtém chave Redis para fila por prioridade
   */
  private getQueueKey(priority: JobPriority): string {
    return `${this.config.name}:queue:${priority}`;
  }

  /**
   * Cria promise com timeout
   */
  private timeout(ms: number, message: string): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    });
  }

  /**
   * Reviver para JSON.parse com datas
   */
  private reviver(key: string, value: any): any {
    if (typeof value === 'string') {
      const datePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
      if (datePattern.test(value)) {
        return new Date(value);
      }
    }
    return value;
  }
}

// ====================================
// FACTORY FUNCTIONS
// ====================================

/**
 * Cria queue manager básico
 */
export function createBasicQueue(name: string): QueueManager {
  return new QueueManager({
    name,
    concurrency: 3,
    maxAttempts: 1,
    enableDLQ: false,
  });
}

/**
 * Cria queue manager com retry
 */
export function createResilientQueue(name: string): QueueManager {
  return new QueueManager({
    name,
    concurrency: 5,
    maxAttempts: 3,
    retryBackoff: 'exponential',
    enableDLQ: true,
  });
}

/**
 * Cria queue manager de alta performance
 */
export function createHighPerformanceQueue(name: string): QueueManager {
  return new QueueManager({
    name,
    concurrency: 10,
    maxAttempts: 3,
    retryBackoff: 'exponential',
    enableDLQ: true,
    enableMetrics: true,
    cleanupInterval: 30000,
  });
}

// ====================================
// EXPORTS
// ====================================

export default QueueManager;
