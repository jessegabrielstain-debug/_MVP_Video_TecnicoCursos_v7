'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  EditorState, 
  EditorElement, 
  EditorLayer, 
  EditorHistoryEntry,
  EditorProject,
  TextElement,
  ImageElement,
  ShapeElement,
  AvatarElement
} from '@/types/editor';

const initialState: EditorState = {
  elements: [],
  layers: [
    {
      id: 'layer-1',
      name: 'Background',
      visible: true,
      locked: false,
      opacity: 1,
      blendMode: 'normal',
      expanded: true,
    },
    {
      id: 'layer-2',
      name: 'Content',
      visible: true,
      locked: false,
      opacity: 1,
      blendMode: 'normal',
      expanded: true,
    },
  ],
  timeline: {
    duration: 30,
    currentTime: 0,
    playing: false,
    loop: false,
    keyframes: [],
    markers: [],
  },
  selectedElementId: null,
  clipboard: [],
  history: [],
  historyIndex: -1,
  canvas: {
    width: 1920,
    height: 1080,
    backgroundColor: '#ffffff',
    zoom: 1,
    pan: { x: 0, y: 0 },
  },
  tools: {
    activeTool: 'select',
    brush: {
      size: 10,
      color: '#000000',
      opacity: 1,
    },
  },
  preview: {
    enabled: false,
    quality: 'medium',
    showGrid: true,
    showRulers: true,
    showGuides: true,
  },
};

export function useEditor(projectId?: string) {
  const [state, setState] = useState<EditorState>(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoSaveRef = useRef<NodeJS.Timeout>();

  // Auto-save functionality
  useEffect(() => {
    if (projectId) {
      autoSaveRef.current = setInterval(() => {
        saveProject();
      }, 30000); // Auto-save every 30 seconds

      return () => {
        if (autoSaveRef.current) {
          clearInterval(autoSaveRef.current);
        }
      };
    }
  }, [projectId, state]);

  // History management
  type HistoryPayload = EditorHistoryEntry['data'];

  const addToHistory = useCallback((action: string, data: HistoryPayload, description: string) => {
    const entry: EditorHistoryEntry = {
      id: `history-${Date.now()}`,
      timestamp: new Date(),
      action,
      data,
      description,
    };

    setState(prev => ({
      ...prev,
      history: [...prev.history.slice(0, prev.historyIndex + 1), entry],
      historyIndex: prev.historyIndex + 1,
    }));
  }, []);

  // Element management
  type ElementOverrides = Partial<Omit<EditorElement, 'id' | 'type' | 'name'>>;

  const createElement = useCallback((type: EditorElement['type'], properties: ElementOverrides = {}) => {
    const element: EditorElement = {
      id: `element-${Date.now()}`,
      type,
      name: `${type} ${Date.now()}`,
      x: 100,
      y: 100,
      width: 200,
      height: 100,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      layerId: 'layer-2',
      style: {},
      ...getDefaultProperties(type),
      ...properties,
    };

    setState(prev => ({
      ...prev,
      elements: [...prev.elements, element],
      selectedElementId: element.id,
    }));

    addToHistory('createElement', element, `Created ${type} element`);
    return element.id;
  }, [addToHistory]);

  const updateElement = useCallback((elementId: string, updates: Partial<EditorElement>) => {
    setState(prev => ({
      ...prev,
      elements: prev.elements.map(element =>
        element.id === elementId ? { ...element, ...updates } : element
      ),
    }));

    addToHistory('updateElement', { elementId, updates }, `Updated element`);
  }, [addToHistory]);

  const deleteElement = useCallback((elementId: string) => {
    setState(prev => ({
      ...prev,
      elements: prev.elements.filter(element => element.id !== elementId),
      selectedElementId: prev.selectedElementId === elementId ? null : prev.selectedElementId,
    }));

    addToHistory('deleteElement', { elementId }, `Deleted element`);
  }, [addToHistory]);

  const duplicateElement = useCallback((elementId: string) => {
    setState(prev => {
      const element = prev.elements.find(el => el.id === elementId);
      if (!element) return prev;

      const duplicated = {
        ...element,
        id: `element-${Date.now()}`,
        name: `${element.name} Copy`,
        x: element.x + 20,
        y: element.y + 20,
      };

      return {
        ...prev,
        elements: [...prev.elements, duplicated],
        selectedElementId: duplicated.id,
      };
    });

    addToHistory('duplicateElement', { elementId }, `Duplicated element`);
  }, [addToHistory]);

  // Selection management
  const selectElement = useCallback((elementId: string) => {
    setState(prev => ({
      ...prev,
      selectedElementId: elementId,
    }));
  }, []);

  const clearSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedElementId: null,
    }));
  }, []);

  // Layer management
  const createLayer = useCallback((name?: string) => {
    const layer: EditorLayer = {
      id: `layer-${Date.now()}`,
      name: name || `Layer ${Date.now()}`,
      visible: true,
      locked: false,
      opacity: 1,
      blendMode: 'normal',
      expanded: true,
    };

    setState(prev => ({
      ...prev,
      layers: [...prev.layers, layer],
    }));

    addToHistory('createLayer', layer, `Created layer: ${layer.name}`);
    return layer.id;
  }, [addToHistory]);

  const updateLayer = useCallback((layerId: string, updates: Partial<EditorLayer>) => {
    setState(prev => ({
      ...prev,
      layers: prev.layers.map(layer =>
        layer.id === layerId ? { ...layer, ...updates } : layer
      ),
    }));

    addToHistory('updateLayer', { layerId, updates }, `Updated layer`);
  }, [addToHistory]);

  const deleteLayer = useCallback((layerId: string) => {
    setState(prev => {
      // Delete all elements in the layer
      const elementsToDelete = prev.elements.filter(el => el.layerId === layerId);
      const remainingElements = prev.elements.filter(el => el.layerId !== layerId);

      return {
        ...prev,
        layers: prev.layers.filter(l => l.id !== layerId),
        elements: remainingElements,
        selectedElementId: elementsToDelete.some(el => el.id === prev.selectedElementId) 
          ? null 
          : prev.selectedElementId,
      };
    });

    addToHistory('deleteLayer', { layerId }, `Deleted layer`);
  }, [addToHistory]);

  const moveElementToLayer = useCallback((elementId: string, targetLayerId: string) => {
    setState(prev => ({
      ...prev,
      elements: prev.elements.map(element =>
        element.id === elementId ? { ...element, layerId: targetLayerId } : element
      ),
    }));

    addToHistory('moveElementToLayer', { elementId, targetLayerId }, `Moved element to layer`);
  }, [addToHistory]);

  // Timeline management
  const playTimeline = useCallback(() => {
    setState(prev => ({
      ...prev,
      timeline: { ...prev.timeline, playing: true },
    }));
  }, []);

  const pauseTimeline = useCallback(() => {
    setState(prev => ({
      ...prev,
      timeline: { ...prev.timeline, playing: false },
    }));
  }, []);

  const setTimelineTime = useCallback((time: number) => {
    setState(prev => ({
      ...prev,
      timeline: { ...prev.timeline, currentTime: Math.max(0, Math.min(time, prev.timeline.duration)) },
    }));
  }, []);

  const setTimelineDuration = useCallback((duration: number) => {
    setState(prev => ({
      ...prev,
      timeline: { ...prev.timeline, duration: Math.max(1, duration) },
    }));
  }, []);

  // Canvas management
  const setCanvasSize = useCallback((width: number, height: number) => {
    setState(prev => ({
      ...prev,
      canvas: { ...prev.canvas, width, height },
    }));

    addToHistory('setCanvasSize', { width, height }, `Changed canvas size`);
  }, [addToHistory]);

  const setZoom = useCallback((zoom: number) => {
    setState(prev => ({
      ...prev,
      canvas: { ...prev.canvas, zoom: Math.max(0.1, Math.min(5, zoom)) },
    }));
  }, []);

  const setPan = useCallback((x: number, y: number) => {
    setState(prev => ({
      ...prev,
      canvas: { ...prev.canvas, pan: { x, y } },
    }));
  }, []);

  // Tool management
  const setActiveTool = useCallback((tool: EditorState['tools']['activeTool']) => {
    setState(prev => ({
      ...prev,
      tools: { ...prev.tools, activeTool: tool },
    }));
  }, []);

  // History operations
  const undo = useCallback(() => {
    if (state.historyIndex > 0) {
      setState(prev => ({
        ...prev,
        historyIndex: prev.historyIndex - 1,
      }));
      // Implement undo logic based on history entry
    }
  }, [state.historyIndex]);

  const redo = useCallback(() => {
    if (state.historyIndex < state.history.length - 1) {
      setState(prev => ({
        ...prev,
        historyIndex: prev.historyIndex + 1,
      }));
      // Implement redo logic based on history entry
    }
  }, [state.historyIndex, state.history.length]);

  // Clipboard operations
  const copyElements = useCallback(() => {
    if (!state.selectedElementId) return;
    
    const elementToCopy = state.elements.find(el => el.id === state.selectedElementId);
    if (elementToCopy) {
      setState(prev => ({
        ...prev,
        clipboard: [elementToCopy],
      }));
    }
  }, [state.selectedElementId, state.elements]);

  const pasteElements = useCallback(() => {
    if (state.clipboard.length === 0) return;

    const elementToPaste = state.clipboard[0];
    const pastedElement = {
      ...elementToPaste,
      id: `element-${Date.now()}`,
      name: `${elementToPaste.name} Copy`,
      x: elementToPaste.x + 20,
      y: elementToPaste.y + 20,
    };

    setState(prev => ({
      ...prev,
      elements: [...prev.elements, pastedElement],
      selectedElementId: pastedElement.id,
    }));

    addToHistory('pasteElements', [pastedElement], `Pasted element`);
  }, [state.clipboard, addToHistory]);

  // Project management
  const saveProject = useCallback(async () => {
    if (!projectId) return;

    setIsLoading(true);
    try {
      const project: EditorProject = {
        id: projectId,
        name: `Project ${projectId}`,
        description: '',
        thumbnail: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        author: 'Current User',
        version: '1.0.0',
        state,
        settings: {
          autoSave: true,
          autoSaveInterval: 30000,
          snapToGrid: true,
          gridSize: 20,
          showGrid: true,
          showRulers: true,
          showGuides: true,
          magneticGuides: true,
          defaultDuration: 5,
          defaultTransition: 'fade',
          quality: 'high',
          shortcuts: {},
        },
        metadata: {
          duration: state.timeline.duration,
          resolution: { width: state.canvas.width, height: state.canvas.height },
          frameRate: 30,
          format: 'mp4',
          size: 0,
          tags: [],
        },
      };

      // In production, save to API
      localStorage.setItem(`editor-project-${projectId}`, JSON.stringify(project));
      
    } catch (err) {
      setError('Failed to save project');
    } finally {
      setIsLoading(false);
    }
  }, [projectId, state]);

  const loadProject = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      // In production, load from API
      const saved = localStorage.getItem(`editor-project-${id}`);
      if (saved) {
        const project: EditorProject = JSON.parse(saved);
        setState(project.state);
      }
    } catch (err) {
      setError('Failed to load project');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    // State
    state,
    isLoading,
    error,

    // Element operations
    createElement,
    updateElement,
    deleteElement,
    duplicateElement,

    // Selection
    selectElement,
    clearSelection,

    // Layers
    createLayer,
    updateLayer,
    deleteLayer,
    moveElementToLayer,

    // Timeline
    playTimeline,
    pauseTimeline,
    setTimelineTime,
    setTimelineDuration,

    // Canvas
    setCanvasSize,
    setZoom,
    setPan,

    // Tools
    setActiveTool,

    // History
    undo,
    redo,
    canUndo: state.historyIndex > 0,
    canRedo: state.historyIndex < state.history.length - 1,

    // Clipboard
    copyElements,
    pasteElements,

    // Project
    saveProject,
    loadProject,
  };
}

function getDefaultProperties(type: EditorElement['type']): ElementOverrides {
  switch (type) {
    case 'text':
      return {
        content: 'Text Element',
        fontSize: 24,
        fontFamily: 'Arial',
        fontWeight: 'normal',
        color: '#000000',
        textAlign: 'left',
        lineHeight: 1.2,
        letterSpacing: 0,
      };
    case 'image':
      return {
        src: '',
        alt: 'Image',
        fit: 'cover',
      };
    case 'shape':
      return {
        shape: 'rectangle',
        fill: '#3b82f6',
        stroke: '#1e40af',
        strokeWidth: 2,
      };
    case 'avatar':
      return {
        avatarId: 'default',
        pose: 'standing',
        expression: 'neutral',
        clothing: 'casual',
        background: 'transparent',
        lighting: 'natural',
        animation: 'idle',
      };
    default:
      return {};
  }
}