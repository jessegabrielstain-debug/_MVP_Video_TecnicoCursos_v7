/**
 * API de Template Individual
 * GET /api/templates/[id] - Obtém template
 * PUT /api/templates/[id] - Atualiza template
 * DELETE /api/templates/[id] - Deleta template
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { templatesSystem } from '@/lib/templates-system-real'

interface RouteContext {
  params: { id: string }
}

export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const template = await templatesSystem.getTemplate(params.id)
    return NextResponse.json(template)

  } catch (error: any) {
    console.error('Erro ao obter template:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 404 }
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

    const template = await templatesSystem.updateTemplate(
      params.id,
      data,
      session.user.id
    )

    return NextResponse.json(template)

  } catch (error: any) {
    console.error('Erro ao atualizar template:', error)
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

    await templatesSystem.deleteTemplate(params.id, session.user.id)

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Erro ao deletar template:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
