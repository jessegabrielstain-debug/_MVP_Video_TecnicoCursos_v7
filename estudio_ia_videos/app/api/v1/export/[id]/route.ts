/**
 * Export API Endpoints
 * POST /api/v1/export - Criar novo job de exportação
 * GET /api/v1/export/:id - Status do job
 * DELETE /api/v1/export/:id - Cancelar job
 * GET /api/v1/export/queue/status - Status da fila
 */

import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import {
  ExportJob,
  ExportStatus,
  ExportSettings,
  ExportFormat,
  ExportResolution,
  ExportQuality,
} from '@/types/export.types'
import { getExportQueue } from '@/lib/export/export-queue'
import { logger } from '@/lib/logger'

// Helper para validar settings
function validateExportSettings(settings: Partial<ExportSettings>): ExportSettings {
  return {
    format: settings.format || ExportFormat.MP4,
    resolution: settings.resolution || ExportResolution.FULL_HD_1080,
    quality: settings.quality || ExportQuality.HIGH,
    fps: settings.fps || 30,
    bitrate: settings.bitrate,
    codec: settings.codec,
    includeWatermark: settings.includeWatermark ?? false,
  }
}

// POST handler removed as it belongs to collection route


/**
 * GET /api/v1/export/:id
 * Obtém status do job
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 })
    }

    const queue = getExportQueue()
    const job = await queue.getJob(jobId)

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Calcular tempo decorrido
    let elapsedTime = 0
    if (job.startedAt) {
      const endTime = job.completedAt || new Date()
      elapsedTime = Math.floor((endTime.getTime() - job.startedAt.getTime()) / 1000)
    }

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        status: job.status,
        progress: job.progress,
        settings: job.settings,
        outputUrl: job.outputUrl,
        fileSize: job.fileSize,
        duration: job.duration,
        error: job.error,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        elapsedTime,
        estimatedTimeRemaining: job.estimatedTimeRemaining,
      },
    })
  } catch (error) {
    logger.error('[Export API] Error fetching job', error instanceof Error ? error : new Error(String(error)), { component: 'API: v1/export/[id]' })
    return NextResponse.json(
      { error: 'Failed to fetch job status', details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/v1/export/:id
 * Cancela job
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 })
    }

    const queue = getExportQueue()
    const success = await queue.cancelJob(jobId)

    if (!success) {
      return NextResponse.json(
        { error: 'Job cannot be cancelled (not found or already completed)' },
        { status: 400 }
      )
    }

    logger.info(`[Export API] Cancelled job ${jobId}`, { component: 'API: v1/export/[id]', jobId })

    return NextResponse.json({
      success: true,
      message: 'Job cancelled successfully',
    })
  } catch (error) {
    logger.error('[Export API] Error cancelling job', error instanceof Error ? error : new Error(String(error)), { component: 'API: v1/export/[id]' })
    return NextResponse.json(
      { error: 'Failed to cancel job', details: String(error) },
      { status: 500 }
    )
  }
}
