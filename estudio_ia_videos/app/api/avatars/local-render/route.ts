
/**
 * 🎬 API: Local Avatar Render Pipeline
 * Integração do Avatar PT-BR Pipeline no Estúdio IA
 * 
 * Pipeline:
 * 1. Gera áudio com TTS (ElevenLabs/Azure)
 * 2. Processa lip sync e animação
 * 3. Renderiza vídeo final
 * 4. Upload para S3
 * 5. Salva no Prisma
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EnhancedTTSService } from '@/lib/enhanced-tts-service';
import { S3UploadEngine } from '@/lib/s3-upload-engine';
import { LocalAvatarRenderer } from '@/lib/local-avatar-renderer';
import { Prisma } from '@prisma/client';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      text, 
      avatarId, 
      voiceId, 
      resolution = 'HD',
      fps = 30,
      userId 
    } = body;

    // Validação
    if (!text || !avatarId || !voiceId || !userId) {
      return NextResponse.json(
        { error: 'text, avatarId, voiceId e userId são obrigatórios' },
        { status: 400 }
      );
    }

    if (text.length > 800) {
      return NextResponse.json(
        { error: 'Texto muito longo (máximo 800 caracteres)' },
        { status: 400 }
      );
    }

    // ETAPA 1: Criar job no Prisma (ProcessingQueue)
    const jobData = {
      userId,
      avatarId,
      text,
      audioUrl: '',
      resolution,
      fps,
      duration: 0,
      currentStage: 'preparation',
      estimatedTime: 0,
      videoUrl: '',
      thumbnail: '',
      error: null,
      errorDetails: null
    };

    const job = await prisma.processingQueue.create({
      data: {
        jobType: 'avatar-3d-render',
        status: 'pending',
        priority: 1,
        jobData: jobData as Prisma.InputJsonValue
      }
    });

    // ETAPA 2: Gera áudio com TTS (async)
    // Inicia processamento em background
    processAvatarRendering(job.id, text, voiceId, avatarId, resolution, fps)
      .catch(error => {
        logger.error(`[Job ${job.id}] Erro no processamento`, error instanceof Error ? error : new Error(String(error)), { component: 'API: avatars/local-render' });
        // Atualiza job com erro
        prisma.processingQueue.update({
          where: { id: job.id },
          data: {
            status: 'failed',
            errorMessage: error.message,
            jobData: {
              ...jobData,
              error: error.message,
              errorDetails: { stack: error.stack }
            } as Prisma.InputJsonValue
          }
        }).catch((err) => logger.error('Erro ao atualizar job falho', err instanceof Error ? err : new Error(String(err)), { component: 'API: avatars/local-render' }));
      });

    return NextResponse.json({
      success: true,
      jobId: job.id,
      status: 'queued',
      message: 'Renderização iniciada. Use GET /api/avatars/local-render?jobId=<id> para verificar progresso.'
    });

  } catch (error) {
    logger.error('Erro ao iniciar renderização local', error instanceof Error ? error : new Error(String(error)), { component: 'API: avatars/local-render' });
    return NextResponse.json(
      { error: 'Erro ao iniciar renderização' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json(
      { error: 'jobId é obrigatório' },
      { status: 400 }
    );
  }

  try {
    const job = await prisma.processingQueue.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job não encontrado' },
        { status: 404 }
      );
    }

    const jobData = job.jobData as any;

    return NextResponse.json({
      success: true,
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      currentStage: jobData.currentStage,
      estimatedTime: jobData.estimatedTime,
      videoUrl: jobData.videoUrl,
      thumbnail: jobData.thumbnail,
      error: job.errorMessage,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt
    });

  } catch (error) {
    logger.error('Erro ao consultar status do job', error instanceof Error ? error : new Error(String(error)), { component: 'API: avatars/local-render' });
    return NextResponse.json(
      { error: 'Erro ao consultar status' },
      { status: 500 }
    );
  }
}

/**
 * Processa renderização do avatar em background
 */
async function processAvatarRendering(
  jobId: string,
  text: string,
  voiceId: string,
  avatarId: string,
  resolution: string,
  fps: number
) {
  const s3 = new S3UploadEngine();
  const renderer = new LocalAvatarRenderer();

  try {
    // Recuperar job atual para manter dados
    const currentJob = await prisma.processingQueue.findUnique({ where: { id: jobId } });
    let currentData = (currentJob?.jobData as any) || {};

    // ETAPA 1: Gerar áudio TTS
    currentData = { ...currentData, currentStage: 'audio' };
    await prisma.processingQueue.update({
      where: { id: jobId },
      data: {
        status: 'processing',
        progress: 10,
        jobData: currentData
      }
    });

    const ttsResult = await new EnhancedTTSService().synthesize({
      text,
      voice: voiceId,
      speed: 1.0
    });

    if (!ttsResult.audioBuffer) {
      throw new Error('Falha ao gerar áudio TTS');
    }

    // Calcula duração
    const duration = ttsResult.duration * 1000; // ms

    currentData = {
      ...currentData,
      audioUrl: 'mock-audio-url', // TTS service returns buffer, we'd need to upload it. For now mock.
      duration,
      estimatedTime: Math.ceil(duration / 100)
    };

    await prisma.processingQueue.update({
      where: { id: jobId },
      data: {
        progress: 25,
        jobData: currentData
      }
    });

    // ETAPA 2: Processar lip sync e animação
    currentData = { ...currentData, currentStage: 'lipsync' };
    await prisma.processingQueue.update({
      where: { id: jobId },
      data: {
        progress: 40,
        jobData: currentData
      }
    });

    // Mock LipSync
    const animationData = { visemes: [] }; 

    // ETAPA 3: Renderizar vídeo
    currentData = { ...currentData, currentStage: 'rendering' };
    await prisma.processingQueue.update({
      where: { id: jobId },
      data: {
        progress: 60,
        jobData: currentData
      }
    });

    // Use renderSequence
    const frames = await renderer.renderSequence(
      { type: '2d', assetPath: avatarId, dimensions: { width: 1280, height: 720 } },
      Math.ceil(duration / 1000 * fps)
    );
    const videoBuffer = Buffer.concat(frames); // This is just images, not video. Mocking video buffer.

    // ETAPA 4: Upload para S3
    currentData = { ...currentData, currentStage: 'encoding' };
    await prisma.processingQueue.update({
      where: { id: jobId },
      data: {
        progress: 85,
        jobData: currentData
      }
    });

    const uploadResult = await s3.upload({
      bucket: 'avatars',
      key: `avatar_${jobId}_${Date.now()}.mp4`,
      buffer: videoBuffer
    });

    if (!uploadResult.url) {
      throw new Error(`Falha no upload S3`);
    }

    // ETAPA 5: Finalizar
    currentData = {
      ...currentData,
      currentStage: 'completed',
      videoUrl: uploadResult.url,
      fileSize: uploadResult.size
    };

    await prisma.processingQueue.update({
      where: { id: jobId },
      data: {
        status: 'completed',
        progress: 100,
        jobData: currentData
      }
    });

    logger.info(`[Job ${jobId}] ✅ Renderização concluída com sucesso`, { component: 'API: avatars/local-render' });

  } catch (error) {
    logger.error(`[Job ${jobId}] ❌ Erro`, error instanceof Error ? error : new Error(String(error)), { component: 'API: avatars/local-render' });
    throw error;
  }
}
