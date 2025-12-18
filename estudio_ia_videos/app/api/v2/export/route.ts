/**
 * API v2: Multi-Format Export
 * Export de vídeos em múltiplos formatos
 */

import { NextResponse } from 'next/server';
import { multiFormatExporter } from '@/lib/export/multi-format-exporter';
import { logger } from '@/lib/logger';
import { getSupabaseForRequest } from '@/lib/services';
import path from 'path';
import os from 'os';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutos

export async function POST(req: Request) {
  try {
    const supabase = getSupabaseForRequest(req);
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { videoId, format, quality, resolution, fps, watermark, subtitles } = body;

    // Validar formato
    const validFormats = ['mp4', 'webm', 'gif', 'hls', 'dash', 'mov', 'avi'];
    if (!validFormats.includes(format)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid format. Must be one of: ${validFormats.join(', ')}`
        },
        { status: 400 }
      );
    }

    // Buscar vídeo do banco
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select('*')
      .eq('id', videoId)
      .single();

    if (videoError || !video) {
      return NextResponse.json(
        {
          success: false,
          error: 'Video not found'
        },
        { status: 404 }
      );
    }

    // Preparar caminhos
    const tempDir = os.tmpdir();
    const inputPath = video.file_path; // Assumindo que está armazenado localmente ou foi baixado
    const outputFilename = `${videoId}_${format}_${quality}_${resolution}.${format === 'hls' ? 'm3u8' : format}`;
    const outputPath = path.join(tempDir, outputFilename);

    // Exportar
    const result = await multiFormatExporter.export({
      inputPath,
      outputPath,
      format: format as any,
      quality: quality || 'high',
      resolution: resolution || '1080p',
      fps,
      watermark,
      subtitles
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error
        },
        { status: 500 }
      );
    }

    // Salvar metadata da exportação no banco
    const { error: exportError } = await supabase.from('video_exports').insert({
      video_id: videoId,
      user_id: user.id,
      format,
      quality,
      resolution,
      file_path: outputPath,
      file_size: result.fileSize,
      duration: result.duration,
      created_at: new Date().toISOString()
    });

    if (exportError) {
      logger.warn('Failed to save export metadata', { error: exportError });
    }

    return NextResponse.json({
      success: true,
      data: {
        exportId: videoId + '-' + Date.now(),
        format,
        outputPath: result.outputPath,
        fileSize: result.fileSize,
        duration: result.duration,
        metadata: result.metadata
      }
    });
  } catch (error) {
    logger.error('Error exporting video', error instanceof Error ? error : new Error(String(error)), {
      component: 'API: /api/v2/export'
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to export video'
      },
      { status: 500 }
    );
  }
}
