// TODO: Add timeline_elements and timeline_tracks tables to Supabase types
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseForRequest } from '@/lib/supabase/server'
import { z } from 'zod'

// Type interfaces for Supabase query results
interface ProjectPermissions {
  owner_id: string;
  collaborators?: string[];
  is_public?: boolean;
}

interface TrackWithProject {
  id: string;
  name?: string;
  locked?: boolean;
  project_id?: string;
  project: ProjectPermissions;
}

interface TimelineElement {
  id: string;
  track_id: string;
  project_id?: string;
  start_time: number;
  duration: number;
  type?: string;
  content?: string;
  source_url?: string;
  properties?: Record<string, unknown>;
  effects?: Record<string, unknown>[];
  transitions?: Record<string, unknown>;
  locked?: boolean;
  track?: TrackWithProject;
}

// Schema de validação para criação de elemento
const createElementSchema = z.object({
  track_id: z.string().uuid('ID da track inválido'),
  project_id: z.string().uuid('ID do projeto inválido'),
  start_time: z.number().min(0, 'Tempo de início deve ser positivo'),
  duration: z.number().min(0.1, 'Duração deve ser maior que 0.1 segundos'),
  type: z.enum(['video', 'audio', 'text', 'image', 'pptx_slide', '3d_avatar']),
  content: z.string().min(1, 'Conteúdo é obrigatório'),
  source_url: z.string().url().optional(),
  properties: z.object({
    volume: z.number().min(0).max(2).optional(),
    opacity: z.number().min(0).max(1).optional(),
    x: z.number().optional(),
    y: z.number().optional(),
    width: z.number().min(1).optional(),
    height: z.number().min(1).optional(),
    rotation: z.number().optional(),
    scale: z.number().min(0.1).max(10).optional()
  }).optional(),
  effects: z.array(z.record(z.unknown())).optional(),
  transitions: z.record(z.unknown()).optional(),
  thumbnail_url: z.string().url().optional(),
  file_size: z.number().int().min(0).optional(),
  mime_type: z.string().optional()
})

// Schema de validação para atualização de elemento
const updateElementSchema = createElementSchema.omit({ track_id: true, project_id: true }).partial()

// Schema de validação para mover elemento
const moveElementSchema = z.object({
  track_id: z.string().uuid().optional(),
  start_time: z.number().min(0).optional(),
  duration: z.number().min(0.1).optional()
})

// GET - Listar elementos de uma track ou projeto
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
    const trackId = searchParams.get('track_id')
    const projectId = searchParams.get('project_id')
    const type = searchParams.get('type')
    const startTime = searchParams.get('start_time')
    const endTime = searchParams.get('end_time')

    if (!trackId && !projectId) {
      return NextResponse.json(
        { error: 'ID da track ou projeto é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar permissões
    let hasPermission = false
    if (projectId) {
      const { data: projectData } = await (supabase
        .from('projects')
        .select('owner_id, collaborators, is_public') as any)
        .eq('id', projectId)
        .single()

      const project = projectData as unknown as ProjectPermissions | null;
      if (project) {
        hasPermission = project.owner_id === user.id || 
                       (Array.isArray(project.collaborators) && (project.collaborators as string[]).includes(user.id)) ||
                       !!project.is_public
      }
    } else if (trackId) {
      const { data: trackData } = await (supabase
        .from('timeline_tracks')
        .select(`
          project:projects(owner_id, collaborators, is_public)
        `) as any)
        .eq('id', trackId)
        .single()

      const track = trackData as unknown as { project: ProjectPermissions } | null;
      if (track?.project) {
        hasPermission = track.project.owner_id === user.id || 
                       (Array.isArray(track.project.collaborators) && (track.project.collaborators as string[]).includes(user.id)) ||
                       !!track.project.is_public
      }
    }

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Sem permissão para acessar estes elementos' },
        { status: 403 }
      )
    }

    // Construir query
    let query = (supabase
      .from('timeline_elements')
      .select('*') as any)
      .order('start_time', { ascending: true })

    if (trackId) {
      query = query.eq('track_id', trackId)
    }
    if (projectId) {
      query = query.eq('project_id', projectId)
    }
    if (type) {
      query = query.eq('type', type)
    }
    if (startTime) {
      query = query.gte('start_time', parseFloat(startTime))
    }
    if (endTime) {
      query = query.lte('end_time', parseFloat(endTime))
    }

    const { data: elements, error } = await query

    if (error) {
      console.error('Erro ao buscar elementos:', error)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    return NextResponse.json({ elements: elements || [] })

  } catch (error) {
    console.error('Erro na API de elementos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar novo elemento
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
    const validatedData = createElementSchema.parse(body)

    // Verificar se a track existe e obter dados do projeto
    const { data: trackData } = await (supabase
      .from('timeline_tracks')
      .select(`
        *,
        project:projects(owner_id, collaborators)
      `) as any)
      .eq('id', validatedData.track_id)
      .single()

    if (!trackData) {
      return NextResponse.json(
        { error: 'Track não encontrada' },
        { status: 404 }
      )
    }

    const track = trackData as unknown as TrackWithProject & { project_id: string; locked?: boolean };
    
    // Verificar se o project_id corresponde
    if (track.project_id !== validatedData.project_id) {
      return NextResponse.json(
        { error: 'Track não pertence ao projeto especificado' },
        { status: 400 }
      )
    }

    // Verificar permissões
    const project = track.project
    const hasPermission = project.owner_id === user.id || 
                         (Array.isArray(project.collaborators) && (project.collaborators as string[]).includes(user.id))

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Sem permissão para editar este projeto' },
        { status: 403 }
      )
    }

    // Verificar se a track está bloqueada
    if (track.locked) {
      return NextResponse.json(
        { error: 'Não é possível adicionar elementos a uma track bloqueada' },
        { status: 400 }
      )
    }

    // Definir propriedades padrão
    const defaultProperties = {
      volume: 1.0,
      opacity: 1.0,
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      rotation: 0,
      scale: 1.0,
      ...validatedData.properties
    }

    // Verificar sobreposição de elementos (opcional - pode ser configurável)
    const { data: overlappingElements } = await (supabase
      .from('timeline_elements')
      .select('id, start_time, duration') as any)
      .eq('track_id', validatedData.track_id)
      .or(`and(start_time.lte.${validatedData.start_time},end_time.gt.${validatedData.start_time}),and(start_time.lt.${validatedData.start_time + validatedData.duration},end_time.gte.${validatedData.start_time + validatedData.duration})`)

    if (overlappingElements && overlappingElements.length > 0) {
      return NextResponse.json(
        { 
          error: 'Elemento sobrepõe com elementos existentes',
          overlapping_elements: overlappingElements
        },
        { status: 409 }
      )
    }

    // Criar elemento
    const { data: elementData, error } = await (supabase
      .from('timeline_elements')
      .insert({
        ...validatedData,
        properties: defaultProperties,
        effects: validatedData.effects || [],
        transitions: validatedData.transitions || {}
      }) as any)
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar elemento:', error)
      return NextResponse.json(
        { error: 'Erro ao criar elemento' },
        { status: 500 }
      )
    }

    const element = elementData as unknown as TimelineElement;
    
    // Registrar no histórico
    await (supabase
      .from('project_history')
      .insert({
        project_id: validatedData.project_id,
        user_id: user.id,
        action: 'create',
        entity_type: 'element',
        entity_id: element.id,
        description: `Elemento ${element.type || 'desconhecido'} adicionado à timeline`,
        changes: {
          created_element: element
        } as any
      }) as any)

    return NextResponse.json(element, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Erro na criação de elemento:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Mover elemento para outra track ou posição
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

    const { searchParams } = new URL(request.url)
    const elementId = searchParams.get('id')

    if (!elementId) {
      return NextResponse.json(
        { error: 'ID do elemento é obrigatório' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = moveElementSchema.parse(body)

    // Verificar se o elemento existe
    const { data: existingElementData } = await (supabase
      .from('timeline_elements')
      .select(`
        *,
        track:timeline_tracks(
          *,
          project:projects(owner_id, collaborators)
        )
      `) as any)
      .eq('id', elementId)
      .single()

    if (!existingElementData) {
      return NextResponse.json(
        { error: 'Elemento não encontrado' },
        { status: 404 }
      )
    }

    const existingElement = existingElementData as unknown as TimelineElement;
    
    // Verificar permissões
    const project = existingElement.track!.project
    const hasPermission = project.owner_id === user.id || 
                         (Array.isArray(project.collaborators) && (project.collaborators as string[]).includes(user.id))

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Sem permissão para editar este elemento' },
        { status: 403 }
      )
    }

    // Se mudando de track, verificar se a nova track existe e pertence ao mesmo projeto
    if (validatedData.track_id && validatedData.track_id !== existingElement.track_id) {
      const { data: newTrackData } = await (supabase
        .from('timeline_tracks')
        .select('project_id, locked') as any)
        .eq('id', validatedData.track_id)
        .single()

      if (!newTrackData) {
        return NextResponse.json(
          { error: 'Track de destino não encontrada' },
          { status: 404 }
        )
      }

      const newTrack = newTrackData as unknown as { project_id: string; locked?: boolean };
      const currentProjectId = existingElement.track?.project_id;
      
      if (newTrack.project_id !== currentProjectId) {
        return NextResponse.json(
          { error: 'Track de destino deve pertencer ao mesmo projeto' },
          { status: 400 }
        )
      }

      if (newTrack.locked) {
        return NextResponse.json(
          { error: 'Não é possível mover elemento para track bloqueada' },
          { status: 400 }
        )
      }
    }

    // Atualizar elemento
    const updateData: Record<string, unknown> = {}
    if (validatedData.track_id) updateData.track_id = validatedData.track_id
    if (validatedData.start_time !== undefined) updateData.start_time = validatedData.start_time
    if (validatedData.duration !== undefined) updateData.duration = validatedData.duration

    const { data: element, error } = await (supabase
      .from('timeline_elements')
      .update(updateData) as any)
      .eq('id', elementId)
      .select()
      .single()

    if (error) {
      console.error('Erro ao mover elemento:', error)
      return NextResponse.json(
        { error: 'Erro ao mover elemento' },
        { status: 500 }
      )
    }

    const currentProjectId = existingElement.project_id || existingElement.track?.project_id;
    
    if (currentProjectId) {
      // Registrar no histórico
      await (supabase
        .from('project_history')
        .insert({
          project_id: currentProjectId,
          user_id: user.id,
          action: 'update',
          entity_type: 'element',
          entity_id: elementId,
          description: 'Elemento movido na timeline',
          changes: {
            previous_data: {
              track_id: existingElement.track_id,
              start_time: existingElement.start_time,
              duration: existingElement.duration
            },
            new_data: updateData
          } as any
        }) as any)
    }

    return NextResponse.json(element)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Erro ao mover elemento:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
