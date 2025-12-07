
/**
 * API: Cancelar job de render
 * POST /api/render/cancel/:jobId
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import type { AuthOptions } from 'next-auth';
import { authConfig } from '@/lib/auth/auth-config';

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
    console.log(`Cancelamento de render solicitado para job: ${jobId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao cancelar render:', error);
    return NextResponse.json(
      { error: 'Erro ao cancelar render' },
      { status: 500 }
    );
  }
}
