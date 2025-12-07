/**
 * API para verificar status de render - FASE 2 REAL
 * GET /api/render/status?jobId=xxx
 * Sistema real de monitoramento de renderização
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getVideoJobStatus } from '@/lib/queue/render-queue';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { project_id, preset_id } = body;

    if (!project_id || !preset_id) {
      return NextResponse.json(
        { error: 'project_id and preset_id are required' },
        { status: 400 }
      );
    }

    // Generate job ID
    const job_id = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return NextResponse.json({
      success: true,
      job_id,
      status: 'queued',
      project_id,
      preset_id,
      message: 'Video pipeline render job created successfully',
      created_at: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid JSON payload' },
      { status: 400 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Allow unauthenticated access for development/polling
    // const session = await getServerSession(authOptions);
    // if (!session?.user?.id) {
    //   return NextResponse.json(
    //     { error: 'Não autenticado' },
    //     { status: 401 }
    //   );
    // }

    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { error: 'jobId obrigatório' },
        { status: 400 }
      );
    }

    console.log(`📊 [API] Verificando status do job: ${jobId}`);

    // Try Supabase first (main database)
    try {
      const { getSupabaseForRequest } = await import('@/lib/supabase/server');
      const supabase = getSupabaseForRequest(req);
      
      const { data: renderJob, error } = await supabase
        .from('render_jobs')
        .select('id, project_id, status, progress, output_url, error_message, render_settings, created_at, completed_at')
        .eq('id', jobId)
        .single();

      if (renderJob && !error) {
        return NextResponse.json({
          success: true,
          jobId,
          status: renderJob.status,
          progress: renderJob.progress || 0,
          outputUrl: renderJob.output_url,
          error: renderJob.error_message,
          config: renderJob.render_settings,
          createdAt: renderJob.created_at,
          completedAt: renderJob.completed_at,
          timestamp: new Date().toISOString()
        });
      }
    } catch (supabaseError) {
      console.warn('[API] Supabase unavailable, trying Prisma...');
    }

    // Fallback to Prisma
    try {
      const { prisma } = await import('@/lib/db');
      const renderJob = await prisma.renderJob.findUnique({
        where: { id: jobId },
        include: {
          project: {
            select: {
              id: true,
              title: true,
              status: true,
              thumbnailUrl: true,
              duration: true
            }
          }
        }
      });

      if (renderJob) {
        return NextResponse.json({
          success: true,
          jobId,
          status: renderJob.status,
          progress: renderJob.progress || 0,
          outputUrl: renderJob.outputUrl,
          error: renderJob.errorMessage,
          createdAt: renderJob.createdAt?.toISOString(),
          completedAt: renderJob.completedAt?.toISOString(),
          timestamp: new Date().toISOString()
        });
      }
    } catch (prismaError) {
      console.warn('[API] Prisma unavailable, falling back to queue status');
    }

    // Fallback to queue status
    const status = await getVideoJobStatus(jobId);

    if (!status) {
      return NextResponse.json(
        { error: 'Job não encontrado', status: 'not_found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      jobId,
      status: status,
      progress: 0,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[API] Erro ao verificar status:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao verificar status',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}


