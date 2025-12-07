/**
 * API de Templates
 * GET /api/templates - Lista templates
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { templatesSystem } from '@/lib/templates-system-real'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const type = searchParams.get('type')
    const tags = searchParams.get('tags')?.split(',')
    const isPremium = searchParams.get('isPremium') === 'true'
    const isPublic = searchParams.get('isPublic') === 'true'
    const minRating = searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')!) : undefined
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = parseInt(searchParams.get('perPage') || '20')

    const result = await templatesSystem.searchTemplates({
      category: category as any,
      type: type as any,
      tags,
      isPremium,
      isPublic,
      minRating
    }, page, perPage)

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('Erro ao buscar templates:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/templates - Cria novo template
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const data = await request.json()

    const template = await templatesSystem.createTemplate(
      data,
      session.user.id,
      session.user.organizationId
    )

    return NextResponse.json(template, { status: 201 })

  } catch (error: any) {
    console.error('Erro ao criar template:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
