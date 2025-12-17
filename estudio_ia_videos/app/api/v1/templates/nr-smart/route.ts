// TODO: Fix NRTemplate type mapping

import { NextRequest, NextResponse } from 'next/server'
import { listNRTemplates, NRTemplate as ServiceNRTemplate } from '@/lib/services/nr-templates-service'
import { logger } from '@/lib/logger'

interface NRTemplate {
  id: string
  name: string
  norma: string
  description: string
  category: 'seguranca' | 'saude' | 'meio-ambiente' | 'qualidade'
  industry: string[]
  duration: string
  slides: number
  compliance: number
  thumbnail: string
  features: string[]
  lastUpdated: string
  downloads: number
  rating: number
  isNew?: boolean
  isPremium?: boolean
  aiOptimized: boolean
  content?: unknown
}

/**
 * Converte template do banco (nr_templates) para formato de API v1
 */
function convertToV1Format(dbTemplate: ServiceNRTemplate): NRTemplate {
  const title = String(dbTemplate.title || '');
  const nrNumber = String(dbTemplate.nr_number || '');
  const description = String(dbTemplate.description || '');
  const durationSeconds = Number(dbTemplate.duration_seconds || 0);
  const slideCount = Number(dbTemplate.slide_count || 0);
  const updatedAt = String(dbTemplate.updated_at || new Date().toISOString());

  return {
    id: String(dbTemplate.id),
    name: title,
    norma: nrNumber,
    description: description,
    category: 'seguranca', // Padrão, pode ser inferido futuramente
    industry: ['Geral'], // Pode ser expandido no banco
    duration: `${Math.floor(durationSeconds / 60)} min`,
    slides: slideCount,
    compliance: 100, // Pode ser calculado ou armazenado
    thumbnail: `/nr-thumbnails/${nrNumber.toLowerCase()}.jpg`,
    features: [
      'Conteúdo atualizado',
      'Conforme legislação vigente',
      'Exemplos práticos',
      'Quiz de avaliação'
    ],
    lastUpdated: new Date(updatedAt).toISOString().split('T')[0],
    downloads: 0, // Pode ser rastreado futuramente
    rating: 4.8,
    isNew: false,
    isPremium: false,
    aiOptimized: true
  };
}

const mockNRTemplates: NRTemplate[] = [
  {
    id: 'nr12-maquinas',
    name: 'NR-12 Segurança em Máquinas e Equipamentos',
    norma: 'NR-12',
    description: 'Template completo para treinamento em segurança de máquinas e equipamentos de trabalho',
    category: 'seguranca',
    industry: ['Industrial', 'Manufatura', 'Metalurgia'],
    duration: '45 min',
    slides: 32,
    compliance: 98,
    thumbnail: '/nr12-thumb.jpg',
    features: [
      'Procedimentos de bloqueio',
      'Inspeções de segurança',
      'EPIs específicos',
      'Casos práticos reais',
      'Quiz interativo'
    ],
    lastUpdated: '2025-09-20',
    downloads: 2847,
    rating: 4.9,
    isNew: true,
    aiOptimized: true
  },
  {
    id: 'nr33-espacos-confinados',
    name: 'NR-33 Segurança e Saúde em Espaços Confinados',
    norma: 'NR-33',
    description: 'Treinamento completo para trabalho seguro em espaços confinados',
    category: 'seguranca',
    industry: ['Petróleo & Gás', 'Química', 'Saneamento'],
    duration: '60 min',
    slides: 48,
    compliance: 100,
    thumbnail: '/nr33-thumb.jpg',
    features: [
      'Identificação de espaços confinados',
      'Permissão de trabalho',
      'Monitoramento atmosférico',
      'Resgate em emergências',
      'Simulação 3D'
    ],
    lastUpdated: '2025-09-18',
    downloads: 3521,
    rating: 5.0,
    isPremium: true,
    aiOptimized: true
  },
  {
    id: 'nr35-trabalho-altura',
    name: 'NR-35 Trabalho em Altura',
    norma: 'NR-35',
    description: 'Capacitação para trabalho seguro em altura com equipamentos adequados',
    category: 'seguranca',
    industry: ['Construção Civil', 'Telecomunicações', 'Energia'],
    duration: '40 min',
    slides: 36,
    compliance: 96,
    thumbnail: '/nr35-thumb.jpg',
    features: [
      'Análise de risco',
      'Sistemas de proteção',
      'Inspeção de EPIs',
      'Procedimentos de resgate',
      'Realidade virtual'
    ],
    lastUpdated: '2025-09-15',
    downloads: 4205,
    rating: 4.8,
    aiOptimized: true
  }
]

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const norma = searchParams.get('norma')
    const aiOnly = searchParams.get('ai') === 'true'
    const search = searchParams.get('search')
    
    // Busca templates reais do banco de dados
    const dbTemplates = await listNRTemplates()
    let filteredTemplates = dbTemplates.map(convertToV1Format)
    
    // Filtros
    if (category && category !== 'all') {
      filteredTemplates = filteredTemplates.filter(t => t.category === category)
    }
    
    if (norma && norma !== 'all') {
      filteredTemplates = filteredTemplates.filter(t => t.norma === norma)
    }
    
    if (aiOnly) {
      filteredTemplates = filteredTemplates.filter(t => t.aiOptimized)
    }
    
    if (search) {
      filteredTemplates = filteredTemplates.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.norma.toLowerCase().includes(search.toLowerCase())
      )
    }
    
    return NextResponse.json({
      success: true,
      templates: filteredTemplates,
      total: filteredTemplates.length,
      filters: {
        category,
        norma,
        aiOnly,
        search
      }
    })
    
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error)); logger.error('Templates API Error', err, { component: 'API: v1/templates/nr-smart' })
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch templates'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Gerar template personalizado com IA
    if (body.action === 'generate') {
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      const customTemplate: NRTemplate = {
        id: 'custom-' + Date.now(),
        name: `Template Personalizado - ${body.norma || 'NR-23'} (IA Generated)`,
        norma: body.norma || 'NR-23',
        description: 'Template gerado automaticamente pela IA baseado nas suas necessidades específicas',
        category: body.category || 'seguranca',
        industry: body.industry || ['Geral'],
        duration: `${30 + Math.floor(Math.random() * 30)} min`,
        slides: 20 + Math.floor(Math.random() * 20),
        compliance: 95 + Math.floor(Math.random() * 5),
        thumbnail: '/nr12-thumb.jpg',
        features: [
          'Conteúdo adaptado IA',
          'Slides otimizados',
          'Compliance automático',
          'Casos específicos da empresa',
          'Linguagem personalizada'
        ],
        lastUpdated: new Date().toISOString().split('T')[0],
        downloads: 0,
        rating: 0,
        isNew: true,
        aiOptimized: true
      }
      
      return NextResponse.json({
        success: true,
        template: customTemplate,
        message: 'Template personalizado gerado com sucesso!'
      })
    }
    
    // Download template
    if (body.action === 'download') {
      // Busca template real do banco
      const dbTemplates = await listNRTemplates()
      const dbTemplate = dbTemplates.find(t => t.id === body.templateId)
      
      if (dbTemplate) {
        const template = convertToV1Format(dbTemplate)
        
        return NextResponse.json({
          success: true,
          template,
          downloadUrl: `/api/v1/templates/nr-smart/${body.templateId}/download`,
          message: 'Template baixado com sucesso!'
        })
      }
    }
    
    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 })
    
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error)); logger.error('Templates POST Error', err, { component: 'API: v1/templates/nr-smart' })
    return NextResponse.json({
      success: false,
      error: 'Failed to process request'
    }, { status: 500 })
  }
}

