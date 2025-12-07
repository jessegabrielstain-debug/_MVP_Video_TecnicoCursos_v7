import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseForRequest } from '@/lib/supabase/server'

interface SlideRecord {
  id: string
  project_id: string
  order_index: number
  title: string
  content: string
  duration: number
  background_color: string
  background_image: string
  avatar_config: Record<string, unknown> | null
  audio_config: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseForRequest(request)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { projectId } = body

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    // Fetch Project Name
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('name')
      .eq('id', projectId)
      .single()

    if (projectError) {
      console.error('Error fetching project:', projectError)
      return NextResponse.json({ error: 'Error fetching project details' }, { status: 500 })
    }

    // 1. Fetch Slides from the slides table
    const { data: slides, error: slidesError } = await supabase
      .from('slides')
      .select('*')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true })

    if (slidesError) {
        console.error('Error fetching slides:', slidesError)
        return NextResponse.json({ error: 'Error fetching slides' }, { status: 500 })
    }

    if (!slides || slides.length === 0) {
        return NextResponse.json({ error: 'No slides found for this project' }, { status: 404 })
    }

    const typedSlides = slides as SlideRecord[]

    // 2. Convert to Timeline Format
    const slideDuration = 5 // Default duration
    const totalDuration = typedSlides.length * slideDuration

    const timelineElements = typedSlides.map((slide, index) => ({
        id: `slide-${slide.id}`,
        type: 'image',
        name: slide.title || `Slide ${slide.order_index + 1}`,
        duration: slide.duration || slideDuration,
        startTime: index * (slide.duration || slideDuration),
        layer: 0,
        visible: true,
        locked: false,
        properties: {
            src: slide.background_image || '/placeholder.png',
            opacity: 1,
            x: 0,
            y: 0,
            scale: 1,
            rotation: 0
        }
    }))

    const textElements = typedSlides.filter(s => s.title).map((slide, index) => ({
        id: `text-${slide.id}`,
        type: 'text',
        name: `Title ${slide.order_index + 1}`,
        duration: slide.duration || slideDuration,
        startTime: index * (slide.duration || slideDuration),
        layer: 1,
        visible: true,
        locked: false,
        properties: {
            content: slide.title,
            fontSize: 48,
            color: '#ffffff',
            x: 0,
            y: -200, // Top
            opacity: 1,
            scale: 1,
            rotation: 0
        }
    }))

    const timelineData = {
        id: projectId,
        name: project?.name || 'Imported Project',
        duration: totalDuration,
        fps: 30,
        width: 1920,
        height: 1080,
        currentTime: 0,
        isPlaying: false,
        zoom: 1,
        tracks: [
            {
                id: 'track-video',
                name: 'Slides PPTX',
                type: 'video',
                visible: true,
                locked: false,
                elements: timelineElements
            },
            {
                id: 'track-text',
                name: 'Titles',
                type: 'overlay',
                visible: true,
                locked: false,
                elements: textElements
            },
            {
                id: 'track-audio',
                name: 'Audio',
                type: 'audio',
                visible: true,
                locked: false,
                elements: []
            }
        ]
    }

    // 3. Update Project Metadata
    const { error: updateError } = await supabase
        .from('projects')
        .update({
            metadata: {
                timeline: timelineData
            },
            render_settings: {
                duration: totalDuration,
                fps: 30,
                width: 1920,
                height: 1080
            }
        })
        .eq('id', projectId)

    if (updateError) {
        console.error('Error updating project:', updateError)
        return NextResponse.json({ error: 'Error updating project' }, { status: 500 })
    }

    return NextResponse.json({
        success: true,
        message: 'Slides imported to timeline successfully',
        timeline: timelineData
    })

  } catch (error) {
    console.error('Error importing PPTX:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
