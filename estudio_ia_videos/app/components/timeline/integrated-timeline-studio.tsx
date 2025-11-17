'use client';


import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Play,
  Pause,
  Square,
  Layers,
  Timer,
  Download,
  Save,
  Eye,
  Maximize2,
  Navigation,
  Target,
  Sparkles,
  Clock,
  AudioLines,
  RotateCcw,
  TrendingUp,
  Activity,
  Cpu,
  HardDrive,
  Wifi,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

// Importar todos os componentes da timeline profissional
import AudioVideoSyncEngine from './audio-video-sync-engine';
import { EffectsTransitionsLibrary } from './effects-transitions-library';
import { KeyframeAnimationSystem } from './keyframe-animation-system';
import MultiTrackManager from './multi-track-manager';
import RealTimePreview from './real-time-preview';
import { SpeedTimingControls } from './speed-timing-controls';
import TimelineExportEngine from './timeline-export-engine';
import { UndoRedoSystem } from './undo-redo-system';
import { ZoomNavigationControls } from './zoom-navigation-controls';

// Interfaces para o estúdio integrado
interface TimelineItem {
  id: string
  start: number
  duration: number
  content: string
  properties?: Record<string, unknown>
  selected?: boolean
  keyframes?: Array<{ id: string; time: number; value: number; easing?: string }>
  effects?: Array<{ id: string; type: string; intensity?: number }>
  locked?: boolean
  fadeIn?: number
  fadeOut?: number
  speed?: number
  reversed?: boolean
  muted?: boolean
  volume?: number
  [key: string]: unknown
}

interface TimelineTrackMetadata {
  created: string
  modified: string
  duration: number
  itemCount: number
  size?: number
  format?: string
  [key: string]: unknown
}

interface TimelineTrack {
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
  effects?: Array<{ id: string; type: string; [key: string]: unknown }>
  metadata: TimelineTrackMetadata
  [key: string]: unknown
}

interface ExportJobMetadata {
  duration?: number
  size?: number
  resolution?: string
  format?: string
  thumbnails?: string[]
  codec?: string
  fps?: number
  bitrateKbps?: number
  sizeBytes?: number
}

interface ExportJobDetails {
  id: string
  status: ExportJobStatus
  progress?: number
  outputUrl?: string | null
  error?: string | null
  createdAt?: string
  updatedAt?: string
  startedAt?: string
  completedAt?: string
  metadata?: ExportJobMetadata
}

interface ExportHistoryEntry extends ExportJobDetails {
  progress: number
}

interface ExportHistoryPage {
  offset: number
  limit: number
  total: number
  hasNext: boolean
}

interface ExportHistoryResponse {
  success: boolean
  history?: unknown
  page?: Partial<ExportHistoryPage>
  error?: string
}

interface ExportJobResponse {
  success: boolean
  job?: unknown
  jobId?: string
  error?: string
}

interface TimelineSaveResponse {
  success: boolean
  message?: string
  error?: string
}

interface LoadTimelineResponse {
  success: boolean
  data?: {
    tracks?: unknown
    totalDuration?: number
    settings?: RemoteTimelineSettings
    projectName?: string
    updatedAt?: string
  }
  message?: string
}

interface StudioState {
  activeModule: string;
  projectName: string;
  lastSaved: Date | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  zoom: number;
  tracks: TimelineTrack[];
  selectedItems: string[];
  previewQuality: 'low' | 'medium' | 'high' | 'ultra';
  renderInProgress: boolean;
  syncStatus: 'synced' | 'syncing' | 'error';
  performanceMetrics: PerformanceMetrics;
}

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  cpuUsage: number;
  renderTime: number;
  syncLatency: number;
  activeEffects: number;
  trackCount: number;
}

type StudioModuleRenderer = (state: StudioState) => React.ReactNode

interface ModuleConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  render: StudioModuleRenderer;
  enabled: boolean;
  shortcut?: string;
}

const JOB_STATUSES = ['idle', 'queued', 'processing', 'completed', 'error', 'cancelled'] as const
type ExportJobStatus = (typeof JOB_STATUSES)[number]
const jobStatusSet = new Set<string>(JOB_STATUSES)

const isExportJobStatus = (value: string): value is ExportJobStatus => jobStatusSet.has(value)

const isTimelineTrackArray = (value: unknown): value is TimelineTrack[] =>
  Array.isArray(value) &&
  value.every(
    (track) =>
      track !== null &&
      typeof track === 'object' &&
      'id' in track &&
      typeof (track as { id?: unknown }).id === 'string' &&
      'items' in track &&
      Array.isArray((track as { items?: unknown }).items)
  )

const isExportHistoryEntryArray = (value: unknown): value is ExportHistoryEntry[] =>
  Array.isArray(value) &&
  value.every((entry) => entry && typeof entry === 'object' && 'id' in entry && 'progress' in entry)

const parseExportJobStatus = (value: unknown, fallback: ExportJobStatus = 'processing'): ExportJobStatus =>
  typeof value === 'string' && isExportJobStatus(value) ? value : fallback

const parseExportJobDetails = (value: unknown): ExportJobDetails | null => {
  if (!value || typeof value !== 'object') return null
  const { id, status } = value as { id?: unknown; status?: unknown }
  if (typeof id !== 'string') return null
  return {
    id,
    status: parseExportJobStatus(status ?? 'processing'),
    progress: typeof (value as { progress?: unknown }).progress === 'number' ? (value as { progress: number }).progress : undefined,
    outputUrl: typeof (value as { outputUrl?: unknown }).outputUrl === 'string'
      ? (value as { outputUrl: string }).outputUrl
      : null,
    error: typeof (value as { error?: unknown }).error === 'string' ? (value as { error: string }).error : null,
    createdAt: typeof (value as { createdAt?: unknown }).createdAt === 'string'
      ? (value as { createdAt: string }).createdAt
      : undefined,
    updatedAt: typeof (value as { updatedAt?: unknown }).updatedAt === 'string'
      ? (value as { updatedAt: string }).updatedAt
      : undefined,
    startedAt: typeof (value as { startedAt?: unknown }).startedAt === 'string'
      ? (value as { startedAt: string }).startedAt
      : undefined,
    completedAt: typeof (value as { completedAt?: unknown }).completedAt === 'string'
      ? (value as { completedAt: string }).completedAt
      : undefined,
    metadata: (value as { metadata?: ExportJobMetadata }).metadata,
  }
}

const parseExportHistoryPage = (value: Partial<ExportHistoryPage> | undefined, fallback?: ExportHistoryPage): ExportHistoryPage => ({
  offset: typeof value?.offset === 'number' ? value.offset : fallback?.offset ?? 0,
  limit: typeof value?.limit === 'number' ? value.limit : fallback?.limit ?? 10,
  total: typeof value?.total === 'number' ? value.total : fallback?.total ?? 0,
  hasNext: typeof value?.hasNext === 'boolean' ? value.hasNext : fallback?.hasNext ?? false
})

const parseExportHistory = (value: unknown): ExportHistoryEntry[] => {
  if (!value) return []
  if (isExportHistoryEntryArray(value)) {
    return value.map((entry) => ({
      ...entry,
      status: parseExportJobStatus(entry.status),
      progress: typeof entry.progress === 'number' ? entry.progress : 0,
      outputUrl: typeof entry.outputUrl === 'string' ? entry.outputUrl : null,
      error: typeof entry.error === 'string' ? entry.error : null
    }))
  }
  return []
}

const EXPORT_PROFILES = ['balance', 'quality', 'small'] as const;
type ExportProfile = (typeof EXPORT_PROFILES)[number];

const exportProfileSet = new Set<string>(EXPORT_PROFILES);

const isExportProfile = (value: string): value is ExportProfile =>
  exportProfileSet.has(value);

const QUALITY_OPTIONS = ['sd', 'hd', 'fhd', '4k'] as const;
type QualityOption = (typeof QUALITY_OPTIONS)[number];

const qualityOptionsSet = new Set<string>(QUALITY_OPTIONS);

const isQualityOption = (value: string): value is QualityOption =>
  qualityOptionsSet.has(value);

const HISTORY_STATUSES = ['all', 'queued', 'processing', 'completed', 'error'] as const;
type HistoryStatus = (typeof HISTORY_STATUSES)[number];

const historyStatusSet = new Set<string>(HISTORY_STATUSES);

const isHistoryStatus = (value: string): value is HistoryStatus =>
  historyStatusSet.has(value);

const TIMELINE_FORMATS = ['mp4', 'webm', 'mov'] as const;
type TimelineFormat = (typeof TIMELINE_FORMATS)[number];

const timelineFormatSet = new Set<string>(TIMELINE_FORMATS);

const isTimelineFormat = (value: string): value is TimelineFormat =>
  timelineFormatSet.has(value);

const TIMELINE_RESOLUTIONS = ['1280x720', '1920x1080', '3840x2160'] as const;
type TimelineResolution = (typeof TIMELINE_RESOLUTIONS)[number];

const timelineResolutionSet = new Set<string>(TIMELINE_RESOLUTIONS);

const isTimelineResolution = (value: string): value is TimelineResolution =>
  timelineResolutionSet.has(value);

const TIMELINE_FPS_VALUES = [24, 30, 60] as const;
type TimelineFps = (typeof TIMELINE_FPS_VALUES)[number];

const timelineFpsSet = new Set<number>(TIMELINE_FPS_VALUES);

const isTimelineFps = (value: number): value is TimelineFps =>
  timelineFpsSet.has(value);

interface TimelineSettings {
  fps: TimelineFps;
  resolution: TimelineResolution;
  format: TimelineFormat;
  quality: QualityOption;
  snapToGrid: boolean;
  autoSave: boolean;
  zoom: number;
}

type RemoteTimelineSettings = Partial<TimelineSettings>;

const TIMELINE_DEFAULT_SETTINGS: TimelineSettings = {
  fps: 30,
  resolution: '1920x1080',
  format: 'mp4',
  quality: 'hd',
  snapToGrid: true,
  autoSave: true,
  zoom: 10,
};

// Configuração dos módulos
const TIMELINE_MODULES: ModuleConfig[] = [
  {
    id: 'tracks',
    name: 'Multi-Track',
    description: 'Gerenciamento de múltiplas faixas com sincronização',
    icon: <Layers className="w-4 h-4" />,
    render: () => <MultiTrackManager />,
    enabled: true,
    shortcut: 'Ctrl+1'
  },
  {
    id: 'sync',
    name: 'Audio/Video Sync',
    description: 'Sincronização precisa de áudio e vídeo',
    icon: <AudioLines className="w-4 h-4" />,
    render: () => <AudioVideoSyncEngine />,
    enabled: true,
    shortcut: 'Ctrl+2'
  },
  {
    id: 'preview',
    name: 'Preview Real-Time',
    description: 'Preview em tempo real com scrubbing',
    icon: <Eye className="w-4 h-4" />,
    render: () => <RealTimePreview />,
    enabled: true,
    shortcut: 'Ctrl+3'
  },
  {
    id: 'export',
    name: 'Export Engine',
    description: 'Exportação avançada com múltiplos formatos',
    icon: <Download className="w-4 h-4" />,
    render: () => <TimelineExportEngine />,
    enabled: true,
    shortcut: 'Ctrl+4'
  },
  {
    id: 'keyframes',
    name: 'Keyframes',
    description: 'Sistema de animação com keyframes',
    icon: <Target className="w-4 h-4" />,
    render: () => <KeyframeAnimationSystem />,
    enabled: true,
    shortcut: 'Ctrl+5'
  },
  {
    id: 'timing',
    name: 'Speed & Timing',
    description: 'Controles de velocidade e timing precisos',
    icon: <Timer className="w-4 h-4" />,
    render: () => <SpeedTimingControls />,
    enabled: true,
    shortcut: 'Ctrl+6'
  },
  {
    id: 'effects',
    name: 'Effects Library',
    description: 'Biblioteca de efeitos e transições',
    icon: <Sparkles className="w-4 h-4" />,
    render: () => <EffectsTransitionsLibrary />,
    enabled: true,
    shortcut: 'Ctrl+7'
  },
  {
    id: 'history',
    name: 'Undo/Redo',
    description: 'Sistema avançado de histórico',
    icon: <RotateCcw className="w-4 h-4" />,
    render: () => <UndoRedoSystem />,
    enabled: true,
    shortcut: 'Ctrl+8'
  },
  {
    id: 'navigation',
    name: 'Zoom & Navigation',
    description: 'Controles de zoom e navegação',
    icon: <Navigation className="w-4 h-4" />,
    render: () => <ZoomNavigationControls />,
    enabled: true,
    shortcut: 'Ctrl+9'
  }
];

export function IntegratedTimelineStudio() {
  const searchParams = useSearchParams();
  // Estados principais
  const [studioState, setStudioState] = useState<StudioState>({
    activeModule: 'tracks',
    projectName: 'Novo Projeto',
    lastSaved: null,
    isPlaying: false,
    currentTime: 0,
    duration: 300,
    zoom: 1,
    tracks: [],
    selectedItems: [],
    previewQuality: 'high',
    renderInProgress: false,
    syncStatus: 'synced',
    performanceMetrics: {
      fps: 60,
      memoryUsage: 45,
      cpuUsage: 25,
      renderTime: 16.7,
      syncLatency: 2,
      activeEffects: 0,
      trackCount: 0
    }
  });

  const [showPerformancePanel, setShowPerformancePanel] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [fullscreenModule, setFullscreenModule] = useState<string | null>(null);

  // Integração com APIs reais
  const [projectId, setProjectId] = useState<string>('');
  // Inicializa projectId pela URL (?projectId=...)
  useEffect(() => {
    const pid = searchParams?.get('projectId') || '';
    if (pid) setProjectId(pid);
  }, [searchParams]);

  // Carregar timeline do backend
  const handleLoadTimeline = useCallback(async () => {
    if (!projectId) {
      toast.error('Informe um Project ID para carregar a timeline.');
      return;
    }
    try {
      const res = await fetch(`/api/v1/timeline/multi-track?projectId=${encodeURIComponent(projectId)}`)
      const json = (await res.json()) as LoadTimelineResponse
      if (!res.ok || !json?.success || !json?.data) {
        throw new Error(json?.message || 'Falha ao carregar timeline')
      }
      const { tracks, totalDuration, settings, projectName } = json.data
      setStudioState(prev => ({
        ...prev,
        tracks: isTimelineTrackArray(tracks) ? tracks : prev.tracks,
        duration: typeof totalDuration === 'number' ? totalDuration : prev.duration,
        lastSaved: new Date(json.data.updatedAt || Date.now()),
        projectName: projectName || prev.projectName,
      }));
      if (settings) {
        setSettings(prev => ({
          ...prev,
          fps: isTimelineFps(Number(settings.fps)) ? (Number(settings.fps) as TimelineFps) : prev.fps,
          resolution:
            typeof settings.resolution === 'string' && isTimelineResolution(settings.resolution)
              ? settings.resolution
              : prev.resolution,
          format:
            typeof settings.format === 'string' && isTimelineFormat(settings.format)
              ? settings.format
              : prev.format,
          quality:
            typeof settings.quality === 'string' && isQualityOption(settings.quality)
              ? settings.quality
              : prev.quality,
          snapToGrid: settings.snapToGrid ?? prev.snapToGrid,
          autoSave: settings.autoSave ?? prev.autoSave,
          zoom: settings.zoom ?? prev.zoom,
        }));
        if (typeof settings.autoSave === 'boolean') setAutoSave(settings.autoSave);
      }
      toast.success('Timeline carregada');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      toast.error(`Erro ao carregar: ${error.message}`);
    }
  }, [projectId]);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportJobId, setExportJobId] = useState<string | null>(null);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [exportStatus, setExportStatus] = useState<ExportJobStatus>('idle');
  const [exportOutputUrl, setExportOutputUrl] = useState<string | null>(null);
  const [exportMetadata, setExportMetadata] = useState<ExportJobMetadata | null>(null);
  const [exportHistory, setExportHistory] = useState<ExportHistoryEntry[]>([]);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [historyStatus, setHistoryStatus] = useState<HistoryStatus>('all');
  const [historyPage, setHistoryPage] = useState<ExportHistoryPage>({ offset: 0, limit: 10, total: 0, hasNext: false });
  const [showJobModal, setShowJobModal] = useState(false);
  const [jobModalLoading, setJobModalLoading] = useState(false);
  const [jobDetails, setJobDetails] = useState<ExportJobDetails | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<ExportProfile>('balance');

  // Settings (persistidos com a timeline)
  const [settings, setSettings] = useState<TimelineSettings>(TIMELINE_DEFAULT_SETTINGS);

  // Codec sugerido e validação preventiva
  const suggestCodec = useCallback(() => {
    const fmt = (settings.format || 'mp4').toLowerCase();
    const q = settings.quality || 'hd';
    if (fmt === 'webm') return 'vp9';
    if (fmt === 'mov') return q === '4k' ? 'h265' : 'h264';
    return q === '4k' ? 'h265' : 'h264';
  }, [settings.format, settings.quality]);

  const isCombinationValid = useCallback(() => {
    if (!isTimelineFormat(settings.format)) return false;
    if (!isQualityOption(settings.quality)) return false;
    if (!isTimelineFps(settings.fps)) return false;
    // Se chegamos aqui, haverá um codec sugerido compatível pelo backend
    return true;
  }, [settings.format, settings.quality, settings.fps]);

  const loadExportHistory = useCallback(async () => {
    if (!projectId) return;
    try {
      const qs = new URLSearchParams()
      qs.set('projectId', projectId)
      if (historyStatus !== 'all') qs.set('status', historyStatus)
      qs.set('limit', String(historyPage.limit))
      qs.set('offset', String(historyPage.offset))
      const res = await fetch(`/api/v1/video/export-real?${qs.toString()}`)
      const json = (await res.json()) as ExportHistoryResponse
      if (res.ok && json?.success) {
        setExportHistory(parseExportHistory(json.history))
        if (json.page) setHistoryPage(prev => parseExportHistoryPage(json.page, prev))
      }
    } catch {
      // silencioso
    }
  }, [projectId, historyStatus, historyPage.offset, historyPage.limit]);

  const openJobDetails = useCallback(async (jobId: string) => {
    try {
      setShowJobModal(true);
      setJobModalLoading(true);
      setJobDetails(null);
      const res = await fetch(`/api/v1/video/export-real?jobId=${encodeURIComponent(jobId)}`)
      const json = (await res.json()) as ExportJobResponse
      if (res.ok && json?.success) {
        setJobDetails(parseExportJobDetails(json.job));
      } else {
        toast.error(json?.error || 'Não foi possível carregar detalhes do job')
      }
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      toast.error(error.message || 'Falha ao carregar detalhes');
    } finally {
      setJobModalLoading(false);
    }
  }, []);

  const applyProfile = useCallback((profile: ExportProfile) => {
    setSelectedProfile(profile);
    if (profile === 'balance') {
      setSettings(prev => ({ ...prev, format: 'mp4', quality: 'hd', fps: 30 }));
    } else if (profile === 'quality') {
      setSettings(prev => ({ ...prev, format: 'mp4', quality: 'fhd', fps: 60 }));
    } else if (profile === 'small') {
      setSettings(prev => ({ ...prev, format: 'webm', quality: 'hd', fps: 24 }));
    }
  }, []);

  // Refs
  const studioRef = useRef<HTMLDivElement>(null);
  const performanceInterval = useRef<NodeJS.Timeout | null>(null);

  // Funções de controle global
  const togglePlayback = useCallback(() => {
    setStudioState(prev => ({
      ...prev,
      isPlaying: !prev.isPlaying
    }));
  }, []);

  const stopPlayback = useCallback(() => {
    setStudioState(prev => ({
      ...prev,
      isPlaying: false,
      currentTime: 0
    }));
  }, []);

  const saveProject = useCallback(async () => {
    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStudioState(prev => ({
        ...prev,
        lastSaved: new Date()
      }));

      // Toast de sucesso seria aqui
      console.log('Projeto salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar projeto:', error);
    }
  }, []);

  // Salvar timeline via API real
  const handleSaveTimeline = useCallback(async () => {
    if (!projectId) {
      toast.error('Informe um Project ID para salvar a timeline.');
      return;
    }
    try {
      setIsSaving(true);
      const res = await fetch('/api/v1/timeline/multi-track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          tracks: studioState.tracks || [],
          totalDuration: studioState.duration || 0,
          exportSettings: settings
        })
      });
      const json = (await res.json()) as TimelineSaveResponse;
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || json?.error || 'Falha ao salvar timeline');
      }
      toast.success('Timeline salva com sucesso');
      setStudioState(prev => ({ ...prev, lastSaved: new Date() }));
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      toast.error(`Erro ao salvar: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  }, [projectId, studioState.tracks, studioState.duration, settings]);

  // Iniciar export via API real
  const handleExport = useCallback(async () => {
    if (!projectId) {
      toast.error('Informe um Project ID para exportar o vídeo.');
      return;
    }
    try {
      setIsExporting(true);
      setExportProgress(0);
      setExportStatus('queued');
      setExportOutputUrl(null);
      const codec = suggestCodec()
      const res = await fetch('/api/v1/video/export-real', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, options: { format: settings.format || 'mp4', quality: settings.quality || 'hd', fps: settings.fps || 30, codec } })
      })
      const json = (await res.json()) as ExportJobResponse
      if (!res.ok || !json?.success || !json?.jobId) {
        throw new Error(json?.error || 'Falha ao iniciar export')
      }
      setExportJobId(json.jobId)
      toast.success('Exportação iniciada');
      // Atualiza histórico após iniciar
      await loadExportHistory();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setIsExporting(false);
      setExportStatus('error');
      toast.error(`Erro ao exportar: ${error.message}`);
    }
  }, [projectId, settings, suggestCodec, loadExportHistory]);

  const handleCancelExport = useCallback(async () => {
    if (!exportJobId) return;
    try {
      const res = await fetch(`/api/v1/video/export-real?jobId=${encodeURIComponent(exportJobId)}`, { method: 'DELETE' });
      const json = (await res.json()) as ExportJobResponse;
      if (!res.ok || !json?.success) throw new Error(json?.error || 'Falha ao cancelar exportação');
      setIsExporting(false);
      setExportStatus('idle');
      setExportProgress(0);
      setExportOutputUrl(null);
      setExportJobId(null);
      toast.success('Exportação cancelada');
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      toast.error(`Erro ao cancelar: ${error.message}`);
    }
  }, [exportJobId]);

  // Polling do job de export
  useEffect(() => {
    if (!exportJobId) return;
    let mounted = true;
    let interval: NodeJS.Timeout | null = null;

    const checkJobStatus = async () => {
      try {
        const res = await fetch(`/api/v1/video/export-real?jobId=${exportJobId}`);
        const json = (await res.json()) as ExportJobResponse;
        if (!mounted) return;
        if (res.ok && json?.success) {
          const job = parseExportJobDetails(json.job);
          if (!job) {
            if (interval) clearInterval(interval);
            setIsExporting(false);
            setExportStatus('error');
            toast.error('Job de exportação indisponível');
            return;
          }
          setExportProgress(job.progress ?? 0);
          setExportStatus(job.status ?? 'processing');
          if (job.status === 'completed' || job.status === 'error') {
            if (interval) clearInterval(interval);
            setIsExporting(false);
            if (job.status === 'completed') {
              setExportOutputUrl(job.outputUrl || null);
              setExportMetadata(job.metadata || null);
              toast.success('Exportação concluída!');
              await loadExportHistory();
            } else {
              toast.error(job.error || 'Falha na exportação');
            }
          }
        } else if (!res.ok) {
          if (interval) clearInterval(interval);
          setIsExporting(false);
          setExportStatus('error');
        }
      } catch {
        if (interval) clearInterval(interval);
        setIsExporting(false);
        setExportStatus('error');
      }
    };

    interval = setInterval(() => {
      void checkJobStatus();
    }, 1500);
    void checkJobStatus();

    return () => {
      mounted = false;
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [exportJobId, loadExportHistory]);

  // Carregar histórico quando projectId mudar ou ao abrir painel
  useEffect(() => { void loadExportHistory(); }, [loadExportHistory]);

  // Carregar timeline do backend deve hidratar settings e autosave
  useEffect(() => {
    // Nada aqui – apenas garantimos que autoSave esteja sincronizado com settings.autoSave
  }, []);

  const switchModule = useCallback((moduleId: string) => {
    setStudioState(prev => ({
      ...prev,
      activeModule: moduleId
    }));
  }, []);

  const toggleFullscreen = useCallback((moduleId?: string) => {
    setFullscreenModule(prev => prev === moduleId ? null : moduleId || null);
  }, []);

  // Monitoramento de performance
  const updatePerformanceMetrics = useCallback(() => {
    setStudioState(prev => ({
      ...prev,
      performanceMetrics: {
        ...prev.performanceMetrics,
        fps: 60 - Math.random() * 10,
        memoryUsage: 40 + Math.random() * 30,
        cpuUsage: 20 + Math.random() * 40,
        renderTime: 16 + Math.random() * 10,
        syncLatency: 1 + Math.random() * 5,
        activeEffects: prev.tracks.reduce((acc, track) => acc + (track.effects?.length || 0), 0),
        trackCount: prev.tracks.length
      }
    }));
  }, []);

  // Auto-save
  useEffect(() => {
    if (!autoSave) return;

    const interval = setInterval(() => {
      if (projectId) {
        // Persistência real quando há projectId
        void handleSaveTimeline();
      } else {
        // Fallback para simulado
        void saveProject();
      }
    }, 30000); // Auto-save a cada 30 segundos

    return () => clearInterval(interval);
  }, [autoSave, projectId, handleSaveTimeline, saveProject]);

  // Sincronizar autoSave <-> settings.autoSave
  useEffect(() => {
    setSettings(prev => ({ ...prev, autoSave }));
  }, [autoSave]);
  useEffect(() => {
    if (settings.autoSave !== autoSave) setAutoSave(settings.autoSave);
  }, [settings.autoSave, autoSave]);

  // Performance monitoring
  useEffect(() => {
    if (showPerformancePanel) {
      performanceInterval.current = setInterval(updatePerformanceMetrics, 1000);
    } else {
      if (performanceInterval.current) {
        clearInterval(performanceInterval.current);
      }
    }

    return () => {
      if (performanceInterval.current) {
        clearInterval(performanceInterval.current);
      }
    };
  }, [showPerformancePanel, updatePerformanceMetrics]);

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;

      if (isCtrl) {
        switch (e.key) {
          case 's':
            e.preventDefault();
            void saveProject();
            break;
          case ' ':
            e.preventDefault();
            togglePlayback();
            break;
          case 'f':
            e.preventDefault();
            toggleFullscreen(studioState.activeModule);
            break;
          default: {
            // Verificar atalhos dos módulos
            const moduleShortcut = TIMELINE_MODULES.find(m => 
              m.shortcut === `Ctrl+${e.key}`
            );
            if (moduleShortcut) {
              e.preventDefault();
              switchModule(moduleShortcut.id);
            }
            break;
          }
        }
      }

      // Atalhos sem Ctrl
      switch (e.key) {
        case 'Escape':
          if (fullscreenModule) {
            setFullscreenModule(null);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveProject, togglePlayback, toggleFullscreen, studioState.activeModule, fullscreenModule, switchModule]);

  // Renderizar módulo ativo
  const renderActiveModule = () => {
    const activeModuleConfig = TIMELINE_MODULES.find(m => m.id === studioState.activeModule);
    if (!activeModuleConfig || !activeModuleConfig.enabled) {
      return (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Módulo não encontrado</h3>
            <p>O módulo selecionado não está disponível.</p>
          </div>
        </div>
      );
    }

    return activeModuleConfig.render(studioState);
  };

  return (
    <>
      <div 
        ref={studioRef}
        className={`w-full h-screen bg-gray-900 text-white flex flex-col ${
          fullscreenModule ? 'fixed inset-0 z-50' : ''
        }`}
      >
      {/* Header Global */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          {/* Título e Status */}
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-xl font-bold">Timeline Studio Profissional</h1>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <span>{studioState.projectName}</span>
                <Separator orientation="vertical" className="h-4" />
                <span>
                  {studioState.lastSaved 
                    ? `Salvo ${studioState.lastSaved.toLocaleTimeString()}`
                    : 'Não salvo'
                  }
                </span>
                <Separator orientation="vertical" className="h-4" />
                <Badge
                  variant={studioState.syncStatus === 'synced' ? 'default' : 'destructive'}
                  className="text-xs"
                >
                  {studioState.syncStatus === 'synced' && <CheckCircle className="w-3 h-3 mr-1" />}
                  {studioState.syncStatus === 'syncing' && <Activity className="w-3 h-3 mr-1" />}
                  {studioState.syncStatus === 'error' && <AlertCircle className="w-3 h-3 mr-1" />}
                  {studioState.syncStatus}
                </Badge>
              </div>
            </div>

          {/* Controles Globais + Integração API */}
          <div className="flex items-center space-x-2">
            {/* Controles de Reprodução */}
            <div className="flex items-center space-x-1 bg-gray-700 rounded-lg p-1">
              <Button
                onClick={togglePlayback}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                {studioState.isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
              <Button
                onClick={stopPlayback}
                size="sm"
                variant="outline"
                className="text-gray-300 border-gray-600"
              >
                <Square className="w-4 h-4" />
              </Button>
            </div>

            {/* Tempo Atual */}
            <div className="bg-gray-700 px-3 py-1 rounded text-sm font-mono">
              {Math.floor(studioState.currentTime / 60)}:{(studioState.currentTime % 60).toFixed(1).padStart(4, '0')}
            </div>

            {/* Qualidade do Preview */}
            <Badge variant="outline" className="text-gray-300 border-gray-600">
              {studioState.previewQuality.toUpperCase()}
            </Badge>

            {/* Codec sugerido */}
            <Badge variant={isCombinationValid() ? 'outline' : 'destructive'} className="text-gray-300 border-gray-600">
              Codec: {suggestCodec()}{!isCombinationValid() ? ' (inválido)' : ''}
            </Badge>

            {/* Project ID */}
            <input
              className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm w-72"
              placeholder="Project ID (obrigatório para salvar/exportar)"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            />

                {/* Perfil de Exportação */}
                <select
                  className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                  value={selectedProfile}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (isExportProfile(value)) {
                      applyProfile(value);
                    }
                  }}
                  title="Perfil de exportação"
                >
                  <option value="balance">Equilíbrio</option>
                  <option value="quality">Alta Qualidade</option>
                  <option value="small">Tamanho Reduzido</option>
                </select>

              {/* Settings rápidos: FPS e Resolução */}
              <select
                className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                value={settings.fps}
                onChange={(e) => {
                  const numericValue = Number(e.target.value);
                  if (isTimelineFps(numericValue)) {
                    setSettings(prev => ({ ...prev, fps: numericValue }));
                  }
                }}
                title="FPS"
              >
                <option value={24}>24 FPS</option>
                <option value={30}>30 FPS</option>
                <option value={60}>60 FPS</option>
              </select>
              <select
                className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                value={settings.resolution}
                onChange={(e) => {
                  const value = e.target.value;
                  if (isTimelineResolution(value)) {
                    setSettings(prev => ({ ...prev, resolution: value }));
                  }
                }}
                title="Resolução"
              >
                <option value="1280x720">1280x720</option>
                <option value="1920x1080">1920x1080</option>
                <option value="3840x2160">3840x2160</option>
              </select>
              <select
                className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                value={settings.quality}
                onChange={(e) => {
                  const value = e.target.value;
                  if (isQualityOption(value)) {
                    setSettings(prev => ({ ...prev, quality: value }));
                  }
                }}
                title="Qualidade"
              >
                <option value="sd">SD</option>
                <option value="hd">HD</option>
                <option value="fhd">Full HD</option>
                <option value="4k">4K</option>
              </select>
              <select
                className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm"
                value={settings.format}
                onChange={(e) => {
                  const value = e.target.value;
                  if (isTimelineFormat(value)) {
                    setSettings(prev => ({ ...prev, format: value }));
                  }
                }}
                title="Formato"
              >
                <option value="mp4">MP4</option>
                <option value="webm">WebM</option>
                <option value="mov">MOV</option>
              </select>

            {/* Botões de Ação */}
            <Button
              onClick={() => { void handleSaveTimeline(); }}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              disabled={isSaving || !projectId}
            >
              <Save className="w-4 h-4 mr-1" />
              {isSaving ? 'Salvando...' : 'Salvar Timeline'}
            </Button>

            <Button
              onClick={() => { void handleLoadTimeline(); }}
              size="sm"
              variant="outline"
              className="text-gray-300 border-gray-600"
              disabled={!projectId}
            >
              Carregar Timeline
            </Button>

            <Button
              onClick={() => { void handleExport(); }}
              size="sm"
              variant="secondary"
              disabled={isExporting || !projectId || !isCombinationValid()}
            >
              {isExporting ? `Exportando (${exportProgress}%)` : 'Exportar Vídeo'}
            </Button>
            <Button
              onClick={() => { setShowHistoryPanel(!showHistoryPanel); if (!showHistoryPanel) void loadExportHistory(); }}
              size="sm"
              variant="outline"
              className="text-gray-300 border-gray-600"
              disabled={!projectId}
              title="Mostrar histórico de exports"
            >
              Histórico
            </Button>
            {isExporting && (
              <Button
                onClick={() => { void handleCancelExport(); }}
                size="sm"
                variant="outline"
                className="text-gray-300 border-gray-600"
              >
                Cancelar
              </Button>
            )}
            {exportStatus !== 'idle' && (
              <Badge variant={exportStatus === 'error' ? 'destructive' : 'default'}>
                {exportStatus}
              </Badge>
            )}
            {isExporting && (
              <div className="w-40 h-2 bg-gray-700 rounded overflow-hidden">
                <div
                  className="h-2 bg-blue-500 transition-all"
                  style={{ width: `${Math.max(0, Math.min(100, exportProgress))}%` }}
                />
              </div>
            )}
            {exportStatus === 'completed' && exportMetadata && (
              <div className="text-xs text-gray-300 ml-2">
                {exportMetadata.codec && <span className="mr-2">Codec: {exportMetadata.codec}</span>}
                {typeof exportMetadata.duration === 'number' && (
                  <span className="mr-2">Duração: {Math.round(exportMetadata.duration)}s</span>
                )}
                {typeof exportMetadata.sizeBytes === 'number' && (
                  <span className="mr-2">Tamanho: {Math.max(1, Math.round(exportMetadata.sizeBytes / (1024 * 1024)))} MB</span>
                )}
                {typeof exportMetadata.bitrateKbps === 'number' && exportMetadata.bitrateKbps > 0 && (
                  <span className="mr-2">Bitrate: {exportMetadata.bitrateKbps} kbps</span>
                )}
                {typeof exportMetadata.resolution === 'string' && exportMetadata.resolution !== 'unknown' && (
                  <span>Resolução: {exportMetadata.resolution}</span>
                )}
              </div>
            )}

            {exportStatus === 'completed' && exportOutputUrl && (
              <div className="flex items-center space-x-2">
                {(() => {
                  const ext = (settings.format || 'mp4').toLowerCase();
                  const safeDate = new Date().toISOString().replace(/[:T]/g, '-').split('.')[0];
                  const filename = `${projectId || 'video'}_${safeDate}.${ext}`;
                  return (
                    <a
                      href={exportOutputUrl}
                      target="_blank"
                      rel="noreferrer"
                      download={filename}
                      className="inline-flex items-center px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-sm"
                    >
                      <Download className="w-4 h-4 mr-1" /> Baixar Vídeo
                    </a>
                  );
                })()}
                <Button
                  size="sm"
                  variant="outline"
                  className="text-gray-300 border-gray-600"
                  onClick={() => {
                    if (!exportOutputUrl) return;
                    navigator.clipboard.writeText(exportOutputUrl)
                      .then(() => toast.success('Link copiado para a área de transferência'))
                      .catch(() => toast.error('Não foi possível copiar o link'));
                  }}
                >
                  Copiar link
                </Button>
              </div>
            )}

            <Button
              onClick={() => setShowPerformancePanel(!showPerformancePanel)}
              size="sm"
              variant="outline"
              className="text-gray-300 border-gray-600"
            >
              <Activity className="w-4 h-4" />
            </Button>

            <Button
              onClick={() => toggleFullscreen(studioState.activeModule)}
              size="sm"
              variant="outline"
              className="text-gray-300 border-gray-600"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Navegação de Módulos */}
        <div className="mt-4">
          <Tabs value={studioState.activeModule} onValueChange={switchModule}>
            <TabsList className="grid grid-cols-9 bg-gray-700 w-full">
              {TIMELINE_MODULES.map((module) => (
                <TabsTrigger
                  key={module.id}
                  value={module.id}
                  className="flex items-center space-x-1 text-xs"
                  disabled={!module.enabled}
                  title={`${module.description} ${module.shortcut ? `(${module.shortcut})` : ''}`}
                >
                  {module.icon}
                  <span className="hidden lg:inline">{module.name}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Área Principal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Painel de Performance (Lateral) */}
        {showPerformancePanel && (
          <div className="w-80 bg-gray-800 border-r border-gray-700 p-4 overflow-y-auto">
            <Card className="bg-gray-700 border-gray-600">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center">
                      <Activity className="w-3 h-3 mr-1" />
                      FPS
                    </span>
                    <span className="font-mono">{studioState.performanceMetrics.fps.toFixed(1)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center">
                      <Cpu className="w-3 h-3 mr-1" />
                      CPU
                    </span>
                    <span className="font-mono">{studioState.performanceMetrics.cpuUsage.toFixed(1)}%</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center">
                      <HardDrive className="w-3 h-3 mr-1" />
                      Memory
                    </span>
                    <span className="font-mono">{studioState.performanceMetrics.memoryUsage.toFixed(1)}%</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      Render
                    </span>
                    <span className="font-mono">{studioState.performanceMetrics.renderTime.toFixed(1)}ms</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center">
                      <Wifi className="w-3 h-3 mr-1" />
                      Sync
                    </span>
                    <span className="font-mono">{studioState.performanceMetrics.syncLatency.toFixed(1)}ms</span>
                  </div>
                </div>

                <Separator className="bg-gray-600" />

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Tracks Ativas</span>
                    <Badge variant="outline" className="text-xs">
                      {studioState.performanceMetrics.trackCount}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span>Efeitos Ativos</span>
                    <Badge variant="outline" className="text-xs">
                      {studioState.performanceMetrics.activeEffects}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Módulo Ativo */}
        <div className="flex-1 overflow-hidden relative">
          {renderActiveModule()}

          {/* Painel de Histórico (flutuante) */}
          {showHistoryPanel && (
            <div className="absolute right-4 top-4 w-96 max-h-[60vh] overflow-y-auto bg-gray-800 border border-gray-700 rounded shadow-lg p-3 space-y-2">
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold">Histórico de Exports</div>
                <div className="space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-gray-300 border-gray-600"
                    onClick={() => { void loadExportHistory(); }}
                  >
                    Atualizar
                  </Button>
                  <Button size="sm" variant="outline" className="text-gray-300 border-gray-600" onClick={() => setShowHistoryPanel(false)}>Fechar</Button>
                </div>
              </div>
              <div className="flex items-center justify-between mb-2">
                <select
                  className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs"
                  value={historyStatus}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (isHistoryStatus(value)) {
                      setHistoryStatus(value);
                      setHistoryPage((p) => ({ ...p, offset: 0 }));
                    }
                  }}
                >
                  <option value="all">Todos</option>
                  <option value="queued">Queued</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="error">Error</option>
                </select>
                <div className="space-x-2 text-xs text-gray-300">
                  <Button size="sm" variant="outline" className="text-gray-300 border-gray-600" disabled={historyPage.offset === 0} onClick={() => setHistoryPage(p => ({ ...p, offset: Math.max(0, p.offset - p.limit) }))}>Prev</Button>
                  <Button size="sm" variant="outline" className="text-gray-300 border-gray-600" disabled={!historyPage.hasNext} onClick={() => setHistoryPage(p => ({ ...p, offset: p.offset + p.limit }))}>Next</Button>
                </div>
              </div>
              {exportHistory.length === 0 && (
                <div className="text-sm text-gray-400">Sem exports recentes para este projeto.</div>
              )}
              {exportHistory.map((j) => (
                <div key={j.id} className="border border-gray-700 rounded p-2 bg-gray-900">
                  <div className="flex items-center justify-between text-sm">
                    <div className="font-mono text-xs">{j.id}</div>
                    <Badge variant={j.status === 'error' ? 'destructive' : 'default'}>{j.status}{typeof j.progress === 'number' ? ` (${j.progress}%)` : ''}</Badge>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-gray-400">
                    <div>
                      {j.createdAt ? new Date(j.createdAt).toLocaleString() : ''}
                    </div>
                    <div className="space-x-2">
                      {j.outputUrl ? (
                        <a className="underline" href={j.outputUrl} target="_blank" rel="noreferrer">Abrir</a>
                      ) : (
                        <span className="opacity-60">Sem URL</span>
                      )}
                      <button className="underline" onClick={() => { void openJobDetails(j.id); }}>Detalhes</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      </div>

      {/* Status Bar */}
      <div className="bg-gray-800 border-t border-gray-700 p-2 flex items-center justify-between text-sm text-gray-400">
        <div className="flex items-center space-x-4">
          <span>Módulo: {TIMELINE_MODULES.find(m => m.id === studioState.activeModule)?.name}</span>
          <span>Zoom: {Math.round(studioState.zoom * 100)}%</span>
          <span>Duração: {Math.floor(studioState.duration / 60)}:{(studioState.duration % 60).toFixed(0).padStart(2, '0')}</span>
          <span>Itens Selecionados: {studioState.selectedItems.length}</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <span>Auto-save: {autoSave ? 'ON' : 'OFF'}</span>
          <span>Qualidade: {studioState.previewQuality}</span>
          {studioState.renderInProgress && (
            <span className="text-yellow-400 flex items-center">
              <Activity className="w-3 h-3 mr-1 animate-spin" />
              Renderizando...
            </span>
          )}
        </div>
      </div>
    </div>

    {/* Modal Detalhes do Job */}
    {showJobModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/60" onClick={() => setShowJobModal(false)} />
        <div className="relative bg-gray-900 border border-gray-700 rounded-lg w-[640px] max-w-[95vw] max-h-[80vh] overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-lg font-semibold">Detalhes do Job</div>
            <Button size="sm" variant="outline" className="text-gray-300 border-gray-600" onClick={() => setShowJobModal(false)}>Fechar</Button>
          </div>
          {jobModalLoading && <div className="text-sm text-gray-400">Carregando...</div>}
          {!jobModalLoading && jobDetails && (
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">ID</span>
                <span className="font-mono">{jobDetails.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Status</span>
                <Badge variant={jobDetails.status === 'error' ? 'destructive' : 'default'}>{jobDetails.status} {typeof jobDetails.progress === 'number' ? `(${jobDetails.progress}%)` : ''}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Início</span>
                <span>{jobDetails.startedAt ? new Date(jobDetails.startedAt).toLocaleString() : '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Término</span>
                <span>{jobDetails.completedAt ? new Date(jobDetails.completedAt).toLocaleString() : '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Link</span>
                <span className="flex items-center space-x-2">
                  {jobDetails.outputUrl ? (
                    <a className="underline" href={jobDetails.outputUrl} target="_blank" rel="noreferrer">Abrir</a>
                  ) : (
                    <span className="opacity-60">Sem URL</span>
                  )}
                  {jobDetails.outputUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-gray-300 border-gray-600"
                      onClick={() => {
                        navigator.clipboard.writeText(jobDetails.outputUrl)
                          .then(() => toast.success('Link copiado'))
                          .catch(() => toast.error('Falha ao copiar'));
                      }}
                    >
                      Copiar
                    </Button>
                  )}
                </span>
              </div>
              {jobDetails.metadata && (
                <>
                  <Separator className="bg-gray-700" />
                  <div className="font-semibold">Metadata</div>
                  <div className="grid grid-cols-2 gap-2">
                    {jobDetails.metadata.codec && <div><span className="text-gray-400">Codec: </span>{jobDetails.metadata.codec}</div>}
                    {typeof jobDetails.metadata.duration === 'number' && <div><span className="text-gray-400">Duração: </span>{Math.round(jobDetails.metadata.duration)}s</div>}
                    {typeof jobDetails.metadata.fps === 'number' && <div><span className="text-gray-400">FPS: </span>{jobDetails.metadata.fps}</div>}
                    {jobDetails.metadata.resolution && <div><span className="text-gray-400">Resolução: </span>{jobDetails.metadata.resolution}</div>}
                    {typeof jobDetails.metadata.bitrateKbps === 'number' && <div><span className="text-gray-400">Bitrate: </span>{jobDetails.metadata.bitrateKbps} kbps</div>}
                    {typeof jobDetails.metadata.sizeBytes === 'number' && <div><span className="text-gray-400">Tamanho: </span>{Math.max(1, Math.round(jobDetails.metadata.sizeBytes / (1024 * 1024)))} MB</div>}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    )}
    </>
  );
}