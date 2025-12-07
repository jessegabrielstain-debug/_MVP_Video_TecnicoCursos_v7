import { useState, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';

export interface VariableDataRow {
  [key: string]: string | number | boolean;
}

export interface VariableDefinition {
  name: string;
  type: 'text' | 'number' | 'date' | 'image' | 'video' | 'color' | 'boolean';
  required: boolean;
  defaultValue?: string | number | boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[];
  };
}

export interface VariableDataTemplate {
  id: string;
  name: string;
  description: string;
  baseVideoPath: string;
  templateText: string;
  variables: VariableDefinition[];
  outputSettings: {
    format: 'mp4' | 'mov' | 'avi';
    resolution: '720p' | '1080p' | '4K';
    fps: number;
    bitrate: string;
    audioBitrate: string;
  };
}

export interface VideoVariation {
  id: string;
  templateId: string;
  rowData: VariableDataRow;
  outputPath: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
  metadata?: {
    duration: number;
    fileSize: number;
    thumbnailPath?: string;
  };
}

export interface VariableDataJob {
  id: string;
  templateId: string;
  csvFileName: string;
  totalRows: number;
  processedRows: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  variations: VideoVariation[];
  settings: {
    maxConcurrentJobs: number;
    retryFailedVariations: boolean;
    generateThumbnails: boolean;
    createZipArchive: boolean;
    notificationEmail?: string;
    webhookUrl?: string;
  };
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export interface VariableDataState {
  isProcessing: boolean;
  isUploading: boolean;
  isValidating: boolean;
  progress: number;
  templates: VariableDataTemplate[];
  currentJob: VariableDataJob | null;
  csvData: VariableDataRow[];
  csvHeaders: string[];
  validationErrors: string[];
  validationWarnings: string[];
  selectedTemplate: VariableDataTemplate | null;
  error: string | null;
}

export const useVariableData = () => {
  const [state, setState] = useState<VariableDataState>({
    isProcessing: false,
    isUploading: false,
    isValidating: false,
    progress: 0,
    templates: [],
    currentJob: null,
    csvData: [],
    csvHeaders: [],
    validationErrors: [],
    validationWarnings: [],
    selectedTemplate: null,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const loadTemplates = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch('/api/variable-data/templates');
      if (!response.ok) {
        throw new Error(`Failed to load templates: ${response.statusText}`);
      }
      
      const templates = await response.json();
      setState(prev => ({ ...prev, templates }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load templates';
      setState(prev => ({ ...prev, error: errorMessage }));
      toast.error(errorMessage);
    }
  }, []);

  const uploadCSV = useCallback(async (file: File): Promise<boolean> => {
    try {
      setState(prev => ({ 
        ...prev, 
        isUploading: true, 
        error: null, 
        progress: 0 
      }));
      
      abortControllerRef.current = new AbortController();

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/variable-data/upload-csv', {
        method: 'POST',
        body: formData,
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      setState(prev => ({ 
        ...prev, 
        isUploading: false, 
        csvData: result.data,
        csvHeaders: result.headers,
        progress: 100
      }));

      toast.success(`CSV uploaded successfully: ${result.data.length} rows`);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setState(prev => ({ 
        ...prev, 
        isUploading: false, 
        error: errorMessage,
        progress: 0
      }));
      toast.error(errorMessage);
      return false;
    }
  }, []);

  const validateCSV = useCallback(async (
    templateId: string
  ): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> => {
    if (!state.csvData.length) {
      const error = 'No CSV data to validate';
      setState(prev => ({ ...prev, validationErrors: [error] }));
      return { isValid: false, errors: [error], warnings: [] };
    }

    try {
      setState(prev => ({ 
        ...prev, 
        isValidating: true, 
        error: null 
      }));

      const response = await fetch('/api/variable-data/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId,
          csvData: state.csvData,
        }),
      });

      if (!response.ok) {
        throw new Error(`Validation failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      setState(prev => ({ 
        ...prev, 
        isValidating: false, 
        validationErrors: result.errors,
        validationWarnings: result.warnings,
      }));

      if (result.isValid) {
        toast.success('CSV validation successful');
      } else {
        toast.error(`Validation failed: ${result.errors.length} errors`);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Validation failed';
      setState(prev => ({ 
        ...prev, 
        isValidating: false, 
        error: errorMessage,
        validationErrors: [errorMessage]
      }));
      toast.error(errorMessage);
      return { isValid: false, errors: [errorMessage], warnings: [] };
    }
  }, [state.csvData]);

  const createTemplate = useCallback(async (
    name: string,
    description: string,
    baseVideoFile: File,
    templateText: string,
    variables: VariableDefinition[],
    outputSettings: {
      format: 'mp4' | 'mov' | 'avi';
      resolution: '720p' | '1080p' | '4K';
      fps: number;
      bitrate: string;
      audioBitrate: string;
    }
  ): Promise<VariableDataTemplate | null> => {
    try {
      setState(prev => ({ ...prev, isProcessing: true, error: null }));

      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('baseVideo', baseVideoFile);
      formData.append('templateText', templateText);
      formData.append('variables', JSON.stringify(variables));
      formData.append('outputSettings', JSON.stringify(outputSettings));

      const response = await fetch('/api/variable-data/templates', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Template creation failed: ${response.statusText}`);
      }

      const template = await response.json();
      
      setState(prev => ({ 
        ...prev, 
        isProcessing: false,
        templates: [...prev.templates, template]
      }));

      toast.success('Template created successfully');
      return template;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Template creation failed';
      setState(prev => ({ 
        ...prev, 
        isProcessing: false, 
        error: errorMessage
      }));
      toast.error(errorMessage);
      return null;
    }
  }, []);

  const selectTemplate = useCallback((template: VariableDataTemplate | null): void => {
    setState(prev => ({ ...prev, selectedTemplate: template }));
  }, []);

  const generateVariations = useCallback(async (
    templateId: string,
    settings: {
      maxConcurrentJobs: number;
      retryFailedVariations: boolean;
      generateThumbnails: boolean;
      createZipArchive: boolean;
      notificationEmail?: string;
      webhookUrl?: string;
    }
  ): Promise<VariableDataJob | null> => {
    if (!state.csvData.length) {
      const error = 'No CSV data to process';
      setState(prev => ({ ...prev, error }));
      toast.error(error);
      return null;
    }

    try {
      setState(prev => ({ 
        ...prev, 
        isProcessing: true, 
        error: null, 
        progress: 0 
      }));

      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/variable-data/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId,
          csvData: state.csvData,
          settings,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Generation failed: ${response.statusText}`);
      }

      const job = await response.json();
      
      setState(prev => ({ 
        ...prev, 
        isProcessing: false, 
        currentJob: job,
        progress: 100
      }));

      toast.success(`Started generating ${state.csvData.length} variations`);
      return job;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Generation failed';
      setState(prev => ({ 
        ...prev, 
        isProcessing: false, 
        error: errorMessage,
        progress: 0
      }));
      toast.error(errorMessage);
      return null;
    }
  }, [state.csvData]);

  const getJobStatus = useCallback(async (jobId: string): Promise<VariableDataJob | null> => {
    try {
      const response = await fetch(`/api/variable-data/jobs/${jobId}`);
      if (!response.ok) {
        throw new Error(`Failed to get job status: ${response.statusText}`);
      }
      
      const job = await response.json();
      setState(prev => ({ 
        ...prev, 
        currentJob: job,
        progress: job.progress
      }));
      
      return job;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get job status';
      setState(prev => ({ ...prev, error: errorMessage }));
      toast.error(errorMessage);
      return null;
    }
  }, []);

  const cancelProcessing = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState(prev => ({ 
      ...prev, 
      isProcessing: false,
      isUploading: false,
      isValidating: false,
      progress: 0
    }));
    toast('Processing cancelled');
  }, []);

  const reset = useCallback(() => {
    setState({
      isProcessing: false,
      isUploading: false,
      isValidating: false,
      progress: 0,
      templates: state.templates, // Keep templates
      currentJob: null,
      csvData: [],
      csvHeaders: [],
      validationErrors: [],
      validationWarnings: [],
      selectedTemplate: state.selectedTemplate, // Keep selected template
      error: null,
    });
  }, [state.templates, state.selectedTemplate]);

  const downloadResults = useCallback(async (jobId: string, format: 'zip' | 'csv' = 'zip'): Promise<void> => {
    try {
      const response = await fetch(`/api/variable-data/download/${jobId}?format=${format}`);
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `variations_${jobId}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Downloaded ${format.toUpperCase()} file`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Download failed';
      toast.error(errorMessage);
    }
  }, []);

  return {
    ...state,
    loadTemplates,
    uploadCSV,
    validateCSV,
    createTemplate,
    selectTemplate,
    generateVariations,
    getJobStatus,
    cancelProcessing,
    reset,
    downloadResults,
  };
};