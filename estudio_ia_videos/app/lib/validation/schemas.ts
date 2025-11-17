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
  period: z.enum(['24h', '7d', '30d', 'all']).default('7d'),
  includeErrors: z.coerce.boolean().default(true),
  includePerformance: z.coerce.boolean().default(true),
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
