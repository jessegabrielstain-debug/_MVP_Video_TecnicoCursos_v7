'use client';
import React, { useState } from 'react';
import { useEditorStore } from '../stores/useEditorStore';
import { LayoutGrid, Type, Video, Music, Image as ImageIcon } from 'lucide-react';
import SubtitlesPanel from './SubtitlesPanel';

const Sidebar = () => {
    const [activeTab, setActiveTab] = useState<'assets' | 'subtitles'>('assets');
    const addElement = useEditorStore((state) => state.addElement);

    const handleDragStart = (e: React.DragEvent, type: string, src?: string) => {
        e.dataTransfer.setData('application/json', JSON.stringify({ type, src }));
    };

    return (
        <div className="flex h-full border-r bg-muted/30">
            {/* Navigation Rail */}
            <div className="w-16 flex flex-col items-center py-4 gap-4 border-r bg-background">
                <NavButton icon={<LayoutGrid />} active={activeTab === 'assets'} onClick={() => setActiveTab('assets')} label="Assets" />
                <NavButton icon={<Type />} active={activeTab === 'subtitles'} onClick={() => setActiveTab('subtitles')} label="Subtitles" />
            </div>

            {/* Content Area */}
            <div className="w-64 flex flex-col">
                {activeTab === 'subtitles' ? (
                    <SubtitlesPanel />
                ) : (
                    <>
                        <div className="p-4 border-b">
                            <h2 className="font-bold text-lg">Assets</h2>
                        </div>
                        <div className="flex-1 p-4 flex flex-col gap-4">
                            {/* Shapes Section */}
                            <div>
                                <h3 className="text-xs font-semibold text-muted-foreground mb-2">Shapes</h3>
                                <div className="flex gap-2">
                                    <div
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, 'shape')}
                                        className="w-12 h-12 bg-red-500 rounded cursor-grab active:cursor-grabbing hover:opacity-80 shadow-sm"
                                        title="Drag Rectangle"
                                    />
                                </div>
                            </div>

                            {/* Text Section */}
                            <div>
                                <h3 className="text-xs font-semibold text-muted-foreground mb-2">Text</h3>
                                <div
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, 'text')}
                                    className="p-2 border border-dashed rounded cursor-grab bg-white dark:bg-black text-center text-sm hover:shadow-sm"
                                >
                                    Headline Text
                                </div>
                            </div>

                            {/* Video Section (Mock) */}
                            <div>
                                <h3 className="text-xs font-semibold text-muted-foreground mb-2">Videos (Mock)</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <div
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, 'video', 'https://upload.wikimedia.org/wikipedia/commons/transcoded/c/c0/Big_Buck_Bunny_4K.webm/Big_Buck_Bunny_4K.webm.480p.vp9.webm')}
                                        className="aspect-video bg-black rounded overflow-hidden cursor-grab relative group"
                                    >
                                        <video src="https://upload.wikimedia.org/wikipedia/commons/transcoded/c/c0/Big_Buck_Bunny_4K.webm/Big_Buck_Bunny_4K.webm.480p.vp9.webm" className="w-full h-full object-cover pointer-events-none" />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition">
                                            <span className="text-xs text-white">Drag</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

const NavButton = ({ icon, active, onClick, label }: any) => (
    <button
        onClick={onClick}
        className={`p-3 rounded-xl transition-colors flex flex-col items-center gap-1 ${active ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50' : 'text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800'}`}
    >
        {React.cloneElement(icon, { size: 20 })}
        <span className="text-[10px] font-medium">{label}</span>
    </button>
);

export default Sidebar;
