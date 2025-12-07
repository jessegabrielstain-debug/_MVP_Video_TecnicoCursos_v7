'use client';
import React from 'react';
import { useEditorStore } from '../stores/useEditorStore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Type, Sparkles, Trash2, Clock } from 'lucide-react';

const SubtitlesPanel = () => {
    const subtitles = useEditorStore(state => state.subtitles);
    const addSubtitle = useEditorStore(state => state.addSubtitle);
    const updateSubtitle = useEditorStore(state => state.updateSubtitle);
    const deleteSubtitle = useEditorStore(state => state.deleteSubtitle);
    const currentTime = useEditorStore(state => state.currentTime);

    const handleAddManual = () => {
        addSubtitle({
            id: `sub-${Date.now()}`,
            text: 'New Subtitle',
            startTime: currentTime,
            endTime: currentTime + 3000, // 3s default
            style: {
                fontSize: 24,
                fontFamily: 'Arial',
                fill: 'white',
                align: 'center'
            }
        });
    };

    const handleAutoGenerate = () => {
        // Mock API Call
        setTimeout(() => {
            const mockSubs = [
                { id: 'auto-1', text: "Welcome to this tutorial.", startTime: 500, endTime: 2500 },
                { id: 'auto-2', text: "Today we will learn Konva.", startTime: 2600, endTime: 4500 },
                { id: 'auto-3', text: "It is very powerful.", startTime: 4600, endTime: 6000 },
            ];

            mockSubs.forEach(sub => {
                addSubtitle({
                    ...sub,
                    style: { fontSize: 24, fontFamily: 'Arial', fill: 'white', align: 'center' }
                });
            });
        }, 1000);
    };

    return (
        <div className="flex flex-col h-full bg-background">
            <div className="p-4 border-b">
                <h2 className="font-bold text-lg flex items-center gap-2">
                    <Type className="w-5 h-5" />
                    Subtitles
                </h2>
            </div>

            <Tabs defaultValue="auto" className="flex-1 flex flex-col">
                <div className="px-4 pt-2">
                    <TabsList className="w-full">
                        <TabsTrigger value="auto" className="flex-1">Auto Subtitles</TabsTrigger>
                        <TabsTrigger value="manual" className="flex-1">Manual</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="auto" className="flex-1 p-4 flex flex-col gap-4">
                    <div className="bg-muted p-4 rounded-lg text-center space-y-3">
                        <div className="bg-blue-100 dark:bg-blue-900/30 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                            <Sparkles className="w-6 h-6 text-blue-500" />
                        </div>
                        <h3 className="font-semibold">AI Auto-Transcribe</h3>
                        <p className="text-xs text-muted-foreground">
                            Automatically generate subtitles from your video audio using AI.
                        </p>
                        <Button onClick={handleAutoGenerate} className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
                            Generate Subtitles (Mock)
                        </Button>
                    </div>
                </TabsContent>

                <TabsContent value="manual" className="flex-1 p-4">
                    <Button onClick={handleAddManual} variant="outline" className="w-full mb-4">
                        + Add Subtitle at Current Time
                    </Button>
                </TabsContent>

                {/* Subtitle List */}
                <div className="flex-1 border-t bg-gray-50/50 dark:bg-gray-900/50 flex flex-col overflow-hidden">
                    <div className="p-2 text-xs font-semibold text-muted-foreground bg-background border-b">
                        Timeline
                    </div>
                    <ScrollArea className="flex-1 p-2">
                        <div className="space-y-2">
                            {subtitles.sort((a, b) => a.startTime - b.startTime).map(sub => (
                                <div key={sub.id} className="bg-background border rounded p-3 text-sm hover:border-blue-500 transition-colors group">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Clock className="w-3 h-3" />
                                            <span>{(sub.startTime / 1000).toFixed(1)}s - {(sub.endTime / 1000).toFixed(1)}s</span>
                                        </div>
                                        <button onClick={() => deleteSubtitle(sub.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <Textarea
                                        value={sub.text}
                                        onChange={(e) => updateSubtitle(sub.id, { text: e.target.value })}
                                        className="h-auto min-h-[60px] resize-none border-0 shadow-none focus-visible:ring-0 p-0 bg-transparent text-sm"
                                    />
                                </div>
                            ))}
                            {subtitles.length === 0 && (
                                <div className="text-center text-xs text-muted-foreground py-8">
                                    No subtitles yet.
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </Tabs>
        </div>
    );
};

export default SubtitlesPanel;
