/**
 * API de Duplicação de Projeto
 * POST /api/projects/[id]/duplicate - Duplica projeto
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

    const { name } = await request.json()

    const duplicate = await projectsSystem.duplicateProject(
      params.id,
      session.user.id,
      name
    )

    return NextResponse.json(duplicate, { status: 201 })

  } catch (error: any) {
    console.error('Erro ao duplicar projeto:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
