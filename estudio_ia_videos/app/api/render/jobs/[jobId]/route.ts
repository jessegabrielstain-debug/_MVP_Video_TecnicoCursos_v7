import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseForRequest } from '@/lib/supabase/server'

export async function GET(
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

    const { data: job, error } = await supabase
      .from('render_jobs')
      .select('*, project:projects(user_id)')
      .eq('id', jobId)
      .single()

    if (error || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Verify ownership
    const project = (job as any).project
    let hasPermission = project?.user_id === user.id

    if (!hasPermission) {
      const { data: collaborator } = await supabase
        .from('project_collaborators')
        .select('user_id')
        .eq('project_id', job.project_id)
        .eq('user_id', user.id)
        .single()
      
      if (collaborator) hasPermission = true
    }

    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Remove project data from response
    const { project: _, ...jobData } = job

    return NextResponse.json({ success: true, data: jobData })

  } catch (error) {
    console.error('Error fetching render job:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
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
    // We need to find the job first to get project_id
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

    let hasPermission = project.user_id === user.id

    if (!hasPermission) {
      const { data: collaborator } = await supabase
        .from('project_collaborators')
        .select('permissions')
        .eq('project_id', job.project_id)
        .eq('user_id', user.id)
        .single()
      
      if (collaborator && (collaborator.permissions as any)?.can_edit) {
        hasPermission = true
      }
    }

    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete job
    const { error: deleteError } = await supabase
      .from('render_jobs')
      .delete()
      .eq('id', jobId)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting render job:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
