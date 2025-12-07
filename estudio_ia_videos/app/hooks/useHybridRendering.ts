/**
 * Hybrid Cloud Rendering Hook
 * Provides easy integration with the hybrid rendering system
 */

import { useState, useCallback, useEffect } from 'react';
import { useToast } from './use-toast';

export interface HybridRenderSettings {
  proxyResolution?: '360p' | '480p' | '720p';
  finalResolution?: '1080p' | '4k' | '8k';
  enableSmartFlow?: boolean;
  quality?: 'draft' | 'production' | 'ultra';
}

export interface HybridRenderJob {
  id: string;
  projectId: string;
  userId: string;
  status: 'pending' | 'proxy_ready' | 'rendering' | 'completed' | 'failed';
  progress: number;
  settings: HybridRenderSettings;
  createdAt: string;
  proxyReadyAt?: string;
  renderStartedAt?: string;
  completedAt?: string;
  error?: string;
  outputUrl?: string;
}

export interface UseHybridRenderingReturn {
  jobs: HybridRenderJob[];
  currentJob: HybridRenderJob | null;
  isLoading: boolean;
  error: string | null;
  startHybridRender: (projectId: string, timeline: any, assets: any, settings?: HybridRenderSettings) => Promise<string>;
  getJobStatus: (jobId: string) => Promise<HybridRenderJob | null>;
  cancelJob: (jobId: string) => Promise<void>;
  refreshJobs: () => Promise<void>;
}

export function useHybridRendering(): UseHybridRenderingReturn {
  const [jobs, setJobs] = useState<HybridRenderJob[]>([]);
  const [currentJob, setCurrentJob] = useState<HybridRenderJob | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  /**
   * Start a new hybrid render job
   */
  const startHybridRender = useCallback(async (
    projectId: string,
    timeline: any,
    assets: any,
    settings: HybridRenderSettings = {}
  ): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/hybrid-render', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          timeline,
          assets,
          settings: {
            proxyResolution: '720p',
            finalResolution: '1080p',
            enableSmartFlow: false,
            quality: 'production',
            ...settings
          }
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to start hybrid render');
      }

      toast({
        title: 'Renderização iniciada',
        description: 'Geração de proxies iniciada. Você poderá editar em breve.',
        variant: 'default',
      });

      // Refresh jobs list
      await refreshJobs();

      return result.jobId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao iniciar renderização';
      setError(errorMessage);
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  /**
   * Get job status
   */
  const getJobStatus = useCallback(async (jobId: string): Promise<HybridRenderJob | null> => {
    try {
      const response = await fetch(`/api/hybrid-render?jobId=${jobId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to get job status');
      }

      return result.job;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao obter status do job';
      setError(errorMessage);
      return null;
    }
  }, []);

  /**
   * Cancel a job
   */
  const cancelJob = useCallback(async (jobId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/hybrid-render/${jobId}/cancel`, {
        method: 'POST',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to cancel job');
      }

      toast({
        title: 'Job cancelado',
        description: 'A renderização foi cancelada com sucesso.',
        variant: 'default',
      });

      // Refresh jobs list
      await refreshJobs();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao cancelar job';
      setError(errorMessage);
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [toast]);

  /**
   * Refresh jobs list
   */
  const refreshJobs = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch('/api/hybrid-render');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch jobs');
      }

      setJobs(result.jobs || []);
      
      // Update current job if it's in the list
      if (currentJob) {
        const updatedJob = result.jobs.find((job: HybridRenderJob) => job.id === currentJob.id);
        if (updatedJob) {
          setCurrentJob(updatedJob);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar jobs';
      setError(errorMessage);
    }
  }, [currentJob]);

  /**
   * Auto-refresh current job status
   */
  useEffect(() => {
    if (!currentJob) return;

    const interval = setInterval(async () => {
      const updatedJob = await getJobStatus(currentJob.id);
      if (updatedJob) {
        setCurrentJob(updatedJob);
        
        // Show notifications for status changes
        if (updatedJob.status !== currentJob.status) {
          switch (updatedJob.status) {
            case 'proxy_ready':
              toast({
                title: 'Proxies prontos',
                description: 'Você pode começar a editar com os proxies leves.',
                variant: 'default',
              });
              break;
            case 'rendering':
              toast({
                title: 'Renderização iniciada',
                description: 'Renderização de alta qualidade em progresso no servidor.',
                variant: 'default',
              });
              break;
            case 'completed':
              toast({
                title: 'Renderização concluída',
                description: 'Seu vídeo de alta qualidade está pronto!',
                variant: 'success',
              });
              break;
            case 'failed':
              toast({
                title: 'Renderização falhou',
                description: updatedJob.error || 'Ocorreu um erro durante a renderização.',
                variant: 'destructive',
              });
              break;
          }
        }
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [currentJob, getJobStatus, toast]);

  /**
   * Initial jobs fetch
   */
  useEffect(() => {
    refreshJobs();
  }, []);

  return {
    jobs,
    currentJob,
    isLoading,
    error,
    startHybridRender,
    getJobStatus,
    cancelJob,
    refreshJobs,
  };
}