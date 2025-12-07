/**
 * API Route: Render Queue - Get Job Status
 * GET /api/render/status/[jobId]
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]'
import { renderQueueSystem } from '@/lib/render-queue-real'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  try {
    // Verificar autenticação
    const session = await getServerSession(req, res, authOptions)
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Não autenticado' })
    }

    const { jobId } = req.query

    if (!jobId || typeof jobId !== 'string') {
      return res.status(400).json({
        error: 'ID do job é obrigatório',
      })
    }

    // Buscar status do job
    const status = await renderQueueSystem.getJobStatus(jobId)

    if (!status) {
      return res.status(404).json({
        error: 'Job não encontrado',
      })
    }

    res.status(200).json({
      success: true,
      job: status,
    })
  } catch (error: any) {
    console.error('[API] Erro ao buscar status do job:', error)
    res.status(500).json({
      error: 'Erro ao buscar status',
      details: error.message,
    })
  }
}
