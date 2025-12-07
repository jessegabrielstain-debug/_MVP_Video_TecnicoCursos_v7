
export const dynamic = 'force-dynamic';

/**
 * 📊 API: Comment Statistics
 * Estatísticas de comentários
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { commentsService } from '@/lib/collab/comments-service';

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

    const stats = await commentsService.getCommentStats(projectId);

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas de comentários:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao buscar estatísticas' },
      { status: 500 }
    );
  }
}


