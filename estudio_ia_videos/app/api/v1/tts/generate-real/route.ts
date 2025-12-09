
/**
 * 🔊 API de TTS Real - Geração Completa de Áudio
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateProjectTTS, ttsIntegration } from '@/lib/tts-real-integration'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, voice, action = 'generate' } = body

    if (action === 'generate') {
      if (!projectId || !voice) {
        return NextResponse.json(
          { error: 'Project ID e configurações de voz são obrigatórios' },
          { status: 400 }
        )
      }

      logger.info('🔊 Iniciando geração TTS real para projeto:', {
        component: 'API: v1/tts/generate-real',
        projectId
      })

      // Gerar TTS para todo o projeto
      const result = await generateProjectTTS(projectId, voice)

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Erro na geração TTS' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        audioTimeline: result.audioTimeline,
        projectAudioUrl: result.projectAudioUrl,
        totalDuration: result.totalDuration,
        slidesCount: result.audioTimeline?.length || 0,
        message: 'TTS gerado com sucesso para todos os slides!'
      })

    } else if (action === 'single') {
      // Gerar áudio para um único texto
      const { text, voice } = body

      if (!text || !voice) {
        return NextResponse.json(
          { error: 'Texto e configurações de voz são obrigatórios' },
          { status: 400 }
        )
      }

      let audioResult
      if (voice.provider === 'elevenlabs') {
        audioResult = await ttsIntegration.generateElevenLabsAudio({
          text,
          voice,
          outputFormat: 'mp3'
        })
      } else if (voice.provider === 'azure') {
        audioResult = await ttsIntegration.generateAzureAudio({
          text,
          voice,
          outputFormat: 'mp3'
        })
      } else {
        throw new Error(`Provider não suportado: ${voice.provider}`)
      }

      return NextResponse.json({
        success: true,
        audioUrl: audioResult.audioUrl,
        metadata: audioResult.metadata,
        message: 'Áudio gerado com sucesso!'
      })

    } else {
      return NextResponse.json(
        { error: 'Ação não reconhecida' },
        { status: 400 }
      )
    }

  } catch (error) {
    const normalizedError = error instanceof Error ? error : new Error(String(error));
    logger.error('❌ Erro na API TTS:', {
      component: 'API: v1/tts/generate-real',
      error: normalizedError
    })
    return NextResponse.json(
      { 
        error: 'Erro na geração de áudio',
        details: normalizedError.message
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const provider = searchParams.get('provider') as 'elevenlabs' | 'azure'

    if (action === 'voices') {
      if (!provider) {
        return NextResponse.json(
          { error: 'Provider é obrigatório' },
          { status: 400 }
        )
      }

      // Listar vozes disponíveis
      const voices = await ttsIntegration.getAvailableVoices(provider)

      return NextResponse.json({
        success: true,
        provider,
        voices,
        count: voices.length,
        message: `${voices.length} vozes disponíveis para ${provider}`
      })

    } else if (action === 'status') {
      const projectId = searchParams.get('projectId')
      if (!projectId) {
        return NextResponse.json(
          { error: 'Project ID é obrigatório' },
          { status: 400 }
        )
      }

      // Verificar status TTS do projeto
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          slides: {
            select: {
              id: true,
              title: true,
              audioConfig: true
            },
            orderBy: { orderIndex: 'asc' }
          }
        }
      })

      if (!project) {
        return NextResponse.json(
          { error: 'Projeto não encontrado' },
          { status: 404 }
        )
      }

      const slidesWithTTS = project.slides.filter((slide: any) => slide.audioConfig?.audioUrl)
      const metadata = (project.metadata as any) || {}
      const processingLog = metadata.processingLog || {}

      return NextResponse.json({
        success: true,
        project: {
          id: project.id,
          name: project.title,
          hasProjectAudio: !!metadata.audioUrl,
          projectAudioUrl: metadata.audioUrl,
          ttsProvider: metadata.ttsProvider,
          voiceId: metadata.voiceId,
          totalDuration: project.duration
        },
        slides: {
          total: project.slides.length,
          withTTS: slidesWithTTS.length,
          percentage: project.slides.length > 0 ? Math.round((slidesWithTTS.length / project.slides.length) * 100) : 0,
          details: project.slides.map((slide: any) => ({
            id: slide.id,
            title: slide.title,
            hasTTS: !!slide.audioConfig?.audioUrl,
            audioUrl: slide.audioConfig?.audioUrl
          }))
        },
        timeline: processingLog?.audioTimeline || [],
        generatedAt: processingLog?.generatedAt
      })
    }

    // Status geral da API
    return NextResponse.json({
      success: true,
      message: 'API TTS Real ativa',
      providers: ['elevenlabs', 'azure'],
      endpoints: {
        'POST /generate': 'Gerar TTS para projeto ou texto individual',
        'GET /voices?provider=': 'Listar vozes disponíveis',
        'GET /status?projectId=': 'Status TTS do projeto'
      }
    })

  } catch (error) {
    const normalizedError = error instanceof Error ? error : new Error(String(error));
    logger.error('❌ Erro na API TTS GET:', {
      component: 'API: v1/tts/generate-real',
      error: normalizedError
    })
    return NextResponse.json(
      { 
        error: 'Erro na consulta TTS',
        details: normalizedError.message
      },
      { status: 500 }
    )
  }
}

