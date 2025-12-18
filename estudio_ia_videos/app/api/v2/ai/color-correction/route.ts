/**
 * API v2: Auto Color Correction
 * Correção automática de cores com IA
 */

import { NextResponse } from 'next/server';
import { autoColorCorrectionEngine } from '@/lib/ai/auto-color-correction';
import { logger } from '@/lib/logger';
import { getSupabaseForRequest } from '@/lib/services';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutos

// POST /api/v2/ai/color-correction
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
    const { inputPath, outputPath, type, mode, ...options } = body;

    if (!inputPath || !outputPath || !type || !mode) {
      return NextResponse.json(
        {
          success: false,
          error: 'inputPath, outputPath, type, and mode are required'
        },
        { status: 400 }
      );
    }

    const result = await autoColorCorrectionEngine.correctColors({
      inputPath,
      outputPath,
      type: type as 'image' | 'video',
      mode: mode as 'auto' | 'custom',
      ...options
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Color correction API error', error instanceof Error ? error : new Error(String(error)), {
      component: 'API: /api/v2/ai/color-correction'
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
