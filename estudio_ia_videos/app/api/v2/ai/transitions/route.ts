/**
 * API v2: AI-Powered Transitions
 * Recomendação inteligente de transições entre cenas
 */

import { NextResponse } from 'next/server';
import { sceneTransitionsEngine } from '@/lib/ai/scene-transitions';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

// POST /api/v2/ai/transitions - Recomendar transições
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fromVideoPath, toVideoPath, fromStartTime, toStartTime, count } = body;

    if (!fromVideoPath || !toVideoPath) {
      return NextResponse.json(
        {
          success: false,
          error: 'fromVideoPath and toVideoPath are required'
        },
        { status: 400 }
      );
    }

    // Analisar ambas as cenas
    const [fromScene, toScene] = await Promise.all([
      sceneTransitionsEngine.analyzeScene(fromVideoPath, fromStartTime || 0, 5),
      sceneTransitionsEngine.analyzeScene(toVideoPath, toStartTime || 0, 5)
    ]);

    // Obter recomendações
    const recommendations = sceneTransitionsEngine.getTransitionOptions(
      fromScene,
      toScene,
      count || 3
    );

    return NextResponse.json({
      success: true,
      data: {
        fromScene: {
          id: fromScene.sceneId,
          brightness: fromScene.brightness,
          motionIntensity: fromScene.motionIntensity,
          sentiment: fromScene.sentiment,
          dominantColors: fromScene.dominantColors
        },
        toScene: {
          id: toScene.sceneId,
          brightness: toScene.brightness,
          motionIntensity: toScene.motionIntensity,
          sentiment: toScene.sentiment,
          dominantColors: toScene.dominantColors
        },
        recommendations: recommendations.map(r => ({
          type: r.type,
          duration: r.duration,
          easing: r.easing,
          confidence: Math.round(r.confidence * 100) + '%',
          reason: r.reason
        }))
      }
    });
  } catch (error) {
    logger.error('AI transitions error', error instanceof Error ? error : new Error(String(error)), {
      component: 'API: /api/v2/ai/transitions'
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate transition recommendations'
      },
      { status: 500 }
    );
  }
}
