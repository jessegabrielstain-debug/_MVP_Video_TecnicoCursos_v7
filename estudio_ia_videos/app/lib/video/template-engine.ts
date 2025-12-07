import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

export interface TemplatePlaceholder {
  id?: string;
  name: string;
  type: 'text' | 'image' | 'video' | 'audio';
  required?: boolean;
  defaultValue?: unknown;
  x: number;
  y: number;
  width: number;
  height: number;
  startTime: number;
  duration: number;
  style?: Record<string, unknown>;
}

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
  status: 'valid' | 'invalid' | 'draft';
  version: string;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateData {
  [key: string]: unknown;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface RenderConfig {
  format: 'mp4' | 'webm' | 'mov';
  quality: 'low' | 'medium' | 'high';
  outputPath: string;
}

export interface RenderResult {
  success: boolean;
  outputPath?: string;
  duration?: number;
  error?: Error;
}

export interface EngineConfig {
  maxTemplateSize?: number;
  maxPlaceholders?: number;
  validateOnCreate?: boolean;
  cacheTemplates?: boolean;
}

export interface EngineStatistics {
  totalTemplates: number;
  totalRenders: number;
  averageRenderTime: number;
  cacheHits: number;
  cacheMisses: number;
}

export class VideoTemplateEngine extends EventEmitter {
  private templates: Map<string, VideoTemplate> = new Map();
  private cache: Map<string, unknown> = new Map();
  private config: Required<EngineConfig>;
  private stats: EngineStatistics = {
    totalTemplates: 0,
    totalRenders: 0,
    averageRenderTime: 0,
    cacheHits: 0,
    cacheMisses: 0
  };

  constructor(config: EngineConfig = {}) {
    super();
    this.config = {
      maxTemplateSize: config.maxTemplateSize ?? 1920 * 1080,
      maxPlaceholders: config.maxPlaceholders ?? 50,
      validateOnCreate: config.validateOnCreate ?? true,
      cacheTemplates: config.cacheTemplates ?? false
    };
  }

  // Template Management

  createTemplate(name: string, width: number, height: number, options: Partial<VideoTemplate> = {}): string {
    const id = `template-${uuidv4()}`;
    const template: VideoTemplate = {
      id,
      name,
      width,
      height,
      fps: options.fps ?? 30,
      duration: options.duration ?? 10,
      backgroundColor: options.backgroundColor ?? '#000000',
      placeholders: [],
      variables: {},
      status: 'valid',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...options
    };

    this.templates.set(id, template);
    this.stats.totalTemplates++;
    return id;
  }

  getTemplate(id: string): VideoTemplate | undefined {
    return this.templates.get(id);
  }

  getAllTemplates(): VideoTemplate[] {
    return Array.from(this.templates.values());
  }

  getTemplatesByStatus(status: string): VideoTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.status === status);
  }

  updateTemplate(id: string, updates: Partial<VideoTemplate>): boolean {
    const template = this.templates.get(id);
    if (!template) return false;

    Object.assign(template, updates, { updatedAt: new Date().toISOString() });
    return true;
  }

  deleteTemplate(id: string): boolean {
    const deleted = this.templates.delete(id);
    if (deleted) this.stats.totalTemplates--;
    return deleted;
  }

  duplicateTemplate(id: string, newName: string): string | null {
    const original = this.templates.get(id);
    if (!original) return null;

    const newId = `template-${uuidv4()}`;
    const copy: VideoTemplate = {
      ...original,
      id: newId,
      name: newName,
      placeholders: JSON.parse(JSON.stringify(original.placeholders)), // Deep copy
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.templates.set(newId, copy);
    this.stats.totalTemplates++;
    return newId;
  }

  // Placeholder Management

  addPlaceholder(templateId: string, placeholder: TemplatePlaceholder): string | null {
    const template = this.templates.get(templateId);
    if (!template) return null;

    if (template.placeholders.length >= this.config.maxPlaceholders) {
      this.emit('error', { type: 'max-placeholders', message: 'Max placeholders exceeded' });
      return null;
    }

    const id = placeholder.id || uuidv4();
    const newPlaceholder = { ...placeholder, id };
    template.placeholders.push(newPlaceholder);
    return id;
  }

  updatePlaceholder(templateId: string, placeholderId: string, updates: Partial<TemplatePlaceholder>): boolean {
    const template = this.templates.get(templateId);
    if (!template) return false;

    const index = template.placeholders.findIndex(p => p.id === placeholderId);
    if (index === -1) return false;

    Object.assign(template.placeholders[index], updates);
    return true;
  }

  removePlaceholder(templateId: string, placeholderId: string): boolean {
    const template = this.templates.get(templateId);
    if (!template) return false;

    const initialLength = template.placeholders.length;
    template.placeholders = template.placeholders.filter(p => p.id !== placeholderId);
    return template.placeholders.length < initialLength;
  }

  getPlaceholders(templateId: string): TemplatePlaceholder[] {
    const template = this.templates.get(templateId);
    return template ? template.placeholders : [];
  }

  getPlaceholdersByType(templateId: string, type: string): TemplatePlaceholder[] {
    const template = this.templates.get(templateId);
    return template ? template.placeholders.filter(p => p.type === type) : [];
  }

  // Validation

  validateTemplate(id: string, data?: TemplateData): ValidationResult {
    const template = this.templates.get(id);
    const result: ValidationResult = { valid: true, errors: [], warnings: [] };

    if (!template) {
      result.valid = false;
      result.errors.push('Template not found');
      return result;
    }

    // Validate placeholders
    for (const p of template.placeholders) {
      // Check bounds
      if (p.x + p.width > template.width || p.y + p.height > template.height) {
        result.valid = false;
        result.errors.push(`Placeholder ${p.name} is out of bounds`);
      }

      // Check timing
      if (p.startTime + p.duration > template.duration) {
        result.valid = false;
        result.errors.push(`Placeholder ${p.name} exceeds template duration`);
      }

      // Check required data
      if (data) {
        const value = data[p.id!] || data[p.name];
        if (p.required && !value && !p.defaultValue) {
          result.valid = false;
          result.errors.push(`Missing required data for placeholder ${p.name}`);
        } else if (p.required && !value && p.defaultValue) {
            result.warnings.push(`Using default value for placeholder ${p.name}`);
        }
      }
    }

    return result;
  }

  // Rendering

  async renderTemplate(id: string, data: TemplateData, config: RenderConfig): Promise<RenderResult> {
    const startTime = Date.now();
    const validation = this.validateTemplate(id, data);

    if (!validation.valid) {
      return { success: false, error: new Error(validation.errors.join(', ')) };
    }

    // Mock rendering process
    await new Promise(resolve => setTimeout(resolve, 10)); // Simulate work

    const duration = Date.now() - startTime;
    this.stats.totalRenders++;
    this.stats.averageRenderTime = (this.stats.averageRenderTime * (this.stats.totalRenders - 1) + duration) / this.stats.totalRenders;

    return {
      success: true,
      outputPath: config.outputPath,
      duration: 10 // Mock duration
    };
  }

  async renderBatch(renders: { templateId: string; data: TemplateData; config: RenderConfig }[]): Promise<RenderResult[]> {
    const results: RenderResult[] = [];
    for (const render of renders) {
      results.push(await this.renderTemplate(render.templateId, render.data, render.config));
    }
    return results;
  }

  // Export/Import

  exportTemplate(id: string): string | null {
    const template = this.templates.get(id);
    return template ? JSON.stringify(template) : null;
  }

  importTemplate(json: string): string | null {
    try {
      const template = JSON.parse(json);
      
      if (!template.name) {
        throw new Error('Invalid template structure');
      }

      // Generate new ID to avoid conflicts
      const newId = `template-${uuidv4()}`;
      const newTemplate = { ...template, id: newId };
      
      this.templates.set(newId, newTemplate);
      this.stats.totalTemplates++;
      return newId;
    } catch (error) {
      this.emit('error', { type: 'import-failed', error });
      return null;
    }
  }

  exportAllTemplates(): string {
    return JSON.stringify(Array.from(this.templates.values()));
  }

  // Cache Management

  cacheSet(key: string, value: unknown): void {
    if (!this.config.cacheTemplates) return;
    this.cache.set(key, value);
  }

  cacheGet<T>(key: string): T | undefined {
    if (!this.config.cacheTemplates) return undefined;
    const value = this.cache.get(key);
    if (value !== undefined) {
      this.stats.cacheHits++;
      return value as T;
    } else {
      this.stats.cacheMisses++;
      return undefined;
    }
  }

  cacheClear(): void {
    this.cache.clear();
  }

  cacheSize(): number {
    return this.cache.size;
  }

  // Statistics & Config

  getStatistics(): EngineStatistics {
    return { ...this.stats };
  }

  getConfig(): Required<EngineConfig> {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<EngineConfig>): void {
    Object.assign(this.config, newConfig);
  }

  reset(): void {
    this.templates.clear();
    this.cache.clear();
    this.stats = {
      totalTemplates: 0,
      totalRenders: 0,
      averageRenderTime: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
  }
}

// Factory Functions

export function createBasicTemplateEngine(): VideoTemplateEngine {
  return new VideoTemplateEngine({
    maxTemplateSize: 1920 * 1080,
    cacheTemplates: false
  });
}

export function createHighPerformanceEngine(): VideoTemplateEngine {
  return new VideoTemplateEngine({
    maxTemplateSize: 4096 * 4096,
    cacheTemplates: true
  });
}

export function createDevelopmentEngine(): VideoTemplateEngine {
  return new VideoTemplateEngine({
    maxTemplateSize: 1280 * 720,
    validateOnCreate: false
  });
}
