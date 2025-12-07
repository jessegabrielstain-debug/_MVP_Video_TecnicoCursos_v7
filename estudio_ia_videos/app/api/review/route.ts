
/**
 * 📋 API: Review Requests
 * Criar e listar solicitações de revisão
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseForRequest } from '@/lib/supabase/server';
import { reviewWorkflowService } from '@/lib/collab/review-workflow';

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
    console.error('❌ Erro ao criar solicitação de revisão:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao criar solicitação de revisão' },
      { status: 500 }
    );
  }
}


