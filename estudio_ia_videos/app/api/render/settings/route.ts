/**
 * 🎬 Render Settings API
 * Manages user render preferences and settings
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseForRequest } from '@/lib/supabase/server'
import { z } from 'zod'

// Validation schema for render settings
const RenderSettingsSchema = z.object({
  auto_retry: z.boolean().optional(),
  max_retries: z.number().min(0).max(10).optional(),
  priority_boost: z.boolean().optional(),
  quality_preset: z.enum(['draft', 'standard', 'high', 'ultra']).optional(),
  notifications: z.object({
    on_completion: z.boolean().optional(),
    on_failure: z.boolean().optional(),
    on_queue_position: z.boolean().optional()
  }).optional(),
  resource_limits: z.object({
    max_cpu_usage: z.number().min(10).max(100).optional(),
    max_memory_usage: z.number().min(10).max(100).optional(),
    max_duration: z.number().min(60).max(86400).optional() // 1 minute to 24 hours
  }).optional()
})

// Default settings
const defaultSettings = {
  auto_retry: true,
  max_retries: 3,
  priority_boost: false,
  quality_preset: 'standard' as const,
  notifications: {
    on_completion: true,
    on_failure: true,
    on_queue_position: false
  },
  resource_limits: {
    max_cpu_usage: 80,
    max_memory_usage: 70,
    max_duration: 3600 // 1 hour
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseForRequest(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user's render settings
    // Note: user_render_settings may not be in generated types
    const { data: settings, error } = await (supabase as any)
      .from('user_render_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    // If no settings exist, create default settings
    if (!settings) {
      const { data: newSettings, error: createError } = await (supabase as any)
        .from('user_render_settings')
        .insert({
          user_id: user.id,
          settings: defaultSettings,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) throw createError

      return NextResponse.json({
        success: true,
        data: newSettings?.settings,
        message: 'Default render settings created'
      })
    }

    return NextResponse.json({
      success: true,
      data: settings?.settings,
      message: 'Render settings retrieved successfully'
    })

  } catch (error) {
    console.error('Get render settings API error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve render settings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = getSupabaseForRequest(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const settingsUpdate = RenderSettingsSchema.parse(body)

    // Get current settings
    const { data: currentSettings, error: fetchError } = await (supabase as any)
      .from('user_render_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError
    }

    let updatedSettings: Record<string, unknown>

    if (!currentSettings) {
      // Create new settings if none exist
      updatedSettings = { ...defaultSettings, ...settingsUpdate }
      
      const { data: newSettings, error: createError } = await (supabase as any)
        .from('user_render_settings')
        .insert({
          user_id: user.id,
          settings: updatedSettings,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) throw createError

      updatedSettings = newSettings?.settings
    } else {
      // Update existing settings (deep merge)
      updatedSettings = {
        ...currentSettings?.settings,
        ...settingsUpdate,
        notifications: {
          ...currentSettings?.settings?.notifications,
          ...settingsUpdate.notifications
        },
        resource_limits: {
          ...currentSettings?.settings?.resource_limits,
          ...settingsUpdate.resource_limits
        }
      }

      const { data: updated, error: updateError } = await (supabase as any)
        .from('user_render_settings')
        .update({
          settings: updatedSettings,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single()

      if (updateError) throw updateError

      updatedSettings = (updated as any).settings
    }

    // Log the action for analytics
    try {
      await (supabase as any)
        .from('analytics_events')
        .insert({
          user_id: user.id,
          event_type: 'settings_updated',
          event_data: {
            scope: 'render',
            updated_fields: Object.keys(settingsUpdate),
            timestamp: new Date().toISOString()
          }
        })
    } catch (analyticsError) {
      console.warn('Failed to log render settings update:', analyticsError)
    }

    return NextResponse.json({
      success: true,
      data: updatedSettings,
      message: 'Render settings updated successfully'
    })

  } catch (error) {
    console.error('Update render settings API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid settings data',
          details: error.errors 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update render settings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseForRequest(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Reset to default settings
    const { data: resetSettings, error } = await (supabase as any)
      .from('user_render_settings')
      .upsert({
        user_id: user.id,
        settings: defaultSettings,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    // Log the action for analytics
    try {
      await (supabase as any)
        .from('analytics_events')
        .insert({
          user_id: user.id,
          event_type: 'settings_reset',
          event_data: {
            scope: 'render',
            timestamp: new Date().toISOString()
          }
        })
    } catch (analyticsError) {
      console.warn('Failed to log render settings reset:', analyticsError)
    }

    return NextResponse.json({
      success: true,
      data: (resetSettings as any).settings,
      message: 'Render settings reset to defaults'
    })

  } catch (error) {
    console.error('Reset render settings API error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to reset render settings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
