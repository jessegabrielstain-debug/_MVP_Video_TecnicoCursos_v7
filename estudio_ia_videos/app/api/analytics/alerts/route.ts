import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/auth-config';
import { getOrgId, isAdmin, getUserId } from '@/lib/auth/session-helpers';
import { AlertSystem, AlertType, AlertSeverity } from '@/lib/analytics/alert-system';
import { withAnalytics } from '@/lib/analytics/api-performance-middleware';
import { prisma } from '@/lib/db';

// Type-safe helper extraindo organizationId
const getOrgId = (user: unknown): string | undefined => {
  const u = user as { currentOrgId?: string; organizationId?: string };
  return u.currentOrgId || u.organizationId || undefined;
};

// Type-safe helper verificando admin
const isAdmin = (user: unknown): boolean => {
  return ((user as { isAdmin?: boolean }).isAdmin) === true;
};
// Type-safe helper extraindo organizationId
const getOrgId = (user: unknown): string | undefined => {
  const u = user as { currentOrgId?: string; organizationId?: string };
  return u.currentOrgId || u.organizationId || undefined;
};

// Type-safe helper verificando admin
const isAdmin = (user: unknown): boolean => {
  return ((user as { isAdmin?: boolean }).isAdmin) === true;
};
/**
 * GET /api/analytics/alerts
 * Lista alertas ativos ou executa avaliação de alertas
 * 
 * Query params:
 * - action: 'list' | 'evaluate' (default: 'list')
 * - status: 'active' | 'acknowledged' | 'resolved' | 'all' (default: 'active')
 * - severity: 'info' | 'warning' | 'error' | 'critical' | 'all' (default: 'all')
 * - limit: number (default: 50)
 */
async function getHandler(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || 'list';
    const status = searchParams.get('status') || 'active';
    const severity = searchParams.get('severity') || 'all';
    const limit = parseInt(searchParams.get('limit') || '50');
    const organizationId = getOrgId(session.user);

    const alertSystem = new AlertSystem();

    if (action === 'evaluate') {
      // Verificar se o usuário tem permissão para executar avaliação manual
      if (!isAdmin(session.user)) {
        return NextResponse.json(
          { error: 'Admin privileges required to evaluate alerts manually' },
          { status: 403 }
        );
      }

      const evaluationResult = await alertSystem.evaluateAlerts();
      return NextResponse.json({
        message: 'Alert evaluation completed',
        ...evaluationResult,
        evaluatedAt: new Date()
      });
    }

    // Listar alertas
    const whereClause: any = {
      category: 'alert',
      ...(organizationId && { organizationId })
    };

    if (status !== 'all') {
      whereClause.status = status;
    }

    if (severity !== 'all') {
      whereClause.metadata = {
        path: ['severity'],
        equals: severity
      };
    }

    const alerts = await prisma.analyticsEvent.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    // Buscar estatísticas dos alertas
    const [totalAlerts, activeAlerts, criticalAlerts, recentAlerts] = await Promise.all([
      prisma.analyticsEvent.count({
        where: {
          category: 'alert',
          ...(organizationId && { organizationId })
        }
      }),
      
      prisma.analyticsEvent.count({
        where: {
          category: 'alert',
          status: 'active',
          ...(organizationId && { organizationId })
        }
      }),
      
      prisma.analyticsEvent.count({
        where: {
          category: 'alert',
          status: 'active',
          metadata: {
            path: ['severity'],
            equals: 'critical'
          },
          ...(organizationId && { organizationId })
        }
      }),
      
      prisma.analyticsEvent.count({
        where: {
          category: 'alert',
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24h
          },
          ...(organizationId && { organizationId })
        }
      })
    ]);

    const formattedAlerts = alerts.map(alert => {
      const metadata = (alert.metadata as Record<string, unknown> | null) ?? {}

      const valueFromMetadata = typeof metadata.value === 'number'
        ? metadata.value
        : typeof metadata.measurement === 'number'
          ? metadata.measurement
          : undefined

      return {
        id: alert.id,
        ruleId: metadata.ruleId || '',
        type: alert.action as AlertType,
        severity: metadata.severity || 'warning',
        title: alert.label || 'Unknown Alert',
        message: metadata.message || '',
        value: valueFromMetadata ?? alert.duration ?? 0,
        threshold: typeof metadata.threshold === 'number' ? metadata.threshold : 0,
        status: alert.status ?? 'success',
        organizationId: alert.organizationId,
        userId: alert.userId,
        metadata: alert.metadata,
        triggeredAt: alert.createdAt,
        acknowledgedAt: metadata.acknowledgedAt ? new Date(metadata.acknowledgedAt) : null,
        resolvedAt: metadata.resolvedAt ? new Date(metadata.resolvedAt) : null,
        acknowledgedBy: metadata.acknowledgedBy,
        resolvedBy: metadata.resolvedBy,
      }
    });

    return NextResponse.json({
      alerts: formattedAlerts,
      stats: {
        total: totalAlerts,
        active: activeAlerts,
        critical: criticalAlerts,
        recent: recentAlerts
      },
      pagination: {
        limit,
        returned: formattedAlerts.length
      }
    });

  } catch (error: any) {
    console.error('[Analytics Alerts] Error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to fetch alerts',
        message: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analytics/alerts
 * Cria nova regra de alerta ou gerencia alertas existentes
 */
async function postHandler(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { action, alertId, ruleData } = body;

    const organizationId = getOrgId(session.user);
    const alertSystem = new AlertSystem();

    if (action === 'acknowledge' && alertId) {
      await alertSystem.acknowledgeAlert(alertId, session.user.id);
      return NextResponse.json({
        success: true,
        message: 'Alert acknowledged successfully'
      });
    }

    if (action === 'resolve' && alertId) {
      await alertSystem.resolveAlert(alertId, session.user.id);
      return NextResponse.json({
        success: true,
        message: 'Alert resolved successfully'
      });
    }

    if (action === 'create_rule' && ruleData) {
      // Validar dados da regra
      const {
        name,
        type,
        severity,
        condition,
        channels,
        cooldown = 15
      } = ruleData;

      if (!name || !type || !severity || !condition) {
        return NextResponse.json(
          { error: 'name, type, severity, and condition are required' },
          { status: 400 }
        );
      }

      // Validar condição
      if (!condition.metric || !condition.operator || condition.threshold === undefined) {
        return NextResponse.json(
          { error: 'condition must have metric, operator, and threshold' },
          { status: 400 }
        );
      }

      // Criar regra de alerta
      const rule = await prisma.analyticsEvent.create({
        data: {
          organizationId,
          userId: session.user.id,
          category: 'alert_rule',
          action: type,
          label: name,
          status: 'active',
          metadata: {
            severity,
            condition: {
              ...condition,
              timeWindow: condition.timeWindow || 15
            },
            channels: channels || [],
            cooldown,
            createdBy: session.user.id,
            createdAt: new Date()
          }
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Alert rule created successfully',
        ruleId: rule.id
      });
    }

    return NextResponse.json(
      { error: 'Invalid action or missing parameters' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('[Analytics Alerts POST] Error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to process alert request',
        message: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/analytics/alerts
 * Atualiza regra de alerta existente
 */
async function putHandler(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { ruleId, updates } = body;

    if (!ruleId || !updates) {
      return NextResponse.json(
        { error: 'ruleId and updates are required' },
        { status: 400 }
      );
    }

    const organizationId = getOrgId(session.user);

    // Verificar se a regra existe e pertence ao usuário/organização
    const existingRule = await prisma.analyticsEvent.findFirst({
      where: {
        id: ruleId,
        category: 'alert_rule',
        userId: session.user.id,
        ...(organizationId && { organizationId })
      }
    });

    if (!existingRule) {
      return NextResponse.json(
        { error: 'Alert rule not found or access denied' },
        { status: 404 }
      );
    }

    // Atualizar regra
    const currentMetadata = existingRule.metadata as Record<string, unknown> | null;
    const updatedMetadata = {
      ...currentMetadata,
      ...updates,
      updatedBy: session.user.id,
      updatedAt: new Date()
    };

    await prisma.analyticsEvent.update({
      where: { id: ruleId },
      data: {
        label: updates.name || existingRule.label,
        action: updates.type || existingRule.action,
        status: updates.isActive !== undefined ? 
          (updates.isActive ? 'active' : 'inactive') : existingRule.status,
        metadata: updatedMetadata
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Alert rule updated successfully'
    });

  } catch (error: any) {
    console.error('[Analytics Alerts PUT] Error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to update alert rule',
        message: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/analytics/alerts
 * Remove regra de alerta
 */
async function deleteHandler(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const ruleId = searchParams.get('ruleId');

    if (!ruleId) {
      return NextResponse.json(
        { error: 'ruleId is required' },
        { status: 400 }
      );
    }

    const organizationId = getOrgId(session.user);

    // Verificar se a regra existe e pertence ao usuário/organização
    const existingRule = await prisma.analyticsEvent.findFirst({
      where: {
        id: ruleId,
        category: 'alert_rule',
        userId: session.user.id,
        ...(organizationId && { organizationId })
      }
    });

    if (!existingRule) {
      return NextResponse.json(
        { error: 'Alert rule not found or access denied' },
        { status: 404 }
      );
    }

    // Remover regra
    await prisma.analyticsEvent.delete({
      where: { id: ruleId }
    });

    return NextResponse.json({
      success: true,
      message: 'Alert rule deleted successfully'
    });

  } catch (error: any) {
    console.error('[Analytics Alerts DELETE] Error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to delete alert rule',
        message: error.message
      },
      { status: 500 }
    );
  }
}

// Aplicar middleware de performance
export const GET = withAnalytics(getHandler);
export const POST = withAnalytics(postHandler);
export const PUT = withAnalytics(putHandler);
export const DELETE = withAnalytics(deleteHandler);
