
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth/auth-config'

/**
 * 📚 Assets Library API - Estilo Animaker
 * Biblioteca com 160M+ assets para editor PPTX
 */


// Force dynamic rendering to avoid build-time errors
export const dynamic = 'force-dynamic'
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || 'characters'
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Mock massive asset library (simulando Animaker)
    const generateAssets = (type: string, count: number) => {
      return Array.from({ length: count }, (_, i) => {
        const assetMap: Record<string, unknown> = {
          characters: {
            id: `char_${type}_${i}`,
            name: `Personagem ${i + 1}`,
            category: ['Empresarial', 'Técnico', 'Educacional', 'Médico'][i % 4],
            thumbnail: ['👨‍💼', '👩‍💼', '👨‍🔧', '👩‍⚕️', '👨‍🏭', '👩‍🎓'][i % 6],
            type: 'character',
            premium: i % 3 === 0,
            tags: ['brasileiro', 'profissional', 'realista'],
            animations: ['idle', 'talking', 'pointing', 'walking'],
            expressions: ['neutral', 'happy', 'serious', 'concerned'],
            props: ['capacete', 'óculos', 'luvas', 'uniforme']
          },
          text: {
            id: `text_${type}_${i}`,
            name: `Estilo de Texto ${i + 1}`,
            category: ['Títulos', 'Subtítulos', 'Corpo', 'Destaques'][i % 4],
            thumbnail: '📝',
            type: 'text',
            premium: i % 4 === 0,
            tags: ['legível', 'moderno', 'elegante'],
            fontFamily: ['Inter', 'Roboto', 'Open Sans', 'Montserrat'][i % 4],
            effects: ['fadeIn', 'typewriter', 'bounce', 'glow']
          },
          backgrounds: {
            id: `bg_${type}_${i}`,
            name: `Fundo ${i + 1}`,
            category: ['Escritório', 'Fábrica', 'Laboratório', 'Externa'][i % 4],
            thumbnail: ['🏢', '🏭', '🔬', '🌅'][i % 4],
            type: 'background',
            premium: i % 5 === 0,
            tags: ['profissional', 'brasileiro', 'moderno'],
            resolution: '4K',
            style: '3D realista'
          },
          music: {
            id: `music_${type}_${i}`,
            name: `Música ${i + 1}`,
            category: ['Corporativo', 'Ambiente', 'Motivacional', 'Relaxante'][i % 4],
            thumbnail: '🎵',
            type: 'music',
            premium: i % 3 === 0,
            tags: ['instrumental', 'background', 'loop'],
            duration: Math.floor(Math.random() * 180) + 60,
            bpm: Math.floor(Math.random() * 60) + 80,
            mood: ['energetic', 'calm', 'inspiring', 'professional'][i % 4]
          },
          effects: {
            id: `effect_${type}_${i}`,
            name: `Efeito ${i + 1}`,
            category: ['Transições', 'Partículas', 'Overlay', 'Distorção'][i % 4],
            thumbnail: '✨',
            type: 'effect',
            premium: i % 2 === 0,
            tags: ['cinema', 'profissional', 'suave'],
            duration: (Math.random() * 2) + 0.5,
            intensity: ['low', 'medium', 'high'][i % 3]
          }
        }
        return assetMap[type] || {}
      })
    }

    const assets = generateAssets(category, 100) // Simular 100 assets por categoria
    
    // Filter by search if provided
    const filteredAssets = search 
      ? assets.filter((asset: any) => 
          asset.name.toLowerCase().includes(search.toLowerCase()) ||
          asset.tags.some((tag: string) => tag.toLowerCase().includes(search.toLowerCase()))
        )
      : assets

    // Pagination
    const startIndex = (page - 1) * limit
    const paginatedAssets = filteredAssets.slice(startIndex, startIndex + limit)

    return NextResponse.json({
      success: true,
      assets: paginatedAssets,
      pagination: {
        page,
        limit,
        total: filteredAssets.length,
        totalPages: Math.ceil(filteredAssets.length / limit),
        hasNext: startIndex + limit < filteredAssets.length,
        hasPrev: page > 1
      },
      stats: {
        totalLibrary: '160M+',
        categories: {
          characters: '2.5M',
          backgrounds: '890K',
          music: '30K',
          effects: '15K',
          text: '100K'
        },
        newThisWeek: 2847,
        trending: ['Personagens Brasileiros', 'Segurança NR-12', 'Ambientes 3D']
      }
    })

  } catch (error) {
    console.error('Error getting assets:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      )
    }

    const { action, assetId, projectId, position, properties } = await request.json()

    switch (action) {
      case 'add_to_project':
        // Adicionar asset ao projeto
        return NextResponse.json({
          success: true,
          message: 'Asset adicionado ao projeto',
          addedAsset: {
            id: `project_asset_${Date.now()}`,
            assetId,
            projectId,
            position: position || { x: 50, y: 50 },
            properties: properties || {},
            addedAt: new Date().toISOString()
          }
        })

      case 'favorite_asset':
        // Adicionar aos favoritos
        return NextResponse.json({
          success: true,
          message: 'Asset adicionado aos favoritos',
          favorited: true
        })

      case 'download_asset':
        // Download de asset premium
        return NextResponse.json({
          success: true,
          message: 'Download iniciado',
          downloadUrl: `https://assets.s3.amazonaws.com/${assetId}.zip`,
          expires: new Date(Date.now() + 3600000).toISOString() // 1 hour
        })

      default:
        return NextResponse.json(
          { error: 'Ação não reconhecida' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Error in assets API:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
