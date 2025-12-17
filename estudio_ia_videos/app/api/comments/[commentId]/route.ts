
/**
 * 💬 API: Comment by ID
 * Operações em comentário específico
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { commentsService } from '@/lib/collab/comments-service';
import { logger } from '@/lib/logger';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { commentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await commentsService.delete(params.commentId);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('❌ Erro ao deletar comentário:', error instanceof Error ? error : new Error(String(error)), {
      component: 'API: comments/[commentId]'
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao deletar comentário' },
      { status: 500 }
    );
  }
}
