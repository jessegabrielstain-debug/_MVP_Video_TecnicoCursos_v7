
import { NextRequest, NextResponse } from 'next/server'
import ElevenLabsService from '@/lib/elevenlabs-service'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const files = formData.getAll('files') as File[]

    // Validações
    if (!name || !description) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nome e descrição são obrigatórios'
        },
        { status: 400 }
      )
    }

    if (files.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Pelo menos um arquivo de áudio é necessário'
        },
        { status: 400 }
      )
    }

    // Validar arquivos
    for (const file of files) {
      if (!file.type.startsWith('audio/')) {
        return NextResponse.json(
          {
            success: false,
            error: `Arquivo ${file.name} não é um arquivo de áudio válido`
          },
          { status: 400 }
        )
      }

      if (file.size > 25 * 1024 * 1024) { // 25MB
        return NextResponse.json(
          {
            success: false,
            error: `Arquivo ${file.name} é muito grande. Máximo 25MB.`
          },
          { status: 400 }
        )
      }
    }

    const elevenLabsService = ElevenLabsService.getInstance()
    
    const result = await elevenLabsService.cloneVoice(name, description, files)

    return NextResponse.json({
      success: true,
      voice_id: result.voice_id,
      message: 'Voz clonada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao clonar voz:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao clonar voz',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

