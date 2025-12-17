/**
 * Zod Validation Schemas
 * Schemas de validação centralizados para toda a aplicação
 * Conforme Fase 1 do plano de implementação
 */

import { z } from 'zod';

// =====================================
// Video Job Schemas
// =====================================

export const VideoJobInputSchema = z.object({
  projectId: z.string().uuid('ID de projeto inválido'),
  title: z.string().min(1, 'Título é obrigatório').max(200, 'Título muito longo'),
  slideIds: z.array(z.string().uuid()).min(1, 'Pelo menos um slide é necessário'),
  settings: z.object({
    resolution: z.enum(['720p', '1080p', '4k']).default('1080p'),
    fps: z.number().int().min(24).max(60).default(30),
    format: z.enum(['mp4', 'webm', 'mov']).default('mp4'),
    quality: z.enum(['low', 'medium', 'high', 'ultra']).default('high'),
  }).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type VideoJobInput = z.infer<typeof VideoJobInputSchema>;

// =====================================
// Video Job Status & Query Schemas
// =====================================

export const VideoJobStatusSchema = z.object({
  jobId: z.string().uuid('ID de job inválido'),
});

export const VideoJobQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']).optional(),
  projectId: z.string().uuid().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type VideoJobQuery = z.infer<typeof VideoJobQuerySchema>;

// =====================================
// Metrics & Stats Schemas
// =====================================

export const VideoJobMetricsSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  projectId: z.string().uuid().optional(),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
  includeDetails: z.coerce.boolean().default(false),
});

export type VideoJobMetrics = z.infer<typeof VideoJobMetricsSchema>;

export const RenderStatsQuerySchema = z.object({
  timeRange: z.enum(['1h', '24h', '7d', '30d', '90d']).default('24h'),
  status: z.enum(['all', 'queued', 'pending', 'processing', 'completed', 'failed']).default('all'),
  userId: z.string().uuid().optional(),
  projectType: z.string().optional(),
  includeErrors: z.coerce.boolean().default(false),
  includePerformance: z.coerce.boolean().default(false),
});

export type RenderStatsQuery = z.infer<typeof RenderStatsQuerySchema>;

// =====================================
// Job Control Schemas (Cancel, Retry)
// =====================================

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

// =====================================
// Analytics Schemas
// =====================================

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

// =====================================
// Project & Slide Schemas
// =====================================

export const ProjectCreateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(200),
  description: z.string().max(2000).optional(),
  originalFileName: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type ProjectCreate = z.infer<typeof ProjectCreateSchema>;

export const SlideUpdateSchema = z.object({
  slideId: z.string().uuid(),
  content: z.string().optional(),
  duration: z.number().positive().optional(),
  transitionType: z.string().optional(),
  orderIndex: z.number().int().nonnegative().optional(),
});

export type SlideUpdate = z.infer<typeof SlideUpdateSchema>;

// =====================================
// Authentication Schemas
// =====================================

export const LoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

export type Login = z.infer<typeof LoginSchema>;

export const RegisterSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  name: z.string().min(1, 'Nome é obrigatório').max(200),
});

export type Register = z.infer<typeof RegisterSchema>;

// =====================================
// Utility Functions
// =====================================

/**
 * Valida dados contra um schema Zod e retorna resultado estruturado
 */
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: z.ZodError;
} {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

/**
 * Formata erros Zod para mensagens amigáveis
 */
export function formatZodErrors(errors: z.ZodError): Record<string, string> {
  const formatted: Record<string, string> = {};
  errors.errors.forEach((err) => {
    const path = err.path.join('.');
    formatted[path] = err.message;
  });
  return formatted;
}

// =====================================
// TTS Schemas
// =====================================

export const TTSProviderSchema = z.enum(['elevenlabs', 'azure', 'google', 'aws']);

export const TTSGenerateSchema = z.object({
  text: z.string()
    .min(1, 'Texto é obrigatório')
    .max(5000, 'Texto muito longo (máx 5000 caracteres)'),
  provider: TTSProviderSchema.default('elevenlabs'),
  voiceId: z.string().min(1, 'Voice ID é obrigatório'),
  language: z.string().default('pt-BR'),
  options: z.object({
    speed: z.number().min(0.25).max(4).default(1),
    pitch: z.number().min(-20).max(20).default(0),
    stability: z.number().min(0).max(1).optional(),
    similarityBoost: z.number().min(0).max(1).optional(),
  }).optional(),
  slideId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
});

export type TTSGenerate = z.infer<typeof TTSGenerateSchema>;

// =====================================
// Avatar Schemas
// =====================================

export const AvatarProviderSchema = z.enum(['heygen', 'did', 'synthesia', 'custom']);

export const AvatarRenderSchema = z.object({
  provider: AvatarProviderSchema,
  avatarId: z.string().min(1, 'Avatar ID é obrigatório'),
  script: z.string().min(1).max(10000),
  voiceId: z.string().optional(),
  expression: z.string().optional(),
  background: z.string().optional(),
  projectId: z.string().uuid().optional(),
  webhook: z.string().url().optional(),
});

export type AvatarRender = z.infer<typeof AvatarRenderSchema>;

// =====================================
// Export Schemas
// =====================================

export const ExportFormatSchema = z.enum([
  'mp4',
  'webm',
  'mov',
  'gif',
  'png-sequence',
  'audio-only',
]);

export const ExportOptionsSchema = z.object({
  format: ExportFormatSchema.default('mp4'),
  quality: z.enum(['low', 'medium', 'high', 'ultra']).default('high'),
  resolution: z.object({
    width: z.number().int().min(320).max(7680).default(1920),
    height: z.number().int().min(240).max(4320).default(1080),
  }).optional(),
  watermark: z.boolean().default(false),
  includeSubtitles: z.boolean().default(false),
  notification: z.object({
    email: z.boolean().default(true),
    webhook: z.string().url().optional(),
  }).optional(),
});

export type ExportOptions = z.infer<typeof ExportOptionsSchema>;

// =====================================
// Pagination & Filtering
// =====================================

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type Pagination = z.infer<typeof PaginationSchema>;

export const DateRangeSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
}).refine(
  (data) => !data.from || !data.to || data.from <= data.to,
  { message: 'Data inicial deve ser anterior à data final' }
);

export type DateRange = z.infer<typeof DateRangeSchema>;

// =====================================
// API Response Helpers
// =====================================

/**
 * Get first error message from Zod error
 */
export function getFirstZodError(error: z.ZodError): string {
  return error.errors[0]?.message || 'Dados inválidos';
}

/**
 * Create validation error response
 */
export function createValidationErrorResponse(error: z.ZodError) {
  return {
    success: false,
    error: getFirstZodError(error),
    details: formatZodErrors(error),
  };
}
