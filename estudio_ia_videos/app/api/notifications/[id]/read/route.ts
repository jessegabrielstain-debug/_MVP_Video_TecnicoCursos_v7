/**
 * 🔔 Mark Notification as Read API
 * Marks a specific notification as read
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
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

    // Mark notification as read
    const { data: updatedNotification, error } = await (supabaseAdmin as any)
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
      await (supabaseAdmin as any)
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
      console.warn('Failed to log notification read action:', analyticsError)
    }

    return NextResponse.json({
      success: true,
      data: updatedNotification,
      message: 'Notification marked as read'
    })

  } catch (error) {
    console.error('Mark notification as read API error:', error)
    
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