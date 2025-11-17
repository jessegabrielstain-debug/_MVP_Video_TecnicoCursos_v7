/**
 * 🔔 Mark All Notifications as Read API
 * Bulk operation to mark all user notifications as read
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/services'

export async function PATCH(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Mark all unread notifications as read
    const { data: updatedNotifications, error } = await supabaseAdmin
      .from('notifications')
      .update({
        status: 'read',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', session.user.id)
      .eq('status', 'unread')
      .select('id')

    if (error) throw error

    const updatedCount = updatedNotifications?.length || 0

    // Log the action for analytics
    try {
      await supabaseAdmin
        .from('analytics_events')
        .insert({
          user_id: session.user.id,
          category: 'notifications',
          action: 'mark_all_read',
          metadata: {
            count: updatedCount,
            timestamp: new Date().toISOString()
          },
          created_at: new Date().toISOString()
        })
    } catch (analyticsError) {
      console.warn('Failed to log mark all read action:', analyticsError)
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
          type: 'bulk_update',
          channel: 'notifications',
          userId: session.user.id,
          data: { action: 'mark_all_read', count: updatedCount }
        })
      })
    } catch (wsError) {
      console.warn('Failed to send WebSocket update:', wsError)
    }

    return NextResponse.json({
      success: true,
      data: { updated_count: updatedCount },
      message: `${updatedCount} notifications marked as read`
    })

  } catch (error) {
    console.error('Mark all notifications as read API error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to mark notifications as read',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}