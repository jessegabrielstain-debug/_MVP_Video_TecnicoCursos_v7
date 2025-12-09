
/**
 * 🎬 ADVANCED TIMELINE KEYFRAMES COMPONENT
 * Editor de timeline profissional com keyframes reais
 */

'use client'

import React, { useEffect, useState, useRef } from 'react'
import { logger } from '@/lib/logger'
import { useKeyframeAnimation, Keyframe, TimelineTrack } from '@/lib/keyframe-animation-system'
import { toast } from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Download,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Settings,
  Zap,
  Layers
} from 'lucide-react'

interface TimelineExportData {
  tracks: TimelineTrack[];
  duration: number;
  fps: number;
}

interface AdvancedTimelineKeyframesProps {
  projectId?: string
  initialData?: TimelineExportData
  onSave?: (timelineData: TimelineExportData) => void
  onRender?: (timelineData: TimelineExportData) => void
}

export default function AdvancedTimelineKeyframes({
  projectId,
  initialData,
  onSave,
  onRender
}: AdvancedTimelineKeyframesProps) {
  
  const {
    system,
    isPlaying,
    currentTime,
    duration,
    tracks,
    play,
    pause,
    stop,
    seekTo,
    addTrack,
    removeTrack,
    addKeyframe,
    removeKeyframe,
    updateKeyframe,
    exportData,
    importData,
    generatePreview
  } = useKeyframeAnimation()

  const [selectedTrack, setSelectedTrack] = useState<string | null>(null)
  const [selectedKeyframe, setSelectedKeyframe] = useState<Keyframe | null>(null)
  const [timelineScale, setTimelineScale] = useState(20) // pixels per second
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false)

  const timelineRef = useRef<HTMLDivElement>(null)
  const playheadRef = useRef<HTMLDivElement>(null)

  // Inicializar com dados se fornecidos
  useEffect(() => {
    if (initialData) {
      importData(initialData)
    } else {
      // Criar track padrão
      const defaultTrack: TimelineTrack = {
        id: 'track-1',
        name: 'Track Principal',
        type: 'video',
        keyframes: [],
        duration: 30,
        locked: false,
        visible: true
      }
      addTrack(defaultTrack)
    }
  }, [initialData])

  // Atualizar posição do playhead
  useEffect(() => {
    if (playheadRef.current) {
      const position = (currentTime / duration) * 100
      playheadRef.current.style.left = `${position}%`
    }
  }, [currentTime, duration])

  const handleAddTrack = () => {
    const newTrack: TimelineTrack = {
      id: `track-${Date.now()}`,
      name: `Track ${tracks.length + 1}`,
      type: 'video',
      keyframes: [],
      duration: 30,
      locked: false,
      visible: true
    }
    addTrack(newTrack)
    toast.success('Track adicionada!')
  }

  const handleAddKeyframe = (trackId: string, time: number) => {
    if (!selectedTrack) {
      toast.error('Selecione uma track primeiro')
      return
    }

    const newKeyframe: Keyframe = {
      id: `keyframe-${Date.now()}`,
      time: time,
      objectId: `object-${trackId}`,
      properties: {
        x: Math.random() * 100,
        y: Math.random() * 100,
        opacity: 1,
        scaleX: 1,
        scaleY: 1,
        rotation: 0
      },
      easing: 'ease-in-out',
      duration: 1
    }

    addKeyframe(trackId, newKeyframe)
    setSelectedKeyframe(newKeyframe)
    toast.success('Keyframe adicionado!')
  }

  const handleTimelineClick = (event: React.MouseEvent) => {
    if (!timelineRef.current) return

    const rect = timelineRef.current.getBoundingClientRect()
    const x = event.clientX - rect.left
    const time = (x / rect.width) * duration

    if (event.shiftKey && selectedTrack) {
      // Shift + Click: Adicionar keyframe
      handleAddKeyframe(selectedTrack, time)
    } else {
      // Click normal: Seekar
      seekTo(time)
    }
  }

  const handleSave = async () => {
    try {
      const timelineData = { ...exportData(), fps: 30 }
      if (onSave) {
        onSave(timelineData)
      }

      if (projectId) {
        const response = await fetch('/api/timeline/keyframes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            timelineData,
            action: 'save'
          })
        })

        const result = await response.json()
        if (result.success) {
          toast.success('Timeline salva com sucesso!')
        } else {
          throw new Error(result.error)
        }
      }
    } catch (error) {
      logger.error('Erro ao salvar timeline', error instanceof Error ? error : new Error(String(error)), { component: 'AdvancedTimelineKeyframes', projectId })
      toast.error('Erro ao salvar timeline')
    }
  }

  const handleRender = async () => {
    try {
      const timelineData = { ...exportData(), fps: 30 }
      if (onRender) {
        onRender(timelineData)
      }

      if (projectId) {
        const response = await fetch('/api/timeline/keyframes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            timelineData,
            action: 'render'
          })
        })

        const result = await response.json()
        if (result.success) {
          toast.success(`Renderização iniciada! Tempo estimado: ${result.estimatedTime}s`)
        } else {
          throw new Error(result.error)
        }
      }
    } catch (error) {
      logger.error('Erro na renderização', error instanceof Error ? error : new Error(String(error)), { component: 'AdvancedTimelineKeyframes', projectId })
      toast.error('Erro na renderização')
    }
  }

  const handleGeneratePreview = async () => {
    setIsGeneratingPreview(true)
    try {
      const preview = await generatePreview()
      toast.success('Preview gerado com sucesso!')
      
      // Criar URL do blob para download/visualização
      const url = URL.createObjectURL(preview)
      const a = document.createElement('a')
      a.href = url
      a.download = 'timeline-preview.mp4'
      a.click()
      URL.revokeObjectURL(url)
      
    } catch (error) {
      logger.error('Erro ao gerar preview', error instanceof Error ? error : new Error(String(error)), { component: 'AdvancedTimelineKeyframes' })
      toast.error('Erro ao gerar preview')
    } finally {
      setIsGeneratingPreview(false)
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const frames = Math.floor((seconds % 1) * 30)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`
  }

  return (
    <div className="h-full flex flex-col bg-gray-950 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Timeline Keyframes Pro
          </h2>
          <Badge variant="outline" className="border-green-500 text-green-500">
            {tracks.length} Tracks
          </Badge>
          <Badge variant="outline" className="border-blue-500 text-blue-500">
            {tracks.reduce((total, track) => total + track.keyframes.length, 0)} Keyframes
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleGeneratePreview}
            disabled={isGeneratingPreview}
          >
            <Eye className="h-4 w-4 mr-2" />
            {isGeneratingPreview ? 'Gerando...' : 'Preview'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleSave}>
            <Download className="h-4 w-4 mr-2" />
            Salvar
          </Button>
          <Button variant="outline" size="sm" onClick={handleRender}>
            <Zap className="h-4 w-4 mr-2" />
            Renderizar
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center p-4 border-b border-gray-800 bg-gray-900">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => seekTo(0)}>
            <SkipBack className="h-4 w-4" />
          </Button>
          
          <Button variant="ghost" size="sm" onClick={isPlaying ? pause : play}>
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          
          <Button variant="ghost" size="sm" onClick={stop}>
            <Square className="h-4 w-4" />
          </Button>
          
          <Button variant="ghost" size="sm" onClick={() => seekTo(duration)}>
            <SkipForward className="h-4 w-4" />
          </Button>

          <div className="text-sm font-mono bg-gray-800 px-3 py-1 rounded">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Track List */}
        <div className="w-64 border-r border-gray-800 bg-gray-900">
          <div className="p-4 border-b border-gray-800">
            <Button size="sm" onClick={handleAddTrack} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Track
            </Button>
          </div>

          <ScrollArea className="h-96">
            <div className="p-2 space-y-2">
              {tracks.map((track) => (
                <Card 
                  key={track.id} 
                  className={`cursor-pointer transition-colors ${
                    selectedTrack === track.id 
                      ? 'border-blue-500 bg-blue-950' 
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                  onClick={() => setSelectedTrack(track.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{track.name}</div>
                        <div className="text-xs text-gray-400">
                          {track.keyframes.length} keyframes
                        </div>
                      </div>
                      
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-8 h-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            // Toggle visibility
                          }}
                        >
                          {track.visible ? 
                            <Eye className="h-3 w-3" /> : 
                            <EyeOff className="h-3 w-3" />
                          }
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-8 h-8 p-0 text-red-400 hover:text-red-300"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeTrack(track.id)
                            toast.success('Track removida')
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Timeline */}
        <div className="flex-1 flex flex-col">
          {/* Timeline Header */}
          <div className="h-12 border-b border-gray-800 bg-gray-900 relative">
            {/* Time Ruler */}
            <div className="absolute inset-0 flex items-center">
              {Array.from({ length: Math.ceil(duration) + 1 }).map((_, i) => (
                <div 
                  key={i} 
                  className="flex-shrink-0 text-xs text-gray-400 px-2"
                  style={{ width: `${timelineScale}px` }}
                >
                  {i}s
                </div>
              ))}
            </div>
          </div>

          {/* Timeline Content */}
          <div 
            ref={timelineRef}
            className="flex-1 relative overflow-x-auto cursor-crosshair"
            onClick={handleTimelineClick}
          >
            {/* Playhead */}
            <div 
              ref={playheadRef}
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
              style={{ left: '0%' }}
            >
              <div className="w-3 h-3 bg-red-500 rounded-full -translate-x-1/2 -mt-1"></div>
            </div>

            {/* Tracks */}
            <div className="space-y-1 p-2">
              {tracks.map((track, trackIndex) => (
                <div 
                  key={track.id} 
                  className={`h-16 border border-gray-700 rounded relative ${
                    selectedTrack === track.id ? 'bg-gray-800' : 'bg-gray-850'
                  }`}
                  style={{ minWidth: `${duration * timelineScale}px` }}
                >
                  {/* Keyframes */}
                  {track.keyframes.map((keyframe) => (
                    <div
                      key={keyframe.id}
                      className={`absolute top-1 bottom-1 w-2 rounded cursor-pointer ${
                        selectedKeyframe?.id === keyframe.id
                          ? 'bg-yellow-500'
                          : 'bg-blue-500 hover:bg-blue-400'
                      }`}
                      style={{ 
                        left: `${(keyframe.time / duration) * 100}%`,
                        transform: 'translateX(-50%)'
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedKeyframe(keyframe)
                        setSelectedTrack(track.id)
                      }}
                      title={`Keyframe em ${keyframe.time.toFixed(2)}s`}
                    />
                  ))}
                  
                  {/* Track Label */}
                  <div className="absolute left-2 top-1 text-xs text-gray-400 pointer-events-none">
                    {track.name}
                  </div>
                </div>
              ))}
            </div>

            {/* Instructions */}
            {tracks.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Layers className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Adicione tracks para começar</p>
                  <p className="text-sm">Shift + Click para adicionar keyframes</p>
                </div>
              </div>
            )}
          </div>

          {/* Scale Control */}
          <div className="p-2 border-t border-gray-800 bg-gray-900 flex items-center gap-4">
            <span className="text-sm text-gray-400">Zoom:</span>
            <Slider
              value={[timelineScale]}
              onValueChange={([value]) => setTimelineScale(value)}
              min={10}
              max={100}
              step={5}
              className="w-32"
            />
            <span className="text-sm text-gray-400">{timelineScale}px/s</span>
          </div>
        </div>

        {/* Properties Panel */}
        {selectedKeyframe && selectedTrack && (
          <div className="w-64 border-l border-gray-800 bg-gray-900 p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Propriedades do Keyframe
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400">Tempo (s)</label>
                <Input
                  type="number"
                  value={selectedKeyframe.time}
                  onChange={(e) => {
                    const newTime = parseFloat(e.target.value)
                    if (!isNaN(newTime)) {
                      updateKeyframe(selectedTrack, selectedKeyframe.id, { time: newTime })
                      setSelectedKeyframe({ ...selectedKeyframe, time: newTime })
                    }
                  }}
                  step={0.1}
                  min={0}
                  max={duration}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400">X Position</label>
                <Slider
                  value={[selectedKeyframe.properties.x || 0]}
                  onValueChange={([value]) => {
                    const newProps = { ...selectedKeyframe.properties, x: value }
                    updateKeyframe(selectedTrack, selectedKeyframe.id, { properties: newProps })
                    setSelectedKeyframe({ ...selectedKeyframe, properties: newProps })
                  }}
                  min={-100}
                  max={100}
                  step={1}
                  className="mt-2"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400">Y Position</label>
                <Slider
                  value={[selectedKeyframe.properties.y || 0]}
                  onValueChange={([value]) => {
                    const newProps = { ...selectedKeyframe.properties, y: value }
                    updateKeyframe(selectedTrack, selectedKeyframe.id, { properties: newProps })
                    setSelectedKeyframe({ ...selectedKeyframe, properties: newProps })
                  }}
                  min={-100}
                  max={100}
                  step={1}
                  className="mt-2"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400">Opacity</label>
                <Slider
                  value={[selectedKeyframe.properties.opacity ?? 1]}
                  onValueChange={([value]) => {
                    const newProps = { ...selectedKeyframe.properties, opacity: value }
                    updateKeyframe(selectedTrack, selectedKeyframe.id, { properties: newProps })
                    setSelectedKeyframe({ ...selectedKeyframe, properties: newProps })
                  }}
                  min={0}
                  max={1}
                  step={0.1}
                  className="mt-2"
                />
              </div>

              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  removeKeyframe(selectedTrack, selectedKeyframe.id)
                  setSelectedKeyframe(null)
                  toast.success('Keyframe removido')
                }}
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remover Keyframe
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
