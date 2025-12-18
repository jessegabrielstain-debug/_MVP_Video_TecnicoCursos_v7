import { logger } from '@/lib/logger';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';

/**
 * WebSocket Server - Implementação Real com Socket.IO
 * Servidor WebSocket para notificações e colaboração em tempo real
 */

export interface WebSocketMessage {
  type: string;
  data: unknown;
  timestamp: Date;
}

interface UserConnection {
  socket: Socket;
  userId: string;
  rooms: Set<string>;
  connectedAt: Date;
}

export class WebSocketServer {
  private io: SocketIOServer | null = null;
  private connections: Map<string, UserConnection> = new Map();
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set<socketId>
  
  initialize(server: HTTPServer): void {
    if (this.io) {
      logger.warn('[WebSocket] Server already initialized', { component: 'WebSocketServer' });
      return;
    }

    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || '*',
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
    logger.info('[WebSocket] Server initialized', { component: 'WebSocketServer' });
  }

  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket: Socket) => {
      logger.info('[WebSocket] Client connected', { socketId: socket.id, component: 'WebSocketServer' });

      // Autenticação do usuário
      socket.on('auth', (data: { userId: string; token?: string }) => {
        const { userId } = data;
        
        // Registrar conexão
        this.connections.set(socket.id, {
          socket,
          userId,
          rooms: new Set(),
          connectedAt: new Date()
        });

        // Mapear userId -> socketId
        if (!this.userSockets.has(userId)) {
          this.userSockets.set(userId, new Set());
        }
        this.userSockets.get(userId)!.add(socket.id);

        logger.info('[WebSocket] User authenticated', { userId, socketId: socket.id, component: 'WebSocketServer' });
        socket.emit('authenticated', { success: true });
      });

      // Join room (para colaboração em projetos/documentos)
      socket.on('join-room', (roomId: string) => {
        const connection = this.connections.get(socket.id);
        if (connection) {
          socket.join(roomId);
          connection.rooms.add(roomId);
          logger.info('[WebSocket] User joined room', { 
            userId: connection.userId, 
            roomId, 
            component: 'WebSocketServer' 
          });
          
          // Notificar outros usuários na sala
          socket.to(roomId).emit('user-joined', { 
            userId: connection.userId, 
            timestamp: new Date() 
          });
        }
      });

      // Leave room
      socket.on('leave-room', (roomId: string) => {
        const connection = this.connections.get(socket.id);
        if (connection) {
          socket.leave(roomId);
          connection.rooms.delete(roomId);
          logger.info('[WebSocket] User left room', { 
            userId: connection.userId, 
            roomId, 
            component: 'WebSocketServer' 
          });
          
          // Notificar outros usuários na sala
          socket.to(roomId).emit('user-left', { 
            userId: connection.userId, 
            timestamp: new Date() 
          });
        }
      });

      // Desconexão
      socket.on('disconnect', () => {
        const connection = this.connections.get(socket.id);
        if (connection) {
          const { userId, rooms } = connection;
          
          // Remover mapeamento userId -> socketId
          const userSocketSet = this.userSockets.get(userId);
          if (userSocketSet) {
            userSocketSet.delete(socket.id);
            if (userSocketSet.size === 0) {
              this.userSockets.delete(userId);
            }
          }

          // Notificar salas que o usuário deixou
          rooms.forEach(roomId => {
            socket.to(roomId).emit('user-left', { 
              userId, 
              timestamp: new Date() 
            });
          });

          this.connections.delete(socket.id);
          logger.info('[WebSocket] Client disconnected', { userId, socketId: socket.id, component: 'WebSocketServer' });
        }
      });
    });
  }
  
  broadcast(message: WebSocketMessage): void {
    if (!this.io) {
      logger.warn('[WebSocket] Server not initialized, cannot broadcast', { component: 'WebSocketServer' });
      return;
    }

    logger.info('[WebSocket] Broadcasting message', { type: message.type, component: 'WebSocketServer' });
    this.io.emit(message.type, message.data);
  }
  
  sendToUser(userId: string, message: WebSocketMessage): void {
    if (!this.io) {
      logger.warn('[WebSocket] Server not initialized, cannot send to user', { component: 'WebSocketServer' });
      return;
    }

    const socketIds = this.userSockets.get(userId);
    if (!socketIds || socketIds.size === 0) {
      logger.warn('[WebSocket] User not connected', { userId, component: 'WebSocketServer' });
      return;
    }

    // Enviar para todas as conexões do usuário (pode ter múltiplas abas/dispositivos)
    socketIds.forEach(socketId => {
      const connection = this.connections.get(socketId);
      if (connection) {
        connection.socket.emit(message.type, message.data);
      }
    });

    logger.info('[WebSocket] Message sent to user', { userId, type: message.type, component: 'WebSocketServer' });
  }
  
  sendNotificationToUser(userId: string, notification: Record<string, unknown>): void {
    this.sendToUser(userId, { 
      type: 'notification', 
      data: notification, 
      timestamp: new Date() 
    });
  }
  
  sendNotificationToRoom(roomId: string, notification: Record<string, unknown>): void {
    if (!this.io) {
      logger.warn('[WebSocket] Server not initialized, cannot send to room', { component: 'WebSocketServer' });
      return;
    }

    logger.info('[WebSocket] Sending notification to room', { roomId, component: 'WebSocketServer' });
    this.io.to(roomId).emit('notification', notification);
  }
  
  getConnectionCount(): number {
    return this.connections.size;
  }

  getUserConnectionCount(userId: string): number {
    return this.userSockets.get(userId)?.size || 0;
  }

  getRoomUsers(roomId: string): string[] {
    const users: string[] = [];
    this.connections.forEach(connection => {
      if (connection.rooms.has(roomId)) {
        users.push(connection.userId);
      }
    });
    return [...new Set(users)]; // Remover duplicatas
  }

  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId) && this.userSockets.get(userId)!.size > 0;
  }
}

export const websocketServer = new WebSocketServer();

export function getWebSocketServer(): WebSocketServer {
  return websocketServer;
}

export function createWebSocketServer(): WebSocketServer {
  return websocketServer;
}
