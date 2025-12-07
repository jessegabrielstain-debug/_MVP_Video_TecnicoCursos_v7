// @ts-nocheck
// TODO: Backup - fix types
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getRenderQueue } from '@/lib/queue/render-queue'

const createJobSchema = z.object({
  projectId: z.string().uuid(),
  userId: z.string().uuid().optional(),
  slidesBucketPath: z.string().min(1).optional(),
  outputBucketPath: z.string().min(1).optional(),
})

function handleQueueError(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }
  return 'Unknown queue error'
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const parseResult = createJobSchema.safeParse(body)

  if (!parseResult.success) {
    return NextResponse.json({
      error: 'Invalid payload',
      details: parseResult.error.flatten().fieldErrors,
    }, { status: 400 })
  }

  const { projectId, userId, slidesBucketPath, outputBucketPath } = parseResult.data

  const supabase = createServerSupabaseClient()
  const jobId = randomUUID()
  const insertPayload = {
    id: jobId,
    project_id: projectId,
    status: 'pending' as const,
    progress: 0,
    output_url: null,
    error_message: null,
  }

  const { data: job, error: insertError } = await supabase
    .from('render_jobs')
    .insert(insertPayload)
    .select('*')
    .single()

  if (insertError) {
    return NextResponse.json({
      error: 'Failed to create render job',
      details: insertError.message,
    }, { status: 500 })
  }

  const queuePayload = {
    projectId,
    userId: userId ?? 'system',
    slidesBucketPath: slidesBucketPath ?? `slides/${projectId}`,
    outputBucketPath: outputBucketPath ?? `videos/${projectId}/${jobId}.mp4`,
  }

  try {
    const queue = getRenderQueue()
    await queue.add(jobId, queuePayload)
  } catch (error) {
    await supabase
      .from('render_jobs')
      .update({
        status: 'failed',
        error_message: handleQueueError(error),
      })
      .eq('id', jobId)

    return NextResponse.json({
      error: 'Render queue is unavailable',
      job,
    }, { status: 503 })
  }

  return NextResponse.json({ job }, { status: 202 })
}

export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get('projectId')

  if (!projectId) {
    return NextResponse.json({ error: 'projectId query param is required' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from('render_jobs')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(25)

  if (error) {
    return NextResponse.json({
      error: 'Failed to load render jobs',
      details: error.message,
    }, { status: 500 })
  }

  return NextResponse.json({ jobs: data ?? [] })
}
