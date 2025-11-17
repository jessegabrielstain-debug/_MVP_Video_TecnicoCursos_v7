import { z } from 'zod';

export const SlideInputSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  order_index: z.number().int().nonnegative(),
});

export const VideoJobInputSchema = z.object({
  project_id: z.string().uuid(),
  slides: z.array(SlideInputSchema).min(1),
  tts_voice: z.string().optional(),
  quality: z.enum(['low', 'medium', 'high']).default('medium'),
});

export type SlideInput = z.infer<typeof SlideInputSchema>;
export type VideoJobInput = z.infer<typeof VideoJobInputSchema>;

// =============================
// Métricas, Stats e Analytics
// =============================

export const VideoJobMetricsSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  projectId: z.string().uuid().optional(),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
  includeDetails: z.coerce.boolean().default(false),
});

export type VideoJobMetrics = z.infer<typeof VideoJobMetricsSchema>;

export const RenderStatsQuerySchema = z.object({
  period: z.enum(['24h', '7d', '30d', 'all']).default('7d'),
  includeErrors: z.coerce.boolean().default(true),
  includePerformance: z.coerce.boolean().default(true),
});

export type RenderStatsQuery = z.infer<typeof RenderStatsQuerySchema>;

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
  userId: z.string().uuid().optional(),
  sessionId: z.string().optional(),
  timestamp: z.coerce.date().default(() => new Date()),
});

export type AnalyticsEvent = z.infer<typeof AnalyticsEventSchema>;

export const AnalyticsQuerySchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  eventTypes: z.array(z.string()).optional(),
  userId: z.string().uuid().optional(),
  limit: z.coerce.number().int().positive().max(1000).default(100),
  offset: z.coerce.number().int().nonnegative().default(0),
});

export type AnalyticsQuery = z.infer<typeof AnalyticsQuerySchema>;

// =============================
// Controle de Jobs (Cancel/Retry)
// =============================

export const VideoJobCancelSchema = z.object({
  jobId: z.string().uuid('ID de job inválido'),
  reason: z.string().max(500).optional(),
});

export type VideoJobCancel = z.infer<typeof VideoJobCancelSchema>;

export const VideoJobRetrySchema = z.object({
  jobId: z.string().uuid('ID de job inválido'),
  force: z.coerce.boolean().default(false),
});

export type VideoJobRetry = z.infer<typeof VideoJobRetrySchema>;
