
/**
 * ⏱️ API de Geração de Timeline
 * Gerar timeline de vídeo baseado nos slides processados
 */

import { NextRequest, NextResponse } from 'next/server'

interface TimelineScene {
  sceneId: string
  slideNumber: number
  startTime: number
  endTime: number
  duration: number
  transitions: string[]
  voiceover?: {
    text: string
    voice: string
    audioFile?: string
  }
  avatar?: {
    id: string
    position: string
    animation: string
  }
  background?: {
    type: 'color' | 'image' | 'video'
    value: string
  }
  elements: Array<{
    type: 'text' | 'image' | 'shape'
    content: string
    position: { x: number; y: number; width: number; height: number }
    animation?: string
    timing: { start: number; end: number }
  }>
}

interface GeneratedTimeline {
  success: boolean
  timeline?: {
    totalDuration: number
    fps: number
    resolution: { width: number; height: number }
    scenes: TimelineScene[]
    audioTracks: Array<{
      trackId: string
      type: 'voiceover' | 'music' | 'sfx'
      file: string
      startTime: number
      endTime: number
      volume: number
    }>
    metadata: {
      generatedAt: string
      version: string
      templateUsed: string
    }
  }
  error?: string
}

export async function POST(request: NextRequest): Promise<NextResponse<GeneratedTimeline>> {
  console.log('⏱️ Gerando timeline de vídeo...')
  
  try {
    const { s3Key, slides, options } = await request.json()

    if (!s3Key || !slides) {
      return NextResponse.json({
        success: false,
        error: 'S3 key e slides são obrigatórios'
      }, { status: 400 })
    }

    console.log(`🎬 Gerando timeline para ${slides.length} slides`)

    // Opções padrão para geração de timeline
    const timelineOptions = {
      defaultSlideDuration: 8, // segundos
      transitionDuration: 1,
      addVoiceover: true,
      addBackgroundMusic: true,
      avatarEnabled: true,
      resolution: { width: 1920, height: 1080 },
      fps: 30,
      ...options
    }

    // Gerar cenas baseadas nos slides
    const scenes: TimelineScene[] = []
    let currentTime = 0

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i]
      const duration = slide.duration || timelineOptions.defaultSlideDuration
      const endTime = currentTime + duration

      const scene: TimelineScene = {
        sceneId: `scene_${slide.slideNumber}`,
        slideNumber: slide.slideNumber,
        startTime: currentTime,
        endTime: endTime,
        duration: duration,
        transitions: generateTransitions(i, slides.length),
        elements: generateSceneElements(slide)
      }

      // Adicionar narração se habilitada
      if (timelineOptions.addVoiceover && slide.content) {
        scene.voiceover = {
          text: slide.content,
          voice: 'brazilian-female-1',
          audioFile: `voiceover_slide_${slide.slideNumber}.mp3`
        }
      }

      // Adicionar avatar se habilitado
      if (timelineOptions.avatarEnabled) {
        scene.avatar = {
          id: 'avatar_professional_1',
          position: 'right',
          animation: 'talking'
        }
      }

      // Configurar background
      scene.background = {
        type: slide.backgroundImage ? 'image' : 'color',
        value: slide.backgroundImage || '#ffffff'
      }

      scenes.push(scene)
      currentTime = endTime
    }

    // Gerar trilhas de áudio
    const audioTracks = []
    
    // Trilha de narração
    for (const scene of scenes) {
      if (scene.voiceover) {
        audioTracks.push({
          trackId: `voiceover_${scene.sceneId}`,
          type: 'voiceover' as const,
          file: scene.voiceover.audioFile!,
          startTime: scene.startTime,
          endTime: scene.endTime,
          volume: 0.8
        })
      }
    }

    // Música de fundo se habilitada
    if (timelineOptions.addBackgroundMusic) {
      audioTracks.push({
        trackId: 'background_music',
        type: 'music' as const,
        file: 'background_corporate_music.mp3',
        startTime: 0,
        endTime: currentTime,
        volume: 0.3
      })
    }

    const timeline = {
      totalDuration: currentTime,
      fps: timelineOptions.fps,
      resolution: timelineOptions.resolution,
      scenes,
      audioTracks,
      metadata: {
        generatedAt: new Date().toISOString(),
        version: '1.0.0',
        templateUsed: 'professional_corporate'
      }
    }

    console.log(`✅ Timeline gerada: ${scenes.length} cenas, ${currentTime}s total`)

    return NextResponse.json({
      success: true,
      timeline
    })

  } catch (error) {
    console.error('❌ Erro na geração de timeline:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno'
    }, { status: 500 })
  }
}

// Gerar transições apropriadas
function generateTransitions(slideIndex: number, totalSlides: number): string[] {
  const transitions = ['fade', 'slide', 'zoom', 'wipe', 'dissolve']
  
  if (slideIndex === 0) return ['fadeIn'] // Primeira cena
  if (slideIndex === totalSlides - 1) return ['fadeOut'] // Última cena
  
  // Transições aleatórias para cenas intermediárias
  return [transitions[Math.floor(Math.random() * transitions.length)]]
}

interface SlideData {
  slideNumber: number
  duration?: number
  content?: string
  title?: string
  images?: string[]
  backgroundImage?: string
}

// Gerar elementos da cena baseados no conteúdo do slide
function generateSceneElements(slide: SlideData) {
  const elements: Array<{
    type: 'text' | 'image' | 'shape'
    content: string
    position: { x: number; y: number; width: number; height: number }
    animation?: string
    timing: { start: number; end: number }
  }> = []

  // Elemento de título
  if (slide.title) {
    elements.push({
      type: 'text' as const,
      content: slide.title,
      position: { x: 50, y: 50, width: 800, height: 100 },
      animation: 'fadeInUp',
      timing: { start: 0, end: slide.duration || 8 }
    })
  }

  // Elemento de conteúdo
  if (slide.content) {
    elements.push({
      type: 'text' as const,
      content: slide.content,
      position: { x: 50, y: 200, width: 800, height: 400 },
      animation: 'fadeIn',
      timing: { start: 1, end: slide.duration || 8 }
    })
  }

  // Elementos de imagem
  slide.images?.forEach((image: string, index: number) => {
    elements.push({
      type: 'image' as const,
      content: image,
      position: { 
        x: 900 + (index * 100), 
        y: 200, 
        width: 300, 
        height: 200 
      },
      animation: 'zoomIn',
      timing: { start: 2 + index, end: slide.duration || 8 }
    })
  })

  return elements
}

