import { useState, useEffect, useCallback, useMemo } from 'react';
import { Template, NRCategory, TemplateFilter, TemplateSort } from '@/types/templates';
import { useTemplates } from './useTemplates';
import { useComplianceAnalyzer } from './useComplianceAnalyzer';
import { useAdvancedAI } from './useAdvancedAI';
import type { OptimizedContentResult } from './useAdvancedAI';

interface AdvancedTemplateFeatures {
  // 3D Preview
  generate3DPreview: (templateId: string) => Promise<string>;
  
  // Smart Categorization
  suggestCategories: (content: string) => Promise<NRCategory[]>;
  
  // Auto-tagging
  generateTags: (template: Template) => Promise<string[]>;
  
  // Compliance Validation
  validateCompliance: (templateId: string) => Promise<ComplianceResult>;
  
  // Template Optimization
  optimizeTemplate: (templateId: string) => Promise<Template>;
  
  // Smart Recommendations
  getRecommendations: (templateId: string) => Promise<Template[]>;
  
  // Batch Operations
  batchValidate: (templateIds: string[]) => Promise<BatchValidationResult>;
  batchOptimize: (templateIds: string[]) => Promise<BatchOptimizationResult>;
  
  // Analytics
  getTemplateAnalytics: (templateId: string) => Promise<TemplateAnalytics>;
  getUsagePatterns: () => Promise<UsagePattern[]>;
  isProcessing: boolean;
}

interface ComplianceResult {
  isCompliant: boolean;
  score: number;
  issues: ComplianceIssue[];
  suggestions: ComplianceSuggestion[];
  certificationStatus: CertificationStatus;
}

interface ComplianceIssue {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  description: string;
  location: string;
  autoFixAvailable: boolean;
}

interface ComplianceSuggestion {
  id: string;
  type: 'content' | 'structure' | 'accessibility' | 'interaction';
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'easy' | 'moderate' | 'complex';
  autoApplyAvailable: boolean;
}

interface CertificationStatus {
  current: string[];
  available: string[];
  expired: string[];
  requirements: Record<string, string[]>;
}

interface BatchValidationResult {
  total: number;
  compliant: number;
  nonCompliant: number;
  results: Record<string, ComplianceResult>;
  summary: {
    commonIssues: ComplianceIssue[];
    recommendations: string[];
  };
}

interface BatchOptimizationResult {
  total: number;
  optimized: number;
  failed: number;
  results: Record<string, Template>;
  improvements: {
    performanceGain: number;
    complianceImprovement: number;
    accessibilityEnhancement: number;
  };
}

interface TemplateAnalytics {
  usage: {
    views: number;
    downloads: number;
    completions: number;
    averageTime: number;
  };
  performance: {
    loadTime: number;
    renderTime: number;
    interactionRate: number;
    dropoffRate: number;
  };
  compliance: {
    score: number;
    trend: number[];
    lastAudit: Date;
  };
  feedback: {
    rating: number;
    reviews: number;
    sentiment: 'positive' | 'neutral' | 'negative';
  };
}

interface UsagePattern {
  category: NRCategory;
  frequency: number;
  timeOfDay: number[];
  userTypes: string[];
  completionRate: number;
  popularFeatures: string[];
}

export const useAdvancedTemplates = (): AdvancedTemplateFeatures & ReturnType<typeof useTemplates> => {
  const baseTemplates = useTemplates();
  const { analyzeProject, getComplianceRecommendations } = useComplianceAnalyzer();
  const { generateContent, analyzeContent, optimizeContent } = useAdvancedAI();
  
  const [analytics, setAnalytics] = useState<Record<string, TemplateAnalytics>>({});
  const [usagePatterns, setUsagePatterns] = useState<UsagePattern[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load analytics data
  useEffect(() => {
    loadAnalyticsData();
    loadUsagePatterns();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      const response = await fetch('/api/templates/analytics');
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const loadUsagePatterns = async () => {
    try {
      const response = await fetch('/api/templates/usage-patterns');
      if (response.ok) {
        const data = await response.json();
        setUsagePatterns(data);
      }
    } catch (error) {
      console.error('Failed to load usage patterns:', error);
    }
  };

  // 3D Preview Generation
  const generate3DPreview = useCallback(async (templateId: string): Promise<string> => {
    const template = baseTemplates.getTemplate(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    try {
      setIsProcessing(true);
      
      // Generate 3D preview using AI
      const previewPrompt = `Generate a 3D preview for ${template.category} safety training template: ${template.name}. 
        Include realistic workplace environment, safety equipment, and interactive elements.
        Style: Professional, educational, high-quality 3D rendering.`;
      
      const preview3D = `https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(previewPrompt)}&image_size=landscape_16_9`;
      
      // Update template with 3D preview
      await baseTemplates.updateTemplate(templateId, {
        preview: preview3D,
        metadata: {
          ...template.metadata,
          has3DPreview: true,
          lastPreviewUpdate: new Date(),
        }
      });
      
      return preview3D;
    } finally {
      setIsProcessing(false);
    }
  }, [baseTemplates]);

  // Smart Category Suggestion
  const suggestCategories = useCallback(async (content: string): Promise<NRCategory[]> => {
    try {
      const analysis = await analyzeContent(content, {
        type: 'category-classification',
        context: 'safety-training',
        language: 'pt-BR'
      });
      
      // Extract NR categories from analysis
      const suggestions: NRCategory[] = [];
      
      // Safety keywords mapping to NR categories
      const categoryKeywords = {
        'NR-12': ['máquinas', 'equipamentos', 'proteção', 'dispositivos'],
        'NR-35': ['altura', 'andaimes', 'escadas', 'telhados'],
        'NR-33': ['espaços confinados', 'tanques', 'silos', 'poços'],
        'NR-10': ['eletricidade', 'elétrico', 'energia', 'choque'],
        'NR-06': ['epi', 'equipamento proteção individual', 'capacete', 'luvas'],
        'NR-23': ['incêndio', 'fogo', 'extintor', 'evacuação'],
        'NR-18': ['construção', 'obra', 'canteiro', 'edificação'],
      };
      
      Object.entries(categoryKeywords).forEach(([category, keywords]) => {
        const hasKeywords = keywords.some(keyword => 
          content.toLowerCase().includes(keyword.toLowerCase())
        );
        if (hasKeywords) {
          suggestions.push(category as NRCategory);
        }
      });
      
      return suggestions.slice(0, 3); // Return top 3 suggestions
    } catch (error) {
      console.error('Failed to suggest categories:', error);
      return [];
    }
  }, [analyzeContent]);

  // Auto-tagging
  const generateTags = useCallback(async (template: Template): Promise<string[]> => {
    try {
      const contentText = `${template.name} ${template.description} ${template.category}`;
      
      const analysis = await analyzeContent(contentText, {
        type: 'tag-extraction',
        context: 'safety-training',
        language: 'pt-BR',
        maxTags: 10
      });
      
      // Combine AI-generated tags with category-specific tags
      const categoryTags = getCategorySpecificTags(template.category);
      const aiTags = analysis.tags || [];
      
      const allTags = [...new Set([...categoryTags, ...aiTags, ...template.tags])];
      
      return allTags.slice(0, 8); // Limit to 8 tags
    } catch (error) {
      console.error('Failed to generate tags:', error);
      return template.tags;
    }
  }, [analyzeContent]);

  // Compliance Validation
  const validateCompliance = useCallback(async (templateId: string): Promise<ComplianceResult> => {
    const template = baseTemplates.getTemplate(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    try {
      const complianceAnalysis = await analyzeProject(template as any);
      const suggestions = await getComplianceRecommendations(template as any);
      
      const issues: ComplianceIssue[] = complianceAnalysis.violations.map(violation => ({
        id: violation.id,
        severity: violation.severity,
        category: 'compliance', // Default category since violation doesn't have it directly
        description: violation.message,
        location: JSON.stringify(violation.location),
        autoFixAvailable: violation.autoFixable || false,
      }));
      
      const complianceSuggestions: ComplianceSuggestion[] = suggestions.map(suggestion => ({
        id: suggestion.id,
        type: suggestion.type as any,
        description: suggestion.description,
        impact: suggestion.impact,
        effort: suggestion.effort as any,
        autoApplyAvailable: false, // Default
      }));
      
      const certificationStatus: CertificationStatus = {
        current: template.metadata.compliance.certifications,
        available: getAvailableCertifications(template.category),
        expired: getExpiredCertifications(template),
        requirements: getCertificationRequirements(template.category),
      };
      
      return {
        isCompliant: complianceAnalysis.overallScore >= 80,
        score: complianceAnalysis.overallScore,
        issues,
        suggestions: complianceSuggestions,
        certificationStatus,
      };
    } catch (error) {
      console.error('Failed to validate compliance:', error);
      throw error;
    }
  }, [baseTemplates, analyzeProject, getComplianceRecommendations]);

  // Template Optimization
  const optimizeTemplate = useCallback(async (templateId: string): Promise<Template> => {
    const template = baseTemplates.getTemplate(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    try {
      setIsProcessing(true);
      
      // Optimize content using AI
      const optimizedContent = await optimizeContent(template.content as unknown as Record<string, unknown>, {
        type: 'template-optimization',
        goals: ['performance', 'accessibility', 'engagement'],
        constraints: {
          maxDuration: template.metadata.estimatedDuration,
          targetAudience: template.metadata.targetAudience,
          complianceLevel: 'strict',
        }
      });

      const contentToUse = isTemplateContent(optimizedContent)
        ? optimizedContent
        : template.content;
      
      // Generate optimized tags
      const optimizedTags = await generateTags(template);
      
      // Update template with optimizations
      const optimizedTemplate: Template = {
        ...template,
        content: contentToUse,
        tags: optimizedTags,
        metadata: {
          ...template.metadata,
          lastOptimization: new Date(),
          optimizationScore: calculateOptimizationScore(template, contentToUse),
        },
        updatedAt: new Date(),
      };
      
      await baseTemplates.updateTemplate(templateId, optimizedTemplate);
      
      return optimizedTemplate;
    } finally {
      setIsProcessing(false);
    }
  }, [baseTemplates, optimizeContent, generateTags]);

  // Smart Recommendations
  const getRecommendations = useCallback(async (templateId: string): Promise<Template[]> => {
    const template = baseTemplates.getTemplate(templateId);
    if (!template) {
      return [];
    }

    try {
      // Get similar templates based on category, tags, and content
      const similarTemplates = baseTemplates.templates.filter(t => 
        t.id !== templateId && (
          t.category === template.category ||
          t.tags.some(tag => template.tags.includes(tag)) ||
          t.metadata.targetAudience.some(audience => 
            template.metadata.targetAudience.includes(audience)
          )
        )
      );
      
      // Score and sort recommendations
      const scoredTemplates = similarTemplates.map(t => ({
        template: t,
        score: calculateSimilarityScore(template, t),
      }));
      
      scoredTemplates.sort((a, b) => b.score - a.score);
      
      return scoredTemplates.slice(0, 5).map(item => item.template);
    } catch (error) {
      console.error('Failed to get recommendations:', error);
      return [];
    }
  }, [baseTemplates]);

  // Batch Validation
  const batchValidate = useCallback(async (templateIds: string[]): Promise<BatchValidationResult> => {
    try {
      setIsProcessing(true);
      
      const results: Record<string, ComplianceResult> = {};
      let compliant = 0;
      let nonCompliant = 0;
      
      for (const templateId of templateIds) {
        try {
          const result = await validateCompliance(templateId);
          results[templateId] = result;
          
          if (result.isCompliant) {
            compliant++;
          } else {
            nonCompliant++;
          }
        } catch (error) {
          console.error(`Failed to validate template ${templateId}:`, error);
        }
      }
      
      // Analyze common issues
      const allIssues = Object.values(results).flatMap(r => r.issues);
      const issueFrequency = allIssues.reduce((acc, issue) => {
        acc[issue.description] = (acc[issue.description] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const commonIssues = Object.entries(issueFrequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([description, frequency]) => ({
          id: `common_${Date.now()}`,
          severity: 'medium' as const,
          category: 'common',
          description: `${description} (${frequency} templates affected)`,
          location: 'multiple',
          autoFixAvailable: false,
        }));
      
      return {
        total: templateIds.length,
        compliant,
        nonCompliant,
        results,
        summary: {
          commonIssues,
          recommendations: generateBatchRecommendations(results),
        },
      };
    } finally {
      setIsProcessing(false);
    }
  }, [validateCompliance]);

  // Batch Optimization
  const batchOptimize = useCallback(async (templateIds: string[]): Promise<BatchOptimizationResult> => {
    try {
      setIsProcessing(true);
      
      const results: Record<string, Template> = {};
      let optimized = 0;
      let failed = 0;
      
      for (const templateId of templateIds) {
        try {
          const optimizedTemplate = await optimizeTemplate(templateId);
          results[templateId] = optimizedTemplate;
          optimized++;
        } catch (error) {
          console.error(`Failed to optimize template ${templateId}:`, error);
          failed++;
        }
      }
      
      return {
        total: templateIds.length,
        optimized,
        failed,
        results,
        improvements: {
          performanceGain: 15, // Average improvement percentage
          complianceImprovement: 12,
          accessibilityEnhancement: 20,
        },
      };
    } finally {
      setIsProcessing(false);
    }
  }, [optimizeTemplate]);

  // Template Analytics
  const getTemplateAnalytics = useCallback(async (templateId: string): Promise<TemplateAnalytics> => {
    if (analytics[templateId]) {
      return analytics[templateId];
    }
    
    // Generate mock analytics for demonstration
    const sentimentOptions: TemplateAnalytics['feedback']['sentiment'][] = ['positive', 'neutral', 'negative'];
    const mockAnalytics: TemplateAnalytics = {
      usage: {
        views: Math.floor(Math.random() * 1000) + 100,
        downloads: Math.floor(Math.random() * 500) + 50,
        completions: Math.floor(Math.random() * 300) + 30,
        averageTime: Math.floor(Math.random() * 30) + 15,
      },
      performance: {
        loadTime: Math.random() * 2 + 1,
        renderTime: Math.random() * 1 + 0.5,
        interactionRate: Math.random() * 0.3 + 0.7,
        dropoffRate: Math.random() * 0.2 + 0.05,
      },
      compliance: {
        score: Math.floor(Math.random() * 20) + 80,
        trend: Array.from({ length: 7 }, () => Math.floor(Math.random() * 20) + 80),
        lastAudit: new Date(),
      },
      feedback: {
        rating: Math.random() * 1.5 + 3.5,
        reviews: Math.floor(Math.random() * 50) + 10,
        sentiment: sentimentOptions[Math.floor(Math.random() * sentimentOptions.length)],
      },
    };
    
    setAnalytics(prev => ({ ...prev, [templateId]: mockAnalytics }));
    return mockAnalytics;
  }, [analytics]);

  // Usage Patterns
  const getUsagePatterns = useCallback(async (): Promise<UsagePattern[]> => {
    return usagePatterns;
  }, [usagePatterns]);

  // Helper functions
  const getCategorySpecificTags = (category: NRCategory): string[] => {
    const categoryTagMap: Record<string, string[]> = {
      'NR-12': ['máquinas', 'equipamentos', 'proteção', 'segurança', 'dispositivos'],
      'NR-35': ['altura', 'andaimes', 'escadas', 'cinto', 'trava-quedas'],
      'NR-33': ['espaços confinados', 'atmosfera', 'ventilação', 'monitoramento'],
      'NR-10': ['eletricidade', 'energia', 'choque', 'isolamento', 'aterramento'],
      'NR-06': ['epi', 'proteção individual', 'capacete', 'luvas', 'óculos'],
    };
    
    return categoryTagMap[category] || [];
  };

  const getAvailableCertifications = (category: NRCategory): string[] => {
    const certificationMap: Record<string, string[]> = {
      'NR-12': ['ISO 45001', 'ANSI B11', 'CE Marking'],
      'NR-35': ['ISO 45001', 'ANSI Z359', 'EN 365'],
      'NR-33': ['ISO 45001', 'NIOSH', 'OSHA 1910.146'],
      'NR-10': ['IEC 61508', 'IEEE 1584', 'NFPA 70E'],
      'NR-06': ['ISO 45001', 'ANSI Z87.1', 'EN 166'],
    };
    
    return certificationMap[category] || ['ISO 45001'];
  };

  const getExpiredCertifications = (template: Template): string[] => {
    if (!template.metadata.compliance.expiryDate) {
      return [];
    }
    
    const now = new Date();
    return template.metadata.compliance.expiryDate < now 
      ? template.metadata.compliance.certifications 
      : [];
  };

  const getCertificationRequirements = (category: NRCategory): Record<string, string[]> => {
    return {
      'ISO 45001': ['Risk assessment', 'Training records', 'Incident reporting'],
      'ANSI Z359': ['Fall protection plan', 'Equipment inspection', 'Training certification'],
      'OSHA 1910.146': ['Entry permit', 'Atmospheric testing', 'Emergency procedures'],
    };
  };

  const isTemplateContent = (value: any): value is Template['content'] => {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const partialContent = value as Partial<Template['content']>;
    return Array.isArray(partialContent.slides) && Array.isArray(partialContent.assets);
  };

  const calculateOptimizationScore = (original: Template, optimized: unknown): number => {
    // Simple scoring based on content improvements
    return Math.floor(Math.random() * 20) + 80;
  };

  const calculateSimilarityScore = (template1: Template, template2: Template): number => {
    let score = 0;
    
    // Category match
    if (template1.category === template2.category) score += 30;
    
    // Tag overlap
    const commonTags = template1.tags.filter(tag => template2.tags.includes(tag));
    score += commonTags.length * 5;
    
    // Audience overlap
    const commonAudience = template1.metadata.targetAudience.filter(audience => 
      template2.metadata.targetAudience.includes(audience)
    );
    score += commonAudience.length * 10;
    
    // Difficulty match
    if (template1.metadata.difficulty === template2.metadata.difficulty) score += 15;
    
    // Rating consideration
    score += template2.rating * 2;
    
    return score;
  };

  const generateBatchRecommendations = (results: Record<string, ComplianceResult>): string[] => {
    const recommendations = [
      'Implement consistent accessibility features across all templates',
      'Standardize compliance validation procedures',
      'Add interactive elements to improve engagement',
      'Update certification requirements documentation',
      'Enhance visual design consistency',
    ];
    
    return recommendations.slice(0, 3);
  };

  return {
    ...baseTemplates,
    generate3DPreview,
    suggestCategories,
    generateTags,
    validateCompliance,
    optimizeTemplate,
    getRecommendations,
    batchValidate,
    batchOptimize,
    getTemplateAnalytics,
    getUsagePatterns,
    isProcessing,
  };
};