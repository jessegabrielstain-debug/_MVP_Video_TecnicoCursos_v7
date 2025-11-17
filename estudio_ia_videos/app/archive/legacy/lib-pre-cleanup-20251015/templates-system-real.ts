/**
 * TEMPLATES SYSTEM - Implementação Real
 * 
 * Sistema completo de templates pré-configurados para vídeos
 * Permite criar, editar, compartilhar e usar templates
 * Integrado com database para persistência
 * 
 * @created 2025-10-07
 * @version 2.0.0
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Tipos
export interface Template {
  id: string
  name: string
  description?: string
  category: TemplateCategory
  type: TemplateType
  thumbnail?: string
  previewUrl?: string
  config: TemplateConfig
  tags: string[]
  isPremium: boolean
  isPublic: boolean
  usage: number
  rating: number
  userId?: string
  organizationId?: string
  createdAt: Date
  updatedAt: Date
}

export type TemplateCategory = 
  | 'corporate' 
  | 'education' 
  | 'marketing' 
  | 'social' 
  | 'tutorial' 
  | 'presentation'
  | 'announcement'
  | 'training'

export type TemplateType = 
  | 'video' 
  | 'slide' 
  | 'intro' 
  | 'outro' 
  | 'full-project'

export interface TemplateConfig {
  duration: number
  resolution: string
  fps: number
  backgroundColor?: string
  scenes: TemplateScene[]
  assets: TemplateAsset[]
  styles: TemplateStyles
  customFields?: CustomField[]
}

export interface TemplateScene {
  id: string
  duration: number
  layout: SceneLayout
  elements: SceneElement[]
  transition?: Transition
  animation?: Animation
}

export type SceneLayout = 
  | 'full-screen'
  | 'split-horizontal'
  | 'split-vertical'
  | 'picture-in-picture'
  | 'grid-2x2'
  | 'grid-3x3'

export interface SceneElement {
  id: string
  type: 'text' | 'image' | 'video' | 'shape' | 'logo' | 'avatar'
  position: { x: number; y: number }
  size: { width: number; height: number }
  style?: ElementStyle
  content?: any
  animation?: Animation
  isEditable: boolean
}

export interface ElementStyle {
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
  borderRadius?: number
  opacity?: number
  shadow?: Shadow
}

export interface Shadow {
  x: number
  y: number
  blur: number
  color: string
}

export interface TemplateAsset {
  id: string
  type: 'image' | 'video' | 'audio' | 'font'
  placeholder: boolean
  defaultUrl?: string
  requirements?: AssetRequirements
}

export interface AssetRequirements {
  minWidth?: number
  minHeight?: number
  maxDuration?: number
  format?: string[]
}

export interface TemplateStyles {
  primaryColor: string
  secondaryColor: string
  fontFamily: string
  fontSize: {
    heading: number
    body: number
    caption: number
  }
}

export interface Transition {
  type: 'fade' | 'slide' | 'zoom' | 'dissolve' | 'wipe'
  duration: number
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'
}

export interface Animation {
  type: 'fade-in' | 'slide-in' | 'zoom-in' | 'bounce' | 'rotate'
  duration: number
  delay: number
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'
}

export interface CustomField {
  id: string
  name: string
  type: 'text' | 'image' | 'color' | 'number'
  label: string
  placeholder?: string
  defaultValue?: any
  required: boolean
}

export interface SearchFilters {
  category?: TemplateCategory
  type?: TemplateType
  tags?: string[]
  isPremium?: boolean
  isPublic?: boolean
  minRating?: number
}

/**
 * Classe principal do sistema de templates
 */
class TemplatesSystemReal {
  
  /**
   * Busca templates com filtros
   */
  async searchTemplates(
    filters: SearchFilters = {},
    page: number = 1,
    perPage: number = 20
  ) {
    const skip = (page - 1) * perPage

    const where: any = {}

    if (filters.category) {
      where.category = filters.category
    }

    if (filters.type) {
      where.type = filters.type
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = {
        hasSome: filters.tags
      }
    }

    if (filters.isPremium !== undefined) {
      where.isPremium = filters.isPremium
    }

    if (filters.isPublic !== undefined) {
      where.isPublic = filters.isPublic
    }

    if (filters.minRating) {
      where.rating = {
        gte: filters.minRating
      }
    }

    const [templates, total] = await Promise.all([
      prisma.template.findMany({
        where,
        skip,
        take: perPage,
        orderBy: [
          { usage: 'desc' },
          { rating: 'desc' },
          { createdAt: 'desc' }
        ]
      }),
      prisma.template.count({ where })
    ])

    return {
      templates,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage)
    }
  }

  /**
   * Obtém um template por ID
   */
  async getTemplate(id: string) {
    const template = await prisma.template.findUnique({
      where: { id }
    })

    if (!template) {
      throw new Error('Template não encontrado')
    }

    // Incrementar contador de uso
    await prisma.template.update({
      where: { id },
      data: { usage: { increment: 1 } }
    })

    return template
  }

  /**
   * Cria um novo template
   */
  async createTemplate(
    data: Omit<Template, 'id' | 'usage' | 'rating' | 'createdAt' | 'updatedAt'>,
    userId?: string,
    organizationId?: string
  ) {
    const template = await prisma.template.create({
      data: {
        ...data,
        usage: 0,
        rating: 0,
        userId,
        organizationId,
        config: data.config as any
      }
    })

    return template
  }

  /**
   * Atualiza um template existente
   */
  async updateTemplate(
    id: string,
    data: Partial<Omit<Template, 'id' | 'createdAt' | 'updatedAt'>>,
    userId?: string
  ) {
    // Verificar se o usuário tem permissão
    const existing = await prisma.template.findUnique({
      where: { id }
    })

    if (!existing) {
      throw new Error('Template não encontrado')
    }

    if (existing.userId && existing.userId !== userId) {
      throw new Error('Sem permissão para editar este template')
    }

    const template = await prisma.template.update({
      where: { id },
      data: {
        ...data,
        config: data.config as any,
        updatedAt: new Date()
      }
    })

    return template
  }

  /**
   * Deleta um template
   */
  async deleteTemplate(id: string, userId?: string) {
    const existing = await prisma.template.findUnique({
      where: { id }
    })

    if (!existing) {
      throw new Error('Template não encontrado')
    }

    if (existing.userId && existing.userId !== userId) {
      throw new Error('Sem permissão para deletar este template')
    }

    await prisma.template.delete({
      where: { id }
    })

    return { success: true }
  }

  /**
   * Duplica um template
   */
  async duplicateTemplate(id: string, userId?: string, organizationId?: string) {
    const original = await this.getTemplate(id)

    const duplicate = await this.createTemplate({
      name: `${original.name} (Cópia)`,
      description: original.description,
      category: original.category as TemplateCategory,
      type: original.type as TemplateType,
      thumbnail: original.thumbnail,
      config: original.config as TemplateConfig,
      tags: original.tags,
      isPremium: false, // Cópias não são premium
      isPublic: false, // Cópias são privadas por padrão
    }, userId, organizationId)

    return duplicate
  }

  /**
   * Aplica um template a um projeto
   */
  async applyTemplateToProject(
    templateId: string,
    projectId: string,
    customizations?: Record<string, unknown>
  ) {
    const template = await this.getTemplate(templateId)
    const config = template.config as TemplateConfig

    // Aplicar customizações aos campos personalizáveis
    if (customizations && config.customFields) {
      config.customFields.forEach(field => {
        if (customizations[field.id] !== undefined) {
          // Atualizar elementos da cena que usam este campo
          config.scenes.forEach(scene => {
            scene.elements.forEach(element => {
              if (element.isEditable && element.content?.fieldId === field.id) {
                element.content.value = customizations[field.id]
              }
            })
          })
        }
      })
    }

    // Atualizar projeto com a configuração do template
    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        config: config as any,
        templateId: templateId,
        updatedAt: new Date()
      }
    })

    return project
  }

  /**
   * Avalia um template
   */
  async rateTemplate(templateId: string, rating: number, userId: string) {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating deve estar entre 1 e 5')
    }

    // Salvar avaliação individual
    await prisma.templateRating.create({
      data: {
        templateId,
        userId,
        rating
      }
    })

    // Calcular nova média
    const ratings = await prisma.templateRating.findMany({
      where: { templateId },
      select: { rating: true }
    })

    const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length

    // Atualizar template
    await prisma.template.update({
      where: { id: templateId },
      data: { rating: Math.round(avgRating * 10) / 10 }
    })

    return { rating: avgRating }
  }

  /**
   * Obtém templates populares
   */
  async getPopularTemplates(limit: number = 10) {
    const templates = await prisma.template.findMany({
      where: { isPublic: true },
      orderBy: [
        { usage: 'desc' },
        { rating: 'desc' }
      ],
      take: limit
    })

    return templates
  }

  /**
   * Obtém templates recentes
   */
  async getRecentTemplates(limit: number = 10) {
    const templates = await prisma.template.findMany({
      where: { isPublic: true },
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    return templates
  }

  /**
   * Obtém templates do usuário
   */
  async getUserTemplates(userId: string) {
    const templates = await prisma.template.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' }
    })

    return templates
  }

  /**
   * Obtém templates da organização
   */
  async getOrganizationTemplates(organizationId: string) {
    const templates = await prisma.template.findMany({
      where: { organizationId },
      orderBy: { updatedAt: 'desc' }
    })

    return templates
  }
}

/**
 * Templates pré-configurados de exemplo
 */
export const PRESET_TEMPLATES = {
  // Template corporativo
  corporate: {
    name: 'Apresentação Corporativa',
    description: 'Template profissional para apresentações empresariais',
    category: 'corporate' as TemplateCategory,
    type: 'full-project' as TemplateType,
    isPremium: false,
    isPublic: true,
    tags: ['corporate', 'business', 'professional'],
    config: {
      duration: 30,
      resolution: '1920x1080',
      fps: 30,
      backgroundColor: '#ffffff',
      scenes: [
        {
          id: 'intro',
          duration: 5,
          layout: 'full-screen' as SceneLayout,
          elements: [
            {
              id: 'logo',
              type: 'logo' as const,
              position: { x: 50, y: 50 },
              size: { width: 200, height: 200 },
              isEditable: true,
              animation: {
                type: 'fade-in' as const,
                duration: 1,
                delay: 0,
                easing: 'ease-in' as const
              }
            },
            {
              id: 'title',
              type: 'text' as const,
              position: { x: 50, y: 300 },
              size: { width: 800, height: 100 },
              content: { text: 'Título da Apresentação', fieldId: 'title' },
              isEditable: true,
              animation: {
                type: 'slide-in' as const,
                duration: 1,
                delay: 0.5,
                easing: 'ease-out' as const
              }
            }
          ],
          transition: {
            type: 'fade' as const,
            duration: 0.5,
            easing: 'ease-in-out' as const
          }
        }
      ],
      assets: [],
      styles: {
        primaryColor: '#0066cc',
        secondaryColor: '#ffffff',
        fontFamily: 'Roboto',
        fontSize: {
          heading: 48,
          body: 24,
          caption: 16
        }
      },
      customFields: [
        {
          id: 'title',
          name: 'title',
          type: 'text' as const,
          label: 'Título',
          placeholder: 'Digite o título...',
          required: true
        }
      ]
    }
  },

  // Template educacional
  education: {
    name: 'Aula de Treinamento',
    description: 'Template para vídeos educacionais e treinamentos',
    category: 'education' as TemplateCategory,
    type: 'full-project' as TemplateType,
    isPremium: false,
    isPublic: true,
    tags: ['education', 'training', 'tutorial'],
    config: {
      duration: 60,
      resolution: '1920x1080',
      fps: 30,
      backgroundColor: '#f5f5f5',
      scenes: [
        {
          id: 'intro',
          duration: 8,
          layout: 'split-horizontal' as SceneLayout,
          elements: [
            {
              id: 'avatar',
              type: 'avatar' as const,
              position: { x: 100, y: 100 },
              size: { width: 400, height: 600 },
              isEditable: true
            },
            {
              id: 'content',
              type: 'text' as const,
              position: { x: 600, y: 200 },
              size: { width: 1200, height: 600 },
              content: { text: 'Conteúdo da aula', fieldId: 'content' },
              isEditable: true
            }
          ]
        }
      ],
      assets: [],
      styles: {
        primaryColor: '#4CAF50',
        secondaryColor: '#ffffff',
        fontFamily: 'Open Sans',
        fontSize: {
          heading: 40,
          body: 20,
          caption: 14
        }
      },
      customFields: [
        {
          id: 'content',
          name: 'content',
          type: 'text' as const,
          label: 'Conteúdo',
          required: true
        }
      ]
    }
  }
}

// Instância singleton
export const templatesSystem = new TemplatesSystemReal()

export default TemplatesSystemReal
