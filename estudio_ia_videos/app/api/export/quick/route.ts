/**
 * API de Exportação Rápida para Plataformas
 * 
 * Endpoint para exportação com presets otimizados
 */

import { NextRequest, NextResponse } from 'next/server';
import { exportSystem, PLATFORM_PRESETS } from '@/lib/export-advanced-system';
import type { TargetPlatform } from '@/lib/export-advanced-system';

/**
 * POST /api/export/quick
 * Exportação rápida com preset de plataforma
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, userId, platform } = body as {
      projectId: string;
      userId: string;
      platform: TargetPlatform;
    };

    if (!projectId || !userId || !platform) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, userId, platform' },
        { status: 400 }
      );
    }

    if (!PLATFORM_PRESETS[platform]) {
      return NextResponse.json(
        { error: `Invalid platform: ${platform}` },
        { status: 400 }
      );
    }

    const job = await exportSystem.quickExport(projectId, userId, platform);

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        status: job.status,
        progress: job.progress,
        platform,
        preset: PLATFORM_PRESETS[platform],
      },
    });
  } catch (error) {
    console.error('Quick export error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Quick export failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/export/quick
 * Lista presets disponíveis
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    presets: PLATFORM_PRESETS,
  });
}

