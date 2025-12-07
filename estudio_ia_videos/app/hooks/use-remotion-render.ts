/**
 * 🎬 Hook Remotion Render
 * Hook para facilitar renderização com Remotion
 */

import { useState, useCallback } from 'react';
import { VideoCompositionProps } from '@/lib/types/remotion-types';

interface RenderOptions {
  compositionId: string;
  props: VideoCompositionProps;
  quality?: number;
  codec?: 'h264' | 'h265' | 'vp8' | 'vp9';
}

interface RenderResult {
  success: boolean;
  outputPath?: string;
  composition?: {
    id: string;
    width: number;
    height: number;
    fps: number;
    durationInFrames: number;
  };
  renderTime?: number;
  fileSize?: number;
  error?: string;
}

interface RenderState {
  isRendering: boolean;
  progress: number;
  result: RenderResult | null;
  error: string | null;
}

export function useRemotionRender() {
  const [state, setState] = useState<RenderState>({
    isRendering: false,
    progress: 0,
    result: null,
    error: null,
  });

  const renderVideo = useCallback(async (options: RenderOptions): Promise<RenderResult> => {
    setState({
      isRendering: true,
      progress: 0,
      result: null,
      error: null,
    });

    try {
      console.log('🎬 Starting Remotion render:', options.compositionId);

      const response = await fetch('/api/remotion/render', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Render failed');
      }

      const result: RenderResult = await response.json();

      setState({
        isRendering: false,
        progress: 100,
        result,
        error: null,
      });

      console.log('✅ Render completed:', result);
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setState({
        isRendering: false,
        progress: 0,
        result: null,
        error: errorMessage,
      });

      console.error('❌ Render error:', error);
      throw error;
    }
  }, []);

  const getComposition = useCallback(async (compositionId: string) => {
    try {
      const response = await fetch(`/api/remotion/render?compositionId=${compositionId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get composition');
      }

      const data = await response.json();
      return data.composition;

    } catch (error) {
      console.error('❌ Get composition error:', error);
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      isRendering: false,
      progress: 0,
      result: null,
      error: null,
    });
  }, []);

  return {
    ...state,
    renderVideo,
    getComposition,
    reset,
  };
}

// Hook específico para renderizar timeline
export function useTimelineRender() {
  const { renderVideo, ...rest } = useRemotionRender();

  const renderTimeline = useCallback(async (
    project: VideoCompositionProps['project'],
    options?: {
      quality?: number;
      codec?: 'h264' | 'h265' | 'vp8' | 'vp9';
      advanced?: boolean;
    }
  ) => {
    const compositionId = options?.advanced ? 'AdvancedVideoComposition' : 'VideoComposition';
    
    const props: VideoCompositionProps = {
      project,
      config: {
        width: project.resolution.width,
        height: project.resolution.height,
        fps: project.fps,
        durationInFrames: Math.round((project.duration / 1000) * project.fps),
        composition: compositionId,
      },
    };

    return renderVideo({
      compositionId,
      props,
      quality: options?.quality,
      codec: options?.codec,
    });
  }, [renderVideo]);

  return {
    ...rest,
    renderTimeline,
  };
}

// Hook específico para renderizar PPTX
export function usePPTXRender() {
  const { renderVideo, ...rest } = useRemotionRender();

  const renderPPTX = useCallback(async (
    project: VideoCompositionProps['project'],
    options?: {
      quality?: number;
      codec?: 'h264' | 'h265' | 'vp8' | 'vp9';
    }
  ) => {
    const props: VideoCompositionProps = {
      project,
      config: {
        width: project.resolution.width,
        height: project.resolution.height,
        fps: project.fps,
        durationInFrames: Math.round((project.duration / 1000) * project.fps),
        composition: 'PPTXVideoComposition',
      },
    };

    return renderVideo({
      compositionId: 'PPTXVideoComposition',
      props,
      quality: options?.quality,
      codec: options?.codec,
    });
  }, [renderVideo]);

  return {
    ...rest,
    renderPPTX,
  };
}