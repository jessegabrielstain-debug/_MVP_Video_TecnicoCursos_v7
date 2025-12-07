
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Play, 
  Pause, 
  Square,
  RotateCcw,
  RotateCw,
  Move,
  Scale,
  Eye,
  EyeOff,
  Palette,
  Layers,
  Sparkles,
  Zap,
  Target,
  Wand2,
  MousePointer,
  Move3D,
  Box,
  Circle,
  Triangle,
  Type,
  Image,
  Film,
  Download,
  Upload,
  Copy,
  Trash2,
  Grid,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Tipos para Motion Graphics
type MotionProperty = 'x' | 'y' | 'scale' | 'rotation' | 'opacity';

interface MotionElement {
  id: string;
  type: 'shape' | 'text' | 'image' | 'video' | 'particle' | 'path';
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  scale: number;
  color: string;
  visible: boolean;
  locked: boolean;
  animations: MotionAnimation[];
  properties: Record<string, unknown>;
}

interface MotionAnimation {
  id: string;
  property: MotionProperty;
  startTime: number;
  duration: number;
  fromValue: number;
  toValue: number;
  easing: string;
  loop: boolean;
}

interface MotionPreset {
  id: string;
  name: string;
  category: 'entrance' | 'emphasis' | 'exit' | 'path' | 'custom';
  thumbnail: string;
  description: string;
  animations: Partial<MotionAnimation>[];
}

const MOTION_PRESETS: MotionPreset[] = [
  {
    id: 'fadeIn',
    name: 'Fade In',
    category: 'entrance',
    thumbnail: '🌅',
    description: 'Aparece gradualmente',
    animations: [
      { property: 'opacity', fromValue: 0, toValue: 1, duration: 1, easing: 'ease-out' }
    ]
  },
  {
    id: 'slideInLeft',
    name: 'Slide In Left',
    category: 'entrance',
    thumbnail: '⬅️',
    description: 'Desliza da esquerda',
    animations: [
      { property: 'x', fromValue: -100, toValue: 0, duration: 0.8, easing: 'ease-out' }
    ]
  },
  {
    id: 'bounceIn',
    name: 'Bounce In',
    category: 'entrance',
    thumbnail: '🏀',
    description: 'Entrada com bounce',
    animations: [
      { property: 'scale', fromValue: 0, toValue: 1, duration: 1, easing: 'bounce' }
    ]
  },
  {
    id: 'pulse',
    name: 'Pulse',
    category: 'emphasis',
    thumbnail: '💓',
    description: 'Pulsa continuamente',
    animations: [
      { property: 'scale', fromValue: 1, toValue: 1.1, duration: 0.5, easing: 'ease-in-out', loop: true }
    ]
  },
  {
    id: 'rotate',
    name: 'Rotate',
    category: 'emphasis',
    thumbnail: '🔄',
    description: 'Rotação contínua',
    animations: [
      { property: 'rotation', fromValue: 0, toValue: 360, duration: 2, easing: 'linear', loop: true }
    ]
  },
  {
    id: 'zoomOut',
    name: 'Zoom Out',
    category: 'exit',
    thumbnail: '📤',
    description: 'Aumenta e desaparece',
    animations: [
      { property: 'scale', fromValue: 1, toValue: 2, duration: 0.8, easing: 'ease-in' },
      { property: 'opacity', fromValue: 1, toValue: 0, duration: 0.8, easing: 'ease-in' }
    ]
  }
];

export default function MotionGraphicsEngine() {
  // Estados principais
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(10);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [canvasSize, setCanvasSize] = useState({ width: 1920, height: 1080 });

  // Motion Elements
  const [motionElements, setMotionElements] = useState<MotionElement[]>([
    {
      id: 'title1',
      type: 'text',
      name: 'Título Principal',
      x: 400,
      y: 200,
      width: 600,
      height: 100,
      rotation: 0,
      opacity: 100,
      scale: 1,
      color: '#3b82f6',
      visible: true,
      locked: false,
      properties: {
        text: 'Segurança no Trabalho',
        fontSize: 48,
        fontWeight: 'bold',
        fontFamily: 'Inter'
      },
      animations: [
        {
          id: 'anim1',
          property: 'opacity',
          startTime: 0,
          duration: 1,
          fromValue: 0,
          toValue: 100,
          easing: 'ease-out',
          loop: false
        },
        {
          id: 'anim2',
          property: 'y',
          startTime: 0,
          duration: 1,
          fromValue: 150,
          toValue: 200,
          easing: 'ease-out',
          loop: false
        }
      ]
    },
    {
      id: 'logo1',
      type: 'image',
      name: 'Logo Empresa',
      x: 100,
      y: 50,
      width: 150,
      height: 150,
      rotation: 0,
      opacity: 90,
      scale: 1,
      color: '#ffffff',
      visible: true,
      locked: false,
      properties: {
        src: '/api/placeholder/150/150',
        alt: 'Logo da Empresa'
      },
      animations: [
        {
          id: 'anim3',
          property: 'scale',
          startTime: 0.5,
          duration: 0.8,
          fromValue: 0,
          toValue: 1,
          easing: 'bounce',
          loop: false
        }
      ]
    },
    {
      id: 'shape1',
      type: 'shape',
      name: 'Círculo Decorativo',
      x: 1500,
      y: 300,
      width: 200,
      height: 200,
      rotation: 0,
      opacity: 60,
      scale: 1,
      color: '#10b981',
      visible: true,
      locked: false,
      properties: {
        shapeType: 'circle',
        borderWidth: 4,
        borderColor: '#10b981'
      },
      animations: [
        {
          id: 'anim4',
          property: 'rotation',
          startTime: 1,
          duration: 8,
          fromValue: 0,
          toValue: 360,
          easing: 'linear',
          loop: true
        }
      ]
    }
  ]);

  // IA Analytics para motion graphics
  const [motionAnalytics, setMotionAnalytics] = useState({
    totalElements: motionElements.length,
    activeAnimations: motionElements.reduce((acc, el) => acc + el.animations.length, 0),
    performance: 9.1,
    smoothness: 8.8,
    engagement: 9.4,
    suggestions: [
      'Adicione entrada suave para o texto secundário',
      'Considere usar motion blur nos elementos rápidos',
      'Sincronize animações com batida da música de fundo'
    ]
  });

  // Canvas reference
  const canvasRef = useRef<HTMLDivElement>(null);

  // Convert canvas coordinates
  const getElementStyle = (element: MotionElement): React.CSSProperties => {
    const currentValue = getCurrentAnimatedValue(element);
    
    return {
      position: 'absolute',
      left: `${currentValue.x}px`,
      top: `${currentValue.y}px`,
      width: `${element.width * currentValue.scale}px`,
      height: `${element.height * currentValue.scale}px`,
      opacity: currentValue.opacity / 100,
      transform: `rotate(${currentValue.rotation}deg)`,
      backgroundColor: element.type === 'shape' ? element.color : undefined,
      border: element.type === 'shape' ? `${(element.properties?.borderWidth as number) || 0}px solid ${(element.properties?.borderColor as string) || element.color}` : undefined,
      borderRadius: element.type === 'shape' && element.properties?.shapeType === 'circle' ? '50%' : undefined,
      display: element.visible ? 'block' : 'none',
      zIndex: element.type === 'text' ? 10 : 1,
      color: element.type === 'text' ? element.color : undefined,
      fontSize: element.type === 'text' ? `${(element.properties?.fontSize as number) || 16}px` : undefined,
      fontWeight: element.type === 'text' ? (element.properties?.fontWeight as string) || 'normal' : undefined,
      fontFamily: element.type === 'text' ? (element.properties?.fontFamily as string) || 'Inter' : undefined,
      pointerEvents: selectedElements.includes(element.id) ? 'auto' : 'none'
    };
  };

  // Get current animated value
  const getCurrentAnimatedValue = (element: MotionElement) => {
    const result: Record<MotionProperty, number> = {
      x: element.x,
      y: element.y,
      scale: element.scale,
      rotation: element.rotation,
      opacity: element.opacity
    };

    element.animations.forEach(animation => {
      if (currentTime >= animation.startTime && 
          currentTime <= animation.startTime + animation.duration) {
        
        const progress = (currentTime - animation.startTime) / animation.duration;
        const easedProgress = applyEasing(progress, animation.easing);
        
        const from = animation.fromValue;
        const to = animation.toValue;
        const currentValue = from + (to - from) * easedProgress;

        result[animation.property] = currentValue;
      }
    });

    return result;
  };

  // Apply easing function
  const applyEasing = (t: number, easing: string): number => {
    switch (easing) {
      case 'linear': return t;
      case 'ease-in': return t * t;
      case 'ease-out': return 1 - Math.pow(1 - t, 2);
      case 'ease-in-out': return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      case 'bounce': return 1 - Math.pow(1 - t, 2) * Math.cos(t * Math.PI * 7);
      default: return t;
    }
  };

  // Playback control
  const handlePlay = () => setIsPlaying(!isPlaying);
  const handleStop = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // Auto-play simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && currentTime < totalDuration) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 0.1;
          if (newTime >= totalDuration) {
            setIsPlaying(false);
            return 0; // Loop
          }
          return newTime;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentTime, totalDuration]);

  // Add new element
  const addElement = (type: MotionElement['type']) => {
    const newElement: MotionElement = {
      id: `element_${Date.now()}`,
      type,
      name: `Novo ${type}`,
      x: 400,
      y: 300,
      width: type === 'text' ? 300 : 100,
      height: type === 'text' ? 50 : 100,
      rotation: 0,
      opacity: 100,
      scale: 1,
      color: '#3b82f6',
      visible: true,
      locked: false,
      properties: type === 'text' ? {
        text: 'Novo Texto',
        fontSize: 24,
        fontWeight: 'normal',
        fontFamily: 'Inter'
      } : type === 'shape' ? {
        shapeType: 'rectangle'
      } : {},
      animations: []
    };

    setMotionElements(prev => [...prev, newElement]);
    setSelectedElements([newElement.id]);
  };

  // Apply preset animation
  const applyPreset = (elementId: string, preset: MotionPreset) => {
    setMotionElements(prev => prev.map(element => {
      if (element.id === elementId) {
        const newAnimations = preset.animations.map((anim, index) => ({
          id: `preset_${Date.now()}_${index}`,
          property: anim.property || 'opacity',
          startTime: anim.startTime || 0,
          duration: anim.duration || 1,
          fromValue: anim.fromValue || 0,
          toValue: anim.toValue || 1,
          easing: anim.easing || 'ease-out',
          loop: anim.loop || false
        }));

        return {
          ...element,
          animations: [...element.animations, ...newAnimations]
        };
      }
      return element;
    }));
  };

  // Update element property
  const updateElementProperty = (elementId: string, property: string, value: unknown) => {
    setMotionElements(prev => prev.map(element => {
      if (element.id === elementId) {
        if (property.startsWith('properties.')) {
          const prop = property.replace('properties.', '');
          return {
            ...element,
            properties: { ...element.properties, [prop]: value }
          };
        }
        return { ...element, [property]: value };
      }
      return element;
    }));
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 to-purple-500 bg-clip-text text-transparent">
              Motion Graphics Engine
            </h1>
            <p className="text-gray-400">
              Sistema avançado de animações e gráficos em movimento
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="bg-pink-500/10 text-pink-400 border-pink-500/30">
              <Layers className="mr-1 h-3 w-3" />
              {motionAnalytics.totalElements} Elementos
            </Badge>
            <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
              <Zap className="mr-1 h-3 w-3" />
              {motionAnalytics.activeAnimations} Animações
            </Badge>
            <Button variant="outline" size="sm">
              <Upload className="mr-2 h-4 w-4" />
              Importar
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Performance</p>
                  <p className="text-lg font-bold text-green-400">{motionAnalytics.performance}/10</p>
                </div>
                <Target className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Suavidade</p>
                  <p className="text-lg font-bold text-blue-400">{motionAnalytics.smoothness}/10</p>
                </div>
                <Zap className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Engajamento</p>
                  <p className="text-lg font-bold text-purple-400">{motionAnalytics.engagement}/10</p>
                </div>
                <Sparkles className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Zoom</p>
                  <p className="text-lg font-bold text-yellow-400">{zoomLevel}%</p>
                </div>
                <Grid className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-center space-x-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleStop}
          >
            <Square className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="lg"
            onClick={handlePlay}
            className={isPlaying ? 'text-red-400' : 'text-green-400'}
          >
            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
          </Button>
          
          <div className="text-lg font-mono px-4 py-2 bg-gray-800 rounded">
            {currentTime.toFixed(1)}s / {totalDuration}s
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-350px)]">
        {/* Main Canvas */}
        <div className="col-span-8">
          <Card className="bg-gray-900 border-gray-800 h-full overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Canvas de Animação</CardTitle>
                
                <div className="flex items-center space-x-3">
                  <Select value={canvasSize.width + 'x' + canvasSize.height} onValueChange={(value) => {
                    const [width, height] = value.split('x').map(Number);
                    setCanvasSize({ width, height });
                  }}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1920x1080">Full HD</SelectItem>
                      <SelectItem value="1280x720">HD</SelectItem>
                      <SelectItem value="3840x2160">4K</SelectItem>
                      <SelectItem value="1080x1920">Vertical</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setZoomLevel(Math.max(25, zoomLevel - 25))}
                    >
                      <Minimize2 className="h-4 w-4" />
                    </Button>
                    <span className="text-sm w-12 text-center">{zoomLevel}%</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setZoomLevel(Math.min(200, zoomLevel + 25))}
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              <div className="relative bg-gray-950 overflow-auto" style={{ height: '500px' }}>
                {/* Canvas */}
                <div
                  ref={canvasRef}
                  className="relative bg-gray-800 border-2 border-dashed border-gray-600 mx-auto"
                  style={{
                    width: `${canvasSize.width * (zoomLevel / 100)}px`,
                    height: `${canvasSize.height * (zoomLevel / 100)}px`,
                    transform: `scale(${zoomLevel / 100})`,
                    transformOrigin: 'top left'
                  }}
                >
                  {/* Grid */}
                  <div className="absolute inset-0 opacity-20">
                    <svg width="100%" height="100%">
                      <defs>
                        <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                          <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#374151" strokeWidth="1"/>
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                  </div>

                  {/* Motion Elements */}
                  <AnimatePresence>
                    {motionElements.map(element => (
                      <motion.div
                        key={element.id}
                        style={getElementStyle(element)}
                        className={`cursor-pointer border-2 transition-all duration-200 ${
                          selectedElements.includes(element.id) 
                            ? 'border-blue-400 shadow-lg' 
                            : 'border-transparent hover:border-gray-400'
                        }`}
                        onClick={() => {
                          if (selectedElements.includes(element.id)) {
                            setSelectedElements(prev => prev.filter(id => id !== element.id));
                          } else {
                            setSelectedElements([element.id]);
                          }
                        }}
                        animate={{
                          scale: selectedElements.includes(element.id) ? 1.02 : 1
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        {element.type === 'text' && (
                          <div className="w-full h-full flex items-center justify-center">
                            {(element.properties?.text as string) || 'Texto'}
                          </div>
                        )}
                        
                        {element.type === 'image' && (
                          <img 
                            src={(element.properties?.src as string) || '/api/placeholder/100/100'} 
                            alt={(element.properties?.alt as string) || 'Imagem'}
                            className="w-full h-full object-cover rounded"
                          />
                        )}

                        {element.type === 'shape' && element.properties?.shapeType === 'rectangle' && (
                          <div className="w-full h-full" />
                        )}

                        {/* Element controls */}
                        {selectedElements.includes(element.id) && (
                          <div className="absolute -top-8 left-0 flex space-x-1 bg-gray-900 px-2 py-1 rounded text-xs">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 w-5 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateElementProperty(element.id, 'visible', !element.visible);
                              }}
                            >
                              {element.visible ? <Eye className="h-2 w-2" /> : <EyeOff className="h-2 w-2" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 w-5 p-0 text-red-400"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMotionElements(prev => prev.filter(el => el.id !== element.id));
                                setSelectedElements(prev => prev.filter(id => id !== element.id));
                              }}
                            >
                              <Trash2 className="h-2 w-2" />
                            </Button>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar - Tools & Properties */}
        <div className="col-span-4 space-y-4">
          <Tabs defaultValue="elements">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="elements">Elementos</TabsTrigger>
              <TabsTrigger value="animations">Animações</TabsTrigger>
              <TabsTrigger value="presets">Presets</TabsTrigger>
            </TabsList>

            <TabsContent value="elements">
              <div className="space-y-4">
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-sm">Adicionar Elemento</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Button size="sm" onClick={() => addElement('text')}>
                        <Type className="mr-2 h-3 w-3" />
                        Texto
                      </Button>
                      <Button size="sm" onClick={() => addElement('shape')}>
                        <Box className="mr-2 h-3 w-3" />
                        Forma
                      </Button>
                      <Button size="sm" onClick={() => addElement('image')}>
                        <Image className="mr-2 h-3 w-3" />
                        Imagem
                      </Button>
                      <Button size="sm" onClick={() => addElement('video')}>
                        <Film className="mr-2 h-3 w-3" />
                        Vídeo
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-sm">Propriedades</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedElements.length > 0 ? (
                      <>
                        {selectedElements.map(elementId => {
                          const element = motionElements.find(el => el.id === elementId);
                          if (!element) return null;

                          return (
                            <div key={elementId} className="space-y-3 pb-3 border-b border-gray-800 last:border-0">
                              <h4 className="font-medium text-sm">{element.name}</h4>
                              
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-xs text-gray-400">X</label>
                                  <Slider
                                    value={[element.x]}
                                    onValueChange={([value]) => updateElementProperty(element.id, 'x', value)}
                                    max={canvasSize.width}
                                    step={1}
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-gray-400">Y</label>
                                  <Slider
                                    value={[element.y]}
                                    onValueChange={([value]) => updateElementProperty(element.id, 'y', value)}
                                    max={canvasSize.height}
                                    step={1}
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="text-xs text-gray-400">Opacidade</label>
                                <Slider
                                  value={[element.opacity]}
                                  onValueChange={([value]) => updateElementProperty(element.id, 'opacity', value)}
                                  max={100}
                                  step={1}
                                />
                              </div>

                              <div>
                                <label className="text-xs text-gray-400">Rotação</label>
                                <Slider
                                  value={[element.rotation]}
                                  onValueChange={([value]) => updateElementProperty(element.id, 'rotation', value)}
                                  min={-180}
                                  max={180}
                                  step={1}
                                />
                              </div>

                              {element.type === 'text' && (
                                <div>
                                  <label className="text-xs text-gray-400">Tamanho Fonte</label>
                                  <Slider
                                    value={[(element.properties?.fontSize as number) || 16]}
                                    onValueChange={([value]) => updateElementProperty(element.id, 'properties.fontSize', value)}
                                    min={8}
                                    max={72}
                                    step={1}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </>
                    ) : (
                      <p className="text-sm text-gray-400">
                        Selecione um elemento para editar
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="animations">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-sm">Animações do Elemento</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedElements.length > 0 ? (
                    <div className="space-y-3">
                      {selectedElements.map(elementId => {
                        const element = motionElements.find(el => el.id === elementId);
                        if (!element) return null;

                        return (
                          <div key={elementId} className="space-y-2">
                            <h4 className="font-medium text-sm">{element.name}</h4>
                            <div className="space-y-2">
                              {element.animations.map(animation => (
                                <div key={animation.id} className="bg-gray-800 p-2 rounded text-xs">
                                  <div className="flex justify-between items-center">
                                    <span className="capitalize">{animation.property}</span>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-4 w-4 p-0 text-red-400"
                                      onClick={() => {
                                        setMotionElements(prev => prev.map(el =>
                                          el.id === elementId
                                            ? { ...el, animations: el.animations.filter(a => a.id !== animation.id) }
                                            : el
                                        ));
                                      }}
                                    >
                                      <Trash2 className="h-2 w-2" />
                                    </Button>
                                  </div>
                                  <div className="text-gray-400">
                                    {animation.startTime}s → {animation.startTime + animation.duration}s
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">
                      Selecione um elemento para ver suas animações
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="presets">
              <div className="space-y-4">
                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-sm">Presets de Animação</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64">
                      <div className="space-y-2">
                        {MOTION_PRESETS.map(preset => (
                          <Button
                            key={preset.id}
                            variant="outline"
                            size="sm"
                            className="w-full justify-start h-auto p-3"
                            onClick={() => {
                              if (selectedElements.length > 0) {
                                selectedElements.forEach(elementId => {
                                  applyPreset(elementId, preset);
                                });
                              }
                            }}
                            disabled={selectedElements.length === 0}
                          >
                            <div className="flex items-center space-x-3">
                              <span className="text-lg">{preset.thumbnail}</span>
                              <div className="text-left">
                                <div className="font-medium text-xs">{preset.name}</div>
                                <div className="text-gray-400 text-xs">{preset.description}</div>
                              </div>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <CardTitle className="text-sm">Sugestões IA</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {motionAnalytics.suggestions.map((suggestion, index) => (
                        <div key={index} className="text-xs bg-gray-800 p-2 rounded">
                          <Sparkles className="inline mr-1 h-3 w-3 text-yellow-400" />
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
