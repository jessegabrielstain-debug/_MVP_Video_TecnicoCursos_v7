/**
 * API de Controle de Jobs em Lote
 * 
 * Endpoints para pausar, retomar e cancelar jobs
 */

import { NextRequest, NextResponse } from 'next/server';
import { batchSystem } from '@/lib/batch-processing-system';
import { logger } from '@/lib/logger';

/**
 * POST /api/batch/control
 * Controla job (pause, resume, cancel, priority)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, action, priority } = body as {
      jobId: string;
      action: 'pause' | 'resume' | 'cancel' | 'setPriority';
      priority?: 'low' | 'normal' | 'high';
    };

    if (!jobId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: jobId, action' },
        { status: 400 }
      );
    }

    let success = false;

    switch (action) {
      case 'pause':
        success = await batchSystem.pauseJob(jobId);
        break;
      case 'resume':
        success = await batchSystem.resumeJob(jobId);
        break;
      case 'cancel':
        success = await batchSystem.cancelJob(jobId);
        break;
      case 'setPriority':
        if (!priority) {
          return NextResponse.json(
            { error: 'Priority is required for setPriority action' },
            { status: 400 }
          );
        }
        success = await batchSystem.setPriority(jobId, priority);
        break;
      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}` },
          { status: 400 }
        );
    }

    if (!success) {
      return NextResponse.json(
        { error: 'Action failed. Check job status and action compatibility.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Job ${action} successful`,
    });
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logger.error('Batch control error', errorObj, { component: 'API: /api/batch/control' });
    return NextResponse.json(
      { error: errorObj.message || 'Batch control failed' },
      { status: 500 }
    );
  }
}

