/**
 * Hybrid Cloud Rendering - Cloud Orchestrator
 * Manages proxy editing and server-side high-quality rendering
 */

import { ProxyGenerator, ProxyMetadata } from './proxy-generator';
import { Job, Worker } from 'bullmq';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs/promises';
import { logger } from '@/lib/logger';
import { SupabaseClient } from '@supabase/supabase-js';

export interface HybridRenderJob {
  id: string;
  projectId: string;
  userId: string;
  timeline: Record<string, unknown>;
  settings: {
    proxyResolution: '360p' | '480p' | '720p';
    finalResolution: '1080p' | '4k' | '8k';
    enableSmartFlow: boolean;
    quality: 'draft' | 'production' | 'ultra';
  };
  assets: {
    original: string[];
    proxies?: ProxyMetadata[];
  };
  status: 'pending' | 'proxy_ready' | 'rendering' | 'completed' | 'failed';
  progress: number;
  createdAt: Date;
  proxyReadyAt?: Date;
  renderStartedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export interface CloudRenderPayload {
  jobId: string;
  projectId: string;
  userId: string;
  timeline: Record<string, unknown>;
  settings: HybridRenderJob['settings'];
  proxyMetadata: ProxyMetadata[];
}

export class CloudRenderingOrchestrator {
  private proxyGenerator: ProxyGenerator;
  private supabase: SupabaseClient;
  private worker: Worker | null = null;
  
  constructor(
    private supabaseUrl: string,
    private supabaseKey: string,
    private redisUrl: string
  ) {
    this.proxyGenerator = new ProxyGenerator();
    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
  }

  /**
   * Start hybrid rendering workflow
   */
  async startHybridRender(job: HybridRenderJob): Promise<string> {
    logger.info(`[CloudOrchestrator] Starting hybrid render for job ${job.id}`);
    
    try {
      // Step 1: Generate proxies for editing
      logger.info(`[CloudOrchestrator] Generating proxies for ${job.assets.original.length} assets`);
      const proxies = await this.generateProxies(job);
      
      // Update job with proxy info
      job.assets.proxies = proxies;
      job.status = 'proxy_ready';
      job.proxyReadyAt = new Date();
      job.progress = 25;
      
      await this.updateJobStatus(job);
      
      // Step 2: Queue server-side high-quality render
      logger.info(`[CloudOrchestrator] Queueing server render`);
      await this.queueServerRender(job);
      
      return job.id;
    } catch (error) {
      logger.error(`[CloudOrchestrator] Hybrid render failed: ${error}`);
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      await this.updateJobStatus(job);
      throw error;
    }
  }

  /**
   * Generate proxies for all original assets
   */
  private async generateProxies(job: HybridRenderJob): Promise<ProxyMetadata[]> {
    const proxyDir = path.join(process.cwd(), 'public', 'proxies');
    await fs.mkdir(proxyDir, { recursive: true });
    
    const proxies: ProxyMetadata[] = [];
    
    for (const originalPath of job.assets.original) {
      try {
        const proxy = await this.proxyGenerator.getOrCreateProxy(
          originalPath,
          proxyDir,
          {
            resolution: job.settings.proxyResolution,
            bitrate: this.getBitrateForResolution(job.settings.proxyResolution),
            codec: 'h264',
            format: 'mp4'
          }
        );
        
        proxies.push(proxy);
      } catch (error) {
        logger.error(`[CloudOrchestrator] Failed to generate proxy for ${originalPath}: ${error}`);
        throw error;
      }
    }
    
    return proxies;
  }

  /**
   * Queue server-side high-quality render
   */
  private async queueServerRender(job: HybridRenderJob): Promise<void> {
    const payload: CloudRenderPayload = {
      jobId: job.id,
      projectId: job.projectId,
      userId: job.userId,
      timeline: job.timeline,
      settings: job.settings,
      proxyMetadata: job.assets.proxies!
    };

    // Add to BullMQ queue
    const { Queue } = await import('bullmq');
    const queue = new Queue('cloud-render-jobs', {
      connection: { url: this.redisUrl }
    });

    await queue.add('render', payload, {
      jobId: job.id,
      priority: this.getPriority(job.settings.quality),
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    });

    job.status = 'rendering';
    job.renderStartedAt = new Date();
    job.progress = 50;
    await this.updateJobStatus(job);
  }

  /**
   * Process server-side render job
   */
  async processServerRender(job: Job<CloudRenderPayload>): Promise<any> {
    const { jobId, projectId, userId, timeline, settings, proxyMetadata } = job.data;
    
    logger.info(`[CloudOrchestrator] Processing server render for job ${jobId}`);
    
    try {
      // Update progress
      await job.updateProgress(60);
      
      // Apply Smart Flow if enabled
      let processedTimeline = timeline;
      if (settings.enableSmartFlow) {
        processedTimeline = await this.applySmartFlow(timeline, proxyMetadata);
      }
      
      await job.updateProgress(75);
      
      // Render high-quality video
      const outputPath = await this.renderHighQualityVideo(
        processedTimeline,
        settings.finalResolution,
        settings.quality
      );
      
      await job.updateProgress(90);
      
      // Upload to storage
      const publicUrl = await this.uploadToStorage(outputPath, jobId);
      
      await job.updateProgress(100);
      
      // Update job status
      await this.supabase
        .from('render_jobs')
        .update({
          status: 'completed',
          progress: 100,
          completed_at: new Date().toISOString(),
          output_url: publicUrl
        })
        .eq('id', jobId);
      
      logger.info(`[CloudOrchestrator] Server render completed for job ${jobId}`);
      
      return {
        jobId,
        outputUrl: publicUrl,
        duration: timeline.duration || 0
      };
    } catch (error) {
      logger.error(`[CloudOrchestrator] Server render failed: ${error}`);
      
      await this.supabase
        .from('render_jobs')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          completed_at: new Date().toISOString()
        })
        .eq('id', jobId);
      
      throw error;
    }
  }

  /**
   * Apply Smart Flow optimizations
   */
  private async applySmartFlow(timeline: Record<string, unknown>, proxyMetadata: ProxyMetadata[]): Promise<Record<string, unknown>> {
    // This will be implemented in the Smart Flow feature
    // For now, return timeline as-is
    return timeline;
  }

  /**
   * Render high-quality video using FFmpeg
   */
  private async renderHighQualityVideo(
    timeline: Record<string, unknown>,
    resolution: string,
    quality: string
  ): Promise<string> {
    const outputDir = path.join(process.cwd(), 'temp', 'renders');
    await fs.mkdir(outputDir, { recursive: true });
    
    const outputPath = path.join(outputDir, `final_${Date.now()}.mp4`);
    
    // This is a simplified implementation
    // In production, this would use the full FFmpeg pipeline
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execPromise = promisify(exec);
    
    const resolutionMap = {
      '1080p': '1920x1080',
      '4k': '3840x2160',
      '8k': '7680x4320'
    };
    
    const bitrateMap = {
      'draft': '2000k',
      'production': '8000k',
      'ultra': '20000k'
    };
    
    const command = `ffmpeg -f lavfi -i testsrc=duration=10:size=${resolutionMap[resolution as keyof typeof resolutionMap]}:rate=30 -c:v libx264 -b:v ${bitrateMap[quality as keyof typeof bitrateMap]} -preset slow -crf 18 "${outputPath}"`;
    
    await execPromise(command);
    
    return outputPath;
  }

  /**
   * Upload to storage
   */
  private async uploadToStorage(filePath: string, jobId: string): Promise<string> {
    const fileBuffer = await fs.readFile(filePath);
    const fileName = `final_${jobId}.mp4`;
    
    const { error } = await this.supabase
      .storage
      .from('videos')
      .upload(fileName, fileBuffer, {
        contentType: 'video/mp4',
        upsert: true
      });

    if (error) throw error;

    const { data: { publicUrl } } = this.supabase
      .storage
      .from('videos')
      .getPublicUrl(fileName);

    return publicUrl;
  }

  /**
   * Update job status in database
   */
  private async updateJobStatus(job: HybridRenderJob): Promise<void> {
    await this.supabase
      .from('render_jobs')
      .update({
        status: job.status,
        progress: job.progress,
        updated_at: new Date().toISOString()
      })
      .eq('id', job.id);
  }

  /**
   * Get bitrate for resolution
   */
  private getBitrateForResolution(resolution: string): string {
    const bitrateMap = {
      '360p': '500k',
      '480p': '800k',
      '720p': '1500k'
    };
    return bitrateMap[resolution as keyof typeof bitrateMap] || '1000k';
  }

  /**
   * Get priority for quality level
   */
  private getPriority(quality: string): number {
    const priorityMap = {
      'draft': 10,
      'production': 5,
      'ultra': 1
    };
    return priorityMap[quality as keyof typeof priorityMap] || 5;
  }

  /**
   * Start worker for processing cloud render jobs
   */
  async startWorker(): Promise<void> {
    if (this.worker) {
      logger.warn('[CloudOrchestrator] Worker already running');
      return;
    }

    this.worker = new Worker('cloud-render-jobs', async (job) => {
      return this.processServerRender(job);
    }, {
      connection: { url: this.redisUrl },
      concurrency: 2
    });

    this.worker.on('ready', () => {
      logger.info('[CloudOrchestrator] Worker ready for cloud render jobs');
    });

    this.worker.on('failed', (job, err) => {
      logger.error(`[CloudOrchestrator] Job ${job?.id} failed: ${err.message}`);
    });

    this.worker.on('error', (err) => {
      logger.error(`[CloudOrchestrator] Worker error: ${err.message}`);
    });
  }

  /**
   * Stop worker
   */
  async stopWorker(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
      logger.info('[CloudOrchestrator] Worker stopped');
    }
  }
}