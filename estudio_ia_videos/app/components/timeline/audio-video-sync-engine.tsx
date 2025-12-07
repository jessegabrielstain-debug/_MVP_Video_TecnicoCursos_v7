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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  Settings,
  Target,
  Clock,
  Activity,
  Video,
  Mic,
  Timer,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RotateCw,
  TrendingUp,
  TrendingDown,
  Gauge,
  Radio,
  Wifi,
  WifiOff,
  Cpu,
  HardDrive,
  MemoryStick,
  Thermometer,
  Battery,
  Signal,
  Crosshair,
  Radar,
  Satellite,
  Waves
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// Advanced Sync Types
interface SyncMetrics {
  audioLatency: number
  videoLatency: number
  totalDrift: number
  frameDrops: number
  bufferUnderruns: number
  cpuUsage: number
  memoryUsage: number
  networkLatency?: number
  jitter: number
  quality: 'perfect' | 'excellent' | 'good' | 'fair' | 'poor' | 'critical'
}

interface SyncConfiguration {
  mode: 'automatic' | 'manual' | 'hybrid'
  audioBufferSize: number
  videoBufferSize: number
  syncTolerance: number
  correctionStrength: number
  adaptiveSync: boolean
  lowLatencyMode: boolean
  hardwareAcceleration: boolean
  realTimeProcessing: boolean
  qualityPriority: 'latency' | 'quality' | 'balanced'
}

interface TimingControl {
  masterClock: 'system' | 'audio' | 'video' | 'external'
  sampleRate: 44100 | 48000 | 96000 | 192000
  frameRate: 23.976 | 24 | 25 | 29.97 | 30 | 50 | 59.94 | 60
  timecodeFormat: 'drop-frame' | 'non-drop-frame' | 'pal' | 'film'
  syncReference: 'internal' | 'genlock' | 'wordclock' | 'ltc'
}

const masterClockOptions: TimingControl['masterClock'][] = ['system', 'audio', 'video', 'external']
const sampleRateOptions: TimingControl['sampleRate'][] = [44100, 48000, 96000, 192000]
const frameRateOptions: TimingControl['frameRate'][] = [23.976, 24, 25, 29.97, 30, 50, 59.94, 60]
const timecodeFormatOptions: TimingControl['timecodeFormat'][] = ['drop-frame', 'non-drop-frame', 'pal', 'film']
const syncReferenceOptions: TimingControl['syncReference'][] = ['internal', 'genlock', 'wordclock', 'ltc']
const syncModeOptions: SyncConfiguration['mode'][] = ['automatic', 'manual', 'hybrid']

const isMasterClock = (value: string): value is TimingControl['masterClock'] =>
  masterClockOptions.some((option) => option === value)

const isSampleRate = (value: number): value is TimingControl['sampleRate'] =>
  sampleRateOptions.some((option) => option === value)

const isFrameRate = (value: number): value is TimingControl['frameRate'] =>
  frameRateOptions.some((option) => option === value)

const isTimecodeFormat = (value: string): value is TimingControl['timecodeFormat'] =>
  timecodeFormatOptions.some((option) => option === value)

const isSyncReference = (value: string): value is TimingControl['syncReference'] =>
  syncReferenceOptions.some((option) => option === value)

const isSyncMode = (value: string): value is SyncConfiguration['mode'] =>
  syncModeOptions.some((option) => option === value)

interface SyncEvent {
  id: string
  timestamp: number
  type: 'drift_detected' | 'correction_applied' | 'buffer_underrun' | 'frame_drop' | 'sync_lost' | 'sync_restored'
  severity: 'info' | 'warning' | 'error' | 'critical'
  details: Record<string, unknown>
  resolved: boolean
}

interface AudioVideoTrack {
  id: string
  type: 'audio' | 'video'
  name: string
  enabled: boolean
  latency: number
  bufferLevel: number
  quality: number
  syncOffset: number
  lastSync: number
  errors: number
}

// Advanced Sync Engine Component
export default function AudioVideoSyncEngine() {
  const [syncMetrics, setSyncMetrics] = useState<SyncMetrics>({
    audioLatency: 12.5,
    videoLatency: 16.7,
    totalDrift: 0.8,
    frameDrops: 0,
    bufferUnderruns: 0,
    cpuUsage: 35,
    memoryUsage: 68,
    jitter: 0.2,
    quality: 'excellent'
  })

  const [syncConfig, setSyncConfig] = useState<SyncConfiguration>({
    mode: 'automatic',
    audioBufferSize: 512,
    videoBufferSize: 3,
    syncTolerance: 1.0,
    correctionStrength: 75,
    adaptiveSync: true,
    lowLatencyMode: false,
    hardwareAcceleration: true,
    realTimeProcessing: true,
    qualityPriority: 'balanced'
  })

  const [timingControl, setTimingControl] = useState<TimingControl>({
    masterClock: 'system',
    sampleRate: 48000,
    frameRate: 30,
    timecodeFormat: 'non-drop-frame',
    syncReference: 'internal'
  })

  const [tracks, setTracks] = useState<AudioVideoTrack[]>([
    {
      id: 'master-video',
      type: 'video',
      name: 'Master Video',
      enabled: true,
      latency: 16.7,
      bufferLevel: 85,
      quality: 98,
      syncOffset: 0,
      lastSync: Date.now(),
      errors: 0
    },
    {
      id: 'audio-main',
      type: 'audio',
      name: 'Audio Principal',
      enabled: true,
      latency: 12.5,
      bufferLevel: 92,
      quality: 99,
      syncOffset: -2.1,
      lastSync: Date.now(),
      errors: 0
    },
    {
      id: 'audio-bg',
      type: 'audio',
      name: 'Audio Background',
      enabled: true,
      latency: 13.2,
      bufferLevel: 88,
      quality: 97,
      syncOffset: 1.3,
      lastSync: Date.now(),
      errors: 0
    }
  ])

  const [syncEvents, setSyncEvents] = useState<SyncEvent[]>([
    {
      id: '1',
      timestamp: Date.now() - 5000,
      type: 'sync_restored',
      severity: 'info',
      details: { drift: 0.8, correction: 'automatic' },
      resolved: true
    },
    {
      id: '2',
      timestamp: Date.now() - 15000,
      type: 'drift_detected',
      severity: 'warning',
      details: { drift: 2.3, threshold: 1.0 },
      resolved: true
    }
  ])

  const [isMonitoring, setIsMonitoring] = useState(true)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [autoCorrection, setAutoCorrection] = useState(true)

  // Real-time monitoring
  useEffect(() => {
    if (!isMonitoring) return

    const monitoringInterval = setInterval(() => {
      // Simulate real-time sync monitoring
      setSyncMetrics(prev => {
        const audioLatency = 12.5 + (Math.random() - 0.5) * 2
        const videoLatency = 16.7 + (Math.random() - 0.5) * 3
        const totalDrift = Math.abs(audioLatency - videoLatency) + (Math.random() - 0.5) * 1
        const jitter = Math.random() * 0.5
        const cpuUsage = 35 + Math.random() * 20
        const memoryUsage = 68 + Math.random() * 15

        const quality = totalDrift < 1 ? 'perfect' :
                        totalDrift < 2 ? 'excellent' :
                        totalDrift < 5 ? 'good' :
                        totalDrift < 10 ? 'fair' :
                        totalDrift < 20 ? 'poor' : 'critical'

        return {
          ...prev,
          audioLatency,
          videoLatency,
          totalDrift,
          jitter,
          cpuUsage,
          memoryUsage,
          quality
        }
      })

      // Update track metrics
      setTracks(prev => prev.map(track => ({
        ...track,
        bufferLevel: Math.max(50, Math.min(100, track.bufferLevel + (Math.random() - 0.5) * 10)),
        quality: Math.max(90, Math.min(100, track.quality + (Math.random() - 0.5) * 2)),
        syncOffset: track.syncOffset + (Math.random() - 0.5) * 0.5,
        lastSync: Date.now()
      })))
    }, 100)

    return () => clearInterval(monitoringInterval)
  }, [isMonitoring])

  // Auto-correction system
  useEffect(() => {
    if (!autoCorrection || !isMonitoring) return

    const correctionInterval = setInterval(() => {
      if (syncMetrics.totalDrift > syncConfig.syncTolerance) {
        // Apply automatic correction
        const correctionAmount = syncMetrics.totalDrift * (syncConfig.correctionStrength / 100)
        
        setSyncEvents(prev => [{
          id: Date.now().toString(),
          timestamp: Date.now(),
          type: 'correction_applied',
          severity: 'info',
          details: { 
            drift: syncMetrics.totalDrift, 
            correction: correctionAmount,
            mode: 'automatic'
          },
          resolved: false
        }, ...prev.slice(0, 9)])

        toast.success(`Correção automática aplicada: ${correctionAmount.toFixed(1)}ms`)
      }
    }, 1000)

    return () => clearInterval(correctionInterval)
  }, [autoCorrection, isMonitoring, syncMetrics.totalDrift, syncConfig])

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'perfect': return 'text-green-500'
      case 'excellent': return 'text-green-400'
      case 'good': return 'text-blue-400'
      case 'fair': return 'text-yellow-400'
      case 'poor': return 'text-orange-400'
      case 'critical': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getQualityBadgeColor = (quality: string) => {
    switch (quality) {
      case 'perfect': return 'bg-green-500/20 text-green-400 border-green-400'
      case 'excellent': return 'bg-green-500/20 text-green-400 border-green-400'
      case 'good': return 'bg-blue-500/20 text-blue-400 border-blue-400'
      case 'fair': return 'bg-yellow-500/20 text-yellow-400 border-yellow-400'
      case 'poor': return 'bg-orange-500/20 text-orange-400 border-orange-400'
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-400'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-400'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'info': return <CheckCircle className="w-4 h-4 text-blue-400" />
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-400" />
      case 'error': return <XCircle className="w-4 h-4 text-red-400" />
      case 'critical': return <XCircle className="w-4 h-4 text-red-500" />
      default: return <CheckCircle className="w-4 h-4 text-gray-400" />
    }
  }

  const formatLatency = (latency: number) => {
    return `${latency.toFixed(1)}ms`
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const applySyncCorrection = useCallback((trackId: string, correction: number) => {
    setTracks(prev => prev.map(track => 
      track.id === trackId 
        ? { ...track, syncOffset: track.syncOffset + correction }
        : track
    ))

    setSyncEvents(prev => [{
      id: Date.now().toString(),
      timestamp: Date.now(),
      type: 'correction_applied',
      severity: 'info',
      details: { trackId, correction, mode: 'manual' },
      resolved: false
    }, ...prev.slice(0, 9)])

    toast.success(`Correção manual aplicada: ${correction > 0 ? '+' : ''}${correction.toFixed(1)}ms`)
  }, [])

  const resetSync = useCallback(() => {
    setTracks(prev => prev.map(track => ({ ...track, syncOffset: 0, errors: 0 })))
    setSyncEvents(prev => [{
      id: Date.now().toString(),
      timestamp: Date.now(),
      type: 'sync_restored',
      severity: 'info',
      details: { action: 'manual_reset' },
      resolved: false
    }, ...prev.slice(0, 9)])
    toast.success('Sincronização resetada')
  }, [])

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Header with Real-time Status */}
      <div className="p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">Sincronização Áudio/Vídeo</h2>
            <Badge variant="outline" className={getQualityBadgeColor(syncMetrics.quality)}>
              <Target className="w-3 h-3 mr-1" />
              {syncMetrics.quality.toUpperCase()}
            </Badge>
            <Badge variant="outline" className="bg-blue-600/20 text-blue-400 border-blue-400">
              <Activity className="w-3 h-3 mr-1" />
              {isMonitoring ? 'ATIVO' : 'PAUSADO'}
            </Badge>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={isMonitoring}
                onCheckedChange={setIsMonitoring}
              />
              <Label className="text-sm">Monitoramento</Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={autoCorrection}
                onCheckedChange={setAutoCorrection}
              />
              <Label className="text-sm">Auto-Correção</Label>
            </div>

            <Button
              onClick={resetSync}
              variant="outline"
              size="sm"
            >
              <RotateCw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>

        {/* Real-time Metrics */}
        <div className="mt-4 grid grid-cols-6 gap-4">
          <div className="text-center">
            <div className="text-xs text-gray-400">Drift Total</div>
            <div className={cn("text-lg font-mono", getQualityColor(syncMetrics.quality))}>
              {formatLatency(syncMetrics.totalDrift)}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-xs text-gray-400">Latência Áudio</div>
            <div className="text-lg font-mono text-green-400">
              {formatLatency(syncMetrics.audioLatency)}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-xs text-gray-400">Latência Vídeo</div>
            <div className="text-lg font-mono text-blue-400">
              {formatLatency(syncMetrics.videoLatency)}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-xs text-gray-400">Jitter</div>
            <div className="text-lg font-mono text-yellow-400">
              {formatLatency(syncMetrics.jitter)}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-xs text-gray-400">CPU</div>
            <div className="text-lg font-mono text-purple-400">
              {syncMetrics.cpuUsage.toFixed(0)}%
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-xs text-gray-400">Memória</div>
            <div className="text-lg font-mono text-orange-400">
              {syncMetrics.memoryUsage.toFixed(0)}%
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <Tabs defaultValue="tracks" className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-4 bg-gray-800">
              <TabsTrigger value="tracks">Tracks</TabsTrigger>
              <TabsTrigger value="timing">Timing</TabsTrigger>
              <TabsTrigger value="events">Eventos</TabsTrigger>
              <TabsTrigger value="config">Configuração</TabsTrigger>
            </TabsList>

            <TabsContent value="tracks" className="flex-1 p-4">
              <div className="space-y-4">
                {tracks.map((track) => (
                  <Card key={track.id} className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {track.type === 'video' ? 
                            <Video className="w-5 h-5 text-blue-400" /> : 
                            <Mic className="w-5 h-5 text-green-400" />
                          }
                          <div>
                            <div className="font-medium">{track.name}</div>
                            <div className="text-xs text-gray-400">
                              Offset: {track.syncOffset > 0 ? '+' : ''}{track.syncOffset.toFixed(1)}ms
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-green-400 border-green-400">
                            {track.quality.toFixed(0)}%
                          </Badge>
                          <Switch
                            checked={track.enabled}
                            onCheckedChange={(enabled) => 
                              setTracks(prev => prev.map(t => 
                                t.id === track.id ? { ...t, enabled } : t
                              ))
                            }
                          />
                        </div>
                      </div>

                      {/* Track Metrics */}
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <Label className="text-xs text-gray-400">Latência</Label>
                          <div className="text-sm font-mono">{formatLatency(track.latency)}</div>
                        </div>
                        
                        <div>
                          <Label className="text-xs text-gray-400">Buffer</Label>
                          <div className="flex items-center gap-2">
                            <Progress value={track.bufferLevel} className="flex-1 h-2" />
                            <span className="text-xs">{track.bufferLevel}%</span>
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-xs text-gray-400">Erros</Label>
                          <div className="text-sm font-mono text-red-400">{track.errors}</div>
                        </div>
                      </div>

                      {/* Manual Sync Controls */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => applySyncCorrection(track.id, -1)}
                        >
                          -1ms
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => applySyncCorrection(track.id, -0.1)}
                        >
                          -0.1ms
                        </Button>
                        
                        <div className="flex-1 text-center text-xs text-gray-400">
                          Correção Manual
                        </div>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => applySyncCorrection(track.id, 0.1)}
                        >
                          +0.1ms
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => applySyncCorrection(track.id, 1)}
                        >
                          +1ms
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="timing" className="flex-1 p-4">
              <div className="grid grid-cols-2 gap-6">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-sm">Controle de Timing</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-xs">Master Clock</Label>
                      <select 
                        value={timingControl.masterClock}
                        onChange={(e) => {
                          const value = e.target.value
                          if (isMasterClock(value)) {
                            setTimingControl(prev => ({ ...prev, masterClock: value }))
                          }
                        }}
                        className="w-full mt-1 bg-gray-700 text-white text-sm rounded px-3 py-2"
                      >
                        <option value="system">System Clock</option>
                        <option value="audio">Audio Clock</option>
                        <option value="video">Video Clock</option>
                        <option value="external">External Clock</option>
                      </select>
                    </div>

                    <div>
                      <Label className="text-xs">Sample Rate</Label>
                      <select 
                        value={timingControl.sampleRate}
                        onChange={(e) => {
                          const value = Number(e.target.value)
                          if (isSampleRate(value)) {
                            setTimingControl(prev => ({ ...prev, sampleRate: value }))
                          }
                        }}
                        className="w-full mt-1 bg-gray-700 text-white text-sm rounded px-3 py-2"
                      >
                        <option value={44100}>44.1 kHz</option>
                        <option value={48000}>48 kHz</option>
                        <option value={96000}>96 kHz</option>
                        <option value={192000}>192 kHz</option>
                      </select>
                    </div>

                    <div>
                      <Label className="text-xs">Frame Rate</Label>
                      <select 
                        value={timingControl.frameRate}
                        onChange={(e) => {
                          const value = Number(e.target.value)
                          if (isFrameRate(value)) {
                            setTimingControl(prev => ({ ...prev, frameRate: value }))
                          }
                        }}
                        className="w-full mt-1 bg-gray-700 text-white text-sm rounded px-3 py-2"
                      >
                        <option value={23.976}>23.976 fps</option>
                        <option value={24}>24 fps</option>
                        <option value={25}>25 fps</option>
                        <option value={29.97}>29.97 fps</option>
                        <option value={30}>30 fps</option>
                        <option value={60}>60 fps</option>
                      </select>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-sm">Referência de Sync</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-xs">Timecode Format</Label>
                      <select 
                        value={timingControl.timecodeFormat}
                        onChange={(e) => {
                          const value = e.target.value
                          if (isTimecodeFormat(value)) {
                            setTimingControl(prev => ({ ...prev, timecodeFormat: value }))
                          }
                        }}
                        className="w-full mt-1 bg-gray-700 text-white text-sm rounded px-3 py-2"
                      >
                        <option value="drop-frame">Drop Frame</option>
                        <option value="non-drop-frame">Non-Drop Frame</option>
                        <option value="pal">PAL</option>
                        <option value="film">Film</option>
                      </select>
                    </div>

                    <div>
                      <Label className="text-xs">Sync Reference</Label>
                      <select 
                        value={timingControl.syncReference}
                        onChange={(e) => {
                          const value = e.target.value
                          if (isSyncReference(value)) {
                            setTimingControl(prev => ({ ...prev, syncReference: value }))
                          }
                        }}
                        className="w-full mt-1 bg-gray-700 text-white text-sm rounded px-3 py-2"
                      >
                        <option value="internal">Internal</option>
                        <option value="genlock">Genlock</option>
                        <option value="wordclock">Word Clock</option>
                        <option value="ltc">LTC</option>
                      </select>
                    </div>

                    <div className="pt-4 border-t border-gray-700">
                      <div className="text-xs text-gray-400 mb-2">Status da Referência</div>
                      <div className="flex items-center gap-2">
                        <Signal className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-green-400">Locked</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="events" className="flex-1 p-4">
              <Card className="bg-gray-800 border-gray-700 h-full">
                <CardHeader>
                  <CardTitle className="text-sm">Log de Eventos de Sincronização</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-2">
                      {syncEvents.map((event) => (
                        <div key={event.id} className="flex items-center gap-3 p-2 bg-gray-700/50 rounded">
                          {getSeverityIcon(event.severity)}
                          <div className="flex-1">
                            <div className="text-sm font-medium">
                              {event.type.replace(/_/g, ' ').toUpperCase()}
                            </div>
                            <div className="text-xs text-gray-400">
                              {formatTimestamp(event.timestamp)} • {JSON.stringify(event.details)}
                            </div>
                          </div>
                          {event.resolved && (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="config" className="flex-1 p-4">
              <div className="grid grid-cols-2 gap-6">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-sm">Configuração de Sync</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-xs">Modo de Sincronização</Label>
                      <select 
                        value={syncConfig.mode}
                        onChange={(e) => {
                          const value = e.target.value
                          if (isSyncMode(value)) {
                            setSyncConfig(prev => ({ ...prev, mode: value }))
                          }
                        }}
                        className="w-full mt-1 bg-gray-700 text-white text-sm rounded px-3 py-2"
                      >
                        <option value="automatic">Automático</option>
                        <option value="manual">Manual</option>
                        <option value="hybrid">Híbrido</option>
                      </select>
                    </div>

                    <div>
                      <Label className="text-xs">Tolerância de Sync (ms)</Label>
                      <Slider
                        min={0.1}
                        max={10}
                        step={0.1}
                        value={[syncConfig.syncTolerance]}
                        onValueChange={([value]) => setSyncConfig(prev => ({ 
                          ...prev, 
                          syncTolerance: value 
                        }))}
                        className="mt-2"
                      />
                      <div className="text-xs text-gray-400 mt-1">
                        {syncConfig.syncTolerance.toFixed(1)}ms
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">Força de Correção (%)</Label>
                      <Slider
                        min={10}
                        max={100}
                        step={5}
                        value={[syncConfig.correctionStrength]}
                        onValueChange={([value]) => setSyncConfig(prev => ({ 
                          ...prev, 
                          correctionStrength: value 
                        }))}
                        className="mt-2"
                      />
                      <div className="text-xs text-gray-400 mt-1">
                        {syncConfig.correctionStrength}%
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-sm">Configurações Avançadas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Sync Adaptativo</Label>
                      <Switch
                        checked={syncConfig.adaptiveSync}
                        onCheckedChange={(checked) => setSyncConfig(prev => ({ 
                          ...prev, 
                          adaptiveSync: checked 
                        }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Modo Baixa Latência</Label>
                      <Switch
                        checked={syncConfig.lowLatencyMode}
                        onCheckedChange={(checked) => setSyncConfig(prev => ({ 
                          ...prev, 
                          lowLatencyMode: checked 
                        }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Aceleração Hardware</Label>
                      <Switch
                        checked={syncConfig.hardwareAcceleration}
                        onCheckedChange={(checked) => setSyncConfig(prev => ({ 
                          ...prev, 
                          hardwareAcceleration: checked 
                        }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Processamento Tempo Real</Label>
                      <Switch
                        checked={syncConfig.realTimeProcessing}
                        onCheckedChange={(checked) => setSyncConfig(prev => ({ 
                          ...prev, 
                          realTimeProcessing: checked 
                        }))}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}