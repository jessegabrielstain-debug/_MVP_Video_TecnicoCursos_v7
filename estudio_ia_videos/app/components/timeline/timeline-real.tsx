
/**
 * 🎬 TimelineReal Component - REAL (não mock)
 * Componente de timeline multi-track com preview sincronizado
 */

'use client';

import { useEffect, useState } from 'react';
import { useTimelineReal } from '@/hooks/use-timeline-real';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import {
  Play,
  Pause,
  Square,
  ZoomIn,
  ZoomOut,
  Plus,
  Save,
} from 'lucide-react';
import type { Track, Clip, TrackType } from '@/lib/types/timeline-types';

interface TimelineRealProps {
  projectId: string;
  onSave?: () => void;
}

export function TimelineReal({ projectId, onSave }: TimelineRealProps) {
  const { timeline, manipulation, videoRef, config } = useTimelineReal({
    projectId,
  });
  
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [draggedClipId, setDraggedClipId] = useState<string | null>(null);
  
  // Carregar timeline ao montar
  useEffect(() => {
    manipulation.load().catch(console.error);
  }, []);
  
  // Calcular largura da timeline
  const timelineWidth = timeline.duration * config.pixelsPerSecond * timeline.zoom;
  
  // Formatar tempo
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };
  
  // Handlers de drag & drop
  const handleClipDragStart = (e: React.DragEvent, clipId: string) => {
    setDraggedClipId(clipId);
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleClipDragEnd = () => {
    setDraggedClipId(null);
  };
  
  const handleTrackDrop = (e: React.DragEvent, trackId: string) => {
    e.preventDefault();
    
    if (!draggedClipId) return;
    
    // Calcular o tempo baseado na posição do mouse
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = (x / (config.pixelsPerSecond * timeline.zoom));
    
    manipulation.moveClip(draggedClipId, trackId, time);
    setDraggedClipId(null);
  };
  
  const handleTrackDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  
  // Handler de save
  const handleSave = async () => {
    try {
      await manipulation.save();
      onSave?.();
    } catch (error) {
      console.error('Error saving timeline:', error);
    }
  };
  
  // Handler de clique na timeline para seek
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = (x / (config.pixelsPerSecond * timeline.zoom));
    manipulation.seek(time);
  };
  
  return (
    <div className="flex flex-col h-full bg-background">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-4 border-b">
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant={timeline.playing ? 'secondary' : 'default'}
            onClick={timeline.playing ? manipulation.pause : manipulation.play}
          >
            {timeline.playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button size="sm" variant="outline" onClick={manipulation.stop}>
            <Square className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2 ml-4">
          <span className="text-sm font-mono">{formatTime(timeline.currentTime)}</span>
          <span className="text-sm text-muted-foreground">/</span>
          <span className="text-sm font-mono text-muted-foreground">
            {formatTime(timeline.duration)}
          </span>
        </div>
        
        <div className="flex items-center gap-1 ml-auto">
          <Button size="sm" variant="outline" onClick={manipulation.zoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm px-2">{Math.round(timeline.zoom * 100)}%</span>
          <Button size="sm" variant="outline" onClick={manipulation.zoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
        
        <Button size="sm" onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save
        </Button>
      </div>
      
      {/* Preview Video */}
      <div className="p-4 border-b">
        <Card className="relative aspect-video bg-black">
          <video
            ref={videoRef}
            className="w-full h-full"
            controls={false}
          />
          
          {/* Overlay de informações */}
          <div className="absolute bottom-2 left-2 text-white text-xs bg-black/50 px-2 py-1 rounded">
            {timeline.resolution.width}×{timeline.resolution.height} @ {timeline.fps}fps
          </div>
        </Card>
      </div>
      
      {/* Timeline Tracks */}
      <div className="flex-1 overflow-auto">
        <div className="flex">
          {/* Track Labels */}
          <div className="w-48 flex-shrink-0 border-r">
            <div className="h-12 border-b flex items-center justify-between px-4">
              <span className="text-sm font-semibold">Tracks</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  const trackTypes: TrackType[] = ['video', 'audio', 'text', 'image'];
                  const type = trackTypes[timeline.tracks.length % trackTypes.length];
                  manipulation.addTrack({
                    name: `Track ${timeline.tracks.length + 1}`,
                    type,
                    volume: 100,
                    muted: false,
                    locked: false,
                    hidden: false,
                  });
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {timeline.tracks.map(track => (
              <div
                key={track.id}
                className="h-20 border-b px-4 flex items-center"
                style={{ height: track.height }}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{track.name}</div>
                  <div className="text-xs text-muted-foreground">{track.type}</div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Timeline Content */}
          <div className="flex-1 relative">
            {/* Ruler */}
            <div className="h-12 border-b relative bg-muted/30">
              <div className="absolute inset-0" style={{ width: timelineWidth }}>
                {Array.from({ length: Math.ceil(timeline.duration) }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute top-0 h-full border-l border-border"
                    style={{
                      left: i * config.pixelsPerSecond * timeline.zoom,
                    }}
                  >
                    <span className="text-xs text-muted-foreground ml-1">
                      {i}s
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Tracks */}
            <div className="relative">
              {timeline.tracks.map(track => (
                <div
                  key={track.id}
                  className="border-b relative"
                  style={{ height: track.height }}
                  onDrop={(e) => handleTrackDrop(e, track.id)}
                  onDragOver={handleTrackDragOver}
                  onClick={handleTimelineClick}
                >
                  <div className="absolute inset-0" style={{ width: timelineWidth }}>
                    {/* Grid lines */}
                    {Array.from({ length: Math.ceil(timeline.duration / config.gridSize) }).map((_, i) => (
                      <div
                        key={i}
                        className="absolute top-0 h-full border-l border-border/20"
                        style={{
                          left: i * config.gridSize * config.pixelsPerSecond * timeline.zoom,
                        }}
                      />
                    ))}
                    
                    {/* Clips */}
                    {track.clips.map(clip => (
                      <div
                        key={clip.id}
                        draggable={!clip.locked}
                        onDragStart={(e) => handleClipDragStart(e, clip.id)}
                        onDragEnd={handleClipDragEnd}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedClipId(clip.id);
                        }}
                        className={`
                          absolute top-1 bottom-1 rounded cursor-move
                          ${selectedClipId === clip.id ? 'ring-2 ring-primary' : ''}
                          ${clip.locked ? 'cursor-not-allowed opacity-50' : ''}
                          ${draggedClipId === clip.id ? 'opacity-50' : ''}
                        `}
                        style={{
                          left: clip.startTime * config.pixelsPerSecond * timeline.zoom,
                          width: clip.duration * config.pixelsPerSecond * timeline.zoom,
                          backgroundColor: getClipColor(clip.type),
                        }}
                      >
                        <div className="px-2 py-1 text-xs text-white truncate">
                          {clip.name || 'Untitled'}
                        </div>
                        
                        {/* Thumbnail se houver */}
                        {clip.content?.thumbnail && (
                          <img
                            src={clip.content.thumbnail}
                            alt={clip.name || 'Clip'}
                            className="absolute inset-0 w-full h-full object-cover opacity-30 rounded"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Playhead */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-primary z-10 pointer-events-none"
              style={{
                left: timeline.currentTime * config.pixelsPerSecond * timeline.zoom,
              }}
            >
              <div className="absolute -top-3 -left-2 w-4 h-4 bg-primary rounded-full" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Clip Inspector (se houver clip selecionado) */}
      {selectedClipId && (
        <div className="h-48 border-t p-4 bg-muted/30">
          <h3 className="text-sm font-semibold mb-2">Clip Properties</h3>
          {(() => {
            const clip = timeline.tracks
              .flatMap(t => t.clips)
              .find(c => c.id === selectedClipId);
            
            if (!clip) return null;
            
            return (
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-muted-foreground">Name</label>
                  <input
                    type="text"
                    value={clip.name}
                    onChange={(e) => manipulation.updateClip(clip.id, { name: e.target.value })}
                    className="w-full px-2 py-1 text-sm border rounded"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground">Start Time</label>
                    <input
                      type="number"
                      value={clip.startTime.toFixed(2)}
                      onChange={(e) => manipulation.updateClip(clip.id, { startTime: parseFloat(e.target.value) })}
                      className="w-full px-2 py-1 text-sm border rounded"
                      step="0.1"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs text-muted-foreground">Duration</label>
                    <input
                      type="number"
                      value={clip.duration.toFixed(2)}
                      onChange={(e) => manipulation.updateClip(clip.id, { duration: parseFloat(e.target.value) })}
                      className="w-full px-2 py-1 text-sm border rounded"
                      step="0.1"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-xs text-muted-foreground">Volume: {clip.volume}%</label>
                  <Slider
                    value={[clip.volume || 100]}
                    onValueChange={([value]) => manipulation.updateClip(clip.id, { volume: value })}
                    max={100}
                    step={1}
                    className="mt-1"
                  />
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

// Helper para cor dos clips
function getClipColor(type?: TrackType): string {
  if (!type) return '#6b7280';
  const colors: Record<string, string> = {
    video: '#3b82f6',
    audio: '#10b981',
    text: '#f59e0b',
    image: '#8b5cf6',
    avatar: '#ec4899',
  };
  return colors[type] || '#6b7280';
}
