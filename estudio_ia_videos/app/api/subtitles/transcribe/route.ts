import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { TranscriptionService } from '@/lib/subtitles/transcription-service';
import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';
import path from 'path';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const audioPath = formData.get('audioPath') as string;
    const language = formData.get('language') as string || 'pt-BR';
    const enableKaraoke = formData.get('enableKaraoke') === 'true';
    const enableSpeakerDiarization = formData.get('enableSpeakerDiarization') === 'true';
    const maxSpeakers = parseInt(formData.get('maxSpeakers') as string) || 2;
    const userId = formData.get('userId') as string;

    if (!file && !audioPath) {
      return NextResponse.json(
        { error: 'Arquivo de áudio ou caminho do arquivo é necessário' },
        { status: 400 }
      );
    }

    let finalAudioPath: string;

    if (file) {
      // Save uploaded file to temp directory
      const tempDir = path.join(process.cwd(), 'temp', 'uploads');
      await fs.mkdir(tempDir, { recursive: true });
      
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = path.join(tempDir, fileName);
      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.writeFile(filePath, buffer);
      
      finalAudioPath = filePath;
    } else if (audioPath) {
      finalAudioPath = audioPath;
    } else {
      return NextResponse.json(
        { error: 'Nenhum arquivo válido fornecido' },
        { status: 400 }
      );
    }

    const transcriptionService = TranscriptionService.getInstance();

    // Transcribe the audio
    const result = await transcriptionService.transcribeAudio(finalAudioPath, {
      language,
      enableKaraoke,
      enableSpeakerDiarization,
      maxSpeakers
    });

    // Save transcription to database
    const { data: transcriptionData, error: dbError } = await supabase
      .from('transcriptions')
      .insert({
        user_id: userId,
        audio_path: finalAudioPath,
        language,
        duration: result.duration,
        confidence: result.confidence,
        word_count: result.wordCount,
        segments: result.segments,
        karaoke_enabled: enableKaraoke,
        speaker_diarization_enabled: enableSpeakerDiarization,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) {
      logger.error('Database error:', dbError instanceof Error ? dbError : new Error(String(dbError)), { component: 'API: subtitles/transcribe' });
      throw new Error(`Failed to save transcription: ${dbError.message}`);
    }

    // Generate subtitle files
    const karaokeSubtitles = enableKaraoke 
      ? transcriptionService.generateKaraokeSubtitles(result)
      : null;
    
    const srtSubtitles = transcriptionService.generateSRT(result);

    // Clean up temp file if it was uploaded
    if (file) {
      try {
        await fs.unlink(finalAudioPath);
      } catch (cleanupError) {
        logger.warn('Failed to clean up temp file:', { component: 'API: subtitles/transcribe', error: cleanupError });
      }
    }

    return NextResponse.json({
      success: true,
      transcription: result,
      karaokeSubtitles,
      srtSubtitles,
      transcriptionId: transcriptionData.id
    });

  } catch (error) {
    logger.error('Transcription API error:', error instanceof Error ? error : new Error(String(error)), { component: 'API: subtitles/transcribe' });
    return NextResponse.json(
      { 
        error: 'Failed to transcribe audio',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const transcriptionId = searchParams.get('transcriptionId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('transcriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (transcriptionId) {
      query = query.eq('id', transcriptionId);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Database error:', error instanceof Error ? error : new Error(String(error)), { component: 'API: subtitles/transcribe' });
      return NextResponse.json(
        { error: `Failed to fetch transcriptions: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      transcriptions: data
    });

  } catch (error) {
    logger.error('Get transcriptions API error:', error instanceof Error ? error : new Error(String(error)), { component: 'API: subtitles/transcribe' });
    return NextResponse.json(
      { 
        error: 'Failed to fetch transcriptions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const transcriptionId = searchParams.get('transcriptionId');
    const userId = searchParams.get('userId');

    if (!transcriptionId || !userId) {
      return NextResponse.json(
        { error: 'Transcription ID and User ID are required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('transcriptions')
      .delete()
      .eq('id', transcriptionId)
      .eq('user_id', userId);

    if (error) {
      logger.error('Database error:', error instanceof Error ? error : new Error(String(error)), { component: 'API: subtitles/transcribe' });
      return NextResponse.json(
        { error: `Failed to delete transcription: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Transcription deleted successfully'
    });

  } catch (error) {
    logger.error('Delete transcription API error:', error instanceof Error ? error : new Error(String(error)), { component: 'API: subtitles/transcribe' });
    return NextResponse.json(
      { 
        error: 'Failed to delete transcription',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}