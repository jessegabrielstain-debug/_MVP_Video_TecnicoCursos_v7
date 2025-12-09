'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Move3D, 
  Eye, 
  EyeOff,
  Settings,
  Download,
  Share2,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  RefreshCw,
  Layers,
  Palette,
  Sun,
  Moon,
  Grid3X3,
  Camera,
  Monitor,
  Smartphone,
  Tablet,
  Headphones,
  Gamepad2,
  MousePointer,
  Hand,
  Sparkles,
  Target,
  Gauge,
  Activity,
  BarChart3,
  TrendingUp,
  Clock,
  Users,
  Award,
  Shield,
  CheckCircle,
  AlertTriangle,
  Info,
  ExternalLink
} from 'lucide-react';
import { Template } from '@/types/templates';
import { toast } from 'sonner';

interface Template3DPreviewProps {
  template: Template;
  onClose?: () => void;
  onEdit?: () => void;
  className?: string;
}

interface ViewerSettings {
  autoRotate: boolean;
  showGrid: boolean;
  showLighting: boolean;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  renderMode: 'realistic' | 'wireframe' | 'xray';
  environment: 'studio' | 'outdoor' | 'indoor' | 'custom';
  cameraMode: 'orbit' | 'fly' | 'walk' | 'fixed';
}

interface InteractionData {
  hotspots: Array<{
    id: string;
    position: [number, number, number];
    type: 'info' | 'quiz' | 'safety' | 'warning';
    title: string;
    content: string;
    isActive: boolean;
  }>;
  animations: Array<{
    id: string;
    name: string;
    duration: number;
    loop: boolean;
    autoPlay: boolean;
  }>;
  sounds: Array<{
    id: string;
    name: string;
    type: 'ambient' | 'effect' | 'voice' | 'alert';
    volume: number;
    isPlaying: boolean;
  }>;
}

interface PerformanceMetrics {
  fps: number;
  renderTime: number;
  triangles: number;
  drawCalls: number;
  memoryUsage: number;
  loadTime: number;
}

export const Template3DPreview: React.FC<Template3DPreviewProps> = ({
  template,
  onClose,
  onEdit,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(100);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [activeTab, setActiveTab] = useState('viewer');
  
  const [viewerSettings, setViewerSettings] = useState<ViewerSettings>({
    autoRotate: true,
    showGrid: false,
    showLighting: true,
    quality: 'high',
    renderMode: 'realistic',
    environment: 'studio',
    cameraMode: 'orbit',
  });

  const [interactionData, setInteractionData] = useState<InteractionData>({
    hotspots: [
      {
        id: '1',
        position: [0, 1, 0],
        type: 'safety',
        title: 'Equipamento de Proteção',
        content: 'Use sempre o EPI adequado para esta atividade',
        isActive: true,
      },
      {
        id: '2',
        position: [2, 0.5, 1],
        type: 'warning',
        title: 'Área de Risco',
        content: 'Mantenha distância segura desta área',
        isActive: true,
      },
      {
        id: '3',
        position: [-1, 1.5, -1],
        type: 'info',
        title: 'Procedimento Padrão',
        content: 'Siga os passos conforme NR-12',
        isActive: true,
      },
    ],
    animations: [
      {
        id: 'intro',
        name: 'Animação de Introdução',
        duration: 5000,
        loop: false,
        autoPlay: true,
      },
      {
        id: 'safety_demo',
        name: 'Demonstração de Segurança',
        duration: 15000,
        loop: true,
        autoPlay: false,
      },
      {
        id: 'equipment_usage',
        name: 'Uso de Equipamentos',
        duration: 10000,
        loop: false,
        autoPlay: false,
      },
    ],
    sounds: [
      {
        id: 'ambient',
        name: 'Som Ambiente',
        type: 'ambient',
        volume: 30,
        isPlaying: true,
      },
      {
        id: 'narration',
        name: 'Narração',
        type: 'voice',
        volume: 80,
        isPlaying: false,
      },
      {
        id: 'alerts',
        name: 'Alertas de Segurança',
        type: 'alert',
        volume: 90,
        isPlaying: false,
      },
    ],
  });

  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    renderTime: 16.7,
    triangles: 125000,
    drawCalls: 45,
    memoryUsage: 256,
    loadTime: 2.3,
  });

  const [selectedHotspot, setSelectedHotspot] = useState<string | null>(null);
  const [devicePreview, setDevicePreview] = useState<'desktop' | 'tablet' | 'mobile' | 'vr'>('desktop');

  // Initialize 3D viewer
  useEffect(() => {
    initializeViewer();
    startPerformanceMonitoring();
    
    return () => {
      cleanup();
    };
  }, []);

  const initializeViewer = async () => {
    try {
      setIsLoading(true);
      
      // Simulate 3D scene initialization
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Initialize Three.js scene (mock implementation)
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          // Draw a mock 3D preview
          drawMock3DScene(ctx, canvas.width, canvas.height);
        }
      }
      
      setIsLoading(false);
      toast.success('Preview 3D carregado com sucesso!');
    } catch (error) {
      logger.error('Failed to initialize 3D viewer', error instanceof Error ? error : new Error(String(error)), { component: 'Template3DPreview' });
      toast.error('Erro ao carregar preview 3D');
      setIsLoading(false);
    }
  };

  const drawMock3DScene = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#E0F6FF');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Draw ground plane
    ctx.fillStyle = '#D3D3D3';
    ctx.fillRect(0, height * 0.7, width, height * 0.3);
    
    // Draw 3D objects (mock)
    drawMockEquipment(ctx, width, height);
    drawMockWorker(ctx, width, height);
    drawMockSafetyElements(ctx, width, height);
    
    // Draw hotspots
    interactionData.hotspots.forEach((hotspot, index) => {
      if (hotspot.isActive) {
        drawHotspot(ctx, width * (0.3 + index * 0.2), height * (0.4 + index * 0.1), hotspot.type);
      }
    });
  };

  const drawMockEquipment = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Draw industrial equipment
    ctx.fillStyle = '#4A5568';
    ctx.fillRect(width * 0.6, height * 0.4, width * 0.25, height * 0.3);
    
    // Add details
    ctx.fillStyle = '#2D3748';
    ctx.fillRect(width * 0.62, height * 0.42, width * 0.21, height * 0.05);
    ctx.fillRect(width * 0.65, height * 0.5, width * 0.15, height * 0.15);
  };

  const drawMockWorker = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Draw worker figure
    ctx.fillStyle = '#FFA500';
    ctx.beginPath();
    ctx.arc(width * 0.3, height * 0.45, 15, 0, 2 * Math.PI);
    ctx.fill();
    
    // Body
    ctx.fillStyle = '#FF6B35';
    ctx.fillRect(width * 0.28, height * 0.47, width * 0.04, height * 0.15);
    
    // Hard hat
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(width * 0.3, height * 0.43, 18, Math.PI, 2 * Math.PI);
    ctx.fill();
  };

  const drawMockSafetyElements = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Safety barriers
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(width * 0.1, height * 0.6);
    ctx.lineTo(width * 0.9, height * 0.6);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Warning signs
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(width * 0.15, height * 0.3);
    ctx.lineTo(width * 0.2, height * 0.4);
    ctx.lineTo(width * 0.1, height * 0.4);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#000';
    ctx.font = '16px Arial';
    ctx.fillText('!', width * 0.145, height * 0.37);
  };

  const drawHotspot = (ctx: CanvasRenderingContext2D, x: number, y: number, type: string) => {
    const colors = {
      info: '#3B82F6',
      quiz: '#8B5CF6',
      safety: '#10B981',
      warning: '#F59E0B',
    };
    
    ctx.fillStyle = colors[type as keyof typeof colors] || '#3B82F6';
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, 2 * Math.PI);
    ctx.fill();
    
    // Pulsing effect
    ctx.strokeStyle = colors[type as keyof typeof colors] || '#3B82F6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, 2 * Math.PI);
    ctx.stroke();
  };

  const startPerformanceMonitoring = () => {
    const interval = setInterval(() => {
      setPerformanceMetrics(prev => ({
        ...prev,
        fps: 58 + Math.random() * 4,
        renderTime: 15 + Math.random() * 5,
        memoryUsage: prev.memoryUsage + (Math.random() - 0.5) * 10,
      }));
    }, 1000);

    return () => clearInterval(interval);
  };

  const cleanup = () => {
    // Cleanup 3D resources
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      // Start animation
      const interval = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= duration) {
            setIsPlaying(false);
            clearInterval(interval);
            return 0;
          }
          return prev + 1;
        });
      }, 100);
    }
  };

  const handleSeek = (value: number[]) => {
    setCurrentTime(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
  };

  const handleSettingsChange = (key: keyof ViewerSettings, value: any) => {
    setViewerSettings(prev => ({ ...prev, [key]: value }));
    
    // Apply settings to 3D viewer
    toast.success(`Configuração ${key} atualizada`);
  };

  const handleHotspotClick = (hotspotId: string) => {
    setSelectedHotspot(hotspotId);
    const hotspot = interactionData.hotspots.find(h => h.id === hotspotId);
    if (hotspot) {
      toast.info(hotspot.content);
    }
  };

  const handleExport = () => {
    // Export 3D scene or screenshot
    toast.success('Exportando preview 3D...');
  };

  const handleShare = () => {
    // Share 3D preview
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copiado para a área de transferência!');
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`template-3d-preview ${className} ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : ''}`}>
      <Card className={`h-full ${isFullscreen ? 'border-0 rounded-none' : ''}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                Preview 3D - {template.name}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{template.category}</Badge>
                <Badge variant="secondary">{viewerSettings.quality}</Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  {performanceMetrics.fps.toFixed(0)} FPS
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="flex items-center gap-1"
              >
                <Download className="w-4 h-4" />
                Exportar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="flex items-center gap-1"
              >
                <Share2 className="w-4 h-4" />
                Compartilhar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFullscreen}
                className="flex items-center gap-1"
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </Button>
              {onClose && (
                <Button variant="outline" size="sm" onClick={onClose}>
                  ✕
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="grid grid-cols-1 lg:grid-cols-4 h-full">
            {/* 3D Viewer */}
            <div className="lg:col-span-3 relative bg-gray-900">
              {isLoading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                  <div className="text-center text-white">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
                    <p>Carregando preview 3D...</p>
                    <Progress value={75} className="w-48 mx-auto mt-2" />
                  </div>
                </div>
              ) : (
                <>
                  <canvas
                    ref={canvasRef}
                    width={800}
                    height={600}
                    className="w-full h-full object-contain"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const y = e.clientY - rect.top;
                      
                      // Check for hotspot clicks (simplified)
                      interactionData.hotspots.forEach((hotspot, index) => {
                        const hotspotX = rect.width * (0.3 + index * 0.2);
                        const hotspotY = rect.height * (0.4 + index * 0.1);
                        const distance = Math.sqrt((x - hotspotX) ** 2 + (y - hotspotY) ** 2);
                        
                        if (distance < 20) {
                          handleHotspotClick(hotspot.id);
                        }
                      });
                    }}
                  />
                  
                  {/* Device Preview Overlay */}
                  <div className="absolute top-4 left-4">
                    <div className="flex items-center gap-2 bg-black/50 rounded-lg p-2">
                      <Button
                        variant={devicePreview === 'desktop' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setDevicePreview('desktop')}
                        className="text-white"
                      >
                        <Monitor className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={devicePreview === 'tablet' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setDevicePreview('tablet')}
                        className="text-white"
                      >
                        <Tablet className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={devicePreview === 'mobile' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setDevicePreview('mobile')}
                        className="text-white"
                      >
                        <Smartphone className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={devicePreview === 'vr' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setDevicePreview('vr')}
                        className="text-white"
                      >
                        <Headphones className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Performance Metrics Overlay */}
                  <div className="absolute top-4 right-4">
                    <div className="bg-black/50 rounded-lg p-3 text-white text-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <Gauge className="w-4 h-4" />
                        <span>Performance</span>
                      </div>
                      <div className="space-y-1">
                        <div>FPS: {performanceMetrics.fps.toFixed(0)}</div>
                        <div>Render: {performanceMetrics.renderTime.toFixed(1)}ms</div>
                        <div>Memory: {performanceMetrics.memoryUsage.toFixed(0)}MB</div>
                      </div>
                    </div>
                  </div>

                  {/* Controls Overlay */}
                  {showControls && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                      <div className="bg-black/70 rounded-lg p-4 text-white">
                        <div className="flex items-center gap-4 mb-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handlePlayPause}
                            className="text-white hover:bg-white/20"
                          >
                            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCurrentTime(0)}
                            className="text-white hover:bg-white/20"
                          >
                            <SkipBack className="w-4 h-4" />
                          </Button>
                          
                          <div className="flex items-center gap-2 min-w-48">
                            <span className="text-xs">{Math.floor(currentTime / 60)}:{(currentTime % 60).toString().padStart(2, '0')}</span>
                            <Slider
                              value={[currentTime]}
                              max={duration}
                              step={1}
                              onValueChange={handleSeek}
                              className="flex-1"
                            />
                            <span className="text-xs">{Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}</span>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsMuted(!isMuted)}
                            className="text-white hover:bg-white/20"
                          >
                            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                          </Button>
                          
                          <div className="flex items-center gap-2 min-w-24">
                            <Volume2 className="w-3 h-3" />
                            <Slider
                              value={[volume]}
                              max={100}
                              step={1}
                              onValueChange={handleVolumeChange}
                              className="flex-1"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Hotspot Info Panel */}
                  {selectedHotspot && (
                    <div className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-white rounded-lg shadow-lg p-4 max-w-sm">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">
                          {interactionData.hotspots.find(h => h.id === selectedHotspot)?.title}
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedHotspot(null)}
                        >
                          ✕
                        </Button>
                      </div>
                      <p className="text-sm text-gray-600">
                        {interactionData.hotspots.find(h => h.id === selectedHotspot)?.content}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Control Panel */}
            <div className="bg-gray-50 border-l">
              <div className="p-4">
                <div className="flex items-center gap-1 mb-4">
                  <Button
                    variant={activeTab === 'viewer' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab('viewer')}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Viewer
                  </Button>
                  <Button
                    variant={activeTab === 'hotspots' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab('hotspots')}
                    className="flex-1"
                  >
                    <Target className="w-4 h-4 mr-1" />
                    Hotspots
                  </Button>
                  <Button
                    variant={activeTab === 'settings' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab('settings')}
                    className="flex-1"
                  >
                    <Settings className="w-4 h-4 mr-1" />
                    Config
                  </Button>
                </div>

                {activeTab === 'viewer' && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Animações</h4>
                      <div className="space-y-2">
                        {interactionData.animations.map((animation) => (
                          <div key={animation.id} className="flex items-center justify-between p-2 bg-white rounded border">
                            <div>
                              <div className="font-medium text-sm">{animation.name}</div>
                              <div className="text-xs text-gray-500">{animation.duration / 1000}s</div>
                            </div>
                            <Button size="sm" variant="outline">
                              <Play className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Áudio</h4>
                      <div className="space-y-2">
                        {interactionData.sounds.map((sound) => (
                          <div key={sound.id} className="p-2 bg-white rounded border">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">{sound.name}</span>
                              <Button size="sm" variant="ghost">
                                {sound.isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                              </Button>
                            </div>
                            <Slider
                              value={[sound.volume]}
                              max={100}
                              step={1}
                              className="w-full"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'hotspots' && (
                  <div className="space-y-3">
                    {interactionData.hotspots.map((hotspot) => (
                      <div
                        key={hotspot.id}
                        className={`p-3 bg-white rounded border cursor-pointer transition-all ${
                          selectedHotspot === hotspot.id ? 'ring-2 ring-blue-500' : ''
                        }`}
                        onClick={() => handleHotspotClick(hotspot.id)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-3 h-3 rounded-full ${
                            hotspot.type === 'safety' ? 'bg-green-500' :
                            hotspot.type === 'warning' ? 'bg-yellow-500' :
                            hotspot.type === 'info' ? 'bg-blue-500' : 'bg-purple-500'
                          }`} />
                          <span className="font-medium text-sm">{hotspot.title}</span>
                        </div>
                        <p className="text-xs text-gray-600">{hotspot.content}</p>
                        <div className="flex items-center justify-between mt-2">
                          <Badge variant="outline" className="text-xs">
                            {hotspot.type}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setInteractionData(prev => ({
                                ...prev,
                                hotspots: prev.hotspots.map(h =>
                                  h.id === hotspot.id ? { ...h, isActive: !h.isActive } : h
                                )
                              }));
                            }}
                          >
                            {hotspot.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'settings' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Qualidade</label>
                      <select
                        value={viewerSettings.quality}
                        onChange={(e) => handleSettingsChange('quality', e.target.value)}
                        className="w-full p-2 border rounded"
                      >
                        <option value="low">Baixa</option>
                        <option value="medium">Média</option>
                        <option value="high">Alta</option>
                        <option value="ultra">Ultra</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Modo de Renderização</label>
                      <select
                        value={viewerSettings.renderMode}
                        onChange={(e) => handleSettingsChange('renderMode', e.target.value)}
                        className="w-full p-2 border rounded"
                      >
                        <option value="realistic">Realístico</option>
                        <option value="wireframe">Wireframe</option>
                        <option value="xray">Raio-X</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Ambiente</label>
                      <select
                        value={viewerSettings.environment}
                        onChange={(e) => handleSettingsChange('environment', e.target.value)}
                        className="w-full p-2 border rounded"
                      >
                        <option value="studio">Estúdio</option>
                        <option value="outdoor">Externo</option>
                        <option value="indoor">Interno</option>
                        <option value="custom">Personalizado</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Rotação Automática</label>
                        <input
                          type="checkbox"
                          checked={viewerSettings.autoRotate}
                          onChange={(e) => handleSettingsChange('autoRotate', e.target.checked)}
                          className="rounded"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Mostrar Grade</label>
                        <input
                          type="checkbox"
                          checked={viewerSettings.showGrid}
                          onChange={(e) => handleSettingsChange('showGrid', e.target.checked)}
                          className="rounded"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Iluminação</label>
                        <input
                          type="checkbox"
                          checked={viewerSettings.showLighting}
                          onChange={(e) => handleSettingsChange('showLighting', e.target.checked)}
                          className="rounded"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Template3DPreview;