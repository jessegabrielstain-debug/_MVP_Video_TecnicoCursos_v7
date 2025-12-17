
/**
 * POST /api/comments
 * Cria um novo comentário em um projeto
 * 
 * GET /api/comments?projectId=xxx
 * Lista comentários de um projeto
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getOrgId, isAdmin, getUserId } from '@/lib/auth/session-helpers';
import { commentsService } from '@/lib/collab/comments-service';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { projectId, content, position, parentId } = await req.json()

    if (!projectId || !content) {
      return NextResponse.json(
        { error: 'projectId e content são obrigatórios' },
        { status: 400 }
      )
    }

    // Verifica se o projeto existe
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 })
    }

    const userId = getUserId(session.user);
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 401 })
    }

    // Cria comentário usando service
    const comment = await commentsService.create({
      projectId,
      userId,
      content,
      position,
      parentId
    });

    return NextResponse.json({ comment })

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error)); logger.error('Erro ao criar comentário', err, { component: 'API: comments' })
    return NextResponse.json(
      { error: 'Erro ao criar comentário' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId é obrigatório' },
        { status: 400 }
      )
    }

    // Busca comentários usando service
    const comments = await commentsService.list({ projectId });

    return NextResponse.json({ comments })

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error)); logger.error('Erro ao buscar comentários', err, { component: 'API: comments' })
    return NextResponse.json(
      { error: 'Erro ao buscar comentários' },
      { status: 500 }
    )
  }
}


