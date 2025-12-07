
export const dynamic = 'force-dynamic';

/**
 * 📊 API: Review Status
 * Obter status de revisão de um projeto
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { reviewWorkflowService } from '@/lib/collab/review-workflow';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'projectId é obrigatório' }, { status: 400 });
    }

    const status = await reviewWorkflowService.getReviewStatus(projectId);

    return NextResponse.json({ status });
  } catch (error: unknown) {
    console.error('❌ Erro ao buscar status de revisão:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao buscar status de revisão' },
      { status: 500 }
    );
  }
}


