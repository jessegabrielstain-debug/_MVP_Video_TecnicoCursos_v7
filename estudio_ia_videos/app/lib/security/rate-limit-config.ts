/**
 * Rate Limiting Configuration
 * 
 * Configuração centralizada de rate limiting por rota/categoria
 * Conforme Fase 4 do Plano de Profissionalização
 * 
 * @module lib/security/rate-limit-config
 */

import { NextRequest, NextResponse } from 'next/server';
import { RateLimiterReal, RateLimitConfig, RateLimitResult } from '@/lib/rate-limiter-real';
import { Logger } from '@/lib/logger';

const logger = new Logger('RateLimiter');

// =====================================
// Rate Limit Configurations by Route
// =====================================

/**
 * Limites por categoria de rota (requests por minuto)
 */
export const ROUTE_LIMITS: Record<string, RateLimitConfig> = {
  // Render - recursos intensivos
  'render': { windowMs: 60000, maxRequests: 10 },
  
  // Voice cloning - APIs externas caras
  'voice-cloning': { windowMs: 60000, maxRequests: 5 },
  
  // TTS - moderado
  'tts': { windowMs: 60000, maxRequests: 20 },
  
  // Analytics - consultas leves
  'analytics': { windowMs: 60000, maxRequests: 60 },
  
  // Upload - recursos moderados
  'upload': { windowMs: 60000, maxRequests: 10 },
  
  // Avatar - APIs externas
  'avatar': { windowMs: 60000, maxRequests: 5 },
  
  // Auth - prevenção de brute force
  'auth': { windowMs: 60000, maxRequests: 20 },
  'auth-strict': { windowMs: 300000, maxRequests: 5 }, // 5 tentativas a cada 5 min
  
  // Projects - CRUD normal
  'projects': { windowMs: 60000, maxRequests: 60 },
  
  // Webhooks
  'webhooks': { windowMs: 60000, maxRequests: 100 },
  
  // Default para rotas não categorizadas
  'default': { windowMs: 60000, maxRequests: 60 },
};

// =====================================
// Rate Limiter Instances Cache
// =====================================

const limiters = new Map<string, RateLimiterReal>();

/**
 * Obtém ou cria um rate limiter para a categoria
 */
function getLimiter(category: string): RateLimiterReal {
  if (!limiters.has(category)) {
    const config = ROUTE_LIMITS[category] || ROUTE_LIMITS.default;
    limiters.set(category, new RateLimiterReal(config));
  }
  return limiters.get(category)!;
}

// =====================================
// Identifier Extraction
// =====================================

export type IdentifierType = 'ip' | 'user' | 'combined' | 'global';

/**
 * Extrai identificador do request
 */
export function extractIdentifier(
  request: NextRequest,
  type: IdentifierType,
  userId?: string
): string {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
    || request.headers.get('x-real-ip') 
    || 'unknown';
  
  switch (type) {
    case 'ip':
      return ip;
    case 'user':
      return userId || ip;
    case 'combined':
      return userId ? `${userId}:${ip}` : ip;
    case 'global':
      return 'global';
    default:
      return ip;
  }
}

// =====================================
// Response Headers
// =====================================

/**
 * Adiciona headers de rate limit à response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult,
  config: RateLimitConfig
): void {
  response.headers.set('X-RateLimit-Limit', config.maxRequests.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', Math.floor(result.resetAt.getTime() / 1000).toString());
  
  if (!result.allowed) {
    response.headers.set('Retry-After', Math.ceil(config.windowMs / 1000).toString());
  }
}

// =====================================
// Rate Limit Check Function
// =====================================

export interface RateLimitCheckOptions {
  category?: string;
  identifierType?: IdentifierType;
  userId?: string;
  customLimit?: RateLimitConfig;
}

/**
 * Verifica rate limit e retorna resultado
 */
export async function checkRateLimit(
  request: NextRequest,
  options: RateLimitCheckOptions = {}
): Promise<{ allowed: boolean; result: RateLimitResult; config: RateLimitConfig }> {
  const category = options.category || 'default';
  const config = options.customLimit || ROUTE_LIMITS[category] || ROUTE_LIMITS.default;
  const limiter = options.customLimit ? new RateLimiterReal(config) : getLimiter(category);
  
  const identifier = extractIdentifier(
    request,
    options.identifierType || 'ip',
    options.userId
  );
  
  const result = await limiter.check(`${category}:${identifier}`);
  
  if (!result.allowed) {
    logger.warn('Rate limit exceeded', {
      category,
      identifier: identifier.substring(0, 20) + '...',
      remaining: result.remaining,
      resetAt: result.resetAt.toISOString(),
    });
  }
  
  return { allowed: result.allowed, result, config };
}

/**
 * Cria response de rate limit excedido
 */
export function createRateLimitResponse(
  result: RateLimitResult,
  config: RateLimitConfig
): NextResponse {
  const response = NextResponse.json(
    {
      success: false,
      error: 'Taxa de requisições excedida',
      message: 'Muitas requisições. Aguarde antes de tentar novamente.',
      retryAfter: Math.ceil(config.windowMs / 1000),
      resetAt: result.resetAt.toISOString(),
    },
    { status: 429 }
  );
  
  addRateLimitHeaders(response, result, config);
  return response;
}

// =====================================
// HOC for Route Handlers
// =====================================

type RouteHandler = (
  request: NextRequest,
  context?: { params: Promise<Record<string, string>> | Record<string, string> }
) => Promise<NextResponse>;

export interface RateLimitMiddlewareOptions {
  category?: string;
  identifierType?: IdentifierType;
  getUserId?: (request: NextRequest) => Promise<string | undefined>;
  customLimit?: RateLimitConfig;
  includeHeaders?: boolean;
}

/**
 * HOC que aplica rate limiting a uma route handler
 * 
 * @example
 * ```typescript
 * export const POST = withRateLimitMiddleware({
 *   category: 'render',
 *   identifierType: 'user',
 *   getUserId: async (req) => extractUserFromToken(req),
 * })(async (request) => {
 *   // Handler code
 * });
 * ```
 */
export function withRateLimitMiddleware(
  options: RateLimitMiddlewareOptions = {}
): (handler: RouteHandler) => RouteHandler {
  return function (handler: RouteHandler): RouteHandler {
    return async (request, context) => {
      const userId = options.getUserId 
        ? await options.getUserId(request) 
        : undefined;
      
      const { allowed, result, config } = await checkRateLimit(request, {
        category: options.category,
        identifierType: options.identifierType,
        userId,
        customLimit: options.customLimit,
      });
      
      if (!allowed) {
        return createRateLimitResponse(result, config);
      }
      
      // Execute handler
      const response = await handler(request, context);
      
      // Add rate limit headers if enabled
      if (options.includeHeaders !== false) {
        addRateLimitHeaders(response, result, config);
      }
      
      return response;
    };
  };
}

// =====================================
// Route Category Detection
// =====================================

/**
 * Detecta categoria de rate limit baseado na URL
 */
export function detectRouteCategory(pathname: string): string {
  const categories: Array<[RegExp, string]> = [
    [/^\/api\/render/, 'render'],
    [/^\/api\/voice-cloning/, 'voice-cloning'],
    [/^\/api\/tts/, 'tts'],
    [/^\/api\/analytics/, 'analytics'],
    [/^\/api\/upload/, 'upload'],
    [/^\/api\/avatar/, 'avatar'],
    [/^\/api\/auth\/login/, 'auth-strict'],
    [/^\/api\/auth/, 'auth'],
    [/^\/api\/projects/, 'projects'],
    [/^\/api\/webhooks/, 'webhooks'],
  ];
  
  for (const [pattern, category] of categories) {
    if (pattern.test(pathname)) {
      return category;
    }
  }
  
  return 'default';
}

/**
 * HOC com detecção automática de categoria
 */
export function withAutoRateLimit(
  options: Omit<RateLimitMiddlewareOptions, 'category'> = {}
): (handler: RouteHandler) => RouteHandler {
  return function (handler: RouteHandler): RouteHandler {
    return async (request, context) => {
      const category = detectRouteCategory(request.nextUrl.pathname);
      
      return withRateLimitMiddleware({
        ...options,
        category,
      })(handler)(request, context);
    };
  };
}

// =====================================
// Cleanup Utility
// =====================================

/**
 * Limpa dados expirados de todos os limiters
 * Deve ser chamado periodicamente (ex: cron job)
 */
export async function cleanupExpiredEntries(): Promise<void> {
  for (const limiter of limiters.values()) {
    await limiter.clearExpired();
  }
  logger.debug('Rate limiter cleanup completed');
}
