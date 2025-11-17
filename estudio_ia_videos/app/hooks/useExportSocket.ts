/**
 * useExportSocket Hook
 * React hook para monitorar progresso de exportação via WebSocket
 */

import { useEffect, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import {
  ExportFormat,
  ExportProgress,
  ExportQuality,
  ExportResolution,
  ExportSettings,
  ExportStatus,
  ExportJob,
  TimelineData,
} from '@/types/export.types'

export interface ExportCompletePayload {
  jobId: string
  outputUrl: string
  fileSize?: number
  duration?: number
}

export interface ExportFailedPayload {
  jobId: string
  error: string
}

export interface ExportCancelledPayload {
  jobId: string
}

export type ExportTimelineData = TimelineData | null | undefined

interface StartExportResponse {
  jobId: string
}

export interface ExportSocketCallbacks {
  onProgress?: (progress: ExportProgress) => void
  onComplete?: (data: ExportCompletePayload) => void
  onFailed?: (data: ExportFailedPayload) => void
  onCancelled?: (data: ExportCancelledPayload) => void
}

export function useExportSocket(userId: string | null, callbacks?: ExportSocketCallbacks) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [currentProgress, setCurrentProgress] = useState<ExportProgress | null>(null)

  // Conectar ao WebSocket
  useEffect(() => {
    if (!userId) return

    const socketInstance = io(process.env.NEXT_PUBLIC_WS_URL || '', {
      path: '/api/socketio',
      transports: ['websocket', 'polling'],
    })

    socketInstance.on('connect', () => {
      console.log('[useExportSocket] Connected')
      setIsConnected(true)
      
      // Join user room
      socketInstance.emit('export:join_user', { userId })
    })

    socketInstance.on('disconnect', () => {
      console.log('[useExportSocket] Disconnected')
      setIsConnected(false)
    })

    // Evento: Progresso
    socketInstance.on('export:progress', (progress: ExportProgress) => {
      console.log('[useExportSocket] Progress:', progress.progress)
      setCurrentProgress(progress)
      callbacks?.onProgress?.(progress)
    })

    // Evento: Completo
    socketInstance.on('export:complete', (payload: unknown) => {
      if (!isExportCompletePayload(payload)) {
        console.warn('[useExportSocket] Ignoring invalid export:complete payload', payload)
        return
      }

      console.log('[useExportSocket] Export complete:', payload.jobId)
      setCurrentProgress(null)
      callbacks?.onComplete?.(payload)
    })

    // Evento: Falha
    socketInstance.on('export:failed', (payload: unknown) => {
      if (!isExportFailedPayload(payload)) {
        console.warn('[useExportSocket] Ignoring invalid export:failed payload', payload)
        return
      }

      console.log('[useExportSocket] Export failed:', payload.jobId, payload.error)
      setCurrentProgress(null)
      callbacks?.onFailed?.(payload)
    })

    // Evento: Cancelado
    socketInstance.on('export:cancelled', (payload: unknown) => {
      if (!isExportCancelledPayload(payload)) {
        console.warn('[useExportSocket] Ignoring invalid export:cancelled payload', payload)
        return
      }

      console.log('[useExportSocket] Export cancelled:', payload.jobId)
      setCurrentProgress(null)
      callbacks?.onCancelled?.(payload)
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [userId])

  // Iniciar exportação
  const startExport = useCallback(async (
    projectId: string,
    timelineId: string,
    settings: ExportSettings,
    timelineData?: ExportTimelineData
  ) => {
    if (!userId) {
      throw new Error('User ID is required')
    }

    const response = await fetch('/api/v1/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        projectId,
        timelineId,
        settings,
        timelineData,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to start export')
    }

    const data = (await response.json()) as unknown
    if (!isStartExportResponse(data)) {
      throw new Error('Invalid response from export API')
    }

    return data.jobId
  }, [userId])

  // Cancelar exportação
  const cancelExport = useCallback(async (jobId: string) => {
    const response = await fetch(`/api/v1/export/${jobId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error('Failed to cancel export')
    }

    // The backend typically returns a JSON acknowledgement, but callers do not rely on it.
    // Consume the body to avoid dangling promises without exposing an untyped payload.
    try {
      await response.json()
    } catch (error) {
      console.warn('[useExportSocket] Unable to parse cancel response payload:', error)
    }
  }, [])

  // Obter status do job
  const getJobStatus = useCallback(async (jobId: string): Promise<ExportJob> => {
    const response = await fetch(`/api/v1/export/${jobId}`)

    if (!response.ok) {
      throw new Error('Failed to get job status')
    }

    const payload = (await response.json()) as unknown
    if (!isExportJobResponse(payload)) {
      throw new Error('Invalid job status response')
    }

    return deserializeExportJob(payload.job)
  }, [])

  return {
    socket,
    isConnected,
    currentProgress,
    startExport,
    cancelExport,
    getJobStatus,
  }
}

const isExportCompletePayload = (value: unknown): value is ExportCompletePayload => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const record = value as Record<string, unknown>
  return typeof record.jobId === 'string' && typeof record.outputUrl === 'string'
}

const isExportFailedPayload = (value: unknown): value is ExportFailedPayload => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const record = value as Record<string, unknown>
  return typeof record.jobId === 'string' && typeof record.error === 'string'
}

const isExportCancelledPayload = (value: unknown): value is ExportCancelledPayload => {
  if (!value || typeof value !== 'object') {
    return false
  }

  return typeof (value as Record<string, unknown>).jobId === 'string'
}

const isStartExportResponse = (value: unknown): value is StartExportResponse => {
  if (!value || typeof value !== 'object') {
    return false
  }

  return typeof (value as Record<string, unknown>).jobId === 'string'
}

interface ExportJobResponseShape {
  job: unknown
}

const isExportJobResponse = (value: unknown): value is ExportJobResponseShape => {
  if (!value || typeof value !== 'object') {
    return false
  }

  return 'job' in value
}

const isExportStatus = (value: unknown): value is ExportStatus => {
  return Object.values(ExportStatus).includes(value as ExportStatus)
}

const isExportSettings = (value: unknown): value is ExportSettings => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const record = value as Record<string, unknown>
  return (
    Object.values(ExportFormat).includes(record.format as ExportFormat) &&
    Object.values(ExportResolution).includes(record.resolution as ExportResolution) &&
    Object.values(ExportQuality).includes(record.quality as ExportQuality)
  )
}

const parseDate = (input: unknown): Date | undefined => {
  if (!input) {
    return undefined
  }

  if (input instanceof Date) {
    return input
  }

  if (typeof input === 'string' || typeof input === 'number') {
    const candidate = new Date(input)
    if (!Number.isNaN(candidate.getTime())) {
      return candidate
    }
  }

  return undefined
}

const toNumber = (input: unknown): number | undefined => {
  if (typeof input === 'number') {
    return Number.isFinite(input) ? input : undefined
  }

  if (typeof input === 'string') {
    const parsed = Number(input)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  return undefined
}

const deserializeExportJob = (value: unknown): ExportJob => {
  if (!value || typeof value !== 'object') {
    throw new Error('Invalid export job payload')
  }

  const record = value as Record<string, unknown>
  const id = typeof record.id === 'string' ? record.id : ''

  if (!id) {
    throw new Error('Export job payload is missing an id')
  }

  const settings = isExportSettings(record.settings)
    ? (record.settings as ExportSettings)
    : {
        format: ExportFormat.MP4,
        resolution: ExportResolution.FULL_HD_1080,
        quality: ExportQuality.MEDIUM,
      }

  const status = isExportStatus(record.status) ? (record.status as ExportStatus) : ExportStatus.PENDING

  return {
    id,
    userId: typeof record.userId === 'string' ? record.userId : 'unknown-user',
    projectId: typeof record.projectId === 'string' ? record.projectId : 'unknown-project',
    timelineId: typeof record.timelineId === 'string' ? record.timelineId : 'unknown-timeline',
    status,
    settings,
    progress: toNumber(record.progress) ?? 0,
    outputUrl: typeof record.outputUrl === 'string' ? record.outputUrl : undefined,
    outputPath: typeof record.outputPath === 'string' ? record.outputPath : undefined,
    fileSize: toNumber(record.fileSize),
    duration: toNumber(record.duration),
    error: typeof record.error === 'string' ? record.error : undefined,
    createdAt: parseDate(record.createdAt) ?? new Date(),
    startedAt: parseDate(record.startedAt ?? record.started_at ?? null),
    completedAt: parseDate(record.completedAt ?? record.completed_at ?? null),
    estimatedTimeRemaining: toNumber(record.estimatedTimeRemaining ?? record.estimated_time_remaining),
  }
}
