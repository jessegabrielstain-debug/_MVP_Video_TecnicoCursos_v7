import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

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

// POST - Iniciar renderização
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
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

    // Iniciar processamento assíncrono
    processRenderJobAsync(renderJob.id)

    return NextResponse.json({
      render_job: renderJob,
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
    const supabase = createClient()
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

// Função para processar renderização assincronamente (simulada)
async function processRenderJobAsync(jobId: string) {
  try {
    const supabase = createClient()

    // Atualizar status para processando
    await supabase
      .from('render_jobs')
      .update({ 
        status: 'processing',
        started_at: new Date().toISOString(),
        progress: 5
      })
      .eq('id', jobId)

    // Simular progresso de renderização
    const progressSteps = [10, 25, 40, 55, 70, 85, 95]
    
    for (const progress of progressSteps) {
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      await supabase
        .from('render_jobs')
        .update({ progress })
        .eq('id', jobId)
    }

    // Simular finalização
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Gerar URL de output simulada
    const outputUrl = `https://storage.example.com/renders/${jobId}.mp4`
    const outputFileSize = Math.floor(Math.random() * 100000000) + 10000000 // 10MB - 100MB

    await supabase
      .from('render_jobs')
      .update({
        status: 'completed',
        progress: 100,
        output_url: outputUrl,
        output_file_size: outputFileSize,
        completed_at: new Date().toISOString(),
        render_duration: Math.floor(Math.random() * 300) + 60 // 1-5 minutos
      })
      .eq('id', jobId)

    // Buscar dados do job para webhook
    const { data: job } = await supabase
      .from('render_jobs')
      .select('*, projects:project_id(name)')
      .eq('id', jobId)
      .single()

    // Enviar webhook se configurado
    if (job?.webhook_url) {
      try {
        await fetch(job.webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            job_id: jobId,
            status: 'completed',
            output_url: outputUrl,
            project_name: job.projects?.name
          })
        })
      } catch (webhookError) {
        console.warn('Erro ao enviar webhook:', webhookError)
      }
    }

  } catch (error) {
    console.error('Erro no processamento de renderização:', error)
    
    // Marcar como falha
    const supabase = createClient()
    await supabase
      .from('render_jobs')
      .update({
        status: 'failed',
        error_message: 'Erro durante o processamento da renderização',
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId)
  }
}