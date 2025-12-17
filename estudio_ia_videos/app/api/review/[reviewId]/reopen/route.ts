
/**
 * 🔓 API: Reopen Project
 * Reabrir projeto para edição
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseForRequest } from '@/lib/supabase/server';
import { reviewWorkflowService } from '@/lib/collab/review-workflow';
import { logger } from '@/lib/logger';

export async function POST(
  request: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    const supabase = getSupabaseForRequest(request);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, reason } = body;

    if (!projectId) {
      return NextResponse.json({ error: 'projectId é obrigatório' }, { status: 400 });
    }

    await reviewWorkflowService.reopenForEditing({
      projectId,
      userId: user.id,
      reason,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const normalizedError = error instanceof Error ? error : new Error(String(error));
    logger.error('Erro ao reabrir projeto', normalizedError, { component: 'API: review/reopen' });
    return NextResponse.json(
      { error: normalizedError.message },
      { status: 500 }
    );
  }
}
