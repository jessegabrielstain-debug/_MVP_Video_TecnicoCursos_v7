
/**
 * API: Cancelar job de render
 * POST /api/render/cancel/:jobId
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import type { AuthOptions } from 'next-auth';
import { authConfig } from '@/lib/auth/auth-config';
import { logger } from '@/lib/logger';

export async function POST(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const session = await getServerSession(authConfig as unknown as AuthOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { jobId } = params;

    // TODO: Implementar cancelamento real quando o render queue estiver ativo
    // Por enquanto, apenas retorna sucesso
    logger.info('Cancelamento de render solicitado', {
      component: 'API: render/cancel',
      jobId
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Erro ao cancelar render', {
      component: 'API: render/cancel',
      error: error instanceof Error ? error : new Error(String(error))
    });
    return NextResponse.json(
      { error: 'Erro ao cancelar render' },
      { status: 500 }
    );
  }
}
