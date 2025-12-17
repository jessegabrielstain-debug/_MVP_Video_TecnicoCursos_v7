/**
 * API Instrumentation Middleware
 * 
 * HOC para instrumentar rotas API com métricas automáticas.
 * Registra tempo de resposta, status codes e erros.
 * 
 * @module lib/middleware/api-instrumentation
 */

import { NextRequest, NextResponse } from 'next/server';
import { recordApiRequest, startTimer } from '@/lib/observability/custom-metrics';
import { Logger } from '@/lib/logger';

const logger = new Logger('APIInstrumentation');

type RouteHandler = (
  request: NextRequest,
  context?: { params: Promise<Record<string, string>> | Record<string, string> }
) => Promise<NextResponse>;

export interface InstrumentationOptions {
  /** Nome da rota para métricas (default: pathname) */
  routeName?: string;
  /** Logar requests */
  logRequests?: boolean;
  /** Incluir headers de tempo de resposta */
  includeTimingHeaders?: boolean;
  /** Limite de tempo para alerta de lentidão (ms) */
  slowThresholdMs?: number;
}

const defaultOptions: Required<InstrumentationOptions> = {
  routeName: '',
  logRequests: true,
  includeTimingHeaders: true,
  slowThresholdMs: 2000,
};

/**
 * HOC que adiciona instrumentação automática a uma route handler
 * 
 * @example
 * ```typescript
 * export const POST = withApiInstrumentation({
 *   routeName: 'render-start',
 *   slowThresholdMs: 5000,
 * })(async (request) => {
 *   // Handler code
 * });
 * ```
 */
export function withApiInstrumentation(
  options?: InstrumentationOptions
): (handler: RouteHandler) => RouteHandler {
  const opts = { ...defaultOptions, ...options };
  
  return function (handler: RouteHandler): RouteHandler {
    return async (request, context) => {
      const timer = startTimer();
      const pathname = request.nextUrl.pathname;
      const method = request.method;
      const routeName = opts.routeName || pathname;
      
      // Request ID para correlação
      const requestId = crypto.randomUUID();
      
      if (opts.logRequests) {
        logger.debug('API request started', {
          requestId,
          route: routeName,
          method,
          url: pathname,
        });
      }
      
      let statusCode = 200;
      let response: NextResponse;
      
      try {
        response = await handler(request, context);
        statusCode = response.status;
      } catch (error) {
        // Re-throw but record metrics first
        statusCode = 500;
        const durationMs = timer() * 1000;
        
        recordApiRequest(routeName, method, statusCode, durationMs);
        
        logger.error('API request failed', error instanceof Error ? error : new Error(String(error)), {
          requestId,
          route: routeName,
          method,
          durationMs: Math.round(durationMs),
        });
        
        throw error;
      }
      
      const durationMs = timer() * 1000;
      
      // Record metrics
      recordApiRequest(routeName, method, statusCode, durationMs);
      
      // Log slow requests
      if (durationMs > opts.slowThresholdMs) {
        logger.warn('Slow API request detected', {
          requestId,
          route: routeName,
          method,
          durationMs: Math.round(durationMs),
          threshold: opts.slowThresholdMs,
        });
      } else if (opts.logRequests) {
        logger.debug('API request completed', {
          requestId,
          route: routeName,
          method,
          statusCode,
          durationMs: Math.round(durationMs),
        });
      }
      
      // Add timing headers
      if (opts.includeTimingHeaders) {
        response.headers.set('X-Request-Id', requestId);
        response.headers.set('X-Response-Time', `${Math.round(durationMs)}ms`);
        response.headers.set('Server-Timing', `total;dur=${durationMs.toFixed(2)}`);
      }
      
      return response;
    };
  };
}

/**
 * Combina múltiplos middlewares em um só
 * 
 * @example
 * ```typescript
 * export const POST = composeMiddleware(
 *   withApiInstrumentation(),
 *   withRateLimitMiddleware({ category: 'render' }),
 * )(handler);
 * ```
 */
export function composeMiddleware(
  ...middlewares: Array<(handler: RouteHandler) => RouteHandler>
): (handler: RouteHandler) => RouteHandler {
  return function (handler: RouteHandler): RouteHandler {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler);
  };
}

/**
 * Extrai informações úteis do request para logging
 */
export function extractRequestContext(request: NextRequest): Record<string, unknown> {
  return {
    url: request.nextUrl.pathname,
    method: request.method,
    userAgent: request.headers.get('user-agent')?.substring(0, 100),
    ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
      || request.headers.get('x-real-ip'),
    referer: request.headers.get('referer'),
    contentType: request.headers.get('content-type'),
    contentLength: request.headers.get('content-length'),
  };
}

export default withApiInstrumentation;
