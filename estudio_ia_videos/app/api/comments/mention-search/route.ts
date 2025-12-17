
export const dynamic = 'force-dynamic';

/**
 * 🔍 API: Mention Search
 * Buscar usuários para autocompletar menções
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { commentsService } from '@/lib/collab/comments-service';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const query = searchParams.get('query') || '';
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!projectId) {
      return NextResponse.json({ error: 'projectId é obrigatório' }, { status: 400 });
    }

    const users = await commentsService.searchUsersForMention({
      projectId,
      query,
      limit,
    });

    return NextResponse.json({ users });
  } catch (error) {
    logger.error('❌ Erro ao buscar usuários para menção:', error instanceof Error ? error : new Error(String(error)), {
      component: 'API: comments/mention-search'
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao buscar usuários' },
      { status: 500 }
    );
  }
}


