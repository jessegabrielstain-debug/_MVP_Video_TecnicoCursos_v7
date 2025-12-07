
/**
 * 🔌 Socket.IO Pages API - Colaboração Real
 * Endpoint para inicializar WebSocket Server
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { initSocketServer } from '@/lib/socket-server'

interface NextApiResponseWithSocket extends NextApiResponse {
  socket: any
}

export default function handler(req: NextApiRequest, res: NextApiResponseWithSocket) {
  if (req.method === 'GET' || req.method === 'POST') {
    try {
      const io = initSocketServer(res)
      res.status(200).json({ 
        success: true, 
        message: 'Socket.IO inicializado com sucesso',
        rooms: io ? Array.from((io as any).sockets.adapter.rooms.keys()) : []
      })
    } catch (error) {
      console.error('❌ Erro ao inicializar Socket.IO:', error)
      res.status(500).json({ success: false, error: 'Erro interno do servidor' })
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).json({ error: 'Método não permitido' })
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}
