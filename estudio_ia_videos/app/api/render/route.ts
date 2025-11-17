import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { VideoRenderWorker } from '@/lib/workers/video-render-worker'
import Queue from 'bull'

// Configurar fila de renderização
const renderQueue = new Queue('video render', process.env.REDIS_URL || 'redis://localhost:6379')

// Schema de validação para renderização
const renderSchema = z.object({
  project_id: z.string().uuid('ID do projeto inválido'),
  settings: z.object({
    resolution: z.enum(['720p', '1080p', '4k']).default('1080p'),
    fps: z.number().int().min(24).max(60).default(30),
    quality: z.enum(['low', 'medium', 'high', 'ultra']).default('high'),
    format: z.enum(['mp4', 'mov', 'webm']).default('mp4'),
    audio_bitrate: z.number().int().min(64).max(320).default(192),
    video_bitrate: z.number().int().min(1000).max(50000).optional()
  }).default({}),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
  webhook_url: z.string().url().optional()
})

// Schema para atualização de job de renderização
const updateRenderSchema = z.object({
  status: z.enum(['queued', 'processing', 'completed', 'failed', 'cancelled']).optional(),
  progress: z.number().min(0).max(100).optional(),
  error_message: z.string().optional(),
  output_url: z.string().url().optional(),
  output_file_size: z.number().positive().optional(),
  render_duration: z.number().positive().optional()
})

// POST - Iniciar renderização REAL com VideoRenderWorker
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = renderSchema.parse(body)

    // Verificar se projeto existe e permissões
    const { data: project } = await supabase
      .from('projects')
      .select(`
        *,
        timeline_tracks:timeline_tracks(
          id,
          type,
          timeline_elements:timeline_elements(count)
        )
      `)
      .eq('id', validatedData.project_id)
      .single()

    if (!project) {
      return NextResponse.json(
        { error: 'Projeto não encontrado' },
        { status: 404 }
      )
    }

    const hasPermission = project.owner_id === user.id || 
                         project.collaborators?.includes(user.id)

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Sem permissão para renderizar este projeto' },
        { status: 403 }
      )
    }

    // Verificar se projeto tem conteúdo para renderizar
    const tracksUnknown = project.timeline_tracks as unknown
    const hasElements = Array.isArray(tracksUnknown) && (tracksUnknown as Array<Record<string, unknown>>).some(track => 
      Array.isArray(track.timeline_elements) && track.timeline_elements.length > 0
    )

    if (!hasElements) {
      return NextResponse.json(
        { error: 'Projeto não possui elementos na timeline para renderizar' },
        { status: 400 }
      )
    }

    // Verificar se já existe renderização em andamento
    const { data: activeRender } = await supabase
      .from('render_jobs')
      .select('id, status')
      .eq('project_id', validatedData.project_id)
      .in('status', ['queued', 'processing'])
      .single()

    if (activeRender) {
      return NextResponse.json(
        { error: 'Já existe uma renderização em andamento para este projeto' },
        { status: 409 }
      )
    }

    // Calcular duração estimada do projeto
    const { data: projectDuration } = await supabase
      .rpc('calculate_project_duration', { project_id: validatedData.project_id })

    // Definir configurações padrão baseadas na resolução
    const defaultSettings = {
      resolution: '1080p',
      fps: 30,
      quality: 'high',
      format: 'mp4',
      audio_bitrate: 192,
      video_bitrate: getDefaultVideoBitrate(validatedData.settings.resolution || '1080p')
    }

    const finalSettings = {
      ...defaultSettings,
      ...validatedData.settings
    }

    // Criar job de renderização
    const { data: renderJob, error } = await supabase
      .from('render_jobs')
      .insert({
        project_id: validatedData.project_id,
        user_id: user.id,
        status: 'queued',
        settings: finalSettings,
        priority: validatedData.priority,
        webhook_url: validatedData.webhook_url,
        estimated_duration: projectDuration || 0,
        progress: 0
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar job de renderização:', error)
      return NextResponse.json(
        { error: 'Erro ao iniciar renderização' },
        { status: 500 }
      )
    }

    // Registrar no histórico
    await supabase
      .from('project_history')
      .insert({
        project_id: validatedData.project_id,
        user_id: user.id,
        action: 'create',
        entity_type: 'render_job',
        entity_id: renderJob.id,
        description: 'Renderização iniciada',
        changes: {
          render_settings: finalSettings,
          priority: validatedData.priority
        }
      })

    // Adicionar job à fila de renderização REAL
    const job = await renderQueue.add('render-video', {
      jobId: renderJob.id,
      projectId: validatedData.project_id,
      userId: user.id,
      settings: finalSettings,
      priority: validatedData.priority,
      webhookUrl: validatedData.webhook_url
    }, {
      priority: validatedData.priority === 'high' ? 1 : validatedData.priority === 'low' ? 3 : 2,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    })

    console.log(`🎬 Render job ${renderJob.id} added to queue with job ID: ${job.id}`)

    return NextResponse.json({
      render_job: renderJob,
      queue_job_id: job.id,
      message: 'Renderização iniciada com sucesso'
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Erro ao iniciar renderização:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// GET - Listar jobs de renderização
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('project_id')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('render_jobs')
      .select(`
        *,
        projects:project_id (
          id,
          name,
          owner_id,
          collaborators
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: renderJobs, error } = await query

    if (error) {
      console.error('Erro ao buscar jobs de renderização:', error)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    // Filtrar apenas jobs que o usuário tem permissão para ver
    const authorizedJobs = (renderJobs || []).filter(job => {
      const project = job.projects as Record<string, unknown>
      return project.owner_id === user.id || 
             (Array.isArray(project.collaborators) && (project.collaborators as unknown[]).includes(user.id)) ||
             job.user_id === user.id
    })

    return NextResponse.json({ render_jobs: authorizedJobs })

  } catch (error) {
    console.error('Erro na API de renderização:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Função auxiliar para obter bitrate padrão baseado na resolução
function getDefaultVideoBitrate(resolution: string): number {
  switch (resolution) {
    case '720p': return 2500
    case '1080p': return 5000
    case '4k': return 15000
    default: return 5000
  }
}

// Configurar worker para processar fila de renderização REAL
renderQueue.process('render-video', async (job) => {
  console.log(`🎬 Processing render job: ${job.data.jobId}`)
  
  const worker = new VideoRenderWorker()
  
  // Configurar listeners de progresso
  worker.on('progress', async (progress) => {
    console.log(`📊 Job ${job.data.jobId} progress: ${progress.percentage}% - ${progress.stage}`)
    
    // Atualizar progresso no job da fila
    job.progress(progress.percentage)
    
    // Atualizar progresso no banco de dados
    try {
      const supabase = createRouteHandlerClient({ cookies })
      await supabase
        .from('render_jobs')
        .update({
          progress: progress.percentage,
          current_stage: progress.stage,
          status_message: progress.message
        })
        .eq('id', job.data.jobId)
    } catch (error) {
      console.error('Error updating progress in database:', error)
    }
  })
  
  worker.on('stage-change', async (stage) => {
    console.log(`🎭 Job ${job.data.jobId} stage: ${stage}`)
    
    try {
      const supabase = createRouteHandlerClient({ cookies })
      await supabase
        .from('render_jobs')
        .update({
          current_stage: stage,
          status: stage === 'preparing' ? 'processing' : 'processing'
        })
        .eq('id', job.data.jobId)
    } catch (error) {
      console.error('Error updating stage in database:', error)
    }
  })
  
  try {
    // Processar renderização real
    const videoUrl = await worker.processRenderJob(job.data)
    
    console.log(`✅ Render job ${job.data.jobId} completed: ${videoUrl}`)
    
    // Enviar webhook se configurado
    if (job.data.webhookUrl) {
      try {
        await fetch(job.data.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            job_id: job.data.jobId,
            status: 'completed',
            video_url: videoUrl,
            project_id: job.data.projectId
          })
        })
      } catch (webhookError) {
        console.warn('Erro ao enviar webhook:', webhookError)
      }
    }
    
    return { videoUrl }
    
  } catch (error) {
    console.error(`❌ Render job ${job.data.jobId} failed:`, error)
    
    // Atualizar status de erro no banco
    try {
      const supabase = createRouteHandlerClient({ cookies })
      await supabase
        .from('render_jobs')
        .update({
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          completed_at: new Date().toISOString()
        })
        .eq('id', job.data.jobId)
    } catch (dbError) {
      console.error('Error updating failed status in database:', dbError)
    }
    
    throw error
  }
})

// Event listeners para a fila
renderQueue.on('completed', (job, result) => {
  console.log(`🎉 Render job completed: ${job.data.jobId} -> ${result.videoUrl}`)
})

renderQueue.on('failed', (job, err) => {
  console.error(`❌ Render job failed: ${job.data.jobId}`, err)
})

renderQueue.on('stalled', (job) => {
  console.warn(`⏸️ Render job stalled: ${job.data.jobId}`)
})