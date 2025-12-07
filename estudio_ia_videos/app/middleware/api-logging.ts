/**
 * Middleware de Logging para APIs do Next.js
 *
 * Intercepta requests e responses para logging estruturado
 * e métricas de performance
 */

import { NextRequest, NextResponse } from 'next/server';
import logger from './logger';
import monitoring from './monitoring';

// ==========================================
// TIPOS
// ==========================================

type LoggableValue = string | number | boolean | null | undefined;
type LoggableObject = { [key: string]: LoggableValue | LoggableObject | LoggableArray };
type LoggableArray = Array<LoggableValue | LoggableObject | LoggableArray>;
type LoggableBody = LoggableObject | LoggableArray | LoggableValue;

interface RequestLog {
  method: string;
  path: string;
  query: Record<string, string>;
  headers: Record<string, string>;
  body?: LoggableBody;
  userId?: string;
  ip?: string;
  userAgent?: string;
  timestamp: string;
}

interface ResponseLog extends RequestLog {
  statusCode: number;
  duration: number;
  error?: string;
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Extrair ID do usuário do request
 */
function getUserId(request: NextRequest): string | undefined {
  try {
    // Tentar extrair do header de autorização
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      // Decodificar JWT e extrair userId (simplificado)
      // const token = authHeader.replace('Bearer ', '');
      // TODO: Implementar decodificação JWT real
      return 'user_from_token';
    }

    // Tentar extrair de cookie de sessão
    const sessionCookie = request.cookies.get('session');
    if (sessionCookie) {
      return 'user_from_session';
    }
  } catch (error) {
    logger.warn('Erro ao extrair userId', { error });
  }

  return undefined;
}

/**
 * Sanitizar dados sensíveis
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sanitizeData(data: unknown): unknown {
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item));
  }

  if (!isRecord(data)) {
    return data;
  }

  const sensitive = ['password', 'token', 'secret', 'apiKey', 'creditCard'];
  const sanitized: Record<string, unknown> = { ...data };

  for (const key of Object.keys(sanitized)) {
    if (sensitive.some((s) => key.toLowerCase().includes(s.toLowerCase()))) {
      sanitized[key] = '***REDACTED***';
      continue;
    }

    const value = sanitized[key];
    if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeData(value);
    }
  }

  return sanitized;
}

/**
 * Determinar se deve logar o body
 */
function shouldLogBody(path: string): boolean {
  const noBodyPaths = ['/api/health', '/api/metrics'];
  return !noBodyPaths.some((p) => path.startsWith(p));
}

// ==========================================
// MIDDLEWARE PRINCIPAL
// ==========================================

/**
 * Middleware de logging para APIs
 */
export async function withLogging<T = unknown>(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse<T>>
): Promise<NextResponse<T>> {
  const startTime = Date.now();

  // Extrair informações do request
  const method = request.method;
  const path = request.nextUrl.pathname;
  const query = Object.fromEntries(request.nextUrl.searchParams);
  const userId = getUserId(request);
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // Log de entrada
  const requestLog: RequestLog = {
    method,
    path,
    query,
    headers: Object.fromEntries(
      Array.from(request.headers.entries()).filter(
        ([key]) => !['authorization', 'cookie'].includes(key.toLowerCase())
      )
    ),
    userId,
    ip,
    userAgent,
    timestamp: new Date().toISOString(),
  };

  // Incluir body se relevante
  if (shouldLogBody(path) && ['POST', 'PUT', 'PATCH'].includes(method)) {
    try {
      const bodyText = await request.text();
      if (bodyText) {
        const body = JSON.parse(bodyText);
        requestLog.body = sanitizeData(body) as LoggableBody;

        // Recriar request com body (pois foi consumido)
        request = new NextRequest(request.url, {
          method: request.method,
          headers: request.headers,
          body: bodyText,
        });
      }
    } catch (error) {
      logger.warn('Erro ao parsear body do request', { error });
    }
  }

  logger.info(`API Request: ${method} ${path}`, {
    userId,
    ip,
    query,
  });

  // Executar handler
  let response: NextResponse<T>;
  let error: Error | undefined;

  try {
    response = await handler(request);
  } catch (err) {
    error = err as Error;
    response = NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    ) as NextResponse<T>;

    // Log de erro
    logger.error(`API Error: ${method} ${path}`, error, {
      userId,
      statusCode: 500,
    });

    // Enviar para monitoring
    monitoring.captureException(error, {
      level: 'error',
      tags: {
        api_method: method,
        api_path: path,
      },
      extra: {
        userId,
        query,
      },
      user: userId ? { id: userId } : undefined,
    });
  }

  // Calcular duração
  const duration = Date.now() - startTime;
  const statusCode = response.status;

  // Log de saída
  const responseLog: ResponseLog = {
    ...requestLog,
    statusCode,
    duration,
    error: error?.message,
  };

  logger.info(`API Response: ${method} ${path} - ${statusCode} (${duration}ms)`, {
    userId,
    statusCode,
    duration,
  });

  // Alertar se requisição muito lenta
  if (duration > 5000) {
    logger.warn(`API lenta: ${method} ${path} (${duration}ms)`, {
      userId,
      duration,
    });
  }

  // Enviar métricas para monitoring
  monitoring.metrics.api.recordResponseTime(method, path, statusCode, duration);

  // Adicionar headers de timing
  response.headers.set('X-Response-Time', `${duration}ms`);
  response.headers.set('X-Request-ID', `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  return response;
}

// ==========================================
// HELPER PARA ROTAS DE API
// ==========================================

/**
 * Wrapper para handlers de API com logging automático
 */
export function withApiLogging<T = unknown>(
  handler: (request: NextRequest) => Promise<NextResponse<T>>
) {
  return async (request: NextRequest) => {
    return withLogging(request, handler);
  };
}

// ==========================================
// MIDDLEWARE PARA TRACKING DE PERFORMANCE
// ==========================================

/**
 * Tracker de performance para operações assíncronas
 */
export async function withPerformanceTracking<T>(
  operationName: string,
  operation: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<T> {
  const tracker = new monitoring.PerformanceTracker(operationName, metadata);

  try {
    const result = await operation();
    const duration = tracker.finish();

    logger.debug(`Operação concluída: ${operationName} (${duration}ms)`, metadata);

    return result;
  } catch (error) {
    tracker.finish({ error: (error as Error).message });

    logger.error(`Operação falhou: ${operationName}`, error as Error, metadata);

    throw error;
  }
}

// ==========================================
// MIDDLEWARE PARA RATE LIMITING LOG
// ==========================================

interface RateLimitEntry {
  count: number;
  firstRequest: number;
  lastRequest: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW = 60000; // 1 minuto
const RATE_LIMIT_MAX = 100; // 100 requests por minuto

/**
 * Middleware de rate limiting com logging
 */
export function checkRateLimit(
  userId: string,
  path: string
): { allowed: boolean; remaining: number } {
  const key = `${userId}:${path}`;
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now - entry.firstRequest > RATE_LIMIT_WINDOW) {
    // Nova janela de tempo
    rateLimitMap.set(key, {
      count: 1,
      firstRequest: now,
      lastRequest: now,
    });

    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX - 1,
    };
  }

  // Incrementar contador
  entry.count++;
  entry.lastRequest = now;

  if (entry.count > RATE_LIMIT_MAX) {
    logger.warn(`Rate limit excedido: ${userId} em ${path}`, {
      userId,
      path,
      count: entry.count,
      window: RATE_LIMIT_WINDOW,
    });

    monitoring.captureMessage(
      `Rate limit excedido: ${path}`,
      'warning',
      {
        userId,
        path,
        count: entry.count,
      }
    );

    return {
      allowed: false,
      remaining: 0,
    };
  }

  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX - entry.count,
  };
}

// ==========================================
// CLEANUP DE RATE LIMIT MAP
// ==========================================

// Limpar entradas antigas a cada 5 minutos
setInterval(() => {
  const now = Date.now();
  const keysToDelete: string[] = [];

  rateLimitMap.forEach((entry, key) => {
    if (now - entry.lastRequest > RATE_LIMIT_WINDOW * 2) {
      keysToDelete.push(key);
    }
  });

  keysToDelete.forEach((key) => rateLimitMap.delete(key));

  if (keysToDelete.length > 0) {
    logger.debug(`Limpeza de rate limit: ${keysToDelete.length} entradas removidas`);
  }
}, 5 * 60 * 1000);

// ==========================================
// EXPORT DEFAULT
// ==========================================

export default {
  withLogging,
  withApiLogging,
  withPerformanceTracking,
  checkRateLimit,
};
