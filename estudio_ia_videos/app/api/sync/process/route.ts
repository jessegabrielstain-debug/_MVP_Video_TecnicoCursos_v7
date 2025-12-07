/**
 * 🎭 Lip-Sync Processing API
 * 
 * API para processamento avançado de sincronização labial
 * com análise MFCC e detecção de fonemas
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRateLimiter, rateLimitPresets } from '@/lib/utils/rate-limit-middleware';
import { lipSyncProcessor } from '@/lib/sync/lip-sync-processor'
import { Logger } from '@/lib/logger'
import { getSupabaseForRequest } from '@/lib/supabase/server'

const logger = new Logger('LipSyncAPI')

// Interface for sync_jobs table
interface SyncJob {
  id: string;
  job_id: string;
  project_id: string;
  avatar_id?: string;
  user_id?: string;
  status: string;
  progress: number;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  options?: Record<string, unknown>;
  visemes_data?: unknown[];
  phonemes_data?: unknown[];
  blend_shapes_data?: unknown[];
  emotions_data?: unknown[];
  breathing_data?: unknown[];
  audio_duration?: number;
  processing_time?: number;
  accuracy_score?: number;
  confidence_avg?: number;
  visemes_count?: number;
  phonemes_count?: number;
  created_at: string;
  completed_at?: string;
  error_message?: string;
}

const rateLimiterPost = createRateLimiter(rateLimitPresets.authenticated);
export async function POST(request: NextRequest) {
  return rateLimiterPost(request, async (request: NextRequest) => {
  try {
    const supabase = getSupabaseForRequest(request)
    const formData = await request.formData()
    
    // Extrair parâmetros
    const audioFile = formData.get('audio') as File
    const includeEmotions = formData.get('include_emotions') === 'true'
    const includeBreathing = formData.get('include_breathing') === 'true'
    const accuracyMode = (formData.get('accuracy_mode') as string) || 'balanced'
    const projectId = formData.get('project_id') as string
    const avatarId = formData.get('avatar_id') as string

    // Validar parâmetros obrigatórios
    if (!audioFile || !projectId) {
      return NextResponse.json(
        { 
          error: 'Missing required parameters',
          required: ['audio', 'project_id']
        },
        { status: 400 }
      )
    }

    // Validar tipo de arquivo
    if (!audioFile.type.startsWith('audio/')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only audio files are supported.' },
        { status: 400 }
      )
    }

    // Validar tamanho do arquivo (máx 50MB)
    if (audioFile.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 50MB.' },
        { status: 400 }
      )
    }

    // Extrair user_id do header de autenticação
    let userId: string | undefined

    try {
      const { data: { user } } = await supabase.auth.getUser()
      userId = user?.id
    } catch (error) {
      logger.warn('Failed to extract user from token', { error })
    }

    logger.info('Lip-sync processing request received', {
      fileName: audioFile.name,
      fileSize: audioFile.size,
      fileType: audioFile.type,
      projectId,
      avatarId,
      userId,
      options: {
        includeEmotions,
        includeBreathing,
        accuracyMode
      }
    })

    // Converter arquivo para ArrayBuffer
    const audioBuffer = await audioFile.arrayBuffer()

    // Processar sincronização labial
    const result = await lipSyncProcessor.processAudioForLipSync(audioBuffer, {
      includeEmotions,
      includeBreathing,
      accuracyMode: accuracyMode as 'fast' | 'balanced' | 'high'
    })

    // Salvar informações adicionais no banco
    // Using 'as any' for table name if it's not in the generated types yet
    await supabase.from('sync_jobs' as any).update({
      project_id: projectId,
      avatar_id: avatarId,
      user_id: userId,
      file_name: audioFile.name,
      file_size: audioFile.size,
      file_type: audioFile.type,
      options: {
        includeEmotions,
        includeBreathing,
        accuracyMode
      }
    }).eq('job_id', result.metadata.job_id)

    // Resposta de sucesso
    return NextResponse.json({
      success: true,
      data: {
        job_id: result.metadata.job_id,
        visemes: result.visemes,
        phonemes: result.phonemes,
        blend_shapes: result.blendShapes,
        emotions: result.emotions,
        breathing: result.breathing,
        metadata: {
          audio_duration: result.metadata.audio_duration,
          processing_time: result.metadata.processing_time,
          accuracy_score: result.metadata.accuracy_score,
          confidence_avg: result.metadata.confidence_avg,
          visemes_count: result.visemes.length,
          phonemes_count: result.phonemes.length
        }
      }
    })

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Lip-sync processing failed', error instanceof Error ? error : new Error(errorMessage))
    
    return NextResponse.json(
      { 
        error: 'Lip-sync processing failed',
        message: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
  });
}

const rateLimiterGet = createRateLimiter(rateLimitPresets.authenticated);
export async function GET(request: NextRequest) {
  return rateLimiterGet(request, async (request: NextRequest) => {
  try {
    const supabase = getSupabaseForRequest(request)
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const jobId = searchParams.get('job_id')

    switch (action) {
      case 'status':
        if (!jobId) {
          return NextResponse.json(
            { error: 'Missing job_id parameter' },
            { status: 400 }
          )
        }

        // Buscar status do job
        const { data: jobData, error } = await supabase
          .from('sync_jobs' as any)
          .select('*')
          .eq('job_id', jobId)
          .single()

        if (error || !jobData) {
          return NextResponse.json(
            { error: 'Job not found' },
            { status: 404 }
          )
        }

        const job = jobData as unknown as SyncJob;
        return NextResponse.json({
          success: true,
          data: {
            job_id: job.job_id,
            status: job.status,
            progress: job.progress || 100,
            created_at: job.created_at,
            completed_at: job.completed_at,
            metadata: {
              audio_duration: job.audio_duration,
              processing_time: job.processing_time,
              accuracy_score: job.accuracy_score,
              confidence_avg: job.confidence_avg,
              visemes_count: job.visemes_count,
              phonemes_count: job.phonemes_count
            }
          }
        })

      case 'result':
        if (!jobId) {
          return NextResponse.json(
            { error: 'Missing job_id parameter' },
            { status: 400 }
          )
        }

        // Buscar resultado completo do job
        const { data: resultJobData, error: resultError } = await supabase
          .from('sync_jobs' as any)
          .select('*')
          .eq('job_id', jobId)
          .eq('status', 'completed')
          .single()

        if (resultError || !resultJobData) {
          return NextResponse.json(
            { error: 'Job not found or not completed' },
            { status: 404 }
          )
        }

        const resultJob = resultJobData as unknown as SyncJob;
        return NextResponse.json({
          success: true,
          data: {
            job_id: resultJob.job_id,
            visemes: resultJob.visemes_data,
            phonemes: resultJob.phonemes_data,
            blend_shapes: resultJob.blend_shapes_data,
            emotions: resultJob.emotions_data,
            breathing: resultJob.breathing_data,
            metadata: {
              audio_duration: resultJob.audio_duration,
              processing_time: resultJob.processing_time,
              accuracy_score: resultJob.accuracy_score,
              confidence_avg: resultJob.confidence_avg
            }
          }
        })

      case 'history':
        const userId = searchParams.get('user_id')
        const projectId = searchParams.get('project_id')
        const limit = parseInt(searchParams.get('limit') || '10')

        let query = supabase
          .from('sync_jobs' as any)
          .select('job_id, status, created_at, accuracy_score, audio_duration, file_name')
          .order('created_at', { ascending: false })
          .limit(limit)

        if (userId) {
          query = query.eq('user_id', userId)
        }

        if (projectId) {
          query = query.eq('project_id', projectId)
        }

        const { data: history, error: historyError } = await query

        if (historyError) {
          throw historyError
        }

        return NextResponse.json({
          success: true,
          data: { history }
        })

      case 'stats':
        // Estatísticas gerais de processamento
        const { data: statsData, error: statsError } = await supabase
          .from('sync_jobs' as any)
          .select('accuracy_score, processing_time, audio_duration, status')
          .eq('status', 'completed')

        if (statsError) {
          throw statsError
        }

        const typedStats = (statsData || []) as unknown as SyncJob[];
        const totalJobs = typedStats.length
        const avgAccuracy = totalJobs > 0 ? typedStats.reduce((sum, job) => sum + (job.accuracy_score || 0), 0) / totalJobs : 0
        const avgProcessingTime = totalJobs > 0 ? typedStats.reduce((sum, job) => sum + (job.processing_time || 0), 0) / totalJobs : 0
        const totalAudioDuration = typedStats.reduce((sum, job) => sum + (job.audio_duration || 0), 0)

        return NextResponse.json({
          success: true,
          data: {
            total_jobs: totalJobs,
            avg_accuracy: Math.round(avgAccuracy * 100) / 100,
            avg_processing_time: Math.round(avgProcessingTime),
            total_audio_duration: Math.round(totalAudioDuration * 100) / 100,
            processing_efficiency: totalAudioDuration > 0 ? 
              Math.round((totalAudioDuration / (avgProcessingTime / 1000)) * 100) / 100 : 0
          }
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action. Available: status, result, history, stats' },
          { status: 400 }
        )
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Lip-sync API GET failed', error instanceof Error ? error : new Error(errorMessage))
    
    return NextResponse.json(
      { 
        error: 'Request failed',
        message: errorMessage 
      },
      { status: 500 }
    )
  }
  });
}

const rateLimiterDelete = createRateLimiter(rateLimitPresets.authenticated);
export async function DELETE(request: NextRequest) {
  return rateLimiterDelete(request, async (request: NextRequest) => {
  try {
    const supabase = getSupabaseForRequest(request)
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('job_id')

    if (!jobId) {
      return NextResponse.json(
        { error: 'Missing job_id parameter' },
        { status: 400 }
      )
    }

    // Marcar job como cancelado
    const { error } = await supabase
      .from('sync_jobs' as any)
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('job_id', jobId)

    if (error) {
      throw error
    }

    logger.info('Lip-sync job cancelled', { jobId })

    return NextResponse.json({
      success: true,
      message: 'Job cancelled successfully'
    })

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Lip-sync job cancellation failed', error instanceof Error ? error : new Error(errorMessage))
    
    return NextResponse.json(
      { 
        error: 'Cancellation failed',
        message: errorMessage 
      },
      { status: 500 }
    )
  }
  });
}
