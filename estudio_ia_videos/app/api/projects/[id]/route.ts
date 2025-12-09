import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseForRequest } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

// Schema de validação para atualização de projetos
const UpdateProjectSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(255, 'Nome muito longo').optional(),
  description: z.string().optional(),
  type: z.enum(['pptx', 'template-nr', 'talking-photo', 'custom', 'ai-generated']).optional(),
  status: z.enum(['draft', 'in-progress', 'review', 'completed', 'archived', 'error']).optional(),
  settings: z.object({
    width: z.number().optional(),
    height: z.number().optional(),
    fps: z.number().optional(),
    duration: z.number().optional(),
    quality: z.enum(['low', 'medium', 'high']).optional(),
    format: z.enum(['mp4', 'mov', 'avi']).optional()
  }).optional(),
  is_public: z.boolean().optional()
})

// GET - Obter projeto específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseForRequest(request)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', params.id)
      .single()
    
    if (error || !project) {
      return NextResponse.json({
        success: false,
        error: 'Projeto não encontrado',
        timestamp: new Date().toISOString()
      }, { status: 404 })
    }

    let hasPermission = project.user_id === user.id || project.is_public

    if (!hasPermission) {
      const { data: collaborator } = await supabase
        .from('project_collaborators')
        .select('user_id')
        .eq('project_id', params.id)
        .eq('user_id', user.id)
        .single()
      
      if (collaborator) hasPermission = true
    }

    if (!hasPermission) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      data: project,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    logger.error('Erro ao buscar projeto', {
      component: 'API: projects/[id]',
      context: { id: params.id },
      error: error instanceof Error ? error : new Error(String(error))
    })
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// PUT - Atualizar projeto
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseForRequest(request)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    
    // Validação dos dados
    const validationResult = UpdateProjectSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Dados inválidos',
        details: validationResult.error.errors,
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    const validatedData = validationResult.data
    
    // Verificar permissões
    const { data: project } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', params.id)
      .single()

    if (!project) {
      return NextResponse.json({
        success: false,
        error: 'Projeto não encontrado',
        timestamp: new Date().toISOString()
      }, { status: 404 })
    }

    let hasPermission = project.user_id === user.id

    if (!hasPermission) {
      const { data: collaborator } = await supabase
        .from('project_collaborators')
        .select('permissions')
        .eq('project_id', params.id)
        .eq('user_id', user.id)
        .single()
      
      if (collaborator && (collaborator.permissions as any)?.can_edit) {
        hasPermission = true
      }
    }

    if (!hasPermission) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    // Preparar dados para atualização
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (validatedData.name) updateData.name = validatedData.name
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.type) updateData.type = validatedData.type
    if (validatedData.status) updateData.status = validatedData.status
    if (validatedData.is_public !== undefined) updateData.is_public = validatedData.is_public
    
    // Se houver settings, precisamos fazer merge com o existente ou substituir
    // Como é JSONB, o update do supabase faz merge se for top-level, mas aqui é uma coluna
    // Vamos buscar o atual primeiro se precisarmos fazer merge profundo, mas por simplicidade vamos assumir substituição ou merge via jsonb_set se fosse complexo.
    // Aqui vamos apenas atualizar a coluna render_settings se fornecida.
    if (validatedData.settings) {
        // Fetch current settings to merge? Or just overwrite?
        // Let's overwrite for now as the schema implies complete settings object or partial update of the column
        // Actually, let's fetch first to be safe if we want partial update inside jsonb
        const { data: currentProject } = await supabase
            .from('projects')
            .select('render_settings')
            .eq('id', params.id)
            .single()
        
        const currentSettings = (typeof currentProject?.render_settings === 'object' && currentProject?.render_settings !== null) 
          ? currentProject.render_settings as Record<string, unknown>
          : {}
        updateData.render_settings = { ...currentSettings, ...validatedData.settings }
    }

    const { data: updatedProject, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Projeto atualizado com sucesso!',
      data: updatedProject,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    logger.error('Erro ao atualizar projeto', {
      component: 'API: projects/[id]',
      context: { id: params.id },
      error: error instanceof Error ? error : new Error(String(error))
    })
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// DELETE - Excluir projeto
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseForRequest(request)
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Projeto excluído com sucesso!',
      data: { id: params.id },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error(`💥 [PROJECT-API] Erro ao excluir projeto ${params.id}:`, error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}