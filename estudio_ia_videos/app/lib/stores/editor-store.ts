import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { Slide } from '@/lib/types';

type TTSState = 'idle' | 'generating' | 'success' | 'error';

export interface SlideWithTTS extends Slide {
  ttsState: TTSState;
  audioUrl?: string;
  errorMessage?: string;
}

interface EditorState {
  slides: SlideWithTTS[];
  setSlides: (slides: Slide[]) => void;
  updateSlide: (slideId: string, slideData: Partial<Omit<SlideWithTTS, 'id'>>) => void;
  generateTTS: (slideId: string, text: string) => Promise<void>;
}

export const useEditorStore = create<EditorState>()(
  devtools(
    immer((set, get) => ({
      slides: [],
      setSlides: (slides) =>
        set((state) => {
          state.slides = slides.map((slide) => ({
            ...slide,
            ttsState: 'idle',
          }));
        }),
      updateSlide: (slideId, slideData) =>
        set((state) => {
          const slide = state.slides.find((s) => s.id === slideId);
          if (slide) {
            Object.assign(slide, slideData);
          }
        }),
      generateTTS: async (slideId, text) => {
        get().updateSlide(slideId, { ttsState: 'generating' });

        try {
          const response = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, slideId }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Falha ao gerar áudio');
          }

          const result = await response.json();
          get().updateSlide(slideId, {
            ttsState: 'success',
            audioUrl: result.audioUrl,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
          get().updateSlide(slideId, {
            ttsState: 'error',
            errorMessage,
          });
        }
      },
    }))
  )
);
