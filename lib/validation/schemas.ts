import { z } from 'zod';

const booleanLike = z.preprocess((value: unknown) => {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'y'].includes(normalized)) return true;
    if (['false', '0', 'no', 'n'].includes(normalized)) return false;
  }
  return value;
}, z.boolean());

const dateLike = z.preprocess((value: unknown) => {
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date;
    }
    return undefined;
  }
  return value;
}, z.date());

const statsPeriodEnum = z.enum(['1h', '24h', '7d', '30d', 'all']);
const analyticsTimeRangeEnum = z.enum(['1h', '24h', '7d', '30d', '90d']);
const analyticsStatusEnum = z.enum(['all', 'completed', 'failed', 'processing', 'pending']);

// =============================
// Slides e Video Jobs Base
// =============================

export const SlideInputSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  content: z.string().min(1, 'Conteúdo é obrigatório'),
  order_index: z.number().int().nonnegative(),
});

export const VideoJobInputSchema = z.object({
  project_id: z.string().uuid('ID de projeto inválido'),
  slides: z.array(SlideInputSchema).min(1, 'Pelo menos um slide é necessário'),
  tts_voice: z.string().optional(),
  quality: z.enum(['low', 'medium', 'high']).default('medium'),
  flow: z
    .object({
      enabled: z.boolean().default(false),
      bpmSource: z.enum(['auto', 'manual']).default('auto'),
      bpmManual: z.number().positive().optional(),
      beatToleranceMs: z.number().int().positive().max(200).default(25),
      crossfadeRatio: z.number().min(0.2).max(0.6).default(0.35),
      sidechain: z.object({ threshold: z.number().min(0).default(0.015), ratio: z.number().min(1).max(10).default(4) }).optional(),
    })
    .optional(),
});

export type SlideInput = z.infer<typeof SlideInputSchema>;
export type VideoJobInput = z.infer<typeof VideoJobInputSchema>;

// =============================
// Job Status e Progress
// =============================

export const JobStatusEnum = z.enum(['queued', 'processing', 'completed', 'failed', 'cancelled']);

export const VideoJobProgressSchema = z.object({
  jobId: z.string().uuid('ID de job inválido'),
  progress: z.number().min(0).max(100),
  status: JobStatusEnum,
  currentStep: z.string().optional(),
  estimatedTimeRemaining: z.number().nonnegative().optional(),
});

export type VideoJobProgress = z.infer<typeof VideoJobProgressSchema>;

export const VideoJobIdSchema = z.object({
  id: z.string().uuid('ID de job inválido'),
  jobId: z.string().uuid('ID de job inválido').optional(), // Compatibilidade
});

export type VideoJobId = z.infer<typeof VideoJobIdSchema>;

// =============================
// Métricas, Stats e Analytics
// =============================

export const VideoJobMetricsSchema = z
  .object({
    startDate: dateLike.optional(),
    endDate: dateLike.optional(),
    projectId: z.string().uuid('ID de projeto inválido').optional(),
    groupBy: z.enum(['hour', 'day', 'week', 'month']).default('day'),
    includeDetails: booleanLike.optional().default(false),
  })
  .refine(
    data => {
      if (data.startDate && data.endDate) {
        return data.startDate.getTime() <= data.endDate.getTime();
      }
      return true;
    },
    { message: 'startDate deve ser anterior ao endDate', path: ['endDate'] }
  );

export type VideoJobMetrics = z.infer<typeof VideoJobMetricsSchema>;

export const RenderStatsQuerySchema = z.object({
  period: z
    .preprocess(value => (typeof value === 'string' ? value.toLowerCase() : value), statsPeriodEnum)
    .default('7d'),
  includeErrors: booleanLike.optional().default(true),
  includePerformance: booleanLike.optional().default(true),
  limit: z.coerce.number().int().positive().max(5000).default(5000),
});

export type RenderStatsQuery = z.infer<typeof RenderStatsQuerySchema>;

export const VideoJobStatsQuerySchema = RenderStatsQuerySchema.extend({
  status: JobStatusEnum.optional(),
  projectId: z.string().uuid('ID de projeto inválido').optional(),
});

export type VideoJobStatsQuery = z.infer<typeof VideoJobStatsQuerySchema>;

export const AnalyticsEventSchema = z.object({
  eventType: z.enum([
    'slide_reordered',
    'video_exported',
    'project_created',
    'render_started',
    'render_completed',
    'render_failed',
    'user_login',
    'user_logout',
  ]),
  eventData: z.record(z.unknown()),
  userId: z.string().uuid('ID de usuário inválido').optional(),
  sessionId: z.string().optional(),
  timestamp: z.coerce.date().default(() => new Date()),
});

export type AnalyticsEvent = z.infer<typeof AnalyticsEventSchema>;

export const AnalyticsQuerySchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  eventTypes: z.array(z.string()).optional(),
  userId: z.string().uuid('ID de usuário inválido').optional(),
  limit: z.coerce.number().int().positive().max(1000).default(100),
  offset: z.coerce.number().int().nonnegative().default(0),
});

export type AnalyticsQuery = z.infer<typeof AnalyticsQuerySchema>;

export const RenderAnalyticsQuerySchema = z.object({
  timeRange: z
    .preprocess(value => (typeof value === 'string' ? value.toLowerCase() : value), analyticsTimeRangeEnum)
    .default('24h'),
  userId: z.string().uuid('ID de usuário inválido').optional(),
  projectType: z.string().min(1).optional(),
  status: z
    .preprocess(value => (typeof value === 'string' ? value.toLowerCase() : value), analyticsStatusEnum)
    .default('all'),
  includeErrors: booleanLike.optional().default(true),
  includePerformance: booleanLike.optional().default(true),
});

export type RenderAnalyticsQuery = z.infer<typeof RenderAnalyticsQuerySchema>;

// =============================
// Controle de Jobs (Cancel/Retry/Requeue)
// =============================

export const VideoJobCancelSchema = z.preprocess((value: unknown) => {
  if (typeof value === 'object' && value !== null) {
    const record = value as Record<string, unknown> & { id?: unknown; job_id?: unknown };
    if (!('jobId' in record)) {
      if (record.id) return { ...record, jobId: record.id };
      if (record.job_id) return { ...record, jobId: record.job_id };
    }
  }
  return value;
}, z.object({
  jobId: z.string().uuid('ID de job inválido'),
  reason: z.string().max(500).optional(),
}));

export type VideoJobCancel = z.infer<typeof VideoJobCancelSchema>;

export const VideoJobRetrySchema = z.object({
  jobId: z.string().uuid('ID de job inválido'),
  force: booleanLike.optional().default(false),
});

export type VideoJobRetry = z.infer<typeof VideoJobRetrySchema>;

export const VideoJobRequeueSchema = z.object({
  jobId: z.string().uuid('ID de job inválido'),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
  resetProgress: booleanLike.optional().default(false),
});

export type VideoJobRequeue = z.infer<typeof VideoJobRequeueSchema>;

// =============================
// Query/List Schemas
// =============================

export const VideoJobsListQuerySchema = z.object({
  status: JobStatusEnum.optional(),
  projectId: z.string().uuid('ID de projeto inválido').optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
  sortBy: z.enum(['created_at', 'updated_at', 'status']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type VideoJobsListQuery = z.infer<typeof VideoJobsListQuerySchema>;

// =============================
// Response Schemas (para documentação)
// =============================

export const VideoJobResponseSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  project_id: z.string().uuid().nullable(),
  status: JobStatusEnum,
  progress: z.number().min(0).max(100),
  attempts: z.number().int().nonnegative(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime().optional(),
  completed_at: z.string().datetime().nullable(),
  duration_ms: z.number().nonnegative().nullable(),
  render_settings: z.record(z.unknown()).nullable(),
  error_message: z.string().nullable(),
});

export type VideoJobResponse = z.infer<typeof VideoJobResponseSchema>;

