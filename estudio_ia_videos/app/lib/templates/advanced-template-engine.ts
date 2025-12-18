/**
 * Advanced Template Engine
 * Sistema avançado de templates com suporte a variáveis dinâmicas,
 * condicionais, loops e composição
 */

import { logger } from '@/lib/logger';
import { createClient } from '@supabase/supabase-js';

// ==============================================
// TIPOS
// ==============================================

export interface TemplateVariable {
  name: string;
  type: 'text' | 'image' | 'video' | 'color' | 'number' | 'boolean' | 'array';
  required: boolean;
  defaultValue?: unknown;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[];
  };
}

export interface TemplateCondition {
  variable: string;
  operator: 'equals' | 'not_equals' | 'greater' | 'less' | 'contains' | 'exists';
  value: unknown;
}

export interface TemplateSlide {
  id: string;
  order: number;
  layout: string;
  elements: TemplateElement[];
  conditions?: TemplateCondition[];
  animations?: SlideAnimation[];
  duration: number;
}

export interface TemplateElement {
  id: string;
  type: 'text' | 'image' | 'video' | 'shape' | 'chart' | 'avatar';
  position: { x: number; y: number; width: number; height: number };
  properties: Record<string, unknown>;
  variable?: string; // Vincula a uma variável do template
  style?: {
    fontFamily?: string;
    fontSize?: number;
    color?: string;
    backgroundColor?: string;
    borderRadius?: number;
    opacity?: number;
  };
}

export interface SlideAnimation {
  elementId: string;
  type: 'fade' | 'slide' | 'zoom' | 'rotate' | 'bounce' | 'custom';
  duration: number;
  delay: number;
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  properties: Record<string, unknown>;
}

export interface AdvancedTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  thumbnail: string;
  variables: TemplateVariable[];
  slides: TemplateSlide[];
  theme: {
    colors: string[];
    fonts: string[];
    styles: Record<string, unknown>;
  };
  metadata: {
    author: string;
    version: string;
    createdAt: string;
    updatedAt: string;
    usageCount: number;
  };
}

export interface TemplateRenderOptions {
  variables: Record<string, unknown>;
  outputFormat?: 'pptx' | 'pdf' | 'video' | 'html';
  quality?: 'low' | 'medium' | 'high' | 'ultra';
  includeAnimations?: boolean;
  watermark?: {
    text: string;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    opacity: number;
  };
}

// ==============================================
// TEMPLATE ENGINE
// ==============================================

export class AdvancedTemplateEngine {
  private supabase;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Lista todos os templates disponíveis
   */
  async listTemplates(filters?: {
    category?: string;
    tags?: string[];
    search?: string;
  }): Promise<AdvancedTemplate[]> {
    try {
      let query = this.supabase
        .from('advanced_templates')
        .select('*')
        .order('metadata->usageCount', { ascending: false });

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags);
      }

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error listing templates', error, { component: 'AdvancedTemplateEngine' });
        return [];
      }

      return data as AdvancedTemplate[];
    } catch (error) {
      logger.error('Error in listTemplates', error instanceof Error ? error : new Error(String(error)), {
        component: 'AdvancedTemplateEngine'
      });
      return [];
    }
  }

  /**
   * Obtém um template específico
   */
  async getTemplate(templateId: string): Promise<AdvancedTemplate | null> {
    try {
      const { data, error } = await this.supabase
        .from('advanced_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) {
        logger.error('Error getting template', error, { component: 'AdvancedTemplateEngine', templateId });
        return null;
      }

      return data as AdvancedTemplate;
    } catch (error) {
      logger.error('Error in getTemplate', error instanceof Error ? error : new Error(String(error)), {
        component: 'AdvancedTemplateEngine',
        templateId
      });
      return null;
    }
  }

  /**
   * Valida as variáveis fornecidas contra o schema do template
   */
  validateVariables(
    template: AdvancedTemplate,
    variables: Record<string, unknown>
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const varDef of template.variables) {
      const value = variables[varDef.name];

      // Check required
      if (varDef.required && (value === undefined || value === null)) {
        errors.push(`Variable "${varDef.name}" is required`);
        continue;
      }

      // Skip validation if optional and not provided
      if (!varDef.required && (value === undefined || value === null)) {
        continue;
      }

      // Type validation
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== varDef.type && varDef.type !== 'array') {
        errors.push(`Variable "${varDef.name}" must be of type ${varDef.type}, got ${actualType}`);
        continue;
      }

      // Additional validations
      if (varDef.validation) {
        const val = varDef.validation;

        // Number validations
        if (varDef.type === 'number' && typeof value === 'number') {
          if (val.min !== undefined && value < val.min) {
            errors.push(`Variable "${varDef.name}" must be >= ${val.min}`);
          }
          if (val.max !== undefined && value > val.max) {
            errors.push(`Variable "${varDef.name}" must be <= ${val.max}`);
          }
        }

        // String validations
        if (varDef.type === 'text' && typeof value === 'string') {
          if (val.pattern) {
            const regex = new RegExp(val.pattern);
            if (!regex.test(value)) {
              errors.push(`Variable "${varDef.name}" does not match required pattern`);
            }
          }
          if (val.options && !val.options.includes(value)) {
            errors.push(`Variable "${varDef.name}" must be one of: ${val.options.join(', ')}`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Processa condições para determinar se um slide deve ser incluído
   */
  private evaluateConditions(conditions: TemplateCondition[], variables: Record<string, unknown>): boolean {
    if (!conditions || conditions.length === 0) return true;

    return conditions.every(condition => {
      const value = variables[condition.variable];

      switch (condition.operator) {
        case 'equals':
          return value === condition.value;
        case 'not_equals':
          return value !== condition.value;
        case 'greater':
          return typeof value === 'number' && value > (condition.value as number);
        case 'less':
          return typeof value === 'number' && value < (condition.value as number);
        case 'contains':
          return typeof value === 'string' && value.includes(String(condition.value));
        case 'exists':
          return value !== undefined && value !== null;
        default:
          return true;
      }
    });
  }

  /**
   * Substitui variáveis nos elementos do slide
   */
  private substituteVariables(element: TemplateElement, variables: Record<string, unknown>): TemplateElement {
    if (!element.variable) return element;

    const value = variables[element.variable];
    if (value === undefined) return element;

    // Clone element
    const newElement = { ...element };

    // Substitute based on element type
    switch (element.type) {
      case 'text':
        newElement.properties = {
          ...newElement.properties,
          content: String(value)
        };
        break;
      case 'image':
      case 'video':
        newElement.properties = {
          ...newElement.properties,
          src: String(value)
        };
        break;
      case 'chart':
        newElement.properties = {
          ...newElement.properties,
          data: value
        };
        break;
    }

    return newElement;
  }

  /**
   * Renderiza um template com as variáveis fornecidas
   */
  async renderTemplate(
    templateId: string,
    options: TemplateRenderOptions
  ): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      // Get template
      const template = await this.getTemplate(templateId);
      if (!template) {
        return { success: false, error: 'Template not found' };
      }

      // Validate variables
      const validation = this.validateVariables(template, options.variables);
      if (!validation.valid) {
        return { success: false, error: `Validation failed: ${validation.errors.join(', ')}` };
      }

      // Process slides
      const processedSlides: TemplateSlide[] = [];

      for (const slide of template.slides) {
        // Check conditions
        if (slide.conditions && !this.evaluateConditions(slide.conditions, options.variables)) {
          logger.debug('Skipping slide due to conditions', { slideId: slide.id });
          continue;
        }

        // Process elements
        const processedElements = slide.elements.map(element =>
          this.substituteVariables(element, options.variables)
        );

        processedSlides.push({
          ...slide,
          elements: processedElements
        });
      }

      // Increment usage count
      await this.supabase
        .from('advanced_templates')
        .update({
          metadata: {
            ...template.metadata,
            usageCount: template.metadata.usageCount + 1
          }
        })
        .eq('id', templateId);

      logger.info('Template rendered successfully', {
        component: 'AdvancedTemplateEngine',
        templateId,
        slidesCount: processedSlides.length
      });

      return {
        success: true,
        data: {
          template: {
            ...template,
            slides: processedSlides
          },
          options
        }
      };
    } catch (error) {
      logger.error('Error rendering template', error instanceof Error ? error : new Error(String(error)), {
        component: 'AdvancedTemplateEngine',
        templateId
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Cria um novo template
   */
  async createTemplate(template: Omit<AdvancedTemplate, 'id'>): Promise<string | null> {
    try {
      const { data, error } = await this.supabase
        .from('advanced_templates')
        .insert({
          ...template,
          metadata: {
            ...template.metadata,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            usageCount: 0
          }
        })
        .select('id')
        .single();

      if (error) {
        logger.error('Error creating template', error, { component: 'AdvancedTemplateEngine' });
        return null;
      }

      return data.id;
    } catch (error) {
      logger.error('Error in createTemplate', error instanceof Error ? error : new Error(String(error)), {
        component: 'AdvancedTemplateEngine'
      });
      return null;
    }
  }

  /**
   * Duplica um template existente
   */
  async duplicateTemplate(templateId: string, newName: string): Promise<string | null> {
    try {
      const template = await this.getTemplate(templateId);
      if (!template) return null;

      const { id, ...templateWithoutId } = template;

      return await this.createTemplate({
        ...templateWithoutId,
        name: newName,
        metadata: {
          ...template.metadata,
          author: 'Duplicated from ' + template.name,
          version: '1.0.0'
        }
      });
    } catch (error) {
      logger.error('Error duplicating template', error instanceof Error ? error : new Error(String(error)), {
        component: 'AdvancedTemplateEngine',
        templateId
      });
      return null;
    }
  }
}

// Export singleton
export const advancedTemplateEngine = new AdvancedTemplateEngine();
