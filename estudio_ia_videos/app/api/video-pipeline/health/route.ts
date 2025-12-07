
/**
 * GET /api/health
 * Health check endpoint
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  // Video pipeline endpoint
  if (action === 'video-pipeline') {
    return NextResponse.json({
      success: true,
      message: 'Video pipeline endpoint working!',
      endpoint: '/api/health?action=video-pipeline',
      methods: ['GET', 'POST'],
      timestamp: new Date().toISOString()
    });
  }

  interface HealthChecks {
    timestamp: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: {
      database?: string;
      redis?: string;
      websocket?: string;
      tts?: string;
      [key: string]: string | undefined;
    };
  }

  const checks: HealthChecks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    services: {}
  }

  try {
    // Check database
    await prisma.$queryRaw`SELECT 1`
    checks.services.database = 'healthy'
  } catch (error) {
    checks.services.database = 'unhealthy'
    checks.status = 'degraded'
  }

  // Check Redis (if configured)
  try {
    // TODO: Add Redis health check when implemented
    checks.services.redis = 'not_configured'
  } catch (error) {
    checks.services.redis = 'unhealthy'
  }

  // WebSocket
  checks.services.websocket = 'healthy' // Assume healthy

  // TTS services
  checks.services.tts = 'healthy' // Assume healthy

  const httpStatus = checks.status === 'healthy' ? 200 : 503

  return NextResponse.json(checks, { status: httpStatus })
}

