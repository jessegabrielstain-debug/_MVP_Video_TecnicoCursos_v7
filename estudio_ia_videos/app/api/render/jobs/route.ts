/**
 * 🎬 Render Jobs API
 * Manages individual render job operations
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/services'
import { z } from 'zod'

// Validation schemas
const RenderJobCreateSchema = z.object({
  project_id: z.string().min(1),
  type: z.enum(['video', 'audio', 'image', 'animation', 'composite']),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  input_data: z.record(z.any()),
  metadata: z.object({
    resolution: z.string().optional(),
    format: z.string().optional(),
    quality: z.string().optional(),
    fps: z.number().optional(),
    duration: z.number().optional(),
    codec: z.string().optional(),
    bitrate: z.number().optional()
  }).optional(),
  estimated_duration: z.number().optional()
})

const RenderJobQuerySchema = z.object({
  status: z.string().optional(),
  type: z.string().optional(),
  priority: z.string().optional(),
  project_id: z.string().optional(),
  limit: z.string().transform(val => parseInt(val) || 50).optional(),
  offset: z.string().transform(val => parseInt(val) || 0).optional()
})

// Helper function to generate job ID
function generateJobId(): string {
  return `render_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Helper function to estimate render duration based on job type and metadata
function estimateRenderDuration(type: string, metadata: any): number {
  const baseTime = {
    video: 300, // 5 minutes
    audio: 60,  // 1 minute
    image: 30,  // 30 seconds
    animation: 180, // 3 minutes
    composite: 600  // 10 minutes
  }

  let duration = baseTime[type as keyof typeof baseTime] || 300

  // Adjust based on metadata
  if (metadata?.duration) {
    duration = Math.max(duration, metadata.duration * 2) // 2x content duration
  }

  if (metadata?.resolution) {
    const resolutionMultiplier = {
      '720p': 1,
      '1080p': 1.5,
      '1440p': 2,
      '4k': 3,
      '8k': 5
    }
    const multiplier = resolutionMultiplier[metadata.resolution as keyof typeof resolutionMultiplier] || 1
    duration *= multiplier
  }

  return Math.round(duration)
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
    const query = RenderJobQuerySchema.parse(Object.fromEntries(searchParams))

    // Build query
    let baseQuery = supabaseAdmin
      .from('render_jobs')
      .select('*')
      .eq('user_id', session.user.id)

    // Apply filters
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

    // Apply pagination and ordering
    const { data: renderJobs, error, count } = await baseQuery
      .order('created_at', { ascending: false })
      .range(query.offset || 0, (query.offset || 0) + (query.limit || 50) - 1)

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: renderJobs || [],
      pagination: {
        total: count || 0,
        limit: query.limit || 50,
        offset: query.offset || 0
      },
      message: 'Render jobs retrieved successfully'
    })

  } catch (error) {
    console.error('Get render jobs API error:', error)
    
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
        error: 'Failed to retrieve render jobs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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
    const jobData = RenderJobCreateSchema.parse(body)

    // Verify project ownership
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('id, user_id')
      .eq('id', jobData.project_id)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      )
    }

    if (project.user_id !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Access denied to project' },
        { status: 403 }
      )
    }

    // Generate job ID and estimate duration
    const jobId = generateJobId()
    const estimatedDuration = jobData.estimated_duration || 
      estimateRenderDuration(jobData.type, jobData.metadata)

    // Create render job
    const renderJob = {
      id: jobId,
      user_id: session.user.id,
      project_id: jobData.project_id,
      status: 'pending' as const,
      priority: jobData.priority,
      type: jobData.type,
      input_data: jobData.input_data,
      progress: 0,
      estimated_duration: estimatedDuration,
      metadata: jobData.metadata || {},
      resource_usage: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: createdJob, error: createError } = await supabaseAdmin
      .from('render_jobs')
      .insert(renderJob)
      .select()
      .single()

    if (createError) throw createError

    // Log the action for analytics
    try {
      await supabaseAdmin
        .from('analytics_events')
        .insert({
          user_id: session.user.id,
          category: 'render',
          action: 'job_created',
          metadata: {
            job_id: jobId,
            job_type: jobData.type,
            priority: jobData.priority,
            project_id: jobData.project_id,
            estimated_duration: estimatedDuration,
            timestamp: new Date().toISOString()
          },
          created_at: new Date().toISOString()
        })
    } catch (analyticsError) {
      console.warn('Failed to log render job creation:', analyticsError)
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
          type: 'render_job_created',
          channel: 'render_pipeline',
          userId: session.user.id,
          data: createdJob
        })
      })
    } catch (wsError) {
      console.warn('Failed to send WebSocket update:', wsError)
    }

    return NextResponse.json({
      success: true,
      data: createdJob,
      message: 'Render job created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Create render job API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid job data',
          details: error.errors 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create render job',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}