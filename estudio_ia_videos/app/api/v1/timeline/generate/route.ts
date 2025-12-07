

/**
 * Timeline Generation API - Production
 * Generates video timeline from processed PPTX slides
 */

import { NextRequest, NextResponse } from 'next/server'

interface TimelineSlide {
  id: string
  title: string
  content: string
  duration: number
  order: number
}

interface TimelineScene {
  id: string
  slideId: string
  startTime: number
  duration: number
  transitions: {
    in: string
    out: string
  }
  narration?: {
    text: string
    voiceId: string
  }
  effects: {
    entrance: string[]
    exit: string[]
  }
}

interface TimelineData {
  id: string
  totalDuration: number
  scenes: TimelineScene[]
  settings: {
    resolution: string
    framerate: number
    aspectRatio: string
  }
  audio: {
    backgroundMusic?: string
    volume: number
  }
}

export async function POST(request: NextRequest) {
  try {
    const { slides, jobId } = await request.json()
    
    if (!slides || !Array.isArray(slides)) {
      return NextResponse.json(
        { error: 'Slides são obrigatórios' },
        { status: 400 }
      )
    }
    
    console.log('⚡ Starting timeline generation:', { 
      slideCount: slides.length, 
      jobId 
    })
    
    // Generate timeline scenes
    const scenes: TimelineScene[] = []
    let currentTime = 0
    
    slides.forEach((slide: TimelineSlide, index: number) => {
      const scene: TimelineScene = {
        id: `scene_${index + 1}`,
        slideId: slide.id,
        startTime: currentTime,
        duration: slide.duration || 8, // Default 8 seconds
        transitions: {
          in: index === 0 ? 'fade' : 'slide-left',
          out: index === slides.length - 1 ? 'fade' : 'slide-left'
        },
        narration: {
          text: slide.content || slide.title || '',
          voiceId: 'pt-BR-clara-neural'
        },
        effects: {
          entrance: ['fadeIn', 'slideInLeft'],
          exit: ['fadeOut']
        }
      }
      
      scenes.push(scene)
      currentTime += scene.duration
    })
    
    const timeline: TimelineData = {
      id: `timeline_${jobId || Date.now()}`,
      totalDuration: currentTime,
      scenes,
      settings: {
        resolution: '1920x1080',
        framerate: 30,
        aspectRatio: '16:9'
      },
      audio: {
        volume: 0.8
      }
    }
    
    console.log('✅ Timeline generated:', {
      totalDuration: timeline.totalDuration,
      scenes: scenes.length,
      avgSceneDuration: timeline.totalDuration / scenes.length
    })
    
    return NextResponse.json({
      success: true,
      timeline,
      stats: {
        totalScenes: scenes.length,
        totalDuration: timeline.totalDuration,
        averageSceneDuration: Math.round(timeline.totalDuration / scenes.length),
        generatedAt: new Date().toISOString()
      }
    })
    
  } catch (error: unknown) {
    console.error('❌ Timeline generation error:', error)
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    
    return NextResponse.json(
      { 
        success: false,
        error: message 
      },
      { status: 500 }
    )
  }
}


