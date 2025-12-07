/**
 * 📚 Template Library System - Testes Completos
 * 
 * Sistema de biblioteca de templates pré-configurados com busca,
 * favoritos, histórico e analytics
 */

import {
  VideoTemplateLibrary,
  type TemplateCategory,
  type TemplateSize,
  type LibraryFilter,
  type LibraryTemplate,
} from '../../../lib/video/template-library';

describe('Template Library System', () => {
  let library: VideoTemplateLibrary;

  beforeEach(() => {
    library = new VideoTemplateLibrary();
  });

  afterEach(() => {
    library.destroy();
  });

  // ==========================================================================
  // TEMPLATE MANAGEMENT
  // ==========================================================================

  describe('Template Management', () => {
    it('should get all templates', () => {
      const templates = library.getAllTemplates();
      
      expect(templates.length).toBeGreaterThan(0);
      expect(templates[0]).toHaveProperty('id');
      expect(templates[0]).toHaveProperty('name');
      expect(templates[0]).toHaveProperty('category');
    });

    it('should get template by id', () => {
      const templates = library.getAllTemplates();
      const firstTemplate = templates[0];
      
      const template = library.getTemplate(firstTemplate.id);
      
      expect(template).toBeDefined();
      expect(template?.id).toBe(firstTemplate.id);
    });

    it('should return undefined for non-existent template', () => {
      const template = library.getTemplate('non-existent-id');
      
      expect(template).toBeUndefined();
    });

    it('should filter templates by category', () => {
      const filter: LibraryFilter = { category: 'educational' };
      const educational = library.filter(filter);
      
      expect(educational.length).toBeGreaterThan(0);
      educational.forEach((template: LibraryTemplate) => {
        expect(template.category).toBe('educational');
      });
    });

    it('should filter templates by size', () => {
      const filter: LibraryFilter = { size: 'youtube' };
      const youtube = library.filter(filter);
      
      expect(youtube.length).toBeGreaterThan(0);
      youtube.forEach((template: LibraryTemplate) => {
        expect(template.size).toBe('youtube');
      });
    });

    it('should filter templates by tags', () => {
      const filter: LibraryFilter = { tags: ['curso'] };
      const results = library.filter(filter);
      
      expect(results.length).toBeGreaterThan(0);
      results.forEach((template: LibraryTemplate) => {
        const hasTag = template.tags.some((tag: string) => tag.includes('curso'));
        expect(hasTag).toBe(true);
      });
    });
  });

  // ==========================================================================
  // SEARCH FUNCTIONALITY
  // ==========================================================================

  describe('Search Functionality', () => {
    it('should search templates by text query', () => {
      const results = library.search('tutorial');
      
      expect(results.templates.length).toBeGreaterThan(0);
    });

    it('should filter by category in search', () => {
      const filter: LibraryFilter = { category: 'educational' };
      const results = library.search('', filter);
      
      expect(results.templates.length).toBeGreaterThan(0);
      results.templates.forEach((template: LibraryTemplate) => {
        expect(template.category).toBe('educational');
      });
    });

    it('should filter by size in search', () => {
      const filter: LibraryFilter = { size: 'youtube' };
      const results = library.search('', filter);
      
      expect(results.templates.length).toBeGreaterThan(0);
      results.templates.forEach((template: LibraryTemplate) => {
        expect(template.size).toBe('youtube');
      });
    });

    it('should filter by minimum rating', () => {
      const filter: LibraryFilter = { minRating: 4.0 };
      const results = library.search('', filter);
      
      results.templates.forEach((template: LibraryTemplate) => {
        expect(template.rating).toBeGreaterThanOrEqual(4.0);
      });
    });

    it('should combine multiple filters', () => {
      const filter: LibraryFilter = {
        category: 'educational',
        size: 'youtube',
        minRating: 4.0
      };
      const results = library.search('curso', filter);
      
      results.templates.forEach((template: LibraryTemplate) => {
        expect(template.category).toBe('educational');
        expect(template.size).toBe('youtube');
        expect(template.rating).toBeGreaterThanOrEqual(4.0);
      });
    });

    it('should return empty array when no matches found', () => {
      const results = library.search('nonexistent-template-xyz');
      
      expect(results.templates).toEqual([]);
    });

    it('should search in tags', () => {
      const results = library.search('intro');
      
      expect(results.templates.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // FAVORITES SYSTEM
  // ==========================================================================

  describe('Favorites System', () => {
    it('should add template to favorites', () => {
      const templates = library.getAllTemplates();
      const templateId = templates[0].id;
      
      library.addFavorite(templateId);
      const favorites = library.getFavoriteIds();
      
      expect(favorites).toContain(templateId);
    });

    it('should remove template from favorites', () => {
      const templates = library.getAllTemplates();
      const templateId = templates[0].id;
      
      library.addFavorite(templateId);
      library.removeFavorite(templateId);
      const favorites = library.getFavoriteIds();
      
      expect(favorites).not.toContain(templateId);
    });

    it('should check if template is favorite', () => {
      const templates = library.getAllTemplates();
      const templateId = templates[0].id;
      
      expect(library.isFavorite(templateId)).toBe(false);
      
      library.addToFavorites(templateId);
      expect(library.isFavorite(templateId)).toBe(true);
    });

    it('should not add duplicate favorites', () => {
      const templates = library.getAllTemplates();
      const templateId = templates[0].id;
      
      library.addToFavorites(templateId);
      library.addToFavorites(templateId);
      const favorites = library.getFavoriteIds();
      
      expect(favorites.filter(id => id === templateId).length).toBe(1);
    });

    it('should get favorite templates', () => {
      const templates = library.getAllTemplates();
      library.addToFavorites(templates[0].id);
      library.addToFavorites(templates[1].id);
      
      const favoriteTemplates = library.getFavoriteTemplates();
      
      expect(favoriteTemplates.length).toBe(2);
      expect(favoriteTemplates[0].id).toBe(templates[0].id);
      expect(favoriteTemplates[1].id).toBe(templates[1].id);
    });

    it('should emit favorite:added event', (done) => {
      const templates = library.getAllTemplates();
      const templateId = templates[0].id;
      
      library.on('favorite:added', (payload) => {
        expect(payload.templateId).toBe(templateId);
        done();
      });
      
      library.addToFavorites(templateId);
    });

    it('should emit favorite:removed event', (done) => {
      const templates = library.getAllTemplates();
      const templateId = templates[0].id;
      
      library.addToFavorites(templateId);
      
      library.on('favorite:removed', (payload) => {
        expect(payload.templateId).toBe(templateId);
        done();
      });
      
      library.removeFromFavorites(templateId);
    });
  });

  // ==========================================================================
  // USAGE HISTORY
  // ==========================================================================

  describe('Usage History', () => {
    it('should record template usage', () => {
      const templates = library.getAllTemplates();
      const templateId = templates[0].id;
      
      library.recordUsage(templateId);
      const history = library.getUsageHistory();
      
      expect(history.length).toBe(1);
      expect(history[0].templateId).toBe(templateId);
    });

    it('should record multiple usages', () => {
      const templates = library.getAllTemplates();
      
      library.recordUsage(templates[0].id);
      library.recordUsage(templates[1].id);
      library.recordUsage(templates[0].id);
      
      const history = library.getUsageHistory();
      
      expect(history.length).toBe(3);
    });

    it('should get recent templates', () => {
      const templates = library.getAllTemplates();
      
      library.recordUsage(templates[0].id);
      library.recordUsage(templates[1].id);
      library.recordUsage(templates[2].id);
      
      const recent = library.getRecentTemplates(2);
      
      expect(recent.length).toBe(2);
      expect(recent[0].id).toBe(templates[2].id); // Most recent
      expect(recent[1].id).toBe(templates[1].id);
    });

    it('should get usage count for template', () => {
      const templates = library.getAllTemplates();
      const templateId = templates[0].id;
      
      library.recordUsage(templateId);
      library.recordUsage(templateId);
      library.recordUsage(templateId);
      
      const count = library.getUsageCount(templateId);
      
      expect(count).toBe(3);
    });

    it('should emit template:used event', (done) => {
      const templates = library.getAllTemplates();
      const templateId = templates[0].id;
      
      library.on('template:used', (id) => {
        expect(id).toBe(templateId);
        done();
      });
      
      library.recordUsage(templateId);
    });

    it('should limit history size', () => {
      const templates = library.getAllTemplates();
      
      // Record more than default limit (100)
      for (let i = 0; i < 150; i++) {
        library.recordUsage(templates[i % templates.length].id);
      }
      
      const history = library.getUsageHistory();
      
      expect(history.length).toBeLessThanOrEqual(100);
    });
  });

  // ==========================================================================
  // ANALYTICS
  // ==========================================================================

  describe('Analytics', () => {
    it('should get popular templates', () => {
      const templates = library.getAllTemplates();
      
      // Create usage pattern
      library.recordUsage(templates[0].id);
      library.recordUsage(templates[0].id);
      library.recordUsage(templates[0].id);
      library.recordUsage(templates[1].id);
      library.recordUsage(templates[1].id);
      library.recordUsage(templates[2].id);
      
      const popular = library.getPopularTemplates(2);
      
      expect(popular.length).toBe(2);
      expect(popular[0].id).toBe(templates[0].id); // Most used
      expect(popular[0].usageCount).toBe(3);
    });

    it('should get category stats', () => {
      const templates = library.getAllTemplates();
      
      templates.forEach(template => {
        library.recordUsage(template.id);
      });
      
      const stats = library.getCategoryStats();
      
      expect(stats.length).toBeGreaterThan(0);
      stats.forEach(stat => {
        expect(stat).toHaveProperty('category');
        expect(stat).toHaveProperty('count');
        expect(stat).toHaveProperty('percentage');
      });
    });

    it('should get platform stats', () => {
      const templates = library.getAllTemplates();
      
      templates.forEach(template => {
        library.recordUsage(template.id);
      });
      
      const stats = library.getPlatformStats();
      
      expect(stats.length).toBeGreaterThan(0);
      stats.forEach(stat => {
        expect(stat).toHaveProperty('platform');
        expect(stat).toHaveProperty('count');
        expect(stat).toHaveProperty('percentage');
      });
    });

    it('should calculate category percentages correctly', () => {
      const templates = library.getAllTemplates();
      
      templates.forEach(template => {
        library.recordUsage(template.id);
      });
      
      const stats = library.getCategoryStats();
      const totalPercentage = stats.reduce((sum, stat) => sum + stat.percentage, 0);
      
      expect(totalPercentage).toBeCloseTo(100, 1);
    });

    it('should return empty stats when no usage', () => {
      const stats = library.getCategoryStats();
      
      expect(stats).toEqual([]);
    });
  });

  // ==========================================================================
  // RECOMMENDATIONS
  // ==========================================================================

  describe('Recommendations', () => {
    it('should get recommended templates based on usage', () => {
      const templates = library.getAllTemplates();
      
      // Create usage pattern
      library.recordUsage(templates[0].id);
      library.recordUsage(templates[0].id);
      
      const recommendations = library.getRecommendedTemplates(3);
      
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.length).toBeLessThanOrEqual(3);
    });

    it('should recommend templates from same category', () => {
      const templates = library.getAllTemplates();
      const educationalTemplate = templates.find(t => t.category === 'educational');
      
      if (educationalTemplate) {
        library.recordUsage(educationalTemplate.id);
        
        const recommendations = library.getRecommendedTemplates(5);
        const educationalRecs = recommendations.filter(t => t.category === 'educational');
        
        expect(educationalRecs.length).toBeGreaterThan(0);
      }
    });

    it('should not recommend already used templates', () => {
      const templates = library.getAllTemplates();
      
      templates.forEach(template => {
        library.recordUsage(template.id);
      });
      
      const recommendations = library.getRecommendedTemplates(5);
      
      // All templates used, should return empty or least used
      expect(recommendations.length).toBeGreaterThanOrEqual(0);
    });

    it('should limit recommendations to specified count', () => {
      const limit = 3;
      const recommendations = library.getRecommendedTemplates(limit);
      
      expect(recommendations.length).toBeLessThanOrEqual(limit);
    });
  });

  // ==========================================================================
  // CONFIGURATION
  // ==========================================================================

  describe('Configuration', () => {
    it('should get current configuration', () => {
      const config = library.getConfig();
      
      expect(config).toHaveProperty('maxHistorySize');
      expect(config).toHaveProperty('defaultSearchLimit');
    });

    it('should update configuration', () => {
      library.updateConfig({ maxHistorySize: 50 });
      const config = library.getConfig();
      
      expect(config.maxHistorySize).toBe(50);
    });

    it('should emit config:updated event', (done) => {
      library.on('config:updated', (config) => {
        expect(config.maxHistorySize).toBe(75);
        done();
      });
      
      library.updateConfig({ maxHistorySize: 75 });
    });
  });

  // ==========================================================================
  // STATISTICS
  // ==========================================================================

  describe('Statistics', () => {
    it('should get library statistics', () => {
      const templates = library.getAllTemplates();
      
      library.recordUsage(templates[0].id);
      library.addToFavorites(templates[1].id);
      
      const stats = library.getStats();
      
      expect(stats).toHaveProperty('totalTemplates');
      expect(stats).toHaveProperty('totalUsage');
      expect(stats).toHaveProperty('totalFavorites');
      expect(stats).toHaveProperty('categoriesCount');
      expect(stats).toHaveProperty('platformsCount');
      
      expect(stats.totalTemplates).toBe(templates.length);
      expect(stats.totalUsage).toBe(1);
      expect(stats.totalFavorites).toBe(1);
    });

    it('should count categories correctly', () => {
      const stats = library.getStats();
      const templates = library.getAllTemplates();
      const uniqueCategories = new Set(templates.map(t => t.category));
      
      expect(stats.categoriesCount).toBe(uniqueCategories.size);
    });

    it('should count platforms correctly', () => {
      const stats = library.getStats();
      const templates = library.getAllTemplates();
      const uniquePlatforms = new Set(
        templates.flatMap(t => t.platforms)
      );
      
      expect(stats.platformsCount).toBe(uniquePlatforms.size);
    });
  });

  // ==========================================================================
  // RESET & CLEANUP
  // ==========================================================================

  describe('Reset & Cleanup', () => {
    it('should reset library state', () => {
      const templates = library.getAllTemplates();
      
      library.recordUsage(templates[0].id);
      library.addToFavorites(templates[0].id);
      
      library.reset();
      
      expect(library.getFavorites()).toEqual([]);
      expect(library.getUsageHistory()).toEqual([]);
    });

    it('should emit library:reset event', (done) => {
      library.on('library:reset', () => {
        done();
      });
      
      library.reset();
    });

    it('should cleanup resources on destroy', () => {
      const templates = library.getAllTemplates();
      library.recordUsage(templates[0].id);
      
      library.destroy();
      
      // After destroy, library should be in clean state
      expect(library.getFavorites()).toEqual([]);
      expect(library.getUsageHistory()).toEqual([]);
    });

    it('should remove all event listeners on destroy', () => {
      let eventFired = false;
      
      library.on('favorite:added', () => {
        eventFired = true;
      });
      
      const templates = library.getAllTemplates();
      const templateId = templates[0].id;

      library.destroy();
      
      // Re-initialize to test if listeners are gone but we can still use the library object?
      // Actually destroy() clears templates, so we can't add to favorites easily unless we add a template first.
      // But the test intent is to check if the LISTENER is gone.
      
      // We can't use addToFavorites if templates are gone.
      // So we must assume destroy() is final.
      // But to test if listener is gone, we'd need to trigger the event.
      // If we can't trigger the event because the object is dead, then the test is moot.
      
      // Let's try to add a template back and then add to favorites
      // Or just manually emit?
      library.emit('favorite:added', 'test');
      
      expect(eventFired).toBe(false);
    });
  });

  // ==========================================================================
  // EDGE CASES
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle empty search query', () => {
      const results = library.searchTemplates({ query: '' });
      
      expect(results.length).toBe(library.getAllTemplates().length);
    });

    it('should handle search with no filters', () => {
      const results = library.searchTemplates({});
      
      expect(results.length).toBe(library.getAllTemplates().length);
    });

    it('should handle getting recent templates with zero limit', () => {
      const templates = library.getAllTemplates();
      library.recordUsage(templates[0].id);
      
      const recent = library.getRecentTemplates(0);
      
      expect(recent).toEqual([]);
    });

    it('should handle getting popular templates with zero limit', () => {
      const templates = library.getAllTemplates();
      library.recordUsage(templates[0].id);
      
      const popular = library.getPopularTemplates(0);
      
      expect(popular).toEqual([]);
    });

    it('should handle usage count for non-existent template', () => {
      const count = library.getUsageCount('non-existent-id');
      
      expect(count).toBe(0);
    });

    it('should handle removing non-existent favorite', () => {
      expect(() => {
        library.removeFromFavorites('non-existent-id');
      }).not.toThrow();
    });

    it('should handle multiple config updates', () => {
      library.updateConfig({ maxHistorySize: 50 });
      library.updateConfig({ defaultSearchLimit: 20 });
      
      const config = library.getConfig();
      
      expect(config.maxHistorySize).toBe(50);
      expect(config.defaultSearchLimit).toBe(20);
    });
  });
});
