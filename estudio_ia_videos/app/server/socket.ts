
/**
 * Socket.IO Server Setup
 * This file should be imported in custom server or middleware
 */

import { Server as SocketIOServer, Socket } from 'socket.io'
import { Server as HTTPServer } from 'http'
import { SocketUser, CursorMoveData, SelectionChangeData } from '../lib/websocket/types'

export function setupSocketIO(server: HTTPServer) {
  const io = new SocketIOServer(server, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      methods: ['GET', 'POST']
    }
  })

  // Mapa de projeto -> Set de socket IDs
  const projectRooms = new Map<string, Set<string>>()
  // Mapa de socket ID -> dados do usuário
  const socketUsers = new Map<string, { userId: string; userName: string; projectId: string }>()

  io.on('connection', (socket: Socket) => {
    console.log('✓ Socket conectado:', socket.id)

    socket.on('join-project', async ({ projectId, user }: { projectId: string; user: SocketUser }) => {
      const room = `project:${projectId}`
      socket.join(room)

      if (!projectRooms.has(projectId)) {
        projectRooms.set(projectId, new Set())
      }
      projectRooms.get(projectId)!.add(socket.id)
      socketUsers.set(socket.id, { userId: user.userId, userName: user.userName, projectId })

      // Atualizar presença no banco de dados
      try {
        const { prisma } = await import('@/lib/prisma');
        await prisma.timelinePresence.upsert({
          where: {
            projectId_userId: {
              projectId,
              userId: user.userId
            }
          },
          update: {
            lastSeenAt: new Date()
          },
          create: {
            projectId,
            userId: user.userId,
            lastSeenAt: new Date()
          }
        });
      } catch (error) {
        console.error('Erro ao atualizar presença:', error);
      }

      // Notify others
      socket.to(room).emit('user-joined', user)

      // Enviar lista de usuários ativos para o novo usuário
      const activeUsers = Array.from(socketUsers.values())
        .filter(su => su.projectId === projectId)
        .map(su => ({
          id: su.userId,
          name: su.userName
        }));
      
      socket.emit('active-users', activeUsers);

      // Send current users count to all
      const userCount = projectRooms.get(projectId)!.size
      io.to(room).emit('room-users-count', userCount)
    })

    socket.on('leave-project', async (projectId: string) => {
      const room = `project:${projectId}`
      socket.leave(room)

      const userData = socketUsers.get(socket.id);
      if (projectRooms.has(projectId)) {
        projectRooms.get(projectId)!.delete(socket.id)
      }
      socketUsers.delete(socket.id);

      // Notificar outros usuários
      if (userData) {
        socket.to(room).emit('user-left', { userId: userData.userId, socketId: socket.id })
      } else {
        socket.to(room).emit('user-left', { socketId: socket.id })
      }

      // Atualizar contagem de usuários
      const userCount = projectRooms.get(projectId)?.size || 0
      io.to(room).emit('room-users-count', userCount)
    })

    socket.on('cursor-move', (data: CursorMoveData & { projectId: string }) => {
      const room = `project:${data.projectId}`
      socket.to(room).emit('cursor-move', {
        ...data,
        socketId: socket.id
      })
    })

    socket.on('selection-change', (data: SelectionChangeData & { projectId: string }) => {
      const room = `project:${data.projectId}`
      socket.to(room).emit('selection-change', data)
    })

    socket.on('comment', (data: { projectId: string; comment: unknown }) => {
      const room = `project:${data.projectId}`
      io.to(room).emit('new-comment', data.comment)
    })

    socket.on('timeline-update', (data: { projectId: string; timeline: unknown }) => {
      const room = `project:${data.projectId}`
      socket.to(room).emit('timeline-updated', data.timeline)
    })

    socket.on('disconnect', async () => {
      console.log('Socket desconectado:', socket.id)
      
      const userData = socketUsers.get(socket.id);
      
      // Remove from all rooms
      projectRooms.forEach((sockets, projectId) => {
        if (sockets.has(socket.id)) {
          sockets.delete(socket.id)
          
          // Notificar outros usuários
          if (userData) {
            io.to(`project:${projectId}`).emit('user-left', { userId: userData.userId, socketId: socket.id })
          } else {
            io.to(`project:${projectId}`).emit('user-left', { socketId: socket.id })
          }
          
          // Atualizar contagem
          const userCount = sockets.size
          io.to(`project:${projectId}`).emit('room-users-count', userCount)
        }
      })
      
      // Limpar dados do usuário
      socketUsers.delete(socket.id);
    })
  })

  console.log('✓ Socket.IO server configurado')
  return io
}
