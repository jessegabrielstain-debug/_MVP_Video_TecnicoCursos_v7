
export const dynamic = 'force-dynamic';

/**
 * 📊 API: Review Statistics
 * Estatísticas de revisões
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseForRequest } from '@/lib/supabase/server';
import { reviewWorkflowService } from '@/lib/collab/review-workflow';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseForRequest(request);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const stats = await reviewWorkflowService.getReviewStats({
      userId: user.id,
      organizationId: organizationId || undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    return NextResponse.json({ stats });
  } catch (error: unknown) {
    console.error('❌ Erro ao buscar estatísticas de revisão:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao buscar estatísticas' },
      { status: 500 }
    );
  }
}


