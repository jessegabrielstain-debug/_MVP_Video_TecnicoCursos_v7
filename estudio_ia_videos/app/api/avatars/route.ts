import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseForRequest } from '@/lib/supabase/server'
import { z } from 'zod'
import { logger } from '@/lib/logger';
import type { Avatar3DWithProject, ProjectHistoryEntry } from '@/types/database';

// Schema de validação para avatar 3D
const avatarSchema = z.object({
  project_id: z.string().refine((val) => /^[0-9a-fA-F-]{36}$/.test(val), 'ID do projeto inválido'),
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  ready_player_me_url: z.string().url('URL do Ready Player Me inválida'),
  avatar_type: z.enum(['full_body', 'half_body', 'head_only']).default('half_body'),
  gender: z.enum(['male', 'female', 'other']).optional(),
  style: z.enum(['realistic', 'cartoon', 'anime']).default('realistic'),
  animations: z.array(z.object({
    name: z.string(),
    type: z.enum(['idle', 'talking', 'gesture', 'emotion', 'custom']),
    duration: z.number().positive(),
    loop: z.boolean().default(false),
    file_url: z.string().url().optional()
  })).default([]),
  voice_settings: z.object({
    voice_id: z.string().optional(),
    language: z.string().default('pt-BR'),
    speed: z.number().min(0.5).max(2.0).default(1.0),
    pitch: z.number().min(-20).max(20).default(0),
    volume: z.number().min(0).max(1).default(0.8)
  }).optional(),
  properties: z.record(z.unknown()).default({})
})

const updateAvatarSchema = avatarSchema.omit({ project_id: true }).partial()

// GET - Listar avatares 3D
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
    const avatarType = searchParams.get('avatar_type')
    const style = searchParams.get('style')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('avatars_3d')
      .select(`
        *,
        projects:project_id (
          id,
          name,
          owner_id,
          collaborators,
          is_public
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    if (avatarType) {
      query = query.eq('avatar_type', avatarType)
    }

    if (style) {
      query = query.eq('style', style)
    }

    const { data: avatarsData, error } = await query

    if (error) {
      logger.error('Erro ao buscar avatares:', error instanceof Error ? error : new Error(String(error)), { component: 'API: avatars' })
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    const avatars = (avatarsData || []) as Avatar3DWithProject[]

    // Filtrar apenas avatares que o usuário tem permissão para ver
    const authorizedAvatars = avatars.filter(avatar => {
      const project = avatar.projects
      if (!project) return false
      return project.owner_id === user.id || 
             (Array.isArray(project.collaborators) && project.collaborators.includes(user.id)) ||
             project.is_public
    })

    return NextResponse.json({ avatars: authorizedAvatars })

  } catch (error) {
    logger.error('Erro na API de avatares:', error instanceof Error ? error : new Error(String(error)), { component: 'API: avatars' })
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar novo avatar 3D
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
    const validatedData = avatarSchema.parse(body)

    // Verificar se projeto existe e permissões
    const { data: projectData } = await supabase
      .from('projects')
      .select('owner_id, collaborators')
      .eq('id', validatedData.project_id)
      .single()

    if (!projectData) {
      return NextResponse.json(
        { error: 'Projeto não encontrado' },
        { status: 404 }
      )
    }

    const project = projectData as { owner_id: string; collaborators: string[] | null }

    const hasPermission = project.owner_id === user.id || 
                         project.collaborators?.includes(user.id)

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Sem permissão para criar avatares neste projeto' },
        { status: 403 }
      )
    }

    // Verificar se já existe avatar com mesmo nome no projeto
    const { data: existingAvatar } = await supabase
      .from('avatars_3d')
      .select('id')
      .eq('project_id', validatedData.project_id)
      .eq('name', validatedData.name)
      .single()

    if (existingAvatar) {
      return NextResponse.json(
        { error: `Já existe um avatar com nome "${validatedData.name}" neste projeto` },
        { status: 409 }
      )
    }

    // Validar URL do Ready Player Me
    if (!isValidReadyPlayerMeUrl(validatedData.ready_player_me_url)) {
      return NextResponse.json(
        { error: 'URL do Ready Player Me inválida' },
        { status: 400 }
      )
    }

    // Buscar dados do avatar do Ready Player Me (simulado)
    const avatarData = await fetchReadyPlayerMeData(validatedData.ready_player_me_url)

    // Criar avatar
    const { data: avatar, error } = await supabase
      .from('avatars_3d')
      .insert({
        ...validatedData,
        user_id: user.id,
        model_url: avatarData.model_url,
        thumbnail_url: avatarData.thumbnail_url,
        metadata: avatarData.metadata
      })
      .select()
      .single()

    if (error) {
      logger.error('Erro ao criar avatar:', error instanceof Error ? error : new Error(String(error)), { component: 'API: avatars' })
      return NextResponse.json(
        { error: 'Erro ao criar avatar' },
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
        entity_type: 'avatar_3d',
        entity_id: avatar.id,
        description: `Avatar 3D "${validatedData.name}" criado`,
        changes: {
          avatar_name: validatedData.name,
          avatar_type: validatedData.avatar_type,
          style: validatedData.style
        }
      })

    return NextResponse.json({ avatar }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    logger.error('Erro ao criar avatar:', error instanceof Error ? error : new Error(String(error)), { component: 'API: avatars' })
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Função para validar URL do Ready Player Me
function isValidReadyPlayerMeUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.includes('readyplayer.me') || 
           urlObj.hostname.includes('models.readyplayer.me')
  } catch {
    return false
  }
}

// Função para buscar dados do Ready Player Me (simulada)
async function fetchReadyPlayerMeData(url: string) {
  // Em produção, isso faria uma requisição real para a API do Ready Player Me
  // Por enquanto, retornamos dados simulados
  
  const avatarId = url.split('/').pop()?.split('.')[0] || 'default'
  
  return {
    model_url: `https://models.readyplayer.me/${avatarId}.glb`,
    thumbnail_url: `https://models.readyplayer.me/${avatarId}.png`,
    metadata: {
      id: avatarId,
      created_at: new Date().toISOString(),
      body_type: 'fullbody',
      outfit: 'casual',
      hair_color: '#8B4513',
      skin_color: '#FDBCB4',
      eye_color: '#4A90E2'
    }
  }
}

// PUT - Atualizar configurações globais de avatares
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
    const { project_id, global_settings } = body

    if (!project_id || !global_settings) {
      return NextResponse.json(
        { error: 'project_id e global_settings são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar permissões no projeto
    const { data: projectData } = await supabase
      .from('projects')
      .select('owner_id, collaborators, settings')
      .eq('id', project_id)
      .single()

    if (!projectData) {
      return NextResponse.json(
        { error: 'Projeto não encontrado' },
        { status: 404 }
      )
    }

    const project = projectData as { owner_id: string; collaborators: string[] | null; settings: Record<string, unknown> | null }

    const hasPermission = project.owner_id === user.id || 
                         project.collaborators?.includes(user.id)

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Sem permissão para atualizar configurações de avatares' },
        { status: 403 }
      )
    }

    // Atualizar configurações globais de avatares no projeto
    const existingAvatars = project.settings?.avatars_3d as Record<string, unknown> | undefined
    const updatedSettings = {
      ...project.settings,
      avatars_3d: {
        ...existingAvatars,
        ...global_settings
      }
    }

    const { error: updateError } = await supabase
      .from('projects')
      .update({ settings: updatedSettings })
      .eq('id', project_id)

    if (updateError) {
      logger.error('Erro ao atualizar configurações:', updateError instanceof Error ? updateError : new Error(String(updateError)), { component: 'API: avatars' })
      return NextResponse.json(
        { error: 'Erro ao atualizar configurações' },
        { status: 500 }
      )
    }

    // Registrar no histórico
    await supabase
      .from('project_history')
      .insert({
        project_id: project_id,
        user_id: user.id,
        action: 'update',
        entity_type: 'project_settings',
        entity_id: project_id,
        description: 'Configurações globais de avatares 3D atualizadas',
        changes: { avatars_3d_settings: global_settings }
      })

    return NextResponse.json({ 
      message: 'Configurações atualizadas com sucesso',
      settings: updatedSettings.avatars_3d
    })

  } catch (error) {
    logger.error('Erro ao atualizar configurações de avatares:', error instanceof Error ? error : new Error(String(error)), { component: 'API: avatars' })
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
