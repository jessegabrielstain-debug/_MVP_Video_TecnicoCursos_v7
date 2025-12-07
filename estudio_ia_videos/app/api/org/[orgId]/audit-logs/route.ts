
/**
 * 📝 API: Audit Logs
 * GET /api/org/{orgId}/audit-logs
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getOrgContext, hasPermission } from '@/lib/multi-tenancy/org-context';
import { getAuditLogs } from '@/lib/billing/audit-logger';

export async function GET(
  req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const orgContext = await getOrgContext(session.user.id, params.orgId);
    if (!orgContext) {
      return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 });
    }

    // Apenas ADMIN e OWNER podem ver audit logs
    if (!hasPermission(orgContext.role, 'org:manage')) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || undefined;
    const action = searchParams.get('action') || undefined;
    const resource = searchParams.get('resource') || undefined;
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : undefined;
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : undefined;
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const result = await getAuditLogs({
      organizationId: params.orgId,
      userId,
      action,
      resource,
      startDate,
      endDate,
      limit,
      offset,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao buscar audit logs:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar logs' },
      { status: 500 }
    );
  }
}

