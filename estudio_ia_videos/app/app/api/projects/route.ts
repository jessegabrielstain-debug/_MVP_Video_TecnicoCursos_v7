/**
 * API: Projects Management
 * GET /api/projects - Lista projetos do usuário
 * POST /api/projects - Criar novo projeto
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Schema validação
const createProjectSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().optional(),
})

// Mock storage (em produção: Supabase)
const mockProjects = new Map<string, any>()

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id') || 'demo-user'
  
  // Retorna projetos do usuário (mock)
  const userProjects = Array.from(mockProjects.values())
    .filter(p => p.user_id === userId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  
  return NextResponse.json({
    projects: userProjects,
    total: userProjects.length,
  })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const parseResult = createProjectSchema.safeParse(body)

  if (!parseResult.success) {
    return NextResponse.json({
      error: 'Invalid payload',
      details: parseResult.error.flatten().fieldErrors,
    }, { status: 400 })
  }

  const { title, description } = parseResult.data
  const userId = request.headers.get('x-user-id') || 'demo-user'
  
  const projectId = `proj-${Date.now()}-${Math.random().toString(36).substring(7)}`
  const project = {
    id: projectId,
    user_id: userId,
    title,
    description: description || '',
    status: 'draft',
    settings: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  mockProjects.set(projectId, project)

  return NextResponse.json({ project }, { status: 201 })
}
