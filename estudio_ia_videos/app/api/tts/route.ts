import { NextResponse } from 'next/server';
import { TTSService } from '@/lib/tts/tts-service';
import { z } from 'zod';

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

    const ttsService = new TTSService();
    const ttsResponse = await ttsService.generate({ text });

    if (ttsResponse.error || !ttsResponse.audioUrl) {
      return NextResponse.json({ error: ttsResponse.error || 'TTS generation failed.' }, { status: 500 });
    }

    // Here you would typically update the slide in the database with the audioUrl
    // For now, we just return the successful response.
    // Example:
    // const { error: updateError } = await supabase
    //   .from('slides')
    //   .update({ audio_url: ttsResponse.audioUrl, tts_status: 'completed' })
    //   .eq('id', slideId);
    //
    // if (updateError) { ... }

    return NextResponse.json({
      slideId: slideId,
      audioUrl: ttsResponse.audioUrl,
      duration: ttsResponse.duration,
    });
  } catch (error) {
    console.error('TTS API Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}