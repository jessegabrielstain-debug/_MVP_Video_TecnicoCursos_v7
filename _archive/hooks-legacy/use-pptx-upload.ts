
/**
 * Hook para upload de PPTX com parser avançado
 * Sprint 48 - FASE 2
 */

import { useState, useCallback } from 'react';
import { useAnalyticsTrack } from './use-analytics-track';

export interface PPTXUploadProgress {
  stage: 'idle' | 'uploading' | 'parsing' | 'complete' | 'error';
  progress: number;
  message: string;
}

export interface PPTXUploadResult {
  projectId: string;
  metadata: {
    title: string;
    author: string;
    slideCount: number;
  };
  slides: Array<{
    slideNumber: number;
    title: string;
    content: string[];
    layout: string;
    imageCount: number;
  }>;
  s3Url: string;
}

export function usePPTXUpload() {
  const [progress, setProgress] = useState<PPTXUploadProgress>({
    stage: 'idle',
    progress: 0,
    message: ''
  });
  const [result, setResult] = useState<PPTXUploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { trackUpload } = useAnalyticsTrack();

  const uploadPPTX = useCallback(async (file: File) => {
    try {
      setProgress({ stage: 'uploading', progress: 0, message: 'Enviando arquivo...' });
      setError(null);
      setResult(null);

      const formData = new FormData();
      formData.append('file', file);

      setProgress({ stage: 'uploading', progress: 30, message: 'Fazendo upload...' });

      const response = await fetch('/api/pptx/parse-advanced', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao fazer upload');
      }

      setProgress({ stage: 'parsing', progress: 60, message: 'Parseando slides...' });

      const data = await response.json();

      setProgress({ stage: 'parsing', progress: 90, message: 'Finalizando...' });

      // Track analytics
      await trackUpload(file.size, file.name, data.projectId);

      setProgress({ stage: 'complete', progress: 100, message: 'Upload completo!' });
      setResult(data);

      return data;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setProgress({ stage: 'error', progress: 0, message: errorMessage });
      setError(errorMessage);
      throw err;
    }
  }, [trackUpload]);

  const reset = useCallback(() => {
    setProgress({ stage: 'idle', progress: 0, message: '' });
    setResult(null);
    setError(null);
  }, []);

  return {
    uploadPPTX,
    progress,
    result,
    error,
    isUploading: progress.stage === 'uploading' || progress.stage === 'parsing',
    isComplete: progress.stage === 'complete',
    isError: progress.stage === 'error',
    reset
  };
}
