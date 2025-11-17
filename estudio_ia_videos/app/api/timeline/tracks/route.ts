import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/services'
import { z } from 'zod'

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
  properties: z.record(z.any()).optional()
})

// Schema de validação para atualização de track
const updateTrackSchema = createTrackSchema.partial().omit(['project_id'])

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
    const supabase = createClient()
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
      .select('owner_id, collaborators, is_public')
      .eq('id', projectId)
      .single()

    if (!project) {
      return NextResponse.json(
        { error: 'Projeto não encontrado' },
        { status: 404 }
      )
    }

    const hasPermission = project.owner_id === user.id || 
                         project.collaborators?.includes(user.id) ||
                         project.is_public

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
      console.error('Erro ao buscar tracks:', error)
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    return NextResponse.json({ tracks: tracks || [] })

  } catch (error) {
    console.error('Erro na API de tracks:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar nova track
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
    const validatedData = createTrackSchema.parse(body)

    // Verificar permissões no projeto
    const { data: project } = await supabase
      .from('projects')
      .select('owner_id, collaborators')
      .eq('id', validatedData.project_id)
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
        { error: 'Sem permissão para editar este projeto' },
        { status: 403 }
      )
    }

    // Se order_index não foi fornecido, usar o próximo disponível
    if (validatedData.order_index === undefined) {
      const { data: lastTrack } = await supabase
        .from('timeline_tracks')
        .select('order_index')
        .eq('project_id', validatedData.project_id)
        .order('order_index', { ascending: false })
        .limit(1)
        .single()

      validatedData.order_index = (lastTrack?.order_index || -1) + 1
    }

    // Definir cor padrão baseada no tipo
    if (!validatedData.color) {
      const colorMap = {
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
    const { data: track, error } = await supabase
      .from('timeline_tracks')
      .insert({
        ...validatedData,
        height: validatedData.height || 80,
        visible: validatedData.visible !== false,
        locked: validatedData.locked || false,
        muted: validatedData.muted || false,
        properties: validatedData.properties || {}
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar track:', error)
      return NextResponse.json(
        { error: 'Erro ao criar track' },
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
        entity_type: 'track',
        entity_id: track.id,
        description: `Track "${track.name}" criada`,
        changes: {
          created_track: track
        }
      })

    return NextResponse.json(track, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Erro na criação de track:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Reordenar tracks
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

    const body = await request.json()
    const { tracks } = reorderTracksSchema.parse(body)

    // Verificar se todas as tracks existem e obter o project_id
    const trackIds = tracks.map(t => t.id)
    const { data: existingTracks, error: fetchError } = await supabase
      .from('timeline_tracks')
      .select('id, project_id')
      .in('id', trackIds)

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
    await supabase
      .from('project_history')
      .insert({
        project_id: projectId,
        user_id: user.id,
        action: 'update',
        entity_type: 'track',
        description: 'Tracks reordenadas',
        changes: {
          reordered_tracks: tracks
        }
      })

    return NextResponse.json({ message: 'Tracks reordenadas com sucesso' })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Erro na reordenação de tracks:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}