// TODO: Fix v2 avatars types
/**
 * 📊 API v2: Render Status Monitor
 * Monitoramento em tempo real de jobs de renderização
 * FASE 2: Sprint 1 - Audio2Face Integration
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRateLimiter, rateLimitPresets } from '@/lib/utils/rate-limit-middleware';
import { avatar3DPipeline } from '@/lib/avatar-3d-pipeline'
import { getSupabaseForRequest } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/db'

// Interface para tipagem do avatar
interface AvatarModelInfo {
  id: string;
  name: string;
  display_name: string | null;
  category?: string;
}

interface LipSyncData {
  accuracy?: number;
  processingTime?: number;
  metadata?: {
    totalFrames?: number;
    frameRate?: number;
    audioLength?: number;
  };
}

const rateLimiterGet = createRateLimiter(rateLimitPresets.render);
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return rateLimiterGet(request, async (request: NextRequest) => {
  try {
    const jobId = params.id
    const supabase = getSupabaseForRequest(request);
    
    logger.info(`📊 API v2: Verificando status do job ${jobId}`, { component: 'API: v2/avatars/render/status/[id]' })

    // Buscar job do Supabase primeiro, depois da memória
    let job = await avatar3DPipeline.getRenderJobStatus(jobId)
    
    if (!job) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'Job não encontrado',
          code: 'JOB_NOT_FOUND'
        }
      }, { status: 404 })
    }

    // Buscar informações do avatar do Prisma
    const avatarData = await prisma.avatarModel.findUnique({
      where: { id: job.avatarId },
      select: {
        id: true,
        name: true,
        displayName: true,
        category: true
      }
    })
    
    const avatar: AvatarModelInfo | null = avatarData ? {
      id: avatarData.id,
      name: avatarData.name,
      display_name: avatarData.displayName,
      category: avatarData.category ?? undefined
    } : null;

    // Calcular métricas
    const currentTime = Date.now()
    const duration = job.endTime ? job.endTime - job.startTime! : currentTime - job.startTime!
    const isCompleted = job.status === 'completed'
    const isFailed = job.status === 'failed'
    const isProcessing = job.status === 'processing'

    // Estimar tempo restante (baseado no progresso)
    let estimatedTimeRemaining: number | null = null
    if (isProcessing && job.progress! > 0) {
      const timePerPercent = duration / job.progress!
      const remainingPercent = 100 - job.progress!
      estimatedTimeRemaining = Math.round(timePerPercent * remainingPercent)
    }

    const lipSyncData = job.lipSyncData as LipSyncData | undefined;

    const response = {
      success: true,
      data: {
        job: {
          id: job.id,
          avatarId: job.avatarId,
          userId: job.userId,
          avatarName: avatar?.name || avatar?.display_name || 'Desconhecido',
          status: job.status,
          progress: job.progress || 0,
          startTime: job.startTime ? new Date(job.startTime).toISOString() : null,
          endTime: job.endTime ? new Date(job.endTime).toISOString() : null,
          duration: Math.round(duration / 1000), // em segundos
          estimatedTimeRemaining: estimatedTimeRemaining ? Math.round(estimatedTimeRemaining / 1000) : null,
          error: job.error
        },
        avatar: avatar ? {
          id: avatar.id,
          name: avatar.name,
          displayName: avatar.display_name,
          category: avatar.category
        } : null,
        output: {
          videoUrl: job.outputVideo,
          thumbnailUrl: job.outputThumbnail,
          available: isCompleted && !!job.outputVideo,
          downloadUrl: isCompleted && job.outputVideo ? `/api/v2/avatars/render/download/${job.id}` : null
        },
        lipSync: lipSyncData ? {
          accuracy: lipSyncData.accuracy || job.lipSyncAccuracy,
          processingTime: lipSyncData.processingTime,
          audio2FaceEnabled: job.audio2FaceEnabled || false,
          frameCount: lipSyncData.metadata?.totalFrames,
          frameRate: lipSyncData.metadata?.frameRate,
          audioLength: lipSyncData.metadata?.audioLength
        } : job.lipSyncAccuracy ? {
          accuracy: job.lipSyncAccuracy,
          audio2FaceEnabled: job.audio2FaceEnabled || false
        } : null,
        render: {
          quality: job.quality || 'hyperreal',
          resolution: job.resolution || '4K',
          rayTracing: job.rayTracingEnabled || false,
          realTimeLipSync: job.realTimeLipSync || false,
          language: job.language || 'pt-BR'
        },
        performance: {
          renderingEngine: 'Unreal Engine 5.3 + Audio2Face',
          qualityLevel: isCompleted ? 'Hiper-realista' : 'Processando...',
          polygonCount: isCompleted ? 850000 : null,
          textureResolution: isCompleted ? '8K' : null,
          rayTracingEnabled: job.rayTracingEnabled || false,
          audio2FaceEnabled: job.audio2FaceEnabled || false
        },
        metadata: {
          version: '2.0.0',
          timestamp: new Date().toISOString(),
          statusCheckedAt: currentTime,
          nextCheckRecommended: isProcessing ? currentTime + 5000 : null, // 5 segundos
          createdAt: job.createdAt ? new Date(job.createdAt).toISOString() : null,
          updatedAt: job.updatedAt ? new Date(job.updatedAt).toISOString() : null
        }
      }
    }

    // Headers para polling
    const headers: Record<string, string> = {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }

    // Se ainda está processando, sugerir próxima verificação
    if (isProcessing) {
      headers['X-Poll-Interval'] = '5000' // 5 segundos
      headers['X-Status'] = 'processing'
    } else if (isCompleted) {
      headers['X-Status'] = 'completed'
    } else if (isFailed) {
      headers['X-Status'] = 'failed'
    }

    return NextResponse.json(response, { headers })
  } catch (error) {
    logger.error('Erro ao verificar status', error instanceof Error ? error : new Error(String(error)), { component: 'API: v2/avatars/render/status/[id]' })
    
    return NextResponse.json({
      success: false,
      error: {
        message: 'Erro ao verificar status do job',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        code: 'STATUS_CHECK_ERROR'
      }
    }, { status: 500 })
  }
  });
}

const rateLimiterPost = createRateLimiter(rateLimitPresets.render);
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return rateLimiterPost(request, async (request: NextRequest) => {
  try {
    const jobId = params.id
    const body = await request.json()
    const { action } = body
    const supabase = getSupabaseForRequest(request);

    logger.info(`API v2: Ação ${action} no job ${jobId}`, { component: 'API: v2/avatars/render/status/[id]' })

    const job = await avatar3DPipeline.getRenderJobStatus(jobId)
    
    if (!job) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'Job não encontrado',
          code: 'JOB_NOT_FOUND'
        }
      }, { status: 404 })
    }

    switch (action) {
      case 'cancel':
        if (job.status !== 'processing') {
          return NextResponse.json({
            success: false,
            error: {
              message: 'Job não pode ser cancelado (não está em processamento)',
              code: 'CANNOT_CANCEL'
            }
          }, { status: 400 })
        }

        const cancelled = await avatar3DPipeline.cancelRenderJob(jobId)
        
        return NextResponse.json({
          success: true,
          data: {
            message: 'Job cancelado com sucesso',
            jobId,
            cancelled,
            timestamp: new Date().toISOString()
          }
        })

      case 'retry':
        if (job.status !== 'failed') {
          return NextResponse.json({
            success: false,
            error: {
              message: 'Job não pode ser reexecutado (não falhou)',
              code: 'CANNOT_RETRY'
            }
          }, { status: 400 })
        }

        // Atualizar job no Prisma para reprocessamento
        await prisma.renderJob.update({
          where: { id: jobId },
          data: {
            status: 'queued',
            progress: 0,
            errorMessage: null,
            completedAt: null,
            updatedAt: new Date()
          }
        })

        return NextResponse.json({
          success: true,
          data: {
            message: 'Job recolocado na fila para reprocessamento',
            jobId,
            newStatus: 'queued',
            timestamp: new Date().toISOString()
          }
        })

      case 'download':
        if (job.status !== 'completed' || !job.outputVideo) {
          return NextResponse.json({
            success: false,
            error: {
              message: 'Job não está completo ou não tem saída disponível',
              code: 'NO_OUTPUT_AVAILABLE'
            }
          }, { status: 400 })
        }

        const lipSyncData = job.lipSyncData as LipSyncData | undefined;

        return NextResponse.json({
          success: true,
          data: {
            downloadUrl: job.outputVideo,
            thumbnailUrl: job.outputThumbnail,
            fileSize: '~50MB', // Estimativa
            format: 'MP4',
            resolution: '4K',
            duration: lipSyncData?.metadata?.audioLength || 5.0
          }
        })

      default:
        return NextResponse.json({
          success: false,
          error: {
            message: 'Ação não suportada',
            code: 'UNSUPPORTED_ACTION'
          }
        }, { status: 400 })
    }
  } catch (error) {
    logger.error('Erro na ação do job', error instanceof Error ? error : new Error(String(error)), { component: 'API: v2/avatars/render/status/[id]' })
    
    return NextResponse.json({
      success: false,
      error: {
        message: 'Erro ao executar ação no job',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        code: 'JOB_ACTION_ERROR'
      }
    }, { status: 500 })
  }
  });
}

const rateLimiterDelete = createRateLimiter(rateLimitPresets.authenticated);
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return rateLimiterDelete(request, async (request: NextRequest) => {
  try {
    const jobId = params.id
    const supabase = getSupabaseForRequest(request);
    
    logger.info(`API v2: Removendo job ${jobId}`, { component: 'API: v2/avatars/render/status/[id]' })

    const job = await avatar3DPipeline.getRenderJobStatus(jobId)
    
    if (!job) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'Job não encontrado',
          code: 'JOB_NOT_FOUND'
        }
      }, { status: 404 })
    }

    // Não permitir remoção de jobs em processamento
    if (job.status === 'processing') {
      return NextResponse.json({
        success: false,
        error: {
          message: 'Não é possível remover job em processamento. Cancele primeiro.',
          code: 'CANNOT_DELETE_PROCESSING'
        }
      }, { status: 400 })
    }

    // Remover job usando Prisma
    await prisma.renderJob.delete({
      where: { id: jobId }
    })

    // Também remover da memória se existir
    await avatar3DPipeline.cancelRenderJob(jobId)

    return NextResponse.json({
      success: true,
      data: {
        message: 'Job removido com sucesso',
        jobId,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    logger.error('Erro ao remover job', error instanceof Error ? error : new Error(String(error)), { component: 'API: v2/avatars/render/status/[id]' })
    
    return NextResponse.json({
      success: false,
      error: {
        message: 'Erro ao remover job',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        code: 'DELETE_JOB_ERROR'
      }
    }, { status: 500 })
  }
  });
}