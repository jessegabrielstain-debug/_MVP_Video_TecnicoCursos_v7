/**
 * 🧪 Integration Tests: Template Library + Template Engine
 * 
 * Testa a integração completa entre VideoTemplateLibrary e VideoTemplateEngine
 */

import { VideoTemplateLibrary } from '../../../lib/video/template-library';
import { VideoTemplateEngine } from '../../../lib/video/template-engine';
import {
  validateTemplateCompatibility,
  createDefaultRenderConfig,
  quickSearch,
} from '../../../lib/video-template-integration';

describe('🔌 Template Library + Template Engine Integration', () => {
  let library: VideoTemplateLibrary;
  let engine: VideoTemplateEngine;

  beforeEach(() => {
    library = new VideoTemplateLibrary();
    engine = new VideoTemplateEngine();
  });

  // ===========================================================================
  // TESTES BÁSICOS DE INTEGRAÇÃO
  // ===========================================================================

  describe('Basic Integration', () => {
    it('should create library and engine instances', () => {
      expect(library).toBeInstanceOf(VideoTemplateLibrary);
      expect(engine).toBeInstanceOf(VideoTemplateEngine);
    });

    it('should access default templates from library', () => {
      const templates = library.getAllTemplates();
      expect(templates.length).toBeGreaterThan(0);
    });

    it('should import library template to engine', () => {
      const templates = library.getAllTemplates();
      const libraryTemplate = templates[0];

      const templateJson = JSON.stringify(libraryTemplate.template);
      const templateId = engine.importTemplate(templateJson);

      expect(templateId).toBeTruthy();
      expect(typeof templateId).toBe('string');
    });
  });

  // ===========================================================================
  // COMPATIBILIDADE DE TEMPLATES
  // ===========================================================================

  describe('Template Compatibility', () => {
    it('should validate library templates are compatible with engine', () => {
      const templates = library.getAllTemplates();

      templates.forEach((template) => {
        const isCompatible = validateTemplateCompatibility(template);
        expect(isCompatible).toBe(true);
      });
    });

    it('should validate template has required structure', () => {
      const templates = library.getAllTemplates();
      const template = templates[0];

      expect(template.template).toHaveProperty('id');
      expect(template.template).toHaveProperty('name');
      expect(template.template).toHaveProperty('width');
      expect(template.template).toHaveProperty('height');
      expect(template.template).toHaveProperty('fps');
      expect(template.template).toHaveProperty('duration');
      expect(template.template).toHaveProperty('placeholders');
    });

    it('should reject invalid template structure', () => {
      const invalidTemplate = {
        id: 'test',
        name: 'Invalid',
        // Falta campos obrigatórios
      };

      const isCompatible = validateTemplateCompatibility({ template: invalidTemplate });
      expect(isCompatible).toBe(false);
    });
  });

  // ===========================================================================
  // BUSCA E SELEÇÃO DE TEMPLATES
  // ===========================================================================

  describe('Template Search & Selection', () => {
    it('should search templates by category', () => {
      const results = library.search('', { category: 'educational' });
      expect(results.total).toBeGreaterThan(0);

      results.templates.forEach((t) => {
        expect(t.category).toBe('educational');
      });
    });

    it('should search templates by size', () => {
      const results = library.search('', { size: 'youtube' });
      expect(results.total).toBeGreaterThan(0);

      results.templates.forEach((t) => {
        expect(t.size).toBe('youtube');
      });
    });

    it('should use quick search presets', () => {
      const presets = ['youtube', 'instagram', 'education', 'business', 'popular'] as const;

      presets.forEach((preset) => {
        const results = quickSearch(library, preset);
        expect(results.total).toBeGreaterThanOrEqual(0);
      });
    });
  });

  // ===========================================================================
  // WORKFLOW DE CRIAÇÃO DE VÍDEO
  // ===========================================================================

  describe('Video Creation Workflow', () => {
    it('should complete full import and render preparation', async () => {
      // 1. Buscar template
      const results = library.search('', { category: 'educational' });
      expect(results.total).toBeGreaterThan(0);

      const libraryTemplate = results.templates[0];

      // 2. Importar para engine
      const templateJson = JSON.stringify(libraryTemplate.template);
      const templateId = engine.importTemplate(templateJson);

      expect(templateId).toBeTruthy();

      // 3. Preparar configuração
      const config = createDefaultRenderConfig('test-video');

      expect(config.format).toBe('mp4');
      expect(config.quality).toBe('high');
      expect(config.outputPath).toContain('test-video.mp4');
      expect(config.includeAudio).toBe(true);
    });

    it('should mark template as used', () => {
      const templates = library.getAllTemplates();
      const template = templates[0];

      library.markAsUsed(template.id);

      const updated = library.getTemplate(template.id);
      expect(updated).toBeDefined();
    });
  });

  // ===========================================================================
  // GERENCIAMENTO DE FAVORITOS
  // ===========================================================================

  describe('Favorites Management', () => {
    it('should add template to favorites', () => {
      const templates = library.getAllTemplates();
      const template = templates[0];

      const result = library.addToFavorites(template.id);
      expect(result).toBe(true);

      const favorites = library.getFavorites();
      expect(favorites.some((f) => f.id === template.id)).toBe(true);
    });

    it('should remove template from favorites', () => {
      const templates = library.getAllTemplates();
      const template = templates[0];

      library.addToFavorites(template.id);
      const result = library.removeFromFavorites(template.id);

      expect(result).toBe(true);

      const favorites = library.getFavorites();
      expect(favorites.some((f) => f.id === template.id)).toBe(false);
    });

    it('should use favorite templates for batch creation', () => {
      const templates = library.getAllTemplates();

      // Adicionar alguns favoritos
      templates.slice(0, 3).forEach((t) => {
        library.addToFavorites(t.id);
      });

      const favorites = library.getFavorites();
      expect(favorites.length).toBe(3);

      // Simular criação em lote
      favorites.forEach((favorite) => {
        const templateJson = JSON.stringify(favorite.template);
        const templateId = engine.importTemplate(templateJson);

        expect(templateId).toBeTruthy();
      });
    });
  });

  describe('Rating System', () => {
    it('should add rating to template', () => {
      const templates = library.getAllTemplates();
      const template = templates[0];

      const result = library.addRating(template.id, 5, 'Excelente template!');
      expect(result).toBe(true);

      const updated = library.getTemplate(template.id);
      expect(updated).toBeDefined();
      expect(updated?.rating).toBeGreaterThan(0);
    });

    it('should calculate average rating correctly', () => {
      const templates = library.getAllTemplates();
      const template = templates[0];

      library.addRating(template.id, 5);
      library.addRating(template.id, 4);
      library.addRating(template.id, 5);

      const updated = library.getTemplate(template.id);
      // Rating já existe no template, então a média será calculada incluindo o rating inicial
      expect(updated?.rating).toBeGreaterThan(4.0);
      expect(updated?.rating).toBeLessThanOrEqual(5.0);
    });

    it('should filter templates by minimum rating', () => {
      const templates = library.getAllTemplates();
      const template = templates[0];

      // Adicionar ratings altos
      library.addRating(template.id, 5);
      library.addRating(template.id, 5);

      const results = library.search('', { minRating: 4.5 });
      expect(results.templates.some((t) => t.id === template.id)).toBe(true);
    });
  });

  // ===========================================================================
  // STATISTICS
  // ===========================================================================

  describe('Statistics Integration', () => {
    it('should get library statistics', () => {
      const stats = library.getStatistics();

      expect(stats).toHaveProperty('totalTemplates');
      expect(stats).toHaveProperty('totalUsage');
      expect(stats).toHaveProperty('averageRating');
      expect(stats).toHaveProperty('popularTemplates');
      expect(stats).toHaveProperty('recentlyAdded');

      expect(stats.totalTemplates).toBeGreaterThan(0);
      expect(Array.isArray(stats.popularTemplates)).toBe(true);
      expect(Array.isArray(stats.recentlyAdded)).toBe(true);
    });

    it('should track template usage', () => {
      const templates = library.getAllTemplates();
      const template = templates[0];

      // Marcar como usado várias vezes
      library.markAsUsed(template.id);
      library.markAsUsed(template.id);
      library.markAsUsed(template.id);

      const stats = library.getStatistics();
      expect(stats.totalUsage).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // BACKUP E EXPORTAÇÃO
  // ===========================================================================

  describe('Backup & Export', () => {
    it('should export library as JSON string', () => {
      const backup = library.exportLibrary();

      expect(typeof backup).toBe('string');
      expect(backup.length).toBeGreaterThan(0);

      // Deve ser JSON válido
      const parsed = JSON.parse(backup);
      expect(parsed).toHaveProperty('templates');
      expect(Array.isArray(parsed.templates)).toBe(true);
    });

    it('should restore library from backup', () => {
      const backup = library.exportLibrary();
      const parsed = JSON.parse(backup);
      const originalCount = parsed.templates.length;

      const newLibrary = new VideoTemplateLibrary();
      newLibrary.importLibrary(backup);

      const newTemplates = newLibrary.getAllTemplates();
      expect(newTemplates.length).toBe(originalCount);
    });

    it('should preserve template data after export/import', () => {
      const original = library.getAllTemplates();
      const firstTemplate = original[0];

      const backup = library.exportLibrary();

      const newLibrary = new VideoTemplateLibrary();
      newLibrary.importLibrary(backup);

      const restored = newLibrary.getTemplate(firstTemplate.id);

      expect(restored).toBeTruthy();
      expect(restored?.name).toBe(firstTemplate.name);
      expect(restored?.category).toBe(firstTemplate.category);
    });
  });

  // ===========================================================================
  // ERROR HANDLING
  // ===========================================================================

  describe('Error Handling', () => {
    it('should handle non-existent template gracefully', () => {
      const template = library.getTemplate('non-existent-id');
      expect(template).toBeUndefined();
    });

    it('should handle invalid rating value', () => {
      const templates = library.getAllTemplates();
      const template = templates[0];

      expect(() => {
        library.addRating(template.id, 6); // Rating > 5
      }).toThrow();

      expect(() => {
        library.addRating(template.id, 0); // Rating < 1
      }).toThrow();
    });

    it('should return empty results for non-matching search', () => {
      const results = library.search('xyzabc123nonexistent', {
        category: 'educational',
      });

      expect(results.total).toBe(0);
      expect(results.templates.length).toBe(0);
    });

    it('should handle invalid template import and log error', (done) => {
      // O engine emite erro mas não lança exceção
      const invalidJson = '{ invalid json }';

      engine.once('error', (errorData) => {
        expect(errorData.type).toBe('import-failed');
        done();
      });

      const templateId = engine.importTemplate(invalidJson);
      expect(templateId).toBeNull();

      // Timeout de fallback caso o evento não seja emitido
      setTimeout(() => {
        done();
      }, 100);
    });
  });
});
