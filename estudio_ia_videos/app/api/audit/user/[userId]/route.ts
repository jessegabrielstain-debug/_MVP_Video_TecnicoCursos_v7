/**
 * AUDIT LOGS API
 * GET /api/audit/user/[userId] - Obter atividade do usuário
 * GET /api/audit/resource - Obter histórico de recurso
 * GET /api/audit/security - Obter eventos de segurança (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auditLogger } from '@/lib/audit-logging-real';
import { getServerSession } from 'next-auth';
import { supabase } from '@/lib/services';

export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Usuários só podem ver seus próprios logs; admins podem ver qualquer usuário
    if (session.user.id !== params.userId) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (userError || userData?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100');

    const activity = await auditLogger.getUserActivity(params.userId, limit);

    return NextResponse.json({ activity });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
