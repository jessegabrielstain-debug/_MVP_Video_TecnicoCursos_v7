
/**
 * API: Converter PPTX para Timeline
 * POST /api/import/pptx-to-timeline
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createRateLimiter, rateLimitPresets } from '@/lib/utils/rate-limit-middleware';
import { logger } from '@/lib/logger';

const rateLimiter = createRateLimiter(rateLimitPresets.upload);

export async function POST(req: NextRequest) {
  return rateLimiter(req, async (req) => {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      }

      const body = await req.json();
      const { pptxId, projectName, slides, config } = body;

      if (!pptxId || !projectName || !slides) {
        return NextResponse.json(
          { error: 'Dados incompletos' },
          { status: 400 }
        );
      }

      // Criar projeto
      const project = await prisma.project.create({
        data: {
          title: projectName,
          description: `Importado de PPTX (${slides.length} slides)`,
          userId: session.user.id,
          status: 'DRAFT',
          totalSlides: slides.length,
          slidesData: {
            pptxId,
            importConfig: config,
            slides: slides.length,
          },
          settings: {
            type: 'pptx-import'
          }
      },
    });

    // Criar timeline
    let currentTime = 0;
    const clips = [];

    for (const slide of slides) {
      if (!slide.selected) continue;

      // Track 0: Vídeo/Imagem
      clips.push({
        type: 'image',
        trackIndex: 0,
        startTime: currentTime,
        duration: slide.duration,
        source: slide.thumbnailUrl,
        metadata: {
          slideNumber: slide.slideNumber,
          title: slide.title,
          notes: slide.notes,
        },
      });

      // Track 1: Texto (título)
      if (slide.title) {
        clips.push({
          type: 'text',
          trackIndex: 1,
          startTime: currentTime,
          duration: slide.duration,
          content: slide.title,
          style: {
            fontSize: 48,
            fontWeight: 'bold',
            color: '#ffffff',
            position: 'top',
          },
        });
      }

      // Track 2: Áudio (se configurado)
      if (config.addAudio && config.audioType === 'tts' && slide.notes) {
        clips.push({
          type: 'audio',
          trackIndex: 2,
          startTime: currentTime,
          duration: slide.duration,
          content: slide.notes,
          metadata: {
            voiceId: config.voiceId,
            provider: 'elevenlabs',
          },
        });
      }

      // Adicionar transição
      if (config.transition !== 'none') {
        clips.push({
          type: 'transition',
          trackIndex: 0,
          startTime: currentTime + slide.duration - config.transitionDuration,
          duration: config.transitionDuration,
          effect: config.transition,
        });
      }

      currentTime += slide.duration;
    }

    // Salvar timeline no banco
    const timelineData = {
      tracks: [
        { index: 0, type: 'video', name: 'Slides', clips: [] },
        { index: 1, type: 'text', name: 'Títulos', clips: [] },
        { index: 2, type: 'audio', name: 'Narração', clips: [] },
      ],
      duration: currentTime,
      clips,
    };

    const timeline = await prisma.timeline.create({
      data: {
        projectId: project.id,
        tracks: timelineData,
        totalDuration: Math.round(currentTime * 1000), // converter para milliseconds
      },
    });

    // Log analytics
    await prisma.analyticsEvent.create({
      data: {
        userId: session.user.id,
        eventType: 'pptx_import',
        eventData: {
          projectId: project.id,
          timelineId: timeline.id,
          slidesCount: slides.length,
          clipsCreated: clips.length,
          duration: currentTime,
        },
      },
    });

    return NextResponse.json({
      success: true,
      projectId: project.id,
      timelineId: timeline.id,
      clipsCreated: clips.length,
      duration: currentTime,
    });
  } catch (error) {
    logger.error('Erro ao converter PPTX para timeline', error instanceof Error ? error : new Error(String(error))
, { component: 'API: import/pptx-to-timeline' });
    return NextResponse.json(
      { error: 'Erro ao converter PPTX' },
      { status: 500 }
    );
  }
  });
}


