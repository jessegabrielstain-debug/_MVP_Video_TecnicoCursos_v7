/**
 * Webhook Validation Schemas
 * 
 * Schemas para validação de webhooks de entrada e saída
 * 
 * @module lib/validation/schemas/webhook-schema
 */

import { z } from 'zod';

// =====================================
// Webhook Event Types
// =====================================

export const WebhookEventTypeSchema = z.enum([
  // Render events
  'render.started',
  'render.progress',
  'render.completed',
  'render.failed',
  'render.cancelled',
  
  // Project events
  'project.created',
  'project.updated',
  'project.deleted',
  'project.exported',
  
  // TTS events
  'tts.generated',
  'tts.failed',
  
  // Avatar events
  'avatar.render.started',
  'avatar.render.completed',
  'avatar.render.failed',
  
  // User events
  'user.login',
  'user.signup',
  'user.subscription.changed',
]);

export type WebhookEventType = z.infer<typeof WebhookEventTypeSchema>;

// =====================================
// Webhook Payload Schemas
// =====================================

/**
 * Base webhook payload (incoming from external services)
 */
export const WebhookPayloadBaseSchema = z.object({
  event: z.string(),
  timestamp: z.coerce.date().optional(),
  data: z.record(z.unknown()),
});

/**
 * HeyGen webhook payload
 */
export const HeyGenWebhookPayloadSchema = z.object({
  event_type: z.enum(['avatar_video.success', 'avatar_video.fail', 'avatar_video.progress']),
  video_id: z.string(),
  callback_id: z.string().optional(),
  data: z.object({
    video_url: z.string().url().optional(),
    thumbnail_url: z.string().url().optional(),
    duration: z.number().optional(),
    error: z.string().optional(),
    progress: z.number().min(0).max(100).optional(),
  }).optional(),
});

export type HeyGenWebhookPayload = z.infer<typeof HeyGenWebhookPayloadSchema>;

/**
 * ElevenLabs webhook payload
 */
export const ElevenLabsWebhookPayloadSchema = z.object({
  type: z.enum(['voice.created', 'audio.generated', 'voice.deleted']),
  voice_id: z.string().optional(),
  audio_url: z.string().url().optional(),
  status: z.enum(['success', 'failed', 'pending']).optional(),
  error: z.object({
    message: z.string(),
    code: z.string().optional(),
  }).optional(),
});

export type ElevenLabsWebhookPayload = z.infer<typeof ElevenLabsWebhookPayloadSchema>;

/**
 * Generic render webhook payload
 */
export const RenderWebhookPayloadSchema = z.object({
  job_id: z.string().uuid(),
  status: z.enum(['queued', 'processing', 'completed', 'failed', 'cancelled']),
  progress: z.number().min(0).max(100).optional(),
  output_url: z.string().url().optional(),
  thumbnail_url: z.string().url().optional(),
  duration: z.number().positive().optional(),
  error: z.object({
    message: z.string(),
    code: z.string().optional(),
    stack: z.string().optional(),
  }).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type RenderWebhookPayload = z.infer<typeof RenderWebhookPayloadSchema>;

// =====================================
// Webhook Configuration Schemas
// =====================================

/**
 * Webhook subscription creation
 */
export const WebhookSubscriptionSchema = z.object({
  url: z.string().url('URL inválida')
    .refine(
      (url) => url.startsWith('https://'),
      'Webhook URL deve usar HTTPS'
    ),
  events: z.array(WebhookEventTypeSchema)
    .min(1, 'Selecione pelo menos um evento'),
  secret: z.string()
    .min(16, 'Secret deve ter pelo menos 16 caracteres')
    .max(256)
    .optional(),
  headers: z.record(z.string()).optional(),
  retries: z.number().int().min(0).max(10).default(3),
  timeout: z.number().int().min(1000).max(30000).default(5000),
  enabled: z.boolean().default(true),
});

export type WebhookSubscription = z.infer<typeof WebhookSubscriptionSchema>;

/**
 * Webhook update
 */
export const WebhookUpdateSchema = WebhookSubscriptionSchema.partial().extend({
  id: z.string().uuid(),
});

export type WebhookUpdate = z.infer<typeof WebhookUpdateSchema>;

/**
 * Webhook test payload
 */
export const WebhookTestSchema = z.object({
  webhookId: z.string().uuid(),
  eventType: WebhookEventTypeSchema.optional(),
  payload: z.record(z.unknown()).optional(),
});

export type WebhookTest = z.infer<typeof WebhookTestSchema>;

// =====================================
// Webhook Delivery Schemas
// =====================================

/**
 * Outgoing webhook delivery
 */
export const WebhookDeliverySchema = z.object({
  id: z.string().uuid(),
  webhook_id: z.string().uuid(),
  event: WebhookEventTypeSchema,
  payload: z.record(z.unknown()),
  attempt: z.number().int().min(1),
  status: z.enum(['pending', 'success', 'failed']),
  response_code: z.number().int().optional(),
  response_body: z.string().optional(),
  error: z.string().optional(),
  delivered_at: z.coerce.date().optional(),
  next_retry_at: z.coerce.date().optional(),
});

export type WebhookDelivery = z.infer<typeof WebhookDeliverySchema>;

// =====================================
// Query Schemas
// =====================================

export const WebhookListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  event: WebhookEventTypeSchema.optional(),
  enabled: z.coerce.boolean().optional(),
});

export type WebhookListQuery = z.infer<typeof WebhookListQuerySchema>;

export const WebhookDeliveryQuerySchema = z.object({
  webhookId: z.string().uuid().optional(),
  status: z.enum(['pending', 'success', 'failed']).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type WebhookDeliveryQuery = z.infer<typeof WebhookDeliveryQuerySchema>;
