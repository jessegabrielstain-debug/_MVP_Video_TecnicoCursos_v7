/**
 * Cache Middleware
 * Middleware de cache para rotas API
 */

import { NextRequest, NextResponse } from 'next/server';
import { CacheManager } from './cache-manager';

const cache = new CacheManager({ ttl: 60, maxSize: 500 });

export interface CacheMiddlewareOptions {
  ttl?: number;
  keyGenerator?: (req: NextRequest) => string;
  shouldCache?: (req: NextRequest, res: NextResponse) => boolean;
}

export function withCache(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options?: CacheMiddlewareOptions
): (req: NextRequest) => Promise<NextResponse> {
  return async (req: NextRequest) => {
    const key = options?.keyGenerator?.(req) || `${req.method}:${req.url}`;
    
    // Tentar recuperar do cache
    const cached = cache.get<string>(key);
    if (cached) {
      return new NextResponse(cached, {
        headers: {
          'Content-Type': 'application/json',
          'X-Cache': 'HIT',
        },
      });
    }
    
    // Executar handler
    const response = await handler(req);
    
    // Cachear resposta se for sucesso
    const shouldCache = options?.shouldCache?.(req, response) ?? response.ok;
    
    if (shouldCache) {
      const body = await response.text();
      cache.set(key, body, options?.ttl);
      
      return new NextResponse(body, {
        status: response.status,
        headers: {
          ...Object.fromEntries(response.headers.entries()),
          'X-Cache': 'MISS',
        },
      });
    }
    
    return response;
  };
}

export async function getOrSet<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> {
  const cached = cache.get<T>(key);
  if (cached) return cached;

  const value = await fetcher();
  cache.set(key, value, ttl);
  return value;
}

export const cacheHelpers = {
  withCache,
  getOrSet,
  clearCache: () => cache.clear(),
  getCacheStats: () => ({ size: 0, hits: 0, misses: 0 }),
  invalidateResource: (key: string) => cache.delete(key),
  invalidatePattern: (pattern: string) => cache.invalidatePattern(pattern),
};
