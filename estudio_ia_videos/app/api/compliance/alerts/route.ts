import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const severity = searchParams.get('severity'); // critical, warning, info

    // Get user's projects
    const userProjects = await prisma.project.findMany({
      where: { userId },
      select: { id: true, title: true }
    });

    const projectIds = userProjects.map(p => p.id);

    // Get recent validations with issues
    const recentValidations = await prisma.nRComplianceRecord.findMany({
      where: {
        projectId: { in: projectIds },
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    // Generate alerts based on validation results
    const alerts = [];

    for (const validation of recentValidations) {
      const project = userProjects.find(p => p.id === validation.projectId);
      
      // Critical alerts (score < 60)
      if (validation.score < 60) {
        alerts.push({
          id: `critical-${validation.id}`,
          type: 'critical',
          title: 'Compliance Crítico Detectado',
          message: `Projeto "${project?.title}" tem score muito baixo (${validation.score}%) para ${validation.nr}`,
          projectId: validation.projectId,
          projectTitle: project?.title,
          nrType: validation.nr,
          score: validation.score,
          createdAt: validation.createdAt,
          suggestions: validation.recommendations ? (validation.recommendations as any) : [],
          action: 'review_immediately'
        });
      }
      // Warning alerts (score 60-79)
      else if (validation.score < 80) {
        alerts.push({
          id: `warning-${validation.id}`,
          type: 'warning',
          title: 'Compliance Precisa de Atenção',
          message: `Projeto "${project?.title}" tem score baixo (${validation.score}%) para ${validation.nr}`,
          projectId: validation.projectId,
          projectTitle: project?.title,
          nrType: validation.nr,
          score: validation.score,
          createdAt: validation.createdAt,
          suggestions: validation.recommendations ? (validation.recommendations as any) : [],
          action: 'review_soon'
        });
      }

      // Check for missing critical topics
      if (validation.criticalPoints) {
        const missingPoints = (validation.criticalPoints as any);
        if (Array.isArray(missingPoints) && missingPoints.length > 0) {
          alerts.push({
            id: `missing-${validation.id}`,
            type: 'warning',
            title: 'Pontos Críticos Ausentes',
            message: `${missingPoints.length} pontos críticos ausentes em "${project?.title}" (${validation.nr})`,
            projectId: validation.projectId,
            projectTitle: project?.title,
            nrType: validation.nr,
            score: validation.score,
            createdAt: validation.createdAt,
            missingPoints,
            action: 'add_content'
          });
        }
      }
    }

    // Filter by severity if specified
    let filteredAlerts = alerts;
    if (severity) {
      filteredAlerts = alerts.filter(alert => alert.type === severity);
    }

    // Sort by severity and date
    filteredAlerts.sort((a, b) => {
      const severityOrder: Record<string, number> = { critical: 3, warning: 2, info: 1 };
      const severityDiff = (severityOrder[b.type] || 0) - (severityOrder[a.type] || 0);
      if (severityDiff !== 0) return severityDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Get summary
    const summary = {
      total: alerts.length,
      critical: alerts.filter(a => a.type === 'critical').length,
      warning: alerts.filter(a => a.type === 'warning').length,
      info: alerts.filter(a => a.type === 'info').length
    };

    return NextResponse.json({
      alerts: filteredAlerts.slice(0, 20), // Limit to 20 most recent
      summary
    });

  } catch (error) {
    console.error('Error fetching compliance alerts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { alertId, action } = await request.json();

    // Here you could implement alert actions like:
    // - Mark as read
    // - Dismiss
    // - Create task
    // - Send notification

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error handling alert action:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
