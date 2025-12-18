/**
 * API v2: Advanced Templates
 * Endpoints para sistema de templates avançados
 */

import { NextResponse } from 'next/server';
import { advancedTemplateEngine } from '@/lib/templates/advanced-template-engine';
import { logger } from '@/lib/logger';
import { getSupabaseForRequest } from '@/lib/services';

export const runtime = 'nodejs';

// GET /api/v2/templates - Listar templates
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || undefined;
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || undefined;
    const search = searchParams.get('search') || undefined;

    const templates = await advancedTemplateEngine.listTemplates({
      category,
      tags,
      search
    });

    return NextResponse.json({
      success: true,
      data: templates,
      count: templates.length
    });
  } catch (error) {
    logger.error('Error listing templates', error instanceof Error ? error : new Error(String(error)), {
      component: 'API: /api/v2/templates'
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to list templates'
      },
      { status: 500 }
    );
  }
}

// POST /api/v2/templates - Criar novo template
export async function POST(req: Request) {
  try {
    const supabase = getSupabaseForRequest(req);
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Adicionar author
    const templateData = {
      ...body,
      metadata: {
        ...body.metadata,
        author: user.id
      }
    };

    const templateId = await advancedTemplateEngine.createTemplate(templateData);

    if (!templateId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create template'
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: { id: templateId }
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Error creating template', error instanceof Error ? error : new Error(String(error)), {
      component: 'API: /api/v2/templates'
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create template'
      },
      { status: 500 }
    );
  }
}
