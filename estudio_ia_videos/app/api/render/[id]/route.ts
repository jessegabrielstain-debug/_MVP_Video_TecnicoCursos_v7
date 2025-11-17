import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/services'
import { z } from 'zod'

// Schema para atualização de job de renderização
const updateRenderSchema = z.object({
  status: z.enum(['queued', 'processing', 'completed', 'failed', 'cancelled']).optional(),
  progress: z.number().min(0).max(100).optional(),
  error_message: z.string().optional(),
  output_url: z.string().url().optional(),
  output_file_size: z.number().positive().optional(),
  render_duration: z.number().positive().optional(),
  settings: z.object({
    resolution: z.enum(['720p', '1080p', '4k']).optional(),
    fps: z.number().int().min(24).max(60).optional(),
    quality: z.enum(['low', 'medium', 'high', 'ultra']).optional(),
    format: z.enum(['mp4', 'mov', 'webm']).optional(),
    audio_bitrate: z.number().int().min(64).max(320).optional(),
    video_bitrate: z.number().int().min(1000).max(50000).optional()
  }).optional()
})

// GET - Obter detalhes de um job de renderização
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const jobId = params.id

    // Buscar job com dados relacionados
    const { data: renderJob, error } = await supabase
      .from('render_jobs')
      .select(`
        *,
        projects:project_id (
          id,
          name,
          owner_id,
          collaborators,
          is_public
        )
      `)
      .eq('id', jobId)
      .single()

    if (error || !renderJob) {
      return NextResponse.json(
        { error: 'Job de renderização não encontrado' },
        { status: 404 }
      )
    }

    // Verificar permissões
    const project = renderJob.projects as Record<string, unknown>
    const hasPermission = project.owner_id === user.id || 
                         project.collaborators?.includes(user.id) ||
                         renderJob.user_id === user.id ||
                         project.is_public

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Sem permissão para acessar este job de renderização' },
        { status: 403 }
      )
    }

    // Calcular estatísticas se o job estiver completo
    let stats = null
    if (renderJob.status === 'completed' && renderJob.started_at && renderJob.completed_at) {
      const startTime = new Date(renderJob.started_at).getTime()
      const endTime = new Date(renderJob.completed_at).getTime()
      const totalTime = (endTime - startTime) / 1000 // em segundos

      stats = {
        total_render_time: totalTime,
        average_fps: renderJob.estimated_duration ? renderJob.estimated_duration / totalTime : null,
        file_size_mb: renderJob.output_file_size ? Math.round(renderJob.output_file_size / 1024 / 1024 * 100) / 100 : null
      }
    }

    return NextResponse.json({ 
      render_job: renderJob,
      stats 
    })

  } catch (error) {
    console.error('Erro ao buscar job de renderização:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar job de renderização
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const jobId = params.id
    const body = await request.json()

    // Validar dados
    const validatedData = updateRenderSchema.parse(body)

    // Verificar se job existe e permissões
    const { data: renderJob } = await supabase
      .from('render_jobs')
      .select(`
        *,
        projects:project_id (
          owner_id,
          collaborators
        )
      `)
      .eq('id', jobId)
      .single()

    if (!renderJob) {
      return NextResponse.json(
        { error: 'Job de renderização não encontrado' },
        { status: 404 }
      )
    }

    const project = renderJob.projects as any
    const hasPermission = project.owner_id === user.id || 
                         project.collaborators?.includes(user.id) ||
                         renderJob.user_id === user.id

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Sem permissão para atualizar este job de renderização' },
        { status: 403 }
      )
    }

    // Verificar se pode atualizar baseado no status atual
    if (renderJob.status === 'completed' && validatedData.status && validatedData.status !== 'completed') {
      return NextResponse.json(
        { error: 'Não é possível alterar status de um job já completado' },
        { status: 400 }
      )
    }

    // Preparar dados para atualização
    const updateData: any = {
      ...validatedData,
      updated_at: new Date().toISOString()
    }

    // Mesclar configurações se fornecidas
    if (validatedData.settings && renderJob.settings) {
      updateData.settings = {
        ...renderJob.settings,
        ...validatedData.settings
      }
    }

    // Definir timestamps baseados no status
    if (validatedData.status) {
      switch (validatedData.status) {
        case 'processing':
          if (renderJob.status === 'queued') {
            updateData.started_at = new Date().toISOString()
          }
          break
        case 'completed':
        case 'failed':
        case 'cancelled':
          if (!renderJob.completed_at) {
            updateData.completed_at = new Date().toISOString()
          }
          break
      }
    }

    // Atualizar job
    const { data: updatedJob, error: updateError } = await supabase
      .from('render_jobs')
      .update(updateData)
      .eq('id', jobId)
      .select()
      .single()

    if (updateError) {
      console.error('Erro ao atualizar job de renderização:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar job de renderização' },
        { status: 500 }
      )
    }

    // Registrar no histórico
    await supabase
      .from('project_history')
      .insert({
        project_id: renderJob.project_id,
        user_id: user.id,
        action: 'update',
        entity_type: 'render_job',
        entity_id: jobId,
        description: `Status da renderização atualizado para "${validatedData.status || renderJob.status}"`,
        changes: validatedData
      })

    return NextResponse.json({ render_job: updatedJob })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Erro ao atualizar job de renderização:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Cancelar/excluir job de renderização
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const jobId = params.id

    // Verificar se job existe e permissões
    const { data: renderJob } = await supabase
      .from('render_jobs')
      .select(`
        *,
        projects:project_id (
          owner_id,
          collaborators
        )
      `)
      .eq('id', jobId)
      .single()

    if (!renderJob) {
      return NextResponse.json(
        { error: 'Job de renderização não encontrado' },
        { status: 404 }
      )
    }

    const project = renderJob.projects as any
    const hasPermission = project.owner_id === user.id || 
                         project.collaborators?.includes(user.id) ||
                         renderJob.user_id === user.id

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Sem permissão para cancelar este job de renderização' },
        { status: 403 }
      )
    }

    // Verificar se pode cancelar
    if (renderJob.status === 'completed') {
      return NextResponse.json(
        { error: 'Não é possível cancelar um job já completado' },
        { status: 400 }
      )
    }

    // Se job está em processamento, cancelar; senão, excluir
    if (renderJob.status === 'processing' || renderJob.status === 'queued') {
      // Cancelar job
      const { data: cancelledJob, error: cancelError } = await supabase
        .from('render_jobs')
        .update({
          status: 'cancelled',
          completed_at: new Date().toISOString(),
          error_message: 'Job cancelado pelo usuário'
        })
        .eq('id', jobId)
        .select()
        .single()

      if (cancelError) {
        console.error('Erro ao cancelar job:', cancelError)
        return NextResponse.json(
          { error: 'Erro ao cancelar job de renderização' },
          { status: 500 }
        )
      }

      // Registrar no histórico
      await supabase
        .from('project_history')
        .insert({
          project_id: renderJob.project_id,
          user_id: user.id,
          action: 'update',
          entity_type: 'render_job',
          entity_id: jobId,
          description: 'Renderização cancelada',
          changes: { status: 'cancelled' }
        })

      return NextResponse.json({ 
        render_job: cancelledJob,
        message: 'Job de renderização cancelado com sucesso' 
      })

    } else {
      // Excluir job
      const { error: deleteError } = await supabase
        .from('render_jobs')
        .delete()
        .eq('id', jobId)

      if (deleteError) {
        console.error('Erro ao excluir job:', deleteError)
        return NextResponse.json(
          { error: 'Erro ao excluir job de renderização' },
          { status: 500 }
        )
      }

      // Registrar no histórico
      await supabase
        .from('project_history')
        .insert({
          project_id: renderJob.project_id,
          user_id: user.id,
          action: 'delete',
          entity_type: 'render_job',
          entity_id: jobId,
          description: 'Job de renderização excluído',
          changes: {
            deleted_job: {
              status: renderJob.status,
              created_at: renderJob.created_at
            }
          }
        })

      return NextResponse.json({ 
        message: 'Job de renderização excluído com sucesso' 
      })
    }

  } catch (error) {
    console.error('Erro ao cancelar/excluir job de renderização:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}