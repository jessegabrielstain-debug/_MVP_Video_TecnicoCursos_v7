/**
 * Batch Processing System
 * Sistema de processamento em lote
 */

export type BatchJobType = 'video_render' | 'transcription' | 'translation' | 'export';

export interface BatchJob<T = unknown> {
  id: string;
  name: string;
  type: BatchJobType;
  userId: string;
  items: T[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  priority: 'low' | 'normal' | 'high';
  progress: number;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  estimatedTime?: number;
  remainingTime?: number;
  statistics?: Record<string, unknown>;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  config?: Record<string, unknown>;
}

export interface BatchProcessor<T = unknown> {
  process(item: T): Promise<void>;
}

export class BatchProcessingSystem {
  private jobs: Map<string, BatchJob> = new Map();
  private processors: Map<string, BatchProcessor> = new Map();
  
  registerProcessor<T>(type: string, processor: BatchProcessor<T>): void {
    this.processors.set(type, processor as BatchProcessor);
  }
  
  async createBatchJob<T>(
    name: string,
    type: BatchJobType,
    userId: string,
    items: T[],
    config?: Record<string, unknown>
  ): Promise<BatchJob<T>> {
    const jobId = crypto.randomUUID();
    
    const job: BatchJob<T> = {
      id: jobId,
      name,
      type,
      userId,
      items,
      status: 'pending',
      priority: 'normal',
      progress: 0,
      totalTasks: items.length,
      completedTasks: 0,
      failedTasks: 0,
      createdAt: new Date(),
      config
    };
    
    this.jobs.set(jobId, job as BatchJob);
    
    // Iniciar processamento
    this.processJob(jobId).catch(console.error);
    
    return job;
  }
  
  private async processJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;
    
    const processor = this.processors.get(job.type);
    if (!processor) {
      job.status = 'failed';
      job.error = `No processor registered for type: ${job.type}`;
      return;
    }
    
    job.status = 'processing';
    job.startedAt = new Date();
    
    try {
      for (let i = 0; i < job.items.length; i++) {
        await processor.process(job.items[i]);
        job.completedTasks++;
        job.progress = (job.completedTasks / job.totalTasks) * 100;
      }
      
      job.status = 'completed';
      job.completedAt = new Date();
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
    }
  }
  
  getJob(jobId: string): BatchJob | undefined {
    return this.jobs.get(jobId);
  }
  
  listJobs(): BatchJob[] {
    return Array.from(this.jobs.values());
  }
  
  async cancelJob(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (!job || job.status === 'completed' || job.status === 'failed') return false;
    
    job.status = 'failed';
    job.error = 'Cancelled by user';
    return true;
  }

  pauseJob(jobId: string): boolean {
    // Mock implementation
    const job = this.jobs.get(jobId);
    if (!job || job.status !== 'processing') return false;
    // In a real system, this would signal the processor to stop
    return true;
  }

  resumeJob(jobId: string): boolean {
    // Mock implementation
    const job = this.jobs.get(jobId);
    if (!job) return false;
    // In a real system, this would signal the processor to resume
    return true;
  }

  setPriority(jobId: string, priority: 'low' | 'normal' | 'high'): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;
    job.priority = priority;
    return true;
  }
}

export const batchSystem = new BatchProcessingSystem();
