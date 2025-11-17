/**
 * Video Export Dialog Component
 * UI para configurar e iniciar exportação de vídeo
 * Integrado com Watermark, Filters, Audio e Subtitles (Sprint 48)
 */

'use client'

import React, { useState } from 'react'
import {
  ExportFormat,
  ExportResolution,
  ExportQuality,
  ExportSettings,
  ExportPhase,
  TimelineData,
} from '@/types/export.types'
import { useExportSocket } from '@/hooks/useExportSocket'
import { WatermarkSettings } from './WatermarkSettings'
import { VideoFiltersSettings } from './VideoFiltersSettings'
import { AudioEnhancementSettings } from './AudioEnhancementSettings'
import { SubtitleSettings } from './SubtitleSettings'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Settings, 
  Image as ImageIcon, 
  Palette, 
  Volume2, 
  FileText,
  Download,
  X
} from 'lucide-react'
import type { WatermarkConfig } from '@/types/watermark.types'
import type { VideoFilterConfig } from '@/lib/export/video-filters'
import type { AudioEnhancementConfig } from '@/lib/export/audio-processor'

interface VideoExportDialogProps {
  userId: string
  projectId: string
  timelineId: string
  timelineData?: TimelineData
  onClose?: () => void
}

const PHASE_LABELS: Record<ExportPhase, string> = {
  [ExportPhase.INITIALIZING]: 'Inicializando',
  [ExportPhase.PROCESSING_VIDEO]: 'Processando vídeo',
  [ExportPhase.PROCESSING_AUDIO]: 'Processando áudio',
  [ExportPhase.MERGING]: 'Mesclando',
  [ExportPhase.ENCODING]: 'Codificando',
  [ExportPhase.FINALIZING]: 'Finalizando',
}

export function VideoExportDialog({
  userId,
  projectId,
  timelineId,
  timelineData,
  onClose,
}: VideoExportDialogProps) {
  // Basic Settings
  const [format, setFormat] = useState<ExportFormat>(ExportFormat.MP4)
  const [resolution, setResolution] = useState<ExportResolution>(ExportResolution.FULL_HD_1080)
  const [quality, setQuality] = useState<ExportQuality>(ExportQuality.HIGH)
  const [fps, setFps] = useState(30)

  // Advanced Settings (Sprint 48)
  const [watermark, setWatermark] = useState<WatermarkConfig | null>(null)
  const [videoFilters, setVideoFilters] = useState<VideoFilterConfig[]>([])
  const [audioEnhancements, setAudioEnhancements] = useState<AudioEnhancementConfig[]>([])
  interface SubtitleConfig { language: string; url: string; }
  const [subtitle, setSubtitle] = useState<SubtitleConfig | null>(null)

  // State
  const [isExporting, setIsExporting] = useState(false)
  const [currentJobId, setCurrentJobId] = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('basic')

  // WebSocket hook
  const { currentProgress, startExport, cancelExport, isConnected } = useExportSocket(userId, {
    onProgress: (progress) => {
      console.log('Export progress:', progress.progress, progress.currentPhase)
    },

    onComplete: (data) => {
      console.log('Export complete:', data.outputUrl)
      setIsExporting(false)
      setDownloadUrl(data.outputUrl)
      setCurrentJobId(null)
    },

    onFailed: (data) => {
      console.error('Export failed:', data.error)
      setIsExporting(false)
      setErrorMessage(data.error)
      setCurrentJobId(null)
    },

    onCancelled: () => {
      console.log('Export cancelled')
      setIsExporting(false)
      setCurrentJobId(null)
    },
  })

  // Handler: Iniciar exportação
  const handleStartExport = async () => {
    try {
      setIsExporting(true)
      setErrorMessage(null)
      setDownloadUrl(null)

      const settings: ExportSettings = {
        format,
        resolution,
        quality,
        fps,
        includeWatermark: watermark !== null,
        // Advanced settings (Sprint 48)
        watermark: watermark || undefined,
        videoFilters: videoFilters.length > 0 ? videoFilters : undefined,
        audioEnhancements: audioEnhancements.length > 0 ? audioEnhancements : undefined,
        subtitle: subtitle || undefined,
      }

      const jobId = await startExport(projectId, timelineId, settings, timelineData)
      setCurrentJobId(jobId)
      console.log('Export started with advanced settings, job ID:', jobId)
    } catch (error) {
      console.error('Failed to start export:', error)
      setErrorMessage(String(error))
      setIsExporting(false)
    }
  }

  // Handler: Cancelar exportação
  const handleCancelExport = async () => {
    if (!currentJobId) return

    try {
      await cancelExport(currentJobId)
      setIsExporting(false)
      setCurrentJobId(null)
    } catch (error) {
      console.error('Failed to cancel export:', error)
    }
  }

  // Handler: Download
  const handleDownload = () => {
    if (!downloadUrl) return
    window.open(downloadUrl, '_blank')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Exportar Vídeo</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Configure as opções de exportação
            </p>
          </div>
          {!isExporting && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Connection Status */}
        <div className="mb-4 flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {isConnected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>

        {!isExporting && !downloadUrl ? (
          // Settings Form with Tabs
          <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="basic" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Básico</span>
                </TabsTrigger>
                <TabsTrigger value="watermark" className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">Marca d'água</span>
                </TabsTrigger>
                <TabsTrigger value="filters" className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  <span className="hidden sm:inline">Filtros</span>
                </TabsTrigger>
                <TabsTrigger value="audio" className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Áudio</span>
                </TabsTrigger>
                <TabsTrigger value="subtitle" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Legendas</span>
                </TabsTrigger>
              </TabsList>

              {/* Tab: Basic Settings */}
              <TabsContent value="basic" className="space-y-4 mt-6">
                {/* Format */}
                <div>
                  <label className="block text-sm font-medium mb-2">Formato</label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value as ExportFormat)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value={ExportFormat.MP4}>MP4 (H.264)</option>
                    <option value={ExportFormat.WEBM}>WebM (VP9)</option>
                    <option value={ExportFormat.MOV}>MOV (QuickTime)</option>
                  </select>
                </div>

                {/* Resolution */}
                <div>
                  <label className="block text-sm font-medium mb-2">Resolução</label>
                  <select
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value as ExportResolution)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value={ExportResolution.HD_720}>HD 720p (1280x720)</option>
                    <option value={ExportResolution.FULL_HD_1080}>Full HD 1080p (1920x1080)</option>
                    <option value={ExportResolution.UHD_4K}>4K UHD (3840x2160)</option>
                  </select>
                </div>

                {/* Quality */}
                <div>
                  <label className="block text-sm font-medium mb-2">Qualidade</label>
                  <select
                    value={quality}
                    onChange={(e) => setQuality(e.target.value as ExportQuality)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value={ExportQuality.LOW}>Baixa (mais rápido)</option>
                    <option value={ExportQuality.MEDIUM}>Média</option>
                    <option value={ExportQuality.HIGH}>Alta</option>
                    <option value={ExportQuality.ULTRA}>Ultra (melhor qualidade)</option>
                  </select>
                </div>

                {/* FPS */}
                <div>
                  <label className="block text-sm font-medium mb-2">FPS: {fps}</label>
                  <input
                    type="range"
                    min="24"
                    max="60"
                    step="6"
                    value={fps}
                    onChange={(e) => setFps(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>24</span>
                    <span>30</span>
                    <span>60</span>
                  </div>
                </div>
              </TabsContent>

              {/* Tab: Watermark */}
              <TabsContent value="watermark" className="mt-6">
                <WatermarkSettings config={watermark} onChange={setWatermark} />
              </TabsContent>

              {/* Tab: Filters */}
              <TabsContent value="filters" className="mt-6">
                <VideoFiltersSettings filters={videoFilters} onChange={setVideoFilters} />
              </TabsContent>

              {/* Tab: Audio */}
              <TabsContent value="audio" className="mt-6">
                <AudioEnhancementSettings
                  enhancements={audioEnhancements}
                  onChange={setAudioEnhancements}
                />
              </TabsContent>

              {/* Tab: Subtitle */}
              <TabsContent value="subtitle" className="mt-6">
                <SubtitleSettings subtitle={subtitle} onChange={setSubtitle} />
              </TabsContent>
            </Tabs>

            {/* Error */}
            {errorMessage && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
              </div>
            )}

            {/* Summary */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-semibold mb-2">Resumo da Exportação</h4>
              <div className="space-y-1 text-sm">
                <p>• Formato: {format.toUpperCase()}</p>
                <p>• Resolução: {resolution}</p>
                <p>• Qualidade: {quality}</p>
                <p>• FPS: {fps}</p>
                {watermark && <p>• Marca d'água: Ativada</p>}
                {videoFilters.length > 0 && (
                  <p>• Filtros de vídeo: {videoFilters.filter((f) => f.enabled).length} ativos</p>
                )}
                {audioEnhancements.length > 0 && (
                  <p>
                    • Processamento de áudio:{' '}
                    {audioEnhancements.filter((e) => e.enabled).length} ativos
                  </p>
                )}
                {subtitle && <p>• Legendas: {subtitle.enabled ? 'Ativadas' : 'Desativadas'}</p>}
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={handleStartExport}
              disabled={!isConnected}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              <Download className="h-5 w-5" />
              Iniciar Exportação
            </button>
          </div>
        ) : isExporting ? (
          // Progress
          <div className="space-y-4">
            {/* Progress Bar */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">
                  {currentProgress?.currentPhase
                    ? PHASE_LABELS[currentProgress.currentPhase]
                    : 'Processando...'}
                </span>
                <span className="text-sm font-medium">{currentProgress?.progress || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${currentProgress?.progress || 0}%` }}
                />
              </div>
            </div>

            {/* Message */}
            {currentProgress?.message && (
              <p className="text-sm text-gray-600 dark:text-gray-400">{currentProgress.message}</p>
            )}

            {/* Estimated Time */}
            {currentProgress?.estimatedTimeRemaining && (
              <p className="text-sm text-gray-500">
                Tempo restante estimado: {Math.round(currentProgress.estimatedTimeRemaining)}s
              </p>
            )}

            {/* Cancel Button */}
            <button
              onClick={handleCancelExport}
              className="w-full bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition"
            >
              Cancelar
            </button>
          </div>
        ) : (
          // Download
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-green-600 dark:text-green-400 font-semibold mb-2">
                ✓ Exportação concluída!
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Seu vídeo está pronto para download.
              </p>
            </div>

            <button
              onClick={handleDownload}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Baixar Vídeo
            </button>

            <button
              onClick={onClose}
              className="w-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 py-2 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
