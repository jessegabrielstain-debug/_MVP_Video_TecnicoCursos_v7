/**
 * 🔗 API Webhooks - Management
 * 
 * Endpoints para gerenciar webhooks
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseForRequest } from '@/lib/supabase/server'
import { webhookManager } from '@/lib/webhooks-system-real'
import { logger } from '@/lib/logger'

/**
 * GET /api/webhooks
 * Lista webhooks do usuário
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseForRequest(request)
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const webhooks = await webhookManager.listWebhooks(session.user.id)
    return NextResponse.json(webhooks)
  } catch (error) {
    logger.error('List webhooks error', error instanceof Error ? error : new Error(String(error)), { component: 'API: webhooks' })
    return NextResponse.json({ error: 'Failed to list webhooks' }, { status: 500 })
  }
}

/**
 * POST /api/webhooks
 * Cria um novo webhook
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseForRequest(request)
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    
    const webhook = await webhookManager.registerWebhook({
      userId: session.user.id,
      url: data.url,
      events: data.events,
      description: data.description,
      headers: data.headers,
    })

    return NextResponse.json(webhook, { status: 201 })
  } catch (error) {
    logger.error('Create webhook error', error instanceof Error ? error : new Error(String(error)), { component: 'API: webhooks' })
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create webhook' },
      { status: 500 }
    )
  }
}

