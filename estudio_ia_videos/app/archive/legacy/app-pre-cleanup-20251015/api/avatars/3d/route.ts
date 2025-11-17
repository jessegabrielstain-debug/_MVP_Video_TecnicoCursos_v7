

import { NextRequest, NextResponse } from 'next/server'
import { avatar3DHyperPipeline } from '@/lib/avatar-3d-pipeline'


// Force dynamic rendering to avoid build-time errors
export const dynamic = 'force-dynamic';
// GET /api/avatars/3d - Listar avatares 3D hiper-realistas
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const contentType = searchParams.get('content_type') as 'nr' | 'corporate' | 'general'
    const region = searchParams.get('region')
    const quality = searchParams.get('quality') || 'all'

    let avatars = avatar3DHyperPipeline.getAllAvatars()

    // Filtrar por categoria
    if (category && category !== 'all') {
      // Mapear categorias legadas para novas
      const categoryMap: Record<string, unknown> = {
        'professional': 'business',
        'technical': 'safety',
        'executive': 'business',
        'instructor': 'education',
        'casual': 'casual'
      }
      
      const mappedCategory = categoryMap[category] || category
      avatars = avatar3DHyperPipeline.getAvatarsByCategory(mappedCategory)
    }

    // Filtrar por tipo de conteúdo
    if (contentType) {
      const contentCategoryMap: Record<string, unknown> = {
        'nr': 'safety',
        'corporate': 'business',
        'general': 'business'
      }
      avatars = avatar3DHyperPipeline.getAvatarsByCategory(contentCategoryMap[contentType])
    }

    // Filtrar por região (aparência étnica)
    if (region && region !== 'all') {
      const regionMap: Record<string, unknown> = {
        'caucasiano': 'caucasian',
        'afrodescendente': 'afro',
        'asiatico': 'asian',
        'indigena': 'latino',
        'pardo': 'mixed'
      }
      
      const mappedRegion = regionMap[region] || region
      avatars = avatars.filter(avatar => avatar.ethnicity === mappedRegion)
    }

    // Filtrar por qualidade
    if (quality !== 'all') {
      avatars = avatars.filter(avatar => avatar.quality === quality)
    }

    return NextResponse.json({
      success: true,
      data: avatars,
      total: avatars.length,
      categories: avatar3DHyperPipeline.getAllCategories(),
      regions: ['caucasian', 'afro', 'asian', 'latino', 'mixed'],
      qualityLevels: ['standard', 'premium', 'cinematic', 'hyperreal'],
      pipeline: {
        engine: 'Unreal Engine 5',
        renderingTech: ['Lumen Global Illumination', 'Nanite Virtualized Geometry', 'Temporal AA'],
        defaultResolution: '8K',
        lipSyncEngine: 'ML-Driven',
        rayTracing: true
      }
    })

  } catch (error) {
    console.error('Erro ao buscar avatares 3D hiper-realistas:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST /api/avatars/3d - Renderizar avatar hiper-realista personalizado
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { avatar_id, customization, renderOptions, animation, audioFile } = body

    // Validar se o avatar existe no pipeline hiper-realista
    const avatar = avatar3DHyperPipeline.getAvatar(avatar_id)
    if (!avatar) {
      return NextResponse.json(
        { success: false, error: 'Avatar hiper-realista não encontrado' },
        { status: 404 }
      )
    }

    // Renderizar avatar com qualidade hiper-realista
    const renderResult = await avatar3DHyperPipeline.renderHyperRealisticAvatar(
      avatar_id,
      animation || 'idle_professional',
      audioFile,
      renderOptions || {
        resolution: '8K',
        quality: 'hyperreal',
        rayTracing: true,
        realTimeLipSync: true
      }
    )

    const customizedAvatar = {
      ...avatar,
      id: `${avatar.id}-custom-${Date.now()}`,
      name: `${avatar.name} (Hiper-Realista)`,
      customization,
      renderResult,
      hyperRealistic: true,
      pipeline: 'Unreal Engine 5'
    }

    return NextResponse.json({
      success: true,
      data: customizedAvatar,
      renderResult,
      message: 'Avatar hiper-realista renderizado com sucesso',
      technical: {
        renderTime: renderResult.renderTime,
        quality: renderResult.quality,
        pipeline: 'UE5 + Lumen + Nanite',
        lipSyncAccuracy: avatar.features.lipSyncAccuracy
      }
    })

  } catch (error) {
    console.error('Erro ao renderizar avatar hiper-realista:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do pipeline' },
      { status: 500 }
    )
  }
}

