/**
 * 🔔 Mark All Notifications as Read API
 * Bulk operation to mark all user notifications as read
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/services'
import { logger } from '@/lib/logger'

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
    // Note: notifications is a valid table added to SupabaseTable type
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
    // Note: analytics_events is in SupabaseTable type
    try {
      await supabaseAdmin
        .from('analytics_events')
        .insert({
          user_id: session.user.id,
          event_type: 'mark_all_read',
          event_data: {
            count: updatedCount,
            timestamp: new Date().toISOString()
          },
          created_at: new Date().toISOString()
        })
    } catch (analyticsError) {
      logger.warn('Failed to log mark all read action', { component: 'API: notifications/mark-all-read' })
    }

    return NextResponse.json({
      success: true,
      data: { updated_count: updatedCount },
      message: `${updatedCount} notifications marked as read`
    })

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error)); logger.error('Mark all notifications as read API error', err, { component: 'API: notifications/mark-all-read' })
    
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
