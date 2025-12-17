
/**
 * 📋 API: Review Requests
 * Criar e listar solicitações de revisão
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseForRequest } from '@/lib/supabase/server';
import { reviewWorkflowService } from '@/lib/collab/review-workflow';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseForRequest(request);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, reviewerIds, message, dueDate } = body;

    if (!projectId || !reviewerIds || reviewerIds.length === 0) {
      return NextResponse.json(
        { error: 'projectId e reviewerIds são obrigatórios' },
        { status: 400 }
      );
    }

    const reviewRequestId = await reviewWorkflowService.createReviewRequest(
      projectId,
      user.id,
      reviewerIds
    );

    return NextResponse.json({ reviewRequest: { id: reviewRequestId } }, { status: 201 });
  } catch (error: unknown) {
    const normalizedError = error instanceof Error ? error : new Error(String(error));
    logger.error('Erro ao criar solicitação de revisão', normalizedError, { component: 'API: review' });
    return NextResponse.json(
      { error: normalizedError.message },
      { status: 500 }
    );
  }
}


