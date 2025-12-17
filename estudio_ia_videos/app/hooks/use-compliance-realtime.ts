'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@/lib/logger';

interface QuickValidationResult {
  score: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  suggestions: string[];
  missingTopics: string[];
  criticalPoints: string[];
  confidence: number;
}

interface ValidationResult {
  id: string;
  score: number;
  finalScore: number;
  topicsCovered: string[];
  topicsMissing: string[];
  criticalPointsCovered: string[];
  criticalPointsMissing: string[];
  suggestions: string[];
  aiAnalysis: string;
  confidence: number;
  validatedAt: string;
}

interface UseComplianceRealtimeProps {
  projectId?: string;
  nrType: string;
  autoValidate?: boolean;
  debounceMs?: number;
}

export function useComplianceRealtime({
  projectId,
  nrType,
  autoValidate = true,
  debounceMs = 1000
}: UseComplianceRealtimeProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidation, setLastValidation] = useState<ValidationResult | null>(null);
  const [quickValidation, setQuickValidation] = useState<QuickValidationResult | null>(null);
  const [validationHistory, setValidationHistory] = useState<ValidationResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const debounceRef = useRef<NodeJS.Timeout>();
  const lastContentRef = useRef<string>('');

  // Quick validation for real-time feedback
  const triggerValidation = useCallback(async (content?: string) => {
    if (!content || content.trim().length < 10) {
      setQuickValidation(null);
      return;
    }

    if (content === lastContentRef.current) {
      return; // Avoid duplicate validations
    }

    lastContentRef.current = content;
    setIsValidating(true);
    setError(null);

    try {
      const response = await fetch('/api/compliance/validate', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          nrType,
          projectId
        }),
      });

      if (!response.ok) {
        throw new Error(`Validation failed: ${response.statusText}`);
      }

      const result: QuickValidationResult = await response.json();
      setQuickValidation(result);
    } catch (err) {
      logger.error('Quick validation error', err as Error, { component: 'useComplianceRealtime' });
      setError(err instanceof Error ? err.message : 'Erro na validação rápida');
    } finally {
      setIsValidating(false);
    }
  }, [nrType, projectId]);

  // Full validation with database storage
  const triggerFullValidation = useCallback(async () => {
    if (!projectId) {
      setError('Project ID é necessário para validação completa');
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const response = await fetch('/api/compliance/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          nrType
        }),
      });

      if (!response.ok) {
        throw new Error(`Full validation failed: ${response.statusText}`);
      }

      const result: ValidationResult = await response.json();
      setLastValidation(result);
      setValidationHistory(prev => [result, ...prev.slice(0, 9)]); // Keep last 10
    } catch (err) {
      logger.error('Full validation error', err as Error, { component: 'useComplianceRealtime' });
      setError(err instanceof Error ? err.message : 'Erro na validação completa');
    } finally {
      setIsValidating(false);
    }
  }, [projectId, nrType]);

  // Debounced validation for auto-validate
  const debouncedValidation = useCallback((content: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      triggerValidation(content);
    }, debounceMs);
  }, [triggerValidation, debounceMs]);

  // Load validation history
  const loadValidationHistory = useCallback(async () => {
    if (!projectId) return;

    try {
      const response = await fetch(`/api/compliance/validate?projectId=${projectId}&nrType=${nrType}`);
      if (response.ok) {
        const history: ValidationResult[] = await response.json();
        setValidationHistory(history);
        if (history.length > 0) {
          setLastValidation(history[0]);
        }
      }
    } catch (err) {
      logger.error('Error loading validation history', err as Error, { component: 'useComplianceRealtime' });
    }
  }, [projectId, nrType]);

  // Load history on mount
  useEffect(() => {
    loadValidationHistory();
  }, [loadValidationHistory]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Computed values
  const score = quickValidation?.score ?? lastValidation?.finalScore ?? 0;
  const status = quickValidation?.status ?? getStatusFromScore(lastValidation?.finalScore ?? 0);
  const suggestions = quickValidation?.suggestions ?? [];
  const missingTopics = quickValidation?.missingTopics ?? lastValidation?.topicsMissing ?? [];
  const criticalPoints = quickValidation?.criticalPoints ?? lastValidation?.criticalPointsMissing ?? [];

  const getComplianceStatus = useCallback(() => {
    return status;
  }, [status]);

  const getComplianceColor = useCallback(() => {
    switch (status) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-green-500';
      case 'fair': return 'text-yellow-500';
      case 'poor': return 'text-red-500';
      default: return 'text-gray-500';
    }
  }, [status]);

  const getTopSuggestions = useCallback((limit = 3) => {
    return suggestions.slice(0, limit);
  }, [suggestions]);

  const needsImmediateAttention = useCallback(() => {
    return score < 60 || criticalPoints.length > 0;
  }, [score, criticalPoints]);

  return {
    // State
    isValidating,
    lastValidation,
    quickValidation,
    validationHistory,
    error,

    // Actions
    triggerValidation,
    triggerFullValidation,
    debouncedValidation,
    loadValidationHistory,

    // Computed values
    score,
    status,
    suggestions,
    missingTopics,
    criticalPoints,

    // Helper functions
    getComplianceStatus,
    getComplianceColor,
    getTopSuggestions,
    needsImmediateAttention,
  };
}

function getStatusFromScore(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (score >= 90) return 'excellent';
  if (score >= 80) return 'good';
  if (score >= 60) return 'fair';
  return 'poor';
}