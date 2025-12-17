/**
 * 🔔 Individual Notification API - Single Notification Operations
 * Handles operations on individual notifications (read, archive, delete, actions)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/services'
import { z } from 'zod'
import { logger } from '@/lib/logger';

// Validation schema for notification actions
const NotificationActionSchema = z.object({
  action: z.string().min(1)
})

export async function GET(
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

    // Get notification
    const { data: notification, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .eq('user_id', session.user.id)
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

    return NextResponse.json({
      success: true,
      data: notification
    })

  } catch (error) {
    logger.error('Get notification API error:', error instanceof Error ? error : new Error(String(error)), { component: 'API: notifications/[id]' })
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch notification',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

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
    const body = await request.json()

    // Validate the update data
    const allowedUpdates = ['status']
    const updates = Object.keys(body).filter(key => allowedUpdates.includes(key))
    
    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid updates provided' },
        { status: 400 }
      )
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }

    // Only allow status updates for now
    if (body.status && ['unread', 'read', 'archived'].includes(body.status)) {
      updateData.status = body.status
    }

    // Update notification
    const { data: updatedNotification, error } = await supabaseAdmin
      .from('notifications')
      .update(updateData)
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
          event_type: `notification_${body.status || 'updated'}`,
          event_data: {
            notification_id: notificationId,
            changes: updates,
            timestamp: new Date().toISOString()
          },
          created_at: new Date().toISOString()
        })
    } catch (analyticsError) {
      logger.warn('Failed to log notification update:', { component: 'API: notifications/[id]' })
    }

    return NextResponse.json({
      success: true,
      data: updatedNotification,
      message: 'Notification updated successfully'
    })

  } catch (error) {
    logger.error('Update notification API error:', error instanceof Error ? error : new Error(String(error)), { component: 'API: notifications/[id]' })
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update notification',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // Delete notification
    const { error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', session.user.id)

    if (error) throw error

    // Log the action for analytics
    try {
      await supabaseAdmin
        .from('analytics_events')
        .insert({
          user_id: session.user.id,
          event_type: 'notification_deleted',
          event_data: {
            notification_id: notificationId,
            timestamp: new Date().toISOString()
          },
          created_at: new Date().toISOString()
        })
    } catch (analyticsError) {
      logger.warn('Failed to log notification deletion:', { component: 'API: notifications/[id]' })
    }

    return NextResponse.json({
      success: true,
      message: 'Notification deleted successfully'
    })

  } catch (error) {
    logger.error('Delete notification API error:', error instanceof Error ? error : new Error(String(error)), { component: 'API: notifications/[id]' })
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete notification',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}