/**
 * API de Processamento em Lote
 * 
 * Endpoints para gerenciamento de jobs em lote
 */

import { NextRequest, NextResponse } from 'next/server';
import { batchSystem } from '@/lib/batch-processing-system';
import type { BatchJobType } from '@/lib/batch-processing-system';
import { logger } from '@/lib/logger';

/**
 * POST /api/batch/create
 * Cria job de processamento em lote
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, userId, tasks, config } = body as {
      name: string;
      type: BatchJobType;
      userId: string;
      tasks: Record<string, unknown>[];
      config?: Record<string, unknown>;
    };

    if (!name || !type || !userId || !tasks || tasks.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, userId, tasks' },
        { status: 400 }
      );
    }

    const job = await batchSystem.createBatchJob(
      name,
      type,
      userId,
      tasks,
      config
    );

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        name: job.name,
        type: job.type,
        status: job.status,
        totalTasks: job.totalTasks,
        progress: job.progress,
        createdAt: job.createdAt,
      },
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error)); logger.error('Batch job creation error', err, { component: 'API: batch/create' });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Batch job creation failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/batch/create?jobId=xxx
 * Obtém status do job em lote
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

    const job = batchSystem.getJob(jobId);

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
        name: job.name,
        type: job.type,
        status: job.status,
        priority: job.priority,
        totalTasks: job.totalTasks,
        completedTasks: job.completedTasks,
        failedTasks: job.failedTasks,
        progress: job.progress,
        estimatedTime: job.estimatedTime,
        remainingTime: job.remainingTime,
        statistics: job.statistics,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        error: job.error,
      },
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error)); logger.error('Batch job status error', err, { component: 'API: batch/create' });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get job status' },
      { status: 500 }
    );
  }
}

