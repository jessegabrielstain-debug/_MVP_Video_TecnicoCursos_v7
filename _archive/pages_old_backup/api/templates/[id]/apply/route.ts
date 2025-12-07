/**
 * API de Aplicar Template
 * POST /api/templates/[id]/apply - Aplica template a um projeto
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { templatesSystem } from '@/lib/templates-system-real'

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

    const { projectId, customizations } = await request.json()

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId é obrigatório' },
        { status: 400 }
      )
    }

    const project = await templatesSystem.applyTemplateToProject(
      params.id,
      projectId,
      customizations
    )

    return NextResponse.json(project)

  } catch (error: any) {
    console.error('Erro ao aplicar template:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
