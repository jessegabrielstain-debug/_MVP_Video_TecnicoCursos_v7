/**
 * 🔄 API Pipeline Job Status
 *
 * Endpoints para monitoramento de jobs específicos
 * GET /api/pipeline/[id] - Status do job
 * DELETE /api/pipeline/[id] - Cancelar job
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { integratedPipeline } from '@/lib/pipeline/integrated-pipeline'
import { Logger } from '@/lib/logger'

const logger = new Logger('PipelineJobAPI')

/**
 * GET /api/pipeline/[id]
 * Obter status detalhado do job
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verificar autenticação
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorização necessário' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    const { id } = params

    // Obter job do pipeline
    const job = await integratedPipeline.getJobStatus(id)

    if (!job) {
      return NextResponse.json(
        { error: 'Job não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o usuário tem acesso ao job
    if (job.user_id !== user.id) {
      // Verificar se é admin
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (userProfile?.role !== 'admin') {
        return NextResponse.json(
          { error: 'Acesso negado' },
          { status: 403 }
        )
      }
    }

    // Preparar resposta com informações detalhadas
    const response = {
      success: true,
      job: {
        id: job.id,
        status: job.status,
        priority: job.priority,
        progress: job.progress,
        created_at: job.created_at,
        started_at: job.started_at,
        completed_at: job.completed_at,
        error: job.error,
        metadata: {
          text_length: job.metadata.text_length,
          estimated_duration: job.metadata.estimated_duration,
          complexity_score: job.metadata.complexity_score,
          performance_target: job.metadata.performance_target
        }
      },
      output: job.output ? {
        audio_url: job.output.audio_url,
        video_url: job.output.video_url,
        thumbnail_url: job.output.thumbnail_url,
        duration: job.output.duration,
        file_sizes: job.output.file_sizes,
        quality_metrics: job.output.quality_metrics,
        processing_stats: job.output.processing_stats
      } : null,
      timeline: generateJobTimeline(job),
      estimated_completion: job.status === 'processing' ?
        new Date(Date.now() + job.progress.estimated_remaining).toISOString() : null
    }

    // Log da consulta
    logger.info('Job status retrieved', {
      id,
      userId: user.id,
      status: job.status,
      progress: job.progress.percentage
    })

    return NextResponse.json(response)

  } catch (error) {
    logger.error('Failed to get job status', error instanceof Error ? error : new Error(String(error)), { id: params.id })
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/pipeline/[id]
 * Cancelar job
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verificar autenticação
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorização necessário' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    const { id } = params

    // Obter job para verificar permissões
    const job = await integratedPipeline.getJobStatus(id)

    if (!job) {
      return NextResponse.json(
        { error: 'Job não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o usuário tem acesso ao job
    if (job.user_id !== user.id) {
      // Verificar se é admin
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (userProfile?.role !== 'admin') {
        return NextResponse.json(
          { error: 'Acesso negado' },
          { status: 403 }
        )
      }
    }

    // Verificar se o job pode ser cancelado
    if (!['queued', 'processing'].includes(job.status)) {
      return NextResponse.json(
        {
          error: 'Job não pode ser cancelado',
          details: `Status atual: ${job.status}`
        },
        { status: 400 }
      )
    }

    // Cancelar job
    const cancelled = await integratedPipeline.cancelJob(id)

    if (!cancelled) {
      return NextResponse.json(
        { error: 'Falha ao cancelar job' },
        { status: 500 }
      )
    }

    // Log do cancelamento
    logger.info('Job cancelled', {
      id,
      userId: user.id,
      cancelledBy: user.id,
      previousStatus: job.status,
      stage: job.progress.stage
    })

    // Salvar log no Supabase
    await supabase.from('api_logs').insert({
      endpoint: `/api/pipeline/${id}`,
      method: 'DELETE',
      user_id: user.id,
      request_data: {
        job_id: id,
        action: 'cancel',
        previous_status: job.status
      },
      response_status: 200,
      created_at: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      message: 'Job cancelado com sucesso',
      job_id: id,
      previous_status: job.status,
      cancelled_at: new Date().toISOString()
    })

  } catch (error) {
    logger.error('Failed to cancel job', error instanceof Error ? error : new Error(String(error)), { id: params.id })
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/pipeline/[id]
 * Atualizar prioridade do job (apenas para jobs em fila)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verificar autenticação
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorização necessário' },
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    const { id } = params
    const body = await request.json()

    // Validar entrada
    if (!body.priority || !['low', 'normal', 'high', 'urgent'].includes(body.priority)) {
      return NextResponse.json(
        { error: 'Prioridade inválida' },
        { status: 400 }
      )
    }

    // Obter job para verificar permissões
    const job = await integratedPipeline.getJobStatus(id)

    if (!job) {
      return NextResponse.json(
        { error: 'Job não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o usuário tem acesso ao job
    if (job.user_id !== user.id) {
      // Verificar se é admin
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (userProfile?.role !== 'admin') {
        return NextResponse.json(
          { error: 'Acesso negado' },
          { status: 403 }
        )
      }
    }

    // Verificar se o job está em fila
    if (job.status !== 'queued') {
      return NextResponse.json(
        {
          error: 'Prioridade só pode ser alterada para jobs em fila',
          details: `Status atual: ${job.status}`
        },
        { status: 400 }
      )
    }

    // Atualizar prioridade no banco
    await supabase
      .from('pipeline_jobs')
      .update({
        priority: body.priority,
        updated_at: new Date().toISOString()
      })
      .eq('job_id', id)

    // Log da atualização
    logger.info('Job priority updated', {
      id,
      userId: user.id,
      oldPriority: job.priority,
      newPriority: body.priority
    })

    return NextResponse.json({
      success: true,
      message: 'Prioridade atualizada com sucesso',
      job_id: id,
      old_priority: job.priority,
      new_priority: body.priority,
      updated_at: new Date().toISOString()
    })

  } catch (error) {
    logger.error('Failed to update job priority', error instanceof Error ? error : new Error(String(error)), { id: params.id })
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * Gerar timeline do job
 */
interface TimelineJob {
  created_at: string;
  started_at?: string;
  completed_at?: string;
  status: string;
  error?: string;
  progress: {
    stage: string;
    stages_completed: string[];
    percentage: number;
    estimated_remaining: number;
  };
  metadata: {
    text_length: number;
    estimated_duration: number;
    complexity_score: number;
    performance_target: number;
  };
}

function generateJobTimeline(job: TimelineJob) {
  const timeline = []

  // Job criado
  timeline.push({
    stage: 'created',
    timestamp: job.created_at,
    status: 'completed',
    description: 'Job criado e adicionado à fila'
  })

  // Job iniciado
  if (job.started_at) {
    timeline.push({
      stage: 'started',
      timestamp: job.started_at,
      status: 'completed',
      description: 'Processamento iniciado'
    })
  }

  // Estágios do progresso
  const stages = [
    { name: 'tts', description: 'Geração de áudio (TTS)' },
    { name: 'lip_sync', description: 'Processamento de sincronização labial' },
    { name: 'avatar_render', description: 'Renderização do avatar' },
    { name: 'finalization', description: 'Finalização e upload' }
  ]

  stages.forEach(stage => {
    const isCompleted = job.progress.stages_completed.includes(stage.name)
    const isCurrent = job.progress.stage === stage.name
    
    timeline.push({
      stage: stage.name,
      timestamp: isCompleted ? new Date().toISOString() : null,
      status: isCompleted ? 'completed' : isCurrent ? 'processing' : 'pending',
      description: stage.description
    })
  })

  // Job completado
  if (job.completed_at) {
    timeline.push({
      stage: 'completed',
      timestamp: job.completed_at,
      status: job.status === 'completed' ? 'completed' : 'failed',
      description: job.status === 'completed' ? 
        'Processamento concluído com sucesso' : 
        `Processamento falhou: ${job.error}`
    })
  }

  return timeline
}