/**
 * 🔔 Notification Action API
 * Handles custom actions for notifications
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

export async function POST(
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
    const { action } = NotificationActionSchema.parse(body)

    // Get the notification to verify ownership and get action details
    const { data: notification, error: fetchError } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .eq('user_id', session.user.id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Notification not found' },
          { status: 404 }
        )
      }
      throw fetchError
    }

    // Find the action in the notification's actions array
    const notificationAction = notification.actions?.find((a: any) => a.action === action)
    if (!notificationAction) {
      return NextResponse.json(
        { success: false, error: 'Action not found for this notification' },
        { status: 400 }
      )
    }

    let actionResult: any = { success: true }

    // Handle different types of actions
    switch (action) {
      case 'accept_collaboration':
        // Handle collaboration invitation acceptance
        if (notification.project_id) {
          try {
            const { error: collabError } = await supabaseAdmin
              .from('project_collaborators')
              .update({
                status: 'accepted',
                updated_at: new Date().toISOString()
              })
              .eq('project_id', notification.project_id)
              .eq('user_id', session.user.id)

            if (collabError) throw collabError

            actionResult.message = 'Collaboration invitation accepted'
          } catch (error) {
            actionResult = { success: false, error: 'Failed to accept collaboration' }
          }
        }
        break

      case 'decline_collaboration':
        // Handle collaboration invitation decline
        if (notification.project_id) {
          try {
            const { error: collabError } = await supabaseAdmin
              .from('project_collaborators')
              .update({
                status: 'declined',
                updated_at: new Date().toISOString()
              })
              .eq('project_id', notification.project_id)
              .eq('user_id', session.user.id)

            if (collabError) throw collabError

            actionResult.message = 'Collaboration invitation declined'
          } catch (error) {
            actionResult = { success: false, error: 'Failed to decline collaboration' }
          }
        }
        break

      case 'view_project':
        // This would typically redirect to the project, handled on frontend
        actionResult.message = 'Redirect to project'
        actionResult.redirect = `/projects/${notification.project_id}`
        break

      case 'download_render':
        // Handle render download
        if (notification.metadata?.render_id) {
          try {
            const { data: renderJob, error: renderError } = await supabaseAdmin
              .from('render_jobs')
              .select('output_url')
              .eq('id', notification.metadata.render_id)
              .eq('user_id', session.user.id)
              .single()

            if (renderError) throw renderError

            actionResult.message = 'Render ready for download'
            actionResult.download_url = renderJob.output_url
          } catch (error) {
            actionResult = { success: false, error: 'Failed to get render download URL' }
          }
        }
        break

      case 'retry_render':
        // Handle render retry
        if (notification.metadata?.render_id) {
          try {
            const { error: retryError } = await supabaseAdmin
              .from('render_jobs')
              .update({
                status: 'pending',
                error_message: null,
                updated_at: new Date().toISOString()
              })
              .eq('id', notification.metadata.render_id)
              .eq('user_id', session.user.id)

            if (retryError) throw retryError

            actionResult.message = 'Render job queued for retry'
          } catch (error) {
            actionResult = { success: false, error: 'Failed to retry render' }
          }
        }
        break

      case 'dismiss':
        // Simply mark as read
        actionResult.message = 'Notification dismissed'
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Unknown action type' },
          { status: 400 }
        )
    }

    // Mark notification as read after action
    const { error: updateError } = await supabaseAdmin
      .from('notifications')
      .update({
        status: 'read',
        updated_at: new Date().toISOString()
      })
      .eq('id', notificationId)

    if (updateError) {
      console.warn('Failed to mark notification as read after action:', updateError)
    }

    // Log the action for analytics
    try {
      await supabaseAdmin
        .from('analytics_events')
        .insert({
          user_id: session.user.id,
          category: 'notifications',
          action: `notification_action_${action}`,
          metadata: {
            notification_id: notificationId,
            action_type: action,
            success: actionResult.success,
            timestamp: new Date().toISOString()
          },
          created_at: new Date().toISOString()
        })
    } catch (analyticsError) {
      console.warn('Failed to log notification action:', analyticsError)
    }

    // Send WebSocket update if action was successful
    if (actionResult.success) {
      try {
        await fetch(`${process.env.NEXTAUTH_URL}/api/websocket/broadcast`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.WEBSOCKET_SECRET}`
          },
          body: JSON.stringify({
            type: 'notification_action_completed',
            channel: 'notifications',
            userId: session.user.id,
            data: {
              notification_id: notificationId,
              action,
              result: actionResult
            }
          })
        })
      } catch (wsError) {
        console.warn('Failed to send WebSocket update:', wsError)
      }
    }

    return NextResponse.json({
      success: actionResult.success,
      data: actionResult,
      message: actionResult.message || 'Action completed'
    })

  } catch (error) {
    console.error('Notification action API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid action data',
          details: error.errors 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to execute notification action',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}