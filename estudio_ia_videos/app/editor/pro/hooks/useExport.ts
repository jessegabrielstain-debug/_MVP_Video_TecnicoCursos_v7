import { useState, useEffect, useRef } from 'react';
import type Konva from 'konva'; // Fix SSR crash
import { useEditorStore } from '../stores/useEditorStore';

// Extend Window for legacy webkit AudioContext support
declare global {
    interface Window {
        webkitAudioContext?: typeof AudioContext;
    }
}

export const useExport = (stageRef: React.RefObject<Konva.Stage>) => {
    const [isExporting, setIsExporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [exportModalOpen, setExportModalOpen] = useState(false);
    
    // Store access
    const setCurrentTime = useEditorStore(state => state.setCurrentTime);
    const setIsPlaying = useEditorStore(state => state.setIsPlaying);
    const duration = useEditorStore(state => state.duration);
    const currentTime = useEditorStore(state => state.currentTime);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    
    // We need to track export state to drive the "Render Loop"
    useEffect(() => {
        if (isExporting) {
            // Update progress
            const prog = Math.min(100, (currentTime / duration) * 100);
            setProgress(prog);

            // Check if finished
            if (currentTime >= duration) {
                stopExport();
            }
        }
    }, [currentTime, isExporting, duration]);

    const startExport = async () => {
        if (!stageRef.current) return;
        
        setIsExporting(true);
        setProgress(0);
        
        // 1. Reset to start
        setIsPlaying(false);
        setCurrentTime(0);

        // 2. Wait a tick for canvas to update
        setTimeout(() => {
            const canvas = stageRef.current?.toCanvas();
            if (!canvas) return;

            // 3. Audio Context & Mixing
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            const audioCtx = AudioContextClass ? new AudioContextClass() : null;
            if (!audioCtx) {
                console.error('AudioContext not supported');
                return;
            }
            const dest = audioCtx.createMediaStreamDestination();
            
            // Collect all active video elements
            const activeVideos = useEditorStore.getState().activeVideoElements;
            
            // Connect them to destination
            // Note: createMediaElementSource can throw if already connected.
            // In a pro app we would manage a persistent AudioGraph.
            // For MVP hack: we simply try/catch or assume fresh elements.
            // Since we just mounted, they are fresh 'video' DOM elements (created in CanvasVideo useEffect).
            
            activeVideos.forEach((vid, id) => {
                if (vid) {
                    try {
                        const source = audioCtx.createMediaElementSource(vid);
                        source.connect(dest);
                        // Also connect to speakers so we can hear it while exporting?
                        // source.connect(audioCtx.destination); 
                        // If we do this, it might double up if the video element itself is already outputting.
                        // Since video element is in memory and .play() is called, it outputs to default.
                        // createMediaElementSource hijacks it, so we DO need to connect to context destination if we want to hear it.
                        // BUT, connecting to 'dest' (MediaStream) is for recording.
                        // Let's connect to both.
                        // source.connect(audioCtx.destination);
                    } catch (e) {
                         console.warn("Audio source already connected or error:", e);
                         // If already connected, it's fine (maybe), but this API is strict.
                    }
                }
            });

            // 4. Capture Canvas Stream
            const canvasStream = canvas.captureStream(30);
            
            // 5. Combine Streams
            const finalStream = new MediaStream([
                ...canvasStream.getVideoTracks(),
                ...dest.stream.getAudioTracks()
            ]);
            
            // 6. Setup Recorder
            const recorder = new MediaRecorder(finalStream, {
                mimeType: 'video/webm;codecs=vp9'
            });

            chunksRef.current = [];
            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);
                
                const a = document.createElement('a');
                a.href = url;
                a.download = `video-export-${Date.now()}.webm`;
                a.click();
                URL.revokeObjectURL(url);
                
                // Cleanup
                audioCtx.close();
                setIsExporting(false);
                setExportModalOpen(false);
            };

            mediaRecorderRef.current = recorder;
            recorder.start();

            // 7. Start Playback
            setIsPlaying(true);
        }, 500);
    };

    const stopExport = () => {
        setIsPlaying(false);
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
    };

    return {
        isExporting,
        progress,
        exportModalOpen,
        setExportModalOpen,
        startExport
    };
};
