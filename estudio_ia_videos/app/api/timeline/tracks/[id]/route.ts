import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/services'
import { z } from 'zod'

// Schema de validação para atualização de track
const updateTrackSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  height: z.number().int().min(40).max(200).optional(),
  visible: z.boolean().optional(),
  locked: z.boolean().optional(),
  muted: z.boolean().optional(),
  properties: z.record(z.any()).optional()
})

interface RouteParams {
  params: {
    id: string
  }
}

// GET - Obter track específica com elementos
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

    const trackId = params.id

    // Buscar track com elementos e verificar permissões
    const { data: track, error } = await supabase
      .from('timeline_tracks')
      .select(`
        *,
        project:projects(owner_id, collaborators, is_public),
        timeline_elements:timeline_elements(*)
      `)
      .eq('id', trackId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Track não encontrada' },
          { status: 404 }
        )
      }
      console.error('Erro ao buscar track:', error)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    // Verificar permissões
    const project = track.project
    const hasPermission = project.owner_id === user.id || 
                         project.collaborators?.includes(user.id) ||
                         project.is_public

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Sem permissão para acessar esta track' },
        { status: 403 }
      )
    }

    // Remover dados do projeto da resposta
    const { project: _, ...trackData } = track

    return NextResponse.json(trackData)

  } catch (error) {
    console.error('Erro na API de track:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar track específica
export async function PUT(
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

    const trackId = params.id
    const body = await request.json()
    const validatedData = updateTrackSchema.parse(body)

    // Verificar se a track existe e obter dados do projeto
    const { data: existingTrack } = await supabase
      .from('timeline_tracks')
      .select(`
        *,
        project:projects(owner_id, collaborators)
      `)
      .eq('id', trackId)
      .single()

    if (!existingTrack) {
      return NextResponse.json(
        { error: 'Track não encontrada' },
        { status: 404 }
      )
    }

    // Verificar permissões
    const project = existingTrack.project
    const hasPermission = project.owner_id === user.id || 
                         project.collaborators?.includes(user.id)

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Sem permissão para editar esta track' },
        { status: 403 }
      )
    }

    // Atualizar track
    const { data: track, error } = await supabase
      .from('timeline_tracks')
      .update(validatedData)
      .eq('id', trackId)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar track:', error)
      return NextResponse.json(
        { error: 'Erro ao atualizar track' },
        { status: 500 }
      )
    }

    // Registrar no histórico
    await supabase
      .from('project_history')
      .insert({
        project_id: existingTrack.project_id,
        user_id: user.id,
        action: 'update',
        entity_type: 'track',
        entity_id: trackId,
        description: `Track "${track.name}" atualizada`,
        changes: {
          previous_data: {
            name: existingTrack.name,
            color: existingTrack.color,
            height: existingTrack.height,
            visible: existingTrack.visible,
            locked: existingTrack.locked,
            muted: existingTrack.muted,
            properties: existingTrack.properties
          },
          new_data: validatedData
        }
      })

    return NextResponse.json(track)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Erro na atualização de track:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir track específica
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

    const trackId = params.id

    // Verificar se a track existe e obter dados do projeto
    const { data: existingTrack } = await supabase
      .from('timeline_tracks')
      .select(`
        *,
        project:projects(owner_id, collaborators)
      `)
      .eq('id', trackId)
      .single()

    if (!existingTrack) {
      return NextResponse.json(
        { error: 'Track não encontrada' },
        { status: 404 }
      )
    }

    // Verificar permissões
    const project = existingTrack.project
    const hasPermission = project.owner_id === user.id || 
                         project.collaborators?.includes(user.id)

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Sem permissão para excluir esta track' },
        { status: 403 }
      )
    }

    // Verificar se há elementos na track
    const { data: elements } = await supabase
      .from('timeline_elements')
      .select('id')
      .eq('track_id', trackId)
      .limit(1)

    if (elements && elements.length > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir track que contém elementos. Remova os elementos primeiro.' },
        { status: 400 }
      )
    }

    // Excluir track
    const { error } = await supabase
      .from('timeline_tracks')
      .delete()
      .eq('id', trackId)

    if (error) {
      console.error('Erro ao excluir track:', error)
      return NextResponse.json(
        { error: 'Erro ao excluir track' },
        { status: 500 }
      )
    }

    // Registrar no histórico
    await supabase
      .from('project_history')
      .insert({
        project_id: existingTrack.project_id,
        user_id: user.id,
        action: 'delete',
        entity_type: 'track',
        entity_id: trackId,
        description: `Track "${existingTrack.name}" excluída`,
        changes: {
          deleted_track: {
            id: existingTrack.id,
            name: existingTrack.name,
            type: existingTrack.type
          }
        }
      })

    return NextResponse.json({ message: 'Track excluída com sucesso' })

  } catch (error) {
    console.error('Erro na exclusão de track:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}