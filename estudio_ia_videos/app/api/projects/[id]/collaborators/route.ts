import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/services'
import { z } from 'zod'

// Schema para adicionar colaborador
const addCollaboratorSchema = z.object({
  email: z.string().email('Email inválido')
})

// Schema para remover colaborador
const removeCollaboratorSchema = z.object({
  user_id: z.string().uuid('ID de usuário inválido')
})

interface RouteParams {
  params: {
    id: string
  }
}

// GET - Listar colaboradores do projeto
export async function GET(
  request: NextRequest,
  { params }: RouteParams
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

    const projectId = params.id

    // Verificar se o usuário tem acesso ao projeto
    const { data: project } = await supabase
      .from('projects')
      .select('owner_id, collaborators')
      .eq('id', projectId)
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
        { error: 'Sem permissão para acessar este projeto' },
        { status: 403 }
      )
    }

    // Buscar dados dos colaboradores
    const collaboratorIds = project.collaborators || []
    const allUserIds = [project.owner_id, ...collaboratorIds]

    const { data: users, error } = await supabase
      .from('auth.users')
      .select('id, email, user_metadata')
      .in('id', allUserIds)

    if (error) {
      console.error('Erro ao buscar colaboradores:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar colaboradores' },
        { status: 500 }
      )
    }

    // Mapear usuários com suas funções
    const collaborators = users?.map(u => ({
      id: u.id,
      email: u.email,
      name: u.user_metadata?.name || u.email,
      avatar: u.user_metadata?.avatar_url,
      role: u.id === project.owner_id ? 'owner' : 'collaborator',
      joined_at: u.id === project.owner_id ? null : new Date().toISOString()
    })) || []

    return NextResponse.json({ collaborators })

  } catch (error) {
    console.error('Erro na API de colaboradores:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Adicionar colaborador ao projeto
export async function POST(
  request: NextRequest,
  { params }: RouteParams
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

    const projectId = params.id
    const body = await request.json()
    const { email } = addCollaboratorSchema.parse(body)

    // Verificar se o usuário é o dono do projeto
    const { data: project } = await supabase
      .from('projects')
      .select('owner_id, collaborators, name')
      .eq('id', projectId)
      .single()

    if (!project) {
      return NextResponse.json(
        { error: 'Projeto não encontrado' },
        { status: 404 }
      )
    }

    if (project.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'Apenas o dono pode adicionar colaboradores' },
        { status: 403 }
      )
    }

    // Buscar usuário pelo email
    const { data: targetUser, error: userError } = await supabase
      .from('auth.users')
      .select('id, email')
      .eq('email', email)
      .single()

    if (userError || !targetUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se já é colaborador
    const currentCollaborators = project.collaborators || []
    if (currentCollaborators.includes(targetUser.id) || targetUser.id === project.owner_id) {
      return NextResponse.json(
        { error: 'Usuário já é colaborador deste projeto' },
        { status: 400 }
      )
    }

    // Adicionar colaborador
    const updatedCollaborators = [...currentCollaborators, targetUser.id]
    
    const { data: updatedProject, error } = await supabase
      .from('projects')
      .update({ collaborators: updatedCollaborators })
      .eq('id', projectId)
      .select()
      .single()

    if (error) {
      console.error('Erro ao adicionar colaborador:', error)
      return NextResponse.json(
        { error: 'Erro ao adicionar colaborador' },
        { status: 500 }
      )
    }

    // Registrar no histórico
    await supabase
      .from('project_history')
      .insert({
        project_id: projectId,
        user_id: user.id,
        action: 'create',
        entity_type: 'collaborator',
        entity_id: targetUser.id,
        description: `Colaborador ${email} adicionado ao projeto`,
        changes: {
          added_collaborator: {
            id: targetUser.id,
            email: targetUser.email
          }
        }
      })

    return NextResponse.json({
      message: 'Colaborador adicionado com sucesso',
      collaborator: {
        id: targetUser.id,
        email: targetUser.email,
        role: 'collaborator'
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Erro ao adicionar colaborador:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Remover colaborador do projeto
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
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

    const projectId = params.id
    const { searchParams } = new URL(request.url)
    const collaboratorId = searchParams.get('user_id')

    if (!collaboratorId) {
      return NextResponse.json(
        { error: 'ID do colaborador é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se o usuário é o dono do projeto
    const { data: project } = await supabase
      .from('projects')
      .select('owner_id, collaborators')
      .eq('id', projectId)
      .single()

    if (!project) {
      return NextResponse.json(
        { error: 'Projeto não encontrado' },
        { status: 404 }
      )
    }

    // Permitir que o próprio colaborador se remova ou que o dono remova qualquer um
    const canRemove = project.owner_id === user.id || collaboratorId === user.id

    if (!canRemove) {
      return NextResponse.json(
        { error: 'Sem permissão para remover este colaborador' },
        { status: 403 }
      )
    }

    // Não permitir remover o dono
    if (collaboratorId === project.owner_id) {
      return NextResponse.json(
        { error: 'Não é possível remover o dono do projeto' },
        { status: 400 }
      )
    }

    // Remover colaborador
    const currentCollaborators = project.collaborators || []
    const updatedCollaborators = currentCollaborators.filter(id => id !== collaboratorId)

    const { error } = await supabase
      .from('projects')
      .update({ collaborators: updatedCollaborators })
      .eq('id', projectId)

    if (error) {
      console.error('Erro ao remover colaborador:', error)
      return NextResponse.json(
        { error: 'Erro ao remover colaborador' },
        { status: 500 }
      )
    }

    // Remover sessões de colaboração ativas
    await supabase
      .from('collaboration_sessions')
      .update({ status: 'disconnected' })
      .eq('project_id', projectId)
      .eq('user_id', collaboratorId)

    // Registrar no histórico
    await supabase
      .from('project_history')
      .insert({
        project_id: projectId,
        user_id: user.id,
        action: 'delete',
        entity_type: 'collaborator',
        entity_id: collaboratorId,
        description: `Colaborador removido do projeto`,
        changes: {
          removed_collaborator: collaboratorId
        }
      })

    return NextResponse.json({
      message: 'Colaborador removido com sucesso'
    })

  } catch (error) {
    console.error('Erro ao remover colaborador:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}