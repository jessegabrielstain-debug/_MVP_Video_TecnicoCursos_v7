/**
 * API Route: Assets - Search
 * POST /api/assets/search
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { assetsManagerReal } from '@/lib/assets-manager-real'

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

    // Validar dados
    const { query, filters, page, perPage } = req.body

    if (!query) {
      return res.status(400).json({
        error: 'Query de busca é obrigatória',
      })
    }

    // Buscar assets
    const result = await assetsManagerReal.searchAssets({
      query,
      filters: filters || {},
      page: page || 1,
      perPage: perPage || 20,
    })

    res.status(200).json({
      success: true,
      ...result,
    })
  } catch (error: any) {
    console.error('[API] Erro ao buscar assets:', error)
    res.status(500).json({
      error: 'Erro ao buscar assets',
      details: error.message,
    })
  }
}
