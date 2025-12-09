/**
 * Render Job Manager
 * Gerenciador de jobs de renderização
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { triggerWebhook } from '@/lib/webhooks-system-real';
import { logger } from '@/lib/logger';

export interface RenderJob {
  id: string;
  userId: string;
  projectId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  outputUrl?: string;
  error?: string;
}

export class JobManager {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Use Service Role Key for admin tasks
    
    if (!supabaseUrl || !supabaseKey) {
      logger.warn('⚠️ Supabase credentials not found in JobManager', { component: 'JobManager' });
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  private async getJobContext(jobId: string): Promise<{ projectId: string, userId: string } | null> {
    try {
      // Fetch job to get projectId
      const { data: job, error: jobError } = await this.supabase
        .from('render_jobs')
        .select('project_id')
        .eq('id', jobId)
        .single();

      if (jobError || !job) return null;

      // Fetch project to get user_id (userId)
      const { data: project, error: projectError } = await this.supabase
        .from('projects')
        .select('user_id')
        .eq('id', job.project_id)
        .single();

      if (projectError || !project) return null;

      return {
        projectId: job.project_id,
        userId: project.user_id
      };
    } catch (error) {
      logger.error('Error fetching job context:', error instanceof Error ? error : new Error(String(error)), { component: 'JobManager' });
      return null;
    }
  }
  
  async createJob(userId: string, projectId: string): Promise<string> {
    // Idempotency: Check for recent queued jobs (last 1 min) to prevent duplicates
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const { data: existing } = await this.supabase
      .from('render_jobs')
      .select('id')
      .eq('project_id', projectId)
      .eq('status', 'queued')
      .gt('created_at', oneMinuteAgo)
      .maybeSingle();

    if (existing) {
      logger.info(`[JobManager] Idempotency: Returning existing queued job ${existing.id} for project ${projectId}`, { component: 'JobManager' });
      return existing.id;
    }

    const { data, error } = await this.supabase
      .from('render_jobs')
      .insert({
        project_id: projectId,
        user_id: userId,
        status: 'queued', // Changed from 'pending' to match DB schema default if needed, or keep consistent
        progress: 0,
        render_settings: {}, // Default settings
        attempts: 0
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to create job: ${error.message}`);
    }

    return data.id;
  }
  
  async getJob(jobId: string): Promise<RenderJob | null> {
    const { data, error } = await this.supabase
      .from('render_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      projectId: data.project_id,
      status: data.status,
      progress: data.progress,
      createdAt: new Date(data.created_at),
      startedAt: data.started_at ? new Date(data.started_at) : undefined,
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      outputUrl: data.output_url,
      error: data.error_message
    };
  }
  
  async updateProgress(jobId: string, progress: number): Promise<void> {
    const updates: Record<string, unknown> = {
      progress: Math.min(100, Math.max(0, progress)),
      updated_at: new Date().toISOString()
    };

    if (progress > 0) {
       // If we want to set status to processing, we can do it here, but usually worker does it.
       // Let's just update progress.
    }

    const { error } = await this.supabase
      .from('render_jobs')
      .update(updates)
      .eq('id', jobId);

    if (error) {
      logger.error(`Failed to update progress for job ${jobId}:`, new Error(error.message), { component: 'JobManager' });
    }
  }

  async startJob(jobId: string): Promise<void> {
    const { error } = await this.supabase
      .from('render_jobs')
      .update({
        status: 'processing',
        started_at: new Date().toISOString(),
        progress: 0
      })
      .eq('id', jobId);

    if (error) {
      logger.error(`Failed to start job ${jobId}:`, new Error(error.message), { component: 'JobManager' });
    } else {
      // Trigger Webhook
      const context = await this.getJobContext(jobId);
      if (context) {
        triggerWebhook.renderStarted({
          jobId,
          projectId: context.projectId,
          userId: context.userId
        }).catch(err => logger.error('Webhook trigger failed:', err instanceof Error ? err : new Error(String(err)), { component: 'JobManager' }));
      }
    }
  }
  
  async completeJob(jobId: string, outputUrl: string): Promise<void> {
    const { error } = await this.supabase
      .from('render_jobs')
      .update({
        status: 'completed',
        progress: 100,
        completed_at: new Date().toISOString(),
        output_url: outputUrl
      })
      .eq('id', jobId);

    if (error) {
      logger.error(`Failed to complete job ${jobId}:`, new Error(error.message), { component: 'JobManager' });
    } else {
      // Trigger Webhook
      const context = await this.getJobContext(jobId);
      if (context) {
        triggerWebhook.renderCompleted({
          jobId,
          projectId: context.projectId,
          videoUrl: outputUrl,
          duration: 0 // Duration not currently tracked in job
        }).catch(err => logger.error('Webhook trigger failed:', err instanceof Error ? err : new Error(String(err)), { component: 'JobManager' }));
      }
    }
  }
  
  async failJob(jobId: string, errorMessage: string): Promise<void> {
    const { error } = await this.supabase
      .from('render_jobs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: errorMessage
      })
      .eq('id', jobId);

    if (error) {
      logger.error(`Failed to fail job ${jobId}:`, error instanceof Error ? error : new Error(String(error)), { component: 'JobManager' });
    } else {
      // Trigger Webhook
      const context = await this.getJobContext(jobId);
      if (context) {
        triggerWebhook.renderFailed({
          jobId,
          projectId: context.projectId,
          error: errorMessage
        }).catch(err => logger.error('Webhook trigger failed:', err instanceof Error ? err : new Error(String(err)), { component: 'JobManager' }));
      }
    }
  }
  
  async listJobs(projectId?: string, limit: number = 100): Promise<RenderJob[]> {
    let query = this.supabase.from('render_jobs').select('*');
    
    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);

    if (error) {
      logger.error('Failed to list jobs:', error instanceof Error ? error : new Error(String(error)), { component: 'JobManager' });
      return [];
    }

    return data.map((row) => ({
      id: row.id,
      userId: row.user_id,
      projectId: row.project_id,
      status: row.status,
      progress: row.progress,
      createdAt: new Date(row.created_at),
      startedAt: row.started_at ? new Date(row.started_at) : undefined,
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      outputUrl: row.output_url,
      error: row.error_message
    }));
  }

  async removeJob(jobId: string): Promise<void> {
    const { error } = await this.supabase
      .from('render_jobs')
      .delete()
      .eq('id', jobId);

    if (error) {
      logger.error(`Failed to remove job ${jobId}:`, error instanceof Error ? error : new Error(String(error)), { component: 'JobManager' });
    }
  }
}

export const jobManager = new JobManager();
