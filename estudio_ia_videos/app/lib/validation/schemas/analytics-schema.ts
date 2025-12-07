/**
 * Validation schemas for analytics endpoints
 */

import { z } from 'zod';

/**
 * Schema para eventos de analytics
 */
export const AnalyticsEventSchema = z.object({
  eventType: z.enum([
    'page_view',
    'button_click',
    'video_render_start',
    'video_render_complete',
    'video_render_fail',
    'slide_create',
    'slide_update',
    'slide_delete',
    'project_create',
    'project_update',
    'project_delete',
    'user_login',
    'user_logout',
  ]),
  userId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).optional(),
  timestamp: z.string().datetime().optional(),
});

export type AnalyticsEventInput = z.infer<typeof AnalyticsEventSchema>;

/**
 * Schema para query de analytics
 */
export const AnalyticsQuerySchema = z.object({
  eventType: z.string().optional(),
  userId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(1000).optional().default(100),
  offset: z.number().int().min(0).optional().default(0),
});

export type AnalyticsQueryInput = z.infer<typeof AnalyticsQuerySchema>;

/**
 * Schema para render stats analytics
 */
export const RenderStatsQuerySchema = z.object({
  period: z.number().int().min(1).max(10080).optional().default(60), // minutos (max 1 semana)
  includeErrors: z.boolean().optional().default(false),
  includePercentiles: z.boolean().optional().default(true),
  groupBy: z.enum(['hour', 'day', 'status']).optional(),
});

export type RenderStatsQueryInput = z.infer<typeof RenderStatsQuerySchema>;

/**
 * Schema para funnel analytics
 */
export const FunnelAnalyticsSchema = z.object({
  funnel: z.enum(['video_creation', 'user_onboarding', 'project_lifecycle']),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type FunnelAnalyticsInput = z.infer<typeof FunnelAnalyticsSchema>;

/**
 * Schema para cohort analytics
 */
export const CohortAnalyticsSchema = z.object({
  cohortType: z.enum(['weekly', 'monthly']),
  startDate: z.string().datetime(),
  metric: z.enum(['retention', 'engagement', 'conversion']),
});

export type CohortAnalyticsInput = z.infer<typeof CohortAnalyticsSchema>;
