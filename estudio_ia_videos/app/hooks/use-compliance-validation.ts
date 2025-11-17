
/**
 * Hook: useComplianceValidation
 * Hook React para validação de compliance com NRs
 */

import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

interface ValidationResult {
  isCompliant: boolean;
  score: number;
  standard: string;
  mandatoryTopicsCovered: string[];
  missingTopics: string[];
  warnings: string[];
  errors: string[];
  recommendations: string[];
  details: {
    contentLength: number;
    duration: number;
    topicsCovered: number;
    totalTopics: number;
    rulesPassed: number;
    totalRules: number;
  };
}

interface ValidateOptions {
  standard: string;
  content: string;
  duration?: number;
  projectId?: string;
}

interface UseComplianceValidationReturn {
  validate: (options: ValidateOptions) => Promise<ValidationResult | null>;
  result: ValidationResult | null;
  isValidating: boolean;
  error: string | null;
  reset: () => void;
}

export function useComplianceValidation(): UseComplianceValidationReturn {
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = useCallback(async (options: ValidateOptions) => {
    try {
      setIsValidating(true);
      setError(null);

      toast.loading('Validando conformidade...', { id: 'compliance-validation' });

      const response = await fetch('/api/compliance/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || 'Erro ao validar');
      }

      const data = await response.json();
      setResult(data.result);

      if (data.result.isCompliant) {
        toast.success(`✅ Conforme com ${options.standard} (Score: ${data.result.score})`, {
          id: 'compliance-validation',
        });
      } else {
        toast.error(`❌ Não conforme (Score: ${data.result.score})`, {
          id: 'compliance-validation',
        });
      }

      return data.result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Erro ao validar compliance:', err);
      setError(errorMessage);
      toast.error(errorMessage, { id: 'compliance-validation' });
      return null;
    } finally {
      setIsValidating(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setIsValidating(false);
    setError(null);
  }, []);

  return {
    validate,
    result,
    isValidating,
    error,
    reset,
  };
}

export default useComplianceValidation;
