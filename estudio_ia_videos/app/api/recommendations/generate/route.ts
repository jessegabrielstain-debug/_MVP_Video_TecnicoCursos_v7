/**
 * API de Recomendações Inteligentes
 * 
 * Endpoints para recomendações personalizadas
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { recommendationSystem, RecommendationItem } from '@/lib/intelligent-recommendation-system';

type RecommendationType = 'template' | 'asset' | 'course' | 'feature';

/**
 * POST /api/recommendations/generate
 * Gera recomendações personalizadas
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, types, limit } = body as {
      userId: string;
      types?: RecommendationType[];
      limit?: number;
    };

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 }
      );
    }

    const allRecommendations = await recommendationSystem.getRecommendations(
      userId,
      types ? { filterTypes: types } : undefined,
      limit || 10
    );

    // Filtrar por tipos se especificado
    const recommendations = types 
      ? allRecommendations.filter((rec: RecommendationItem) => types.includes(rec.type as RecommendationType))
      : allRecommendations;

    return NextResponse.json({
      success: true,
      recommendations: recommendations.map((rec: RecommendationItem) => ({
        id: rec.id,
        type: rec.type,
        title: rec.title,
        description: rec.description,
        relevanceScore: rec.relevanceScore,
        metadata: rec.metadata,
      })),
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error)); logger.error('Generate recommendations error', err, { component: 'API: recommendations/generate' });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/recommendations/generate?userId=xxx
 * Obtém recomendações existentes
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const limit = searchParams.get('limit');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    const recommendations = await recommendationSystem.getRecommendations(
      userId,
      undefined,
      limit ? parseInt(limit, 10) : 10
    );

    return NextResponse.json({
      success: true,
      recommendations: recommendations.map((rec: RecommendationItem) => ({
        id: rec.id,
        type: rec.type,
        title: rec.title,
        description: rec.description,
        relevanceScore: rec.relevanceScore,
        metadata: rec.metadata,
      })),
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error)); logger.error('Get recommendations error', err, { component: 'API: recommendations/generate' });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get recommendations' },
      { status: 500 }
    );
  }
}

