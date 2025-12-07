// TODO: Fix v2 API types
/**
 * 🎭 API v2: Avatar Gallery
 * Galeria melhorada de avatares 3D hiper-realistas
 * FASE 2: Sprint 1 - Audio2Face Integration
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRateLimiter, rateLimitPresets } from '../../../../lib/utils/rate-limit-middleware';
import { avatar3DPipeline } from '../../../../lib/avatar-3d-pipeline'
import { supabase as supabaseClient } from '../../../../lib/services'

// Interface para avatar model da tabela
interface AvatarModel {
  id: string;
  name: string;
  display_name: string;
  description: string;
  type: string;
  gender?: string;
  quality: string;
  thumbnail_url?: string;
  model_url?: string;
  preview_video_url?: string;
  audio2face_compatible: boolean;
  real_time_lipsync: boolean;
  ray_tracing_support: boolean;
  lipsync_accuracy?: number;
  model_file_path?: string;
  texture_files?: string[];
  rig_file_path?: string;
  animation_sets?: string[];
  blend_shapes_file?: string;
  supported_languages?: string[];
  is_active: boolean;
  usage_count?: number;
  avatar_stats?: unknown;
  rating?: number;
  created_at?: string;
  updated_at?: string;
}

// Interface para categoria/qualidade filtros
interface FilterItem {
  type?: string;
  quality?: string;
}

const rateLimiterGet = createRateLimiter(rateLimitPresets.authenticated);
export async function GET(request: NextRequest) {
  return rateLimiterGet(request, async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const quality = searchParams.get('quality')
    const language = searchParams.get('language')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    console.log('🎭 API v2: Buscando galeria de avatares...')
    console.log(`📂 Categoria: ${category || 'todas'}`)
    console.log(`✨ Qualidade: ${quality || 'todas'}`)
    console.log(`🌍 Idioma: ${language || 'todos'}`)

    // Buscar avatares do Supabase
    let query: any = ((supabaseClient as any)
      .from('avatar_models')
      .select(`
        *,
        avatar_stats:avatar_stats(*)
      `) as any)
      .eq('is_active', true)

    // Aplicar filtros
    if (category && category !== 'all') {
      query = query.eq('type', category)
    }

    if (quality && quality !== 'all') {
      query = query.eq('quality', quality)
    }

    if (language && language !== 'all') {
      query = query.contains('supported_languages', [language])
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,display_name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Paginação
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    // Ordenar por qualidade e popularidade
    query = query.order('quality', { ascending: false })
      .order('usage_count', { ascending: false })

    const { data: avatars, error, count } = await query

    if (error) {
      throw new Error(`Erro ao buscar avatares: ${error.message}`)
    }

    // Cast para tipo correto
    const typedAvatars = (avatars || []) as AvatarModel[];

    // Obter estatísticas do pipeline
    const stats = await avatar3DPipeline.getPipelineStats()

    // Obter categorias e qualidades disponíveis
    const { data: categoriesData } = await ((supabaseClient as any)
      .from('avatar_models')
      .select('type') as any)
      .eq('is_active', true)
      .not('type', 'is', null)

    const { data: qualitiesData } = await ((supabaseClient as any)
      .from('avatar_models')
      .select('quality') as any)
      .eq('is_active', true)
      .not('quality', 'is', null)

    const categories = Array.from(new Set((categoriesData as FilterItem[] || []).map(item => item.type).filter(Boolean)))
    const qualities = Array.from(new Set((qualitiesData as FilterItem[] || []).map(item => item.quality).filter(Boolean)))

    const response = {
      success: true,
      data: {
        avatars: typedAvatars.map(avatar => ({
          id: avatar.id,
          name: avatar.name,
          displayName: avatar.display_name,
          description: avatar.description,
          category: avatar.type,
          gender: avatar.gender,
          quality: avatar.quality,
          features: {
            audio2FaceCompatible: avatar.audio2face_compatible,
            realTimeLipSync: avatar.real_time_lipsync,
            rayTracing: avatar.ray_tracing_support,
            lipSyncAccuracy: avatar.lipsync_accuracy || 95
          },
          preview: {
            thumbnail: avatar.thumbnail_url || `/api/v2/avatars/${avatar.id}/thumbnail.jpg`,
            model3D: avatar.model_url || `/api/v2/avatars/${avatar.id}/preview.gltf`,
            animation: avatar.preview_video_url || `/api/v2/avatars/${avatar.id}/idle.mp4`
          },
          assets: {
            modelFile: avatar.model_file_path,
            textureFiles: avatar.texture_files,
            rigFile: avatar.rig_file_path,
            animationSets: avatar.animation_sets,
            blendShapes: avatar.blend_shapes_file
          },
          supportedLanguages: avatar.supported_languages || ['pt-BR'],
          usageCount: avatar.usage_count || 0,
          rating: avatar.rating || 5.0,
          createdAt: avatar.created_at,
          updatedAt: avatar.updated_at
        })),
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
          hasNext: offset + limit < (count || 0),
          hasPrev: page > 1
        },
        filters: {
          categories,
          qualities,
          supportedLanguages: ['pt-BR', 'en-US', 'es-ES'],
          applied: {
            category: category || 'all',
            quality: quality || 'all',
            language: language || 'all',
            search: search || ''
          }
        },
        stats: {
          ...stats,
          totalDisplayed: avatars?.length || 0,
          totalAvailable: count || 0
        },
        metadata: {
          version: '2.0.0',
          audio2FaceEnabled: stats.audio2FaceStatus,
          supportedQualities: qualities,
          supportedLanguages: ['pt-BR', 'en-US', 'es-ES'],
          renderingEngine: 'Unreal Engine 5 + Audio2Face'
        }
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('❌ Erro na API v2 Gallery:', error)
    
    return NextResponse.json({
      success: false,
      error: {
        message: 'Erro ao carregar galeria de avatares',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        code: 'GALLERY_ERROR'
      }
    }, { status: 500 })
  }
  });
}

const rateLimiterPost = createRateLimiter(rateLimitPresets.authenticated);
export async function POST(request: NextRequest) {
  return rateLimiterPost(request, async (request: NextRequest) => {
  try {
    const body = await request.json()
    const { avatarId, action, data } = body

    console.log(`🎭 API v2: Ação na galeria - ${action} para avatar ${avatarId}`)

    switch (action) {
      case 'preview': {
        // Buscar avatar do Supabase
        const { data: avatarData, error } = await ((supabaseClient as any)
          .from('avatar_models')
          .select('*') as any)
          .eq('id', avatarId)
          .eq('is_active', true)
          .single()

        if (error || !avatarData) {
          return NextResponse.json({
            success: false,
            error: { message: 'Avatar não encontrado', code: 'AVATAR_NOT_FOUND' }
          }, { status: 404 })
        }

        const avatar = avatarData as AvatarModel;

        return NextResponse.json({
          success: true,
          data: {
            avatar: {
              id: avatar.id,
              name: avatar.name,
              displayName: avatar.display_name,
              description: avatar.description,
              preview: {
                thumbnail: avatar.thumbnail_url || `/api/v2/avatars/${avatar.id}/thumbnail.jpg`,
                model3D: avatar.model_url || `/api/v2/avatars/${avatar.id}/preview.gltf`,
                animation: avatar.preview_video_url || `/api/v2/avatars/${avatar.id}/idle.mp4`
              },
              features: {
                audio2FaceCompatible: avatar.audio2face_compatible,
                realTimeLipSync: avatar.real_time_lipsync,
                rayTracing: avatar.ray_tracing_support,
                lipSyncAccuracy: avatar.lipsync_accuracy || 95
              },
              assets: {
                modelFile: avatar.model_file_path,
                textureFiles: avatar.texture_files,
                rigFile: avatar.rig_file_path,
                animationSets: avatar.animation_sets,
                blendShapes: avatar.blend_shapes_file
              }
            }
          }
        })
      }

      case 'test_lipsync': {
        // Testar lip-sync do avatar
        const { text, audioFile, voiceProfileId } = data
        
        if (!text) {
          return NextResponse.json({
            success: false,
            error: { message: 'Texto é obrigatório para teste de lip-sync', code: 'MISSING_TEXT' }
          }, { status: 400 })
        }

        // Verificar se o avatar existe
        const { data: avatarData } = await ((supabaseClient as any)
          .from('avatar_models')
          .select('id, name, audio2face_compatible') as any)
          .eq('id', avatarId)
          .eq('is_active', true)
          .single()

        if (!avatarData) {
          return NextResponse.json({
            success: false,
            error: { message: 'Avatar não encontrado', code: 'AVATAR_NOT_FOUND' }
          }, { status: 404 })
        }

        // Criar um job de teste de lip-sync
        const testJobId = `test_${avatarId}_${Date.now()}`
        
        try {
          const lipSyncResult = await avatar3DPipeline.generateHyperRealisticLipSync(
            avatarId,
            audioFile || '/audio/test-sample.wav',
            text,
            { language: 'pt-BR', quality: 'high' }
          )

          return NextResponse.json({
            success: true,
            data: {
              testJobId,
              lipSync: {
                accuracy: lipSyncResult.accuracy,
                processingTime: lipSyncResult.processingTime,
                audio2FaceEnabled: lipSyncResult.audio2FaceEnabled,
                dataPoints: lipSyncResult.lipSyncData?.length || 0,
                preview: `/api/v2/avatars/${avatarId}/lipsync-test.mp4`,
                blendShapes: lipSyncResult.lipSyncData?.slice(0, 10) // Primeiros 10 frames para preview
              },
              avatar: {
                id: avatarData.id,
                name: avatarData.name,
                audio2FaceCompatible: avatarData.audio2face_compatible
              }
            }
          })
        } catch (lipSyncError) {
          console.error('Erro no teste de lip-sync:', lipSyncError)
          return NextResponse.json({
            success: false,
            error: { 
              message: 'Erro ao testar lip-sync', 
              code: 'LIPSYNC_TEST_ERROR',
              details: lipSyncError instanceof Error ? lipSyncError.message : 'Erro desconhecido'
            }
          }, { status: 500 })
        }
      }

      case 'favorite': {
        // Adicionar/remover dos favoritos (requer autenticação)
        const { userId, isFavorite } = data
        
        if (!userId) {
          return NextResponse.json({
            success: false,
            error: { message: 'ID do usuário é obrigatório', code: 'MISSING_USER_ID' }
          }, { status: 400 })
        }

        // TODO: Implementar sistema de favoritos
        return NextResponse.json({
          success: true,
          data: {
            avatarId,
            userId,
            isFavorite: !isFavorite,
            message: isFavorite ? 'Avatar removido dos favoritos' : 'Avatar adicionado aos favoritos'
          }
        })
      }

      default:
        return NextResponse.json({
          success: false,
          error: { message: 'Ação não suportada', code: 'UNSUPPORTED_ACTION' }
        }, { status: 400 })
    }
  } catch (error) {
    console.error('❌ Erro na ação da galeria:', error)
    
    return NextResponse.json({
      success: false,
      error: {
        message: 'Erro ao executar ação na galeria',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        code: 'GALLERY_ACTION_ERROR'
      }
    }, { status: 500 })
  }
  });
}
