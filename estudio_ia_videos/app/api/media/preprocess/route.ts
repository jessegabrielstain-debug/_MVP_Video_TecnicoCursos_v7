/**
 * API: Media Preprocessor
 * POST /api/media/preprocess
 */

import { NextRequest, NextResponse } from 'next/server';
import { mediaPreprocessor, PreprocessOptions } from '@/lib/media-preprocessor-real';
import * as fs from 'fs/promises';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imagePath, options } = body as {
      imagePath: string;
      options?: PreprocessOptions;
    };

    if (!imagePath) {
      return NextResponse.json(
        { error: 'Image path is required' },
        { status: 400 }
      );
    }

    // Verificar se arquivo existe
    try {
      await fs.access(imagePath);
    } catch {
      return NextResponse.json(
        { error: 'Image file not found' },
        { status: 404 }
      );
    }

    // Ler arquivo
    const buffer = await fs.readFile(imagePath);

    // Processar imagem
    const result = await mediaPreprocessor.preprocessImage(buffer, options || {});

    return NextResponse.json({
      success: true,
      data: result,
      stats: mediaPreprocessor.getStats(),
    });

  } catch (error) {
    logger.error('Media preprocessing error', error instanceof Error ? error : new Error(String(error)) 
    , { component: 'API: media/preprocess' });
    return NextResponse.json(
      { 
        error: 'Failed to preprocess media',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const stats = mediaPreprocessor.getStats();

    return NextResponse.json({
      success: true,
      stats,
    });

  } catch (error) {
    logger.error('Error fetching preprocessor stats', error instanceof Error ? error : new Error(String(error)) 
    , { component: 'API: media/preprocess' });
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

