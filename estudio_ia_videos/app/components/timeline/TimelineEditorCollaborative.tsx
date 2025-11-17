/**
 * Exemplo de Componente usando Timeline WebSocket
 * Timeline Editor com colaboração em tempo real
 */
'use client'

import { useEffect, useState } from 'react'
import { useTimelineSocket, useThrottledCursor } from '@/hooks/useTimelineSocket'

interface TimelineEditorProps {
  projectId: string
  userId: string
  userName: string
  userImage?: string
}

export default function TimelineEditorCollaborative({
  projectId,
  userId,
  userName,
  userImage
}: TimelineEditorProps) {
  const [lockedTracks, setLockedTracks] = useState<Map<string, { userId: string; userName: string }>>(new Map())
  const [notifications, setNotifications] = useState<any[]>([])
  const [userCursors, setUserCursors] = useState<Map<string, any>>(new Map())

  // Inicializar WebSocket
  const socket = useTimelineSocket({
    projectId,
    userId,
    userName,
    userImage,
    autoConnect: true,
    onConnected: () => {
      console.log('✅ Connected to timeline collaboration')
      addNotification('success', 'Conectado ao modo colaborativo')
    },
    onDisconnected: () => {
      console.log('❌ Disconnected from timeline')
      addNotification('warning', 'Desconectado do modo colaborativo')
    },
    onError: (error) => {
      console.error('WebSocket error:', error)
      addNotification('error', `Erro: ${error.message}`)
    }
  })

  // Throttled cursor update (100ms)
  const throttledCursorUpdate = useThrottledCursor(socket.updateCursor, 100)

  // Adicionar notificação local
  const addNotification = (type: string, message: string) => {
    const notification = { type, message, id: Date.now() }
    setNotifications(prev => [notification, ...prev].slice(0, 5))
    
    // Remover após 5s
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id))
    }, 5000)
  }

  // Event Listeners
  useEffect(() => {
    // Usuário entrou
    socket.onUserJoined((data) => {
      console.log(`👤 ${data.userName} entrou no projeto`)
      addNotification('info', `${data.userName} entrou no projeto`)
    })

    // Usuário saiu
    socket.onUserLeft((data) => {
      console.log(`👋 ${data.userName} saiu do projeto`)
      addNotification('info', `${data.userName} saiu do projeto`)
      
      // Remover locks do usuário que saiu
      setLockedTracks(prev => {
        const newMap = new Map(prev)
        for (const [trackId, lock] of newMap.entries()) {
          if (lock.userId === data.userId) {
            newMap.delete(trackId)
          }
        }
        return newMap
      })
    })

    // Track bloqueada
    socket.onTrackLocked((data) => {
      console.log(`🔒 Track ${data.trackId} bloqueada por ${data.userName}`)
      setLockedTracks(prev => new Map(prev).set(data.trackId, {
        userId: data.userId,
        userName: data.userName
      }))
      
      if (data.userId !== userId) {
        addNotification('warning', `${data.userName} bloqueou uma track`)
      }
    })

    // Track desbloqueada
    socket.onTrackUnlocked((data) => {
      console.log(`🔓 Track ${data.trackId} desbloqueada`)
      setLockedTracks(prev => {
        const newMap = new Map(prev)
        newMap.delete(data.trackId)
        return newMap
      })
    })

    // Cursor de outro usuário
    socket.onCursorMove((data) => {
      if (data.userId !== userId) {
        setUserCursors(prev => new Map(prev).set(data.userId, data.position))
        
        // Remover cursor após 2s de inatividade
        setTimeout(() => {
          setUserCursors(prev => {
            const newMap = new Map(prev)
            newMap.delete(data.userId)
            return newMap
          })
        }, 2000)
      }
    })

    // Timeline atualizada
    socket.onTimelineUpdated((data) => {
      if (data.userId !== userId) {
        console.log(`📝 Timeline atualizada (v${data.version}) por outro usuário`)
        addNotification('info', 'Timeline atualizada por outro usuário')
        
        // Aqui você recarregaria a timeline do servidor
        // await refetchTimeline()
      }
    })

    // Notificações
    socket.onNotification((data) => {
      addNotification(data.type, data.message)
    })
  }, [socket, userId])

  // Handlers de ações do usuário
  const handleLockTrack = (trackId: string) => {
    const lock = lockedTracks.get(trackId)
    
    if (lock && lock.userId !== userId) {
      addNotification('error', `Track bloqueada por ${lock.userName}`)
      return
    }
    
    socket.lockTrack(trackId)
    addNotification('success', 'Track bloqueada')
  }

  const handleUnlockTrack = (trackId: string) => {
    socket.unlockTrack(trackId)
    addNotification('success', 'Track desbloqueada')
  }

  const handleMouseMove = (e: React.MouseEvent, trackId?: string) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const time = (x / rect.width) * 100 // Timeline time in seconds
    
    throttledCursorUpdate(trackId, { x, y, time })
  }

  const handleTimelineUpdate = (changes: unknown) => {
    // Atualizar timeline localmente
    // await updateTimeline(changes)
    
    // Broadcast para outros usuários
    socket.broadcastTimelineUpdate(1, changes)
  }

  return (
    <div className="timeline-editor">
      {/* Header com status de conexão */}
      <div className="flex items-center justify-between p-4 bg-gray-900 text-white">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${socket.isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="font-medium">
            {socket.isConnected ? 'Colaboração Ativa' : 'Desconectado'}
          </span>
        </div>
        
        {/* Usuários ativos */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">
            {socket.activeUsers.length} online
          </span>
          {socket.activeUsers.slice(0, 5).map((userId) => (
            <div
              key={userId}
              className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs"
              title={userId}
            >
              {userId.charAt(0).toUpperCase()}
            </div>
          ))}
        </div>
      </div>

      {/* Notificações */}
      <div className="fixed top-20 right-4 z-50 space-y-2">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={`p-3 rounded-lg shadow-lg ${
              notif.type === 'success' ? 'bg-green-500' :
              notif.type === 'error' ? 'bg-red-500' :
              notif.type === 'warning' ? 'bg-yellow-500' :
              'bg-blue-500'
            } text-white animate-slide-in`}
          >
            {notif.message}
          </div>
        ))}
      </div>

      {/* Timeline Canvas */}
      <div
        className="timeline-canvas relative bg-gray-800 h-[600px]"
        onMouseMove={(e) => handleMouseMove(e)}
      >
        {/* Cursores de outros usuários */}
        {Array.from(userCursors.entries()).map(([userId, position]) => (
          <div
            key={userId}
            className="absolute w-4 h-4 bg-blue-500 rounded-full pointer-events-none"
            style={{
              left: position.x,
              top: position.y,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <span className="absolute top-5 left-0 text-xs bg-blue-500 text-white px-2 py-1 rounded whitespace-nowrap">
              {userId}
            </span>
          </div>
        ))}

        {/* Tracks (exemplo) */}
        <div className="p-4 space-y-2">
          {['track1', 'track2', 'track3'].map((trackId) => {
            const lock = lockedTracks.get(trackId)
            const isLocked = !!lock
            const isLockedByMe = lock?.userId === userId

            return (
              <div
                key={trackId}
                className={`p-4 rounded-lg ${
                  isLocked
                    ? isLockedByMe
                      ? 'bg-blue-600 border-2 border-blue-400'
                      : 'bg-red-600 border-2 border-red-400'
                    : 'bg-gray-700 hover:bg-gray-600'
                } transition-colors`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">{trackId}</span>
                  
                  <div className="flex items-center gap-2">
                    {isLocked && (
                      <span className="text-sm text-white">
                        {isLockedByMe ? '🔒 Você' : `🔒 ${lock.userName}`}
                      </span>
                    )}
                    
                    {!isLocked && (
                      <button
                        onClick={() => handleLockTrack(trackId)}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        Bloquear
                      </button>
                    )}
                    
                    {isLockedByMe && (
                      <button
                        onClick={() => handleUnlockTrack(trackId)}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                      >
                        Desbloquear
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="p-4 bg-gray-900 text-white font-mono text-xs">
          <div>Connected: {socket.isConnected ? 'Yes' : 'No'}</div>
          <div>Active Users: {socket.activeUsers.length}</div>
          <div>Locked Tracks: {lockedTracks.size}</div>
          <div>Cursors: {userCursors.size}</div>
        </div>
      )}
    </div>
  )
}
