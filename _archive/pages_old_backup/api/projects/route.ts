/**
 * API de Projetos
 * GET /api/projects - Lista projetos
 * POST /api/projects - Cria novo projeto
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { projectsSystem } from '@/lib/projects-system-real'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const tags = searchParams.get('tags')?.split(',')
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = parseInt(searchParams.get('perPage') || '20')

    const result = await projectsSystem.searchProjects({
      query: query || undefined,
      type: type as any,
      status: status as any,
      tags
    }, page, perPage, session?.user?.id)

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('Erro ao buscar projetos:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

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

    const project = await projectsSystem.createProject(data, session.user.id)

    return NextResponse.json(project, { status: 201 })

  } catch (error: any) {
    console.error('Erro ao criar projeto:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
