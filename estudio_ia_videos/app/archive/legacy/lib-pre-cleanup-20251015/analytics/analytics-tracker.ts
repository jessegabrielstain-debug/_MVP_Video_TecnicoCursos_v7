
/**
 * 📊 Analytics Tracker - Real Event Tracking
 * Sprint 42 - Implementação real de tracking de eventos
 */

import { prisma } from '@/lib/prisma'

export interface AnalyticsEventData {
  category: 'pptx' | 'tts' | 'render' | 'timeline' | 'collaboration' | 'authentication' | 'other'
  action: string
  label?: string
  organizationId?: string
  userId?: string
  sessionId?: string
  projectId?: string
  templateId?: string
  provider?: string
  duration?: number
  fileSize?: number
  status?: 'success' | 'error' | 'pending'
  errorCode?: string
  errorMessage?: string
  metadata?: Record<string, unknown>
}

export class AnalyticsTracker {
  /**
   * Track a single event
   */
  static async track(eventData: AnalyticsEventData): Promise<void> {
    try {
      await prisma.analyticsEvent.create({
        data: {
          category: eventData.category,
          action: eventData.action,
          label: eventData.label,
          organizationId: eventData.organizationId,
          userId: eventData.userId,
          sessionId: eventData.sessionId,
          projectId: eventData.projectId,
          templateId: eventData.templateId,
          provider: eventData.provider,
          duration: eventData.duration,
          fileSize: eventData.fileSize,
          status: eventData.status || 'success',
          errorCode: eventData.errorCode,
          errorMessage: eventData.errorMessage,
          metadata: eventData.metadata as any,
        },
      })
    } catch (error) {
      console.error('❌ Failed to track analytics event:', error)
      // Não throw para não quebrar o fluxo principal
    }
  }

  /**
   * Track PPTX upload
   */
  static async trackPPTXUpload(data: {
    userId: string
    organizationId?: string
    projectId: string
    fileSize: number
    fileName: string
    duration: number
  }): Promise<void> {
    await this.track({
      category: 'pptx',
      action: 'upload',
      label: data.fileName,
      userId: data.userId,
      organizationId: data.organizationId,
      projectId: data.projectId,
      fileSize: data.fileSize,
      duration: data.duration,
      status: 'success',
    })
  }

  /**
   * Track TTS generation
   */
  static async trackTTSGeneration(data: {
    userId: string
    organizationId?: string
    projectId?: string
    provider: 'elevenlabs' | 'azure' | 'google'
    voiceId: string
    textLength: number
    audioLength: number
    duration: number
    success: boolean
    errorMessage?: string
  }): Promise<void> {
    await this.track({
      category: 'tts',
      action: 'generate',
      label: data.voiceId,
      userId: data.userId,
      organizationId: data.organizationId,
      projectId: data.projectId,
      provider: data.provider,
      duration: data.duration,
      status: data.success ? 'success' : 'error',
      errorMessage: data.errorMessage,
      metadata: {
        textLength: data.textLength,
        audioLength: data.audioLength,
      },
    })
  }

  /**
   * Track video render
   */
  static async trackVideoRender(data: {
    userId: string
    organizationId?: string
    projectId: string
    duration: number
    fileSize?: number
    resolution: string
    fps: number
    success: boolean
    errorMessage?: string
  }): Promise<void> {
    await this.track({
      category: 'render',
      action: 'video_render',
      userId: data.userId,
      organizationId: data.organizationId,
      projectId: data.projectId,
      duration: data.duration,
      fileSize: data.fileSize,
      status: data.success ? 'success' : 'error',
      errorMessage: data.errorMessage,
      metadata: {
        resolution: data.resolution,
        fps: data.fps,
      },
    })
  }

  /**
   * Track timeline edit
   */
  static async trackTimelineEdit(data: {
    userId: string
    organizationId?: string
    projectId: string
    action: 'create' | 'update' | 'delete'
    trackCount: number
    totalDuration: number
  }): Promise<void> {
    await this.track({
      category: 'timeline',
      action: data.action,
      userId: data.userId,
      organizationId: data.organizationId,
      projectId: data.projectId,
      metadata: {
        trackCount: data.trackCount,
        totalDuration: data.totalDuration,
      },
    })
  }

  /**
   * Track collaboration event
   */
  static async trackCollaboration(data: {
    userId: string
    organizationId?: string
    projectId: string
    action: 'join' | 'leave' | 'edit' | 'comment' | 'lock' | 'unlock'
    sessionId?: string
  }): Promise<void> {
    await this.track({
      category: 'collaboration',
      action: data.action,
      userId: data.userId,
      organizationId: data.organizationId,
      projectId: data.projectId,
      sessionId: data.sessionId,
    })
  }

  /**
   * Track authentication
   */
  static async trackAuth(data: {
    userId?: string
    action: 'login' | 'logout' | 'signup' | 'login_failed'
    provider?: string
    errorMessage?: string
  }): Promise<void> {
    await this.track({
      category: 'authentication',
      action: data.action,
      userId: data.userId,
      provider: data.provider,
      status: data.errorMessage ? 'error' : 'success',
      errorMessage: data.errorMessage,
    })
  }

  /**
   * Get analytics summary for a date range
   */
  static async getSummary(params: {
    organizationId?: string
    userId?: string
    startDate: Date
    endDate: Date
  }) {
    const where = {
      createdAt: {
        gte: params.startDate,
        lte: params.endDate,
      },
      ...(params.organizationId && { organizationId: params.organizationId }),
      ...(params.userId && { userId: params.userId }),
    }

    const [
      pptxUploads,
      ttsGenerations,
      renderJobs,
      totalEvents,
      errorCount,
      avgDuration,
    ] = await Promise.all([
      // PPTX uploads
      prisma.analyticsEvent.count({
        where: { ...where, category: 'pptx', action: 'upload' },
      }),
      // TTS generations
      prisma.analyticsEvent.count({
        where: { ...where, category: 'tts', action: 'generate' },
      }),
      // Render jobs
      prisma.analyticsEvent.count({
        where: { ...where, category: 'render', action: 'video_render' },
      }),
      // Total events
      prisma.analyticsEvent.count({ where }),
      // Error count
      prisma.analyticsEvent.count({
        where: { ...where, status: 'error' },
      }),
      // Average duration
      prisma.analyticsEvent.aggregate({
        where: { ...where, duration: { not: null } },
        _avg: { duration: true },
      }),
    ])

    return {
      pptxUploads,
      ttsGenerations,
      renderJobs,
      totalEvents,
      errorCount,
      avgDuration: avgDuration._avg.duration || 0,
      errorRate: totalEvents > 0 ? (errorCount / totalEvents) * 100 : 0,
    }
  }

  /**
   * Get funnel analysis
   */
  static async getFunnelAnalysis(params: {
    organizationId?: string
    startDate: Date
    endDate: Date
  }) {
    const where = {
      createdAt: {
        gte: params.startDate,
        lte: params.endDate,
      },
      ...(params.organizationId && { organizationId: params.organizationId }),
    }

    const [uploads, edits, ttsGens, renders, downloads] = await Promise.all([
      prisma.analyticsEvent.count({
        where: { ...where, category: 'pptx', action: 'upload' },
      }),
      prisma.analyticsEvent.count({
        where: { ...where, category: 'timeline', action: 'update' },
      }),
      prisma.analyticsEvent.count({
        where: { ...where, category: 'tts', action: 'generate' },
      }),
      prisma.analyticsEvent.count({
        where: { ...where, category: 'render', action: 'video_render' },
      }),
      prisma.analyticsEvent.count({
        where: { ...where, category: 'render', action: 'download' },
      }),
    ])

    return {
      funnel: {
        pptx_uploads: uploads,
        editing_sessions: edits,
        tts_generations: ttsGens,
        render_jobs: renders,
        downloads,
      },
      conversionRates: {
        upload_to_edit: uploads > 0 ? (edits / uploads) * 100 : 0,
        edit_to_tts: edits > 0 ? (ttsGens / edits) * 100 : 0,
        tts_to_render: ttsGens > 0 ? (renders / ttsGens) * 100 : 0,
        render_to_download: renders > 0 ? (downloads / renders) * 100 : 0,
        overall: uploads > 0 ? (downloads / uploads) * 100 : 0,
      },
    }
  }

  /**
   * Get provider performance
   */
  static async getProviderPerformance(params: {
    category: 'tts' | 'render'
    organizationId?: string
    startDate: Date
    endDate: Date
  }) {
    const where = {
      category: params.category,
      createdAt: {
        gte: params.startDate,
        lte: params.endDate,
      },
      ...(params.organizationId && { organizationId: params.organizationId }),
    }

    const events = await prisma.analyticsEvent.groupBy({
      by: ['provider'],
      where: {
        ...where,
        provider: { not: null },
      },
      _count: true,
      _avg: {
        duration: true,
      },
    })

    const errorsByProvider = await prisma.analyticsEvent.groupBy({
      by: ['provider'],
      where: {
        ...where,
        provider: { not: null },
        status: 'error',
      },
      _count: true,
    })

    const errorMap = new Map(errorsByProvider.map((e: any) => [e.provider, e._count]))

    return events.map((event) => ({
      provider: event.provider || 'unknown',
      totalRequests: event._count,
      avgDuration: event._avg.duration || 0,
      errorCount: errorMap.get(event.provider) || 0,
      errorRate:
        event._count > 0
          ? ((errorMap.get(event.provider) || 0) / event._count) * 100
          : 0,
    }))
  }
}

export default AnalyticsTracker
