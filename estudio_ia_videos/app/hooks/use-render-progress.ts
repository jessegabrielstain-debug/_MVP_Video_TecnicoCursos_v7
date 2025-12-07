'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface RenderProgress {
  jobId: string
  status: 'pending' | 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled'
  progress: number
  outputUrl?: string
  error?: string
}

interface UseRenderProgressOptions {
  jobId: string | null
  onComplete?: (url: string) => void
  onError?: (error: string) => void
  pollingInterval?: number
}

export function useRenderProgress({
  jobId,
  onComplete,
  onError,
  pollingInterval = 3000,
}: UseRenderProgressOptions): RenderProgress | null {
  const [progress, setProgress] = useState<RenderProgress | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const mountedRef = useRef(true)

  const fetchProgress = useCallback(async () => {
    if (!jobId) return

    try {
      const response = await fetch(`/api/render/status?jobId=${jobId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch progress')
      }
      
      const data = await response.json()
      
      if (!mountedRef.current) return

      const newProgress: RenderProgress = {
        jobId,
        status: data.status || 'pending',
        progress: data.progress || 0,
        outputUrl: data.outputUrl || data.output_url,
        error: data.error || data.error_message,
      }

      setProgress(newProgress)

      // Handle terminal states
      if (newProgress.status === 'completed') {
        setIsPolling(false)
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
        if (onComplete && newProgress.outputUrl) {
          onComplete(newProgress.outputUrl)
        }
      } else if (newProgress.status === 'failed' || newProgress.status === 'cancelled') {
        setIsPolling(false)
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
        if (onError) {
          onError(newProgress.error || 'Unknown error')
        }
      }
    } catch (error) {
      console.error('Error fetching render progress:', error)
      if (!mountedRef.current) return
      
      setProgress(prev => prev ? {
        ...prev,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      } : null)
      
      setIsPolling(false)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [jobId, onComplete, onError])

  // Start polling when jobId changes
  useEffect(() => {
    mountedRef.current = true

    if (!jobId) {
      setProgress(null)
      setIsPolling(false)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    // Initial fetch
    setIsPolling(true)
    fetchProgress()

    // Start polling
    intervalRef.current = setInterval(fetchProgress, pollingInterval)

    return () => {
      mountedRef.current = false
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [jobId, pollingInterval, fetchProgress])

  return progress
}
