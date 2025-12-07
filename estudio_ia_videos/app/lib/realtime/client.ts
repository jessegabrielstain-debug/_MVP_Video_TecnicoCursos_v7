import { useEffect, useState } from 'react'

export interface OnlineUser {
  id: string
  name: string
  email?: string
  avatar?: string
  color: string
  slideId?: string
  cursor?: {
    x: number
    y: number
  }
}

interface UseRealtimeProps {
  projectId: string
  user: {
    id: string
    name: string
    email?: string
    avatar?: string
    color: string
  }
  enabled?: boolean
}

export function useRealtime({ projectId, user, enabled = true }: UseRealtimeProps) {
  const [connected, setConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])

  useEffect(() => {
    if (!enabled) {
      setConnected(false)
      setOnlineUsers([])
      return
    }

    // Mock connection
    setConnected(true)
    
    // In a real implementation, this would connect to Supabase Realtime or similar
    // and listen for presence changes.
    
    return () => {
      setConnected(false)
    }
  }, [projectId, enabled])

  return {
    connected,
    onlineUsers
  }
}
