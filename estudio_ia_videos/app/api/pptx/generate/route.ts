/**
 * 📄 API PPTX Generate - Geração de Apresentações
 * Criação automatizada de PPTX a partir de dados
 */

import { NextRequest, NextResponse } from 'next/server';
import { PPTXGenerator, PPTXGenerationOptions } from '@/lib/pptx/pptx-generator';

/**
 * POST - Gerar apresentação PPTX
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data, options } = body;

    if (!type || !data) {
      return NextResponse.json(
        { error: 'Tipo e dados são obrigatórios' },
        { status: 400 }
      );
    }

    console.log(`[PPTX Generate API] Generating presentation type: ${type}`);

    const generationOptions: PPTXGenerationOptions = options || {};
    const generator = new PPTXGenerator(generationOptions);

    let buffer: Buffer;

    switch (type) {
      case 'from-data':
        buffer = await generator.generateFromData(data);
        break;
      
      case 'from-template':
        if (!data.templateId || !data.variables) {
          return NextResponse.json(
            { error: 'Template ID e variáveis são obrigatórios' },
            { status: 400 }
          );
        }
        buffer = await generator.generateFromTemplate(data.templateId, data.variables);
        break;
      
      case 'training-course':
        buffer = await generateTrainingCourse(generator, data);
        break;
      
      case 'safety-presentation':
        buffer = await generateSafetyPresentation(generator, data);
        break;
      
      case 'quick-slides':
        buffer = await generateQuickSlides(generator, data);
        break;
      
      default:
        return NextResponse.json(
          { error: `Tipo de geração não suportado: ${type}` },
          { status: 400 }
        );
    }

    // Configurar resposta para download
    const headers = new Headers();
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
    headers.set('Content-Disposition', `attachment; filename="${data.title || 'apresentacao'}.pptx"`);
    headers.set('Content-Length', buffer.length.toString());

    console.log(`[PPTX Generate API] Generated presentation successfully (${buffer.length} bytes)`);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('[PPTX Generate API] Generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Erro na geração da apresentação', details: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * Gerar curso de treinamento
 */
async function generateTrainingCourse(generator: PPTXGenerator, data: Record<string, unknown>): Promise<Buffer> {
  const courseData = {
    title: (data.title as string) || 'Curso de Treinamento',
    slides: [
      // Slide de título
      {
        type: 'title',
        title: (data.title as string) || 'Curso de Treinamento',
        subtitle: (data.subtitle as string) || 'Treinamento Corporativo',
        notes: 'Slide de abertura do curso'
      },
      
      // Objetivos
      {
        type: 'content',
        title: 'Objetivos do Treinamento',
        content: (data.objectives as string[]) || [
          'Compreender os conceitos fundamentais',
          'Aplicar as melhores práticas',
          'Desenvolver habilidades práticas',
          'Certificar conhecimentos adquiridos'
        ],
        notes: 'Definir claramente os objetivos de aprendizagem'
      },
      
      // Conteúdo principal
      ...((data.modules as Record<string, unknown>[]) || []).map((module: Record<string, unknown>, index: number) => ({
        type: 'content',
        title: `Módulo ${index + 1}: ${module.title}`,
        content: (module.topics as string[]) || [],
        notes: (module.notes as string) || `Conteúdo do módulo ${index + 1}`
      })),
      
      // Slide de conclusão
      {
        type: 'content',
        title: 'Conclusão',
        content: [
          'Principais pontos abordados',
          'Aplicação prática',
          'Próximos passos',
          'Recursos adicionais'
        ],
        notes: 'Resumir os pontos principais e orientar próximos passos'
      }
    ]
  };

  return await generator.generateFromData(courseData);
}

/**
 * Gerar apresentação de segurança
 */
async function generateSafetyPresentation(generator: PPTXGenerator, data: Record<string, unknown>): Promise<Buffer> {
  const safetyData = {
    title: (data.title as string) || 'Treinamento de Segurança do Trabalho',
    slides: [
      // Título
      {
        type: 'title',
        title: (data.title as string) || 'Segurança do Trabalho',
        subtitle: 'Prevenção de Acidentes e Proteção da Vida',
        notes: 'Apresentação focada em segurança ocupacional'
      },
      
      // Importância da segurança
      {
        type: 'content',
        title: 'Por que a Segurança é Importante?',
        content: [
          'Preservação da vida e integridade física',
          'Redução de custos com acidentes',
          'Cumprimento de normas regulamentadoras',
          'Melhoria do ambiente de trabalho',
          'Responsabilidade social da empresa'
        ],
        notes: 'Estabelecer a importância fundamental da segurança'
      },
      
      // Principais riscos
      {
        type: 'content',
        title: 'Principais Riscos no Ambiente de Trabalho',
        content: (data.risks as string[]) || [
          'Riscos físicos (ruído, calor, frio)',
          'Riscos químicos (gases, vapores, poeiras)',
          'Riscos biológicos (vírus, bactérias)',
          'Riscos ergonômicos (postura, repetitividade)',
          'Riscos de acidentes (máquinas, ferramentas)'
        ],
        notes: 'Identificar os principais tipos de riscos ocupacionais'
      },
      
      // EPIs
      {
        type: 'content',
        title: 'Equipamentos de Proteção Individual (EPIs)',
        content: [
          'Capacete de segurança',
          'Óculos de proteção',
          'Protetores auriculares',
          'Máscaras e respiradores',
          'Luvas de proteção',
          'Calçados de segurança',
          'Cintos de segurança'
        ],
        notes: 'Apresentar os principais EPIs e suas aplicações'
      },
      
      // Procedimentos de emergência
      {
        type: 'content',
        title: 'Procedimentos de Emergência',
        content: [
          'Identificação de situações de emergência',
          'Rotas de fuga e pontos de encontro',
          'Uso de extintores e mangueiras',
          'Primeiros socorros básicos',
          'Comunicação de emergências',
          'Evacuação ordenada'
        ],
        notes: 'Definir procedimentos claros para situações de emergência'
      },
      
      // Responsabilidades
      {
        type: 'comparison',
        title: 'Responsabilidades na Segurança',
        leftColumn: {
          title: 'Empresa',
          content: [
            'Fornecer EPIs adequados',
            'Treinar funcionários',
            'Manter ambiente seguro',
            'Cumprir normas legais',
            'Investigar acidentes'
          ]
        },
        rightColumn: {
          title: 'Funcionário',
          content: [
            'Usar EPIs corretamente',
            'Seguir procedimentos',
            'Reportar riscos',
            'Participar de treinamentos',
            'Cuidar da própria segurança'
          ]
        },
        notes: 'Esclarecer as responsabilidades de cada parte'
      },
      
      // Conclusão
      {
        type: 'content',
        title: 'Compromisso com a Segurança',
        content: [
          'Segurança é responsabilidade de todos',
          'Prevenção é sempre melhor que correção',
          'Reportar situações de risco',
          'Participar ativamente dos treinamentos',
          'Cuidar de si e dos colegas'
        ],
        notes: 'Reforçar o compromisso coletivo com a segurança'
      }
    ]
  };

  return await generator.generateFromData(safetyData as Record<string, unknown>);
}

/**
 * Gerar slides rápidos
 */
async function generateQuickSlides(generator: PPTXGenerator, data: Record<string, unknown>): Promise<Buffer> {
  const quickData = {
    title: (data.title as string) || 'Apresentação Rápida',
    slides: Array.isArray(data.slides) ? data.slides.map((slide: unknown, index: number) => {
      const s = slide as Record<string, unknown>;
      return {
        type: (s.type as string) || 'content',
        title: (s.title as string) || `Slide ${index + 1}`,
        content: (s.content as string) || '',
        image: s.image as string | undefined,
        notes: s.notes as string | undefined
      };
    }) : []
  };

  return await generator.generateFromData(quickData);
}

/**
 * GET - Obter templates disponíveis
 */
export async function GET(request: NextRequest) {
  try {
    const templates = [
      {
        id: 'training-course',
        name: 'Curso de Treinamento',
        description: 'Template para cursos corporativos com módulos estruturados',
        category: 'Educação',
        variables: [
          { name: 'title', type: 'text', required: true, description: 'Título do curso' },
          { name: 'subtitle', type: 'text', required: false, description: 'Subtítulo opcional' },
          { name: 'objectives', type: 'list', required: false, description: 'Lista de objetivos' },
          { name: 'modules', type: 'list', required: true, description: 'Módulos do curso' }
        ]
      },
      {
        id: 'safety-presentation',
        name: 'Segurança do Trabalho',
        description: 'Apresentação completa sobre segurança ocupacional',
        category: 'Segurança',
        variables: [
          { name: 'title', type: 'text', required: false, description: 'Título personalizado' },
          { name: 'risks', type: 'list', required: false, description: 'Riscos específicos' }
        ]
      },
      {
        id: 'quick-slides',
        name: 'Slides Rápidos',
        description: 'Geração rápida de slides com conteúdo personalizado',
        category: 'Geral',
        variables: [
          { name: 'title', type: 'text', required: true, description: 'Título da apresentação' },
          { name: 'slides', type: 'list', required: true, description: 'Lista de slides' }
        ]
      }
    ];

    return NextResponse.json({ templates });

  } catch (error) {
    console.error('[PPTX Generate API] Template list error:', error);
    return NextResponse.json(
      { error: 'Erro ao obter templates' },
      { status: 500 }
    );
  }
}
