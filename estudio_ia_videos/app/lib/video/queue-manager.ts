import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

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
  CANCELLED = 'cancelled'
}

export interface JobOptions {
  priority?: QueuePriority;
  maxAttempts?: number;
  metadata?: Record<string, unknown>;
}

export interface Job<T = unknown> {
  id: string;
  type: string;
  data: T;
  status: JobStatus;
  priority: QueuePriority;
  attempts: number;
  maxAttempts: number;
  metadata: Record<string, unknown>;
  result?: unknown;
  error?: Error;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface QueueConfig {
  maxConcurrent?: number;
  maxRetries?: number;
  autoStart?: boolean;
}

export type JobProcessor<T = unknown> = (job: Job<T>) => Promise<unknown>;

export class VideoProcessingQueue extends EventEmitter {
  private jobs: Map<string, Job> = new Map();
  private processors: Map<string, JobProcessor> = new Map();
  private processing: Set<string> = new Set();
  private config: Required<QueueConfig>;
  private isRunning: boolean = false;
  private processLoopTimeout?: NodeJS.Timeout;

  constructor(config: QueueConfig = {}) {
    super();
    this.config = {
      maxConcurrent: config.maxConcurrent ?? 1,
      maxRetries: config.maxRetries ?? 3,
      autoStart: config.autoStart ?? true
    };

    if (this.config.autoStart) {
      this.start();
    }
  }

  async addJob<T>(type: string, data: T, options: JobOptions = {}): Promise<string> {
    const id = uuidv4();
    const job: Job<T> = {
      id,
      type,
      data,
      status: JobStatus.PENDING,
      priority: options.priority ?? QueuePriority.NORMAL,
      attempts: 0,
      maxAttempts: options.maxAttempts ?? this.config.maxRetries,
      metadata: options.metadata ?? {},
      createdAt: new Date()
    };

    this.jobs.set(id, job);
    this.emit('job:added', { id, type });

    if (this.isRunning) {
      setTimeout(() => this.processNext(), 0);
    }

    return id;
  }

  getJob(id: string): Job | undefined {
    return this.jobs.get(id);
  }

  registerProcessor(type: string, processor: JobProcessor): void {
    this.processors.set(type, processor);
  }

  start(): void {
    if (!this.isRunning) {
      this.isRunning = true;
      setTimeout(() => this.processNext(), 0);
    }
  }

  stop(): void {
    this.isRunning = false;
    if (this.processLoopTimeout) {
      clearTimeout(this.processLoopTimeout);
      this.processLoopTimeout = undefined;
    }
  }

  async clearAll(): Promise<void> {
    this.jobs.clear();
    this.processing.clear();
  }

  async cancelJob(id: string): Promise<boolean> {
    const job = this.jobs.get(id);
    if (!job) return false;

    if (job.status === JobStatus.PENDING) {
      job.status = JobStatus.CANCELLED;
      return true;
    }

    return false;
  }

  async retryJob(id: string): Promise<boolean> {
    const job = this.jobs.get(id);
    if (!job || job.status !== JobStatus.FAILED) return false;

    job.status = JobStatus.PENDING;
    job.attempts = 0;
    job.error = undefined;
    job.completedAt = undefined;
    
    if (this.isRunning) {
      setTimeout(() => this.processNext(), 0);
    }

    return true;
  }

  getJobsByStatus(status: JobStatus): Job[] {
    return Array.from(this.jobs.values()).filter(job => job.status === status);
  }

  getStats() {
    const jobs = Array.from(this.jobs.values());
    return {
      total: jobs.length,
      pending: jobs.filter(j => j.status === JobStatus.PENDING).length,
      processing: jobs.filter(j => j.status === JobStatus.PROCESSING).length,
      completed: jobs.filter(j => j.status === JobStatus.COMPLETED).length,
      failed: jobs.filter(j => j.status === JobStatus.FAILED).length,
      cancelled: jobs.filter(j => j.status === JobStatus.CANCELLED).length
    };
  }

  async clearCompleted(): Promise<number> {
    const completed = this.getJobsByStatus(JobStatus.COMPLETED);
    completed.forEach(job => this.jobs.delete(job.id));
    return completed.length;
  }

  private async processNext() {
    if (!this.isRunning) return;

    // Check concurrency limit
    if (this.processing.size >= this.config.maxConcurrent) {
      return;
    }

    // Find next job
    const pendingJobs = Array.from(this.jobs.values())
      .filter(j => j.status === JobStatus.PENDING)
      .sort((a, b) => {
        // Sort by priority (desc) then creation time (asc)
        if (b.priority !== a.priority) return b.priority - a.priority;
        return a.createdAt.getTime() - b.createdAt.getTime();
      });

    if (pendingJobs.length === 0) {
      if (this.processing.size === 0) {
        this.emit('queue:empty');
        this.emit('queue:drained');
      }
      return;
    }

    const job = pendingJobs[0];
    const processor = this.processors.get(job.type);

    if (!processor) {
      // No processor for this job type
      // Maybe log error or mark as failed?
      // For now, skip
      return;
    }

    // Start processing
    this.processing.add(job.id);
    job.status = JobStatus.PROCESSING;
    job.startedAt = new Date();
    job.attempts++;
    this.emit('job:started', { id: job.id });

    // Process asynchronously
    this.processJob(job, processor);

    // Try to process more if concurrency allows
    if (this.processing.size < this.config.maxConcurrent) {
      // Use setImmediate or setTimeout to avoid stack overflow and allow event loop
      if (this.processLoopTimeout) clearTimeout(this.processLoopTimeout);
      this.processLoopTimeout = setTimeout(() => this.processNext(), 0);
    }
  }

  private async processJob(job: Job, processor: JobProcessor) {
    try {
      const result = await processor(job);
      job.status = JobStatus.COMPLETED;
      job.result = result;
      job.completedAt = new Date();
      this.emit('job:completed', { id: job.id, result });
    } catch (error) {
      job.error = error as Error;
      
      if (job.attempts < job.maxAttempts) {
        // Retry logic could be here, but for now we mark as failed and let user retry manually or implement auto-retry
        // Actually, test expects auto-retry logic if attempts < maxAttempts?
        // "should retry failed jobs" test implies it retries automatically?
        // No, the test "should retry failed jobs" sets up a processor that fails N times.
        // So the queue should re-queue it if attempts < maxAttempts.
        
        job.status = JobStatus.PENDING; // Re-queue
        // Add delay?
      } else {
        job.status = JobStatus.FAILED;
        job.completedAt = new Date();
        this.emit('job:failed', { id: job.id, error });
      }
    } finally {
      this.processing.delete(job.id);
      this.processNext();
    }
  }
}

let singletonQueue: VideoProcessingQueue | null = null;

export function getQueue(): VideoProcessingQueue {
  if (!singletonQueue) {
    singletonQueue = new VideoProcessingQueue();
  }
  return singletonQueue;
}

export async function resetQueue(): Promise<void> {
  if (singletonQueue) {
    singletonQueue.stop();
    await singletonQueue.clearAll();
    singletonQueue = null;
  }
}
