/**
 * Validation schemas for metrics endpoints
 */

import { z } from 'zod';

/**
 * Schema para métricas de job
 */
export const JobMetricsSchema = z.object({
  jobId: z.string().uuid('ID do job deve ser um UUID válido'),
  includeDetails: z.boolean().optional().default(false),
  period: z.enum(['1h', '6h', '24h', '7d', '30d']).optional().default('24h'),
});

export type JobMetricsInput = z.infer<typeof JobMetricsSchema>;

/**
 * Schema para métricas agregadas
 */
export const AggregateMetricsSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  groupBy: z.enum(['hour', 'day', 'week', 'month']).optional().default('day'),
  includeErrors: z.boolean().optional().default(false),
});

export type AggregateMetricsInput = z.infer<typeof AggregateMetricsSchema>;

/**
 * Schema para métricas de renderização
 */
export const RenderMetricsSchema = z.object({
  projectId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  status: z.enum(['queued', 'processing', 'completed', 'failed']).optional(),
  limit: z.number().int().min(1).max(1000).optional().default(100),
  offset: z.number().int().min(0).optional().default(0),
});

export type RenderMetricsInput = z.infer<typeof RenderMetricsSchema>;

/**
 * Schema para métricas de performance
 */
export const PerformanceMetricsSchema = z.object({
  metric: z.enum(['render_time', 'queue_wait', 'upload_time', 'total_time']),
  percentile: z.enum(['p50', 'p90', 'p95', 'p99']).optional().default('p95'),
  period: z.string().regex(/^\d+[hdwm]$/, 'Período inválido (ex: 1h, 7d, 1w, 1m)').optional().default('24h'),
});

export type PerformanceMetricsInput = z.infer<typeof PerformanceMetricsSchema>;

/**
 * Schema para métricas de erros
 */
export const ErrorMetricsSchema = z.object({
  errorType: z.string().optional(),
  severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  groupBy: z.enum(['type', 'stage', 'project']).optional().default('type'),
  limit: z.number().int().min(1).max(100).optional().default(20),
});

export type ErrorMetricsInput = z.infer<typeof ErrorMetricsSchema>;
