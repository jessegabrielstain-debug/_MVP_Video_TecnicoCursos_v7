/**
 * API Route para métricas de cache
 * Endpoint para obter estatísticas do cache
 */

import { NextRequest, NextResponse } from 'next/server';
import { globalTaggedCache } from '../../../../../lib/cache/cache-invalidation';
import { withRateLimitMiddleware } from '../../../../../lib/security/rate-limit-config';
import { logger } from '../../../../../lib/logger';

/**
 * GET /api/cache/stats
 * Retorna estatísticas do cache
 */
async function handler(request: NextRequest): Promise<NextResponse> {
  if (request.method !== 'GET') {
    return NextResponse.json(
      { error: 'Method not allowed' },
      { status: 405 }
    );
  }

  try {
    const stats = globalTaggedCache.getStats();
    
    logger.debug('Cache stats requested', {
      component: 'CacheStatsAPI',
      stats
    });

    return NextResponse.json({
      success: true,
      data: {
        cache: stats,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Failed to get cache stats', error, {
      component: 'CacheStatsAPI'
    });

    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to get cache stats',
        error: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : 'Unknown error')
          : undefined
      },
      { status: 500 }
    );
  }
}

// Aplicar rate limiting
export const GET = withRateLimitMiddleware(handler, {
  windowMs: 60 * 1000, // 1 minuto
  max: 60, // 60 requests por minuto
  message: 'Too many requests for cache stats'
});