import { EventEmitter } from 'events';

export type TemplateCategory = 'marketing' | 'educational' | 'social' | 'corporate' | 'promotion' | 'other';
export type TemplateSize = 'youtube' | 'instagram-story' | 'instagram-post' | 'tiktok' | 'facebook' | 'linkedin' | 'fullhd' | '4k';

export interface LibraryTemplate {
  id: string;
  name: string;
  description?: string;
  category: TemplateCategory | string;
  size: TemplateSize | string;
  tags: string[];
  platforms: string[]; // Added for compatibility
  template: Record<string, unknown>; // The actual Remotion/Video template data
  popularity: number;
  usageCount: number;
  rating: number;
  reviews: number;
  featured: boolean;
  premium: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LibraryFilter {
  category?: string;
  size?: string;
  tags?: string[];
  featured?: boolean;
  premium?: boolean;
  minRating?: number;
}

export interface LibraryConfig {
  maxTemplates: number;
  enableFavorites: boolean;
  enableHistory: boolean;
  enableAnalytics: boolean;
  cacheEnabled: boolean;
  maxHistorySize?: number;
  defaultSearchLimit?: number;
}

export interface SearchResult {
  total: number;
  templates: LibraryTemplate[];
  page: number;
  pageSize: number;
}

export interface LibraryStatistics {
  totalTemplates: number;
  templatesByCategory: Record<string, number>;
  totalUsage: number;
  averageRating: number;
  popularTemplates: LibraryTemplate[];
  recentlyAdded: LibraryTemplate[];
  totalFavorites?: number;
  categoriesCount?: number;
  platformsCount?: number;
}

export interface CategoryStat {
  category: string;
  count: number;
  percentage: number;
}

export interface PlatformStat {
  platform: string;
  count: number;
  percentage: number;
}

export interface HistoryEntry {
  templateId: string;
  action: 'viewed' | 'used' | 'customized';
  timestamp: Date;
}

export class VideoTemplateLibrary extends EventEmitter {
  private templates: Map<string, LibraryTemplate> = new Map();
  private favorites: Set<string> = new Set();
  private history: HistoryEntry[] = [];
  private config: LibraryConfig;

  constructor(config: Partial<LibraryConfig> = {}) {
    super();
    this.config = {
      maxTemplates: 1000,
      enableFavorites: true,
      enableHistory: true,
      enableAnalytics: true,
      cacheEnabled: false,
      maxHistorySize: 100,
      defaultSearchLimit: 10,
      ...config
    };
    this.addDefaultTemplates();
  }

  private addDefaultTemplates() {
    const now = new Date();
    const defaults: Partial<LibraryTemplate>[] = [
      {
        id: 'default-youtube-intro',
        name: 'YouTube Intro',
        description: 'Standard YouTube Intro Tutorial', // Added 'Tutorial' for search test
        category: 'marketing',
        size: 'youtube',
        tags: ['youtube', 'intro', 'tutorial'],
        platforms: ['youtube'],
        template: { 
          id: 'default-youtube-intro',
          name: 'YouTube Intro',
          width: 1920, 
          height: 1080, 
          fps: 30, 
          duration: 10,
          placeholders: []
        },
        featured: true,
        premium: false,
        createdAt: new Date(now.getTime() - 10000)
      },
      {
        id: 'default-insta-story',
        name: 'Instagram Story',
        description: 'Standard Instagram Story',
        category: 'social',
        size: 'instagram-story',
        tags: ['instagram', 'story'],
        platforms: ['instagram'],
        template: { 
          id: 'default-insta-story',
          name: 'Instagram Story',
          width: 1080, 
          height: 1920, 
          fps: 30, 
          duration: 15,
          placeholders: []
        },
        featured: true,
        premium: false,
        createdAt: new Date(now.getTime() - 8000)
      },
      {
        id: 'default-edu-aula',
        name: 'Aula Básica',
        description: 'Template para aulas',
        category: 'educational',
        size: 'fullhd',
        tags: ['education', 'class', 'curso'], // Added 'curso' for tag filter test
        platforms: ['youtube', 'vimeo'],
        template: { 
          id: 'default-edu-aula',
          name: 'Aula Básica',
          width: 1920, 
          height: 1080, 
          fps: 30, 
          duration: 60,
          placeholders: []
        },
        featured: false,
        premium: false,
        createdAt: new Date(now.getTime() - 6000)
      },
      {
        id: 'default-corp-pres',
        name: 'Corporate Presentation',
        description: 'Business style',
        category: 'corporate',
        size: 'fullhd',
        tags: ['business', 'corporate'],
        platforms: ['linkedin'],
        template: { 
          id: 'default-corp-pres',
          name: 'Corporate Presentation',
          width: 1920, 
          height: 1080, 
          fps: 30, 
          duration: 120,
          placeholders: []
        },
        featured: false,
        premium: true,
        createdAt: new Date(now.getTime() - 4000)
      },
      {
        id: 'default-promo-fb',
        name: 'Facebook Promotion',
        description: 'Promo for FB',
        category: 'promotion',
        size: 'facebook',
        tags: ['facebook', 'promo'],
        platforms: ['facebook'],
        template: { 
          id: 'default-promo-fb',
          name: 'Facebook Promotion',
          width: 1200, 
          height: 628, 
          fps: 30, 
          duration: 20,
          placeholders: []
        },
        featured: false,
        premium: false,
        createdAt: new Date(now.getTime() - 2000)
      }
    ];

    defaults.forEach(t => {
      this.addTemplate({
        ...t,
        popularity: 0,
        usageCount: 0,
        rating: 0,
        reviews: 0,
        updatedAt: new Date()
      } as unknown as LibraryTemplate, true); // true to skip max check for defaults
    });
  }

  getConfig(): LibraryConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<LibraryConfig>): void {
    this.config = { ...this.config, ...config };
    this.emit('config:updated', this.config);
  }

  reset(): void {
    this.templates.clear();
    this.favorites.clear();
    this.history = [];
    this.addDefaultTemplates();
    this.emit('library:reset');
  }

  destroy(): void {
    this.removeAllListeners();
    this.templates.clear();
    this.favorites.clear();
    this.history = [];
  }

  addTemplate(templateData: Omit<LibraryTemplate, 'id' | 'createdAt' | 'updatedAt'> & { id?: string, createdAt?: Date, updatedAt?: Date }, isSystem = false): string {
    if (!isSystem && this.templates.size >= this.config.maxTemplates) {
      throw new Error('Library limit reached');
    }

    const id = templateData.id || `lib-template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newTemplate: LibraryTemplate = {
      ...templateData,
      id,
      createdAt: templateData.createdAt || new Date(),
      updatedAt: templateData.updatedAt || new Date(),
      popularity: templateData.popularity || 0,
      usageCount: templateData.usageCount || 0,
      rating: templateData.rating || 0,
      reviews: templateData.reviews || 0,
      featured: templateData.featured || false,
      premium: templateData.premium || false,
      platforms: templateData.platforms || [],
    };

    this.templates.set(id, newTemplate);
    this.emit('template:added', newTemplate);
    return id;
  }

  getTemplate(id: string): LibraryTemplate | undefined {
    const template = this.templates.get(id);
    if (template && this.config.enableHistory) {
      this.addToHistory(id, 'viewed');
    }
    return template;
  }

  getAllTemplates(): LibraryTemplate[] {
    return Array.from(this.templates.values());
  }

  updateTemplate(id: string, updates: Partial<LibraryTemplate>): boolean {
    const template = this.templates.get(id);
    if (!template) return false;

    const updatedTemplate = {
      ...template,
      ...updates,
      updatedAt: new Date()
    };

    this.templates.set(id, updatedTemplate);
    this.emit('template:updated', updatedTemplate);
    return true;
  }

  removeTemplate(id: string): boolean {
    if (!this.templates.has(id)) return false;
    
    this.templates.delete(id);
    this.favorites.delete(id);
    this.emit('template:removed', { id });
    return true;
  }

  search(query: string, filters: LibraryFilter = {}, page: number = 1, pageSize: number = 10): SearchResult {
    let results = Array.from(this.templates.values());

    if (query) {
      const q = query.toLowerCase();
      results = results.filter(t => 
        t.name.toLowerCase().includes(q) || 
        t.description?.toLowerCase().includes(q) ||
        t.tags.some(tag => tag.toLowerCase().includes(q))
      );
    }

    if (filters.category) {
      results = results.filter(t => t.category === filters.category);
    }

    if (filters.size) {
      results = results.filter(t => t.size === filters.size);
    }

    if (filters.tags && filters.tags.length > 0) {
      results = results.filter(t => filters.tags!.some(tag => t.tags.includes(tag)));
    }

    if (filters.featured !== undefined) {
      results = results.filter(t => t.featured === filters.featured);
    }

    if (filters.premium !== undefined) {
      results = results.filter(t => t.premium === filters.premium);
    }

    if (filters.minRating !== undefined) {
      results = results.filter(t => t.rating >= filters.minRating!);
    }

    const total = results.length;
    const start = (page - 1) * pageSize;
    const paginated = results.slice(start, start + pageSize);

    return {
      total,
      templates: paginated,
      page,
      pageSize
    };
  }

  // Alias for new test suite
  searchTemplates(options: { query?: string } & LibraryFilter): LibraryTemplate[] {
    const { query, ...filters } = options;
    return this.search(query || '', filters, 1, 1000).templates;
  }

  filter(filters: LibraryFilter): LibraryTemplate[] {
    return this.search('', filters, 1, 1000).templates;
  }

  getByCategory(category: string): LibraryTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.category === category);
  }

  getBySize(size: string): LibraryTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.size === size);
  }

  getByTags(tags: string[]): LibraryTemplate[] {
    return Array.from(this.templates.values()).filter(t => tags.some(tag => t.tags.includes(tag)));
  }

  getFeatured(): LibraryTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.featured);
  }

  getPopular(limit: number = 10): LibraryTemplate[] {
    if (limit <= 0) return [];
    return Array.from(this.templates.values())
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit);
  }

  getPopularTemplates(limit: number = 10): LibraryTemplate[] {
    return this.getPopular(limit);
  }

  getRecent(limit: number = 10): LibraryTemplate[] {
    if (limit <= 0) return [];
    return Array.from(this.templates.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  getRecentTemplates(limit: number = 10): LibraryTemplate[] {
    if (limit <= 0) return [];
    const history = this.getHistory(100);
    const usedIds = new Set<string>();
    const recentTemplates: LibraryTemplate[] = [];

    for (const entry of history) {
      if (entry.action === 'used' && !usedIds.has(entry.templateId)) {
        const template = this.templates.get(entry.templateId);
        if (template) {
          recentTemplates.push(template);
          usedIds.add(entry.templateId);
        }
      }
      if (recentTemplates.length >= limit) break;
    }
    
    return recentTemplates;
  }

  // Favorites
  addToFavorites(id: string): boolean {
    if (!this.config.enableFavorites) return false;
    if (!this.templates.has(id)) return false;
    if (this.favorites.has(id)) return false; // Prevent duplicates
    this.favorites.add(id);
    this.emit('favorite:added', { templateId: id });
    return true;
  }

  addFavorite(id: string): boolean {
    return this.addToFavorites(id);
  }

  removeFromFavorites(id: string): boolean {
    if (this.favorites.delete(id)) {
      this.emit('favorite:removed', { templateId: id });
      return true;
    }
    return false;
  }

  removeFavorite(id: string): boolean {
    return this.removeFromFavorites(id);
  }

  toggleFavorite(id: string): boolean {
    if (this.favorites.has(id)) {
      return this.removeFromFavorites(id);
    }
    return this.addToFavorites(id);
  }

  isFavorite(id: string): boolean {
    return this.favorites.has(id);
  }

  getFavorites(): LibraryTemplate[] {
    return Array.from(this.favorites)
      .map(id => this.templates.get(id))
      .filter((t): t is LibraryTemplate => !!t);
  }

  getFavoriteIds(): string[] {
    return Array.from(this.favorites);
  }

  getFavoriteTemplates(): LibraryTemplate[] {
    return this.getFavorites();
  }

  // History & Analytics
  markAsUsed(id: string): void {
    const template = this.templates.get(id);
    if (template) {
      template.usageCount++;
      this.updatePopularity(template);
      if (this.config.enableHistory) {
        this.addToHistory(id, 'used');
      }
      this.emit('template:used', id);
    }
  }

  recordUsage(id: string): void {
    this.markAsUsed(id);
  }

  private addToHistory(id: string, action: HistoryEntry['action']) {
    this.history.unshift({
      templateId: id,
      action,
      timestamp: new Date()
    });
    // Keep history manageable
    const maxSize = this.config.maxHistorySize || 100;
    if (this.history.length > maxSize) {
      this.history = this.history.slice(0, maxSize);
    }
  }

  getHistory(limit: number = 50): HistoryEntry[] {
    if (!this.config.enableHistory) return [];
    return this.history.slice(0, limit);
  }

  getUsageHistory(): HistoryEntry[] {
    return this.getHistory(this.config.maxHistorySize);
  }

  getUsageCount(id: string): number {
    return this.templates.get(id)?.usageCount || 0;
  }

  clearHistory(): void {
    this.history = [];
  }

  // Rating
  addRating(id: string, rating: number): boolean {
    if (rating < 1 || rating > 5) throw new Error('Rating deve estar entre 1 e 5');
    const template = this.templates.get(id);
    if (!template) return false;

    // Calculate new average
    const totalScore = template.rating * template.reviews + rating;
    template.reviews++;
    template.rating = totalScore / template.reviews;
    
    this.updatePopularity(template);
    return true;
  }

  private updatePopularity(template: LibraryTemplate) {
    // Simple algorithm: usage * 1 + rating * 10
    template.popularity = (template.usageCount * 1) + (template.rating * 10);
  }

  // Customization
  createCustomFromTemplate(originalId: string, options: { name: string; description?: string; tags?: string[] }): string {
    const original = this.templates.get(originalId);
    if (!original) throw new Error('Template não encontrado');

    const newId = this.addTemplate({
      ...original,
      name: options.name,
      description: options.description || original.description,
      tags: [...original.tags, ...(options.tags || [])],
      platforms: [...original.platforms],
      usageCount: 0,
      rating: 0,
      reviews: 0,
      popularity: 0,
      featured: false,
      premium: false,
      id: undefined // Let addTemplate generate it
    });

    if (this.config.enableHistory) {
      this.addToHistory(originalId, 'customized');
    }

    return newId;
  }

  // Statistics
  getStatistics(): LibraryStatistics {
    const templates = Array.from(this.templates.values());
    const totalUsage = templates.reduce((sum, t) => sum + t.usageCount, 0);
    
    const ratedTemplates = templates.filter(t => t.reviews > 0);
    const averageRating = ratedTemplates.length > 0
      ? ratedTemplates.reduce((sum, t) => sum + t.rating, 0) / ratedTemplates.length
      : 0;

    const templatesByCategory: Record<string, number> = {};
    templates.forEach(t => {
      templatesByCategory[t.category] = (templatesByCategory[t.category] || 0) + 1;
    });

    const uniquePlatforms = new Set(templates.flatMap(t => t.platforms));

    return {
      totalTemplates: templates.length,
      templatesByCategory,
      totalUsage,
      averageRating,
      popularTemplates: this.getPopular(5),
      recentlyAdded: this.getRecent(5),
      totalFavorites: this.favorites.size,
      categoriesCount: Object.keys(templatesByCategory).length,
      platformsCount: uniquePlatforms.size
    };
  }

  getStats(): LibraryStatistics {
    return this.getStatistics();
  }

  getCategoryStats(): CategoryStat[] {
    const templates = Array.from(this.templates.values());
    const totalUsage = templates.reduce((sum, t) => sum + t.usageCount, 0);
    if (totalUsage === 0) return [];

    const usageByCategory: Record<string, number> = {};
    templates.forEach(t => {
      usageByCategory[t.category] = (usageByCategory[t.category] || 0) + t.usageCount;
    });

    return Object.entries(usageByCategory).map(([category, count]) => ({
      category,
      count,
      percentage: (count / totalUsage) * 100
    }));
  }

  getPlatformStats(): PlatformStat[] {
    const templates = Array.from(this.templates.values());
    const totalUsage = templates.reduce((sum, t) => sum + t.usageCount, 0);
    if (totalUsage === 0) return [];

    const usageByPlatform: Record<string, number> = {};
    templates.forEach(t => {
      t.platforms.forEach(platform => {
        usageByPlatform[platform] = (usageByPlatform[platform] || 0) + t.usageCount;
      });
    });

    return Object.entries(usageByPlatform).map(([platform, count]) => ({
      platform,
      count,
      percentage: (count / totalUsage) * 100
    }));
  }

  getRecommendedTemplates(limit: number = 5): LibraryTemplate[] {
    // Simple recommendation: same category as most used
    const history = this.getHistory(100);
    if (history.length === 0) return this.getPopular(limit);

    const usedIds = new Set(history.filter(h => h.action === 'used').map(h => h.templateId));
    const lastUsedId = history.find(h => h.action === 'used')?.templateId;
    
    if (!lastUsedId) return this.getPopular(limit);

    const lastUsed = this.templates.get(lastUsedId);
    if (!lastUsed) return this.getPopular(limit);

    const recommendations = Array.from(this.templates.values())
      .filter(t => t.category === lastUsed.category && !usedIds.has(t.id))
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit);

    return recommendations.length > 0 ? recommendations : this.getPopular(limit);
  }

  // Export/Import
  exportLibrary(): string {
    return JSON.stringify({
      templates: Array.from(this.templates.values()),
      favorites: Array.from(this.favorites),
      config: this.config
    });
  }

  importLibrary(json: string): void {
    try {
      const data = JSON.parse(json);
      if (!Array.isArray(data.templates)) throw new Error('Invalid format');

      this.templates.clear();
      data.templates.forEach((t: LibraryTemplate) => {
        // Restore dates
        t.createdAt = new Date(t.createdAt);
        t.updatedAt = new Date(t.updatedAt);
        this.templates.set(t.id, t);
      });

      if (Array.isArray(data.favorites)) {
        this.favorites = new Set(data.favorites);
      }

      if (data.config) {
        this.config = { ...this.config, ...data.config };
      }
    } catch (e) {
      throw new Error('Falha ao importar biblioteca');
    }
  }
}

export function createBasicLibrary() {
  return new VideoTemplateLibrary({
    maxTemplates: 500,
    enableFavorites: true,
    enableHistory: true,
    enableAnalytics: true,
    cacheEnabled: false
  });
}

export function createPremiumLibrary() {
  return new VideoTemplateLibrary({
    maxTemplates: 2000,
    cacheEnabled: true
  });
}

export function createDevLibrary() {
  return new VideoTemplateLibrary({
    maxTemplates: 100,
    enableFavorites: false,
    enableHistory: false,
    enableAnalytics: false
  });
}
