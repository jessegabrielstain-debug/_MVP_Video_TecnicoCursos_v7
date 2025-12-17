/**
 * 🔔 Archive Notification API
 * Archives a specific notification
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { logger } from '@/lib/logger'
import { supabaseAdmin } from '@/lib/services'

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

    // Archive notification
    const { data: updatedNotification, error } = await supabaseAdmin
      .from('notifications')
      .update({
        status: 'archived',
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
          event_type: 'notification_archived',
          event_data: {
            notification_id: notificationId,
            timestamp: new Date().toISOString()
          },
          created_at: new Date().toISOString()
        })
    } catch (analyticsError) {
      logger.warn('Failed to log notification archive action', { component: 'API: notifications/[id]/archive' })
    }

    return NextResponse.json({
      success: true,
      data: updatedNotification,
      message: 'Notification archived successfully'
    })

  } catch (error) {
    logger.error('Archive notification API error', error instanceof Error ? error : new Error(String(error)), { component: 'API: notifications/[id]/archive' })
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to archive notification',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}