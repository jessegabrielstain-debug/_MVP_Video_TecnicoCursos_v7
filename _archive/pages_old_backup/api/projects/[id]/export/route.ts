/**
 * API de Exportação de Projeto
 * POST /api/projects/[id]/export - Exporta projeto
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

    const options = await request.json()

    const exportUrl = await projectsSystem.exportProject(
      params.id,
      options,
      session.user.id
    )

    return NextResponse.json({ url: exportUrl })

  } catch (error: any) {
    console.error('Erro ao exportar projeto:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
