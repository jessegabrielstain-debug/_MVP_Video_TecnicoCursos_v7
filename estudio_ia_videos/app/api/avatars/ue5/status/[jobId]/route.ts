
import { NextRequest, NextResponse } from 'next/server'
import { ue5AvatarEngine } from '@/lib/engines/ue5-avatar-engine'

/**
 * GET /api/avatars/ue5/status/:jobId
 * Obter status de renderização
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const job = ue5AvatarEngine.getJobStatus(params.jobId)
    
    if (!job) {
      return NextResponse.json(
        { error: 'Job não encontrado' },
        { status: 404 }
      )
    }
    
    // Calcular tempos
    const timings: Record<string, string> = {}
    
    if (job.timings.audio2face_start && job.timings.audio2face_end) {
      timings.audio2face_seconds = (
        (job.timings.audio2face_end.getTime() - job.timings.audio2face_start.getTime()) / 1000
      ).toFixed(2)
    }
    
    if (job.timings.ue5_render_start && job.timings.ue5_render_end) {
      timings.ue5_render_seconds = (
        (job.timings.ue5_render_end.getTime() - job.timings.ue5_render_start.getTime()) / 1000
      ).toFixed(2)
    }
    
    if (job.timings.encoding_start && job.timings.completed_at) {
      timings.encoding_seconds = (
        (job.timings.completed_at.getTime() - job.timings.encoding_start.getTime()) / 1000
      ).toFixed(2)
    }
    
    if (job.timings.completed_at) {
      timings.total_seconds = (
        (job.timings.completed_at.getTime() - job.timings.queued_at.getTime()) / 1000
      ).toFixed(2)
    }
    
    return NextResponse.json({
      job_id: job.job_id,
      status: job.status,
      progress: job.progress,
      checkpoints: job.checkpoints,
      timings: timings,
      output: job.output,
      error: job.error,
      config: {
        metahuman_id: job.config.metahuman_id,
        resolution: job.config.resolution,
        fps: job.config.fps,
        environment: job.config.environment
      }
    })
    
  } catch (error) {
    console.error('❌ Erro ao obter status:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
