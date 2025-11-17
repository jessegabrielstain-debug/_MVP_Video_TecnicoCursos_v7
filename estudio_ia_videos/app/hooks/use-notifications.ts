/**
 * 🔔 Advanced Notifications Hook - Smart Alerts & Notification Center
 * Comprehensive notification system with real-time updates and user preferences
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import useSWR from 'swr'
import { useWebSocket } from './useWebSocket'
import { toast } from 'sonner'
import { createBrowserSupabaseClient } from '@/lib/services'
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
  created_at: string
  updated_at: string
  expires_at?: string
  user_id: string
  project_id?: string
  metadata?: Record<string, unknown>
  actions?: NotificationAction[]
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
  email_notifications: boolean
  push_notifications: boolean
  in_app_notifications: boolean
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

  // WebSocket connection for real-time notifications
  const { 
    isConnected: wsConnected, 
    sendMessage, 
    lastMessage 
  } = useWebSocket('/api/websocket/notifications', {
    onOpen: () => {
      console.log('🔔 Notifications WebSocket connected')
      setIsConnected(true)
      // Subscribe to user's notifications
      if (user?.id) {
        sendMessage({
          type: 'subscribe',
          channel: 'notifications',
          userId: user.id
        })
      }
    },
    onClose: () => {
      console.log('🔔 Notifications WebSocket disconnected')
      setIsConnected(false)
    },
    onError: (error) => {
      console.error('🔔 Notifications WebSocket error:', error)
      setIsConnected(false)
    }
  })

  // Handle real-time messages
  useEffect(() => {
    if (lastMessage) {
      try {
        const message = JSON.parse(lastMessage.data)
        
        switch (message.type) {
          case 'new_notification':
            const notification: Notification = message.data
            handleNewNotification(notification)
            break
            
          case 'notification_updated':
            const updatedNotification: Notification = message.data
            setRealTimeNotifications(prev => 
              prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
            )
            refreshNotifications()
            break
            
          case 'notification_deleted':
            const deletedId: string = message.data.id
            setRealTimeNotifications(prev => prev.filter(n => n.id !== deletedId))
            refreshNotifications()
            break
            
          case 'bulk_update':
            refreshNotifications()
            break
        }
      } catch (error) {
        console.error('Error parsing notification WebSocket message:', error)
      }
    }
  }, [lastMessage, refreshNotifications])

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
    notifications: notificationsData?.data || [],
    realTimeNotifications,
    preferences: preferencesData?.data,
    stats: notificationsData?.stats,
    unreadCount,
    
    // Loading states
    isLoading: loadingState,
    
    // Error states
    errors: errorState,
    
    // Connection status
    isConnected: isConnected && wsConnected,
    
    // Actions
    markAsRead,
    markAllAsRead,
    archiveNotification,
    deleteNotification,
    handleNotificationAction,
    updatePreferences,
    createNotification,
    toggleSound,
    requestPermission,
    
    // Refresh functions
    refreshNotifications,
    refreshPreferences
  }
}