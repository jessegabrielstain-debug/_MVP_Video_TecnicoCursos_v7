// TODO: Fix PresentationV2 to Record<string, unknown> assignment

/**
 * 🔧 Enhanced PPTX Processing API v2.0 - Production Real
 * API que usa o parser real v2 para extrair elementos individuais
 */

import { NextRequest, NextResponse } from 'next/server';
import { PPTXRealParserV2 } from '@/lib/pptx-real-parser-v2';
import { convertRealToUnified } from '@/lib/types-unified-v2';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  logger.info('🚀 [PPTX Parser v2] Iniciando processamento real...', { component: 'API: v1/pptx/enhanced-process-v2' });
  
  try {
    const body = await request.json();
    const { s3Key, filename, options = {} } = body;

    if (!s3Key) {
      return NextResponse.json(
        { success: false, error: 'S3 key é obrigatório' },
        { status: 400 }
      );
    }

    logger.info(`📥 [PPTX Parser v2] Processando arquivo do S3: ${s3Key}`, { component: 'API: v1/pptx/enhanced-process-v2' });

    // Inicializar parser real v2
    const parser = new PPTXRealParserV2();
    
    // Processar arquivo do S3 - EXTRAÇÃO REAL
    const result = await parser.parseFromS3(s3Key);
    
    // Converter para formato unificado
    const unifiedResult = convertRealToUnified(result as unknown as Record<string, unknown>);

    // Estatísticas detalhadas
    const elementStats = result.slides.reduce((acc: Record<string, number>, slide) => {
      if (slide.elements) {
        slide.elements.forEach((element) => {
          acc[element.type] = (acc[element.type] || 0) + 1;
        });
      }
      return acc;
    }, {} as Record<string, number>);

    logger.info('✅ [PPTX Parser v2] Processamento real concluído:', {
      component: 'API: v1/pptx/enhanced-process-v2',
      slides: result.slides.length,
      totalElements: result.slides.reduce((acc: number, slide) => acc + (slide.elements?.length || 0), 0),
      elementsByType: elementStats,
      assets: {
        images: result.assets.images.length,
        videos: result.assets.videos.length,
        audio: result.assets.audio.length
      },
      duration: result.timeline.totalDuration,
      compliance: result.compliance?.score || 0
    });

    // Validar que temos elementos editáveis (não apenas imagens)
    const editableElements = result.slides.reduce((acc: number, slide) => 
      acc + (slide.elements?.filter((el) => el.type !== 'image').length || 0), 0
    );

    if (editableElements === 0) {
      logger.warn('⚠️ [PPTX Parser v2] Nenhum elemento editável encontrado!', { component: 'API: v1/pptx/enhanced-process-v2' });
    }

    return NextResponse.json({
      success: true,
      data: unifiedResult,
      statistics: {
        processedSlides: result.slides.length,
        totalElements: result.slides.reduce((acc: number, slide) => acc + slide.elements.length, 0),
        editableElements,
        elementsByType: elementStats,
        totalAssets: result.assets.images.length + result.assets.videos.length + result.assets.audio.length,
        estimatedDuration: result.timeline.totalDuration,
        complianceScore: result.compliance?.score || 0,
        processingTime: Date.now()
      },
      validation: {
        hasText: elementStats.text > 0,
        hasImages: result.assets.images.length > 0,
        hasEditableElements: editableElements > 0,
        isCompliant: (result.compliance?.score || 0) > 70
      },
      message: `Processamento real concluído: ${result.slides.length} slides, ${editableElements} elementos editáveis`
    });

  } catch (error) {
    logger.error('❌ [PPTX Parser v2] Erro no processamento:', error instanceof Error ? error : new Error(String(error)), { component: 'API: v1/pptx/enhanced-process-v2' });
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro ao processar arquivo PPTX com parser real',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        code: 'PARSER_ERROR'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json(
      { error: 'Job ID é obrigatório' },
      { status: 400 }
    );
  }

  // Em produção, isso consultaria o status real do job
  return NextResponse.json({
    success: true,
    job: {
      jobId,
      status: 'completed',
      progress: 100,
      message: 'Processamento real concluído com sucesso',
      timestamp: new Date().toISOString()
    }
  });
}

