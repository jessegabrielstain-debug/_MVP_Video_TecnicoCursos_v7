
'use client'

/**
 * 👥 COLLABORATION CURSORS - Sprint 44
 * Sistema de presença e cursores em tempo real
 */

import React, { useEffect, useState, useRef } from 'react'
import { logger } from '@/lib/logger';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Badge } from '../ui/badge'
import { io, Socket } from 'socket.io-client'
import { motion, AnimatePresence } from 'framer-motion'

interface User {
  id: string
  name: string
  email: string
  avatar?: string
  color: string
}

interface Cursor {
  userId: string
  user: User
  x: number
  y: number
  slideId?: string
}

interface Selection {
  userId: string
  user: User
  slideId: string
  elementId?: string
}

export default function CollaborationCursors({ 
  projectId, 
  currentUser 
}: { 
  projectId: string
  currentUser: User
}) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [activeCursors, setActiveCursors] = useState<Map<string, Cursor>>(new Map())
  const [activeUsers, setActiveUsers] = useState<User[]>([])
  const [selections, setSelections] = useState<Map<string, Selection>>(new Map())
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Connect to Socket.IO
    const newSocket = io({
      path: '/api/socket',
      addTrailingSlash: false
    })

    newSocket.on('connect', () => {
      logger.info('Socket conectado', { component: 'CollaborationCursors' });
      newSocket.emit('join-project', { projectId, user: currentUser })
    })

    newSocket.on('user-joined', (user: User) => {
      setActiveUsers(prev => [...prev.filter(u => u.id !== user.id), user])
    })

    newSocket.on('user-left', (userId: string) => {
      setActiveUsers(prev => prev.filter(u => u.id !== userId))
      setActiveCursors(prev => {
        const newMap = new Map(prev)
        newMap.delete(userId)
        return newMap
      })
    })

    newSocket.on('cursor-move', (data: Cursor) => {
      if (data.userId !== currentUser.id) {
        setActiveCursors(prev => new Map(prev).set(data.userId, data))
      }
    })

    newSocket.on('selection-change', (data: Selection) => {
      if (data.userId !== currentUser.id) {
        setSelections(prev => new Map(prev).set(data.userId, data))
      }
    })

    setSocket(newSocket)

    return () => {
      newSocket.emit('leave-project', projectId)
      newSocket.close()
    }
  }, [projectId, currentUser])

  useEffect(() => {
    if (!socket || !containerRef.current) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = containerRef.current!.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100

      socket.emit('cursor-move', {
        projectId,
        x,
        y,
        userId: currentUser.id
      })
    }

    const container = containerRef.current
    container.addEventListener('mousemove', handleMouseMove)

    return () => {
      container.removeEventListener('mousemove', handleMouseMove)
    }
  }, [socket, projectId, currentUser])

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div ref={containerRef} className="relative w-full h-full">
      {/* Active Users Bar */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
        <div className="flex -space-x-2">
          <Avatar className="h-8 w-8 border-2 border-white">
            <AvatarFallback style={{ backgroundColor: currentUser.color }}>
              {getInitials(currentUser.name)}
            </AvatarFallback>
            {currentUser.avatar && <AvatarImage src={currentUser.avatar} />}
          </Avatar>
          {activeUsers.slice(0, 5).map((user) => (
            <Avatar key={user.id} className="h-8 w-8 border-2 border-white">
              <AvatarFallback style={{ backgroundColor: user.color }}>
                {getInitials(user.name)}
              </AvatarFallback>
              {user.avatar && <AvatarImage src={user.avatar} />}
            </Avatar>
          ))}
        </div>
        <Badge variant="secondary">
          {activeUsers.length + 1} online
        </Badge>
      </div>

      {/* Remote Cursors */}
      <AnimatePresence>
        {Array.from(activeCursors.values()).map((cursor) => (
          <motion.div
            key={cursor.userId}
            className="absolute pointer-events-none z-40"
            style={{
              left: `${cursor.x}%`,
              top: `${cursor.y}%`
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            {/* Cursor */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ color: cursor.user.color }}
            >
              <path
                d="M5 5L19 12L12 13L10 19L5 5Z"
                fill="currentColor"
                stroke="white"
                strokeWidth="2"
              />
            </svg>
            
            {/* Name Label */}
            <div
              className="absolute top-6 left-6 px-2 py-1 rounded text-xs font-medium text-white whitespace-nowrap shadow-lg"
              style={{ backgroundColor: cursor.user.color }}
            >
              {cursor.user.name}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Selection Indicators */}
      {Array.from(selections.values()).map((selection) => (
        <div
          key={selection.userId}
          className="absolute border-2 rounded pointer-events-none"
          style={{
            borderColor: selection.user.color,
            boxShadow: `0 0 0 2px ${selection.user.color}33`
          }}
        >
          <Badge
            className="absolute -top-6 left-0"
            style={{ backgroundColor: selection.user.color }}
          >
            {selection.user.name} editando
          </Badge>
        </div>
      ))}
    </div>
  )
}
