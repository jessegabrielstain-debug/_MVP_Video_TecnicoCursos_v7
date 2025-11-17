
/**
 * POST /api/comments
 * Cria um novo comentário em um projeto
 * 
 * GET /api/comments?projectId=xxx
 * Lista comentários de um projeto
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth/auth-config'
import { getOrgId, isAdmin, getUserId } from '@/lib/auth/session-helpers';
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig)
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

    // Cria comentário
    const comment = await prisma.projectComment.create({
      data: {
        projectId,
        userId: getUserId(session.user),
        content,
        position: position ? JSON.stringify(position) : null,
        parentId: parentId || null
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            image: true
          }
        }
      }
    })

    return NextResponse.json({ comment })

  } catch (error) {
    console.error('[COMMENTS_POST_ERROR]', error)
    return NextResponse.json(
      { error: 'Erro ao criar comentário' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig)
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

    // Busca comentários
    const comments = await prisma.projectComment.findMany({
      where: {
        projectId,
        parentId: null // Apenas comentários top-level
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            image: true
          }
        },
        replies: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                image: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ comments })

  } catch (error) {
    console.error('[COMMENTS_GET_ERROR]', error)
    return NextResponse.json(
      { error: 'Erro ao buscar comentários' },
      { status: 500 }
    )
  }
}
