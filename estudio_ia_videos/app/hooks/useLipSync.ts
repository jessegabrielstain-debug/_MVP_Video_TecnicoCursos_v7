
/**
 * 🎤 useLipSync Hook
 * Hook para sincronização de movimentos labiais com áudio TTS
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { logger } from '@/lib/logger';
import { LipSyncFrame, AvatarClientHelper } from '@/lib/avatar-client-logic';

export interface LipSyncState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  currentFrame: LipSyncFrame | null;
  progress: number;
}

export interface UseLipSyncOptions {
  text: string;
  audioUrl: string;
  onComplete?: () => void;
  onError?: (error: Error) => void;
  externalAudio?: HTMLAudioElement | null;
}

export function useLipSync({ text, audioUrl, onComplete, onError, externalAudio }: UseLipSyncOptions) {
  const [state, setState] = useState<LipSyncState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    currentFrame: null,
    progress: 0
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const framesRef = useRef<LipSyncFrame[]>([]);
  const animationFrameRef = useRef<number>();
  const startTimeRef = useRef<number>(0);

  /**
   * Inicializa áudio e gera frames de lip sync
   */
  useEffect(() => {
    if (!audioUrl || !text) return;

    let audio: HTMLAudioElement;
    
    if (externalAudio) {
      audio = externalAudio;
      // Se já estiver carregado, configura duração
      if (audio.duration) {
        setState(prev => ({ ...prev, duration: audio.duration * 1000 }));
      }
    } else {
      audio = new Audio(audioUrl);
    }
    
    audioRef.current = audio;

    const handleLoadedMetadata = async () => {
      const duration = audio.duration * 1000; // Converter para ms
      setState(prev => ({ ...prev, duration }));

      // Gera frames de sincronização labial
      try {
        // Em produção, isso deveria chamar uma API Route:
        // const res = await fetch('/api/lipsync', { body: JSON.stringify({ text, audioUrl }) });
        // const frames = await res.json();
        
        // Por enquanto, usando fallback cliente para evitar erros de build com 'fs'
        const frames = AvatarClientHelper.generateFallbackFrames(audio.duration);
        framesRef.current = frames;
      } catch (error) {
        logger.error('Error generating lip sync frames', error as Error, { audioUrl, component: 'useLipSync' });
        onError?.(error as Error);
      }
    };

    const handleEnded = () => {
      setState(prev => ({ ...prev, isPlaying: false, progress: 100 }));
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      onComplete?.();
    };

    const handleError = (e: Event) => {
      const error = new Error(`Erro ao carregar áudio: ${e.type}`);
      onError?.(error);
    };
    
    // Listeners para sincronizar estado se o áudio for externo
    const handlePlay = () => {
       // Inicia loop de animação se não formos nós que chamamos play()
       if (!state.isPlaying) {
         startTimeRef.current = performance.now() - (audio.currentTime * 1000);
         setState(prev => ({ ...prev, isPlaying: true }));
         animationFrameRef.current = requestAnimationFrame(updateFrame);
       }
    };

    const handlePause = () => {
      setState(prev => ({ ...prev, isPlaying: false }));
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };

    // Adiciona listeners
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    
    if (externalAudio) {
      audio.addEventListener('play', handlePlay);
      audio.addEventListener('pause', handlePause);
      // Se já tiver metadados carregados (ex: re-mount), dispara handler manualmente
      if (audio.readyState >= 1) {
        handleLoadedMetadata();
      }
    }

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      
      if (externalAudio) {
        audio.removeEventListener('play', handlePlay);
        audio.removeEventListener('pause', handlePause);
      } else {
        audio.pause();
        audio.remove();
      }
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [audioUrl, text, onComplete, onError, externalAudio]);

  /**
   * Loop de atualização de frame
   */
  const updateFrame = useCallback(() => {
    if (!audioRef.current || !state.isPlaying) return;

    const currentTime = (performance.now() - startTimeRef.current);
    const audio = audioRef.current;

    // Sincroniza com o tempo real do áudio
    const audioTime = audio.currentTime * 1000;

    // Busca o frame correspondente ao tempo atual
    const frame = AvatarClientHelper.getLipSyncFrameAtTime(framesRef.current, audioTime);

    if (frame) {
      setState(prev => ({
        ...prev,
        currentTime: audioTime,
        currentFrame: frame,
        progress: (audioTime / prev.duration) * 100
      }));
    }

    // Continua o loop
    animationFrameRef.current = requestAnimationFrame(updateFrame);
  }, [state.isPlaying]);

  /**
   * Inicia reprodução
   */
  const play = useCallback(async () => {
    if (!audioRef.current) return;

    try {
      await audioRef.current.play();
      startTimeRef.current = performance.now() - (audioRef.current.currentTime * 1000);
      setState(prev => ({ ...prev, isPlaying: true }));
      
      // Inicia loop de atualização
      animationFrameRef.current = requestAnimationFrame(updateFrame);
    } catch (error) {
      onError?.(error as Error);
    }
  }, [updateFrame, onError]);

  /**
   * Pausa reprodução
   */
  const pause = useCallback(() => {
    if (!audioRef.current) return;

    audioRef.current.pause();
    setState(prev => ({ ...prev, isPlaying: false }));
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  /**
   * Para e reseta
   */
  const stop = useCallback(() => {
    if (!audioRef.current) return;

    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setState(prev => ({
      ...prev,
      isPlaying: false,
      currentTime: 0,
      currentFrame: null,
      progress: 0
    }));

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  /**
   * Busca tempo específico
   */
  const seek = useCallback((time: number) => {
    if (!audioRef.current) return;

    audioRef.current.currentTime = time / 1000; // Converter ms para segundos
    setState(prev => ({ ...prev, currentTime: time }));
  }, []);

  return {
    state,
    play,
    pause,
    stop,
    seek,
    frames: framesRef.current
  };
}
