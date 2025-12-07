
import { NextRequest, NextResponse } from 'next/server'
import ElevenLabsService from '@/lib/elevenlabs-service'

export async function GET() {
  try {
    const elevenLabsService = ElevenLabsService.getInstance()
    const userInfo = await elevenLabsService.getUserInfo()
    
    return NextResponse.json({
      success: true,
      user: userInfo
    })
  } catch (error) {
    console.error('Erro ao buscar informações do usuário:', error)
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

