
/**
 * Hook: useAvatarsList
 * Hook para buscar lista de avatares disponíveis
 */

import { useState, useEffect } from 'react';

interface Avatar {
  id: string;
  name: string;
  description: string;
  preview_url: string;
  thumbnail_url: string;
  gender: 'male' | 'female';
  age_range: string;
  ethnicity: string;
  tags: string[];
}

interface UseAvatarsListReturn {
  avatars: Avatar[];
  loading: boolean;
  error: string | null;
  mode: 'production' | 'demo';
  refetch: () => void;
}

export function useAvatarsList(): UseAvatarsListReturn {
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'production' | 'demo'>('demo');

  const fetchAvatars = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/avatar-3d/avatars');
      
      if (!response.ok) {
        throw new Error('Erro ao buscar avatares');
      }

      const data = await response.json();
      setAvatars(data.avatars || []);
      setMode(data.mode || 'demo');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      console.error('Erro ao buscar avatares:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvatars();
  }, []);

  return {
    avatars,
    loading,
    error,
    mode,
    refetch: fetchAvatars,
  };
}

export default useAvatarsList;
