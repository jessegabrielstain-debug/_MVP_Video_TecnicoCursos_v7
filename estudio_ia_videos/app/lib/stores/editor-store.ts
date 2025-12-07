import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { createClient } from '@/lib/supabase/client';

// Types
interface Slide {
  id: string;
  number: number;
  order_index: number;
  title?: string;
  content?: string;
  notes?: string;
  duration?: number;
  elements: SlideElement[];
  background?: string;
  ttsText?: string;
  audioUrl?: string;
}

interface SlideElement {
  id: string;
  type: 'text' | 'image' | 'shape' | 'video';
  content?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

interface SlideWithTTS extends Slide {
  ttsState: 'idle' | 'generating' | 'ready' | 'error' | 'success';
  ttsUrl?: string;
  errorMessage?: string;
  visualSettings?: {
    backgroundImageUrl?: string;
    backgroundColor?: string;
  };
}

interface EditorState {
  project: Project | null;
  slides: SlideWithTTS[];
  setSlides: (slides: Slide[]) => void;
  updateSlide: (slideId: string, slideData: Partial<Omit<SlideWithTTS, 'id'>>) => void;
  generateTTS: (slideId: string, text: string) => Promise<void>;
  loadProject: (projectId: string) => Promise<void>;
  saveProject: (projectId: string) => Promise<void>;
  addSlide: (type?: 'video' | 'audio' | 'text' | 'pptx') => void;
  deleteSlide: (slideId: string) => void;
  reorderSlides: (startIndex: number, endIndex: number) => void;
}

export const useEditorStore = create<EditorState>()(
  devtools(
    immer((set, get) => ({
      project: null,
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
      loadProject: async (projectId: string) => {
        const supabase = createClient();
        
        try {
          // Fetch project to verify existence and get metadata
          const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single();
            
          if (projectError) throw projectError;

          // Set project data
          set({ project: project as unknown as Project });

          // Fetch slides
          const { data: slides, error: slidesError } = await supabase
            .from('slides')
            .select('*')
            .eq('project_id', projectId)
            .order('order_index', { ascending: true });

          if (slidesError) throw slidesError;

          if (slides && slides.length > 0) {
            // Map database slides to store format
            const mappedSlides: SlideWithTTS[] = slides.map(s => ({
              id: s.id,
              number: s.order_index + 1,
              order_index: s.order_index,
              title: s.title || `Slide ${s.order_index + 1}`,
              content: s.content || '',
              duration: s.duration || 10,
              ttsState: 'idle',
              visualSettings: {
                backgroundImageUrl: s.background_image || undefined,
                backgroundColor: s.background_color || undefined,
              },
              elements: [], // Elements would be fetched from timeline_elements if needed
              audioUrl: (s.audio_config as Record<string, unknown>)?.url as string | undefined
            }));
            
            set({ slides: mappedSlides });
          } else {
            // Initialize with a default slide if empty
            set({ slides: [] });
          }
        } catch (error) {
          console.error('Error loading project:', error);
          // You might want to set an error state here
        }
      },
      saveProject: async (projectId: string) => {
        const supabase = createClient();
        const state = get();
        
        try {
          if (state.slides.length === 0) return;

          // Prepare slides for upsert
          // Note: This assumes IDs are valid UUIDs. 
          // If you have temp IDs, you should handle them (e.g. remove ID to let DB generate, then reload)
          const slidesToSave = state.slides.map(s => ({
            id: s.id.includes('-') && s.id.length > 10 ? s.id : undefined, // Simple check for UUID-like
            project_id: projectId,
            order_index: s.order_index,
            title: s.title,
            content: s.content,
            duration: s.duration,
            background_image: s.visualSettings?.backgroundImageUrl,
            background_color: s.visualSettings?.backgroundColor,
            audio_config: s.audioUrl ? { url: s.audioUrl } : undefined,
            updated_at: new Date().toISOString()
          }));

          const { error } = await supabase
            .from('slides')
            .upsert(slidesToSave);

          if (error) throw error;
          
          // Update project timestamp
          await supabase
            .from('projects')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', projectId);

        } catch (error) {
          console.error('Error saving project:', error);
          throw error;
        }
      },
      addSlide: (type: 'video' | 'audio' | 'text' | 'pptx' = 'pptx') => {
        const state = get();
        const newSlide: SlideWithTTS = {
          id: crypto.randomUUID(),
          number: state.slides.length + 1,
          order_index: state.slides.length,
          title: `New Slide ${state.slides.length + 1}`,
          content: 'New Slide Content',
          duration: 10,
          ttsState: 'idle',
          visualSettings: {},
          elements: []
        };
        set({ slides: [...state.slides, newSlide] });
      },
      deleteSlide: (slideId: string) => {
        set((state) => {
          state.slides = state.slides.filter(s => s.id !== slideId);
          // Re-index slides
          state.slides.forEach((slide, index) => {
            slide.order_index = index;
            slide.number = index + 1;
          });
        });
      },
      reorderSlides: (startIndex: number, endIndex: number) => {
        set((state) => {
          const result = Array.from(state.slides);
          const [removed] = result.splice(startIndex, 1);
          result.splice(endIndex, 0, removed);
          
          // Re-index
          result.forEach((slide, index) => {
            slide.order_index = index;
            slide.number = index + 1;
          });
          
          state.slides = result;
        });
      }
    }))
  )
);
