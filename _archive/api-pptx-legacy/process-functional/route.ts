import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { PPTXParser } from '@/lib/pptx/PPTXParser';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileId, fileName } = body;

    if (!fileId || !fileName) {
      return NextResponse.json(
        { error: 'ID do arquivo e nome são obrigatórios' },
        { status: 400 }
      );
    }

    // Localizar arquivo
    const uploadsDir = path.join(process.cwd(), 'uploads', 'pptx');
    const filePath = path.join(uploadsDir, fileName);

    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Arquivo não encontrado' },
        { status: 404 }
      );
    }

    // Ler arquivo
    const buffer = await readFile(filePath);
    const file = new File([new Uint8Array(buffer)], fileName, {
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    });

    // Processar com parser PPTX
    const parser = new PPTXParser();
    const pptxDocument = await parser.parseFile(file);
    
    // Converter para dados de timeline
    const timelineData = parser.convertToTimelineData(pptxDocument);

    // Preparar resposta com dados processados
    const processedData = {
      id: fileId,
      document: {
        title: pptxDocument.title,
        author: pptxDocument.author,
        slideCount: pptxDocument.slideCount,
        totalDuration: pptxDocument.totalDuration,
        createdDate: pptxDocument.createdDate,
        theme: pptxDocument.theme
      },
      slides: pptxDocument.slides.map((slide: any) => ({
        id: slide.id,
        slideNumber: slide.slideNumber,
        title: slide.title,
        content: slide.content,
        duration: slide.duration,
        imageCount: slide.images.length,
        shapeCount: slide.shapes.length,
        animationCount: slide.animations.length
      })),
      timeline: timelineData,
      statistics: {
        totalSlides: pptxDocument.slideCount,
        totalDuration: pptxDocument.totalDuration,
        averageSlideDuration: pptxDocument.totalDuration / pptxDocument.slideCount,
        totalWords: pptxDocument.slides.reduce((sum: number, slide: any) => 
          sum + slide.content.join(' ').split(/\s+/).length, 0
        ),
        totalImages: pptxDocument.slides.reduce((sum: number, slide: any) => 
          sum + slide.images.length, 0
        ),
        totalShapes: pptxDocument.slides.reduce((sum: number, slide: any) => 
          sum + slide.shapes.length, 0
        )
      },
      processedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      message: 'PPTX processado com sucesso',
      data: processedData
    });

  } catch (error: unknown) {
    console.error('Erro no processamento PPTX:', error);
    
    return NextResponse.json(
      { 
        error: 'Erro ao processar PPTX', 
        details: error instanceof Error ? error.message : String(error),
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'API de Processamento PPTX',
    description: 'Processa arquivos PPTX e extrai conteúdo para timeline',
    usage: {
      method: 'POST',
      body: {
        fileId: 'ID do arquivo',
        fileName: 'Nome do arquivo salvo'
      }
    },
    features: [
      'Extração de slides e conteúdo',
      'Análise de texto e imagens',
      'Geração de timeline automática',
      'Cálculo de duração estimada',
      'Extração de metadados'
    ]
  });
}
