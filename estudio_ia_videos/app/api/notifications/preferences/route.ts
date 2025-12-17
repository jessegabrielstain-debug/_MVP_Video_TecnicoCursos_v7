/**
 * 🔔 Notification Preferences API - User Notification Settings
 * Manages user notification preferences and settings
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabase, supabaseAdmin } from '@/lib/services'
import { z } from 'zod'
import { logger } from '@/lib/logger'

// Validation schema for preferences
const NotificationPreferencesSchema = z.object({
  email_notifications: z.boolean().optional(),
  push_notifications: z.boolean().optional(),
  in_app_notifications: z.boolean().optional(),
  notification_types: z.object({
    render_complete: z.boolean().optional(),
    render_failed: z.boolean().optional(),
    collaboration_invite: z.boolean().optional(),
    project_shared: z.boolean().optional(),
    system_maintenance: z.boolean().optional(),
    security_alerts: z.boolean().optional(),
    feature_updates: z.boolean().optional()
  }).optional(),
  quiet_hours: z.object({
    enabled: z.boolean().optional(),
    start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    timezone: z.string().optional()
  }).optional(),
  frequency_limits: z.object({
    max_per_hour: z.number().min(1).max(100).optional(),
    max_per_day: z.number().min(1).max(1000).optional(),
    batch_similar: z.boolean().optional()
  }).optional()
})

// Default preferences
const defaultPreferences = {
  email_notifications: true,
  push_notifications: true,
  in_app_notifications: true,
  notification_types: {
    render_complete: true,
    render_failed: true,
    collaboration_invite: true,
    project_shared: true,
    system_maintenance: true,
    security_alerts: true,
    feature_updates: false
  },
  quiet_hours: {
    enabled: false,
    start_time: '22:00',
    end_time: '08:00',
    timezone: 'UTC'
  },
  frequency_limits: {
    max_per_hour: 10,
    max_per_day: 50,
    batch_similar: true
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user preferences
    const { data: preferences, error } = await supabaseAdmin
      .from('notification_preferences')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error
    }

    // If no preferences exist, create default ones
    if (!preferences) {
      const { data: newPreferences, error: createError } = await supabaseAdmin
        .from('notification_preferences')
        .insert({
          user_id: session.user.id,
          ...defaultPreferences,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) throw createError

      return NextResponse.json({
        success: true,
        data: newPreferences
      })
    }

    return NextResponse.json({
      success: true,
      data: preferences
    })

  } catch (error) {
    logger.error('Get notification preferences API error:', error instanceof Error ? error : new Error(String(error)), { component: 'API: notifications/preferences' })
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch notification preferences',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

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

    // Parse and validate request body
    const body = await request.json()
    const validatedData = NotificationPreferencesSchema.parse(body)

    // Check if preferences exist
    const { data: existingPreferences, error: fetchError } = await supabaseAdmin
      .from('notification_preferences')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError
    }

    let updatedPreferences

    if (!existingPreferences) {
      // Create new preferences with defaults merged with provided data
      const { data: newPreferences, error: createError } = await supabaseAdmin
        .from('notification_preferences')
        .insert({
          user_id: session.user.id,
          ...defaultPreferences,
          ...validatedData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) throw createError
      updatedPreferences = newPreferences
    } else {
      // Update existing preferences
      const updateData = {
        ...validatedData,
        updated_at: new Date().toISOString()
      }

      // Handle nested objects properly
      if (validatedData.notification_types) {
        updateData.notification_types = {
          ...existingPreferences.notification_types,
          ...validatedData.notification_types
        }
      }

      if (validatedData.quiet_hours) {
        updateData.quiet_hours = {
          ...existingPreferences.quiet_hours,
          ...validatedData.quiet_hours
        }
      }

      if (validatedData.frequency_limits) {
        updateData.frequency_limits = {
          ...existingPreferences.frequency_limits,
          ...validatedData.frequency_limits
        }
      }

      const { data: updated, error: updateError } = await supabaseAdmin
        .from('notification_preferences')
        .update(updateData)
        .eq('user_id', session.user.id)
        .select()
        .single()

      if (updateError) throw updateError
      updatedPreferences = updated
    }

    // Log preference change for analytics
    try {
      await supabaseAdmin
        .from('analytics_events')
        .insert({
          user_id: session.user.id,
          event_type: 'notification_preferences_updated',
          event_data: {
            changes: Object.keys(validatedData),
            timestamp: new Date().toISOString()
          },
          created_at: new Date().toISOString()
        })
    } catch (analyticsError) {
      logger.warn('Failed to log preference change:', { component: 'API: notifications/preferences' })
    }

    return NextResponse.json({
      success: true,
      data: updatedPreferences,
      message: 'Notification preferences updated successfully'
    })

  } catch (error) {
    logger.error('Update notification preferences API error:', error instanceof Error ? error : new Error(String(error)), { component: 'API: notifications/preferences' })
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid preference data',
          details: error.errors 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update notification preferences',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Reset to default preferences
    const { data: resetPreferences, error } = await supabaseAdmin
      .from('notification_preferences')
      .upsert({
        user_id: session.user.id,
        ...defaultPreferences,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    // Log preference reset for analytics
    try {
      await supabaseAdmin
        .from('analytics_events')
        .insert({
          user_id: session.user.id,
          event_type: 'notification_preferences_reset',
          event_data: {
            timestamp: new Date().toISOString()
          },
          created_at: new Date().toISOString()
        })
    } catch (analyticsError) {
      logger.warn('Failed to log preference reset:', { component: 'API: notifications/preferences' })
    }

    return NextResponse.json({
      success: true,
      data: resetPreferences,
      message: 'Notification preferences reset to defaults'
    })

  } catch (error) {
    logger.error('Reset notification preferences API error:', error instanceof Error ? error : new Error(String(error)), { component: 'API: notifications/preferences' })
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to reset notification preferences',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
