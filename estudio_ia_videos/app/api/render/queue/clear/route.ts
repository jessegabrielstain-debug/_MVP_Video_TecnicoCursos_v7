import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseForRequest } from '@/lib/supabase/server'
import { z } from 'zod'

const ClearQueueSchema = z.object({
  statuses: z.array(z.enum(['completed', 'failed', 'cancelled'])).default(['completed', 'failed', 'cancelled'])
})

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseForRequest(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    let body = {}
    try {
      body = await request.json()
    } catch {
      // Empty body is fine, use defaults
    }

    const { statuses } = ClearQueueSchema.parse(body)

    // Delete jobs with specified statuses
    // Note: Using explicit query construction to avoid deep type instantiation issues
    const deleteQuery = supabase
      .from('render_jobs')
      .delete()
      .eq('user_id', user.id)
      .in('status', statuses)
    
    const { error } = await deleteQuery

    if (error) throw error

    // Log analytics event - event_data contains all metadata as JSON
    try {
      await supabase
        .from('analytics_events')
        .insert({
          user_id: user.id,
          event_type: 'render_queue_cleared',
          event_data: {
            category: 'render',
            action: 'queue_cleared',
            cleared_statuses: statuses,
            timestamp: new Date().toISOString()
          }
        })
    } catch (analyticsError) {
      console.warn('Failed to log queue clear event:', analyticsError)
    }

    return NextResponse.json({
      success: true,
      message: `Successfully cleared jobs with statuses: ${statuses.join(', ')}`
    })

  } catch (error) {
    console.error('Clear queue API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request body',
          details: error.errors 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to clear queue',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
