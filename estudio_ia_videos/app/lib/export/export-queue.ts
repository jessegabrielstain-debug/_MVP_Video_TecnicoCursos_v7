import type { ExportSettings } from '@/types/export.types';

/**
 * Export Queue
 * Sistema de fila para exportção de vídeos
 */

export interface ExportJob {
  id: string;
  videoId: string;
  userId?: string;
  projectId?: string;
  timelineId?: string;
  format: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  settings?: ExportSettings;
  outputPath?: string;
  outputUrl?: string;
  fileSize?: number;
  duration?: number;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  estimatedTimeRemaining?: number;
}

export class ExportQueue {
  private jobs: Map<string, ExportJob> = new Map();
  private maxConcurrent = 0;
  
  async addJob(videoId: string, format: string): Promise<string> {
    const id = crypto.randomUUID();
    console.log('[ExportQueue] Adding job:', id);
    
    this.jobs.set(id, {
      id,
      videoId,
      format,
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
    });
    
    return id;
  }
  
  async getJob(id: string): Promise<ExportJob | null> {
    return this.jobs.get(id) || null;
  }
  
  async updateProgress(id: string, progress: number, status?: ExportJob['status']) {
    const job = this.jobs.get(id);
    if (job) {
      job.progress = progress;
      if (status) {
        job.status = status;
      }

      const processingJobs = Array.from(this.jobs.values()).filter(j => j.status === 'processing').length;
      this.maxConcurrent = Math.max(this.maxConcurrent, processingJobs);
      console.log('[ExportQueue] Updated job:', id, progress);
    }
  }
  
  async completeJob(id: string, outputPath: string) {
    const job = this.jobs.get(id);
    if (job) {
      job.status = 'completed';
      job.progress = 100;
      job.outputPath = outputPath;
      job.completedAt = new Date();
    }
  }
  
  async failJob(id: string, error: string) {
    const job = this.jobs.get(id);
    if (job) {
      job.status = 'failed';
      job.error = error;
      job.completedAt = new Date();
    }
  }
  
  async getQueueStatus() {
    const jobs = Array.from(this.jobs.values());
    return {
      total: jobs.length,
      pending: jobs.filter(j => j.status === 'pending').length,
      processing: jobs.filter(j => j.status === 'processing').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length,
    };
  }

  async cancelJob(id: string): Promise<boolean> {
    const job = this.jobs.get(id);
    if (job && (job.status === 'pending' || job.status === 'processing')) {
      job.status = 'cancelled';
      job.completedAt = new Date();
      return true;
    }
    return false;
  }

  getStatistics() {
    const jobs = Array.from(this.jobs.values());
    const completedJobs = jobs.filter(job => job.status === 'completed' && job.completedAt);
    const averageDuration = completedJobs.length
      ? completedJobs.reduce((acc, job) => acc + ((job.completedAt!.getTime() - job.createdAt.getTime()) || 0), 0) / completedJobs.length
      : 0;

    return {
      totalJobs: jobs.length,
      queueSize: jobs.filter(job => job.status === 'pending').length,
      processing: jobs.filter(job => job.status === 'processing').length,
      averageDuration,
      maxConcurrent: this.maxConcurrent || Math.max(1, jobs.filter(job => job.status === 'processing').length),
    };
  }
}

export const exportQueue = new ExportQueue();
export const getExportQueue = () => exportQueue;
