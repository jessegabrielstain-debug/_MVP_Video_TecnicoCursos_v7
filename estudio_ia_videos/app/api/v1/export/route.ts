// TODO: Fix Prisma Project type properties
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseForRequest } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { RenderService } from '@/lib/services/render-service';
import { Slide } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = getSupabaseForRequest(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await request.json();

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    // Fetch project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { slides: true } // Assuming slides are in a relation or we use slidesData
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Prepare slides for Remotion
    // We need to map DB slides or slidesData to the format expected by Composition
    let slidesForRender: Slide[] = [];
    if (project.slidesData && Array.isArray((project.slidesData as any).slides)) {
       slidesForRender = (project.slidesData as any).slides.map((s: any, index: number) => ({
         id: s.id || Math.random().toString(),
         number: index + 1,
         order_index: index,
         elements: s.elements || [],
         content: s.content || '',
         title: s.title || '',
         duration: s.duration || 5,
         visualSettings: {
            backgroundImageUrl: s.backgroundImage
         }
       }));
    } else if (project.slides && project.slides.length > 0) {
       slidesForRender = project.slides.map((s: any, index: number) => ({
         id: s.id,
         number: index + 1,
         order_index: index,
         elements: [], // Default empty elements if not present
         content: s.content,
         title: s.title,
         duration: s.duration || 5,
         visualSettings: {
            backgroundImageUrl: s.backgroundImage
         }
       }));
    }

    if (slidesForRender.length === 0) {
       return NextResponse.json({ error: 'No slides to render' }, { status: 400 });
    }

    // Trigger render
    // Note: In a real app, this should be a background job (BullMQ/Redis).
    // For MVP, we await it (might timeout) or just start it and return "processing".
    // Given the "Force Mode" and likely timeouts on Vercel/Serverless, we should ideally use a job queue.
    // But since we are running locally/VPS, we can try to await it or fire-and-forget.
    // Let's await it for now to see the result, but handle timeout risk.
    
    console.log(`Starting render for project ${projectId} with ${slidesForRender.length} slides`);
    
    // Update status to processing immediately
    await prisma.project.update({
      where: { id: projectId },
      data: { status: 'PROCESSING' } // Ensure case matches enum
    });

    // Trigger render in background (Fire & Forget)
    // In a production serverless env, this might be killed. 
    // For this MVP/VPS setup, it should persist long enough or we should use a queue.
    RenderService.renderVideo(projectId, slidesForRender)
      .then(async (result) => {
        console.log(`Render success for ${projectId}`);
        await prisma.project.update({
          where: { id: projectId },
          data: {
            status: 'COMPLETED',
            metadata: {
              ...(project.metadata as object || {}),
              videoUrl: result.videoUrl
            }
          }
        });
      })
      .catch(async (error) => {
        console.error(`Render failed for ${projectId}:`, error);
        await prisma.project.update({
          where: { id: projectId },
          data: {
            status: 'ERROR',
            metadata: {
              ...(project.metadata as object || {}),
              errorMessage: error instanceof Error ? error.message : 'Unknown render error'
            }
          }
        });
      });

    return NextResponse.json({
      success: true,
      jobId: projectId,
      message: 'Renderization started in background'
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Export failed', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
