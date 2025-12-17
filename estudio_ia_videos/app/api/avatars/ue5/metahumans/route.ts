
import { NextResponse } from 'next/server'
import { ue5AvatarEngine } from '@/lib/engines/ue5-avatar-engine'
import { logger } from '@/lib/logger'

/**
 * GET /api/avatars/ue5/metahumans
 * Listar MetaHumans disponíveis
 */
export async function GET() {
  try {
    const metahumans = ue5AvatarEngine.getAvailableMetaHumans()
    
    // Ensure metahumans is an array (defensive programming)
    const metahumanList = Array.isArray(metahumans) ? metahumans : []
    
    return NextResponse.json({
      success: true,
      count: metahumanList.length,
      metahumans: metahumanList.map(mh => ({
        id: mh.id,
        name: mh.name,
        display_name: mh.display_name || mh.name,
        gender: mh.gender,
        // Optional fields - use optional chaining
        ethnicity: mh.ethnicity ?? null,
        age_range: mh.age_range ?? null,
        style: mh.style ?? null,
        capabilities: {
          blendshapes: mh.blendshape_count ?? 0,
          expressions: Array.isArray(mh.expression_presets) ? mh.expression_presets.length : 0,
          clothing_options: Array.isArray(mh.clothing_options) ? mh.clothing_options.length : 0,
          hair_options: Array.isArray(mh.hair_options) ? mh.hair_options.length : 0
        },
        quality: {
          polygons: mh.polygon_count ?? null,
          texture_resolution: mh.texture_resolution ?? null,
          optimization: mh.optimization_level ?? null
        }
      }))
    })
    
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error))
    logger.error('Erro ao listar MetaHumans', errorObj, { component: 'API: avatars/ue5/metahumans' })
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metahumans: []
      },
      { status: 500 }
    )
  }
}

