"use server";

/**
 * 🚀 PPTX Upload API
 * Recebe arquivos de apresentação, salva em disco (ou S3 futuramente),
 * extrai metadados reais e inicializa um projeto completo no banco.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRateLimiter, rateLimitPresets } from '@/lib/utils/rate-limit-middleware'
import { getServerSession } from 'next-auth'
import { randomUUID } from 'crypto'
import path from 'path'
import { promises as fs } from 'fs'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PPTXProcessor } from '@/lib/pptx/pptx-processor'
import { createStorage } from '@/lib/storage'
import { captureError } from '@/lib/observability'
import { incUploadRequest, incUploadError } from '@/lib/metrics'
import { logger } from '@/lib/logger'

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024 // 50MB
const ALLOWED_EXTENSIONS = ['.pptx', '.ppt', '.odp']
const DEMO_EMAIL = 'demo@estudio-ia.com'

type UploadError = {
  code: string
  message: string
  status: number
}

function buildErrorResponse(error: UploadError) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: error.code,
        message: error.message
      }
    },
    { status: error.status }
  )
}

async function ensureDemoUser() {
  const existingDemo = await prisma.user.findUnique({
    where: { email: DEMO_EMAIL }
  })

  if (existingDemo) {
    return existingDemo
  }

  return prisma.user.create({
    data: {
      email: DEMO_EMAIL,
      name: 'Usuário Demo'
    }
  })
}

function sanitizeFileName(name: string) {
  return name
    .normalize('NFKD')
    .replace(/[^\w.\- ]/g, '_')
    .replace(/\s+/g, '_')
}

const rateLimiterUpload = createRateLimiter(rateLimitPresets.upload)
export async function POST(request: NextRequest) {
  return rateLimiterUpload(request, async (request: NextRequest) => {
  try {
    incUploadRequest()
    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return buildErrorResponse({
        code: 'NO_FILE',
        message: 'Nenhum arquivo foi enviado.',
        status: 400
      })
    }

    if (file.size === 0) {
      return buildErrorResponse({
        code: 'EMPTY_FILE',
        message: 'O arquivo enviado está vazio.',
        status: 400
      })
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return buildErrorResponse({
        code: 'FILE_TOO_LARGE',
        message: `O arquivo excede o limite de ${(MAX_FILE_SIZE_BYTES / (1024 * 1024)).toFixed(0)}MB.`,
        status: 413
      })
    }

    const originalFileName = file.name || 'presentation.pptx'
    const extension = path.extname(originalFileName).toLowerCase()

    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return buildErrorResponse({
        code: 'INVALID_EXTENSION',
        message: 'Formato não suportado. Utilize arquivos PPTX, PPT ou ODP.',
        status: 415
      })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    const pptxProcessor = new PPTXProcessor()
    const parsed = await pptxProcessor.parse(buffer)

    const safeFileName = `${Date.now()}-${sanitizeFileName(originalFileName)}`
    const storage = createStorage()
    async function saveWithRetry() {
      let attempt = 0
      const max = 3
      while (attempt < max) {
        try {
          const result = await storage.saveFile(
            buffer,
            `pptx/${safeFileName}`,
            'application/vnd.openxmlformats-officedocument.presentationml.presentation'
          )
          return result
        } catch (e) {
          attempt++
          if (attempt >= max) throw e
          await new Promise(r => setTimeout(r, 500 * Math.pow(2, attempt - 1)))
        }
      }
      throw new Error('saveWithRetry failed')
    }
    const { url: publicUrl } = await saveWithRetry()

    const session = await getServerSession(authOptions).catch(() => null)
    let userId = session?.user?.id ?? (formData.get('userId') as string | null) ?? undefined

    let userRecord = userId
      ? await prisma.user.findUnique({ where: { id: userId } })
      : null

    if (!userRecord) {
      userRecord = await ensureDemoUser()
      userId = userRecord.id
    }

    const projectId = randomUUID()
    const projectName =
      (formData.get('projectName') as string | null) ??
      path.parse(originalFileName).name ??
      'Projeto PPTX'

    const now = new Date()

    await prisma.project.create({
      data: {
        id: projectId,
        name: projectName,
        type: 'pptx',
        status: 'PROCESSING',
        userId,
        originalFileName,
        pptxUrl: publicUrl,
        totalSlides: parsed.slides.length,
        metadata: parsed.metadata, // Campo Json? aceita objetos tipados
        slidesData: {
          extractedAt: now.toISOString(),
          metadata: parsed.metadata,
          slides: parsed.slides
        },
        processingLog: {
          stage: 'uploaded',
          storedAt: now.toISOString(),
          fileName: safeFileName,
          fileSize: file.size
        }
      }
    })

    const slidePromises = parsed.slides.map(async slide => {
      const textElements = slide.elements
        .filter(element => element.type === 'text' && element.content)
        .map(element => element.content?.trim())
        .filter(Boolean) as string[]

      const images = slide.elements.filter(element => element.type === 'image')

      const rawText = textElements.join('\n')
      const title = textElements[0] || `Slide ${slide.number}`
      const durationSeconds = Math.max(1, Math.round((slide.duration ?? 5000) / 1000))

      await prisma.slide.create({
        data: {
          projectId,
          title,
          content: rawText || title,
          slideNumber: slide.number,
          extractedText: rawText || null,
          slideNotes: slide.notes ?? null,
          slideLayout: slide.layout ? { name: slide.layout } : null,
          slideImages: images.length ? images : null,
          slideElements: slide.elements,
          slideMetrics: {
            textBlocks: textElements.length,
            imageCount: images.length,
            hasNotes: Boolean(slide.notes)
          },
          backgroundType: slide.background.type,
          backgroundColor: slide.background.color ?? null,
          backgroundImage: slide.background.image?.src ?? null,
          duration: durationSeconds,
          transition: slide.transition?.type ?? 'fade',
          audioText: rawText || title,
          elements: slide.elements
        }
      })
    })

    await Promise.all(slidePromises)

    await prisma.project.update({
      where: { id: projectId },
      data: {
        status: 'COMPLETED',
        processingLog: {
          stage: 'parsed',
          completedAt: new Date().toISOString(),
          fileName: safeFileName,
          fileSize: file.size,
          totalSlides: parsed.slides.length
        },
        imagesExtracted: parsed.slides.reduce(
          (total, slide) =>
            total + slide.elements.filter(element => element.type === 'image').length,
          0
        ),
        processingTime: 0,
        phase: 'UPLOAD_COMPLETED'
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        projectId,
        projectName,
        totalSlides: parsed.slides.length,
        pptxUrl: publicUrl,
        metadata: parsed.metadata,
        createdAt: now.toISOString()
      }
    })
  } catch (error) {
    logger.error('PPTX upload error', error instanceof Error ? error : new Error(String(error)), { component: 'PPTXUploadRoute' })
    captureError(error)
    incUploadError()

    return buildErrorResponse({
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Erro interno ao processar o PPTX.',
      status: 500
    })
  }
  })
}
