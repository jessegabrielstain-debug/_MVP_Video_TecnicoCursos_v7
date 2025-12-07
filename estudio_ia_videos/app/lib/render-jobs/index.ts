import { createClient } from '../supabase/server'
import { Database } from '../supabase'

type RenderJob = Database['public']['Tables']['render_jobs']['Row']

export async function listRenderJobs(projectId: string): Promise<RenderJob[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('render_jobs')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to load render jobs: ${error.message}`)
  }

  return (data ?? []) as RenderJob[]
}

export async function getRenderJob(jobId: string): Promise<RenderJob | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('render_jobs')
    .select('*')
    .eq('id', jobId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load render job: ${error.message}`)
  }

  return (data ?? null) as RenderJob | null
}

export async function updateRenderJob(jobId: string, patch: Partial<RenderJob>): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('render_jobs')
    .update(patch)
    .eq('id', jobId)

  if (error) {
    throw new Error(`Failed to update render job: ${error.message}`)
  }
}

export type { RenderJob }
