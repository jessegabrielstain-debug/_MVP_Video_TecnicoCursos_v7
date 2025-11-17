'use client'

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Layers,
  Type,
  Mic,
  Music,
  Image as ImageIcon,
  Video,
  Zap,
  Settings,
  ChevronDown,
  ChevronRight,
  Copy,
  Move,
  RotateCw,
  Waveform,
  Target,
  Clock,
  Sync,
  Activity,
  Headphones,
  Monitor,
  Palette,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// Enhanced Types for Multi-Track System
interface TrackSyncSettings {
  enabled: boolean
  masterTrack?: string
  syncMode: 'audio' | 'video' | 'timecode' | 'manual'
  offset: number
  tolerance: number
}

interface TrackAudioSettings {
  volume: number
  muted: boolean
  solo: boolean
  pan: number
  effects: AudioEffect[]
  compressor?: CompressorSettings
  equalizer?: EqualizerSettings
}

interface TrackVideoSettings {
  opacity: number
  blendMode: 'normal' | 'multiply' | 'screen' | 'overlay' | 'soft-light'
  transform: {
    x: number
    y: number
    scale: number
    rotation: number
  }
  colorCorrection?: ColorCorrectionSettings
}

interface AudioEffect {
  id: string
  type: 'reverb' | 'delay' | 'chorus' | 'distortion' | 'filter'
  enabled: boolean
  parameters: Record<string, number>
}

interface CompressorSettings {
  threshold: number
  ratio: number
  attack: number
  release: number
  makeupGain: number
}

interface EqualizerSettings {
  bands: Array<{
    frequency: number
    gain: number
    q: number
  }>
}

interface ColorCorrectionSettings {
  brightness: number
  contrast: number
  saturation: number
  hue: number
  gamma: number
  shadows: number
  midtones: number
  highlights: number
}

interface EnhancedTimelineTrack {
  id: string
  type: 'video' | 'audio' | 'text' | 'image' | 'effect' | 'group'
  name: string
  color: string
  items: TimelineItem[]
  visible: boolean
  locked: boolean
  collapsed: boolean
  height: number
  order: number
  parentGroup?: string
  sync: TrackSyncSettings
  audio?: TrackAudioSettings
  video?: TrackVideoSettings
  metadata: {
    created: Date
    modified: Date
    duration: number
    itemCount: number
    size?: number
    format?: string
  }
}

interface TimelineItem {
  id: string
  start: number
  duration: number
  content: string
  properties?: Record<string, unknown>
  selected?: boolean
  keyframes?: Keyframe[]
  effects?: Effect[]
  locked?: boolean
  fadeIn?: number
  fadeOut?: number
  speed?: number
  reversed?: boolean
  muted?: boolean
  volume?: number
}

interface Keyframe {
  id: string
  time: number
  properties: Record<string, unknown>
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'cubic-bezier'
  interpolation: 'linear' | 'bezier' | 'step'
}

interface Effect {
  id: string
  type: 'fade' | 'slide' | 'zoom' | 'rotate' | 'blur' | 'color' | 'transition'
  parameters: Record<string, unknown>
  enabled: boolean
  keyframes?: Keyframe[]
}

interface SyncStatus {
  isActive: boolean
  masterTrack?: string
  syncedTracks: string[]
  drift: number
  lastSync: Date
  quality: 'perfect' | 'good' | 'poor' | 'lost'
}

// Multi-Track Manager Component
export default function MultiTrackManager() {
  const [tracks, setTracks] = useState<EnhancedTimelineTrack[]>([
    {
      id: 'master-video',
      type: 'video',
      name: 'Master Video',
      color: '#3B82F6',
      visible: true,
      locked: false,
      collapsed: false,
      height: 100,
      order: 0,
      sync: {
        enabled: true,
        syncMode: 'video',
        offset: 0,
        tolerance: 0.033 // 1 frame at 30fps
      },
      video: {
        opacity: 100,
        blendMode: 'normal',
        transform: { x: 0, y: 0, scale: 1, rotation: 0 }
      },
      items: [
        { 
          id: 'v1', 
          start: 0, 
          duration: 120, 
          content: 'Master_Video.mp4',
          speed: 1,
          volume: 100
        }
      ],
      metadata: {
        created: new Date(),
        modified: new Date(),
        duration: 120,
        itemCount: 1,
        format: 'mp4'
      }
    },
    {
      id: 'audio-narration',
      type: 'audio',
      name: 'Narração Principal',
      color: '#10B981',
      visible: true,
      locked: false,
      collapsed: false,
      height: 80,
      order: 1,
      sync: {
        enabled: true,
        masterTrack: 'master-video',
        syncMode: 'audio',
        offset: 0,
        tolerance: 0.01
      },
      audio: {
        volume: 85,
        muted: false,
        solo: false,
        pan: 0,
        effects: [],
        compressor: {
          threshold: -12,
          ratio: 3,
          attack: 5,
          release: 50,
          makeupGain: 2
        }
      },
      items: [
        { 
          id: 'a1', 
          start: 0, 
          duration: 115, 
          content: 'Narração_TTS.wav',
          fadeIn: 0.5,
          fadeOut: 1.0
        }
      ],
      metadata: {
        created: new Date(),
        modified: new Date(),
        duration: 115,
        itemCount: 1,
        format: 'wav'
      }
    },
    {
      id: 'audio-background',
      type: 'audio',
      name: 'Música de Fundo',
      color: '#8B5CF6',
      visible: true,
      locked: false,
      collapsed: false,
      height: 60,
      order: 2,
      sync: {
        enabled: true,
        masterTrack: 'master-video',
        syncMode: 'audio',
        offset: 0,
        tolerance: 0.05
      },
      audio: {
        volume: 25,
        muted: false,
        solo: false,
        pan: 0,
        effects: [
          {
            id: 'bg-filter',
            type: 'filter',
            enabled: true,
            parameters: { lowpass: 8000, highpass: 100 }
          }
        ]
      },
      items: [
        { 
          id: 'a2', 
          start: 0, 
          duration: 120, 
          content: 'Background_Music.mp3',
          fadeIn: 2.0,
          fadeOut: 3.0
        }
      ],
      metadata: {
        created: new Date(),
        modified: new Date(),
        duration: 120,
        itemCount: 1,
        format: 'mp3'
      }
    },
    {
      id: 'text-subtitles',
      type: 'text',
      name: 'Legendas Sincronizadas',
      color: '#F59E0B',
      visible: true,
      locked: false,
      collapsed: false,
      height: 70,
      order: 3,
      sync: {
        enabled: true,
        masterTrack: 'audio-narration',
        syncMode: 'timecode',
        offset: 0,
        tolerance: 0.1
      },
      items: [
        { 
          id: 't1', 
          start: 5, 
          duration: 8, 
          content: 'Bem-vindos ao curso avançado',
          effects: [
            {
              id: 'text-fade',
              type: 'fade',
              enabled: true,
              parameters: { duration: 0.5 }
            }
          ]
        },
        { 
          id: 't2', 
          start: 15, 
          duration: 12, 
          content: 'Vamos explorar conceitos fundamentais'
        }
      ],
      metadata: {
        created: new Date(),
        modified: new Date(),
        duration: 27,
        itemCount: 2
      }
    }
  ])

  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isActive: true,
    masterTrack: 'master-video',
    syncedTracks: ['audio-narration', 'audio-background', 'text-subtitles'],
    drift: 0,
    lastSync: new Date(),
    quality: 'perfect'
  })

  const [selectedTracks, setSelectedTracks] = useState<string[]>([])
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const [realTimeSync, setRealTimeSync] = useState(true)
  const [syncTolerance, setSyncTolerance] = useState(0.033)

  // Real-time sync monitoring
  useEffect(() => {
    if (!realTimeSync) return

    const syncInterval = setInterval(() => {
      // Simulate real-time sync monitoring
      const drift = Math.random() * 0.02 - 0.01 // ±10ms drift
      const quality = Math.abs(drift) < 0.005 ? 'perfect' : 
                     Math.abs(drift) < 0.01 ? 'good' : 
                     Math.abs(drift) < 0.02 ? 'poor' : 'lost'

      setSyncStatus(prev => ({
        ...prev,
        drift,
        quality,
        lastSync: new Date()
      }))
    }, 100) // Check every 100ms

    return () => clearInterval(syncInterval)
  }, [realTimeSync])

  // Track management functions
  const addTrack = useCallback((type: EnhancedTimelineTrack['type']) => {
    const newTrack: EnhancedTimelineTrack = {
      id: `${type}-${Date.now()}`,
      type,
      name: `Nova ${type === 'video' ? 'Vídeo' : type === 'audio' ? 'Áudio' : 'Track'}`,
      color: getTrackColor(type),
      visible: true,
      locked: false,
      collapsed: false,
      height: type === 'video' ? 100 : type === 'audio' ? 80 : 60,
      order: tracks.length,
      sync: {
        enabled: false,
        syncMode: type === 'video' ? 'video' : 'audio',
        offset: 0,
        tolerance: 0.033
      },
      items: [],
      metadata: {
        created: new Date(),
        modified: new Date(),
        duration: 0,
        itemCount: 0
      }
    }

    if (type === 'audio') {
      newTrack.audio = {
        volume: 80,
        muted: false,
        solo: false,
        pan: 0,
        effects: []
      }
    } else if (type === 'video') {
      newTrack.video = {
        opacity: 100,
        blendMode: 'normal',
        transform: { x: 0, y: 0, scale: 1, rotation: 0 }
      }
    }

    setTracks(prev => [...prev, newTrack])
    toast.success(`Track ${newTrack.name} adicionada`)
  }, [tracks.length])

  const deleteTrack = useCallback((trackId: string) => {
    setTracks(prev => prev.filter(track => track.id !== trackId))
    setSyncStatus(prev => ({
      ...prev,
      syncedTracks: prev.syncedTracks.filter(id => id !== trackId)
    }))
    toast.success('Track removida')
  }, [])

  const toggleTrackSync = useCallback((trackId: string) => {
    setTracks(prev => prev.map(track => 
      track.id === trackId 
        ? { 
            ...track, 
            sync: { ...track.sync, enabled: !track.sync.enabled }
          }
        : track
    ))

    setSyncStatus(prev => {
      const track = tracks.find(t => t.id === trackId)
      if (!track) return prev

      const newSyncedTracks = track.sync.enabled
        ? prev.syncedTracks.filter(id => id !== trackId)
        : [...prev.syncedTracks, trackId]

      return { ...prev, syncedTracks: newSyncedTracks }
    })
  }, [tracks])

  const updateTrackVolume = useCallback((trackId: string, volume: number) => {
    setTracks(prev => prev.map(track => 
      track.id === trackId && track.audio
        ? { 
            ...track, 
            audio: { ...track.audio, volume }
          }
        : track
    ))
  }, [])

  const toggleTrackMute = useCallback((trackId: string) => {
    setTracks(prev => prev.map(track => 
      track.id === trackId && track.audio
        ? { 
            ...track, 
            audio: { ...track.audio, muted: !track.audio.muted }
          }
        : track
    ))
  }, [])

  const toggleTrackSolo = useCallback((trackId: string) => {
    setTracks(prev => prev.map(track => 
      track.audio
        ? { 
            ...track, 
            audio: { 
              ...track.audio, 
              solo: track.id === trackId ? !track.audio.solo : false 
            }
          }
        : track
    ))
  }, [])

  const getTrackColor = (type: string) => {
    switch (type) {
      case 'video': return '#3B82F6'
      case 'audio': return '#10B981'
      case 'text': return '#F59E0B'
      case 'image': return '#8B5CF6'
      case 'effect': return '#EF4444'
      default: return '#6B7280'
    }
  }

  const getTrackIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-4 h-4" />
      case 'audio': return <Mic className="w-4 h-4" />
      case 'text': return <Type className="w-4 h-4" />
      case 'image': return <ImageIcon className="w-4 h-4" />
      case 'effect': return <Zap className="w-4 h-4" />
      default: return <Layers className="w-4 h-4" />
    }
  }

  const getSyncQualityColor = (quality: string) => {
    switch (quality) {
      case 'perfect': return 'text-green-400'
      case 'good': return 'text-blue-400'
      case 'poor': return 'text-yellow-400'
      case 'lost': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const formatDrift = (drift: number) => {
    return `${drift >= 0 ? '+' : ''}${(drift * 1000).toFixed(1)}ms`
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Sync Status Header */}
      <div className="p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">Sistema Multi-Track</h2>
            <Badge variant="outline" className="bg-blue-600/20 text-blue-400 border-blue-400">
              <Activity className="w-3 h-3 mr-1" />
              Sincronização Real
            </Badge>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Sync className={cn("w-4 h-4", realTimeSync ? "text-green-400" : "text-gray-400")} />
              <Switch
                checked={realTimeSync}
                onCheckedChange={setRealTimeSync}
              />
              <Label className="text-sm">Sync Tempo Real</Label>
            </div>

            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm">
                Drift: <span className={getSyncQualityColor(syncStatus.quality)}>
                  {formatDrift(syncStatus.drift)}
                </span>
              </span>
            </div>

            <Badge 
              variant="outline" 
              className={cn(
                "border-current",
                getSyncQualityColor(syncStatus.quality)
              )}
            >
              <Target className="w-3 h-3 mr-1" />
              {syncStatus.quality.toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Sync Settings */}
        <div className="mt-3 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label className="text-xs">Tolerância:</Label>
            <Slider
              min={0.001}
              max={0.1}
              step={0.001}
              value={[syncTolerance]}
              onValueChange={([value]) => setSyncTolerance(value)}
              className="w-20"
            />
            <span className="text-xs text-gray-400 min-w-[40px]">
              {(syncTolerance * 1000).toFixed(0)}ms
            </span>
          </div>

          <Separator orientation="vertical" className="h-4" />

          <div className="text-xs text-gray-400">
            Master: <span className="text-white">
              {tracks.find(t => t.id === syncStatus.masterTrack)?.name || 'Nenhum'}
            </span>
          </div>

          <div className="text-xs text-gray-400">
            Tracks Sincronizadas: <span className="text-white">{syncStatus.syncedTracks.length}</span>
          </div>
        </div>
      </div>

      {/* Track Controls */}
      <div className="p-4 bg-gray-800/50 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => addTrack('video')}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Video className="w-4 h-4 mr-2" />
              Vídeo
            </Button>
            
            <Button
              onClick={() => addTrack('audio')}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              <Mic className="w-4 h-4 mr-2" />
              Áudio
            </Button>
            
            <Button
              onClick={() => addTrack('text')}
              size="sm"
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              <Type className="w-4 h-4 mr-2" />
              Texto
            </Button>
            
            <Button
              onClick={() => addTrack('effect')}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Zap className="w-4 h-4 mr-2" />
              Efeito
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Avançado
            </Button>
          </div>
        </div>
      </div>

      {/* Track List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {tracks
            .sort((a, b) => a.order - b.order)
            .map((track) => (
              <Card key={track.id} className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTracks(prev => prev.map(t => 
                          t.id === track.id ? { ...t, collapsed: !t.collapsed } : t
                        ))}
                        className="w-6 h-6"
                      >
                        {track.collapsed ? 
                          <ChevronRight className="w-3 h-3" /> : 
                          <ChevronDown className="w-3 h-3" />
                        }
                      </Button>

                      {getTrackIcon(track.type)}
                      
                      <div>
                        <div className="font-medium">{track.name}</div>
                        <div className="text-xs text-gray-400">
                          {track.metadata.itemCount} items • {Math.round(track.metadata.duration)}s
                          {track.metadata.format && ` • ${track.metadata.format.toUpperCase()}`}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Sync Status */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleTrackSync(track.id)}
                        className={cn(
                          "w-6 h-6",
                          track.sync.enabled ? "text-green-400" : "text-gray-400"
                        )}
                      >
                        <Sync className="w-3 h-3" />
                      </Button>

                      {/* Visibility */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTracks(prev => prev.map(t => 
                          t.id === track.id ? { ...t, visible: !t.visible } : t
                        ))}
                        className="w-6 h-6"
                      >
                        {track.visible ? 
                          <Eye className="w-3 h-3" /> : 
                          <EyeOff className="w-3 h-3" />
                        }
                      </Button>

                      {/* Lock */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTracks(prev => prev.map(t => 
                          t.id === track.id ? { ...t, locked: !t.locked } : t
                        ))}
                        className="w-6 h-6"
                      >
                        {track.locked ? 
                          <Lock className="w-3 h-3" /> : 
                          <Unlock className="w-3 h-3" />
                        }
                      </Button>

                      {/* Delete */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteTrack(track.id)}
                        className="w-6 h-6 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Track Progress Bar */}
                  <div 
                    className="w-full h-2 rounded mb-3"
                    style={{ backgroundColor: track.color + '20' }}
                  >
                    <div 
                      className="h-full rounded transition-all duration-300"
                      style={{ 
                        backgroundColor: track.color,
                        width: `${Math.min(100, (track.metadata.duration / 120) * 100)}%`
                      }}
                    />
                  </div>

                  {/* Sync Information */}
                  {track.sync.enabled && (
                    <div className="mb-3 p-2 bg-gray-700/50 rounded text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Sincronização:</span>
                        <Badge variant="outline" className="text-green-400 border-green-400">
                          {track.sync.syncMode.toUpperCase()}
                        </Badge>
                      </div>
                      {track.sync.masterTrack && (
                        <div className="mt-1 text-gray-400">
                          Master: {tracks.find(t => t.id === track.sync.masterTrack)?.name}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Audio Controls */}
                  {track.audio && !track.collapsed && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleTrackMute(track.id)}
                          className={cn(
                            "w-6 h-6",
                            track.audio.muted ? "text-red-400" : "text-gray-400"
                          )}
                        >
                          {track.audio.muted ? 
                            <VolumeX className="w-3 h-3" /> : 
                            <Volume2 className="w-3 h-3" />
                          }
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleTrackSolo(track.id)}
                          className={cn(
                            "w-6 h-6",
                            track.audio.solo ? "text-yellow-400" : "text-gray-400"
                          )}
                        >
                          <Headphones className="w-3 h-3" />
                        </Button>

                        <div className="flex-1 flex items-center gap-2">
                          <Volume2 className="w-3 h-3 text-gray-400" />
                          <Slider
                            min={0}
                            max={100}
                            value={[track.audio.volume]}
                            onValueChange={([volume]) => updateTrackVolume(track.id, volume)}
                            className="flex-1"
                          />
                          <span className="text-xs text-gray-400 min-w-[35px]">
                            {track.audio.volume}%
                          </span>
                        </div>
                      </div>

                      {/* Audio Effects */}
                      {track.audio.effects.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-3 h-3 text-purple-400" />
                          <span className="text-xs text-gray-400">
                            {track.audio.effects.length} efeito(s) aplicado(s)
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Video Controls */}
                  {track.video && !track.collapsed && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Monitor className="w-3 h-3 text-gray-400" />
                        <div className="flex-1 flex items-center gap-2">
                          <Label className="text-xs">Opacidade</Label>
                          <Slider
                            min={0}
                            max={100}
                            value={[track.video.opacity]}
                            onValueChange={([opacity]) => 
                              setTracks(prev => prev.map(t => 
                                t.id === track.id && t.video
                                  ? { ...t, video: { ...t.video, opacity } }
                                  : t
                              ))
                            }
                            className="flex-1"
                          />
                          <span className="text-xs text-gray-400 min-w-[35px]">
                            {track.video.opacity}%
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Palette className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-400">
                          Blend: {track.video.blendMode}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
        </div>
      </ScrollArea>

      {/* Advanced Settings Panel */}
      <AnimatePresence>
        {showAdvancedSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-700 bg-gray-800"
          >
            <div className="p-4">
              <h3 className="text-sm font-semibold mb-3">Configurações Avançadas de Sincronização</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Modo de Sincronização Global</Label>
                  <select className="w-full mt-1 bg-gray-700 text-white text-xs rounded px-2 py-1">
                    <option value="auto">Automático</option>
                    <option value="manual">Manual</option>
                    <option value="timecode">Timecode</option>
                  </select>
                </div>
                
                <div>
                  <Label className="text-xs">Qualidade de Sincronização</Label>
                  <select className="w-full mt-1 bg-gray-700 text-white text-xs rounded px-2 py-1">
                    <option value="high">Alta (CPU intensivo)</option>
                    <option value="medium">Média (Balanceado)</option>
                    <option value="low">Baixa (Performance)</option>
                  </select>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}