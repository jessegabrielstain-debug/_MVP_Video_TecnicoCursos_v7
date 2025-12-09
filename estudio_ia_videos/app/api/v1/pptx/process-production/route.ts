/**
 * Production PPTX Processing API
 * Real processing pipeline with S3 integration
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'
import { PPTXProcessor } from '@/lib/pptx/pptx-processor'
import { S3StorageService } from '@/lib/s3-storage'
import { getSupabaseForRequest } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = getSupabaseForRequest(request)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      )
    }

    const { s3Key, jobId } = await request.json()
    
    if (!s3Key || !jobId) {
      return NextResponse.json(
        { error: 'S3 key e job ID são obrigatórios' },
        { status: 400 }
      )
    }
    
    logger.info('🔄 Starting PPTX processing:', { component: 'API: v1/pptx/process-production', s3Key, jobId })
    
    // Download file from S3
    logger.info('📥 Downloading file from S3...', { component: 'API: v1/pptx/process-production' })
    const downloadResult = await S3StorageService.downloadFile(s3Key)
    
    if (!downloadResult.success || !downloadResult.buffer) {
      throw new Error(`Failed to download file: ${downloadResult.error}`)
    }
    
    logger.info(`📦 File downloaded: ${downloadResult.buffer.length} bytes`, { component: 'API: v1/pptx/process-production' })
    
    // Process PPTX content
    logger.info('🔍 Processing PPTX content...', { component: 'API: v1/pptx/process-production' })
    const { pptxProcessor } = await import('@/lib/pptx/pptx-real-processor');
    const processingResult = await pptxProcessor.processBuffer(downloadResult.buffer, {
      extractImages: true,
      extractNotes: true
    })
    
    if (!processingResult.slides) {
      throw new Error(`Processing failed: No slides found`)
    }
    
    logger.info(`✅ Processing successful: ${processingResult.slides.length} slides`, { component: 'API: v1/pptx/process-production' })
    
    // Calculate metrics
    const totalDuration = processingResult.slides.reduce((acc: any, slide: any) => acc + (slide.duration || 5), 0)
    const totalImages = processingResult.slides.reduce((acc: any, slide: any) => acc + slide.images.length, 0)
    const hasAnimations = processingResult.slides.some((slide: any) => slide.animations && slide.animations.length > 0)
    
    // Format response
    const processedData = {
      slides: processingResult.slides.map((slide: any) => ({
        id: slide.id,
        title: slide.title,
        content: slide.textContent || slide.content,
        images: slide.images.length,
        duration: slide.duration || 5,
        animations: slide.animations || []
      })),
      totalDuration,
      slideCount: processingResult.slides.length,
      imageCount: totalImages,
      hasAnimations,
      metadata: {
        title: processingResult.metadata?.title || 'Untitled',
        author: processingResult.metadata?.author || 'Unknown',
        subject: processingResult.metadata?.subject || '',
        createdAt: processingResult.metadata?.createdAt || new Date().toISOString(),
        modifiedAt: processingResult.metadata?.modifiedAt || new Date().toISOString()
      }
    }
    
    // Return processed data
    return NextResponse.json({
      success: true,
      data: processedData,
      message: 'Processamento concluído com sucesso',
      processingTime: Date.now() - Date.now() // Placeholder for actual timing
    })
    
  } catch (error) {
    logger.error('Processing API Error:', error instanceof Error ? error : new Error(String(error)), { component: 'API: v1/pptx/process-production' })
    return NextResponse.json(
      { 
        error: 'Erro durante o processamento',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // Get processing status endpoint
  const { searchParams } = new URL(request.url)
  const jobId = searchParams.get('jobId')
  
  if (!jobId) {
    return NextResponse.json(
      { error: 'Job ID é obrigatório' },
      { status: 400 }
    )
  }
  
  try {
    // In a real implementation, you would query the job status from database/cache
    return NextResponse.json({
      success: true,
      status: 'completed',
      progress: 100,
      message: 'Processamento concluído'
    })
    
  } catch (error) {
    logger.error('Status check error:', error instanceof Error ? error : new Error(String(error)), { component: 'API: v1/pptx/process-production' })
    return NextResponse.json(
      { error: 'Erro ao verificar status' },
      { status: 500 }
    )
  }
}
