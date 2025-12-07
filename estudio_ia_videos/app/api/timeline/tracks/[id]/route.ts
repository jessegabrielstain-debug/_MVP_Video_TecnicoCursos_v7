import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseForRequest } from '@/lib/supabase/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

// Schema de validação para atualização de track
const updateTrackSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  height: z.number().int().min(40).max(200).optional(),
  visible: z.boolean().optional(),
  locked: z.boolean().optional(),
  muted: z.boolean().optional(),
  properties: z.record(z.unknown()).optional()
})

// Type interfaces
interface ProjectInfo {
  user_id: string;
  is_public?: boolean;
}

interface TrackWithProject {
  id: string;
  name: string;
  type: string;
  color?: string | null;
  height?: number;
  visible?: boolean;
  locked?: boolean;
  muted?: boolean;
  project_id: string;
  project: ProjectInfo;
  timeline_elements?: unknown[];
}

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
    const supabase = getSupabaseForRequest(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const trackId = params.id

    // Buscar track com elementos e verificar permissões
    const { data: trackData, error } = await supabase
      .from('timeline_tracks')
      .select(`
        *,
        project:projects(user_id, is_public),
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

    const track = trackData as unknown as TrackWithProject;
    
    // Verificar permissões
    const project = track.project
    let hasPermission = project.user_id === user.id || !!project.is_public

    if (!hasPermission) {
      const { data: collaborator } = await supabase
        .from('project_collaborators')
        .select('user_id')
        .eq('project_id', track.project_id)
        .eq('user_id', user.id)
        .single()
      
      if (collaborator) hasPermission = true
    }

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Sem permissão para acessar esta track' },
        { status: 403 }
      )
    }

    // Remover dados do projeto da resposta
    const { project: _, ...trackResponse } = track

    return NextResponse.json(trackResponse)

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
    const supabase = getSupabaseForRequest(request)
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
    const { data: existingTrackData } = await supabase
      .from('timeline_tracks')
      .select(`
        *,
        project:projects(user_id)
      `)
      .eq('id', trackId)
      .single()

    if (!existingTrackData) {
      return NextResponse.json(
        { error: 'Track não encontrada' },
        { status: 404 }
      )
    }

    const existingTrack = existingTrackData as unknown as TrackWithProject;
    
    // Verificar permissões
    const project = existingTrack.project
    let hasPermission = project.user_id === user.id

    if (!hasPermission) {
      const { data: collaborator } = await supabase
        .from('project_collaborators')
        .select('permissions')
        .eq('project_id', existingTrack.project_id)
        .eq('user_id', user.id)
        .single()
      
      // Check if permissions array contains 'write' or 'edit'
      if (collaborator && collaborator.permissions) {
        const perms = collaborator.permissions as string[];
        if (perms.includes('write') || perms.includes('edit')) {
          hasPermission = true;
        }
      }
    }

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Sem permissão para editar esta track' },
        { status: 403 }
      )
    }

    // Atualizar track
    const { data: updatedTrackData, error } = await supabase
      .from('timeline_tracks')
      .update(validatedData as any) // validatedData matches partial track structure
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

    const track = updatedTrackData as unknown as TrackWithProject;
    
    // Registrar no histórico
    await (supabase
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
            muted: existingTrack.muted
          },
          new_data: validatedData
        } as any
      }) as any)

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
    const supabase = getSupabaseForRequest(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const trackId = params.id

    // Verificar se a track existe e obter dados do projeto
    const { data: existingTrackData } = await supabase
      .from('timeline_tracks')
      .select(`
        *,
        project:projects(user_id)
      `)
      .eq('id', trackId)
      .single()

    if (!existingTrackData) {
      return NextResponse.json(
        { error: 'Track não encontrada' },
        { status: 404 }
      )
    }

    const existingTrack = existingTrackData as unknown as TrackWithProject;
    
    // Verificar permissões
    const project = existingTrack.project
    let hasPermission = project.user_id === user.id

    if (!hasPermission) {
      const { data: collaborator } = await supabase
        .from('project_collaborators')
        .select('permissions')
        .eq('project_id', existingTrack.project_id)
        .eq('user_id', user.id)
        .single()
      
      // Check if permissions array contains 'write' or 'edit'
      if (collaborator && collaborator.permissions) {
        const perms = collaborator.permissions as string[];
        if (perms.includes('write') || perms.includes('edit')) {
          hasPermission = true;
        }
      }
    }

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
    await (supabase
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
        } as any
      }) as any)

    return NextResponse.json({ message: 'Track excluída com sucesso' })

  } catch (error) {
    console.error('Erro na exclusão de track:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}