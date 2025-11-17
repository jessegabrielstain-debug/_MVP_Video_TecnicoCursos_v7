import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/auth-config';
import { getOrgId, isAdmin, getUserId } from '@/lib/auth/session-helpers';
import { ReportGenerator, ReportType } from '@/lib/analytics/report-generator';
import { withAnalytics } from '@/lib/analytics/api-performance-middleware';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

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
    const session = await getServerSession(authConfig);
    
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
          category: 'report_generated',
          ...(organizationId && { organizationId })
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          action: true,
          label: true,
          createdAt: true,
          metadata: true
        }
      });

      return NextResponse.json({
        reports: reports.map(report => ({
          id: report.id,
          type: report.action,
          period: report.label,
          generatedAt: report.createdAt,
          metadata: report.metadata
        })),
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
      const existingReport = await prisma.analyticsEvent.findFirst({
        where: {
          category: 'report_generated',
          action: type,
          label: reportGenerator['getDateRange'](type, date).label,
          ...(organizationId && { organizationId })
        },
        orderBy: { createdAt: 'desc' }
      });

      if (existingReport && existingReport.metadata) {
        const cachedData = existingReport.metadata as Record<string, unknown>;
        
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
        organizationId,
        userId: session.user.id,
        category: 'report_generated',
        action: type,
        label: reportData.period.label,
        status: 'success',
        metadata: (reportData as unknown) as Prisma.InputJsonValue
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

  } catch (error: any) {
    console.error('[Analytics Reports] Error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to generate report',
        message: error.message
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
    const session = await getServerSession(authConfig);
    
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
          organizationId,
          userId: session.user.id,
          category: 'report_scheduled',
          action: type,
          label: `Auto-report ${type}`,
          status: 'success',
          metadata: {
            schedule,
            recipients,
            format,
            customFilters,
            createdBy: session.user.id,
            createdAt: new Date()
          }
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
        organizationId,
        userId: session.user.id,
        category: 'report_scheduled',
        action: type,
        label: `Scheduled ${type} report`,
        status: 'pending',
        metadata: {
          schedule,
          recipients,
          format,
          customFilters,
          createdBy: session.user.id,
          createdAt: new Date()
        }
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

  } catch (error: any) {
    console.error('[Analytics Reports POST] Error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to schedule report',
        message: error.message
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
    const session = await getServerSession(authConfig);
    
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
      await prisma.analyticsEvent.delete({
        where: {
          id: reportId,
          userId: session.user.id,
          ...(organizationId && { organizationId })
        }
      });
    } else if (type) {
      // Remover todos os agendamentos deste tipo
      await prisma.analyticsEvent.deleteMany({
        where: {
          category: 'report_scheduled',
          action: type,
          userId: session.user.id,
          ...(organizationId && { organizationId })
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Report schedule removed successfully'
    });

  } catch (error: any) {
    console.error('[Analytics Reports DELETE] Error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to remove report schedule',
        message: error.message
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
