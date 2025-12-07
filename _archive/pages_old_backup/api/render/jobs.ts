/**
 * API Route: Render Queue - List User Jobs
 * GET /api/render/jobs
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
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

    const userId = session.user.id
    const limit = parseInt(req.query.limit as string) || 20

    // Buscar jobs do usuário
    const jobs = await renderQueueSystem.getUserJobs(userId, limit)

    res.status(200).json({
      success: true,
      jobs,
      total: jobs.length,
    })
  } catch (error: any) {
    console.error('[API] Erro ao listar jobs do usuário:', error)
    res.status(500).json({
      error: 'Erro ao listar jobs',
      details: error.message,
    })
  }
}
