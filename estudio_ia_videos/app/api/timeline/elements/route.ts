import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/services'
import { z } from 'zod'

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
  effects: z.array(z.record(z.any())).optional(),
  transitions: z.record(z.any()).optional(),
  thumbnail_url: z.string().url().optional(),
  file_size: z.number().int().min(0).optional(),
  mime_type: z.string().optional()
})

// Schema de validação para atualização de elemento
const updateElementSchema = createElementSchema.partial().omit(['track_id', 'project_id'])

// Schema de validação para mover elemento
const moveElementSchema = z.object({
  track_id: z.string().uuid().optional(),
  start_time: z.number().min(0).optional(),
  duration: z.number().min(0.1).optional()
})

// GET - Listar elementos de uma track ou projeto
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
      const { data: project } = await supabase
        .from('projects')
        .select('owner_id, collaborators, is_public')
        .eq('id', projectId)
        .single()

      if (project) {
        hasPermission = project.owner_id === user.id || 
                       project.collaborators?.includes(user.id) ||
                       project.is_public
      }
    } else if (trackId) {
      const { data: track } = await supabase
        .from('timeline_tracks')
        .select(`
          project:projects(owner_id, collaborators, is_public)
        `)
        .eq('id', trackId)
        .single()

      if (track?.project) {
        hasPermission = track.project.owner_id === user.id || 
                       track.project.collaborators?.includes(user.id) ||
                       track.project.is_public
      }
    }

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Sem permissão para acessar estes elementos' },
        { status: 403 }
      )
    }

    // Construir query
    let query = supabase
      .from('timeline_elements')
      .select('*')
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
    const supabase = createClient()
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
    const { data: track } = await supabase
      .from('timeline_tracks')
      .select(`
        *,
        project:projects(owner_id, collaborators)
      `)
      .eq('id', validatedData.track_id)
      .single()

    if (!track) {
      return NextResponse.json(
        { error: 'Track não encontrada' },
        { status: 404 }
      )
    }

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
                         project.collaborators?.includes(user.id)

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
    const { data: overlappingElements } = await supabase
      .from('timeline_elements')
      .select('id, start_time, duration')
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
    const { data: element, error } = await supabase
      .from('timeline_elements')
      .insert({
        ...validatedData,
        properties: defaultProperties,
        effects: validatedData.effects || [],
        transitions: validatedData.transitions || {}
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar elemento:', error)
      return NextResponse.json(
        { error: 'Erro ao criar elemento' },
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
        entity_type: 'element',
        entity_id: element.id,
        description: `Elemento ${element.type} adicionado à timeline`,
        changes: {
          created_element: element
        }
      })

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
    const supabase = createClient()
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
    const { data: existingElement } = await supabase
      .from('timeline_elements')
      .select(`
        *,
        track:timeline_tracks(
          *,
          project:projects(owner_id, collaborators)
        )
      `)
      .eq('id', elementId)
      .single()

    if (!existingElement) {
      return NextResponse.json(
        { error: 'Elemento não encontrado' },
        { status: 404 }
      )
    }

    // Verificar permissões
    const project = existingElement.track.project
    const hasPermission = project.owner_id === user.id || 
                         project.collaborators?.includes(user.id)

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Sem permissão para editar este elemento' },
        { status: 403 }
      )
    }

    // Se mudando de track, verificar se a nova track existe e pertence ao mesmo projeto
    if (validatedData.track_id && validatedData.track_id !== existingElement.track_id) {
      const { data: newTrack } = await supabase
        .from('timeline_tracks')
        .select('project_id, locked')
        .eq('id', validatedData.track_id)
        .single()

      if (!newTrack) {
        return NextResponse.json(
          { error: 'Track de destino não encontrada' },
          { status: 404 }
        )
      }

      if (newTrack.project_id !== existingElement.project_id) {
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
    const updateData: any = {}
    if (validatedData.track_id) updateData.track_id = validatedData.track_id
    if (validatedData.start_time !== undefined) updateData.start_time = validatedData.start_time
    if (validatedData.duration !== undefined) updateData.duration = validatedData.duration

    const { data: element, error } = await supabase
      .from('timeline_elements')
      .update(updateData)
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

    // Registrar no histórico
    await supabase
      .from('project_history')
      .insert({
        project_id: existingElement.project_id,
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
        }
      })

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