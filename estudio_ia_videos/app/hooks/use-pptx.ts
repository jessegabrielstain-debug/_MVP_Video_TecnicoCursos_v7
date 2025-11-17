/**
 * 🎯 Hook PPTX - Gerenciamento Completo de Apresentações
 * Sistema integrado para upload, parsing, geração e conversão
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import {
  PPTXDocument,
  PPTXProcessingJob,
  PPTXJobStatus,
  PPTXProcessingSettings,
  PPTXToVideoSettings,
  PPTXTemplate
} from '../types/pptx-types';

export type PPTXGenerationPayload = Record<string, unknown>;

export type PPTXGenerationOptions = Record<string, unknown>;

export type PPTXDocumentPreview = Record<string, unknown>;

interface UsePPTXReturn {
  // Estado
  isUploading: boolean;
  isGenerating: boolean;
  currentJob: PPTXProcessingJob | null;
  uploadProgress: number;
  error: string | null;
  
  // Documentos
  documents: PPTXDocument[];
  activeDocument: PPTXDocument | null;
  
  // Ações principais
  uploadPPTX: (file: File, settings?: PPTXProcessingSettings) => Promise<string>;
  generatePPTX: (type: string, data: PPTXGenerationPayload, options?: PPTXGenerationOptions) => Promise<Blob>;
  
  // Gerenciamento de jobs
  getJobStatus: (jobId: string) => Promise<PPTXProcessingJob | null>;
  listJobs: (status?: PPTXJobStatus) => Promise<PPTXProcessingJob[]>;
  cancelJob: (jobId: string) => Promise<boolean>;
  
  // Documentos
  loadDocument: (documentId: string) => Promise<PPTXDocument | null>;
  getDocumentPreview: (jobId: string) => Promise<PPTXDocumentPreview | null>;
  
  // Conversão para vídeo
  convertToVideo: (documentId: string, settings: PPTXToVideoSettings) => Promise<string>;
  
  // Templates
  getAvailableTemplates: () => Promise<PPTXTemplate[]>;
  
  // Utilitários
  clearError: () => void;
  validateFile: (file: File) => { valid: boolean; errors: string[] };
}

export function usePPTX(): UsePPTXReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentJob, setCurrentJob] = useState<PPTXProcessingJob | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<PPTXDocument[]>([]);
  const [activeDocument, setActiveDocument] = useState<PPTXDocument | null>(null);
  
  const jobPollingRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Limpar erro
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Validar arquivo PPTX
   */
  const validateFile = useCallback((file: File) => {
    const errors: string[] = [];

    if (!file.name.toLowerCase().endsWith('.pptx')) {
      errors.push('Apenas arquivos PPTX são suportados');
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB
      errors.push('Arquivo muito grande (máximo 50MB)');
    }

    if (file.size === 0) {
      errors.push('Arquivo vazio');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }, []);

  /**
   * Upload e parse de arquivo PPTX
   */
  const uploadPPTX = useCallback(async (
    file: File,
    settings: PPTXProcessingSettings = {}
  ): Promise<string> => {
    try {
      setIsUploading(true);
      setError(null);
      setUploadProgress(0);

      // Validar arquivo
      const validation = validateFile(file);
      if (!validation.valid) {
        throw new Error(`Arquivo inválido: ${validation.errors.join(', ')}`);
      }

      console.log(`[usePPTX] Uploading file: ${file.name} (${file.size} bytes)`);

      // Preparar FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('settings', JSON.stringify(settings));

      // Fazer upload
      const response = await fetch('/api/pptx', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro no upload');
      }

      const result = await response.json();
      const jobId = result.jobId;

      console.log(`[usePPTX] Upload successful, job ID: ${jobId}`);

      // Iniciar polling do status
      startJobPolling(jobId);

      return jobId;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('[usePPTX] Upload error:', err);
      throw err;
    } finally {
      setIsUploading(false);
    }
  }, [validateFile]);

  /**
   * Gerar apresentação PPTX
   */
  const generatePPTX = useCallback(async (
    type: string,
    data: PPTXGenerationPayload,
    options: PPTXGenerationOptions = {}
  ): Promise<Blob> => {
    try {
      setIsGenerating(true);
      setError(null);

      console.log(`[usePPTX] Generating PPTX: ${type}`);

      const response = await fetch('/api/pptx/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type, data, options })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro na geração');
      }

      const blob = await response.blob();
      console.log(`[usePPTX] Generation successful (${blob.size} bytes)`);

      return blob;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro na geração';
      setError(errorMessage);
      console.error('[usePPTX] Generation error:', err);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  /**
   * Iniciar polling de status do job
   */
  const startJobPolling = useCallback((jobId: string) => {
    if (jobPollingRef.current) {
      clearInterval(jobPollingRef.current);
    }

    jobPollingRef.current = setInterval(async () => {
      try {
        const job = await getJobStatus(jobId);
        if (job) {
          setCurrentJob(job);
          setUploadProgress(job.progress);

          if (job.status === 'completed') {
            console.log(`[usePPTX] Job ${jobId} completed`);
            
            // Carregar documento processado
            if (job.documentId) {
              const document = await loadDocument(job.documentId);
              if (document) {
                setDocuments(prev => {
                  const existing = prev.find(d => d.id === document.id);
                  if (existing) {
                    return prev.map(d => d.id === document.id ? document : d);
                  }
                  return [...prev, document];
                });
                setActiveDocument(document);
              }
            }

            if (jobPollingRef.current) {
              clearInterval(jobPollingRef.current);
              jobPollingRef.current = null;
            }
          } else if (job.status === 'failed') {
            console.error(`[usePPTX] Job ${jobId} failed:`, job.error);
            setError(job.error || 'Processamento falhou');
            
            if (jobPollingRef.current) {
              clearInterval(jobPollingRef.current);
              jobPollingRef.current = null;
            }
          }
        }
      } catch (err) {
        console.error('[usePPTX] Polling error:', err);
      }
    }, 2000); // Poll a cada 2 segundos
  }, []);

  /**
   * Obter status de job
   */
  const getJobStatus = useCallback(async (jobId: string): Promise<PPTXProcessingJob | null> => {
    try {
      const response = await fetch(`/api/pptx?action=status&jobId=${jobId}`);
      if (!response.ok) return null;

      const result = await response.json();
      return result.job;
    } catch (err) {
      console.error('[usePPTX] Error getting job status:', err);
      return null;
    }
  }, []);

  /**
   * Listar jobs
   */
  const listJobs = useCallback(async (status?: PPTXJobStatus): Promise<PPTXProcessingJob[]> => {
    try {
      const url = status 
        ? `/api/pptx?action=list&status=${status}`
        : '/api/pptx?action=list';
        
      const response = await fetch(url);
      if (!response.ok) return [];

      const result = await response.json();
      return result.jobs || [];
    } catch (err) {
      console.error('[usePPTX] Error listing jobs:', err);
      return [];
    }
  }, []);

  /**
   * Cancelar job
   */
  const cancelJob = useCallback(async (jobId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/pptx?jobId=${jobId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Parar polling se for o job atual
        if (currentJob?.id === jobId && jobPollingRef.current) {
          clearInterval(jobPollingRef.current);
          jobPollingRef.current = null;
        }
        
        setCurrentJob(null);
        return true;
      }

      return false;
    } catch (err) {
      console.error('[usePPTX] Error cancelling job:', err);
      return false;
    }
  }, [currentJob]);

  /**
   * Carregar documento
   */
  const loadDocument = useCallback(async (documentId: string): Promise<PPTXDocument | null> => {
    try {
      const response = await fetch(`/api/pptx?action=document&documentId=${documentId}`);
      if (!response.ok) return null;

      const result = await response.json();
      return result.document;
    } catch (err) {
      console.error('[usePPTX] Error loading document:', err);
      return null;
    }
  }, []);

  /**
   * Obter preview do documento
   */
  const getDocumentPreview = useCallback(async (jobId: string): Promise<PPTXDocumentPreview | null> => {
    try {
      const response = await fetch(`/api/pptx?action=preview&jobId=${jobId}`);
      if (!response.ok) return null;

      const result = await response.json();
      return (result.preview ?? null) as PPTXDocumentPreview | null;
    } catch (err) {
      console.error('[usePPTX] Error getting preview:', err);
      return null;
    }
  }, []);

  /**
   * Converter para vídeo
   */
  const convertToVideo = useCallback(async (
    documentId: string,
    settings: PPTXToVideoSettings
  ): Promise<string> => {
    try {
      console.log(`[usePPTX] Converting document ${documentId} to video`);

      const response = await fetch('/api/pptx/convert-to-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ documentId, settings })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro na conversão');
      }

      const result = await response.json();
      return result.jobId; // Retorna ID do job de renderização de vídeo

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro na conversão';
      setError(errorMessage);
      console.error('[usePPTX] Conversion error:', err);
      throw err;
    }
  }, []);

  /**
   * Obter templates disponíveis
   */
  const getAvailableTemplates = useCallback(async (): Promise<PPTXTemplate[]> => {
    try {
      const response = await fetch('/api/pptx/generate');
      if (!response.ok) return [];

      const result = await response.json();
      return Array.isArray(result.templates) ? (result.templates as PPTXTemplate[]) : [];
    } catch (err) {
      console.error('[usePPTX] Error getting templates:', err);
      return [];
    }
  }, []);

  // Cleanup do polling quando o componente é desmontado
  const cleanup = useCallback(() => {
    if (jobPollingRef.current) {
      clearInterval(jobPollingRef.current);
      jobPollingRef.current = null;
    }
  }, []);

  return {
    isUploading,
    isGenerating,
    currentJob,
    uploadProgress,
    error,
    documents,
    activeDocument,
    uploadPPTX,
    generatePPTX,
    getJobStatus,
    listJobs,
    cancelJob,
    loadDocument,
    getDocumentPreview,
    convertToVideo,
    getAvailableTemplates,
    clearError,
    validateFile
  };
}