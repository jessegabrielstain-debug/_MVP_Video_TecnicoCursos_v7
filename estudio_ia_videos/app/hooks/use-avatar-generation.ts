
/**
 * Hook: useAvatarGeneration
 * Hook React para geração de avatares 3D reais
 * 
 * Features:
 * - Iniciar geração
 * - Polling automático de status
 * - Gerenciamento de estado
 * - Error handling
 */

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';

// ============================================================================
// TYPES
// ============================================================================

interface AvatarJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  outputUrl?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

interface GenerateAvatarOptions {
  avatarId: string;
  scriptText: string;
  voiceId?: string;
  voiceProvider?: 'azure' | 'elevenlabs' | 'openai';
}

interface UseAvatarGenerationReturn {
  generateAvatar: (options: GenerateAvatarOptions) => Promise<void>;
  job: AvatarJob | null;
  isGenerating: boolean;
  error: string | null;
  reset: () => void;
}

// ============================================================================
// HOOK
// ============================================================================

export function useAvatarGeneration(): UseAvatarGenerationReturn {
  const [job, setJob] = useState<AvatarJob | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // ==========================================================================
  // POLLING
  // ==========================================================================

  const pollJobStatus = useCallback(async (jobId: string) => {
    try {
      const response = await fetch(`/api/avatar-3d/status/${jobId}`);
      
      if (!response.ok) {
        throw new Error('Erro ao verificar status do job');
      }

      const data = await response.json();
      setJob(data.job);

      // Se concluído ou falhou, parar polling
      if (data.job.status === 'completed' || data.job.status === 'failed') {
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
        setIsGenerating(false);

        if (data.job.status === 'completed') {
          toast.success('✅ Avatar gerado com sucesso!');
        } else {
          toast.error(`❌ Erro ao gerar avatar: ${data.job.error}`);
          setError(data.job.error || 'Erro desconhecido');
        }
      }
    } catch (err) {
      console.error('Erro ao fazer polling:', err instanceof Error ? err.message : String(err));
    }
  }, [pollingInterval]);

  // ==========================================================================
  // GENERATE AVATAR
  // ==========================================================================

  const generateAvatar = useCallback(async (options: GenerateAvatarOptions) => {
    try {
      setIsGenerating(true);
      setError(null);
      setJob(null);

      toast.loading('Iniciando geração de avatar...', { id: 'avatar-gen' });

      // 1. Iniciar geração
      const response = await fetch('/api/avatar-3d/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || 'Erro ao gerar avatar');
      }

      const data = await response.json();
      setJob(data.job);

      toast.success('Avatar em processamento...', { id: 'avatar-gen' });

      // 2. Iniciar polling
      const interval = setInterval(() => {
        pollJobStatus(data.job.id);
      }, 3000); // Poll a cada 3 segundos

      setPollingInterval(interval);

      // Poll imediatamente uma vez
      pollJobStatus(data.job.id);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Erro ao gerar avatar:', err);
      setError(errorMessage);
      setIsGenerating(false);
      toast.error(errorMessage, { id: 'avatar-gen' });
    }
  }, [pollJobStatus]);

  // ==========================================================================
  // RESET
  // ==========================================================================

  const reset = useCallback(() => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    setJob(null);
    setIsGenerating(false);
    setError(null);
  }, [pollingInterval]);

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // ==========================================================================
  // RETURN
  // ==========================================================================

  return {
    generateAvatar,
    job,
    isGenerating,
    error,
    reset,
  };
}

export default useAvatarGeneration;
