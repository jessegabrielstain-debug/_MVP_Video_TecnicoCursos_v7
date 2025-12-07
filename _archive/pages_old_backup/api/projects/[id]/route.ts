/**
 * API de Projeto Individual
 * GET /api/projects/[id] - Obtém projeto
 * PUT /api/projects/[id] - Atualiza projeto
 * DELETE /api/projects/[id] - Deleta projeto
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { projectsSystem } from '@/lib/projects-system-real'

interface RouteContext {
  params: { id: string }
}

export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions)
    
    const project = await projectsSystem.getProject(params.id, session?.user?.id)
    
    return NextResponse.json(project)

  } catch (error: any) {
    console.error('Erro ao obter projeto:', error)
    return NextResponse.json(
      { error: error.message },
      { status: error.message.includes('permissão') ? 403 : 404 }
    )
  }
}

export async function PUT(
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

    const data = await request.json()
    const { createVersion, ...projectData } = data

    const project = await projectsSystem.updateProject(
      params.id,
      projectData,
      session.user.id,
      createVersion
    )

    return NextResponse.json(project)

  } catch (error: any) {
    console.error('Erro ao atualizar projeto:', error)
    return NextResponse.json(
      { error: error.message },
      { status: error.message.includes('permissão') ? 403 : 500 }
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

    await projectsSystem.deleteProject(params.id, session.user.id)

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Erro ao deletar projeto:', error)
    return NextResponse.json(
      { error: error.message },
      { status: error.message.includes('permissão') ? 403 : 500 }
    )
  }
}
