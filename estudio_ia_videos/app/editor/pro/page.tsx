'use client';

import React, { useRef } from 'react';
import dynamic from 'next/dynamic';
import Sidebar from './components/Sidebar';
import TimelineContainer from './components/timeline/TimelineContainer';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useExport } from './hooks/useExport';
import { Button } from '@/components/ui/button';
import { Download, Share2 } from 'lucide-react';
import ExportModal from './components/ExportModal';
import type Konva from 'konva'; // Fix SSR crash by using type import

// Dynamically import Konva components to avoid SSR issues
const KonvaStage = dynamic(() => import('./components/KonvaStage'), {
    ssr: false,
    loading: () => <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg animate-pulse">Loading Editor Core...</div>
});

export default function ProEditorPage() {
    useKeyboardShortcuts();
    const stageRef = useRef<Konva.Stage>(null);

    // Export Hook
    const {
        isExporting,
        progress,
        exportModalOpen,
        setExportModalOpen,
        startExport
    } = useExport(stageRef);

    return (
        <div className="flex h-screen w-full bg-background overflow-hidden relative">
            <ExportModal
                open={exportModalOpen}
                onOpenChange={setExportModalOpen}
                onConfirmExport={startExport}
                isExporting={isExporting}
                progress={progress}
            />

            {/* Sidebar */}
            <Sidebar />

            {/* Main Canvas Area */}
            <div className="flex-1 flex flex-col relative">
                {/* Header */}
                <div className="h-14 border-b flex items-center px-4 justify-between bg-background z-10 shrink-0">
                    <div className="font-semibold flex items-center gap-2">
                        VEED-Killer Project (Beta)
                    </div>

                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="hidden sm:flex">
                            <Share2 className="w-4 h-4 mr-2" />
                            Invite
                        </Button>
                        <Button
                            size="sm"
                            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90"
                            onClick={() => setExportModalOpen(true)}
                            disabled={isExporting}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Export Video
                        </Button>
                    </div>
                </div>

                {/* Canvas Wrapper */}
                <div className="flex-1 overflow-hidden relative bg-gray-50/50 dark:bg-gray-950/50 flex items-center justify-center">
                    {/* Pass stageRef to KonvaStage */}
                    <KonvaStage stageRef={stageRef} />
                </div>

                {/* Timeline */}
                <div className="h-80 border-t bg-background z-10 shrink-0">
                    <TimelineContainer />
                </div>
            </div>

            {/* Properties Panel - Placeholder */}
            <div className="w-72 border-l bg-background flex flex-col z-10 hidden lg:flex">
                <div className="p-4 border-b">
                    <h2 className="font-semibold text-sm">Properties</h2>
                </div>
                <div className="p-4 text-xs text-muted-foreground">
                    Select an element to edit properties.
                </div>
            </div>
        </div>
    );
}
