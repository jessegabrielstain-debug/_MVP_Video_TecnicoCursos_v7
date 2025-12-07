
'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { 
  Play, 
  Pause, 
  Square, 
  SkipBack, 
  SkipForward,
  Volume2,
  VolumeX,
  ZoomIn,
  ZoomOut,
  Scissors,
  Copy,
  Trash2,
  Plus,
  Settings,
  Layers,
  Music,
  Mic,
  Video,
  Image,
  Type,
  FileText
} from 'lucide-react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { toast } from 'sonner'

interface TimelineTrack {
  id: string
  name: string
  type: 'video' | 'audio' | 'text' | 'image' | 'effect'
  color: string
  visible: boolean
  muted: boolean
  locked: boolean
  height: number
  clips: TimelineClip[]
}

interface TimelineClip {
  id: string
  name: string
  start: number
  duration: number
  content: unknown
  thumbnail?: string
  color: string
  selected: boolean
  type: 'scene' | 'audio' | 'text' | 'image' | 'transition'
}

interface Keyframe {
  id: string
  time: number
  property: string
  value: unknown
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'
}

interface Scene {
  id?: string
  name?: string
  duration?: number
  thumbnail?: string
  [key: string]: unknown
}

interface CinematicTimelineEditorProps {
  scenes?: Scene[]
  onSceneUpdate?: (sceneId: string, data: unknown) => void
  onExportTimeline?: (timeline: unknown) => void
  onPreview?: (timeline: unknown) => void
}

export default function CinematicTimelineEditor({
  scenes = [],
  onSceneUpdate,
  onExportTimeline,
  onPreview
}: CinematicTimelineEditorProps) {
  const timelineRef = useRef<HTMLDivElement>(null)
  const [tracks, setTracks] = useState<TimelineTrack[]>([
    {
      id: 'video-1',
      name: 'Video Track 1',
      type: 'video',
      color: '#3b82f6',
      visible: true,
      muted: false,
      locked: false,
      height: 80,
      clips: []
    },
    {
      id: 'audio-1',
      name: 'Audio Track 1',
      type: 'audio',
      color: '#10b981',
      visible: true,
      muted: false,
      locked: false,
      height: 60,
      clips: []
    },
    {
      id: 'text-1',
      name: 'Text Track 1',
      type: 'text',
      color: '#f59e0b',
      visible: true,
      muted: false,
      locked: false,
      height: 50,
      clips: []
    }
  ])

  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(30000) // 30 seconds in ms
  const [isPlaying, setIsPlaying] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [selectedClips, setSelectedClips] = useState<string[]>([])
  const [playheadPosition, setPlayheadPosition] = useState(0)
  const [keyframes, setKeyframes] = useState<Keyframe[]>([])

  // Timeline dimensions
  const timelineWidth = duration / 1000 * 100 * zoom // 100px per second
  const timeScale = 1000 / (100 * zoom) // ms per pixel

  // Playhead update
  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 100
          if (newTime >= duration) {
            setIsPlaying(false)
            return duration
          }
          return newTime
        })
      }, 100)
    }

    return () => clearInterval(interval)
  }, [isPlaying, duration])

  // Update playhead position based on current time
  useEffect(() => {
    setPlayheadPosition(currentTime / timeScale)
  }, [currentTime, timeScale])

  // Load scenes into timeline
  useEffect(() => {
    if (scenes.length > 0) {
      const videoClips: TimelineClip[] = scenes.map((scene, index) => ({
        id: scene.id || `scene-${index}`,
        name: scene.name || `Scene ${index + 1}`,
        start: index * 5000, // 5 seconds per scene
        duration: scene.duration || 5000,
        content: scene,
        thumbnail: scene.thumbnail,
        color: '#3b82f6',
        selected: false,
        type: 'scene'
      }))

      setTracks(prev => prev.map(track => 
        track.type === 'video' 
          ? { ...track, clips: videoClips }
          : track
      ))

      // Update duration based on scenes
      const totalDuration = videoClips.reduce((acc, clip) => 
        Math.max(acc, clip.start + clip.duration), 0
      )
      setDuration(Math.max(totalDuration, 30000))
    }
  }, [scenes])

  // Transport controls
  const handlePlay = useCallback(() => {
    setIsPlaying(!isPlaying)
  }, [isPlaying])

  const handleStop = useCallback(() => {
    setIsPlaying(false)
    setCurrentTime(0)
  }, [])

  const handleSeek = useCallback((time: number) => {
    setCurrentTime(Math.max(0, Math.min(time, duration)))
  }, [duration])

  // Clip management
  const handleClipSelect = useCallback((clipId: string, multi = false) => {
    if (multi) {
      setSelectedClips(prev => 
        prev.includes(clipId) 
          ? prev.filter(id => id !== clipId)
          : [...prev, clipId]
      )
    } else {
      setSelectedClips([clipId])
    }
  }, [])

  const handleClipMove = useCallback((clipId: string, trackId: string, newStart: number) => {
    setTracks(prev => prev.map(track => ({
      ...track,
      clips: track.id === trackId
        ? track.clips.map(clip =>
            clip.id === clipId
              ? { ...clip, start: Math.max(0, newStart) }
              : clip
          )
        : track.clips.filter(clip => clip.id !== clipId)
    })))
  }, [])

  const handleClipResize = useCallback((clipId: string, newDuration: number) => {
    setTracks(prev => prev.map(track => ({
      ...track,
      clips: track.clips.map(clip =>
        clip.id === clipId
          ? { ...clip, duration: Math.max(1000, newDuration) }
          : clip
      )
    })))
  }, [])

  const handleClipDelete = useCallback(() => {
    setTracks(prev => prev.map(track => ({
      ...track,
      clips: track.clips.filter(clip => !selectedClips.includes(clip.id))
    })))
    setSelectedClips([])
    toast.success('Clips deleted')
  }, [selectedClips])

  const handleClipSplit = useCallback(() => {
    if (selectedClips.length !== 1) {
      toast.error('Select exactly one clip to split')
      return
    }

    const clipId = selectedClips[0]
    const track = tracks.find(t => t.clips.some(c => c.id === clipId))
    const clip = track?.clips.find(c => c.id === clipId)

    if (!clip || currentTime < clip.start || currentTime > clip.start + clip.duration) {
      toast.error('Position playhead inside the clip to split')
      return
    }

    const splitPoint = currentTime - clip.start
    const newClip: TimelineClip = {
      ...clip,
      id: `${clip.id}-split`,
      start: currentTime,
      duration: clip.duration - splitPoint
    }

    setTracks(prev => prev.map(track => ({
      ...track,
      clips: track.clips.flatMap(c =>
        c.id === clipId
          ? [
              { ...c, duration: splitPoint },
              newClip
            ]
          : [c]
      )
    })))

    toast.success('Clip split successfully')
  }, [selectedClips, tracks, currentTime])

  // Timeline rendering
  const renderTimeRuler = () => {
    const seconds = Math.ceil(duration / 1000)
    const markers = []

    for (let i = 0; i <= seconds; i++) {
      const position = (i * 1000) / timeScale
      markers.push(
        <div
          key={i}
          className="absolute flex flex-col items-center"
          style={{ left: position }}
        >
          <div className="w-px h-2 bg-gray-400" />
          <span className="text-xs text-gray-500 mt-1">
            {Math.floor(i / 60)}:{(i % 60).toString().padStart(2, '0')}
          </span>
        </div>
      )
    }

    return markers
  }

  const renderTrack = (track: TimelineTrack) => {
    return (
      <div key={track.id} className="flex border-b border-gray-200">
        {/* Track Header */}
        <div className="w-48 bg-gray-50 p-2 flex items-center space-x-2 border-r border-gray-200">
          <div className="flex flex-col flex-1">
            <div className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded"
                style={{ backgroundColor: track.color }}
              />
              <span className="text-sm font-medium truncate">{track.name}</span>
            </div>
            <div className="flex items-center space-x-1 mt-1">
              <Button
                variant="ghost"
                size="sm"
                className={`p-1 h-6 w-6 ${!track.visible ? 'text-gray-400' : ''}`}
                onClick={() => {
                  setTracks(prev => prev.map(t => 
                    t.id === track.id ? { ...t, visible: !t.visible } : t
                  ))
                }}
              >
                {track.visible ? '👁' : '🙈'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`p-1 h-6 w-6 ${track.muted ? 'text-red-400' : ''}`}
                onClick={() => {
                  setTracks(prev => prev.map(t => 
                    t.id === track.id ? { ...t, muted: !t.muted } : t
                  ))
                }}
              >
                {track.muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Track Content */}
        <div 
          className="flex-1 relative bg-white"
          style={{ height: track.height }}
        >
          <div className="absolute inset-0 overflow-x-auto">
            <div 
              className="relative h-full"
              style={{ width: timelineWidth }}
            >
              {track.clips.map(clip => {
                const clipLeft = clip.start / timeScale
                const clipWidth = clip.duration / timeScale
                
                return (
                  <div
                    key={clip.id}
                    className={`absolute top-1 bottom-1 rounded border-2 cursor-pointer transition-all ${
                      selectedClips.includes(clip.id)
                        ? 'border-blue-500 shadow-lg'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                    style={{
                      left: clipLeft,
                      width: clipWidth,
                      backgroundColor: clip.color + '80',
                      minWidth: '50px'
                    }}
                    onClick={(e) => handleClipSelect(clip.id, e.metaKey || e.ctrlKey)}
                  >
                    <div className="p-1 h-full flex items-center">
                      {clip.thumbnail && (
                        <img
                          src={clip.thumbnail}
                          alt=""
                          className="h-full w-8 object-cover rounded mr-2"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate text-white">
                          {clip.name}
                        </div>
                        <div className="text-xs text-white/80">
                          {(clip.duration / 1000).toFixed(1)}s
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Export functionality
  const handleExportTimeline = useCallback(() => {
    const timelineData = {
      tracks,
      duration,
      keyframes,
      settings: {
        fps: 30,
        resolution: '1920x1080',
        audioSampleRate: 44100
      }
    }

    if (onExportTimeline) {
      onExportTimeline(timelineData)
    }

    toast.success('Timeline exported successfully!')
  }, [tracks, duration, keyframes, onExportTimeline])

  const handlePreviewTimeline = useCallback(() => {
    const timelineData = {
      tracks,
      duration,
      currentTime,
      keyframes
    }

    if (onPreview) {
      onPreview(timelineData)
    }

    toast.success('Preview started!')
  }, [tracks, duration, currentTime, keyframes, onPreview])

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Top Controls */}
      <div className="h-16 bg-white border-b border-gray-200 flex items-center px-4 space-x-4">
        {/* Transport Controls */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleStop}
          >
            <Square className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePlay}
            className={isPlaying ? 'bg-blue-100' : ''}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="sm">
            <SkipBack className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Timeline Controls */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">
            {Math.floor(currentTime / 60000)}:
            {Math.floor((currentTime % 60000) / 1000).toString().padStart(2, '0')}
          </span>
          
          <Separator orientation="vertical" className="h-6" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom(prev => Math.max(0.1, prev - 0.2))}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm min-w-12 text-center">{Math.round(zoom * 100)}%</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom(prev => Math.min(5, prev + 0.2))}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Clip Controls */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClipSplit}
            disabled={selectedClips.length !== 1}
          >
            <Scissors className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={selectedClips.length === 0}
          >
            <Copy className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClipDelete}
            disabled={selectedClips.length === 0}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1" />

        {/* Export Controls */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviewTimeline}
          >
            <Play className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button
            size="sm"
            onClick={handleExportTimeline}
          >
            Export Timeline
          </Button>
        </div>
      </div>

      {/* Timeline Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Time Ruler */}
        <div className="h-8 bg-gray-100 border-b border-gray-200 relative overflow-x-auto">
          <div className="flex">
            <div className="w-48 border-r border-gray-200" />
            <div 
              className="relative flex-1"
              style={{ width: timelineWidth }}
            >
              {renderTimeRuler()}
              {/* Playhead */}
              <div
                className="absolute top-0 bottom-0 w-px bg-red-500 z-10"
                style={{ left: playheadPosition }}
              >
                <div className="w-3 h-3 bg-red-500 rounded-full -ml-1.5 -mt-1" />
              </div>
            </div>
          </div>
        </div>

        {/* Tracks */}
        <div ref={timelineRef} className="flex-1 overflow-auto">
          {tracks.map(renderTrack)}
        </div>
      </div>

      {/* Timeline Info */}
      <div className="h-10 bg-white border-t border-gray-200 flex items-center px-4 justify-between">
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span>Duration: {(duration / 1000).toFixed(1)}s</span>
          <span>Tracks: {tracks.length}</span>
          <span>Selected: {selectedClips.length}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">30 FPS</Badge>
          <Badge variant="outline">1920x1080</Badge>
        </div>
      </div>
    </div>
  )
}
