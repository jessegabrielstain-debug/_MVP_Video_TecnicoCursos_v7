/**
 * Hook para monitorar progresso de render jobs em tempo real
 * Usa polling inteligente com backoff exponencial
 * @module hooks/useRenderProgress
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type {
  RenderJobRecord,
  RenderJobStatus,
  RenderProgressResponse
} from '@/types/rendering'
import { isActiveStatus, isFinalStatus } from '@/types/rendering'

interface UseRenderProgressOptions {
  /** Intervalo inicial de polling em ms (default: 1000) */
  initialInterval?: number
  /** Intervalo máximo de polling em ms (default: 5000) */
  maxInterval?: number
  /** Fator de multiplicação para backoff (default: 1.5) */
  backoffFactor?: number
  /** Habilitar polling automático (default: true) */
  autoStart?: boolean
  /** Callback quando job for concluído */
  onComplete?: (job: RenderJobRecord) => void
  /** Callback quando job falhar */
  onError?: (error: string, job?: RenderJobRecord) => void
  /** Callback a cada atualização de progresso */
  onProgress?: (progress: number, job: RenderJobRecord) => void
}

interface RenderProgressState {
  job: RenderJobRecord | null
  isLoading: boolean
  isPolling: boolean
  error: string | null
  progress: number
  estimatedTimeRemaining: number | null
  currentStep: string | null
}

interface UseRenderProgressReturn extends RenderProgressState {
  /** Iniciar polling manualmente */
  startPolling: () => void
  /** Parar polling */
  stopPolling: () => void
  /** Buscar progresso uma vez (sem polling) */
  fetchProgress: () => Promise<void>
  /** Cancelar o job */
  cancelJob: () => Promise<boolean>
  /** Retry um job falhado */
  retryJob: () => Promise<string | null>
}

const DEFAULT_OPTIONS: Required<UseRenderProgressOptions> = {
  initialInterval: 1000,
  maxInterval: 5000,
  backoffFactor: 1.5,
  autoStart: true,
  onComplete: () => {},
  onError: () => {},
  onProgress: () => {}
}

export function useRenderProgress(
  jobId: string | null,
  options: UseRenderProgressOptions = {}
): UseRenderProgressReturn {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  
  const [state, setState] = useState<RenderProgressState>({
    job: null,
    isLoading: false,
    isPolling: false,
    error: null,
    progress: 0,
    estimatedTimeRemaining: null,
    currentStep: null
  })
  
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const currentIntervalRef = useRef(opts.initialInterval)
  const mountedRef = useRef(true)

  const clearPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
    currentIntervalRef.current = opts.initialInterval
  }, [opts.initialInterval])

  const fetchProgress = useCallback(async () => {
    if (!jobId || !mountedRef.current) return

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch(`/api/render/progress?jobId=${jobId}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data: RenderProgressResponse = await response.json()

      if (!mountedRef.current) return

      if (!data.success) {
        throw new Error(data.error || 'Falha ao obter progresso')
      }

      // Buscar dados completos do job
      const jobResponse = await fetch(`/api/render/jobs/${jobId}`)
      const jobData = await jobResponse.json()
      const job: RenderJobRecord = jobData.job || {
        id: jobId,
        status: data.status,
        progress: data.progress,
        created_at: new Date().toISOString(),
        started_at: null,
        completed_at: null,
        error_message: null,
        output_url: null
      }

      setState(prev => ({
        ...prev,
        job,
        isLoading: false,
        progress: data.progress,
        estimatedTimeRemaining: data.estimatedTimeRemaining ?? null,
        currentStep: data.currentStep ?? null
      }))

      // Callbacks
      opts.onProgress(data.progress, job)

      if (data.status === 'completed') {
        opts.onComplete(job)
        clearPolling()
        setState(prev => ({ ...prev, isPolling: false }))
      }

      if (data.status === 'failed') {
        opts.onError(job.error_message || 'Render falhou', job)
        clearPolling()
        setState(prev => ({ ...prev, isPolling: false }))
      }

      if (data.status === 'cancelled') {
        clearPolling()
        setState(prev => ({ ...prev, isPolling: false }))
      }

      // Backoff: aumentar intervalo se progresso não mudou
      if (isActiveStatus(data.status)) {
        currentIntervalRef.current = Math.min(
          currentIntervalRef.current * opts.backoffFactor,
          opts.maxInterval
        )
      }

    } catch (error) {
      if (!mountedRef.current) return

      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }))
    }
  }, [jobId, opts, clearPolling])

  const startPolling = useCallback(() => {
    if (!jobId || pollingIntervalRef.current) return

    setState(prev => ({ ...prev, isPolling: true }))
    currentIntervalRef.current = opts.initialInterval

    // Fetch imediato
    fetchProgress()

    // Setup polling
    const poll = () => {
      pollingIntervalRef.current = setTimeout(() => {
        fetchProgress().then(() => {
          if (mountedRef.current && pollingIntervalRef.current) {
            poll()
          }
        })
      }, currentIntervalRef.current)
    }

    poll()
  }, [jobId, fetchProgress, opts.initialInterval])

  const stopPolling = useCallback(() => {
    clearPolling()
    setState(prev => ({ ...prev, isPolling: false }))
  }, [clearPolling])

  const cancelJob = useCallback(async (): Promise<boolean> => {
    if (!jobId) return false

    try {
      const response = await fetch(`/api/render/cancel/${jobId}`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Falha ao cancelar job')
      }

      stopPolling()
      setState(prev => ({
        ...prev,
        job: prev.job ? { ...prev.job, status: 'cancelled' } : null
      }))

      return true
    } catch (error) {
      console.error('[useRenderProgress] cancelJob error:', error)
      return false
    }
  }, [jobId, stopPolling])

  const retryJob = useCallback(async (): Promise<string | null> => {
    if (!state.job) return null

    try {
      const response = await fetch('/api/render/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: state.job.project_id,
          render_settings: state.job.render_settings
        })
      })

      if (!response.ok) {
        throw new Error('Falha ao reiniciar render')
      }

      const data = await response.json()
      return data.job?.id ?? null
    } catch (error) {
      console.error('[useRenderProgress] retryJob error:', error)
      return null
    }
  }, [state.job])

  // Auto-start polling quando jobId mudar
  useEffect(() => {
    if (jobId && opts.autoStart) {
      startPolling()
    }

    return () => {
      clearPolling()
    }
  }, [jobId, opts.autoStart, startPolling, clearPolling])

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      clearPolling()
    }
  }, [clearPolling])

  return {
    ...state,
    startPolling,
    stopPolling,
    fetchProgress,
    cancelJob,
    retryJob
  }
}

// Hook simplificado para múltiplos jobs
export function useRenderJobs(projectId: string) {
  const [jobs, setJobs] = useState<RenderJobRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchJobs = useCallback(async () => {
    if (!projectId) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/render/jobs?project_id=${projectId}`)
      
      if (!response.ok) {
        throw new Error('Falha ao buscar jobs')
      }

      const data = await response.json()
      setJobs(data.jobs || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  return {
    jobs,
    isLoading,
    error,
    refresh: fetchJobs,
    activeJobs: jobs.filter(j => isActiveStatus(j.status)),
    completedJobs: jobs.filter(j => j.status === 'completed'),
    failedJobs: jobs.filter(j => j.status === 'failed')
  }
}

export default useRenderProgress
