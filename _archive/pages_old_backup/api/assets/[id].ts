/**
 * API Route: Assets - Get by ID
 * GET /api/assets/[id]
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { assetsManagerReal } from '@/lib/assets-manager-real'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  try {
    // Verificar autenticação
    const session = await getServerSession(req, res, authOptions)
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Não autenticado' })
    }

    const { id } = req.query

    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        error: 'ID do asset é obrigatório',
      })
    }

    if (req.method === 'GET') {
      // Buscar asset
      const asset = await assetsManagerReal.getAssetById(id)

      if (!asset) {
        return res.status(404).json({
          error: 'Asset não encontrado',
        })
      }

      res.status(200).json({
        success: true,
        asset,
      })
    } else if (req.method === 'DELETE') {
      // Deletar asset
      const success = await assetsManagerReal.deleteAsset(id)

      if (!success) {
        return res.status(404).json({
          error: 'Asset não encontrado ou erro ao deletar',
        })
      }

      res.status(200).json({
        success: true,
        message: 'Asset deletado com sucesso',
      })
    }
  } catch (error: any) {
    console.error('[API] Erro ao processar asset:', error)
    res.status(500).json({
      error: 'Erro ao processar requisição',
      details: error.message,
    })
  }
}
