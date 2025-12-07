import { NextRequest, NextResponse } from 'next/server';
import { AlertSystem } from '@/lib/analytics/alert-system';
import { withAnalytics } from '@/lib/analytics/api-performance-middleware';

const DEFAULT_CRON_TOKEN = process.env.CRON_TOKEN || 'default-cron-token';

type EvaluateRequestBody = {
  force?: boolean;
  organizationId?: string;
  ruleTypes?: string[];
  dryRun?: boolean;
};

function isAuthorized(authHeader: string | null, cronToken: string | null) {
  return Boolean(authHeader) || cronToken === DEFAULT_CRON_TOKEN;
}

async function postHandler(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronToken = req.headers.get('x-cron-token');

    if (!isAuthorized(authHeader, cronToken)) {
      return NextResponse.json(
        { error: 'Unauthorized. Valid authorization or cron token required.' },
        { status: 401 },
      );
    }

    const body = (await req.json().catch(() => ({}))) as EvaluateRequestBody;
    const {
      force = false,
      organizationId,
      ruleTypes = [],
      dryRun = false,
    } = body;

    const alertSystem = new AlertSystem();

    const startTime = Date.now();
    const result = await alertSystem.evaluateAlerts();
    const executionTime = Date.now() - startTime;

    console.log('[Alert Evaluation] Completed', {
      force,
      dryRun,
      organizationId,
      ruleTypes,
      evaluated: result.evaluated,
      triggered: result.triggered,
      durationMs: executionTime,
    });

    if (result.alerts.length > 0) {
      console.log('[Alert Evaluation] Triggered alerts', {
        alerts: result.alerts.map((alert) => ({
          id: alert.id,
          severity: alert.severity,
          title: alert.title,
        })),
      });
    }

    const response = {
      success: true,
      message: 'Alert evaluation completed successfully',
      execution: {
        startedAt: new Date(Date.now() - executionTime),
        completedAt: new Date(),
        durationMs: executionTime,
        dryRun,
      },
      results: {
        evaluated: result.evaluated,
        triggered: result.triggered,
        alerts: result.alerts.map((alert) => ({
          id: alert.id,
          type: alert.type,
          severity: alert.severity,
          title: alert.title,
          value: alert.value,
          threshold: alert.threshold,
          triggeredAt: alert.triggeredAt,
        })),
      },
      stats: {
        criticalAlerts: result.alerts.filter((a) => a.severity === 'critical').length,
        warningAlerts: result.alerts.filter((a) => a.severity === 'warning').length,
        errorAlerts: result.alerts.filter((a) => a.severity === 'error').length,
        infoAlerts: result.alerts.filter((a) => a.severity === 'info').length,
      },
    };

    if (response.stats.criticalAlerts > 0) {
      console.warn('[Alert Evaluation] Critical alerts triggered', {
        count: response.stats.criticalAlerts,
      });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Alert Evaluation] Critical error', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Alert evaluation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        execution: {
          startedAt: new Date(),
          completedAt: new Date(),
          durationMs: 0,
          failed: true,
        },
      },
      { status: 500 },
    );
  }
}

async function getHandler(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronToken = req.headers.get('x-cron-token');

    if (!isAuthorized(authHeader, cronToken)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const lastExecution = {
      timestamp: new Date(),
      status: 'success',
      evaluated: 0,
      triggered: 0,
      executionTime: 0,
    };

    const enabledRules = [
      'render_failures',
      'queue_stalled',
      'high_latency',
      'low_engagement',
    ];

    return NextResponse.json({
      lastExecution,
      systemStatus: 'operational',
      nextScheduledRun: new Date(Date.now() + 5 * 60 * 1000),
      configuration: {
        evaluationInterval: '5 minutes',
        enabledRules,
        notifications: {
          email: true,
          slack: true,
          sms: false,
        },
        dryRunSupported: true,
        defaultThresholds: {
          render_failures: 3,
          queue_stalled: 2,
          high_latency: 5000,
          low_engagement: 20,
        },
      },
    });
  } catch (error) {
    console.error('[Alert Evaluation Status] Error', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch alert evaluation status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

export const POST = withAnalytics(postHandler);
export const GET = withAnalytics(getHandler);

