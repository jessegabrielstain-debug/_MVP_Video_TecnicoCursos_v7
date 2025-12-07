
import { NextRequest, NextResponse } from 'next/server'
import ElevenLabsService from '@/lib/elevenlabs-service'

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
    console.error('Erro ao buscar vozes ElevenLabs:', error)
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

