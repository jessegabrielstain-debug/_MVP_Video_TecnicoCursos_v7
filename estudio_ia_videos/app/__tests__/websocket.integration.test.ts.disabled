/**
 * Testes de Integração - WebSocket Multi-Usuário
 * 
 * Testa cenários realistas:
 * - Conflitos de lock simultâneos
 * - Sincronização de timeline com múltiplos editores
 * - Performance com muitos usuários
 * - Reconnection e recovery
 * - Operações bulk colaborativas
 */

import { createServer, Server as HttpServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client'
import { AddressInfo } from 'net'
import { initializeWebSocket, TimelineEvent } from '@/lib/websocket/timeline-websocket'

// Event data types
interface LockEventData {
  trackId: string;
  userId: string;
  userName?: string;
  projectId: string;
}

interface TimelineUpdateData {
  userId: string;
  version: number;
  changes: string[];
  timestamp?: number;
}

describe('WebSocket - Testes de Integração Multi-Usuário', () => {
  let httpServer: HttpServer
  let io: SocketIOServer
  let serverUrl: string
  let clients: ClientSocket[] = []

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
    clients.forEach((client) => {
      if (client?.connected) {
        client.disconnect()
      }
    })
    clients = []
  })

  // Helper para criar cliente
  const createClient = (userId: string, userName: string): Promise<ClientSocket> => {
    return new Promise((resolve, reject) => {
      const client = ioClient(serverUrl, {
        path: '/api/socket/timeline',
        auth: {
          token: 'test-token',
          userId,
          userName
        }
      })

      client.on('connect', () => {
        clients.push(client)
        resolve(client)
      })

      client.on('connect_error', (error) => {
        reject(error)
      })
    })
  }

  // Helper para aguardar todos entrarem no projeto
  const joinAllToProject = async (projectId: string, userClients: ClientSocket[]) => {
    const promises = userClients.map((client) => {
      return new Promise<void>((resolve) => {
        client.emit(TimelineEvent.JOIN_PROJECT, { projectId })
        client.once(TimelineEvent.ACTIVE_USERS, () => resolve())
      })
    })
    await Promise.all(promises)
  }

  // ========================================
  // 1. CENÁRIOS DE CONFLITO
  // ========================================

  describe('Conflitos de Lock Simultâneos', () => {
    it('deve detectar conflito quando 2 usuários tentam bloquear mesma track', async () => {
      const client1 = await createClient('user_1', 'User 1')
      const client2 = await createClient('user_2', 'User 2')

      await joinAllToProject('proj_test_1', [client1, client2])

      return new Promise<void>((resolve) => {
        let lockCount = 0
        const trackId = 'track_video_1'

        // Ambos tentam bloquear ao mesmo tempo
        client1.emit(TimelineEvent.TRACK_LOCKED, {
          trackId,
          userId: 'user_1',
          userName: 'User 1',
          projectId: 'proj_test_1'
        })

        setTimeout(() => {
          client2.emit(TimelineEvent.TRACK_LOCKED, {
            trackId,
            userId: 'user_2',
            userName: 'User 2',
            projectId: 'proj_test_1'
          })
        }, 10)

        // Contar quantos locks foram emitidos
        const onLock = (data: LockEventData) => {
          if (data.trackId === trackId) {
            lockCount++;
          }
        };

        client1.on(TimelineEvent.TRACK_LOCKED, onLock)
        client2.on(TimelineEvent.TRACK_LOCKED, onLock)

        // Verificar conflito após 300ms
        setTimeout(() => {
          // Deve ter pelo menos 2 eventos de lock (conflito detectado)
          expect(lockCount).toBeGreaterThanOrEqual(2)
          resolve()
        }, 300)
      })
    })

    it('deve resolver conflito com sistema first-come-first-served', async () => {
      const client1 = await createClient('user_1', 'User 1')
      const client2 = await createClient('user_2', 'User 2')

      await joinAllToProject('proj_test_1', [client1, client2])

      return new Promise<void>((resolve) => {
        const trackId = 'track_video_1';
        let firstLock: string | null = null;

        const onLock = (data: LockEventData) => {
          if (data.trackId === trackId && !firstLock) {
            firstLock = data.userId;
          }
        };

        client1.on(TimelineEvent.TRACK_LOCKED, onLock)
        client2.on(TimelineEvent.TRACK_LOCKED, onLock)

        // User 1 bloqueia primeiro
        client1.emit(TimelineEvent.TRACK_LOCKED, {
          trackId,
          userId: 'user_1',
          userName: 'User 1',
          projectId: 'proj_test_1'
        })

        // User 2 tenta bloquear 50ms depois
        setTimeout(() => {
          client2.emit(TimelineEvent.TRACK_LOCKED, {
            trackId,
            userId: 'user_2',
            userName: 'User 2',
            projectId: 'proj_test_1'
          })
        }, 50)

        // Verificar quem conseguiu lock
        setTimeout(() => {
          expect(firstLock).toBe('user_1')
          resolve()
        }, 200)
      })
    })

    it('deve permitir lock após unlock da track', async () => {
      const client1 = await createClient('user_1', 'User 1')
      const client2 = await createClient('user_2', 'User 2')

      await joinAllToProject('proj_test_1', [client1, client2])

      return new Promise<void>((resolve) => {
        const trackId = 'track_video_1'
        let lockSequence: string[] = []

        client1.on(TimelineEvent.TRACK_LOCKED, (data) => {
          if (data.trackId === trackId) {
            lockSequence.push(`${data.userId}_lock`)
          }
        })

        client1.on(TimelineEvent.TRACK_UNLOCKED, (data) => {
          if (data.trackId === trackId) {
            lockSequence.push(`${data.userId}_unlock`)
          }
        })

        client2.on(TimelineEvent.TRACK_LOCKED, (data) => {
          if (data.trackId === trackId) {
            lockSequence.push(`${data.userId}_lock`)
          }
        })

        // User 1 bloqueia
        client1.emit(TimelineEvent.TRACK_LOCKED, {
          trackId,
          userId: 'user_1',
          userName: 'User 1',
          projectId: 'proj_test_1'
        })

        // User 1 desbloqueia após 100ms
        setTimeout(() => {
          client1.emit(TimelineEvent.TRACK_UNLOCKED, {
            trackId,
            userId: 'user_1',
            userName: 'User 1',
            projectId: 'proj_test_1'
          })
        }, 100)

        // User 2 bloqueia após 150ms
        setTimeout(() => {
          client2.emit(TimelineEvent.TRACK_LOCKED, {
            trackId,
            userId: 'user_2',
            userName: 'User 2',
            projectId: 'proj_test_1'
          })
        }, 150)

        // Verificar sequência
        setTimeout(() => {
          expect(lockSequence).toContain('user_1_lock')
          expect(lockSequence).toContain('user_1_unlock')
          expect(lockSequence).toContain('user_2_lock')
          resolve()
        }, 300)
      })
    })
  })

  // ========================================
  // 2. SINCRONIZAÇÃO DE TIMELINE
  // ========================================

  describe('Sincronização de Timeline Multi-Usuário', () => {
    it('deve sincronizar mudanças entre 3 usuários editando simultaneamente', async () => {
      const client1 = await createClient('user_1', 'User 1')
      const client2 = await createClient('user_2', 'User 2')
      const client3 = await createClient('user_3', 'User 3')

      await joinAllToProject('proj_test_1', [client1, client2, client3])

      return new Promise<void>((resolve) => {
        let updatesReceived = 0

        const onUpdate = () => {
          updatesReceived++
        }

        client2.on(TimelineEvent.TIMELINE_UPDATED, onUpdate)
        client3.on(TimelineEvent.TIMELINE_UPDATED, onUpdate)

        // User 1 faz mudança
        client1.emit(TimelineEvent.TIMELINE_UPDATED, {
          userId: 'user_1',
          userName: 'User 1',
          projectId: 'proj_test_1',
          version: 2,
          changes: ['clip_added']
        })

        // Verificar que User 2 e User 3 receberam
        setTimeout(() => {
          expect(updatesReceived).toBe(2)
          resolve()
        }, 200)
      })
    })

    it('deve rastrear versão da timeline para evitar conflitos', async () => {
      const client1 = await createClient('user_1', 'User 1')
      const client2 = await createClient('user_2', 'User 2')

      await joinAllToProject('proj_test_1', [client1, client2])

      return new Promise<void>((resolve) => {
        let versions: number[] = []

        client2.on(TimelineEvent.TIMELINE_UPDATED, (data) => {
          versions.push(data.version)
        })

        // User 1 faz 3 mudanças sequenciais
        client1.emit(TimelineEvent.TIMELINE_UPDATED, {
          userId: 'user_1',
          projectId: 'proj_test_1',
          version: 1,
          changes: ['initial']
        })

        setTimeout(() => {
          client1.emit(TimelineEvent.TIMELINE_UPDATED, {
            userId: 'user_1',
            projectId: 'proj_test_1',
            version: 2,
            changes: ['clip_added']
          })
        }, 50)

        setTimeout(() => {
          client1.emit(TimelineEvent.TIMELINE_UPDATED, {
            userId: 'user_1',
            projectId: 'proj_test_1',
            version: 3,
            changes: ['clip_moved']
          })
        }, 100)

        // Verificar ordem das versões
        setTimeout(() => {
          expect(versions).toEqual([1, 2, 3])
          resolve()
        }, 300)
      })
    })

    it('deve broadcast operações bulk para todos usuários', async () => {
      const client1 = await createClient('user_1', 'User 1')
      const client2 = await createClient('user_2', 'User 2')
      const client3 = await createClient('user_3', 'User 3')

      await joinAllToProject('proj_test_1', [client1, client2, client3])

      return new Promise<void>((resolve) => {
        let bulkStartReceived = 0
        let bulkCompleteReceived = 0

        const onBulkStart = () => bulkStartReceived++
        const onBulkComplete = () => bulkCompleteReceived++

        client2.on(TimelineEvent.BULK_START, onBulkStart)
        client3.on(TimelineEvent.BULK_START, onBulkStart)

        client2.on(TimelineEvent.BULK_COMPLETE, onBulkComplete)
        client3.on(TimelineEvent.BULK_COMPLETE, onBulkComplete)

        // User 1 inicia operação bulk
        client1.emit(TimelineEvent.BULK_START, {
          userId: 'user_1',
          operation: 'delete_multiple_clips',
          count: 10,
          projectId: 'proj_test_1'
        })

        setTimeout(() => {
          client1.emit(TimelineEvent.BULK_COMPLETE, {
            userId: 'user_1',
            operation: 'delete_multiple_clips',
            count: 10,
            success: true,
            projectId: 'proj_test_1'
          })
        }, 100)

        // Verificar broadcast
        setTimeout(() => {
          expect(bulkStartReceived).toBe(2)
          expect(bulkCompleteReceived).toBe(2)
          resolve()
        }, 300)
      })
    })
  })

  // ========================================
  // 3. PERFORMANCE COM MÚLTIPLOS USUÁRIOS
  // ========================================

  describe('Performance com Múltiplos Usuários', () => {
    it('deve suportar 10 usuários simultâneos sem degradação', async () => {
      const users = await Promise.all(
        Array.from({ length: 10 }, (_, i) =>
          createClient(`user_${i + 1}`, `User ${i + 1}`)
        )
      )

      await joinAllToProject('proj_test_1', users)

      return new Promise<void>((resolve) => {
        let messagesReceived = 0
        const startTime = Date.now()

        // Cada usuário escuta notificações
        users.forEach((client) => {
          client.on(TimelineEvent.NOTIFICATION, () => {
            messagesReceived++
          })
        })

        // User 1 envia notificação
        users[0].emit(TimelineEvent.NOTIFICATION, {
          userId: 'user_1',
          message: 'Test broadcast',
          type: 'info',
          projectId: 'proj_test_1'
        })

        // Verificar que todos receberam em < 200ms
        setTimeout(() => {
          const elapsed = Date.now() - startTime
          expect(messagesReceived).toBe(10)
          expect(elapsed).toBeLessThan(200)
          resolve()
        }, 300)
      })
    })

    it('deve processar 100 cursor updates em < 1 segundo', async () => {
      const client1 = await createClient('user_1', 'User 1')
      const client2 = await createClient('user_2', 'User 2')

      await joinAllToProject('proj_test_1', [client1, client2])

      return new Promise<void>((resolve) => {
        let cursorUpdates = 0
        const startTime = Date.now()

        client2.on(TimelineEvent.CURSOR_MOVE, () => {
          cursorUpdates++
        })

        // Enviar 100 cursor updates
        for (let i = 0; i < 100; i++) {
          setTimeout(() => {
            client1.emit(TimelineEvent.CURSOR_MOVE, {
              userId: 'user_1',
              userName: 'User 1',
              trackId: 'track_video_1',
              position: { x: i * 10, y: 100 },
              projectId: 'proj_test_1'
            })
          }, i * 5)
        }

        // Verificar após 1 segundo
        setTimeout(() => {
          const elapsed = Date.now() - startTime
          expect(cursorUpdates).toBeGreaterThan(90)
          expect(elapsed).toBeLessThan(1000)
          resolve()
        }, 1000)
      })
    })
  })

  // ========================================
  // 4. RECONNECTION E RECOVERY
  // ========================================

  describe('Reconnection e Recovery', () => {
    it('deve reconectar automaticamente após desconexão', async () => {
      const client1 = await createClient('user_1', 'User 1')

      return new Promise<void>((resolve) => {
        let disconnected = false
        let reconnected = false

        client1.on('disconnect', () => {
          disconnected = true
        })

        client1.on('connect', () => {
          if (disconnected) {
            reconnected = true
            expect(reconnected).toBe(true)
            resolve()
          }
        })

        // Forçar desconexão
        setTimeout(() => {
          client1.disconnect()
        }, 100)

        // Reconectar
        setTimeout(() => {
          client1.connect()
        }, 300)
      })
    }, 10000)

    it('deve reentrar no projeto após reconnection', async () => {
      const client1 = await createClient('user_1', 'User 1')
      const client2 = await createClient('user_2', 'User 2')

      await joinAllToProject('proj_test_1', [client1, client2])

      return new Promise<void>((resolve) => {
        let userLeftReceived = false
        let userJoinedReceived = false

        client2.on(TimelineEvent.USER_LEFT, (data) => {
          if (data.userId === 'user_1') {
            userLeftReceived = true
          }
        })

        client2.on(TimelineEvent.USER_JOINED, (data) => {
          if (data.userId === 'user_1' && userLeftReceived) {
            userJoinedReceived = true
            expect(userJoinedReceived).toBe(true)
            resolve()
          }
        })

        // User 1 desconecta
        setTimeout(() => {
          client1.disconnect()
        }, 100)

        // User 1 reconecta e reentra no projeto
        setTimeout(() => {
          client1.connect()
          setTimeout(() => {
            client1.emit(TimelineEvent.JOIN_PROJECT, {
              projectId: 'proj_test_1'
            })
          }, 100)
        }, 300)
      })
    }, 10000)
  })

  // ========================================
  // 5. CENÁRIOS REALISTAS COMPLETOS
  // ========================================

  describe('Cenários Realistas de Colaboração', () => {
    it('deve simular sessão de edição colaborativa completa', async () => {
      const editor1 = await createClient('editor_1', 'João Silva')
      const editor2 = await createClient('editor_2', 'Maria Santos')
      const viewer = await createClient('viewer_1', 'Carlos Viewer')

      await joinAllToProject('proj_corporate_video', [editor1, editor2, viewer])

      return new Promise<void>((resolve) => {
        let eventLog: string[] = []

        // Viewer monitora todos eventos
        viewer.on(TimelineEvent.TRACK_LOCKED, (data) => {
          eventLog.push(`lock:${data.trackId}:${data.userId}`)
        })

        viewer.on(TimelineEvent.TRACK_UNLOCKED, (data) => {
          eventLog.push(`unlock:${data.trackId}:${data.userId}`)
        })

        viewer.on(TimelineEvent.CLIP_ADDED, (data) => {
          eventLog.push(`clip_added:${data.clipId}`)
        })

        viewer.on(TimelineEvent.TIMELINE_UPDATED, (data) => {
          eventLog.push(`timeline_updated:v${data.version}`)
        })

        // Simular fluxo de trabalho
        // 1. Editor 1 bloqueia track de vídeo
        setTimeout(() => {
          editor1.emit(TimelineEvent.TRACK_LOCKED, {
            trackId: 'track_video',
            userId: 'editor_1',
            userName: 'João Silva',
            projectId: 'proj_corporate_video'
          })
        }, 50)

        // 2. Editor 1 adiciona clip
        setTimeout(() => {
          editor1.emit(TimelineEvent.CLIP_ADDED, {
            userId: 'editor_1',
            clipId: 'clip_intro',
            trackId: 'track_video',
            projectId: 'proj_corporate_video'
          })
        }, 150)

        // 3. Editor 1 desbloqueia
        setTimeout(() => {
          editor1.emit(TimelineEvent.TRACK_UNLOCKED, {
            trackId: 'track_video',
            userId: 'editor_1',
            userName: 'João Silva',
            projectId: 'proj_corporate_video'
          })
        }, 250)

        // 4. Editor 2 bloqueia track de áudio
        setTimeout(() => {
          editor2.emit(TimelineEvent.TRACK_LOCKED, {
            trackId: 'track_audio',
            userId: 'editor_2',
            userName: 'Maria Santos',
            projectId: 'proj_corporate_video'
          })
        }, 350)

        // 5. Timeline update
        setTimeout(() => {
          editor2.emit(TimelineEvent.TIMELINE_UPDATED, {
            userId: 'editor_2',
            userName: 'Maria Santos',
            projectId: 'proj_corporate_video',
            version: 2,
            changes: ['audio_clip_added']
          })
        }, 450)

        // Verificar log de eventos
        setTimeout(() => {
          expect(eventLog).toContain('lock:track_video:editor_1')
          expect(eventLog).toContain('clip_added:clip_intro')
          expect(eventLog).toContain('unlock:track_video:editor_1')
          expect(eventLog).toContain('lock:track_audio:editor_2')
          expect(eventLog).toContain('timeline_updated:v2')
          expect(eventLog.length).toBeGreaterThanOrEqual(5)
          resolve()
        }, 600)
      })
    })

    it('deve prevenir race condition em operações simultâneas', async () => {
      const client1 = await createClient('user_1', 'User 1')
      const client2 = await createClient('user_2', 'User 2')
      const client3 = await createClient('user_3', 'User 3')

      await joinAllToProject('proj_test_1', [client1, client2, client3])

      return new Promise<void>((resolve) => {
        let operations: TimelineUpdateData[] = [];

        // Todos escutam timeline updates
        const onUpdate = (data: TimelineUpdateData) => {
          operations.push({
            userId: data.userId,
            version: data.version,
            changes: data.changes,
            timestamp: Date.now()
          });
        };

        client1.on(TimelineEvent.TIMELINE_UPDATED, onUpdate)
        client2.on(TimelineEvent.TIMELINE_UPDATED, onUpdate)
        client3.on(TimelineEvent.TIMELINE_UPDATED, onUpdate)

        // 3 usuários fazem mudanças simultâneas
        client1.emit(TimelineEvent.TIMELINE_UPDATED, {
          userId: 'user_1',
          projectId: 'proj_test_1',
          version: 1,
          changes: ['change_1']
        })

        client2.emit(TimelineEvent.TIMELINE_UPDATED, {
          userId: 'user_2',
          projectId: 'proj_test_1',
          version: 1,
          changes: ['change_2']
        })

        client3.emit(TimelineEvent.TIMELINE_UPDATED, {
          userId: 'user_3',
          projectId: 'proj_test_1',
          version: 1,
          changes: ['change_3']
        })

        // Verificar que todos receberam todas as mudanças
        setTimeout(() => {
          // Cada um deve ter recebido 3 updates (dos outros 2 + broadcast próprio)
          expect(operations.length).toBeGreaterThanOrEqual(9)
          resolve()
        }, 300)
      })
    })
  })
})
