/**
 * 🎬 Timeline Editor Implementation
 * Complete implementation of Timeline Editor with PPTX integration
 */

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTimeline, TimelineProject, TimelineElement, TimelineTrack } from '@/hooks/useTimeline';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward,
  Volume2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Copy,
  Plus,
  Settings,
  Save,
  Download,
  Film,
  Music,
  Type,
  Image as ImageIcon,
  Layers,
  ZoomIn,
  ZoomOut,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

export default function TimelineEditorSimple() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project');
  
  const {
    project,
    isLoading,
    error,
    loadProject,
    createProject,
    saveProject,
    updateProject,
    play,
    pause,
    stop,
    seek,
    exportToVideo,
    updateElement,
    deleteElement,
    duplicateElement,
    renderJob
  } = useTimeline();

  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  
  // Load project on mount
  useEffect(() => {
    if (projectId) {
      loadProject(projectId);
    } else {
      // If no project ID, create a demo one or redirect
      // For now, let's create a demo project in memory
      createProject('Novo Projeto', {
        duration: 30,
        fps: 30,
        width: 1920,
        height: 1080,
        tracks: [
            {
              id: 'track-1',
              name: 'Vídeo Principal',
              type: 'video',
              visible: true,
              locked: false,
              elements: []
            },
            {
              id: 'track-2',
              name: 'Áudio',
              type: 'audio',
              visible: true,
              locked: false,
              elements: []
            }
          ]
      });
    }
  }, [projectId, loadProject, createProject]);

  // Element rendering
  const renderElement = (element: TimelineElement, trackIndex: number) => {
    if (!project) return null;
    
    const elementWidth = (element.duration / project.duration) * 800 * project.zoom;
    const elementLeft = (element.startTime / project.duration) * 800 * project.zoom;
    
    const getElementColor = (type: string) => {
      switch (type) {
        case 'image': return 'bg-blue-500';
        case 'text': return 'bg-green-500';
        case 'audio': return 'bg-orange-500';
        case 'video': return 'bg-purple-500';
        default: return 'bg-gray-500';
      }
    };

    return (
      <div
        key={element.id}
        className={`absolute h-12 ${getElementColor(element.type)} rounded cursor-pointer border-2 ${
          selectedElementId === element.id ? 'border-white' : 'border-transparent'
        } opacity-90 hover:opacity-100 transition-opacity`}
        style={{
          width: `${Math.max(elementWidth, 20)}px`, // Min width for visibility
          left: `${elementLeft}px`,
          top: `${trackIndex * 60 + 60}px` // Adjusted for track layout
        }}
        onClick={(e) => {
            e.stopPropagation();
            setSelectedElementId(element.id);
        }}
        title={`${element.name} (${element.duration}s)`}
      >
        <div className="p-2 text-white text-xs font-medium truncate">
          {element.name}
        </div>
      </div>
    );
  };

  if (isLoading && !project) {
      return (
          <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              <span>Carregando projeto...</span>
          </div>
      );
  }

  if (error) {
      return (
          <div className="min-h-screen bg-gray-900 flex items-center justify-center text-red-500">
              <span>Erro: {error}</span>
          </div>
      );
  }

  if (!project) {
      return (
          <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
              <span>Nenhum projeto carregado.</span>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Film className="h-6 w-6" />
            <div>
              <h1 className="text-lg font-semibold">{project.name}</h1>
              <p className="text-sm text-gray-400">
                {project.width}x{project.height} • {project.fps}fps • {project.duration}s
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => saveProject()} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Salvar
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportToVideo()} disabled={isLoading}>
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>
      </div>

      <div className="flex h-screen pt-0">
        {/* Timeline Area */}
        <div className="flex-1 flex flex-col">
          {/* Playback Controls */}
          <div className="bg-gray-800 border-b border-gray-700 p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={stop}
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={project.isPlaying ? pause : play}
                >
                  {project.isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => seek(project.duration)}
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex-1 max-w-md">
                <Slider
                  value={[project.currentTime]}
                  onValueChange={([value]) => seek(value)}
                  max={project.duration}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <div className="text-sm font-mono">
                {project.currentTime.toFixed(1)}s / {project.duration}s
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => updateProject({ zoom: Math.max(0.1, project.zoom - 0.1) })}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm">{Math.round(project.zoom * 100)}%</span>
                <Button variant="outline" size="sm" onClick={() => updateProject({ zoom: Math.min(5, project.zoom + 0.1) })}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Timeline Canvas */}
          <div className="flex-1 bg-gray-900 relative overflow-auto" onClick={() => setSelectedElementId(null)}>
            {/* Time Ruler */}
            <div className="h-8 bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
              <div className="relative h-full">
                {Array.from({ length: Math.ceil(project.duration) + 1 }, (_, i) => (
                  <div
                    key={i}
                    className="absolute top-0 h-full border-l border-gray-600 text-xs text-gray-400 pl-1"
                    style={{ left: `${(i / project.duration) * 800 * project.zoom}px` }}
                  >
                    {i}s
                  </div>
                ))}
              </div>
            </div>

            {/* Tracks and Elements */}
            <div className="relative min-h-96">
              {project.tracks.map((track, trackIndex) => (
                <div key={track.id} className="relative">
                  {/* Track Header */}
                  <div className="h-14 bg-gray-800 border-b border-gray-700 flex items-center px-4 sticky left-0 z-20 w-48">
                    <div className="flex items-center gap-2">
                      {track.type === 'video' && <Film className="h-4 w-4" />}
                      {track.type === 'audio' && <Music className="h-4 w-4" />}
                      {track.type === 'overlay' && <Layers className="h-4 w-4" />}
                      
                      <span className="text-sm font-medium">{track.name}</span>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Toggle visibility logic here if needed
                        }}
                      >
                        {track.visible ? (
                          <Eye className="h-3 w-3" />
                        ) : (
                          <EyeOff className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Track Lane */}
                  <div className="h-14 bg-gray-700 border-b border-gray-600 relative">
                    {track.elements.map(element => renderElement(element, trackIndex))}
                  </div>
                </div>
              ))}
            </div>

            {/* Playhead */}
            <div
              className="absolute top-8 bottom-0 w-0.5 bg-red-500 z-30 pointer-events-none"
              style={{
                left: `${(project.currentTime / project.duration) * 800 * project.zoom}px`
              }}
            >
              <div className="w-3 h-3 bg-red-500 -ml-1.5 -mt-1 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Properties Panel */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 p-4">
          <h3 className="text-lg font-semibold mb-4">Propriedades</h3>
          
          {selectedElementId ? (
            <div className="space-y-4">
              {(() => {
                const element = project.tracks
                  .flatMap(track => track.elements)
                  .find(el => el.id === selectedElementId);
                
                if (!element) return <p className="text-gray-400">Elemento não encontrado</p>;
                
                return (
                  <div className="space-y-4">
                    <div>
                      <Label>Nome</Label>
                      <Input 
                        value={element.name} 
                        onChange={(e) => updateElement(element.id, { name: e.target.value })}
                        className="mt-1" 
                      />
                    </div>
                    
                    <div>
                      <Label>Duração</Label>
                      <Input 
                        type="number" 
                        value={element.duration} 
                        onChange={(e) => updateElement(element.id, { duration: parseFloat(e.target.value) })}
                        className="mt-1"
                        step="0.1"
                      />
                    </div>
                    
                    <div>
                      <Label>Tempo de Início</Label>
                      <Input 
                        type="number" 
                        value={element.startTime} 
                        onChange={(e) => updateElement(element.id, { startTime: parseFloat(e.target.value) })}
                        className="mt-1"
                        step="0.1"
                      />
                    </div>
                    
                    <div>
                      <Label>Opacidade</Label>
                      <Slider
                        value={[element.properties.opacity || 1]}
                        onValueChange={([value]) => {
                          updateElement(element.id, { properties: { ...element.properties, opacity: value } });
                        }}
                        max={1}
                        step={0.1}
                        className="mt-2"
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => duplicateElement(element.id)}>
                        <Copy className="mr-2 h-3 w-3" />
                        Duplicar
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => {
                          deleteElement(element.id);
                          setSelectedElementId(null);
                      }}>
                        <Trash2 className="mr-2 h-3 w-3" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="text-center text-gray-400">
              <Settings className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Selecione um elemento na timeline para editar suas propriedades</p>
            </div>
          )}
        </div>
      </div>

      {/* Render Status Overlay */}
      {renderJob && (
        <div className="fixed bottom-4 right-4 w-80 z-50">
          <Card className="bg-gray-800 border-gray-700 text-white shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span>Status da Renderização</span>
                {renderJob.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                {renderJob.status === 'failed' && <AlertCircle className="h-4 w-4 text-red-500" />}
                {(renderJob.status === 'processing' || renderJob.status === 'queued') && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-xs text-gray-400">
                  <span className="capitalize">
                    {renderJob.status === 'queued' ? 'Na fila...' :
                     renderJob.status === 'processing' ? 'Renderizando...' :
                     renderJob.status === 'completed' ? 'Concluído' :
                     renderJob.status === 'failed' ? 'Falhou' : renderJob.status}
                  </span>
                  <span>{Math.round(renderJob.progress)}%</span>
                </div>
                <Progress value={renderJob.progress} className="h-2" />
                
                {renderJob.status === 'completed' && renderJob.output_url && (
                  <Button className="w-full mt-2 bg-green-600 hover:bg-green-700" onClick={() => window.open(renderJob.output_url, '_blank')}>
                    <Download className="mr-2 h-4 w-4" />
                    Baixar Vídeo
                  </Button>
                )}
                
                {renderJob.error_message && (
                  <div className="text-xs text-red-400 mt-2 bg-red-900/20 p-2 rounded border border-red-900/50">
                    {renderJob.error_message}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}