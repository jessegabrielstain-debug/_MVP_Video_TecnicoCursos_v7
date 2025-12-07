/**
 * API de Preferências de Notificação
 * GET /api/notifications/preferences - Obtém preferências
 * PUT /api/notifications/preferences - Atualiza preferências
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

    const preferences = await notificationsSystem.getUserPreferences(session.user.id)

    return NextResponse.json(preferences)

  } catch (error: any) {
    console.error('Erro ao obter preferências:', error)
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

    const data = await request.json()

    const preferences = await notificationsSystem.updatePreferences(
      session.user.id,
      data
    )

    return NextResponse.json(preferences)

  } catch (error: any) {
    console.error('Erro ao atualizar preferências:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
