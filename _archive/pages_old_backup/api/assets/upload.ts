/**
 * API Route: Assets - Upload
 * POST /api/assets/upload
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]'
import { assetsManagerReal } from '@/lib/assets-manager-real'
import formidable from 'formidable'
import fs from 'fs'

export const config = {
  api: {
    bodyParser: false,
  },
}

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

    // Parse multipart form
    const form = formidable({
      maxFileSize: 100 * 1024 * 1024, // 100MB
      keepExtensions: true,
    })

    const [fields, files] = await form.parse(req)

    const file = Array.isArray(files.file) ? files.file[0] : files.file

    if (!file) {
      return res.status(400).json({
        error: 'Nenhum arquivo enviado',
      })
    }

    // TODO: Upload para S3 e processar
    // Por ora, retornar sucesso simulado

    const asset = await assetsManagerReal.saveAsset(
      {
        title: file.originalFilename || 'Upload',
        type: file.mimetype?.startsWith('image/')
          ? 'image'
          : file.mimetype?.startsWith('video/')
          ? 'video'
          : file.mimetype?.startsWith('audio/')
          ? 'audio'
          : 'image',
        url: `/uploads/${file.newFilename}`,
        thumbnail: `/uploads/${file.newFilename}`,
        license: 'free',
        provider: 'local',
        tags: [],
        size: file.size,
      },
      userId
    )

    res.status(201).json({
      success: true,
      asset,
    })
  } catch (error: any) {
    console.error('[API] Erro ao fazer upload de asset:', error)
    res.status(500).json({
      error: 'Erro ao fazer upload',
      details: error.message,
    })
  }
}
