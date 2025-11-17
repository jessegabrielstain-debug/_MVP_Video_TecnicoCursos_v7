/**
 * API: Analytics Events
 * POST /api/analytics - Registrar evento de analytics
 * GET /api/analytics?userId=xxx - Buscar eventos
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const createEventSchema = z.object({
  eventType: z.string().min(1).max(100),
  eventData: z.record(z.any()).optional(),
  sessionId: z.string().optional(),
})

// Mock storage
const mockEvents = new Map<string, any>()

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const parseResult = createEventSchema.safeParse(body)

  if (!parseResult.success) {
    return NextResponse.json({
      error: 'Invalid payload',
      details: parseResult.error.flatten().fieldErrors,
    }, { status: 400 })
  }

  const { eventType, eventData, sessionId } = parseResult.data
  const userId = request.headers.get('x-user-id') || null
  
  const eventId = `event-${Date.now()}-${Math.random().toString(36).substring(7)}`
  const event = {
    id: eventId,
    user_id: userId,
    event_type: eventType,
    event_data: eventData || {},
    session_id: sessionId || null,
    ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    user_agent: request.headers.get('user-agent') || 'unknown',
    created_at: new Date().toISOString(),
  }

  mockEvents.set(eventId, event)

  return NextResponse.json({ event }, { status: 201 })
}

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId')
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50')
  
  let events = Array.from(mockEvents.values())
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  
  if (userId) {
    events = events.filter(e => e.user_id === userId)
  }
  
  events = events.slice(0, limit)

  return NextResponse.json({
    events,
    total: events.length,
  })
}
