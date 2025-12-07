// ========================================
// Queue Types - Strict TypeScript
// ========================================

// Job Status
export type JobStatus = 'pending' | 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'retrying';
export type JobPriority = 'low' | 'normal' | 'high';

// Slide Types for Render
export interface RenderSlide {
  id: string;
  order_index: number;
  title?: string;
  content?: string;
  notes?: string;
  background_color?: string;
  background_image?: string;
  duration_ms?: number;
  transition?: SlideTransition;
  elements?: SlideElement[];
}

export interface SlideTransition {
  type: 'none' | 'fade' | 'slide' | 'zoom' | 'dissolve';
  duration_ms: number;
}

export interface SlideElement {
  id: string;
  type: 'text' | 'image' | 'video' | 'shape' | 'chart';
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  src?: string;
  style?: Record<string, string | number>;
}

// Render Configuration
export interface RenderConfig {
  width?: number;
  height?: number;
  fps?: number;
  quality?: 'low' | 'medium' | 'high' | 'ultra';
  format?: 'mp4' | 'webm' | 'mov';
  codec?: string;
  bitrate?: string;
  audioCodec?: string;
  audioBitrate?: string;
  test?: boolean;
}

export interface RenderSettings {
  resolution?: '720p' | '1080p' | '4k';
  fps?: number;
  quality?: 'low' | 'medium' | 'high' | 'ultra';
  format?: 'mp4' | 'webm' | 'mov';
  audio_bitrate?: number;
  video_bitrate?: number;
}

// Task Payloads
export type RenderTaskPayload = {
  projectId: string;
  userId: string;
  jobId?: string;
  slides?: RenderSlide[];
  config?: RenderConfig;
  settings?: RenderSettings;
  webhookUrl?: string;
}

// Task Results
export interface RenderTaskResult {
  jobId: string;
  outputUrl: string;
  durationMs?: number;
  metadata?: RenderMetadata;
}

export interface RenderMetadata {
  renderTime: number;
  fileSize?: number;
  resolution?: string;
  duration?: number;
  codec?: string;
  slidesCount?: number;
}

// Job Types
export interface JobOptions {
  priority?: JobPriority;
  maxAttempts?: number;
  delay?: number;
  timeout?: number;
}

export interface QueueJob<T = unknown> {
  id: string;
  type: string;
  data: T;
  status: JobStatus;
  priority: JobPriority;
  maxAttempts: number;
  attempts: number;
  createdAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  error?: string;
  result?: JobResult;
}

export interface JobResult {
  success: boolean;
  output?: string;
  outputUrl?: string;
  error?: string;
  duration?: number;
  metadata?: RenderMetadata;
}

// Queue Configuration
export interface QueueConfig {
  name: string;
  concurrency?: number;
  timeout?: number;
  redisUrl?: string;
}

// Queue Metrics
export interface QueueMetrics {
  throughput: number;
  successRate: number;
  avgProcessingTime: number;
  active: number;
  pending: number;
  completed: number;
  failed: number;
}

// Job Processor Type
export type JobProcessor<T = unknown, R = unknown> = (job: QueueJob<T>) => Promise<R>;

