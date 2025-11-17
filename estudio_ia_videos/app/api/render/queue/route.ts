/**
 * 🎬 Render Queue API
 * Manages render job queue with real-time monitoring
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/services'
import { z } from 'zod'

// Validation schemas
const QueueQuerySchema = z.object({
  status: z.string().optional(),
  type: z.string().optional(),
  priority: z.string().optional(),
  project_id: z.string().optional(),
  search: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  limit: z.string().transform(val => parseInt(val) || 50).optional(),
  offset: z.string().transform(val => parseInt(val) || 0).optional()
})

// Helper function to build filters
function buildFilters(query: any, userId: string) {
  let baseQuery = supabaseAdmin
    .from('render_jobs')
    .select('*')
    .eq('user_id', userId)

  if (query.status) {
    const statuses = query.status.split(',')
    baseQuery = baseQuery.in('status', statuses)
  }

  if (query.type) {
    const types = query.type.split(',')
    baseQuery = baseQuery.in('type', types)
  }

  if (query.priority) {
    const priorities = query.priority.split(',')
    baseQuery = baseQuery.in('priority', priorities)
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
    baseQuery = baseQuery.or(`id.ilike.%${query.search}%,metadata->>title.ilike.%${query.search}%`)
  }

  return baseQuery
}

// Helper function to calculate queue statistics
async function calculateQueueStats(userId: string) {
  try {
    // Get queue counts
    const { data: queueCounts } = await supabaseAdmin
      .from('render_jobs')
      .select('status')
      .eq('user_id', userId)

    const statusCounts = queueCounts?.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    // Get processing jobs for wait time calculation
    const { data: processingJobs } = await supabaseAdmin
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
    const pendingCount = statusCounts.pending || 0
    const estimatedCompletion = new Date(Date.now() + (pendingCount * averageWaitTime * 1000)).toISOString()

    return {
      total_jobs: queueCounts?.length || 0,
      queue_length: pendingCount,
      average_wait_time: Math.round(averageWaitTime),
      estimated_completion: estimatedCompletion
    }
  } catch (error) {
    console.error('Error calculating queue stats:', error)
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
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
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
      buildFilters({ ...query, status: 'pending' }, session.user.id)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(query.limit || 50),
      
      buildFilters({ ...query, status: 'processing' }, session.user.id)
        .order('started_at', { ascending: true })
        .limit(query.limit || 50),
      
      buildFilters({ ...query, status: 'completed' }, session.user.id)
        .order('completed_at', { ascending: false })
        .limit(query.limit || 50),
      
      buildFilters({ ...query, status: 'failed' }, session.user.id)
        .order('updated_at', { ascending: false })
        .limit(query.limit || 50)
    ])

    // Check for errors
    if (pendingJobs.error) throw pendingJobs.error
    if (processingJobs.error) throw processingJobs.error
    if (completedJobs.error) throw completedJobs.error
    if (failedJobs.error) throw failedJobs.error

    // Calculate queue statistics
    const queueStats = await calculateQueueStats(session.user.id)

    // Build response
    const renderQueue = {
      pending: pendingJobs.data || [],
      processing: processingJobs.data || [],
      completed: completedJobs.data || [],
      failed: failedJobs.data || [],
      ...queueStats
    }

    return NextResponse.json({
      success: true,
      data: renderQueue,
      message: 'Render queue retrieved successfully'
    })

  } catch (error) {
    console.error('Render queue API error:', error)
    
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