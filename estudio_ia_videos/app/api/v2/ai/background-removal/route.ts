/**
 * API v2: Background Removal
 * Remove fundo de imagens e vídeos com IA
 */

import { NextResponse } from 'next/server';
import { backgroundRemovalEngine } from '@/lib/ai/background-removal';
import { logger } from '@/lib/logger';
import { getSupabaseForRequest } from '@/lib/services';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutos

// POST /api/v2/ai/background-removal
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
    const { inputPath, outputPath, type, ...options } = body;

    if (!inputPath || !outputPath || !type) {
      return NextResponse.json(
        {
          success: false,
          error: 'inputPath, outputPath, and type are required'
        },
        { status: 400 }
      );
    }

    let result;

    if (type === 'image') {
      result = await backgroundRemovalEngine.removeImageBackground({
        inputPath,
        outputPath,
        type: 'image',
        ...options
      });
    } else if (type === 'video') {
      result = await backgroundRemovalEngine.removeVideoBackground({
        inputPath,
        outputPath,
        type: 'video',
        ...options
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid type. Must be "image" or "video"'
        },
        { status: 400 }
      );
    }

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Background removal API error', error instanceof Error ? error : new Error(String(error)), {
      component: 'API: /api/v2/ai/background-removal'
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}
