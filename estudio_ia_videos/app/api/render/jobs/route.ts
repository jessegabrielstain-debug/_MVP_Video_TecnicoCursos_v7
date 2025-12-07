/**
 * 🎬 Render Jobs API
 * Manages individual render job operations
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseForRequest } from '@/lib/supabase/server'
import { z } from 'zod'
import { addVideoJob } from '@/lib/queue/render-queue'
import { randomUUID } from 'crypto'

// Validation schemas
const RenderJobCreateSchema = z.object({
  project_id: z.string().min(1),
  type: z.string().optional().default('video'),
  priority: z.enum(['low', 'normal', 'high']).optional().default('normal'),
  composition_id: z.string().optional().default('Main'),
  input_data: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
  estimated_duration: z.number().optional(),
  webhook_url: z.string().url().optional()
})

const RenderJobQuerySchema = z.object({
  status: z.string().optional(),
  project_id: z.string().optional(),
  limit: z.string().transform(val => parseInt(val) || 50).optional(),
  offset: z.string().transform(val => parseInt(val) || 0).optional()
})

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseForRequest(request)
    const { data: { user } } = await supabase.auth.getUser()

    // Allow unauthenticated access for dev/demo, but filter appropriately
    const { searchParams } = new URL(request.url)
    const query = RenderJobQuerySchema.parse(Object.fromEntries(searchParams))

    let baseQuery = supabase
      .from('render_jobs')
      .select('id, project_id, status, progress, created_at, completed_at, output_url, error_message, render_settings')
      
    if (query.project_id) {
       baseQuery = baseQuery.eq('project_id', query.project_id)
    }
    
    // If user is authenticated, filter by their projects
    if (user) {
      const { data: userProjects } = await supabase
        .from('projects')
        .select('id')
        .eq('user_id', user.id)
      
      if (userProjects && userProjects.length > 0) {
        baseQuery = baseQuery.in('project_id', userProjects.map(p => p.id))
      }
    }

    if (query.status) {
      const statuses = query.status.split(',')
      baseQuery = baseQuery.in('status', statuses)
    }

    const { data: renderJobs, error, count } = await baseQuery
      .order('created_at', { ascending: false })
      .range(query.offset || 0, (query.offset || 0) + (query.limit || 50) - 1)

    if (error) throw error

    // Map to frontend-friendly format
    const jobs = (renderJobs || []).map(job => ({
      id: job.id,
      projectId: job.project_id,
      status: job.status,
      progress: job.progress,
      createdAt: job.created_at,
      completedAt: job.completed_at,
      outputUrl: job.output_url,
      error: job.error_message,
      config: job.render_settings,
    }))

    return NextResponse.json({
      success: true,
      jobs,
      pagination: {
        total: count || 0,
        limit: query.limit || 50,
        offset: query.offset || 0
      },
      message: 'Render jobs retrieved successfully'
    })

  } catch (error) {
    console.error('Get render jobs API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve render jobs', jobs: [] },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseForRequest(request)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const jobData = RenderJobCreateSchema.parse(body)

    // Verify project ownership/permissions
    const { data: project, error: projectError } = await supabase
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

    // Check permissions (owner or collaborator)
    let isOwner = project.user_id === user.id
    let isCollaborator = false

    if (!isOwner) {
      const { data: collaborator } = await supabase
        .from('project_collaborators')
        .select('user_id')
        .eq('project_id', jobData.project_id)
        .eq('user_id', user.id)
        .single()
      
      if (collaborator) isCollaborator = true
    }

    if (!isOwner && !isCollaborator) {
      return NextResponse.json(
        { success: false, error: 'Access denied to project' },
        { status: 403 }
      )
    }

    // Check for active renders
    const { data: activeRender } = await supabase
      .from('render_jobs')
      .select('id')
      .eq('project_id', jobData.project_id)
      .in('status', ['queued', 'processing'])
      .single()

    if (activeRender) {
      return NextResponse.json(
        { success: false, error: 'An active render job already exists for this project' },
        { status: 409 }
      )
    }

    // Create render job data
    const renderJobData = {
      type: jobData.type,
      priority: jobData.priority,
      input_data: jobData.input_data,
      metadata: jobData.metadata,
      estimated_duration: jobData.estimated_duration
    }

    // Settings for queue
    const queueSettings = {
      resolution: '1080p' as const,
      fps: 30,
      quality: 'high' as const,
      format: 'mp4' as const,
      includeAudio: true,
      includeSubtitles: false
    }

    // Insert job
    // Note: using (supabase as any) because render_settings type may not match generated types
    const { data: createdJob, error: createError } = await (supabase as any)
      .from('render_jobs')
      .insert({
        id: randomUUID(),
        project_id: jobData.project_id,
        user_id: user.id,
        // composition_id: jobData.composition_id, // Column missing in schema cache?
        status: 'queued',
        progress: 0,
        render_settings: renderJobData
      })
      .select()
      .single()

    if (createError) throw createError

    // Add to Queue
    try {
      await addVideoJob({
        jobId: createdJob.id,
        projectId: jobData.project_id,
        userId: user.id,
        settings: queueSettings,
        webhookUrl: jobData.webhook_url
      })
    } catch (queueError) {
      console.error('Failed to add job to queue:', queueError)
      await (supabase as any).from('render_jobs').update({ status: 'failed', error_message: 'Failed to queue job' }).eq('id', createdJob.id)
      throw new Error('Failed to queue render job')
    }

    // Log history (using analytics_events as project_history table might not exist)
    try {
      await (supabase as any)
        .from('analytics_events')
        .insert({
          user_id: user.id,
          event_type: 'render_started',
          event_data: {
            project_id: jobData.project_id,
            job_id: createdJob.id,
            type: jobData.type,
            settings: renderJobData
          }
        })
    } catch (historyError) {
      console.warn('Failed to log project history:', historyError)
    }

    return NextResponse.json({
      success: true,
      data: createdJob,
      message: 'Render job created and queued successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Create render job API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid job data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create render job' },
      { status: 500 }
    )
  }
}
