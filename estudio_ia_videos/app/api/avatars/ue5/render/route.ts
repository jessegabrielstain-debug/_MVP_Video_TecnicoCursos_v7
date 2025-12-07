
import { NextRequest, NextResponse } from 'next/server'
import { ue5AvatarEngine, UE5AvatarConfig } from '@/lib/engines/ue5-avatar-engine'

/**
 * POST /api/avatars/ue5/render
 * Iniciar renderização de avatar UE5 + Audio2Face
 */
export async function POST(req: NextRequest) {
  try {
    const config: UE5AvatarConfig = await req.json()
    
    // Validações
    if (!config.metahuman_id) {
      return NextResponse.json(
        { error: 'metahuman_id é obrigatório' },
        { status: 400 }
      )
    }
    
    if (!config.audio_file_url) {
      return NextResponse.json(
        { error: 'audio_file_url é obrigatório' },
        { status: 400 }
      )
    }
    
    // Verificar se MetaHuman existe
    const metahuman = ue5AvatarEngine.getMetaHuman(config.metahuman_id)
    if (!metahuman) {
      return NextResponse.json(
        { 
          error: 'MetaHuman não encontrado',
          available_metahumans: ue5AvatarEngine.getAvailableMetaHumans().map(mh => ({
            id: mh.id,
            name: mh.display_name,
            gender: mh.gender,
            ethnicity: mh.ethnicity
          }))
        },
        { status: 404 }
      )
    }
    
    // Iniciar renderização
    const jobId = await ue5AvatarEngine.startRender(config)
    
    return NextResponse.json({
      success: true,
      job_id: jobId,
      message: 'Renderização UE5 iniciada com sucesso',
      estimated_time_minutes: 2,
      metahuman: {
        id: metahuman.id,
        name: metahuman.display_name,
        quality: 'Hiper-realista',
        technology: 'UE5 + Audio2Face'
      }
    })
    
  } catch (error) {
    console.error('❌ Erro ao iniciar render UE5:', error)
    return NextResponse.json(
      { 
        error: 'Erro ao iniciar renderização',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

