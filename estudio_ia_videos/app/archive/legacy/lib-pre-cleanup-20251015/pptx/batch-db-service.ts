/**
 * PPTX Batch Database Service
 * 
 * Gerencia a persistência de jobs de processamento em batch de arquivos PPTX
 * Integra o BatchPPTXProcessor com Prisma para rastreamento completo
 * 
 * @module lib/pptx/batch-db-service
 */

import { PrismaClient } from '@prisma/client'
import type {
  BatchProcessorOptions,
  PPTXProcessingResult,
  NarrationResult,
  AnimationConversionResult,
  LayoutAnalysisResult
} from './pptx-types'

const prisma = new PrismaClient()

// ============================================================================
// TYPES
// ============================================================================

export interface CreateBatchJobData {
  userId: string
  organizationId?: string
  batchName?: string
  totalFiles: number
  options?: BatchProcessorOptions
}

export interface CreateProcessingJobData {
  batchJobId?: string
  userId: string
  organizationId?: string
  filename: string
  originalSize: number
  fileUrl?: string
  projectId?: string
}

export interface UpdateProcessingJobData {
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  progress?: number
  phase?: 'upload' | 'extraction' | 'narration' | 'animation' | 'quality' | 'complete'
  slidesProcessed?: number
  totalSlides?: number
  duration?: number
  outputUrl?: string
  thumbnailUrl?: string
  narrationGenerated?: boolean
  animationsConverted?: boolean
  qualityAnalyzed?: boolean
  qualityScore?: number
  qualityIssues?: number
  qualityWarnings?: number
  qualityData?: LayoutAnalysisResult
  narrationData?: NarrationResult
  animationData?: AnimationConversionResult
  errorMessage?: string
  errorStack?: string
  processingTime?: number
  metadata?: any
}

// ============================================================================
// BATCH JOB OPERATIONS
// ============================================================================

export class PPTXBatchDBService {
  /**
   * Cria um novo batch job
   */
  static async createBatchJob(data: CreateBatchJobData) {
    return await prisma.pPTXBatchJob.create({
      data: {
        userId: data.userId,
        organizationId: data.organizationId,
        batchName: data.batchName,
        totalFiles: data.totalFiles,
        options: data.options as any,
        status: 'queued',
        progress: 0
      }
    })
  }

  /**
   * Atualiza status do batch job
   */
  static async updateBatchJob(
    batchJobId: string,
    updates: {
      status?: 'queued' | 'processing' | 'completed' | 'partial' | 'failed' | 'cancelled'
      progress?: number
      completed?: number
      failed?: number
      processing?: number
      totalSlides?: number
      totalDuration?: number
      processingTime?: number
    }
  ) {
    const updateData: any = {}

    if (updates.status) updateData.status = updates.status
    if (typeof updates.progress === 'number') updateData.progress = updates.progress
    if (typeof updates.completed === 'number') updateData.completed = updates.completed
    if (typeof updates.failed === 'number') updateData.failed = updates.failed
    if (typeof updates.processing === 'number') updateData.processing = updates.processing
    if (typeof updates.totalSlides === 'number') updateData.totalSlides = updates.totalSlides
    if (typeof updates.totalDuration === 'number') updateData.totalDuration = updates.totalDuration
    if (typeof updates.processingTime === 'number') updateData.processingTime = updates.processingTime

    // Auto-set timestamps
    if (updates.status === 'processing' && !updateData.startedAt) {
      updateData.startedAt = new Date()
    }
    if (['completed', 'partial', 'failed', 'cancelled'].includes(updates.status || '')) {
      updateData.completedAt = new Date()
    }

    return await prisma.pPTXBatchJob.update({
      where: { id: batchJobId },
      data: updateData
    })
  }

  /**
   * Obtém batch job por ID com jobs individuais
   */
  static async getBatchJobWithJobs(batchJobId: string) {
    return await prisma.pPTXBatchJob.findUnique({
      where: { id: batchJobId },
      include: {
        jobs: {
          orderBy: { createdAt: 'asc' }
        }
      }
    })
  }

  /**
   * Lista batch jobs do usuário
   */
  static async listUserBatchJobs(
    userId: string,
    options?: {
      organizationId?: string
      status?: string
      limit?: number
      offset?: number
    }
  ) {
    const where: any = { userId }

    if (options?.organizationId) where.organizationId = options.organizationId
    if (options?.status) where.status = options.status

    const [jobs, total] = await Promise.all([
      prisma.pPTXBatchJob.findMany({
        where,
        include: {
          jobs: {
            select: {
              id: true,
              filename: true,
              status: true,
              progress: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: options?.limit || 50,
        skip: options?.offset || 0
      }),
      prisma.pPTXBatchJob.count({ where })
    ])

    return { jobs, total }
  }

  /**
   * Cancela batch job e todos os jobs individuais
   */
  static async cancelBatchJob(batchJobId: string) {
    // Cancela todos os jobs pendentes/processing
    await prisma.pPTXProcessingJob.updateMany({
      where: {
        batchJobId,
        status: { in: ['pending', 'processing'] }
      },
      data: {
        status: 'cancelled',
        completedAt: new Date()
      }
    })

    // Atualiza batch job
    return await prisma.pPTXBatchJob.update({
      where: { id: batchJobId },
      data: {
        status: 'cancelled',
        completedAt: new Date()
      }
    })
  }

  // ==========================================================================
  // INDIVIDUAL PROCESSING JOB OPERATIONS
  // ==========================================================================

  /**
   * Cria job de processamento individual
   */
  static async createProcessingJob(data: CreateProcessingJobData) {
    return await prisma.pPTXProcessingJob.create({
      data: {
        batchJobId: data.batchJobId,
        userId: data.userId,
        organizationId: data.organizationId,
        filename: data.filename,
        originalSize: data.originalSize,
        fileUrl: data.fileUrl,
        projectId: data.projectId,
        status: 'pending',
        progress: 0,
        phase: 'upload'
      }
    })
  }

  /**
   * Atualiza job de processamento
   */
  static async updateProcessingJob(jobId: string, updates: UpdateProcessingJobData) {
    const updateData: any = { ...updates }

    // Auto-set timestamps
    if (updates.status === 'processing' && !updateData.startedAt) {
      updateData.startedAt = new Date()
    }
    if (['completed', 'failed', 'cancelled'].includes(updates.status || '')) {
      updateData.completedAt = new Date()
    }

    // Serialize complex objects
    if (updates.qualityData) updateData.qualityData = updates.qualityData as any
    if (updates.narrationData) updateData.narrationData = updates.narrationData as any
    if (updates.animationData) updateData.animationData = updates.animationData as any
    if (updates.metadata) updateData.metadata = updates.metadata as any

    return await prisma.pPTXProcessingJob.update({
      where: { id: jobId },
      data: updateData
    })
  }

  /**
   * Obtém job por ID
   */
  static async getProcessingJob(jobId: string) {
    return await prisma.pPTXProcessingJob.findUnique({
      where: { id: jobId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true
          }
        },
        batchJob: {
          select: {
            id: true,
            batchName: true,
            status: true
          }
        }
      }
    })
  }

  /**
   * Lista jobs de processamento por batch
   */
  static async listBatchProcessingJobs(batchJobId: string) {
    return await prisma.pPTXProcessingJob.findMany({
      where: { batchJobId },
      orderBy: { createdAt: 'asc' }
    })
  }

  /**
   * Registra erro e incrementa tentativas
   */
  static async recordJobError(
    jobId: string,
    errorMessage: string,
    errorStack?: string
  ) {
    const job = await prisma.pPTXProcessingJob.findUnique({
      where: { id: jobId }
    })

    if (!job) throw new Error(`Job ${jobId} not found`)

    const newAttempts = job.attempts + 1
    const shouldRetry = newAttempts < job.maxAttempts

    return await prisma.pPTXProcessingJob.update({
      where: { id: jobId },
      data: {
        status: shouldRetry ? 'pending' : 'failed',
        errorMessage,
        errorStack,
        attempts: newAttempts,
        retryAfter: shouldRetry ? new Date(Date.now() + 60000 * newAttempts) : null,
        completedAt: shouldRetry ? null : new Date()
      }
    })
  }

  /**
   * Marca job como completo com resultados
   */
  static async completeProcessingJob(
    jobId: string,
    result: PPTXProcessingResult,
    additionalData?: {
      narrationData?: NarrationResult
      animationData?: AnimationConversionResult
      qualityData?: LayoutAnalysisResult
    }
  ) {
    return await this.updateProcessingJob(jobId, {
      status: 'completed',
      progress: 100,
      phase: 'complete',
      slidesProcessed: result.totalSlides,
      totalSlides: result.totalSlides,
      duration: result.totalDuration,
      outputUrl: result.projectId,
      narrationGenerated: !!additionalData?.narrationData,
      animationsConverted: !!additionalData?.animationData,
      qualityAnalyzed: !!additionalData?.qualityData,
      qualityScore: additionalData?.qualityData?.score,
      qualityIssues: additionalData?.qualityData?.errors || 0,
      qualityWarnings: additionalData?.qualityData?.warnings || 0,
      qualityData: additionalData?.qualityData,
      narrationData: additionalData?.narrationData,
      animationData: additionalData?.animationData,
      processingTime: result.processingTime
    })
  }

  // ==========================================================================
  // BATCH STATISTICS & MONITORING
  // ==========================================================================

  /**
   * Obtém estatísticas do batch job
   */
  static async getBatchStatistics(batchJobId: string) {
    const [batchJob, jobStats] = await Promise.all([
      prisma.pPTXBatchJob.findUnique({
        where: { id: batchJobId }
      }),
      prisma.pPTXProcessingJob.groupBy({
        by: ['status'],
        where: { batchJobId },
        _count: true,
        _sum: {
          totalSlides: true,
          duration: true,
          processingTime: true
        },
        _avg: {
          progress: true,
          qualityScore: true
        }
      })
    ])

    if (!batchJob) throw new Error(`Batch job ${batchJobId} not found`)

    const stats = jobStats.reduce((acc, stat) => {
      acc[stat.status] = {
        count: stat._count,
        totalSlides: stat._sum.totalSlides || 0,
        totalDuration: stat._sum.duration || 0,
        totalProcessingTime: stat._sum.processingTime || 0,
        avgProgress: stat._avg.progress || 0,
        avgQualityScore: stat._avg.qualityScore || 0
      }
      return acc
    }, {} as Record<string, unknown>)

    return {
      batchJob,
      statistics: stats,
      summary: {
        total: batchJob.totalFiles,
        completed: batchJob.completed,
        failed: batchJob.failed,
        processing: batchJob.processing,
        pending: batchJob.totalFiles - batchJob.completed - batchJob.failed - batchJob.processing
      }
    }
  }

  /**
   * Obtém progresso em tempo real do batch
   */
  static async getBatchProgress(batchJobId: string) {
    const dbJobs = await prisma.pPTXProcessingJob.findMany({
      where: { batchJobId },
      select: {
        id: true,
        filename: true,
        originalSize: true,
        status: true,
        progress: true,
        phase: true,
        errorMessage: true,
        projectId: true,
        totalSlides: true,
        duration: true,
        thumbnailUrl: true,
        narrationGenerated: true
      }
    })

    const jobs = dbJobs.map(job => ({
      id: job.id,
      filename: job.filename,
      fileSize: job.originalSize ?? 0,
      status: job.status,
      progress: job.progress ?? 0,
      phase: job.phase ?? undefined,
      error: job.errorMessage ?? undefined,
      result: job.status === 'completed'
        ? {
            projectId: job.projectId ?? undefined,
            slideCount: job.totalSlides ?? 0,
            duration: job.duration ?? 0,
            thumbnailUrl: job.thumbnailUrl ?? undefined,
            narrationGenerated: job.narrationGenerated ?? false
          }
        : null
    }))

    const totalProgress = jobs.reduce((sum, job) => sum + (job.progress ?? 0), 0)
    const avgProgress = jobs.length > 0 ? Math.round(totalProgress / jobs.length) : 0

    const processingStatuses = new Set(['processing', 'uploading', 'generating-narration'])

    return {
      jobs,
      overallProgress: avgProgress,
      summary: {
        total: jobs.length,
        completed: jobs.filter(j => j.status === 'completed').length,
        processing: jobs.filter(j => processingStatuses.has(String(j.status))).length,
        failed: jobs.filter(j => j.status === 'failed').length,
        pending: jobs.filter(j => j.status === 'pending').length
      }
    }
  }

  /**
   * Cleanup de jobs antigos (older than X days)
   */
  static async cleanupOldJobs(daysOld: number = 30) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    const deleted = await prisma.pPTXBatchJob.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        status: { in: ['completed', 'failed', 'cancelled'] }
      }
    })

    return deleted.count
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Converte result do BatchProcessor para formato do DB
 */
export function convertBatchResultToDB(
  result: any,
  batchJobId: string
): UpdateProcessingJobData {
  return {
    status: result.status === 'completed' ? 'completed' : 'failed',
    progress: result.progress,
    slidesProcessed: result.totalSlides,
    totalSlides: result.totalSlides,
    duration: result.duration,
    outputUrl: result.projectId,
    thumbnailUrl: result.thumbnailUrl,
    errorMessage: result.errorMessage,
    processingTime: result.processingTime
  }
}

/**
 * Exporta todas as funções principais
 */
export default PPTXBatchDBService
