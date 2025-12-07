/**
 * API Route: Render Queue - Create Job
 * POST /api/render/create
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { renderQueueSystem } from '@/lib/render-queue-real'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  try {
    // Verificar autenticação
    const session = await getServerSession(req, res, authOptions)
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Não autenticado' })
    }

    const userId = session.user.id

    // Validar dados
    const { projectId, type, settings, priority } = req.body

    if (!projectId || !type) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: 'projectId e type são obrigatórios',
      })
    }

    // Validar tipo
    if (!['video', 'audio', 'image', 'composite'].includes(type)) {
      return res.status(400).json({
        error: 'Tipo inválido',
        details: 'Tipo deve ser: video, audio, image ou composite',
      })
    }

    // Criar job na fila
    const jobId = await renderQueueSystem.addRenderJob(
      {
        projectId,
        userId,
        type,
        settings: settings || {},
      },
      {
        priority: priority || 5,
      }
    )

    res.status(201).json({
      success: true,
      jobId,
      message: 'Job adicionado à fila de renderização',
    })
  } catch (error: any) {
    console.error('[API] Erro ao criar job de renderização:', error)
    res.status(500).json({
      error: 'Erro ao criar job',
      details: error.message,
    })
  }
}
