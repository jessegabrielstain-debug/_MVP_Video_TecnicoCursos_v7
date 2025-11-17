/**
 * 🎬 Enhanced Render Pipeline Hook
 * Provides comprehensive render queue management with real-time monitoring
 */

'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import useSWR from 'swr'
import { useWebSocket } from './use-websocket'
import { toast } from 'sonner'
import { createBrowserSupabaseClient } from '@/lib/services'
import type { User } from '@supabase/supabase-js'

// Types and Interfaces
export interface RenderJob {
  id: string
  user_id: string
  project_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  type: 'video' | 'audio' | 'image' | 'animation' | 'composite'
  input_data: Record<string, unknown>
  output_url?: string
  progress: number
  estimated_duration?: number
  actual_duration?: number
  error_message?: string
  metadata: {
    resolution?: string
    format?: string
    quality?: string
    fps?: number
    duration?: number
    file_size?: number
    codec?: string
    bitrate?: number
  }
  resource_usage: {
    cpu_usage?: number
    memory_usage?: number
    gpu_usage?: number
    storage_used?: number
  }
  created_at: string
  updated_at: string
  started_at?: string
  completed_at?: string
}

export interface RenderQueue {
  pending: RenderJob[]
  processing: RenderJob[]
  completed: RenderJob[]
  failed: RenderJob[]
  total_jobs: number
  queue_length: number
  average_wait_time: number
  estimated_completion: string
}

export interface RenderStats {
  total_renders: number
  successful_renders: number
  failed_renders: number
  success_rate: number
  average_render_time: number
  total_render_time: number
  queue_stats: {
    current_length: number
    processing_jobs: number
    average_wait_time: number
    peak_queue_length: number
  }
  performance_metrics: {
    fastest_render: number
    slowest_render: number
    average_cpu_usage: number
    average_memory_usage: number
    average_gpu_usage: number
  }
  resource_usage: {
    total_storage_used: number
    bandwidth_used: number
    compute_hours: number
    cost_estimate: number
  }
}

export interface RenderFilters {
  status?: RenderJob['status'][]
  type?: RenderJob['type'][]
  priority?: RenderJob['priority'][]
  date_range?: {
    start: string
    end: string
  }
  project_id?: string
  search?: string
}

export interface RenderSettings {
  auto_retry: boolean
  max_retries: number
  priority_boost: boolean
  quality_preset: 'draft' | 'standard' | 'high' | 'ultra'
  notifications: {
    on_completion: boolean
    on_failure: boolean
    on_queue_position: boolean
  }
  resource_limits: {
    max_cpu_usage: number
    max_memory_usage: number
    max_duration: number
  }
}

// API Fetcher
const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch render data')
  }
  return response.json()
}

export function useRenderPipeline() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), [])
  const [user, setUser] = useState<User | null>(null)
  const [filters, setFilters] = useState<RenderFilters>({})
  const [settings, setSettings] = useState<RenderSettings>({
    auto_retry: true,
    max_retries: 3,
    priority_boost: false,
    quality_preset: 'standard',
    notifications: {
      on_completion: true,
      on_failure: true,
      on_queue_position: false
    },
    resource_limits: {
      max_cpu_usage: 80,
      max_memory_usage: 70,
      max_duration: 3600
    }
  })

  // Build query parameters
  const buildQueryParams = useCallback((additionalParams: Record<string, unknown> = {}) => {
    const params = new URLSearchParams()
    
    if (filters.status?.length) {
      params.append('status', filters.status.join(','))
    }
    if (filters.type?.length) {
      params.append('type', filters.type.join(','))
    }
    if (filters.priority?.length) {
      params.append('priority', filters.priority.join(','))
    }
    if (filters.project_id) {
      params.append('project_id', filters.project_id)
    }
    if (filters.search) {
      params.append('search', filters.search)
    }
    if (filters.date_range) {
      params.append('start_date', filters.date_range.start)
      params.append('end_date', filters.date_range.end)
    }

    Object.entries(additionalParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value))
      }
    })

    return params.toString()
  }, [filters])

  // SWR Hooks for data fetching
  const { 
    data: renderQueue, 
    error: queueError, 
    mutate: mutateQueue,
    isLoading: isLoadingQueue 
  } = useSWR<RenderQueue>(
    user ? `/api/render/queue?${buildQueryParams()}` : null,
    fetcher,
    {
      refreshInterval: 5000, // Refresh every 5 seconds
      revalidateOnFocus: true
    }
  )

  const { 
    data: renderStats, 
    error: statsError, 
    mutate: mutateStats,
    isLoading: isLoadingStats 
  } = useSWR<RenderStats>(
    user ? `/api/render/stats?${buildQueryParams()}` : null,
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true
    }
  )

  const { 
    data: userSettings, 
    error: settingsError, 
    mutate: mutateSettings 
  } = useSWR<RenderSettings>(
    user ? '/api/render/settings' : null,
    fetcher
  )
  useEffect(() => {
    let isMounted = true

    const loadUser = async () => {
      try {
        const { data } = await supabase.auth.getUser()
        if (!isMounted) return
        setUser(data.user ?? null)
      } catch (error) {
        console.error('[RenderPipeline] Falha ao carregar usuário:', error)
      }
    }

    void loadUser()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return
      setUser(session?.user ?? null)
    })

    return () => {
      isMounted = false
      listener?.subscription.unsubscribe()
    }
  }, [supabase])


  // WebSocket for real-time updates
  const { isConnected, sendMessage } = useWebSocket({
    onMessage: useCallback((message) => {
      switch (message.type) {
        case 'render_job_updated':
          mutateQueue()
          if (message.data.status === 'completed') {
            if (settings.notifications.on_completion) {
              toast.success(`Render completed: ${message.data.id}`)
            }
          } else if (message.data.status === 'failed') {
            if (settings.notifications.on_failure) {
              toast.error(`Render failed: ${message.data.error_message}`)
            }
          }
          break

        case 'render_queue_updated':
          mutateQueue()
          break

        case 'render_stats_updated':
          mutateStats()
          break

        case 'render_progress_updated':
          mutateQueue()
          if (settings.notifications.on_queue_position && message.data.queue_position) {
            toast.info(`Your render is #${message.data.queue_position} in queue`)
          }
          break

        default:
          break
      }
    }, [mutateQueue, mutateStats, settings.notifications]),
    channels: ['render_pipeline']
  })

  // Update settings when user settings are loaded
  useEffect(() => {
    if (userSettings) {
      setSettings(userSettings)
    }
  }, [userSettings])

  // Render Job Management Functions
  const createRenderJob = useCallback(async (jobData: Partial<RenderJob>) => {
    try {
      const response = await fetch('/api/render/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(jobData)
      })

      if (!response.ok) {
        throw new Error('Failed to create render job')
      }

      const result = await response.json()
      mutateQueue()
      toast.success('Render job created successfully')
      return result.data
    } catch (error) {
      toast.error('Failed to create render job')
      throw error
    }
  }, [mutateQueue])

  const cancelRenderJob = useCallback(async (jobId: string) => {
    try {
      const response = await fetch(`/api/render/jobs/${jobId}/cancel`, {
        method: 'PATCH'
      })

      if (!response.ok) {
        throw new Error('Failed to cancel render job')
      }

      mutateQueue()
      toast.success('Render job cancelled')
    } catch (error) {
      toast.error('Failed to cancel render job')
      throw error
    }
  }, [mutateQueue])

  const retryRenderJob = useCallback(async (jobId: string) => {
    try {
      const response = await fetch(`/api/render/jobs/${jobId}/retry`, {
        method: 'PATCH'
      })

      if (!response.ok) {
        throw new Error('Failed to retry render job')
      }

      mutateQueue()
      toast.success('Render job queued for retry')
    } catch (error) {
      toast.error('Failed to retry render job')
      throw error
    }
  }, [mutateQueue])

  const updateJobPriority = useCallback(async (jobId: string, priority: RenderJob['priority']) => {
    try {
      const response = await fetch(`/api/render/jobs/${jobId}/priority`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ priority })
      })

      if (!response.ok) {
        throw new Error('Failed to update job priority')
      }

      mutateQueue()
      toast.success('Job priority updated')
    } catch (error) {
      toast.error('Failed to update job priority')
      throw error
    }
  }, [mutateQueue])

  const deleteRenderJob = useCallback(async (jobId: string) => {
    try {
      const response = await fetch(`/api/render/jobs/${jobId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete render job')
      }

      mutateQueue()
      toast.success('Render job deleted')
    } catch (error) {
      toast.error('Failed to delete render job')
      throw error
    }
  }, [mutateQueue])

  // Settings Management
  const updateSettings = useCallback(async (newSettings: Partial<RenderSettings>) => {
    try {
      const response = await fetch('/api/render/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newSettings)
      })

      if (!response.ok) {
        throw new Error('Failed to update render settings')
      }

      const updatedSettings = { ...settings, ...newSettings }
      setSettings(updatedSettings)
      mutateSettings()
      toast.success('Render settings updated')
    } catch (error) {
      toast.error('Failed to update render settings')
      throw error
    }
  }, [settings, mutateSettings])

  // Queue Management
  const clearCompletedJobs = useCallback(async () => {
    try {
      const response = await fetch('/api/render/queue/clear-completed', {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to clear completed jobs')
      }

      mutateQueue()
      toast.success('Completed jobs cleared')
    } catch (error) {
      toast.error('Failed to clear completed jobs')
      throw error
    }
  }, [mutateQueue])

  const pauseQueue = useCallback(async () => {
    try {
      const response = await fetch('/api/render/queue/pause', {
        method: 'PATCH'
      })

      if (!response.ok) {
        throw new Error('Failed to pause queue')
      }

      mutateQueue()
      toast.success('Render queue paused')
    } catch (error) {
      toast.error('Failed to pause queue')
      throw error
    }
  }, [mutateQueue])

  const resumeQueue = useCallback(async () => {
    try {
      const response = await fetch('/api/render/queue/resume', {
        method: 'PATCH'
      })

      if (!response.ok) {
        throw new Error('Failed to resume queue')
      }

      mutateQueue()
      toast.success('Render queue resumed')
    } catch (error) {
      toast.error('Failed to resume queue')
      throw error
    }
  }, [mutateQueue])

  // Utility Functions
  const getJobById = useCallback((jobId: string): RenderJob | undefined => {
    if (!renderQueue) return undefined
    
    const allJobs = [
      ...renderQueue.pending,
      ...renderQueue.processing,
      ...renderQueue.completed,
      ...renderQueue.failed
    ]
    
    return allJobs.find(job => job.id === jobId)
  }, [renderQueue])

  const getJobsByProject = useCallback((projectId: string): RenderJob[] => {
    if (!renderQueue) return []
    
    const allJobs = [
      ...renderQueue.pending,
      ...renderQueue.processing,
      ...renderQueue.completed,
      ...renderQueue.failed
    ]
    
    return allJobs.filter(job => job.project_id === projectId)
  }, [renderQueue])

  const refreshData = useCallback(() => {
    mutateQueue()
    mutateStats()
    mutateSettings()
  }, [mutateQueue, mutateStats, mutateSettings])

  return {
    // Data
    renderQueue,
    renderStats,
    settings,
    
    // Loading states
    isLoading: isLoadingQueue || isLoadingStats,
    isLoadingQueue,
    isLoadingStats,
    
    // Error states
    error: queueError || statsError || settingsError,
    queueError,
    statsError,
    settingsError,
    
    // WebSocket connection
    isConnected,
    
    // Filters and settings
    filters,
    setFilters,
    
    // Job management
    createRenderJob,
    cancelRenderJob,
    retryRenderJob,
    updateJobPriority,
    deleteRenderJob,
    
    // Settings management
    updateSettings,
    
    // Queue management
    clearCompletedJobs,
    pauseQueue,
    resumeQueue,
    
    // Utility functions
    getJobById,
    getJobsByProject,
    refreshData
  }
}