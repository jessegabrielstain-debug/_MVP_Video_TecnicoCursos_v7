
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/auth-config';
import { getOrgId, isAdmin, getUserId } from '@/lib/auth/session-helpers';
import { analyticsCollector } from '@/lib/analytics/real-time-collector';
import { withAnalytics } from '@/lib/analytics/api-performance-middleware';

/**
 * POST /api/analytics/track
 * Registra eventos de analytics em tempo real usando o novo sistema
 * 
 * Body: {
 *   category: string (pptx, tts, render, etc)
 *   action: string (upload, start, complete, error, etc)
 *   label?: string
 *   metadata?: object
 *   duration?: number (ms)
 *   fileSize?: number (bytes)
 *   projectId?: string
 *   templateId?: string
 *   provider?: string
 *   errorCode?: string
 *   errorMessage?: string
 *   status?: 'success' | 'error' | 'warning' | 'info'
 * }
 */
async function postHandler(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    // Analytics pode ser anônimo, mas preferimos rastrear usuários logados
    const userId = session?.user?.id || null;
    const organizationId = getOrgId(session?.user) || null;

    const body = await req.json();
    const {
      category,
      action,
      label,
      metadata,
      duration,
      fileSize,
      projectId,
      templateId,
      provider,
      errorCode,
      errorMessage,
      status = 'success',
      value,
      // Novos campos para analytics avançado
      loadTime,
      renderTime,
      processingTime,
      clickPosition,
      scrollDepth,
      timeOnPage,
      userAgent,
      viewport,
      connectionType
    } = body;

    // Validação básica
    if (!category || !action) {
      return NextResponse.json(
        { error: 'category and action are required' },
        { status: 400 }
      );
    }

    // Enriquecer metadata com dados da requisição
    const enrichedMetadata = {
      ...metadata,
      userAgent: userAgent || req.headers.get('user-agent'),
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      referer: req.headers.get('referer'),
      timestamp: new Date().toISOString(),
    };

    // Usar o novo sistema de coleta de analytics
    await analyticsCollector.trackEvent({
      category,
      action,
      label,
      projectId,
      templateId,
      provider,
      duration,
      fileSize,
      value,
      loadTime,
      renderTime,
      processingTime,
      clickPosition,
      scrollDepth,
      timeOnPage,
      userAgent: enrichedMetadata.userAgent,
      viewport,
      connectionType,
      status,
      errorCode,
      errorMessage,
      metadata: enrichedMetadata,
    }, userId, organizationId);

    return NextResponse.json({
      success: true,
      message: 'Event tracked successfully'
    });

  } catch (error: any) {
    console.error('[Analytics Track] Error:', error);
    
    // Não queremos que falhas de analytics quebrem o fluxo principal
    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}

// Aplicar middleware de performance

/**
 * GET /api/analytics/track
 * Retorna estatísticas básicas de eventos para o usuário usando o novo sistema
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

    const userId = session.user.id;
    const organizationId = getOrgId(session.user) || null;

    // Obter estatísticas usando o novo sistema
    const stats = await analyticsCollector.getUserStats(userId, organizationId);

    return NextResponse.json(stats);

  } catch (error: any) {
    console.error('[Analytics Track GET] Error:', error);
    
    return NextResponse.json(
      {
        error: error.message
      },
      { status: 500 }
    );
  }
}

// Aplicar middleware de performance
export const POST = withAnalytics(postHandler);
export const GET = withAnalytics(getHandler);
