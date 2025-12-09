/**
 * 🎬 Render Progress Component
 * Componente para exibir progresso de renderização em tempo real
 */

'use client'

import { useState, useEffect } from 'react'
import { logger } from '@/lib/logger'
import { Loader2, CheckCircle2, XCircle, Download, Play } from 'lucide-react'

export interface RenderStatus {
  jobId: string
  projectId: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  progress: number
  outputUrl?: string
  error?: string
  estimatedTime?: number
  currentSlide?: number
  totalSlides?: number
  stage?: 'downloading' | 'processing' | 'encoding' | 'finalizing'
}

export interface RenderProgressProps {
  jobId: string
  onComplete?: (outputUrl: string) => void
  onError?: (error: string) => void
  className?: string
}

export function RenderProgress({
  jobId,
  onComplete,
  onError,
  className = '',
}: RenderProgressProps) {
  const [status, setStatus] = useState<RenderStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [ws, setWs] = useState<WebSocket | null>(null)

  /**
   * Conectar ao WebSocket
   */
  useEffect(() => {
    if (!jobId) return

    const wsUrl = `ws://localhost:${process.env.NEXT_PUBLIC_WS_PORT || 3001}?jobId=${jobId}`
    const socket = new WebSocket(wsUrl)

    socket.onopen = () => {
      logger.debug('WebSocket connected', { component: 'RenderProgress', jobId })
    }

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      if (data.type === 'progress') {
        setStatus((prev) => ({
          ...prev!,
          progress: data.progress.percentage,
          currentSlide: data.progress.currentSlide,
          totalSlides: data.progress.totalSlides,
          estimatedTime: data.progress.estimatedTime,
          stage: data.progress.stage,
        }))
      } else if (data.type === 'completed') {
        fetchStatus() // Atualizar com URL final
      } else if (data.type === 'failed') {
        setError(data.error)
        if (onError) {
          onError(data.error)
        }
      }
    }

    socket.onerror = (error) => {
      logger.error('WebSocket error', new Error('WebSocket connection failed'), { component: 'RenderProgress', jobId, error })
      setError('Failed to connect to render server')
    }

    socket.onclose = () => {
      logger.debug('WebSocket disconnected', { component: 'RenderProgress', jobId })
    }

    setWs(socket)

    // Cleanup
    return () => {
      socket.close()
    }
  }, [jobId])

  /**
   * Buscar status inicial
   */
  useEffect(() => {
    fetchStatus()
    
    // Poll a cada 5 segundos como fallback
    const interval = setInterval(fetchStatus, 5000)
    return () => clearInterval(interval)
  }, [jobId])

  /**
   * Fetch status from API
   */
  async function fetchStatus() {
    try {
      const response = await fetch(`/api/render/status/${jobId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch status')
      }

      setStatus(data.data)

      // Callbacks
      if (data.data.status === 'completed' && data.data.outputUrl) {
        if (onComplete) {
          onComplete(data.data.outputUrl)
        }
      } else if (data.data.status === 'failed' && data.data.error) {
        setError(data.data.error)
        if (onError) {
          onError(data.data.error)
        }
      }
    } catch (err) {
      logger.error('Error fetching status', err instanceof Error ? err : new Error(String(err)), { component: 'RenderProgress', jobId })
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  /**
   * Cancelar renderização
   */
  async function cancelRender() {
    if (!confirm('Tem certeza que deseja cancelar a renderização?')) {
      return
    }

    try {
      const response = await fetch(`/api/render/cancel/${jobId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchStatus()
      }
    } catch (err) {
      logger.error('Error cancelling render', err instanceof Error ? err : new Error(String(err)), { component: 'RenderProgress', jobId })
    }
  }

  /**
   * Download do vídeo
   */
  function downloadVideo() {
    if (!status?.outputUrl) return

    const link = document.createElement('a')
    link.href = status.outputUrl
    link.download = `video-${jobId}.mp4`
    link.click()
  }

  if (error) {
    return (
      <div className={`p-6 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <div className="flex items-start gap-3">
          <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-900 mb-1">
              Erro na Renderização
            </h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!status) {
    return (
      <div className={`p-6 bg-gray-50 rounded-lg ${className}`}>
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
          <span className="text-gray-600">Carregando status...</span>
        </div>
      </div>
    )
  }

  if (status.status === 'completed') {
    return (
      <div className={`p-6 bg-green-50 border border-green-200 rounded-lg ${className}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-green-900 mb-1">
                Vídeo Renderizado com Sucesso!
              </h3>
              <p className="text-sm text-green-700">
                Seu vídeo está pronto para download e visualização.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={downloadVideo}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            {status.outputUrl && (
              <a
                href={status.outputUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Play className="w-4 h-4" />
                Assistir
              </a>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`p-6 bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          <h3 className="font-semibold text-gray-900">
            {status.status === 'pending' ? 'Aguardando...' : 'Renderizando Vídeo'}
          </h3>
        </div>
        {(status.status === 'pending' || status.status === 'processing') && (
          <button
            onClick={cancelRender}
            className="text-sm text-red-600 hover:text-red-700"
          >
            Cancelar
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            {status.progress}%
          </span>
          {status.estimatedTime && status.estimatedTime > 0 && (
            <span className="text-sm text-gray-500">
              ~{Math.ceil(status.estimatedTime / 60)} min restante(s)
            </span>
          )}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${status.progress}%` }}
          />
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        {status.currentSlide !== undefined && status.totalSlides !== undefined && (
          <div>
            <p className="text-gray-600">Slide</p>
            <p className="font-medium text-gray-900">
              {status.currentSlide} de {status.totalSlides}
            </p>
          </div>
        )}
        {status.stage && (
          <div>
            <p className="text-gray-600">Etapa</p>
            <p className="font-medium text-gray-900 capitalize">
              {getStageLabel(status.stage)}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function getStageLabel(stage: string): string {
  const labels: Record<string, string> = {
    downloading: 'Baixando arquivos',
    processing: 'Processando slides',
    encoding: 'Codificando vídeo',
    finalizing: 'Finalizando',
  }
  return labels[stage] || stage
}
