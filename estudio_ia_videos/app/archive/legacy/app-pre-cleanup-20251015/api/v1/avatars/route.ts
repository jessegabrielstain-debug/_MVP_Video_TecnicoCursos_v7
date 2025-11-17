
import { NextRequest, NextResponse } from 'next/server'
import { avatar3DHyperPipeline } from '@/lib/avatar-3d-pipeline'

// Force dynamic rendering to avoid build-time errors
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const gender = searchParams.get('gender')
    const age = searchParams.get('age')
    const premium = searchParams.get('premium')
    const quality = searchParams.get('quality')

    // Obter todos os avatares hiper-realistas
    let avatars = avatar3DHyperPipeline.getAllAvatars()

    // Aplicar filtros
    if (category && category !== 'all') {
      const categoryMap: Record<string, unknown> = {
        'business': 'business',
        'industrial': 'safety',
        'healthcare': 'healthcare',
        'education': 'education',
        'general': 'business'
      }
      const mappedCategory = categoryMap[category] || category
      avatars = avatar3DHyperPipeline.getAvatarsByCategory(mappedCategory)
    }

    if (gender && gender !== 'all') {
      const genderMap: Record<string, unknown> = {
        'male': 'male',
        'female': 'female', 
        'neutral': 'unisex'
      }
      const mappedGender = genderMap[gender] || gender
      avatars = avatars.filter(avatar => avatar.gender === mappedGender)
    }

    if (age && age !== 'all') {
      avatars = avatars.filter(avatar => avatar.age === age)
    }

    if (premium === 'true') {
      avatars = avatars.filter(avatar => avatar.quality === 'hyperreal' || avatar.quality === 'cinematic')
    }

    if (quality && quality !== 'all') {
      avatars = avatars.filter(avatar => avatar.quality === quality)
    }

    // Transformar para compatibilidade com API v1
    const transformedAvatars = avatars.map(avatar => ({
      id: avatar.id,
      name: avatar.name,
      category: avatar.category,
      gender: avatar.gender,
      age: avatar.age,
      ethnicity: avatar.ethnicity,
      quality: avatar.quality,
      isPremium: avatar.quality === 'hyperreal' || avatar.quality === 'cinematic',
      profession: avatar.category === 'business' ? 'Executivo' :
                  avatar.category === 'safety' ? 'Instrutor de Segurança' :
                  avatar.category === 'healthcare' ? 'Profissional de Saúde' : 'Especialista',
      features: avatar.features,
      rendering: avatar.rendering,
      preview: `/avatars/previews/${avatar.id}.jpg`,
      hyperRealistic: true,
      pipeline: 'UE5 Hiper-Realista'
    }))

    return NextResponse.json({
      avatars: transformedAvatars,
      total: transformedAvatars.length,
      categories: [
        { id: 'business', name: 'Executivos', count: avatar3DHyperPipeline.getAvatarsByCategory('business').length },
        { id: 'industrial', name: 'Segurança', count: avatar3DHyperPipeline.getAvatarsByCategory('safety').length },
        { id: 'healthcare', name: 'Saúde', count: avatar3DHyperPipeline.getAvatarsByCategory('healthcare').length },
        { id: 'education', name: 'Educação', count: avatar3DHyperPipeline.getAvatarsByCategory('education').length },
        { id: 'general', name: 'Geral', count: avatar3DHyperPipeline.getAvatarsByCategory('casual').length }
      ],
      filters: {
        genders: ['male', 'female', 'unisex'],
        ages: ['young', 'adult', 'senior'],
        qualities: ['standard', 'premium', 'cinematic', 'hyperreal'],
        professions: ['Executivo', 'Instrutor de Segurança', 'Profissional de Saúde', 'Professor', 'Especialista']
      },
      pipeline: {
        engine: 'Unreal Engine 5',
        renderingTech: ['Lumen', 'Nanite', 'Ray Tracing'],
        lipSyncEngine: 'ML-Driven',
        hyperRealistic: true
      }
    })

  } catch (error) {
    console.error('Error fetching hyper-realistic avatars:', error)
    return NextResponse.json(
      { error: 'Failed to fetch hyper-realistic avatars' },
      { status: 500 }
    )
  }
}
