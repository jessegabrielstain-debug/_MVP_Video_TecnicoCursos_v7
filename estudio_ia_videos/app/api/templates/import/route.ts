import { NextRequest, NextResponse } from 'next/server';

interface Template {
  id: string
  name: string
  category: string
  content: {
    slides: unknown[]
    settings?: unknown
  }
  tags?: string[]
  rating?: number
  isCustom?: boolean
  isFavorite?: boolean
  createdAt?: Date
  updatedAt?: Date
  downloads?: number
  metadata?: Record<string, unknown>
  [key: string]: unknown
}

// Mock database - em produção, usar banco de dados real
let templates: Template[] = [];

// POST - Importar templates
export async function POST(request: NextRequest) {
  try {
    const { templates: importedTemplates, format } = await request.json();

    if (!importedTemplates || !Array.isArray(importedTemplates)) {
      return NextResponse.json(
        { error: 'Dados de templates inválidos', success: false },
        { status: 400 }
      );
    }

    const validationResults = [];
    const successfulImports = [];

    for (let i = 0; i < importedTemplates.length; i++) {
      const templateData = importedTemplates[i];
      const validation = validateTemplate(templateData, i);

      validationResults.push(validation);

      if (validation.valid) {
        // Gerar novo ID para evitar conflitos
        const importedTemplate = {
          ...templateData,
          id: `template-${Date.now()}-${i}`,
          isCustom: true,
          isFavorite: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          downloads: 0,
          rating: 0,
          metadata: {
            ...templateData.metadata,
            usage: {
              views: 0,
              downloads: 0,
              likes: 0,
              shares: 0,
              lastUsed: new Date(),
            },
          },
        };

        templates.push(importedTemplate);
        successfulImports.push(importedTemplate);
      }
    }

    return NextResponse.json({
      imported: successfulImports,
      validationResults,
      summary: {
        total: importedTemplates.length,
        successful: successfulImports.length,
        failed: importedTemplates.length - successfulImports.length,
      },
      success: true,
    }, { status: 201 });

  } catch (error) {
    console.error('Erro ao importar templates:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', success: false },
      { status: 500 }
    );
  }
}

function validateTemplate(templateData: Template, index: number) {
  const errors = [];
  const warnings = [];

  // Validações obrigatórias
  if (!templateData.name || typeof templateData.name !== 'string') {
    errors.push('Nome é obrigatório e deve ser uma string');
  }

  if (!templateData.category || typeof templateData.category !== 'string') {
    errors.push('Categoria é obrigatória e deve ser uma string');
  }

  if (!templateData.content || typeof templateData.content !== 'object') {
    errors.push('Conteúdo é obrigatório e deve ser um objeto');
  }

  // Validações de conteúdo
  if (templateData.content) {
    if (!Array.isArray(templateData.content.slides)) {
      errors.push('Slides devem ser um array');
    } else if (templateData.content.slides.length === 0) {
      warnings.push('Template não possui slides');
    }

    if (!templateData.content.settings) {
      warnings.push('Configurações não encontradas, usando padrões');
    }
  }

  // Validações de metadados
  if (templateData.tags && !Array.isArray(templateData.tags)) {
    warnings.push('Tags devem ser um array, ignorando valor atual');
  }

  // Validações de formato
  if (templateData.rating && (typeof templateData.rating !== 'number' || templateData.rating < 0 || templateData.rating > 5)) {
    warnings.push('Rating deve ser um número entre 0 e 5');
  }

  return {
    index,
    template: templateData,
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
