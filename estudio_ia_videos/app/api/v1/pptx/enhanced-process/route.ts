// TODO: Fix possibly undefined assets/timeline

/**
 * 🔧 Enhanced PPTX Processing API - Production
 * Usa o parser real para processar arquivos PPTX do S3
 */

import { NextRequest, NextResponse } from 'next/server';
import { PPTXRealParser } from '@/lib/pptx-real-parser';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  logger.info('🚀 Iniciando processamento PPTX real...', { component: 'API: v1/pptx/enhanced-process' });
  
  try {
    const body = await request.json();
    const { s3Key, filename, options = {} } = body;

    if (!s3Key) {
      return NextResponse.json(
        { success: false, error: 'S3 key é obrigatório' },
        { status: 400 }
      );
    }

    logger.info('📥 Processando arquivo do S3:', { component: 'API: v1/pptx/enhanced-process', s3Key });

    // Inicializar parser real
    const parser = new PPTXRealParser();
    
    // Processar arquivo do S3
    const result = await parser.parseFromS3(s3Key);
    
    logger.info('✅ Processamento concluído:', {
      component: 'API: v1/pptx/enhanced-process',
      slides: result.slides.length,
      elements: result.slides.reduce((acc: any, slide: any) => acc + (slide.elements?.length || 0), 0),
      assets: (result.assets?.images.length || 0) + (result.assets?.videos.length || 0) + (result.assets?.audio.length || 0),
      duration: result.timeline?.totalDuration || 0,
      compliance: result.compliance?.score
    });

    return NextResponse.json({
      success: true,
      data: result,
      statistics: {
        processedSlides: result.slides.length,
        totalElements: result.slides.reduce((acc: any, slide: any) => acc + (slide.elements?.length || 0), 0),
        totalAssets: (result.assets?.images.length || 0) + (result.assets?.videos.length || 0) + (result.assets?.audio.length || 0),
        estimatedDuration: result.timeline?.totalDuration || 0,
        complianceScore: result.compliance?.score || 0
      },
      message: `Processamento concluído: ${result.slides.length} slides analisados`
    });

  } catch (error) {
    logger.error('❌ Erro no processamento PPTX:', { component: 'API: v1/pptx/enhanced-process', error: error instanceof Error ? error : new Error(String(error)) });
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro ao processar arquivo PPTX',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
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
    jobId,
    status: 'completed',
    progress: 100,
    message: 'Processamento concluído com sucesso'
  });
}

