'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Type,
  Image,
  Video,
  Volume2,
  Square,
  User,
  MousePointer,
  HelpCircle,
  Play,
  Pause,
  Square as StopIcon,
  SkipBack,
  SkipForward,
  ZoomIn,
  ZoomOut,
  Grid,
  Layers,
  Copy,
  Scissors,
  Clipboard,
  Undo,
  Redo,
  Download,
  Upload,
  Settings,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  RotateCw,
  Move,
  Maximize,
  Plus,
  Minus,
  Save,
  FolderOpen,
  FileText,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline
} from 'lucide-react';
import { useWYSIWYGEditor, EditorElement, Layer, Animation, Keyframe, Timeline } from '@/hooks/useWYSIWYGEditor';
import { useToast } from '@/hooks/use-toast';

interface ToolbarProps {
  onAddElement: (type: EditorElement['type']) => void;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onToggleGrid: () => void;
  onSave: () => void;
  onLoad: () => void;
  isPlaying: boolean;
  canUndo: boolean;
  canRedo: boolean;
  zoom: number;
  gridEnabled: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({
  onAddElement,
  onPlay,
  onPause,
  onStop,
  onUndo,
  onRedo,
  onCopy,
  onCut,
  onPaste,
  onZoomIn,
  onZoomOut,
  onToggleGrid,
  onSave,
  onLoad,
  isPlaying,
  canUndo,
  canRedo,
  zoom,
  gridEnabled
}) => {
  const elementTypes: Array<{ type: EditorElement['type']; icon: React.ReactNode; label: string }> = [
    { type: 'text', icon: <Type className="h-4 w-4" />, label: 'Texto' },
    { type: 'image', icon: <Image className="h-4 w-4" />, label: 'Imagem' },
    { type: 'video', icon: <Video className="h-4 w-4" />, label: 'Vídeo' },
    { type: 'audio', icon: <Volume2 className="h-4 w-4" />, label: 'Áudio' },
    { type: 'shape', icon: <Square className="h-4 w-4" />, label: 'Forma' },
    { type: 'avatar', icon: <User className="h-4 w-4" />, label: 'Avatar' },
    { type: 'button', icon: <MousePointer className="h-4 w-4" />, label: 'Botão' },
    { type: 'quiz', icon: <HelpCircle className="h-4 w-4" />, label: 'Quiz' }
  ];

  return (
    <div className="flex items-center justify-between p-4 border-b bg-background">
      {/* Element Tools */}
      <div className="flex items-center space-x-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {elementTypes.map(({ type, icon, label }) => (
              <DropdownMenuItem key={type} onClick={() => onAddElement(type)}>
                {icon}
                <span className="ml-2">{label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Separator orientation="vertical" className="h-6" />
        
        {/* Edit Tools */}
        <Button variant="outline" size="sm" onClick={onUndo} disabled={!canUndo}>
          <Undo className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={onRedo} disabled={!canRedo}>
          <Redo className="h-4 w-4" />
        </Button>
        
        <Separator orientation="vertical" className="h-6" />
        
        <Button variant="outline" size="sm" onClick={onCopy}>
          <Copy className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={onCut}>
          <Scissors className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={onPaste}>
          <Clipboard className="h-4 w-4" />
        </Button>
      </div>

      {/* Timeline Controls */}
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" onClick={onStop}>
          <StopIcon className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={isPlaying ? onPause : onPlay}>
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
      </div>

      {/* View Tools */}
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" onClick={onZoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium min-w-[60px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <Button variant="outline" size="sm" onClick={onZoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        
        <Button 
          variant={gridEnabled ? "default" : "outline"} 
          size="sm" 
          onClick={onToggleGrid}
        >
          <Grid className="h-4 w-4" />
        </Button>
        
        <Separator orientation="vertical" className="h-6" />
        
        <Button variant="outline" size="sm" onClick={onSave}>
          <Save className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={onLoad}>
          <FolderOpen className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

interface CanvasElementProps {
  element: EditorElement;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<EditorElement>) => void;
  onStartDrag: (startPosition: { x: number; y: number }) => void;
  zoom: number;
}

const CanvasElement: React.FC<CanvasElementProps> = ({
  element,
  isSelected,
  onSelect,
  onUpdate,
  onStartDrag,
  zoom
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(element.content || '');

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    onStartDrag({ x: e.clientX, y: e.clientY });
  };

  const handleDoubleClick = () => {
    if (element.type === 'text' || element.type === 'button') {
      setIsEditing(true);
      setEditContent(element.content || '');
    }
  };

  const handleContentSave = () => {
    onUpdate({ content: editContent });
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleContentSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditContent(element.content || '');
    }
  };

  const renderElementContent = () => {
    switch (element.type) {
      case 'text':
        return isEditing ? (
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onBlur={handleContentSave}
            onKeyDown={handleKeyDown}
            className="w-full h-full resize-none border-none bg-transparent"
            style={{
              fontSize: element.style?.fontSize || 16,
              fontFamily: element.style?.fontFamily || 'Arial',
              color: element.style?.color || '#000',
              textAlign: element.style?.textAlign || 'left'
            }}
            autoFocus
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center p-2"
            style={{
              fontSize: element.style?.fontSize || 16,
              fontFamily: element.style?.fontFamily || 'Arial',
              color: element.style?.color || '#000',
              textAlign: element.style?.textAlign || 'left',
              fontWeight: element.style?.fontWeight || 'normal'
            }}
          >
            {element.content || 'Texto'}
          </div>
        );
      
      case 'button':
        return (
          <button
            className="w-full h-full rounded border border-gray-300 bg-blue-500 text-white hover:bg-blue-600 transition-colors"
            style={{
              fontSize: element.style?.fontSize || 14,
              fontFamily: element.style?.fontFamily || 'Arial',
              backgroundColor: element.style?.backgroundColor || '#3b82f6'
            }}
          >
            {element.content || 'Botão'}
          </button>
        );
      
      case 'image':
        return (
          <div className="w-full h-full bg-gray-200 border-2 border-dashed border-gray-400 flex items-center justify-center">
            {element.src ? (
              <img src={element.src} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center text-gray-500">
                <Image className="h-8 w-8 mx-auto mb-2" />
                <span className="text-sm">Imagem</span>
              </div>
            )}
          </div>
        );
      
      case 'video':
        return (
          <div className="w-full h-full bg-gray-900 border-2 border-dashed border-gray-400 flex items-center justify-center">
            {element.src ? (
              <video src={element.src} className="w-full h-full object-cover" controls />
            ) : (
              <div className="text-center text-white">
                <Video className="h-8 w-8 mx-auto mb-2" />
                <span className="text-sm">Vídeo</span>
              </div>
            )}
          </div>
        );
      
      case 'audio':
        return (
          <div className="w-full h-full bg-gray-100 border border-gray-300 flex items-center justify-center">
            {element.src ? (
              <audio src={element.src} controls className="w-full" />
            ) : (
              <div className="text-center text-gray-600">
                <Volume2 className="h-6 w-6 mx-auto mb-1" />
                <span className="text-xs">Áudio</span>
              </div>
            )}
          </div>
        );
      
      case 'shape':
        return (
          <div
            className="w-full h-full border-2"
            style={{
              backgroundColor: element.style?.backgroundColor || '#e5e7eb',
              borderColor: element.style?.border || '#9ca3af',
              borderRadius: element.style?.borderRadius || 0
            }}
          />
        );
      
      case 'avatar':
        return (
          <div className="w-full h-full bg-gradient-to-b from-blue-400 to-blue-600 border border-gray-300 flex items-center justify-center text-white">
            <div className="text-center">
              <User className="h-12 w-12 mx-auto mb-2" />
              <span className="text-sm">Avatar 3D</span>
            </div>
          </div>
        );
      
      case 'quiz':
        return (
          <div className="w-full h-full bg-yellow-50 border-2 border-yellow-300 p-4">
            <div className="text-center">
              <HelpCircle className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
              <h3 className="font-semibold text-yellow-800">Quiz Interativo</h3>
              <p className="text-sm text-yellow-700 mt-1">Pergunta de exemplo</p>
            </div>
          </div>
        );
      
      default:
        return <div className="w-full h-full bg-gray-200" />;
    }
  };

  return (
    <div
      className={`absolute cursor-move ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      style={{
        left: element.position.x * zoom,
        top: element.position.y * zoom,
        width: element.size.width * zoom,
        height: element.size.height * zoom,
        transform: `rotate(${element.rotation}deg)`,
        opacity: element.opacity,
        zIndex: element.zIndex,
        visibility: element.visible ? 'visible' : 'hidden'
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {renderElementContent()}
      
      {/* Selection handles */}
      {isSelected && (
        <>
          <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 border border-white cursor-nw-resize" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 border border-white cursor-ne-resize" />
          <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 border border-white cursor-sw-resize" />
          <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 border border-white cursor-se-resize" />
        </>
      )}
    </div>
  );
};

interface PropertiesPanelProps {
  selectedElements: EditorElement[];
  onUpdateElement: (id: string, updates: Partial<EditorElement>) => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedElements,
  onUpdateElement
}) => {
  if (selectedElements.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Selecione um elemento para editar suas propriedades
      </div>
    );
  }

  const element = selectedElements[0]; // For now, edit first selected element

  const updateStyle = (styleUpdates: Partial<EditorElement['style']>) => {
    onUpdateElement(element.id, {
      style: { ...element.style, ...styleUpdates }
    });
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <div>
          <h3 className="font-semibold mb-2">Propriedades do Elemento</h3>
          <div className="space-y-2">
            <div>
              <Label>Nome</Label>
              <Input
                value={element.name || ''}
                onChange={(e) => onUpdateElement(element.id, { name: e.target.value })}
              />
            </div>
            <div>
              <Label>Tipo</Label>
              <Input value={element.type} disabled />
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h4 className="font-medium mb-2">Posição e Tamanho</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>X</Label>
              <Input
                type="number"
                value={element.position.x}
                onChange={(e) => onUpdateElement(element.id, {
                  position: { ...element.position, x: Number(e.target.value) }
                })}
              />
            </div>
            <div>
              <Label>Y</Label>
              <Input
                type="number"
                value={element.position.y}
                onChange={(e) => onUpdateElement(element.id, {
                  position: { ...element.position, y: Number(e.target.value) }
                })}
              />
            </div>
            <div>
              <Label>Largura</Label>
              <Input
                type="number"
                value={element.size.width}
                onChange={(e) => onUpdateElement(element.id, {
                  size: { ...element.size, width: Number(e.target.value) }
                })}
              />
            </div>
            <div>
              <Label>Altura</Label>
              <Input
                type="number"
                value={element.size.height}
                onChange={(e) => onUpdateElement(element.id, {
                  size: { ...element.size, height: Number(e.target.value) }
                })}
              />
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h4 className="font-medium mb-2">Transformação</h4>
          <div className="space-y-2">
            <div>
              <Label>Rotação: {element.rotation}°</Label>
              <Slider
                value={[element.rotation]}
                onValueChange={([value]) => onUpdateElement(element.id, { rotation: value })}
                min={-180}
                max={180}
                step={1}
              />
            </div>
            <div>
              <Label>Opacidade: {Math.round(element.opacity * 100)}%</Label>
              <Slider
                value={[element.opacity]}
                onValueChange={([value]) => onUpdateElement(element.id, { opacity: value })}
                min={0}
                max={1}
                step={0.01}
              />
            </div>
          </div>
        </div>

        {/* Text-specific properties */}
        {(element.type === 'text' || element.type === 'button') && (
          <>
            <Separator />
            <div>
              <h4 className="font-medium mb-2">Texto</h4>
              <div className="space-y-2">
                <div>
                  <Label>Conteúdo</Label>
                  <Textarea
                    value={element.content || ''}
                    onChange={(e) => onUpdateElement(element.id, { content: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Tamanho da Fonte</Label>
                  <Input
                    type="number"
                    value={element.style?.fontSize || 16}
                    onChange={(e) => updateStyle({ fontSize: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Família da Fonte</Label>
                  <Select
                    value={element.style?.fontFamily || 'Arial'}
                    onValueChange={(value) => updateStyle({ fontFamily: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Arial">Arial</SelectItem>
                      <SelectItem value="Helvetica">Helvetica</SelectItem>
                      <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                      <SelectItem value="Georgia">Georgia</SelectItem>
                      <SelectItem value="Verdana">Verdana</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Cor do Texto</Label>
                  <Input
                    type="color"
                    value={element.style?.color || '#000000'}
                    onChange={(e) => updateStyle({ color: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Alinhamento</Label>
                  <div className="flex space-x-1">
                    <Button
                      variant={element.style?.textAlign === 'left' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateStyle({ textAlign: 'left' })}
                    >
                      <AlignLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={element.style?.textAlign === 'center' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateStyle({ textAlign: 'center' })}
                    >
                      <AlignCenter className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={element.style?.textAlign === 'right' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateStyle({ textAlign: 'right' })}
                    >
                      <AlignRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Image/Video specific properties */}
        {(element.type === 'image' || element.type === 'video' || element.type === 'audio') && (
          <>
            <Separator />
            <div>
              <h4 className="font-medium mb-2">Mídia</h4>
              <div>
                <Label>URL da Fonte</Label>
                <Input
                  value={element.src || ''}
                  onChange={(e) => onUpdateElement(element.id, { src: e.target.value })}
                  placeholder="https://exemplo.com/arquivo"
                />
              </div>
            </div>
          </>
        )}

        <Separator />

        <div>
          <h4 className="font-medium mb-2">Visibilidade</h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Switch
                checked={element.visible}
                onCheckedChange={(checked) => onUpdateElement(element.id, { visible: checked })}
              />
              <Label>Visível</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={element.locked}
                onCheckedChange={(checked) => onUpdateElement(element.id, { locked: checked })}
              />
              <Label>Bloqueado</Label>
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
};

interface LayersPanelProps {
  layers: Layer[];
  elements: EditorElement[];
  selectedElements: string[];
  onSelectElement: (id: string) => void;
  onToggleLayerVisibility: (id: string) => void;
  onToggleLayerLock: (id: string) => void;
  onCreateLayer: (name: string) => void;
  onDeleteLayer: (id: string) => void;
}

const LayersPanel: React.FC<LayersPanelProps> = ({
  layers,
  elements,
  selectedElements,
  onSelectElement,
  onToggleLayerVisibility,
  onToggleLayerLock,
  onCreateLayer,
  onDeleteLayer
}) => {
  const [newLayerName, setNewLayerName] = useState('');

  const handleCreateLayer = () => {
    if (newLayerName.trim()) {
      onCreateLayer(newLayerName.trim());
      setNewLayerName('');
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Layers</h3>
        <Button size="sm" onClick={handleCreateLayer}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex space-x-2">
        <Input
          placeholder="Nome do layer"
          value={newLayerName}
          onChange={(e) => setNewLayerName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreateLayer()}
        />
      </div>

      <ScrollArea className="h-[300px]">
        <div className="space-y-2">
          {layers.map((layer) => (
            <div key={layer.id} className="border rounded p-2">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{layer.name}</span>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleLayerVisibility(layer.id)}
                  >
                    {layer.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleLayerLock(layer.id)}
                  >
                    {layer.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                  </Button>
                  {layer.id !== 'default' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteLayer(layer.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="space-y-1">
                {layer.elements.map((elementId) => {
                  const element = elements.find(el => el.id === elementId);
                  if (!element) return null;
                  
                  return (
                    <div
                      key={elementId}
                      className={`text-sm p-1 rounded cursor-pointer ${
                        selectedElements.includes(elementId) 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'hover:bg-gray-100'
                      }`}
                      onClick={() => onSelectElement(elementId)}
                    >
                      {element.name || `${element.type} ${elementId}`}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

interface TimelinePanelProps {
  timeline: Timeline;
  elements: EditorElement[];
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onSeekTo: (time: number) => void;
  onSetDuration: (duration: number) => void;
  isPlaying: boolean;
}

const TimelinePanel: React.FC<TimelinePanelProps> = ({
  timeline,
  elements,
  onPlay,
  onPause,
  onStop,
  onSeekTo,
  onSetDuration,
  isPlaying
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const time = percentage * timeline.duration;
    
    onSeekTo(time);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Timeline</h3>
        <div className="flex items-center space-x-2">
          <Button size="sm" onClick={onStop}>
            <StopIcon className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={isPlaying ? onPause : onPlay}>
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Label>Duração:</Label>
          <Input
            type="number"
            value={timeline.duration / 1000}
            onChange={(e) => onSetDuration(Number(e.target.value) * 1000)}
            className="w-20"
          />
          <span className="text-sm text-muted-foreground">segundos</span>
        </div>
        
        <div className="text-sm text-muted-foreground">
          {formatTime(timeline.currentTime)} / {formatTime(timeline.duration)}
        </div>
      </div>

      {/* Timeline Track */}
      <div
        ref={timelineRef}
        className="relative h-12 bg-gray-100 border rounded cursor-pointer"
        onClick={handleTimelineClick}
      >
        {/* Progress indicator */}
        <div
          className="absolute top-0 left-0 h-full bg-blue-500 opacity-30"
          style={{ width: `${(timeline.currentTime / timeline.duration) * 100}%` }}
        />
        
        {/* Current time indicator */}
        <div
          className="absolute top-0 w-0.5 h-full bg-blue-600"
          style={{ left: `${(timeline.currentTime / timeline.duration) * 100}%` }}
        />
        
        {/* Time markers */}
        {Array.from({ length: 11 }, (_, i) => (
          <div
            key={i}
            className="absolute top-0 w-px h-full bg-gray-300"
            style={{ left: `${i * 10}%` }}
          />
        ))}
      </div>

      {/* Keyframes */}
      <div className="space-y-2">
        <h4 className="font-medium">Keyframes</h4>
        <div className="text-sm text-muted-foreground">
          {timeline.keyframes.length === 0 
            ? 'Nenhum keyframe adicionado'
            : `${timeline.keyframes.length} keyframe(s)`
          }
        </div>
      </div>
    </div>
  );
};

export const WYSIWYGEditor: React.FC = () => {
  const {
    editorState,
    isPlaying,
    isDragging,
    addElement,
    updateElement,
    deleteElement,
    selectElement,
    clearSelection,
    createLayer,
    deleteLayer,
    toggleLayerVisibility,
    toggleLayerLock,
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
    setZoom,
    toggleGrid,
    toggleSnapToGrid,
    exportProject,
    importProject,
    startDrag,
    updateDrag,
    endDrag
  } = useWYSIWYGEditor();

  const { toast } = useToast();
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedElements = editorState.elements.filter(el => 
    editorState.selectedElements.includes(el.id)
  );

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      clearSelection();
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      updateDrag({ x: e.clientX, y: e.clientY });
    }
  };

  const handleCanvasMouseUp = () => {
    if (isDragging) {
      endDrag();
    }
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'z':
          e.preventDefault();
          if (e.shiftKey) {
            redo();
          } else {
            undo();
          }
          break;
        case 'c':
          e.preventDefault();
          copy();
          break;
        case 'x':
          e.preventDefault();
          cut();
          break;
        case 'v':
          e.preventDefault();
          paste();
          break;
        case 's':
          e.preventDefault();
          handleSave();
          break;
      }
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      editorState.selectedElements.forEach(id => deleteElement(id));
    }
  }, [undo, redo, copy, cut, paste, editorState.selectedElements, deleteElement]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleSave = () => {
    const data = exportProject();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'projeto_editor.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Projeto salvo",
      description: "O projeto foi salvo com sucesso."
    });
  };

  const handleLoad = () => {
    fileInputRef.current?.click();
  };

  const handleFileLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result as string;
        importProject(data);
        toast({
          title: "Projeto carregado",
          description: "O projeto foi carregado com sucesso."
        });
      } catch (err) {
        toast({
          title: "Erro ao carregar",
          description: "Não foi possível carregar o projeto.",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileLoad}
        className="hidden"
      />
      
      {/* Toolbar */}
      <Toolbar
        onAddElement={addElement}
        onPlay={play}
        onPause={pause}
        onStop={stop}
        onUndo={undo}
        onRedo={redo}
        onCopy={copy}
        onCut={cut}
        onPaste={paste}
        onZoomIn={() => setZoom(editorState.zoom * 1.2)}
        onZoomOut={() => setZoom(editorState.zoom / 1.2)}
        onToggleGrid={toggleGrid}
        onSave={handleSave}
        onLoad={handleLoad}
        isPlaying={isPlaying}
        canUndo={editorState.historyIndex > 0}
        canRedo={editorState.historyIndex < editorState.history.length - 1}
        zoom={editorState.zoom}
        gridEnabled={editorState.gridEnabled}
      />

      <div className="flex-1 flex">
        {/* Left Panel - Layers */}
        <div className="w-64 border-r bg-background">
          <Tabs defaultValue="layers" className="h-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="layers">Layers</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>
            <TabsContent value="layers" className="h-full">
              <LayersPanel
                layers={editorState.layers}
                elements={editorState.elements}
                selectedElements={editorState.selectedElements}
                onSelectElement={selectElement}
                onToggleLayerVisibility={toggleLayerVisibility}
                onToggleLayerLock={toggleLayerLock}
                onCreateLayer={createLayer}
                onDeleteLayer={deleteLayer}
              />
            </TabsContent>
            <TabsContent value="timeline" className="h-full">
              <TimelinePanel
                timeline={editorState.timeline}
                elements={editorState.elements}
                onPlay={play}
                onPause={pause}
                onStop={stop}
                onSeekTo={seekTo}
                onSetDuration={setTimelineDuration}
                isPlaying={isPlaying}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Main Canvas */}
        <div className="flex-1 overflow-auto bg-gray-50">
          <div
            ref={canvasRef}
            className="relative mx-auto my-8 bg-white shadow-lg"
            style={{
              width: editorState.canvasSize.width * editorState.zoom,
              height: editorState.canvasSize.height * editorState.zoom,
              backgroundImage: editorState.gridEnabled 
                ? `radial-gradient(circle, #ccc 1px, transparent 1px)`
                : 'none',
              backgroundSize: editorState.gridEnabled 
                ? `${editorState.gridSize * editorState.zoom}px ${editorState.gridSize * editorState.zoom}px`
                : 'auto'
            }}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
          >
            {editorState.elements.map((element) => (
              <CanvasElement
                key={element.id}
                element={element}
                isSelected={editorState.selectedElements.includes(element.id)}
                onSelect={() => selectElement(element.id)}
                onUpdate={(updates) => updateElement(element.id, updates)}
                onStartDrag={(startPosition) => startDrag(element.id, startPosition)}
                zoom={editorState.zoom}
              />
            ))}
          </div>
        </div>

        {/* Right Panel - Properties */}
        <div className="w-80 border-l bg-background">
          <Card className="h-full rounded-none border-0">
            <CardHeader>
              <CardTitle className="text-lg">Propriedades</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <PropertiesPanel
                selectedElements={selectedElements}
                onUpdateElement={updateElement}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};