
import { NextRequest, NextResponse } from 'next/server'
import ElevenLabsService from '@/lib/elevenlabs-service'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    const elevenLabsService = ElevenLabsService.getInstance()
    const userInfo = await elevenLabsService.getUserInfo()
    
    return NextResponse.json({
      success: true,
      user: userInfo
    })
  } catch (error) {
    logger.error('Erro ao buscar informações do usuário', error instanceof Error ? error : new Error(String(error))
, { component: 'API: tts/elevenlabs/user' })
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao buscar informações do usuário',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

