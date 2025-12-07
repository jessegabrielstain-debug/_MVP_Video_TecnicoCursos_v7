/**
 * Testes do Video Template Library System
 * 
 * Cobertura completa de:
 * - Template management
 * - Search & filtering
 * - Favorites
 * - History & analytics
 * - Rating & reviews
 * - Customization
 * - Statistics
 * - Export/Import
 * - Default templates
 * - Factory functions
 * - Edge cases
 */

import {
  VideoTemplateLibrary,
  LibraryTemplate,
  LibraryFilter,
  TemplateCategory,
  TemplateSize,
  createBasicLibrary,
  createPremiumLibrary,
  createDevLibrary,
} from '../../../lib/video/template-library';

describe('VideoTemplateLibrary', () => {
  let library: VideoTemplateLibrary;

  beforeEach(() => {
    library = new VideoTemplateLibrary();
  });

  afterEach(() => {
    library.reset();
  });

  // ===========================================================================
  // TEMPLATE MANAGEMENT
  // ===========================================================================

  describe('Template Management', () => {
    it('should add template to library', () => {
      const id = library.addTemplate({
        name: 'Test Template',
        description: 'Test description',
        category: 'marketing',
        size: 'youtube',
        tags: ['test', 'template'],
        template: {
          id: 'test',
          name: 'Test',
          width: 1920,
          height: 1080,
          fps: 30,
          duration: 10,
          backgroundColor: '#000000',
          placeholders: [],
          variables: {},
          status: 'valid',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        popularity: 0,
        usageCount: 0,
        rating: 0,
        reviews: 0,
        featured: false,
        premium: false,
      });

      expect(id).toBeDefined();
      expect(id).toMatch(/^lib-template-/);

      const template = library.getTemplate(id);
      expect(template).toBeDefined();
      expect(template!.name).toBe('Test Template');
    });

    it('should get template by id', () => {
      const templates = library.getAllTemplates();
      expect(templates.length).toBeGreaterThan(0); // Default templates

      const firstTemplate = templates[0];
      const retrieved = library.getTemplate(firstTemplate.id);

      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(firstTemplate.id);
    });

    it('should get all templates', () => {
      const templates = library.getAllTemplates();
      expect(templates).toBeInstanceOf(Array);
      expect(templates.length).toBe(5); // 5 default templates
    });

    it('should update template', () => {
      const templates = library.getAllTemplates();
      const templateId = templates[0].id;

      const updated = library.updateTemplate(templateId, {
        name: 'Updated Name',
        description: 'Updated description',
      });

      expect(updated).toBe(true);

      const template = library.getTemplate(templateId);
      expect(template!.name).toBe('Updated Name');
      expect(template!.description).toBe('Updated description');
    });

    it('should remove template', () => {
      const id = library.addTemplate({
        name: 'To Remove',
        description: 'Will be removed',
        category: 'marketing',
        size: 'youtube',
        tags: [],
        template: {
          id: 'remove-test',
          name: 'Remove Test',
          width: 1920,
          height: 1080,
          fps: 30,
          duration: 10,
          backgroundColor: '#000000',
          placeholders: [],
          variables: {},
          status: 'valid',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        popularity: 0,
        usageCount: 0,
        rating: 0,
        reviews: 0,
        featured: false,
        premium: false,
      });

      const removed = library.removeTemplate(id);
      expect(removed).toBe(true);

      const template = library.getTemplate(id);
      expect(template).toBeUndefined();
    });

    it('should not exceed max templates', () => {
      // Como a biblioteca já vem com 5 templates padrão,
      // precisamos criar uma com limite de 5 e não adicionar nenhum extra
      const smallLibrary = new VideoTemplateLibrary({ maxTemplates: 5 });
      
      // Deve lançar erro ao tentar adicionar mais um template
      expect(() => {
        smallLibrary.addTemplate({
          name: 'Extra Template',
          description: 'Should fail',
          category: 'marketing',
          size: 'youtube',
          tags: [],
          template: {
            id: 'extra',
            name: 'Extra',
            width: 1920,
            height: 1080,
            fps: 30,
            duration: 10,
            backgroundColor: '#000000',
            placeholders: [],
            variables: {},
            status: 'valid',
            version: '1.0.0',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          popularity: 0,
          usageCount: 0,
          rating: 0,
          reviews: 0,
          featured: false,
          premium: false,
        });
      }).toThrow();
    });
  });

  // ===========================================================================
  // SEARCH & FILTERING
  // ===========================================================================

  describe('Search & Filtering', () => {
    it('should search templates by query', () => {
      const result = library.search('YouTube', undefined, 1, 10);

      expect(result.templates.length).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThan(0);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
    });

    it('should filter by category', () => {
      const result = library.search('', { category: 'marketing' });

      result.templates.forEach((template) => {
        expect(template.category).toBe('marketing');
      });
    });

    it('should filter by size', () => {
      const result = library.search('', { size: 'youtube' });

      result.templates.forEach((template) => {
        expect(template.size).toBe('youtube');
      });
    });

    it('should filter by tags', () => {
      const result = library.search('', { tags: ['youtube'] });

      result.templates.forEach((template) => {
        expect(template.tags).toContain('youtube');
      });
    });

    it('should filter by featured', () => {
      const result = library.search('', { featured: true });

      result.templates.forEach((template) => {
        expect(template.featured).toBe(true);
      });
    });

    it('should filter by premium', () => {
      const result = library.search('', { premium: false });

      result.templates.forEach((template) => {
        expect(template.premium).toBe(false);
      });
    });

    it('should filter by min rating', () => {
      const result = library.search('', { minRating: 4.5 });

      result.templates.forEach((template) => {
        expect(template.rating).toBeGreaterThanOrEqual(4.5);
      });
    });

    it('should paginate results', () => {
      const page1 = library.search('', undefined, 1, 2);
      const page2 = library.search('', undefined, 2, 2);

      expect(page1.templates.length).toBe(2);
      expect(page2.templates.length).toBeGreaterThan(0);
      expect(page1.templates[0].id).not.toBe(page2.templates[0].id);
    });

    it('should get templates by category', () => {
      const templates = library.getByCategory('marketing');

      templates.forEach((t) => {
        expect(t.category).toBe('marketing');
      });
    });

    it('should get templates by size', () => {
      const templates = library.getBySize('fullhd');

      templates.forEach((t) => {
        expect(t.size).toBe('fullhd');
      });
    });

    it('should get templates by tags', () => {
      const templates = library.getByTags(['instagram']);

      templates.forEach((t) => {
        expect(t.tags).toContain('instagram');
      });
    });

    it('should get featured templates', () => {
      const templates = library.getFeatured();

      templates.forEach((t) => {
        expect(t.featured).toBe(true);
      });
    });

    it('should get popular templates', () => {
      const templates = library.getPopular(3);

      expect(templates.length).toBeLessThanOrEqual(3);
      
      // Verificar ordenação por popularidade
      for (let i = 0; i < templates.length - 1; i++) {
        expect(templates[i].popularity).toBeGreaterThanOrEqual(templates[i + 1].popularity);
      }
    });

    it('should get recent templates', () => {
      const templates = library.getRecent(3);

      expect(templates.length).toBeLessThanOrEqual(3);
      
      // Verificar ordenação por data
      for (let i = 0; i < templates.length - 1; i++) {
        expect(templates[i].createdAt.getTime()).toBeGreaterThanOrEqual(
          templates[i + 1].createdAt.getTime()
        );
      }
    });
  });

  // ===========================================================================
  // FAVORITES
  // ===========================================================================

  describe('Favorites', () => {
    it('should add to favorites', () => {
      const templates = library.getAllTemplates();
      const templateId = templates[0].id;

      const added = library.addToFavorites(templateId);
      expect(added).toBe(true);

      const isFavorite = library.isFavorite(templateId);
      expect(isFavorite).toBe(true);
    });

    it('should remove from favorites', () => {
      const templates = library.getAllTemplates();
      const templateId = templates[0].id;

      library.addToFavorites(templateId);
      const removed = library.removeFromFavorites(templateId);

      expect(removed).toBe(true);
      expect(library.isFavorite(templateId)).toBe(false);
    });

    it('should toggle favorite', () => {
      const templates = library.getAllTemplates();
      const templateId = templates[0].id;

      // Toggle on
      library.toggleFavorite(templateId);
      expect(library.isFavorite(templateId)).toBe(true);

      // Toggle off
      library.toggleFavorite(templateId);
      expect(library.isFavorite(templateId)).toBe(false);
    });

    it('should get favorites list', () => {
      const templates = library.getAllTemplates();
      
      library.addToFavorites(templates[0].id);
      library.addToFavorites(templates[1].id);

      const favorites = library.getFavoriteTemplates();

      expect(favorites.length).toBe(2);
      expect(favorites[0].id).toBe(templates[0].id);
      expect(favorites[1].id).toBe(templates[1].id);
    });

    it('should not add non-existent template to favorites', () => {
      const added = library.addToFavorites('non-existent-id');
      expect(added).toBe(false);
    });
  });

  // ===========================================================================
  // HISTORY & ANALYTICS
  // ===========================================================================

  describe('History & Analytics', () => {
    it('should track template usage', () => {
      const templates = library.getAllTemplates();
      const templateId = templates[0].id;
      const initialUsageCount = templates[0].usageCount;

      library.markAsUsed(templateId);

      const template = library.getTemplate(templateId);
      expect(template!.usageCount).toBe(initialUsageCount + 1);
    });

    it('should add to history when viewing', () => {
      const templates = library.getAllTemplates();
      const templateId = templates[0].id;

      library.getTemplate(templateId);

      const history = library.getHistory(1);
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].templateId).toBe(templateId);
      expect(history[0].action).toBe('viewed');
    });

    it('should get limited history', () => {
      const templates = library.getAllTemplates();

      templates.forEach((t) => library.getTemplate(t.id));

      const history = library.getHistory(3);
      expect(history.length).toBe(3);
    });

    it('should clear history', () => {
      const templates = library.getAllTemplates();
      library.getTemplate(templates[0].id);

      library.clearHistory();

      const history = library.getHistory();
      expect(history.length).toBe(0);
    });

    it('should calculate popularity based on usage and rating', () => {
      const templates = library.getAllTemplates();
      const template = templates[0];

      const initialPopularity = template.popularity;

      library.markAsUsed(template.id);

      const updatedTemplate = library.getTemplate(template.id);
      expect(updatedTemplate!.popularity).toBeGreaterThan(initialPopularity);
    });
  });

  // ===========================================================================
  // RATING & REVIEWS
  // ===========================================================================

  describe('Rating & Reviews', () => {
    it('should add rating', () => {
      const templates = library.getAllTemplates();
      const templateId = templates[0].id;
      const initialReviews = templates[0].reviews;

      const added = library.addRating(templateId, 5);

      expect(added).toBe(true);

      const template = library.getTemplate(templateId);
      expect(template!.reviews).toBe(initialReviews + 1);
    });

    it('should recalculate average rating', () => {
      const templates = library.getAllTemplates();
      const templateId = templates[0].id;
      const template = templates[0];

      const initialRating = template.rating;
      const initialReviews = template.reviews;

      library.addRating(templateId, 5);

      const updatedTemplate = library.getTemplate(templateId);
      const expectedRating = (initialRating * initialReviews + 5) / (initialReviews + 1);

      expect(updatedTemplate!.rating).toBeCloseTo(expectedRating, 2);
    });

    it('should not accept rating outside range', () => {
      const templates = library.getAllTemplates();
      const templateId = templates[0].id;

      expect(() => library.addRating(templateId, 6)).toThrow();
      expect(() => library.addRating(templateId, 0)).toThrow();
    });

    it('should update popularity after rating', () => {
      const templates = library.getAllTemplates();
      const templateId = templates[0].id;
      const initialPopularity = templates[0].popularity;

      library.addRating(templateId, 5);

      const template = library.getTemplate(templateId);
      expect(template!.popularity).toBeGreaterThan(initialPopularity);
    });
  });

  // ===========================================================================
  // CUSTOMIZATION
  // ===========================================================================

  describe('Customization', () => {
    it('should create custom template from existing', () => {
      const templates = library.getAllTemplates();
      const originalId = templates[0].id;

      const customId = library.createCustomFromTemplate(originalId, {
        name: 'Custom Template',
        tags: ['custom', 'modified'],
      });

      expect(customId).toBeDefined();
      expect(customId).not.toBe(originalId);

      const customTemplate = library.getTemplate(customId);
      expect(customTemplate!.name).toBe('Custom Template');
      expect(customTemplate!.tags).toContain('custom');
      expect(customTemplate!.usageCount).toBe(0);
      expect(customTemplate!.featured).toBe(false);
    });

    it('should throw error for non-existent template', () => {
      expect(() => {
        library.createCustomFromTemplate('non-existent-id', {
          name: 'Custom',
        });
      }).toThrow('Template não encontrado');
    });

    it('should track customization in history', () => {
      const templates = library.getAllTemplates();
      const originalId = templates[0].id;

      library.createCustomFromTemplate(originalId, {
        name: 'Custom',
      });

      const history = library.getHistory();
      const customizationEntry = history.find(
        (h) => h.templateId === originalId && h.action === 'customized'
      );

      expect(customizationEntry).toBeDefined();
    });
  });

  // ===========================================================================
  // STATISTICS
  // ===========================================================================

  describe('Statistics', () => {
    it('should get library statistics', () => {
      const stats = library.getStatistics();

      expect(stats.totalTemplates).toBeGreaterThan(0);
      expect(stats.templatesByCategory).toBeDefined();
      expect(stats.totalUsage).toBeGreaterThanOrEqual(0);
      expect(stats.averageRating).toBeGreaterThanOrEqual(0);
      expect(stats.popularTemplates).toBeInstanceOf(Array);
      expect(stats.recentlyAdded).toBeInstanceOf(Array);
    });

    it('should count templates by category', () => {
      const stats = library.getStatistics();

      const totalByCategory = Object.values(stats.templatesByCategory).reduce(
        (sum, count) => sum + count,
        0
      );

      expect(totalByCategory).toBe(stats.totalTemplates);
    });

    it('should calculate average rating correctly', () => {
      const templates = library.getAllTemplates();
      
      let totalRating = 0;
      let totalReviews = 0;

      templates.forEach((t) => {
        totalRating += t.rating * t.reviews;
        totalReviews += t.reviews;
      });

      const expectedAvg = totalReviews > 0 ? totalRating / totalReviews : 0;
      const stats = library.getStatistics();

      expect(stats.averageRating).toBeCloseTo(expectedAvg, 2);
    });
  });

  // ===========================================================================
  // EXPORT/IMPORT
  // ===========================================================================

  describe('Export/Import', () => {
    it('should export library to JSON', () => {
      const json = library.exportLibrary();

      expect(json).toBeDefined();
      expect(typeof json).toBe('string');

      const parsed = JSON.parse(json);
      expect(parsed.templates).toBeInstanceOf(Array);
      expect(parsed.favorites).toBeInstanceOf(Array);
      expect(parsed.config).toBeDefined();
    });

    it('should import library from JSON', () => {
      const originalCount = library.getAllTemplates().length;
      
      const newLibrary = new VideoTemplateLibrary({ maxTemplates: 2000 });
      newLibrary.addTemplate({
        name: 'Imported Template',
        description: 'Test import',
        category: 'marketing',
        size: 'youtube',
        tags: ['imported'],
        template: {
          id: 'imported',
          name: 'Imported',
          width: 1920,
          height: 1080,
          fps: 30,
          duration: 10,
          backgroundColor: '#000000',
          placeholders: [],
          variables: {},
          status: 'valid',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        popularity: 0,
        usageCount: 0,
        rating: 0,
        reviews: 0,
        featured: false,
        premium: false,
      });

      const json = newLibrary.exportLibrary();
      library.importLibrary(json);

      expect(library.getAllTemplates().length).toBeGreaterThan(originalCount);
    });

    it('should handle invalid import JSON', () => {
      expect(() => {
        library.importLibrary('invalid json');
      }).toThrow('Falha ao importar biblioteca');
    });
  });

  // ===========================================================================
  // UTILITIES
  // ===========================================================================

  describe('Utilities', () => {
    it('should get config', () => {
      const config = library.getConfig();

      expect(config).toBeDefined();
      expect(config.maxTemplates).toBeDefined();
      expect(config.enableFavorites).toBeDefined();
      expect(config.enableHistory).toBeDefined();
      expect(config.enableAnalytics).toBeDefined();
      expect(config.cacheEnabled).toBeDefined();
    });

    it('should update config', () => {
      library.updateConfig({
        maxTemplates: 500,
        enableFavorites: false,
      });

      const config = library.getConfig();
      expect(config.maxTemplates).toBe(500);
      expect(config.enableFavorites).toBe(false);
    });

    it('should reset library', () => {
      library.addTemplate({
        name: 'Test',
        description: 'Test',
        category: 'marketing',
        size: 'youtube',
        tags: [],
        template: {
          id: 'test',
          name: 'Test',
          width: 1920,
          height: 1080,
          fps: 30,
          duration: 10,
          backgroundColor: '#000000',
          placeholders: [],
          variables: {},
          status: 'valid',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        popularity: 0,
        usageCount: 0,
        rating: 0,
        reviews: 0,
        featured: false,
        premium: false,
      });

      library.reset();

      const templates = library.getAllTemplates();
      expect(templates.length).toBe(5); // Back to default templates
    });
  });

  // ===========================================================================
  // DEFAULT TEMPLATES
  // ===========================================================================

  describe('Default Templates', () => {
    it('should initialize with 5 default templates', () => {
      const templates = library.getAllTemplates();
      expect(templates.length).toBe(5);
    });

    it('should have YouTube Intro template', () => {
      const templates = library.getAllTemplates();
      const youtube = templates.find((t) => t.name.includes('YouTube'));

      expect(youtube).toBeDefined();
      expect(youtube!.size).toBe('youtube');
      expect(youtube!.template.width).toBe(1920);
      expect(youtube!.template.height).toBe(1080);
    });

    it('should have Instagram Story template', () => {
      const templates = library.getAllTemplates();
      const instagram = templates.find((t) => t.name.includes('Instagram'));

      expect(instagram).toBeDefined();
      expect(instagram!.size).toBe('instagram-story');
      expect(instagram!.template.width).toBe(1080);
      expect(instagram!.template.height).toBe(1920);
    });

    it('should have Educational template', () => {
      const templates = library.getAllTemplates();
      const educational = templates.find((t) => t.category === 'educational');

      expect(educational).toBeDefined();
      expect(educational!.name).toContain('Aula');
    });

    it('should have Corporate template', () => {
      const templates = library.getAllTemplates();
      const corporate = templates.find((t) => t.category === 'corporate');

      expect(corporate).toBeDefined();
      expect(corporate!.premium).toBe(true);
    });

    it('should have Promotion template', () => {
      const templates = library.getAllTemplates();
      const promotion = templates.find((t) => t.category === 'promotion');

      expect(promotion).toBeDefined();
      expect(promotion!.size).toBe('facebook');
    });
  });

  // ===========================================================================
  // FACTORY FUNCTIONS
  // ===========================================================================

  describe('Factory Functions', () => {
    it('should create basic library', () => {
      const basic = createBasicLibrary();
      const config = basic.getConfig();

      expect(config.maxTemplates).toBe(500);
      expect(config.enableFavorites).toBe(true);
      expect(config.enableHistory).toBe(true);
      expect(config.enableAnalytics).toBe(true);
      expect(config.cacheEnabled).toBe(false);
    });

    it('should create premium library', () => {
      const premium = createPremiumLibrary();
      const config = premium.getConfig();

      expect(config.maxTemplates).toBe(2000);
      expect(config.cacheEnabled).toBe(true);
    });

    it('should create dev library', () => {
      const dev = createDevLibrary();
      const config = dev.getConfig();

      expect(config.maxTemplates).toBe(100);
      expect(config.enableFavorites).toBe(false);
      expect(config.enableHistory).toBe(false);
      expect(config.enableAnalytics).toBe(false);
    });
  });

  // ===========================================================================
  // EVENT SYSTEM
  // ===========================================================================

  describe('Event System', () => {
    it('should emit template:added event', (done) => {
      // Criar uma nova biblioteca para este teste para evitar eventos dos templates padrão
      const testLibrary = new VideoTemplateLibrary();
      
      // Aguardar um pouco para garantir que a inicialização terminou
      setTimeout(() => {
        testLibrary.once('template:added', (template) => {
          expect(template).toBeDefined();
          expect(template.name).toBe('Event Test');
          done();
        });

        testLibrary.addTemplate({
          name: 'Event Test',
          description: 'Test',
          category: 'marketing',
          size: 'youtube',
          tags: [],
          template: {
            id: 'test',
            name: 'Test',
            width: 1920,
            height: 1080,
            fps: 30,
            duration: 10,
            backgroundColor: '#000000',
            placeholders: [],
            variables: {},
            status: 'valid',
            version: '1.0.0',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          popularity: 0,
          usageCount: 0,
          rating: 0,
          reviews: 0,
          featured: false,
          premium: false,
        });
      }, 100);
    });

    it('should emit template:updated event', (done) => {
      const templates = library.getAllTemplates();
      const templateId = templates[0].id;

      library.on('template:updated', (template) => {
        expect(template).toBeDefined();
        done();
      });

      library.updateTemplate(templateId, { name: 'Updated' });
    });

    it('should emit template:removed event', (done) => {
      const id = library.addTemplate({
        name: 'To Remove',
        description: 'Test',
        category: 'marketing',
        size: 'youtube',
        tags: [],
        template: {
          id: 'test',
          name: 'Test',
          width: 1920,
          height: 1080,
          fps: 30,
          duration: 10,
          backgroundColor: '#000000',
          placeholders: [],
          variables: {},
          status: 'valid',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        popularity: 0,
        usageCount: 0,
        rating: 0,
        reviews: 0,
        featured: false,
        premium: false,
      });

      library.on('template:removed', (data) => {
        expect(data.id).toBe(id);
        done();
      });

      library.removeTemplate(id);
    });
  });

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('Edge Cases', () => {
    it('should handle empty search query', () => {
      const result = library.search('');
      expect(result.templates.length).toBeGreaterThan(0);
    });

    it('should handle search with no results', () => {
      const result = library.search('nonexistenttemplate12345');
      expect(result.templates.length).toBe(0);
      expect(result.total).toBe(0);
    });

    it('should handle pagination beyond available pages', () => {
      const result = library.search('', undefined, 999, 10);
      expect(result.templates.length).toBe(0);
    });

    it('should not add favorite for non-existent template', () => {
      const added = library.addToFavorites('non-existent');
      expect(added).toBe(false);
    });

    it('should not add rating for non-existent template', () => {
      const added = library.addRating('non-existent', 5);
      expect(added).toBe(false);
    });

    it('should handle disabled features gracefully', () => {
      const lib = new VideoTemplateLibrary({
        enableFavorites: false,
        enableHistory: false,
        enableAnalytics: false,
      });

      const templates = lib.getAllTemplates();
      const templateId = templates[0].id;

      // Favorites should not work
      const favoriteAdded = lib.addToFavorites(templateId);
      expect(favoriteAdded).toBe(false);

      // History should not work
      lib.markAsUsed(templateId);
      const history = lib.getHistory();
      expect(history.length).toBe(0);
    });
  });
});
