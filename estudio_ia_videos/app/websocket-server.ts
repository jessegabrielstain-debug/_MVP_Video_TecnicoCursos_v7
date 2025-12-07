/**
 * 🔌 WebSocket Server - Render Progress
 * Servidor WebSocket para tracking de progresso em tempo real
 */

import { WebSocketServer, WebSocket } from 'ws'
import { createServer } from 'http'
import { parse } from 'url'
import { createRenderWorker, createRenderQueueEvents } from './lib/queue/render-queue'
import type { RenderProgress } from './lib/video/renderer'
import type { Job } from 'bullmq'
import type { RenderTaskPayload, RenderTaskResult } from './lib/queue/types'

interface ConnectedMessage {
  type: 'connected'
  jobId: string
  message: string
}

interface ProgressMessage {
  type: 'progress'
  jobId: string
  progress: RenderProgress
}

interface CompletedMessage {
  type: 'completed'
  jobId: string
  result: RenderTaskResult | null
}

interface FailedMessage {
  type: 'failed'
  jobId: string
  error: string
}

type BroadcastMessage = ProgressMessage | CompletedMessage | FailedMessage | ConnectedMessage

const PORT = parseInt(process.env.WS_PORT || '3001')

// Mapa de conexões por jobId
const connections = new Map<string, Set<WebSocket>>()

function isRenderTaskResult(value: unknown): value is RenderTaskResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'jobId' in value &&
    'outputUrl' in value
  )
}

/**
 * Broadcast para todos os clientes de um job
 */
function broadcastToJob(jobId: string, data: BroadcastMessage) {
  const clients = connections.get(jobId)
  if (!clients) return

  const message = JSON.stringify(data)
  
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message)
    }
  })
}

/**
 * Iniciar servidor WebSocket
 */
export function startWebSocketServer() {
  const server = createServer()
  const wss = new WebSocketServer({ server })

  // Iniciar worker de renderização
  const worker = createRenderWorker(async (job: Job<RenderTaskPayload, RenderTaskResult>) => {
    const jobId = job.id?.toString()

    if (!jobId) {
      return {
        jobId: 'unknown',
        outputUrl: '',
        durationMs: 0,
      }
    }

    // Simula o progresso do trabalho
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const progress: RenderProgress = {
        percent: i / 100,
        message: `Processing step ${i / 10}`,
        currentFile: 'video.mp4',
        totalFiles: 1,
        estimatedTimeLeft: (100 - i) * 0.5,
      };
      broadcastToJob(jobId, {
        type: 'progress',
        jobId,
        progress,
      });
    }
    return {
      jobId,
      outputUrl: 'http://example.com/video.mp4',
      durationMs: 5000,
    };
  });

  // Eventos da fila
  const queueEvents = createRenderQueueEvents();

  queueEvents.on('completed', (payload) => {
    const jobId = payload?.jobId ? String(payload.jobId) : ''
    if (!jobId) {
      return
    }

    // Validar tipo antes de conversão para evitar erro TS2352
    const returnValue = payload?.returnvalue
    const result: RenderTaskResult | null = isRenderTaskResult(returnValue)
      ? returnValue
      : null

    broadcastToJob(jobId, {
      type: 'completed',
      jobId,
      result,
    });
  });

  queueEvents.on('failed', (payload) => {
    const jobId = payload?.jobId ? String(payload.jobId) : ''
    if (!jobId) {
      return
    }

    const failedReason = payload?.failedReason
    const errorMessage = typeof failedReason === 'string' ? failedReason : 'Unknown error'

    broadcastToJob(jobId, {
      type: 'failed',
      jobId,
      error: errorMessage,
    });
  });

  // Conexões WebSocket
  wss.on('connection', (ws: WebSocket, request) => {
    const parsedUrl = parse(request.url || '', true)
    const rawJobId = parsedUrl.query?.jobId
    const jobId = Array.isArray(rawJobId)
      ? typeof rawJobId[0] === 'string' ? rawJobId[0] : undefined
      : typeof rawJobId === 'string'
        ? rawJobId
        : undefined

    if (!jobId) {
      ws.close(1008, 'Job ID required')
      return
    }

    console.log(`WebSocket connected for job: ${jobId}`)

    // Adicionar cliente ao mapa
    if (!connections.has(jobId)) {
      connections.set(jobId, new Set())
    }
    connections.get(jobId)!.add(ws)

    // Enviar mensagem de boas-vindas
    const connectedMessage: ConnectedMessage = {
      type: 'connected',
      jobId,
      message: 'Connected to render progress tracker',
    }

    ws.send(JSON.stringify(connectedMessage))

    // Ping/Pong para manter conexão viva
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping()
      }
    }, 30000)

    // Disconnect
    ws.on('close', () => {
      console.log(`WebSocket disconnected for job: ${jobId}`)
      connections.get(jobId)?.delete(ws)
      
      // Limpar set vazio
      if (connections.get(jobId)?.size === 0) {
        connections.delete(jobId)
      }
      
      clearInterval(pingInterval)
    })

    ws.on('error', (error) => {
      console.error(`WebSocket error for job ${jobId}:`, error)
    })
  })

  server.listen(PORT, () => {
    console.log(`✅ WebSocket server running on port ${PORT}`)
  })

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('Shutting down WebSocket server...')
    
    wss.clients.forEach((client) => {
      client.close()
    })

    await worker.close()
    await queueEvents.close()
    
    server.close(() => {
      console.log('WebSocket server closed')
      process.exit(0)
    })
  })

  return { wss, worker, queueEvents }
}

// Iniciar se executado diretamente
if (require.main === module) {
  startWebSocketServer()
}
