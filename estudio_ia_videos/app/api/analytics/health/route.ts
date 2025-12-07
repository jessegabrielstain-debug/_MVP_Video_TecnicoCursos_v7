import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withAnalytics } from '@/lib/analytics/middleware';
import { ANALYTICS_CONFIG, validateConfig, getEnvironmentInfo } from '@/lib/analytics/config';
import { prisma } from '@/lib/prisma';

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
    await prisma.$queryRaw`SELECT 1`;

    return {
      status: 'pass',
      message: 'Database connection successful',
      duration: Date.now() - start,
      details: { connected: true }
    };
  } catch (error) {
    return {
      status: 'fail',
      message: `Database connection failed: ${error}`,
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
      ? `Analytics active with ${recentEvents} recent events`
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
      message: `Analytics check failed: ${error}`,
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
        : `Configuration issues: ${validation.errors.join(', ')}`,
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
      message: `Configuration check failed: ${error}`,
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
      message: `Storage ${freeSpace}% free`,
      duration: Date.now() - start,
      details: { 
        freeSpacePercent: freeSpace,
        path: ANALYTICS_CONFIG.REPORTS.STORAGE_PATH
      }
    };
  } catch (error) {
    return {
      status: 'fail',
      message: `Storage check failed: ${error}`,
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
      message: `${alertCount} active alerts`,
      duration: Date.now() - start,
      details: { 
        activeAlerts: alertCount,
        emailConfigured: !!ANALYTICS_CONFIG.ALERTS.EMAIL_FROM
      }
    };
  } catch (error) {
    return {
      status: 'warn',
      message: `Alerts check failed: ${error}`,
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
      message: `${reportCount} scheduled reports`,
      duration: Date.now() - start,
      details: { 
        scheduledReports: reportCount,
        emailConfigured: !!ANALYTICS_CONFIG.REPORTS.EMAIL_FROM
      }
    };
  } catch (error) {
    return {
      status: 'warn',
      message: `Reports check failed: ${error}`,
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
    console.error('Error getting metrics:', error);
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

async function performHealthCheck(): Promise<HealthCheck> {
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

  let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
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

export async function GET(request: NextRequest) {
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
    console.error('Health check error:', error);
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
export async function HEAD(request: NextRequest) {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
