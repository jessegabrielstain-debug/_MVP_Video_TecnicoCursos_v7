/**
 * @jest-environment node
 */
/**
 * Testes Unitários - WebSocket Server
 * 
 * Testa:
 * - Conexão e autenticação
 * - Join/Leave de rooms
 * - Lock/Unlock de tracks
 * - Eventos de presence
 * - Broadcast para projeto
 * - Cleanup ao desconectar
 */

import { createServer, Server as HttpServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client'
import { AddressInfo } from 'net'
import { initializeWebSocket, TimelineEvent } from '@/lib/websocket/timeline-websocket'

describe('WebSocket Server - Testes Unitários', () => {
  let httpServer: HttpServer
  let io: SocketIOServer
  let serverUrl: string
  let clientSocket1: ClientSocket
  let clientSocket2: ClientSocket
  let clientSocket3: ClientSocket

  // Setup antes de todos os testes
  beforeAll((done) => {
    httpServer = createServer()
    io = initializeWebSocket(httpServer)

    httpServer.listen(() => {
      const port = (httpServer.address() as AddressInfo).port
      serverUrl = `http://localhost:${port}`
      done()
    })
  })

  // Cleanup após todos os testes
  afterAll((done) => {
    io.close()
    httpServer.close(done)
  })

  // Cleanup após cada teste
  afterEach(() => {
    if (clientSocket1?.connected) clientSocket1.disconnect()
    if (clientSocket2?.connected) clientSocket2.disconnect()
    if (clientSocket3?.connected) clientSocket3.disconnect()
  })

  // ========================================
  // 1. TESTES DE CONEXÃO
  // ========================================

  describe('Conexão e Autenticação', () => {
    it('deve conectar com autenticação válida', (done) => {
      clientSocket1 = ioClient(serverUrl, {
        path: '/api/socket/timeline',
        auth: {
          token: 'test-token',
          userId: 'user_1',
          userName: 'Test User 1'
        }
      })

      clientSocket1.on('connect', () => {
        expect(clientSocket1.connected).toBe(true)
        done()
      })

      clientSocket1.on('connect_error', (error) => {
        done(error)
      })
    })

    it('deve receber evento de boas-vindas ao conectar', (done) => {
      clientSocket1 = ioClient(serverUrl, {
        path: '/api/socket/timeline',
        auth: {
          token: 'test-token',
          userId: 'user_1',
          userName: 'Test User 1'
        }
      })

      clientSocket1.on('connect', () => {
        clientSocket1.emit(TimelineEvent.JOIN_PROJECT, {
          projectId: 'proj_test_1'
        })
      })

      clientSocket1.on(TimelineEvent.USER_JOINED, (data) => {
        expect(data.userId).toBe('user_1')
        expect(data.userName).toBe('Test User 1')
        expect(data.projectId).toBe('proj_test_1')
        done()
      })
    })

    it('deve desconectar corretamente', (done) => {
      clientSocket1 = ioClient(serverUrl, {
        path: '/api/socket/timeline',
        auth: {
          token: 'test-token',
          userId: 'user_1',
          userName: 'Test User 1'
        }
      })

      clientSocket1.on('connect', () => {
        clientSocket1.disconnect()
      })

      clientSocket1.on('disconnect', () => {
        expect(clientSocket1.connected).toBe(false)
        done()
      })
    })
  })

  // ========================================
  // 2. TESTES DE ROOM MANAGEMENT
  // ========================================

  describe('Room Management', () => {
    it('deve entrar em room de projeto', (done) => {
      clientSocket1 = ioClient(serverUrl, {
        path: '/api/socket/timeline',
        auth: {
          token: 'test-token',
          userId: 'user_1',
          userName: 'User 1'
        }
      })

      clientSocket1.on('connect', () => {
        clientSocket1.emit(TimelineEvent.JOIN_PROJECT, {
          projectId: 'proj_test_1'
        })
      })

      clientSocket1.on(TimelineEvent.ACTIVE_USERS, (data) => {
        expect(data.users).toContain('user_1')
        expect(data.projectId).toBe('proj_test_1')
        done()
      })
    })

    it('deve notificar outros usuários quando entrar no projeto', (done) => {
      let user1Connected = false
      let user2Notified = false

      // User 1 conecta primeiro
      clientSocket1 = ioClient(serverUrl, {
        path: '/api/socket/timeline',
        auth: {
          token: 'test-token',
          userId: 'user_1',
          userName: 'User 1'
        }
      })

      clientSocket1.on('connect', () => {
        clientSocket1.emit(TimelineEvent.JOIN_PROJECT, {
          projectId: 'proj_test_1'
        })
        user1Connected = true

        // User 2 conecta depois
        clientSocket2 = ioClient(serverUrl, {
          path: '/api/socket/timeline',
          auth: {
            token: 'test-token',
            userId: 'user_2',
            userName: 'User 2'
          }
        })

        clientSocket2.on('connect', () => {
          clientSocket2.emit(TimelineEvent.JOIN_PROJECT, {
            projectId: 'proj_test_1'
          })
        })
      })

      // User 1 recebe notificação de User 2 entrando
      clientSocket1.on(TimelineEvent.USER_JOINED, (data) => {
        if (data.userId === 'user_2') {
          expect(data.userName).toBe('User 2')
          expect(data.projectId).toBe('proj_test_1')
          user2Notified = true

          if (user1Connected && user2Notified) {
            done()
          }
        }
      })
    })

    it('deve sair de room de projeto', (done) => {
      clientSocket1 = ioClient(serverUrl, {
        path: '/api/socket/timeline',
        auth: {
          token: 'test-token',
          userId: 'user_1',
          userName: 'User 1'
        }
      })

      clientSocket1.on('connect', () => {
        clientSocket1.emit(TimelineEvent.JOIN_PROJECT, {
          projectId: 'proj_test_1'
        })

        setTimeout(() => {
          clientSocket1.emit(TimelineEvent.LEAVE_PROJECT, {
            projectId: 'proj_test_1'
          })
        }, 100)
      })

      clientSocket1.on(TimelineEvent.USER_LEFT, (data) => {
        expect(data.userId).toBe('user_1')
        expect(data.projectId).toBe('proj_test_1')
        done()
      })
    })

    it('deve isolar eventos por projeto (rooms diferentes)', (done) => {
      let receivedEvents = 0

      // User 1 no projeto A
      clientSocket1 = ioClient(serverUrl, {
        path: '/api/socket/timeline',
        auth: {
          token: 'test-token',
          userId: 'user_1',
          userName: 'User 1'
        }
      })

      // User 2 no projeto B
      clientSocket2 = ioClient(serverUrl, {
        path: '/api/socket/timeline',
        auth: {
          token: 'test-token',
          userId: 'user_2',
          userName: 'User 2'
        }
      })

      clientSocket1.on('connect', () => {
        clientSocket1.emit(TimelineEvent.JOIN_PROJECT, {
          projectId: 'proj_A'
        })
      })

      clientSocket2.on('connect', () => {
        clientSocket2.emit(TimelineEvent.JOIN_PROJECT, {
          projectId: 'proj_B'
        })

        // User 2 bloqueia track no projeto B
        setTimeout(() => {
          clientSocket2.emit(TimelineEvent.TRACK_LOCKED, {
            trackId: 'track_1',
            userId: 'user_2',
            userName: 'User 2',
            projectId: 'proj_B'
          })
        }, 200)
      })

      // User 1 NÃO deve receber evento de projeto B
      clientSocket1.on(TimelineEvent.TRACK_LOCKED, (data) => {
        receivedEvents++
      })

      // Verificar depois de 500ms que nenhum evento foi recebido
      setTimeout(() => {
        expect(receivedEvents).toBe(0)
        done()
      }, 500)
    })
  })

  // ========================================
  // 3. TESTES DE LOCK/UNLOCK
  // ========================================

  describe('Lock/Unlock de Tracks', () => {
    it('deve bloquear track e notificar outros usuários', (done) => {
      clientSocket1 = ioClient(serverUrl, {
        path: '/api/socket/timeline',
        auth: {
          token: 'test-token',
          userId: 'user_1',
          userName: 'User 1'
        }
      })

      clientSocket2 = ioClient(serverUrl, {
        path: '/api/socket/timeline',
        auth: {
          token: 'test-token',
          userId: 'user_2',
          userName: 'User 2'
        }
      })

      let bothConnected = 0

      const checkBothConnected = () => {
        bothConnected++
        if (bothConnected === 2) {
          // Ambos conectados, User 1 bloqueia track
          clientSocket1.emit(TimelineEvent.TRACK_LOCKED, {
            trackId: 'track_video_1',
            userId: 'user_1',
            userName: 'User 1',
            projectId: 'proj_test_1'
          })
        }
      }

      clientSocket1.on('connect', () => {
        clientSocket1.emit(TimelineEvent.JOIN_PROJECT, {
          projectId: 'proj_test_1'
        })
        checkBothConnected()
      })

      clientSocket2.on('connect', () => {
        clientSocket2.emit(TimelineEvent.JOIN_PROJECT, {
          projectId: 'proj_test_1'
        })
        checkBothConnected()
      })

      // User 2 recebe notificação de lock
      clientSocket2.on(TimelineEvent.TRACK_LOCKED, (data) => {
        expect(data.trackId).toBe('track_video_1')
        expect(data.userId).toBe('user_1')
        expect(data.userName).toBe('User 1')
        expect(data.projectId).toBe('proj_test_1')
        done()
      })
    })

    it('deve desbloquear track e notificar outros usuários', (done) => {
      clientSocket1 = ioClient(serverUrl, {
        path: '/api/socket/timeline',
        auth: {
          token: 'test-token',
          userId: 'user_1',
          userName: 'User 1'
        }
      })

      clientSocket2 = ioClient(serverUrl, {
        path: '/api/socket/timeline',
        auth: {
          token: 'test-token',
          userId: 'user_2',
          userName: 'User 2'
        }
      })

      let bothConnected = 0

      const checkBothConnected = () => {
        bothConnected++
        if (bothConnected === 2) {
          // User 1 desbloqueia track
          clientSocket1.emit(TimelineEvent.TRACK_UNLOCKED, {
            trackId: 'track_video_1',
            userId: 'user_1',
            userName: 'User 1',
            projectId: 'proj_test_1'
          })
        }
      }

      clientSocket1.on('connect', () => {
        clientSocket1.emit(TimelineEvent.JOIN_PROJECT, {
          projectId: 'proj_test_1'
        })
        checkBothConnected()
      })

      clientSocket2.on('connect', () => {
        clientSocket2.emit(TimelineEvent.JOIN_PROJECT, {
          projectId: 'proj_test_1'
        })
        checkBothConnected()
      })

      // User 2 recebe notificação de unlock
      clientSocket2.on(TimelineEvent.TRACK_UNLOCKED, (data) => {
        expect(data.trackId).toBe('track_video_1')
        expect(data.userId).toBe('user_1')
        expect(data.projectId).toBe('proj_test_1')
        done()
      })
    })
  })

  // ========================================
  // 4. TESTES DE PRESENCE
  // ========================================

  describe('Presence e Cursores', () => {
    it('deve enviar cursor position e outros receberem', (done) => {
      clientSocket1 = ioClient(serverUrl, {
        path: '/api/socket/timeline',
        auth: {
          token: 'test-token',
          userId: 'user_1',
          userName: 'User 1'
        }
      })

      clientSocket2 = ioClient(serverUrl, {
        path: '/api/socket/timeline',
        auth: {
          token: 'test-token',
          userId: 'user_2',
          userName: 'User 2'
        }
      })

      let bothConnected = 0

      const checkBothConnected = () => {
        bothConnected++
        if (bothConnected === 2) {
          // User 1 move cursor
          clientSocket1.emit(TimelineEvent.CURSOR_MOVE, {
            userId: 'user_1',
            userName: 'User 1',
            trackId: 'track_video_1',
            position: { x: 100, y: 200 },
            projectId: 'proj_test_1'
          })
        }
      }

      clientSocket1.on('connect', () => {
        clientSocket1.emit(TimelineEvent.JOIN_PROJECT, {
          projectId: 'proj_test_1'
        })
        checkBothConnected()
      })

      clientSocket2.on('connect', () => {
        clientSocket2.emit(TimelineEvent.JOIN_PROJECT, {
          projectId: 'proj_test_1'
        })
        checkBothConnected()
      })

      // User 2 recebe posição do cursor de User 1
      clientSocket2.on(TimelineEvent.CURSOR_MOVE, (data) => {
        expect(data.userId).toBe('user_1')
        expect(data.trackId).toBe('track_video_1')
        expect(data.position).toEqual({ x: 100, y: 200 })
        done()
      })
    })

    it('deve enviar presence update', (done) => {
      clientSocket1 = ioClient(serverUrl, {
        path: '/api/socket/timeline',
        auth: {
          token: 'test-token',
          userId: 'user_1',
          userName: 'User 1'
        }
      })

      clientSocket2 = ioClient(serverUrl, {
        path: '/api/socket/timeline',
        auth: {
          token: 'test-token',
          userId: 'user_2',
          userName: 'User 2'
        }
      })

      let bothConnected = 0

      const checkBothConnected = () => {
        bothConnected++
        if (bothConnected === 2) {
          // User 1 atualiza presença
          clientSocket1.emit(TimelineEvent.PRESENCE_UPDATE, {
            userId: 'user_1',
            userName: 'User 1',
            currentTrackId: 'track_video_1',
            projectId: 'proj_test_1'
          })
        }
      }

      clientSocket1.on('connect', () => {
        clientSocket1.emit(TimelineEvent.JOIN_PROJECT, {
          projectId: 'proj_test_1'
        })
        checkBothConnected()
      })

      clientSocket2.on('connect', () => {
        clientSocket2.emit(TimelineEvent.JOIN_PROJECT, {
          projectId: 'proj_test_1'
        })
        checkBothConnected()
      })

      // User 2 recebe presence update
      clientSocket2.on(TimelineEvent.PRESENCE_UPDATE, (data) => {
        expect(data.userId).toBe('user_1')
        expect(data.currentTrackId).toBe('track_video_1')
        done()
      })
    })

    it('deve listar usuários ativos no projeto', (done) => {
      clientSocket1 = ioClient(serverUrl, {
        path: '/api/socket/timeline',
        auth: {
          token: 'test-token',
          userId: 'user_1',
          userName: 'User 1'
        }
      })

      clientSocket2 = ioClient(serverUrl, {
        path: '/api/socket/timeline',
        auth: {
          token: 'test-token',
          userId: 'user_2',
          userName: 'User 2'
        }
      })

      clientSocket3 = ioClient(serverUrl, {
        path: '/api/socket/timeline',
        auth: {
          token: 'test-token',
          userId: 'user_3',
          userName: 'User 3'
        }
      })

      let socket3Joined = false

      clientSocket1.on('connect', () => {
        clientSocket1.emit(TimelineEvent.JOIN_PROJECT, {
          projectId: 'proj_test_1'
        })
      })

      clientSocket2.on('connect', () => {
        clientSocket2.emit(TimelineEvent.JOIN_PROJECT, {
          projectId: 'proj_test_1'
        })
      })

      clientSocket3.on('connect', () => {
        clientSocket3.emit(TimelineEvent.JOIN_PROJECT, {
          projectId: 'proj_test_1'
        })
      })

      // Socket 3 ao entrar recebe lista completa
      clientSocket3.on(TimelineEvent.ACTIVE_USERS, (data) => {
        if (!socket3Joined && data.users.length === 3) {
          socket3Joined = true
          expect(data.users).toContain('user_1')
          expect(data.users).toContain('user_2')
          expect(data.users).toContain('user_3')
          expect(data.users.length).toBe(3)
          done()
        }
      })
    })
  })

  // ========================================
  // 5. TESTES DE TIMELINE UPDATES
  // ========================================

  describe('Timeline Updates', () => {
    it('deve broadcast timeline update para projeto', (done) => {
      clientSocket1 = ioClient(serverUrl, {
        path: '/api/socket/timeline',
        auth: {
          token: 'test-token',
          userId: 'user_1',
          userName: 'User 1'
        }
      })

      clientSocket2 = ioClient(serverUrl, {
        path: '/api/socket/timeline',
        auth: {
          token: 'test-token',
          userId: 'user_2',
          userName: 'User 2'
        }
      })

      let bothConnected = 0

      const checkBothConnected = () => {
        bothConnected++
        if (bothConnected === 2) {
          // User 1 atualiza timeline
          clientSocket1.emit(TimelineEvent.TIMELINE_UPDATED, {
            userId: 'user_1',
            userName: 'User 1',
            projectId: 'proj_test_1',
            version: 2,
            changes: ['clip_added', 'track_reordered']
          })
        }
      }

      clientSocket1.on('connect', () => {
        clientSocket1.emit(TimelineEvent.JOIN_PROJECT, {
          projectId: 'proj_test_1'
        })
        checkBothConnected()
      })

      clientSocket2.on('connect', () => {
        clientSocket2.emit(TimelineEvent.JOIN_PROJECT, {
          projectId: 'proj_test_1'
        })
        checkBothConnected()
      })

      // User 2 recebe timeline update
      clientSocket2.on(TimelineEvent.TIMELINE_UPDATED, (data) => {
        expect(data.userId).toBe('user_1')
        expect(data.version).toBe(2)
        expect(data.changes).toContain('clip_added')
        expect(data.changes).toContain('track_reordered')
        done()
      })
    })

    it('deve notificar clip adicionado', (done) => {
      clientSocket1 = ioClient(serverUrl, {
        path: '/api/socket/timeline',
        auth: {
          token: 'test-token',
          userId: 'user_1',
          userName: 'User 1'
        }
      })

      clientSocket2 = ioClient(serverUrl, {
        path: '/api/socket/timeline',
        auth: {
          token: 'test-token',
          userId: 'user_2',
          userName: 'User 2'
        }
      })

      let bothConnected = 0

      const checkBothConnected = () => {
        bothConnected++
        if (bothConnected === 2) {
          clientSocket1.emit(TimelineEvent.CLIP_ADDED, {
            userId: 'user_1',
            clipId: 'clip_123',
            trackId: 'track_video_1',
            projectId: 'proj_test_1'
          })
        }
      }

      clientSocket1.on('connect', () => {
        clientSocket1.emit(TimelineEvent.JOIN_PROJECT, {
          projectId: 'proj_test_1'
        })
        checkBothConnected()
      })

      clientSocket2.on('connect', () => {
        clientSocket2.emit(TimelineEvent.JOIN_PROJECT, {
          projectId: 'proj_test_1'
        })
        checkBothConnected()
      })

      clientSocket2.on(TimelineEvent.CLIP_ADDED, (data) => {
        expect(data.clipId).toBe('clip_123')
        expect(data.trackId).toBe('track_video_1')
        done()
      })
    })
  })

  // ========================================
  // 6. TESTES DE NOTIFICATIONS
  // ========================================

  describe('Notificações', () => {
    it('deve enviar notificação para projeto', (done) => {
      clientSocket1 = ioClient(serverUrl, {
        path: '/api/socket/timeline',
        auth: {
          token: 'test-token',
          userId: 'user_1',
          userName: 'User 1'
        }
      })

      clientSocket2 = ioClient(serverUrl, {
        path: '/api/socket/timeline',
        auth: {
          token: 'test-token',
          userId: 'user_2',
          userName: 'User 2'
        }
      })

      let bothConnected = 0

      const checkBothConnected = () => {
        bothConnected++
        if (bothConnected === 2) {
          clientSocket1.emit(TimelineEvent.NOTIFICATION, {
            userId: 'user_1',
            message: 'Timeline salva com sucesso',
            type: 'success',
            projectId: 'proj_test_1'
          })
        }
      }

      clientSocket1.on('connect', () => {
        clientSocket1.emit(TimelineEvent.JOIN_PROJECT, {
          projectId: 'proj_test_1'
        })
        checkBothConnected()
      })

      clientSocket2.on('connect', () => {
        clientSocket2.emit(TimelineEvent.JOIN_PROJECT, {
          projectId: 'proj_test_1'
        })
        checkBothConnected()
      })

      clientSocket2.on(TimelineEvent.NOTIFICATION, (data) => {
        expect(data.message).toBe('Timeline salva com sucesso')
        expect(data.type).toBe('success')
        done()
      })
    })

    it('deve enviar notificação de conflito', (done) => {
      clientSocket1 = ioClient(serverUrl, {
        path: '/api/socket/timeline',
        auth: {
          token: 'test-token',
          userId: 'user_1',
          userName: 'User 1'
        }
      })

      clientSocket2 = ioClient(serverUrl, {
        path: '/api/socket/timeline',
        auth: {
          token: 'test-token',
          userId: 'user_2',
          userName: 'User 2'
        }
      })

      let bothConnected = 0

      const checkBothConnected = () => {
        bothConnected++
        if (bothConnected === 2) {
          clientSocket1.emit(TimelineEvent.CONFLICT, {
            userId: 'user_1',
            conflictType: 'track_locked',
            trackId: 'track_video_1',
            lockedBy: 'user_2',
            projectId: 'proj_test_1'
          })
        }
      }

      clientSocket1.on('connect', () => {
        clientSocket1.emit(TimelineEvent.JOIN_PROJECT, {
          projectId: 'proj_test_1'
        })
        checkBothConnected()
      })

      clientSocket2.on('connect', () => {
        clientSocket2.emit(TimelineEvent.JOIN_PROJECT, {
          projectId: 'proj_test_1'
        })
        checkBothConnected()
      })

      clientSocket2.on(TimelineEvent.CONFLICT, (data) => {
        expect(data.conflictType).toBe('track_locked')
        expect(data.trackId).toBe('track_video_1')
        expect(data.lockedBy).toBe('user_2')
        done()
      })
    })
  })

  // ========================================
  // 7. TESTES DE CLEANUP
  // ========================================

  describe('Cleanup e Desconexão', () => {
    it('deve remover usuário da lista ao desconectar', (done) => {
      clientSocket1 = ioClient(serverUrl, {
        path: '/api/socket/timeline',
        auth: {
          token: 'test-token',
          userId: 'user_1',
          userName: 'User 1'
        }
      })

      clientSocket2 = ioClient(serverUrl, {
        path: '/api/socket/timeline',
        auth: {
          token: 'test-token',
          userId: 'user_2',
          userName: 'User 2'
        }
      })

      let bothConnected = 0

      const checkBothConnected = () => {
        bothConnected++
        if (bothConnected === 2) {
          // User 2 desconecta
          setTimeout(() => {
            clientSocket2.disconnect()
          }, 200)
        }
      }

      clientSocket1.on('connect', () => {
        clientSocket1.emit(TimelineEvent.JOIN_PROJECT, {
          projectId: 'proj_test_1'
        })
        checkBothConnected()
      })

      clientSocket2.on('connect', () => {
        clientSocket2.emit(TimelineEvent.JOIN_PROJECT, {
          projectId: 'proj_test_1'
        })
        checkBothConnected()
      })

      // User 1 recebe notificação de User 2 saindo
      clientSocket1.on(TimelineEvent.USER_LEFT, (data) => {
        expect(data.userId).toBe('user_2')
        expect(data.projectId).toBe('proj_test_1')
        done()
      })
    })

    it('deve notificar apenas projeto correto ao desconectar', (done) => {
      let receivedNotification = false

      // User 1 no projeto A
      clientSocket1 = ioClient(serverUrl, {
        path: '/api/socket/timeline',
        auth: {
          token: 'test-token',
          userId: 'user_1',
          userName: 'User 1'
        }
      })

      // User 2 no projeto B
      clientSocket2 = ioClient(serverUrl, {
        path: '/api/socket/timeline',
        auth: {
          token: 'test-token',
          userId: 'user_2',
          userName: 'User 2'
        }
      })

      let bothConnected = 0

      const checkBothConnected = () => {
        bothConnected++
        if (bothConnected === 2) {
          // User 2 (projeto B) desconecta
          setTimeout(() => {
            clientSocket2.disconnect()
          }, 200)
        }
      }

      clientSocket1.on('connect', () => {
        clientSocket1.emit(TimelineEvent.JOIN_PROJECT, {
          projectId: 'proj_A'
        })
        checkBothConnected()
      })

      clientSocket2.on('connect', () => {
        clientSocket2.emit(TimelineEvent.JOIN_PROJECT, {
          projectId: 'proj_B'
        })
        checkBothConnected()
      })

      // User 1 (projeto A) NÃO deve receber notificação de User 2 (projeto B)
      clientSocket1.on(TimelineEvent.USER_LEFT, (data) => {
        receivedNotification = true
      })

      // Verificar após 500ms que nenhuma notificação foi recebida
      setTimeout(() => {
        expect(receivedNotification).toBe(false)
        done()
      }, 500)
    })
  })
})
