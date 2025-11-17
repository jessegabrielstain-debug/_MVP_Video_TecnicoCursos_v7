/**
 * Video Studio - Advanced Timeline Editor
 * Professional video editing interface with PPTX integration
 */

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TimelineEditor } from '../components/timeline/timeline-editor';
import { ExportModal } from '../components/export/export-modal';
import { useTimeline } from '../hooks/use-timeline';
import { TimelineElement, TimelineLayer } from '@/lib/types/timeline-types';
import { 
  Upload, 
  Play, 
  Pause, 
  Download, 
  Settings, 
  Layers,
  Video,
  AudioLines,
  Type,
  Image as ImageIcon,
  FileText,
  User
} from 'lucide-react';

export default function VideoStudioPage() {
  const [selectedTool, setSelectedTool] = useState<string>('select');
  const [showExportModal, setShowExportModal] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const timeline = useTimeline();

  // Asset library items (would be loaded from API/storage)
  const assetLibrary = [
    { id: '1', type: 'video', name: 'Intro Video', url: '/sample-video.mp4', thumbnail: '/thumb1.jpg' },
    { id: '2', type: 'audio', name: 'Background Music', url: '/sample-audio.mp3', thumbnail: '/audio-thumb.png' },
    { id: '3', type: 'image', name: 'Logo', url: '/logo.png', thumbnail: '/logo.png' },
    { id: '4', type: 'pptx-slide', name: 'Slide 1', url: '/slide1.png', thumbnail: '/slide1-thumb.png' }
  ];

  const tools = [
    { id: 'select', name: 'Select', icon: Upload },
    { id: 'video', name: 'Video', icon: Video },
    { id: 'audio', name: 'Audio', icon: AudioLines },
    { id: 'text', name: 'Text', icon: Type },
    { id: 'image', name: 'Image', icon: ImageIcon },
    { id: 'pptx', name: 'PPTX', icon: FileText },
    { id: 'avatar', name: 'Avatar', icon: User }
  ];

  const handleAddElement = (type: string, data: any = {}) => {
    const newElement: TimelineElement = {
      id: crypto.randomUUID(),
      type: type as TimelineElement['type'],
      layer: 0, // Default layer, should be determined by type
      start: timeline.project.currentTime,
      duration: 5000,
      source: data.url || '',
      data: data
    };

    let targetLayerId = 'video-layer';
    if (type === 'audio') targetLayerId = 'audio-layer';
    if (type === 'text' || type === 'image' || type === 'pptx-slide' || type === 'avatar') targetLayerId = 'overlay-layer';

    timeline.addElement(newElement, targetLayerId);
  };

  const handleFileImport = (file: File) => {
    // Handle different file types
    const fileType = file.type;
    let elementType = 'video';
    
    if (fileType.startsWith('audio/')) {
      elementType = 'audio';
    } else if (fileType.startsWith('image/')) {
      elementType = 'image';
    } else if (file.name.endsWith('.pptx')) {
      elementType = 'pptx-slide';
    }

    // Create URL for the file (in real app, would upload to storage)
    const url = URL.createObjectURL(file);
    
    handleAddElement(elementType, {
      src: url,
      filename: file.name,
      fileSize: file.size
    });
  };

  const handleExport = () => {
    setShowExportModal(true);
  };

  return (
    <div className="video-studio min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <header className="h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-white">Video Studio Pro</h1>
          <div className="text-sm text-gray-400">
            {timeline.project.name} • {Math.round(timeline.project.duration / 1000)}s
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center space-x-2"
          >
            {isPreviewMode ? <Settings size={16} /> : <Play size={16} />}
            <span>{isPreviewMode ? 'Edit' : 'Preview'}</span>
          </button>
          
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center space-x-2"
          >
            <Download size={16} />
            <span>Export</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Tools and Assets */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
          {/* Tools */}
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-sm font-medium text-gray-300 mb-3">TOOLS</h3>
            <div className="grid grid-cols-4 gap-2">
              {tools.map(tool => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.id}
                    onClick={() => setSelectedTool(tool.id)}
                    className={`p-3 rounded-lg border transition-all ${
                      selectedTool === tool.id
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                    }`}
                    title={tool.name}
                  >
                    <Icon size={20} className="mx-auto" />
                    <div className="text-xs mt-1">{tool.name}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Asset Library */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-300">MEDIA LIBRARY</h3>
              <button
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'video/*,audio/*,image/*,.pptx';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) handleFileImport(file);
                  };
                  input.click();
                }}
                className="p-1 text-gray-400 hover:text-white transition-colors"
                title="Import media"
              >
                <Upload size={16} />
              </button>
            </div>

            <div className="space-y-2">
              {assetLibrary.map(asset => (
                <motion.div
                  key={asset.id}
                  className="p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors"
                  onClick={() => handleAddElement(asset.type, { src: asset.url, imageUrl: asset.thumbnail })}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-8 bg-gray-600 rounded overflow-hidden flex-shrink-0">
                      <img 
                        src={asset.thumbnail} 
                        alt={asset.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-white truncate">
                        {asset.name}
                      </div>
                      <div className="text-xs text-gray-400 capitalize">
                        {asset.type}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="mt-6 pt-4 border-t border-gray-700">
              <h4 className="text-xs font-medium text-gray-400 mb-2">QUICK ADD</h4>
              <div className="space-y-1">
                <button
                  onClick={() => handleAddElement('text', { text: 'Sample Text', fontSize: 24, color: '#ffffff' })}
                  className="w-full p-2 text-left text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
                >
                  + Add Text
                </button>
                <button
                  onClick={() => handleAddElement('shape', { shapeType: 'rectangle', color: '#3b82f6' })}
                  className="w-full p-2 text-left text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
                >
                  + Add Shape
                </button>
                <button
                  onClick={() => handleAddElement('avatar', { modelUrl: '/avatar-sample.glb', voiceId: 'pt-BR-Neural2-A' })}
                  className="w-full p-2 text-left text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
                >
                  + Add Avatar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Preview Area */}
          {isPreviewMode && (
            <div className="h-64 bg-black border-b border-gray-700 flex items-center justify-center">
              <div className="text-gray-400">
                <Video size={48} className="mx-auto mb-2" />
                <div>Video Preview</div>
                <div className="text-sm mt-1">1920x1080 • 30fps</div>
              </div>
            </div>
          )}

          {/* Timeline Editor */}
          <div className="flex-1">
            <TimelineEditor
              height={isPreviewMode ? 400 : 600}
              onExport={handleExport}
              onImport={handleFileImport}
              showPreview={isPreviewMode}
            />
          </div>
        </div>

        {/* Right Sidebar - Properties */}
        <div className="w-72 bg-gray-800 border-l border-gray-700 p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-4">PROPERTIES</h3>
          
          {timeline.project.selectedElementIds && timeline.project.selectedElementIds.length > 0 ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Element Name</label>
                <input 
                  type="text" 
                  className="w-full bg-gray-700 text-white text-sm p-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                  defaultValue="Selected Element"
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-400 mb-1">Opacity</label>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.1" 
                  defaultValue="1"
                  className="w-full"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">X Position</label>
                  <input 
                    type="number" 
                    className="w-full bg-gray-700 text-white text-sm p-2 rounded border border-gray-600"
                    defaultValue="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Y Position</label>
                  <input 
                    type="number" 
                    className="w-full bg-gray-700 text-white text-sm p-2 rounded border border-gray-600"
                    defaultValue="0"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500 text-center py-8">
              Select an element to edit properties
            </div>
          )}

          {/* Project Settings */}
          <div className="mt-8 pt-4 border-t border-gray-700">
            <h4 className="text-sm font-medium text-gray-300 mb-3">PROJECT</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Duration:</span>
                <span className="text-white">{Math.round(timeline.project.duration / 1000)}s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Resolution:</span>
                <span className="text-white">{timeline.project.resolution.width}x{timeline.project.resolution.height}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Frame Rate:</span>
                <span className="text-white">{timeline.project.fps} fps</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Elements:</span>
                <span className="text-white">
                  {timeline.project.layers ? timeline.project.layers.reduce((acc: number, layer: TimelineLayer) => acc + layer.elements.length, 0) : 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Exportação */}
      <ExportModal 
        isOpen={showExportModal} 
        onClose={() => setShowExportModal(false)} 
      />
    </div>
  );
}