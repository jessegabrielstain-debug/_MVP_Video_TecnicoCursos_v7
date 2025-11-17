/**
 * Advanced Timeline State Management Hook
 * Inspired by Motionity with React/Next.js integration
 */

import { useReducer, useCallback, useRef, useEffect, useMemo } from 'react';
import { TimelineProject, TimelineElement, TimelineLayer, TimelineAction, TimelineSelection, TimelineKeyframe } from '@/lib/types/timeline-types';

// Initial state
const createInitialProject = (): TimelineProject => ({
  id: crypto.randomUUID(),
  name: 'Untitled Project',
  duration: 30000, // 30 seconds default
  fps: 30,
  resolution: { width: 1920, height: 1080 },
  currentTime: 0,
  zoomLevel: 1,
  selectedElementIds: [],
  clipboardElements: [],
  layers: [
    {
      id: 'video-layer',
      name: 'Video',
      type: 'video',
      visible: true,
      locked: false,
      height: 60,
      color: '#3b82f6',
      elements: []
    },
    {
      id: 'audio-layer',
      name: 'Audio',
      type: 'audio',
      visible: true,
      locked: false,
      height: 40,
      color: '#10b981',
      elements: []
    },
    {
      id: 'overlay-layer',
      name: 'Overlay',
      type: 'overlay',
      visible: true,
      locked: false,
      height: 50,
      color: '#f59e0b',
      elements: []
    }
  ],
  settings: {
    backgroundColor: '#000000',
    audioSampleRate: 48000,
    videoBitrate: 8000,
    audioBitrate: 320
  },
  history: {
    past: [],
    present: {} as TimelineProject,
    future: []
  }
});

// Timeline reducer
function timelineReducer(state: TimelineProject, action: TimelineAction): TimelineProject {
  switch (action.type) {
    case 'ADD_ELEMENT': {
      const newState = { ...state };
      const layerIndex = newState.layers.findIndex(l => l.id === action.layerId);
      if (layerIndex >= 0) {
        newState.layers[layerIndex] = {
          ...newState.layers[layerIndex],
          elements: [...newState.layers[layerIndex].elements, action.element]
        };
      }
      return newState;
    }

    case 'REMOVE_ELEMENT': {
      const newState = { ...state };
      newState.layers = newState.layers.map(layer => ({
        ...layer,
        elements: layer.elements.filter(el => el.id !== action.elementId)
      }));
      newState.selectedElementIds = newState.selectedElementIds.filter(id => id !== action.elementId);
      return newState;
    }

    case 'UPDATE_ELEMENT': {
      const newState = { ...state };
      newState.layers = newState.layers.map(layer => ({
        ...layer,
        elements: layer.elements.map(el =>
          el.id === action.elementId ? { ...el, ...action.updates } : el
        )
      }));
      return newState;
    }

    case 'MOVE_ELEMENT': {
      const newState = { ...state };
      let elementToMove: TimelineElement | null = null;
      let sourceLayerId = '';

      // Find and remove element from source layer
      newState.layers = newState.layers.map(layer => {
        const elementIndex = layer.elements.findIndex(el => el.id === action.elementId);
        if (elementIndex >= 0) {
          elementToMove = layer.elements[elementIndex];
          sourceLayerId = layer.id;
          return {
            ...layer,
            elements: layer.elements.filter((_, i) => i !== elementIndex)
          };
        }
        return layer;
      });

      if (elementToMove) {
        const targetLayerId = action.newLayerId || sourceLayerId;
        const updatedElement = { ...elementToMove, startTime: action.newStartTime };

        // Add element to target layer
        newState.layers = newState.layers.map(layer =>
          layer.id === targetLayerId
            ? { ...layer, elements: [...layer.elements, updatedElement] }
            : layer
        );
      }

      return newState;
    }

    case 'RESIZE_ELEMENT': {
      const newState = { ...state };
      newState.layers = newState.layers.map(layer => ({
        ...layer,
        elements: layer.elements.map(el =>
          el.id === action.elementId
            ? { ...el, duration: action.newDuration }
            : el
        )
      }));
      return newState;
    }

    case 'ADD_KEYFRAME': {
      const newState = { ...state };
      newState.layers = newState.layers.map(layer => ({
        ...layer,
        elements: layer.elements.map(el =>
          el.id === action.elementId
            ? { ...el, keyframes: [...(el.keyframes || []), action.keyframe] }
            : el
        )
      }));
      return newState;
    }

    case 'SET_CURRENT_TIME': {
      return { ...state, currentTime: Math.max(0, action.time) };
    }

    case 'SET_ZOOM_LEVEL': {
      return { ...state, zoomLevel: Math.max(0.1, Math.min(10, action.zoomLevel)) };
    }

    case 'SET_SELECTION': {
      return {
        ...state,
        selectedElementIds: action.selection.elementIds
      };
    }

    case 'ADD_LAYER': {
      return {
        ...state,
        layers: [...state.layers, action.layer]
      };
    }

    case 'REMOVE_LAYER': {
      return {
        ...state,
        layers: state.layers.filter(layer => layer.id !== action.layerId)
      };
    }

    case 'UPDATE_LAYER': {
      return {
        ...state,
        layers: state.layers.map(layer =>
          layer.id === action.layerId ? { ...layer, ...action.updates } : layer
        )
      };
    }

    case 'COPY_ELEMENTS': {
      const elementsToCopy: TimelineElement[] = [];
      state.layers.forEach(layer => {
        layer.elements.forEach(element => {
          if (action.elementIds.includes(element.id)) {
            elementsToCopy.push(element);
          }
        });
      });
      return { ...state, clipboardElements: elementsToCopy };
    }

    case 'PASTE_ELEMENTS': {
      const newState = { ...state };
      const targetLayer = newState.layers.find(l => l.id === action.targetLayerId);

      if (targetLayer && state.clipboardElements.length > 0) {
        const pastedElements = state.clipboardElements.map((element, index) => ({
          ...element,
          id: crypto.randomUUID(),
          startTime: action.targetTime + (index * 100), // slight offset for multiple elements
          keyframes: (element.keyframes || []).map(kf => ({ ...kf, id: crypto.randomUUID() }))
        }));

        newState.layers = newState.layers.map(layer =>
          layer.id === action.targetLayerId
            ? { ...layer, elements: [...layer.elements, ...pastedElements] }
            : layer
        );
      }

      return newState;
    }

    default:
      return state;
  }
}

// Main timeline hook
export function useTimeline() {
  const initialProject = useMemo(() => createInitialProject(), []);
  const [project, dispatch] = useReducer(timelineReducer, initialProject);
  const animationFrameRef = useRef<number>();
  const isPlayingRef = useRef(false);
  const startTimeRef = useRef(0);

  // Play/Pause functionality
  const play = useCallback(() => {
    if (!isPlayingRef.current) {
      isPlayingRef.current = true;
      startTimeRef.current = Date.now() - project.currentTime;

      const animate = () => {
        if (isPlayingRef.current) {
          const currentTime = Date.now() - startTimeRef.current;
          if (currentTime <= project.duration) {
            dispatch({ type: 'SET_CURRENT_TIME', time: currentTime });
            animationFrameRef.current = requestAnimationFrame(animate);
          } else {
            pause();
          }
        }
      };

      animationFrameRef.current = requestAnimationFrame(animate);
    }
  }, [project.currentTime, project.duration]);

  const pause = useCallback(() => {
    isPlayingRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  const stop = useCallback(() => {
    pause();
    dispatch({ type: 'SET_CURRENT_TIME', time: 0 });
  }, [pause]);

  const seek = useCallback((time: number) => {
    dispatch({ type: 'SET_CURRENT_TIME', time });
  }, []);

  // Element operations
  const addElement = useCallback((element: TimelineElement, layerId: string) => {
    dispatch({ type: 'ADD_ELEMENT', element, layerId });
  }, []);

  const removeElement = useCallback((elementId: string) => {
    dispatch({ type: 'REMOVE_ELEMENT', elementId });
  }, []);

  const updateElement = useCallback((elementId: string, updates: Partial<TimelineElement>) => {
    dispatch({ type: 'UPDATE_ELEMENT', elementId, updates });
  }, []);

  const moveElement = useCallback((elementId: string, newStartTime: number, newLayerId?: string) => {
    dispatch({ type: 'MOVE_ELEMENT', elementId, newStartTime, newLayerId });
  }, []);

  const resizeElement = useCallback((elementId: string, newDuration: number) => {
    dispatch({ type: 'RESIZE_ELEMENT', elementId, newDuration });
  }, []);

  // Keyframe operations
  const addKeyframe = useCallback((elementId: string, keyframe: TimelineKeyframe) => {
    dispatch({ type: 'ADD_KEYFRAME', elementId, keyframe });
  }, []);

  // Selection operations
  const selectElements = useCallback((elementIds: string[]) => {
    dispatch({ type: 'SET_SELECTION', selection: { elementIds, startTime: 0, endTime: 0, layerIds: [] } });
  }, []);

  const selectElement = useCallback((elementId: string) => {
    selectElements([elementId]);
  }, [selectElements]);

  const clearSelection = useCallback(() => {
    selectElements([]);
  }, [selectElements]);

  // Layer operations
  const addLayer = useCallback((layer: TimelineLayer) => {
    dispatch({ type: 'ADD_LAYER', layer });
  }, []);

  const removeLayer = useCallback((layerId: string) => {
    dispatch({ type: 'REMOVE_LAYER', layerId });
  }, []);

  const updateLayer = useCallback((layerId: string, updates: Partial<TimelineLayer>) => {
    dispatch({ type: 'UPDATE_LAYER', layerId, updates });
  }, []);

  // Clipboard operations
  const copyElements = useCallback((elementIds: string[]) => {
    dispatch({ type: 'COPY_ELEMENTS', elementIds });
  }, []);

  const pasteElements = useCallback((targetTime: number, targetLayerId: string) => {
    dispatch({ type: 'PASTE_ELEMENTS', targetTime, targetLayerId });
  }, []);

  // Zoom operations
  const zoomIn = useCallback(() => {
    dispatch({ type: 'SET_ZOOM_LEVEL', zoomLevel: project.zoomLevel * 1.2 });
  }, [project.zoomLevel]);

  const zoomOut = useCallback(() => {
    dispatch({ type: 'SET_ZOOM_LEVEL', zoomLevel: project.zoomLevel / 1.2 });
  }, [project.zoomLevel]);

  const setZoom = useCallback((zoomLevel: number) => {
    dispatch({ type: 'SET_ZOOM_LEVEL', zoomLevel });
  }, []);

  // Utility functions
  const getElementsAtTime = useCallback((time: number) => {
    const elements: TimelineElement[] = [];
    project.layers.forEach(layer => {
      layer.elements.forEach(element => {
        if (element.startTime <= time && time <= element.startTime + element.duration) {
          elements.push(element);
        }
      });
    });
    return elements;
  }, [project.layers]);

  const getSelectedElements = useCallback(() => {
    const selectedElements: TimelineElement[] = [];
    project.layers.forEach(layer => {
      layer.elements.forEach(element => {
        if (project.selectedElementIds.includes(element.id)) {
          selectedElements.push(element);
        }
      });
    });
    return selectedElements;
  }, [project.layers, project.selectedElementIds]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    // State
    project,
    isPlaying: isPlayingRef.current,

    // Playback controls
    play,
    pause,
    stop,
    seek,

    // Element operations
    addElement,
    removeElement,
    updateElement,
    moveElement,
    resizeElement,
    addKeyframe,

    // Selection
    selectElement,
    selectElements,
    clearSelection,
    getSelectedElements,

    // Layers
    addLayer,
    removeLayer,
    updateLayer,

    // Clipboard
    copyElements,
    pasteElements,

    // Zoom
    zoomIn,
    zoomOut,
    setZoom,

    // Utilities
    getElementsAtTime,

    // Direct dispatch for advanced operations
    dispatch
  };
}