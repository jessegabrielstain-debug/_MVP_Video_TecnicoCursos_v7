import EventEmitter from 'events';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import type { 
  JobStatus, 
  JobPriority, 
  JobOptions, 
  QueueJob, 
  QueueConfig, 
  QueueMetrics,
  JobProcessor,
  JobResult 
} from './types';

// Re-export types for backwards compatibility
export type { JobOptions, QueueConfig, QueueMetrics };

// Local Job interface that extends QueueJob for internal use
export interface Job<T = unknown> extends QueueJob<T> {
  result?: JobResult;
}

export class QueueManager extends EventEmitter {
  private jobs: Map<string, Job<unknown>> = new Map();
  private processors: Map<string, JobProcessor<unknown, unknown>> = new Map();
  private processing: Set<string> = new Set();
  private paused: boolean = false;
  private config: QueueConfig;
  private redis: Redis;
  private loopInterval: NodeJS.Timeout | null = null;
  private isClosing: boolean = false;

  constructor(config: QueueConfig | string) {
    super();
    if (typeof config === 'string') {
      this.config = { name: config, concurrency: 1, timeout: 30000 };
    } else {
      this.config = {
        concurrency: 1,
        timeout: 30000,
        ...config,
      };
    }
    this.redis = new Redis(this.config.redisUrl);
    this.startProcessingLoop();
  }

  async addJob<T = unknown>(type: string, data: T, options: JobOptions = {}): Promise<Job<T>> {
    const job: Job<T> = {
      id: uuidv4(),
      type,
      data,
      status: 'pending',
      priority: options.priority || 'normal',
      maxAttempts: options.maxAttempts || 3,
      attempts: 0,
      createdAt: new Date(),
    };

    this.jobs.set(job.id, job as Job<unknown>);
    this.emit('job:added', job);
    return job;
  }

  async getJob<T = unknown>(id: string): Promise<Job<T> | null> {
    return (this.jobs.get(id) as Job<T>) || null;
  }

  registerProcessor<T = unknown, R = unknown>(type: string, processor: JobProcessor<T, R>): void {
    this.processors.set(type, processor as JobProcessor<unknown, unknown>);
    this.emit('processor:registered', type);
  }

  pause(): void {
    this.paused = true;
    this.emit('queue:paused');
  }

  resume(): void {
    this.paused = false;
    this.emit('queue:resumed');
  }

  async cleanup(gracePeriod: number = 3600000): Promise<number> {
    const now = Date.now();
    let removed = 0;
    for (const [id, job] of this.jobs.entries()) {
      if (job.status === 'completed' || job.status === 'failed') {
        const finishedAt = job.completedAt || job.failedAt;
        if (finishedAt && now - finishedAt.getTime() > gracePeriod) {
          this.jobs.delete(id);
          removed++;
        }
      }
    }
    this.emit('cleanup:completed', removed);
    return removed;
  }

  async close(): Promise<void> {
    this.isClosing = true;
    if (this.loopInterval) {
      clearInterval(this.loopInterval);
    }
    
    // Wait for active jobs to finish
    while (this.processing.size > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.redis.disconnect();
  }

  async getMetrics(): Promise<QueueMetrics> {
    let completed = 0;
    let failed = 0;
    let totalProcessingTime = 0;
    let pending = 0;

    for (const job of this.jobs.values()) {
      if (job.status === 'completed') {
        completed++;
        if (job.processedAt && job.completedAt) {
          totalProcessingTime += job.completedAt.getTime() - job.processedAt.getTime();
        }
      } else if (job.status === 'failed') {
        failed++;
      } else if (job.status === 'pending') {
        pending++;
      }
    }

    const totalFinished = completed + failed;
    
    return {
      throughput: totalFinished, // Simplified
      successRate: totalFinished > 0 ? (completed / totalFinished) * 100 : 0,
      avgProcessingTime: completed > 0 ? totalProcessingTime / completed : 0,
      active: this.processing.size,
      pending,
      completed,
      failed,
    };
  }

  private startProcessingLoop() {
    this.loopInterval = setInterval(() => this.processNext(), 100);
  }

  private async processNext() {
    if (this.paused || this.isClosing) return;
    if (this.processing.size >= (this.config.concurrency || 1)) return;

    const job = this.getNextJob();
    if (!job) return;

    const processor = this.processors.get(job.type);
    if (!processor) {
      this.failJob(job, new Error(`No processor registered for job type ${job.type}`));
      return;
    }

    this.processing.add(job.id);
    job.status = 'processing';
    job.attempts++;
    job.processedAt = new Date();
    this.emit('job:processing', job);

    try {
      // Handle timeout
      const timeoutPromise = new Promise((_, reject) => {
        if (this.config.timeout) {
          setTimeout(() => reject(new Error('Job timeout')), this.config.timeout);
        }
      });

      const result = await Promise.race([
        processor(job),
        timeoutPromise
      ]);

      job.status = 'completed';
      job.completedAt = new Date();
      job.result = result;
      this.emit('job:completed', job);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (job.attempts < job.maxAttempts) {
        job.status = 'retrying';
        job.error = errorMessage;
        this.emit('job:retrying', job);
        // Re-queue logic is implicit as status is not 'completed' or 'failed' (except 'retrying' needs to be handled in getNextJob)
        // Actually, getNextJob should pick 'pending' or 'retrying'.
        // But for 'retrying', we might want a delay. For now, immediate retry.
        job.status = 'pending'; // Put back to pending for retry
      } else {
        this.failJob(job, error instanceof Error ? error : new Error(errorMessage));
      }
    } finally {
      this.processing.delete(job.id);
    }
  }

  private getNextJob(): Job<unknown> | undefined {
    // Priority order: high, normal, low
    const pendingJobs = Array.from(this.jobs.values()).filter(j => j.status === 'pending');
    
    const high = pendingJobs.filter(j => j.priority === 'high');
    if (high.length > 0) return high[0]; // FIFO within priority

    const normal = pendingJobs.filter(j => j.priority === 'normal');
    if (normal.length > 0) return normal[0];

    const low = pendingJobs.filter(j => j.priority === 'low');
    if (low.length > 0) return low[0];

    return undefined;
  }

  private failJob(job: Job<unknown>, error: Error): void {
    job.status = 'failed';
    job.failedAt = new Date();
    job.error = error.message;
    this.emit('job:failed', job);
    // Dead Letter Queue logic could be here (emit job:dead)
    this.emit('job:dead', job);
  }
}

export function createBasicQueue(name: string) {
  return new QueueManager({ name });
}

export function createResilientQueue(name: string) {
  return new QueueManager({
    name,
    timeout: 60000,
    // retry logic is built-in
  });
}

export function createHighPerformanceQueue(name: string) {
  return new QueueManager({
    name,
    concurrency: 5,
  });
}
