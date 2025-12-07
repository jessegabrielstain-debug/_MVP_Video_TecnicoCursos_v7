// TODO: Fix Prisma includes type

/**
 * POST /api/versions
 * Cria uma nova versão do projeto
 * 
 * GET /api/versions?projectId=xxx
 * Lista versões de um projeto
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'


const getUserId = (user: unknown): string => ((user as { id?: string }).id || '');
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { projectId, name, description, projectData } = await req.json()

    if (!projectId || !name) {
      return NextResponse.json(
        { error: 'projectId e name são obrigatórios' },
        { status: 400 }
      )
    }

    // Busca projeto
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 })
    }

    // Verifica permissão
    if (project.userId !== getUserId(session.user)) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    // Conta versões existentes para incrementar
    const versionCount = await (prisma as any).projectVersion.count({
      where: { projectId }
    })

    // Cria nova versão
    const version = await (prisma as any).projectVersion.create({
      data: {
        projectId,
        userId: getUserId(session.user),
        name,
        description,
        versionNumber: versionCount + 1,
        projectData: projectData || {}
      }
    })

    return NextResponse.json({ version })

  } catch (error) {
    console.error('[VERSIONS_POST_ERROR]', error)
    return NextResponse.json(
      { error: 'Erro ao criar versão' },
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

    // Busca versões
    const versions = await (prisma as any).projectVersion.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { versionNumber: 'desc' }
    })

    return NextResponse.json({ versions })

  } catch (error) {
    console.error('[VERSIONS_GET_ERROR]', error)
    return NextResponse.json(
      { error: 'Erro ao buscar versões' },
      { status: 500 }
    )
  }
}


