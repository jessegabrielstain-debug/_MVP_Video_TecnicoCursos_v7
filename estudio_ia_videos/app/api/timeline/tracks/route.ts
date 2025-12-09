import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseForRequest } from '@/lib/supabase/server'
import { z } from 'zod'
import { Prisma } from '@prisma/client'
import { logger } from '@/lib/logger'

// Interfaces para tipagem de queries
interface TrackOrderIndex {
  order_index: number;
}

interface TrackCreated {
  id: string;
  name: string;
  type: string;
  project_id: string;
  order_index: number;
  color?: string | null;
  height?: number;
  visible?: boolean;
  locked?: boolean;
  muted?: boolean;
  properties?: Prisma.JsonValue;
}

interface ExistingTrackWithProjectId {
  id: string;
  project_id: string;
}

// Schema de validação para criação de track
const createTrackSchema = z.object({
  project_id: z.string().uuid('ID do projeto inválido'),
  name: z.string().min(1, 'Nome é obrigatório').max(255, 'Nome muito longo'),
  type: z.enum(['video', 'audio', 'text', 'image', 'pptx', '3d']),
  order_index: z.number().int().min(0).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida').optional(),
  height: z.number().int().min(40).max(200).optional(),
  visible: z.boolean().optional(),
  locked: z.boolean().optional(),
  muted: z.boolean().optional(),
  properties: z.record(z.unknown()).optional()
})

// Schema de validação para atualização de track
const updateTrackSchema = createTrackSchema.omit({ project_id: true }).partial()

// Schema de validação para reordenação de tracks
const reorderTracksSchema = z.object({
  tracks: z.array(z.object({
    id: z.string().uuid(),
    order_index: z.number().int().min(0)
  }))
})

// GET - Listar tracks de um projeto
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseForRequest(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('project_id')

    if (!projectId) {
      return NextResponse.json(
        { error: 'ID do projeto é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar permissões no projeto
    const { data: project } = await supabase
      .from('projects')
      .select('user_id, is_public')
      .eq('id', projectId)
      .single()

    if (!project) {
      return NextResponse.json(
        { error: 'Projeto não encontrado' },
        { status: 404 }
      )
    }

    let hasPermission = project.user_id === user.id || project.is_public

    if (!hasPermission) {
      const { data: collaborator } = await supabase
        .from('project_collaborators')
        .select('user_id')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .single()
      
      if (collaborator) hasPermission = true
    }

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Sem permissão para acessar este projeto' },
        { status: 403 }
      )
    }

    // Buscar tracks com elementos
    const { data: tracks, error } = await supabase
      .from('timeline_tracks')
      .select(`
        *,
        timeline_elements:timeline_elements(*)
      `)
      .eq('project_id', projectId)
      .order('order_index', { ascending: true })

    if (error) {
      logger.error('Erro ao buscar tracks', { component: 'API: timeline/tracks', error: error instanceof Error ? error : new Error(String(error)) })
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    return NextResponse.json({ tracks: tracks || [] })

  } catch (error) {
    logger.error('Erro na API de tracks', { component: 'API: timeline/tracks', error: error instanceof Error ? error : new Error(String(error)) })
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar nova track
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseForRequest(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createTrackSchema.parse(body)

    // Verificar permissões no projeto
    const { data: project } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', validatedData.project_id)
      .single()

    if (!project) {
      return NextResponse.json(
        { error: 'Projeto não encontrado' },
        { status: 404 }
      )
    }

    let hasPermission = project.user_id === user.id

    if (!hasPermission) {
      const { data: collaborator } = await supabase
        .from('project_collaborators')
        .select('permissions')
        .eq('project_id', validatedData.project_id)
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
        { error: 'Sem permissão para editar este projeto' },
        { status: 403 }
      )
    }

    // Se order_index não foi fornecido, usar o próximo disponível
    if (validatedData.order_index === undefined) {
      const { data: lastTrackData } = await supabase
        .from('timeline_tracks')
        .select('order_index')
        .eq('project_id', validatedData.project_id)
        .order('order_index', { ascending: false })
        .limit(1)
        .single()

      const lastTrack = lastTrackData as unknown as TrackOrderIndex | null;
      validatedData.order_index = (lastTrack?.order_index ?? -1) + 1
    }

    // Definir cor padrão baseada no tipo
    if (!validatedData.color) {
      const colorMap: Record<string, string> = {
        video: '#3b82f6',
        audio: '#10b981',
        text: '#f59e0b',
        image: '#8b5cf6',
        pptx: '#ef4444',
        '3d': '#06b6d4'
      }
      validatedData.color = colorMap[validatedData.type]
    }

    // Criar track
    const { data: trackData, error } = await supabase
      .from('timeline_tracks')
      .insert({
        ...validatedData,
        height: validatedData.height || 80,
        visible: validatedData.visible !== false,
        locked: validatedData.locked || false,
        muted: validatedData.muted || false,
        properties: (validatedData.properties || {}) as Prisma.InputJsonValue
      } as any)
      .select()
      .single()

    if (error) {
      logger.error('Erro ao criar track', { component: 'API: timeline/tracks', error: error instanceof Error ? error : new Error(String(error)) })
      return NextResponse.json(
        { error: 'Erro ao criar track' },
        { status: 500 }
      )
    }

    const track = trackData as unknown as TrackCreated;

    // Registrar no histórico
    await (supabase
      .from('project_history')
      .insert({
        project_id: validatedData.project_id,
        user_id: user.id,
        action: 'create',
        entity_type: 'track',
        entity_id: track.id,
        description: `Track "${track.name}" criada`,
        changes: {
          created_track: track
        } as any
      }) as any)

    return NextResponse.json(track, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    logger.error('Erro na criação de track', { component: 'API: timeline/tracks', error: error instanceof Error ? error : new Error(String(error)) })
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Reordenar tracks
export async function PUT(request: NextRequest) {
  try {
    const supabase = getSupabaseForRequest(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { tracks } = reorderTracksSchema.parse(body)

    // Verificar se todas as tracks existem e obter o project_id
    const trackIds = tracks.map(t => t.id)
    const { data: existingTracksData, error: fetchError } = await supabase
      .from('timeline_tracks')
      .select('id, project_id')
      .in('id', trackIds)

    const existingTracks = existingTracksData as unknown as ExistingTrackWithProjectId[] | null;

    if (fetchError || !existingTracks || existingTracks.length !== tracks.length) {
      return NextResponse.json(
        { error: 'Uma ou mais tracks não foram encontradas' },
        { status: 404 }
      )
    }

    // Verificar se todas as tracks pertencem ao mesmo projeto
    const projectIds = [...new Set(existingTracks.map(t => t.project_id))]
    if (projectIds.length !== 1) {
      return NextResponse.json(
        { error: 'Todas as tracks devem pertencer ao mesmo projeto' },
        { status: 400 }
      )
    }

    const projectId = projectIds[0]

    // Verificar permissões no projeto
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

    let hasPermission = project.user_id === user.id

    if (!hasPermission) {
      const { data: collaborator } = await supabase
        .from('project_collaborators')
        .select('permissions')
        .eq('project_id', projectId)
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
        { error: 'Sem permissão para editar este projeto' },
        { status: 403 }
      )
    }

    // Atualizar order_index de cada track
    const updatePromises = tracks.map(track =>
      supabase
        .from('timeline_tracks')
        .update({ order_index: track.order_index })
        .eq('id', track.id)
    )

    await Promise.all(updatePromises)

    // Registrar no histórico
    await (supabase
      .from('project_history')
      .insert({
        project_id: projectId,
        user_id: user.id,
        action: 'update',
        entity_type: 'track',
        description: 'Tracks reordenadas',
        changes: {
          reordered_tracks: tracks
        } as any
      }) as any)

    return NextResponse.json({ message: 'Tracks reordenadas com sucesso' })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    logger.error('Erro na reordenação de tracks', { component: 'API: timeline/tracks', error: error instanceof Error ? error : new Error(String(error)) })
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
