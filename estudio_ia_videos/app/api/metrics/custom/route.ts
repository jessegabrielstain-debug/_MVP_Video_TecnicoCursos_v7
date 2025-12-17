/**
 * Metrics Endpoint
 * 
 * Expõe métricas de aplicação em formato Prometheus ou JSON.
 * 
 * GET /api/metrics - JSON format
 * GET /api/metrics?format=prometheus - Prometheus format
 * 
 * @module api/metrics/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { metricsRegistry } from '@/lib/observability/custom-metrics';
import { Logger } from '@/lib/logger';

const logger = new Logger('MetricsAPI');

// Verificação de autenticação básica para métricas
function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const metricsToken = process.env.METRICS_TOKEN;
  
  // Se não há token configurado, permite acesso em development
  if (!metricsToken) {
    return process.env.NODE_ENV === 'development';
  }
  
  // Verifica Bearer token
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7) === metricsToken;
  }
  
  return false;
}

export async function GET(request: NextRequest) {
  // Verificação de autorização
  if (!isAuthorized(request)) {
    logger.warn('Unauthorized metrics access attempt', {
      ip: request.headers.get('x-forwarded-for') || 'unknown',
    });
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  const format = request.nextUrl.searchParams.get('format');
  
  try {
    if (format === 'prometheus') {
      const metrics = metricsRegistry.getPrometheusFormat();
      return new NextResponse(metrics, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      });
    }
    
    // JSON format (default)
    const metrics = metricsRegistry.getJsonFormat();
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      metrics,
    });
  } catch (error) {
    logger.error('Failed to collect metrics', error instanceof Error ? error : new Error(String(error)));
    
    return NextResponse.json(
      { success: false, error: 'Failed to collect metrics' },
      { status: 500 }
    );
  }
}
