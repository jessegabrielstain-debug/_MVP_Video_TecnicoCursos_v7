/**
 * Rate Limiting Middleware
 * Utilitário para aplicar rate limiting em rotas Next.js App Router
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from './rate-limit';

export interface RateLimitConfig {
  /**
   * Número máximo de requisições permitidas
   */
  limit: number;
  
  /**
   * Janela de tempo em milissegundos
   */
  windowMs: number;
  
  /**
   * Mensagem customizada de erro
   */
  message?: string;
  
  /**
   * Identificador customizado do rate limit (default: IP)
   */
  keyGenerator?: (req: NextRequest) => string;
  
  /**
   * Função para pular rate limiting condicionalmente
   */
  skip?: (req: NextRequest) => boolean | Promise<boolean>;
}

/**
 * Extrai IP real considerando proxies
 */
export function getClientIP(req: NextRequest): string {
  // Vercel/Cloudflare
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  // Cloudflare
  const cfConnecting = req.headers.get('cf-connecting-ip');
  if (cfConnecting) {
    return cfConnecting;
  }
  
  // Real IP
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  // Fallback (sempre terá valor)
  return 'unknown';
}

/**
 * Cria middleware de rate limiting
 */
export function createRateLimiter(config: RateLimitConfig) {
  const {
    limit,
    windowMs,
    message = 'Muitas requisições. Tente novamente mais tarde.',
    keyGenerator = (req: NextRequest) => `ip:${getClientIP(req)}`,
    skip,
  } = config;

  return async function rateLimitMiddleware(
    req: NextRequest,
    handler: (req: NextRequest) => Promise<NextResponse> | NextResponse
  ): Promise<NextResponse> {
    // Verifica se deve pular rate limiting
    if (skip && (await skip(req))) {
      return handler(req);
    }

    // Gera chave única
    const key = keyGenerator(req);

    // Verifica rate limit
    const result = checkRateLimit(key, limit, windowMs);

    if (!result.allowed) {
      return NextResponse.json(
        {
          error: message,
          retryAfter: result.retryAfterSec,
        },
        {
          status: 429,
          headers: {
            'Retry-After': result.retryAfterSec.toString(),
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Reset': new Date(
              Date.now() + result.retryAfterSec * 1000
            ).toISOString(),
          },
        }
      );
    }

    // Adiciona headers de rate limit na resposta
    const response = await handler(req);
    
    response.headers.set('X-RateLimit-Limit', limit.toString());
    response.headers.set('X-RateLimit-Remaining', (limit - (result.retryAfterSec || 0)).toString());
    
    return response;
  };
}

/**
 * Configurações pré-definidas de rate limiting
 */
export const rateLimitPresets = {
  /**
   * Autenticado: 100 req/min
   */
  authenticated: {
    limit: 100,
    windowMs: 60 * 1000,
    message: 'Limite de requisições excedido. Aguarde 1 minuto.',
  },
  
  /**
   * Anônimo: 20 req/min
   */
  anonymous: {
    limit: 20,
    windowMs: 60 * 1000,
    message: 'Limite de requisições excedido para usuários não autenticados.',
  },
  
  /**
   * Upload: 10 req/hora
   */
  upload: {
    limit: 10,
    windowMs: 60 * 60 * 1000,
    message: 'Limite de uploads excedido. Aguarde 1 hora.',
  },
  
  /**
   * Render: 5 req/hora
   */
  render: {
    limit: 5,
    windowMs: 60 * 60 * 1000,
    message: 'Limite de renderizações excedido. Aguarde 1 hora.',
  },
  
  /**
   * API pública: 50 req/min
   */
  public: {
    limit: 50,
    windowMs: 60 * 1000,
    message: 'Limite de requisições para API pública excedido.',
  },
  
  /**
   * Webhooks: 100 req/min
   */
  webhook: {
    limit: 100,
    windowMs: 60 * 1000,
    message: 'Limite de webhooks excedido.',
  },
} as const;

/**
 * Helper para aplicar rate limiting baseado em autenticação
 */
export function createAuthAwareRateLimiter() {
  return createRateLimiter({
    ...rateLimitPresets.authenticated,
    keyGenerator: (req: NextRequest) => {
      // Tenta extrair userId de header/cookie (NextAuth)
      const authHeader = req.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        return `user:${authHeader.slice(7)}`;
      }
      
      // Fallback para IP
      return `ip:${getClientIP(req)}`;
    },
  });
}

/**
 * Exemplo de uso:
 * 
 * ```typescript
 * import { createRateLimiter, rateLimitPresets } from '@/lib/utils/rate-limit-middleware';
 * 
 * const rateLimiter = createRateLimiter(rateLimitPresets.authenticated);
 * 
 * export async function GET(req: NextRequest) {
 *   return rateLimiter(req, async (req) => {
 *     // Sua lógica da rota aqui
 *     return NextResponse.json({ data: 'ok' });
 *   });
 * }
 * ```
 */
