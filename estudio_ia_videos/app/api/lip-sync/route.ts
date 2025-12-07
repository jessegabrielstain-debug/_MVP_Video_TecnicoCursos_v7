import { NextRequest, NextResponse } from 'next/server';
import { generateLipSyncVideo, validateLipSyncResources } from '@/lib/services/lip-sync-integration';

/**
 * POST /api/lip-sync
 * Gera vídeo com lip sync a partir de texto e avatar
 */
export async function POST(request: NextRequest) {
  try {
    // Validação de recursos
    const validation = await validateLipSyncResources();
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Recursos não configurados', details: validation.errors },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { text, avatarImageUrl, voiceId, modelId, videoQuality, outputFileName } = body;

    if (!text || !avatarImageUrl) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: text, avatarImageUrl' },
        { status: 400 }
      );
    }

    const result = await generateLipSyncVideo({
      text,
      avatarImageUrl,
      voiceId,
      modelId,
      videoQuality,
      outputFileName
    });

    if (result.status === 'failed') {
      return NextResponse.json(
        { error: 'Falha ao gerar vídeo com lip sync' },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao gerar lip sync:', error);
    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/lip-sync/validate
 * Valida se os recursos necessários estão disponíveis
 */
export async function GET(request: NextRequest) {
  try {
    const validation = await validateLipSyncResources();
    return NextResponse.json(validation);
  } catch (error) {
    console.error('Erro ao validar recursos:', error);
    return NextResponse.json(
      { error: 'Erro ao validar recursos' },
      { status: 500 }
    );
  }
}

