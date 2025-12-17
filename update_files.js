const fs = require('fs');
const path = require('path');

const files = [
  {
    path: 'estudio_ia_videos/app/api/videos/render/route.ts',
    content: `import { NextRequest, NextResponse } from "next/server"
import { getSupabaseForRequest } from "@/lib/supabase/server"
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseForRequest(req);
    
    // 1. Authenticate User
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { scenes, projectId, quality } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    // 2. Create Render Job in DB
    const jobId = uuidv4();
    const { data: job, error: dbError } = await supabase
      .from('render_jobs')
      .insert({
        id: jobId,
        project_id: projectId,
        user_id: user.id,
        status: 'queued',
        progress: 0,
        render_settings: { 
            quality: quality || 'fhd',
            scenes_count: scenes?.length || 0
        }
      })
      .select()
      .single();

    if (dbError) {
      logger.error("Error creating render job", { 
        component: 'API: videos/render', 
        error: new Error(dbError.message || JSON.stringify(dbError)) 
      });
      return NextResponse.json(
        { error: "Failed to create render job", details: dbError.message },
        { status: 500 }
      );
    }

    // 3. Return response in the format expected by the frontend
    return NextResponse.json({
      success: true,
      jobId: job.id, // Frontend expects camelCase 'jobId'
      status: job.status,
      progress: job.progress,
      estimatedTime: (scenes?.length || 1) * 10000, // Mock estimation
      message: "Render job created successfully"
    });

  } catch (error) {
    logger.error("Render API error", { 
      component: 'API: videos/render', 
      error: error instanceof Error ? error : new Error(String(error)) 
    });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}`
  },
  {
    path: 'estudio_ia_videos/app/api/analytics/health/route.ts',
    content: `import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withAnalytics } from '@/lib/analytics/middleware';
import { ANALYTICS_CONFIG, validateConfig, getEnvironmentInfo } from '@/lib/analytics/config';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  uptime: number;
  checks: {
    database: HealthCheckResult;
    analytics: HealthCheckResult;
    config: HealthCheckResult;
    storage: HealthCheckResult;
    alerts: HealthCheckResult;
    reports: HealthCheckResult;
  };
  metrics: {
    totalEvents: number;
    totalUsers: number;
    errorRate: number;
    avgResponseTime: number;
    activeAlerts: number;
    scheduledReports: number;
  };
  features: Record<string, boolean>;
}

interface HealthCheckResult {
  status: 'pass' | 'fail' | 'warn';
  message: string;
  duration: number;
  details?: Record<string, unknown>;
}

async function checkDatabase(): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    await prisma.$queryRaw\`SELECT 1\`;

    return {
      status: 'pass',
      message: 'Database connection successful',
      duration: Date.now() - start,
      details: { connected: true }
    };
  } catch (error) {
    return {
      status: 'fail',
      message: \`Database connection failed: \${error}\`,
      duration: Date.now() - start,
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    };
  }
}

async function checkAnalytics(): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    // Verificar se há eventos recentes (últimas 24h)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const recentEvents = await prisma.analyticsEvent.count({
      where: {
        createdAt: {
          gte: yesterday
        }
      }
    });

    const status = recentEvents > 0 ? 'pass' : 'warn';
    const message = recentEvents > 0 
      ? \`Analytics active with \${recentEvents} recent events\`
      : 'No recent analytics events found';

    return {
      status,
      message,
      duration: Date.now() - start,
      details: { recentEvents, period: '24h' }
    };
  } catch (error) {
    return {
      status: 'fail',
      message: \`Analytics check failed: \${error}\`,
      duration: Date.now() - start,
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    };
  }
}

async function checkConfig(): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    const validation = validateConfig();
    
    return {
      status: validation.valid ? 'pass' : 'warn',
      message: validation.valid 
        ? 'Configuration is valid'
        : \`Configuration issues: \${validation.errors.join(', ')}\`,
      duration: Date.now() - start,
      details: { 
        valid: validation.valid,
        errors: validation.errors,
        enabled: ANALYTICS_CONFIG.ENABLED
      }
    };
  } catch (error) {
    return {
      status: 'fail',
      message: \`Configuration check failed: \${error}\`,
      duration: Date.now() - start,
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    };
  }
}

async function checkStorage(): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    // Verificar espaço em disco (simulado)
    const freeSpace = 85; // Percentual de espaço livre (simulado)
    const status = freeSpace > 20 ? 'pass' : freeSpace > 10 ? 'warn' : 'fail';
    
    return {
      status,
      message: \`Storage \${freeSpace}% free\`,
      duration: Date.now() - start,
      details: { 
        freeSpacePercent: freeSpace,
        path: ANALYTICS_CONFIG.REPORTS.STORAGE_PATH
      }
    };
  } catch (error) {
    return {
      status: 'fail',
      message: \`Storage check failed: \${error}\`,
      duration: Date.now() - start,
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    };
  }
}

async function checkAlerts(): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    const alertCount = await prisma.analyticsEvent.count({
      where: {
        eventType: 'alert',
        eventData: {
          path: ['status'],
          equals: 'active'
        }
      }
    });

    const status = alertCount < 10 ? 'pass' : alertCount < 20 ? 'warn' : 'fail';
    
    return {
      status,
      message: \`\${alertCount} active alerts\`,
      duration: Date.now() - start,
      details: { 
        activeAlerts: alertCount,
        emailConfigured: !!ANALYTICS_CONFIG.ALERTS.EMAIL_FROM
      }
    };
  } catch (error) {
    return {
      status: 'warn',
      message: \`Alerts check failed: \${error}\`,
      duration: Date.now() - start,
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    };
  }
}

async function checkReports(): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    const reportCount = await prisma.analyticsEvent.count({
      where: {
        eventType: 'report_scheduled',
        eventData: {
          path: ['status'],
          equals: 'pending' // Assuming 'pending' means scheduled/active
        }
      }
    });
    
    return {
      status: 'pass',
      message: \`\${reportCount} scheduled reports\`,
      duration: Date.now() - start,
      details: { 
        scheduledReports: reportCount,
        emailConfigured: !!ANALYTICS_CONFIG.REPORTS.EMAIL_FROM
      }
    };
  } catch (error) {
    return {
      status: 'warn',
      message: \`Reports check failed: \${error}\`,
      duration: Date.now() - start,
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    };
  }
}

async function getMetrics() {
  try {
    // Total de eventos
    const totalEvents = await prisma.analyticsEvent.count();

    // Total de usuários únicos
    const usersResult = await prisma.analyticsEvent.groupBy({
      by: ['userId'],
      _count: {
        userId: true
      }
    });
    const uniqueUsers = usersResult.length;

    // Taxa de erro (últimas 24h)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const [errorCount, recentCount] = await Promise.all([
      prisma.analyticsEvent.count({
        where: {
          eventType: 'error', // Assuming 'error' is the eventType for errors
          createdAt: { gte: yesterday }
        }
      }),
      prisma.analyticsEvent.count({
        where: {
          createdAt: { gte: yesterday }
        }
      })
    ]);

    const errorRate = recentCount > 0 ? (errorCount / recentCount) * 100 : 0;

    // Tempo médio de resposta (simulado)
    const avgResponseTime = 250; // ms

    // Alertas ativos
    const activeAlertsCount = await prisma.analyticsEvent.count({
      where: {
        eventType: 'alert',
        eventData: {
          path: ['status'],
          equals: 'active'
        }
      }
    });

    // Relatórios agendados
    const scheduledReportsCount = await prisma.analyticsEvent.count({
      where: {
        eventType: 'report_scheduled',
        eventData: {
          path: ['status'],
          equals: 'pending'
        }
      }
    });

    return {
      totalEvents,
      totalUsers: uniqueUsers,
      errorRate: Math.round(errorRate * 100) / 100,
      avgResponseTime,
      activeAlerts: activeAlertsCount,
      scheduledReports: scheduledReportsCount
    };
  } catch (error) {
    logger.error('Error getting metrics', { 
      component: 'API: analytics/health', 
      error: error instanceof Error ? error : new Error(String(error)) 
    });
    return {
      totalEvents: 0,
      totalUsers: 0,
      errorRate: 0,
      avgResponseTime: 0,
      activeAlerts: 0,
      scheduledReports: 0
    };
  }
}

async function performHealthCheck() {
  const startTime = Date.now();
  const envInfo = getEnvironmentInfo();

  // Executar todas as verificações em paralelo
  const [
    database,
    analytics,
    config,
    storage,
    alerts,
    reports,
    metrics
  ] = await Promise.all([
    checkDatabase(),
    checkAnalytics(),
    checkConfig(),
    checkStorage(),
    checkAlerts(),
    checkReports(),
    getMetrics()
  ]);

  const checks = { database, analytics, config, storage, alerts, reports };

  // Determinar status geral
  const failedChecks = Object.values(checks).filter(check => check.status === 'fail');
  const warnChecks = Object.values(checks).filter(check => check.status === 'warn');

  let overallStatus;
  if (failedChecks.length > 0) {
    overallStatus = 'unhealthy';
  } else if (warnChecks.length > 0) {
    overallStatus = 'degraded';
  } else {
    overallStatus = 'healthy';
  }

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: envInfo.version,
    environment: envInfo.environment,
    uptime: Date.now() - startTime,
    checks,
    metrics,
    features: envInfo.features
  };
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Verificar autenticação para informações detalhadas
    const detailed = request.nextUrl.searchParams.get('detailed') === 'true';
    if (detailed && !session?.user) {
      return NextResponse.json(
        { error: 'Authentication required for detailed health check' },
        { status: 401 }
      );
    }

    const healthCheck = await performHealthCheck();

    // Para verificações não autenticadas, retornar apenas status básico
    if (!session?.user) {
      return NextResponse.json({
        status: healthCheck.status,
        timestamp: healthCheck.timestamp,
        version: healthCheck.version,
        environment: healthCheck.environment
      });
    }

    // Retornar verificação completa para usuários autenticados
    return NextResponse.json(healthCheck);

  } catch (error) {
    logger.error('Health check error', { 
      component: 'API: analytics/health', 
      error: error instanceof Error ? error : new Error(String(error)) 
    });
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Endpoint para verificação rápida (usado por load balancers)
export async function HEAD(request) {
  try {
    await prisma.$queryRaw\`SELECT 1\`;
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';`
  },
  {
    path: 'estudio_ia_videos/app/api/media/preprocess/route.ts',
    content: `/**
 * API: Media Preprocessor
 * POST /api/media/preprocess
 */

import { NextRequest, NextResponse } from 'next/server';
import { mediaPreprocessor, PreprocessOptions } from '@/lib/media-preprocessor-real';
import * as fs from 'fs/promises';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imagePath, options } = body as {
      imagePath: string;
      options?: PreprocessOptions;
    };

    if (!imagePath) {
      return NextResponse.json(
        { error: 'Image path is required' },
        { status: 400 }
      );
    }

    // Verificar se arquivo existe
    try {
      await fs.access(imagePath);
    } catch {
      return NextResponse.json(
        { error: 'Image file not found' },
        { status: 404 }
      );
    }

    // Ler arquivo
    const buffer = await fs.readFile(imagePath);

    // Processar imagem
    const result = await mediaPreprocessor.preprocessImage(buffer, options || {});

    return NextResponse.json({
      success: true,
      data: result,
      stats: mediaPreprocessor.getStats(),
    });

  } catch (error) {
    logger.error('Media preprocessing error', { 
      component: 'API: media/preprocess', 
      error: error instanceof Error ? error : new Error(String(error)) 
    });
    return NextResponse.json(
      { 
        error: 'Failed to preprocess media',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const stats = mediaPreprocessor.getStats();

    return NextResponse.json({
      success: true,
      stats,
    });

  } catch (error) {
    logger.error('Error fetching preprocessor stats', { 
      component: 'API: media/preprocess', 
      error: error instanceof Error ? error : new Error(String(error)) 
    });
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}`
  },
  {
    path: 'estudio_ia_videos/app/api/analytics/performance/route.ts',
    content: `import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getOrgId } from '@/lib/auth/session-helpers';
import { prisma } from '@/lib/db';
import { withAnalytics } from '@/lib/analytics/api-performance-middleware';
import { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';

/**
 * GET /api/analytics/performance
 * Retorna métricas detalhadas de performance do sistema
 */
async function getHandler(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '24h';
    const metric = searchParams.get('metric') || 'all';
    const endpoint = searchParams.get('endpoint');
    const organizationId = getOrgId(session.user);

    // Calcular data de início baseada no período
    const startDate = new Date();
    switch (period) {
      case '1h':
        startDate.setHours(startDate.getHours() - 1);
        break;
      case '24h':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      default:
        startDate.setHours(startDate.getHours() - 24);
    }

    const performanceData: Record<string, unknown> = {};

    // Métricas de tempo de resposta
    if (metric === 'response_time' || metric === 'all') {
      const responseTimeStats = await prisma.$queryRaw<Array<{ avg: number, max: number, min: number, count: bigint }>>\`
        SELECT 
          AVG(CAST(event_data->>'duration' AS FLOAT)) as avg,
          MAX(CAST(event_data->>'duration' AS FLOAT)) as max,
          MIN(CAST(event_data->>'duration' AS FLOAT)) as min,
          COUNT(*) as count
        FROM "AnalyticsEvent"
        WHERE created_at >= \${startDate}
        AND event_data->>'duration' IS NOT NULL
        \${endpoint ? Prisma.sql\`AND event_data->'metadata'->>'endpoint' LIKE \${\'%\' + endpoint + \'%\'}\` : Prisma.sql\`\`}
      \`;

      const stats = responseTimeStats[0] || { avg: 0, max: 0, min: 0, count: 0 };

      // Distribuição de tempos de resposta
      const responseTimeDistribution = await prisma.$queryRaw<Array<{ range: string, count: bigint }>>\`
        SELECT 
          CASE 
            WHEN CAST(event_data->>'duration' AS FLOAT) < 100 THEN '0-100ms'
            WHEN CAST(event_data->>'duration' AS FLOAT) < 500 THEN '100-500ms'
            WHEN CAST(event_data->>'duration' AS FLOAT) < 1000 THEN '500ms-1s'
            WHEN CAST(event_data->>'duration' AS FLOAT) < 2000 THEN '1-2s'
            WHEN CAST(event_data->>'duration' AS FLOAT) < 5000 THEN '2-5s'
            ELSE '5s+'
          END as range,
          COUNT(*) as count
        FROM "AnalyticsEvent" 
        WHERE created_at >= \${startDate} 
        AND event_data->>'duration' IS NOT NULL
        \${endpoint ? Prisma.sql\`AND event_data->'metadata'->>'endpoint' LIKE \${\'%\' + endpoint + \'%\'}\` : Prisma.sql\`\`}
        GROUP BY range
        ORDER BY 
          CASE range
            WHEN '0-100ms' THEN 1
            WHEN '100-500ms' THEN 2
            WHEN '500ms-1s' THEN 3
            WHEN '1-2s' THEN 4
            WHEN '2-5s' THEN 5
            WHEN '5s+' THEN 6
          END
      \`;

      // Tempos de resposta por endpoint
      const endpointPerformance = await prisma.$queryRaw<Array<{ endpoint: string, avg_time: number, requests: bigint }>>\`
        SELECT 
          event_data->'metadata'->>'endpoint' as endpoint,
          AVG(CAST(event_data->>'duration' AS FLOAT)) as avg_time,
          COUNT(*) as requests
        FROM "AnalyticsEvent"
        WHERE created_at >= \${startDate}
        AND event_data->'metadata'->>'endpoint' IS NOT NULL
        AND event_data->>'duration' IS NOT NULL
        GROUP BY event_data->'metadata'->>'endpoint'
        ORDER BY avg_time DESC
        LIMIT 10
      \`;

      performanceData.responseTime = {
        stats: {
          avg: Math.round(Number(stats.avg || 0)),
          max: Number(stats.max || 0),
          min: Number(stats.min || 0),
          count: Number(stats.count || 0)
        },
        distribution: responseTimeDistribution.map(item => ({ range: item.range, count: Number(item.count) })),
        byEndpoint: endpointPerformance.map((item) => ({
          endpoint: item.endpoint || 'Unknown',
          avgTime: Math.round(Number(item.avg_time || 0)),
          requests: Number(item.requests)
        }))
      };
    }

    // Métricas de throughput (requisições por minuto)
    if (metric === 'throughput' || metric === 'all') {
      const throughputData = await prisma.$queryRaw<Array<{ minute: string, requests: bigint }>>\`
        SELECT 
          TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:00') as minute,
          COUNT(*) as requests
        FROM "AnalyticsEvent" 
        WHERE created_at >= \${startDate}
        GROUP BY minute
        ORDER BY minute DESC
        LIMIT 60
      \`;

      const avgThroughput = await prisma.analyticsEvent.count({
        where: { createdAt: { gte: startDate } }
      });

      const minutesInPeriod = Math.max(1, (Date.now() - startDate.getTime()) / (1000 * 60));

      performanceData.throughput = {
        avgRequestsPerMinute: Math.round(avgThroughput / minutesInPeriod),
        timeline: throughputData.map(item => ({ minute: item.minute, requests: Number(item.requests) })),
        totalRequests: avgThroughput
      };
    }

    // Métricas de erro
    if (metric === 'errors' || metric === 'all') {
      const errorStats = await prisma.$queryRaw<Array<{ status: string, count: bigint }>>\`
        SELECT 
          event_data->>'status' as status,
          COUNT(*) as count
        FROM "AnalyticsEvent"
        WHERE created_at >= \${startDate}
        AND event_data->>'status' IN ('error', 'warning')
        GROUP BY event_data->>'status'
      \`;

      const errorsByCategory = await prisma.$queryRaw<Array<{ category: string, error_code: string, count: bigint }>>\`
        SELECT 
          event_type as category,
          event_data->>'errorCode' as error_code,
          COUNT(*) as count
        FROM "AnalyticsEvent"
        WHERE created_at >= \${startDate}
        AND event_data->>'status' = 'error'
        GROUP BY event_type, event_data->>'errorCode'
        ORDER BY count DESC
        LIMIT 10
      \`;

      const totalRequests = await prisma.analyticsEvent.count({
        where: {
          createdAt: { gte: startDate }
        }
      });

      const totalErrors = errorStats.reduce((sum, item) => sum + Number(item.count), 0);

      performanceData.errors = {
        errorRate: totalRequests > 0 ? ((totalErrors / totalRequests) * 100).toFixed(2) : '0',
        totalErrors,
        byStatus: errorStats.map((item) => ({
          status: item.status || 'Unknown',
          count: Number(item.count)
        })),
        byCategory: errorsByCategory.map((item) => ({
          category: item.category || 'Unknown',
          errorCode: item.error_code || 'Unknown',
          count: Number(item.count)
        }))
      };
    }

    // ✅ REAL - System metrics (from RenderJob table as proxy)
    if (metric === 'all') {
      // Queue size from render jobs
      const queueSize = await prisma.renderJob.count({
        where: { status: 'queued' }
      });
      
      const processingCount = await prisma.renderJob.count({
        where: { status: 'processing' }
      });

      // Map available fields and provide sensible defaults
      performanceData.system = {
        cpu: 0, // Not available without system monitoring agent
        memory: 0,
        disk: 0,
        network: {
          inbound: 0,
          outbound: 0
        },
        activeConnections: 0,
        queueSize: queueSize + processingCount
      };
    }

    // ✅ REAL - Métricas de cache (from analytics_event metadata)
    if (metric === 'all') {
      const cacheStats = await prisma.$queryRaw<Array<{ action: string, count: bigint }>>\`
        SELECT 
          event_data->>'action' as action,
          COUNT(*) as count
        FROM "AnalyticsEvent"
        WHERE created_at >= \${startDate}
        AND event_type = 'cache_event'
        GROUP BY event_data->>'action'
      \`;

      const totalHits = Number(cacheStats.find(s => s.action === 'hit')?.count || 0);
      const totalMisses = Number(cacheStats.find(s => s.action === 'miss')?.count || 0);
      const evictions = Number(cacheStats.find(s => s.action === 'eviction')?.count || 0);
      const total = totalHits + totalMisses;

      const hitRate = total > 0 ? ((totalHits / total) * 100).toFixed(1) : '0';
      const missRate = total > 0 ? ((totalMisses / total) * 100).toFixed(1) : '0';

      performanceData.cache = {
        hitRate,
        missRate,
        totalHits,
        totalMisses,
        evictions,
        size: 0 // Cannot easily aggregate cache size from events without more complex query
      };
    }

    return NextResponse.json({
      period,
      metric,
      endpoint,
      generatedAt: new Date().toISOString(),
      ...performanceData
    });

  } catch (error: unknown) {
    logger.error('[Analytics Performance] Error', { 
      component: 'API: analytics/performance', 
      error: error instanceof Error ? error : new Error(String(error)) 
    });
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to fetch performance metrics',
        message
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analytics/performance
 * Registra métricas de performance customizadas
 */
async function postHandler(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      endpoint,
      method,
      responseTime,
      statusCode,
      requestSize,
      responseSize,
      userAgent,
      ipAddress,
      metadata
    } = body;

    // Validação básica
    if (!endpoint || !responseTime) {
      return NextResponse.json(
        { error: 'endpoint and responseTime are required' },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const organizationId = getOrgId(session.user);

    // Registrar métrica de performance
    await prisma.analyticsEvent.create({
      data: {
        userId,
        eventType: 'performance_metric',
        eventData: {
          organizationId,
          action: 'api_call',
          label: endpoint,
          duration: responseTime,
          fileSize: requestSize,
          status: statusCode >= 400 ? 'error' : 'success',
          errorCode: statusCode >= 400 ? statusCode.toString() : null,
          metadata: {
            endpoint,
            method,
            statusCode,
            requestSize,
            responseSize,
            userAgent,
            ipAddress,
            ...metadata
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Performance metric recorded'
    });

  } catch (error: unknown) {
    logger.error('[Analytics Performance POST] Error', { 
      component: 'API: analytics/performance', 
      error: error instanceof Error ? error : new Error(String(error)) 
    });
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to record performance metric',
        message
      },
      { status: 500 }
    );
  }
}

// Aplicar middleware de performance
export const GET = withAnalytics(getHandler);
export const POST = withAnalytics(postHandler);`
  },
  {
    path: 'estudio_ia_videos/app/api/analytics/realtime/route.ts',
    content: `import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getOrgId } from '@/lib/auth/session-helpers';
import { prisma } from '@/lib/db';
import { withAnalytics } from '@/lib/analytics/api-performance-middleware';
import { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';

/**
 * GET /api/analytics/realtime
 * Retorna métricas em tempo real do sistema
 */
async function getHandler(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const window = searchParams.get('window') || '15m';
    const organizationId = getOrgId(session.user);

    // Calcular janela de tempo
    const now = new Date();
    const startTime = new Date();
    
    switch (window) {
      case '5m':
        startTime.setMinutes(now.getMinutes() - 5);
        break;
      case '15m':
        startTime.setMinutes(now.getMinutes() - 15);
        break;
      case '1h':
        startTime.setHours(now.getHours() - 1);
        break;
      default:
        startTime.setMinutes(now.getMinutes() - 15);
    }

    const whereClause: Prisma.AnalyticsEventWhereInput = {
      createdAt: { gte: startTime },
      ...(organizationId && { 
        eventData: {
          path: ['organizationId'],
          equals: organizationId
        }
      })
    };

    // Buscar dados em paralelo
    const [
      activeUsers,
      totalEvents,
      errorEvents,
      recentEvents,
      eventsByMinute,
      topCategories,
      systemHealth
    ] = await Promise.all([
      // Usuários ativos únicos na janela de tempo
      prisma.analyticsEvent.groupBy({
        by: ['userId'],
        where: {
          ...whereClause,
          userId: { not: null }
        }
      }),

      // Total de eventos na janela
      prisma.analyticsEvent.count({
        where: whereClause
      }),

      // Eventos de erro na janela
      prisma.analyticsEvent.count({
        where: {
          ...whereClause,
          eventData: {
            path: ['status'],
            equals: 'error'
          }
        }
      }),

      // Eventos mais recentes (últimos 20)
      prisma.analyticsEvent.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          eventType: true,
          eventData: true,
          createdAt: true,
          userId: true
        }
      }),

      // Eventos por minuto para gráfico de timeline
      prisma.$queryRaw\`
        SELECT 
          TO_CHAR(created_at, 'HH24:MI') as minute,
          COUNT(*) as events,
          COUNT(CASE WHEN event_data->>'status' = 'error' THEN 1 END) as errors
        FROM "AnalyticsEvent" 
        WHERE created_at >= \${startTime}
        \${organizationId ? Prisma.sql\`AND event_data->>'organizationId' = \${organizationId}\` : Prisma.sql\`\`}
        GROUP BY minute
        ORDER BY minute DESC
        LIMIT 60
      \`,

      // Top categorias de eventos (usando eventType como categoria)
      prisma.analyticsEvent.groupBy({
        by: ['eventType'],
        where: whereClause,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5
      }),

      // ✅ REAL - Métricas de saúde do sistema
      (async () => {
        // Calculate average response time from recent events
        // Note: aggregate on JSONB field is not directly supported by Prisma aggregate
        // We use raw query for this
        const avgDurationResult = await prisma.$queryRaw<{ avg_duration: number | null }[]>\`
          SELECT AVG(CAST(event_data->>'duration' AS FLOAT)) as avg_duration
          FROM "AnalyticsEvent"
          WHERE created_at >= \${startTime}
          AND event_data->>'duration' IS NOT NULL
          \${organizationId ? Prisma.sql\`AND event_data->>'organizationId' = \${organizationId}\` : Prisma.sql\`\`}
        \`;
        
        const avgDuration = avgDurationResult[0]?.avg_duration || 0;

        // Calculate throughput (events per second)
        const durationSeconds = (now.getTime() - startTime.getTime()) / 1000;
        // We need totalEvents here, but we can't access it inside Promise.all easily without chaining
        // So we re-fetch count or assume it will be consistent
        const count = await prisma.analyticsEvent.count({ where: whereClause });
        const throughput = Math.round(count / Math.max(1, durationSeconds));

        // Calculate error rate
        const errorCount = await prisma.analyticsEvent.count({
          where: {
            ...whereClause,
            eventData: {
              path: ['status'],
              equals: 'error'
            }
          }
        });
        const realtimeErrorRate = count > 0 ? (errorCount / count * 100) : 0;

        return {
          cpu: 0,
          memory: 0,
          responseTime: Math.round(avgDuration),
          throughput,
          errorRate: realtimeErrorRate
        };
      })()
    ]);

    // Calcular métricas derivadas
    const eventsPerMinute = totalEvents / Math.max(1, (now.getTime() - startTime.getTime()) / (1000 * 60));
    const errorRate = totalEvents > 0 ? (errorEvents / totalEvents * 100).toFixed(2) : '0';

    // Processar dados de timeline
    const timeline = (eventsByMinute as unknown as Array<Record<string, unknown>>).map(item => ({
      time: String(item.minute),
      events: Number(item.events),
      errors: Number(item.errors)
    }));

    // Calcular tendências (comparar com período anterior)
    const previousStartTime = new Date(startTime.getTime() - (now.getTime() - startTime.getTime()));
    
    const previousWhereClause: Prisma.AnalyticsEventWhereInput = {
      createdAt: { 
        gte: previousStartTime,
        lt: startTime
      },
      ...(organizationId && { 
        eventData: {
          path: ['organizationId'],
          equals: organizationId
        }
      })
    };

    const previousPeriodEvents = await prisma.analyticsEvent.count({
      where: previousWhereClause
    });

    const previousPeriodUsers = await prisma.analyticsEvent.groupBy({
      by: ['userId'],
      where: {
        ...previousWhereClause,
        userId: { not: null }
      }
    });

    // Calcular mudanças percentuais
    const eventsTrend = previousPeriodEvents > 0 ? 
      ((totalEvents - previousPeriodEvents) / previousPeriodEvents * 100).toFixed(1) : '0';
    
    const usersTrend = previousPeriodUsers.length > 0 ? 
      ((activeUsers.length - previousPeriodUsers.length) / previousPeriodUsers.length * 100).toFixed(1) : '0';

    // Detectar anomalias simples
    const anomalies = [];
    
    if (parseFloat(errorRate) > 10) {
      anomalies.push({
        type: 'high_error_rate',
        severity: 'warning',
        message: \`Taxa de erro elevada: \${errorRate}%\`,
        timestamp: new Date().toISOString()
      });
    }

    if (systemHealth.responseTime > 2000) {
      anomalies.push({
        type: 'slow_response',
        severity: 'warning',
        message: \`Tempo de resposta lento: \${Math.round(systemHealth.responseTime)}ms\`,
        timestamp: new Date().toISOString()
      });
    }

    if (eventsPerMinute > 100) {
      anomalies.push({
        type: 'high_traffic',
        severity: 'info',
        message: \`Tráfego elevado: \${Math.round(eventsPerMinute)} eventos/min\`,
        timestamp: new Date().toISOString()
      });
    }

    // Montar resposta
    const realtimeData = {
      timestamp: new Date().toISOString(),
      window,
      summary: {
        activeUsers: activeUsers.length,
        totalEvents,
        errorEvents,
        errorRate: parseFloat(errorRate),
        eventsPerMinute: Math.round(eventsPerMinute),
        avgResponseTime: Math.round(systemHealth.responseTime)
      },
      trends: {
        events: {
          current: totalEvents,
          previous: previousPeriodEvents,
          change: parseFloat(eventsTrend),
          direction: parseFloat(eventsTrend) >= 0 ? 'up' : 'down'
        },
        users: {
          current: activeUsers.length,
          previous: previousPeriodUsers.length,
          change: parseFloat(usersTrend),
          direction: parseFloat(usersTrend) >= 0 ? 'up' : 'down'
        }
      },
      timeline,
      topCategories: topCategories.map((item) => ({
        category: item.eventType,
        count: item._count.id,
        percentage: totalEvents > 0 ? ((item._count.id / totalEvents) * 100).toFixed(1) : '0'
      })),
      systemHealth: {
        status: systemHealth.cpu < 80 && systemHealth.memory < 80 && systemHealth.responseTime < 2000 ? 'healthy' : 'warning',
        cpu: Math.round(systemHealth.cpu),
        memory: Math.round(systemHealth.memory),
        responseTime: Math.round(systemHealth.responseTime),
        throughput: systemHealth.throughput
      },
      recentEvents: recentEvents.map(event => {
        const data = (event.eventData as Record<string, unknown>) || {};
        return {
          id: event.id,
          category: event.eventType,
          action: data.action || 'unknown',
          label: data.label || '',
          status: data.status || 'success',
          duration: data.duration || 0,
          createdAt: event.createdAt,
          userId: event.userId,
          timeAgo: Math.round((now.getTime() - new Date(event.createdAt).getTime()) / 1000) // segundos atrás
        };
      }),
      anomalies,
      alerts: anomalies.filter(a => a.severity === 'warning' || a.severity === 'error')
    };

    return NextResponse.json(realtimeData);

  } catch (error: unknown) {
    logger.error('[Analytics Realtime] Error', { 
      component: 'API: analytics/realtime', 
      error: error instanceof Error ? error : new Error(String(error)) 
    });
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to fetch realtime metrics',
        message
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analytics/realtime
 * Endpoint para receber eventos em tempo real via webhook ou push
 */
async function postHandler(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    
    const {
      events,
      source,
      timestamp
    } = body;

    // Validação básica
    if (!events || !Array.isArray(events)) {
      return NextResponse.json(
        { error: 'events array is required' },
        { status: 400 }
      );
    }

    const userId = session?.user?.id || null;
    const organizationId = session?.user ? getOrgId(session.user) : null;

    // Processar eventos em lote
    const processedEvents = (events as unknown as Array<Record<string, unknown>>).map((event) => ({
      userId: (event.userId as string) || userId,
      eventType: (event.category as string) || 'realtime',
      eventData: {
        organizationId,
        action: (event.action as string) || 'event',
        label: event.label as string | null | undefined,
        duration: event.duration as number | null | undefined,
        fileSize: event.fileSize as number | null | undefined,
        value: event.value as number | null | undefined,
        status: (event.status as string) || 'success',
        errorCode: event.errorCode as string | null | undefined,
        errorMessage: event.errorMessage as string | null | undefined,
        metadata: {
          source,
          originalTimestamp: timestamp,
          ...(event.metadata as Record<string, unknown> | undefined)
        }
      }
    }));

    // Inserir eventos no banco
    await prisma.analyticsEvent.createMany({
      data: processedEvents
    });

    return NextResponse.json({
      success: true,
      processed: processedEvents.length,
      message: 'Realtime events processed'
    });

  } catch (error: unknown) {
    logger.error('[Analytics Realtime POST] Error', { 
      component: 'API: analytics/realtime', 
      error: error instanceof Error ? error : new Error(String(error)) 
    });
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to process realtime events',
        message
      },
      { status: 500 }
    );
  }
}

// Aplicar middleware de performance
export const GET = withAnalytics(getHandler);
export const POST = withAnalytics(postHandler);`
  }
];

files.forEach(file => {
  const filePath = path.resolve(file.path);
  fs.writeFileSync(filePath, file.content, 'utf8');
  console.log(\`Updated \${file.path}\`);
});
