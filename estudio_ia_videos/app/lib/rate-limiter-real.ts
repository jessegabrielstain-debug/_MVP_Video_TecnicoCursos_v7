/**
 * Rate Limiter Real
 * Limitador de taxa de requisições
 */

export interface RateLimitConfig {
  windowMs: number; // janela de tempo em ms
  maxRequests: number; // máximo de requests na janela
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

export class RateLimiterReal {
  private requests: Map<string, number[]> = new Map();
  
  constructor(private config: RateLimitConfig) {}
  
  async check(identifier: string): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    // Obter requests na janela atual
    let reqs = this.requests.get(identifier) || [];
    reqs = reqs.filter(t => t > windowStart);
    
    const allowed = reqs.length < this.config.maxRequests;
    
    if (allowed) {
      reqs.push(now);
      this.requests.set(identifier, reqs);
    }
    
    return {
      allowed,
      remaining: Math.max(0, this.config.maxRequests - reqs.length),
      resetAt: new Date(now + this.config.windowMs),
    };
  }
  
  async reset(identifier: string): Promise<void> {
    this.requests.delete(identifier);
  }
  
  async clearExpired(): Promise<void> {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    for (const [key, reqs] of this.requests.entries()) {
      const filtered = reqs.filter(t => t > windowStart);
      if (filtered.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, filtered);
      }
    }
  }
}

export const rateLimiter = new RateLimiterReal({
  windowMs: 60000, // 1 minuto
  maxRequests: 100,
});

export const RATE_LIMITS = {
  DEFAULT: { windowMs: 60000, maxRequests: 100 },
  API: { windowMs: 60000, maxRequests: 60 },
  AUTH_API: { windowMs: 60000, maxRequests: 60 },
  AUTH_STRICT: { windowMs: 60000, maxRequests: 30 },
  UPLOAD: { windowMs: 60000, maxRequests: 10 },
};

import { NextRequest, NextResponse } from 'next/server';

type RouteHandler = (request: NextRequest, context?: { params: Record<string, string> }) => Promise<NextResponse>;

export function withRateLimit(
  config: RateLimitConfig,
  identifierType: 'ip' | 'user' | 'global' = 'ip'
) {
  return function (handler: RouteHandler): RouteHandler {
    return async (request: NextRequest, context?: { params: Record<string, string> }) => {
      // Determinar identificador
      let identifier = 'global';
      if (identifierType === 'ip') {
        identifier = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
      }
      
      const limiter = new RateLimiterReal(config);
      const result = await limiter.check(identifier);
      
      if (!result.allowed) {
        return NextResponse.json(
          { error: 'Too many requests', resetAt: result.resetAt },
          { status: 429 }
        );
      }
      
      return handler(request, context);
    };
  };
}
