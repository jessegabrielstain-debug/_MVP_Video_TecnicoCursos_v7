'use client';

import React, { useRef, useEffect } from 'react';
import { useEditorStore } from '../../stores/useEditorStore';

const TimeRuler = () => {
    const duration = useEditorStore((state) => state.duration);
    const zoom = useEditorStore((state) => state.zoom);
    const currentTime = useEditorStore((state) => state.currentTime);
    const setCurrentTime = useEditorStore((state) => state.setCurrentTime);

    // Calculate total width based on duration and zoom
    const totalWidth = (duration / 1000) * zoom;

    // Generate scale markers
    const markers = [];
    const seconds = duration / 1000;

    for (let i = 0; i <= seconds; i++) {
        markers.push(
            <div
                key={i}
                className="absolute top-0 h-full border-l border-gray-400 text-[10px] pl-1 select-none"
                style={{ left: i * zoom }}
            >
                {i % 5 === 0 ? `${i}s` : ''}
            </div>
        );
        // Sub-markers
        for (let j = 1; j < 5; j++) {
            // 5 sub-divisions per second? maybe too detailed
            // Let's do half seconds
            if (i < seconds) {
                markers.push(
                    <div
                        key={`${i}-${j}`}
                        className="absolute bottom-0 h-2 border-l border-gray-300"
                        style={{ left: (i + j * 0.2) * zoom }}
                    />
                );
            }
        }
    }

    const handleSeek = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const time = (x / zoom) * 1000;
        setCurrentTime(time);
    };

    return (
        <div
            className="h-8 w-full bg-gray-100 border-b relative cursor-pointer overflow-hidden"
            onClick={handleSeek}
        >
            <div style={{ width: totalWidth, height: '100%', position: 'relative' }}>
                {markers}
            </div>

            {/* Playhead Indicator */}
            <div
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
                style={{ left: (currentTime / 1000) * zoom }}
            >
                <div className="w-3 h-3 bg-red-500 rounded-full -ml-1.5 -mt-1.5" />
            </div>
        </div>
    );
};

export default TimeRuler;
