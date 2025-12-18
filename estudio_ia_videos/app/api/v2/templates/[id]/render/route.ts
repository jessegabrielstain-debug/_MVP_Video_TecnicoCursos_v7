/**
 * API v2: Render Template
 * Renderiza um template com variáveis fornecidas
 */

import { NextResponse } from 'next/server';
import { advancedTemplateEngine } from '@/lib/templates/advanced-template-engine';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();

    const { variables, outputFormat, quality, includeAnimations, watermark } = body;

    const result = await advancedTemplateEngine.renderTemplate(id, {
      variables,
      outputFormat,
      quality,
      includeAnimations,
      watermark
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    logger.error('Error rendering template', error instanceof Error ? error : new Error(String(error)), {
      component: 'API: /api/v2/templates/[id]/render'
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to render template'
      },
      { status: 500 }
    );
  }
}
