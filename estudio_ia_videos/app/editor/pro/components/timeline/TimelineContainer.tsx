'use client';

import React, { useRef, useState, useCallback } from 'react';
import { useEditorStore } from '../../stores/useEditorStore';
import TimeRuler from './TimeRuler';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Play, Pause, SkipBack, SkipForward, ZoomIn, ZoomOut } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

// Subtitle Track Component
const SubtitlesTrack = ({ zoom }: { zoom: number }) => {
    const subtitles = useEditorStore((state) => state.subtitles);

    return (
        <div className="h-16 border-b flex relative group bg-indigo-50/30 dark:bg-indigo-900/10 border-indigo-100">
            {/* Header */}
            <div className="w-48 border-r bg-muted/10 sticky left-0 z-10 p-2 flex flex-col justify-center shrink-0">
                <div className="text-xs font-medium text-indigo-600 dark:text-indigo-400">Subtitles</div>
            </div>

            {/* Content */}
            <div className="flex-1 relative h-full">
                {subtitles.map(sub => (
                    <div
                        key={sub.id}
                        className="absolute top-2 bottom-2 rounded bg-indigo-200 dark:bg-indigo-800 border border-indigo-300 flex items-center px-2 text-[10px] overflow-hidden whitespace-nowrap"
                        style={{
                            left: (sub.startTime / 1000) * zoom,
                            width: ((sub.endTime - sub.startTime) / 1000) * zoom
                        }}
                        title={sub.text}
                    >
                        {sub.text}
                    </div>
                ))}
            </div>
        </div>
    );
};

const TimelineContainer = () => {
    const tracks = useEditorStore((state) => state.tracks);
    const elements = useEditorStore((state) => state.elements);
    const zoom = useEditorStore((state) => state.zoom);
    const setZoom = useEditorStore((state) => state.setZoom);
    const currentTime = useEditorStore((state) => state.currentTime);
    const isPlaying = useEditorStore((state) => state.isPlaying);
    const setIsPlaying = useEditorStore((state) => state.setIsPlaying);
    const setCurrentTime = useEditorStore((state) => state.setCurrentTime);
    const updateElement = useEditorStore((state) => state.updateElement);

    const togglePlay = () => setIsPlaying(!isPlaying);

    // Master Clock Loop
    const requestRef = useRef<number>();
    const previousTimeRef = useRef<number>();

    const animate = useCallback((time: number) => {
        if (previousTimeRef.current !== undefined) {
            const deltaTime = time - previousTimeRef.current;
            setCurrentTime(currentTime + deltaTime); // Update store
        }
        previousTimeRef.current = time;
        requestRef.current = requestAnimationFrame(animate);
    }, [currentTime, setCurrentTime]);

    React.useEffect(() => {
        if (isPlaying) {
            let lastTimestamp = Date.now();
            const loop = () => {
                const now = Date.now();
                const delta = now - lastTimestamp;
                if (delta > 0) {
                    useEditorStore.setState((state) => ({
                        currentTime: state.currentTime + delta
                    }));
                    lastTimestamp = now;
                }
                requestRef.current = requestAnimationFrame(loop);
            };
            requestRef.current = requestAnimationFrame(loop);
        } else {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        }
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isPlaying]);

    // Zoom Handlers
    const handleZoomChange = (value: number[]) => {
        setZoom(value[0]);
    };

    return (
        <div className="flex flex-col h-full bg-background border-t">
            {/* Controls Bar */}
            <div className="h-10 border-b flex items-center px-4 gap-4 bg-muted/20 justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <button className="p-1 hover:bg-gray-200 rounded" onClick={() => setCurrentTime(0)}>
                        <SkipBack size={16} />
                    </button>
                    <button className="p-1 hover:bg-gray-200 rounded" onClick={togglePlay}>
                        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                    <button className="p-1 hover:bg-gray-200 rounded">
                        <SkipForward size={16} />
                    </button>
                    <div className="text-xs font-mono ml-4 w-16">
                        {(currentTime / 1000).toFixed(2)}s
                    </div>
                </div>
                <div className="flex items-center gap-2 w-48">
                    <ZoomOut size={14} className="text-muted-foreground" />
                    <Slider
                        value={[zoom]}
                        min={10}
                        max={300}
                        step={10}
                        onValueChange={handleZoomChange}
                        className="w-24"
                    />
                    <ZoomIn size={14} className="text-muted-foreground" />
                </div>
            </div>

            {/* Timeline Area with TimeRuler */}
            <div className="flex-1 overflow-hidden flex flex-col relative select-none">
                <ScrollArea className="w-full h-full">
                    <div className="min-w-full relative" style={{ height: 'max-content' }}>
                        {/* Time Ruler (Sticky) */}
                        <div className="sticky top-0 z-20 bg-background border-b shadow-sm">
                            <TimeRuler />
                        </div>

                        {/* Tracks */}
                        <div className="p-0 relative bg-gray-50/50 min-h-[300px]">
                            {/* Global Playhead Line spanning all tracks */}
                            <div
                                className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
                                style={{ left: (currentTime / 1000) * zoom, height: '100%' }}
                            />

                            {/* Subtitles Track */}
                            <SubtitlesTrack zoom={zoom} />

                            {tracks.map(track => (
                                <TrackRow
                                    key={track.id}
                                    track={track}
                                    elements={elements.filter(e => e.trackId === track.id)}
                                    zoom={zoom}
                                    onUpdateElement={updateElement}
                                />
                            ))}
                        </div>
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </div>
        </div>
    );
};

interface TrackRowProps {
    track: any;
    elements: any[];
    zoom: number;
    onUpdateElement: (id: string, updates: any) => void;
}

const TrackRow = ({ track, elements, zoom, onUpdateElement }: TrackRowProps) => {
    return (
        <div className="h-24 border-b flex relative group bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800">
            {/* Track Header (Left) - Sticky */}
            <div className="w-48 border-r bg-muted/10 sticky left-0 z-10 p-2 flex flex-col justify-center shrink-0 shadow-[4px_0_5px_-2px_rgba(0,0,0,0.1)]">
                <div className="text-xs font-medium truncate mb-1">{track.name}</div>
                <div className="text-[10px] text-muted-foreground uppercase">{track.type}</div>
            </div>

            {/* Track Content (Right) */}
            <div className="flex-1 relative h-full">
                {/* Grid Lines */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTAwIDBMIHAgMTAwIiBzdHJva2U9IiNlNWU3ZWIiIHN0cm9rZS13aWR0aD0iMSIvPjwvc3ZnPg==')] opacity-20"
                    style={{ backgroundSize: `${zoom}px 100%` }}
                />

                {elements.map(el => (
                    <TimelineClip
                        key={el.id}
                        element={el}
                        zoom={zoom}
                        onUpdate={(updates) => onUpdateElement(el.id, updates)}
                    />
                ))}
            </div>
        </div>
    );
};

const TimelineClip = ({ element, zoom, onUpdate }: { element: any, zoom: number, onUpdate: (u: any) => void }) => {
    const isDragging = useRef(false);
    const startX = useRef(0);
    const startStartTime = useRef(0);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        isDragging.current = true;
        startX.current = e.clientX;
        startStartTime.current = element.startTime;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            if (!isDragging.current) return;
            const deltaX = moveEvent.clientX - startX.current;
            const deltaTime = (deltaX / zoom) * 1000;
            const newStartTime = Math.max(0, startStartTime.current + deltaTime);
            onUpdate({ startTime: newStartTime });
        };

        const handleMouseUp = () => {
            isDragging.current = false;
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        if (confirm('Delete this clip?')) {
            useEditorStore.getState().removeElement(element.id);
        }
    };

    return (
        <div
            onMouseDown={handleMouseDown}
            onContextMenu={handleContextMenu}
            className="absolute top-2 bottom-2 rounded-md border cursor-move overflow-hidden transition-colors shadow-sm select-none flex flex-col"
            style={{
                left: (element.startTime / 1000) * zoom,
                width: Math.max(2, (element.duration / 1000) * zoom),
                backgroundColor: element.type === 'video' ? '#3b82f6' : element.type === 'audio' ? '#10b981' : '#f59e0b',
                borderColor: 'rgba(255,255,255,0.3)',
                opacity: 0.9
            }}
            title={`${element.name || element.type} (${(element.duration / 1000).toFixed(1)}s)`}
        >
            <div className="px-2 py-1 text-xs text-white font-medium truncate drop-shadow-md">
                {element.text || element.type}
            </div>
            <div className="flex-1 bg-black/10 w-full" />
        </div>
    );
};

export default TimelineContainer;
