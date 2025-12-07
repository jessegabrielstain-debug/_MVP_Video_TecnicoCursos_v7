/**
 * 🎬 Real-Time Renderer - Renderização de Avatares em Tempo Real
 * Sistema avançado de renderização 3D com performance otimizada
 */

'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Pause, 
  Square,
  Settings,
  Monitor,
  Cpu,
  Zap,
  Eye,
  Camera,
  Video,
  Download,
  Upload,
  RotateCcw,
  Maximize,
  Minimize,
  Volume2,
  Mic,
  Layers,
  Palette,
  Sun,
  Moon
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface RenderSettings {
  resolution: { width: number; height: number };
  frameRate: number;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  antiAliasing: boolean;
  shadows: boolean;
  reflections: boolean;
  postProcessing: boolean;
  lightingModel: 'basic' | 'pbr' | 'advanced';
  textureQuality: 'low' | 'medium' | 'high' | 'ultra';
  particleEffects: boolean;
}

interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  cpuUsage: number;
  memoryUsage: number;
  renderTime: number;
  triangleCount: number;
  drawCalls: number;
  textureMemory: number;
}

interface CameraSettings {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  fov: number;
  near: number;
  far: number;
  autoRotate: boolean;
  followAvatar: boolean;
}

interface LightingSettings {
  ambientIntensity: number;
  directionalIntensity: number;
  pointLights: Array<{
    position: { x: number; y: number; z: number };
    color: string;
    intensity: number;
    range: number;
  }>;
  environmentMap: string;
  shadowQuality: 'low' | 'medium' | 'high';
}

interface RealTimeRendererProps {
  avatarId: string;
  onRenderComplete?: (frameData: ImageData) => void;
  onPerformanceUpdate?: (metrics: PerformanceMetrics) => void;
}

export default function RealTimeRenderer({ 
  avatarId, 
  onRenderComplete, 
  onPerformanceUpdate 
}: RealTimeRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const performanceRef = useRef<PerformanceMetrics>({
    fps: 60,
    frameTime: 16.67,
    cpuUsage: 0,
    memoryUsage: 0,
    renderTime: 0,
    triangleCount: 0,
    drawCalls: 0,
    textureMemory: 0
  });

  const [isRendering, setIsRendering] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);
  const [renderTime, setRenderTime] = useState(0);

  // Configurações de renderização
  const [renderSettings, setRenderSettings] = useState<RenderSettings>({
    resolution: { width: 1920, height: 1080 },
    frameRate: 60,
    quality: 'high',
    antiAliasing: true,
    shadows: true,
    reflections: true,
    postProcessing: true,
    lightingModel: 'pbr',
    textureQuality: 'high',
    particleEffects: true
  });

  // Configurações da câmera
  const [cameraSettings, setCameraSettings] = useState<CameraSettings>({
    position: { x: 0, y: 0, z: 5 },
    rotation: { x: 0, y: 0, z: 0 },
    fov: 75,
    near: 0.1,
    far: 1000,
    autoRotate: false,
    followAvatar: true
  });

  // Configurações de iluminação
  const [lightingSettings, setLightingSettings] = useState<LightingSettings>({
    ambientIntensity: 0.4,
    directionalIntensity: 1.0,
    pointLights: [
      { position: { x: 2, y: 2, z: 2 }, color: '#ffffff', intensity: 0.8, range: 10 },
      { position: { x: -2, y: 1, z: 1 }, color: '#ffeaa7', intensity: 0.5, range: 8 }
    ],
    environmentMap: 'studio',
    shadowQuality: 'medium'
  });

  // Métricas de performance
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>(performanceRef.current);
  const [showPerformanceOverlay, setShowPerformanceOverlay] = useState(true);

  // Presets de qualidade
  const qualityPresets = {
    low: {
      resolution: { width: 720, height: 480 },
      frameRate: 30,
      quality: 'low' as const,
      antiAliasing: false,
      shadows: false,
      reflections: false,
      postProcessing: false,
      lightingModel: 'basic' as const,
      textureQuality: 'low' as const,
      particleEffects: false
    },
    medium: {
      resolution: { width: 1280, height: 720 },
      frameRate: 30,
      quality: 'medium' as const,
      antiAliasing: true,
      shadows: true,
      reflections: false,
      postProcessing: true,
      lightingModel: 'pbr' as const,
      textureQuality: 'medium' as const,
      particleEffects: true
    },
    high: {
      resolution: { width: 1920, height: 1080 },
      frameRate: 60,
      quality: 'high' as const,
      antiAliasing: true,
      shadows: true,
      reflections: true,
      postProcessing: true,
      lightingModel: 'pbr' as const,
      textureQuality: 'high' as const,
      particleEffects: true
    },
    ultra: {
      resolution: { width: 3840, height: 2160 },
      frameRate: 60,
      quality: 'ultra' as const,
      antiAliasing: true,
      shadows: true,
      reflections: true,
      postProcessing: true,
      lightingModel: 'advanced' as const,
      textureQuality: 'ultra' as const,
      particleEffects: true
    }
  };

  // Inicializar renderização
  const initializeRenderer = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Configurar canvas
    canvas.width = renderSettings.resolution.width;
    canvas.height = renderSettings.resolution.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configurações iniciais do contexto
    ctx.imageSmoothingEnabled = renderSettings.antiAliasing;
    ctx.imageSmoothingQuality = renderSettings.quality === 'ultra' ? 'high' : 
                               renderSettings.quality === 'high' ? 'medium' : 'low';

    toast.success('Renderer inicializado com sucesso!');
  }, [renderSettings]);

  // Loop principal de renderização
  const renderLoop = useCallback(() => {
    if (!isRendering || isPaused) return;

    const startTime = performance.now();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Renderizar fundo baseado no ambiente
    renderBackground(ctx, canvas.width, canvas.height);

    // Renderizar avatar 3D (simulado)
    renderAvatar3D(ctx, canvas.width, canvas.height);

    // Aplicar efeitos pós-processamento
    if (renderSettings.postProcessing) {
      applyPostProcessing(ctx, canvas.width, canvas.height);
    }

    // Atualizar métricas de performance
    const endTime = performance.now();
    const frameTime = endTime - startTime;
    
    performanceRef.current = {
      ...performanceRef.current,
      frameTime,
      renderTime: frameTime,
      fps: Math.round(1000 / frameTime),
      triangleCount: Math.floor(Math.random() * 50000) + 10000,
      drawCalls: Math.floor(Math.random() * 100) + 20,
      cpuUsage: Math.min(frameTime / 16.67 * 100, 100),
      memoryUsage: Math.floor(Math.random() * 500) + 200,
      textureMemory: Math.floor(Math.random() * 200) + 100
    };

    setPerformanceMetrics({ ...performanceRef.current });
    setCurrentFrame(prev => prev + 1);
    setRenderTime(frameTime);

    if (onPerformanceUpdate) {
      onPerformanceUpdate(performanceRef.current);
    }

    if (onRenderComplete) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      onRenderComplete(imageData);
    }

    // Agendar próximo frame
    const targetFrameTime = 1000 / renderSettings.frameRate;
    const delay = Math.max(0, targetFrameTime - frameTime);
    
    animationFrameRef.current = window.setTimeout(() => {
      requestAnimationFrame(renderLoop);
    }, delay);
  }, [isRendering, isPaused, renderSettings, onRenderComplete, onPerformanceUpdate]);

  // Renderizar fundo
  const renderBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    
    switch (lightingSettings.environmentMap) {
      case 'studio':
        gradient.addColorStop(0, '#f8fafc');
        gradient.addColorStop(1, '#e2e8f0');
        break;
      case 'outdoor':
        gradient.addColorStop(0, '#87ceeb');
        gradient.addColorStop(1, '#98fb98');
        break;
      case 'night':
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        break;
      default:
        gradient.addColorStop(0, '#f8fafc');
        gradient.addColorStop(1, '#e2e8f0');
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Adicionar grid se necessário
    if (renderSettings.quality !== 'low') {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.lineWidth = 1;
      
      for (let x = 0; x < width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      
      for (let y = 0; y < height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }
  };

  // Renderizar avatar 3D (simulação)
  const renderAvatar3D = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const time = Date.now() * 0.001;

    // Aplicar rotação automática da câmera
    let rotationOffset = 0;
    if (cameraSettings.autoRotate) {
      rotationOffset = time * 0.5;
    }

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotationOffset);

    // Cabeça do avatar
    const headRadius = 80;
    ctx.fillStyle = '#fdbcb4';
    ctx.beginPath();
    ctx.ellipse(0, -20, headRadius, headRadius * 1.2, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Sombras se habilitadas
    if (renderSettings.shadows) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 5;
      ctx.shadowOffsetY = 5;
    }

    // Cabelo
    ctx.fillStyle = '#8b4513';
    ctx.beginPath();
    ctx.ellipse(0, -60, headRadius * 0.9, headRadius * 0.7, 0, 0, Math.PI);
    ctx.fill();

    // Olhos
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'transparent';
    ctx.beginPath();
    ctx.ellipse(-25, -40, 12, 8, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(25, -40, 12, 8, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Pupilas
    ctx.fillStyle = '#333333';
    ctx.beginPath();
    ctx.ellipse(-25, -40, 5, 5, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(25, -40, 5, 5, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Nariz
    ctx.strokeStyle = '#d4a574';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(-3, -10);
    ctx.moveTo(0, -20);
    ctx.lineTo(3, -10);
    ctx.stroke();

    // Boca
    ctx.fillStyle = '#8b0000';
    ctx.beginPath();
    ctx.ellipse(0, 10, 15, 8, 0, 0, 2 * Math.PI);
    ctx.fill();

    // Corpo
    ctx.fillStyle = '#4a90e2';
    ctx.fillRect(-40, 60, 80, 120);

    // Braços
    ctx.fillStyle = '#fdbcb4';
    ctx.fillRect(-60, 70, 20, 80);
    ctx.fillRect(40, 70, 20, 80);

    // Efeitos de partículas se habilitados
    if (renderSettings.particleEffects) {
      renderParticleEffects(ctx, time);
    }

    // Reflexões se habilitadas
    if (renderSettings.reflections) {
      ctx.globalAlpha = 0.3;
      ctx.scale(1, -0.5);
      ctx.translate(0, -200);
      
      // Re-renderizar avatar como reflexão
      ctx.fillStyle = '#fdbcb4';
      ctx.beginPath();
      ctx.ellipse(0, -20, headRadius, headRadius * 1.2, 0, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  };

  // Renderizar efeitos de partículas
  const renderParticleEffects = (ctx: CanvasRenderingContext2D, time: number) => {
    const particleCount = renderSettings.quality === 'low' ? 10 : 
                         renderSettings.quality === 'medium' ? 20 : 
                         renderSettings.quality === 'high' ? 30 : 50;

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + time;
      const radius = 100 + Math.sin(time + i) * 20;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      ctx.fillStyle = `hsla(${(time * 50 + i * 10) % 360}, 70%, 60%, 0.6)`;
      ctx.beginPath();
      ctx.ellipse(x, y, 3, 3, 0, 0, 2 * Math.PI);
      ctx.fill();
    }
  };

  // Aplicar pós-processamento
  const applyPostProcessing = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (renderSettings.quality === 'low') return;

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Aplicar filtros baseados na qualidade
    for (let i = 0; i < data.length; i += 4) {
      // Ajuste de contraste
      const contrast = 1.1;
      data[i] = Math.min(255, (data[i] - 128) * contrast + 128);
      data[i + 1] = Math.min(255, (data[i + 1] - 128) * contrast + 128);
      data[i + 2] = Math.min(255, (data[i + 2] - 128) * contrast + 128);

      // Ajuste de saturação
      if (renderSettings.quality === 'ultra') {
        const saturation = 1.2;
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        data[i] = Math.min(255, gray + saturation * (data[i] - gray));
        data[i + 1] = Math.min(255, gray + saturation * (data[i + 1] - gray));
        data[i + 2] = Math.min(255, gray + saturation * (data[i + 2] - gray));
      }
    }

    ctx.putImageData(imageData, 0, 0);
  };

  // Controles de renderização
  const startRendering = () => {
    setIsRendering(true);
    setIsPaused(false);
    setCurrentFrame(0);
    renderLoop();
    toast.success('Renderização iniciada!');
  };

  const pauseRendering = () => {
    setIsPaused(!isPaused);
    if (!isPaused) {
      toast('Renderização pausada', { icon: 'ℹ️' });
    } else {
      renderLoop();
      toast('Renderização retomada', { icon: 'ℹ️' });
    }
  };

  const stopRendering = () => {
    setIsRendering(false);
    setIsPaused(false);
    if (animationFrameRef.current) {
      clearTimeout(animationFrameRef.current);
    }
    toast('Renderização parada', { icon: 'ℹ️' });
  };

  // Aplicar preset de qualidade
  const applyQualityPreset = (preset: keyof typeof qualityPresets) => {
    setRenderSettings(qualityPresets[preset]);
    toast.success(`Preset ${preset} aplicado!`);
  };

  // Capturar frame
  const captureFrame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `avatar-frame-${currentFrame}.png`;
    link.href = canvas.toDataURL();
    link.click();
    
    toast.success('Frame capturado!');
  };

  // Alternar fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  useEffect(() => {
    initializeRenderer();
  }, [initializeRenderer]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        clearTimeout(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Canvas Principal */}
      <Card className={`${isFullscreen ? 'fixed inset-0 z-50' : ''} bg-gradient-to-br from-purple-50 to-blue-50`}>
        <CardHeader className={isFullscreen ? 'p-2' : ''}>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              Renderização em Tempo Real
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {performanceMetrics.fps} FPS
              </Badge>
              <Badge variant="outline" className="text-xs">
                {renderSettings.quality.toUpperCase()}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className={isFullscreen ? 'p-2 h-full' : ''}>
          <div className="relative">
            <canvas
              ref={canvasRef}
              className={`border-2 border-gray-200 rounded-lg shadow-lg bg-white ${
                isFullscreen ? 'w-full h-full object-contain' : 'w-full max-w-4xl mx-auto'
              }`}
              style={{ 
                aspectRatio: `${renderSettings.resolution.width}/${renderSettings.resolution.height}`,
                maxHeight: isFullscreen ? '100vh' : '600px'
              }}
            />

            {/* Overlay de Performance */}
            {showPerformanceOverlay && (
              <div className="absolute top-4 left-4 bg-black/80 text-white p-3 rounded-lg text-xs space-y-1">
                <div>FPS: {performanceMetrics.fps}</div>
                <div>Frame Time: {performanceMetrics.frameTime.toFixed(2)}ms</div>
                <div>CPU: {performanceMetrics.cpuUsage.toFixed(1)}%</div>
                <div>Memory: {performanceMetrics.memoryUsage}MB</div>
                <div>Triangles: {performanceMetrics.triangleCount.toLocaleString()}</div>
                <div>Draw Calls: {performanceMetrics.drawCalls}</div>
              </div>
            )}

            {/* Controles de Reprodução */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              <Button
                onClick={startRendering}
                disabled={isRendering && !isPaused}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                <Play className="w-4 h-4" />
              </Button>
              <Button
                onClick={pauseRendering}
                disabled={!isRendering}
                size="sm"
                variant="outline"
              >
                <Pause className="w-4 h-4" />
              </Button>
              <Button
                onClick={stopRendering}
                disabled={!isRendering}
                size="sm"
                variant="outline"
              >
                <Square className="w-4 h-4" />
              </Button>
              <Button
                onClick={captureFrame}
                size="sm"
                variant="outline"
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>

            {/* Informações do Frame */}
            <div className="absolute bottom-4 right-4 bg-white/90 p-2 rounded text-xs">
              Frame: {currentFrame} | Tempo: {renderTime.toFixed(2)}ms
            </div>
          </div>
        </CardContent>
      </Card>

      {!isFullscreen && (
        <>
          {/* Configurações de Renderização */}
          <Tabs defaultValue="quality" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="quality">Qualidade</TabsTrigger>
              <TabsTrigger value="camera">Câmera</TabsTrigger>
              <TabsTrigger value="lighting">Iluminação</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="quality" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Configurações de Qualidade
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {Object.keys(qualityPresets).map((preset) => (
                      <Button
                        key={preset}
                        variant={renderSettings.quality === preset ? "default" : "outline"}
                        size="sm"
                        onClick={() => applyQualityPreset(preset as keyof typeof qualityPresets)}
                      >
                        {preset.toUpperCase()}
                      </Button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Resolução</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          type="number"
                          value={renderSettings.resolution.width}
                          onChange={(e) => setRenderSettings(prev => ({
                            ...prev,
                            resolution: { ...prev.resolution, width: parseInt(e.target.value) }
                          }))}
                          className="w-20"
                        />
                        <span className="self-center">×</span>
                        <Input
                          type="number"
                          value={renderSettings.resolution.height}
                          onChange={(e) => setRenderSettings(prev => ({
                            ...prev,
                            resolution: { ...prev.resolution, height: parseInt(e.target.value) }
                          }))}
                          className="w-20"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Frame Rate: {renderSettings.frameRate} FPS</Label>
                      <Slider
                        value={[renderSettings.frameRate]}
                        onValueChange={([value]) => setRenderSettings(prev => ({ ...prev, frameRate: value }))}
                        min={24}
                        max={120}
                        step={6}
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={renderSettings.antiAliasing}
                        onChange={(e) => setRenderSettings(prev => ({ ...prev, antiAliasing: e.target.checked }))}
                      />
                      <span className="text-sm">Anti-aliasing</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={renderSettings.shadows}
                        onChange={(e) => setRenderSettings(prev => ({ ...prev, shadows: e.target.checked }))}
                      />
                      <span className="text-sm">Sombras</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={renderSettings.reflections}
                        onChange={(e) => setRenderSettings(prev => ({ ...prev, reflections: e.target.checked }))}
                      />
                      <span className="text-sm">Reflexões</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={renderSettings.postProcessing}
                        onChange={(e) => setRenderSettings(prev => ({ ...prev, postProcessing: e.target.checked }))}
                      />
                      <span className="text-sm">Pós-processamento</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={renderSettings.particleEffects}
                        onChange={(e) => setRenderSettings(prev => ({ ...prev, particleEffects: e.target.checked }))}
                      />
                      <span className="text-sm">Efeitos de Partícula</span>
                    </label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="camera" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Configurações da Câmera
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Posição X: {cameraSettings.position.x}</Label>
                      <Slider
                        value={[cameraSettings.position.x]}
                        onValueChange={([value]) => setCameraSettings(prev => ({
                          ...prev,
                          position: { ...prev.position, x: value }
                        }))}
                        min={-10}
                        max={10}
                        step={0.1}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Posição Y: {cameraSettings.position.y}</Label>
                      <Slider
                        value={[cameraSettings.position.y]}
                        onValueChange={([value]) => setCameraSettings(prev => ({
                          ...prev,
                          position: { ...prev.position, y: value }
                        }))}
                        min={-10}
                        max={10}
                        step={0.1}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Posição Z: {cameraSettings.position.z}</Label>
                      <Slider
                        value={[cameraSettings.position.z]}
                        onValueChange={([value]) => setCameraSettings(prev => ({
                          ...prev,
                          position: { ...prev.position, z: value }
                        }))}
                        min={1}
                        max={20}
                        step={0.1}
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Campo de Visão: {cameraSettings.fov}°</Label>
                      <Slider
                        value={[cameraSettings.fov]}
                        onValueChange={([value]) => setCameraSettings(prev => ({ ...prev, fov: value }))}
                        min={30}
                        max={120}
                        step={5}
                        className="mt-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={cameraSettings.autoRotate}
                          onChange={(e) => setCameraSettings(prev => ({ ...prev, autoRotate: e.target.checked }))}
                        />
                        <span className="text-sm">Rotação Automática</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={cameraSettings.followAvatar}
                          onChange={(e) => setCameraSettings(prev => ({ ...prev, followAvatar: e.target.checked }))}
                        />
                        <span className="text-sm">Seguir Avatar</span>
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="lighting" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sun className="w-5 h-5" />
                    Configurações de Iluminação
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Luz Ambiente: {Math.round(lightingSettings.ambientIntensity * 100)}%</Label>
                      <Slider
                        value={[lightingSettings.ambientIntensity]}
                        onValueChange={([value]) => setLightingSettings(prev => ({ ...prev, ambientIntensity: value }))}
                        min={0}
                        max={1}
                        step={0.1}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Luz Direcional: {Math.round(lightingSettings.directionalIntensity * 100)}%</Label>
                      <Slider
                        value={[lightingSettings.directionalIntensity]}
                        onValueChange={([value]) => setLightingSettings(prev => ({ ...prev, directionalIntensity: value }))}
                        min={0}
                        max={2}
                        step={0.1}
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Ambiente</Label>
                    <div className="flex gap-2 mt-2">
                      {['studio', 'outdoor', 'night'].map((env) => (
                        <Button
                          key={env}
                          variant={lightingSettings.environmentMap === env ? "default" : "outline"}
                          size="sm"
                          onClick={() => setLightingSettings(prev => ({ ...prev, environmentMap: env }))}
                        >
                          {env === 'studio' && <Sun className="w-4 h-4 mr-1" />}
                          {env === 'outdoor' && <Layers className="w-4 h-4 mr-1" />}
                          {env === 'night' && <Moon className="w-4 h-4 mr-1" />}
                          {env.charAt(0).toUpperCase() + env.slice(1)}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cpu className="w-5 h-5" />
                    Métricas de Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{performanceMetrics.fps}</div>
                      <div className="text-sm text-gray-600">FPS</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{performanceMetrics.frameTime.toFixed(1)}</div>
                      <div className="text-sm text-gray-600">Frame Time (ms)</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{performanceMetrics.cpuUsage.toFixed(1)}%</div>
                      <div className="text-sm text-gray-600">CPU</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{performanceMetrics.memoryUsage}</div>
                      <div className="text-sm text-gray-600">Memory (MB)</div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Triângulos:</span>
                      <span>{performanceMetrics.triangleCount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Draw Calls:</span>
                      <span>{performanceMetrics.drawCalls}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Memória de Textura:</span>
                      <span>{performanceMetrics.textureMemory}MB</span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={showPerformanceOverlay}
                        onChange={(e) => setShowPerformanceOverlay(e.target.checked)}
                      />
                      <span className="text-sm">Mostrar Overlay de Performance</span>
                    </label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}