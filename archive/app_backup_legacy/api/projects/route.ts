// @ts-nocheck
// TODO: Backup - fix types
/**
 * API: Projects Management
 * GET /api/projects - Lista projetos do usuário
 * POST /api/projects - Criar novo projeto
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { addProject, getUserProjects } from '@/lib/projects/mockStore'

// Schema validação
const createProjectSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().optional(),
})

// Mock storage compartilhado (em produção: Supabase)

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id') || 'demo-user'
  
  // Retorna projetos do usuário (mock)
  const userProjects = getUserProjects(userId)
  
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
    status: 'draft' as const,
    settings: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  addProject(project)

  return NextResponse.json({ project }, { status: 201 })
}
