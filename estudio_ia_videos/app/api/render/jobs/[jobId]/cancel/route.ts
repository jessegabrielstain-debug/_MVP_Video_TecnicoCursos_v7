import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseForRequest } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const supabase = getSupabaseForRequest(request)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { jobId } = params

    // Verify ownership via project
    const { data: job, error: jobError } = await supabase
      .from('render_jobs')
      .select('project_id')
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', job.project_id)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (project.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Cancel job
    const { error: updateError } = await supabase
      .from('render_jobs')
      .update({ status: 'cancelled' })
      .eq('id', jobId)

    if (updateError) throw updateError

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error cancelling render job:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
