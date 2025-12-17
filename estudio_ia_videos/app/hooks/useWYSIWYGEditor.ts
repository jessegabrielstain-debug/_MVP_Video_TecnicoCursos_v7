import { useState, useCallback, useRef, useEffect } from 'react';
import { logger } from '@/lib/logger';

export interface EditorElement {
  id: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'shape' | 'avatar' | 'button' | 'quiz';
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation: number;
  opacity: number;
  zIndex: number;
  locked: boolean;
  visible: boolean;
  
  // Content properties
  content?: string;
  src?: string;
  style?: {
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    color?: string;
    backgroundColor?: string;
    borderRadius?: number;
    border?: string;
    padding?: number;
    textAlign?: 'left' | 'center' | 'right';
  };
  
  // Animation properties
  animations?: Animation[];
  
  // Interactive properties
  interactions?: Interaction[];
  
  // Metadata
  name?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Animation {
  id: string;
  type: 'fadeIn' | 'fadeOut' | 'slideIn' | 'slideOut' | 'scale' | 'rotate' | 'bounce' | 'pulse';
  duration: number;
  delay: number;
  easing: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out';
  direction?: 'left' | 'right' | 'up' | 'down';
  repeat?: number;
  autoplay: boolean;
  trigger?: 'onLoad' | 'onClick' | 'onHover' | 'onScroll' | 'timeline';
  timelinePosition?: number;
}

export interface Interaction {
  id: string;
  type: 'click' | 'hover' | 'doubleClick' | 'drag';
  action: 'navigate' | 'animate' | 'showElement' | 'hideElement' | 'playAudio' | 'showQuiz';
  target?: string;
  parameters?: Record<string, unknown>;
}

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  elements: string[]; // Element IDs
  order: number;
}

export interface Timeline {
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  keyframes: Keyframe[];
  markers: TimelineMarker[];
}

export interface Keyframe {
  id: string;
  time: number;
  elementId: string;
  properties: Partial<EditorElement>;
  easing: string;
}

export interface TimelineMarker {
  id: string;
  time: number;
  label: string;
  color: string;
}

export interface EditorState {
  elements: EditorElement[];
  layers: Layer[];
  timeline: Timeline;
  selectedElements: string[];
  clipboard: EditorElement[];
  history: EditorSnapshot[];
  historyIndex: number;
  canvasSize: { width: number; height: number };
  zoom: number;
  gridEnabled: boolean;
  snapToGrid: boolean;
  gridSize: number;
}

export interface EditorSnapshot {
  id: string;
  timestamp: Date;
  description: string;
  state: Partial<EditorState>;
}

interface UseWYSIWYGEditorReturn {
  // State
  editorState: EditorState;
  isPlaying: boolean;
  isDragging: boolean;
  draggedElement: string | null;
  
  // Element management
  addElement: (type: EditorElement['type'], position?: { x: number; y: number }) => string;
  updateElement: (id: string, updates: Partial<EditorElement>) => void;
  deleteElement: (id: string) => void;
  duplicateElement: (id: string) => string;
  
  // Selection
  selectElement: (id: string, multiSelect?: boolean) => void;
  selectMultiple: (ids: string[]) => void;
  clearSelection: () => void;
  
  // Positioning and transformation
  moveElement: (id: string, position: { x: number; y: number }) => void;
  resizeElement: (id: string, size: { width: number; height: number }) => void;
  rotateElement: (id: string, rotation: number) => void;
  
  // Layer management
  createLayer: (name: string) => string;
  deleteLayer: (id: string) => void;
  moveElementToLayer: (elementId: string, layerId: string) => void;
  reorderLayers: (layerIds: string[]) => void;
  toggleLayerVisibility: (id: string) => void;
  toggleLayerLock: (id: string) => void;
  
  // Animation and timeline
  addAnimation: (elementId: string, animation: Omit<Animation, 'id'>) => string;
  updateAnimation: (elementId: string, animationId: string, updates: Partial<Animation>) => void;
  removeAnimation: (elementId: string, animationId: string) => void;
  addKeyframe: (elementId: string, time: number, properties: Partial<EditorElement>) => string;
  updateKeyframe: (keyframeId: string, updates: Partial<Keyframe>) => void;
  removeKeyframe: (keyframeId: string) => void;
  
  // Timeline controls
  play: () => void;
  pause: () => void;
  stop: () => void;
  seekTo: (time: number) => void;
  setTimelineDuration: (duration: number) => void;
  
  // Clipboard operations
  copy: () => void;
  cut: () => void;
  paste: (position?: { x: number; y: number }) => void;
  
  // History
  undo: () => void;
  redo: () => void;
  saveSnapshot: (description: string) => void;
  
  // Canvas operations
  setCanvasSize: (size: { width: number; height: number }) => void;
  setZoom: (zoom: number) => void;
  toggleGrid: () => void;
  toggleSnapToGrid: () => void;
  
  // Import/Export
  exportProject: () => string;
  importProject: (data: string) => void;
  exportElement: (id: string) => string;
  importElement: (data: string, position?: { x: number; y: number }) => string;
  
  // Preview
  generatePreview: () => Promise<string>;
  
  // Drag and drop
  startDrag: (elementId: string, startPosition: { x: number; y: number }) => void;
  updateDrag: (currentPosition: { x: number; y: number }) => void;
  endDrag: () => void;
}

export const useWYSIWYGEditor = (): UseWYSIWYGEditorReturn => {
  const [editorState, setEditorState] = useState<EditorState>({
    elements: [],
    layers: [
      {
        id: 'default',
        name: 'Layer 1',
        visible: true,
        locked: false,
        opacity: 1,
        elements: [],
        order: 0
      }
    ],
    timeline: {
      duration: 10000, // 10 seconds
      currentTime: 0,
      isPlaying: false,
      keyframes: [],
      markers: []
    },
    selectedElements: [],
    clipboard: [],
    history: [],
    historyIndex: -1,
    canvasSize: { width: 1920, height: 1080 },
    zoom: 1,
    gridEnabled: true,
    snapToGrid: true,
    gridSize: 20
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const [dragStartPosition, setDragStartPosition] = useState<{ x: number; y: number } | null>(null);
  
  const timelineInterval = useRef<NodeJS.Timeout | null>(null);
  const nextElementId = useRef(1);
  const nextLayerId = useRef(2);
  const nextAnimationId = useRef(1);
  const nextKeyframeId = useRef(1);

  type SerializedEditorElement = EditorElement & {
    createdAt: string | Date;
    updatedAt: string | Date;
  };

  type SerializedEditorSnapshot = EditorSnapshot & {
    timestamp: string | Date;
  };

  // Load saved state on mount
  useEffect(() => {
    loadEditorState();
  }, []);

  // Save state when it changes
  useEffect(() => {
    saveEditorState();
  }, [editorState]);

  const loadEditorState = () => {
    try {
      const saved = localStorage.getItem('wysiwyg_editor_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Convert date strings back to Date objects
        const processedState = {
          ...parsed,
          elements: parsed.elements.map((el: SerializedEditorElement) => ({
            ...el,
            createdAt: new Date(el.createdAt),
            updatedAt: new Date(el.updatedAt)
          })),
          history: parsed.history.map((snapshot: SerializedEditorSnapshot) => ({
            ...snapshot,
            timestamp: new Date(snapshot.timestamp)
          }))
        };
        setEditorState(processedState);
      }
    } catch (err) {
      logger.error('Error loading editor state', err as Error, { component: 'useWYSIWYGEditor' });
    }
  };

  const saveEditorState = () => {
    try {
      localStorage.setItem('wysiwyg_editor_state', JSON.stringify(editorState));
    } catch (err) {
      logger.error('Error saving editor state', err as Error, { component: 'useWYSIWYGEditor' });
    }
  };

  const generateElementId = () => `element_${nextElementId.current++}`;
  const generateLayerId = () => `layer_${nextLayerId.current++}`;
  const generateAnimationId = () => `animation_${nextAnimationId.current++}`;
  const generateKeyframeId = () => `keyframe_${nextKeyframeId.current++}`;

  const saveSnapshot = useCallback((description: string) => {
    setEditorState(prev => {
      const snapshot: EditorSnapshot = {
        id: `snapshot_${Date.now()}`,
        timestamp: new Date(),
        description,
        state: {
          elements: [...prev.elements],
          layers: [...prev.layers],
          timeline: { ...prev.timeline }
        }
      };

      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(snapshot);

      // Keep only last 50 snapshots
      const trimmedHistory = newHistory.slice(-50);

      return {
        ...prev,
        history: trimmedHistory,
        historyIndex: trimmedHistory.length - 1
      };
    });
  }, []);

  const addElement = useCallback((
    type: EditorElement['type'], 
    position: { x: number; y: number } = { x: 100, y: 100 }
  ): string => {
    const id = generateElementId();
    const now = new Date();

    const defaultSizes = {
      text: { width: 200, height: 50 },
      image: { width: 300, height: 200 },
      video: { width: 400, height: 300 },
      audio: { width: 300, height: 50 },
      shape: { width: 100, height: 100 },
      avatar: { width: 200, height: 300 },
      button: { width: 120, height: 40 },
      quiz: { width: 400, height: 300 }
    };

    const newElement: EditorElement = {
      id,
      type,
      position,
      size: defaultSizes[type],
      rotation: 0,
      opacity: 1,
      zIndex: editorState.elements.length,
      locked: false,
      visible: true,
      content: type === 'text' ? 'Texto de exemplo' : type === 'button' ? 'Botão' : undefined,
      animations: [],
      interactions: [],
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${nextElementId.current}`,
      tags: [],
      createdAt: now,
      updatedAt: now
    };

    setEditorState(prev => ({
      ...prev,
      elements: [...prev.elements, newElement],
      layers: prev.layers.map(layer => 
        layer.id === 'default' 
          ? { ...layer, elements: [...layer.elements, id] }
          : layer
      ),
      selectedElements: [id]
    }));

    saveSnapshot(`Adicionado ${type}`);
    return id;
  }, [editorState.elements.length, saveSnapshot]);

  const updateElement = useCallback((id: string, updates: Partial<EditorElement>) => {
    setEditorState(prev => ({
      ...prev,
      elements: prev.elements.map(el => 
        el.id === id 
          ? { ...el, ...updates, updatedAt: new Date() }
          : el
      )
    }));
  }, []);

  const deleteElement = useCallback((id: string) => {
    setEditorState(prev => ({
      ...prev,
      elements: prev.elements.filter(el => el.id !== id),
      layers: prev.layers.map(layer => ({
        ...layer,
        elements: layer.elements.filter(elId => elId !== id)
      })),
      selectedElements: prev.selectedElements.filter(elId => elId !== id),
      timeline: {
        ...prev.timeline,
        keyframes: prev.timeline.keyframes.filter(kf => kf.elementId !== id)
      }
    }));

    saveSnapshot(`Removido elemento`);
  }, [saveSnapshot]);

  const duplicateElement = useCallback((id: string): string => {
    const element = editorState.elements.find(el => el.id === id);
    if (!element) return '';

    const newId = generateElementId();
    const now = new Date();
    
    const duplicatedElement: EditorElement = {
      ...element,
      id: newId,
      position: {
        x: element.position.x + 20,
        y: element.position.y + 20
      },
      name: `${element.name} (cópia)`,
      createdAt: now,
      updatedAt: now
    };

    setEditorState(prev => ({
      ...prev,
      elements: [...prev.elements, duplicatedElement],
      layers: prev.layers.map(layer => 
        layer.elements.includes(id)
          ? { ...layer, elements: [...layer.elements, newId] }
          : layer
      ),
      selectedElements: [newId]
    }));

    saveSnapshot(`Duplicado elemento`);
    return newId;
  }, [editorState.elements, saveSnapshot]);

  const selectElement = useCallback((id: string, multiSelect: boolean = false) => {
    setEditorState(prev => ({
      ...prev,
      selectedElements: multiSelect 
        ? prev.selectedElements.includes(id)
          ? prev.selectedElements.filter(elId => elId !== id)
          : [...prev.selectedElements, id]
        : [id]
    }));
  }, []);

  const selectMultiple = useCallback((ids: string[]) => {
    setEditorState(prev => ({
      ...prev,
      selectedElements: ids
    }));
  }, []);

  const clearSelection = useCallback(() => {
    setEditorState(prev => ({
      ...prev,
      selectedElements: []
    }));
  }, []);

  const moveElement = useCallback((id: string, position: { x: number; y: number }) => {
    updateElement(id, { position });
  }, [updateElement]);

  const resizeElement = useCallback((id: string, size: { width: number; height: number }) => {
    updateElement(id, { size });
  }, [updateElement]);

  const rotateElement = useCallback((id: string, rotation: number) => {
    updateElement(id, { rotation });
  }, [updateElement]);

  const createLayer = useCallback((name: string): string => {
    const id = generateLayerId();
    const newLayer: Layer = {
      id,
      name,
      visible: true,
      locked: false,
      opacity: 1,
      elements: [],
      order: editorState.layers.length
    };

    setEditorState(prev => ({
      ...prev,
      layers: [...prev.layers, newLayer]
    }));

    saveSnapshot(`Criado layer: ${name}`);
    return id;
  }, [editorState.layers.length, saveSnapshot]);

  const deleteLayer = useCallback((id: string) => {
    if (id === 'default') return; // Can't delete default layer

    setEditorState(prev => {
      const layer = prev.layers.find(l => l.id === id);
      if (!layer) return prev;

      // Move elements to default layer
      const defaultLayer = prev.layers.find(l => l.id === 'default');
      if (!defaultLayer) return prev;

      return {
        ...prev,
        layers: prev.layers
          .filter(l => l.id !== id)
          .map(l => l.id === 'default' 
            ? { ...l, elements: [...l.elements, ...layer.elements] }
            : l
          )
      };
    });

    saveSnapshot(`Removido layer`);
  }, [saveSnapshot]);

  const moveElementToLayer = useCallback((elementId: string, layerId: string) => {
    setEditorState(prev => ({
      ...prev,
      layers: prev.layers.map(layer => ({
        ...layer,
        elements: layer.id === layerId
          ? [...layer.elements.filter(id => id !== elementId), elementId]
          : layer.elements.filter(id => id !== elementId)
      }))
    }));
  }, []);

  const reorderLayers = useCallback((layerIds: string[]) => {
    setEditorState(prev => ({
      ...prev,
      layers: layerIds.map((id, index) => {
        const layer = prev.layers.find(l => l.id === id);
        return layer ? { ...layer, order: index } : layer;
      }).filter(Boolean) as Layer[]
    }));
  }, []);

  const toggleLayerVisibility = useCallback((id: string) => {
    setEditorState(prev => ({
      ...prev,
      layers: prev.layers.map(layer => 
        layer.id === id ? { ...layer, visible: !layer.visible } : layer
      )
    }));
  }, []);

  const toggleLayerLock = useCallback((id: string) => {
    setEditorState(prev => ({
      ...prev,
      layers: prev.layers.map(layer => 
        layer.id === id ? { ...layer, locked: !layer.locked } : layer
      )
    }));
  }, []);

  const addAnimation = useCallback((elementId: string, animation: Omit<Animation, 'id'>): string => {
    const id = generateAnimationId();
    const newAnimation: Animation = { ...animation, id };

    updateElement(elementId, {
      animations: [
        ...(editorState.elements.find(el => el.id === elementId)?.animations || []),
        newAnimation
      ]
    });

    saveSnapshot(`Adicionada animação`);
    return id;
  }, [editorState.elements, updateElement, saveSnapshot]);

  const updateAnimation = useCallback((elementId: string, animationId: string, updates: Partial<Animation>) => {
    const element = editorState.elements.find(el => el.id === elementId);
    if (!element) return;

    updateElement(elementId, {
      animations: element.animations?.map(anim => 
        anim.id === animationId ? { ...anim, ...updates } : anim
      )
    });
  }, [editorState.elements, updateElement]);

  const removeAnimation = useCallback((elementId: string, animationId: string) => {
    const element = editorState.elements.find(el => el.id === elementId);
    if (!element) return;

    updateElement(elementId, {
      animations: element.animations?.filter(anim => anim.id !== animationId)
    });

    saveSnapshot(`Removida animação`);
  }, [editorState.elements, updateElement, saveSnapshot]);

  const addKeyframe = useCallback((elementId: string, time: number, properties: Partial<EditorElement>): string => {
    const id = generateKeyframeId();
    const newKeyframe: Keyframe = {
      id,
      time,
      elementId,
      properties,
      easing: 'ease'
    };

    setEditorState(prev => ({
      ...prev,
      timeline: {
        ...prev.timeline,
        keyframes: [...prev.timeline.keyframes, newKeyframe]
      }
    }));

    saveSnapshot(`Adicionado keyframe`);
    return id;
  }, [saveSnapshot]);

  const updateKeyframe = useCallback((keyframeId: string, updates: Partial<Keyframe>) => {
    setEditorState(prev => ({
      ...prev,
      timeline: {
        ...prev.timeline,
        keyframes: prev.timeline.keyframes.map(kf => 
          kf.id === keyframeId ? { ...kf, ...updates } : kf
        )
      }
    }));
  }, []);

  const removeKeyframe = useCallback((keyframeId: string) => {
    setEditorState(prev => ({
      ...prev,
      timeline: {
        ...prev.timeline,
        keyframes: prev.timeline.keyframes.filter(kf => kf.id !== keyframeId)
      }
    }));

    saveSnapshot(`Removido keyframe`);
  }, [saveSnapshot]);

  const play = useCallback(() => {
    setIsPlaying(true);
    setEditorState(prev => ({
      ...prev,
      timeline: { ...prev.timeline, isPlaying: true }
    }));

    timelineInterval.current = setInterval(() => {
      setEditorState(prev => {
        const newTime = prev.timeline.currentTime + 100; // 100ms increments
        
        if (newTime >= prev.timeline.duration) {
          setIsPlaying(false);
          return {
            ...prev,
            timeline: {
              ...prev.timeline,
              currentTime: 0,
              isPlaying: false
            }
          };
        }

        return {
          ...prev,
          timeline: {
            ...prev.timeline,
            currentTime: newTime
          }
        };
      });
    }, 100);
  }, []);

  const pause = useCallback(() => {
    setIsPlaying(false);
    setEditorState(prev => ({
      ...prev,
      timeline: { ...prev.timeline, isPlaying: false }
    }));

    if (timelineInterval.current) {
      clearInterval(timelineInterval.current);
      timelineInterval.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    setIsPlaying(false);
    setEditorState(prev => ({
      ...prev,
      timeline: {
        ...prev.timeline,
        currentTime: 0,
        isPlaying: false
      }
    }));

    if (timelineInterval.current) {
      clearInterval(timelineInterval.current);
      timelineInterval.current = null;
    }
  }, []);

  const seekTo = useCallback((time: number) => {
    setEditorState(prev => ({
      ...prev,
      timeline: {
        ...prev.timeline,
        currentTime: Math.max(0, Math.min(time, prev.timeline.duration))
      }
    }));
  }, []);

  const setTimelineDuration = useCallback((duration: number) => {
    setEditorState(prev => ({
      ...prev,
      timeline: {
        ...prev.timeline,
        duration: Math.max(1000, duration)
      }
    }));
  }, []);

  const copy = useCallback(() => {
    const selectedElements = editorState.elements.filter(el => 
      editorState.selectedElements.includes(el.id)
    );
    
    setEditorState(prev => ({
      ...prev,
      clipboard: selectedElements
    }));
  }, [editorState.elements, editorState.selectedElements]);

  const cut = useCallback(() => {
    copy();
    editorState.selectedElements.forEach(id => deleteElement(id));
  }, [copy, editorState.selectedElements, deleteElement]);

  const paste = useCallback((position: { x: number; y: number } = { x: 120, y: 120 }) => {
    const pastedIds: string[] = [];
    
    editorState.clipboard.forEach((element, index) => {
      const newId = generateElementId();
      const now = new Date();
      
      const pastedElement: EditorElement = {
        ...element,
        id: newId,
        position: {
          x: position.x + (index * 20),
          y: position.y + (index * 20)
        },
        name: `${element.name} (colado)`,
        createdAt: now,
        updatedAt: now
      };

      pastedIds.push(newId);
      
      setEditorState(prev => ({
        ...prev,
        elements: [...prev.elements, pastedElement],
        layers: prev.layers.map(layer => 
          layer.id === 'default'
            ? { ...layer, elements: [...layer.elements, newId] }
            : layer
        )
      }));
    });

    setEditorState(prev => ({
      ...prev,
      selectedElements: pastedIds
    }));

    saveSnapshot(`Colado ${editorState.clipboard.length} elemento(s)`);
  }, [editorState.clipboard, saveSnapshot]);

  const undo = useCallback(() => {
    if (editorState.historyIndex > 0) {
      const snapshot = editorState.history[editorState.historyIndex - 1];
      setEditorState(prev => ({
        ...prev,
        ...snapshot.state,
        historyIndex: prev.historyIndex - 1
      }));
    }
  }, [editorState.historyIndex, editorState.history]);

  const redo = useCallback(() => {
    if (editorState.historyIndex < editorState.history.length - 1) {
      const snapshot = editorState.history[editorState.historyIndex + 1];
      setEditorState(prev => ({
        ...prev,
        ...snapshot.state,
        historyIndex: prev.historyIndex + 1
      }));
    }
  }, [editorState.historyIndex, editorState.history]);

  const setCanvasSize = useCallback((size: { width: number; height: number }) => {
    setEditorState(prev => ({
      ...prev,
      canvasSize: size
    }));
  }, []);

  const setZoom = useCallback((zoom: number) => {
    setEditorState(prev => ({
      ...prev,
      zoom: Math.max(0.1, Math.min(5, zoom))
    }));
  }, []);

  const toggleGrid = useCallback(() => {
    setEditorState(prev => ({
      ...prev,
      gridEnabled: !prev.gridEnabled
    }));
  }, []);

  const toggleSnapToGrid = useCallback(() => {
    setEditorState(prev => ({
      ...prev,
      snapToGrid: !prev.snapToGrid
    }));
  }, []);

  const exportProject = useCallback((): string => {
    return JSON.stringify({
      version: '1.0',
      timestamp: new Date().toISOString(),
      editorState
    });
  }, [editorState]);

  const importProject = useCallback((data: string) => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.editorState) {
        setEditorState(parsed.editorState);
        saveSnapshot('Projeto importado');
      }
    } catch (err) {
      logger.error('Error importing project', err as Error, { component: 'useWYSIWYGEditor' });
    }
  }, [saveSnapshot]);

  const exportElement = useCallback((id: string): string => {
    const element = editorState.elements.find(el => el.id === id);
    if (!element) return '';
    
    return JSON.stringify({
      version: '1.0',
      timestamp: new Date().toISOString(),
      element
    });
  }, [editorState.elements]);

  const importElement = useCallback((data: string, position: { x: number; y: number } = { x: 100, y: 100 }): string => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.element) {
        const newId = generateElementId();
        const now = new Date();
        
        const importedElement: EditorElement = {
          ...parsed.element,
          id: newId,
          position,
          createdAt: now,
          updatedAt: now
        };

        setEditorState(prev => ({
          ...prev,
          elements: [...prev.elements, importedElement],
          layers: prev.layers.map(layer => 
            layer.id === 'default'
              ? { ...layer, elements: [...layer.elements, newId] }
              : layer
          ),
          selectedElements: [newId]
        }));

        saveSnapshot('Elemento importado');
        return newId;
      }
    } catch (err) {
      logger.error('Error importing element', err as Error, { component: 'useWYSIWYGEditor' });
    }
    return '';
  }, [saveSnapshot]);

  const generatePreview = useCallback(async (): Promise<string> => {
    // This would generate a preview image/video of the current state
    // For now, return a placeholder
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkVkaXRvciBQcmV2aWV3PC90ZXh0Pjwvc3ZnPg==';
  }, []);

  const startDrag = useCallback((elementId: string, startPosition: { x: number; y: number }) => {
    setIsDragging(true);
    setDraggedElement(elementId);
    setDragStartPosition(startPosition);
  }, []);

  const updateDrag = useCallback((currentPosition: { x: number; y: number }) => {
    if (!isDragging || !draggedElement || !dragStartPosition) return;

    const deltaX = currentPosition.x - dragStartPosition.x;
    const deltaY = currentPosition.y - dragStartPosition.y;

    const element = editorState.elements.find(el => el.id === draggedElement);
    if (!element) return;

    let newX = element.position.x + deltaX;
    let newY = element.position.y + deltaY;

    // Snap to grid if enabled
    if (editorState.snapToGrid) {
      newX = Math.round(newX / editorState.gridSize) * editorState.gridSize;
      newY = Math.round(newY / editorState.gridSize) * editorState.gridSize;
    }

    updateElement(draggedElement, {
      position: { x: newX, y: newY }
    });

    setDragStartPosition(currentPosition);
  }, [isDragging, draggedElement, dragStartPosition, editorState.elements, editorState.snapToGrid, editorState.gridSize, updateElement]);

  const endDrag = useCallback(() => {
    if (isDragging && draggedElement) {
      saveSnapshot('Elemento movido');
    }
    
    setIsDragging(false);
    setDraggedElement(null);
    setDragStartPosition(null);
  }, [isDragging, draggedElement, saveSnapshot]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timelineInterval.current) {
        clearInterval(timelineInterval.current);
      }
    };
  }, []);

  return {
    editorState,
    isPlaying,
    isDragging,
    draggedElement,
    addElement,
    updateElement,
    deleteElement,
    duplicateElement,
    selectElement,
    selectMultiple,
    clearSelection,
    moveElement,
    resizeElement,
    rotateElement,
    createLayer,
    deleteLayer,
    moveElementToLayer,
    reorderLayers,
    toggleLayerVisibility,
    toggleLayerLock,
    addAnimation,
    updateAnimation,
    removeAnimation,
    addKeyframe,
    updateKeyframe,
    removeKeyframe,
    play,
    pause,
    stop,
    seekTo,
    setTimelineDuration,
    copy,
    cut,
    paste,
    undo,
    redo,
    saveSnapshot,
    setCanvasSize,
    setZoom,
    toggleGrid,
    toggleSnapToGrid,
    exportProject,
    importProject,
    exportElement,
    importElement,
    generatePreview,
    startDrag,
    updateDrag,
    endDrag
  };
};