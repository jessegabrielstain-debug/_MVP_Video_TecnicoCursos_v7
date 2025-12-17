import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getOrgId, isAdmin, getUserId } from '@/lib/auth/session-helpers';
import { ReportGenerator, ReportType } from '@/lib/analytics/report-generator';
import { withAnalytics } from '@/lib/analytics/api-performance-middleware';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';

/**
 * GET /api/analytics/reports
 * Lista relatórios disponíveis ou gera um relatório específico
 * 
 * Query params:
 * - type: 'daily' | 'weekly' | 'monthly'
 * - format: 'json' | 'html' | 'pdf'
 * - date: ISO date string (opcional, default: hoje)
 * - generate: 'true' para gerar novo relatório
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
    const type = searchParams.get('type') as ReportType;
    const format = searchParams.get('format') || 'json';
    const dateParam = searchParams.get('date');
    const generate = searchParams.get('generate') === 'true';
    const organizationId = getOrgId(session.user);

    // Se não especificar tipo, listar relatórios disponíveis
    if (!type) {
      const reports = await prisma.analyticsEvent.findMany({
        where: {
          eventType: 'report_generated',
          ...(organizationId && { 
            eventData: {
              path: ['organizationId'],
              equals: organizationId
            }
          })
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          eventData: true,
          createdAt: true
        }
      });

      return NextResponse.json({
        reports: reports.map(report => {
          const data = report.eventData as Record<string, unknown>;
          return {
            id: report.id,
            type: data.action,
            period: data.label,
            generatedAt: report.createdAt,
            metadata: data
          };
        }),
        availableTypes: ['daily', 'weekly', 'monthly'],
        availableFormats: ['json', 'html', 'pdf']
      });
    }

    // Validar tipo de relatório
    if (!['daily', 'weekly', 'monthly'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid report type. Must be daily, weekly, or monthly' },
        { status: 400 }
      );
    }

    // Validar formato
    if (!['json', 'html', 'pdf'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Must be json, html, or pdf' },
        { status: 400 }
      );
    }

    const date = dateParam ? new Date(dateParam) : new Date();
    
    // Verificar se a data é válida
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    const reportGenerator = new ReportGenerator();

    // Verificar se já existe um relatório para este período (cache)
    if (!generate) {
      const label = reportGenerator['getDateRange'](type, date).label;
      const existingReport = await prisma.analyticsEvent.findFirst({
        where: {
          eventType: 'report_generated',
          eventData: {
            path: ['action'],
            equals: type
          },
          AND: {
            eventData: {
              path: ['label'],
              equals: label
            }
          },
          ...(organizationId && { 
            eventData: {
              path: ['organizationId'],
              equals: organizationId
            }
          })
        },
        orderBy: { createdAt: 'desc' }
      });

      if (existingReport && existingReport.eventData) {
        const cachedData = existingReport.eventData as Record<string, unknown>;
        
        if (format === 'html') {
          const htmlContent = await reportGenerator.generateHTMLReport(cachedData);
          return new NextResponse(htmlContent, {
            headers: {
              'Content-Type': 'text/html',
              'Content-Disposition': `inline; filename="report-${type}-${date.toISOString().split('T')[0]}.html"`
            }
          });
        }

        if (format === 'pdf') {
          // Para PDF, retornar HTML que pode ser convertido pelo frontend
          const htmlContent = await reportGenerator.generateHTMLReport(cachedData);
          return NextResponse.json({
            type: 'pdf',
            htmlContent,
            filename: `report-${type}-${date.toISOString().split('T')[0]}.pdf`
          });
        }

        return NextResponse.json({
          ...cachedData,
          cached: true,
          generatedAt: existingReport.createdAt
        });
      }
    }

    // Gerar novo relatório
    const reportData = await reportGenerator.generateReport(type, organizationId, date);

    // Salvar relatório no banco para cache
    await prisma.analyticsEvent.create({
      data: {
        userId: session.user.id,
        eventType: 'report_generated',
        eventData: {
          organizationId: organizationId || null,
          action: type,
          label: reportData.period.label,
          status: 'success',
          ...reportData
        } as unknown as Prisma.InputJsonValue
      }
    });

    // Retornar no formato solicitado
    if (format === 'html') {
      const htmlContent = await reportGenerator.generateHTMLReport(reportData);
      return new NextResponse(htmlContent, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `inline; filename="report-${type}-${date.toISOString().split('T')[0]}.html"`
        }
      });
    }

    if (format === 'pdf') {
      const htmlContent = await reportGenerator.generateHTMLReport(reportData);
      return NextResponse.json({
        type: 'pdf',
        htmlContent,
        filename: `report-${type}-${date.toISOString().split('T')[0]}.pdf`
      });
    }

    return NextResponse.json({
      ...reportData,
      cached: false,
      generatedAt: new Date()
    });

  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error)); logger.error('[Analytics Reports] Error', err, { component: 'API: analytics/reports' });
    
    return NextResponse.json(
      {
        error: 'Failed to generate report',
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/analytics/reports
 * Agenda relatórios automáticos ou gera relatórios customizados
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
      type,
      schedule,
      recipients,
      format = 'html',
      customFilters,
      autoGenerate = false
    } = body;

    // Validações
    if (!type || !['daily', 'weekly', 'monthly'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid or missing report type' },
        { status: 400 }
      );
    }

    if (schedule && !['daily', 'weekly', 'monthly'].includes(schedule)) {
      return NextResponse.json(
        { error: 'Invalid schedule. Must be daily, weekly, or monthly' },
        { status: 400 }
      );
    }

    const organizationId = getOrgId(session.user);
    const reportGenerator = new ReportGenerator();

    if (autoGenerate) {
      // Gerar relatório imediatamente
      const reportData = await reportGenerator.generateReport(
        type as ReportType,
        organizationId,
        new Date()
      );

      // Salvar configuração de relatório automático
      await prisma.analyticsEvent.create({
        data: {
          userId: session.user.id,
          eventType: 'report_scheduled',
          eventData: {
            organizationId: organizationId || null,
            action: type,
            label: `Auto-report ${type}`,
            status: 'success',
            schedule,
            recipients,
            format,
            customFilters,
            createdBy: session.user.id,
            createdAt: new Date().toISOString()
          } as unknown as Prisma.InputJsonValue
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Automatic report configured and generated',
        reportData,
        schedule: {
          type: schedule,
          nextRun: getNextRunDate(schedule || type)
        }
      });
    }

    // Apenas configurar agendamento
    await prisma.analyticsEvent.create({
      data: {
        userId: session.user.id,
        eventType: 'report_scheduled',
        eventData: {
          organizationId: organizationId || null,
          action: type,
          label: `Scheduled ${type} report`,
          status: 'pending',
          schedule,
          recipients,
          format,
          customFilters,
          createdBy: session.user.id,
          createdAt: new Date().toISOString()
        } as unknown as Prisma.InputJsonValue
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Report scheduled successfully',
      schedule: {
        type: schedule || type,
        nextRun: getNextRunDate(schedule || type),
        recipients: recipients?.length || 0,
        format
      }
    });

  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error)); logger.error('[Analytics Reports POST] Error', err, { component: 'API: analytics/reports' });
    
    return NextResponse.json(
      {
        error: 'Failed to schedule report',
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/analytics/reports
 * Remove agendamento de relatório
 */
async function deleteHandler(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const reportId = searchParams.get('id');
    const type = searchParams.get('type');

    if (!reportId && !type) {
      return NextResponse.json(
        { error: 'Report ID or type is required' },
        { status: 400 }
      );
    }

    const organizationId = getOrgId(session.user);

    if (reportId) {
      // Remover relatório específico
      // Note: Prisma delete requires unique ID. If we want to check ownership, we should findFirst then delete.
      // Or use deleteMany with ID and user check.
      await prisma.analyticsEvent.deleteMany({
        where: {
          id: reportId,
          userId: session.user.id,
          ...(organizationId && { 
            eventData: {
              path: ['organizationId'],
              equals: organizationId
            }
          })
        }
      });
    } else if (type) {
      // Remover todos os agendamentos deste tipo
      await prisma.analyticsEvent.deleteMany({
        where: {
          eventType: 'report_scheduled',
          userId: session.user.id,
          eventData: {
            path: ['action'],
            equals: type
          },
          ...(organizationId && { 
            eventData: {
              path: ['organizationId'],
              equals: organizationId
            }
          })
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Report schedule removed successfully'
    });

  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error)); logger.error('[Analytics Reports DELETE] Error', err, { component: 'API: analytics/reports' });
    
    return NextResponse.json(
      {
        error: 'Failed to remove report schedule',
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

function getNextRunDate(schedule: string): Date {
  const now = new Date();
  
  switch (schedule) {
    case 'daily':
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(8, 0, 0, 0); // 8:00 AM
      return tomorrow;
      
    case 'weekly':
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + (7 - nextWeek.getDay() + 1)); // Próxima segunda
      nextWeek.setHours(8, 0, 0, 0);
      return nextWeek;
      
    case 'monthly':
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(1);
      nextMonth.setHours(8, 0, 0, 0);
      return nextMonth;
      
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 horas
  }
}

// Aplicar middleware de performance
export const GET = withAnalytics(getHandler);
export const POST = withAnalytics(postHandler);
export const DELETE = withAnalytics(deleteHandler);

