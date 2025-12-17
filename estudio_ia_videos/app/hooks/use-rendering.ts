'use client';

/**
 * Hook para gerenciamento de renderização de vídeos
 * Sistema completo integrado com Remotion e API de jobs
 */

import { useState, useCallback } from 'react';
import { TimelineProject } from '@/lib/types/timeline-types';
import { logger } from '@/lib/logger';
import { 
  RenderJob, 
  RenderProgress, 
  ExportSettings, 
  QualityPreset 
} from '@/lib/types/remotion-types';

interface RenderJobStats {
  total: number;
  pending?: number;
  queued?: number;
  processing?: number;
  completed?: number;
  failed?: number;
  cancelled?: number;
  [key: string]: number | undefined;
}

export interface RenderJobListResponse {
  jobs: RenderJob[];
  stats: RenderJobStats;
}

interface UseRenderingReturn {
  // Estado
  isRendering: boolean;
  currentJob: RenderJob | null;
  progress: RenderProgress | null;
  error: string | null;
  
  // Ações principais
  startRender: (project: TimelineProject, settings: ExportSettings) => Promise<void>;
  cancelRender: () => Promise<void>;
  clearError: () => void;
  
  // Progresso em tempo real
  streamProgress: (jobId: string) => void;
  
  // Gerenciamento de jobs
  listJobs: (status?: RenderJob['status']) => Promise<RenderJobListResponse>;
  downloadRender: (jobId: string, format?: string) => void;
  
  // Utilidades
  getPreset: (presetName: string) => QualityPreset | null;
  validateProject: (project: TimelineProject) => { valid: boolean; errors: string[] };
}

export function useRendering(): UseRenderingReturn {
  const [isRendering, setIsRendering] = useState(false);
  const [currentJob, setCurrentJob] = useState<RenderJob | null>(null);
  const [progress, setProgress] = useState<RenderProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Limpar erro
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Iniciar renderização
   */
  const startRender = useCallback(async (
    project: TimelineProject,
    settings: ExportSettings
  ) => {
    try {
      setIsRendering(true);
      setError(null);
      setProgress(null);

      // Validar projeto
      const validation = validateProject(project);
      if (!validation.valid) {
        throw new Error(`Projeto inválido: ${validation.errors.join(', ')}`);
      }

      // Criar job de renderização
      const response = await fetch('/api/render', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ project, settings })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao iniciar renderização');
      }

      const { job } = await response.json();
      setCurrentJob(job);

      // Iniciar streaming de progresso
      streamProgress(job.id);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      setIsRendering(false);
    }
  }, []);

  /**
   * Streaming de progresso em tempo real
   */
  const streamProgress = useCallback((jobId: string) => {
    const eventSource = new EventSource(`/api/render/progress?jobId=${jobId}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'progress') {
          setProgress(data.progress);
        } else if (data.type === 'complete') {
          setIsRendering(false);
          setCurrentJob(data.job);
          eventSource.close();
        } else if (data.type === 'error') {
          setError(data.error);
          setIsRendering(false);
          eventSource.close();
        }
      } catch (err) {
        logger.error('Erro ao processar progresso', err as Error, { component: 'useRendering' });
      }
    };

    eventSource.onerror = () => {
      setError('Erro na conexão de progresso');
      setIsRendering(false);
      eventSource.close();
    };

    return eventSource;
  }, []);

  /**
   * Cancelar renderização
   */
  const cancelRender = useCallback(async () => {
    if (!currentJob) return;

    try {
      const response = await fetch(`/api/render?action=cancel&jobId=${currentJob.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Erro ao cancelar renderização');
      }

      setIsRendering(false);
      setCurrentJob(null);
      setProgress(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao cancelar';
      setError(errorMessage);
    }
  }, [currentJob]);

  /**
   * Listar jobs de renderização
   */
  const listJobs = useCallback(async (status?: RenderJob['status']): Promise<RenderJobListResponse> => {
    try {
      const url = status 
        ? `/api/render?action=list&status=${status}`
        : '/api/render?action=list';
        
      const response = await fetch(url);
      if (!response.ok) throw new Error('Erro ao buscar jobs');
      
      const data = await response.json();
      return data as RenderJobListResponse;
    } catch (err) {
      logger.error('Erro ao listar jobs', err as Error, { component: 'useRendering' });
      return { jobs: [], stats: { total: 0 } };
    }
  }, []);

  /**
   * Download de arquivo renderizado
   */
  const downloadRender = useCallback((jobId: string, format: string = 'mp4') => {
    const filename = `${jobId}.${format}`;
    const url = `/api/render/output/${filename}`;
    
    // Criar link temporário para download
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  /**
   * Obter preset de qualidade
   */
  const getPreset = useCallback((presetName: string): QualityPreset | null => {
    const presets: Record<string, QualityPreset> = {
      'low': {
        name: 'Baixa Qualidade',
        width: 854,
        height: 480,
        fps: 24,
        crf: 28,
        bitrate: '500k',
        format: 'mp4'
      },
      'medium': {
        name: 'Qualidade Média',
        width: 1280,
        height: 720,
        fps: 30,
        crf: 23,
        bitrate: '2M',
        format: 'mp4'
      },
      'high': {
        name: 'Alta Qualidade',
        width: 1920,
        height: 1080,
        fps: 30,
        crf: 18,
        bitrate: '5M',
        format: 'mp4'
      },
      'ultra': {
        name: 'Ultra Qualidade',
        width: 3840,
        height: 2160,
        fps: 60,
        crf: 15,
        bitrate: '15M',
        format: 'mp4'
      }
    };

    return presets[presetName] || null;
  }, []);

  /**
   * Validar projeto
   */
  const validateProject = useCallback((project: TimelineProject) => {
    const errors: string[] = [];

    const hasElements = project.layers.some(layer => layer.elements.length > 0);
    if (!hasElements) {
      errors.push('Projeto não contém elementos');
    }

    if (project.duration <= 0) {
      errors.push('Duração do projeto inválida');
    }

    // Validar elementos
    project.layers.forEach((layer, layerIndex) => {
      layer.elements.forEach((element, elementIndex) => {
        if (!element.id) {
          errors.push(`Elemento ${elementIndex + 1} na camada ${layer.name} sem ID`);
        }
        if (element.start < 0) {
          errors.push(`Elemento ${elementIndex + 1} na camada ${layer.name} com tempo inicial inválido`);
        }
        if (element.duration <= 0) {
          errors.push(`Elemento ${elementIndex + 1} na camada ${layer.name} com duração inválida`);
        }
      });
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }, []);

  return {
    isRendering,
    currentJob,
    progress,
    error,
    startRender,
    cancelRender,
    clearError,
    streamProgress,
    listJobs,
    downloadRender,
    getPreset,
    validateProject
  };
}