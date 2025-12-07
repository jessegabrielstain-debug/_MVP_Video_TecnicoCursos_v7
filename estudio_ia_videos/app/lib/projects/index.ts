import { getServiceRoleClient } from '../supabase'
import type { CreateProjectInput, Project } from './types'
import { getUserProjects, mockProjects } from './mockStore'
import { Database } from '../supabase/database.types'
import { SupabaseClient } from '@supabase/supabase-js'

export async function listProjectsByOwner(ownerId: string): Promise<Project[]> {
  try {
    const supabase = getServiceRoleClient() as SupabaseClient<Database>
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', ownerId)
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('Supabase projects error, using mock:', error.message)
      return getUserProjects(ownerId) as unknown as Project[]
    }

    return (data ?? []) as unknown as Project[]
  } catch (err) {
    console.warn('Supabase not available, using mock projects')
    return getUserProjects(ownerId) as unknown as Project[]
  }
}

export async function getProjectById(projectId: string): Promise<Project | null> {
  try {
    const supabase = getServiceRoleClient() as SupabaseClient<Database>
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.warn('Supabase project error, using mock:', error.message)
      const project = mockProjects.get(projectId)
      return (project ?? null) as unknown as Project | null
    }

    return (data ?? null) as unknown as Project | null
  } catch (err) {
    console.warn('Supabase not available, using mock project')
    const project = mockProjects.get(projectId)
    return (project ?? null) as unknown as Project | null
  }
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  const supabase = getServiceRoleClient() as SupabaseClient<Database>
  const payload = {
    user_id: input.ownerId,
    name: input.name,
    description: input.description ?? null,
    status: 'draft' as const,
    metadata: input.settings ?? null,
  }

  const { data, error } = await supabase
    .from('projects')
    .insert(payload)
    .select('*')
    .single()

  if (error) {
    throw new Error(`Failed to create project: ${error.message}`)
  }

  return data as Project
}

export * from './types'
