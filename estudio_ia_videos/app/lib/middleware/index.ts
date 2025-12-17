/**
 * Middleware Module Index
 * 
 * Exportações centralizadas de middlewares para API routes.
 * 
 * @module lib/middleware
 */

// API Instrumentation (metrics, logging, timing)
export {
  withApiInstrumentation,
  composeMiddleware,
  extractRequestContext,
} from './api-instrumentation';
export type { InstrumentationOptions } from './api-instrumentation';

// Re-export rate limiting from security
export {
  withRateLimitMiddleware,
  withAutoRateLimit,
  checkRateLimit,
  createRateLimitResponse,
  ROUTE_LIMITS,
} from '@/lib/security/rate-limit-config';
