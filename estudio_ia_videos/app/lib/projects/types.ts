import { Database } from '../supabase'

export type Project = Database['public']['Tables']['projects']['Row']

export type CreateProjectInput = {
  ownerId: string
  name: string
  description?: string | null
  settings?: Project['metadata']
}

export type ProjectWithSummary = Project & {
  slideCount: number
  lastRenderAt: string | null
}
