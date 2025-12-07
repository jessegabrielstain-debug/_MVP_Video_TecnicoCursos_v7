import { NextRequest, NextResponse } from 'next/server'
import { S3StorageService } from '@/lib/s3-storage'
import { prisma } from '@/lib/prisma'
import { PPTXProcessor, PPTXProcessResult } from '@/lib/pptx/pptx-processor'
import type { Prisma } from '@prisma/client'

interface ProcessingProgress {
  stage: string;
  progress: number;
  message: string;
}

interface PPTXProcessingResult {
  success: boolean
  projectId?: string
  extractedContent?: PPTXProcessResult
  thumbnailUrl?: string
  error?: string
  processingTime?: number
}

export async function POST(request: NextRequest) {
  console.log('🎯 Iniciando processamento PPTX real - FASE 1...')
  const startTime = Date.now()
  let requestBody: { s3Key?: string; projectId?: string } = {}
  
  try {
    requestBody = await request.json()
    const { s3Key, projectId } = requestBody

    if (!s3Key || !projectId) {
      return NextResponse.json({
        success: false,
        error: 'S3 key e Project ID são obrigatórios'
      }, { status: 400 })
    }

    console.log(`🔄 Processando projeto: ${projectId}, arquivo: ${s3Key}`)

    // Atualizar status do projeto para processando
    await prisma.project.update({
      where: { id: projectId },
      data: {
        status: 'PROCESSING',
        processingLog: {
          processingStarted: new Date().toISOString(),
          s3Key: s3Key,
          status: 'processing',
          phase: 'FASE_1_REAL_PROCESSING'
        }
      }
    })

    // Verificar se o arquivo existe no S3
    const fileExists = await S3StorageService.fileExists(s3Key)
    if (!fileExists) {
      await prisma.project.update({
        where: { id: projectId },
        data: { 
          status: 'ERROR', 
          processingLog: { error: 'Arquivo não encontrado no S3', failedAt: new Date().toISOString() } as Prisma.InputJsonValue
        }
      })
      
      return NextResponse.json({
        success: false,
        error: 'Arquivo não encontrado no S3'
      }, { status: 404 })
    }

    // Baixar arquivo do S3 para processamento
    console.log('📥 Baixando arquivo do S3...')
    const downloadResult = await S3StorageService.downloadFile(s3Key)
    if (!downloadResult.success || !downloadResult.buffer) {
      const errorMsg = `Erro ao baixar arquivo: ${downloadResult.error}`
      
      await prisma.project.update({
        where: { id: projectId },
        data: { 
          status: 'ERROR', 
          processingLog: { error: errorMsg, failedAt: new Date().toISOString() } as Prisma.InputJsonValue
        }
      })
      
      return NextResponse.json({
        success: false,
        error: errorMsg
      }, { status: 500 })
    }

    console.log(`📦 Arquivo baixado: ${downloadResult.buffer.length} bytes`)

    // Validar arquivo PPTX
    console.log('🔍 Validando arquivo PPTX...')
    const validation = await PPTXProcessor.validatePPTXFile(downloadResult.buffer)
    if (!validation.isValid) {
      const errorMsg = `Arquivo PPTX inválido: ${validation.error || 'Erro desconhecido'}`
      
      await prisma.project.update({
        where: { id: projectId },
        data: { 
          status: 'ERROR', 
          processingLog: { error: errorMsg, failedAt: new Date().toISOString() } as Prisma.InputJsonValue
        }
      })
      
      return NextResponse.json({
        success: false,
        error: errorMsg
      }, { status: 400 })
    }

    if (validation.warnings.length > 0) {
      console.warn('⚠️ Avisos na validação:', validation.warnings)
    }

    // Processar arquivo PPTX com o novo processador real
    console.log('🎯 Iniciando processamento real com PPTXProcessor...')
    
    const progressCallback = (progress: ProcessingProgress) => {
      console.log(`📊 ${progress.stage}: ${Math.round(progress.progress)}% - ${progress.message}`)
    }

    const extractionResult = await PPTXProcessor.processFile(
      downloadResult.buffer,
      projectId,
      {
        extractImages: true,
        detectLayouts: true,
        estimateDurations: true,
        uploadToS3: true,
        generateThumbnails: true,
        maxImageSize: 1920,
        imageQuality: 85,
        extractHyperlinks: true
      },
      progressCallback
    )
    
    if (!extractionResult.success) {
      const errorMsg = `Erro ao processar PPTX: ${extractionResult.error}`
      
      await prisma.project.update({
        where: { id: projectId },
        data: {
          status: 'ERROR',
          processingLog: { error: errorMsg, failedAt: new Date().toISOString() } as Prisma.InputJsonValue,
        },
      })
      
      return NextResponse.json({
        success: false,
        error: errorMsg,
      }, { status: 500 })
    }

    console.log(`✅ Processamento concluído: ${extractionResult.slides.length} slides extraídos`)
    
    // Gerar thumbnail do primeiro slide se houver imagens
    let thumbnailUrl: string | null = null
    if (extractionResult.assets.images.length > 0) {
      const firstImage = extractionResult.assets.images[0]
      if (firstImage.s3Url) {
        thumbnailUrl = firstImage.s3Url
      }
    }

    // Salvar dados processados no banco
    console.log('💾 Salvando dados processados no banco...')
    
    const processingTime = Date.now() - startTime
    
    // Ensure data is JSON compatible (remove undefined)
    const safeSlidesData = JSON.parse(JSON.stringify(extractionResult));
    const safeProcessingLog = JSON.parse(JSON.stringify({
      processingCompleted: new Date().toISOString(),
      s3Key: s3Key,
      status: 'completed',
      phase: 'FASE_1_REAL_PROCESSING',
      slidesExtracted: extractionResult.slides.length,
      imagesExtracted: extractionResult.assets.images.length,
      totalDuration: extractionResult.timeline?.totalDuration || 0,
      processingTime: processingTime,
      extractionStats: extractionResult.extractionStats
    }));

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        status: 'COMPLETED',
        slidesData: safeSlidesData as Prisma.InputJsonValue,
        totalSlides: extractionResult.slides.length,
        duration: extractionResult.timeline ? Math.round(extractionResult.timeline.totalDuration / 1000) : 0, // Converter para segundos
        thumbnailUrl: thumbnailUrl,
        processingLog: safeProcessingLog as Prisma.InputJsonValue
      }
    })

    // Criar slides individuais no banco de dados
    console.log('📄 Criando slides individuais no banco...')
    
    for (let i = 0; i < extractionResult.slides.length; i++) {
      const slide = extractionResult.slides[i];
      
      const safeAvatarConfig = JSON.parse(JSON.stringify({
        layout: slide.layout,
        textElements: slide.textBoxes,
        animations: slide.animations,
        backgroundType: slide.backgroundType,
        images: slide.images,
        shapes: slide.shapes,
        audioText: slide.content + (slide.notes ? '\n\n' + slide.notes : '')
      }));

      await prisma.slide.create({
        data: {
          projectId: projectId,
          title: slide.title || '',
          content: slide.content || '',
          orderIndex: i, // Usar orderIndex em vez de slideNumber
          duration: Math.round((slide.duration || 5000) / 1000), // Converter para segundos, default 5s
          backgroundColor: slide.backgroundColor || '#FFFFFF',
          // Armazenar dados extras em avatarConfig (JSON disponível no modelo)
          avatarConfig: safeAvatarConfig as Prisma.InputJsonValue
        }
      })
    }

    console.log(`✅ Processamento PPTX concluído em ${processingTime}ms e salvo no banco`)

    const result: PPTXProcessingResult = {
      success: true,
      projectId: projectId,
      extractedContent: extractionResult,
      thumbnailUrl: thumbnailUrl || undefined,
      processingTime
    }

    return NextResponse.json(result)

  } catch (error: unknown) {
    console.error('❌ Erro no processamento PPTX:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor'
    const processingTime = Date.now() - startTime
    
    // Atualizar projeto com status de erro se projectId estiver disponível
    if (requestBody.projectId) {
      await prisma.project.update({
        where: { id: requestBody.projectId },
        data: {
          status: 'ERROR',
          processingLog: {
            error: errorMessage,
            timestamp: new Date().toISOString(),
            phase: 'FASE_1_REAL_PROCESSING',
            processingTime: processingTime,
            failedAt: new Date().toISOString()
          } as Prisma.InputJsonValue
        }
      }).catch(console.error)
    }
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      processingTime
    }, { status: 500 })
  }
}

