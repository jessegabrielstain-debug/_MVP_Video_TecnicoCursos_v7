
import { useCallback } from 'react';

/**
 * Hook para rastreamento de eventos de analytics
 * 
 * Uso:
 * const analytics = useAnalyticsTrack();
 * analytics.trackUpload(fileSize, fileName);
 */
export function useAnalyticsTrack() {
  const track = useCallback(async (
    category: string,
    action: string,
    options?: {
      label?: string;
      metadata?: Record<string, unknown>;
      duration?: number;
      fileSize?: number;
      projectId?: string;
      provider?: string;
      errorCode?: string;
      errorMessage?: string;
      status?: 'success' | 'error' | 'pending';
    }
  ) => {
    try {
      const response = await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          category,
          action,
          ...options
        })
      });

      if (!response.ok) {
        console.warn('[Analytics] Track failed:', response.statusText);
      }

      return response.json();
    } catch (error) {
      // Não queremos que falhas de analytics quebrem o app
      console.warn('[Analytics] Track error:', error);
      return { success: false };
    }
  }, []);

  // Helpers específicos para eventos comuns
  const trackUpload = useCallback((fileSize: number, fileName: string, projectId?: string) => {
    return track('pptx', 'upload', {
      label: fileName,
      fileSize,
      projectId,
      metadata: { fileName }
    });
  }, [track]);

  const trackRenderStart = useCallback((projectId: string, settings?: Record<string, unknown>) => {
    return track('render', 'start', {
      projectId,
      metadata: settings
    });
  }, [track]);

  const trackRenderComplete = useCallback((projectId: string, duration: number, outputUrl?: string) => {
    return track('render', 'complete', {
      projectId,
      duration,
      metadata: { outputUrl }
    });
  }, [track]);

  const trackRenderError = useCallback((projectId: string, error: string) => {
    return track('render', 'error', {
      projectId,
      errorMessage: error,
      status: 'error'
    });
  }, [track]);

  const trackDownload = useCallback((projectId: string, videoUrl: string) => {
    return track('video', 'download', {
      projectId,
      label: videoUrl,
      metadata: { videoUrl }
    });
  }, [track]);

  const trackTTSGenerate = useCallback((
    projectId: string,
    provider: string,
    duration: number,
    text: string
  ) => {
    return track('tts', 'generate', {
      projectId,
      provider,
      duration,
      metadata: { textLength: text.length }
    });
  }, [track]);

  const trackTimelineEdit = useCallback((projectId: string, action: string, trackType?: string) => {
    return track('timeline', action, {
      projectId,
      label: trackType,
      metadata: { trackType }
    });
  }, [track]);

  const trackCanvasEdit = useCallback((projectId: string, elementType: string) => {
    return track('canvas', 'edit', {
      projectId,
      label: elementType,
      metadata: { elementType }
    });
  }, [track]);

  return {
    track,
    trackUpload,
    trackRenderStart,
    trackRenderComplete,
    trackRenderError,
    trackDownload,
    trackTTSGenerate,
    trackTimelineEdit,
    trackCanvasEdit
  };
}
