import { randomUUID } from 'crypto'
import type { Prisma, VideoExport as VideoExportRecord } from '@prisma/client'

import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'

export type VideoExportFormat = 'mp4' | 'webm' | 'mov'
export type VideoExportQuality = 'sd' | 'hd' | 'fhd' | '4k'
export type VideoExportCodec = 'h264' | 'h265' | 'vp9' | 'av1'
export type VideoExportPreset =
  | 'ultrafast'
  | 'superfast'
  | 'veryfast'
  | 'faster'
  | 'fast'
  | 'medium'
  | 'slow'
  | 'slower'
  | 'veryslow'
  | 'good'
  | 'best'

export type VideoExportOptions = {
  format: VideoExportFormat
  quality: VideoExportQuality
  fps: 24 | 30 | 60
  codec: VideoExportCodec
  includeAudio: boolean
  bitrate?: string
  preset?: VideoExportPreset
}

export type ExportPriority = 'low' | 'normal' | 'high' | 'urgent'

export interface ExportContext {
  userId?: string
  requestId?: string
  priority?: ExportPriority
  trigger?: 'manual' | 'automation' | 'retry'
}

export type VideoExportStatus = 'queued' | 'processing' | 'completed' | 'error' | 'cancelled'

export interface VideoExportJob {
  id: string
  projectId: string
  status: VideoExportStatus
  progress: number
  outputUrl: string | null
  error: string | null
  startedAt: Date | null
  completedAt: Date | null
  metadata: Record<string, unknown>
}

export interface ExportProjectVideoResult {
  success: boolean
  jobId?: string
  error?: string
  queuedAt?: Date
  estimatedCompletionMinutes?: number
  queuePriority?: number
}

const QUALITY_TO_RESOLUTION: Record<VideoExportQuality, string> = {
  sd: '1280x720',
  hd: '1920x1080',
  fhd: '1920x1080',
  '4k': '3840x2160'
}

const PRIORITY_SCORE: Record<ExportPriority, number> = {
  low: 3,
  normal: 5,
  high: 8,
  urgent: 10
}

const QUALITY_FACTOR: Record<VideoExportQuality, number> = {
  sd: 0.8,
  hd: 1,
  fhd: 1.2,
  '4k': 1.6
}

const CODEC_FACTOR: Record<VideoExportCodec, number> = {
  h264: 1,
  h265: 1.1,
  vp9: 1.25,
  av1: 1.4
}

const TERMINAL_STATUSES = new Set<VideoExportStatus>(['completed', 'error', 'cancelled'])

export async function exportProjectVideo(
  projectId: string,
  options: VideoExportOptions,
  context?: ExportContext
): Promise<ExportProjectVideoResult> {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, userId: true, totalSlides: true, duration: true, status: true }
    })

    if (!project) {
      logger.warn('video-export: project not found', { projectId })
      return { success: false, error: 'Projeto não encontrado' }
    }

    const now = new Date()
    const jobId = randomUUID()
    const requestId = context?.requestId ?? jobId
    const queuePriority = resolvePriority(context?.priority, project.status)
    const resolution = QUALITY_TO_RESOLUTION[options.quality] ?? QUALITY_TO_RESOLUTION.hd
    const serializableOptions = serializeOptions(options)

    const processingLog: Prisma.JsonObject = {
      startedAt: now.toISOString(),
      trigger: context?.trigger ?? 'manual',
      requestId,
      options: serializableOptions,
      events: [
        {
          at: now.toISOString(),
          status: 'queued',
          message: 'Job registrado na fila de exportação',
          progress: 0
        }
      ]
    }

    await prisma.$transaction(async (tx) => {
      await tx.videoExport.create({
        data: {
          id: jobId,
          projectId,
          userId: context?.userId ?? project.userId,
          format: options.format,
          quality: options.quality,
          resolution,
          fps: options.fps,
          status: 'queued',
          progress: 0,
          processingLog,
          updatedAt: now
        }
      })

      const queuePayload: Prisma.JsonObject = {
        videoExportId: jobId,
        projectId,
        options: serializableOptions,
        trigger: context?.trigger ?? 'manual',
        requestId
      }

      await tx.processingQueue.create({
        data: {
          id: randomUUID(),
          jobType: 'video_export',
          jobData: queuePayload,
          status: 'pending',
          priority: queuePriority,
          scheduledFor: now,
          progress: 0,
          currentStep: 'waiting_worker',
          maxAttempts: 3,
          createdAt: now,
          updatedAt: now
        }
      })
    })

    const estimatedCompletionMinutes = estimateExportDurationMinutes(
      project.totalSlides ?? 0,
      project.duration ?? 0,
      options
    )

    logger.info('video-export: job enqueued', { jobId, projectId, queuePriority })

    return {
      success: true,
      jobId,
      queuedAt: now,
      estimatedCompletionMinutes,
      queuePriority
    }
  } catch (error) {
    logger.error('video-export: failed to enqueue job', error instanceof Error ? error : new Error(String(error)), {
      projectId
    })

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao iniciar exportação'
    }
  }
}

export async function getExportJobStatus(
  jobId: string
): Promise<{ job?: VideoExportJob; error?: string }> {
  try {
    const jobRecord = await prisma.videoExport.findUnique({ where: { id: jobId } })

    if (!jobRecord) {
      return { error: 'Job não encontrado' }
    }

    const job = mapRecordToJob(jobRecord)
    return { job }
  } catch (error) {
    logger.error('video-export: failed to load status', error instanceof Error ? error : new Error(String(error)), {
      jobId
    })
    return { error: 'Erro ao consultar job' }
  }
}

function resolvePriority(priority: ExportPriority | undefined, projectStatus?: string | null): number {
  if (priority) return PRIORITY_SCORE[priority]
  if (projectStatus && projectStatus.toUpperCase() === 'APPROVED') {
    return PRIORITY_SCORE.high
  }
  return PRIORITY_SCORE.normal
}

function serializeOptions(options: VideoExportOptions): Prisma.JsonObject {
  const payload: Prisma.JsonObject = {
    format: options.format,
    quality: options.quality,
    fps: options.fps,
    codec: options.codec,
    includeAudio: options.includeAudio
  }

  if (options.bitrate) {
    payload.bitrate = options.bitrate
  }

  if (options.preset) {
    payload.preset = options.preset
  }

  return payload
}

function estimateExportDurationMinutes(
  totalSlides: number,
  projectDurationSeconds: number,
  options: VideoExportOptions
): number {
  const baseSeconds = projectDurationSeconds > 0 ? projectDurationSeconds : Math.max(totalSlides * 8, 60)
  const fpsFactor = options.fps === 60 ? 1.2 : options.fps === 24 ? 0.9 : 1
  const audioFactor = options.includeAudio ? 1.05 : 0.9
  const estimated = baseSeconds * QUALITY_FACTOR[options.quality] * CODEC_FACTOR[options.codec] * fpsFactor * audioFactor
  return Math.max(2, Math.round(estimated / 60))
}

function mapRecordToJob(record: VideoExportRecord): VideoExportJob {
  const log = asJsonObject(record.processingLog)
  const options = asJsonObject(log?.options)
  const startedAt = extractTimestamp(log, 'startedAt') ?? record.createdAt
  const completedAt = TERMINAL_STATUSES.has(normalizeStatus(record.status))
    ? extractTimestamp(log, 'completedAt') ?? record.updatedAt
    : null

  return {
    id: record.id,
    projectId: record.projectId,
    status: normalizeStatus(record.status),
    progress: record.progress ?? 0,
    outputUrl: record.videoUrl ?? record.fileUrl ?? null,
    error: record.errorMessage ?? null,
    startedAt,
    completedAt,
    metadata: buildMetadata(record, options, log)
  }
}

function normalizeStatus(status: string): VideoExportStatus {
  const normalized = status.toLowerCase()

  if (['pending', 'queued', 'waiting'].includes(normalized)) return 'queued'
  if (['processing', 'running', 'rendering'].includes(normalized)) return 'processing'
  if (['completed', 'done', 'finished', 'success'].includes(normalized)) return 'completed'
  if (['failed', 'error'].includes(normalized)) return 'error'
  if (['cancelled', 'canceled', 'aborted'].includes(normalized)) return 'cancelled'
  return 'processing'
}

function extractTimestamp(log: Prisma.JsonObject | null, key: 'startedAt' | 'completedAt'): Date | null {
  if (!log) return null
  const raw = log[key]
  if (typeof raw === 'string') {
    const parsed = new Date(raw)
    if (!Number.isNaN(parsed.getTime())) return parsed
  }

  const eventsRaw = log.events
  const events = Array.isArray(eventsRaw) ? (eventsRaw as Array<Record<string, unknown>>) : []
  const target = key === 'startedAt' ? 'processing' : 'completed'
  const found = events.find((event) => event.status === target && typeof event.at === 'string')

  if (found && typeof found.at === 'string') {
    const parsed = new Date(found.at)
    if (!Number.isNaN(parsed.getTime())) return parsed
  }

  return null
}

function asJsonObject(value: Prisma.JsonValue | null | undefined): Prisma.JsonObject | null {
  if (!value) return null
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Prisma.JsonObject
  }
  return null
}

function buildMetadata(
  record: VideoExportRecord,
  options: Prisma.JsonObject | null,
  log: Prisma.JsonObject | null
): Record<string, unknown> {
  const fileSize = typeof record.fileSize === 'bigint' ? Number(record.fileSize) : record.fileSize
  const includeAudioValue = typeof options?.includeAudio === 'boolean' ? options?.includeAudio : true
  const codecValue = typeof options?.codec === 'string' ? (options?.codec as string) : record.format
  const presetValue = typeof options?.preset === 'string' ? (options?.preset as string) : null
  const bitrateValue = typeof options?.bitrate === 'string' ? (options?.bitrate as string) : null

  const metadata: Record<string, unknown> = {
    format: record.format,
    quality: record.quality,
    resolution: record.resolution,
    fps: record.fps,
    duration: record.duration ?? null,
    fileName: record.fileName ?? null,
    fileSize: fileSize ?? null,
    includeAudio: includeAudioValue,
    codec: codecValue,
    preset: presetValue,
    bitrate: bitrateValue,
    updatedAt: record.updatedAt,
    options,
    processingLog: log,
    outputUrl: record.videoUrl ?? record.fileUrl ?? null
  }

  return metadata
}
