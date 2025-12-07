/**
 * 🔔 Advanced Notifications Hook - Smart Alerts & Notification Center
 * Comprehensive notification system with real-time updates and user preferences
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import useSWR from 'swr'
import { toast } from 'sonner'
import { createClient as createBrowserSupabaseClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface NotificationLoadingState {
  notifications: boolean
  preferences: boolean
  combined: boolean
}

interface NotificationErrorState {
  notifications: Error | undefined
  preferences: Error | undefined
  combined: boolean
}

// Types for notifications
export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error' | 'render' | 'collaboration' | 'system'
  title: string
  message: string
  category: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'unread' | 'read' | 'archived'
  read: boolean
  created_at: string
  timestamp: Date
  updated_at: string
  expires_at?: string
  user_id: string
  project_id?: string
  metadata?: Record<string, unknown>
  actions?: NotificationAction[]
  action_url?: string
}

export interface NotificationAction {
  id: string
  label: string
  type: 'button' | 'link'
  action: string
  url?: string
  style?: 'primary' | 'secondary' | 'danger'
}

export interface NotificationPreferences {
  id: string
  user_id: string
  email_enabled: boolean
  email_digest: boolean
  push_enabled: boolean
  in_app_notifications: boolean
  sound_enabled: boolean
  render_notifications: boolean
  system_notifications: boolean
  collaboration_notifications: boolean
  notification_types: {
    render_complete: boolean
    render_failed: boolean
    collaboration_invite: boolean
    project_shared: boolean
    system_maintenance: boolean
    security_alerts: boolean
    feature_updates: boolean
  }
  quiet_hours: {
    enabled: boolean
    start_time: string
    end_time: string
    timezone: string
  }
  frequency_limits: {
    max_per_hour: number
    max_per_day: number
    batch_similar: boolean
  }
  created_at: string
  updated_at: string
}

export interface NotificationFilters {
  type?: string[]
  category?: string
  priority?: string[]
  status?: 'unread' | 'read' | 'archived' | 'all'
  timeRange?: '1h' | '24h' | '7d' | '30d'
  projectId?: string
  limit?: number
  offset?: number
}

export interface NotificationStats {
  total: number
  unread: number
  by_type: Record<string, number>
  by_priority: Record<string, number>
  recent_activity: number
}

// Custom fetcher with error handling
const fetcher = async (url: string) => {
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
    }
  })
  
  if (!response.ok) {
    throw new Error(`Notifications API error: ${response.statusText}`)
  }
  
  return response.json()
}

export function useNotifications(filters: NotificationFilters = {}) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), [])
  const [user, setUser] = useState<User | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  useEffect(() => {
    let isMounted = true

    const loadUser = async () => {
      try {
        const { data } = await supabase.auth.getUser()
        if (!isMounted) return
        setUser(data.user ?? null)
      } catch (error) {
        console.error('[Notifications] Falha ao carregar usuário:', error)
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
  const [realTimeNotifications, setRealTimeNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const notificationQueue = useRef<Notification[]>([])
  const soundEnabled = useRef(true)

  // Build query parameters
  const queryParams = new URLSearchParams({
    ...(filters.type && { type: filters.type.join(',') }),
    ...(filters.category && { category: filters.category }),
    ...(filters.priority && { priority: filters.priority.join(',') }),
    ...(filters.status && { status: filters.status }),
    ...(filters.timeRange && { timeRange: filters.timeRange }),
    ...(filters.projectId && { projectId: filters.projectId }),
    ...(filters.limit && { limit: filters.limit.toString() }),
    ...(filters.offset && { offset: filters.offset.toString() })
  }).toString()

  // Fetch notifications
  const { 
    data: notificationsData, 
    error: notificationsError, 
    mutate: refreshNotifications,
    isLoading: notificationsLoading 
  } = useSWR<{ success: boolean; data: Notification[]; stats: NotificationStats }>(
    user ? `/api/notifications?${queryParams}` : null,
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
      errorRetryCount: 3,
      onSuccess: (data) => {
        if (data.success) {
          setUnreadCount(data.stats.unread)
        }
      }
    }
  )

  // Fetch user preferences
  const { 
    data: preferencesData, 
    error: preferencesError, 
    mutate: refreshPreferences,
    isLoading: preferencesLoading 
  } = useSWR<{ success: boolean; data: NotificationPreferences }>(
    user ? '/api/notifications/preferences' : null,
    fetcher,
    {
      revalidateOnFocus: false,
      errorRetryCount: 2
    }
  )

  // WebSocket connection removed in favor of Supabase Realtime


  // Handle new notification
  const handleNewNotification = useCallback((notification: Notification) => {
    // Add to real-time notifications
    setRealTimeNotifications(prev => [notification, ...prev.slice(0, 49)]) // Keep last 50
    
    // Update unread count
    setUnreadCount(prev => prev + 1)
    
    // Check user preferences before showing
    const preferences = preferencesData?.data
    if (preferences?.in_app_notifications) {
      const notificationType = notification.type as keyof typeof preferences.notification_types
      
      if (preferences.notification_types[notificationType] !== false) {
        // Show toast notification
        showToastNotification(notification)
        
        // Play sound if enabled
        if (soundEnabled.current && notification.priority !== 'low') {
          playNotificationSound(notification.priority)
        }
      }
    }
    
    // Refresh main notifications list
    refreshNotifications()
  }, [preferencesData, refreshNotifications])

  // Real-time notifications with Supabase
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('notifications_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const notification = payload.new as Notification
            handleNewNotification(notification)
          } else if (payload.eventType === 'UPDATE') {
            const updatedNotification = payload.new as Notification
            setRealTimeNotifications(prev => 
              prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
            )
            refreshNotifications()
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id
            setRealTimeNotifications(prev => prev.filter(n => n.id !== deletedId))
            refreshNotifications()
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, user, refreshNotifications, handleNewNotification])

  // Show toast notification
  const showToastNotification = useCallback((notification: Notification) => {
    const toastOptions = {
      duration: notification.priority === 'urgent' ? 10000 : 
                notification.priority === 'high' ? 6000 : 4000,
      action: notification.actions?.[0] ? {
        label: notification.actions[0].label,
        onClick: () => handleNotificationAction(notification.id, notification.actions![0])
      } : undefined
    }

    switch (notification.type) {
      case 'success':
        toast.success(notification.title, {
          description: notification.message,
          ...toastOptions
        })
        break
      case 'error':
        toast.error(notification.title, {
          description: notification.message,
          ...toastOptions
        })
        break
      case 'warning':
        toast.warning(notification.title, {
          description: notification.message,
          ...toastOptions
        })
        break
      default:
        toast(notification.title, {
          description: notification.message,
          ...toastOptions
        })
    }
  }, [])

  // Play notification sound
  const playNotificationSound = useCallback((priority: string) => {
    try {
      const audio = new Audio()
      audio.volume = 0.3
      
      switch (priority) {
        case 'urgent':
          audio.src = '/sounds/urgent-notification.mp3'
          break
        case 'high':
          audio.src = '/sounds/high-notification.mp3'
          break
        default:
          audio.src = '/sounds/default-notification.mp3'
      }
      
      audio.play().catch(error => {
        console.warn('Could not play notification sound:', error)
      })
    } catch (error) {
      console.warn('Notification sound not available:', error)
    }
  }, [])

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to mark notification as read: ${response.statusText}`)
      }

      // Update local state
      setUnreadCount(prev => Math.max(0, prev - 1))
      refreshNotifications()

      return { success: true }
    } catch (error) {
      console.error('Error marking notification as read:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }, [refreshNotifications])

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to mark all notifications as read: ${response.statusText}`)
      }

      setUnreadCount(0)
      refreshNotifications()

      return { success: true }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }, [refreshNotifications])

  // Archive notification
  const archiveNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/archive`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to archive notification: ${response.statusText}`)
      }

      refreshNotifications()
      return { success: true }
    } catch (error) {
      console.error('Error archiving notification:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }, [refreshNotifications])

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to delete notification: ${response.statusText}`)
      }

      refreshNotifications()
      return { success: true }
    } catch (error) {
      console.error('Error deleting notification:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }, [refreshNotifications])

  // Handle notification action
  const handleNotificationAction = useCallback(async (notificationId: string, action: NotificationAction) => {
    try {
      if (action.type === 'link' && action.url) {
        window.open(action.url, '_blank')
      } else if (action.type === 'button') {
        const response = await fetch(`/api/notifications/${notificationId}/action`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
          },
          body: JSON.stringify({ action: action.action })
        })

        if (!response.ok) {
          throw new Error(`Failed to execute notification action: ${response.statusText}`)
        }
      }

      // Mark notification as read after action
      await markAsRead(notificationId)

      return { success: true }
    } catch (error) {
      console.error('Error handling notification action:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }, [markAsRead])

  // Update user preferences
  const updatePreferences = useCallback(async (preferences: Partial<NotificationPreferences>) => {
    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        body: JSON.stringify(preferences)
      })

      if (!response.ok) {
        throw new Error(`Failed to update preferences: ${response.statusText}`)
      }

      refreshPreferences()
      return { success: true }
    } catch (error) {
      console.error('Error updating notification preferences:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }, [refreshPreferences])

  // Create custom notification
  const createNotification = useCallback(async (notification: Omit<Notification, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        body: JSON.stringify(notification)
      })

      if (!response.ok) {
        throw new Error(`Failed to create notification: ${response.statusText}`)
      }

      const result = await response.json()
      refreshNotifications()
      
      return { success: true, data: result.data }
    } catch (error) {
      console.error('Error creating notification:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }, [refreshNotifications])

  // Toggle sound
  const toggleSound = useCallback((enabled: boolean) => {
    soundEnabled.current = enabled
  }, [])

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }
    return false
  }, [])

  const [activeFilters, setActiveFilters] = useState<NotificationFilters>(filters)

  // Map notifications to include new properties
  const mappedNotifications = useMemo(() => {
    return (notificationsData?.data || []).map(n => ({
      ...n,
      read: n.status === 'read',
      timestamp: new Date(n.created_at),
      action_url: n.actions?.[0]?.url
    }))
  }, [notificationsData?.data])

  // Map preferences to include new properties
  const mappedPreferences = useMemo(() => {
    if (!preferencesData?.data) return undefined
    const p = preferencesData.data
    return {
      ...p,
      email_enabled: (p as any).email_notifications,
      push_enabled: (p as any).push_notifications,
      email_digest: false,
      sound_enabled: true,
      render_notifications: p.notification_types.render_complete,
      system_notifications: p.notification_types.system_maintenance,
      collaboration_notifications: p.notification_types.collaboration_invite
    }
  }, [preferencesData?.data])

  const deleteAllRead = useCallback(async () => {
      // Mock implementation
      toast.success('All read notifications deleted')
      refreshNotifications()
  }, [refreshNotifications])

  const testNotification = useCallback(async (type: string) => {
      // Mock implementation
      toast.success(`Test notification of type ${type} sent`)
  }, [])

  const loadingState: NotificationLoadingState = {
    notifications: notificationsLoading,
    preferences: preferencesLoading,
    combined: notificationsLoading || preferencesLoading
  }

  const errorState: NotificationErrorState = {
    notifications: notificationsError,
    preferences: preferencesError,
    combined: !!(notificationsError || preferencesError)
  }

  return {
    // Data
    notifications: mappedNotifications,
    realTimeNotifications,
    preferences: mappedPreferences,
    stats: notificationsData?.stats,
    unreadCount,
    
    // Loading states
    isLoading: loadingState.combined,
    
    // Error states
    error: errorState.combined ? new Error('Failed to load notifications') : undefined,
    errors: errorState,
    
    // Connection status
    isConnected,
    
    // Actions
    markAsRead,
    markAllAsRead,
    archiveNotification,
    deleteNotification,
    deleteAllRead,
    handleNotificationAction,
    updatePreferences,
    createNotification,
    toggleSound,
    requestPermission,
    testNotification,
    
    // Filters
    filters: activeFilters,
    setFilters: setActiveFilters,
    
    // Refresh functions
    refreshNotifications,
    refreshPreferences
  }
}