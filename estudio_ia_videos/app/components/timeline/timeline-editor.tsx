/**
 * Advanced Timeline Editor Component
 * Professional video editing timeline with drag-and-drop, keyframes, and real-time preview
 */

'use client';

import React, { useRef, useCallback, useState, useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import { motion, AnimatePresence } from 'framer-motion';
import { useTimeline } from '@/hooks/use-timeline';
import { TimelineElement, TimelineLayer } from '@/lib/types/timeline-types';
import { TimelineToolbar } from './timeline-toolbar';
import { TimelineCanvas } from './timeline-canvas';
import { TimelineRuler, TimelinePlayhead } from './timeline-components-stub';
import { TimelineLayerHeader } from './timeline-layer-header';
import { TimelineElement as TimelineElementComponent } from './timeline-element';

interface TimelineEditorProps {
  className?: string;
  onExport?: (format: string) => void;
  onImport?: (file: File) => void;
  height?: number;
  showPreview?: boolean;
}

export function TimelineEditor({ 
  className = '',
  onExport,
  onImport,
  height = 400,
  showPreview = true
}: TimelineEditorProps) {
  const timeline = useTimeline();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedElement, setDraggedElement] = useState<TimelineElement | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [viewportWidth, setViewportWidth] = useState(800);

  // Calculate timeline viewport settings
  const pixelsPerMs = (viewportWidth - 200) / (timeline.project.duration * timeline.project.zoomLevel);
  const timelineWidth = timeline.project.duration * pixelsPerMs;

  // Handle viewport resize
  useEffect(() => {
    const handleResize = () => {
      if (timelineRef.current) {
        setViewportWidth(timelineRef.current.clientWidth);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Drag and drop handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    // Find the dragged element
    let foundElement: TimelineElement | null = null;
    timeline.project.layers.forEach(layer => {
      const element = layer.elements.find(el => el.id === active.id);
      if (element) {
        foundElement = element;
      }
    });
    
    setDraggedElement(foundElement);
  }, [timeline.project.layers]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over, delta } = event;
    
    if (!over) {
      setActiveId(null);
      setDraggedElement(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Calculate new position based on drag delta
    const timeDelta = delta.x / pixelsPerMs;

    // Find current element
    let currentElement: TimelineElement | null = null;
    let currentLayerId = '';
    
    timeline.project.layers.forEach(layer => {
      const element = layer.elements.find(el => el.id === activeId);
      if (element) {
        currentElement = element;
        currentLayerId = layer.id;
      }
    });

    if (currentElement) {
      const el = currentElement as any;
      const currentStart = el.startTime ?? el.start ?? 0;
      const newStartTime = Math.max(0, currentStart + timeDelta);
      
      // Check if dropped on a different layer
      const targetLayer = timeline.project.layers.find(layer => layer.id === overId);
      const newLayerId = targetLayer ? overId : currentLayerId;
      
      timeline.moveElement(activeId, newStartTime, newLayerId);
    }

    setActiveId(null);
    setDraggedElement(null);
  }, [timeline, pixelsPerMs]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          timeline.isPlaying ? timeline.pause() : timeline.play();
          break;
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          (timeline.project.selectedElementIds || []).forEach(id => {
            timeline.removeElement(id);
          });
          break;
        case 'c':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            timeline.copyElements(timeline.project.selectedElementIds || []);
          }
          break;
        case 'v':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const targetLayer = timeline.project.layers[0];
            if (targetLayer) {
              timeline.pasteElements(timeline.project.currentTime, targetLayer.id);
            }
          }
          break;
        case 'a':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const allElementIds: string[] = [];
            timeline.project.layers.forEach(layer => {
              layer.elements.forEach(element => {
                allElementIds.push(element.id);
              });
            });
            timeline.selectElements(allElementIds);
          }
          break;
        case 'Escape':
          timeline.clearSelection();
          break;
        case '+':
        case '=':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            timeline.zoomIn();
          }
          break;
        case '-':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            timeline.zoomOut();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [timeline]);

  // Time formatting helper
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const remainingMs = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}.${remainingMs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`timeline-editor flex flex-col bg-gray-900 text-white ${className}`} style={{ height }}>
      {/* Toolbar */}
      <TimelineToolbar
        isPlaying={timeline.isPlaying}
        currentTime={timeline.project.currentTime}
        duration={timeline.project.duration}
        zoomLevel={timeline.project.zoomLevel}
        showKeyframes={false}
        onPlay={timeline.play}
        onPause={timeline.pause}
        onPlayPause={() => timeline.isPlaying ? timeline.pause() : timeline.play()}
        onStop={timeline.stop}
        onSeek={timeline.seek}
        onZoomIn={timeline.zoomIn}
        onZoomOut={timeline.zoomOut}
        onZoomChange={timeline.setZoom}
        onShowKeyframes={() => {}}
        onExport={onExport}
        onImport={onImport}
      />

      {/* Timeline Container */}
      <div className="flex-1 flex overflow-hidden" ref={timelineRef}>
        {/* Layer Headers */}
        <div className="w-48 bg-gray-800 border-r border-gray-700">
          <div className="h-8 bg-gray-700 border-b border-gray-600 flex items-center px-3">
            <span className="text-xs font-medium text-gray-300">LAYERS</span>
          </div>
          <div className="overflow-y-auto" style={{ height: height - 120 }}>
            {timeline.project.layers.map((layer) => (
              <TimelineLayerHeader
                key={layer.id}
                layer={layer}
                onToggleVisibility={(layerId) => 
                  timeline.updateLayer(layerId, { visible: !layer.visible })
                }
                onToggleLock={(layerId) => 
                  timeline.updateLayer(layerId, { locked: !layer.locked })
                }
                onRename={(layerId, name) => 
                  timeline.updateLayer(layerId, { name })
                }
                onDelete={(layerId) => timeline.removeLayer(layerId)}
              />
            ))}
          </div>
        </div>

        {/* Timeline Canvas */}
        <div className="flex-1 overflow-auto bg-gray-850">
          <DndContext
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {/* Ruler */}
            <TimelineRuler
              duration={timeline.project.duration}
              pixelsPerMs={pixelsPerMs}
              zoomLevel={timeline.project.zoomLevel}
            />

            {/* Canvas with layers */}
            <div className="relative" style={{ width: Math.max(timelineWidth, viewportWidth - 200) }}>
              {/* Playhead */}
              <TimelinePlayhead
                currentTime={timeline.project.currentTime}
                pixelsPerMs={pixelsPerMs}
                height={timeline.project.layers.length * 60}
                onSeek={(time) => timeline.seek(time)}
              />

              {/* Layers */}
              <div className="relative min-h-full">
                <TimelineCanvas
                  project={timeline.project}
                  currentTime={timeline.project.currentTime}
                  zoom={timeline.project.zoomLevel}
                  scrollX={0}
                  pixelsPerSecond={pixelsPerMs * 1000}
                  selection={{
                    elementIds: timeline.project.selectedElementIds || [],
                    layerIds: [],
                    startTime: 0,
                    endTime: 0
                  }}
                  onElementClick={(id, e) => timeline.selectElement(id)}
                  onTimelineClick={(e) => timeline.clearSelection()}
                  showKeyframes={false}
                />
              </div>

              {/* Drop zones for new layers */}
              <div className="h-16 bg-gray-800/50 border-2 border-dashed border-gray-600 rounded-lg m-2 flex items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-400 transition-colors">
                <span className="text-sm">Drop media here to create new layer</span>
              </div>
            </div>

            {/* Drag Overlay */}
            <DragOverlay>
              {draggedElement && (
                <TimelineElementComponent
                  element={draggedElement}
                  pixelsPerMs={pixelsPerMs}
                  isSelected={false}
                  isDragging={true}
                  onSelect={() => {}}
                  onUpdate={() => {}}
                />
              )}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      {/* Status Bar */}
      <div className="h-6 bg-gray-800 border-t border-gray-700 flex items-center justify-between px-3 text-xs text-gray-400">
        <div className="flex items-center space-x-4">
          <span>Time: {formatTime(timeline.project.currentTime)}</span>
          <span>Duration: {formatTime(timeline.project.duration)}</span>
          <span>Zoom: {Math.round(timeline.project.zoomLevel * 100)}%</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>{(timeline.project.selectedElementIds || []).length} selected</span>
          <span>{timeline.project.layers.reduce((acc, layer) => acc + layer.elements.length, 0)} elements</span>
          <span>{timeline.project.resolution.width}x{timeline.project.resolution.height}</span>
          <span>{timeline.project.fps} fps</span>
        </div>
      </div>
    </div>
  );
}