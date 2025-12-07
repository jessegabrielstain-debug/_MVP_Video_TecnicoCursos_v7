'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Undo2, 
  Redo2, 
  History, 
  Save, 
  RotateCcw,
  Clock,
  Layers,
  Edit,
  Trash2,
  Copy,
  Scissors,
  Move,
  Plus,
  Minus,
  Settings,
  FileText,
  Database,
  Zap,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  Archive,
  Download,
  Upload,
  Bookmark,
  Tag,
  Filter,
  Search,
  Calendar,
  User,
  MapPin,
  Target,
  Shuffle,
  RefreshCw,
  Rewind,
  FastForward,
  SkipBack,
  SkipForward,
  Play,
  Pause,
  Square,
  Eye
} from 'lucide-react';

// Interfaces para o sistema de undo/redo
interface TimelineAction {
  id: string;
  type: ActionType;
  timestamp: number;
  description: string;
  category: ActionCategory;
  data: ActionData;
  metadata: ActionMetadata;
  reversible: boolean;
  groupId?: string;
  userId?: string;
  sessionId: string;
}

type ActionType = 
  | 'add_track' | 'remove_track' | 'modify_track'
  | 'add_clip' | 'remove_clip' | 'move_clip' | 'trim_clip' | 'split_clip' | 'merge_clips'
  | 'add_effect' | 'remove_effect' | 'modify_effect' | 'reorder_effects'
  | 'add_transition' | 'remove_transition' | 'modify_transition'
  | 'add_keyframe' | 'remove_keyframe' | 'modify_keyframe'
  | 'change_timing' | 'change_speed' | 'change_volume'
  | 'import_media' | 'export_project' | 'save_project'
  | 'group_actions' | 'custom_action';

type ActionCategory = 
  | 'timeline' | 'track' | 'clip' | 'effect' | 'transition' 
  | 'keyframe' | 'audio' | 'video' | 'project' | 'system';

interface ActionData {
  before: unknown;
  after: unknown;
  target: ActionTarget;
  parameters?: Record<string, unknown>;
  affectedItems?: string[];
  dependencies?: string[];
}

interface ActionTarget {
  type: 'timeline' | 'track' | 'clip' | 'effect' | 'transition' | 'keyframe';
  id: string;
  parentId?: string;
  index?: number;
  position?: { x: number; y: number; time: number };
}

interface ActionMetadata {
  duration: number;
  complexity: 'simple' | 'medium' | 'complex';
  impact: 'low' | 'medium' | 'high';
  autoSave: boolean;
  userInitiated: boolean;
  batchOperation: boolean;
  previewable: boolean;
  tags: string[];
  notes?: string;
}

interface UndoRedoState {
  history: TimelineAction[];
  currentIndex: number;
  maxHistorySize: number;
  groupedActions: Map<string, TimelineAction[]>;
  savedStateIndex: number;
  autoSaveEnabled: boolean;
  autoSaveInterval: number;
  compressionEnabled: boolean;
  previewMode: boolean;
}

interface ActionGroup {
  id: string;
  name: string;
  description: string;
  actions: TimelineAction[];
  timestamp: number;
  duration: number;
  category: ActionCategory;
  reversible: boolean;
  compressed: boolean;
}

interface UndoRedoSettings {
  maxHistorySize: number;
  autoSaveEnabled: boolean;
  autoSaveInterval: number;
  compressionEnabled: boolean;
  compressionThreshold: number;
  previewEnabled: boolean;
  groupSimilarActions: boolean;
  persistHistory: boolean;
  showDetailedHistory: boolean;
  enableKeyboardShortcuts: boolean;
}

interface HistoryFilter {
  category?: ActionCategory;
  type?: ActionType;
  dateRange?: { start: Date; end: Date };
  userId?: string;
  searchTerm?: string;
  reversibleOnly?: boolean;
  groupedOnly?: boolean;
}

interface ActionPreview {
  action: TimelineAction;
  previewData: unknown;
  thumbnails: string[];
  description: string;
  warnings: string[];
  estimatedTime: number;
}

export function UndoRedoSystem() {
  // Estados principais
  const [undoRedoState, setUndoRedoState] = useState<UndoRedoState>({
    history: [],
    currentIndex: -1,
    maxHistorySize: 1000,
    groupedActions: new Map(),
    savedStateIndex: -1,
    autoSaveEnabled: true,
    autoSaveInterval: 30000,
    compressionEnabled: true,
    previewMode: false
  });

  const [settings, setSettings] = useState<UndoRedoSettings>({
    maxHistorySize: 1000,
    autoSaveEnabled: true,
    autoSaveInterval: 30000,
    compressionEnabled: true,
    compressionThreshold: 100,
    previewEnabled: true,
    groupSimilarActions: true,
    persistHistory: true,
    showDetailedHistory: false,
    enableKeyboardShortcuts: true
  });

  const [selectedAction, setSelectedAction] = useState<TimelineAction | null>(null);
  const [actionGroups, setActionGroups] = useState<ActionGroup[]>([]);
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<ActionPreview | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedTab, setSelectedTab] = useState('history');

  // Refs
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef(Date.now().toString());

  // Estatísticas
  const [stats, setStats] = useState({
    totalActions: 0,
    undoCount: 0,
    redoCount: 0,
    groupedActions: 0,
    compressedActions: 0,
    averageActionTime: 0,
    memoryUsage: 0,
    lastSave: null as Date | null,
    sessionDuration: 0
  });

  // Funções principais do sistema undo/redo
  const addAction = useCallback((action: Omit<TimelineAction, 'id' | 'timestamp' | 'sessionId'>) => {
    const newAction: TimelineAction = {
      ...action,
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      sessionId: sessionIdRef.current
    };

    setUndoRedoState(prev => {
      const newHistory = prev.history.slice(0, prev.currentIndex + 1);
      newHistory.push(newAction);

      // Limitar tamanho do histórico
      if (newHistory.length > prev.maxHistorySize) {
        newHistory.shift();
      }

      const newState = {
        ...prev,
        history: newHistory,
        currentIndex: newHistory.length - 1
      };

      // Agrupar ações similares se habilitado
      if (settings.groupSimilarActions) {
        groupSimilarActions(newState);
      }

      return newState;
    });

    // Atualizar estatísticas
    setStats(prev => ({
      ...prev,
      totalActions: prev.totalActions + 1,
      averageActionTime: (prev.averageActionTime * prev.totalActions + (action.metadata?.duration || 0)) / (prev.totalActions + 1)
    }));

    // Auto-save se habilitado
    if (settings.autoSaveEnabled && action.metadata.autoSave) {
      scheduleAutoSave();
    }
  }, [settings.groupSimilarActions, settings.autoSaveEnabled]);

  const undo = useCallback(() => {
    if (!canUndo()) return;

    setIsProcessing(true);

    const currentAction = undoRedoState.history[undoRedoState.currentIndex];
    
    if (!currentAction.reversible) {
      console.warn('Ação não reversível:', currentAction.description);
      setIsProcessing(false);
      return;
    }

    try {
      // Executar undo da ação
      executeUndo(currentAction);

      setUndoRedoState(prev => ({
        ...prev,
        currentIndex: prev.currentIndex - 1
      }));

      setStats(prev => ({
        ...prev,
        undoCount: prev.undoCount + 1
      }));

    } catch (error) {
      console.error('Erro ao executar undo:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [undoRedoState.history, undoRedoState.currentIndex]);

  const redo = useCallback(() => {
    if (!canRedo()) return;

    setIsProcessing(true);

    const nextAction = undoRedoState.history[undoRedoState.currentIndex + 1];

    try {
      // Executar redo da ação
      executeRedo(nextAction);

      setUndoRedoState(prev => ({
        ...prev,
        currentIndex: prev.currentIndex + 1
      }));

      setStats(prev => ({
        ...prev,
        redoCount: prev.redoCount + 1
      }));

    } catch (error) {
      console.error('Erro ao executar redo:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [undoRedoState.history, undoRedoState.currentIndex]);

  const canUndo = useCallback(() => {
    return undoRedoState.currentIndex >= 0 && 
           undoRedoState.history[undoRedoState.currentIndex]?.reversible;
  }, [undoRedoState.currentIndex, undoRedoState.history]);

  const canRedo = useCallback(() => {
    return undoRedoState.currentIndex < undoRedoState.history.length - 1;
  }, [undoRedoState.currentIndex, undoRedoState.history.length]);

  // Funções de execução de undo/redo
  const executeUndo = useCallback((action: TimelineAction) => {
    switch (action.type) {
      case 'add_track':
        // Remover track adicionada
        console.log('Undo: Removendo track', action.data.target.id);
        break;
      
      case 'remove_track':
        // Restaurar track removida
        console.log('Undo: Restaurando track', action.data.before);
        break;
      
      case 'add_clip':
        // Remover clip adicionado
        console.log('Undo: Removendo clip', action.data.target.id);
        break;
      
      case 'move_clip':
        // Restaurar posição anterior do clip
        console.log('Undo: Movendo clip para posição anterior', action.data.before);
        break;
      
      case 'add_effect':
        // Remover efeito adicionado
        console.log('Undo: Removendo efeito', action.data.target.id);
        break;
      
      case 'modify_effect':
        // Restaurar parâmetros anteriores do efeito
        console.log('Undo: Restaurando parâmetros do efeito', action.data.before);
        break;
      
      default:
        console.log('Undo genérico para:', action.type);
    }
  }, []);

  const executeRedo = useCallback((action: TimelineAction) => {
    switch (action.type) {
      case 'add_track':
        // Adicionar track novamente
        console.log('Redo: Adicionando track', action.data.after);
        break;
      
      case 'remove_track':
        // Remover track novamente
        console.log('Redo: Removendo track', action.data.target.id);
        break;
      
      case 'add_clip':
        // Adicionar clip novamente
        console.log('Redo: Adicionando clip', action.data.after);
        break;
      
      case 'move_clip':
        // Mover clip para nova posição
        console.log('Redo: Movendo clip para nova posição', action.data.after);
        break;
      
      case 'add_effect':
        // Adicionar efeito novamente
        console.log('Redo: Adicionando efeito', action.data.after);
        break;
      
      case 'modify_effect':
        // Aplicar novos parâmetros do efeito
        console.log('Redo: Aplicando novos parâmetros do efeito', action.data.after);
        break;
      
      default:
        console.log('Redo genérico para:', action.type);
    }
  }, []);

  // Funções de agrupamento
  const groupSimilarActions = useCallback((state: UndoRedoState) => {
    const recentActions = state.history.slice(-10);
    const groups = new Map<string, TimelineAction[]>();

    recentActions.forEach(action => {
      const groupKey = `${action.type}_${action.data.target.id}`;
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(action);
    });

    // Criar grupos para ações similares consecutivas
    groups.forEach((actions, key) => {
      if (actions.length > 1) {
        const groupId = `group_${Date.now()}_${key}`;
        actions.forEach(action => {
          action.groupId = groupId;
        });
      }
    });
  }, []);

  const createActionGroup = useCallback((actions: TimelineAction[], name: string, description: string) => {
    const groupId = `group_${Date.now()}`;
    const group: ActionGroup = {
      id: groupId,
      name,
      description,
      actions: actions.map(action => ({ ...action, groupId })),
      timestamp: Date.now(),
      duration: actions.reduce((sum, action) => sum + (action.metadata.duration || 0), 0),
      category: actions[0]?.category || 'system',
      reversible: actions.every(action => action.reversible),
      compressed: false
    };

    setActionGroups(prev => [...prev, group]);
    return groupId;
  }, []);

  // Funções de auto-save
  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      saveState();
    }, settings.autoSaveInterval);
  }, [settings.autoSaveInterval]);

  const saveState = useCallback(() => {
    setUndoRedoState(prev => ({
      ...prev,
      savedStateIndex: prev.currentIndex
    }));

    setStats(prev => ({
      ...prev,
      lastSave: new Date()
    }));

    // Persistir no localStorage se habilitado
    if (settings.persistHistory) {
      try {
        localStorage.setItem('timeline_history', JSON.stringify({
          history: undoRedoState.history,
          currentIndex: undoRedoState.currentIndex,
          savedStateIndex: undoRedoState.currentIndex
        }));
      } catch (error) {
        console.error('Erro ao salvar histórico:', error);
      }
    }
  }, [undoRedoState.history, undoRedoState.currentIndex, settings.persistHistory]);

  // Funções de filtro e busca
  const filteredHistory = useCallback(() => {
    let filtered = undoRedoState.history;

    if (historyFilter.category) {
      filtered = filtered.filter(action => action.category === historyFilter.category);
    }

    if (historyFilter.type) {
      filtered = filtered.filter(action => action.type === historyFilter.type);
    }

    if (historyFilter.reversibleOnly) {
      filtered = filtered.filter(action => action.reversible);
    }

    if (historyFilter.groupedOnly) {
      filtered = filtered.filter(action => action.groupId);
    }

    if (searchTerm) {
      filtered = filtered.filter(action => 
        action.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        action.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [undoRedoState.history, historyFilter, searchTerm]);

  // Funções de preview
  const previewAction = useCallback((action: TimelineAction) => {
    if (!settings.previewEnabled) return;

    const preview: ActionPreview = {
      action,
      previewData: action.data.after,
      thumbnails: [],
      description: `Preview: ${action.description}`,
      warnings: [],
      estimatedTime: action.metadata.duration || 0
    };

    // Adicionar avisos se necessário
    if (!action.reversible) {
      preview.warnings.push('Esta ação não pode ser desfeita');
    }

    if (action.metadata.impact === 'high') {
      preview.warnings.push('Esta ação terá alto impacto no projeto');
    }

    setPreviewData(preview);
  }, [settings.previewEnabled]);

  // Funções de compressão
  const compressHistory = useCallback(() => {
    if (!settings.compressionEnabled) return;

    const threshold = settings.compressionThreshold;
    if (undoRedoState.history.length < threshold) return;

    // Comprimir ações antigas mantendo apenas marcos importantes
    const importantActions = undoRedoState.history.filter((action, index) => {
      return index >= undoRedoState.history.length - threshold ||
             action.metadata.impact === 'high' ||
             action.type === 'save_project' ||
             action.groupId;
    });

    setUndoRedoState(prev => ({
      ...prev,
      history: importantActions,
      currentIndex: Math.min(prev.currentIndex, importantActions.length - 1)
    }));

    setStats(prev => ({
      ...prev,
      compressedActions: prev.compressedActions + (undoRedoState.history.length - importantActions.length)
    }));
  }, [settings.compressionEnabled, settings.compressionThreshold, undoRedoState.history]);

  // Funções utilitárias
  const clearHistory = useCallback(() => {
    setUndoRedoState(prev => ({
      ...prev,
      history: [],
      currentIndex: -1,
      savedStateIndex: -1
    }));

    setActionGroups([]);
    setStats(prev => ({
      ...prev,
      totalActions: 0,
      undoCount: 0,
      redoCount: 0
    }));
  }, []);

  const exportHistory = useCallback(() => {
    const exportData = {
      history: undoRedoState.history,
      actionGroups,
      stats,
      settings,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timeline_history_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [undoRedoState.history, actionGroups, stats, settings]);

  const importHistory = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string);
        
        setUndoRedoState(prev => ({
          ...prev,
          history: importData.history || [],
          currentIndex: importData.history?.length - 1 || -1
        }));

        setActionGroups(importData.actionGroups || []);
        
        if (importData.settings) {
          setSettings(importData.settings);
        }
      } catch (error) {
        console.error('Erro ao importar histórico:', error);
      }
    };
    reader.readAsText(file);
  }, []);

  // Atalhos de teclado
  useEffect(() => {
    if (!settings.enableKeyboardShortcuts) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            if (e.shiftKey) {
              e.preventDefault();
              redo();
            } else {
              e.preventDefault();
              undo();
            }
            break;
          case 'y':
            e.preventDefault();
            redo();
            break;
          case 's':
            e.preventDefault();
            saveState();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings.enableKeyboardShortcuts, undo, redo, saveState]);

  // Auto-save timer
  useEffect(() => {
    if (settings.autoSaveEnabled) {
      scheduleAutoSave();
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [settings.autoSaveEnabled, scheduleAutoSave]);

  // Carregar histórico persistido
  useEffect(() => {
    if (settings.persistHistory) {
      try {
        const saved = localStorage.getItem('timeline_history');
        if (saved) {
          const data = JSON.parse(saved);
          setUndoRedoState(prev => ({
            ...prev,
            history: data.history || [],
            currentIndex: data.currentIndex || -1,
            savedStateIndex: data.savedStateIndex || -1
          }));
        }
      } catch (error) {
        console.error('Erro ao carregar histórico:', error);
      }
    }
  }, [settings.persistHistory]);

  // Compressão automática
  useEffect(() => {
    if (undoRedoState.history.length > settings.compressionThreshold) {
      compressHistory();
    }
  }, [undoRedoState.history.length, settings.compressionThreshold, compressHistory]);

  // Atualizar estatísticas de memória
  useEffect(() => {
    const calculateMemoryUsage = () => {
      const historySize = JSON.stringify(undoRedoState.history).length;
      const groupsSize = JSON.stringify(actionGroups).length;
      return Math.round((historySize + groupsSize) / 1024); // KB
    };

    setStats(prev => ({
      ...prev,
      memoryUsage: calculateMemoryUsage(),
      groupedActions: actionGroups.length
    }));
  }, [undoRedoState.history, actionGroups]);

  // Função para adicionar ação de exemplo (para demonstração)
  const addExampleAction = useCallback((type: ActionType) => {
    const exampleActions: Partial<Record<ActionType, Omit<TimelineAction, 'id' | 'timestamp' | 'sessionId'>>> = {
      add_track: {
        type: 'add_track',
        description: 'Adicionar nova track de vídeo',
        category: 'track',
        data: {
          before: null,
          after: { id: 'track_1', type: 'video', name: 'Video Track 1' },
          target: { type: 'track', id: 'track_1' }
        },
        metadata: {
          duration: 150,
          complexity: 'simple',
          impact: 'medium',
          autoSave: true,
          userInitiated: true,
          batchOperation: false,
          previewable: true,
          tags: ['track', 'video']
        },
        reversible: true
      },
      add_clip: {
        type: 'add_clip',
        description: 'Adicionar clipe de vídeo',
        category: 'clip',
        data: {
          before: null,
          after: { id: 'clip_1', name: 'video.mp4', duration: 10 },
          target: { type: 'clip', id: 'clip_1', parentId: 'track_1' }
        },
        metadata: {
          duration: 200,
          complexity: 'simple',
          impact: 'low',
          autoSave: true,
          userInitiated: true,
          batchOperation: false,
          previewable: true,
          tags: ['clip', 'video']
        },
        reversible: true
      },
      add_effect: {
        type: 'add_effect',
        description: 'Adicionar efeito de blur',
        category: 'effect',
        data: {
          before: null,
          after: { id: 'effect_1', type: 'blur', intensity: 5 },
          target: { type: 'effect', id: 'effect_1', parentId: 'clip_1' }
        },
        metadata: {
          duration: 300,
          complexity: 'medium',
          impact: 'medium',
          autoSave: true,
          userInitiated: true,
          batchOperation: false,
          previewable: true,
          tags: ['effect', 'blur']
        },
        reversible: true
      }
    };

    const actionTemplate = exampleActions[type];
    if (actionTemplate) {
      addAction(actionTemplate);
    }
  }, [addAction]);

  return (
    <div className="w-full h-full bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold">Sistema Undo/Redo Avançado</h2>
            <Badge variant="outline" className="text-blue-400 border-blue-400">
              {undoRedoState.history.length} Ações
            </Badge>
            <Badge variant="outline" className="text-green-400 border-green-400">
              Posição: {undoRedoState.currentIndex + 1}
            </Badge>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              onClick={undo}
              disabled={!canUndo() || isProcessing}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600"
            >
              <Undo2 className="w-4 h-4 mr-1" />
              Undo
            </Button>

            <Button
              onClick={redo}
              disabled={!canRedo() || isProcessing}
              size="sm"
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600"
            >
              <Redo2 className="w-4 h-4 mr-1" />
              Redo
            </Button>

            <Button
              onClick={saveState}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Save className="w-4 h-4 mr-1" />
              Salvar
            </Button>

            <Button
              onClick={() => setShowSettings(!showSettings)}
              variant="outline"
              size="sm"
              className="text-gray-300 border-gray-600"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Barra de status */}
        <div className="mt-3 flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center space-x-4">
            <span>Total: {stats.totalActions}</span>
            <span>Undo: {stats.undoCount}</span>
            <span>Redo: {stats.redoCount}</span>
            <span>Memória: {stats.memoryUsage}KB</span>
          </div>
          <div className="flex items-center space-x-4">
            {stats.lastSave && (
              <span>Último save: {stats.lastSave.toLocaleTimeString()}</span>
            )}
            {isProcessing && (
              <div className="flex items-center space-x-2 text-yellow-400">
                <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                <span>Processando...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Área principal */}
      <div className="flex-1 flex">
        {/* Painel de histórico */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1">
            <TabsList className="grid w-full grid-cols-3 bg-gray-700">
              <TabsTrigger value="history">Histórico</TabsTrigger>
              <TabsTrigger value="groups">Grupos</TabsTrigger>
              <TabsTrigger value="stats">Stats</TabsTrigger>
            </TabsList>

            <TabsContent value="history" className="flex-1 p-4">
              {/* Filtros e busca */}
              <div className="space-y-3 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Buscar ações..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-700 border-gray-600 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Select 
                    value={historyFilter.category || 'all'} 
                    onValueChange={(value) => setHistoryFilter(prev => ({ 
                      ...prev, 
                      category: value === 'all' ? undefined : value as ActionCategory 
                    }))}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="timeline">Timeline</SelectItem>
                      <SelectItem value="track">Track</SelectItem>
                      <SelectItem value="clip">Clip</SelectItem>
                      <SelectItem value="effect">Efeito</SelectItem>
                      <SelectItem value="transition">Transição</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setHistoryFilter(prev => ({ 
                      ...prev, 
                      reversibleOnly: !prev.reversibleOnly 
                    }))}
                    className={historyFilter.reversibleOnly 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-300 border-gray-600'
                    }
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Reversível
                  </Button>
                </div>
              </div>

              {/* Lista de ações */}
              <div className="space-y-2 max-h-full overflow-y-auto">
                {filteredHistory().map((action, index) => (
                  <Card 
                    key={action.id}
                    className={`bg-gray-700 border-gray-600 cursor-pointer transition-all hover:bg-gray-650 ${
                      selectedAction?.id === action.id ? 'ring-2 ring-blue-500' : ''
                    } ${
                      index === undoRedoState.currentIndex ? 'border-green-500' : ''
                    }`}
                    onClick={() => setSelectedAction(action)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                            action.category === 'timeline' ? 'bg-blue-500' :
                            action.category === 'track' ? 'bg-green-500' :
                            action.category === 'clip' ? 'bg-yellow-500' :
                            action.category === 'effect' ? 'bg-purple-500' :
                            action.category === 'transition' ? 'bg-pink-500' :
                            'bg-gray-500'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-medium text-sm">{action.description}</h4>
                            <p className="text-xs text-gray-400">
                              {new Date(action.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          {action.groupId && (
                            <Badge variant="outline" className="text-xs text-blue-400 border-blue-400">
                              Grupo
                            </Badge>
                          )}
                          
                          {!action.reversible && (
                            <Badge variant="outline" className="text-xs text-red-400 border-red-400">
                              Irreversível
                            </Badge>
                          )}
                          
                          {action.metadata.impact === 'high' && (
                            <AlertCircle className="w-4 h-4 text-orange-400" />
                          )}
                        </div>
                      </div>

                      <div className="mt-2 flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs text-gray-400 border-gray-500">
                          {action.type.replace('_', ' ')}
                        </Badge>
                        
                        <Badge variant="outline" className="text-xs text-gray-400 border-gray-500">
                          {action.metadata.duration}ms
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="groups" className="flex-1 p-4">
              <div className="space-y-2">
                {actionGroups.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    <Layers className="w-8 h-8 mx-auto mb-2" />
                    <p>Nenhum grupo criado</p>
                  </div>
                ) : (
                  actionGroups.map((group) => (
                    <Card key={group.id} className="bg-gray-700 border-gray-600">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{group.name}</h4>
                            <p className="text-xs text-gray-400">{group.description}</p>
                            <p className="text-xs text-gray-400">
                              {group.actions.length} ações • {group.duration}ms
                            </p>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              group.reversible 
                                ? 'text-green-400 border-green-400' 
                                : 'text-red-400 border-red-400'
                            }`}
                          >
                            {group.reversible ? 'Reversível' : 'Irreversível'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="stats" className="flex-1 p-4">
              <div className="space-y-4">
                <Card className="bg-gray-700 border-gray-600">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Estatísticas Gerais</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Total de ações:</span>
                      <span className="text-sm font-medium">{stats.totalActions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Operações Undo:</span>
                      <span className="text-sm font-medium">{stats.undoCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Operações Redo:</span>
                      <span className="text-sm font-medium">{stats.redoCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Grupos criados:</span>
                      <span className="text-sm font-medium">{stats.groupedActions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Ações comprimidas:</span>
                      <span className="text-sm font-medium">{stats.compressedActions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Tempo médio:</span>
                      <span className="text-sm font-medium">{stats.averageActionTime.toFixed(1)}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Uso de memória:</span>
                      <span className="text-sm font-medium">{stats.memoryUsage}KB</span>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-2">
                  <Button
                    onClick={exportHistory}
                    size="sm"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar Histórico
                  </Button>

                  <Button
                    onClick={clearHistory}
                    size="sm"
                    variant="outline"
                    className="w-full text-red-400 border-red-400 hover:bg-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Limpar Histórico
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Painel de detalhes */}
        <div className="flex-1 bg-gray-900 flex flex-col">
          {/* Toolbar de demonstração */}
          <div className="bg-gray-800 border-b border-gray-700 p-4">
            <h3 className="font-semibold mb-3">Demonstração - Adicionar Ações</h3>
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => addExampleAction('add_track')}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                Track
              </Button>

              <Button
                onClick={() => addExampleAction('add_clip')}
                size="sm"
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                Clip
              </Button>

              <Button
                onClick={() => addExampleAction('add_effect')}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                Efeito
              </Button>
            </div>
          </div>

          {/* Detalhes da ação selecionada */}
          <div className="flex-1 p-4">
            {selectedAction ? (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span>Detalhes da Ação</span>
                    <Badge variant="outline" className="text-blue-400 border-blue-400">
                      {selectedAction.type}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Descrição</Label>
                    <p className="text-sm text-gray-300">{selectedAction.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Categoria</Label>
                      <p className="text-sm text-gray-300">{selectedAction.category}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Timestamp</Label>
                      <p className="text-sm text-gray-300">
                        {new Date(selectedAction.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Duração</Label>
                      <p className="text-sm text-gray-300">{selectedAction.metadata.duration}ms</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Complexidade</Label>
                      <p className="text-sm text-gray-300">{selectedAction.metadata.complexity}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Impacto</Label>
                      <p className="text-sm text-gray-300">{selectedAction.metadata.impact}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Reversível</Label>
                      <p className={`text-sm ${selectedAction.reversible ? 'text-green-400' : 'text-red-400'}`}>
                        {selectedAction.reversible ? 'Sim' : 'Não'}
                      </p>
                    </div>
                  </div>

                  {selectedAction.metadata.tags.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Tags</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedAction.metadata.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs text-gray-400 border-gray-500">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <Label className="text-sm font-medium">Dados da Ação</Label>
                    <div className="bg-gray-700 rounded p-3 mt-1">
                      <pre className="text-xs text-gray-300 overflow-auto">
                        {JSON.stringify(selectedAction.data, null, 2)}
                      </pre>
                    </div>
                  </div>

                  {settings.previewEnabled && (
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => previewAction(selectedAction)}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Preview
                      </Button>

                      {selectedAction.reversible && (
                        <Button
                          onClick={() => {
                            // Simular execução da ação
                            console.log('Executando ação:', selectedAction.description);
                          }}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Executar
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="text-center text-gray-400 py-16">
                <History className="w-12 h-12 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Selecione uma ação</h3>
                <p>Clique em uma ação no histórico para ver os detalhes</p>
              </div>
            )}
          </div>
        </div>

        {/* Painel de configurações (condicional) */}
        {showSettings && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Configurações</h3>
              <Button
                onClick={() => setShowSettings(false)}
                variant="ghost"
                size="sm"
                className="text-gray-400"
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm">Tamanho máximo do histórico</Label>
                <Slider
                  value={[settings.maxHistorySize]}
                  onValueChange={([value]) => setSettings(prev => ({ ...prev, maxHistorySize: value }))}
                  min={100}
                  max={5000}
                  step={100}
                  className="mt-2"
                />
                <div className="text-xs text-gray-400 text-center mt-1">{settings.maxHistorySize} ações</div>
              </div>

              <div>
                <Label className="text-sm">Intervalo de auto-save (ms)</Label>
                <Slider
                  value={[settings.autoSaveInterval]}
                  onValueChange={([value]) => setSettings(prev => ({ ...prev, autoSaveInterval: value }))}
                  min={5000}
                  max={300000}
                  step={5000}
                  className="mt-2"
                />
                <div className="text-xs text-gray-400 text-center mt-1">{settings.autoSaveInterval / 1000}s</div>
              </div>

              <div>
                <Label className="text-sm">Limite para compressão</Label>
                <Slider
                  value={[settings.compressionThreshold]}
                  onValueChange={([value]) => setSettings(prev => ({ ...prev, compressionThreshold: value }))}
                  min={50}
                  max={1000}
                  step={50}
                  className="mt-2"
                />
                <div className="text-xs text-gray-400 text-center mt-1">{settings.compressionThreshold} ações</div>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={() => setSettings(prev => ({ ...prev, autoSaveEnabled: !prev.autoSaveEnabled }))}
                  variant="outline"
                  size="sm"
                  className={`w-full ${settings.autoSaveEnabled 
                    ? 'bg-green-600 text-white' 
                    : 'text-gray-300 border-gray-600'
                  }`}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Auto-save: {settings.autoSaveEnabled ? 'ON' : 'OFF'}
                </Button>

                <Button
                  onClick={() => setSettings(prev => ({ ...prev, compressionEnabled: !prev.compressionEnabled }))}
                  variant="outline"
                  size="sm"
                  className={`w-full ${settings.compressionEnabled 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 border-gray-600'
                  }`}
                >
                  <Archive className="w-4 h-4 mr-2" />
                  Compressão: {settings.compressionEnabled ? 'ON' : 'OFF'}
                </Button>

                <Button
                  onClick={() => setSettings(prev => ({ ...prev, previewEnabled: !prev.previewEnabled }))}
                  variant="outline"
                  size="sm"
                  className={`w-full ${settings.previewEnabled 
                    ? 'bg-purple-600 text-white' 
                    : 'text-gray-300 border-gray-600'
                  }`}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview: {settings.previewEnabled ? 'ON' : 'OFF'}
                </Button>

                <Button
                  onClick={() => setSettings(prev => ({ ...prev, groupSimilarActions: !prev.groupSimilarActions }))}
                  variant="outline"
                  size="sm"
                  className={`w-full ${settings.groupSimilarActions 
                    ? 'bg-yellow-600 text-white' 
                    : 'text-gray-300 border-gray-600'
                  }`}
                >
                  <Layers className="w-4 h-4 mr-2" />
                  Agrupar: {settings.groupSimilarActions ? 'ON' : 'OFF'}
                </Button>

                <Button
                  onClick={() => setSettings(prev => ({ ...prev, persistHistory: !prev.persistHistory }))}
                  variant="outline"
                  size="sm"
                  className={`w-full ${settings.persistHistory 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-gray-300 border-gray-600'
                  }`}
                >
                  <Database className="w-4 h-4 mr-2" />
                  Persistir: {settings.persistHistory ? 'ON' : 'OFF'}
                </Button>

                <Button
                  onClick={() => setSettings(prev => ({ ...prev, enableKeyboardShortcuts: !prev.enableKeyboardShortcuts }))}
                  variant="outline"
                  size="sm"
                  className={`w-full ${settings.enableKeyboardShortcuts 
                    ? 'bg-teal-600 text-white' 
                    : 'text-gray-300 border-gray-600'
                  }`}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Atalhos: {settings.enableKeyboardShortcuts ? 'ON' : 'OFF'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="bg-gray-800 border-t border-gray-700 p-2 flex items-center justify-between text-sm text-gray-400">
        <div className="flex items-center space-x-4">
          <span>Histórico: {undoRedoState.history.length}/{settings.maxHistorySize}</span>
          <span>Posição: {undoRedoState.currentIndex + 1}</span>
          <span>Grupos: {actionGroups.length}</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>Auto-save: {settings.autoSaveEnabled ? 'ON' : 'OFF'}</span>
          <span>Compressão: {settings.compressionEnabled ? 'ON' : 'OFF'}</span>
          {isProcessing && <span className="text-yellow-400">Processando...</span>}
        </div>
      </div>
    </div>
  );
}