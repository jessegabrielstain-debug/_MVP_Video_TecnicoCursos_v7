
/**
 * 🎬 Video Production Render API - Production Ready
 * Sistema real de renderização de vídeo
 */

import { NextRequest, NextResponse } from 'next/server';
import { VideoRenderEngine } from '@/lib/video-render-engine';
import { PPTXRealParser } from '@/lib/pptx-real-parser';

const renderEngine = new VideoRenderEngine();

export async function POST(request: NextRequest) {
  console.log('🎬 Iniciando renderização de vídeo...');

  try {
    const body = await request.json();
    const { 
      s3Key,
      slides, 
      timeline, 
      settings = {
        width: 1920,
        height: 1080,
        fps: 30,
        bitrate: '5000k',
        format: 'mp4',
        quality: 'high',
        audioQuality: 192,
        enableAudio: true
      }
    } = body;

    if (!slides && !s3Key) {
      return NextResponse.json(
        { error: 'Slides ou s3Key são obrigatórios' },
        { status: 400 }
      );
    }

    let slidesData = slides;

    // Se foi fornecido s3Key, fazer parse primeiro
    if (s3Key && !slides) {
      console.log('📥 Processando slides do S3 para renderização:', s3Key);
      const parser = new PPTXRealParser();
      const pptxResult = await parser.parseFromS3(s3Key);
      slidesData = pptxResult.slides;
    }

    // Criar timeline se não foi fornecida
    let timelineData = timeline;
    if (!timeline && slidesData) {
      timelineData = renderEngine.createTimelineFromSlides(slidesData);
    }

    if (!slidesData || !timelineData) {
      return NextResponse.json(
        { error: 'Dados de slides e timeline são obrigatórios' },
        { status: 400 }
      );
    }

    console.log('⚙️ Configurações de renderização:', {
      slides: slidesData.length,
      duration: timelineData.totalDuration,
      quality: settings.quality,
      format: settings.format
    });

    // Iniciar renderização
    const jobId = await renderEngine.startRender(slidesData, timelineData, settings);

    console.log('✅ Job de renderização iniciado:', jobId);

    return NextResponse.json({
      success: true,
      jobId,
      status: 'processing',
      message: 'Renderização iniciada com sucesso',
      estimatedTime: Math.ceil(timelineData.totalDuration / 10), // Estimativa
      settings: {
        resolution: `${settings.width}x${settings.height}`,
        fps: settings.fps,
        quality: settings.quality,
        duration: timelineData.totalDuration
      }
    });

  } catch (error) {
    console.error('❌ Erro na renderização:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro ao iniciar renderização',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    // Retornar lista de todos os jobs
    const jobs = await renderEngine.getAllJobs();
    return NextResponse.json({
      success: true,
      jobs: jobs.map((job: any) => ({
        id: job.id,
        status: job.status,
        progress: job.progress,
        startTime: job.startTime,
        endTime: job.endTime,
        outputPath: job.outputPath,
        errorMessage: job.errorMessage
      }))
    });
  }

  // Retornar status de job específico
  const job = await renderEngine.getJobStatus(jobId);
  
  if (!job) {
    return NextResponse.json(
      { error: 'Job não encontrado' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    job: {
      id: job.id,
      status: job.status,
      progress: job.progress,
      startTime: job.startTime,
      endTime: job.endTime,
      outputPath: job.outputPath,
      errorMessage: job.errorMessage,
      settings: job.settings
    }
  });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json(
      { error: 'Job ID é obrigatório' },
      { status: 400 }
    );
  }

  try {
    const cancelled = await renderEngine.cancelJob(jobId);
    const cleanedUp = await renderEngine.cleanupJob(jobId);

    return NextResponse.json({
      success: true,
      cancelled,
      cleanedUp,
      message: 'Job cancelado e limpo com sucesso'
    });

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Erro ao cancelar job',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

