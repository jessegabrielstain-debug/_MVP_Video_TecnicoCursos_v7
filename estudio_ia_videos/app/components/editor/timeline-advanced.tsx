'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useAdvancedEditor, EditorLayer, Keyframe, TimelineMarker } from '@/hooks/useAdvancedEditor';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  Square, 
  SkipBack, 
  SkipForward,
  Volume2,
  VolumeX,
  Scissors,
  Copy,
  Trash2,
  Plus,
  ZoomIn,
  ZoomOut,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  MoreHorizontal,
  Clock,
  Target,
  AlertTriangle,
  Shield,
  HelpCircle,
  CheckCircle,
  Bookmark,
  Flag,
  Zap,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimelineAdvancedProps {
  editor: ReturnType<typeof useAdvancedEditor>;
  height?: number;
  className?: string;
}

interface DragState {
  isDragging: boolean;
  dragType: 'layer' | 'keyframe' | 'marker' | 'playhead' | 'selection' | 'clip' | 'effect';
  dragData: any;
  startX: number;
  startTime: number;
  currentX: number;
}

export const TimelineAdvanced: React.FC<TimelineAdvancedProps> = ({
  editor,
  height = 300,
  className
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragType: 'layer',
    dragData: null,
    startX: 0,
    startTime: 0,
    currentX: 0,
  });
  
  const [selectedItems, setSelectedItems] = useState<{
    layers: string[];
    keyframes: string[];
    markers: string[];
  }>({
    layers: [],
    keyframes: [],
    markers: [],
  });

  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    type: string;
    data: any;
  }>({
    visible: false,
    x: 0,
    y: 0,
    type: '',
    data: null,
  });

  const [snapToGrid, setSnapToGrid] = useState(true);
  const [showWaveforms, setShowWaveforms] = useState(true);
  const [trackHeight, setTrackHeight] = useState(40);

  // Constants
  const PIXELS_PER_SECOND = 100;
  const SNAP_THRESHOLD = 10;
  const MIN_ZOOM = 0.1;
  const MAX_ZOOM = 10;

  // Helper functions
  const timeToPixels = useCallback((time: number) => {
    return (time / 1000) * PIXELS_PER_SECOND * editor.timeline.zoom;
  }, [editor.timeline.zoom]);

  const pixelsToTime = useCallback((pixels: number) => {
    return (pixels / (PIXELS_PER_SECOND * editor.timeline.zoom)) * 1000;
  }, [editor.timeline.zoom]);

  const snapTime = useCallback((time: number) => {
    if (!snapToGrid) return time;
    const gridSize = 1000; // 1 second
    return Math.round(time / gridSize) * gridSize;
  }, [snapToGrid]);

  const formatTime = useCallback((ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  }, []);

  const getLayerColor = useCallback((type: string) => {
    switch (type) {
      case 'video': return 'bg-blue-500';
      case 'audio': return 'bg-green-500';
      case 'text': return 'bg-yellow-500';
      case 'image': return 'bg-purple-500';
      case 'animation': return 'bg-pink-500';
      case 'interaction': return 'bg-orange-500';
      case 'safety': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  }, []);

  const getMarkerIcon = useCallback((type: string) => {
    switch (type) {
      case 'chapter': return Bookmark;
      case 'safety': return Shield;
      case 'quiz': return HelpCircle;
      case 'checkpoint': return CheckCircle;
      case 'warning': return AlertTriangle;
      default: return Flag;
    }
  }, []);

  // Mouse event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent, type: string, data: any) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;

    const startX = e.clientX - rect.left;
    const startTime = pixelsToTime(startX);

    setDragState({
      isDragging: true,
      dragType: type as 'layer' | 'clip' | 'effect' | 'marker',
      dragData: data,
      startX,
      startTime,
      currentX: startX,
    });

    // Handle selection
    if (type === 'layer') {
      if (e.ctrlKey || e.metaKey) {
        setSelectedItems(prev => ({
          ...prev,
          layers: prev.layers.includes(data.id)
            ? prev.layers.filter(id => id !== data.id)
            : [...prev.layers, data.id],
        }));
      } else {
        setSelectedItems(prev => ({ ...prev, layers: [data.id] }));
      }
    }
  }, [pixelsToTime]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState.isDragging) return;

    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;

    const currentX = e.clientX - rect.left;
    const currentTime = pixelsToTime(currentX);
    const deltaTime = currentTime - dragState.startTime;

    setDragState(prev => ({ ...prev, currentX }));

    // Handle different drag types
    switch (dragState.dragType) {
      case 'playhead':
        const newTime = snapTime(Math.max(0, Math.min(currentTime, editor.timeline.duration)));
        editor.setCurrentTime(newTime);
        break;

      case 'layer':
        if (dragState.dragData) {
          const layer = dragState.dragData as EditorLayer;
          const newStartTime = snapTime(Math.max(0, layer.metadata.startTime + deltaTime));
          const newEndTime = newStartTime + layer.metadata.duration;
          
          if (newEndTime <= editor.timeline.duration) {
            editor.updateLayer(layer.id, {
              metadata: {
                ...layer.metadata,
                startTime: newStartTime,
                endTime: newEndTime,
              },
            });
          }
        }
        break;

      case 'keyframe':
        if (dragState.dragData) {
          const { layerId, keyframe } = dragState.dragData;
          const newTime = snapTime(Math.max(0, Math.min(currentTime, editor.timeline.duration)));
          editor.moveKeyframe(layerId, keyframe.id, newTime);
        }
        break;

      case 'marker':
        if (dragState.dragData) {
          const marker = dragState.dragData as TimelineMarker;
          const newTime = snapTime(Math.max(0, Math.min(currentTime, editor.timeline.duration)));
          // Update marker time (would need to add this to editor)
        }
        break;
    }
  }, [dragState, pixelsToTime, snapTime, editor]);

  const handleMouseUp = useCallback(() => {
    setDragState(prev => ({ ...prev, isDragging: false }));
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent, type: string, data: any) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      type,
      data,
    });
  }, []);

  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (dragState.isDragging) return;

    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickX = e.clientX - rect.left;
    const clickTime = pixelsToTime(clickX);
    const snappedTime = snapTime(Math.max(0, Math.min(clickTime, editor.timeline.duration)));
    
    editor.setCurrentTime(snappedTime);
  }, [dragState.isDragging, pixelsToTime, snapTime, editor]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target !== document.body) return;

      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          selectedItems.layers.forEach(layerId => editor.removeLayer(layerId));
          setSelectedItems(prev => ({ ...prev, layers: [] }));
          break;
        case 'c':
          if (e.ctrlKey || e.metaKey) {
            // Copy selected items
          }
          break;
        case 'v':
          if (e.ctrlKey || e.metaKey) {
            // Paste items
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          const prevTime = Math.max(0, editor.timeline.currentTime - (e.shiftKey ? 100 : 1000));
          editor.setCurrentTime(prevTime);
          break;
        case 'ArrowRight':
          e.preventDefault();
          const nextTime = Math.min(editor.timeline.duration, editor.timeline.currentTime + (e.shiftKey ? 100 : 1000));
          editor.setCurrentTime(nextTime);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItems, editor]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(prev => ({ ...prev, visible: false }));
    if (contextMenu.visible) {
      window.addEventListener('click', handleClickOutside);
      return () => window.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu.visible]);

  const renderTimeRuler = () => {
    const duration = editor.timeline.duration / 1000; // Convert to seconds
    const majorTicks = Math.ceil(duration / 10) * 10; // Major ticks every 10 seconds
    const minorTicks = duration * 10; // Minor ticks every 100ms

    return (
      <div className="h-8 bg-gray-100 border-b border-gray-300 relative overflow-hidden">
        {/* Major ticks */}
        {Array.from({ length: majorTicks + 1 }, (_, i) => {
          const time = i;
          const x = timeToPixels(time * 1000);
          
          return (
            <div
              key={`major-${i}`}
              className="absolute top-0 bottom-0 border-l border-gray-400"
              style={{ left: x }}
            >
              <span className="absolute top-1 left-1 text-xs text-gray-600 font-mono">
                {time}s
              </span>
            </div>
          );
        })}

        {/* Minor ticks */}
        {Array.from({ length: Math.floor(minorTicks) }, (_, i) => {
          const time = (i + 1) * 0.1;
          const x = timeToPixels(time * 1000);
          
          if (i % 10 !== 9) { // Skip major tick positions
            return (
              <div
                key={`minor-${i}`}
                className="absolute top-4 bottom-0 border-l border-gray-300"
                style={{ left: x, width: 1 }}
              />
            );
          }
          return null;
        })}

        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 cursor-ew-resize"
          style={{ left: timeToPixels(editor.timeline.currentTime) }}
          onMouseDown={(e) => handleMouseDown(e, 'playhead', null)}
        >
          <div className="absolute -top-1 -left-2 w-4 h-4 bg-red-500 transform rotate-45 border border-white" />
        </div>

        {/* Timeline markers */}
        {editor.timeline.markers.map(marker => {
          const MarkerIcon = getMarkerIcon(marker.type);
          return (
            <div
              key={marker.id}
              className="absolute top-0 bottom-0 cursor-pointer z-10"
              style={{ left: timeToPixels(marker.time) }}
              onMouseDown={(e) => handleMouseDown(e, 'marker', marker)}
              onContextMenu={(e) => handleContextMenu(e, 'marker', marker)}
              title={`${marker.title} - ${formatTime(marker.time)}`}
            >
              <div className="absolute -left-2 top-1 w-4 h-4 rounded-full bg-yellow-500 border border-white flex items-center justify-center">
                <MarkerIcon className="w-2 h-2 text-white" />
              </div>
              <div className="absolute top-0 bottom-0 w-px bg-yellow-500 opacity-50" />
            </div>
          );
        })}
      </div>
    );
  };

  const renderLayerTrack = (layer: EditorLayer, index: number) => {
    const isSelected = selectedItems.layers.includes(layer.id);
    const layerColor = getLayerColor(layer.type);
    const startX = timeToPixels(layer.metadata.startTime);
    const width = timeToPixels(layer.metadata.duration);

    return (
      <div
        key={layer.id}
        className={cn(
          "relative border-b border-gray-200 flex items-center",
          isSelected && "bg-blue-50"
        )}
        style={{ height: trackHeight }}
      >
        {/* Layer header */}
        <div className="w-48 px-3 py-2 bg-gray-50 border-r border-gray-200 flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.toggleLayerVisibility(layer.id)}
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
            onClick={() => editor.toggleLayerLock(layer.id)}
            className="p-0 h-auto"
          >
            {layer.locked ? (
              <Lock className="w-3 h-3 text-red-500" />
            ) : (
              <Unlock className="w-3 h-3" />
            )}
          </Button>

          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{layer.name}</div>
            <div className="text-xs text-gray-500">{layer.type}</div>
          </div>

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
              className="p-0 h-auto"
            >
              <MoreHorizontal className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Track content */}
        <div className="flex-1 relative overflow-hidden">
          {/* Layer block */}
          <div
            className={cn(
              "absolute rounded border-2 cursor-move transition-all",
              layerColor,
              isSelected ? "border-blue-500 shadow-lg" : "border-white",
              layer.locked && "cursor-not-allowed opacity-50"
            )}
            style={{
              left: startX,
              width: Math.max(width, 20),
              top: 4,
              height: trackHeight - 8,
            }}
            onMouseDown={(e) => !layer.locked && handleMouseDown(e, 'layer', layer)}
            onContextMenu={(e) => handleContextMenu(e, 'layer', layer)}
          >
            <div className="h-full flex items-center px-2 text-white text-xs font-medium truncate">
              {layer.name}
            </div>

            {/* Waveform for audio layers */}
            {layer.type === 'audio' && showWaveforms && (
              <div className="absolute inset-1 bg-black bg-opacity-20 rounded">
                <Activity className="w-full h-full opacity-50" />
              </div>
            )}

            {/* Resize handles */}
            {!layer.locked && (
              <>
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-white bg-opacity-50 cursor-ew-resize" />
                <div className="absolute right-0 top-0 bottom-0 w-1 bg-white bg-opacity-50 cursor-ew-resize" />
              </>
            )}
          </div>

          {/* Keyframes */}
          {layer.keyframes.map(keyframe => (
            <div
              key={keyframe.id}
              className="absolute w-3 h-3 bg-orange-500 rounded-full border-2 border-white cursor-pointer z-10 transform -translate-y-1/2"
              style={{
                left: timeToPixels(keyframe.time) - 6,
                top: trackHeight / 2,
              }}
              onMouseDown={(e) => handleMouseDown(e, 'keyframe', { layerId: layer.id, keyframe })}
              onContextMenu={(e) => handleContextMenu(e, 'keyframe', { layerId: layer.id, keyframe })}
              title={`Keyframe at ${formatTime(keyframe.time)}`}
            />
          ))}

          {/* Effects indicators */}
          {layer.effects.map(effect => (
            <div
              key={effect.id}
              className="absolute top-1 h-1 bg-purple-400 rounded"
              style={{
                left: timeToPixels(effect.startTime),
                width: timeToPixels(effect.duration),
              }}
              title={`${effect.name} - ${formatTime(effect.duration)}`}
            />
          ))}
        </div>
      </div>
    );
  };

  const renderContextMenu = () => {
    if (!contextMenu.visible) return null;

    const menuItems = [];

    switch (contextMenu.type) {
      case 'layer':
        menuItems.push(
          { label: 'Duplicar', action: () => editor.duplicateLayer(contextMenu.data.id) },
          { label: 'Remover', action: () => editor.removeLayer(contextMenu.data.id) },
          { label: 'Dividir', action: () => {} },
          { label: 'Propriedades', action: () => {} },
        );
        break;
      case 'keyframe':
        menuItems.push(
          { label: 'Remover', action: () => editor.removeKeyframe(contextMenu.data.layerId, contextMenu.data.keyframe.id) },
          { label: 'Editar', action: () => {} },
        );
        break;
      case 'marker':
        menuItems.push(
          { label: 'Editar', action: () => {} },
          { label: 'Remover', action: () => editor.removeMarker(contextMenu.data.id) },
        );
        break;
    }

    return (
      <div
        className="fixed bg-white border border-gray-300 rounded shadow-lg z-50 py-1"
        style={{ left: contextMenu.x, top: contextMenu.y }}
      >
        {menuItems.map((item, index) => (
          <button
            key={index}
            className="block w-full text-left px-3 py-1 text-sm hover:bg-gray-100"
            onClick={() => {
              item.action();
              setContextMenu(prev => ({ ...prev, visible: false }));
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className={cn("bg-white border border-gray-300 rounded-lg overflow-hidden", className)}>
      {/* Timeline header */}
      <div className="h-12 bg-gray-50 border-b border-gray-200 flex items-center px-4 gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={editor.timeline.isPlaying ? editor.pause : editor.play}
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
          >
            <Square className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.setCurrentTime(0)}
          >
            <SkipBack className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.setCurrentTime(editor.timeline.duration)}
          >
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-mono">
            {formatTime(editor.timeline.currentTime)}
          </span>
          <span className="text-sm text-gray-500">/</span>
          <span className="text-sm font-mono text-gray-500">
            {formatTime(editor.timeline.duration)}
          </span>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <Button
            variant={snapToGrid ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSnapToGrid(!snapToGrid)}
            title="Snap to grid"
          >
            <Target className="w-4 h-4" />
          </Button>

          <Button
            variant={showWaveforms ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setShowWaveforms(!showWaveforms)}
            title="Show waveforms"
          >
            <Activity className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.setTimelineZoom(Math.max(MIN_ZOOM, editor.timeline.zoom / 1.2))}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>

            <span className="text-sm font-mono w-12 text-center">
              {Math.round(editor.timeline.zoom * 100)}%
            </span>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.setTimelineZoom(Math.min(MAX_ZOOM, editor.timeline.zoom * 1.2))}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Timeline content */}
      <div 
        ref={timelineRef}
        className="relative overflow-auto"
        style={{ height: height - 48 }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleTimelineClick}
      >
        {renderTimeRuler()}
        
        <div className="relative">
          {editor.layers.map((layer, index) => renderLayerTrack(layer, index))}
        </div>

        {/* Add layer button */}
        <div className="h-12 border-t border-gray-200 flex items-center justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.addLayer('text')}
            className="text-gray-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Camada
          </Button>
        </div>
      </div>

      {renderContextMenu()}

      {/* Selection info */}
      {selectedItems.layers.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-blue-100 border border-blue-300 rounded px-3 py-1 text-sm">
          {selectedItems.layers.length} camada(s) selecionada(s)
        </div>
      )}
    </div>
  );
};