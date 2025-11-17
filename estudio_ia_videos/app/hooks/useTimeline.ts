'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';

export interface TimelineElement {
  id: string;
  type: 'image' | 'text' | 'audio' | 'video' | 'avatar';
  name: string;
  duration: number;
  startTime: number;
  layer: number;
  visible: boolean;
  locked: boolean;
  properties: {
    opacity?: number;
    volume?: number;
    x?: number;
    y?: number;
    scale?: number;
    rotation?: number;
    color?: string;
    fontSize?: number;
    content?: string;
    src?: string;
  };
}

export interface TimelineTrack {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'overlay';
  visible: boolean;
  locked: boolean;
  elements: TimelineElement[];
}

export interface TimelineProject {
  id: string;
  name: string;
  duration: number;
  fps: number;
  width: number;
  height: number;
  tracks: TimelineTrack[];
  currentTime: number;
  isPlaying: boolean;
  zoom: number;
}

export interface PPTXTextElement {
  id?: string;
  content?: string;
  text?: string;
  fontSize?: number;
  color?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  metadata?: Record<string, unknown>;
}

export interface PPTXSlide {
  id?: string;
  title?: string;
  thumbnail?: string;
  image?: string;
  duration?: number;
  notes?: string;
  textElements?: PPTXTextElement[];
  metadata?: Record<string, unknown>;
}

export interface PPTXData {
  fileName?: string;
  slides: PPTXSlide[];
  metadata?: Record<string, unknown>;
}

interface UseTimelineReturn {
  project: TimelineProject | null;
  selectedElementId: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Project management
  createProject: (name: string, settings?: Partial<TimelineProject>) => void;
  loadProject: (projectId: string) => Promise<void>;
  saveProject: () => Promise<void>;
  updateProject: (updates: Partial<TimelineProject>) => void;
  
  // Playback controls
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  
  // Element management
  addElement: (element: Omit<TimelineElement, 'id'>, trackId: string) => void;
  updateElement: (elementId: string, updates: Partial<TimelineElement>) => void;
  deleteElement: (elementId: string) => void;
  duplicateElement: (elementId: string) => void;
  selectElement: (elementId: string | null) => void;
  
  // Track management
  addTrack: (track: Omit<TimelineTrack, 'id'>) => void;
  updateTrack: (trackId: string, updates: Partial<TimelineTrack>) => void;
  deleteTrack: (trackId: string) => void;
  reorderTracks: (fromIndex: number, toIndex: number) => void;
  
  // PPTX Integration
  loadFromPPTX: (pptxData: PPTXData) => void;
  exportToVideo: () => Promise<void>;
}

export function useTimeline(): UseTimelineReturn {
  const [project, setProject] = useState<TimelineProject | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const playbackTimer = useRef<NodeJS.Timeout>();

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (playbackTimer.current) {
        clearInterval(playbackTimer.current);
      }
    };
  }, []);

  // Project Management
  const createProject = useCallback((name: string, settings?: Partial<TimelineProject>) => {
    const newProject: TimelineProject = {
      id: `project-${Date.now()}`,
      name,
      duration: 120,
      fps: 30,
      width: 1920,
      height: 1080,
      currentTime: 0,
      isPlaying: false,
      zoom: 1,
      tracks: [
        {
          id: 'track-video',
          name: 'Vídeo Principal',
          type: 'video',
          visible: true,
          locked: false,
          elements: []
        },
        {
          id: 'track-audio',
          name: 'Áudio',
          type: 'audio',
          visible: true,
          locked: false,
          elements: []
        },
        {
          id: 'track-overlay',
          name: 'Sobreposições',
          type: 'overlay',
          visible: true,
          locked: false,
          elements: []
        }
      ],
      ...settings
    };

    setProject(newProject);
    setError(null);
    toast.success(`Projeto "${name}" criado com sucesso!`);
  }, []);

  const loadProject = useCallback(async (projectId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/timeline/projects/${projectId}`);
      if (!response.ok) {
        throw new Error('Erro ao carregar projeto');
      }

      const projectData = await response.json();
      setProject(projectData);
      toast.success('Projeto carregado com sucesso!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      toast.error(`Erro ao carregar projeto: ${message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveProject = useCallback(async () => {
    if (!project) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/timeline/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project)
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar projeto');
      }

      toast.success('Projeto salvo com sucesso!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error(`Erro ao salvar projeto: ${message}`);
    } finally {
      setIsLoading(false);
    }
  }, [project]);

  const updateProject = useCallback((updates: Partial<TimelineProject>) => {
    setProject(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  // Playback Controls
  const play = useCallback(() => {
    if (!project) return;

    if (project.isPlaying) {
      // Pause
      if (playbackTimer.current) {
        clearInterval(playbackTimer.current);
      }
      setProject(prev => prev ? { ...prev, isPlaying: false } : null);
    } else {
      // Play
      setProject(prev => prev ? { ...prev, isPlaying: true } : null);
      
      playbackTimer.current = setInterval(() => {
        setProject(prev => {
          if (!prev || !prev.isPlaying) return prev;
          
          const newTime = prev.currentTime + (1 / prev.fps);
          if (newTime >= prev.duration) {
            // End of timeline
            if (playbackTimer.current) {
              clearInterval(playbackTimer.current);
            }
            return { ...prev, currentTime: prev.duration, isPlaying: false };
          }
          
          return { ...prev, currentTime: newTime };
        });
      }, 1000 / (project.fps || 30));
    }
  }, [project]);

  const pause = useCallback(() => {
    if (playbackTimer.current) {
      clearInterval(playbackTimer.current);
    }
    setProject(prev => prev ? { ...prev, isPlaying: false } : null);
  }, []);

  const stop = useCallback(() => {
    if (playbackTimer.current) {
      clearInterval(playbackTimer.current);
    }
    setProject(prev => prev ? { ...prev, currentTime: 0, isPlaying: false } : null);
  }, []);

  const seek = useCallback((time: number) => {
    setProject(prev => {
      if (!prev) return null;
      return { ...prev, currentTime: Math.max(0, Math.min(time, prev.duration)) };
    });
  }, []);

  // Element Management
  const addElement = useCallback((element: Omit<TimelineElement, 'id'>, trackId: string) => {
    const newElement: TimelineElement = {
      ...element,
      id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    setProject(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        tracks: prev.tracks.map(track =>
          track.id === trackId
            ? { ...track, elements: [...track.elements, newElement] }
            : track
        )
      };
    });

    toast.success(`Elemento "${element.name}" adicionado à timeline`);
  }, []);

  const updateElement = useCallback((elementId: string, updates: Partial<TimelineElement>) => {
    setProject(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        tracks: prev.tracks.map(track => ({
          ...track,
          elements: track.elements.map(element =>
            element.id === elementId ? { ...element, ...updates } : element
          )
        }))
      };
    });
  }, []);

  const deleteElement = useCallback((elementId: string) => {
    setProject(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        tracks: prev.tracks.map(track => ({
          ...track,
          elements: track.elements.filter(element => element.id !== elementId)
        }))
      };
    });

    if (selectedElementId === elementId) {
      setSelectedElementId(null);
    }

    toast.success('Elemento removido da timeline');
  }, [selectedElementId]);

  const duplicateElement = useCallback((elementId: string) => {
    setProject(prev => {
      if (!prev) return null;
      
      let elementToDuplicate: TimelineElement | null = null;
      let trackId: string | null = null;
      
      // Find element
      for (const track of prev.tracks) {
        const element = track.elements.find(el => el.id === elementId);
        if (element) {
          elementToDuplicate = element;
          trackId = track.id;
          break;
        }
      }
      
      if (!elementToDuplicate || !trackId) return prev;
      
      const duplicatedElement: TimelineElement = {
        ...elementToDuplicate,
        id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: `${elementToDuplicate.name} (Cópia)`,
        startTime: elementToDuplicate.startTime + elementToDuplicate.duration
      };
      
      return {
        ...prev,
        tracks: prev.tracks.map(track =>
          track.id === trackId
            ? { ...track, elements: [...track.elements, duplicatedElement] }
            : track
        )
      };
    });

    toast.success('Elemento duplicado com sucesso');
  }, []);

  const selectElement = useCallback((elementId: string | null) => {
    setSelectedElementId(elementId);
  }, []);

  // Track Management
  const addTrack = useCallback((track: Omit<TimelineTrack, 'id'>) => {
    const newTrack: TimelineTrack = {
      ...track,
      id: `track-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    setProject(prev => {
      if (!prev) return null;
      return { ...prev, tracks: [...prev.tracks, newTrack] };
    });

    toast.success(`Track "${track.name}" adicionada`);
  }, []);

  const updateTrack = useCallback((trackId: string, updates: Partial<TimelineTrack>) => {
    setProject(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        tracks: prev.tracks.map(track =>
          track.id === trackId ? { ...track, ...updates } : track
        )
      };
    });
  }, []);

  const deleteTrack = useCallback((trackId: string) => {
    setProject(prev => {
      if (!prev) return null;
      return { ...prev, tracks: prev.tracks.filter(track => track.id !== trackId) };
    });

    toast.success('Track removida');
  }, []);

  const reorderTracks = useCallback((fromIndex: number, toIndex: number) => {
    setProject(prev => {
      if (!prev) return null;
      
      const newTracks = [...prev.tracks];
      const [movedTrack] = newTracks.splice(fromIndex, 1);
      newTracks.splice(toIndex, 0, movedTrack);
      
      return { ...prev, tracks: newTracks };
    });
  }, []);

  // PPTX Integration
  const loadFromPPTX = useCallback((pptxData: PPTXData) => {
    if (!pptxData || !pptxData.slides) {
      toast.error('Dados PPTX inválidos');
      return;
    }

    const projectName = pptxData.fileName || 'Projeto PPTX';
    const slideDuration = 5; // 5 segundos por slide
    const totalDuration = pptxData.slides.length * slideDuration;

    // Criar elementos para slides
    const slideElements = pptxData.slides.map((slide, index) => ({
      id: `slide-${index}`,
      type: 'image' as const,
      name: slide.title || `Slide ${index + 1}`,
      duration: slideDuration,
      startTime: index * slideDuration,
      layer: 0,
      visible: true,
      locked: false,
      properties: {
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0,
        src: slide.thumbnail || slide.image || `/api/placeholder/slide-${index + 1}`
      }
    }));

    // Criar elementos de texto se existirem
    const textElements = pptxData.slides.flatMap((slide, slideIndex) => {
      if (!slide.textElements || slide.textElements.length === 0) return [];

      return slide.textElements.map((text, textIndex) => ({
        id: `text-${slideIndex}-${textIndex}`,
        type: 'text' as const,
        name: `Texto Slide ${slideIndex + 1}`,
        duration: slideDuration,
        startTime: slideIndex * slideDuration,
        layer: 1,
        visible: true,
        locked: false,
        properties: {
          opacity: 1,
          x: text?.x ?? 0,
          y: text?.y ?? 0,
          scale: 1,
          rotation: text?.rotation ?? 0,
          content: text?.content || text?.text || '',
          fontSize: text?.fontSize ?? 24,
          color: text?.color || '#000000'
        }
      }));
    });

    const newProject: TimelineProject = {
      id: `pptx-project-${Date.now()}`,
      name: projectName,
      duration: totalDuration,
      fps: 30,
      width: 1920,
      height: 1080,
      currentTime: 0,
      isPlaying: false,
      zoom: 1,
      tracks: [
        {
          id: 'track-slides',
          name: 'Slides PPTX',
          type: 'video',
          visible: true,
          locked: false,
          elements: slideElements
        },
        {
          id: 'track-text',
          name: 'Textos',
          type: 'overlay',
          visible: true,
          locked: false,
          elements: textElements
        },
        {
          id: 'track-audio',
          name: 'Narração',
          type: 'audio',
          visible: true,
          locked: false,
          elements: []
        },
        {
          id: 'track-effects',
          name: 'Efeitos',
          type: 'overlay',
          visible: true,
          locked: false,
          elements: []
        }
      ]
    };

    setProject(newProject);
    toast.success(`Timeline criada: ${pptxData.slides.length} slides, duração total ${totalDuration}s`);
  }, []);

  const exportToVideo = useCallback(async () => {
    if (!project) {
      toast.error('Nenhum projeto carregado');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/render/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project })
      });

      if (!response.ok) {
        throw new Error('Erro ao iniciar renderização');
      }

      const result = await response.json();
      toast.success(`Renderização iniciada! Job ID: ${result.jobId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error(`Erro na renderização: ${message}`);
    } finally {
      setIsLoading(false);
    }
  }, [project]);

  return {
    project,
    selectedElementId,
    isLoading,
    error,
    
    // Project management
    createProject,
    loadProject,
    saveProject,
    updateProject,
    
    // Playback controls
    play,
    pause,
    stop,
    seek,
    
    // Element management
    addElement,
    updateElement,
    deleteElement,
    duplicateElement,
    selectElement,
    
    // Track management
    addTrack,
    updateTrack,
    deleteTrack,
    reorderTracks,
    
    // PPTX Integration
    loadFromPPTX,
    exportToVideo
  };
}