
/**
 * 📋 API: List Available 3D Avatars
 * Lista todos os avatares 3D disponíveis
 */

import { NextResponse } from 'next/server';
import { avatarEngine } from '@/lib/avatar-engine';
import avatarsData from '@/data/avatars.json';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const avatars = avatarEngine.getAllAvatars();

    return NextResponse.json({
      success: true,
      avatars: avatarsData.avatars,
      blendShapes: avatarsData.blendShapes,
      gestures: avatarsData.gestures,
      backgrounds: avatarsData.backgrounds,
      count: avatarsData.avatars.length
    });
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logger.error('Erro ao listar avatares', errorObj, { component: 'API: avatars/3d/list' });
    return NextResponse.json(
      { error: 'Erro ao listar avatares 3D' },
      { status: 500 }
    );
  }
}

