
import { NextRequest, NextResponse } from 'next/server';

interface InteractiveElement {
  id?: string
  type: string
  [key: string]: unknown
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { elements, settings } = body;

    // Simulate interactive elements processing
    const processedElements = elements.map((element: InteractiveElement) => ({
      ...element,
      id: element.id || `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      processedAt: new Date().toISOString(),
      status: 'active',
      analytics: {
        impressions: Math.floor(Math.random() * 1000) + 100,
        interactions: Math.floor(Math.random() * 500) + 50,
        completionRate: Math.floor(Math.random() * 30) + 70, // 70-100%
        averageTime: Math.floor(Math.random() * 120) + 30 // 30-150 seconds
      },
      validation: {
        isValid: true,
        warnings: [],
        errors: []
      }
    }));

    const interactiveProject = {
      id: `project_${Date.now()}`,
      elements: processedElements,
      settings: {
        trackInteractions: settings?.trackInteractions ?? true,
        showProgress: settings?.showProgress ?? true,
        requireCompletion: settings?.requireCompletion ?? false,
        gamification: settings?.gamification ?? true,
        ...settings
      },
      metadata: {
        totalElements: processedElements.length,
        elementTypes: {
          quiz: processedElements.filter((e: InteractiveElement) => e.type === 'quiz').length,
          hotspot: processedElements.filter((e: InteractiveElement) => e.type === 'hotspot').length,
          button: processedElements.filter((e: InteractiveElement) => e.type === 'button').length,
          form: processedElements.filter((e: InteractiveElement) => e.type === 'form').length
        },
        estimatedEngagement: Math.floor(Math.random() * 20) + 80, // 80-100%
        complexity: processedElements.length > 10 ? 'high' : processedElements.length > 5 ? 'medium' : 'low'
      },
      export: {
        formats: ['html', 'scorm', 'xapi', 'json'],
        urls: {
          html: `/exports/interactive_${Date.now()}.html`,
          scorm: `/exports/interactive_${Date.now()}_scorm.zip`,
          xapi: `/exports/interactive_${Date.now()}_xapi.zip`,
          json: `/exports/interactive_${Date.now()}.json`
        }
      },
      createdAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: interactiveProject,
      message: 'Elementos interativos processados com sucesso'
    });

  } catch (error) {
    console.error('Interactive elements processing error:', error);
    return NextResponse.json(
      { success: false, message: 'Erro ao processar elementos interativos' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const type = searchParams.get('type');

    // Simulate interactive elements library
    const elementsLibrary = {
      quiz: [
        {
          id: 'quiz_nr12_basic',
          title: 'Quiz Básico NR-12',
          description: 'Perguntas fundamentais sobre segurança em máquinas',
          category: 'safety',
          difficulty: 'beginner',
          questions: 5,
          avgTime: 120,
          completionRate: 87
        },
        {
          id: 'quiz_nr33_confined',
          title: 'Quiz NR-33 Avançado',
          description: 'Avaliação completa sobre espaços confinados',
          category: 'safety',
          difficulty: 'advanced',
          questions: 10,
          avgTime: 300,
          completionRate: 72
        }
      ],
      hotspot: [
        {
          id: 'hotspot_machine_parts',
          title: 'Partes da Máquina',
          description: 'Pontos interativos identificando componentes',
          category: 'educational',
          interactions: 8,
          avgEngagement: 94
        },
        {
          id: 'hotspot_safety_equipment',
          title: 'EPIs Obrigatórios',
          description: 'Identificação de equipamentos de proteção',
          category: 'safety',
          interactions: 6,
          avgEngagement: 91
        }
      ],
      button: [
        {
          id: 'button_certificate_download',
          title: 'Download de Certificado',
          description: 'Botão para baixar certificação NR',
          action: 'download',
          clickRate: 85
        },
        {
          id: 'button_emergency_procedure',
          title: 'Procedimento de Emergência',
          description: 'Acesso rápido a procedimentos críticos',
          action: 'navigate',
          clickRate: 78
        }
      ],
      form: [
        {
          id: 'form_knowledge_assessment',
          title: 'Avaliação de Conhecimento',
          description: 'Formulário de avaliação pós-treinamento',
          fields: 8,
          completionRate: 89
        },
        {
          id: 'form_feedback_training',
          title: 'Feedback do Treinamento',
          description: 'Coleta de feedback sobre qualidade',
          fields: 5,
          completionRate: 94
        }
      ]
    };

    let responseData;
    
    if (projectId) {
      // Return specific project
      responseData = {
        id: projectId,
        title: 'Projeto Interativo NR-12',
        elements: [...elementsLibrary.quiz.slice(0, 2), ...elementsLibrary.hotspot.slice(0, 1)],
        analytics: {
          totalViews: 1247,
          totalInteractions: 892,
          avgCompletionRate: 83,
          lastUpdated: new Date().toISOString()
        }
      };
    } else if (type && elementsLibrary[type as keyof typeof elementsLibrary]) {
      // Return elements by type
      responseData = {
        type,
        elements: elementsLibrary[type as keyof typeof elementsLibrary],
        count: elementsLibrary[type as keyof typeof elementsLibrary].length
      };
    } else {
      // Return full library
      responseData = {
        library: elementsLibrary,
        summary: {
          totalElements: Object.values(elementsLibrary).flat().length,
          categories: ['safety', 'educational', 'assessment'],
          avgEngagement: 87
        }
      };
    }

    return NextResponse.json({
      success: true,
      data: responseData,
      message: 'Biblioteca de elementos carregada com sucesso'
    });

  } catch (error) {
    console.error('Get interactive elements error:', error);
    return NextResponse.json(
      { success: false, message: 'Erro ao carregar elementos interativos' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { elementId, properties, content } = body;

    // Simulate element update
    const updatedElement = {
      id: elementId,
      ...properties,
      content,
      lastModified: new Date().toISOString(),
      version: Math.floor(Date.now() / 1000),
      status: 'updated'
    };

    return NextResponse.json({
      success: true,
      data: updatedElement,
      message: 'Elemento interativo atualizado com sucesso'
    });

  } catch (error) {
    console.error('Update interactive element error:', error);
    return NextResponse.json(
      { success: false, message: 'Erro ao atualizar elemento interativo' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const elementId = searchParams.get('elementId');

    if (!elementId) {
      return NextResponse.json(
        { success: false, message: 'ID do elemento é obrigatório' },
        { status: 400 }
      );
    }

    // Simulate element deletion
    const deletionResult = {
      elementId,
      deletedAt: new Date().toISOString(),
      status: 'deleted'
    };

    return NextResponse.json({
      success: true,
      data: deletionResult,
      message: 'Elemento interativo removido com sucesso'
    });

  } catch (error) {
    console.error('Delete interactive element error:', error);
    return NextResponse.json(
      { success: false, message: 'Erro ao remover elemento interativo' },
      { status: 500 }
    );
  }
}

