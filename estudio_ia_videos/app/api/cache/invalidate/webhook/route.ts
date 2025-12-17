/**
 * API Route para cache invalidation webhook
 * Endpoint para processar webhooks de invalidação de cache
 */

import { NextRequest, NextResponse } from 'next/server';
import { processCacheInvalidationWebhook } from '../../../../../lib/cache/cache-webhook';
import { withRateLimitMiddleware } from '../../../../../lib/security/rate-limit-config';
import { logger } from '../../../../../lib/logger';

/**
 * POST /api/cache/invalidate/webhook
 * Processa webhooks de invalidação de cache
 */
async function handler(request: NextRequest): Promise<NextResponse> {
  if (request.method !== 'POST') {
    return NextResponse.json(
      { error: 'Method not allowed' },
      { status: 405 }
    );
  }

  try {
    logger.info('Cache invalidation webhook received', {
      component: 'CacheWebhookAPI',
      method: request.method,
      url: request.url
    });

    const response = await processCacheInvalidationWebhook(request);
    
    // Converter Response para NextResponse
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    logger.error('Cache invalidation webhook failed', error, {
      component: 'CacheWebhookAPI'
    });

    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : 'Unknown error')
          : undefined
      },
      { status: 500 }
    );
  }
}

// Aplicar rate limiting específico para webhooks
export const POST = withRateLimitMiddleware(handler, {
  windowMs: 60 * 1000, // 1 minuto
  max: 100, // 100 webhooks por minuto
  message: 'Too many webhook requests'
});