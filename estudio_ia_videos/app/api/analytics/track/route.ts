import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withAnalytics } from '@/lib/analytics/api-performance-middleware';

/**
 * POST /api/analytics/track
 * Registra eventos de analytics em tempo real
 */
async function postHandler(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || null;

    const body = await req.json();
    const {
      category,
      action,
      label,
      metadata,
      projectId,
      userAgent,
      ...otherData
    } = body;

    // Validação básica
    if (!category || !action) {
      return NextResponse.json(
        { error: 'category and action are required' },
        { status: 400 }
      );
    }

    // Enriquecer metadata
    const eventData = {
      action,
      label,
      projectId,
      ...metadata,
      ...otherData,
      timestamp: new Date().toISOString(),
    };

    // Registrar no banco via Prisma
    await prisma.analyticsEvent.create({
      data: {
        userId,
        eventType: category,
        eventData: eventData as any,
        userAgent: userAgent || req.headers.get('user-agent'),
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Event tracked successfully'
    });

  } catch (error: unknown) {
    console.error('[Analytics Track] Error:', error);
    const message = error instanceof Error ? error.message : String(error);
    
    return NextResponse.json(
      {
        success: false,
        error: message
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/analytics/track
 * Retorna estatísticas básicas de eventos para o usuário
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

    const userId = session.user.id;

    // Obter estatísticas básicas (últimas 24h)
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);

    const stats = await prisma.analyticsEvent.groupBy({
      by: ['eventType'],
      where: {
        userId: userId,
        createdAt: { gte: yesterday }
      },
      _count: {
        id: true
      }
    });

    const formattedStats = stats.reduce((acc, curr) => {
      acc[curr.eventType] = curr._count.id;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      period: '24h',
      events: formattedStats
    });

  } catch (error: unknown) {
    console.error('[Analytics Track GET] Error:', error);
    const message = error instanceof Error ? error.message : String(error);
    
    return NextResponse.json(
      {
        error: message
      },
      { status: 500 }
    );
  }
}

export const POST = withAnalytics(postHandler);
export const GET = withAnalytics(getHandler);

