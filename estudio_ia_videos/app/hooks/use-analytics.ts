/**
 * 📊 Advanced Analytics Hook - Real-time System & User Metrics
 * Enhanced analytics with WebSocket integration and comprehensive metrics
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import useSWR from 'swr'
import { createClient as createBrowserSupabaseClient } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'
import type { User } from '@supabase/supabase-js'

// Types for analytics data
export interface SystemMetrics {
  cpu_usage: number
  memory_usage: number
  disk_usage: number
  active_users: number
  total_projects: number
  active_renders: number
  queue_length: number
  avg_render_time: number
  error_rate: number
  uptime: number
  last_updated: string
  projects_created_today?: number // Added
  network_io?: number // Added
  network_in?: number // Added
  network_out?: number // Added
  memory_used?: number // Added
  memory_total?: number // Added
  disk_used?: number // Added
  disk_total?: number // Added
}

export interface UserMetrics {
  total_users: number
  user_growth_rate: number
  new_users_today: number
  active_users: number
  retention_rate: number
  user_distribution: Array<{ name: string; value: number }>
  total_projects: number
  completed_projects: number
  active_projects: number
  total_render_time: number
  avg_project_duration: number
  favorite_project_types: Array<{ type: string; count: number }>
  recent_activity: Array<{
    id: string
    type: string
    action: string
    timestamp: string
    metadata?: Record<string, unknown>
  }>
  collaboration_stats: {
    owned_projects: number
    collaborated_projects: number
    shared_projects: number
  }
  usage_patterns: {
    most_active_hours: number[]
    preferred_features: string[]
    avg_session_duration: number
  }
}

export interface AnalyticsLoadingState {
  system: boolean
  user: boolean
  render: boolean
  combined: boolean
}

type AnalyticsError = Error | undefined

export interface AnalyticsErrorState {
  system: AnalyticsError
  user: AnalyticsError
  render: AnalyticsError
  combined: boolean
}

export interface RenderStatistics {
  renders_today: number
  success_rate: number
  queue_length: number
  avg_wait_time: number
  status_distribution: Array<{ name: string; value: number }>
  recent_jobs: Array<{
    id: string
    project_title: string
    status: string
    render_type: string
    duration: number
    created_at: string
  }>
  completed_today: number
  in_progress: number
  failed_today: number
  total_renders: number
  successful_renders: number
  failed_renders: number
  avg_render_time: number
  total_render_time: number
  queue_stats: {
    current_queue_length: number
    avg_wait_time: number
    peak_queue_time: string
  }
  performance_metrics: {
    fastest_render: number
    slowest_render: number
    most_common_resolution: string
    most_common_format: string
  }
  error_analysis: Array<{
    error_type: string
    count: number
    last_occurrence: string
  }>
  resource_usage: {
    cpu_peak: number
    memory_peak: number
    storage_used: number
  }
}

export interface AnalyticsFilters {
  timeRange: '1h' | '24h' | '7d' | '30d' | '90d'
  projectType?: string
  status?: string
  userId?: string
}

export interface AnalyticsEvent {
  id: string
  type: 'system' | 'user' | 'render' | 'error'
  category: string
  action: string
  metadata: Record<string, unknown>
  timestamp: string
  user_id?: string
  project_id?: string
}

// Custom fetcher with error handling
const fetcher = async (url: string) => {
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
    }
  })
  
  if (!response.ok) {
    throw new Error(`Analytics API error: ${response.statusText}`)
  }
  
  return response.json()
}

export function useAnalytics(filters: AnalyticsFilters = { timeRange: '24h' }) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), [])
  const [user, setUser] = useState<User | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [realTimeEvents, setRealTimeEvents] = useState<AnalyticsEvent[]>([])
  const eventBuffer = useRef<AnalyticsEvent[]>([])
  const [timeRange, setTimeRange] = useState<string>(filters.timeRange)

  // Mock performance data
  const performanceData = useMemo(() => {
      return Array.from({ length: 24 }, (_, i) => ({
          timestamp: `${i}:00`,
          cpu_usage: Math.random() * 100,
          memory_usage: Math.random() * 100,
          disk_usage: Math.random() * 100
      }))
  }, [])

  // Mock usage data
  const usageData = useMemo(() => {
      return Array.from({ length: 7 }, (_, i) => ({
          timestamp: `Day ${i+1}`,
          active_users: Math.floor(Math.random() * 100),
          renders_completed: Math.floor(Math.random() * 50)
      }))
  }, [])
  
  useEffect(() => {
    let isMounted = true

    const loadUser = async () => {
      try {
        const { data } = await supabase.auth.getUser()
        if (!isMounted) return
        setUser(data.user ?? null)
      } catch (error) {
        logger.error('[Analytics] Falha ao carregar usuário', error as Error, { component: 'use-analytics' })
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

  // Build query parameters
  const queryParams = new URLSearchParams({
    timeRange: filters.timeRange,
    ...(filters.projectType && { projectType: filters.projectType }),
    ...(filters.status && { status: filters.status }),
    ...(filters.userId && { userId: filters.userId })
  }).toString()

  // Fetch system metrics
  const { 
    data: systemMetrics, 
    error: systemError, 
    mutate: refreshSystemMetrics,
    isLoading: systemLoading 
  } = useSWR<{ success: boolean; data: SystemMetrics }>(
    user ? `/api/analytics/system-metrics?${queryParams}` : null,
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
      errorRetryCount: 3,
      errorRetryInterval: 5000
    }
  )

  // Fetch user metrics
  const { 
    data: userMetrics, 
    error: userError, 
    mutate: refreshUserMetrics,
    isLoading: userLoading 
  } = useSWR<{ success: boolean; data: UserMetrics }>(
    user ? `/api/analytics/user-metrics?${queryParams}` : null,
    fetcher,
    {
      refreshInterval: 60000, // Refresh every minute
      revalidateOnFocus: true,
      errorRetryCount: 3
    }
  )

  // Fetch render statistics
  const { 
    data: renderStats, 
    error: renderError, 
    mutate: refreshRenderStats,
    isLoading: renderLoading 
  } = useSWR<{ success: boolean; data: RenderStatistics }>(
    user ? `/api/analytics/render-stats?${queryParams}` : null,
    fetcher,
    {
      refreshInterval: 15000, // Refresh every 15 seconds
      revalidateOnFocus: true,
      errorRetryCount: 3
    }
  )

  // Real-time analytics with Supabase
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('analytics_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'analytics_events',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const event = payload.new as unknown as AnalyticsEvent
          
          setRealTimeEvents(prev => [event, ...prev.slice(0, 99)])
          eventBuffer.current.push(event)

          // Auto-refresh relevant metrics
          if (event.category === 'system') {
             refreshSystemMetrics()
          } else if (event.category === 'render') {
             refreshRenderStats()
          } else if (event.category === 'user') {
             refreshUserMetrics()
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, user, refreshSystemMetrics, refreshUserMetrics, refreshRenderStats])

  // Track custom events
  const trackEvent = useCallback(async (
    category: string,
    action: string,
    metadata: Record<string, unknown> = {},
    projectId?: string
  ) => {
    try {
      const response = await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        body: JSON.stringify({
          category,
          action,
          metadata,
          project_id: projectId,
          timestamp: new Date().toISOString()
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to track event: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      logger.error('Error tracking analytics event', error as Error, { component: 'use-analytics' })
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }, [])

  // Specialized tracking functions
  const trackProjectEvent = useCallback((
    action: 'created' | 'updated' | 'deleted' | 'viewed' | 'shared',
    projectId: string,
    metadata: Record<string, unknown> = {}
  ) => {
    return trackEvent('project', action, metadata, projectId)
  }, [trackEvent])

  const trackRenderEvent = useCallback((
    action: 'started' | 'completed' | 'failed' | 'queued',
    projectId: string,
    metadata: Record<string, unknown> = {}
  ) => {
    return trackEvent('render', action, metadata, projectId)
  }, [trackEvent])

  const trackUserEvent = useCallback((
    action: string,
    metadata: Record<string, unknown> = {}
  ) => {
    return trackEvent('user', action, metadata)
  }, [trackEvent])

  // Get aggregated analytics data
  const getAggregatedData = useCallback(() => {
    return {
      system: systemMetrics?.data,
      user: userMetrics?.data,
      render: renderStats?.data,
      realTimeEvents: realTimeEvents.slice(0, 20), // Last 20 events
      isLoading: systemLoading || userLoading || renderLoading,
      hasError: !!(systemError || userError || renderError),
      errors: {
        system: systemError,
        user: userError,
        render: renderError
      }
    }
  }, [
    systemMetrics, userMetrics, renderStats, realTimeEvents,
    systemLoading, userLoading, renderLoading,
    systemError, userError, renderError
  ])

  // Export analytics data
  const exportData = useCallback(async (
    type: 'system' | 'user' | 'render' | 'all',
    format: 'json' | 'csv' = 'json'
  ) => {
    try {
      const response = await fetch(`/api/analytics/export?type=${type}&format=${format}&${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        }
      })

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `analytics-${type}-${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      return { success: true }
    } catch (error) {
      logger.error('Error exporting analytics data', error as Error, { component: 'use-analytics' })
      return { success: false, error: error instanceof Error ? error.message : 'Export failed' }
    }
  }, [queryParams])

  // Refresh all data
  const refreshAll = useCallback(() => {
    refreshSystemMetrics()
    refreshUserMetrics()
    refreshRenderStats()
  }, [refreshSystemMetrics, refreshUserMetrics, refreshRenderStats])

  // Subscribe to specific events
  const subscribeToEvents = useCallback((eventTypes: string[]) => {
    if (isConnected) {
      logger.warn('subscribeToEvents: sendMessage is not implemented', { eventTypes, filters, component: 'use-analytics' })
    }
  }, [isConnected, filters])

  const loadingState: AnalyticsLoadingState = {
    system: systemLoading,
    user: userLoading,
    render: renderLoading,
    combined: systemLoading || userLoading || renderLoading
  }

  const errorState: AnalyticsErrorState = {
    system: systemError,
    user: userError,
    render: renderError,
    combined: !!(systemError || userError || renderError)
  }

  return {
    // Data
    systemMetrics: systemMetrics?.data,
    userMetrics: userMetrics?.data,
    renderStats: renderStats?.data,
    realTimeEvents,
    performanceData,
    usageData,
    timeRange,
    
    // Loading states
    isLoading: loadingState.combined,
    
    // Error states
    errors: errorState,
    error: errorState.combined ? new Error('Failed to load analytics') : undefined,
    
    // Connection status
    isConnected,
    
    // Actions
    trackEvent,
    trackProjectEvent,
    trackRenderEvent,
    trackUserEvent,
    refreshAll,
    refreshData: refreshAll,
    exportData,
    subscribeToEvents,
    getAggregatedData,
    setTimeRange,
    
    // Individual refresh functions
    refreshSystemMetrics,
    refreshUserMetrics,
    refreshRenderStats
  }
}