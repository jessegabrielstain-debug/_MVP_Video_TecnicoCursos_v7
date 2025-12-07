'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface AIModel {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google' | 'local';
  type: 'text' | 'image' | 'audio' | 'multimodal';
  capabilities: string[];
  maxTokens: number;
  costPerToken: number;
  isAvailable: boolean;
  description?: string;
}

export interface ContentGenerationRequest {
  type: 'text' | 'image' | 'audio' | 'video_script' | 'slide_content' | 'quiz_questions';
  prompt: string;
  model: string;
  parameters: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    style?: string;
    tone?: string;
    audience?: string;
    language?: string;
    format?: string;
    imageSize?: string;
    imageStyle?: string;
    voiceId?: string;
    speed?: number;
  };
  context?: {
    projectId?: string;
    templateId?: string;
    slideId?: string;
    previousContent?: string;
    userPreferences?: Record<string, unknown>;
  };
}

export interface ContentGenerationResult {
  id: string;
  requestId: string;
  type: string;
  content: string | Blob;
  metadata: {
    model: string;
    tokensUsed: number;
    cost: number;
    generationTime: number;
    quality: number;
    confidence: number;
  };
  suggestions?: string[];
  alternatives?: string[];
  createdAt: Date;
}

export interface SentimentAnalysisResult {
  overall: {
    sentiment: 'positive' | 'negative' | 'neutral';
    score: number; // -1 to 1
    confidence: number; // 0 to 1
  };
  emotions: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
    disgust: number;
  };
  aspects: {
    aspect: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    score: number;
    mentions: number;
  }[];
  keywords: {
    word: string;
    sentiment: number;
    frequency: number;
    importance: number;
  }[];
  summary: string;
}

export interface ContentOptimization {
  type: 'readability' | 'engagement' | 'seo' | 'accessibility' | 'compliance';
  suggestions: {
    id: string;
    type: 'improvement' | 'warning' | 'error';
    title: string;
    description: string;
    impact: 'low' | 'medium' | 'high';
    effort: 'low' | 'medium' | 'high';
    category: string;
    originalText?: string;
    suggestedText?: string;
    position?: {
      start: number;
      end: number;
    };
  }[];
  score: number; // 0 to 100
  metrics: {
    readabilityScore: number;
    engagementScore: number;
    seoScore: number;
    accessibilityScore: number;
    complianceScore: number;
  };
}

export interface ContentOptimizationOptions {
  type?: string;
  goals?: string[];
  constraints?: Record<string, unknown>;
  optimizationType?: string[];
  metadata?: Record<string, unknown>;
}

export type OptimizableContentInput =
  | string
  | Record<string, unknown>
  | Array<unknown>
  | ContentGenerationResult
  | ContentOptimization
  | null;

export type OptimizedContentResult =
  | ContentOptimization
  | Exclude<OptimizableContentInput, null>;

const DEFAULT_OPTIMIZATION_TYPES = ['readability', 'engagement', 'seo', 'accessibility', 'compliance'] as const;

const isContentGenerationResultPayload = (
  value: OptimizableContentInput
): value is ContentGenerationResult => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return 'content' in value && 'metadata' in value && 'id' in value;
};

const normalizeOptimizableContent = (content: OptimizableContentInput) => {
  if (content == null) {
    return '';
  }

  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    return content;
  }

  if (isContentGenerationResultPayload(content)) {
    const normalizedContent = {
      ...content,
      content: typeof content.content === 'string' ? content.content : '[binary-content]',
      createdAt:
        content.createdAt instanceof Date ? content.createdAt.toISOString() : content.createdAt,
    };
    return normalizedContent;
  }

  return JSON.parse(JSON.stringify(content));
};

export interface PersonalizationProfile {
  userId: string;
  preferences: {
    contentStyle: string;
    tone: string;
    complexity: 'beginner' | 'intermediate' | 'advanced';
    language: string;
    topics: string[];
    learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  };
  behavior: {
    engagementPatterns: Record<string, number>;
    completionRates: Record<string, number>;
    timeSpent: Record<string, number>;
    interactions: Record<string, number>;
  };
  performance: {
    quizScores: number[];
    progressRate: number;
    strugglingAreas: string[];
    strengths: string[];
  };
  adaptations: {
    contentDifficulty: number;
    pacing: number;
    supportLevel: number;
    feedbackFrequency: number;
  };
}

export type AIInsightData = Record<string, unknown>;

export interface AIInsight {
  id: string;
  type: 'content_suggestion' | 'performance_optimization' | 'user_behavior' | 'trend_analysis' | 'compliance_alert';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  data: AIInsightData;
  actionable: boolean;
  actions?: {
    id: string;
    label: string;
    type: 'auto' | 'manual';
    description: string;
  }[];
  createdAt: Date;
  expiresAt?: Date;
  isRead: boolean;
  isActioned: boolean;
}

export interface AIUsageStats {
  totalRequests: number;
  totalTokensUsed: number;
  totalCost: number;
  requestsByType: Record<string, number>;
  requestsByModel: Record<string, number>;
  averageResponseTime: number;
  successRate: number;
  costByDay: { date: string; cost: number }[];
  popularFeatures: { feature: string; usage: number }[];
  userSatisfaction: number;
}

export type AutoCompleteContext = {
  currentContent?: string;
  contentType?: string;
  targetAudience?: string;
  objectives?: string[];
  metadata?: Record<string, unknown>;
} & Record<string, unknown>;

export const useAdvancedAI = () => {
  const [models, setModels] = useState<AIModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generationHistory, setGenerationHistory] = useState<ContentGenerationResult[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [usageStats, setUsageStats] = useState<AIUsageStats | null>(null);
  const [personalizationProfiles, setPersonalizationProfiles] = useState<PersonalizationProfile[]>([]);

  const abortControllerRef = useRef<AbortController | null>(null);
  const insightGeneratorRef = useRef<NodeJS.Timeout | null>(null);

  // Load available AI models
  const loadModels = useCallback(async () => {
    try {
      const response = await fetch('/api/ai/models');
      if (!response.ok) {
        throw new Error('Failed to load AI models');
      }
      const modelsData = await response.json();
      setModels(modelsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load models');
    }
  }, []);

  // Generate content using AI
  const generateContent = useCallback(async (request: ContentGenerationRequest): Promise<ContentGenerationResult | null> => {
    try {
      setIsLoading(true);
      setError(null);

      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const result = await response.json();
      
      // Add to history
      setGenerationHistory(prev => [result, ...prev.slice(0, 99)]); // Keep last 100

      return result;

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return null; // Request was cancelled
      }
      setError(err instanceof Error ? err.message : 'Failed to generate content');
      return null;
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, []);

  // Analyze sentiment of content
  const analyzeSentiment = useCallback(async (content: string): Promise<SentimentAnalysisResult | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/ai/sentiment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze sentiment');
      }

      const result = await response.json();
      return result;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze sentiment');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Generic content analysis
  const analyzeContent = useCallback(async (
    content: string,
    options: {
      type: string;
      context?: string;
      language?: string;
      maxTags?: number;
    }
  ): Promise<any> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, ...options })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze content');
      }

      return await response.json();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze content');
      return {};
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Optimize content
  const optimizeContent = useCallback(async (
    content: OptimizableContentInput,
    options: ContentOptimizationOptions = {}
  ): Promise<OptimizedContentResult | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const { optimizationType = [...DEFAULT_OPTIMIZATION_TYPES], ...restOptions } = options;
      const normalizedContent = normalizeOptimizableContent(content);

      const response = await fetch('/api/ai/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: normalizedContent,
          optimizationType,
          ...restOptions,
        })
      });

      if (!response.ok) {
        throw new Error('Failed to optimize content');
      }

      const result = await response.json();
      return result as OptimizedContentResult;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to optimize content');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Generate personalized content
  const generatePersonalizedContent = useCallback(async (
    request: ContentGenerationRequest,
    userId: string
  ): Promise<ContentGenerationResult | null> => {
    try {
      const profile = personalizationProfiles.find(p => p.userId === userId);
      
      if (profile) {
        // Enhance request with personalization data
        const enhancedRequest = {
          ...request,
          parameters: {
            ...request.parameters,
            tone: profile.preferences.tone,
            style: profile.preferences.contentStyle,
            complexity: profile.preferences.complexity,
            language: profile.preferences.language
          },
          context: {
            ...request.context,
            userPreferences: profile.preferences,
            userBehavior: profile.behavior,
            userPerformance: profile.performance
          }
        };

        return await generateContent(enhancedRequest);
      }

      return await generateContent(request);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate personalized content');
      return null;
    }
  }, [generateContent, personalizationProfiles]);

  // Update personalization profile
  const updatePersonalizationProfile = useCallback(async (
    userId: string, 
    updates: Partial<PersonalizationProfile>
  ): Promise<void> => {
    try {
      const response = await fetch(`/api/ai/personalization/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Failed to update personalization profile');
      }

      const updatedProfile = await response.json();
      
      setPersonalizationProfiles(prev => 
        prev.map(p => p.userId === userId ? updatedProfile : p)
      );

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update personalization profile');
    }
  }, []);

  // Generate AI insights
  const generateInsights = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysisType: ['content', 'performance', 'user_behavior', 'trends', 'compliance'],
          timeRange: '30d'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate insights');
      }

      const newInsights = await response.json();
      setInsights(prev => [...newInsights, ...prev]);

    } catch (err) {
      console.error('Failed to generate insights:', err);
    }
  }, []);

  // Auto-generate insights periodically
  const startInsightGeneration = useCallback(() => {
    if (insightGeneratorRef.current) {
      clearInterval(insightGeneratorRef.current);
    }

    insightGeneratorRef.current = setInterval(() => {
      generateInsights();
    }, 5 * 60 * 1000); // Every 5 minutes

    // Generate initial insights
    generateInsights();
  }, [generateInsights]);

  // Stop insight generation
  const stopInsightGeneration = useCallback(() => {
    if (insightGeneratorRef.current) {
      clearInterval(insightGeneratorRef.current);
      insightGeneratorRef.current = null;
    }
  }, []);

  // Mark insight as read
  const markInsightAsRead = useCallback(async (insightId: string): Promise<void> => {
    try {
      await fetch(`/api/ai/insights/${insightId}/read`, {
        method: 'POST'
      });

      setInsights(prev => 
        prev.map(insight => 
          insight.id === insightId 
            ? { ...insight, isRead: true }
            : insight
        )
      );

    } catch (err) {
      console.error('Failed to mark insight as read:', err);
    }
  }, []);

  // Execute insight action
  const executeInsightAction = useCallback(async (
    insightId: string, 
    actionId: string
  ): Promise<void> => {
    try {
      const response = await fetch(`/api/ai/insights/${insightId}/actions/${actionId}`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to execute insight action');
      }

      setInsights(prev => 
        prev.map(insight => 
          insight.id === insightId 
            ? { ...insight, isActioned: true }
            : insight
        )
      );

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute insight action');
    }
  }, []);

  // Load usage statistics
  const loadUsageStats = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch('/api/ai/stats');
      if (!response.ok) {
        throw new Error('Failed to load usage stats');
      }
      const stats = await response.json();
      setUsageStats(stats);
    } catch (err) {
      console.error('Failed to load usage stats:', err);
    }
  }, []);

  // Smart content suggestions
  const getSmartSuggestions = useCallback(async (
    context: {
      currentContent?: string;
      contentType?: string;
      targetAudience?: string;
      objectives?: string[];
    }
  ): Promise<string[]> => {
    try {
      const response = await fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(context)
      });

      if (!response.ok) {
        throw new Error('Failed to get suggestions');
      }

      const suggestions = await response.json();
      return suggestions;

    } catch (err) {
      console.error('Failed to get smart suggestions:', err);
      return [];
    }
  }, []);

  // Auto-complete content
  const autoCompleteContent = useCallback(async (
    partialContent: string,
    context?: AutoCompleteContext
  ): Promise<string[]> => {
    try {
      const response = await fetch('/api/ai/autocomplete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          partialContent, 
          context 
        })
      });

      if (!response.ok) {
        throw new Error('Failed to auto-complete content');
      }

      const completions = await response.json();
      return completions;

    } catch (err) {
      console.error('Failed to auto-complete content:', err);
      return [];
    }
  }, []);

  // Translate content
  const translateContent = useCallback(async (
    content: string,
    targetLanguage: string,
    sourceLanguage?: string
  ): Promise<string | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          content, 
          targetLanguage, 
          sourceLanguage 
        })
      });

      if (!response.ok) {
        throw new Error('Failed to translate content');
      }

      const result = await response.json();
      return result.translatedContent;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to translate content');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Summarize content
  const summarizeContent = useCallback(async (
    content: string,
    maxLength?: number,
    style?: 'bullet_points' | 'paragraph' | 'key_points'
  ): Promise<string | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          content, 
          maxLength, 
          style 
        })
      });

      if (!response.ok) {
        throw new Error('Failed to summarize content');
      }

      const result = await response.json();
      return result.summary;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to summarize content');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cancel ongoing generation
  const cancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadModels();
    loadUsageStats();
    startInsightGeneration();

    return () => {
      stopInsightGeneration();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadModels, loadUsageStats, startInsightGeneration, stopInsightGeneration]);

  return {
    // State
    models,
    isLoading,
    error,
    generationHistory,
    insights,
    usageStats,
    personalizationProfiles,

    // Content Generation
    generateContent,
    generatePersonalizedContent,
    cancelGeneration,

    // Content Analysis
    analyzeSentiment,
    analyzeContent,
    optimizeContent,

    // Content Enhancement
    getSmartSuggestions,
    autoCompleteContent,
    translateContent,
    summarizeContent,

    // Personalization
    updatePersonalizationProfile,

    // Insights
    generateInsights,
    markInsightAsRead,
    executeInsightAction,
    startInsightGeneration,
    stopInsightGeneration,

    // Utilities
    loadModels,
    loadUsageStats
  };
};