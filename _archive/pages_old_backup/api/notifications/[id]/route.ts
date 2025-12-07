/**
 * API de Notificação Individual
 * PUT /api/notifications/[id] - Marca como lida
 * DELETE /api/notifications/[id] - Deleta notificação
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notificationsSystem } from '@/lib/notifications-system-real'

interface RouteContext {
  params: { id: string }
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

    await notificationsSystem.markAsRead(params.id, session.user.id)

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Erro ao marcar notificação:', error)
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

    await notificationsSystem.deleteNotification(params.id, session.user.id)

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Erro ao deletar notificação:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
