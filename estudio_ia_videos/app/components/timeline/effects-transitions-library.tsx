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
  Sparkles, 
  Zap, 
  Palette, 
  Volume2, 
  Eye, 
  Layers,
  Filter,
  Wand2,
  Shuffle,
  RotateCcw,
  RotateCw,
  Play,
  Pause,
  Square,
  Download,
  Upload,
  Save,
  Trash2,
  Copy,
  Settings,
  Search,
  Star,
  Heart,
  Bookmark,
  Grid3X3,
  Sliders,
  Aperture,
  Contrast,
  Sun,
  Moon,
  Droplets,
  Wind,
  Flame,
  Snowflake,
  Waves,
  Zap as Lightning,
  Sparkle,
  Focus,
  Maximize2,
  Minimize2,
  Move,
  RotateCcw as Rotate,
  Scale,
  Crop
} from 'lucide-react';

// Interfaces para efeitos e transições
type EffectParameterValue = 
  | number 
  | string 
  | boolean 
  | { x: number; y: number } 
  | number[];

interface EffectParameter {
  id: string;
  name: string;
  type: 'number' | 'color' | 'boolean' | 'select' | 'range' | 'point' | 'curve';
  value: EffectParameterValue;
  defaultValue: EffectParameterValue;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  unit?: string;
  description?: string;
}

interface Effect {
  id: string;
  name: string;
  category: 'color' | 'blur' | 'distortion' | 'stylize' | 'generate' | 'time' | 'audio' | 'composite';
  description: string;
  icon: string;
  parameters: EffectParameter[];
  presets: EffectPreset[];
  gpuAccelerated: boolean;
  realTimeCapable: boolean;
  quality: 'draft' | 'preview' | 'final';
  renderTime: number;
  memoryUsage: number;
}

interface EffectPreset {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  thumbnail?: string;
}

interface Transition {
  id: string;
  name: string;
  category: 'dissolve' | 'wipe' | 'slide' | 'zoom' | 'rotate' | '3d' | 'special';
  description: string;
  icon: string;
  duration: number;
  parameters: EffectParameter[];
  presets: EffectPreset[];
  direction?: 'in' | 'out' | 'both';
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'custom';
}

interface AppliedEffect {
  id: string;
  effectId: string;
  name: string;
  enabled: boolean;
  parameters: Record<string, unknown>;
  startTime: number;
  endTime: number;
  opacity: number;
  blendMode: string;
  maskPath?: string;
  keyframes: EffectKeyframe[];
}

interface EffectKeyframe {
  id: string;
  time: number;
  parameters: Record<string, unknown>;
  easing: string;
}

interface EffectStack {
  id: string;
  name: string;
  effects: AppliedEffect[];
  enabled: boolean;
  locked: boolean;
  visible: boolean;
}

interface RealTimeProcessor {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D | WebGLRenderingContext;
  shaders: Map<string, WebGLProgram>;
  textures: Map<string, WebGLTexture>;
  framebuffers: Map<string, WebGLFramebuffer>;
  isProcessing: boolean;
  quality: 'low' | 'medium' | 'high';
}

// Biblioteca de efeitos predefinidos
const EFFECTS_LIBRARY: Effect[] = [
  {
    id: 'gaussian_blur',
    name: 'Gaussian Blur',
    category: 'blur',
    description: 'Aplica desfoque gaussiano suave',
    icon: 'blur',
    gpuAccelerated: true,
    realTimeCapable: true,
    quality: 'preview',
    renderTime: 5,
    memoryUsage: 128,
    parameters: [
      {
        id: 'radius',
        name: 'Raio',
        type: 'range',
        value: 5,
        defaultValue: 5,
        min: 0,
        max: 100,
        step: 0.1,
        unit: 'px',
        description: 'Intensidade do desfoque'
      },
      {
        id: 'quality',
        name: 'Qualidade',
        type: 'select',
        value: 'medium',
        defaultValue: 'medium',
        options: ['low', 'medium', 'high'],
        description: 'Qualidade do processamento'
      }
    ],
    presets: [
      { id: 'subtle', name: 'Sutil', description: 'Desfoque leve', parameters: { radius: 2 } },
      { id: 'medium', name: 'Médio', description: 'Desfoque moderado', parameters: { radius: 10 } },
      { id: 'strong', name: 'Forte', description: 'Desfoque intenso', parameters: { radius: 25 } }
    ]
  },
  {
    id: 'color_correction',
    name: 'Correção de Cor',
    category: 'color',
    description: 'Ajusta cores, brilho e contraste',
    icon: 'palette',
    gpuAccelerated: true,
    realTimeCapable: true,
    quality: 'preview',
    renderTime: 3,
    memoryUsage: 64,
    parameters: [
      {
        id: 'brightness',
        name: 'Brilho',
        type: 'range',
        value: 0,
        defaultValue: 0,
        min: -100,
        max: 100,
        step: 1,
        unit: '%'
      },
      {
        id: 'contrast',
        name: 'Contraste',
        type: 'range',
        value: 0,
        defaultValue: 0,
        min: -100,
        max: 100,
        step: 1,
        unit: '%'
      },
      {
        id: 'saturation',
        name: 'Saturação',
        type: 'range',
        value: 0,
        defaultValue: 0,
        min: -100,
        max: 100,
        step: 1,
        unit: '%'
      },
      {
        id: 'hue',
        name: 'Matiz',
        type: 'range',
        value: 0,
        defaultValue: 0,
        min: -180,
        max: 180,
        step: 1,
        unit: '°'
      }
    ],
    presets: [
      { id: 'warm', name: 'Quente', description: 'Tom quente', parameters: { brightness: 10, contrast: 15, saturation: 20, hue: 10 } },
      { id: 'cool', name: 'Frio', description: 'Tom frio', parameters: { brightness: -5, contrast: 10, saturation: 15, hue: -15 } },
      { id: 'vintage', name: 'Vintage', description: 'Estilo vintage', parameters: { brightness: 5, contrast: -10, saturation: -20, hue: 5 } }
    ]
  },
  {
    id: 'chromakey',
    name: 'Chroma Key',
    category: 'composite',
    description: 'Remove cor de fundo (green screen)',
    icon: 'layers',
    gpuAccelerated: true,
    realTimeCapable: true,
    quality: 'preview',
    renderTime: 8,
    memoryUsage: 256,
    parameters: [
      {
        id: 'keyColor',
        name: 'Cor Chave',
        type: 'color',
        value: '#00ff00',
        defaultValue: '#00ff00',
        description: 'Cor a ser removida'
      },
      {
        id: 'tolerance',
        name: 'Tolerância',
        type: 'range',
        value: 10,
        defaultValue: 10,
        min: 0,
        max: 100,
        step: 1,
        unit: '%'
      },
      {
        id: 'softness',
        name: 'Suavidade',
        type: 'range',
        value: 5,
        defaultValue: 5,
        min: 0,
        max: 50,
        step: 1,
        unit: '%'
      },
      {
        id: 'spillSuppression',
        name: 'Supressão de Vazamento',
        type: 'range',
        value: 0,
        defaultValue: 0,
        min: 0,
        max: 100,
        step: 1,
        unit: '%'
      }
    ],
    presets: [
      { id: 'green', name: 'Verde', description: 'Green screen padrão', parameters: { keyColor: '#00ff00', tolerance: 15, softness: 8 } },
      { id: 'blue', name: 'Azul', description: 'Blue screen', parameters: { keyColor: '#0000ff', tolerance: 12, softness: 6 } }
    ]
  },
  {
    id: 'motion_blur',
    name: 'Motion Blur',
    category: 'blur',
    description: 'Simula desfoque de movimento',
    icon: 'wind',
    gpuAccelerated: true,
    realTimeCapable: false,
    quality: 'final',
    renderTime: 15,
    memoryUsage: 512,
    parameters: [
      {
        id: 'angle',
        name: 'Ângulo',
        type: 'range',
        value: 0,
        defaultValue: 0,
        min: 0,
        max: 360,
        step: 1,
        unit: '°'
      },
      {
        id: 'distance',
        name: 'Distância',
        type: 'range',
        value: 10,
        defaultValue: 10,
        min: 0,
        max: 100,
        step: 1,
        unit: 'px'
      },
      {
        id: 'samples',
        name: 'Amostras',
        type: 'select',
        value: 'medium',
        defaultValue: 'medium',
        options: ['low', 'medium', 'high', 'ultra']
      }
    ],
    presets: [
      { id: 'horizontal', name: 'Horizontal', description: 'Movimento horizontal', parameters: { angle: 0, distance: 15 } },
      { id: 'vertical', name: 'Vertical', description: 'Movimento vertical', parameters: { angle: 90, distance: 15 } }
    ]
  }
];

// Biblioteca de transições predefinidas
const TRANSITIONS_LIBRARY: Transition[] = [
  {
    id: 'crossfade',
    name: 'Crossfade',
    category: 'dissolve',
    description: 'Transição suave entre clipes',
    icon: 'shuffle',
    duration: 1.0,
    direction: 'both',
    easing: 'ease-in-out',
    parameters: [
      {
        id: 'curve',
        name: 'Curva',
        type: 'select',
        value: 'smooth',
        defaultValue: 'smooth',
        options: ['linear', 'smooth', 'fast', 'slow']
      }
    ],
    presets: [
      { id: 'quick', name: 'Rápido', description: '0.5s', parameters: { duration: 0.5 } },
      { id: 'normal', name: 'Normal', description: '1.0s', parameters: { duration: 1.0 } },
      { id: 'slow', name: 'Lento', description: '2.0s', parameters: { duration: 2.0 } }
    ]
  },
  {
    id: 'slide_left',
    name: 'Deslizar Esquerda',
    category: 'slide',
    description: 'Desliza da direita para esquerda',
    icon: 'move',
    duration: 1.0,
    direction: 'both',
    easing: 'ease-out',
    parameters: [
      {
        id: 'softness',
        name: 'Suavidade',
        type: 'range',
        value: 0,
        defaultValue: 0,
        min: 0,
        max: 100,
        step: 1,
        unit: '%'
      }
    ],
    presets: [
      { id: 'sharp', name: 'Nítido', description: 'Transição nítida', parameters: { softness: 0 } },
      { id: 'soft', name: 'Suave', description: 'Transição suave', parameters: { softness: 50 } }
    ]
  },
  {
    id: 'zoom_in',
    name: 'Zoom In',
    category: 'zoom',
    description: 'Aproxima com zoom',
    icon: 'maximize2',
    duration: 1.0,
    direction: 'in',
    easing: 'ease-in',
    parameters: [
      {
        id: 'scale',
        name: 'Escala',
        type: 'range',
        value: 2.0,
        defaultValue: 2.0,
        min: 1.1,
        max: 5.0,
        step: 0.1
      },
      {
        id: 'centerX',
        name: 'Centro X',
        type: 'range',
        value: 50,
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 1,
        unit: '%'
      },
      {
        id: 'centerY',
        name: 'Centro Y',
        type: 'range',
        value: 50,
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 1,
        unit: '%'
      }
    ],
    presets: [
      { id: 'center', name: 'Centro', description: 'Zoom no centro', parameters: { centerX: 50, centerY: 50 } },
      { id: 'corner', name: 'Canto', description: 'Zoom no canto', parameters: { centerX: 0, centerY: 0 } }
    ]
  }
];

export function EffectsTransitionsLibrary() {
  // Estados principais
  const [selectedTab, setSelectedTab] = useState('effects');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedEffect, setSelectedEffect] = useState<Effect | null>(null);
  const [selectedTransition, setSelectedTransition] = useState<Transition | null>(null);
  const [appliedEffects, setAppliedEffects] = useState<AppliedEffect[]>([]);
  const [effectStacks, setEffectStacks] = useState<EffectStack[]>([]);
  const [selectedStack, setSelectedStack] = useState<string>('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewEnabled, setPreviewEnabled] = useState(true);
  const [realTimeQuality, setRealTimeQuality] = useState<'low' | 'medium' | 'high'>('medium');

  // Refs para processamento em tempo real
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const processorRef = useRef<RealTimeProcessor | null>(null);

  // Filtrar efeitos e transições
  const filteredEffects = EFFECTS_LIBRARY.filter(effect => {
    const matchesSearch = effect.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         effect.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || effect.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredTransitions = TRANSITIONS_LIBRARY.filter(transition => {
    const matchesSearch = transition.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transition.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || transition.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Categorias disponíveis
  const effectCategories = ['all', ...new Set(EFFECTS_LIBRARY.map(e => e.category))];
  const transitionCategories = ['all', ...new Set(TRANSITIONS_LIBRARY.map(t => t.category))];

  // Funções de gerenciamento de efeitos
  const applyEffect = useCallback((effect: Effect, targetTime: number = 0) => {
    const appliedEffect: AppliedEffect = {
      id: `applied_${Date.now()}`,
      effectId: effect.id,
      name: effect.name,
      enabled: true,
      parameters: effect.parameters.reduce((acc, param) => ({
        ...acc,
        [param.id]: param.value
      }), {}),
      startTime: targetTime,
      endTime: targetTime + 5,
      opacity: 100,
      blendMode: 'normal',
      keyframes: []
    };

    setAppliedEffects(prev => [...prev, appliedEffect]);
  }, []);

  const removeEffect = useCallback((effectId: string) => {
    setAppliedEffects(prev => prev.filter(effect => effect.id !== effectId));
  }, []);

  const updateEffectParameter = useCallback((effectId: string, parameterId: string, value: EffectParameterValue) => {
    setAppliedEffects(prev => prev.map(effect => 
      effect.id === effectId 
        ? {
            ...effect,
            parameters: { ...effect.parameters, [parameterId]: value }
          }
        : effect
    ));
  }, []);

  // Funções de stack de efeitos
  const createEffectStack = useCallback(() => {
    const newStack: EffectStack = {
      id: `stack_${Date.now()}`,
      name: `Stack ${effectStacks.length + 1}`,
      effects: [],
      enabled: true,
      locked: false,
      visible: true
    };

    setEffectStacks(prev => [...prev, newStack]);
    setSelectedStack(newStack.id);
  }, [effectStacks.length]);

  const addToStack = useCallback((stackId: string, effect: AppliedEffect) => {
    setEffectStacks(prev => prev.map(stack => 
      stack.id === stackId 
        ? { ...stack, effects: [...stack.effects, effect] }
        : stack
    ));
  }, []);

  // Processamento em tempo real
  const initializeProcessor = useCallback(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    
    if (!gl) {
      console.warn('WebGL não suportado, usando Canvas 2D');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        processorRef.current = {
          canvas,
          context: ctx,
          shaders: new Map(),
          textures: new Map(),
          framebuffers: new Map(),
          isProcessing: false,
          quality: realTimeQuality
        };
      }
      return;
    }

    processorRef.current = {
      canvas,
      context: gl,
      shaders: new Map(),
      textures: new Map(),
      framebuffers: new Map(),
      isProcessing: false,
      quality: realTimeQuality
    };
  }, [realTimeQuality]);

  const processFrame = useCallback((inputData: ImageData) => {
    if (!processorRef.current || !previewEnabled) return inputData;

    setIsProcessing(true);

    // Simular processamento de efeitos
    const processedData = new ImageData(
      new Uint8ClampedArray(inputData.data),
      inputData.width,
      inputData.height
    );

    // Aplicar efeitos em ordem
    appliedEffects.forEach(effect => {
      if (!effect.enabled) return;

      const effectDef = EFFECTS_LIBRARY.find(e => e.id === effect.effectId);
      if (!effectDef) return;

      // Simular aplicação do efeito
      switch (effectDef.id) {
        case 'gaussian_blur':
          // Simular blur
          break;
        case 'color_correction':
          // Simular correção de cor
          break;
        // Adicionar mais efeitos conforme necessário
      }
    });

    setIsProcessing(false);
    return processedData;
  }, [appliedEffects, previewEnabled]);

  // Inicializar processador
  useEffect(() => {
    initializeProcessor();
  }, [initializeProcessor]);

  // Funções de favoritos
  const toggleFavorite = useCallback((id: string) => {
    setFavorites(prev => 
      prev.includes(id) 
        ? prev.filter(fav => fav !== id)
        : [...prev, id]
    );
  }, []);

  // Função para exportar preset
  const exportPreset = useCallback((effect: AppliedEffect) => {
    const preset = {
      name: `${effect.name} Custom`,
      description: 'Preset personalizado',
      parameters: effect.parameters
    };

    const blob = new Blob([JSON.stringify(preset, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${effect.name.replace(/\s+/g, '_')}_preset.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return (
    <div className="w-full h-full bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold">Biblioteca de Efeitos e Transições</h2>
            <Badge variant="outline" className="text-purple-400 border-purple-400">
              {appliedEffects.length} Efeitos Aplicados
            </Badge>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewEnabled(!previewEnabled)}
              className={previewEnabled ? 'bg-green-600 text-white' : 'text-gray-300 border-gray-600'}
            >
              <Eye className="w-4 h-4 mr-1" />
              Preview
            </Button>

            <Select value={realTimeQuality} onValueChange={(value) => setRealTimeQuality(value as 'low' | 'medium' | 'high')}>
              <SelectTrigger className="w-32 bg-gray-700 border-gray-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={createEffectStack}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Layers className="w-4 h-4 mr-1" />
              Novo Stack
            </Button>
          </div>
        </div>

        {/* Barra de busca e filtros */}
        <div className="mt-4 flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar efeitos e transições..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-700 border-gray-600 text-white"
            />
          </div>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48 bg-gray-700 border-gray-600">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {selectedTab === 'effects' 
                ? effectCategories.slice(1).map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))
                : transitionCategories.slice(1).map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))
              }
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Área principal */}
      <div className="flex-1 flex">
        {/* Biblioteca de efeitos/transições */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1">
            <TabsList className="grid w-full grid-cols-3 bg-gray-700">
              <TabsTrigger value="effects">Efeitos</TabsTrigger>
              <TabsTrigger value="transitions">Transições</TabsTrigger>
              <TabsTrigger value="favorites">Favoritos</TabsTrigger>
            </TabsList>

            <TabsContent value="effects" className="flex-1 p-4">
              <div className="space-y-2 max-h-full overflow-y-auto">
                {filteredEffects.map((effect) => (
                  <Card 
                    key={effect.id}
                    className={`bg-gray-700 border-gray-600 cursor-pointer transition-all hover:bg-gray-650 ${
                      selectedEffect?.id === effect.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedEffect(effect)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <h4 className="font-medium">{effect.name}</h4>
                            <p className="text-xs text-gray-400">{effect.description}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(effect.id);
                            }}
                            className={favorites.includes(effect.id) ? 'text-yellow-400' : 'text-gray-400'}
                          >
                            <Star className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              applyEffect(effect);
                            }}
                            className="text-green-400 hover:text-green-300"
                          >
                            <Zap className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center space-x-2">
                        <Badge 
                          variant="outline" 
                          className="text-xs text-blue-400 border-blue-400"
                        >
                          {effect.category}
                        </Badge>
                        
                        {effect.gpuAccelerated && (
                          <Badge variant="outline" className="text-xs text-green-400 border-green-400">
                            GPU
                          </Badge>
                        )}
                        
                        {effect.realTimeCapable && (
                          <Badge variant="outline" className="text-xs text-purple-400 border-purple-400">
                            Real-time
                          </Badge>
                        )}
                      </div>

                      {/* Presets */}
                      {effect.presets.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {effect.presets.map((preset) => (
                            <Button
                              key={preset.id}
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                const effectWithPreset = {
                                  ...effect,
                                  parameters: effect.parameters.map(param => ({
                                    ...param,
                                    value: (preset.parameters[param.id] as EffectParameterValue) ?? param.value
                                  }))
                                };
                                applyEffect(effectWithPreset);
                              }}
                              className="text-xs px-2 py-1 text-gray-300 border-gray-600 hover:bg-gray-600"
                            >
                              {preset.name}
                            </Button>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="transitions" className="flex-1 p-4">
              <div className="space-y-2 max-h-full overflow-y-auto">
                {filteredTransitions.map((transition) => (
                  <Card 
                    key={transition.id}
                    className={`bg-gray-700 border-gray-600 cursor-pointer transition-all hover:bg-gray-650 ${
                      selectedTransition?.id === transition.id ? 'ring-2 ring-purple-500' : ''
                    }`}
                    onClick={() => setSelectedTransition(transition)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-500 rounded flex items-center justify-center">
                            <Shuffle className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <h4 className="font-medium">{transition.name}</h4>
                            <p className="text-xs text-gray-400">{transition.description}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(transition.id);
                            }}
                            className={favorites.includes(transition.id) ? 'text-yellow-400' : 'text-gray-400'}
                          >
                            <Star className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center space-x-2">
                        <Badge 
                          variant="outline" 
                          className="text-xs text-green-400 border-green-400"
                        >
                          {transition.category}
                        </Badge>
                        
                        <Badge variant="outline" className="text-xs text-gray-400 border-gray-400">
                          {transition.duration}s
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="favorites" className="flex-1 p-4">
              <div className="space-y-2">
                {favorites.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    <Heart className="w-8 h-8 mx-auto mb-2" />
                    <p>Nenhum favorito ainda</p>
                    <p className="text-sm">Clique na estrela para adicionar favoritos</p>
                  </div>
                ) : (
                  favorites.map((favoriteId) => {
                    const effect = EFFECTS_LIBRARY.find(e => e.id === favoriteId);
                    const transition = TRANSITIONS_LIBRARY.find(t => t.id === favoriteId);
                    const item = effect || transition;
                    
                    if (!item) return null;

                    return (
                      <Card key={favoriteId} className="bg-gray-700 border-gray-600">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{item.name}</h4>
                              <p className="text-xs text-gray-400">{item.description}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleFavorite(favoriteId)}
                              className="text-yellow-400"
                            >
                              <Star className="w-4 h-4 fill-current" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Painel de controle de efeitos */}
        <div className="flex-1 bg-gray-900 flex flex-col">
          {/* Toolbar */}
          <div className="bg-gray-800 border-b border-gray-700 p-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold">Efeitos Aplicados</h3>
              <Badge variant="outline" className="text-blue-400 border-blue-400">
                {appliedEffects.length}
              </Badge>
            </div>

            <div className="flex items-center space-x-2">
              {isProcessing && (
                <div className="flex items-center space-x-2 text-yellow-400">
                  <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">Processando...</span>
                </div>
              )}
            </div>
          </div>

          {/* Lista de efeitos aplicados */}
          <div className="flex-1 p-4">
            {appliedEffects.length === 0 ? (
              <div className="text-center text-gray-400 py-16">
                <Wand2 className="w-12 h-12 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum efeito aplicado</h3>
                <p>Selecione um efeito da biblioteca para começar</p>
              </div>
            ) : (
              <div className="space-y-4">
                {appliedEffects.map((appliedEffect, index) => {
                  const effectDef = EFFECTS_LIBRARY.find(e => e.id === appliedEffect.effectId);
                  if (!effectDef) return null;

                  return (
                    <Card key={appliedEffect.id} className="bg-gray-800 border-gray-700">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded flex items-center justify-center text-xs font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <CardTitle className="text-sm">{appliedEffect.name}</CardTitle>
                              <p className="text-xs text-gray-400">
                                {appliedEffect.startTime.toFixed(1)}s - {appliedEffect.endTime.toFixed(1)}s
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setAppliedEffects(prev => prev.map(effect => 
                                  effect.id === appliedEffect.id 
                                    ? { ...effect, enabled: !effect.enabled }
                                    : effect
                                ));
                              }}
                              className={appliedEffect.enabled ? 'text-green-400' : 'text-gray-400'}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => exportPreset(appliedEffect)}
                              className="text-blue-400 hover:text-blue-300"
                            >
                              <Download className="w-4 h-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeEffect(appliedEffect.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3">
                        {/* Controles de parâmetros */}
                        {effectDef.parameters.map((param) => (
                          <div key={param.id} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm">{param.name}</Label>
                              {param.description && (
                                <span className="text-xs text-gray-400">{param.description}</span>
                              )}
                            </div>

                            {param.type === 'range' && (
                              <div className="space-y-1">
                                <Slider
                                  value={[Number(appliedEffect.parameters[param.id] ?? param.defaultValue)]}
                                  onValueChange={([value]) => updateEffectParameter(appliedEffect.id, param.id, value)}
                                  min={param.min}
                                  max={param.max}
                                  step={param.step}
                                  className="w-full"
                                />
                                <div className="flex justify-between text-xs text-gray-400">
                                  <span>{param.min}{param.unit}</span>
                                  <span className="font-medium">
                                    {String(appliedEffect.parameters[param.id] ?? param.defaultValue)}{param.unit}
                                  </span>
                                  <span>{param.max}{param.unit}</span>
                                </div>
                              </div>
                            )}

                            {param.type === 'color' && (
                              <Input
                                type="color"
                                value={String(appliedEffect.parameters[param.id] ?? param.defaultValue)}
                                onChange={(e) => updateEffectParameter(appliedEffect.id, param.id, e.target.value)}
                                className="w-full h-8 bg-gray-700 border-gray-600"
                              />
                            )}

                            {param.type === 'select' && (
                              <Select
                                value={String(appliedEffect.parameters[param.id] ?? param.defaultValue)}
                                onValueChange={(value) => updateEffectParameter(appliedEffect.id, param.id, value)}
                              >
                                <SelectTrigger className="bg-gray-700 border-gray-600">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {param.options?.map((option) => (
                                    <SelectItem key={option} value={option}>
                                      {option.charAt(0).toUpperCase() + option.slice(1)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}

                            {param.type === 'boolean' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateEffectParameter(
                                  appliedEffect.id, 
                                  param.id, 
                                  !Boolean(appliedEffect.parameters[param.id] ?? param.defaultValue)
                                )}
                                className={Boolean(appliedEffect.parameters[param.id] ?? param.defaultValue)
                                  ? 'bg-green-600 text-white' 
                                  : 'text-gray-300 border-gray-600'
                                }
                              >
                                {Boolean(appliedEffect.parameters[param.id] ?? param.defaultValue) ? 'ON' : 'OFF'}
                              </Button>
                            )}
                          </div>
                        ))}

                        {/* Controles de timing */}
                        <div className="border-t border-gray-700 pt-3 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Início (s)</Label>
                              <Input
                                type="number"
                                value={appliedEffect.startTime}
                                onChange={(e) => {
                                  const newStartTime = parseFloat(e.target.value) || 0;
                                  setAppliedEffects(prev => prev.map(effect => 
                                    effect.id === appliedEffect.id 
                                      ? { ...effect, startTime: newStartTime }
                                      : effect
                                  ));
                                }}
                                className="bg-gray-700 border-gray-600 text-white text-sm"
                                step="0.1"
                                min="0"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Fim (s)</Label>
                              <Input
                                type="number"
                                value={appliedEffect.endTime}
                                onChange={(e) => {
                                  const newEndTime = parseFloat(e.target.value) || 0;
                                  setAppliedEffects(prev => prev.map(effect => 
                                    effect.id === appliedEffect.id 
                                      ? { ...effect, endTime: newEndTime }
                                      : effect
                                  ));
                                }}
                                className="bg-gray-700 border-gray-600 text-white text-sm"
                                step="0.1"
                                min={appliedEffect.startTime}
                              />
                            </div>
                          </div>

                          <div>
                            <Label className="text-xs">Opacidade</Label>
                            <Slider
                              value={[appliedEffect.opacity]}
                              onValueChange={([value]) => {
                                setAppliedEffects(prev => prev.map(effect => 
                                  effect.id === appliedEffect.id 
                                    ? { ...effect, opacity: value }
                                    : effect
                                ));
                              }}
                              min={0}
                              max={100}
                              step={1}
                              className="w-full"
                            />
                            <div className="text-xs text-gray-400 text-center">{appliedEffect.opacity}%</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Preview canvas (oculto, usado para processamento) */}
        <canvas
          ref={canvasRef}
          className="hidden"
          width={1920}
          height={1080}
        />
      </div>

      {/* Status bar */}
      <div className="bg-gray-800 border-t border-gray-700 p-2 flex items-center justify-between text-sm text-gray-400">
        <div className="flex items-center space-x-4">
          <span>Efeitos: {appliedEffects.length}</span>
          <span>Stacks: {effectStacks.length}</span>
          <span>Favoritos: {favorites.length}</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>Qualidade: {realTimeQuality}</span>
          <span>Preview: {previewEnabled ? 'ON' : 'OFF'}</span>
          {isProcessing && <span className="text-yellow-400">Processando...</span>}
        </div>
      </div>
    </div>
  );
}