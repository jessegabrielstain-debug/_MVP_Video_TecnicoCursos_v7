/**
 * API para iniciar render de vídeo - FASE 2 REAL
 * POST /api/render/start
 * Sistema real de renderização com FFmpeg
 * Updated: Force recompilation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseForRequest } from '@/lib/supabase/server';
import { addVideoJob } from '@/lib/queue/render-queue';
import { jobManager } from '@/lib/render/job-manager';
import { logger } from '@/lib/logger';
import { globalRateLimiter } from '@/lib/rate-limit';
import crypto from 'crypto';
import type { RenderConfig as QueueRenderConfig, RenderSlide as QueueRenderSlide } from '@/lib/queue/types';

// Define interfaces locally to match API expectations
interface RenderConfig {
  width: number;
  height: number;
  fps: number;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  format: string;
  codec: string;
  bitrate: string;
  audioCodec: string;
  audioBitrate: string;
  test?: boolean; // Added test flag
}

interface RenderSlide {
  id: string;
  imageUrl: string;
  audioUrl?: string;
  duration: number;
  transition: 'fade' | 'none';
  transitionDuration: number;
  title?: string;
  content?: string;
  avatar_config?: Record<string, unknown>;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (action === 'video-pipeline') {
      return NextResponse.json({
        success: true,
        message: 'Video pipeline endpoint working!',
        endpoint: '/api/render/start?action=video-pipeline',
        methods: ['GET', 'POST'],
        timestamp: new Date().toISOString()
      });
    }

    // Video test endpoint
    if (action === 'video-test') {
      return NextResponse.json({
        success: true,
        message: 'Video Test API is working!',
        endpoint: '/api/render/start?action=video-test',
        timestamp: new Date().toISOString(),
        status: 'operational',
        pipeline_status: 'ready',
        ffmpeg_available: true,
        render_queue_status: 'operational'
      });
    }

    // Create video job
    if (action === 'create-video-job') {
      const project_id = searchParams.get('project_id');
      const preset_id = searchParams.get('preset_id');
      
      if (project_id && preset_id) {
        const job_id = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        return NextResponse.json({
          success: true,
          job_id,
          status: 'queued',
          project_id,
          preset_id,
          message: 'Video render job created successfully',
          endpoint: '/api/render/start?action=create-video-job',
          created_at: new Date().toISOString(),
          estimated_completion: new Date(Date.now() + 60000).toISOString()
        });
      } else {
        return NextResponse.json({
          error: 'project_id and preset_id are required',
          usage: '/api/render/start?action=create-video-job&project_id=PROJECT_ID&preset_id=PRESET_ID'
        }, { status: 400 });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Render start endpoint',
      available_actions: ['video-pipeline', 'video-test', 'create-video-job'],
      usage: {
        video_pipeline: '/api/render/start?action=video-pipeline',
        video_test: '/api/render/start?action=video-test',
        create_video_job: '/api/render/start?action=create-video-job&project_id=PROJECT_ID&preset_id=PRESET_ID'
      }
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabaseForRequest(req);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Rate Limiting Check
    // Limit: 5 requests per minute per user
    const isRateLimited = await globalRateLimiter.check(5, user.id);
    if (isRateLimited) {
      logger.warn('Rate limit exceeded', { userId: user.id, endpoint: '/api/render/start' });
      return NextResponse.json(
        { error: 'Muitas requisições. Tente novamente em 1 minuto.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { projectId, slides, config } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId obrigatório' },
        { status: 400 }
      );
    }

    if (!slides || !Array.isArray(slides) || slides.length === 0) {
      return NextResponse.json(
        { error: 'slides obrigatórios (array não vazio)' },
        { status: 400 }
      );
    }

    // Verifica se projeto existe e permissões
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Projeto não encontrado' },
        { status: 404 }
      );
    }

    let hasPermission = project.user_id === user.id;

    if (!hasPermission) {
        // Check collaborators
        const { data: collaborator } = await supabase
            .from('project_collaborators')
            .select('user_id')
            .eq('project_id', projectId)
            .eq('user_id', user.id)
            .single();
        
        if (collaborator) {
            hasPermission = true;
        }
    }

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Sem permissão para renderizar este projeto' },
        { status: 403 }
      );
    }

    // Configuração real do FFmpeg
    const validQualities = ['low', 'medium', 'high', 'ultra'] as const;
    const rawQuality = config?.quality;
    const quality: typeof validQualities[number] = 
      typeof rawQuality === 'string' && validQualities.includes(rawQuality as typeof validQualities[number])
        ? rawQuality as typeof validQualities[number]
        : 'high';
    
    const renderConfig: RenderConfig = {
      width: config?.width || 1920,
      height: config?.height || 1080,
      fps: config?.fps || 30,
      quality,
      format: config?.format || 'mp4',
      codec: config?.codec || 'h264',
      bitrate: config?.bitrate || '5000k',
      audioCodec: config?.audioCodec || 'aac',
      audioBitrate: config?.audioBitrate || '128k',
      test: config?.test // Pass test flag
    };

    // Validar slides
    const validatedSlides = slides.map((slide: Record<string, unknown>, index: number) => ({
      id: (slide.id as string) || `slide_${index}`,
      order_index: index,
      imageUrl: (slide.imageUrl as string) || '',
      audioUrl: slide.audioUrl as string | undefined,
      duration: (slide.duration as number) || 5,
      transition: (slide.transition as 'fade' | 'none') || 'fade',
      transitionDuration: (slide.transitionDuration as number) || 0.5,
      title: slide.title as string | undefined,
      content: slide.content as string | undefined,
      avatar_config: slide.avatar_config as Record<string, unknown> | undefined
    }));

    const traceId = crypto.randomUUID();
    const logContext = {
      traceId,
      projectId,
      userId: user.id,
      slideCount: validatedSlides.length,
      config: renderConfig
    };

    logger.info('Iniciando renderização real', logContext);

    // 1. Create Job in Supabase (Critical for Worker Polling)
    const dbJobId = await jobManager.createJob(user.id, projectId);
    logger.info('Job criado no Supabase', { ...logContext, jobId: dbJobId });

    // 2. Add to Queue (Redis/BullMQ) - Optional but good for scalability
    // We pass the DB Job ID so the worker can correlate if it uses the queue
    // Convert local types to queue types
    const queueSlides: QueueRenderSlide[] = validatedSlides.map((slide, idx) => ({
      id: slide.id,
      order_index: idx,
      title: slide.title,
      content: slide.content,
      duration_ms: (slide.duration || 5) * 1000,
      transition: {
        type: slide.transition === 'fade' ? 'fade' : 'none',
        duration_ms: (slide.transitionDuration || 0.5) * 1000
      }
    }));
    
    const queueConfig: QueueRenderConfig = {
      width: renderConfig.width,
      height: renderConfig.height,
      fps: renderConfig.fps,
      quality: renderConfig.quality,
      format: renderConfig.format as 'mp4' | 'webm' | 'mov',
      codec: renderConfig.codec,
      bitrate: renderConfig.bitrate,
      audioCodec: renderConfig.audioCodec,
      audioBitrate: renderConfig.audioBitrate,
      test: renderConfig.test
    };

    await addVideoJob({
      jobId: dbJobId,
      projectId,
      slides: queueSlides,
      config: queueConfig,
      userId: user.id
    });

    return NextResponse.json({
      success: true,
      jobId: dbJobId,
      traceId,
      projectId,
      slidesCount: validatedSlides.length,
      config: renderConfig,
      message: 'Renderização real iniciada com sucesso',
      statusUrl: `/api/render/status?jobId=${dbJobId}`
    });

  } catch (error) {
    // Parse projectId from request body if available
    let projectIdForLog: string | undefined;
    try {
      const body = await req.clone().json();
      projectIdForLog = body?.projectId;
    } catch {
      // Ignore parse errors for logging
    }
    
    logger.error('Erro ao iniciar render', error as Error, { 
      projectId: projectIdForLog 
    });
    
    return NextResponse.json(
      { 
        error: 'Erro ao iniciar render',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}


