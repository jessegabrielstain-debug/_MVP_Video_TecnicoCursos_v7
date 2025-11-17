
'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Play, Pause, Square, RotateCw, Move, Zap,
  Sparkles, Palette, Layers, Target, TrendingUp,
  Download, Upload, Eye, EyeOff, Settings,
  ChevronDown, ChevronRight, Plus, Minus,
  Circle, Square as SquareIcon, Triangle,
  Star, Heart, Hexagon, Octagon, Diamond
} from 'lucide-react';

interface MotionElement {
  id: string;
  type: 'shape' | 'text' | 'particle' | 'line' | 'icon';
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scale: number;
  opacity: number;
  color: string;
  animation: MotionAnimation;
  visible: boolean;
  locked: boolean;
}

type MotionNumericProperty = Extract<
  {
    [K in keyof MotionElement]: MotionElement[K] extends number ? K : never
  }[keyof MotionElement],
  string
>

interface MotionAnimation {
  type: 'bounce' | 'slide' | 'fade' | 'rotate' | 'scale' | 'pulse' | 'wave' | 'spiral';
  duration: number;
  delay: number;
  repeat: number;
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce' | 'elastic';
  direction: 'normal' | 'reverse' | 'alternate';
  properties: Partial<Record<MotionNumericProperty, { from: number; to: number }>>;
}

const animationTypeOptions: MotionAnimation['type'][] = ['bounce', 'slide', 'fade', 'rotate', 'scale', 'pulse', 'wave', 'spiral']

const isAnimationType = (value: string): value is MotionAnimation['type'] =>
  animationTypeOptions.some((option) => option === value)

interface ParticleSystem {
  id: string;
  name: string;
  type: 'sparks' | 'smoke' | 'confetti' | 'bubbles' | 'stars' | 'fire';
  count: number;
  velocity: number;
  spread: number;
  life: number;
  color: string;
  size: number;
  gravity: number;
  active: boolean;
}

interface AIPreset {
  id: string;
  name: string;
  category: 'safety' | 'corporate' | 'educational' | 'warning' | 'celebration';
  description: string;
  elements: Partial<MotionElement>[];
  particles: Partial<ParticleSystem>[];
  thumbnail: string;
}

const MotionGraphicsAIEngine = () => {
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration] = useState(10);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedElement, setSelectedElement] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'elements' | 'particles' | 'presets' | 'export'>('elements');
  const [isGenerating, setIsGenerating] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 450 });

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [motionElements, setMotionElements] = useState<MotionElement[]>([
    {
      id: 'element-1',
      type: 'shape',
      name: 'Alert Circle',
      x: 400,
      y: 200,
      width: 80,
      height: 80,
      rotation: 0,
      scale: 1,
      opacity: 1,
      color: '#ef4444',
      animation: {
        type: 'pulse',
        duration: 2,
        delay: 0,
        repeat: -1,
        easing: 'ease-in-out',
        direction: 'alternate',
        properties: {
          scale: { from: 1, to: 1.2 }
        }
      },
      visible: true,
      locked: false
    },
    {
      id: 'element-2',
      type: 'text',
      name: 'Safety Warning',
      x: 400,
      y: 300,
      width: 200,
      height: 40,
      rotation: 0,
      scale: 1,
      opacity: 0,
      color: '#ffffff',
      animation: {
        type: 'fade',
        duration: 1,
        delay: 1,
        repeat: 1,
        easing: 'ease-out',
        direction: 'normal',
        properties: {
          opacity: { from: 0, to: 1 },
          y: { from: 320, to: 300 }
        }
      },
      visible: true,
      locked: false
    }
  ]);

  const [particleSystems, setParticleSystems] = useState<ParticleSystem[]>([
    {
      id: 'particles-1',
      name: 'Alert Sparks',
      type: 'sparks',
      count: 50,
      velocity: 100,
      spread: 360,
      life: 2,
      color: '#fbbf24',
      size: 3,
      gravity: 50,
      active: true
    }
  ]);

  const aiPresets: AIPreset[] = [
    {
      id: 'safety-alert',
      name: 'Safety Alert',
      category: 'safety',
      description: 'Animated warning system for safety content',
      thumbnail: '🚨',
      elements: [
        {
          type: 'shape',
          name: 'Warning Triangle',
          animation: { 
            type: 'bounce', 
            duration: 1.5, 
            repeat: -1,
            delay: 0,
            easing: 'ease-in-out',
            direction: 'normal',
            properties: {
              scale: { from: 1, to: 1.2 }
            }
          }
        }
      ],
      particles: [
        {
          type: 'sparks',
          name: 'Alert Particles',
          count: 30,
          color: '#ef4444'
        }
      ]
    },
    {
      id: 'corporate-intro',
      name: 'Corporate Intro',
      category: 'corporate',
      description: 'Professional introduction animation',
      thumbnail: '🏢',
      elements: [
        {
          type: 'text',
          name: 'Company Logo',
          animation: { 
            type: 'slide', 
            duration: 2, 
            easing: 'ease-out',
            delay: 0,
            repeat: 1,
            direction: 'normal',
            properties: {
              x: { from: -100, to: 0 }
            }
          }
        }
      ],
      particles: []
    },
    {
      id: 'educational-highlight',
      name: 'Educational Highlight',
      category: 'educational',
      description: 'Highlighting important information',
      thumbnail: '📚',
      elements: [
        {
          type: 'shape',
          name: 'Highlight Circle',
          animation: { 
            type: 'scale', 
            duration: 1, 
            repeat: 2,
            delay: 0,
            easing: 'ease-in-out',
            direction: 'alternate',
            properties: {
              scale: { from: 1, to: 1.5 }
            }
          }
        }
      ],
      particles: [
        {
          type: 'stars',
          name: 'Knowledge Stars',
          count: 20,
          color: '#3b82f6'
        }
      ]
    }
  ];

  // Animation engine
  const calculateElementPosition = useCallback((element: MotionElement, time: number) => {
    const { animation } = element;
    const animationTime = (time - animation.delay) % animation.duration;
    
    if (time < animation.delay) {
      return { ...element };
    }

    const progress = animationTime / animation.duration;
    let easedProgress = progress;

    // Apply easing
    switch (animation.easing) {
      case 'ease-in':
        easedProgress = progress * progress;
        break;
      case 'ease-out':
        easedProgress = 1 - Math.pow(1 - progress, 2);
        break;
      case 'ease-in-out':
        easedProgress = progress < 0.5 
          ? 2 * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        break;
      case 'bounce':
        easedProgress = 1 - Math.abs(Math.sin(progress * Math.PI * 2)) * (1 - progress);
        break;
      case 'elastic':
        easedProgress = progress === 0 ? 0 : progress === 1 ? 1 :
          -Math.pow(2, 10 * (progress - 1)) * Math.sin((progress - 1.1) * 5 * Math.PI);
        break;
    }

    // Apply animation direction
    if (animation.direction === 'reverse') {
      easedProgress = 1 - easedProgress;
    } else if (animation.direction === 'alternate') {
      const cycle = Math.floor((time - animation.delay) / animation.duration);
      if (cycle % 2 === 1) {
        easedProgress = 1 - easedProgress;
      }
    }

    // Calculate animated properties
    const animatedElement = { ...element };

    (Object.keys(animation.properties) as MotionNumericProperty[]).forEach((property) => {
      const range = animation.properties[property];
      if (!range) return;
      const value = range.from + (range.to - range.from) * easedProgress;
      animatedElement[property] = value;
    });

    return animatedElement;
  }, []);

  // Canvas rendering
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
    
    // Draw background
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    // Render elements
    motionElements.forEach(element => {
      if (!element.visible) return;

      const animatedElement = calculateElementPosition(element, currentTime);
      
      ctx.save();
      ctx.globalAlpha = animatedElement.opacity;
      ctx.translate(animatedElement.x, animatedElement.y);
      ctx.rotate((animatedElement.rotation * Math.PI) / 180);
      ctx.scale(animatedElement.scale, animatedElement.scale);

      ctx.fillStyle = animatedElement.color;
      
      switch (element.type) {
        case 'shape':
          // Draw circle for now
          ctx.beginPath();
          ctx.arc(0, 0, animatedElement.width / 2, 0, 2 * Math.PI);
          ctx.fill();
          break;
          
        case 'text':
          ctx.font = '16px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(element.name, 0, 5);
          break;
          
        default:
          // Default rectangle
          ctx.fillRect(-animatedElement.width / 2, -animatedElement.height / 2, 
                      animatedElement.width, animatedElement.height);
      }
      
      ctx.restore();
    });

    // Render particles (simplified)
    particleSystems.forEach(system => {
      if (!system.active) return;
      
      ctx.fillStyle = system.color;
      for (let i = 0; i < Math.min(system.count, 50); i++) {
        const x = 200 + Math.sin(currentTime + i) * 100;
        const y = 200 + Math.cos(currentTime + i) * 100;
        ctx.beginPath();
        ctx.arc(x, y, system.size, 0, 2 * Math.PI);
        ctx.fill();
      }
    });

  }, [currentTime, motionElements, particleSystems, canvasSize, calculateElementPosition]);

  // Update canvas when playing
  useEffect(() => {
    let animationFrame: number;
    
    if (isPlaying) {
      const animate = () => {
        setCurrentTime(prev => {
          const newTime = prev + 0.016; // ~60fps
          return newTime > totalDuration ? 0 : newTime;
        });
        animationFrame = requestAnimationFrame(animate);
      };
      animationFrame = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isPlaying, totalDuration]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Controls
  const handlePlay = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleSeek = useCallback((value: number[]) => {
    setCurrentTime(value[0]);
  }, []);

  // AI-Powered Features
  const generateMotionGraphics = useCallback(async (category: string) => {
    setIsGenerating(true);
    console.log(`🤖 Generating motion graphics for category: ${category}`);
    
    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsGenerating(false);
  }, []);

  const optimizeAnimations = useCallback(() => {
    console.log('✨ Optimizing animations with AI...');
  }, []);

  const applyPreset = useCallback((preset: AIPreset) => {
    console.log(`Applying preset: ${preset.name}`);
    // Apply preset elements and particles
  }, []);

  // Element management
  const addElement = useCallback((type: MotionElement['type']) => {
    const newElement: MotionElement = {
      id: `element-${Date.now()}`,
      type,
      name: `New ${type}`,
      x: canvasSize.width / 2,
      y: canvasSize.height / 2,
      width: 50,
      height: 50,
      rotation: 0,
      scale: 1,
      opacity: 1,
      color: '#3b82f6',
      animation: {
        type: 'fade',
        duration: 1,
        delay: 0,
        repeat: 1,
        easing: 'ease-in-out',
        direction: 'normal',
        properties: {
          opacity: { from: 0, to: 1 }
        }
      },
      visible: true,
      locked: false
    };
    
    setMotionElements(prev => [...prev, newElement]);
    setSelectedElement(newElement.id);
  }, [canvasSize]);

  const updateElement = useCallback((elementId: string, updates: Partial<MotionElement>) => {
    setMotionElements(prev => prev.map(element =>
      element.id === elementId ? { ...element, ...updates } : element
    ));
  }, []);

  const selectedElementData = motionElements.find(el => el.id === selectedElement);

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-purple-400">🎨 Motion Graphics AI Engine</h2>
          <Badge variant="outline" className="border-purple-400 text-purple-400">
            <Sparkles className="w-3 h-3 mr-1" />
            AI Powered
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => generateMotionGraphics('safety')}
            disabled={isGenerating}
            className="text-blue-400 hover:text-blue-300"
          >
            <Zap className="w-4 h-4 mr-1" />
            Generate AI
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={optimizeAnimations}
            className="text-green-400 hover:text-green-300"
          >
            <TrendingUp className="w-4 h-4 mr-1" />
            Optimize
          </Button>
        </div>
      </div>

      {/* Transport Controls */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Button
            variant={isPlaying ? "default" : "secondary"}
            size="sm"
            onClick={handlePlay}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentTime(0)}
          >
            <Square className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm font-mono">
            {currentTime.toFixed(2)}s / {totalDuration}s
          </span>
          
          <Slider
            value={[currentTime]}
            onValueChange={handleSeek}
            max={totalDuration}
            step={0.01}
            className="w-64"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas Area */}
        <div className="flex-1 p-4 bg-gray-900">
          <div className="h-full bg-gray-800 rounded-lg border border-gray-700 p-4">
            <canvas
              ref={canvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              className="border border-gray-600 rounded bg-gray-900"
            />
          </div>
        </div>

        {/* Controls Panel */}
        <div className="w-96 bg-gray-850 border-l border-gray-700">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value)} className="h-full flex flex-col">
            <TabsList className="w-full">
              <TabsTrigger value="elements" className="flex-1 text-xs">Elements</TabsTrigger>
              <TabsTrigger value="particles" className="flex-1 text-xs">Particles</TabsTrigger>
              <TabsTrigger value="presets" className="flex-1 text-xs">AI Presets</TabsTrigger>
            </TabsList>
            
            <TabsContent value="elements" className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Motion Elements</h3>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      onClick={() => addElement('shape')}
                      className="bg-blue-600 hover:bg-blue-700 px-2"
                    >
                      <Circle className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => addElement('text')}
                      className="bg-green-600 hover:bg-green-700 px-2"
                    >
                      T
                    </Button>
                  </div>
                </div>

                {/* Elements List */}
                <div className="space-y-2">
                  {motionElements.map((element) => (
                    <div
                      key={element.id}
                      className={`p-3 border rounded cursor-pointer transition-colors ${
                        selectedElement === element.id 
                          ? 'border-purple-400 bg-gray-700' 
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                      onClick={() => setSelectedElement(element.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{element.name}</span>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateElement(element.id, { visible: !element.visible });
                            }}
                            className="p-1 h-6 w-6"
                          >
                            {element.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-400">
                        {element.type} • {element.animation.type}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Element Properties */}
                {selectedElementData && (
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Properties</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <label className="text-xs">Position X</label>
                        <Slider
                          value={[selectedElementData.x]}
                          onValueChange={(value) => updateElement(selectedElement, { x: value[0] })}
                          min={0}
                          max={canvasSize.width}
                          step={1}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-xs">Position Y</label>
                        <Slider
                          value={[selectedElementData.y]}
                          onValueChange={(value) => updateElement(selectedElement, { y: value[0] })}
                          min={0}
                          max={canvasSize.height}
                          step={1}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-xs">Scale</label>
                        <Slider
                          value={[selectedElementData.scale]}
                          onValueChange={(value) => updateElement(selectedElement, { scale: value[0] })}
                          min={0.1}
                          max={3}
                          step={0.1}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-xs">Opacity</label>
                        <Slider
                          value={[selectedElementData.opacity]}
                          onValueChange={(value) => updateElement(selectedElement, { opacity: value[0] })}
                          min={0}
                          max={1}
                          step={0.01}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-xs">Animation Type</label>
                        <Select
                          value={selectedElementData.animation.type}
                          onValueChange={(value) => {
                            if (isAnimationType(value)) {
                              updateElement(selectedElement, {
                                animation: { ...selectedElementData.animation, type: value }
                              })
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bounce">Bounce</SelectItem>
                            <SelectItem value="slide">Slide</SelectItem>
                            <SelectItem value="fade">Fade</SelectItem>
                            <SelectItem value="rotate">Rotate</SelectItem>
                            <SelectItem value="scale">Scale</SelectItem>
                            <SelectItem value="pulse">Pulse</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="particles" className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Particle Systems</h3>
                  <Button
                    size="sm"
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add
                  </Button>
                </div>

                {particleSystems.map((system) => (
                  <Card key={system.id} className="bg-gray-800 border-gray-700">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">{system.name}</CardTitle>
                        <Badge variant="outline" className="text-xs">
                          {system.type}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>Count: {system.count}</div>
                        <div>Size: {system.size}px</div>
                        <div>Velocity: {system.velocity}</div>
                        <div>Life: {system.life}s</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="presets" className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">AI Presets</h3>
                  <Button
                    size="sm"
                    onClick={() => generateMotionGraphics('custom')}
                    disabled={isGenerating}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    {isGenerating ? 'Generating...' : 'Create AI'}
                  </Button>
                </div>

                {aiPresets.map((preset) => (
                  <Card key={preset.id} className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">{preset.thumbnail}</div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium">{preset.name}</h4>
                          <p className="text-xs text-gray-400 mt-1">{preset.description}</p>
                          <Badge variant="outline" className="text-xs mt-2">
                            {preset.category}
                          </Badge>
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        className="w-full mt-3"
                        onClick={() => applyPreset(preset)}
                      >
                        Apply Preset
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default MotionGraphicsAIEngine;
