
'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Play, Pause, Square, SkipBack, SkipForward, 
  Volume2, Settings, Scissors, Copy, Trash2,
  Plus, Minus, ZoomIn, ZoomOut, Move
} from 'lucide-react'
import { gsap } from 'gsap'

interface Keyframe {
  id: string
  time: number
  property: string
  value: number | string
  easing?: string
}

interface TimelineObject {
  id: string
  name: string
  type: 'video' | 'audio' | 'text' | 'image' | 'shape'
  startTime: number
  duration: number
  track: number
  keyframes: Keyframe[]
  properties: {
    x?: number
    y?: number
    scale?: number
    rotation?: number
    opacity?: number
    color?: string
    volume?: number
  }
  locked?: boolean
  visible?: boolean
}

interface TimelineTrack {
  id: string
  name: string
  type: 'video' | 'audio' | 'overlay'
  height: number
  locked: boolean
  visible: boolean
  color: string
}

const ProfessionalTimelineEditor: React.FC = () => {
  const timelineRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(300) // 5 minutes in seconds
  const [zoom, setZoom] = useState(1)
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null)
  
  // Timeline objects and tracks
  const [tracks, setTracks] = useState<TimelineTrack[]>([
    {
      id: 'track-video-1',
      name: 'Video Track 1',
      type: 'video',
      height: 60,
      locked: false,
      visible: true,
      color: '#3b82f6'
    },
    {
      id: 'track-audio-1',
      name: 'Audio Track 1',
      type: 'audio',
      height: 40,
      locked: false,
      visible: true,
      color: '#10b981'
    },
    {
      id: 'track-overlay-1',
      name: 'Overlay Track 1',
      type: 'overlay',
      height: 50,
      locked: false,
      visible: true,
      color: '#f59e0b'
    }
  ])
  
  const [objects, setObjects] = useState<TimelineObject[]>([
    {
      id: 'obj-1',
      name: 'Slide 1',
      type: 'video',
      startTime: 0,
      duration: 30,
      track: 0,
      keyframes: [
        {
          id: 'kf-1',
          time: 0,
          property: 'opacity',
          value: 0,
          easing: 'power2.out'
        },
        {
          id: 'kf-2',
          time: 2,
          property: 'opacity',
          value: 1,
          easing: 'power2.out'
        },
        {
          id: 'kf-3',
          time: 28,
          property: 'opacity',
          value: 1,
          easing: 'power2.in'
        },
        {
          id: 'kf-4',
          time: 30,
          property: 'opacity',
          value: 0,
          easing: 'power2.in'
        }
      ],
      properties: {
        x: 0,
        y: 0,
        scale: 1,
        opacity: 1
      }
    },
    {
      id: 'obj-2',
      name: 'Narration 1',
      type: 'audio',
      startTime: 2,
      duration: 26,
      track: 1,
      keyframes: [
        {
          id: 'kf-5',
          time: 2,
          property: 'volume',
          value: 0,
          easing: 'power1.out'
        },
        {
          id: 'kf-6',
          time: 4,
          property: 'volume',
          value: 1,
          easing: 'power1.out'
        }
      ],
      properties: {
        volume: 1
      }
    },
    {
      id: 'obj-3',
      name: 'Title Text',
      type: 'text',
      startTime: 5,
      duration: 20,
      track: 2,
      keyframes: [
        {
          id: 'kf-7',
          time: 5,
          property: 'y',
          value: -50,
          easing: 'back.out(1.7)'
        },
        {
          id: 'kf-8',
          time: 7,
          property: 'y',
          value: 0,
          easing: 'back.out(1.7)'
        }
      ],
      properties: {
        x: 100,
        y: 50,
        scale: 1,
        opacity: 1,
        color: '#ffffff'
      }
    }
  ])
  
  // Playback control
  const playPause = useCallback(() => {
    setIsPlaying(!isPlaying)
    if (!isPlaying) {
      // Start playback
      const timeline = gsap.timeline({
        onUpdate: () => {
          setCurrentTime(timeline.time())
        },
        onComplete: () => {
          setIsPlaying(false)
          setCurrentTime(0)
        }
      })
      
      // Add animations based on keyframes
      objects.forEach(obj => {
        obj.keyframes.forEach(keyframe => {
          timeline.set({}, {}, keyframe.time)
        })
      })
      
      timeline.play()
    } else {
      // Pause playback
      gsap.killTweensOf("*")
    }
  }, [isPlaying, objects])
  
  // Time format helper
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const frames = Math.floor((seconds % 1) * 30) // 30fps
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`
  }
  
  // Convert time to pixel position
  const timeToPixel = (time: number): number => {
    return (time / duration) * 1000 * zoom
  }
  
  // Convert pixel to time
  const pixelToTime = (pixel: number): number => {
    return (pixel / (1000 * zoom)) * duration
  }
  
  // Handle timeline click
  const handleTimelineClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left - 200 // Account for track labels
    const time = pixelToTime(x)
    setCurrentTime(Math.max(0, Math.min(duration, time)))
  }
  
  // Add new track
  const addTrack = (type: 'video' | 'audio' | 'overlay') => {
    const newTrack: TimelineTrack = {
      id: `track-${type}-${Date.now()}`,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} Track ${tracks.filter(t => t.type === type).length + 1}`,
      type,
      height: type === 'audio' ? 40 : type === 'video' ? 60 : 50,
      locked: false,
      visible: true,
      color: type === 'video' ? '#3b82f6' : type === 'audio' ? '#10b981' : '#f59e0b'
    }
    setTracks([...tracks, newTrack])
  }
  
  // Update object
  const updateObject = (id: string, updates: Partial<TimelineObject>) => {
    setObjects(objects.map(obj => 
      obj.id === id ? { ...obj, ...updates } : obj
    ))
  }
  
  // Add keyframe
  const addKeyframe = (objectId: string, property: string, value: number | string) => {
    const newKeyframe: Keyframe = {
      id: `kf-${Date.now()}`,
      time: currentTime,
      property,
      value,
      easing: 'power2.out'
    }
    
    updateObject(objectId, {
      keyframes: [...(objects.find(obj => obj.id === objectId)?.keyframes || []), newKeyframe]
    })
  }
  
  // Remove keyframe
  const removeKeyframe = (objectId: string, keyframeId: string) => {
    const obj = objects.find(o => o.id === objectId)
    if (obj) {
      updateObject(objectId, {
        keyframes: obj.keyframes.filter(kf => kf.id !== keyframeId)
      })
    }
  }
  
  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
      {/* Transport Controls */}
      <div className="h-16 bg-white dark:bg-gray-800 border-b flex items-center justify-between px-4">
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="ghost" onClick={() => setCurrentTime(0)}>
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={playPause}>
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setIsPlaying(false)}>
            <Square className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setCurrentTime(duration)}>
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-sm font-mono">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
          
          <div className="flex items-center space-x-2">
            <Volume2 className="h-4 w-4" />
            <Slider
              value={[100]}
              max={100}
              step={1}
              className="w-20"
            />
          </div>
          
          <div className="flex items-center space-x-1">
            <Button size="sm" variant="ghost" onClick={() => setZoom(Math.max(0.1, zoom / 1.5))}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm w-12 text-center">{Math.round(zoom * 100)}%</span>
            <Button size="sm" variant="ghost" onClick={() => setZoom(Math.min(5, zoom * 1.5))}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Timeline Header */}
      <div className="h-8 bg-gray-50 dark:bg-gray-700 border-b flex">
        <div className="w-48 border-r"></div>
        <div className="flex-1 relative overflow-x-auto">
          <div 
            className="flex h-full"
            style={{ width: `${1000 * zoom}px` }}
          >
            {Array.from({ length: Math.ceil(duration / 10) }, (_, i) => (
              <div 
                key={i}
                className="border-r border-gray-300 dark:border-gray-600 flex-shrink-0 relative"
                style={{ width: `${(10 / duration) * 1000 * zoom}px` }}
              >
                <div className="absolute top-0 left-1 text-xs text-gray-500">
                  {formatTime(i * 10)}
                </div>
              </div>
            ))}
          </div>
          
          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
            style={{ left: `${timeToPixel(currentTime)}px` }}
          >
            <div className="absolute -top-1 -left-2 w-4 h-3 bg-red-500 clip-path-triangle"></div>
          </div>
        </div>
      </div>
      
      {/* Timeline Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Track Labels */}
        <div className="w-48 bg-white dark:bg-gray-800 border-r">
          <div className="p-2 border-b">
            <div className="flex space-x-1">
              <Button size="sm" onClick={() => addTrack('video')}>
                <Plus className="h-3 w-3 mr-1" />
                Video
              </Button>
              <Button size="sm" onClick={() => addTrack('audio')}>
                <Plus className="h-3 w-3 mr-1" />
                Audio
              </Button>
              <Button size="sm" onClick={() => addTrack('overlay')}>
                <Plus className="h-3 w-3 mr-1" />
                Text
              </Button>
            </div>
          </div>
          
          {tracks.map((track, index) => (
            <div
              key={track.id}
              className="border-b p-2 flex items-center justify-between"
              style={{ height: `${track.height}px` }}
            >
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: track.color }}
                ></div>
                <span className="text-sm font-medium">{track.name}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Button size="sm" variant="ghost">
                  <Settings className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        {/* Timeline Tracks */}
        <div 
          ref={timelineRef}
          className="flex-1 overflow-auto cursor-pointer"
          onClick={handleTimelineClick}
        >
          <div style={{ width: `${1000 * zoom}px` }}>
            {tracks.map((track, trackIndex) => (
              <div
                key={track.id}
                className="border-b relative"
                style={{ height: `${track.height}px` }}
              >
                {/* Track background */}
                <div className="absolute inset-0 bg-gray-50 dark:bg-gray-700"></div>
                
                {/* Objects in this track */}
                {objects
                  .filter(obj => obj.track === trackIndex)
                  .map(obj => (
                    <div
                      key={obj.id}
                      className={`absolute top-1 bottom-1 rounded cursor-move border-2 transition-colors
                        ${selectedObjectId === obj.id 
                          ? 'border-blue-500 bg-blue-200 dark:bg-blue-800' 
                          : 'border-gray-400 bg-white dark:bg-gray-600'
                        }
                      `}
                      style={{
                        left: `${timeToPixel(obj.startTime)}px`,
                        width: `${timeToPixel(obj.duration)}px`
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedObjectId(obj.id)
                      }}
                    >
                      <div className="p-1 truncate">
                        <div className="text-xs font-medium">{obj.name}</div>
                        <div className="text-xs text-gray-500">
                          {formatTime(obj.duration)}
                        </div>
                      </div>
                      
                      {/* Keyframe indicators */}
                      {obj.keyframes.map(keyframe => (
                        <div
                          key={keyframe.id}
                          className="absolute top-0 bottom-0 w-0.5 bg-yellow-400"
                          style={{ left: `${timeToPixel(keyframe.time - obj.startTime)}px` }}
                          title={`${keyframe.property}: ${keyframe.value}`}
                        ></div>
                      ))}
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Properties Panel */}
      {selectedObjectId && (
        <div className="h-48 bg-white dark:bg-gray-800 border-t p-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                Keyframe Editor - {objects.find(obj => obj.id === selectedObjectId)?.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label>Opacity</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Slider
                      value={[objects.find(obj => obj.id === selectedObjectId)?.properties.opacity || 1]}
                      onValueChange={([value]) => {
                        if (selectedObjectId) {
                          updateObject(selectedObjectId, {
                            properties: {
                              ...objects.find(obj => obj.id === selectedObjectId)?.properties,
                              opacity: value
                            }
                          })
                        }
                      }}
                      min={0}
                      max={1}
                      step={0.1}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={() => selectedObjectId && addKeyframe(selectedObjectId, 'opacity', 1)}
                    >
                      +Key
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label>Scale</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Slider
                      value={[objects.find(obj => obj.id === selectedObjectId)?.properties.scale || 1]}
                      onValueChange={([value]) => {
                        if (selectedObjectId) {
                          updateObject(selectedObjectId, {
                            properties: {
                              ...objects.find(obj => obj.id === selectedObjectId)?.properties,
                              scale: value
                            }
                          })
                        }
                      }}
                      min={0.1}
                      max={3}
                      step={0.1}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={() => selectedObjectId && addKeyframe(selectedObjectId, 'scale', 1)}
                    >
                      +Key
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label>Rotation</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Slider
                      value={[objects.find(obj => obj.id === selectedObjectId)?.properties.rotation || 0]}
                      onValueChange={([value]) => {
                        if (selectedObjectId) {
                          updateObject(selectedObjectId, {
                            properties: {
                              ...objects.find(obj => obj.id === selectedObjectId)?.properties,
                              rotation: value
                            }
                          })
                        }
                      }}
                      min={-180}
                      max={180}
                      step={1}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={() => selectedObjectId && addKeyframe(selectedObjectId, 'rotation', 0)}
                    >
                      +Key
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label>Position X</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Input
                      type="number"
                      value={objects.find(obj => obj.id === selectedObjectId)?.properties.x || 0}
                      onChange={(e) => {
                        if (selectedObjectId) {
                          updateObject(selectedObjectId, {
                            properties: {
                              ...objects.find(obj => obj.id === selectedObjectId)?.properties,
                              x: parseInt(e.target.value)
                            }
                          })
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={() => selectedObjectId && addKeyframe(selectedObjectId, 'x', 0)}
                    >
                      +Key
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Keyframes</Label>
                  <div className="text-xs text-gray-500">
                    Time: {formatTime(currentTime)}
                  </div>
                </div>
                
                <div className="mt-2 space-y-1 max-h-20 overflow-y-auto">
                  {objects
                    .find(obj => obj.id === selectedObjectId)
                    ?.keyframes.map(keyframe => (
                      <div
                        key={keyframe.id}
                        className="flex items-center justify-between text-xs p-1 bg-gray-50 dark:bg-gray-700 rounded"
                      >
                        <span>
                          {formatTime(keyframe.time)} - {keyframe.property}: {keyframe.value}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => selectedObjectId && removeKeyframe(selectedObjectId, keyframe.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default ProfessionalTimelineEditor
