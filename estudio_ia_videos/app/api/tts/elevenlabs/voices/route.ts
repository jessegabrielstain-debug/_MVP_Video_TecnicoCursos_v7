
import { NextRequest, NextResponse } from 'next/server'
import ElevenLabsService from '@/lib/elevenlabs-service'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    const elevenLabsService = ElevenLabsService.getInstance()
    const voices = await elevenLabsService.listVoices()
    
    return NextResponse.json({
      success: true,
      voices,
      count: voices.length
    })
  } catch (error) {
    logger.error('Erro ao buscar vozes ElevenLabs', error instanceof Error ? error : new Error(String(error))
, { component: 'API: tts/elevenlabs/voices' })
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao buscar vozes ElevenLabs',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

