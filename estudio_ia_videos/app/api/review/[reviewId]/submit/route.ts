
/**
 * ✅ API: Submit Review
 * Submeter revisão (aprovar/rejeitar/solicitar mudanças)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseForRequest } from '@/lib/supabase/server';
import { reviewWorkflowService } from '@/lib/collab/review-workflow';

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
    const { decision, feedback } = body;

    if (!decision || !['APPROVED', 'REJECTED', 'CHANGES_REQUESTED', 'approved', 'rejected', 'changes_requested'].includes(decision)) {
      return NextResponse.json(
        { error: 'decision inválido (approved, rejected, changes_requested)' },
        { status: 400 }
      );
    }

    // Normalize decision to lowercase
    const normalizedDecision = decision.toLowerCase() as 'approved' | 'rejected' | 'changes_requested';

    await reviewWorkflowService.submitReview({
      reviewId: params.reviewId,
      userId: user.id,
      decision: normalizedDecision,
      comments: feedback,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('❌ Erro ao submeter revisão:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) || 'Erro ao submeter revisão' },
      { status: 500 }
    );
  }
}
