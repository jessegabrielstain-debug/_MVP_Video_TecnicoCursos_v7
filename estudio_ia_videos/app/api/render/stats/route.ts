export const dynamic = 'force-dynamic';

/**
 * 🎬 Render Statistics API
 * Provides comprehensive render performance analytics
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseForRequest } from '@/lib/supabase/server'
import { z } from 'zod'

// Validation schema
const StatsQuerySchema = z.object({
  time_range: z.enum(['1h', '24h', '7d', '30d', '90d', 'all']).default('7d'),
  project_id: z.string().optional(),
  type: z.string().optional(),
  include_performance: z.string().transform(val => val === 'true').default('true'),
  include_resources: z.string().transform(val => val === 'true').default('true')
})

// Interfaces
interface RenderSettings {
  type?: string;
  resource_usage?: ResourceUsage;
  [key: string]: unknown;
}

interface ResourceUsage {
  cpu_usage?: number;
  memory_usage?: number;
  gpu_usage?: number;
  storage_used?: number;
}

interface RenderJob {
  id: string;
  status: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  duration_ms?: number;
  render_settings?: RenderSettings;
  [key: string]: unknown;
}

interface ProcessedRenderJob extends RenderJob {
  type: string;
  actual_duration: number;
  resource_usage: ResourceUsage;
}

// Helper function to get time range filter
function getTimeRangeFilter(timeRange: string) {
  const now = new Date()
  let startDate: Date

  switch (timeRange) {
    case '1h':
      startDate = new Date(now.getTime() - 60 * 60 * 1000)
      break
    case '24h':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      break
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      break
    default:
      return null
  }

  return startDate.toISOString()
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
    const query = StatsQuerySchema.parse(Object.fromEntries(searchParams))

    // Build base query
    let baseQuery = supabase
      .from('render_jobs')
      .select('*')
      .eq('user_id', user.id)

    // Apply time range filter
    const startDate = getTimeRangeFilter(query.time_range)
    if (startDate) {
      baseQuery = baseQuery.gte('created_at', startDate)
    }

    // Apply additional filters
    if (query.project_id) {
      baseQuery = baseQuery.eq('project_id', query.project_id)
    }

    // Execute query
    const { data: rawRenderJobs, error } = await baseQuery

    if (error) throw error

    // Map and filter jobs in memory
    let renderJobs: ProcessedRenderJob[] = (rawRenderJobs as unknown as RenderJob[])?.map((job) => {
      const settings = job.render_settings || {};
      return {
        ...job,
        type: settings.type || 'video',
        actual_duration: job.duration_ms ? job.duration_ms / 1000 : 0, // Convert ms to seconds
        resource_usage: settings.resource_usage || {}
      };
    }) || [];

    if (query.type) {
      const types = query.type.split(',')
      renderJobs = renderJobs.filter(job => types.includes(job.type))
    }

    // Calculate basic statistics
    const totalRenders = renderJobs.length
    const successfulRenders = renderJobs.filter(job => job.status === 'completed').length
    const failedRenders = renderJobs.filter(job => job.status === 'failed').length
    const successRate = totalRenders > 0 ? (successfulRenders / totalRenders) * 100 : 0

    // Calculate render times
    const completedJobs = renderJobs.filter(job => 
      job.status === 'completed' && job.actual_duration > 0
    )

    const renderTimes = completedJobs.map(job => job.actual_duration)
    const averageRenderTime = renderTimes.length > 0 
      ? renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length 
      : 0
    const totalRenderTime = renderTimes.reduce((sum, time) => sum + time, 0)

    // Calculate queue statistics
    const pendingJobs = renderJobs.filter(job => job.status === 'queued') // 'queued' in DB, 'pending' in API types
    const processingJobs = renderJobs.filter(job => job.status === 'processing')

    // Calculate average wait time
    const jobsWithWaitTime = processingJobs.filter(job => job.started_at)
    const averageWaitTime = jobsWithWaitTime.length > 0
      ? jobsWithWaitTime.reduce((total, job) => {
          const waitTime = new Date(job.started_at!).getTime() - new Date(job.created_at).getTime()
          return total + (waitTime / 1000) // Convert to seconds
        }, 0) / jobsWithWaitTime.length
      : 0

    // Get peak queue length (simulated - in real implementation, this would come from historical data)
    const peakQueueLength = Math.max(pendingJobs.length + processingJobs.length, 10)

    // Performance metrics
    let performanceMetrics = {
      fastest_render: 0,
      slowest_render: 0,
      average_cpu_usage: 0,
      average_memory_usage: 0,
      average_gpu_usage: 0
    }

    if (query.include_performance && completedJobs.length > 0) {
      performanceMetrics = {
        fastest_render: Math.min(...renderTimes),
        slowest_render: Math.max(...renderTimes),
        average_cpu_usage: completedJobs.reduce((sum, job) => 
          sum + (job.resource_usage?.cpu_usage || 0), 0) / completedJobs.length,
        average_memory_usage: completedJobs.reduce((sum, job) => 
          sum + (job.resource_usage?.memory_usage || 0), 0) / completedJobs.length,
        average_gpu_usage: completedJobs.reduce((sum, job) => 
          sum + (job.resource_usage?.gpu_usage || 0), 0) / completedJobs.length
      }
    }

    // Resource usage statistics
    let resourceUsage = {
      total_storage_used: 0,
      bandwidth_used: 0,
      compute_hours: 0,
      cost_estimate: 0
    }

    if (query.include_resources) {
      const totalStorageUsed = completedJobs.reduce((sum, job) => 
        sum + (job.resource_usage?.storage_used || 0), 0)
      const computeHours = totalRenderTime / 3600 // Convert seconds to hours
      
      resourceUsage = {
        total_storage_used: totalStorageUsed,
        bandwidth_used: totalStorageUsed * 1.5, // Estimate bandwidth as 1.5x storage
        compute_hours: computeHours,
        cost_estimate: computeHours * 0.10 // $0.10 per compute hour estimate
      }
    }

    // Build response
    const renderStats = {
      total_renders: totalRenders,
      successful_renders: successfulRenders,
      failed_renders: failedRenders,
      success_rate: Math.round(successRate * 100) / 100,
      average_render_time: Math.round(averageRenderTime),
      total_render_time: totalRenderTime,
      queue_stats: {
        current_length: pendingJobs.length,
        processing_jobs: processingJobs.length,
        average_wait_time: Math.round(averageWaitTime),
        peak_queue_length: peakQueueLength
      },
      performance_metrics: performanceMetrics,
      resource_usage: resourceUsage
    }

    return NextResponse.json({
      success: true,
      data: renderStats,
      message: 'Render statistics retrieved successfully'
    })

  } catch (error) {
    console.error('Render stats API error:', error)
    
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
        error: 'Failed to retrieve render statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
