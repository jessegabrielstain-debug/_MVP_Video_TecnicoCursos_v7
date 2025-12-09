import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseForRequest } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

// Type for project metadata
interface ProjectMetadata {
  timeline?: {
    id?: string;
    name?: string;
    duration?: number;
    fps?: number;
    width?: number;
    height?: number;
    tracks?: unknown[];
    currentTime?: number;
    isPlaying?: boolean;
    zoom?: number;
  };
}

interface RenderSettings {
  duration?: number;
  fps?: number;
  width?: number;
  height?: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseForRequest(request)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (error || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const metadata = project.metadata as ProjectMetadata | null;
    const renderSettings = project.render_settings as RenderSettings | null;
    
    // Return the timeline JSON stored in metadata
    // If metadata.timeline exists, return it.
    // Otherwise, construct a basic project object.
    const timelineData = metadata?.timeline || {
        id: project.id,
        name: project.name,
        duration: renderSettings?.duration || 120,
        fps: renderSettings?.fps || 30,
        width: renderSettings?.width || 1920,
        height: renderSettings?.height || 1080,
        tracks: [], // Empty if no timeline data
        currentTime: 0,
        isPlaying: false,
        zoom: 1
    }

    // Ensure ID matches (in case it was stored differently)
    timelineData.id = project.id

    return NextResponse.json(timelineData)

  } catch (error) {
    logger.error('Error loading project', { 
      component: 'API: timeline/projects/[id]', 
      error: error instanceof Error ? error : new Error(String(error)) 
    })
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseForRequest(request)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Update 'projects' table
    const { error: updateError } = await supabase
      .from('projects')
      .update({
        name: body.name,
        updated_at: new Date().toISOString(),
        metadata: {
            // Preserve existing metadata if needed, but here we assume body is the full timeline
            // We should probably fetch existing metadata first if we want to merge
            // But for now, let's store the timeline in metadata.timeline
            timeline: body
        },
        render_settings: {
            width: body.width,
            height: body.height,
            fps: body.fps,
            duration: body.duration
        }
      })
      .eq('id', params.id)
      .eq('user_id', user.id)

    if (updateError) throw updateError

    // Sync 'slides' table for Worker compatibility
    // 1. Delete existing slides
    await supabase.from('slides').delete().eq('project_id', params.id)

    // 2. Insert new slides from tracks
    const tracks = body.tracks as any[]
    const slideTrack = tracks.find(t => t.name === 'Slides PPTX' || t.type === 'video')
    
    if (slideTrack && slideTrack.elements) {
        const slidesToInsert = slideTrack.elements.map((el: any, index: number) => ({
            project_id: params.id,
            order_index: index,
            title: el.name,
            content: el.properties?.content || el.name,
            duration: Math.round(el.duration),
            background_image: el.properties?.src
        }))

        if (slidesToInsert.length > 0) {
            const { error: slidesError } = await supabase
                .from('slides')
                .insert(slidesToInsert)
            
            if (slidesError) {
                logger.error('Error syncing slides', { 
                  component: 'API: timeline/projects/[id]', 
                  error: slidesError instanceof Error ? slidesError : new Error(String(slidesError)) 
                })
            }
        }
    }

    return NextResponse.json({
      success: true,
      message: 'Project saved successfully'
    })

  } catch (error) {
    logger.error('Error saving project', { 
      component: 'API: timeline/projects/[id]', 
      error: error instanceof Error ? error : new Error(String(error)) 
    })
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseForRequest(request)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully'
    })

  } catch (error) {
    logger.error('Error deleting project', { 
      component: 'API: timeline/projects/[id]', 
      error: error instanceof Error ? error : new Error(String(error)) 
    })
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}