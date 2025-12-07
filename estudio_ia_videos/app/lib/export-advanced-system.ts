import { randomUUID as nodeRandomUUID } from 'crypto';

const SUPPORTED_EXPORT_FORMATS = [
  'mp4',
  'webm',
  'mov',
  'avi',
  'mkv',
  'gif',
  'apng',
  'mp3',
  'wav',
  'aac',
  'ogg',
  'zip',
  'pdf',
  'pptx',
] as const;

const NON_AUDIO_FORMATS = new Set<ExportFormat>(['gif', 'apng', 'pdf', 'pptx', 'zip']);

const DEFAULT_CODEC_BY_FORMAT: Record<ExportFormat, string> = {
  mp4: 'h264',
  webm: 'vp9',
  mov: 'h264',
  avi: 'h264',
  mkv: 'h265',
  gif: 'gif',
  apng: 'apng',
  mp3: 'mp3',
  wav: 'pcm_s16le',
  aac: 'aac',
  ogg: 'opus',
  zip: 'zip',
  pdf: 'pdf',
  pptx: 'pptx',
};

const DEFAULT_AUDIO_CODEC = 'aac';

const DEFAULT_RESOLUTION = '1920x1080';
const DEFAULT_FPS = 30;

type ExportFormat = (typeof SUPPORTED_EXPORT_FORMATS)[number];

export type ExportOptimizationLevel = 'none' | 'fast' | 'balanced' | 'best';

export type ExportPhase =
  | 'initializing'
  | 'preprocessing'
  | 'encoding'
  | 'optimizing'
  | 'watermarking'
  | 'finalizing';

export type TargetPlatform =
  | 'youtube'
  | 'vimeo'
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'linkedin'
  | 'twitter'
  | 'whatsapp'
  | 'snapchat'
  | 'pinterest'
  | 'mobile'
  | 'web';

interface PhaseDefinition {
  phase: ExportPhase;
  minProgress: number;
  maxProgress: number;
  duration: number;
}

export interface WatermarkConfig {
  enabled: boolean;
  imagePath?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  opacity?: number;
  scale?: number;
  text?: string;
}

export interface ThumbnailConfig {
  enabled: boolean;
  format?: 'jpg' | 'png';
  width?: number;
  height?: number;
  count?: number;
}

export interface ExportOptions {
  format: ExportFormat;
  codec?: string;
  audioCodec?: string;
  resolution?: string;
  fps?: number;
  bitrate?: number;
  maxBitrate?: number;
  minBitrate?: number;
  targetBitrate?: number;
  quality?: 'low' | 'medium' | 'high' | 'ultra';
  optimization?: ExportOptimizationLevel;
  includeSubtitles?: boolean;
  includeStoryboard?: boolean;
  includeMetadata?: boolean;
  includeThumbnail?: boolean;
  includeWatermark?: boolean;
  watermark?: WatermarkConfig;
  thumbnail?: ThumbnailConfig;
  compression?: boolean;
  filters?: Record<string, unknown>;
  fields?: string[];
  aspectRatio?: string;
  colorProfile?: string;
  maxDuration?: number;
  maxFileSize?: number;
  audioBitrate?: number;
  hardwareAcceleration?: boolean;
  twoPass?: boolean;
  targetPlatform?: TargetPlatform;
  presetName?: string;
  priority?: 'low' | 'normal' | 'high';
  customFileName?: string;
  metadataOverrides?: Record<string, unknown>;
}

export interface ExportMetadata {
  duration: number;
  fileSize: number;
  format: ExportFormat;
  codec?: string;
  audioCodec?: string;
  resolution?: string;
  bitrate?: number;
  fps?: number;
  hasAudio: boolean;
  hasSubtitles: boolean;
  processingTime: number;
  colorProfile?: string;
}

interface JobLogEntry {
  timestamp: number;
  message: string;
  level: 'info' | 'warn' | 'error';
}

interface JobMetrics {
  retries: number;
  averageFps?: number;
  qualityScore?: number;
  lastUpdated: Date;
}

export interface ExportJob {
  id: string;
  projectId: string;
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  currentPhase: ExportPhase;
  options: ExportOptions;
  platform?: TargetPlatform;
  outputPath?: string;
  thumbnailPath?: string;
  metadata?: ExportMetadata;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  metrics: JobMetrics;
  logs: JobLogEntry[];
}

export interface PlatformPreset {
  name: string;
  description: string;
  format: ExportFormat;
  codec: string;
  audioCodec?: string;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  resolution: string;
  aspectRatio: string;
  fps: number;
  targetBitrate: number;
  maxBitrate?: number;
  minBitrate?: number;
  maxDuration?: number;
  maxResolution?: string;
  maxFileSize?: number;
  colorProfile?: string;
  optimization?: ExportOptimizationLevel;
  recommendedFilters?: string[];
  notes?: string;
}

export const PLATFORM_PRESETS: Record<TargetPlatform, PlatformPreset> = {
  youtube: {
    name: 'YouTube HD',
    description: 'Preset otimizado para upload no YouTube em 1080p.',
    format: 'mp4',
    codec: 'h264',
    audioCodec: 'aac',
    quality: 'high',
    resolution: '1920x1080',
    aspectRatio: '16:9',
    fps: 30,
    targetBitrate: 8000,
    maxBitrate: 12000,
    maxDuration: 7200,
    colorProfile: 'bt709',
    optimization: 'balanced',
  },
  vimeo: {
    name: 'Vimeo Pro',
    description: 'Perfil de alta qualidade com margem para pós-processamento.',
    format: 'mp4',
    codec: 'h264',
    audioCodec: 'aac',
    quality: 'high',
    resolution: '1920x1080',
    aspectRatio: '16:9',
    fps: 30,
    targetBitrate: 10000,
    maxBitrate: 20000,
    colorProfile: 'bt709',
    optimization: 'best',
  },
  facebook: {
    name: 'Facebook Feed',
    description: 'Entrega equilibrada para feed do Facebook.',
    format: 'mp4',
    codec: 'h264',
    audioCodec: 'aac',
    quality: 'medium',
    resolution: '1080x1080',
    aspectRatio: '1:1',
    fps: 30,
    targetBitrate: 4500,
    maxBitrate: 6000,
    maxDuration: 240,
    maxResolution: '1080x1080',
    optimization: 'fast',
  },
  instagram: {
    name: 'Instagram Feed',
    description: 'Vídeos quadrados otimizados para o feed.',
    format: 'mp4',
    codec: 'h264',
    audioCodec: 'aac',
    quality: 'medium',
    resolution: '1080x1080',
    aspectRatio: '1:1',
    fps: 30,
    targetBitrate: 3500,
    maxBitrate: 5000,
    maxDuration: 60,
    maxResolution: '1080x1080',
    optimization: 'balanced',
  },
  tiktok: {
    name: 'TikTok Vertical',
    description: 'Preset vertical com foco em dispositivos móveis.',
    format: 'mp4',
    codec: 'h264',
    audioCodec: 'aac',
    quality: 'high',
    resolution: '1080x1920',
    aspectRatio: '9:16',
    fps: 30,
    targetBitrate: 4000,
    maxBitrate: 6000,
    maxDuration: 180,
    optimization: 'balanced',
  },
  linkedin: {
    name: 'LinkedIn HD',
    description: 'Conteúdo corporativo com foco em clareza.',
    format: 'mp4',
    codec: 'h264',
    audioCodec: 'aac',
    quality: 'high',
    resolution: '1920x1080',
    aspectRatio: '16:9',
    fps: 30,
    targetBitrate: 6500,
    maxBitrate: 9000,
    maxDuration: 600,
    optimization: 'balanced',
  },
  twitter: {
    name: 'Twitter/X',
    description: 'Compatibilidade garantida com limite de tamanho.',
    format: 'mp4',
    codec: 'h264',
    audioCodec: 'aac',
    quality: 'medium',
    resolution: '1280x720',
    aspectRatio: '16:9',
    fps: 30,
    targetBitrate: 3000,
    maxBitrate: 5000,
    maxFileSize: 512,
    maxDuration: 140,
    optimization: 'fast',
  },
  whatsapp: {
    name: 'WhatsApp Share',
    description: 'Foco em arquivo leve para compartilhamento rápido.',
    format: 'mp4',
    codec: 'h264',
    audioCodec: 'aac',
    quality: 'low',
    resolution: '854x480',
    aspectRatio: '16:9',
    fps: 24,
    targetBitrate: 1000,
    maxBitrate: 1500,
    maxFileSize: 16,
    optimization: 'fast',
  },
  snapchat: {
    name: 'Snapchat Stories',
    description: 'Vertical rápido com limite curto.',
    format: 'mp4',
    codec: 'h264',
    audioCodec: 'aac',
    quality: 'medium',
    resolution: '1080x1920',
    aspectRatio: '9:16',
    fps: 30,
    targetBitrate: 3800,
    maxDuration: 60,
    optimization: 'balanced',
  },
  pinterest: {
    name: 'Pinterest Video Pin',
    description: 'Vídeos verticais para pins patrocinados.',
    format: 'mp4',
    codec: 'h264',
    audioCodec: 'aac',
    quality: 'medium',
    resolution: '1080x1920',
    aspectRatio: '9:16',
    fps: 30,
    targetBitrate: 3500,
    maxBitrate: 5000,
    optimization: 'balanced',
  },
  mobile: {
    name: 'Mobile Universal',
    description: 'Preset geral para smartphones e tablets.',
    format: 'mp4',
    codec: 'h264',
    audioCodec: 'aac',
    quality: 'medium',
    resolution: '1280x720',
    aspectRatio: '16:9',
    fps: 30,
    targetBitrate: 2500,
    maxBitrate: 4000,
    maxFileSize: 200,
    optimization: 'balanced',
  },
  web: {
    name: 'Web Streaming',
    description: 'Compressão avançada para streaming em navegadores.',
    format: 'webm',
    codec: 'vp9',
    audioCodec: 'opus',
    quality: 'high',
    resolution: '1920x1080',
    aspectRatio: '16:9',
    fps: 30,
    targetBitrate: 3500,
    maxBitrate: 6000,
    colorProfile: 'bt709',
    optimization: 'best',
  },
};

const PROCESSING_PIPELINE: PhaseDefinition[] = [
  { phase: 'initializing', minProgress: 0, maxProgress: 10, duration: 250 },
  { phase: 'preprocessing', minProgress: 10, maxProgress: 30, duration: 400 },
  { phase: 'encoding', minProgress: 30, maxProgress: 60, duration: 700 },
  { phase: 'optimizing', minProgress: 60, maxProgress: 80, duration: 450 },
  { phase: 'watermarking', minProgress: 80, maxProgress: 90, duration: 250 },
  { phase: 'finalizing', minProgress: 90, maxProgress: 100, duration: 350 },
];

interface SystemMetrics {
  totalJobs: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  cancelled: number;
  averageDuration: number | null;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const generateId = () => {
  if (typeof nodeRandomUUID === 'function') {
    return nodeRandomUUID();
  }
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `export_${Math.random().toString(36).slice(2)}_${Date.now()}`;
};

const cloneJob = (job: ExportJob): ExportJob => ({
  ...job,
  options: { ...job.options },
  metadata: job.metadata ? { ...job.metadata } : undefined,
  metrics: { ...job.metrics },
  logs: job.logs.map(entry => ({ ...entry })),
});

export class ExportAdvancedSystem {
  private readonly jobs = new Map<string, ExportJob>();
  private readonly jobQueue: string[] = [];
  private readonly activeJobs = new Set<string>();
  private readonly cancelledJobs = new Set<string>();
  private readonly maxConcurrentJobs = 3;

  async createExportJob(
    projectId: string,
    userId: string,
    options: ExportOptions,
  ): Promise<ExportJob> {
    if (!projectId || !userId) {
      throw new Error('Both projectId and userId are required to create an export job.');
    }

    const normalized = this.normalizeOptions(options);
    this.validateOptions(normalized);

    const jobId = generateId();
    const job: ExportJob = {
      id: jobId,
      projectId,
      userId,
      status: 'pending',
      progress: 0,
      currentPhase: 'initializing',
      options: normalized,
      platform: normalized.targetPlatform,
      createdAt: new Date(),
      metrics: {
        retries: 0,
        lastUpdated: new Date(),
      },
      logs: [],
    };

    this.jobs.set(jobId, job);
    this.enqueueJob(jobId);
    return cloneJob(job);
  }

  async quickExport(
    projectId: string,
    userId: string,
    platform: TargetPlatform,
  ): Promise<ExportJob> {
    const preset = PLATFORM_PRESETS[platform];
    if (!preset) {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    const options: ExportOptions = {
      format: preset.format,
      codec: preset.codec,
      audioCodec: preset.audioCodec,
      resolution: preset.resolution,
      fps: preset.fps,
      targetBitrate: preset.targetBitrate,
      maxBitrate: preset.maxBitrate,
      quality: preset.quality,
      aspectRatio: preset.aspectRatio,
      maxDuration: preset.maxDuration,
      maxFileSize: preset.maxFileSize,
      colorProfile: preset.colorProfile,
      optimization: preset.optimization ?? 'balanced',
      includeThumbnail: true,
      includeMetadata: true,
      includeWatermark: false,
      targetPlatform: platform,
      presetName: preset.name,
      filters: preset.recommendedFilters ? { presetFilters: preset.recommendedFilters } : undefined,
    };

    return this.createExportJob(projectId, userId, options);
  }

  async batchExport(
    projectIds: string[],
    userId: string,
    options: ExportOptions,
  ): Promise<ExportJob[]> {
    if (!Array.isArray(projectIds) || projectIds.length === 0) {
      throw new Error('At least one projectId must be provided for batch export.');
    }

    const jobs: ExportJob[] = [];
    for (const projectId of projectIds) {
      const job = await this.createExportJob(projectId, userId, options);
      jobs.push(job);
    }
    return jobs;
  }

  getJob(jobId: string): ExportJob | null {
    const job = this.jobs.get(jobId);
    return job ? cloneJob(job) : null;
  }

  getJobsByProject(projectId: string): ExportJob[] {
    return Array.from(this.jobs.values())
      .filter(job => job.projectId === projectId)
      .map(cloneJob);
  }

  getJobsByUser(userId: string): ExportJob[] {
    return Array.from(this.jobs.values())
      .filter(job => job.userId === userId)
      .map(cloneJob);
  }

  listActiveJobs(): ExportJob[] {
    return Array.from(this.jobs.values())
      .filter(job => job.status === 'pending' || job.status === 'processing')
      .map(cloneJob);
  }

  async cancelJob(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    if (!job) {
      return false;
    }

    if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
      return false;
    }

    this.cancelledJobs.add(jobId);
    job.status = 'cancelled';
    job.error = 'Job cancelled by user.';
    job.progress = Math.min(job.progress, 95);
    job.currentPhase = 'finalizing';
    job.completedAt = new Date();
    job.metrics.lastUpdated = new Date();
    this.log(job, 'Export job cancelled.');

    this.removeFromQueue(jobId);
    return true;
  }

  async retryJob(jobId: string): Promise<ExportJob | null> {
    const job = this.jobs.get(jobId);
    if (!job) {
      return null;
    }

    const clonedOptions = { ...job.options };
    const newJob = await this.createExportJob(job.projectId, job.userId, clonedOptions);
    newJob.metrics.retries = job.metrics.retries + 1;
    this.jobs.set(newJob.id, { ...this.jobs.get(newJob.id)!, metrics: newJob.metrics });
    return cloneJob(this.jobs.get(newJob.id)!);
  }

  getSystemMetrics(): SystemMetrics {
    const jobs = Array.from(this.jobs.values());
    const totals = {
      totalJobs: jobs.length,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
    };

    const completedDurations: number[] = [];

    for (const job of jobs) {
      totals[job.status] = (totals as Record<string, number>)[job.status] + 1;
      if (job.status === 'completed' && job.startedAt && job.completedAt) {
        completedDurations.push(job.completedAt.getTime() - job.startedAt.getTime());
      }
    }

    const averageDuration = completedDurations.length
      ? completedDurations.reduce((sum, value) => sum + value, 0) / completedDurations.length
      : null;

    return {
      ...totals,
      averageDuration,
    };
  }

  getSupportedFormats(): ExportFormat[] {
    return [...SUPPORTED_EXPORT_FORMATS];
  }

  private enqueueJob(jobId: string): void {
    this.jobQueue.push(jobId);
    void this.processQueue();
  }

  private removeFromQueue(jobId: string): void {
    const idx = this.jobQueue.indexOf(jobId);
    if (idx >= 0) {
      this.jobQueue.splice(idx, 1);
    }
  }

  private async processQueue(): Promise<void> {
    if (this.activeJobs.size >= this.maxConcurrentJobs) {
      return;
    }

    const jobId = this.jobQueue.shift();
    if (!jobId) {
      return;
    }

    const job = this.jobs.get(jobId);
    if (!job) {
      return;
    }

    this.activeJobs.add(jobId);

    try {
      await this.processJob(job);
    } finally {
      this.activeJobs.delete(jobId);
      if (this.jobQueue.length > 0) {
        void this.processQueue();
      }
    }
  }

  private async processJob(job: ExportJob): Promise<void> {
    job.status = 'processing';
    job.startedAt = new Date();
    job.metrics.lastUpdated = new Date();
    this.log(job, 'Export job started.');

    for (const phase of PROCESSING_PIPELINE) {
      if (this.cancelledJobs.has(job.id)) {
        this.log(job, `Processing stopped during ${phase.phase}.`, 'warn');
        return;
      }

      job.currentPhase = phase.phase;
      this.log(job, `Phase ${phase.phase} started.`);
      await this.runPhase(job, phase);
    }

    if (this.cancelledJobs.has(job.id)) {
      this.log(job, 'Job cancelled during finalization.', 'warn');
      return;
    }

    job.progress = 100;
    job.status = 'completed';
    job.completedAt = new Date();
    job.outputPath = this.buildOutputPath(job);
    job.thumbnailPath = this.buildThumbnailPath(job);
    job.metadata = this.generateMetadata(job);
    job.metrics.lastUpdated = new Date();
    job.metrics.qualityScore = this.calculateQualityScore(job);
    job.metrics.averageFps = job.metadata?.fps;
    this.log(job, 'Export job completed successfully.');
    this.cancelledJobs.delete(job.id);
  }

  private async runPhase(job: ExportJob, phase: PhaseDefinition): Promise<void> {
    const steps = 5;
    const increment = (phase.maxProgress - phase.minProgress) / steps;
    const baseDelay = Math.max(phase.duration / steps, 50);

    for (let index = 1; index <= steps; index += 1) {
      if (this.cancelledJobs.has(job.id)) {
        return;
      }

      const progress = Math.min(
        phase.maxProgress,
        Math.round(phase.minProgress + increment * index),
      );

      job.progress = progress;
      job.metrics.lastUpdated = new Date();
      await sleep(baseDelay + Math.floor(Math.random() * 75));
    }
  }

  private normalizeOptions(options: ExportOptions): ExportOptions {
    const format = options.format;
    const codec = options.codec ?? DEFAULT_CODEC_BY_FORMAT[format];
    const audioCodec = options.audioCodec ?? (NON_AUDIO_FORMATS.has(format) ? undefined : DEFAULT_AUDIO_CODEC);
    const resolution = options.resolution ?? DEFAULT_RESOLUTION;
    const fps = options.fps ?? DEFAULT_FPS;
    const bitrate = options.bitrate ?? options.targetBitrate ?? this.suggestBitrate(format, resolution);

    return {
      quality: 'high',
      optimization: 'balanced',
      includeMetadata: true,
      includeThumbnail: true,
      includeWatermark: false,
      compression: true,
      ...options,
      codec,
      audioCodec,
      resolution,
      fps,
      bitrate,
      targetBitrate: options.targetBitrate ?? bitrate,
    };
  }

  private validateOptions(options: ExportOptions): void {
    if (!SUPPORTED_EXPORT_FORMATS.includes(options.format)) {
      throw new Error(`Unsupported export format: ${options.format}`);
    }

    if (options.resolution && !/^\d+x\d+$/.test(options.resolution)) {
      throw new Error(`Invalid resolution provided: ${options.resolution}`);
    }

    if (options.fps && (options.fps <= 0 || options.fps > 120)) {
      throw new Error('Frames per second must be between 1 and 120.');
    }

    if (options.bitrate && options.bitrate <= 0) {
      throw new Error('Bitrate must be a positive value.');
    }
  }

  private buildOutputPath(job: ExportJob): string {
    const extension = job.options.format;
    const baseName = job.options.customFileName ?? job.id;
    return `/exports/${baseName}.${extension}`;
  }

  private buildThumbnailPath(job: ExportJob): string | undefined {
    if (!job.options.includeThumbnail || job.options.format === 'zip') {
      return undefined;
    }
    return `/exports/${job.id}.thumbnail.jpg`;
  }

  private generateMetadata(job: ExportJob): ExportMetadata {
    const duration = Math.min(job.options.maxDuration ?? 180, 45 + Math.floor(Math.random() * 180));
    const bitrate = job.options.bitrate ?? job.options.targetBitrate ?? 4000;
    const fps = job.options.fps ?? DEFAULT_FPS;
    const fileSize = this.estimateFileSize(bitrate, duration);
    const processingTime = job.startedAt && job.completedAt
      ? (job.completedAt.getTime() - job.startedAt.getTime()) / 1000
      : duration * 0.1;

    return {
      duration,
      fileSize,
      format: job.options.format,
      codec: job.options.codec,
      audioCodec: job.options.audioCodec,
      resolution: job.options.resolution,
      bitrate,
      fps,
      hasAudio: !NON_AUDIO_FORMATS.has(job.options.format),
      hasSubtitles: Boolean(job.options.includeSubtitles),
      processingTime,
      colorProfile: job.options.colorProfile ?? 'bt709',
    };
  }

  private estimateFileSize(bitrate: number, durationSeconds: number): number {
    const bitsPerSecond = bitrate * 1000;
    const totalBits = bitsPerSecond * durationSeconds;
    const totalBytes = totalBits / 8;
    const totalMegabytes = totalBytes / (1024 * 1024);
    return Math.max(1, Math.round(totalMegabytes));
  }

  private suggestBitrate(format: ExportFormat, resolution: string): number {
    const [width, height] = resolution.split('x').map(value => Number.parseInt(value, 10));
    const pixels = width * height;
    const base = format === 'webm' ? 2800 : 3200;
    if (pixels >= 3840 * 2160) {
      return base * 4;
    }
    if (pixels >= 1920 * 1080) {
      return base * 2;
    }
    if (pixels >= 1280 * 720) {
      return Math.round(base * 1.2);
    }
    return Math.round(base * 0.7);
  }

  private calculateQualityScore(job: ExportJob): number {
    const baseScore = job.options.quality === 'ultra' ? 95 : job.options.quality === 'high' ? 90 : 80;
    const optimizationBonus = job.options.optimization === 'best' ? 4 : job.options.optimization === 'fast' ? -2 : 0;
    const bitrateBonus = job.options.bitrate && job.options.bitrate > 8000 ? 3 : 0;
    return Math.min(100, baseScore + optimizationBonus + bitrateBonus);
  }

  private log(job: ExportJob, message: string, level: JobLogEntry['level'] = 'info'): void {
    job.logs.push({ timestamp: Date.now(), message, level });
    if (job.logs.length > 100) {
      job.logs.shift();
    }
  }
}

export const exportSystem = new ExportAdvancedSystem();

export {
  SUPPORTED_EXPORT_FORMATS,
};
