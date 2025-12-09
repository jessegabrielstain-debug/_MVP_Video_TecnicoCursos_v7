/**
 * 🎬 Render Panel Component
 * Painel completo para iniciar e acompanhar renderização
 */

'use client'

import { useState } from 'react'
import { logger } from '@/lib/logger'
import { RenderProgress } from './render-progress'
import { Film, Settings2, Loader2 } from 'lucide-react'

export interface RenderPanelProps {
  projectId: string
  slidesCount: number
  onRenderComplete?: (videoUrl: string) => void
  className?: string
}

export function RenderPanel({
  projectId,
  slidesCount,
  onRenderComplete,
  className = '',
}: RenderPanelProps) {
  const [jobId, setJobId] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Settings
  const [resolution, setResolution] = useState<'720p' | '1080p' | '4k'>('1080p')
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('high')
  const [format, setFormat] = useState<'mp4' | 'webm'>('mp4')
  const [transitions, setTransitions] = useState(true)
  const [watermarkText, setWatermarkText] = useState('')
  const [watermarkPosition, setWatermarkPosition] = useState<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('bottom-right')

  /**
   * Iniciar renderização
   */
  async function startRender() {
    try {
      setIsStarting(true)
      setError(null)

      const response = await fetch('/api/render/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          settings: {
            resolution,
            fps: 30,
            format,
            quality,
            transitions,
            watermark: watermarkText ? {
              text: watermarkText,
              position: watermarkPosition,
            } : undefined,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start render')
      }

      setJobId(data.data.jobId)

    } catch (err) {
      logger.error('Error starting render', err instanceof Error ? err : new Error(String(err)), { component: 'RenderPanel', projectId })
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsStarting(false)
    }
  }

  /**
   * Calcular tamanho estimado
   */
  function getEstimatedSize(): string {
    const bytesPerSecond = {
      '720p': { low: 250000, medium: 500000, high: 750000 },
      '1080p': { low: 500000, medium: 1000000, high: 1500000 },
      '4k': { low: 1500000, medium: 3000000, high: 4500000 },
    }

    const avgDuration = slidesCount * 30 // 30 segundos por slide
    const bytes = bytesPerSecond[resolution][quality] * avgDuration
    const mb = bytes / (1024 * 1024)

    return mb > 1000 ? `~${(mb / 1024).toFixed(1)} GB` : `~${mb.toFixed(0)} MB`
  }

  // Se já está renderizando, mostrar progresso
  if (jobId) {
    return (
      <RenderProgress
        jobId={jobId}
        onComplete={(url) => {
          if (onRenderComplete) {
            onRenderComplete(url)
          }
        }}
        onError={(err) => setError(err)}
        className={className}
      />
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <Film className="w-6 h-6 text-blue-600" />
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Renderizar Vídeo
          </h2>
          <p className="text-sm text-gray-600">
            {slidesCount} slides prontos para renderização
          </p>
        </div>
      </div>

      {/* Settings */}
      <div className="p-6 bg-gray-50 rounded-lg space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Settings2 className="w-5 h-5 text-gray-700" />
          <h3 className="font-semibold text-gray-900">Configurações</h3>
        </div>

        {/* Resolution */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Resolução
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['720p', '1080p', '4k'] as const).map((res) => (
              <button
                key={res}
                onClick={() => setResolution(res)}
                className={`
                  px-4 py-2 rounded-lg font-medium transition-colors
                  ${
                    resolution === res
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                {res}
              </button>
            ))}
          </div>
        </div>

        {/* Quality */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Qualidade
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['low', 'medium', 'high'] as const).map((qual) => (
              <button
                key={qual}
                onClick={() => setQuality(qual)}
                className={`
                  px-4 py-2 rounded-lg font-medium capitalize transition-colors
                  ${
                    quality === qual
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                {qual === 'low' ? 'Baixa' : qual === 'medium' ? 'Média' : 'Alta'}
              </button>
            ))}
          </div>
        </div>

        {/* Format */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Formato
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['mp4', 'webm'] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => setFormat(fmt)}
                className={`
                  px-4 py-2 rounded-lg font-medium uppercase transition-colors
                  ${
                    format === fmt
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>

        {/* Transitions */}
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={transitions}
              onChange={(e) => setTransitions(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm font-medium text-gray-700">
              Incluir transições entre slides
            </span>
          </label>
        </div>

        {/* Watermark */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Marca d'água (opcional)
          </label>
          <input
            type="text"
            value={watermarkText}
            onChange={(e) => setWatermarkText(e.target.value)}
            placeholder="Texto da marca d'água"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
          {watermarkText && (
            <div className="grid grid-cols-4 gap-2 mt-2">
              {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map((pos) => (
                <button
                  key={pos}
                  onClick={() => setWatermarkPosition(pos)}
                  className={`
                    px-3 py-1 text-xs rounded transition-colors
                    ${
                      watermarkPosition === pos
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  {pos.replace('-', ' ')}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
        <div>
          <p className="text-blue-700">Tempo Estimado</p>
          <p className="text-lg font-semibold text-blue-900">
            ~{Math.ceil(slidesCount * 10 / 60)} minutos
          </p>
        </div>
        <div>
          <p className="text-blue-700">Tamanho Estimado</p>
          <p className="text-lg font-semibold text-blue-900">
            {getEstimatedSize()}
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Start Button */}
      <button
        onClick={startRender}
        disabled={isStarting}
        className="
          w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium
          hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed
          transition-colors flex items-center justify-center gap-2
        "
      >
        {isStarting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Iniciando...
          </>
        ) : (
          <>
            <Film className="w-5 h-5" />
            Iniciar Renderização
          </>
        )}
      </button>
    </div>
  )
}
