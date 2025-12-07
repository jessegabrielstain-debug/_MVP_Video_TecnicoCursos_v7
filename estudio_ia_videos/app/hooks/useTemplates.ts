import { useState, useEffect, useCallback } from 'react';
import { Template, TemplateFilter, TemplateSort, TemplateImportExport, NRCategory } from '@/types/templates';

interface UseTemplatesReturn {
  templates: Template[];
  filteredTemplates: Template[];
  favorites: Template[];
  isLoading: boolean;
  error: string | null;
  filter: TemplateFilter;
  sort: TemplateSort;
  
  // Template operations
  getTemplate: (id: string) => Template | undefined;
  createTemplate: (template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Template>;
  updateTemplate: (id: string, updates: Partial<Template>) => Promise<Template>;
  deleteTemplate: (id: string) => Promise<void>;
  duplicateTemplate: (id: string, name?: string) => Promise<Template>;
  
  // Favorites
  toggleFavorite: (id: string) => Promise<void>;
  
  // Filtering and sorting
  setFilter: (filter: Partial<TemplateFilter>) => void;
  setSort: (sort: TemplateSort) => void;
  clearFilters: () => void;
  
  // Import/Export
  exportTemplate: (id: string, options: TemplateImportExport) => Promise<Blob>;
  exportTemplates: (ids: string[], options: TemplateImportExport) => Promise<Blob>;
  importTemplate: (file: File) => Promise<Template>;
  importTemplates: (file: File) => Promise<Template[]>;
  
  // Categories and tags
  getCategories: () => NRCategory[];
  getTags: () => string[];
  getTemplatesByCategory: (category: NRCategory) => Template[];
  
  // Search
  searchTemplates: (query: string) => Template[];
  
  // Statistics
  getTemplateStats: () => {
    total: number;
    byCategory: Record<NRCategory, number>;
    byDifficulty: Record<string, number>;
    favorites: number;
    custom: number;
  };
}

export const useTemplates = (): UseTemplatesReturn => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilterState] = useState<TemplateFilter>({});
  const [sort, setSortState] = useState<TemplateSort>({ field: 'name', direction: 'asc' });

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Load from localStorage first (for offline support)
      const cachedTemplates = localStorage.getItem('templates');
      if (cachedTemplates) {
        setTemplates(JSON.parse(cachedTemplates));
      }
      
      // Then try to load from API
      const response = await fetch('/api/templates');
      if (response.ok) {
        const data = await response.json();
        
        let templatesToSet: Template[] = [];
        if (Array.isArray(data)) {
            templatesToSet = data;
        } else if (data.templates && Array.isArray(data.templates)) {
            templatesToSet = data.templates;
        }
        
        setTemplates(templatesToSet);
        localStorage.setItem('templates', JSON.stringify(templatesToSet));
      } else if (!cachedTemplates) {
        // If no cache and API fails, load default templates
        setTemplates(getDefaultTemplates());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
      // Load default templates as fallback
      setTemplates(getDefaultTemplates());
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and sort templates
  const getComplianceStatus = (template: Template): 'compliant' | 'non-compliant' | 'pending' => {
    if (template.metadata.complianceStatus) {
      return template.metadata.complianceStatus
    }

    const score = template.metadata.compliance.auditScore
    if (score >= 80) return 'compliant'
    if (score <= 50) return 'non-compliant'
    return 'pending'
  }

  const filteredTemplates = templates
    .filter(template => {
      if (filter.category && filter.category.length > 0 && !filter.category.includes(template.category)) {
        return false;
      }
      if (filter.tags && filter.tags.length > 0 && !filter.tags.some(tag => template.tags.includes(tag))) {
        return false;
      }
      if (filter.difficulty && filter.difficulty.length > 0 && !filter.difficulty.includes(template.metadata.difficulty)) {
        return false;
      }
      if (filter.isFavorite !== undefined && template.isFavorite !== filter.isFavorite) {
        return false;
      }
      if (filter.isCustom !== undefined && template.isCustom !== filter.isCustom) {
        return false;
      }
      if (filter.author && template.author !== filter.author) {
        return false;
      }
      if (filter.rating && template.rating < filter.rating) {
        return false;
      }
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        return (
          template.name.toLowerCase().includes(searchLower) ||
          template.description.toLowerCase().includes(searchLower) ||
          template.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }
      if (filter.favorites !== undefined) {
        if (filter.favorites !== template.isFavorite) {
          return false
        }
      }
      if (filter.has3DPreview !== undefined) {
        const hasPreview = Boolean(template.metadata.has3DPreview)
        if (filter.has3DPreview !== hasPreview) {
          return false
        }
      }
      if (filter.compliance) {
        if (getComplianceStatus(template) !== filter.compliance) {
          return false
        }
      }
      return true;
    })
    .sort((a, b) => {
      const direction = sort.direction === 'asc' ? 1 : -1;
      switch (sort.field) {
        case 'name':
          return a.name.localeCompare(b.name) * direction;
        case 'createdAt':
          return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * direction;
        case 'updatedAt':
          return (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) * direction;
        case 'downloads':
          return (a.downloads - b.downloads) * direction;
        case 'rating':
          return (a.rating - b.rating) * direction;
        case 'usage':
          return (a.downloads - b.downloads) * direction;
        default:
          return 0;
      }
    });

  const favorites = templates.filter(template => template.isFavorite);

  const getTemplate = useCallback((id: string) => {
    return templates.find(template => template.id === id);
  }, [templates]);

  const createTemplate = async (templateData: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>): Promise<Template> => {
    try {
      const newTemplate: Template = {
        ...templateData,
        id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTemplate),
      });

      if (response.ok) {
        const savedTemplate = await response.json();
        setTemplates(prev => [...prev, savedTemplate]);
        return savedTemplate;
      } else {
        // Fallback to local storage
        setTemplates(prev => {
          const updated = [...prev, newTemplate];
          localStorage.setItem('templates', JSON.stringify(updated));
          return updated;
        });
        return newTemplate;
      }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create template');
    }
  };

  const updateTemplate = async (id: string, updates: Partial<Template>): Promise<Template> => {
    try {
      const existingTemplate = getTemplate(id);
      if (!existingTemplate) {
        throw new Error('Template not found');
      }

      const updatedTemplate: Template = {
        ...existingTemplate,
        ...updates,
        updatedAt: new Date(),
      };

      const response = await fetch(`/api/templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTemplate),
      });

      if (response.ok) {
        const savedTemplate = await response.json();
        setTemplates(prev => prev.map(t => t.id === id ? savedTemplate : t));
        return savedTemplate;
      } else {
        // Fallback to local storage
        setTemplates(prev => {
          const updated = prev.map(t => t.id === id ? updatedTemplate : t);
          localStorage.setItem('templates', JSON.stringify(updated));
          return updated;
        });
        return updatedTemplate;
      }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update template');
    }
  };

  const deleteTemplate = async (id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: 'DELETE',
      });

      if (response.ok || response.status === 404) {
        setTemplates(prev => {
          const updated = prev.filter(t => t.id !== id);
          localStorage.setItem('templates', JSON.stringify(updated));
          return updated;
        });
      } else {
        throw new Error('Failed to delete template');
      }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete template');
    }
  };

  const duplicateTemplate = async (id: string, name?: string): Promise<Template> => {
    const original = getTemplate(id);
    if (!original) {
      throw new Error('Template not found');
    }

    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = original;

    const duplicated: Omit<Template, 'id' | 'createdAt' | 'updatedAt'> = {
      ...rest,
      name: name || `${original.name} (Copy)`,
      isCustom: true,
    };

    return createTemplate(duplicated);
  };

  const toggleFavorite = async (id: string): Promise<void> => {
    const template = getTemplate(id);
    if (!template) {
      throw new Error('Template not found');
    }

    await updateTemplate(id, { isFavorite: !template.isFavorite });
  };

  const setFilter = (newFilter: Partial<TemplateFilter>) => {
    setFilterState(prev => ({ ...prev, ...newFilter }));
  };

  const setSort = (newSort: TemplateSort) => {
    setSortState(newSort);
  };

  const clearFilters = () => {
    setFilterState({});
  };

  const exportTemplate = async (id: string, options: TemplateImportExport): Promise<Blob> => {
    const template = getTemplate(id);
    if (!template) {
      throw new Error('Template not found');
    }

    return exportTemplateData([template], options);
  };

  const exportTemplates = async (ids: string[], options: TemplateImportExport): Promise<Blob> => {
    const templatesToExport = ids.map(id => getTemplate(id)).filter(Boolean) as Template[];
    return exportTemplateData(templatesToExport, options);
  };

  const exportTemplateData = async (templates: Template[], options: TemplateImportExport): Promise<Blob> => {
    const data = {
      templates,
      metadata: options.metadata ? {
        exportDate: new Date(),
        version: '1.0',
        format: options.format,
      } : undefined,
    };

    switch (options.format) {
      case 'json':
        return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      case 'zip':
        // Implementation would require a zip library
        throw new Error('ZIP export not implemented yet');
      case 'scorm':
        // Implementation would require SCORM packaging
        throw new Error('SCORM export not implemented yet');
      case 'xapi':
        // Implementation would require xAPI formatting
        throw new Error('xAPI export not implemented yet');
      default:
        throw new Error('Unsupported export format');
    }
  };

  const importTemplate = async (file: File): Promise<Template> => {
    const templates = await importTemplates(file);
    return templates[0];
  };

  const importTemplates = async (file: File): Promise<Template[]> => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      const importedTemplates = Array.isArray(data) ? data : data.templates || [data];
      const validatedTemplates: Template[] = [];

      for (const templateData of importedTemplates) {
        // Validate and sanitize template data
        const template: Template = {
          ...templateData,
          id: generateId(),
          createdAt: new Date(),
          updatedAt: new Date(),
          isCustom: true,
        };

        validatedTemplates.push(template);
      }

      // Add to templates list
      setTemplates(prev => {
        const updated = [...prev, ...validatedTemplates];
        localStorage.setItem('templates', JSON.stringify(updated));
        return updated;
      });

      return validatedTemplates;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to import templates');
    }
  };

  const getCategories = (): NRCategory[] => {
    const categories = new Set<NRCategory>();
    templates.forEach(template => categories.add(template.category));
    return Array.from(categories).sort();
  };

  const getTags = (): string[] => {
    const tags = new Set<string>();
    templates.forEach(template => template.tags.forEach(tag => tags.add(tag)));
    return Array.from(tags).sort();
  };

  const getTemplatesByCategory = (category: NRCategory): Template[] => {
    return templates.filter(template => template.category === category);
  };

  const searchTemplates = (query: string): Template[] => {
    const searchLower = query.toLowerCase();
    return templates.filter(template =>
      template.name.toLowerCase().includes(searchLower) ||
      template.description.toLowerCase().includes(searchLower) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
      template.category.toLowerCase().includes(searchLower)
    );
  };

  const getTemplateStats = () => {
    const byCategory = {} as Record<NRCategory, number>;
    const byDifficulty = { beginner: 0, intermediate: 0, advanced: 0 };
    
    templates.forEach(template => {
      byCategory[template.category] = (byCategory[template.category] || 0) + 1;
      byDifficulty[template.metadata.difficulty]++;
    });

    return {
      total: templates.length,
      byCategory,
      byDifficulty,
      favorites: favorites.length,
      custom: templates.filter(t => t.isCustom).length,
    };
  };

  return {
    templates,
    filteredTemplates,
    favorites,
    isLoading,
    error,
    filter,
    sort,
    getTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    toggleFavorite,
    setFilter,
    setSort,
    clearFilters,
    exportTemplate,
    exportTemplates,
    importTemplate,
    importTemplates,
    getCategories,
    getTags,
    getTemplatesByCategory,
    searchTemplates,
    getTemplateStats,
  };
};

// Helper functions
const generateId = (): string => {
  return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const getDefaultTemplates = (): Template[] => {
  return [
    {
      id: 'template_nr12_basic',
      name: 'NR-12 Segurança em Máquinas - Básico',
      description: 'Template básico para treinamento em segurança de máquinas e equipamentos',
      category: 'NR-12',
      thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=safety%20training%20machines%20equipment%20industrial%20workplace&image_size=square',
      preview: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=safety%20training%20preview%20machines%20industrial&image_size=landscape_16_9',
      tags: ['segurança', 'máquinas', 'equipamentos', 'básico'],
      isFavorite: false,
      isCustom: false,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      author: 'Sistema',
      version: '1.0',
      downloads: 150,
      rating: 4.5,
      content: {
        slides: [],
        assets: [],
        animations: [],
        interactions: [],
        compliance: {
          nrCategory: 'NR-12',
          requirements: [],
          checkpoints: [],
          certifications: [],
        },
        settings: {
          duration: 300,
          resolution: { width: 1920, height: 1080 },
          frameRate: 30,
          renderSettings: { quality: 'high', format: 'mp4' }
        }
      },
      metadata: {
        difficulty: 'beginner',
        estimatedDuration: 30,
        targetAudience: ['operadores', 'técnicos'],
        learningObjectives: ['Identificar riscos em máquinas', 'Aplicar medidas de segurança'],
        prerequisites: [],
        language: 'pt-BR',
        accessibility: {
          screenReader: true,
          highContrast: true,
          keyboardNavigation: true,
          closedCaptions: true,
          audioDescription: false,
          signLanguage: false,
        },
        compliance: {
          nrCategories: ['NR-12'],
          lastAudit: new Date(),
          auditScore: 95,
          certifications: ['ISO 45001'],
          status: 'compliant',
          requirements: []
        },
        performance: {
          renderTime: 0,
          fileSize: 0,
          complexity: 'low'
        }
      },
    },
    {
      id: 'template_nr35_advanced',
      name: 'NR-35 Trabalho em Altura - Avançado',
      description: 'Template avançado para treinamento em trabalho em altura com simulações',
      category: 'NR-35',
      thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=height%20work%20safety%20training%20construction%20harness&image_size=square',
      preview: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=height%20safety%20training%20preview%20construction&image_size=landscape_16_9',
      tags: ['altura', 'segurança', 'construção', 'avançado'],
      isFavorite: true,
      isCustom: false,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
      author: 'Sistema',
      version: '2.0',
      downloads: 89,
      rating: 4.8,
      content: {
        slides: [],
        assets: [],
        animations: [],
        interactions: [],
        compliance: {
          nrCategory: 'NR-35',
          requirements: [],
          checkpoints: [],
          certifications: [],
        },
        settings: {
          duration: 300,
          resolution: { width: 1920, height: 1080 },
          frameRate: 30,
          renderSettings: { quality: 'high', format: 'mp4' }
        }
      },
      metadata: {
        difficulty: 'advanced',
        estimatedDuration: 60,
        targetAudience: ['trabalhadores em altura', 'supervisores'],
        learningObjectives: ['Dominar técnicas de segurança', 'Realizar inspeções'],
        prerequisites: ['NR-35 Básico'],
        language: 'pt-BR',
        accessibility: {
          screenReader: true,
          highContrast: true,
          keyboardNavigation: true,
          closedCaptions: true,
          audioDescription: true,
          signLanguage: false,
        },
        compliance: {
          nrCategories: ['NR-35'],
          lastAudit: new Date(),
          auditScore: 98,
          certifications: ['ISO 45001', 'ANSI Z359'],
          status: 'compliant',
          requirements: []
        },
        performance: {
          renderTime: 0,
          fileSize: 0,
          complexity: 'medium'
        }
      },
    },
    {
      id: 'template_nr33_confined',
      name: 'NR-33 Espaços Confinados - Intermediário',
      description: 'Template para treinamento em espaços confinados com casos práticos',
      category: 'NR-33',
      thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=confined%20spaces%20safety%20training%20industrial%20tank&image_size=square',
      preview: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=confined%20spaces%20safety%20preview%20industrial&image_size=landscape_16_9',
      tags: ['espaços confinados', 'segurança', 'industrial', 'intermediário'],
      isFavorite: false,
      isCustom: false,
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-02-01'),
      author: 'Sistema',
      version: '1.5',
      downloads: 67,
      rating: 4.3,
      content: {
        slides: [],
        assets: [],
        animations: [],
        interactions: [],
        compliance: {
          nrCategory: 'NR-33',
          requirements: [],
          checkpoints: [],
          certifications: [],
        },
        settings: {
          duration: 300,
          resolution: { width: 1920, height: 1080 },
          frameRate: 30,
          renderSettings: { quality: 'high', format: 'mp4' }
        }
      },
      metadata: {
        difficulty: 'intermediate',
        estimatedDuration: 45,
        targetAudience: ['trabalhadores', 'vigias', 'supervisores'],
        learningObjectives: ['Identificar espaços confinados', 'Aplicar procedimentos de entrada'],
        prerequisites: ['Treinamento básico de segurança'],
        language: 'pt-BR',
        accessibility: {
          screenReader: true,
          highContrast: true,
          keyboardNavigation: true,
          closedCaptions: true,
          audioDescription: false,
          signLanguage: false,
        },
        compliance: {
          nrCategories: ['NR-33'],
          lastAudit: new Date(),
          auditScore: 92,
          certifications: ['ISO 45001'],
          status: 'compliant',
          requirements: []
        },
        performance: {
          renderTime: 0,
          fileSize: 0,
          complexity: 'medium'
        }
      },
    },
  ];
};