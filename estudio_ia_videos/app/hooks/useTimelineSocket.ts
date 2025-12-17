/**
 * Timeline WebSocket Client SDK (Supabase Realtime Version)
 * Hook React para comunicação real-time via Supabase
 */
'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { createClient as createBrowserSupabaseClient } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

// Re-export types from legacy file or define them here if needed
// For now, we define compatible types
export interface UserPresence {
  userId: string
  userName: string
  userImage?: string
  currentTrackId?: string
  lastActive: number
}

export interface CursorMovePayload {
  projectId: string
  userId: string
  trackId?: string
  position: { x: number; y: number; time: number }
}

export interface TrackLockedPayload {
  projectId: string
  trackId: string
  userId: string
  userName: string
}

export interface TrackUnlockedPayload {
  projectId: string
  trackId: string
  userId: string
}

export interface TimelineUpdatePayload {
  projectId: string
  userId: string
  version: number
  changes: Record<string, unknown>
}

export interface NotificationPayload {
  projectId: string
  type: 'info' | 'success' | 'warning' | 'error'
  message: string
  timestamp: number
}

export interface UserJoinedPayload extends UserPresence {}
export interface UserLeftPayload { userId: string; userName?: string }

export interface UseTimelineSocketOptions {
  projectId: string
  userId: string
  userName: string
  userImage?: string
  autoConnect?: boolean
  onConnected?: () => void
  onDisconnected?: () => void
  onError?: (error: Error) => void
}

export interface TimelineSocketReturn {
  isConnected: boolean;
  error: Error | null;
  activeUsers: UserPresence[];
  connect: () => void;
  disconnect: () => void;
  lockTrack: (trackId: string) => void;
  unlockTrack: (trackId: string) => void;
  updateCursor: (trackId: string | undefined, position: { x: number; y: number; time: number }) => void;
  updatePresence: (currentTrackId?: string) => void;
  broadcastTimelineUpdate: (version: number, changes: Record<string, unknown>) => void;
  sendNotification: (notification: Omit<NotificationPayload, 'projectId'>) => void;
  onUserJoined: (callback: (data: UserJoinedPayload) => void) => void;
  onUserLeft: (callback: (data: UserLeftPayload) => void) => void;
  onTrackLocked: (callback: (data: TrackLockedPayload) => void) => void;
  onTrackUnlocked: (callback: (data: TrackUnlockedPayload) => void) => void;
  onCursorMove: (callback: (data: CursorMovePayload) => void) => void;
  onTimelineUpdated: (callback: (data: TimelineUpdatePayload) => void) => void;
  onNotification: (callback: (data: NotificationPayload) => void) => void;
}

export function useTimelineSocket({
  projectId,
  userId,
  userName,
  userImage,
  autoConnect = true,
  onConnected,
  onDisconnected,
  onError
}: UseTimelineSocketOptions): TimelineSocketReturn {
  const supabase = useMemo(() => createBrowserSupabaseClient(), [])
  const channelRef = useRef<RealtimeChannel | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [activeUsers, setActiveUsers] = useState<UserPresence[]>([])
  
  // Event listeners storage
  const listenersRef = useRef<Map<string, Set<(payload: unknown) => void>>>(new Map())

  // Helper to dispatch events to listeners
  const dispatchEvent = useCallback((event: string, payload: unknown) => {
    const listeners = listenersRef.current.get(event)
    if (listeners) {
      listeners.forEach(listener => listener(payload))
    }
  }, [])

  const connect = useCallback(() => {
    if (channelRef.current) return

    try {
      logger.debug('[Timeline Realtime] Connecting to channel', { channel: `timeline:${projectId}`, component: 'useTimelineSocket' })
      
      const channel = supabase.channel(`timeline:${projectId}`, {
        config: {
          presence: {
            key: userId,
          },
          broadcast: {
            self: false, // Don't receive own messages
          }
        }
      })

      channel
        // Presence
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState<UserPresence>()
          const users: UserPresence[] = []
          
          Object.values(state).forEach(presences => {
            presences.forEach(p => users.push(p))
          })
          
          setActiveUsers(users)
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          newPresences.forEach(p => {
            dispatchEvent('user-joined', p)
          })
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          leftPresences.forEach((p: any) => {
            const userName = p.userName || 'Usuário'
            dispatchEvent('user-left', { userId: key, userName })
          })
        })

        // Broadcast Events
        .on('broadcast', { event: 'cursor-move' }, ({ payload }) => {
          dispatchEvent('cursor-move', payload)
        })
        .on('broadcast', { event: 'track-locked' }, ({ payload }) => {
          dispatchEvent('track-locked', payload)
        })
        .on('broadcast', { event: 'track-unlocked' }, ({ payload }) => {
          dispatchEvent('track-unlocked', payload)
        })
        .on('broadcast', { event: 'timeline-updated' }, ({ payload }) => {
          dispatchEvent('timeline-updated', payload)
        })
        .on('broadcast', { event: 'notification' }, ({ payload }) => {
          dispatchEvent('notification', payload)
        })

        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            logger.debug('[Timeline Realtime] Connected', { component: 'useTimelineSocket' })
            setIsConnected(true)
            setError(null)
            onConnected?.()
            
            // Track presence
            await channel.track({
              userId,
              userName,
              userImage,
              lastActive: Date.now()
            })
          } else if (status === 'CHANNEL_ERROR') {
            logger.error('[Timeline Realtime] Connection error', undefined, { component: 'useTimelineSocket' })
            const err = new Error('Connection error')
            setError(err)
            setIsConnected(false)
            onError?.(err)
          } else if (status === 'TIMED_OUT') {
            logger.error('[Timeline Realtime] Connection timeout', undefined, { component: 'useTimelineSocket' })
            const err = new Error('Connection timeout')
            setError(err)
            setIsConnected(false)
            onError?.(err)
          }
        })

      channelRef.current = channel

    } catch (err) {
      logger.error('[Timeline Realtime] Setup error', err as Error, { component: 'useTimelineSocket' })
      setError(err as Error)
      onError?.(err as Error)
    }
  }, [projectId, userId, userName, userImage, supabase, onConnected, onError, dispatchEvent])

  const disconnect = useCallback(() => {
    if (channelRef.current) {
      logger.debug('[Timeline Realtime] Disconnecting', { component: 'useTimelineSocket' })
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
      setIsConnected(false)
      onDisconnected?.()
    }
  }, [supabase, onDisconnected])

  // Actions
  const lockTrack = useCallback((trackId: string) => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'track-locked',
      payload: { projectId, trackId, userId, userName }
    })
  }, [projectId, userId, userName])

  const unlockTrack = useCallback((trackId: string) => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'track-unlocked',
      payload: { projectId, trackId, userId }
    })
  }, [projectId, userId])

  const updateCursor = useCallback((trackId: string | undefined, position: { x: number; y: number; time: number }) => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'cursor-move',
      payload: { projectId, userId, trackId, position }
    })
  }, [projectId, userId])

  const updatePresence = useCallback((currentTrackId?: string) => {
    channelRef.current?.track({
      userId,
      userName,
      userImage,
      currentTrackId,
      lastActive: Date.now()
    })
  }, [userId, userName, userImage])

  const broadcastTimelineUpdate = useCallback((version: number, changes: Record<string, unknown>) => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'timeline-updated',
      payload: { projectId, userId, version, changes }
    })
  }, [projectId, userId])

  const sendNotification = useCallback((notification: Omit<NotificationPayload, 'projectId'>) => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'notification',
      payload: { ...notification, projectId }
    })
  }, [projectId])

  // Event Listeners Registration
  const addEventListener = useCallback(<T,>(event: string, callback: (data: T) => void) => {
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set())
    }
    listenersRef.current.get(event)!.add(callback as (payload: unknown) => void)
  }, [])

  const onUserJoined = useCallback((callback: (data: UserJoinedPayload) => void) => {
    addEventListener('user-joined', callback)
  }, [addEventListener])

  const onUserLeft = useCallback((callback: (data: UserLeftPayload) => void) => {
    addEventListener('user-left', callback)
  }, [addEventListener])

  const onTrackLocked = useCallback((callback: (data: TrackLockedPayload) => void) => {
    addEventListener('track-locked', callback)
  }, [addEventListener])

  const onTrackUnlocked = useCallback((callback: (data: TrackUnlockedPayload) => void) => {
    addEventListener('track-unlocked', callback)
  }, [addEventListener])

  const onCursorMove = useCallback((callback: (data: CursorMovePayload) => void) => {
    addEventListener('cursor-move', callback)
  }, [addEventListener])

  const onTimelineUpdated = useCallback((callback: (data: TimelineUpdatePayload) => void) => {
    addEventListener('timeline-updated', callback)
  }, [addEventListener])

  const onNotification = useCallback((callback: (data: NotificationPayload) => void) => {
    addEventListener('notification', callback)
  }, [addEventListener])

  // Auto-connect
  useEffect(() => {
    if (autoConnect) {
      connect()
    }
    return () => {
      disconnect()
    }
  }, [autoConnect, connect, disconnect])

  return {
    isConnected,
    error,
    activeUsers,
    connect,
    disconnect,
    lockTrack,
    unlockTrack,
    updateCursor,
    updatePresence,
    broadcastTimelineUpdate,
    sendNotification,
    onUserJoined,
    onUserLeft,
    onTrackLocked,
    onTrackUnlocked,
    onCursorMove,
    onTimelineUpdated,
    onNotification
  }
}

// Utility: Throttle cursor updates
export function useThrottledCursor(
  updateCursor: (trackId: string | undefined, position: { x: number; y: number; time: number }) => void,
  delay = 100
) {
  const lastCallRef = useRef(0)
  const timeoutRef = useRef<NodeJS.Timeout>()

  return useCallback((trackId: string | undefined, position: { x: number; y: number; time: number }) => {
    const now = Date.now()
    
    if (now - lastCallRef.current >= delay) {
      updateCursor(trackId, position)
      lastCallRef.current = now
    } else {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        updateCursor(trackId, position)
        lastCallRef.current = Date.now()
      }, delay)
    }
  }, [updateCursor, delay])
}
