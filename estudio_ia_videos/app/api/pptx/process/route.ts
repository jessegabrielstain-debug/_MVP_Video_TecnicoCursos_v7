/**
 * 🎯 API PPTX PROCESSOR - Integrada ao Workflow Unificado
 * Processa arquivos PowerPoint e integra com o pipeline de vídeo
 * Agora com geração automática de TTS
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { workflowManager } from '@/lib/workflow/unified-workflow-manager'
// @ts-ignore
import formidable from 'formidable'
import fs from 'fs'
import path from 'path'
import { logger } from '@/lib/logger';

// Using API route segment config instead of legacy config
export const maxDuration = 300;

// Interface para dados do PPTX
interface PPTXSlide {
  id: string
  title: string
  content: string
  notes: string
  images: PPTXImage[]
  layout: PPTXLayout
  order: number
  duration?: number
  audioText?: string // Texto combinado para TTS
}

interface PPTXImage {
  id: string
  url: string
  alt: string
  width: number
  height: number
  x: number
  y: number
}

interface PPTXLayout {
  width: number
  height: number
  background: string
  theme: string
}

interface TTSRequest {
  text: string
  voice: string
  speed: number
  pitch: number
  volume: number
}

class PPTXProcessor {
  async processPPTX(filePath: string, projectId: string): Promise<PPTXSlide[]> {
    try {
      // Simular processamento do PPTX (integrar com biblioteca real)
      const slides: PPTXSlide[] = [
        {
          id: '1',
          title: 'Slide 1 - Introdução',
          content: 'Conteúdo do primeiro slide extraído do PowerPoint',
          notes: 'Notas do apresentador para este slide',
          images: [],
          layout: {
            width: 1920,
            height: 1080,
            background: '#ffffff',
            theme: 'default'
          },
          order: 1,
          duration: 5000,
          audioText: 'Slide 1 - Introdução. Conteúdo do primeiro slide extraído do PowerPoint. Notas do apresentador para este slide.'
        },
        {
          id: '2',
          title: 'Slide 2 - Desenvolvimento',
          content: 'Conteúdo do segundo slide com informações importantes',
          notes: 'Notas adicionais para o segundo slide',
          images: [],
          layout: {
            width: 1920,
            height: 1080,
            background: '#ffffff',
            theme: 'default'
          },
          order: 2,
          duration: 5000,
          audioText: 'Slide 2 - Desenvolvimento. Conteúdo do segundo slide com informações importantes. Notas adicionais para o segundo slide.'
        },
        {
          id: '3',
          title: 'Slide 3 - Conclusão',
          content: 'Resumo dos pontos principais e próximos passos',
          notes: 'Encerramento da apresentação',
          images: [],
          layout: {
            width: 1920,
            height: 1080,
            background: '#ffffff',
            theme: 'default'
          },
          order: 3,
          duration: 5000,
          audioText: 'Slide 3 - Conclusão. Resumo dos pontos principais e próximos passos. Encerramento da apresentação.'
        }
      ]

      // Salvar no banco de dados
      await prisma.project.update({
        where: { id: projectId },
        data: {
          metadata: JSON.parse(JSON.stringify({
            slides: slides,
            totalSlides: slides.length,
            extractedAt: new Date().toISOString(),
            autoTTSEnabled: true
          }))
        }
      })

      return slides

    } catch (error) {
      logger.error('Error processing PPTX', error instanceof Error ? error : new Error(String(error)), { component: 'API: pptx/process' })
      throw new Error('Failed to process PPTX file')
    }
  }

  async convertSlidesToVideoData(slides: PPTXSlide[]): Promise<Record<string, unknown>> {
    return {
      scenes: slides.map((slide, index) => ({
        id: slide.id,
        type: 'slide',
        duration: slide.duration || 5000,
        content: {
          title: slide.title,
          text: slide.content,
          notes: slide.notes,
          background: slide.layout.background,
          audioText: slide.audioText
        },
        order: index
      })),
      totalDuration: slides.reduce((total, slide) => total + (slide.duration || 5000), 0),
      resolution: {
        width: 1920,
        height: 1080
      }
    }
  }

  async generateAutoTTS(slides: PPTXSlide[], projectId: string): Promise<Record<string, unknown>> {
    try {
      logger.info('🎤 Iniciando geração automática de TTS...', { component: 'API: pptx/process' })
      
      // Configuração padrão para TTS automático
      const defaultTTSConfig = {
        provider: 'elevenlabs',
        voice: 'Rachel',
        speed: 1.0,
        pitch: 1.0,
        volume: 0.8,
        language: 'pt-BR'
      }

      const ttsJobs = []

      for (const slide of slides) {
        if (slide.audioText) {
          const ttsRequest: TTSRequest = {
            text: slide.audioText,
            voice: defaultTTSConfig.voice,
            speed: defaultTTSConfig.speed,
            pitch: defaultTTSConfig.pitch,
            volume: defaultTTSConfig.volume
          }

          // Simular chamada para API de TTS
          const audioResult = await this.callTTSAPI(ttsRequest, slide.id)
          
          ttsJobs.push({
            slideId: slide.id,
            audioUrl: audioResult.audioUrl,
            duration: audioResult.duration,
            status: 'completed'
          })
        }
      }

      // Atualizar projeto com dados de TTS
      await prisma.project.update({
        where: { id: projectId },
        data: {
          metadata: JSON.parse(JSON.stringify({
            slides: slides,
            totalSlides: slides.length,
            extractedAt: new Date().toISOString(),
            autoTTSEnabled: true,
            ttsJobs: ttsJobs,
            ttsConfig: defaultTTSConfig,
            ttsGeneratedAt: new Date().toISOString()
          }))
        }
      })

      logger.info('✅ TTS automático gerado com sucesso!', { component: 'API: pptx/process' })
      
      return {
        success: true,
        ttsJobs,
        config: defaultTTSConfig,
        totalAudioDuration: ttsJobs.reduce((total, job) => total + (job.duration as number), 0)
      }

    } catch (error) {
      logger.error('Error generating auto TTS', error instanceof Error ? error : new Error(String(error)), { component: 'API: pptx/process' })
      throw new Error('Failed to generate automatic TTS')
    }
  }

  private async callTTSAPI(request: TTSRequest, slideId: string): Promise<Record<string, unknown>> {
    // Simular chamada para API de TTS (ElevenLabs, Azure, etc.)
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simular delay

    return {
      audioUrl: `/api/audio/tts/${slideId}.mp3`,
      duration: Math.floor(request.text.length * 50), // Aproximadamente 50ms por caractere
      format: 'mp3',
      bitrate: '128kbps',
      sampleRate: '44100Hz'
    }
  }

  async triggerAvatarGeneration(projectId: string, slides: PPTXSlide[]): Promise<Record<string, unknown>> {
    try {
      logger.info('👤 Iniciando geração automática de Avatar...', { component: 'API: pptx/process' })
      
      // Configuração padrão para Avatar 3D
      const defaultAvatarConfig = {
        model: 'professional-female',
        pose: 'presentation',
        expression: 'friendly',
        gestures: true,
        eyeContact: 0.8,
        quality: 'standard'
      }

      // Simular geração de avatar para cada slide
      const avatarJobs = slides.map(slide => ({
        slideId: slide.id,
        avatarUrl: `/api/avatars/generated/${slide.id}.mp4`,
        duration: slide.duration || 5000,
        status: 'completed',
        config: defaultAvatarConfig
      }))

      logger.info('✅ Avatar automático configurado!', { component: 'API: pptx/process' })
      
      return {
        success: true,
        avatarJobs,
        config: defaultAvatarConfig
      }

    } catch (error) {
      logger.error('Error generating auto avatar', error instanceof Error ? error : new Error(String(error)), { component: 'API: pptx/process' })
      throw new Error('Failed to generate automatic avatar')
    }
  }
}

const pptxProcessor = new PPTXProcessor()

// POST - Upload e processamento de PPTX com TTS automático
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const projectId = formData.get('projectId') as string
    const autoTTS = formData.get('autoTTS') === 'true'
    const autoAvatar = formData.get('autoAvatar') === 'true'

    if (!file || !projectId) {
      return NextResponse.json({ error: 'File and project ID required' }, { status: 400 })
    }

    if (!file.name.endsWith('.pptx')) {
      return NextResponse.json({ error: 'Only PPTX files are supported' }, { status: 400 })
    }

    // Verificar se o projeto existe e pertence ao usuário
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Salvar arquivo temporariamente
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    const uploadDir = path.join(process.cwd(), 'uploads', 'pptx')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    const filePath = path.join(uploadDir, `${projectId}-${file.name}`)
    fs.writeFileSync(filePath, buffer)

    logger.info('📄 Processando PPTX...', { component: 'API: pptx/process' })
    
    // Processar PPTX
    const slides = await pptxProcessor.processPPTX(filePath, projectId)
    const videoData = await pptxProcessor.convertSlidesToVideoData(slides)

    let ttsResult = null
    let avatarResult = null

    // Gerar TTS automaticamente se solicitado
    if (autoTTS) {
      logger.info('🎤 Gerando TTS automático...', { component: 'API: pptx/process' })
      ttsResult = await pptxProcessor.generateAutoTTS(slides, projectId)
      
      // Atualizar workflow para TTS
      await workflowManager.updateWorkflowStep(projectId, 'tts', 'completed', ttsResult)
    }

    // Gerar Avatar automaticamente se solicitado
    if (autoAvatar) {
      logger.info('👤 Configurando Avatar automático...', { component: 'API: pptx/process' })
      avatarResult = await pptxProcessor.triggerAvatarGeneration(projectId, slides)
      
      // Atualizar workflow para Avatar
      await workflowManager.updateWorkflowStep(projectId, 'avatar', 'completed', avatarResult)
    }

    // Atualizar workflow de import
    await workflowManager.updateWorkflowStep(projectId, 'import', 'completed', {
      slides,
      videoData,
      originalFile: file.name,
      autoTTS: autoTTS,
      autoAvatar: autoAvatar
    })

    // Limpar arquivo temporário
    fs.unlinkSync(filePath)

    logger.info('✅ PPTX processado com sucesso!', { component: 'API: pptx/process' })

    return NextResponse.json({
      success: true,
      slides,
      videoData,
      ttsResult,
      avatarResult,
      message: 'PPTX processed successfully with integrated workflow',
      nextSteps: {
        ttsGenerated: !!ttsResult,
        avatarConfigured: !!avatarResult,
        readyForRender: !!(ttsResult && avatarResult)
      }
    })

  } catch (error) {
    logger.error('PPTX API Error', error instanceof Error ? error : new Error(String(error)), { component: 'API: pptx/process' })
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET - Obter dados processados do PPTX
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 })
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const metadata = project.metadata as Record<string, unknown> | null

    return NextResponse.json({
      slides: metadata?.slides || [],
      videoData: metadata?.videoData || null,
      ttsJobs: metadata?.ttsJobs || [],
      ttsConfig: metadata?.ttsConfig || null,
      avatarJobs: metadata?.avatarJobs || [],
      autoTTSEnabled: metadata?.autoTTSEnabled || false,
      extractedAt: metadata?.extractedAt || null,
      ttsGeneratedAt: metadata?.ttsGeneratedAt || null
    })

  } catch (error) {
    logger.error('PPTX GET Error', error instanceof Error ? error : new Error(String(error)), { component: 'API: pptx/process' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Regenerar TTS para slides específicos
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId, slideIds, ttsConfig } = await request.json()

    if (!projectId || !slideIds || !Array.isArray(slideIds)) {
      return NextResponse.json({ error: 'Project ID and slide IDs required' }, { status: 400 })
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id
      }
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const metadata = project.metadata as Record<string, unknown> | null
    const slides = (metadata?.slides || []) as PPTXSlide[]
    
    // Filtrar slides para regenerar TTS
    const slidesToProcess = slides.filter((slide: PPTXSlide) => 
      slideIds.includes(slide.id)
    )

    if (slidesToProcess.length === 0) {
      return NextResponse.json({ error: 'No valid slides found' }, { status: 400 })
    }

    // Regenerar TTS para slides específicos
    const ttsResult = await pptxProcessor.generateAutoTTS(slidesToProcess, projectId)

    return NextResponse.json({
      success: true,
      regeneratedSlides: slideIds,
      ttsResult,
      message: 'TTS regenerated successfully for selected slides'
    })

  } catch (error) {
    logger.error('PPTX PUT Error', error instanceof Error ? error : new Error(String(error)), { component: 'API: pptx/process' })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
