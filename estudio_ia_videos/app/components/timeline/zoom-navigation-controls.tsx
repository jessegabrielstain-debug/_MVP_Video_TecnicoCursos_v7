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
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Minimize2,
  Move,
  RotateCcw,
  RotateCw,
  Grid3X3,
  Crosshair,
  Navigation,
  MapPin,
  Target,
  Compass,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUp,
  ChevronsDown,
  Home,
  Square,
  Circle,
  MousePointer,
  Hand,
  Grab,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Settings,
  Ruler,
  Clock,
  Calendar,
  Timer,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Rewind,
  FastForward,
  RefreshCw,
  Layers,
  Filter,
  Search,
  Bookmark,
  Star,
  Heart,
  Save,
  Download,
  Upload,
  Copy,
  Scissors,
  Edit,
  Trash2,
  Plus,
  Minus,
  X,
  Check,
  Info,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';

// Interfaces para zoom e navegação
interface ZoomLevel {
  id: string;
  name: string;
  scale: number;
  pixelsPerSecond: number;
  description: string;
  shortcut?: string;
}

interface ViewportSettings {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
  rotation: number;
  centerX: number;
  centerY: number;
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

interface NavigationState {
  currentPosition: { x: number; y: number; time: number };
  targetPosition: { x: number; y: number; time: number };
  isAnimating: boolean;
  animationDuration: number;
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

interface GridSettings {
  enabled: boolean;
  type: 'time' | 'frame' | 'beat' | 'custom';
  majorInterval: number;
  minorInterval: number;
  snapToGrid: boolean;
  showLabels: boolean;
  color: string;
  opacity: number;
  thickness: number;
}

interface RulerSettings {
  enabled: boolean;
  position: 'top' | 'bottom' | 'left' | 'right' | 'all';
  unit: 'seconds' | 'frames' | 'timecode' | 'beats';
  precision: number;
  showTicks: boolean;
  showNumbers: boolean;
  color: string;
  height: number;
}

interface MiniMapSettings {
  enabled: boolean;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  width: number;
  height: number;
  opacity: number;
  showViewport: boolean;
  interactive: boolean;
  autoHide: boolean;
}

interface NavigationTool {
  id: string;
  name: string;
  icon: string;
  description: string;
  cursor: string;
  active: boolean;
  shortcut?: string;
}

interface Bookmark {
  id: string;
  name: string;
  time: number;
  position: { x: number; y: number };
  zoom: number;
  description?: string;
  color: string;
  created: Date;
  tags: string[];
}

interface ZoomPreset {
  id: string;
  name: string;
  scale: number;
  description: string;
  icon: string;
  shortcut?: string;
}

// Presets de zoom predefinidos
const ZOOM_PRESETS: ZoomPreset[] = [
  { id: 'fit_all', name: 'Ajustar Tudo', scale: 0, description: 'Mostra toda a timeline', icon: 'maximize2', shortcut: 'Ctrl+0' },
  { id: 'fit_selection', name: 'Ajustar Seleção', scale: 0, description: 'Ajusta à seleção atual', icon: 'target', shortcut: 'Ctrl+Shift+0' },
  { id: 'zoom_25', name: '25%', scale: 0.25, description: 'Zoom 25%', icon: 'minimize2' },
  { id: 'zoom_50', name: '50%', scale: 0.5, description: 'Zoom 50%', icon: 'minimize2' },
  { id: 'zoom_100', name: '100%', scale: 1.0, description: 'Zoom 100% (Normal)', icon: 'square', shortcut: 'Ctrl+1' },
  { id: 'zoom_200', name: '200%', scale: 2.0, description: 'Zoom 200%', icon: 'maximize2', shortcut: 'Ctrl+2' },
  { id: 'zoom_400', name: '400%', scale: 4.0, description: 'Zoom 400%', icon: 'maximize2' },
  { id: 'zoom_800', name: '800%', scale: 8.0, description: 'Zoom 800%', icon: 'maximize2' }
];

// Ferramentas de navegação
const NAVIGATION_TOOLS: NavigationTool[] = [
  { id: 'select', name: 'Seleção', icon: 'mousePointer', description: 'Ferramenta de seleção', cursor: 'default', active: true, shortcut: 'V' },
  { id: 'pan', name: 'Panorâmica', icon: 'hand', description: 'Mover viewport', cursor: 'grab', active: false, shortcut: 'H' },
  { id: 'zoom', name: 'Zoom', icon: 'zoomIn', description: 'Ferramenta de zoom', cursor: 'zoom-in', active: false, shortcut: 'Z' },
  { id: 'measure', name: 'Medição', icon: 'ruler', description: 'Medir distâncias', cursor: 'crosshair', active: false, shortcut: 'M' }
];

export function ZoomNavigationControls() {
  // Estados principais
  const [viewport, setViewport] = useState<ViewportSettings>({
    x: 0,
    y: 0,
    width: 1920,
    height: 1080,
    scale: 1.0,
    rotation: 0,
    centerX: 960,
    centerY: 540,
    bounds: {
      minX: -9600,
      maxX: 9600,
      minY: -5400,
      maxY: 5400
    }
  });

  const [navigationState, setNavigationState] = useState<NavigationState>({
    currentPosition: { x: 0, y: 0, time: 0 },
    targetPosition: { x: 0, y: 0, time: 0 },
    isAnimating: false,
    animationDuration: 300,
    easing: 'ease-out'
  });

  const [gridSettings, setGridSettings] = useState<GridSettings>({
    enabled: true,
    type: 'time',
    majorInterval: 1.0,
    minorInterval: 0.1,
    snapToGrid: false,
    showLabels: true,
    color: '#444444',
    opacity: 0.5,
    thickness: 1
  });

  const [rulerSettings, setRulerSettings] = useState<RulerSettings>({
    enabled: true,
    position: 'top',
    unit: 'seconds',
    precision: 2,
    showTicks: true,
    showNumbers: true,
    color: '#666666',
    height: 30
  });

  const [miniMapSettings, setMiniMapSettings] = useState<MiniMapSettings>({
    enabled: true,
    position: 'bottom-right',
    width: 200,
    height: 120,
    opacity: 0.8,
    showViewport: true,
    interactive: true,
    autoHide: false
  });

  const [activeTool, setActiveTool] = useState('select');
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [selectedBookmark, setSelectedBookmark] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedTab, setSelectedTab] = useState('zoom');

  // Refs
  const viewportRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);

  // Estados de interação
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Funções de zoom
  const zoomIn = useCallback((factor: number = 1.2, centerX?: number, centerY?: number) => {
    if (isLocked) return;

    setViewport(prev => {
      const newScale = Math.min(prev.scale * factor, 32);
      const cx = centerX ?? prev.centerX;
      const cy = centerY ?? prev.centerY;

      return {
        ...prev,
        scale: newScale,
        centerX: cx,
        centerY: cy
      };
    });
  }, [isLocked]);

  const zoomOut = useCallback((factor: number = 1.2, centerX?: number, centerY?: number) => {
    if (isLocked) return;

    setViewport(prev => {
      const newScale = Math.max(prev.scale / factor, 0.01);
      const cx = centerX ?? prev.centerX;
      const cy = centerY ?? prev.centerY;

      return {
        ...prev,
        scale: newScale,
        centerX: cx,
        centerY: cy
      };
    });
  }, [isLocked]);

  const setZoom = useCallback((scale: number, centerX?: number, centerY?: number) => {
    if (isLocked) return;

    setViewport(prev => ({
      ...prev,
      scale: Math.max(0.01, Math.min(32, scale)),
      centerX: centerX ?? prev.centerX,
      centerY: centerY ?? prev.centerY
    }));
  }, [isLocked]);

  const fitToView = useCallback((bounds?: { x: number; y: number; width: number; height: number }) => {
    if (isLocked) return;

    const targetBounds = bounds || {
      x: viewport.bounds.minX,
      y: viewport.bounds.minY,
      width: viewport.bounds.maxX - viewport.bounds.minX,
      height: viewport.bounds.maxY - viewport.bounds.minY
    };

    const scaleX = viewport.width / targetBounds.width;
    const scaleY = viewport.height / targetBounds.height;
    const scale = Math.min(scaleX, scaleY) * 0.9; // 90% para margem

    setViewport(prev => ({
      ...prev,
      scale,
      centerX: targetBounds.x + targetBounds.width / 2,
      centerY: targetBounds.y + targetBounds.height / 2
    }));
  }, [isLocked, viewport.width, viewport.height, viewport.bounds]);

  // Funções de navegação
  const panTo = useCallback((x: number, y: number, animated: boolean = true) => {
    if (isLocked) return;

    if (animated) {
      setNavigationState(prev => ({
        ...prev,
        targetPosition: { x, y, time: Date.now() },
        isAnimating: true
      }));
    } else {
      setViewport(prev => ({
        ...prev,
        centerX: x,
        centerY: y
      }));
    }
  }, [isLocked]);

  const panBy = useCallback((deltaX: number, deltaY: number) => {
    if (isLocked) return;

    setViewport(prev => ({
      ...prev,
      centerX: prev.centerX + deltaX / prev.scale,
      centerY: prev.centerY + deltaY / prev.scale
    }));
  }, [isLocked]);

  const resetView = useCallback(() => {
    if (isLocked) return;

    setViewport(prev => ({
      ...prev,
      scale: 1.0,
      rotation: 0,
      centerX: 0,
      centerY: 0
    }));
  }, [isLocked]);

  // Funções de bookmarks
  const addBookmark = useCallback((name: string, description?: string) => {
    const bookmark: Bookmark = {
      id: `bookmark_${Date.now()}`,
      name,
      time: navigationState.currentPosition.time,
      position: { x: viewport.centerX, y: viewport.centerY },
      zoom: viewport.scale,
      description,
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      created: new Date(),
      tags: []
    };

    setBookmarks(prev => [...prev, bookmark]);
  }, [navigationState.currentPosition.time, viewport.centerX, viewport.centerY, viewport.scale]);

  const goToBookmark = useCallback((bookmarkId: string) => {
    const bookmark = bookmarks.find(b => b.id === bookmarkId);
    if (!bookmark) return;

    setZoom(bookmark.zoom, bookmark.position.x, bookmark.position.y);
    panTo(bookmark.position.x, bookmark.position.y);
    setSelectedBookmark(bookmarkId);
  }, [bookmarks, setZoom, panTo]);

  const removeBookmark = useCallback((bookmarkId: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
    if (selectedBookmark === bookmarkId) {
      setSelectedBookmark(null);
    }
  }, [selectedBookmark]);

  // Animação de navegação
  useEffect(() => {
    if (!navigationState.isAnimating) return;

    const startTime = Date.now();
    const startPos = navigationState.currentPosition;
    const targetPos = navigationState.targetPosition;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / navigationState.animationDuration, 1);

      // Aplicar easing
      let easedProgress = progress;
      switch (navigationState.easing) {
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
      }

      const currentX = startPos.x + (targetPos.x - startPos.x) * easedProgress;
      const currentY = startPos.y + (targetPos.y - startPos.y) * easedProgress;

      setViewport(prev => ({
        ...prev,
        centerX: currentX,
        centerY: currentY
      }));

      setNavigationState(prev => ({
        ...prev,
        currentPosition: { x: currentX, y: currentY, time: targetPos.time }
      }));

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setNavigationState(prev => ({ ...prev, isAnimating: false }));
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [navigationState.isAnimating, navigationState.animationDuration, navigationState.easing]);

  // Handlers de mouse
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isLocked) return;

    setIsMouseDown(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    isDragging.current = false;

    if (activeTool === 'pan') {
      e.preventDefault();
    }
  }, [isLocked, activeTool]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });

    if (!isMouseDown || isLocked) return;

    const deltaX = e.clientX - lastMousePos.current.x;
    const deltaY = e.clientY - lastMousePos.current.y;

    if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
      isDragging.current = true;
    }

    if (activeTool === 'pan' && isDragging.current) {
      panBy(-deltaX, -deltaY);
    }

    lastMousePos.current = { x: e.clientX, y: e.clientY };
  }, [isMouseDown, isLocked, activeTool, panBy]);

  const handleMouseUp = useCallback(() => {
    setIsMouseDown(false);
    isDragging.current = false;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (isLocked) return;

    e.preventDefault();

    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return;

    const centerX = e.clientX - rect.left;
    const centerY = e.clientY - rect.top;

    if (e.deltaY < 0) {
      zoomIn(1.1, centerX, centerY);
    } else {
      zoomOut(1.1, centerX, centerY);
    }
  }, [isLocked, zoomIn, zoomOut]);

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLocked) return;

      const isCtrl = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;

      switch (e.key) {
        case '0':
          if (isCtrl) {
            e.preventDefault();
            if (isShift) {
              // Fit selection (simulado)
              fitToView();
            } else {
              // Fit all
              fitToView();
            }
          }
          break;
        case '1':
          if (isCtrl) {
            e.preventDefault();
            setZoom(1.0);
          }
          break;
        case '2':
          if (isCtrl) {
            e.preventDefault();
            setZoom(2.0);
          }
          break;
        case '+':
        case '=':
          if (isCtrl) {
            e.preventDefault();
            zoomIn();
          }
          break;
        case '-':
          if (isCtrl) {
            e.preventDefault();
            zoomOut();
          }
          break;
        case 'v':
        case 'V':
          if (!isCtrl) {
            setActiveTool('select');
          }
          break;
        case 'h':
        case 'H':
          if (!isCtrl) {
            setActiveTool('pan');
          }
          break;
        case 'z':
        case 'Z':
          if (!isCtrl) {
            setActiveTool('zoom');
          }
          break;
        case 'm':
        case 'M':
          if (!isCtrl) {
            setActiveTool('measure');
          }
          break;
        case 'ArrowUp':
          if (!isCtrl) {
            e.preventDefault();
            panBy(0, -50);
          }
          break;
        case 'ArrowDown':
          if (!isCtrl) {
            e.preventDefault();
            panBy(0, 50);
          }
          break;
        case 'ArrowLeft':
          if (!isCtrl) {
            e.preventDefault();
            panBy(-50, 0);
          }
          break;
        case 'ArrowRight':
          if (!isCtrl) {
            e.preventDefault();
            panBy(50, 0);
          }
          break;
        case 'Home':
          e.preventDefault();
          resetView();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLocked, fitToView, setZoom, zoomIn, zoomOut, panBy, resetView]);

  return (
    <div className="w-full h-full bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold">Zoom e Navegação</h2>
            <Badge variant="outline" className="text-blue-400 border-blue-400">
              {Math.round(viewport.scale * 100)}%
            </Badge>
            <Badge variant="outline" className="text-green-400 border-green-400">
              {viewport.centerX.toFixed(0)}, {viewport.centerY.toFixed(0)}
            </Badge>
          </div>

          <div className="flex items-center space-x-2">
            {/* Controles de zoom rápido */}
            <Button
              onClick={() => zoomOut()}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>

            <div className="w-32">
              <Slider
                value={[Math.log2(viewport.scale) * 10 + 50]}
                onValueChange={([value]) => {
                  const scale = Math.pow(2, (value - 50) / 10);
                  setZoom(scale);
                }}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
            </div>

            <Button
              onClick={() => zoomIn()}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>

            <Button
              onClick={() => fitToView()}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              <Maximize2 className="w-4 h-4 mr-1" />
              Ajustar
            </Button>

            <Button
              onClick={() => setIsLocked(!isLocked)}
              size="sm"
              className={isLocked ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'}
            >
              {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
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

        {/* Ferramentas de navegação */}
        <div className="mt-3 flex items-center space-x-2">
          {NAVIGATION_TOOLS.map((tool) => (
            <Button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              size="sm"
              className={`${
                activeTool === tool.id 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              title={`${tool.description} (${tool.shortcut})`}
            >
              {tool.icon === 'mousePointer' && <MousePointer className="w-4 h-4" />}
              {tool.icon === 'hand' && <Hand className="w-4 h-4" />}
              {tool.icon === 'zoomIn' && <ZoomIn className="w-4 h-4" />}
              {tool.icon === 'ruler' && <Ruler className="w-4 h-4" />}
              <span className="ml-1 text-xs">{tool.name}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Área principal */}
      <div className="flex-1 flex">
        {/* Painel de controles */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1">
            <TabsList className="grid w-full grid-cols-4 bg-gray-700">
              <TabsTrigger value="zoom">Zoom</TabsTrigger>
              <TabsTrigger value="navigation">Navegação</TabsTrigger>
              <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
              <TabsTrigger value="grid">Grade</TabsTrigger>
            </TabsList>

            <TabsContent value="zoom" className="flex-1 p-4">
              <div className="space-y-4">
                <Card className="bg-gray-700 border-gray-600">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Presets de Zoom</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {ZOOM_PRESETS.map((preset) => (
                      <Button
                        key={preset.id}
                        onClick={() => {
                          if (preset.id === 'fit_all' || preset.id === 'fit_selection') {
                            fitToView();
                          } else {
                            setZoom(preset.scale);
                          }
                        }}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-gray-300 border-gray-600 hover:bg-gray-600"
                      >
                        {preset.icon === 'maximize2' && <Maximize2 className="w-4 h-4 mr-2" />}
                        {preset.icon === 'minimize2' && <Minimize2 className="w-4 h-4 mr-2" />}
                        {preset.icon === 'square' && <Square className="w-4 h-4 mr-2" />}
                        {preset.icon === 'target' && <Target className="w-4 h-4 mr-2" />}
                        <span>{preset.name}</span>
                        {preset.shortcut && (
                          <Badge variant="outline" className="ml-auto text-xs text-gray-400 border-gray-500">
                            {preset.shortcut}
                          </Badge>
                        )}
                      </Button>
                    ))}
                  </CardContent>
                </Card>

                <Card className="bg-gray-700 border-gray-600">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Controle Preciso</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm">Zoom ({Math.round(viewport.scale * 100)}%)</Label>
                      <Slider
                        value={[viewport.scale]}
                        onValueChange={([value]) => setZoom(value)}
                        min={0.01}
                        max={32}
                        step={0.01}
                        className="mt-2"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Centro X</Label>
                        <Input
                          type="number"
                          value={viewport.centerX.toFixed(0)}
                          onChange={(e) => {
                            const x = parseFloat(e.target.value) || 0;
                            setViewport(prev => ({ ...prev, centerX: x }));
                          }}
                          className="bg-gray-600 border-gray-500 text-white text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Centro Y</Label>
                        <Input
                          type="number"
                          value={viewport.centerY.toFixed(0)}
                          onChange={(e) => {
                            const y = parseFloat(e.target.value) || 0;
                            setViewport(prev => ({ ...prev, centerY: y }));
                          }}
                          className="bg-gray-600 border-gray-500 text-white text-sm"
                        />
                      </div>
                    </div>

                    <Button
                      onClick={resetView}
                      size="sm"
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      <Home className="w-4 h-4 mr-2" />
                      Resetar Vista
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="navigation" className="flex-1 p-4">
              <div className="space-y-4">
                <Card className="bg-gray-700 border-gray-600">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Controles Direcionais</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2">
                      <div></div>
                      <Button
                        onClick={() => panBy(0, -100)}
                        size="sm"
                        className="bg-gray-600 hover:bg-gray-500"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                      <div></div>

                      <Button
                        onClick={() => panBy(-100, 0)}
                        size="sm"
                        className="bg-gray-600 hover:bg-gray-500"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={resetView}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Home className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => panBy(100, 0)}
                        size="sm"
                        className="bg-gray-600 hover:bg-gray-500"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Button>

                      <div></div>
                      <Button
                        onClick={() => panBy(0, 100)}
                        size="sm"
                        className="bg-gray-600 hover:bg-gray-500"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                      <div></div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-700 border-gray-600">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Animação</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm">Duração ({navigationState.animationDuration}ms)</Label>
                      <Slider
                        value={[navigationState.animationDuration]}
                        onValueChange={([value]) => setNavigationState(prev => ({ ...prev, animationDuration: value }))}
                        min={100}
                        max={2000}
                        step={50}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label className="text-sm">Easing</Label>
                      <Select 
                        value={navigationState.easing} 
                        onValueChange={(value: string) => setNavigationState((prev: NavigationState) => ({ ...prev, easing: value as NavigationState['easing'] }))}
                      >
                        <SelectTrigger className="bg-gray-600 border-gray-500 mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="linear">Linear</SelectItem>
                          <SelectItem value="ease-in">Ease In</SelectItem>
                          <SelectItem value="ease-out">Ease Out</SelectItem>
                          <SelectItem value="ease-in-out">Ease In-Out</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="bookmarks" className="flex-1 p-4">
              <div className="space-y-4">
                <Button
                  onClick={() => {
                    const name = prompt('Nome do bookmark:');
                    if (name) addBookmark(name);
                  }}
                  size="sm"
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Bookmark className="w-4 h-4 mr-2" />
                  Adicionar Bookmark
                </Button>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {bookmarks.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                      <MapPin className="w-8 h-8 mx-auto mb-2" />
                      <p>Nenhum bookmark criado</p>
                    </div>
                  ) : (
                    bookmarks.map((bookmark) => (
                      <Card 
                        key={bookmark.id}
                        className={`bg-gray-700 border-gray-600 cursor-pointer transition-all hover:bg-gray-650 ${
                          selectedBookmark === bookmark.id ? 'ring-2 ring-blue-500' : ''
                        }`}
                        onClick={() => goToBookmark(bookmark.id)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div 
                                className="w-4 h-4 rounded-full" 
                                style={{ backgroundColor: bookmark.color }}
                              ></div>
                              <div>
                                <h4 className="font-medium text-sm">{bookmark.name}</h4>
                                <p className="text-xs text-gray-400">
                                  {bookmark.position.x.toFixed(0)}, {bookmark.position.y.toFixed(0)} • {Math.round(bookmark.zoom * 100)}%
                                </p>
                              </div>
                            </div>
                            
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeBookmark(bookmark.id);
                              }}
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>

                          {bookmark.description && (
                            <p className="text-xs text-gray-400 mt-2">{bookmark.description}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="grid" className="flex-1 p-4">
              <div className="space-y-4">
                <Card className="bg-gray-700 border-gray-600">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Configurações da Grade</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      onClick={() => setGridSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
                      size="sm"
                      className={`w-full ${gridSettings.enabled 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-600 text-gray-300'
                      }`}
                    >
                      <Grid3X3 className="w-4 h-4 mr-2" />
                      Grade: {gridSettings.enabled ? 'ON' : 'OFF'}
                    </Button>

                    <div>
                      <Label className="text-sm">Tipo de Grade</Label>
                      <Select 
                        value={gridSettings.type} 
                        onValueChange={(value: string) => setGridSettings((prev: GridSettings) => ({ ...prev, type: value as GridSettings['type'] }))}
                      >
                        <SelectTrigger className="bg-gray-600 border-gray-500 mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="time">Tempo</SelectItem>
                          <SelectItem value="frame">Frame</SelectItem>
                          <SelectItem value="beat">Beat</SelectItem>
                          <SelectItem value="custom">Personalizado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm">Intervalo Principal ({gridSettings.majorInterval}s)</Label>
                      <Slider
                        value={[gridSettings.majorInterval]}
                        onValueChange={([value]) => setGridSettings(prev => ({ ...prev, majorInterval: value }))}
                        min={0.1}
                        max={10}
                        step={0.1}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label className="text-sm">Intervalo Menor ({gridSettings.minorInterval}s)</Label>
                      <Slider
                        value={[gridSettings.minorInterval]}
                        onValueChange={([value]) => setGridSettings(prev => ({ ...prev, minorInterval: value }))}
                        min={0.01}
                        max={1}
                        step={0.01}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label className="text-sm">Opacidade ({Math.round(gridSettings.opacity * 100)}%)</Label>
                      <Slider
                        value={[gridSettings.opacity]}
                        onValueChange={([value]) => setGridSettings(prev => ({ ...prev, opacity: value }))}
                        min={0.1}
                        max={1}
                        step={0.1}
                        className="mt-2"
                      />
                    </div>

                    <div className="space-y-2">
                      <Button
                        onClick={() => setGridSettings(prev => ({ ...prev, snapToGrid: !prev.snapToGrid }))}
                        variant="outline"
                        size="sm"
                        className={`w-full ${gridSettings.snapToGrid 
                          ? 'bg-blue-600 text-white' 
                          : 'text-gray-300 border-gray-600'
                        }`}
                      >
                        <Target className="w-4 h-4 mr-2" />
                        Snap to Grid: {gridSettings.snapToGrid ? 'ON' : 'OFF'}
                      </Button>

                      <Button
                        onClick={() => setGridSettings(prev => ({ ...prev, showLabels: !prev.showLabels }))}
                        variant="outline"
                        size="sm"
                        className={`w-full ${gridSettings.showLabels 
                          ? 'bg-purple-600 text-white' 
                          : 'text-gray-300 border-gray-600'
                        }`}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Labels: {gridSettings.showLabels ? 'ON' : 'OFF'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-700 border-gray-600">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Régua</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      onClick={() => setRulerSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
                      size="sm"
                      className={`w-full ${rulerSettings.enabled 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-600 text-gray-300'
                      }`}
                    >
                      <Ruler className="w-4 h-4 mr-2" />
                      Régua: {rulerSettings.enabled ? 'ON' : 'OFF'}
                    </Button>

                    <div>
                      <Label className="text-sm">Unidade</Label>
                      <Select 
                        value={rulerSettings.unit} 
                        onValueChange={(value: string) => setRulerSettings((prev: RulerSettings) => ({ ...prev, unit: value as RulerSettings['unit'] }))}
                      >
                        <SelectTrigger className="bg-gray-600 border-gray-500 mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="seconds">Segundos</SelectItem>
                          <SelectItem value="frames">Frames</SelectItem>
                          <SelectItem value="timecode">Timecode</SelectItem>
                          <SelectItem value="beats">Beats</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm">Posição</Label>
                      <Select 
                        value={rulerSettings.position} 
                        onValueChange={(value: string) => setRulerSettings((prev: RulerSettings) => ({ ...prev, position: value as RulerSettings['position'] }))}
                      >
                        <SelectTrigger className="bg-gray-600 border-gray-500 mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="top">Superior</SelectItem>
                          <SelectItem value="bottom">Inferior</SelectItem>
                          <SelectItem value="left">Esquerda</SelectItem>
                          <SelectItem value="right">Direita</SelectItem>
                          <SelectItem value="all">Todas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Viewport principal */}
        <div className="flex-1 bg-gray-900 relative overflow-hidden">
          <div
            ref={viewportRef}
            className="w-full h-full relative cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
            style={{
              cursor: activeTool === 'pan' ? 'grab' : 
                     activeTool === 'zoom' ? 'zoom-in' :
                     activeTool === 'measure' ? 'crosshair' : 'default'
            }}
          >
            {/* Grade de fundo */}
            {gridSettings.enabled && (
              <div className="absolute inset-0 pointer-events-none">
                <svg className="w-full h-full">
                  <defs>
                    <pattern
                      id="grid"
                      width={gridSettings.majorInterval * 50}
                      height={gridSettings.majorInterval * 50}
                      patternUnits="userSpaceOnUse"
                    >
                      <path
                        d={`M ${gridSettings.majorInterval * 50} 0 L 0 0 0 ${gridSettings.majorInterval * 50}`}
                        fill="none"
                        stroke={gridSettings.color}
                        strokeWidth={gridSettings.thickness}
                        opacity={gridSettings.opacity}
                      />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
              </div>
            )}

            {/* Régua */}
            {rulerSettings.enabled && (
              <div className="absolute top-0 left-0 right-0 bg-gray-800 border-b border-gray-600 flex items-center justify-center text-xs text-gray-400" style={{ height: rulerSettings.height }}>
                <div className="flex items-center space-x-4">
                  <Clock className="w-4 h-4" />
                  <span>{viewport.centerX.toFixed(rulerSettings.precision)} {rulerSettings.unit}</span>
                  <span>|</span>
                  <span>Zoom: {Math.round(viewport.scale * 100)}%</span>
                </div>
              </div>
            )}

            {/* Área de conteúdo da timeline */}
            <div 
              className="absolute inset-0 bg-gray-800 border border-gray-600 rounded-lg m-4"
              style={{
                transform: `translate(${viewport.centerX}px, ${viewport.centerY}px) scale(${viewport.scale}) rotate(${viewport.rotation}deg)`,
                transformOrigin: 'center'
              }}
            >
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Navigation className="w-16 h-16 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Viewport da Timeline</h3>
                  <p>Use as ferramentas de navegação para explorar</p>
                  <div className="mt-4 text-sm">
                    <p>Posição: {viewport.centerX.toFixed(0)}, {viewport.centerY.toFixed(0)}</p>
                    <p>Zoom: {Math.round(viewport.scale * 100)}%</p>
                    <p>Ferramenta: {NAVIGATION_TOOLS.find(t => t.id === activeTool)?.name}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mini-mapa */}
            {miniMapSettings.enabled && (
              <div 
                className={`absolute bg-gray-800 border border-gray-600 rounded ${
                  miniMapSettings.position === 'top-left' ? 'top-4 left-4' :
                  miniMapSettings.position === 'top-right' ? 'top-4 right-4' :
                  miniMapSettings.position === 'bottom-left' ? 'bottom-4 left-4' :
                  'bottom-4 right-4'
                }`}
                style={{
                  width: miniMapSettings.width,
                  height: miniMapSettings.height,
                  opacity: miniMapSettings.opacity
                }}
              >
                <div className="w-full h-full bg-gray-700 rounded flex items-center justify-center text-xs text-gray-400">
                  <div className="text-center">
                    <MapPin className="w-6 h-6 mx-auto mb-1" />
                    <p>Mini-mapa</p>
                  </div>
                </div>
                
                {/* Indicador do viewport */}
                {miniMapSettings.showViewport && (
                  <div 
                    className="absolute border-2 border-blue-400 bg-blue-400 bg-opacity-20"
                    style={{
                      left: '25%',
                      top: '25%',
                      width: '50%',
                      height: '50%'
                    }}
                  />
                )}
              </div>
            )}

            {/* Indicador de posição do mouse */}
            <div 
              className="absolute pointer-events-none text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded border border-gray-600"
              style={{
                left: mousePosition.x + 10,
                top: mousePosition.y - 30,
                display: isMouseDown ? 'block' : 'none'
              }}
            >
              {mousePosition.x}, {mousePosition.y}
            </div>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="bg-gray-800 border-t border-gray-700 p-2 flex items-center justify-between text-sm text-gray-400">
        <div className="flex items-center space-x-4">
          <span>Zoom: {Math.round(viewport.scale * 100)}%</span>
          <span>Posição: {viewport.centerX.toFixed(0)}, {viewport.centerY.toFixed(0)}</span>
          <span>Ferramenta: {NAVIGATION_TOOLS.find(t => t.id === activeTool)?.name}</span>
          <span>Bookmarks: {bookmarks.length}</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>Grade: {gridSettings.enabled ? 'ON' : 'OFF'}</span>
          <span>Régua: {rulerSettings.enabled ? 'ON' : 'OFF'}</span>
          <span>Bloqueado: {isLocked ? 'SIM' : 'NÃO'}</span>
          {navigationState.isAnimating && <span className="text-yellow-400">Animando...</span>}
        </div>
      </div>
    </div>
  );
}