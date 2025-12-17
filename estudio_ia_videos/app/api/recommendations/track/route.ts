/**
 * API de Tracking de Interações com Recomendações
 * 
 * Endpoint para registrar interações do usuário
 */

import { NextRequest, NextResponse } from 'next/server';
import { recommendationSystem } from '@/lib/intelligent-recommendation-system';
import { logger } from '@/lib/logger';

/**
 * POST /api/recommendations/track
 * Registra interação com recomendação
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, recommendationId, itemId, action } = body as {
      userId: string;
      recommendationId: string;
      itemId: string;
      action: 'view' | 'click' | 'dismiss' | 'apply';
    };

    if (!userId || !recommendationId || !itemId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, recommendationId, itemId, action' },
        { status: 400 }
      );
    }

    const validActions = ['view', 'click', 'dismiss', 'apply'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    // trackInteraction usa (userId, itemId, interactionType)
    // recommendationId é para contexto futuro
    await recommendationSystem.trackInteraction(
      userId,
      itemId,
      action === 'click' || action === 'apply' ? 'use' : action === 'dismiss' ? 'skip' : 'view'
    );

    return NextResponse.json({
      success: true,
      message: 'Interaction tracked successfully',
    });
  } catch (error) {
    logger.error('Track interaction error', error instanceof Error ? error : new Error(String(error)), { component: 'API: recommendations/track' });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to track interaction' },
      { status: 500 }
    );
  }
}

