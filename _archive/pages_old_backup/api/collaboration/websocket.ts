/**
 * API Route: Collaboration WebSocket
 * Endpoint para inicializar o servidor Socket.IO
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { Server as SocketIOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'
import { collaborationSystem } from '@/lib/collaboration-real'

let isInitialized = false

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  try {
    // Inicializar apenas uma vez
    if (!isInitialized && (res.socket as any).server) {
      const httpServer: HTTPServer = (res.socket as any).server
      
      collaborationSystem.initialize(httpServer)
      isInitialized = true

      console.log('[API] Sistema de colaboração WebSocket inicializado')
    }

    res.status(200).json({
      success: true,
      message: 'WebSocket server inicializado',
      endpoint: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000',
    })
  } catch (error: any) {
    console.error('[API] Erro ao inicializar WebSocket:', error)
    res.status(500).json({
      error: 'Erro ao inicializar servidor WebSocket',
      details: error.message,
    })
  }
}
