import { Job } from 'bullmq';
import { createRenderWorker } from '@/lib/queue/render-queue';
import { videoRenderPipeline } from '@/lib/video-render-pipeline';
import { RenderTaskPayload, RenderTaskResult } from '@/lib/queue/types';
import { logger } from '@/lib/services/logger-service-centralized';

const workerHandler = async (job: Job<RenderTaskPayload, RenderTaskResult>) => {
  const { projectId } = job.data;
  const jobId = job.id!;

  logger.info(`[VideoWorker] 🚀 Starting job ${jobId} for project ${projectId}`, {
    jobId,
    projectId,
  });

  try {
    // Execute the pipeline
    const outputUrl = await videoRenderPipeline.execute({
      projectId,
      jobId,
      outputFormat: 'mp4',
      quality: 'medium'
    });

    logger.info(`[VideoWorker] ✅ Job ${jobId} completed. Output: ${outputUrl}`, {
      jobId,
      projectId,
    });

    return {
      jobId,
      outputUrl,
      metadata: {
        completedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    logger.error(`[VideoWorker] ❌ Job ${jobId} failed`, error as Error, {
      jobId,
      projectId,
    });
    throw error;
  }
};

// Create and export the worker instance
export const videoRenderWorker = createRenderWorker(workerHandler, {
  concurrency: 1, // Process one video at a time per worker instance
  limiter: {
    max: 10,
    duration: 1000
  }
});

videoRenderWorker.on('completed', (job) => {
  logger.info('[VideoWorker] Job completed successfully', { jobId: job.id });
});

videoRenderWorker.on('failed', (job, err) => {
  logger.error('[VideoWorker] Job failed', err, { jobId: job?.id });
});

logger.info('[VideoWorker] Worker initialized and listening for jobs...');

