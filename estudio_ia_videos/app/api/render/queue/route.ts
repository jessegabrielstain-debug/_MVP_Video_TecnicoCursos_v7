export const dynamic = 'force-dynamic';

/**
 * 🎬 Render Queue API
 * Manages render job queue with real-time monitoring
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseForRequest } from '@/lib/supabase/server'
import { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { logger } from '@/lib/logger'

// Validation schemas
const QueueQuerySchema = z.object({
  status: z.string().optional(),
  project_id: z.string().optional(),
  search: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  limit: z.string().transform(val => parseInt(val) || 50).optional(),
  offset: z.string().transform(val => parseInt(val) || 0).optional()
})

// Helper function to build filters
function buildFilters(supabase: SupabaseClient, query: z.infer<typeof QueueQuerySchema>, userId: string) {
  let baseQuery = supabase
    .from('render_jobs')
    .select('*')
    .eq('user_id', userId)

  if (query.status) {
    const statuses = query.status.split(',')
    baseQuery = baseQuery.in('status', statuses)
  }

  if (query.project_id) {
    baseQuery = baseQuery.eq('project_id', query.project_id)
  }

  if (query.start_date) {
    baseQuery = baseQuery.gte('created_at', query.start_date)
  }

  if (query.end_date) {
    baseQuery = baseQuery.lte('created_at', query.end_date)
  }

  if (query.search) {
    baseQuery = baseQuery.or(`id.ilike.%${query.search}%`)
  }

  return baseQuery
}

// Helper function to calculate queue statistics
async function calculateQueueStats(supabase: SupabaseClient, userId: string) {
  try {
    // Get queue counts
    const { data: queueCounts } = await supabase
      .from('render_jobs')
      .select('status')
      .eq('user_id', userId)

    const statusCounts = queueCounts?.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Get processing jobs for wait time calculation
    const { data: processingJobs } = await supabase
      .from('render_jobs')
      .select('created_at, started_at')
      .eq('user_id', userId)
      .eq('status', 'processing')

    // Calculate average wait time
    let averageWaitTime = 0
    if (processingJobs && processingJobs.length > 0) {
      const totalWaitTime = processingJobs.reduce((total, job) => {
        if (job.started_at) {
          const waitTime = new Date(job.started_at).getTime() - new Date(job.created_at).getTime()
          return total + waitTime
        }
        return total
      }, 0)
      averageWaitTime = totalWaitTime / processingJobs.length / 1000 // Convert to seconds
    }

    // Estimate completion time for pending jobs
    const pendingCount = statusCounts.queued || 0
    const estimatedCompletion = new Date(Date.now() + (pendingCount * averageWaitTime * 1000)).toISOString()

    return {
      total_jobs: queueCounts?.length || 0,
      queue_length: pendingCount,
      average_wait_time: Math.round(averageWaitTime),
      estimated_completion: estimatedCompletion
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error)); logger.error('Error calculating queue stats', err, { component: 'API: render/queue' })
    return {
      total_jobs: 0,
      queue_length: 0,
      average_wait_time: 0,
      estimated_completion: new Date().toISOString()
    }
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

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const query = QueueQuerySchema.parse(Object.fromEntries(searchParams))

    // Get jobs by status
    const [pendingJobs, processingJobs, completedJobs, failedJobs] = await Promise.all([
      buildFilters(supabase, { ...query, status: 'queued' }, user.id)
        .order('created_at', { ascending: true })
        .limit(query.limit || 50),
      
      buildFilters(supabase, { ...query, status: 'processing' }, user.id)
        .order('started_at', { ascending: true })
        .limit(query.limit || 50),
      
      buildFilters(supabase, { ...query, status: 'completed' }, user.id)
        .order('completed_at', { ascending: false })
        .limit(query.limit || 50),
      
      buildFilters(supabase, { ...query, status: 'failed' }, user.id)
        .order('updated_at', { ascending: false })
        .limit(query.limit || 50)
    ])

    // Check for errors
    if (pendingJobs.error) throw pendingJobs.error
    if (processingJobs.error) throw processingJobs.error
    if (completedJobs.error) throw completedJobs.error
    if (failedJobs.error) throw failedJobs.error

    // Calculate queue statistics
    const queueStats = await calculateQueueStats(supabase, user.id)

    // Helper function to map job data
    interface RenderJobRow {
      id: string;
      render_settings?: Record<string, unknown>;
      [key: string]: unknown;
    }
    const mapJobData = (job: RenderJobRow) => {
      const settings = job.render_settings || {};
      return {
        ...job,
        priority: (settings as Record<string, unknown>).priority || 'normal',
        type: (settings as Record<string, unknown>).type || 'video',
        input_data: (settings as Record<string, unknown>).input_data || {},
        metadata: (settings as Record<string, unknown>).metadata || {},
        render_settings: settings
      };
    };

    // Build response
    const renderQueue = {
      pending: (pendingJobs.data || []).map(mapJobData),
      processing: (processingJobs.data || []).map(mapJobData),
      completed: (completedJobs.data || []).map(mapJobData),
      failed: (failedJobs.data || []).map(mapJobData),
      ...queueStats
    }

    return NextResponse.json({
      success: true,
      data: renderQueue,
      message: 'Render queue retrieved successfully'
    })

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error)); logger.error('Render queue API error', err, { component: 'API: render/queue' })
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid query parameters',
          details: error.errors 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to retrieve render queue',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
