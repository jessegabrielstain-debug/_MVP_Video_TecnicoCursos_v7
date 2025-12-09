
/**
 * API: Expanded NR Templates
 * Retorna todos os 15 templates NR (incluindo os 5 novos)
 */

import { NextRequest, NextResponse } from 'next/server'
import { NRTemplate } from '@/lib/nr-templates'
import {
  NEW_NR_TEMPLATES,
  NR_TEMPLATES_METADATA,
  NRTemplate as NRTemplateBasic
} from '@/lib/nr-templates/nr-7-9-11-13-15'
import { logger } from '@/lib/logger'

// Extended template type that combines both interfaces
interface ExtendedNRTemplate {
  id?: string;
  nr?: string;
  number?: string;
  title: string;
  description?: string;
  duration?: number;
  duration_minutes?: number;
  category?: string;
  slides?: unknown[];
  sections?: unknown[];
}

export async function GET(req: NextRequest) {
  try {
    const category = req.nextUrl.searchParams.get('category')
    const search = req.nextUrl.searchParams.get('search')
    const minDuration = req.nextUrl.searchParams.get('minDuration')
    const maxDuration = req.nextUrl.searchParams.get('maxDuration')

    // Convert object to array for filtering
    let templates = Object.values(NEW_NR_TEMPLATES) as ExtendedNRTemplate[]

    // Filtrar por categoria
    if (category) {
      templates = templates.filter((t) => t.category === category)
    }

    // Filtrar por busca
    if (search) {
      const searchLower = search.toLowerCase()
      templates = templates.filter((t) =>
        t.title.toLowerCase().includes(searchLower) ||
        (t.nr || t.number || '').toLowerCase().includes(searchLower) ||
        (t.description || '').toLowerCase().includes(searchLower)
      )
    }

    // Filtrar por duração
    if (minDuration) {
      const minDur = parseInt(minDuration)
      templates = templates.filter((t) => (t.duration || t.duration_minutes || 0) >= minDur)
    }
    if (maxDuration) {
      const maxDur = parseInt(maxDuration)
      templates = templates.filter((t) => (t.duration || t.duration_minutes || 0) <= maxDur)
    }

    return NextResponse.json({
      success: true,
      templates,
      metadata: NR_TEMPLATES_METADATA,
      total: templates.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    logger.error('Erro ao buscar templates NR expandidos', { component: 'API: templates/nr/expanded', error: error instanceof Error ? error : new Error(String(error)) })
    return NextResponse.json(
      { error: 'Erro ao buscar templates' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { templateId, projectName, customizations } = body

    // Buscar template
    const templates = Object.values(NEW_NR_TEMPLATES) as ExtendedNRTemplate[]
    const template = templates.find((t) => t.id === templateId || t.number === templateId)

    if (!template) {
      return NextResponse.json(
        { error: 'Template não encontrado' },
        { status: 404 }
      )
    }

    // Criar projeto a partir do template
    const newProject = {
      id: `project-${Date.now()}`,
      name: projectName || template.title,
      templateId,
      templateNR: template.nr || template.number,
      slides: template.slides || template.sections,
      customizations,
      createdAt: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      message: 'Projeto criado com sucesso',
      project: newProject
    })
  } catch (error) {
    logger.error('Erro ao criar projeto a partir do template', { component: 'API: templates/nr/expanded', error: error instanceof Error ? error : new Error(String(error)) })
    return NextResponse.json(
      { error: 'Erro ao criar projeto' },
      { status: 500 }
    )
  }
}

