import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseForRequest } from '@/lib/supabase/server'
import { z } from 'zod'
import { logger } from '@/lib/logger'

// Schema validation (simplified)
const TimelineProjectSchema = z.object({
  name: z.string(),
  duration: z.number(),
  fps: z.number(),
  width: z.number(),
  height: z.number(),
  tracks: z.array(z.any()), // We trust the structure for now, or could be more specific
  metadata: z.record(z.unknown()).optional()
})

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseForRequest(request)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Basic validation
    const validation = TimelineProjectSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid data', details: validation.error }, { status: 400 })
    }

    const projectData = validation.data

    // 1. Create Project in 'projects' table
    const { data: newProject, error: projectError } = await supabase
      .from('projects')
      .insert({
        name: projectData.name,
        type: 'custom', // or 'pptx' if we can infer
        status: 'draft',
        user_id: user.id,
        metadata: {
            ...projectData.metadata,
            timeline: body // Store full timeline JSON in metadata
        },
        render_settings: {
            width: projectData.width,
            height: projectData.height,
            fps: projectData.fps,
            duration: projectData.duration
        }
      })
      .select()
      .single()

    if (projectError) throw projectError

interface TimelineTrack {
  name: string;
  type: string;
  elements?: Array<{
    name: string;
    duration: number;
    properties?: {
      content?: string;
      src?: string;
    };
  }>;
}

    // 2. Sync Slides (for Worker compatibility)
    // Find the main video/slide track
    const tracks = projectData.tracks as TimelineTrack[]
    const slideTrack = tracks.find(t => t.name === 'Slides PPTX' || t.type === 'video')
    
    if (slideTrack && slideTrack.elements) {
        const slidesToInsert = slideTrack.elements.map((el, index: number) => ({
            project_id: newProject.id,
            order_index: index,
            title: el.name,
            content: el.properties?.content || el.name, // Fallback
            duration: Math.round(el.duration),
            background_image: el.properties?.src,
            // If it's an image slide, we might want to set content to empty or description
        }))

        if (slidesToInsert.length > 0) {
            const { error: slidesError } = await supabase
                .from('slides')
                .insert(slidesToInsert)
            
            if (slidesError) {
                const err = slidesError instanceof Error ? slidesError : new Error(String(slidesError))
                logger.error('Error syncing slides', err, { component: 'API: timeline/projects' })
                // We don't fail the request, but log it. 
                // The project is created, but worker might fail.
            }
        }
    }

    return NextResponse.json({
      success: true,
      data: newProject,
      message: 'Projeto criado com sucesso'
    }, { status: 201 })

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error)); logger.error('Error creating timeline project', err, { component: 'API: timeline/projects' })
    return NextResponse.json({
      success: false,
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseForRequest(request)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: projects
    })

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error)); logger.error('Error fetching projects', err, { component: 'API: timeline/projects' })
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
