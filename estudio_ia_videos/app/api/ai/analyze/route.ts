/**
 * API de Análise de Vídeo com IA
 * 
 * Endpoints para análise automatizada de vídeos
 */

import { NextRequest, NextResponse } from 'next/server';
import { AIVideoAnalysisSystem } from '@/lib/ai-video-analysis-system';
import { logger } from '@/lib/logger';

/**
 * POST /api/ai/analyze
 * Inicia análise de vídeo
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoId, videoPath, config } = body as {
      videoId: string;
      videoPath: string;
      config?: Record<string, unknown>;
    };

    if (!videoId || !videoPath) {
      return NextResponse.json(
        { error: 'Missing required fields: videoId, videoPath' },
        { status: 400 }
      );
    }

    const aiAnalysis = AIVideoAnalysisSystem.getInstance();
    const analysis = await aiAnalysis.analyzeVideo(videoId, videoPath, config);

    return NextResponse.json({
      success: true,
      analysis: {
        id: analysis.id,
        videoId: analysis.videoId,
        status: analysis.status,
        progress: analysis.progress,
        createdAt: analysis.createdAt,
      },
    });
  } catch (error) {
    logger.error('AI analysis error', error instanceof Error ? error : new Error(String(error))
    , { component: 'API: ai/analyze' });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/analyze?analysisId=xxx
 * Obtém resultado da análise
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const analysisId = searchParams.get('analysisId');

    if (!analysisId) {
      return NextResponse.json(
        { error: 'Missing analysisId parameter' },
        { status: 400 }
      );
    }

    const aiAnalysis = AIVideoAnalysisSystem.getInstance();
    const analysis = aiAnalysis.getAnalysis(analysisId);

    if (!analysis) {
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      analysis: {
        id: analysis.id,
        videoId: analysis.videoId,
        status: analysis.status,
        progress: analysis.progress,
        results: analysis.results,
        error: analysis.error,
        createdAt: analysis.createdAt,
        completedAt: analysis.completedAt,
      },
    });
  } catch (error) {
    logger.error('Get analysis error', error instanceof Error ? error : new Error(String(error))
    , { component: 'API: ai/analyze' });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get analysis' },
      { status: 500 }
    );
  }
}

