import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseForRequest } from '@/lib/supabase/server'
import { z } from 'zod'

// Schema para adicionar colaborador
const addCollaboratorSchema = z.object({
  email: z.string().email('Email inválido')
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
    const supabase = getSupabaseForRequest(request)
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
      .select('user_id')
      .eq('id', projectId)
      .single()

    if (!project) {
      return NextResponse.json(
        { error: 'Projeto não encontrado' },
        { status: 404 }
      )
    }

    const ownerId = project.user_id
    const isOwner = ownerId === user.id

    // Check if user is collaborator
    const { data: collaboratorRecord } = await supabase
      .from('project_collaborators')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .single()

    const isCollaborator = !!collaboratorRecord

    if (!isOwner && !isCollaborator) {
      return NextResponse.json(
        { error: 'Sem permissão para acessar este projeto' },
        { status: 403 }
      )
    }

    // Buscar colaboradores
    const { data: collaboratorsData, error } = await (supabase as any)
      .from('project_collaborators')
      .select(`
        id,
        user_id,
        role,
        joined_at
      `)
      .eq('project_id', projectId)

    if (error) {
      console.error('Erro ao buscar colaboradores:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar colaboradores' },
        { status: 500 }
      )
    }

    // Buscar dados dos usuários colaboradores
    const collaboratorUserIds = collaboratorsData?.map((c: any) => c.user_id) || []
    let usersMap: Record<string, any> = {}
    
    if (collaboratorUserIds.length > 0) {
      const { data: usersData } = await (supabase as any)
        .from('users')
        .select('id, email, name, avatar_url')
        .in('id', collaboratorUserIds)
      
      if (usersData) {
        usersMap = usersData.reduce((acc: any, u: any) => {
          acc[u.id] = u
          return acc
        }, {})
      }
    }

    // Buscar dados do dono
    const { data: ownerData } = await (supabase as any)
      .from('users')
      .select('id, email, name, avatar_url')
      .eq('id', ownerId)
      .single()

    const formattedCollaborators = [
      // Owner
      ...(ownerData ? [{
        id: ownerData.id,
        email: ownerData.email,
        name: ownerData.name || ownerData.email,
        avatar: ownerData.avatar_url,
        role: 'owner',
        joined_at: null
      }] : []),
      // Collaborators
      ...(collaboratorsData?.map((c: any) => {
        const userData = usersMap[c.user_id] || {}
        return {
          id: userData.id || c.user_id,
          email: userData.email,
          name: userData.name || userData.email,
          avatar: userData.avatar_url,
          role: c.role || 'collaborator',
          joined_at: c.joined_at
        }
      }) || [])
    ]

    return NextResponse.json({ collaborators: formattedCollaborators })

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
    const supabase = getSupabaseForRequest(request)
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
      .select('user_id, name')
      .eq('id', projectId)
      .single()

    if (!project) {
      return NextResponse.json(
        { error: 'Projeto não encontrado' },
        { status: 404 }
      )
    }

    if (project.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Apenas o dono pode adicionar colaboradores' },
        { status: 403 }
      )
    }

    // Buscar usuário pelo email na tabela users (public)
    const { data: targetUser, error: userError } = await supabase
      .from('users')
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
    const { data: existingCollaborator } = await supabase
      .from('project_collaborators')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', targetUser.id)
      .single()

    if (existingCollaborator || targetUser.id === project.user_id) {
      return NextResponse.json(
        { error: 'Usuário já é colaborador deste projeto' },
        { status: 400 }
      )
    }

    // Adicionar colaborador
    const { error: insertError } = await supabase
      .from('project_collaborators')
      .insert({
        project_id: projectId,
        user_id: targetUser.id,
        role: 'editor', // Default role
        invited_by: user.id,
        permissions: ['read', 'write']
      })

    if (insertError) {
      console.error('Erro ao adicionar colaborador:', insertError)
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
        role: 'editor'
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
    const supabase = getSupabaseForRequest(request)
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
      .select('user_id')
      .eq('id', projectId)
      .single()

    if (!project) {
      return NextResponse.json(
        { error: 'Projeto não encontrado' },
        { status: 404 }
      )
    }

    // Permitir que o próprio colaborador se remova ou que o dono remova qualquer um
    const canRemove = project.user_id === user.id || collaboratorId === user.id

    if (!canRemove) {
      return NextResponse.json(
        { error: 'Sem permissão para remover este colaborador' },
        { status: 403 }
      )
    }

    // Não permitir remover o dono
    if (collaboratorId === project.user_id) {
      return NextResponse.json(
        { error: 'Não é possível remover o dono do projeto' },
        { status: 400 }
      )
    }

    // Remover colaborador
    const { error } = await supabase
      .from('project_collaborators')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', collaboratorId)

    if (error) {
      console.error('Erro ao remover colaborador:', error)
      return NextResponse.json(
        { error: 'Erro ao remover colaborador' },
        { status: 500 }
      )
    }

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