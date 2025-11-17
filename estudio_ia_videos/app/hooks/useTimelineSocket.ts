/**
 * Timeline WebSocket Client SDK
 * Hook React para comunicação real-time
 */
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { TimelineEvent } from '@/lib/websocket/timeline-websocket'
import {
  JoinProjectPayload,
  TrackLockedPayload,
  TrackUnlockedPayload,
  CursorMovePayload,
  TimelineUpdatePayload,
  NotificationPayload,
  UserPresence,
  ActiveUsersPayload,
  UserJoinedPayload,
  UserLeftPayload,
} from '@/lib/websocket/timeline-websocket'

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
  // Connection state
  isConnected: boolean;
  error: Error | null;
  
  // Active users
  activeUsers: UserPresence[];
  
  // Actions
  connect: () => void
  disconnect: () => void
  
  // Events
  lockTrack: (trackId: string) => void
  unlockTrack: (trackId: string) => void
  updateCursor: (trackId: string | undefined, position: { x: number; y: number; time: number }) => void
  updatePresence: (currentTrackId?: string) => void
  broadcastTimelineUpdate: (version: number, changes: Record<string, unknown>) => void
  sendNotification: (notification: Omit<NotificationPayload, 'projectId'>) => void
  
  // Event listeners
  onUserJoined: (callback: (data: UserJoinedPayload) => void) => void
  onUserLeft: (callback: (data: UserLeftPayload) => void) => void
  onTrackLocked: (callback: (data: TrackLockedPayload) => void) => void
  onTrackUnlocked: (callback: (data: TrackUnlockedPayload) => void) => void
  onCursorMove: (callback: (data: CursorMovePayload) => void) => void
  onTimelineUpdated: (callback: (data: TimelineUpdatePayload) => void) => void
  onNotification: (callback: (data: NotificationPayload) => void) => void
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
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [activeUsers, setActiveUsers] = useState<UserPresence[]>([])
  
  // Event listener refs para cleanup
  const listenersRef = useRef<Map<string, Set<(payload: unknown) => void>>>(new Map())

  // Conectar ao WebSocket
  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      console.log('[Timeline Socket] Already connected')
      return
    }

    const socket = io({
      path: '/api/socket/timeline',
      auth: {
        token: 'dev-token', // Em produção, usar JWT real
        userId,
        userName
      },
      transports: ['websocket', 'polling']
    })

    socket.on('connect', () => {
      console.log('[Timeline Socket] Connected')
      setIsConnected(true)
      setError(null)
      
      // Join project room
      socket.emit(TimelineEvent.JOIN_PROJECT, {
        projectId,
        userId,
        userName,
        userImage
      })
      
      onConnected?.()
    })

    socket.on('disconnect', () => {
      console.log('[Timeline Socket] Disconnected')
      setIsConnected(false)
      onDisconnected?.()
    })

    socket.on('connect_error', (err) => {
      console.error('[Timeline Socket] Connection error:', err)
      setError(err)
      setIsConnected(false)
      onError?.(err)
    })

    // Active users list
    socket.on(TimelineEvent.ACTIVE_USERS, ({ users }: ActiveUsersPayload) => {
      console.log('[Timeline Socket] Active users:', users)
      setActiveUsers(users)
    })

    // User joined
    socket.on(TimelineEvent.USER_JOINED, (payload: UserJoinedPayload) => {
      setActiveUsers(prev => {
        const existingUser = prev.find(u => u.userId === payload.userId);
        if (existingUser) {
          return prev.map(u => u.userId === payload.userId ? { ...u, ...payload } : u);
        }
        return [...prev, payload];
      });
    })

    // User left
    socket.on(TimelineEvent.USER_LEFT, ({ userId: leftUserId }: UserLeftPayload) => {
      setActiveUsers(prev => prev.filter(u => u.userId !== leftUserId))
    })

    socketRef.current = socket
  }, [projectId, userId, userName, userImage, onConnected, onDisconnected, onError])

  // Desconectar
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit(TimelineEvent.LEAVE_PROJECT, { projectId })
      socketRef.current.disconnect()
      socketRef.current = null
      setIsConnected(false)
    }
  }, [projectId])

  // Lock track
  const lockTrack = useCallback((trackId: string) => {
    if (!socketRef.current?.connected) return
    
    socketRef.current.emit(TimelineEvent.TRACK_LOCKED, {
      projectId,
      trackId,
      userId,
      userName
    })
  }, [projectId, userId, userName])

  // Unlock track
  const unlockTrack = useCallback((trackId: string) => {
    if (!socketRef.current?.connected) return
    
    socketRef.current.emit(TimelineEvent.TRACK_UNLOCKED, {
      projectId,
      trackId,
      userId
    })
  }, [projectId, userId])

  // Update cursor position (throttled no componente)
  const updateCursor = useCallback((trackId: string | undefined, position: { x: number; y: number; time: number }) => {
    if (!socketRef.current?.connected) return
    
    socketRef.current.emit(TimelineEvent.CURSOR_MOVE, {
      projectId,
      userId,
      trackId,
      position
    })
  }, [projectId, userId])

  // Update presence
  const updatePresence = useCallback((currentTrackId?: string) => {
    if (!socketRef.current?.connected) return
    
    socketRef.current.emit(TimelineEvent.PRESENCE_UPDATE, {
      projectId,
      currentTrackId
    })
  }, [projectId])

  // Broadcast timeline update
  const broadcastTimelineUpdate = useCallback((version: number, changes: Record<string, unknown>) => {
    if (!socketRef.current?.connected) return
    
    socketRef.current.emit(TimelineEvent.TIMELINE_UPDATED, {
      projectId,
      userId,
      version,
      changes
    })
  }, [projectId, userId])

  // Send notification
  const sendNotification = useCallback((notification: Omit<NotificationPayload, 'projectId'>) => {
    if (!socketRef.current?.connected) return
    
    socketRef.current.emit(TimelineEvent.NOTIFICATION, {
      ...notification,
      projectId
    })
  }, [projectId])

  // Event listeners
  const addEventListener = useCallback(<T>(event: string, callback: (data: T) => void) => {
    if (!socketRef.current) {
      return
    }

    const listener = (payload: unknown) => {
      callback(payload as T)
    }

    socketRef.current.on(event, listener)

    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set())
    }

    listenersRef.current.get(event)!.add(listener)
  }, [])

  const onUserJoined = useCallback((callback: (data: UserJoinedPayload) => void) => {
    addEventListener(TimelineEvent.USER_JOINED, callback)
  }, [addEventListener])

  const onUserLeft = useCallback((callback: (data: UserLeftPayload) => void) => {
    addEventListener(TimelineEvent.USER_LEFT, callback)
  }, [addEventListener])

  const onTrackLocked = useCallback((callback: (data: TrackLockedPayload) => void) => {
    addEventListener(TimelineEvent.TRACK_LOCKED, callback)
  }, [addEventListener])

  const onTrackUnlocked = useCallback((callback: (data: TrackUnlockedPayload) => void) => {
    addEventListener(TimelineEvent.TRACK_UNLOCKED, callback)
  }, [addEventListener])

  const onCursorMove = useCallback((callback: (data: CursorMovePayload) => void) => {
    addEventListener(TimelineEvent.CURSOR_MOVE, callback)
  }, [addEventListener])

  const onTimelineUpdated = useCallback((callback: (data: TimelineUpdatePayload) => void) => {
    addEventListener(TimelineEvent.TIMELINE_UPDATED, callback)
  }, [addEventListener])

  const onNotification = useCallback((callback: (data: NotificationPayload) => void) => {
    addEventListener(TimelineEvent.NOTIFICATION, callback)
  }, [addEventListener])

  // Auto-connect
  useEffect(() => {
    if (autoConnect) {
      connect()
    }

    return () => {
      // Cleanup listeners
      listenersRef.current.forEach((handlers, event) => {
        handlers.forEach(handler => {
          socketRef.current?.off(event, handler)
        })
      })
      listenersRef.current.clear()
      
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
