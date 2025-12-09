import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getOrgId, isAdmin } from '@/lib/auth/session-helpers';
import { AlertSystem, AlertType } from '@/lib/analytics/alert-system';
import { withAnalytics } from '@/lib/analytics/api-performance-middleware';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';

interface AlertEventData {
  ruleId?: string;
  type?: string;
  severity?: string;
  title?: string;
  message?: string;
  value?: number;
  measurement?: number;
  threshold?: number;
  status?: string;
  organizationId?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  acknowledgedBy?: string;
  resolvedBy?: string;
  [key: string]: unknown;
}

/**
 * GET /api/analytics/alerts
 * Lista alertas ativos ou executa avaliação de alertas
 */
async function getHandler(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
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
    const whereClause: Prisma.AnalyticsEventWhereInput = {
      eventType: 'alert',
      ...(organizationId && { 
        eventData: {
          path: ['organizationId'],
          equals: organizationId
        }
      })
    };

    if (status !== 'all') {
      // We need to be careful with merging filters on eventData
      // Using AND is safer when multiple filters on the same JSON field are needed
      const statusFilter: Prisma.AnalyticsEventWhereInput = {
        eventData: {
          path: ['status'],
          equals: status
        }
      };
      
      if (whereClause.AND) {
        if (Array.isArray(whereClause.AND)) {
          (whereClause.AND as Prisma.AnalyticsEventWhereInput[]).push(statusFilter);
        } else {
          whereClause.AND = [whereClause.AND as Prisma.AnalyticsEventWhereInput, statusFilter];
        }
      } else {
        whereClause.AND = [statusFilter];
      }
    }

    if (severity !== 'all') {
      const severityFilter: Prisma.AnalyticsEventWhereInput = {
        eventData: {
          path: ['severity'],
          equals: severity
        }
      };

      if (whereClause.AND) {
        if (Array.isArray(whereClause.AND)) {
          (whereClause.AND as Prisma.AnalyticsEventWhereInput[]).push(severityFilter);
        } else {
          whereClause.AND = [whereClause.AND as Prisma.AnalyticsEventWhereInput, severityFilter];
        }
      } else {
        whereClause.AND = [severityFilter];
      }
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
          eventType: 'alert',
          ...(organizationId && { 
            eventData: {
              path: ['organizationId'],
              equals: organizationId
            }
          })
        }
      }),
      
      prisma.analyticsEvent.count({
        where: {
          eventType: 'alert',
          AND: [
            {
              eventData: {
                path: ['status'],
                equals: 'active'
              }
            },
            ...(organizationId ? [{
              eventData: {
                path: ['organizationId'],
                equals: organizationId
              }
            }] : [])
          ]
        }
      }),
      
      prisma.analyticsEvent.count({
        where: {
          eventType: 'alert',
          AND: [
            {
              eventData: {
                path: ['status'],
                equals: 'active'
              }
            },
            {
              eventData: {
                path: ['severity'],
                equals: 'critical'
              }
            },
            ...(organizationId ? [{
              eventData: {
                path: ['organizationId'],
                equals: organizationId
              }
            }] : [])
          ]
        }
      }),
      
      prisma.analyticsEvent.count({
        where: {
          eventType: 'alert',
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24h
          },
          ...(organizationId && { 
            eventData: {
              path: ['organizationId'],
              equals: organizationId
            }
          })
        }
      })
    ]);

    const formattedAlerts = alerts.map(alert => {
      const data = (alert.eventData as unknown as AlertEventData) || {};

      const valueFromData = typeof data.value === 'number'
        ? data.value
        : typeof data.measurement === 'number'
          ? data.measurement
          : undefined

      return {
        id: alert.id,
        ruleId: data.ruleId || '',
        type: (data.type as AlertType) || 'system',
        severity: data.severity || 'warning',
        title: data.title || 'Unknown Alert',
        message: data.message || '',
        value: valueFromData ?? 0,
        threshold: typeof data.threshold === 'number' ? data.threshold : 0,
        status: data.status ?? 'success',
        organizationId: data.organizationId,
        userId: alert.userId,
        metadata: data,
        triggeredAt: alert.createdAt,
        acknowledgedAt: data.acknowledgedAt ? new Date(data.acknowledgedAt) : null,
        resolvedAt: data.resolvedAt ? new Date(data.resolvedAt) : null,
        acknowledgedBy: data.acknowledgedBy,
        resolvedBy: data.resolvedBy,
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

  } catch (error) {
    logger.error('[Analytics Alerts] Error', { component: 'API: analytics/alerts', error: error instanceof Error ? error : new Error(String(error)) });
    
    return NextResponse.json(
      {
        error: 'Failed to fetch alerts',
        message: error instanceof Error ? error.message : 'Unknown error'
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
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
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
      await alertSystem.acknowledgeAlert(alertId, (session.user as any).id);
      return NextResponse.json({
        success: true,
        message: 'Alert acknowledged successfully'
      });
    }

    if (action === 'resolve' && alertId) {
      await alertSystem.resolveAlert(alertId, (session.user as any).id);
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
          userId: (session.user as any).id,
          eventType: 'alert_rule',
          eventData: {
            organizationId,
            type,
            title: name,
            status: 'active',
            severity,
            condition: {
              ...condition,
              timeWindow: condition.timeWindow || 15
            },
            channels: channels || [],
            cooldown,
            createdBy: (session.user as any).id,
            createdAt: new Date().toISOString()
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

  } catch (error) {
    logger.error('[Analytics Alerts POST] Error', { component: 'API: analytics/alerts', error: error instanceof Error ? error : new Error(String(error)) });
    
    return NextResponse.json(
      {
        error: 'Failed to process alert request',
        message: error instanceof Error ? error.message : 'Unknown error'
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
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
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
        eventType: 'alert_rule',
        userId: (session.user as any).id,
        ...(organizationId && { 
          eventData: {
            path: ['organizationId'],
            equals: organizationId
          }
        })
      }
    });

    if (!existingRule) {
      return NextResponse.json(
        { error: 'Alert rule not found or access denied' },
        { status: 404 }
      );
    }

    // Atualizar regra
    const currentData = (existingRule.eventData as Record<string, unknown> | null) || {};
    const updatedData = {
      ...currentData,
      ...updates,
      title: updates.name || currentData.title,
      type: updates.type || currentData.type,
      status: updates.isActive !== undefined ? 
        (updates.isActive ? 'active' : 'inactive') : currentData.status,
      updatedBy: (session.user as any).id,
      updatedAt: new Date().toISOString()
    };

    await prisma.analyticsEvent.update({
      where: { id: ruleId },
      data: {
        eventData: updatedData as Prisma.InputJsonValue
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Alert rule updated successfully'
    });

  } catch (error) {
    logger.error('[Analytics Alerts PUT] Error', { component: 'API: analytics/alerts', error: error instanceof Error ? error : new Error(String(error)) });
    
    return NextResponse.json(
      {
        error: 'Failed to update alert rule',
        message: error instanceof Error ? error.message : 'Unknown error'
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
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
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
        eventType: 'alert_rule',
        userId: (session.user as any).id,
        ...(organizationId && { 
          eventData: {
            path: ['organizationId'],
            equals: organizationId
          }
        })
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

  } catch (error) {
    logger.error('[Analytics Alerts DELETE] Error', { component: 'API: analytics/alerts', error: error instanceof Error ? error : new Error(String(error)) });
    
    return NextResponse.json(
      {
        error: 'Failed to delete alert rule',
        message: error instanceof Error ? error.message : 'Unknown error'
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

