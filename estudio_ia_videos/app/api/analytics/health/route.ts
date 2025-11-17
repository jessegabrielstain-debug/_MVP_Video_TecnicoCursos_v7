import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withAnalytics } from '@/lib/analytics/middleware';
import { ANALYTICS_CONFIG, validateConfig, getEnvironmentInfo } from '@/lib/analytics/config';
import { supabase } from '@/lib/services';

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
  details?: any;
}

async function checkDatabase(): Promise<HealthCheckResult> {
  const start = Date.now();
  try {
    const { data, error } = await supabase
      .from('analytics_events')
      .select('count')
      .limit(1);

    if (error) throw error;

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

    const { data, error } = await supabase
      .from('analytics_events')
      .select('count')
      .gte('created_at', yesterday.toISOString());

    if (error) throw error;

    const recentEvents = Array.isArray(data) ? data.length : 0;
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
    const { data: activeAlerts, error } = await supabase
      .from('analytics_alerts')
      .select('count')
      .eq('status', 'active');

    if (error) throw error;

    const alertCount = Array.isArray(activeAlerts) ? activeAlerts.length : 0;
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
    const { data: scheduledReports, error } = await supabase
      .from('analytics_reports')
      .select('count')
      .eq('status', 'scheduled');

    if (error) throw error;

    const reportCount = Array.isArray(scheduledReports) ? scheduledReports.length : 0;
    
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
    const { data: eventsData } = await supabase
      .from('analytics_events')
      .select('count');
    const totalEvents = Array.isArray(eventsData) ? eventsData.length : 0;

    // Total de usuários únicos
    const { data: usersData } = await supabase
      .from('analytics_events')
      .select('user_id')
      .not('user_id', 'is', null);
    const uniqueUsers = new Set(usersData?.map(u => u.user_id) || []).size;

    // Taxa de erro (últimas 24h)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const { data: errorEvents } = await supabase
      .from('analytics_events')
      .select('count')
      .eq('category', 'error')
      .gte('created_at', yesterday.toISOString());
    
    const { data: totalRecentEvents } = await supabase
      .from('analytics_events')
      .select('count')
      .gte('created_at', yesterday.toISOString());

    const errorCount = Array.isArray(errorEvents) ? errorEvents.length : 0;
    const recentCount = Array.isArray(totalRecentEvents) ? totalRecentEvents.length : 0;
    const errorRate = recentCount > 0 ? (errorCount / recentCount) * 100 : 0;

    // Tempo médio de resposta (simulado)
    const avgResponseTime = 250; // ms

    // Alertas ativos
    const { data: activeAlerts } = await supabase
      .from('analytics_alerts')
      .select('count')
      .eq('status', 'active');
    const activeAlertsCount = Array.isArray(activeAlerts) ? activeAlerts.length : 0;

    // Relatórios agendados
    const { data: scheduledReports } = await supabase
      .from('analytics_reports')
      .select('count')
      .eq('status', 'scheduled');
    const scheduledReportsCount = Array.isArray(scheduledReports) ? scheduledReports.length : 0;

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
    const { data, error } = await supabase
      .from('analytics_events')
      .select('count')
      .limit(1);

    if (error) throw error;

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';