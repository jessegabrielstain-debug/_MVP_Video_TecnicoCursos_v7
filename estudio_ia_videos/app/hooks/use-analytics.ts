/**
 * 📊 Advanced Analytics Hook - Real-time System & User Metrics
 * Enhanced analytics with WebSocket integration and comprehensive metrics
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import useSWR from 'swr'
import { useWebSocket } from './useWebSocket'
import { createBrowserSupabaseClient } from '@/lib/services'
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
}

export interface UserMetrics {
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
  
  useEffect(() => {
    let isMounted = true

    const loadUser = async () => {
      try {
        const { data } = await supabase.auth.getUser()
        if (!isMounted) return
        setUser(data.user ?? null)
      } catch (error) {
        console.error('[Analytics] Falha ao carregar usuário:', error)
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

  // WebSocket connection for real-time updates
  const { 
    isConnected: wsConnected, 
    sendMessage, 
    lastMessage 
  } = useWebSocket('/api/websocket/analytics', {
    onOpen: () => {
      console.log('📊 Analytics WebSocket connected')
      setIsConnected(true)
      // Subscribe to analytics events
      sendMessage({
        type: 'subscribe',
        channel: 'analytics',
        filters
      })
    },
    onClose: () => {
      console.log('📊 Analytics WebSocket disconnected')
      setIsConnected(false)
    },
    onError: (error) => {
      console.error('📊 Analytics WebSocket error:', error)
      setIsConnected(false)
    }
  })

  // Handle real-time messages
  useEffect(() => {
    if (lastMessage) {
      try {
        const message = JSON.parse(lastMessage.data)
        
        switch (message.type) {
          case 'analytics_event':
            const event: AnalyticsEvent = message.data
            setRealTimeEvents(prev => [event, ...prev.slice(0, 99)]) // Keep last 100 events
            eventBuffer.current.push(event)
            
            // Auto-refresh relevant metrics based on event type
            if (event.type === 'system') {
              refreshSystemMetrics()
            } else if (event.type === 'render') {
              refreshRenderStats()
          } else if (event.type === 'user' && event.user_id === user?.id) {
              refreshUserMetrics()
            }
            break
            
          case 'metrics_update':
            // Direct metrics update from server
            if (message.category === 'system') {
              refreshSystemMetrics()
            } else if (message.category === 'render') {
              refreshRenderStats()
            }
            break
            
          case 'bulk_update':
            // Refresh all metrics
            refreshSystemMetrics()
            refreshUserMetrics()
            refreshRenderStats()
            break
        }
      } catch (error) {
        console.error('Error parsing analytics WebSocket message:', error)
      }
    }
  }, [lastMessage, refreshSystemMetrics, refreshUserMetrics, refreshRenderStats, user?.id])

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
      console.error('Error tracking analytics event:', error)
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
      console.error('Error exporting analytics data:', error)
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
      sendMessage({
        type: 'subscribe_events',
        eventTypes,
        filters
      })
    }
  }, [isConnected, sendMessage, filters])

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
    
    // Loading states
    isLoading: loadingState,
    
    // Error states
    errors: errorState,
    
    // Connection status
    isConnected: isConnected && wsConnected,
    
    // Actions
    trackEvent,
    trackProjectEvent,
    trackRenderEvent,
    trackUserEvent,
    refreshAll,
    exportData,
    subscribeToEvents,
    getAggregatedData,
    
    // Individual refresh functions
    refreshSystemMetrics,
    refreshUserMetrics,
    refreshRenderStats
  }
}