import { useState, useCallback, useEffect } from 'react';
import { TranscriptionService, TranscriptionResult, KaraokeStyle } from '@/lib/subtitles/transcription-service';
import { useToast } from '@/components/ui/use-toast';

export interface UseTranscriptionOptions {
  enableKaraoke?: boolean;
  language?: string;
  enableSpeakerDiarization?: boolean;
  maxSpeakers?: number;
  karaokeStyle?: KaraokeStyle;
}

export interface TranscriptionState {
  isTranscribing: boolean;
  progress: number;
  result: TranscriptionResult | null;
  error: string | null;
  karaokeSubtitles: string | null;
  srtSubtitles: string | null;
}

export const useTranscription = (options: UseTranscriptionOptions = {}) => {
  const {
    enableKaraoke = true,
    language = 'pt-BR',
    enableSpeakerDiarization = false,
    maxSpeakers = 2,
    karaokeStyle = {
      activeColor: '#00ff00',
      inactiveColor: '#ffffff',
      fontSize: 24,
      fontFamily: 'Arial',
      animationSpeed: 300
    }
  } = options;

  const [state, setState] = useState<TranscriptionState>({
    isTranscribing: false,
    progress: 0,
    result: null,
    error: null,
    karaokeSubtitles: null,
    srtSubtitles: null
  });

  const { toast } = useToast();
  const transcriptionService = TranscriptionService.getInstance();

  const transcribeAudio = useCallback(async (
    audioPath: string,
    onProgress?: (progress: number) => void
  ): Promise<TranscriptionResult | null> => {
    let progressInterval: NodeJS.Timeout | undefined;
    try {
      setState(prev => ({ ...prev, isTranscribing: true, progress: 0, error: null }));

      // Simulate progress updates
      progressInterval = setInterval(() => {
        setState(prev => {
          const newProgress = Math.min(prev.progress + 10, 90);
          onProgress?.(newProgress);
          return { ...prev, progress: newProgress };
        });
      }, 1000);

      const result = await transcriptionService.transcribeAudio(audioPath, {
        language,
        enableKaraoke,
        enableSpeakerDiarization,
        maxSpeakers
      });

      clearInterval(progressInterval);
      setState(prev => ({ ...prev, progress: 100 }));

      // Generate subtitle formats
      const karaokeSubtitles = enableKaraoke 
        ? transcriptionService.generateKaraokeSubtitles(result, karaokeStyle)
        : null;
      
      const srtSubtitles = transcriptionService.generateSRT(result);

      setState(prev => ({
        ...prev,
        isTranscribing: false,
        result,
        karaokeSubtitles,
        srtSubtitles,
        progress: 100
      }));

      toast({
        title: 'Transcrição concluída',
        description: `Foram transcritas ${result.wordCount} palavras com ${Math.round(result.confidence * 100)}% de confiança`,
        variant: 'default'
      });

      return result;
    } catch (error) {
      clearInterval(progressInterval);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao transcrever áudio';
      
      setState(prev => ({
        ...prev,
        isTranscribing: false,
        error: errorMessage,
        progress: 0
      }));

      toast({
        title: 'Erro na transcrição',
        description: errorMessage,
        variant: 'destructive'
      });

      return null;
    }
  }, [language, enableKaraoke, enableSpeakerDiarization, maxSpeakers, karaokeStyle, toast, transcriptionService]);

  const translateTranscription = useCallback(async (
    targetLanguage: string,
    options: {
      preserveTiming?: boolean;
      enableKaraoke?: boolean;
    } = {}
  ): Promise<TranscriptionResult | null> => {
    if (!state.result) {
      toast({
        title: 'Nenhuma transcrição disponível',
        description: 'Por favor, transcreva um áudio primeiro',
        variant: 'destructive'
      });
      return null;
    }

    try {
      setState(prev => ({ ...prev, isTranscribing: true, error: null }));

      const translatedResult = await transcriptionService.translateTranscription(
        state.result,
        targetLanguage,
        options
      );

      // Generate new subtitle formats for translated content
      const karaokeSubtitles = options.enableKaraoke ?? enableKaraoke
        ? transcriptionService.generateKaraokeSubtitles(translatedResult, karaokeStyle)
        : null;
      
      const srtSubtitles = transcriptionService.generateSRT(translatedResult);

      setState(prev => ({
        ...prev,
        isTranscribing: false,
        result: translatedResult,
        karaokeSubtitles,
        srtSubtitles
      }));

      toast({
        title: 'Tradução concluída',
        description: `Transcrição traduzida para ${targetLanguage}`,
        variant: 'default'
      });

      return translatedResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao traduzir transcrição';
      
      setState(prev => ({
        ...prev,
        isTranscribing: false,
        error: errorMessage
      }));

      toast({
        title: 'Erro na tradução',
        description: errorMessage,
        variant: 'destructive'
      });

      return null;
    }
  }, [state.result, enableKaraoke, karaokeStyle, toast, transcriptionService]);

  const exportSubtitles = useCallback((format: 'srt' | 'ass' | 'vtt', filename?: string): void => {
    if (!state.result) {
      toast({
        title: 'Nenhuma transcrição disponível',
        description: 'Por favor, transcreva um áudio primeiro',
        variant: 'destructive'
      });
      return;
    }

    let content: string;
    let mimeType: string;
    let defaultFilename: string;

    switch (format) {
      case 'srt':
        content = state.srtSubtitles || transcriptionService.generateSRT(state.result);
        mimeType = 'text/plain';
        defaultFilename = 'subtitles.srt';
        break;
      
      case 'ass':
        content = state.karaokeSubtitles || transcriptionService.generateKaraokeSubtitles(state.result, karaokeStyle);
        mimeType = 'text/plain';
        defaultFilename = 'karaoke.ass';
        break;
      
      case 'vtt':
        content = generateVTT(state.result);
        mimeType = 'text/vtt';
        defaultFilename = 'subtitles.vtt';
        break;
      
      default:
        throw new Error(`Formato não suportado: ${format}`);
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || defaultFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Legendas exportadas',
      description: `Arquivo ${format.toUpperCase()} baixado com sucesso`,
      variant: 'default'
    });
  }, [state.result, state.srtSubtitles, state.karaokeSubtitles, karaokeStyle, toast, transcriptionService]);

  const clearTranscription = useCallback((): void => {
    setState({
      isTranscribing: false,
      progress: 0,
      result: null,
      error: null,
      karaokeSubtitles: null,
      srtSubtitles: null
    });
  }, []);

  return {
    ...state,
    transcribeAudio,
    translateTranscription,
    exportSubtitles,
    clearTranscription
  };
};

function generateVTT(transcription: TranscriptionResult): string {
  let vtt = 'WEBVTT\n\n';
  
  transcription.segments.forEach((segment, index) => {
    const startTime = formatVTTTime(segment.startTime);
    const endTime = formatVTTTime(segment.endTime);
    
    vtt += `${index + 1}\n${startTime} --> ${endTime}\n${segment.text}\n\n`;
  });
  
  return vtt;
}

function formatVTTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millisecs = Math.floor((seconds % 1) * 1000);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${millisecs.toString().padStart(3, '0')}`;
}