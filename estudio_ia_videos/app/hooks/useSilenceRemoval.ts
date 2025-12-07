import { useState, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';

export interface SilenceRemovalOptions {
  silenceThreshold: number;
  minSilenceDuration: number;
  breathDetection: boolean;
  fillerWordDetection: boolean;
  minBreathDuration: number;
  maxBreathDuration: number;
  padding: number;
}

export interface SilenceSegment {
  start: number;
  end: number;
  duration: number;
  type: 'silence' | 'breath' | 'filler';
  confidence: number;
}

export interface SilenceDetectionResult {
  segments: SilenceSegment[];
  totalSilenceDuration: number;
  totalBreathDuration: number;
  totalFillerDuration: number;
  originalDuration: number;
  processedDuration: number;
  silenceRatio: number;
  audioQuality: number;
}

export interface SilenceRemovalState {
  isProcessing: boolean;
  isDetecting: boolean;
  isRemoving: boolean;
  progress: number;
  result: SilenceDetectionResult | null;
  error: string | null;
  originalFile: File | null;
  processedFile: File | null;
}

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toFixed(3).padStart(6, '0')}`;
  };

export const useSilenceRemoval = () => {
  const [state, setState] = useState<SilenceRemovalState>({
    isProcessing: false,
    isDetecting: false,
    isRemoving: false,
    progress: 0,
    result: null,
    error: null,
    originalFile: null,
    processedFile: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const detectSilence = useCallback(async (
    file: File,
    options: Partial<SilenceRemovalOptions> = {}
  ): Promise<SilenceDetectionResult | null> => {
    try {
      setState(prev => ({ ...prev, isDetecting: true, error: null, progress: 0 }));
      
      abortControllerRef.current = new AbortController();

      const formData = new FormData();
      formData.append('file', file);
      formData.append('options', JSON.stringify(options));

      const response = await fetch('/api/silence/detect', {
        method: 'POST',
        body: formData,
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Detection failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      setState(prev => ({ 
        ...prev, 
        isDetecting: false, 
        result,
        originalFile: file,
        progress: 100
      }));

      toast.success(`Detected ${result.segments.length} segments to remove`);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Detection failed';
      setState(prev => ({ 
        ...prev, 
        isDetecting: false, 
        error: errorMessage,
        progress: 0
      }));
      toast.error(errorMessage);
      return null;
    }
  }, []);

  const removeSilence = useCallback(async (
    file: File,
    segments: SilenceSegment[],
    options: Partial<SilenceRemovalOptions> = {}
  ): Promise<File | null> => {
    try {
      setState(prev => ({ ...prev, isRemoving: true, error: null, progress: 0 }));
      
      abortControllerRef.current = new AbortController();

      const formData = new FormData();
      formData.append('file', file);
      formData.append('segments', JSON.stringify(segments));
      formData.append('options', JSON.stringify(options));

      const response = await fetch('/api/silence/remove', {
        method: 'POST',
        body: formData,
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Removal failed: ${response.statusText}`);
      }

      // Get the processed file as a blob
      const blob = await response.blob();
      const processedFile = new File([blob], `processed_${file.name}`, {
        type: file.type,
      });

      setState(prev => ({ 
        ...prev, 
        isRemoving: false,
        processedFile,
        progress: 100
      }));

      toast.success('Silence removed successfully');
      return processedFile;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Removal failed';
      setState(prev => ({ 
        ...prev, 
        isRemoving: false, 
        error: errorMessage,
        progress: 0
      }));
      toast.error(errorMessage);
      return null;
    }
  }, []);

  const processFile = useCallback(async (
    file: File,
    options: Partial<SilenceRemovalOptions> = {}
  ): Promise<File | null> => {
    try {
      setState(prev => ({ ...prev, isProcessing: true, error: null, progress: 0 }));

      // First detect silence
      const detectionResult = await detectSilence(file, options);
      if (!detectionResult) {
        return null;
      }

      // Then remove silence
      const processedFile = await removeSilence(file, detectionResult.segments, options);
      
      setState(prev => ({ 
        ...prev, 
        isProcessing: false,
        progress: 100
      }));

      return processedFile;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Processing failed';
      setState(prev => ({ 
        ...prev, 
        isProcessing: false, 
        error: errorMessage,
        progress: 0
      }));
      toast.error(errorMessage);
      return null;
    }
  }, [detectSilence, removeSilence]);

  const cancelProcessing = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState(prev => ({ 
      ...prev, 
      isProcessing: false,
      isDetecting: false,
      isRemoving: false,
      progress: 0
    }));
    toast('Processing cancelled');
  }, []);

  const reset = useCallback(() => {
    setState({
      isProcessing: false,
      isDetecting: false,
      isRemoving: false,
      progress: 0,
      result: null,
      error: null,
      originalFile: null,
      processedFile: null,
    });
  }, []);

  const exportResult = useCallback(async (format: 'json' | 'csv' | 'srt' = 'json') => {
    if (!state.result) return;

    let content: string;
    let filename: string;
    let mimeType: string;

    switch (format) {
      case 'csv':
        content = [
          'Start,End,Duration,Type,Confidence',
          ...state.result.segments.map(seg => 
            `${seg.start},${seg.end},${seg.duration},${seg.type},${seg.confidence}`
          )
        ].join('\n');
        filename = 'silence_segments.csv';
        mimeType = 'text/csv';
        break;
      case 'srt':
        content = state.result!.segments
          .map((seg, index) => 
            `${index + 1}\n${formatTime(seg?.start || 0)} --> ${formatTime(seg?.end || 0)}\n${seg?.type || ''} (${(seg?.confidence || 0).toFixed(2)})\n`
          )
          .join('\n');
        filename = 'silence_segments.srt';
        mimeType = 'text/srt';
        break;
      default:
        content = JSON.stringify(state.result, null, 2);
        filename = 'silence_detection.json';
        mimeType = 'application/json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`Exported as ${format.toUpperCase()}`);
  }, [state.result]);

  return {
    ...state,
    detectSilence,
    removeSilence,
    processFile,
    cancelProcessing,
    reset,
    exportResult,
  };
};