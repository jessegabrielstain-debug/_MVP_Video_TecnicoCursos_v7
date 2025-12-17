/**
 * API: Video Quality Control
 * POST /api/video/quality-check
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { videoQC, QCConfig } from '@/lib/video-quality-control-real';
import * as fs from 'fs/promises';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoPath, config } = body as {
      videoPath: string;
      config?: QCConfig;
    };

    if (!videoPath) {
      return NextResponse.json(
        { error: 'Video path is required' },
        { status: 400 }
      );
    }

    // Verificar se arquivo existe
    try {
      await fs.access(videoPath);
    } catch {
      return NextResponse.json(
        { error: 'Video file not found' },
        { status: 404 }
      );
    }

    // Executar quality control
    const report = await videoQC.runQualityControl(videoPath, config);

    return NextResponse.json({
      success: true,
      report,
    });

  } catch (error) {
    logger.error('Quality control error', error instanceof Error ? error : new Error(String(error)), { component: 'API: video/quality-check' });
    return NextResponse.json(
      { 
        error: 'Failed to run quality control',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

