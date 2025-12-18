import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseForRequest } from '@/lib/supabase/server'
import { z } from 'zod'
import { logger } from '@/lib/logger';

// Type for timeline element with track and project info
interface TimelineElementWithTrack {
  id: string;
  track_id: string;
  start_time: number;
  duration: number;
  content?: string;
  type?: string;
  source_url?: string;
  properties?: Record<string, unknown>;
  effects?: Record<string, unknown>[];
  transitions?: Record<string, unknown>;
  locked?: boolean;
  project_id?: string;
  track: {
    id: string;
    name: string;
    type: string;
    locked?: boolean;
    project_id?: string;
    project: {
      owner_id: string;
      collaborators?: string[];
      is_public?: boolean;
    };
  };
}

// Schema de validação para atualização de elemento
const updateElementSchema = z.object({
  start_time: z.number().min(0).optional(),
  duration: z.number().min(0.1).optional(),
  content: z.string().min(1).optional(),
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

interface RouteParams {
  params: {
    id: string
  }
}

// GET - Obter elemento específico
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

    const elementId = params.id

    // Buscar elemento com dados da track e projeto
    const { data: elementData, error } = await supabase
      .from('timeline_elements')
      .select(`
        *,
        track:timeline_tracks(
          *,
          project:projects(owner_id, collaborators, is_public)
        )
      `)
      .eq('id', elementId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Elemento não encontrado' },
          { status: 404 }
        )
      }
      logger.error('Erro ao buscar elemento:', error instanceof Error ? error : new Error(String(error)), { component: 'API: timeline/elements/[id]' })
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    const element = elementData as unknown as TimelineElementWithTrack;
    
    // Verificar permissões
    const project = element.track.project
    const hasPermission = project.owner_id === user.id || 
                         (Array.isArray(project.collaborators) && (project.collaborators as string[]).includes(user.id)) ||
                         project.is_public

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Sem permissão para acessar este elemento' },
        { status: 403 }
      )
    }

    // Remover dados aninhados da resposta
    const { track, ...restData } = element

    return NextResponse.json({
      ...restData,
      track_name: track.name,
      track_type: track.type
    })

  } catch (error) {
    logger.error('Erro na API de elemento:', error instanceof Error ? error : new Error(String(error)), { component: 'API: timeline/elements/[id]' })
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar elemento específico
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

    const elementId = params.id
    const body = await request.json()
    const validatedData = updateElementSchema.parse(body)

    // Verificar se o elemento existe e obter dados do projeto
    const { data: existingElementData } = await supabase
      .from('timeline_elements')
      .select(`
        *,
        track:timeline_tracks(
          locked,
          project:projects(owner_id, collaborators)
        )
      `)
      .eq('id', elementId)
      .single()

    if (!existingElementData) {
      return NextResponse.json(
        { error: 'Elemento não encontrado' },
        { status: 404 }
      )
    }

    const existingElement = existingElementData as unknown as TimelineElementWithTrack;
    
    // Verificar permissões
    const project = existingElement.track.project
    const hasPermission = project.owner_id === user.id || 
                         (Array.isArray(project.collaborators) && (project.collaborators as string[]).includes(user.id))

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Sem permissão para editar este elemento' },
        { status: 403 }
      )
    }

    // Verificar se a track está bloqueada
    if (existingElement.track.locked) {
      return NextResponse.json(
        { error: 'Não é possível editar elemento em track bloqueada' },
        { status: 400 }
      )
    }

    // Se atualizando propriedades, fazer merge com as existentes
    let updateData = { ...validatedData }
    if (validatedData.properties) {
      updateData.properties = {
        ...existingElement.properties,
        ...validatedData.properties
      }
    }

    // Verificar sobreposição se mudando tempo ou duração
    if (validatedData.start_time !== undefined || validatedData.duration !== undefined) {
      const newStartTime = validatedData.start_time ?? existingElement.start_time
      const newDuration = validatedData.duration ?? existingElement.duration
      const newEndTime = newStartTime + newDuration

      const { data: overlappingElements } = await supabase
        .from('timeline_elements')
        .select('id, start_time, duration')
        .eq('track_id', existingElement.track_id)
        .neq('id', elementId)
        .or(`and(start_time.lte.${newStartTime},end_time.gt.${newStartTime}),and(start_time.lt.${newEndTime},end_time.gte.${newEndTime})`)

      if (overlappingElements && overlappingElements.length > 0) {
        return NextResponse.json(
          { 
            error: 'Elemento sobrepõe com elementos existentes',
            overlapping_elements: overlappingElements
          },
          { status: 409 }
        )
      }
    }

    // Atualizar elemento
    const { data: updatedElement, error } = await supabase
      .from('timeline_elements')
      .update(updateData)
      .eq('id', elementId)
      .select()
      .single()

    if (error) {
      logger.error('Erro ao atualizar elemento:', error instanceof Error ? error : new Error(String(error)), { component: 'API: timeline/elements/[id]' })
      return NextResponse.json(
        { error: 'Erro ao atualizar elemento' },
        { status: 500 }
      )
    }

    const element = updatedElement as unknown as TimelineElementWithTrack;
    const projectId = existingElement.track?.project_id || existingElement.project_id;
    
    if (projectId) {
      // Registrar no histórico
      await supabase
        .from('project_history')
        .insert({
          project_id: projectId,
          user_id: user.id,
          action: 'update',
          entity_type: 'element',
          entity_id: elementId,
          description: `Elemento ${element.type || 'desconhecido'} atualizado`,
          changes: {
            previous_data: {
              start_time: existingElement.start_time,
              duration: existingElement.duration,
              content: existingElement.content,
              properties: existingElement.properties,
              effects: existingElement.effects,
              transitions: existingElement.transitions
            },
            new_data: validatedData
          }
        })
    }

    return NextResponse.json(element)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    logger.error('Erro na atualização de elemento:', error instanceof Error ? error : new Error(String(error)), { component: 'API: timeline/elements/[id]' })
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir elemento específico
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

    const elementId = params.id

    // Verificar se o elemento existe e obter dados do projeto
    const { data: existingElementData } = await supabase
      .from('timeline_elements')
      .select(`
        *,
        track:timeline_tracks(
          locked,
          project:projects(owner_id, collaborators)
        )
      `)
      .eq('id', elementId)
      .single()

    if (!existingElementData) {
      return NextResponse.json(
        { error: 'Elemento não encontrado' },
        { status: 404 }
      )
    }

    const existingElement = existingElementData as unknown as TimelineElementWithTrack;
    
    // Verificar permissões
    const project = existingElement.track.project
    const hasPermission = project.owner_id === user.id || 
                         (Array.isArray(project.collaborators) && (project.collaborators as string[]).includes(user.id))

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Sem permissão para excluir este elemento' },
        { status: 403 }
      )
    }

    // Verificar se a track está bloqueada
    if (existingElement.track.locked) {
      return NextResponse.json(
        { error: 'Não é possível excluir elemento de track bloqueada' },
        { status: 400 }
      )
    }

    // Excluir elemento
    const { error } = await supabase
      .from('timeline_elements')
      .delete()
      .eq('id', elementId)

    if (error) {
      logger.error('Erro ao excluir elemento:', error instanceof Error ? error : new Error(String(error)), { component: 'API: timeline/elements/[id]' })
      return NextResponse.json(
        { error: 'Erro ao excluir elemento' },
        { status: 500 }
      )
    }

    // Registrar no histórico
    if (existingElement.project_id) {
      await supabase
        .from('project_history')
        .insert({
          project_id: existingElement.project_id,
          user_id: user.id,
          action: 'delete',
          entity_type: 'element',
          entity_id: elementId,
          description: `Elemento ${existingElement.type} excluído`,
          changes: {
            deleted_element: {
              id: existingElement.id,
              type: existingElement.type,
              content: existingElement.content,
              start_time: existingElement.start_time,
              duration: existingElement.duration
            }
          }
        })
    }

    return NextResponse.json({ message: 'Elemento excluído com sucesso' })

  } catch (error) {
    logger.error('Erro na exclusão de elemento:', error instanceof Error ? error : new Error(String(error)), { component: 'API: timeline/elements/[id]' })
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}