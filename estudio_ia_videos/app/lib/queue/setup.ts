import { Queue, Worker, QueueEvents, type Job } from 'bullmq';

export interface VideoRenderJobData {
  projectId: string;
  userId: string;
  settings: RenderJobSettings;
  slides: RenderSlide[];
  // Outros dados necessários para o job
}

export interface RenderJobSettings {
  resolution?: string;
  format?: string;
  frameRate?: number;
  audioEnabled?: boolean;
  durationMs?: number;
  metadata?: Record<string, unknown>;
  [key: string]: string | number | boolean | null | undefined | Record<string, unknown>;
}

export interface RenderSlide {
  id: string;
  orderIndex: number;
  slideNumber: number;
  title: string;
  content: string;
  duration: number;
  transition: { type: string; duration: number };
  durationMs?: number;
  assets?: Record<string, unknown>;
  notes?: string;
  metadata?: Record<string, unknown>;
  avatar_config?: Record<string, unknown>;
}

export interface JobProgress {
  percentage: number;
  currentStep: string;
  totalSlides?: number;
  currentSlide?: number;
}

const queueName = 'video-render-queue';

// Configuração da conexão com o Redis (exemplo)
const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
};

export const videoRenderQueue = new Queue<VideoRenderJobData>(queueName, { connection });
export const videoRenderWorker = (
  processor: (job: Job<VideoRenderJobData>) => Promise<unknown>,
) => new Worker<VideoRenderJobData>(queueName, processor, { connection });
export const videoRenderQueueEvents = new QueueEvents(queueName, { connection });
