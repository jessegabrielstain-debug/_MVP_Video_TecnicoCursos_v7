/**
 * Validation schemas for statistics endpoints
 */

import { z } from 'zod';

/**
 * Schema para estatísticas de jobs
 */
export const JobStatsSchema = z.object({
  period: z.number().int().min(1).max(1440).optional().default(60), // minutos
  includeBreakdown: z.boolean().optional().default(false),
  groupBy: z.enum(['status', 'user', 'project']).optional(),
});

export type JobStatsInput = z.infer<typeof JobStatsSchema>;

/**
 * Schema para estatísticas de usuário
 */
export const UserStatsSchema = z.object({
  userId: z.string().uuid('User ID deve ser um UUID válido'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  includeProjects: z.boolean().optional().default(false),
});

export type UserStatsInput = z.infer<typeof UserStatsSchema>;

/**
 * Schema para estatísticas de projeto
 */
export const ProjectStatsSchema = z.object({
  projectId: z.string().uuid('Project ID deve ser um UUID válido'),
  includeJobs: z.boolean().optional().default(false),
  includeSlides: z.boolean().optional().default(false),
});

export type ProjectStatsInput = z.infer<typeof ProjectStatsSchema>;

/**
 * Schema para estatísticas globais
 */
export const GlobalStatsSchema = z.object({
  period: z.enum(['today', 'week', 'month', 'year', 'all']).optional().default('month'),
  includeCharts: z.boolean().optional().default(false),
});

export type GlobalStatsInput = z.infer<typeof GlobalStatsSchema>;

/**
 * Schema para estatísticas de fila
 */
export const QueueStatsSchema = z.object({
  queueName: z.string().optional().default('video-render'),
  includeJobs: z.boolean().optional().default(false),
  limit: z.number().int().min(1).max(100).optional().default(10),
});

export type QueueStatsInput = z.infer<typeof QueueStatsSchema>;
