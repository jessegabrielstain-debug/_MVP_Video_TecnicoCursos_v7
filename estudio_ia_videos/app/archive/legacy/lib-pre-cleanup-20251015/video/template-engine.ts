/**
 * Video Template Engine
 * 
 * Sistema completo de templates de vídeo com:
 * - Parsing de templates com variáveis
 * - Placeholder replacement (texto, imagens, vídeos)
 * - Animações pré-definidas
 * - Batch rendering
 * - Validação de templates
 * - Export multi-formato
 * 
 * @module VideoTemplateEngine
 */

import { EventEmitter } from 'events';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

/**
 * Tipo de placeholder
 */
export type PlaceholderType = 'text' | 'image' | 'video' | 'audio' | 'shape' | 'animation';

/**
 * Tipo de animação
 */
export type AnimationType = 
  | 'fade-in' 
  | 'fade-out' 
  | 'slide-left' 
  | 'slide-right' 
  | 'slide-up' 
  | 'slide-down'
  | 'zoom-in' 
  | 'zoom-out' 
  | 'rotate' 
  | 'bounce'
  | 'none';

/**
 * Status do template
 */
export type TemplateStatus = 'draft' | 'valid' | 'invalid' | 'rendering' | 'rendered' | 'error';

/**
 * Formato de export
 */
export type ExportFormat = 'mp4' | 'webm' | 'mov' | 'avi' | 'json';

/**
 * Placeholder em um template
 */
export interface TemplatePlaceholder {
  id: string;
  name: string;
  type: PlaceholderType;
  required: boolean;
  defaultValue?: any;
  x: number;
  y: number;
  width: number;
  height: number;
  startTime: number;
  duration: number;
  animation?: AnimationType;
  animationDuration?: number;
  style?: PlaceholderStyle;
  metadata?: Record<string, unknown>;
}

/**
 * Estilo de placeholder
 */
export interface PlaceholderStyle {
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  color?: string;
  backgroundColor?: string;
  borderRadius?: number;
  opacity?: number;
  zIndex?: number;
  textAlign?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
}

/**
 * Template de vídeo
 */
export interface VideoTemplate {
  id: string;
  name: string;
  description?: string;
  width: number;
  height: number;
  fps: number;
  duration: number;
  backgroundColor: string;
  placeholders: TemplatePlaceholder[];
  variables: Record<string, unknown>;
  status: TemplateStatus;
  version: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Dados para preencher um template
 */
export interface TemplateData {
  [placeholderId: string]: any;
}

/**
 * Resultado de validação
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Erro de validação
 */
export interface ValidationError {
  placeholderId: string;
  message: string;
  type: 'missing' | 'invalid-type' | 'invalid-value' | 'constraint';
}

/**
 * Aviso de validação
 */
export interface ValidationWarning {
  placeholderId: string;
  message: string;
  type: 'using-default' | 'performance' | 'quality';
}

/**
 * Configuração de rendering
 */
export interface RenderConfig {
  format: ExportFormat;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  codec?: string;
  bitrate?: number;
  outputPath: string;
  backgroundColor?: string;
  includeAudio?: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Resultado de rendering
 */
export interface RenderResult {
  templateId: string;
  success: boolean;
  outputPath?: string;
  duration?: number;
  fileSize?: number;
  error?: string;
  warnings?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Configuração do Template Engine
 */
export interface TemplateEngineConfig {
  maxTemplateSize: number;
  maxPlaceholders: number;
  defaultFps: number;
  defaultDuration: number;
  validateOnCreate: boolean;
  cacheTemplates: boolean;
  tempDirectory: string;
}

/**
 * Estatísticas do engine
 */
export interface TemplateEngineStats {
  totalTemplates: number;
  validTemplates: number;
  invalidTemplates: number;
  renderedTemplates: number;
  totalRenders: number;
  averageRenderTime: number;
  cacheHits: number;
  cacheMisses: number;
}

// =============================================================================
// TEMPLATE ENGINE CLASS
// =============================================================================

/**
 * Motor de templates de vídeo
 */
export class VideoTemplateEngine extends EventEmitter {
  private templates: Map<string, VideoTemplate>;
  private cache: Map<string, any>;
  private config: TemplateEngineConfig;
  private stats: TemplateEngineStats;
  private renderTimes: number[];
  private nextTemplateId: number;

  constructor(config?: Partial<TemplateEngineConfig>) {
    super();

    this.templates = new Map();
    this.cache = new Map();
    this.nextTemplateId = 1;
    this.renderTimes = [];

    // Configuração padrão
    this.config = {
      maxTemplateSize: 4096 * 4096,
      maxPlaceholders: 50,
      defaultFps: 30,
      defaultDuration: 10,
      validateOnCreate: true,
      cacheTemplates: true,
      tempDirectory: './temp',
      ...config,
    };

    // Inicializar estatísticas
    this.stats = {
      totalTemplates: 0,
      validTemplates: 0,
      invalidTemplates: 0,
      renderedTemplates: 0,
      totalRenders: 0,
      averageRenderTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };
  }

  // ===========================================================================
  // TEMPLATE MANAGEMENT
  // ===========================================================================

  /**
   * Cria um novo template
   */
  createTemplate(
    name: string,
    width: number,
    height: number,
    options?: {
      description?: string;
      fps?: number;
      duration?: number;
      backgroundColor?: string;
      metadata?: Record<string, unknown>;
    }
  ): string {
    const templateId = `template-${this.nextTemplateId++}`;

    const template: VideoTemplate = {
      id: templateId,
      name,
      description: options?.description,
      width,
      height,
      fps: options?.fps || this.config.defaultFps,
      duration: options?.duration || this.config.defaultDuration,
      backgroundColor: options?.backgroundColor || '#000000',
      placeholders: [],
      variables: {},
      status: 'draft',
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: options?.metadata,
    };

    this.templates.set(templateId, template);
    this.stats.totalTemplates++;

    if (this.config.validateOnCreate) {
      const validation = this.validateTemplate(templateId);
      template.status = validation.valid ? 'valid' : 'invalid';
      
      if (validation.valid) {
        this.stats.validTemplates++;
      } else {
        this.stats.invalidTemplates++;
      }
    }

    this.emit('template:created', template);
    return templateId;
  }

  /**
   * Obtém um template
   */
  getTemplate(templateId: string): VideoTemplate | undefined {
    return this.templates.get(templateId);
  }

  /**
   * Obtém todos os templates
   */
  getAllTemplates(): VideoTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Obtém templates por status
   */
  getTemplatesByStatus(status: TemplateStatus): VideoTemplate[] {
    return this.getAllTemplates().filter((t) => t.status === status);
  }

  /**
   * Atualiza um template
   */
  updateTemplate(
    templateId: string,
    updates: Partial<Omit<VideoTemplate, 'id' | 'createdAt'>>
  ): boolean {
    const template = this.templates.get(templateId);
    if (!template) return false;

    Object.assign(template, updates, {
      updatedAt: new Date(),
    });

    // Revalidar se necessário
    if (this.config.validateOnCreate) {
      const validation = this.validateTemplate(templateId);
      const oldStatus = template.status;
      template.status = validation.valid ? 'valid' : 'invalid';

      // Atualizar estatísticas
      if (oldStatus === 'valid' && template.status === 'invalid') {
        this.stats.validTemplates--;
        this.stats.invalidTemplates++;
      } else if (oldStatus === 'invalid' && template.status === 'valid') {
        this.stats.invalidTemplates--;
        this.stats.validTemplates++;
      }
    }

    this.emit('template:updated', template);
    return true;
  }

  /**
   * Deleta um template
   */
  deleteTemplate(templateId: string): boolean {
    const template = this.templates.get(templateId);
    if (!template) return false;

    this.templates.delete(templateId);
    this.cache.delete(templateId);
    this.stats.totalTemplates--;

    if (template.status === 'valid') {
      this.stats.validTemplates--;
    } else if (template.status === 'invalid') {
      this.stats.invalidTemplates--;
    }

    this.emit('template:deleted', { templateId });
    return true;
  }

  /**
   * Duplica um template
   */
  duplicateTemplate(templateId: string, newName?: string): string | null {
    const template = this.templates.get(templateId);
    if (!template) return null;

    const newTemplateId = `template-${this.nextTemplateId++}`;
    const newTemplate: VideoTemplate = {
      ...template,
      id: newTemplateId,
      name: newName || `${template.name} (copy)`,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
      placeholders: template.placeholders.map((p) => ({ ...p })),
      variables: { ...template.variables },
    };

    this.templates.set(newTemplateId, newTemplate);
    this.stats.totalTemplates++;

    this.emit('template:duplicated', { originalId: templateId, newId: newTemplateId });
    return newTemplateId;
  }

  // ===========================================================================
  // PLACEHOLDER MANAGEMENT
  // ===========================================================================

  /**
   * Adiciona um placeholder ao template
   */
  addPlaceholder(
    templateId: string,
    placeholder: Omit<TemplatePlaceholder, 'id'>
  ): string | null {
    const template = this.templates.get(templateId);
    if (!template) return null;

    if (template.placeholders.length >= this.config.maxPlaceholders) {
      this.emit('error', {
        type: 'max-placeholders',
        message: `Template já tem o máximo de ${this.config.maxPlaceholders} placeholders`,
      });
      return null;
    }

    const placeholderId = `placeholder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newPlaceholder: TemplatePlaceholder = {
      ...placeholder,
      id: placeholderId,
    };

    template.placeholders.push(newPlaceholder);
    template.updatedAt = new Date();

    this.emit('placeholder:added', { templateId, placeholder: newPlaceholder });
    return placeholderId;
  }

  /**
   * Atualiza um placeholder
   */
  updatePlaceholder(
    templateId: string,
    placeholderId: string,
    updates: Partial<Omit<TemplatePlaceholder, 'id'>>
  ): boolean {
    const template = this.templates.get(templateId);
    if (!template) return false;

    const placeholder = template.placeholders.find((p) => p.id === placeholderId);
    if (!placeholder) return false;

    Object.assign(placeholder, updates);
    template.updatedAt = new Date();

    this.emit('placeholder:updated', { templateId, placeholderId, placeholder });
    return true;
  }

  /**
   * Remove um placeholder
   */
  removePlaceholder(templateId: string, placeholderId: string): boolean {
    const template = this.templates.get(templateId);
    if (!template) return false;

    const index = template.placeholders.findIndex((p) => p.id === placeholderId);
    if (index === -1) return false;

    template.placeholders.splice(index, 1);
    template.updatedAt = new Date();

    this.emit('placeholder:removed', { templateId, placeholderId });
    return true;
  }

  /**
   * Obtém placeholders de um template
   */
  getPlaceholders(templateId: string): TemplatePlaceholder[] {
    const template = this.templates.get(templateId);
    return template ? template.placeholders : [];
  }

  /**
   * Obtém placeholders por tipo
   */
  getPlaceholdersByType(templateId: string, type: PlaceholderType): TemplatePlaceholder[] {
    return this.getPlaceholders(templateId).filter((p) => p.type === type);
  }

  // ===========================================================================
  // VALIDATION
  // ===========================================================================

  /**
   * Valida um template
   */
  validateTemplate(templateId: string, data?: TemplateData): ValidationResult {
    const template = this.templates.get(templateId);
    if (!template) {
      return {
        valid: false,
        errors: [
          {
            placeholderId: '',
            message: 'Template não encontrado',
            type: 'missing',
          },
        ],
        warnings: [],
      };
    }

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validar dimensões
    const totalPixels = template.width * template.height;
    if (totalPixels > this.config.maxTemplateSize) {
      errors.push({
        placeholderId: '',
        message: `Dimensões do template excedem o limite (${this.config.maxTemplateSize} pixels)`,
        type: 'constraint',
      });
    }

    // Validar placeholders
    template.placeholders.forEach((placeholder) => {
      // Verificar placeholders requeridos
      if (placeholder.required && data && !data[placeholder.id]) {
        if (!placeholder.defaultValue) {
          errors.push({
            placeholderId: placeholder.id,
            message: `Placeholder "${placeholder.name}" é obrigatório mas não foi fornecido`,
            type: 'missing',
          });
        } else {
          warnings.push({
            placeholderId: placeholder.id,
            message: `Usando valor padrão para "${placeholder.name}"`,
            type: 'using-default',
          });
        }
      }

      // Validar tipo de dado se fornecido
      if (data && data[placeholder.id]) {
        const value = data[placeholder.id];
        const valid = this.validatePlaceholderValue(placeholder, value);
        if (!valid) {
          errors.push({
            placeholderId: placeholder.id,
            message: `Valor inválido para "${placeholder.name}" (tipo esperado: ${placeholder.type})`,
            type: 'invalid-type',
          });
        }
      }

      // Validar posição e dimensões
      if (
        placeholder.x < 0 ||
        placeholder.y < 0 ||
        placeholder.x + placeholder.width > template.width ||
        placeholder.y + placeholder.height > template.height
      ) {
        errors.push({
          placeholderId: placeholder.id,
          message: `Placeholder "${placeholder.name}" está fora dos limites do template`,
          type: 'constraint',
        });
      }

      // Validar timing
      if (
        placeholder.startTime < 0 ||
        placeholder.startTime + placeholder.duration > template.duration
      ) {
        errors.push({
          placeholderId: placeholder.id,
          message: `Timing do placeholder "${placeholder.name}" excede a duração do template`,
          type: 'constraint',
        });
      }

      // Avisos de performance
      if (placeholder.width * placeholder.height > 1920 * 1080) {
        warnings.push({
          placeholderId: placeholder.id,
          message: `Placeholder "${placeholder.name}" tem resolução muito alta, pode afetar performance`,
          type: 'performance',
        });
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Valida o valor de um placeholder
   */
  private validatePlaceholderValue(placeholder: TemplatePlaceholder, value: any): boolean {
    switch (placeholder.type) {
      case 'text':
        return typeof value === 'string';
      case 'image':
      case 'video':
      case 'audio':
        return typeof value === 'string' && value.length > 0;
      case 'shape':
        return typeof value === 'object' && value !== null;
      case 'animation':
        return typeof value === 'string';
      default:
        return true;
    }
  }

  // ===========================================================================
  // RENDERING
  // ===========================================================================

  /**
   * Renderiza um template com dados
   */
  async renderTemplate(
    templateId: string,
    data: TemplateData,
    config: RenderConfig
  ): Promise<RenderResult> {
    const template = this.templates.get(templateId);
    if (!template) {
      return {
        templateId,
        success: false,
        error: 'Template não encontrado',
      };
    }

    const startTime = Date.now();

    try {
      // Validar template e dados
      const validation = this.validateTemplate(templateId, data);
      if (!validation.valid) {
        return {
          templateId,
          success: false,
          error: `Validação falhou: ${validation.errors.map((e) => e.message).join(', ')}`,
        };
      }

      // Atualizar status
      template.status = 'rendering';
      this.emit('render:started', { templateId, config });

      // Simular rendering (em produção, usar ffmpeg ou similar)
      await this.sleep(100); // Simular processamento

      // Preencher placeholders
      const filledData = this.fillPlaceholders(template, data);

      // Simular export
      const fileSize = Math.floor(template.width * template.height * template.duration * 0.001);

      // Atualizar status e estatísticas
      template.status = 'rendered';
      this.stats.renderedTemplates++;
      this.stats.totalRenders++;

      const duration = Date.now() - startTime;
      this.renderTimes.push(duration);
      this.updateAverageRenderTime();

      const result: RenderResult = {
        templateId,
        success: true,
        outputPath: config.outputPath,
        duration,
        fileSize,
        warnings: validation.warnings.map((w) => w.message),
        metadata: {
          format: config.format,
          quality: config.quality,
          resolution: `${template.width}x${template.height}`,
          fps: template.fps,
          filledPlaceholders: Object.keys(filledData).length,
        },
      };

      this.emit('render:completed', result);
      return result;
    } catch (error: any) {
      template.status = 'error';
      const result: RenderResult = {
        templateId,
        success: false,
        error: error.message,
      };

      this.emit('render:failed', result);
      return result;
    }
  }

  /**
   * Renderiza múltiplos templates em lote
   */
  async renderBatch(
    renders: Array<{
      templateId: string;
      data: TemplateData;
      config: RenderConfig;
    }>
  ): Promise<RenderResult[]> {
    this.emit('batch-render:started', { count: renders.length });

    const results: RenderResult[] = [];
    for (const render of renders) {
      const result = await this.renderTemplate(render.templateId, render.data, render.config);
      results.push(result);
    }

    const successCount = results.filter((r) => r.success).length;
    this.emit('batch-render:completed', {
      total: renders.length,
      success: successCount,
      failed: renders.length - successCount,
    });

    return results;
  }

  /**
   * Preenche placeholders com dados
   */
  private fillPlaceholders(template: VideoTemplate, data: TemplateData): Record<string, unknown> {
    const filled: Record<string, unknown> = {};

    template.placeholders.forEach((placeholder) => {
      let value = data[placeholder.id];

      // Usar valor padrão se não fornecido
      if (value === undefined && placeholder.defaultValue !== undefined) {
        value = placeholder.defaultValue;
      }

      if (value !== undefined) {
        filled[placeholder.id] = {
          ...placeholder,
          value,
        };
      }
    });

    return filled;
  }

  // ===========================================================================
  // EXPORT/IMPORT
  // ===========================================================================

  /**
   * Exporta template para JSON
   */
  exportTemplate(templateId: string): string | null {
    const template = this.templates.get(templateId);
    if (!template) return null;

    return JSON.stringify(template, null, 2);
  }

  /**
   * Importa template de JSON
   */
  importTemplate(json: string): string | null {
    try {
      const template = JSON.parse(json) as VideoTemplate;

      // Gerar novo ID
      const newId = `template-${this.nextTemplateId++}`;
      template.id = newId;
      template.createdAt = new Date();
      template.updatedAt = new Date();

      this.templates.set(newId, template);
      this.stats.totalTemplates++;

      this.emit('template:imported', template);
      return newId;
    } catch (error) {
      this.emit('error', {
        type: 'import-failed',
        message: 'Falha ao importar template',
        error,
      });
      return null;
    }
  }

  /**
   * Exporta todos os templates
   */
  exportAllTemplates(): string {
    const templates = this.getAllTemplates();
    return JSON.stringify(templates, null, 2);
  }

  // ===========================================================================
  // CACHE MANAGEMENT
  // ===========================================================================

  /**
   * Adiciona ao cache
   */
  cacheSet(key: string, value: any): void {
    if (!this.config.cacheTemplates) return;

    this.cache.set(key, value);
    this.emit('cache:set', { key });
  }

  /**
   * Obtém do cache
   */
  cacheGet(key: string): any {
    if (!this.config.cacheTemplates) return undefined;

    const value = this.cache.get(key);
    if (value !== undefined) {
      this.stats.cacheHits++;
    } else {
      this.stats.cacheMisses++;
    }

    return value;
  }

  /**
   * Limpa o cache
   */
  cacheClear(): void {
    this.cache.clear();
    this.emit('cache:cleared');
  }

  /**
   * Obtém tamanho do cache
   */
  cacheSize(): number {
    return this.cache.size;
  }

  // ===========================================================================
  // STATISTICS & UTILITIES
  // ===========================================================================

  /**
   * Obtém estatísticas
   */
  getStatistics(): TemplateEngineStats {
    return { ...this.stats };
  }

  /**
   * Atualiza tempo médio de rendering
   */
  private updateAverageRenderTime(): void {
    if (this.renderTimes.length === 0) {
      this.stats.averageRenderTime = 0;
      return;
    }

    const sum = this.renderTimes.reduce((a, b) => a + b, 0);
    this.stats.averageRenderTime = sum / this.renderTimes.length;
  }

  /**
   * Obtém configuração
   */
  getConfig(): TemplateEngineConfig {
    return { ...this.config };
  }

  /**
   * Atualiza configuração
   */
  updateConfig(updates: Partial<TemplateEngineConfig>): void {
    Object.assign(this.config, updates);
    this.emit('config:updated', this.config);
  }

  /**
   * Reseta o engine
   */
  reset(): void {
    this.templates.clear();
    this.cache.clear();
    this.renderTimes = [];
    this.nextTemplateId = 1;

    this.stats = {
      totalTemplates: 0,
      validTemplates: 0,
      invalidTemplates: 0,
      renderedTemplates: 0,
      totalRenders: 0,
      averageRenderTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };

    this.emit('engine:reset');
  }

  /**
   * Helper para sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

/**
 * Cria engine básico
 */
export function createBasicTemplateEngine(): VideoTemplateEngine {
  return new VideoTemplateEngine({
    maxTemplateSize: 1920 * 1080,
    maxPlaceholders: 20,
    validateOnCreate: true,
    cacheTemplates: false,
  });
}

/**
 * Cria engine de alta performance
 */
export function createHighPerformanceEngine(): VideoTemplateEngine {
  return new VideoTemplateEngine({
    maxTemplateSize: 4096 * 4096,
    maxPlaceholders: 50,
    validateOnCreate: true,
    cacheTemplates: true,
  });
}

/**
 * Cria engine de desenvolvimento
 */
export function createDevelopmentEngine(): VideoTemplateEngine {
  return new VideoTemplateEngine({
    maxTemplateSize: 1280 * 720,
    maxPlaceholders: 10,
    validateOnCreate: false,
    cacheTemplates: false,
  });
}
