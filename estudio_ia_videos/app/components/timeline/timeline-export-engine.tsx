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
import { Textarea } from '@/components/ui/textarea'
import { 
  Download, 
  Upload,
  FileText,
  Code,
  Settings,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Copy,
  Share,
  Save,
  FolderOpen,
  File,
  FileJson,
  FileVideo,
  FileAudio,
  FileImage,
  Layers,
  Clock,
  Zap,
  Target,
  Activity,
  Cpu,
  HardDrive,
  MemoryStick,
  Gauge,
  TrendingUp,
  BarChart3,
  PieChart,
  LineChart,
  Database,
  Server,
  Cloud,
  Wifi,
  Signal,
  Radio,
  Satellite,
  Monitor,
  Smartphone,
  Tablet,
  Tv,
  Camera,
  Video,
  Mic,
  Music,
  Image,
  Type,
  Sparkles,
  Palette,
  Filter,
  Sliders,
  RotateCw,
  RefreshCw,
  ArrowRight,
  ArrowDown,
  ChevronRight,
  ChevronDown,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Star,
  Heart,
  Bookmark,
  Flag,
  Tag,
  Hash,
  AtSign,
  Percent,
  DollarSign,
  Euro,
  Pound,
  Yen,
  Bitcoin,
  CreditCard,
  Banknote,
  Coins,
  Wallet,
  ShoppingCart,
  Package,
  Truck,
  Plane,
  Ship,
  Train,
  Car,
  Bike,
  Bus,
  Taxi,
  Fuel,
  MapPin,
  Map,
  Navigation,
  Compass,
  Globe,
  Earth,
  Sun,
  Moon,
  Star as StarIcon,
  Cloud as CloudIcon,
  CloudRain,
  CloudSnow,
  Zap as ZapIcon,
  Thermometer,
  Droplets,
  Wind,
  Umbrella,
  Rainbow,
  Sunrise,
  Sunset
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// Export Types
interface TimelineExportFormat {
  version: string
  metadata: {
    title: string
    description: string
    author: string
    created: string
    modified: string
    duration: number
    frameRate: number
    resolution: {
      width: number
      height: number
    }
    aspectRatio: string
    colorSpace: string
    audioSampleRate: number
    audioBitDepth: number
  }
  project: {
    settings: ProjectSettings
    tracks: ExportTrack[]
    effects: ExportEffect[]
    transitions: ExportTransition[]
    markers: ExportMarker[]
    keyframes: ExportKeyframe[]
  }
  render: {
    settings: RenderSettings
    queue: RenderJob[]
    presets: RenderPreset[]
  }
}

interface ProjectSettings {
  timebase: string
  dropFrame: boolean
  startTimecode: string
  videoCodec: string
  audioCodec: string
  containerFormat: string
  quality: number
  bitrate: number
  compressionLevel: number
}

interface ExportTrack {
  id: string
  type: 'video' | 'audio' | 'text' | 'image' | 'effect'
  name: string
  enabled: boolean
  locked: boolean
  muted: boolean
  solo: boolean
  volume: number
  pan: number
  opacity: number
  blendMode: string
  items: ExportTrackItem[]
  effects: string[]
  keyframes: string[]
}

interface ExportTrackItem {
  id: string
  type: string
  name: string
  source: {
    file: string
    format: string
    duration: number
    properties: Record<string, unknown>
  }
  timeline: {
    start: number
    end: number
    duration: number
    offset: number
    speed: number
    reverse: boolean
  }
  transform: {
    position: { x: number; y: number; z: number }
    rotation: { x: number; y: number; z: number }
    scale: { x: number; y: number; z: number }
    anchor: { x: number; y: number }
    opacity: number
  }
  audio: {
    volume: number
    pan: number
    muted: boolean
    fadeIn: number
    fadeOut: number
  }
  effects: string[]
  keyframes: string[]
}

interface ExportEffect {
  id: string
  name: string
  type: string
  category: string
  enabled: boolean
  parameters: Record<string, unknown>
  keyframes: string[]
  blendMode: string
  opacity: number
}

interface ExportTransition {
  id: string
  name: string
  type: string
  duration: number
  easing: string
  parameters: Record<string, unknown>
  keyframes: string[]
}

interface ExportMarker {
  id: string
  time: number
  type: 'in' | 'out' | 'chapter' | 'bookmark' | 'comment'
  name: string
  description: string
  color: string
  metadata: Record<string, unknown>
}

interface ExportKeyframe {
  id: string
  time: number
  property: string
  value: unknown
  interpolation: 'linear' | 'bezier' | 'hold' | 'ease-in' | 'ease-out' | 'ease-in-out'
  easing: {
    type: string
    parameters: Record<string, unknown>
  }
}

interface RenderSettings {
  format: string
  codec: string
  quality: number
  bitrate: number
  resolution: { width: number; height: number }
  frameRate: number
  audioSampleRate: number
  audioBitDepth: number
  channels: number
  colorSpace: string
  colorDepth: number
  compression: string
  optimization: string[]
}

interface RenderJob {
  id: string
  name: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  progress: number
  settings: RenderSettings
  output: {
    file: string
    format: string
    size: number
    duration: number
  }
  created: string
  started?: string
  completed?: string
  error?: string
}

interface RenderPreset {
  id: string
  name: string
  description: string
  category: string
  settings: RenderSettings
  tags: string[]
}

interface ExportProgress {
  stage: 'preparing' | 'analyzing' | 'processing' | 'optimizing' | 'finalizing' | 'completed' | 'error'
  progress: number
  currentItem: string
  itemsProcessed: number
  totalItems: number
  timeElapsed: number
  timeRemaining: number
  speed: number
  errors: string[]
  warnings: string[]
}

type ExportStageName = Exclude<ExportProgress['stage'], 'completed' | 'error'>
interface ExportHistoryEntry {
  id: string
  timestamp: string
  format: ExportFormat
  scope: ExportScope
  size: number
  duration: number
  success: boolean
}


const EXPORT_FORMAT_OPTIONS = ['json', 'xml', 'yaml', 'csv', 'binary'] as const
type ExportFormat = (typeof EXPORT_FORMAT_OPTIONS)[number]

const exportFormatSet = new Set<string>(EXPORT_FORMAT_OPTIONS)

const isExportFormat = (value: string): value is ExportFormat => exportFormatSet.has(value)

const EXPORT_SCOPE_OPTIONS = ['full', 'selection', 'range', 'markers'] as const
type ExportScope = (typeof EXPORT_SCOPE_OPTIONS)[number]

const exportScopeSet = new Set<string>(EXPORT_SCOPE_OPTIONS)

const isExportScope = (value: string): value is ExportScope => exportScopeSet.has(value)

// Timeline Export Engine Component
export default function TimelineExportEngine() {
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json')
  const [exportScope, setExportScope] = useState<ExportScope>('full')
  const [compressionLevel, setCompressionLevel] = useState(5)
  const [includeMetadata, setIncludeMetadata] = useState(true)
  const [includePreview, setIncludePreview] = useState(false)
  const [optimizeSize, setOptimizeSize] = useState(true)
  const [validateExport, setValidateExport] = useState(true)

  const [exportProgress, setExportProgress] = useState<ExportProgress>({
    stage: 'preparing',
    progress: 0,
    currentItem: '',
    itemsProcessed: 0,
    totalItems: 0,
    timeElapsed: 0,
    timeRemaining: 0,
    speed: 0,
    errors: [],
    warnings: []
  })

  const [isExporting, setIsExporting] = useState(false)
  const [exportResult, setExportResult] = useState<string>('')
  const [showPreview, setShowPreview] = useState(false)
  const [exportHistory, setExportHistory] = useState<ExportHistoryEntry[]>([])

  // Sample timeline data for demonstration
  const sampleTimelineData: TimelineExportFormat = useMemo(() => ({
    version: "1.0.0",
    metadata: {
      title: "Projeto Timeline Profissional",
      description: "Timeline avançada com múltiplas tracks e efeitos",
      author: "Estúdio IA Vídeos",
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      duration: 120.5,
      frameRate: 30,
      resolution: { width: 1920, height: 1080 },
      aspectRatio: "16:9",
      colorSpace: "Rec709",
      audioSampleRate: 48000,
      audioBitDepth: 24
    },
    project: {
      settings: {
        timebase: "30fps",
        dropFrame: false,
        startTimecode: "00:00:00:00",
        videoCodec: "H.264",
        audioCodec: "AAC",
        containerFormat: "MP4",
        quality: 85,
        bitrate: 8000,
        compressionLevel: 5
      },
      tracks: [
        {
          id: "video-1",
          type: "video",
          name: "Video Principal",
          enabled: true,
          locked: false,
          muted: false,
          solo: false,
          volume: 100,
          pan: 0,
          opacity: 100,
          blendMode: "normal",
          items: [
            {
              id: "item-1",
              type: "video",
              name: "Clipe Principal.mp4",
              source: {
                file: "/assets/videos/principal.mp4",
                format: "MP4",
                duration: 60.5,
                properties: {
                  codec: "H.264",
                  bitrate: 8000,
                  resolution: "1920x1080"
                }
              },
              timeline: {
                start: 0,
                end: 60.5,
                duration: 60.5,
                offset: 0,
                speed: 1.0,
                reverse: false
              },
              transform: {
                position: { x: 0, y: 0, z: 0 },
                rotation: { x: 0, y: 0, z: 0 },
                scale: { x: 1, y: 1, z: 1 },
                anchor: { x: 0.5, y: 0.5 },
                opacity: 100
              },
              audio: {
                volume: 80,
                pan: 0,
                muted: false,
                fadeIn: 1.0,
                fadeOut: 2.0
              },
              effects: ["color-correction-1", "stabilization-1"],
              keyframes: ["position-1", "opacity-1"]
            }
          ],
          effects: ["track-effect-1"],
          keyframes: ["track-volume-1"]
        },
        {
          id: "audio-1",
          type: "audio",
          name: "Áudio Principal",
          enabled: true,
          locked: false,
          muted: false,
          solo: false,
          volume: 85,
          pan: 0,
          opacity: 100,
          blendMode: "normal",
          items: [
            {
              id: "audio-item-1",
              type: "audio",
              name: "Narração.wav",
              source: {
                file: "/assets/audio/narracao.wav",
                format: "WAV",
                duration: 58.2,
                properties: {
                  sampleRate: 48000,
                  bitDepth: 24,
                  channels: 2
                }
              },
              timeline: {
                start: 2.0,
                end: 60.2,
                duration: 58.2,
                offset: 0,
                speed: 1.0,
                reverse: false
              },
              transform: {
                position: { x: 0, y: 0, z: 0 },
                rotation: { x: 0, y: 0, z: 0 },
                scale: { x: 1, y: 1, z: 1 },
                anchor: { x: 0.5, y: 0.5 },
                opacity: 100
              },
              audio: {
                volume: 90,
                pan: 0,
                muted: false,
                fadeIn: 0.5,
                fadeOut: 1.5
              },
              effects: ["eq-1", "compressor-1"],
              keyframes: ["volume-1"]
            }
          ],
          effects: [],
          keyframes: []
        }
      ],
      effects: [
        {
          id: "color-correction-1",
          name: "Correção de Cor",
          type: "color",
          category: "color-grading",
          enabled: true,
          parameters: {
            brightness: 10,
            contrast: 15,
            saturation: 5,
            hue: 0,
            gamma: 1.0,
            shadows: 0,
            midtones: 0,
            highlights: 0
          },
          keyframes: ["brightness-1"],
          blendMode: "normal",
          opacity: 100
        }
      ],
      transitions: [
        {
          id: "fade-1",
          name: "Fade In",
          type: "fade",
          duration: 1.0,
          easing: "ease-in-out",
          parameters: {
            direction: "in",
            curve: "smooth"
          },
          keyframes: []
        }
      ],
      markers: [
        {
          id: "marker-1",
          time: 15.5,
          type: "chapter",
          name: "Introdução",
          description: "Início da introdução do vídeo",
          color: "#3B82F6",
          metadata: {
            importance: "high",
            category: "structure"
          }
        }
      ],
      keyframes: [
        {
          id: "position-1",
          time: 10.0,
          property: "transform.position.x",
          value: 100,
          interpolation: "bezier",
          easing: {
            type: "cubic-bezier",
            parameters: {
              x1: 0.25,
              y1: 0.1,
              x2: 0.25,
              y2: 1.0
            }
          }
        }
      ]
    },
    render: {
      settings: {
        format: "MP4",
        codec: "H.264",
        quality: 85,
        bitrate: 8000,
        resolution: { width: 1920, height: 1080 },
        frameRate: 30,
        audioSampleRate: 48000,
        audioBitDepth: 24,
        channels: 2,
        colorSpace: "Rec709",
        colorDepth: 8,
        compression: "medium",
        optimization: ["hardware-acceleration", "multi-threading"]
      },
      queue: [],
      presets: [
        {
          id: "youtube-hd",
          name: "YouTube HD",
          description: "Otimizado para upload no YouTube em HD",
          category: "social-media",
          settings: {
            format: "MP4",
            codec: "H.264",
            quality: 80,
            bitrate: 6000,
            resolution: { width: 1920, height: 1080 },
            frameRate: 30,
            audioSampleRate: 48000,
            audioBitDepth: 16,
            channels: 2,
            colorSpace: "Rec709",
            colorDepth: 8,
            compression: "medium",
            optimization: ["web-optimized"]
          },
          tags: ["youtube", "hd", "social-media"]
        }
      ]
    }
  }), [])

  // Export simulation
  const startExport = useCallback(async () => {
    setIsExporting(true)
    setExportProgress({
      stage: 'preparing',
      progress: 0,
      currentItem: 'Inicializando exportação...',
      itemsProcessed: 0,
      totalItems: 100,
      timeElapsed: 0,
      timeRemaining: 0,
      speed: 0,
      errors: [],
      warnings: []
    })

    const stages: Array<{ name: ExportStageName; duration: number; items: string[] }> = [
      { name: 'preparing', duration: 1000, items: ['Validando timeline', 'Preparando dados', 'Verificando recursos'] },
      { name: 'analyzing', duration: 2000, items: ['Analisando tracks', 'Processando efeitos', 'Calculando keyframes'] },
      { name: 'processing', duration: 5000, items: ['Exportando vídeo', 'Exportando áudio', 'Aplicando efeitos'] },
      { name: 'optimizing', duration: 2000, items: ['Otimizando dados', 'Comprimindo arquivo', 'Validando estrutura'] },
      { name: 'finalizing', duration: 1000, items: ['Finalizando exportação', 'Gerando metadados', 'Salvando arquivo'] }
    ]

    let totalProgress = 0
    const startTime = Date.now()

    for (const stage of stages) {
      setExportProgress(prev => ({ 
        ...prev, 
        stage: stage.name,
        currentItem: stage.items[0]
      }))

      for (let i = 0; i < stage.items.length; i++) {
        const itemProgress = (i + 1) / stage.items.length
        const stageProgress = totalProgress + (itemProgress * (stage.duration / 11000) * 100)
        
        setExportProgress(prev => ({
          ...prev,
          progress: stageProgress,
          currentItem: stage.items[i],
          itemsProcessed: Math.floor(stageProgress),
          timeElapsed: Date.now() - startTime,
          timeRemaining: ((Date.now() - startTime) / stageProgress) * (100 - stageProgress),
          speed: stageProgress / ((Date.now() - startTime) / 1000)
        }))

        await new Promise(resolve => setTimeout(resolve, stage.duration / stage.items.length))
      }

      totalProgress += (stage.duration / 11000) * 100
    }

    // Generate export result
    const exportData = {
      ...sampleTimelineData,
      metadata: {
        ...sampleTimelineData.metadata,
        exported: new Date().toISOString(),
        exportSettings: {
          format: exportFormat,
          scope: exportScope,
          compression: compressionLevel,
          includeMetadata,
          includePreview,
          optimizeSize,
          validated: validateExport
        }
      }
    }

    let result = ''
    switch (exportFormat) {
      case 'json':
        result = JSON.stringify(exportData, null, 2)
        break
      case 'xml':
        result = '<?xml version="1.0" encoding="UTF-8"?>\n<timeline>\n  <!-- XML export not fully implemented -->\n</timeline>'
        break
      case 'yaml':
        result = '# YAML export not fully implemented\nversion: "1.0.0"\nmetadata:\n  title: "Projeto Timeline Profissional"'
        break
      default:
        result = JSON.stringify(exportData, null, 2)
    }

    setExportResult(result)
    setExportProgress(prev => ({
      ...prev,
      stage: 'completed',
      progress: 100,
      currentItem: 'Exportação concluída com sucesso!',
      itemsProcessed: 100,
      timeElapsed: Date.now() - startTime
    }))

    // Add to history
    setExportHistory(prev => [{
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      format: exportFormat,
      scope: exportScope,
      size: result.length,
      duration: Date.now() - startTime,
      success: true
    }, ...prev.slice(0, 9)])

    setIsExporting(false)
    toast.success('Timeline exportada com sucesso!')
  }, [exportFormat, exportScope, compressionLevel, includeMetadata, includePreview, optimizeSize, validateExport, sampleTimelineData])

  const downloadExport = useCallback(() => {
    if (!exportResult) return

    const blob = new Blob([exportResult], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `timeline-export-${Date.now()}.${exportFormat}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success('Arquivo baixado com sucesso!')
  }, [exportResult, exportFormat])

  const copyToClipboard = useCallback(() => {
    if (!exportResult) return

    navigator.clipboard.writeText(exportResult)
    toast.success('Copiado para a área de transferência!')
  }, [exportResult])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Header */}
      <div className="p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">Exportação de Timeline</h2>
            <Badge variant="outline" className="bg-blue-600/20 text-blue-400 border-blue-400">
              <FileJson className="w-3 h-3 mr-1" />
              {exportFormat.toUpperCase()}
            </Badge>
            {isExporting && (
              <Badge variant="outline" className="bg-orange-600/20 text-orange-400 border-orange-400">
                <Activity className="w-3 h-3 mr-1" />
                EXPORTANDO
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={startExport}
              disabled={isExporting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isExporting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Timeline
                </>
              )}
            </Button>

            {exportResult && (
              <>
                <Button
                  onClick={downloadExport}
                  variant="outline"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Baixar
                </Button>

                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Export Progress */}
        <AnimatePresence>
          {isExporting && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    <span className="capitalize">{exportProgress.stage.replace('-', ' ')}</span>
                  </div>
                  <div className="text-gray-400">
                    {exportProgress.itemsProcessed}/{exportProgress.totalItems} itens
                  </div>
                </div>

                <Progress value={exportProgress.progress} className="h-2" />

                <div className="flex items-center justify-between text-xs text-gray-400">
                  <div>{exportProgress.currentItem}</div>
                  <div className="flex items-center gap-4">
                    <span>Tempo: {formatDuration(exportProgress.timeElapsed)}</span>
                    {exportProgress.timeRemaining > 0 && (
                      <span>Restante: {formatDuration(exportProgress.timeRemaining)}</span>
                    )}
                    <span>Velocidade: {exportProgress.speed.toFixed(1)} it/s</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Settings Panel */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 overflow-y-auto">
          <Tabs defaultValue="format" className="h-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="format">Formato</TabsTrigger>
              <TabsTrigger value="options">Opções</TabsTrigger>
              <TabsTrigger value="history">Histórico</TabsTrigger>
            </TabsList>

            <TabsContent value="format" className="p-4 space-y-4">
              <Card className="bg-gray-700 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-sm">Formato de Exportação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs">Formato</Label>
                    <select 
                      value={exportFormat}
                      onChange={(e) => {
                        const value = e.target.value
                        if (isExportFormat(value)) {
                          setExportFormat(value)
                        }
                      }}
                      className="w-full mt-1 bg-gray-600 text-white text-sm rounded px-3 py-2"
                    >
                      <option value="json">JSON</option>
                      <option value="xml">XML</option>
                      <option value="yaml">YAML</option>
                      <option value="csv">CSV</option>
                      <option value="binary">Binary</option>
                    </select>
                  </div>

                  <div>
                    <Label className="text-xs">Escopo</Label>
                    <select 
                      value={exportScope}
                      onChange={(e) => {
                        const value = e.target.value
                        if (isExportScope(value)) {
                          setExportScope(value)
                        }
                      }}
                      className="w-full mt-1 bg-gray-600 text-white text-sm rounded px-3 py-2"
                    >
                      <option value="full">Timeline Completa</option>
                      <option value="selection">Seleção Atual</option>
                      <option value="range">Intervalo de Tempo</option>
                      <option value="markers">Entre Marcadores</option>
                    </select>
                  </div>

                  <div>
                    <Label className="text-xs">Compressão</Label>
                    <Slider
                      min={0}
                      max={9}
                      step={1}
                      value={[compressionLevel]}
                      onValueChange={([value]) => setCompressionLevel(value)}
                      className="mt-2"
                    />
                    <div className="text-xs text-gray-400 mt-1">
                      Nível {compressionLevel} - {compressionLevel === 0 ? 'Sem compressão' : 
                                                  compressionLevel < 3 ? 'Baixa' :
                                                  compressionLevel < 6 ? 'Média' :
                                                  compressionLevel < 8 ? 'Alta' : 'Máxima'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="options" className="p-4 space-y-4">
              <Card className="bg-gray-700 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-sm">Opções de Exportação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Incluir Metadados</Label>
                    <Switch
                      checked={includeMetadata}
                      onCheckedChange={setIncludeMetadata}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Incluir Preview</Label>
                    <Switch
                      checked={includePreview}
                      onCheckedChange={setIncludePreview}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Otimizar Tamanho</Label>
                    <Switch
                      checked={optimizeSize}
                      onCheckedChange={setOptimizeSize}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Validar Exportação</Label>
                    <Switch
                      checked={validateExport}
                      onCheckedChange={setValidateExport}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-700 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-sm">Informações do Projeto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Duração:</span>
                    <span>{sampleTimelineData.metadata.duration}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tracks:</span>
                    <span>{sampleTimelineData.project.tracks.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Efeitos:</span>
                    <span>{sampleTimelineData.project.effects.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Keyframes:</span>
                    <span>{sampleTimelineData.project.keyframes.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Resolução:</span>
                    <span>{sampleTimelineData.metadata.resolution.width}x{sampleTimelineData.metadata.resolution.height}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Frame Rate:</span>
                    <span>{sampleTimelineData.metadata.frameRate} fps</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="p-4">
              <Card className="bg-gray-700 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-sm">Histórico de Exportações</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {exportHistory.length === 0 ? (
                        <div className="text-center text-gray-400 text-sm py-8">
                          Nenhuma exportação realizada
                        </div>
                      ) : (
                        exportHistory.map((item) => (
                          <div key={item.id} className="p-2 bg-gray-600 rounded text-xs">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium">{item.format.toUpperCase()}</span>
                              <Badge variant="outline" className="text-green-400 border-green-400">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Sucesso
                              </Badge>
                            </div>
                            <div className="text-gray-400 space-y-1">
                              <div>Escopo: {item.scope}</div>
                              <div>Tamanho: {formatFileSize(item.size)}</div>
                              <div>Duração: {formatDuration(item.duration)}</div>
                              <div>Data: {new Date(item.timestamp).toLocaleString()}</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview Panel */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 bg-gray-800 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Preview da Exportação</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showPreview ? 'Ocultar' : 'Mostrar'}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-1 p-4">
            {exportResult ? (
              <Card className="h-full bg-gray-800 border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Resultado da Exportação</CardTitle>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>Tamanho: {formatFileSize(exportResult.length)}</span>
                      <span>Linhas: {exportResult.split('\n').length}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="h-full">
                  <ScrollArea className="h-full">
                    <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">
                      {showPreview ? exportResult : 'Preview oculto. Clique em "Mostrar" para visualizar o conteúdo.'}
                    </pre>
                  </ScrollArea>
                </CardContent>
              </Card>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <div className="text-lg mb-2">Nenhuma exportação realizada</div>
                  <div className="text-sm">Clique em "Exportar Timeline" para gerar o arquivo</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}