// TODO: Fix TTSService constructor signature
import { NextResponse } from 'next/server';
import { TTSService } from '@/lib/tts/tts-service';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const ttsSchema = z.object({
  text: z.string().min(1, 'Text is required.'),
  slideId: z.string().uuid('Invalid Slide ID'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = ttsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const { text, slideId } = validation.data;

    const ttsResponse = await TTSService.synthesize({ text });

    if (!ttsResponse.fileUrl) {
      return NextResponse.json({ error: 'TTS generation failed.' }, { status: 500 });
    }

    return NextResponse.json({
      slideId: slideId,
      audioUrl: ttsResponse.fileUrl,
      duration: ttsResponse.duration,
    });
  } catch (error) {
    logger.error('TTS API Error', error instanceof Error ? error : new Error(String(error))
, { component: 'API: tts' });
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
