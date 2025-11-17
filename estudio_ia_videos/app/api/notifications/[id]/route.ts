/**
 * 🔔 Individual Notification API - Single Notification Operations
 * Handles operations on individual notifications (read, archive, delete, actions)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/services'
import { z } from 'zod'

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
    console.error('Get notification API error:', error)
    
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

    const updateData: any = {
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
          category: 'notifications',
          action: `notification_${body.status || 'updated'}`,
          metadata: {
            notification_id: notificationId,
            changes: updates,
            timestamp: new Date().toISOString()
          },
          created_at: new Date().toISOString()
        })
    } catch (analyticsError) {
      console.warn('Failed to log notification update:', analyticsError)
    }

    // Send WebSocket update
    try {
      await fetch(`${process.env.NEXTAUTH_URL}/api/websocket/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.WEBSOCKET_SECRET}`
        },
        body: JSON.stringify({
          type: 'notification_updated',
          channel: 'notifications',
          userId: session.user.id,
          data: updatedNotification
        })
      })
    } catch (wsError) {
      console.warn('Failed to send WebSocket update:', wsError)
    }

    return NextResponse.json({
      success: true,
      data: updatedNotification,
      message: 'Notification updated successfully'
    })

  } catch (error) {
    console.error('Update notification API error:', error)
    
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
          category: 'notifications',
          action: 'notification_deleted',
          metadata: {
            notification_id: notificationId,
            timestamp: new Date().toISOString()
          },
          created_at: new Date().toISOString()
        })
    } catch (analyticsError) {
      console.warn('Failed to log notification deletion:', analyticsError)
    }

    // Send WebSocket update
    try {
      await fetch(`${process.env.NEXTAUTH_URL}/api/websocket/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.WEBSOCKET_SECRET}`
        },
        body: JSON.stringify({
          type: 'notification_deleted',
          channel: 'notifications',
          userId: session.user.id,
          data: { id: notificationId }
        })
      })
    } catch (wsError) {
      console.warn('Failed to send WebSocket update:', wsError)
    }

    return NextResponse.json({
      success: true,
      message: 'Notification deleted successfully'
    })

  } catch (error) {
    console.error('Delete notification API error:', error)
    
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