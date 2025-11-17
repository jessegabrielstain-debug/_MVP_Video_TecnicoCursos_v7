
'use client'

/**
 * 🚀 Advanced Project Management Hook
 * Enhanced with versioning, collaboration, and real-time updates
 */

import { useState, useEffect, useCallback } from 'react'
import useSWR from 'swr'
import { supabase } from '@/lib/supabase/client'
import { useWebSocket } from './useWebSocket'
import { toast } from 'sonner'

// Enhanced Project Types
export interface ProjectVersion {
  id: string
  project_id: string
  version_number: string
  name: string
  description?: string
  changes_summary: string
  created_by: string
  created_at: string
  metadata?: ProjectMetadata
}

export interface ProjectCollaborator {
  id: string
  project_id: string
  user_id: string
  role: 'owner' | 'editor' | 'viewer'
  permissions: string[]
  invited_by: string
  joined_at: string
  last_activity?: string
}

export interface ProjectMetadata {
  tags: string[]
  category: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  estimated_duration?: number
  actual_duration?: number
  complexity_score?: number
  resources_used?: string[]
  custom_fields?: Record<string, unknown>
  ai_insights?: {
    suggestions: string[]
    optimization_tips: string[]
    performance_score: number
  }
}

export interface Project {
  id: string
  name: string
  type: 'pptx' | 'template-nr' | 'talking-photo' | 'custom' | 'ai-generated'
  status: 'draft' | 'in-progress' | 'review' | 'completed' | 'archived' | 'error'
  description?: string
  user_id: string
  created_at: string
  updated_at: string
  metadata: ProjectMetadata
  current_version: string
  is_template: boolean
  is_public: boolean
  thumbnail_url?: string
  file_size?: number
  render_settings?: ProjectRenderSettings
  collaboration_enabled: boolean
  last_accessed_at?: string
  
  // Relations
  versions?: ProjectVersion[]
  collaborators?: ProjectCollaborator[]
  analytics?: ProjectAnalytics
}

export type ProjectRenderSettings = Record<string, unknown>

export type ProjectAnalytics = Record<string, unknown>

export interface ProjectsResponse {
  projects: Project[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface ProjectFilters {
  type?: string
  status?: string
  search?: string
  tags?: string[]
  category?: string
  priority?: string
  collaborator?: string
  dateRange?: {
    start: string
    end: string
  }
  sortBy?: 'name' | 'created_at' | 'updated_at' | 'last_accessed_at'
  sortOrder?: 'asc' | 'desc'
}

export interface CreateProjectData {
  name: string
  type: Project['type']
  description?: string
  metadata?: Partial<ProjectMetadata>
  is_template?: boolean
  is_public?: boolean
  collaboration_enabled?: boolean
  render_settings?: ProjectRenderSettings
}

export interface UpdateProjectData {
  name?: string
  description?: string
  status?: Project['status']
  metadata?: Partial<ProjectMetadata>
  is_template?: boolean
  is_public?: boolean
  collaboration_enabled?: boolean
  render_settings?: ProjectRenderSettings
  thumbnail_url?: string
}

// Advanced Project Management Hook
export function useProjects(filters?: ProjectFilters, options?: {
  page?: number
  limit?: number
  realtime?: boolean
}) {
  const { page = 1, limit = 20, realtime = true } = options || {}
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [realtimeData, setRealtimeData] = useState<Project[]>([])

  // Build query key for SWR
  const queryKey = ['projects', filters, page, limit]

  // Fetcher function for SWR
  const fetcher = async (): Promise<ProjectsResponse> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    let query = supabase
      .from('projects')
      .select(`
        *,
        versions:project_versions(*),
        collaborators:project_collaborators(
          *,
          user:users(id, email, name)
        )
      `)
      .eq('user_id', user.id)

    // Apply filters
    if (filters?.type) {
      query = query.eq('type', filters.type)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }
    if (filters?.category) {
      query = query.eq('metadata->>category', filters.category)
    }
    if (filters?.priority) {
      query = query.eq('metadata->>priority', filters.priority)
    }
    if (filters?.dateRange) {
      query = query
        .gte('created_at', filters.dateRange.start)
        .lte('created_at', filters.dateRange.end)
    }

    // Apply sorting
    const sortBy = filters?.sortBy || 'updated_at'
    const sortOrder = filters?.sortOrder || 'desc'
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) throw error

    // Filter by tags if specified (client-side filtering for JSON arrays)
    let filteredData = data || []
    if (filters?.tags && filters.tags.length > 0) {
      filteredData = filteredData.filter(project => {
        const projectTags = project.metadata?.tags || []
        return filters.tags!.some(tag => projectTags.includes(tag))
      })
    }

    return {
      projects: filteredData,
      total: count || 0,
      page,
      limit,
      hasMore: (count || 0) > page * limit
    }
  }

  // SWR hook with optimizations
  const { data, error, isLoading, mutate } = useSWR(
    queryKey,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      errorRetryCount: 3,
      errorRetryInterval: 1000
    }
  )

  // Real-time subscription
  useEffect(() => {
    if (!realtime) return

    const channel = supabase
      .channel('projects_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects'
        },
        (payload) => {
          console.log('Project realtime update:', payload)
          mutate() // Revalidate data
          
          // Show toast notifications
          if (payload.eventType === 'INSERT') {
            toast.success('New project created')
          } else if (payload.eventType === 'UPDATE') {
            toast.info('Project updated')
          } else if (payload.eventType === 'DELETE') {
            toast.info('Project deleted')
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [realtime, mutate])

  // Create project
  const createProject = useCallback(async (projectData: CreateProjectData): Promise<Project> => {
    setIsCreating(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const defaultMetadata: ProjectMetadata = {
        tags: [],
        category: 'general',
        priority: 'medium',
        ...projectData.metadata
      }

      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: projectData.name,
          type: projectData.type,
          description: projectData.description,
          user_id: user.id,
          status: 'draft',
          metadata: defaultMetadata,
          current_version: '1.0.0',
          is_template: projectData.is_template || false,
          is_public: projectData.is_public || false,
          collaboration_enabled: projectData.collaboration_enabled || false,
          render_settings: projectData.render_settings || {},
          last_accessed_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      // Create initial version
      await supabase
        .from('project_versions')
        .insert({
          project_id: data.id,
          version_number: '1.0.0',
          name: projectData.name,
          description: 'Initial version',
          changes_summary: 'Project created',
          created_by: user.id,
          metadata: defaultMetadata
        })

      await mutate()
      toast.success('Project created successfully')
      return data
    } catch (error) {
      console.error('Error creating project:', error)
      toast.error('Failed to create project')
      throw error
    } finally {
      setIsCreating(false)
    }
  }, [mutate])

  // Update project
  const updateProject = useCallback(async (projectId: string, updates: UpdateProjectData): Promise<Project> => {
    setIsUpdating(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Get current project
      const { data: currentProject } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

      if (!currentProject) throw new Error('Project not found')

      // Merge metadata
      const updatedMetadata = {
        ...currentProject.metadata,
        ...updates.metadata
      }

      const { data, error } = await supabase
        .from('projects')
        .update({
          ...updates,
          metadata: updatedMetadata,
          updated_at: new Date().toISOString(),
          last_accessed_at: new Date().toISOString()
        })
        .eq('id', projectId)
        .select()
        .single()

      if (error) throw error

      // Create new version if significant changes
      if (updates.name || updates.description || updates.metadata) {
        const versionNumber = await generateNextVersion(projectId)
        await supabase
          .from('project_versions')
          .insert({
            project_id: projectId,
            version_number: versionNumber,
            name: updates.name || currentProject.name,
            description: updates.description || currentProject.description,
            changes_summary: generateChangesSummary(currentProject, updates),
            created_by: user.id,
            metadata: updatedMetadata
          })

        // Update current version
        await supabase
          .from('projects')
          .update({ current_version: versionNumber })
          .eq('id', projectId)
      }

      await mutate()
      toast.success('Project updated successfully')
      return data
    } catch (error) {
      console.error('Error updating project:', error)
      toast.error('Failed to update project')
      throw error
    } finally {
      setIsUpdating(false)
    }
  }, [mutate])

  // Delete project
  const deleteProject = useCallback(async (projectId: string): Promise<void> => {
    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

      if (error) throw error

      await mutate()
      toast.success('Project deleted successfully')
    } catch (error) {
      console.error('Error deleting project:', error)
      toast.error('Failed to delete project')
      throw error
    } finally {
      setIsDeleting(false)
    }
  }, [mutate])

  // Duplicate project
  const duplicateProject = useCallback(async (projectId: string, newName?: string): Promise<Project> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data: originalProject } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

      if (!originalProject) throw new Error('Project not found')

      return await createProject({
        name: newName || `${originalProject.name} (Copy)`,
        type: originalProject.type,
        description: originalProject.description,
        metadata: originalProject.metadata,
        is_template: originalProject.is_template,
        is_public: false, // Duplicated projects are private by default
        collaboration_enabled: originalProject.collaboration_enabled,
        render_settings: originalProject.render_settings
      })
    } catch (error) {
      console.error('Error duplicating project:', error)
      toast.error('Failed to duplicate project')
      throw error
    }
  }, [createProject])

  // Archive project
  const archiveProject = useCallback(async (projectId: string): Promise<void> => {
    await updateProject(projectId, { status: 'archived' })
  }, [updateProject])

  // Restore project
  const restoreProject = useCallback(async (projectId: string): Promise<void> => {
    await updateProject(projectId, { status: 'draft' })
  }, [updateProject])

  // Add collaborator
  const addCollaborator = useCallback(async (
    projectId: string, 
    userEmail: string, 
    role: ProjectCollaborator['role'] = 'viewer'
  ): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Find user by email
      const { data: targetUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', userEmail)
        .single()

      if (!targetUser) throw new Error('User not found')

      const { error } = await supabase
        .from('project_collaborators')
        .insert({
          project_id: projectId,
          user_id: targetUser.id,
          role,
          permissions: getDefaultPermissions(role),
          invited_by: user.id
        })

      if (error) throw error

      await mutate()
      toast.success('Collaborator added successfully')
    } catch (error) {
      console.error('Error adding collaborator:', error)
      toast.error('Failed to add collaborator')
      throw error
    }
  }, [mutate])

  // Get project analytics
  const getProjectAnalytics = useCallback(async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('get_project_analytics', { project_id: projectId })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error getting project analytics:', error)
      throw error
    }
  }, [])

  return {
    // Data
    projects: data?.projects || [],
    total: data?.total || 0,
    hasMore: data?.hasMore || false,
    
    // Loading states
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    
    // Error
    error,
    
    // Actions
    createProject,
    updateProject,
    deleteProject,
    duplicateProject,
    archiveProject,
    restoreProject,
    addCollaborator,
    getProjectAnalytics,
    
    // Utilities
    refresh: mutate
  }
}

export function useProject(id: string) {
  const { data, error, mutate, isLoading } = useSWR(
    id ? `/api/projects/${id}` : null,
    async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          versions:project_versions(*),
          collaborators:project_collaborators(
            *,
            user:users(id, email, name)
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    }
  )

  return {
    project: data,
    loading: isLoading,
    error,
    refresh: mutate
  }
}

export async function processProjectPPTX(file: File, projectName?: string) {
  const formData = new FormData()
  formData.append('file', file)
  if (projectName) formData.append('projectName', projectName)

  const response = await fetch('/api/pptx/upload', {
    method: 'POST',
    body: formData
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to process PPTX')
  }

  return response.json()
}

// Helper functions
async function generateNextVersion(projectId: string): Promise<string> {
  const { data } = await supabase
    .from('project_versions')
    .select('version_number')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!data) return '1.0.1'

  const [major, minor, patch] = data.version_number.split('.').map(Number)
  return `${major}.${minor}.${patch + 1}`
}

function generateChangesSummary(original: Project, updates: UpdateProjectData): string {
  const changes: string[] = []
  
  if (updates.name && updates.name !== original.name) {
    changes.push(`Name changed from "${original.name}" to "${updates.name}"`)
  }
  if (updates.description && updates.description !== original.description) {
    changes.push('Description updated')
  }
  if (updates.status && updates.status !== original.status) {
    changes.push(`Status changed to ${updates.status}`)
  }
  if (updates.metadata) {
    changes.push('Metadata updated')
  }
  
  return changes.join(', ') || 'Minor updates'
}

function getDefaultPermissions(role: ProjectCollaborator['role']): string[] {
  switch (role) {
    case 'owner':
      return ['read', 'write', 'delete', 'manage_collaborators', 'manage_settings']
    case 'editor':
      return ['read', 'write']
    case 'viewer':
      return ['read']
    default:
      return ['read']
  }
}
