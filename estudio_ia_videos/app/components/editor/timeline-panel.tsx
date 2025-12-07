'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Minus,
  RotateCcw,
  RotateCw,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Move,
  Zap,
  Clock,
  Layers,
  Music,
  Mic,
  Video,
  Image,
  Type,
  User,
  Settings
} from 'lucide-react';
import { EditorState, EditorElement, EditorLayer, Keyframe, TimelineMarker } from '@/types/editor';

interface TimelinePanelProps {
  state: EditorState;
  onTimelineChange: (updates: Partial<EditorState['timeline']>) => void;
  onElementUpdate: (elementId: string, updates: Partial<EditorElement>) => void;
  onLayerUpdate: (layerId: string, updates: Partial<EditorLayer>) => void;
  onAddKeyframe: (elementId: string, time: number, property: string, value: any) => void;
  onAddMarker: (time: number, label: string) => void;
}

export function TimelinePanel({
  state,
  onTimelineChange,
  onElementUpdate,
  onLayerUpdate,
  onAddKeyframe,
  onAddMarker
}: TimelinePanelProps) {
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showWaveform, setShowWaveform] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, time: 0 });

  const pixelsPerSecond = 50 * zoom;
  const timelineWidth = state.timeline.duration * pixelsPerSecond;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const timeToPixels = (time: number) => time * pixelsPerSecond;
  const pixelsToTime = (pixels: number) => pixels / pixelsPerSecond;

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = pixelsToTime(x);
    
    if (snapToGrid) {
      const gridSize = 0.1; // 100ms grid
      const snappedTime = Math.round(time / gridSize) * gridSize;
      onTimelineChange({ currentTime: Math.max(0, Math.min(snappedTime, state.timeline.duration)) });
    } else {
      onTimelineChange({ currentTime: Math.max(0, Math.min(time, state.timeline.duration)) });
    }
  };

  const handlePlayPause = () => {
    onTimelineChange({ playing: !state.timeline.playing });
  };

  const handleStop = () => {
    onTimelineChange({ playing: false, currentTime: 0 });
  };

  const handleSkipBack = () => {
    const newTime = Math.max(0, state.timeline.currentTime - 1);
    onTimelineChange({ currentTime: newTime });
  };

  const handleSkipForward = () => {
    const newTime = Math.min(state.timeline.duration, state.timeline.currentTime + 1);
    onTimelineChange({ currentTime: newTime });
  };

  const getElementIcon = (type: string) => {
    switch (type) {
      case 'text': return Type;
      case 'image': return Image;
      case 'video': return Video;
      case 'audio': return Music;
      case 'avatar': return User;
      default: return Move;
    }
  };

  const getElementColor = (type: string) => {
    switch (type) {
      case 'text': return 'bg-blue-500';
      case 'image': return 'bg-green-500';
      case 'video': return 'bg-purple-500';
      case 'audio': return 'bg-orange-500';
      case 'avatar': return 'bg-pink-500';
      default: return 'bg-gray-500';
    }
  };

  const renderTimelineRuler = () => {
    const markers = [];
    const step = zoom >= 2 ? 0.1 : zoom >= 1 ? 0.5 : 1;
    
    for (let time = 0; time <= state.timeline.duration; time += step) {
      const x = timeToPixels(time);
      const isSecond = time % 1 === 0;
      
      markers.push(
        <div
          key={time}
          className="absolute flex flex-col items-center"
          style={{ left: x }}
        >
          <div className={`w-px ${isSecond ? 'h-4 bg-gray-600' : 'h-2 bg-gray-400'}`} />
          {isSecond && (
            <span className="text-xs text-gray-600 mt-1">
              {formatTime(time)}
            </span>
          )}
        </div>
      );
    }
    
    return markers;
  };

  const renderPlayhead = () => {
    const x = timeToPixels(state.timeline.currentTime);
    
    return (
      <div
        className="absolute top-0 bottom-0 w-px bg-red-500 z-20 pointer-events-none"
        style={{ left: x }}
      >
        <div className="absolute -top-2 -left-2 w-4 h-4 bg-red-500 rounded-full" />
      </div>
    );
  };

  const renderKeyframes = (elementId: string) => {
    const element = state.elements.find(e => e.id === elementId);
    if (!element || !element.animations) return null;

    return element.animations.map((animation, index) => {
      const x = timeToPixels(animation.delay);
      const width = timeToPixels(animation.duration);
      
      return (
        <div
          key={index}
          className="absolute h-2 bg-yellow-400 rounded opacity-75 cursor-pointer"
          style={{ left: x, width, top: '50%', transform: 'translateY(-50%)' }}
          title={`Animation: ${animation.type}`}
        />
      );
    });
  };

  const renderMarkers = () => {
    return state.timeline.markers.map((marker) => {
      const x = timeToPixels(marker.time);
      
      return (
        <div
          key={marker.id}
          className="absolute top-0 bottom-0 flex flex-col items-center cursor-pointer"
          style={{ left: x }}
        >
          <div className="w-px h-full bg-blue-500" />
          <div className="absolute -top-6 bg-blue-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            {marker.label}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="h-80 bg-white border-t border-gray-200 flex flex-col">
      {/* Timeline Controls */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* Playback Controls */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkipBack}
            >
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePlayPause}
            >
              {state.timeline.playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleStop}
            >
              <Square className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkipForward}
            >
              <SkipForward className="w-4 h-4" />
            </Button>

            {/* Time Display */}
            <div className="flex items-center space-x-2 ml-4">
              <span className="text-sm font-mono">
                {formatTime(state.timeline.currentTime)}
              </span>
              <span className="text-sm text-gray-500">/</span>
              <span className="text-sm font-mono text-gray-500">
                {formatTime(state.timeline.duration)}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Timeline Options */}
            <Button
              variant={snapToGrid ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSnapToGrid(!snapToGrid)}
            >
              <Move className="w-4 h-4" />
            </Button>
            <Button
              variant={showWaveform ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setShowWaveform(!showWaveform)}
            >
              <Music className="w-4 h-4" />
            </Button>

            {/* Zoom Controls */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <span className="text-sm min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom(Math.min(5, zoom + 0.1))}
            >
              <Plus className="w-4 h-4" />
            </Button>

            {/* Add Marker */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAddMarker(state.timeline.currentTime, 'Marker')}
            >
              <Clock className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Duration Control */}
        <div className="flex items-center space-x-4 mt-3">
          <label className="text-sm font-medium">Duration:</label>
          <Input
            type="number"
            value={state.timeline.duration}
            onChange={(e) => onTimelineChange({ duration: Math.max(1, Number(e.target.value)) })}
            className="w-20"
            min={1}
            max={300}
            step={0.1}
          />
          <span className="text-sm text-gray-500">seconds</span>
          
          <div className="flex items-center space-x-2 ml-auto">
            <label className="text-sm">Loop:</label>
            <input
              type="checkbox"
              checked={state.timeline.loop}
              onChange={(e) => onTimelineChange({ loop: e.target.checked })}
              className="rounded"
            />
          </div>
        </div>
      </div>

      {/* Timeline Content */}
      <div className="flex-1 flex">
        {/* Track Labels */}
        <div className="w-48 bg-gray-50 border-r border-gray-200">
          <div className="h-12 border-b border-gray-200 flex items-center px-3">
            <span className="text-sm font-medium">Tracks</span>
          </div>
          
          <ScrollArea className="h-full">
            {state.layers.map((layer) => (
              <div key={layer.id} className="border-b border-gray-200">
                <div className="h-12 flex items-center justify-between px-3 hover:bg-gray-100">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onLayerUpdate(layer.id, { visible: !layer.visible })}
                    >
                      {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onLayerUpdate(layer.id, { locked: !layer.locked })}
                    >
                      {layer.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    </Button>
                    <span className="text-sm">{layer.name}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {layer.elements.length}
                  </Badge>
                </div>
                
                {/* Element tracks */}
                {layer.elements.map((elementId) => {
                  const element = state.elements.find(e => e.id === elementId);
                  if (!element) return null;
                  
                  const IconComponent = getElementIcon(element.type);
                  
                  return (
                    <div
                      key={elementId}
                      className={`h-8 flex items-center px-6 text-xs cursor-pointer hover:bg-gray-100 ${
                        selectedTrack === elementId ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                      }`}
                      onClick={() => setSelectedTrack(elementId)}
                    >
                      <IconComponent className="w-3 h-3 mr-2" />
                      <span className="truncate">
                        {(element.properties.content as string) || element.type}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </ScrollArea>
        </div>

        {/* Timeline Canvas */}
        <div className="flex-1 relative overflow-auto">
          <div
            ref={timelineRef}
            className="relative h-full cursor-pointer"
            style={{ width: Math.max(timelineWidth, 800) }}
            onClick={handleTimelineClick}
          >
            {/* Timeline Ruler */}
            <div className="h-12 border-b border-gray-200 relative bg-gray-50">
              {renderTimelineRuler()}
            </div>

            {/* Timeline Tracks */}
            <div className="relative">
              {state.layers.map((layer, layerIndex) => (
                <div key={layer.id} className="border-b border-gray-200">
                  <div className="h-12 relative bg-white">
                    {/* Layer background */}
                    <div className="absolute inset-0 bg-gray-50 opacity-50" />
                  </div>
                  
                  {/* Element tracks */}
                  {layer.elements.map((elementId, elementIndex) => {
                    const element = state.elements.find(e => e.id === elementId);
                    if (!element) return null;
                    
                    return (
                      <div
                        key={elementId}
                        className="h-8 relative border-b border-gray-100"
                        style={{ backgroundColor: selectedTrack === elementId ? '#eff6ff' : 'white' }}
                      >
                        {/* Element timeline bar */}
                        <div
                          className={`absolute h-6 top-1 rounded ${getElementColor(element.type)} opacity-75 cursor-pointer`}
                          style={{
                            left: timeToPixels(0),
                            width: timeToPixels(state.timeline.duration),
                          }}
                        >
                          <div className="px-2 py-1 text-white text-xs truncate">
                            {(element.properties.content as string) || element.type}
                          </div>
                        </div>
                        
                        {/* Keyframes */}
                        {renderKeyframes(elementId)}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Markers */}
            {renderMarkers()}

            {/* Playhead */}
            {renderPlayhead()}

            {/* Grid lines */}
            {snapToGrid && (
              <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: Math.ceil(state.timeline.duration * 10) }, (_, i) => {
                  const time = i * 0.1;
                  const x = timeToPixels(time);
                  return (
                    <div
                      key={i}
                      className="absolute top-0 bottom-0 w-px bg-gray-200 opacity-50"
                      style={{ left: x }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Timeline Footer */}
      <div className="h-8 bg-gray-50 border-t border-gray-200 flex items-center justify-between px-4 text-xs text-gray-600">
        <div className="flex items-center space-x-4">
          <span>Layers: {state.layers.length}</span>
          <span>Elements: {state.elements.length}</span>
          <span>Markers: {state.timeline.markers.length}</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <span>Zoom: {Math.round(zoom * 100)}%</span>
          <span>Snap: {snapToGrid ? 'On' : 'Off'}</span>
          {selectedTrack && (
            <span>Selected: {state.elements.find(e => e.id === selectedTrack)?.type}</span>
          )}
        </div>
      </div>
    </div>
  );
}