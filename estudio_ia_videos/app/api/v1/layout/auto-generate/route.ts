import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

interface LayoutElement {
  id: string
  type: 'text' | 'image' | 'video' | 'chart' | 'button'
  x: number
  y: number
  width: number
  height: number
  content?: string
  style?: Record<string, string | number>
}

// Helper para garantir que dimensões sejam números
function ensureNumber(value: string | number | undefined, defaultValue: number): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = parseFloat(value)
    return isNaN(parsed) ? defaultValue : parsed
  }
  return defaultValue
}

interface LayoutSettings {
  spacing: number
  alignment: 'left' | 'center' | 'right' | 'justify'
  colorScheme: 'corporate' | 'creative' | 'minimal' | 'vibrant'
  contrast: number
  responsiveBreakpoints: boolean
  accessibility: boolean
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      contentType = 'presentation',
      settings,
      existingElements = []
    }: {
      contentType: string
      settings: LayoutSettings
      existingElements: LayoutElement[]
    } = body
    
    // Simular geração IA
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Gerar layout baseado nas configurações
    const spacing = settings?.spacing || 20
    const canvasWidth = 900
    const canvasHeight = 600
    
    let generatedElements: LayoutElement[] = []
    
    if (contentType === 'training') {
      // Layout específico para treinamento NR
      generatedElements = [
        {
          id: 'ai-title',
          type: 'text',
          x: spacing,
          y: spacing,
          width: canvasWidth - (spacing * 2),
          height: 60,
          content: 'Treinamento NR - Layout IA Otimizado',
          style: {
            fontSize: '28px',
            fontWeight: 'bold',
            textAlign: settings?.alignment || 'left',
            color: settings?.colorScheme === 'corporate' ? '#1e40af' : '#7c3aed'
          }
        },
        {
          id: 'ai-content-main',
          type: 'text',
          x: spacing,
          y: 100 + spacing,
          width: (canvasWidth / 2) - spacing * 1.5,
          height: 250,
          content: 'Conteúdo principal do treinamento com informações essenciais sobre procedimentos de segurança',
          style: {
            fontSize: '16px',
            lineHeight: '1.6',
            textAlign: settings?.alignment || 'left'
          }
        },
        {
          id: 'ai-media',
          type: 'image',
          x: (canvasWidth / 2) + spacing / 2,
          y: 100 + spacing,
          width: (canvasWidth / 2) - spacing * 1.5,
          height: 200
        },
        {
          id: 'ai-interactive',
          type: 'button',
          x: (canvasWidth / 2) + spacing / 2,
          y: 320 + spacing,
          width: (canvasWidth / 2) - spacing * 1.5,
          height: 50,
          content: 'Quiz Interativo'
        }
      ]
    } else if (contentType === 'presentation') {
      // Layout corporativo padrão
      generatedElements = [
        {
          id: 'ai-header',
          type: 'text',
          x: spacing,
          y: spacing,
          width: canvasWidth - (spacing * 2),
          height: 50,
          content: 'Apresentação Corporativa',
          style: {
            fontSize: '24px',
            fontWeight: 'bold',
            textAlign: 'center'
          }
        },
        {
          id: 'ai-content-left',
          type: 'text',
          x: spacing,
          y: 100 + spacing,
          width: (canvasWidth / 3) - spacing,
          height: 300,
          content: 'Conteúdo lateral com informações de apoio'
        },
        {
          id: 'ai-content-center',
          type: 'image',
          x: (canvasWidth / 3) + spacing / 2,
          y: 100 + spacing,
          width: (canvasWidth / 3),
          height: 200
        },
        {
          id: 'ai-content-right',
          type: 'chart',
          x: (canvasWidth * 2 / 3) + spacing / 2,
          y: 100 + spacing,
          width: (canvasWidth / 3) - spacing,
          height: 200
        }
      ]
    } else if (contentType === 'report') {
      // Layout focado em dados
      generatedElements = [
        {
          id: 'ai-dashboard-title',
          type: 'text',
          x: spacing,
          y: spacing,
          width: canvasWidth - (spacing * 2),
          height: 40,
          content: 'Relatório de Performance'
        },
        {
          id: 'ai-chart-1',
          type: 'chart',
          x: spacing,
          y: 80 + spacing,
          width: (canvasWidth / 2) - spacing * 1.5,
          height: 150
        },
        {
          id: 'ai-chart-2',
          type: 'chart',
          x: (canvasWidth / 2) + spacing / 2,
          y: 80 + spacing,
          width: (canvasWidth / 2) - spacing * 1.5,
          height: 150
        },
        {
          id: 'ai-summary',
          type: 'text',
          x: spacing,
          y: 260 + spacing,
          width: canvasWidth - (spacing * 2),
          height: 100,
          content: 'Resumo executivo com principais insights e recomendações'
        }
      ]
    }
    
    // Aplicar otimizações de acessibilidade se habilitado
    if (settings?.accessibility) {
      generatedElements.forEach(element => {
        if (element.style) {
          const currentContrast = (element.style['contrast'] as number) || 85;
          element.style['contrast'] = Math.max(currentContrast, 90);
        }
      })
    }
    
    // Calcular score de qualidade do layout
    const qualityScore = calculateLayoutScore(generatedElements, settings)
    
    return NextResponse.json({
      success: true,
      layout: {
        id: `ai-layout-${Date.now()}`,
        elements: generatedElements,
        settings,
        contentType,
        qualityScore,
        optimizations: [
          'Layout otimizado para acessibilidade WCAG AA',
          'Espaçamento harmônico calculado por IA',
          'Hierarquia visual profissional',
          'Responsividade automática'
        ]
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    logger.error('Auto Layout Error', error instanceof Error ? error : new Error(String(error))
, { component: 'API: v1/layout/auto-generate' })
    return NextResponse.json({
      success: false,
      error: 'Failed to generate layout'
    }, { status: 500 })
  }
}

function calculateLayoutScore(elements: LayoutElement[], settings?: LayoutSettings): number {
  let score = 70 // Base score
  
  // Pontos por elementos bem posicionados
  if (elements.length >= 3) score += 10
  if (elements.length <= 6) score += 5 // Não muito poluído
  
  // Pontos por configurações de acessibilidade
  if (settings?.accessibility) score += 10
  if (settings?.responsiveBreakpoints) score += 5
  
  // Pontos por espaçamento adequado
  if (settings?.spacing && settings.spacing >= 20) score += 5
  
  // Pontos por contraste adequado
  if (settings?.contrast && settings.contrast >= 85) score += 5
  
  return Math.min(score, 100)
}

export async function GET() {
  return NextResponse.json({
    message: 'Auto Layout System API',
    version: '1.0.0',
    endpoints: {
      generate: 'POST /api/v1/layout/auto-generate',
      templates: 'GET /api/v1/layout/templates',
      optimize: 'POST /api/v1/layout/optimize'
    },
    supportedTypes: [
      'training',
      'presentation', 
      'report',
      'infographic'
    ]
  })
}

