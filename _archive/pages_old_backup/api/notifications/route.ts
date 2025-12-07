/**
 * API de Notificações
 * GET /api/notifications - Lista notificações do usuário
 * POST /api/notifications - Envia nova notificação (admin)
 * PUT /api/notifications/read-all - Marca todas como lidas
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notificationsSystem } from '@/lib/notifications-system-real'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const read = searchParams.get('read')
    const type = searchParams.get('type')
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0

    const notifications = await notificationsSystem.getUserNotifications(
      session.user.id,
      {
        read: read === 'true' ? true : read === 'false' ? false : undefined,
        type: type as any,
        limit,
        offset
      }
    )

    const unreadCount = await notificationsSystem.getUnreadCount(session.user.id)

    return NextResponse.json({
      notifications,
      unreadCount,
      total: notifications.length
    })

  } catch (error: any) {
    console.error('Erro ao buscar notificações:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const data = await request.json()

    const results = await notificationsSystem.send(data)

    return NextResponse.json({ results }, { status: 201 })

  } catch (error: any) {
    console.error('Erro ao enviar notificação:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    await notificationsSystem.markAllAsRead(session.user.id)

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Erro ao marcar notificações:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
