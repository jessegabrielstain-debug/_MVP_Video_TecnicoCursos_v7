/**
 * API de Exportação Avançada
 * 
 * Endpoints para exportação multi-formato com otimização
 */

import { NextRequest, NextResponse } from 'next/server';
import { exportSystem } from '@/lib/export-advanced-system';
import type { ExportOptions, TargetPlatform } from '@/lib/export-advanced-system';

/**
 * POST /api/export/create
 * Cria job de exportação customizado
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, userId, options } = body as {
      projectId: string;
      userId: string;
      options: ExportOptions;
    };

    if (!projectId || !userId || !options) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, userId, options' },
        { status: 400 }
      );
    }

    const job = await exportSystem.createExportJob(projectId, userId, options);

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        status: job.status,
        progress: job.progress,
        currentPhase: job.currentPhase,
        options: job.options,
      },
    });
  } catch (error) {
    console.error('Export creation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Export creation failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/export/create?jobId=xxx
 * Obtém status do job
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { error: 'Missing jobId parameter' },
        { status: 400 }
      );
    }

    const job = exportSystem.getJob(jobId);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        status: job.status,
        progress: job.progress,
        currentPhase: job.currentPhase,
        outputPath: job.outputPath,
        thumbnailPath: job.thumbnailPath,
        metadata: job.metadata,
        error: job.error,
        createdAt: job.createdAt,
        completedAt: job.completedAt,
      },
    });
  } catch (error) {
    console.error('Job status error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get job status' },
      { status: 500 }
    );
  }
}

