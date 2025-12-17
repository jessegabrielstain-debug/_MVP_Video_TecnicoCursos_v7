/**
 * 🔔 Mark Notification as Read API
 * Marks a specific notification as read
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/services'
import { logger } from '@/lib/logger'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const notificationId = params.id

    // Mark notification as read
    const { data: updatedNotification, error } = await supabaseAdmin
      .from('notifications')
      .update({
        status: 'read',
        updated_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .eq('user_id', session.user.id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Notification not found' },
          { status: 404 }
        )
      }
      throw error
    }

    // Log the action for analytics
    try {
      await supabaseAdmin
        .from('analytics_events')
        .insert({
          user_id: session.user.id,
          event_type: 'notification_read',
          event_data: {
            notification_id: notificationId,
            timestamp: new Date().toISOString()
          },
          created_at: new Date().toISOString()
        })
    } catch (analyticsError) {
      const err = analyticsError instanceof Error ? analyticsError : new Error(String(analyticsError))
      logger.warn('Failed to log notification read action', { component: 'API: notifications/[id]/read' })
    }

    return NextResponse.json({
      success: true,
      data: updatedNotification,
      message: 'Notification marked as read'
    })

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('Mark notification as read API error', err, { component: 'API: notifications/[id]/read' })
    
    return NextResponse.json(
      {  
        success: false, 
        error: 'Failed to mark notification as read',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}