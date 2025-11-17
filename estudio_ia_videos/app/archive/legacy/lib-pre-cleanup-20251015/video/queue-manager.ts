/**
 * Video Processing Queue Manager
 * 
 * Sistema robusto de gerenciamento de filas com:
 * - Priorização inteligente
 * - Retry logic com backoff exponencial
 * - Status tracking em tempo real
 * - Persistência de estado
 */

import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
import path from 'path';

// ==================== TYPES ====================

export enum QueuePriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  URGENT = 3
}

export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  RETRYING = 'retrying'
}

export interface QueueJob<T = any> {
  id: string;
  type: string;
  priority: QueuePriority;
  status: JobStatus;
  data: T;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  attempts: number;
  maxAttempts: number;
  error?: string;
  result?: any;
  metadata?: Record<string, unknown>;
}

export interface QueueConfig {
  maxConcurrent: number;      // Jobs simultâneos (padrão: 3)
  maxRetries: number;         // Tentativas máximas (padrão: 3)
  retryDelay: number;         // Delay base em ms (padrão: 1000)
  retryBackoff: number;       // Multiplicador de backoff (padrão: 2)
  persistPath?: string;       // Caminho para persistir fila
  autoStart?: boolean;        // Iniciar automaticamente (padrão: true)
}

export interface QueueStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  cancelled: number;
  retrying: number;
  averageProcessingTime: number;
}

export type JobProcessor<T = any, R = any> = (job: QueueJob<T>) => Promise<R>;

// ==================== EVENTS ====================

export interface QueueEvents {
  'job:added': (job: QueueJob) => void;
  'job:started': (job: QueueJob) => void;
  'job:completed': (job: QueueJob, result: any) => void;
  'job:failed': (job: QueueJob, error: Error) => void;
  'job:retry': (job: QueueJob, attempt: number) => void;
  'job:cancelled': (job: QueueJob) => void;
  'queue:empty': () => void;
  'queue:drained': () => void;
}

// ==================== QUEUE MANAGER CLASS ====================

export class VideoProcessingQueue extends EventEmitter {
  private jobs: Map<string, QueueJob>;
  private processors: Map<string, JobProcessor>;
  private config: Required<QueueConfig>;
  private processing: Set<string>;
  private stats: Map<string, number[]>; // Processing times
  private isRunning: boolean;
  private processingInterval?: NodeJS.Timeout;

  constructor(config?: Partial<QueueConfig>) {
    super();

    this.config = {
      maxConcurrent: config?.maxConcurrent ?? 3,
      maxRetries: config?.maxRetries ?? 3,
      retryDelay: config?.retryDelay ?? 1000,
      retryBackoff: config?.retryBackoff ?? 2,
      persistPath: config?.persistPath ?? path.join(process.cwd(), 'data', 'queue'),
      autoStart: config?.autoStart ?? true
    };

    this.jobs = new Map();
    this.processors = new Map();
    this.processing = new Set();
    this.stats = new Map();
    this.isRunning = false;

    if (this.config.autoStart) {
      this.start();
    }
  }

  // ==================== PUBLIC METHODS ====================

  /**
   * Adiciona um job à fila
   */
  async addJob<T>(
    type: string,
    data: T,
    options?: {
      priority?: QueuePriority;
      maxAttempts?: number;
      metadata?: Record<string, unknown>;
    }
  ): Promise<string> {
    const job: QueueJob<T> = {
      id: this.generateJobId(),
      type,
      priority: options?.priority ?? QueuePriority.NORMAL,
      status: JobStatus.PENDING,
      data,
      createdAt: new Date(),
      attempts: 0,
      maxAttempts: options?.maxAttempts ?? this.config.maxRetries,
      metadata: options?.metadata
    };

    this.jobs.set(job.id, job);
    this.emit('job:added', job);

    await this.persist();
    
    return job.id;
  }

  /**
   * Registra um processador para um tipo de job
   */
  registerProcessor<T, R>(type: string, processor: JobProcessor<T, R>): void {
    this.processors.set(type, processor);
  }

  /**
   * Inicia o processamento da fila
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.processingInterval = setInterval(() => {
      this.processNext();
    }, 100);
  }

  /**
   * Para o processamento da fila
   */
  stop(): void {
    this.isRunning = false;
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
  }

  /**
   * Cancela um job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    if (job.status === JobStatus.PROCESSING) {
      // Não pode cancelar job em processamento
      return false;
    }

    job.status = JobStatus.CANCELLED;
    job.completedAt = new Date();
    
    this.emit('job:cancelled', job);
    await this.persist();

    return true;
  }

  /**
   * Reprocessa um job falho
   */
  async retryJob(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== JobStatus.FAILED) return false;

    job.status = JobStatus.PENDING;
    job.attempts = 0;
    job.error = undefined;
    
    await this.persist();
    return true;
  }

  /**
   * Obtém informações de um job
   */
  getJob(jobId: string): QueueJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Lista jobs por status
   */
  getJobsByStatus(status: JobStatus): QueueJob[] {
    return Array.from(this.jobs.values())
      .filter(job => job.status === status);
  }

  /**
   * Obtém estatísticas da fila
   */
  getStats(): QueueStats {
    const jobs = Array.from(this.jobs.values());

    const stats: QueueStats = {
      total: jobs.length,
      pending: jobs.filter(j => j.status === JobStatus.PENDING).length,
      processing: jobs.filter(j => j.status === JobStatus.PROCESSING).length,
      completed: jobs.filter(j => j.status === JobStatus.COMPLETED).length,
      failed: jobs.filter(j => j.status === JobStatus.FAILED).length,
      cancelled: jobs.filter(j => j.status === JobStatus.CANCELLED).length,
      retrying: jobs.filter(j => j.status === JobStatus.RETRYING).length,
      averageProcessingTime: this.calculateAverageProcessingTime()
    };

    return stats;
  }

  /**
   * Limpa jobs concluídos
   */
  async clearCompleted(): Promise<number> {
    const completed = this.getJobsByStatus(JobStatus.COMPLETED);
    completed.forEach(job => this.jobs.delete(job.id));
    
    await this.persist();
    return completed.length;
  }

  /**
   * Limpa todos os jobs
   */
  async clearAll(): Promise<void> {
    this.jobs.clear();
    this.stats.clear();
    await this.persist();
  }

  // ==================== PRIVATE METHODS ====================

  private async processNext(): Promise<void> {
    if (this.processing.size >= this.config.maxConcurrent) {
      return;
    }

    const job = this.getNextJob();
    if (!job) {
      if (this.processing.size === 0 && this.jobs.size === 0) {
        this.emit('queue:empty');
      }
      return;
    }

    await this.processJob(job);
  }

  private getNextJob(): QueueJob | undefined {
    const pending = Array.from(this.jobs.values())
      .filter(job => job.status === JobStatus.PENDING)
      .sort((a, b) => {
        // Ordenar por prioridade (maior primeiro)
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        // Em caso de empate, ordenar por data de criação (mais antigo primeiro)
        return a.createdAt.getTime() - b.createdAt.getTime();
      });

    return pending[0];
  }

  private async processJob(job: QueueJob): Promise<void> {
    const processor = this.processors.get(job.type);
    if (!processor) {
      job.status = JobStatus.FAILED;
      job.error = `Processador não encontrado para tipo: ${job.type}`;
      job.completedAt = new Date();
      this.emit('job:failed', job, new Error(job.error));
      await this.persist();
      return;
    }

    this.processing.add(job.id);
    job.status = JobStatus.PROCESSING;
    job.startedAt = new Date();
    job.attempts++;

    this.emit('job:started', job);

    const startTime = Date.now();

    try {
      const result = await processor(job);
      
      job.status = JobStatus.COMPLETED;
      job.result = result;
      job.completedAt = new Date();

      this.recordProcessingTime(job.type, Date.now() - startTime);
      this.emit('job:completed', job, result);

    } catch (error) {
      await this.handleJobError(job, error as Error);
    } finally {
      this.processing.delete(job.id);
      await this.persist();

      // Verificar se fila foi drenada
      if (this.processing.size === 0 && this.getJobsByStatus(JobStatus.PENDING).length === 0) {
        this.emit('queue:drained');
      }
    }
  }

  private async handleJobError(job: QueueJob, error: Error): Promise<void> {
    job.error = error.message;

    if (job.attempts < job.maxAttempts) {
      // Retry com backoff exponencial
      job.status = JobStatus.RETRYING;
      
      const delay = this.config.retryDelay * Math.pow(this.config.retryBackoff, job.attempts - 1);
      
      this.emit('job:retry', job, job.attempts);

      setTimeout(() => {
        job.status = JobStatus.PENDING;
      }, delay);

    } else {
      // Falha definitiva
      job.status = JobStatus.FAILED;
      job.completedAt = new Date();
      this.emit('job:failed', job, error);
    }
  }

  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private recordProcessingTime(type: string, time: number): void {
    if (!this.stats.has(type)) {
      this.stats.set(type, []);
    }
    
    const times = this.stats.get(type)!;
    times.push(time);

    // Manter apenas últimas 100 medições
    if (times.length > 100) {
      times.shift();
    }
  }

  private calculateAverageProcessingTime(): number {
    const allTimes: number[] = [];
    
    this.stats.forEach(times => {
      allTimes.push(...times);
    });

    if (allTimes.length === 0) return 0;

    const sum = allTimes.reduce((a, b) => a + b, 0);
    return sum / allTimes.length;
  }

  private async persist(): Promise<void> {
    if (!this.config.persistPath) return;

    try {
      await fs.mkdir(this.config.persistPath, { recursive: true });
      
      const data = {
        jobs: Array.from(this.jobs.entries()),
        stats: Array.from(this.stats.entries()),
        timestamp: new Date().toISOString()
      };

      const filePath = path.join(this.config.persistPath, 'queue-state.json');
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));

    } catch (error) {
      console.error('Erro ao persistir fila:', error);
    }
  }

  /**
   * Restaura estado da fila
   */
  async restore(): Promise<void> {
    if (!this.config.persistPath) return;

    try {
      const filePath = path.join(this.config.persistPath, 'queue-state.json');
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);

      this.jobs = new Map(data.jobs.map(([id, job]: [string, any]) => {
        // Converter strings de data para objetos Date
        job.createdAt = new Date(job.createdAt);
        if (job.startedAt) job.startedAt = new Date(job.startedAt);
        if (job.completedAt) job.completedAt = new Date(job.completedAt);
        
        // Resetar jobs que estavam em processamento
        if (job.status === JobStatus.PROCESSING) {
          job.status = JobStatus.PENDING;
        }

        return [id, job];
      }));

      this.stats = new Map(data.stats);

    } catch (error) {
      // Arquivo não existe ou erro ao ler - ignorar
    }
  }
}

// ==================== SINGLETON INSTANCE ====================

let queueInstance: VideoProcessingQueue | null = null;

/**
 * Obtém instância singleton da fila
 */
export function getQueue(config?: Partial<QueueConfig>): VideoProcessingQueue {
  if (!queueInstance) {
    queueInstance = new VideoProcessingQueue(config);
  }
  return queueInstance;
}

/**
 * Reseta instância singleton (útil para testes)
 */
export function resetQueue(): void {
  if (queueInstance) {
    queueInstance.stop();
    queueInstance = null;
  }
}

export default VideoProcessingQueue;
