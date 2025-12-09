import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseForRequest } from '@/lib/supabase/server'
import { z } from 'zod'
import { logger } from '@/lib/logger'

// Schema de validação para atualização de avatar
const updateAvatarSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  ready_player_me_url: z.string().url().optional(),
  avatar_type: z.enum(['full_body', 'half_body', 'head_only']).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  style: z.enum(['realistic', 'cartoon', 'anime']).optional(),
  animations: z.array(z.object({
    name: z.string(),
    type: z.enum(['idle', 'talking', 'gesture', 'emotion', 'custom']),
    duration: z.number().positive(),
    loop: z.boolean().default(false),
    file_url: z.string().url().optional()
  })).optional(),
  voice_settings: z.object({
    voice_id: z.string().optional(),
    language: z.string().optional(),
    speed: z.number().min(0.5).max(2.0).optional(),
    pitch: z.number().min(-20).max(20).optional(),
    volume: z.number().min(0).max(1).optional()
  }).optional(),
  properties: z.record(z.unknown()).optional()
})

// GET - Obter detalhes de um avatar específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const avatarId = params.id

    // Buscar avatar com dados relacionados
    const { data: avatarData, error } = await (supabase
      .from('avatars_3d' as any) as any)
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
      .eq('id', avatarId)
      .single()

    if (error || !avatarData) {
      return NextResponse.json(
        { error: 'Avatar não encontrado' },
        { status: 404 }
      )
    }

    const avatar = avatarData as any;

    // Verificar permissões
    const project = avatar.projects as Record<string, unknown>
    const hasPermission = project.owner_id === user.id || 
                         (project.collaborators as string[])?.includes(user.id) ||
                         project.is_public

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Sem permissão para acessar este avatar' },
        { status: 403 }
      )
    }

    // Atualizar último acesso
    await (supabase
      .from('avatars_3d' as any) as any)
      .update({ last_used_at: new Date().toISOString() } as any)
      .eq('id', avatarId)

    return NextResponse.json({ avatar })

  } catch (error) {
    logger.error('Erro ao buscar avatar', { component: 'API: avatars/[id]', error: error instanceof Error ? error : new Error(String(error)) })
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar avatar
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const avatarId = params.id
    const body = await request.json()

    // Validar dados
    const validatedData = updateAvatarSchema.parse(body)

    // Verificar se avatar existe e permissões
    const { data: avatarData } = await (supabase
      .from('avatars_3d' as any) as any)
      .select(`
        *,
        projects:project_id (
          owner_id,
          collaborators
        )
      `)
      .eq('id', avatarId)
      .single()

    if (!avatarData) {
      return NextResponse.json(
        { error: 'Avatar não encontrado' },
        { status: 404 }
      )
    }

    const avatar = avatarData as any;

    const project = avatar.projects as Record<string, unknown>
    const hasPermission = project.owner_id === user.id || 
                         (project.collaborators as string[])?.includes(user.id)

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Sem permissão para atualizar este avatar' },
        { status: 403 }
      )
    }

    // Se mudando nome, verificar conflitos
    if (validatedData.name && validatedData.name !== avatar.name) {
      const { data: existingAvatar } = await (supabase
        .from('avatars_3d' as any) as any)
        .select('id')
        .eq('project_id', avatar.project_id)
        .eq('name', validatedData.name)
        .neq('id', avatarId)
        .single()

      if (existingAvatar) {
        return NextResponse.json(
          { error: `Já existe um avatar com nome "${validatedData.name}" neste projeto` },
          { status: 409 }
        )
      }
    }

    // Preparar dados para atualização
    interface AvatarUpdateData {
      name?: string;
      ready_player_me_url?: string;
      avatar_type?: 'full_body' | 'half_body' | 'head_only';
      gender?: 'male' | 'female' | 'other';
      style?: 'realistic' | 'cartoon' | 'anime';
      animations?: unknown[];
      voice_settings?: Record<string, unknown>;
      properties?: Record<string, unknown>;
      model_url?: string;
      thumbnail_url?: string;
      metadata?: Record<string, unknown>;
      updated_at: string;
    }

    let updateData: AvatarUpdateData = {
      ...validatedData,
      updated_at: new Date().toISOString()
    }

    // Se mudando URL do Ready Player Me, buscar novos dados
    if (validatedData.ready_player_me_url && validatedData.ready_player_me_url !== avatar.ready_player_me_url) {
      if (!isValidReadyPlayerMeUrl(validatedData.ready_player_me_url)) {
        return NextResponse.json(
          { error: 'URL do Ready Player Me inválida' },
          { status: 400 }
        )
      }

      const avatarData = await fetchReadyPlayerMeData(validatedData.ready_player_me_url)
      updateData.model_url = avatarData.model_url
      updateData.thumbnail_url = avatarData.thumbnail_url
      updateData.metadata = avatarData.metadata
    }

    // Mesclar propriedades e configurações de voz se fornecidas
    if (validatedData.properties && avatar.properties) {
      updateData.properties = {
        ...avatar.properties,
        ...validatedData.properties
      }
    }

    if (validatedData.voice_settings && avatar.voice_settings) {
      updateData.voice_settings = {
        ...avatar.voice_settings,
        ...validatedData.voice_settings
      }
    }

    // Atualizar avatar
    const { data: updatedAvatar, error: updateError } = await (supabase
      .from('avatars_3d' as any) as any)
      .update(updateData)
      .eq('id', avatarId)
      .select()
      .single()

    if (updateError) {
      logger.error('Erro ao atualizar avatar', { component: 'API: avatars/[id]', error: updateError instanceof Error ? updateError : new Error(String(updateError)) })
      return NextResponse.json(
        { error: 'Erro ao atualizar avatar' },
        { status: 500 }
      )
    }

    // Registrar no histórico
    await (supabase
      .from('project_history' as any) as any)
      .insert({
        project_id: avatar.project_id,
        user_id: user.id,
        action: 'update',
        entity_type: 'avatar_3d',
        entity_id: avatarId,
        description: `Avatar 3D "${avatar.name}" atualizado`,
        changes: validatedData
      })

    return NextResponse.json({ avatar: updatedAvatar })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }

    logger.error('Erro ao atualizar avatar', { component: 'API: avatars/[id]', error: error instanceof Error ? error : new Error(String(error)) })
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir avatar
// DELETE - Deletar avatar
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const avatarId = params.id

    // Verificar se avatar existe e permissões
    const { data: avatarData } = await (supabase
      .from('avatars_3d' as any) as any)
      .select(`
        *,
        projects:project_id (
          owner_id,
          collaborators
        )
      `)
      .eq('id', avatarId)
      .single()

    if (!avatarData) {
      return NextResponse.json(
        { error: 'Avatar não encontrado' },
        { status: 404 }
      )
    }

    const avatar = avatarData as any;

    const project = avatar.projects as Record<string, unknown>
    const hasPermission = project.owner_id === user.id || 
                         (project.collaborators as string[])?.includes(user.id)

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Sem permissão para excluir este avatar' },
        { status: 403 }
      )
    }

    // Verificar se avatar está sendo usado em elementos da timeline
    const { data: usedInElements } = await (supabase
      .from('timeline_elements' as any) as any)
      .select('id')
      .eq('type', 'avatar_3d')
      .contains('properties', { avatar_id: avatarId })
      .limit(1)

    if (usedInElements && usedInElements.length > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir avatar que está sendo usado na timeline' },
        { status: 400 }
      )
    }

    // Excluir avatar
    const { error: deleteError } = await (supabase
      .from('avatars_3d' as any) as any)
      .delete()
      .eq('id', avatarId)

    if (deleteError) {
      logger.error('Erro ao excluir avatar', { component: 'API: avatars/[id]', error: deleteError instanceof Error ? deleteError : new Error(String(deleteError)) })
      return NextResponse.json(
        { error: 'Erro ao excluir avatar' },
        { status: 500 }
      )
    }

    // Registrar no histórico
    await (supabase
      .from('project_history' as any) as any)
      .insert({
        project_id: avatar.project_id,
        user_id: user.id,
        action: 'delete',
        entity_type: 'avatar_3d',
        entity_id: avatarId,
        description: `Avatar 3D "${avatar.name}" excluído`,
        changes: {
          deleted_avatar: {
            name: avatar.name,
            avatar_type: avatar.avatar_type,
            style: avatar.style
          }
        }
      })

    return NextResponse.json({ 
      message: 'Avatar excluído com sucesso' 
    })

  } catch (error) {
    logger.error('Erro ao excluir avatar', { component: 'API: avatars/[id]', error: error instanceof Error ? error : new Error(String(error)) })
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