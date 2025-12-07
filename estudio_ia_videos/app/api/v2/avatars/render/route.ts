// TODO: Fix v2 API types
/**
 * 🎬 API v2: Avatar Render
 * Pipeline de renderização hiper-realista com Audio2Face
 * FASE 2: Sprint 1 - Audio2Face Integration
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRateLimiter, rateLimitPresets } from '../../../../lib/utils/rate-limit-middleware';
import { avatar3DPipeline } from '../../../../lib/avatar-3d-pipeline'
import { supabaseClient } from '../../../../lib/supabase'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

const rateLimiterPost = createRateLimiter(rateLimitPresets.render);
export async function POST(request: NextRequest) {
  return rateLimiterPost(request, async (request: NextRequest) => {
  try {
    const formData = await request.formData()
    
    const avatarId = formData.get('avatarId') as string
    const animation = formData.get('animation') as string
    const text = formData.get('text') as string
    const audioFile = formData.get('audioFile') as File
    const resolution = formData.get('resolution') as '4K' | '8K' || '4K'
    const quality = formData.get('quality') as 'cinematic' | 'hyperreal' || 'hyperreal'
    const language = formData.get('language') as 'pt-BR' | 'en-US' | 'es-ES' || 'pt-BR'
    const rayTracing = formData.get('rayTracing') === 'true'
    const realTimeLipSync = formData.get('realTimeLipSync') === 'true'
    const audio2FaceEnabled = formData.get('audio2FaceEnabled') !== 'false'
    const voiceCloning = formData.get('voiceCloning') === 'true'

    console.log('🎬 API v2: Iniciando renderização hiper-realista...')
    console.log(`🎭 Avatar: ${avatarId}`)
    console.log(`🎪 Animação: ${animation}`)
    console.log(`📐 Resolução: ${resolution}`)
    console.log(`✨ Qualidade: ${quality}`)
    console.log(`🗣️ Audio2Face: ${audio2FaceEnabled ? 'Ativado' : 'Desativado'}`)

    // Validações
    if (!avatarId || !animation) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'Avatar ID e animação são obrigatórios',
          code: 'MISSING_REQUIRED_FIELDS'
        }
      }, { status: 400 })
    }

    // Verificar se avatar existe no Supabase
    const { data: avatar, error: avatarError } = await ((supabaseClient as any)
      .from('avatar_models')
      .select('*') as any)
      .eq('id', avatarId)
      .eq('is_active', true)
      .single()

    if (avatarError || !avatar) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'Avatar não encontrado',
          code: 'AVATAR_NOT_FOUND'
        }
      }, { status: 404 })
    }

    // Processar arquivo de áudio se fornecido
    let audioFilePath: string | undefined
    if (audioFile && audioFile.size > 0) {
      const audioBuffer = await audioFile.arrayBuffer()
      const audioFileName = `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.wav`
      const tempDir = path.join(process.cwd(), 'temp')
      audioFilePath = path.join(tempDir, audioFileName)
      
      // Criar diretório temp se não existir
      try {
        await mkdir(tempDir, { recursive: true })
        await writeFile(audioFilePath, Buffer.from(audioBuffer))
        console.log(`🎵 Arquivo de áudio salvo: ${audioFilePath}`)
      } catch (fileError) {
        console.error('Erro ao salvar arquivo de áudio:', fileError)
        return NextResponse.json({
          success: false,
          error: {
            message: 'Erro ao processar arquivo de áudio',
            code: 'AUDIO_PROCESSING_ERROR'
          }
        }, { status: 500 })
      }
    }

    // Buscar perfil de voz se especificado
    let voiceProfileId: string | undefined
    if (voiceCloning) {
      // TODO: Implementar seleção de perfil de voz
      voiceProfileId = 'default-voice-profile'
    }

    // Configurações de renderização
    const renderOptions = {
      resolution,
      quality,
      rayTracing,
      realTimeLipSync,
      audio2FaceEnabled,
      voiceCloning,
      language
    }

    // Iniciar renderização usando o novo pipeline
    const renderResult = await avatar3DPipeline.renderHyperRealisticAvatar(
      'user-temp', // TODO: Obter userId real da autenticação
      text || '',
      voiceProfileId,
      {
        avatarId,
        animation,
        audioFilePath,
        ...renderOptions
      }
    )

    console.log(`✅ Renderização iniciada - Job ID: ${renderResult.jobId}`)

    const response = {
      success: true,
      data: {
        jobId: renderResult.jobId,
        status: renderResult.status,
        avatar: {
          id: avatar.id,
          name: avatar.name,
          displayName: avatar.display_name,
          category: avatar.category,
          audio2FaceCompatible: avatar.audio2face_compatible
        },
        render: {
          animation,
          resolution,
          quality,
          rayTracing,
          audio2FaceEnabled,
          realTimeLipSync,
          voiceCloning,
          language,
          estimatedTime: renderResult.estimatedTime || '30-60s',
          progress: renderResult.progress || 0
        },
        output: {
          videoUrl: renderResult.outputVideo,
          thumbnailUrl: renderResult.outputThumbnail,
          statusUrl: `/api/v2/avatars/render/status/${renderResult.jobId}`,
          downloadUrl: renderResult.outputVideo ? `/api/v2/avatars/render/download/${renderResult.jobId}` : null
        },
        quality: {
          renderingEngine: 'Unreal Engine 5.3',
          lipSyncAccuracy: renderResult.lipSyncAccuracy || 0,
          audio2FaceEnabled: renderResult.audio2FaceEnabled || false,
          rayTracingEnabled: rayTracing
        },
        metadata: {
          startTime: renderResult.startTime ? new Date(renderResult.startTime).toISOString() : new Date().toISOString(),
          version: '2.0.0',
          userId: 'user-temp', // TODO: Obter userId real
          audioFile: audioFile ? audioFile.name : null,
          textLength: text?.length || 0
        }
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('❌ Erro na renderização:', error)
    
    return NextResponse.json({
      success: false,
      error: {
        message: 'Erro ao iniciar renderização',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        code: 'RENDER_ERROR'
      }
    }, { status: 500 })
  }
  });
}

const rateLimiterGet = createRateLimiter(rateLimitPresets.authenticated);
export async function GET(request: NextRequest) {
  return rateLimiterGet(request, async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    console.log('📊 API v2: Listando jobs de renderização...')

    // Buscar jobs do Supabase
    let query: any = (supabaseClient
      .from('render_jobs')
      .select(`
        *,
        avatar_models (
          id,
          name,
          display_name,
          category
        )
      `) as any)
      .order('created_at', { ascending: false })

    // Filtrar por status
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // Filtrar por usuário
    if (userId) {
      query = query.eq('user_id', userId)
    }

    // Aplicar paginação
    query = query.range(offset, offset + limit - 1)

    const { data: jobs, error: jobsError } = await query

    if (jobsError) {
      throw new Error(`Erro ao buscar jobs: ${jobsError.message}`)
    }

    // Contar total de jobs
    let countQuery: any = (supabaseClient
      .from('render_jobs')
      .select('*', { count: 'exact', head: true }) as any)

    if (status && status !== 'all') {
      countQuery = countQuery.eq('status', status)
    }
    if (userId) {
      countQuery = countQuery.eq('user_id', userId)
    }

    const { count: totalJobs } = await countQuery

    // Obter estatísticas do pipeline
    const stats = await avatar3DPipeline.getPipelineStats()

    const response = {
      success: true,
      data: {
        jobs: (jobs || []).map((job: any) => ({
          id: job.id,
          avatarId: job.avatar_model_id,
          userId: job.user_id,
          status: job.status,
          progress: job.progress || 0,
          startTime: job.created_at,
          endTime: job.completed_at,
          duration: job.completed_at ? 
            new Date(job.completed_at).getTime() - new Date(job.created_at).getTime() : 
            Date.now() - new Date(job.created_at).getTime(),
          outputVideo: job.output_video_url,
          outputThumbnail: job.output_thumbnail_url,
          error: job.error_message,
          lipSyncAccuracy: job.lipsync_accuracy,
          audio2FaceEnabled: job.audio2face_enabled,
          avatar: job.avatar_models ? {
            id: job.avatar_models.id,
            name: job.avatar_models.name,
            displayName: job.avatar_models.display_name,
            category: job.avatar_models.category
          } : null,
          render: {
            quality: job.quality,
            resolution: job.resolution,
            rayTracing: job.ray_tracing_enabled,
            realTimeLipSync: job.real_time_lipsync,
            language: job.language
          }
        })),
        pagination: {
          total: totalJobs || 0,
          limit,
          offset,
          hasMore: offset + limit < (totalJobs || 0)
        },
        stats: {
          ...stats,
          queueLength: (jobs || []).filter((job: any) => job.status === 'queued').length,
          processingCount: (jobs || []).filter((job: any) => job.status === 'processing').length,
          completedCount: (jobs || []).filter((job: any) => job.status === 'completed').length,
          failedCount: (jobs || []).filter((job: any) => job.status === 'failed').length
        },
        metadata: {
          version: '2.0.0',
          timestamp: new Date().toISOString(),
          filters: {
            status: status || 'all',
            userId: userId || null
          }
        }
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('❌ Erro ao listar jobs:', error)
    
    return NextResponse.json({
      success: false,
      error: {
        message: 'Erro ao listar jobs de renderização',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        code: 'LIST_JOBS_ERROR'
      }
    }, { status: 500 })
  }
  });
}

const rateLimiterDelete = createRateLimiter(rateLimitPresets.authenticated);
export async function DELETE(request: NextRequest) {
  return rateLimiterDelete(request, async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')
    const action = searchParams.get('action')

    console.log(`🗑️ API v2: ${action === 'cancel' ? 'Cancelando' : 'Removendo'} job ${jobId}`)

    if (action === 'cancel') {
      if (!jobId) {
        return NextResponse.json({
          success: false,
          error: {
            message: 'Job ID é obrigatório para cancelamento',
            code: 'MISSING_JOB_ID'
          }
        }, { status: 400 })
      }

      // Cancelar job usando o pipeline
      const cancelled = await avatar3DPipeline.cancelRenderJob(jobId)
      
      if (!cancelled) {
        return NextResponse.json({
          success: false,
          error: {
            message: 'Job não pode ser cancelado (não encontrado ou já finalizado)',
            code: 'CANNOT_CANCEL_JOB'
          }
        }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        data: {
          message: 'Job cancelado com sucesso',
          jobId,
          timestamp: new Date().toISOString()
        }
      })
    } else if (action === 'cleanup') {
      // Limpar jobs antigos
      await avatar3DPipeline.cleanupOldJobs()
      
      // Contar jobs removidos do Supabase
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const { data: oldJobs } = await (supabaseClient
        .from('render_jobs')
        .select('id') as any)
        .lt('created_at', thirtyDaysAgo.toISOString())
        .in('status', ['completed', 'failed', 'cancelled'])

      return NextResponse.json({
        success: true,
        data: {
          message: `Jobs antigos removidos com sucesso`,
          cleanedCount: oldJobs?.length || 0,
          cutoffDate: thirtyDaysAgo.toISOString()
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        error: {
          message: 'Ação não suportada. Use action=cancel ou action=cleanup',
          code: 'UNSUPPORTED_ACTION'
        }
      }, { status: 400 })
    }
  } catch (error) {
    console.error('❌ Erro ao gerenciar job:', error)
    
    return NextResponse.json({
      success: false,
      error: {
        message: 'Erro ao gerenciar job',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        code: 'JOB_MANAGEMENT_ERROR'
      }
    }, { status: 500 })
  }
  });
}
