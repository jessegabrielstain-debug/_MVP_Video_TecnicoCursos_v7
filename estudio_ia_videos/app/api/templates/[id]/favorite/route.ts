import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

interface Template {
  id: string
  isFavorite: boolean
  updatedAt: Date
  metadata: {
    usage: {
      likes: number
    }
  }
  [key: string]: unknown
}

// Mock database - em produção, usar banco de dados real
let templates: Template[] = [];

// POST - Adicionar/remover template dos favoritos
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { isFavorite } = await request.json();

    const templateIndex = templates.findIndex(t => t.id === id);

    if (templateIndex === -1) {
      return NextResponse.json(
        { error: 'Template não encontrado', success: false },
        { status: 404 }
      );
    }

    templates[templateIndex].isFavorite = isFavorite;
    templates[templateIndex].updatedAt = new Date();

    // Atualizar estatísticas de uso
    if (isFavorite) {
      templates[templateIndex].metadata.usage.likes += 1;
    } else {
      templates[templateIndex].metadata.usage.likes = Math.max(0, templates[templateIndex].metadata.usage.likes - 1);
    }

    return NextResponse.json({
      template: templates[templateIndex],
      success: true,
    });

  } catch (error) {
    logger.error('Erro ao atualizar favorito', error instanceof Error ? error : new Error(String(error)) instanceof Error ? error instanceof Error ? error : new Error(String(error)) : new Error(String(error instanceof Error ? error : new Error(String(error)))), { component: 'API: templates/favorite' });
    return NextResponse.json(
      { error: 'Erro interno do servidor', success: false },
      { status: 500 }
    );
  }
}