'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useAdvancedEditor } from '@/hooks/useAdvancedEditor';
import type { EditorLayer, Timeline, EditorViewport } from '@/hooks/useAdvancedEditor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  Square, 
  SkipBack, 
  SkipForward,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Layers,
  Clock,
  Settings,
  Download,
  Upload,
  Share2,
  Save,
  Undo,
  Redo,
  Copy,
  Cut,
  Clipboard,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Plus,
  Move,
  MousePointer,
  Type,
  Image,
  Video,
  Music,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Target,
  Zap,
  Brain,
  Shield,
  BarChart3,
  Users,
  FileText,
  Maximize,
  Grid3X3,
  Palette,
  Volume2,
  VolumeX
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ExportFormat = 'json' | 'video' | 'scorm';

export interface WysiwygProjectSnapshot {
  layers: EditorLayer[];
  timeline: Timeline;
  viewport: EditorViewport;
}

interface WYSIWYGEditorProps {
  projectId?: string;
  initialData?: WysiwygProjectSnapshot;
  onSave?: (data: WysiwygProjectSnapshot) => void;
  onExport?: (format: ExportFormat) => void;
  className?: string;
}

export const WYSIWYGEditor: React.FC<WYSIWYGEditorProps> = ({
  projectId,
  initialData,
  onSave,
  onExport,
  className
}) => {
  const editor = useAdvancedEditor();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  
  const [activeTab, setActiveTab] = useState('layers');
  const [activeTool, setActiveTool] = useState('select');
  const [showGrid, setShowGrid] = useState(true);
  const [showRulers, setShowRulers] = useState(true);
  const [previewMode, setPreviewMode] = useState<'2d' | '3d'>('2d');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              editor.redo();
            } else {
              editor.undo();
            }
            break;
          case 'c':
            e.preventDefault();
            editor.copy();
            break;
          case 'x':
            e.preventDefault();
            editor.cut();
            break;
          case 'v':
            e.preventDefault();
            editor.paste();
            break;
          case 's':
            e.preventDefault();
            handleSave();
            break;
          case 'a':
            e.preventDefault();
            editor.selectAll();
            break;
        }
      }
      
      // Tool shortcuts
      switch (e.key) {
        case 'v':
          setActiveTool('select');
          break;
        case 'm':
          setActiveTool('move');
          break;
        case 't':
          setActiveTool('text');
          break;
        case ' ':
          e.preventDefault();
          if (editor.timeline.isPlaying) {
            editor.pause();
          } else {
            editor.play();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor]);

  const handleSave = useCallback(() => {
    const projectData: WysiwygProjectSnapshot = {
      layers: editor.layers,
      timeline: editor.timeline,
      viewport: editor.viewport,
    };
    onSave?.(projectData);
  }, [editor, onSave]);

  const handleExport = useCallback(async (format: ExportFormat) => {
    try {
      const blob = await editor.exportProject(format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `project.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      onExport?.(format);
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, [editor, onExport]);

  const handleFileImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      try {
        await editor.importAsset(file);
      } catch (error) {
        console.error('Import failed:', error);
      }
    }
  }, [editor]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getLayerIcon = (type: string) => {
    switch (type) {
      case 'text': return Type;
      case 'image': return Image;
      case 'video': return Video;
      case 'audio': return Music;
      case 'animation': return Sparkles;
      case 'interaction': return Target;
      case 'safety': return Shield;
      default: return Layers;
    }
  };

  const renderToolbar = () => (
    <div className="flex items-center gap-2 p-2 bg-white border-b">
      {/* File Operations */}
      <div className="flex items-center gap-1 border-r pr-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSave}
          title="Salvar (Ctrl+S)"
        >
          <Save className="w-4 h-4" />
        </Button>
        
        <label>
          <Button
            variant="ghost"
            size="sm"
            title="Importar arquivo"
            asChild
          >
            <span>
              <Upload className="w-4 h-4" />
            </span>
          </Button>
          <input
            type="file"
            multiple
            accept="image/*,video/*,audio/*"
            onChange={handleFileImport}
            className="hidden"
          />
        </label>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleExport('json')}
          title="Exportar projeto"
        >
          <Download className="w-4 h-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.shareProject()}
          title="Compartilhar"
        >
          <Share2 className="w-4 h-4" />
        </Button>
      </div>

      {/* History */}
      <div className="flex items-center gap-1 border-r pr-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={editor.undo}
          disabled={editor.history.currentIndex <= 0}
          title="Desfazer (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={editor.redo}
          disabled={editor.history.currentIndex >= editor.history.states.length - 1}
          title="Refazer (Ctrl+Shift+Z)"
        >
          <Redo className="w-4 h-4" />
        </Button>
      </div>

      {/* Clipboard */}
      <div className="flex items-center gap-1 border-r pr-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={editor.copy}
          disabled={editor.selection.selectedLayers.length === 0}
          title="Copiar (Ctrl+C)"
        >
          <Copy className="w-4 h-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={editor.cut}
          disabled={editor.selection.selectedLayers.length === 0}
          title="Recortar (Ctrl+X)"
        >
          <Cut className="w-4 h-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={editor.paste}
          disabled={!editor.clipboard}
          title="Colar (Ctrl+V)"
        >
          <Clipboard className="w-4 h-4" />
        </Button>
      </div>

      {/* Tools */}
      <div className="flex items-center gap-1 border-r pr-2">
        {[
          { id: 'select', icon: MousePointer, title: 'Selecionar (V)' },
          { id: 'move', icon: Move, title: 'Mover (M)' },
          { id: 'text', icon: Type, title: 'Texto (T)' },
          { id: 'image', icon: Image, title: 'Imagem' },
          { id: 'video', icon: Video, title: 'Vídeo' },
          { id: 'audio', icon: Music, title: 'Áudio' },
          { id: 'animation', icon: Sparkles, title: 'Animação' },
          { id: 'interaction', icon: Target, title: 'Interação' },
          { id: 'safety', icon: Shield, title: 'Segurança' },
        ].map(tool => (
          <Button
            key={tool.id}
            variant={activeTool === tool.id ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTool(tool.id)}
            title={tool.title}
          >
            <tool.icon className="w-4 h-4" />
          </Button>
        ))}
      </div>

      {/* View Options */}
      <div className="flex items-center gap-1 border-r pr-2">
        <Button
          variant={showGrid ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setShowGrid(!showGrid)}
          title="Mostrar grade"
        >
          <Grid3X3 className="w-4 h-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setPreviewMode(previewMode === '2d' ? '3d' : '2d')}
          title={`Modo ${previewMode === '2d' ? '3D' : '2D'}`}
        >
          {previewMode === '2d' ? '3D' : '2D'}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsFullscreen(!isFullscreen)}
          title="Tela cheia"
        >
          <Maximize className="w-4 h-4" />
        </Button>
      </div>

      {/* AI Features */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.optimizeTimeline()}
          disabled={editor.isProcessing}
          title="Otimizar com IA"
        >
          <Brain className="w-4 h-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.validateCompliance()}
          title="Verificar conformidade"
        >
          <CheckCircle className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  const renderPlaybackControls = () => (
    <div className="flex items-center gap-2 p-2 bg-gray-50 border-b">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.setCurrentTime(0)}
        title="Ir para o início"
      >
        <SkipBack className="w-4 h-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={editor.timeline.isPlaying ? editor.pause : editor.play}
        title={editor.timeline.isPlaying ? 'Pausar (Espaço)' : 'Reproduzir (Espaço)'}
      >
        {editor.timeline.isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4" />
        )}
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={editor.stop}
        title="Parar"
      >
        <Square className="w-4 h-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.setCurrentTime(editor.timeline.duration)}
        title="Ir para o fim"
      >
        <SkipForward className="w-4 h-4" />
      </Button>

      <div className="flex items-center gap-2 ml-4">
        <span className="text-sm font-mono">
          {formatTime(editor.timeline.currentTime)}
        </span>
        <span className="text-sm text-gray-500">/</span>
        <span className="text-sm font-mono text-gray-500">
          {formatTime(editor.timeline.duration)}
        </span>
      </div>

      <div className="flex items-center gap-2 ml-4">
        <span className="text-sm">Velocidade:</span>
        <select
          value={editor.timeline.playbackRate}
          onChange={(e) => editor.setPlaybackRate(Number(e.target.value))}
          className="text-sm border rounded px-2 py-1"
        >
          <option value={0.25}>0.25x</option>
          <option value={0.5}>0.5x</option>
          <option value={1}>1x</option>
          <option value={1.5}>1.5x</option>
          <option value={2}>2x</option>
        </select>
      </div>

      {editor.isProcessing && (
        <div className="flex items-center gap-2 ml-auto">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Processando...</span>
        </div>
      )}
    </div>
  );

  const renderCanvas = () => (
    <div className="flex-1 relative bg-gray-100 overflow-hidden">
      {/* Rulers */}
      {showRulers && (
        <>
          <div className="absolute top-0 left-8 right-0 h-8 bg-white border-b flex items-end">
            {/* Horizontal ruler */}
            {Array.from({ length: Math.ceil(editor.viewport.width / 50) }, (_, i) => (
              <div key={i} className="relative" style={{ width: 50 * editor.viewport.zoom }}>
                <div className="absolute bottom-0 left-0 w-px h-2 bg-gray-400" />
                <span className="absolute bottom-0 left-1 text-xs text-gray-500">
                  {i * 50}
                </span>
              </div>
            ))}
          </div>
          
          <div className="absolute top-8 left-0 bottom-0 w-8 bg-white border-r flex flex-col justify-end">
            {/* Vertical ruler */}
            {Array.from({ length: Math.ceil(editor.viewport.height / 50) }, (_, i) => (
              <div key={i} className="relative" style={{ height: 50 * editor.viewport.zoom }}>
                <div className="absolute top-0 right-0 h-px w-2 bg-gray-400" />
                <span 
                  className="absolute top-1 right-1 text-xs text-gray-500 transform -rotate-90 origin-center"
                  style={{ fontSize: '10px' }}
                >
                  {i * 50}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Canvas */}
      <div 
        className={cn(
          "absolute bg-white shadow-lg",
          showRulers ? "top-8 left-8" : "top-4 left-4"
        )}
        style={{
          width: editor.viewport.width * editor.viewport.zoom,
          height: editor.viewport.height * editor.viewport.zoom,
          transform: `translate(${editor.viewport.pan.x}px, ${editor.viewport.pan.y}px)`,
        }}
      >
        <canvas
          ref={canvasRef}
          width={editor.viewport.width}
          height={editor.viewport.height}
          className="w-full h-full"
          style={{
            background: showGrid 
              ? `radial-gradient(circle, #ccc 1px, transparent 1px)` 
              : 'white',
            backgroundSize: showGrid ? '20px 20px' : 'auto',
          }}
        />
        
        {/* Layer previews */}
        {editor.layers
          .filter(layer => layer.visible)
          .map(layer => {
            const LayerIcon = getLayerIcon(layer.type);
            return (
              <div
                key={layer.id}
                className={cn(
                  "absolute border-2 cursor-pointer transition-all",
                  editor.selection.selectedLayers.includes(layer.id)
                    ? "border-blue-500 bg-blue-50"
                    : "border-transparent hover:border-gray-300"
                )}
                style={{
                  left: layer.position.x,
                  top: layer.position.y,
                  width: 100,
                  height: 60,
                  transform: `scale(${layer.scale.x}, ${layer.scale.y}) rotate(${layer.rotation.z}deg)`,
                  opacity: layer.opacity,
                  zIndex: layer.position.z,
                }}
                onClick={() => editor.selectLayer(layer.id)}
              >
                <div className="w-full h-full flex items-center justify-center bg-white rounded">
                  {layer.type === 'image' && layer.content?.src ? (
                    <img 
                      src={layer.content.src} 
                      alt={layer.name}
                      className="w-full h-full object-cover rounded"
                    />
                  ) : layer.type === 'text' ? (
                    <div 
                      className="text-center text-xs"
                      style={{ 
                        fontSize: Math.min(layer.content?.fontSize || 12, 12),
                        color: layer.content?.color || '#000'
                      }}
                    >
                      {layer.content?.text || layer.name}
                    </div>
                  ) : (
                    <LayerIcon className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                
                {layer.locked && (
                  <Lock className="absolute -top-2 -right-2 w-4 h-4 text-red-500 bg-white rounded-full p-0.5" />
                )}
              </div>
            );
          })}
      </div>

      {/* Viewport controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => editor.setViewportZoom(editor.viewport.zoom * 1.2)}
          title="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => editor.setViewportZoom(editor.viewport.zoom / 1.2)}
          title="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={editor.resetViewport}
          title="Reset view"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={editor.fitToContent}
          title="Fit to content"
        >
          <Maximize className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  const renderTimeline = () => (
    <div className="h-48 bg-gray-50 border-t">
      <div className="h-8 bg-white border-b flex items-center px-4">
        <span className="text-sm font-medium">Timeline</span>
        
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs">Zoom:</span>
          <Slider
            value={[editor.timeline.zoom]}
            onValueChange={([zoom]) => editor.setTimelineZoom(zoom)}
            min={0.1}
            max={5}
            step={0.1}
            className="w-20"
          />
        </div>
      </div>
      
      <div 
        ref={timelineRef}
        className="flex-1 relative overflow-x-auto overflow-y-hidden"
        style={{ height: 'calc(100% - 2rem)' }}
      >
        {/* Time ruler */}
        <div className="h-6 bg-gray-100 border-b flex">
          {Array.from({ 
            length: Math.ceil(editor.timeline.duration / 1000) 
          }, (_, i) => (
            <div 
              key={i}
              className="relative border-r border-gray-300"
              style={{ width: 100 * editor.timeline.zoom }}
            >
              <span className="absolute top-0 left-1 text-xs">
                {i}s
              </span>
            </div>
          ))}
        </div>

        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-px bg-red-500 z-10 pointer-events-none"
          style={{
            left: (editor.timeline.currentTime / 1000) * 100 * editor.timeline.zoom,
          }}
        >
          <div className="absolute -top-1 -left-2 w-4 h-4 bg-red-500 transform rotate-45" />
        </div>

        {/* Layer tracks */}
        <div className="flex-1">
          {editor.layers.map((layer, index) => (
            <div 
              key={layer.id}
              className="h-8 border-b border-gray-200 flex items-center relative"
            >
              {/* Layer track */}
              <div
                className={cn(
                  "absolute h-6 rounded border-2 flex items-center px-2",
                  layer.type === 'video' ? 'bg-blue-100 border-blue-300' :
                  layer.type === 'audio' ? 'bg-green-100 border-green-300' :
                  layer.type === 'text' ? 'bg-yellow-100 border-yellow-300' :
                  layer.type === 'image' ? 'bg-purple-100 border-purple-300' :
                  'bg-gray-100 border-gray-300'
                )}
                style={{
                  left: (layer.metadata.startTime / 1000) * 100 * editor.timeline.zoom,
                  width: (layer.metadata.duration / 1000) * 100 * editor.timeline.zoom,
                  top: 4,
                }}
              >
                <span className="text-xs font-medium truncate">
                  {layer.name}
                </span>
              </div>

              {/* Keyframes */}
              {layer.keyframes.map(keyframe => (
                <div
                  key={keyframe.id}
                  className="absolute w-2 h-2 bg-orange-500 rounded-full border border-white cursor-pointer"
                  style={{
                    left: (keyframe.time / 1000) * 100 * editor.timeline.zoom - 4,
                    top: 12,
                  }}
                  onClick={() => editor.selectKeyframe(keyframe.id)}
                  title={`Keyframe at ${formatTime(keyframe.time)}`}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Timeline markers */}
        {editor.timeline.markers.map(marker => (
          <div
            key={marker.id}
            className="absolute top-6 bottom-0 w-px bg-yellow-500 cursor-pointer"
            style={{
              left: (marker.time / 1000) * 100 * editor.timeline.zoom,
            }}
            title={marker.title}
          >
            <div className="absolute -top-1 -left-2 w-4 h-4 bg-yellow-500 rounded-full text-xs flex items-center justify-center text-white">
              {marker.type === 'safety' ? '⚠' : 
               marker.type === 'quiz' ? '?' :
               marker.type === 'checkpoint' ? '✓' : '•'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSidebar = () => (
    <div className="w-80 bg-white border-l flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="layers">
            <Layers className="w-4 h-4 mr-1" />
            Camadas
          </TabsTrigger>
          <TabsTrigger value="properties">
            <Settings className="w-4 h-4 mr-1" />
            Props
          </TabsTrigger>
          <TabsTrigger value="effects">
            <Sparkles className="w-4 h-4 mr-1" />
            Efeitos
          </TabsTrigger>
          <TabsTrigger value="ai">
            <Brain className="w-4 h-4 mr-1" />
            IA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="layers" className="flex-1 p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Camadas</h3>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.addLayer('text')}
                  title="Adicionar camada de texto"
                >
                  <Type className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.addLayer('image')}
                  title="Adicionar camada de imagem"
                >
                  <Image className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => editor.addLayer('safety')}
                  title="Adicionar elemento de segurança"
                >
                  <Shield className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-1 max-h-96 overflow-y-auto">
              {editor.layers.map((layer, index) => {
                const LayerIcon = getLayerIcon(layer.type);
                const isSelected = editor.selection.selectedLayers.includes(layer.id);
                
                return (
                  <div
                    key={layer.id}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded cursor-pointer",
                      isSelected ? "bg-blue-100" : "hover:bg-gray-100"
                    )}
                    onClick={() => editor.selectLayer(layer.id)}
                  >
                    <LayerIcon className="w-4 h-4 text-gray-500" />
                    
                    <span className="flex-1 text-sm truncate">
                      {layer.name}
                    </span>

                    <div className="flex items-center gap-1">
                      {layer.metadata.compliance.warnings.length > 0 && (
                        <AlertTriangle className="w-3 h-3 text-yellow-500" />
                      )}
                      
                      {layer.metadata.compliance.safetyRating >= 90 && (
                        <CheckCircle className="w-3 h-3 text-green-500" />
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          editor.toggleLayerVisibility(layer.id);
                        }}
                        className="p-0 h-auto"
                      >
                        {layer.visible ? (
                          <Eye className="w-3 h-3" />
                        ) : (
                          <EyeOff className="w-3 h-3 text-gray-400" />
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          editor.toggleLayerLock(layer.id);
                        }}
                        className="p-0 h-auto"
                      >
                        {layer.locked ? (
                          <Lock className="w-3 h-3 text-red-500" />
                        ) : (
                          <Unlock className="w-3 h-3" />
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          editor.removeLayer(layer.id);
                        }}
                        className="p-0 h-auto text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="properties" className="flex-1 p-4">
          {editor.selection.selectedLayers.length > 0 ? (
            <div className="space-y-4">
              {editor.selection.selectedLayers.map(layerId => {
                const layer = editor.layers.find(l => l.id === layerId);
                if (!layer) return null;

                return (
                  <Card key={layerId}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{layer.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <label className="text-xs font-medium">Opacidade</label>
                        <Slider
                          value={[layer.opacity * 100]}
                          onValueChange={([opacity]) => 
                            editor.updateLayer(layerId, { opacity: opacity / 100 })
                          }
                          min={0}
                          max={100}
                          step={1}
                          className="mt-1"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs font-medium">X</label>
                          <input
                            type="number"
                            value={layer.position.x}
                            onChange={(e) => 
                              editor.updateLayer(layerId, {
                                position: { ...layer.position, x: Number(e.target.value) }
                              })
                            }
                            className="w-full text-xs border rounded px-1 py-0.5"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium">Y</label>
                          <input
                            type="number"
                            value={layer.position.y}
                            onChange={(e) => 
                              editor.updateLayer(layerId, {
                                position: { ...layer.position, y: Number(e.target.value) }
                              })
                            }
                            className="w-full text-xs border rounded px-1 py-0.5"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium">Z</label>
                          <input
                            type="number"
                            value={layer.position.z}
                            onChange={(e) => 
                              editor.updateLayer(layerId, {
                                position: { ...layer.position, z: Number(e.target.value) }
                              })
                            }
                            className="w-full text-xs border rounded px-1 py-0.5"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs font-medium">Escala X</label>
                          <input
                            type="number"
                            step="0.1"
                            value={layer.scale.x}
                            onChange={(e) => 
                              editor.updateLayer(layerId, {
                                scale: { ...layer.scale, x: Number(e.target.value) }
                              })
                            }
                            className="w-full text-xs border rounded px-1 py-0.5"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium">Escala Y</label>
                          <input
                            type="number"
                            step="0.1"
                            value={layer.scale.y}
                            onChange={(e) => 
                              editor.updateLayer(layerId, {
                                scale: { ...layer.scale, y: Number(e.target.value) }
                              })
                            }
                            className="w-full text-xs border rounded px-1 py-0.5"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium">Rotação</label>
                          <input
                            type="number"
                            value={layer.rotation.z}
                            onChange={(e) => 
                              editor.updateLayer(layerId, {
                                rotation: { ...layer.rotation, z: Number(e.target.value) }
                              })
                            }
                            className="w-full text-xs border rounded px-1 py-0.5"
                          />
                        </div>
                      </div>

                      {layer.type === 'text' && (
                        <div className="space-y-2">
                          <div>
                            <label className="text-xs font-medium">Texto</label>
                            <textarea
                              value={layer.content?.text || ''}
                              onChange={(e) => 
                                editor.updateLayer(layerId, {
                                  content: { ...layer.content, text: e.target.value }
                                })
                              }
                              className="w-full text-xs border rounded px-2 py-1 mt-1"
                              rows={3}
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs font-medium">Tamanho</label>
                              <input
                                type="number"
                                value={layer.content?.fontSize || 16}
                                onChange={(e) => 
                                  editor.updateLayer(layerId, {
                                    content: { ...layer.content, fontSize: Number(e.target.value) }
                                  })
                                }
                                className="w-full text-xs border rounded px-1 py-0.5"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium">Cor</label>
                              <input
                                type="color"
                                value={layer.content?.color || '#000000'}
                                onChange={(e) => 
                                  editor.updateLayer(layerId, {
                                    content: { ...layer.content, color: e.target.value }
                                  })
                                }
                                className="w-full h-6 border rounded"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="pt-2 border-t">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium">Conformidade</span>
                          <Badge 
                            variant={layer.metadata.compliance.safetyRating >= 90 ? 'default' : 'secondary'}
                          >
                            {layer.metadata.compliance.safetyRating}/100
                          </Badge>
                        </div>
                        
                        <Progress 
                          value={layer.metadata.compliance.safetyRating} 
                          className="h-2"
                        />
                        
                        {layer.metadata.compliance.nrStandards.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {layer.metadata.compliance.nrStandards.map(nr => (
                              <Badge key={nr} variant="outline" className="text-xs">
                                {nr}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-gray-500 mt-8">
              <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Selecione uma camada para ver as propriedades</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="effects" className="flex-1 p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Efeitos</h3>
              {editor.selection.selectedLayers.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const layerId = editor.selection.selectedLayers[0];
                    const suggestions = await editor.suggestEffects(layerId);
                    // Show suggestions dialog
                  }}
                >
                  <Zap className="w-4 h-4 mr-1" />
                  Sugerir
                </Button>
              )}
            </div>

            {editor.selection.selectedLayers.length > 0 ? (
              editor.selection.selectedLayers.map(layerId => {
                const layer = editor.layers.find(l => l.id === layerId);
                if (!layer) return null;

                return (
                  <Card key={layerId}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{layer.name} - Efeitos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {layer.effects.length > 0 ? (
                        <div className="space-y-2">
                          {layer.effects.map(effect => (
                            <div key={effect.id} className="flex items-center justify-between p-2 border rounded">
                              <div>
                                <span className="text-sm font-medium">{effect.name}</span>
                                <div className="text-xs text-gray-500">
                                  {effect.type} • {formatTime(effect.duration)}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => 
                                    editor.updateEffect(layerId, effect.id, { 
                                      enabled: !effect.enabled 
                                    })
                                  }
                                  className="p-0 h-auto"
                                >
                                  {effect.enabled ? (
                                    <Eye className="w-3 h-3" />
                                  ) : (
                                    <EyeOff className="w-3 h-3 text-gray-400" />
                                  )}
                                </Button>
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => editor.removeEffect(layerId, effect.id)}
                                  className="p-0 h-auto text-red-500"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 py-4">
                          <Sparkles className="w-6 h-6 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Nenhum efeito aplicado</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="text-center text-gray-500 mt-8">
                <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Selecione uma camada para gerenciar efeitos</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="ai" className="flex-1 p-4">
          <div className="space-y-4">
            <h3 className="font-medium">Assistente de IA</h3>
            
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => editor.optimizeTimeline()}
                disabled={editor.isProcessing}
              >
                <Brain className="w-4 h-4 mr-2" />
                Otimizar Timeline
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => editor.validateCompliance()}
                disabled={editor.isProcessing}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Verificar Conformidade
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => editor.fixComplianceIssues()}
                disabled={editor.isProcessing}
              >
                <Shield className="w-4 h-4 mr-2" />
                Corrigir Problemas
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => editor.generateAccessibilityReport()}
                disabled={editor.isProcessing}
              >
                <FileText className="w-4 h-4 mr-2" />
                Relatório de Acessibilidade
              </Button>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Gerar Conteúdo</h4>
              
              <div className="space-y-2">
                <textarea
                  placeholder="Descreva o conteúdo que deseja gerar..."
                  className="w-full text-sm border rounded px-2 py-1"
                  rows={3}
                />
                
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => editor.generateContent('', 'text')}
                    disabled={editor.isProcessing}
                  >
                    <Type className="w-4 h-4 mr-1" />
                    Texto
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => editor.generateContent('', 'image')}
                    disabled={editor.isProcessing}
                  >
                    <Image className="w-4 h-4 mr-1" />
                    Imagem
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => editor.generateContent('', 'animation')}
                    disabled={editor.isProcessing}
                  >
                    <Sparkles className="w-4 h-4 mr-1" />
                    Animação
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => editor.generateContent('', 'safety')}
                    disabled={editor.isProcessing}
                  >
                    <Shield className="w-4 h-4 mr-1" />
                    Segurança
                  </Button>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Estatísticas do Projeto</h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Camadas:</span>
                  <span>{editor.layers.length}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Duração:</span>
                  <span>{formatTime(editor.timeline.duration)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Keyframes:</span>
                  <span>{editor.layers.reduce((acc, layer) => acc + layer.keyframes.length, 0)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Efeitos:</span>
                  <span>{editor.layers.reduce((acc, layer) => acc + layer.effects.length, 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  if (editor.isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Carregando editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-screen bg-gray-100", className)}>
      {renderToolbar()}
      {renderPlaybackControls()}
      
      <div className="flex flex-1 overflow-hidden">
        {renderCanvas()}
        {renderSidebar()}
      </div>
      
      {renderTimeline()}

      {editor.error && (
        <div className="absolute bottom-4 left-4 bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded">
          {editor.error}
        </div>
      )}
    </div>
  );
};