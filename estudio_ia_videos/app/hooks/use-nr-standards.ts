
/**
 * Hook: useNRStandards
 * Hook para buscar lista de normas regulamentadoras
 */

import { useState, useEffect } from 'react';

interface NRStandard {
  nr: string;
  name: string;
  description: string;
  minimumDuration: number;
  mandatoryTopics: string[];
}

interface UseNRStandardsReturn {
  standards: NRStandard[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useNRStandards(): UseNRStandardsReturn {
  const [standards, setStandards] = useState<NRStandard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStandards = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/compliance/standards');
      
      if (!response.ok) {
        throw new Error('Erro ao buscar normas');
      }

      const data = await response.json();
      setStandards(data.standards || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Erro ao buscar normas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStandards();
  }, []);

  return {
    standards,
    loading,
    error,
    refetch: fetchStandards,
  };
}

export default useNRStandards;
