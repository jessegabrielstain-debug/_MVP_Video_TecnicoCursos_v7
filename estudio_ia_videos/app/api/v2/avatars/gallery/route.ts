/**
 * 🎭 API v2: Avatar Gallery
 * Galeria melhorada de avatares 3D hiper-realistas
 * FASE 2: Sprint 1 - Audio2Face Integration
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRateLimiter, rateLimitPresets } from '../../../../lib/utils/rate-limit-middleware';
import { avatar3DPipeline } from '../../../../lib/avatar-3d-pipeline'
import { supabase as supabaseClient } from '../../../../lib/services'
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

// Interface para avatar model da tabela
interface AvatarModel {
  id: string;
  name: string;
  display_name: string | null;
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
  texture_files?: unknown;
  rig_file_path?: string;
  animation_sets?: unknown;
  blend_shapes_file?: string;
  supported_languages?: string[];
  is_active: boolean;
  usage_count?: number;
  avatar_stats?: unknown;
  rating?: number;
  created_at?: Date;
  updated_at?: Date;
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

    logger.info('🎭 API v2: Buscando galeria de avatares...', { component: 'API: v2/avatars/gallery' })
    logger.info(`📂 Categoria: ${category || 'todas'}`, { component: 'API: v2/avatars/gallery' })
    logger.info(`✨ Qualidade: ${quality || 'todas'}`, { component: 'API: v2/avatars/gallery' })
    logger.info(`🌍 Idioma: ${language || 'todos'}`, { component: 'API: v2/avatars/gallery' })

    // Buscar avatares do Prisma
    const where: {
      isActive: boolean;
      category?: string;
      quality?: string;
      supportedLanguages?: { has: string };
      OR?: Array<{ name?: { contains: string }; displayName?: { contains: string }; description?: { contains: string } }>;
    } = {
      isActive: true
    }

    // Aplicar filtros
    if (category && category !== 'all') {
      where.category = category
    }

    if (quality && quality !== 'all') {
      where.quality = quality
    }

    if (language && language !== 'all') {
      where.supportedLanguages = { has: language }
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Paginação
    const offset = (page - 1) * limit

    // Buscar avatares com estatísticas
    const [avatars, totalCount] = await Promise.all([
      prisma.avatarModel.findMany({
        where,
        include: {
          avatarStats: true
        },
        skip: offset,
        take: limit,
        orderBy: [
          { quality: 'desc' },
          { usageCount: 'desc' }
        ]
      }),
      prisma.avatarModel.count({ where })
    ])

    const typedAvatars = avatars;

    // Obter estatísticas do pipeline
    const stats = await avatar3DPipeline.getPipelineStats()

    // Obter categorias e qualidades disponíveis usando Prisma
    const categoriesData = await prisma.avatarModel.findMany({
      where: { isActive: true, category: { not: null } },
      select: { category: true },
      distinct: ['category']
    })

    const qualitiesData = await prisma.avatarModel.findMany({
      where: { isActive: true, quality: { not: null } },
      select: { quality: true },
      distinct: ['quality']
    })

    const categories = categoriesData.map(item => item.category).filter((c): c is string => Boolean(c))
    const qualities = qualitiesData.map(item => item.quality).filter((q): q is string => Boolean(q))

    const response = {
      success: true,
      data: {
        avatars: typedAvatars.map(avatar => ({
          id: avatar.id,
          name: avatar.name,
          displayName: avatar.displayName,
          description: avatar.description,
          category: avatar.category,
          gender: avatar.gender,
          quality: avatar.quality,
          features: {
            audio2FaceCompatible: avatar.audio2FaceCompatible,
            realTimeLipSync: avatar.realTimeLipSync,
            rayTracing: avatar.rayTracingSupport,
            lipSyncAccuracy: avatar.lipSyncAccuracy || 95
          },
          preview: {
            thumbnail: avatar.thumbnailUrl || `/api/v2/avatars/${avatar.id}/thumbnail.jpg`,
            model3D: avatar.modelUrl || `/api/v2/avatars/${avatar.id}/preview.gltf`,
            animation: avatar.previewVideoUrl || `/api/v2/avatars/${avatar.id}/idle.mp4`
          },
          assets: {
            modelFile: avatar.modelFilePath,
            textureFiles: avatar.textureFiles,
            rigFile: avatar.rigFilePath,
            animationSets: avatar.animationSets,
            blendShapes: avatar.blendShapesFile
          },
          supportedLanguages: avatar.supportedLanguages || ['pt-BR'],
          usageCount: avatar.usageCount || 0,
          rating: avatar.rating || 5.0,
          createdAt: avatar.createdAt,
          updatedAt: avatar.updatedAt
        })),
        pagination: {
          page,
          limit,
          total: totalCount || 0,
          totalPages: Math.ceil((totalCount || 0) / limit),
          hasNext: offset + limit < (totalCount || 0),
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
          totalDisplayed: typedAvatars?.length || 0,
          totalAvailable: totalCount || 0
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
    const err = error instanceof Error ? error : new Error(String(error)); logger.error('❌ Erro na API v2 Gallery', err, { component: 'API: v2/avatars/gallery' })
    
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

    logger.info(`🎭 API v2: Ação na galeria - ${action} para avatar ${avatarId}`, { component: 'API: v2/avatars/gallery' })

    switch (action) {
      case 'preview': {
        // Buscar avatar usando Prisma
        const avatarData = await prisma.avatarModel.findFirst({
          where: { id: avatarId, isActive: true }
        })

        if (!avatarData) {
          return NextResponse.json({
            success: false,
            error: { message: 'Avatar não encontrado', code: 'AVATAR_NOT_FOUND' }
          }, { status: 404 })
        }

        // Map Prisma fields to expected format
        const avatar: AvatarModel = {
          id: avatarData.id,
          name: avatarData.name,
          display_name: avatarData.displayName,
          description: avatarData.description ?? '',
          type: avatarData.category ?? '',
          gender: avatarData.gender ?? undefined,
          quality: avatarData.quality ?? '',
          thumbnail_url: avatarData.thumbnailUrl ?? undefined,
          model_url: avatarData.modelUrl ?? undefined,
          preview_video_url: avatarData.previewVideoUrl ?? undefined,
          audio2face_compatible: avatarData.audio2FaceCompatible,
          real_time_lipsync: avatarData.realTimeLipSync,
          ray_tracing_support: avatarData.rayTracingSupport,
          lipsync_accuracy: avatarData.lipSyncAccuracy ?? undefined,
          model_file_path: avatarData.modelFilePath ?? undefined,
          texture_files: avatarData.textureFiles ?? undefined,
          rig_file_path: avatarData.rigFilePath ?? undefined,
          animation_sets: avatarData.animationSets ?? undefined,
          blend_shapes_file: avatarData.blendShapesFile ?? undefined,
          supported_languages: avatarData.supportedLanguages,
          usage_count: avatarData.usageCount,
          rating: avatarData.rating ?? undefined,
          is_active: avatarData.isActive,
          created_at: avatarData.createdAt,
          updated_at: avatarData.updatedAt
        };

        return NextResponse.json({
          success: true,
          data: {
            avatar: {
              id: avatar.id,
              name: avatar.name,
              displayName: avatar.displayName,
              description: avatar.description,
              preview: {
                thumbnail: avatar.thumbnailUrl || `/api/v2/avatars/${avatar.id}/thumbnail.jpg`,
                model3D: avatar.modelUrl || `/api/v2/avatars/${avatar.id}/preview.gltf`,
                animation: avatar.previewVideoUrl || `/api/v2/avatars/${avatar.id}/idle.mp4`
              },
              features: {
                audio2FaceCompatible: avatar.audio2FaceCompatible,
                realTimeLipSync: avatar.realTimeLipSync,
                rayTracing: avatar.rayTracingSupport,
                lipSyncAccuracy: avatar.lipSyncAccuracy || 95
              },
              assets: {
                modelFile: avatar.modelFilePath,
                textureFiles: avatar.textureFiles,
                rigFile: avatar.rigFilePath,
                animationSets: avatar.animationSets,
                blendShapes: avatar.blendShapesFile
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

        // Verificar se o avatar existe usando Prisma
        const avatarData = await prisma.avatarModel.findFirst({
          where: { id: avatarId, isActive: true },
          select: { id: true, name: true, audio2FaceCompatible: true }
        })

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
                audio2FaceCompatible: avatarData.audio2FaceCompatible
              }
            }
          })
        } catch (lipSyncError) {
          logger.error('Erro no teste de lip-sync', lipSyncError instanceof Error ? lipSyncError : new Error(String(lipSyncError)) , { component: 'API: v2/avatars/gallery' })
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
    const err = error instanceof Error ? error : new Error(String(error)); logger.error('❌ Erro na ação da galeria', err, { component: 'API: v2/avatars/gallery' })
    
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
