/**
 * API de Compartilhamento de Projeto
 * POST /api/projects/[id]/share - Compartilha projeto
 * DELETE /api/projects/[id]/share - Remove compartilhamento
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { projectsSystem } from '@/lib/projects-system-real'

interface RouteContext {
  params: { id: string }
}

export async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const { userId, permission, expiresAt } = await request.json()

    if (!userId || !permission) {
      return NextResponse.json(
        { error: 'userId e permission são obrigatórios' },
        { status: 400 }
      )
    }

    const share = await projectsSystem.shareProject(
      params.id,
      userId,
      permission,
      session.user.id,
      expiresAt ? new Date(expiresAt) : undefined
    )

    return NextResponse.json(share, { status: 201 })

  } catch (error: any) {
    console.error('Erro ao compartilhar projeto:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      )
    }

    await projectsSystem.unshareProject(params.id, userId, session.user.id)

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Erro ao remover compartilhamento:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
