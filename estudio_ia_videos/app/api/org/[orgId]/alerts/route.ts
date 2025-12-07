
/**
 * 🚨 API: Alerts Management
 * GET /api/org/{orgId}/alerts
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import type { AuthOptions } from 'next-auth';
import { authConfig } from '@/lib/auth/auth-config';
import { getOrgContext } from '@/lib/multi-tenancy/org-context';
import { alertManager, AlertSeverity, AlertType } from '@/lib/alerts/alert-manager';

export async function GET(
  req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  try {
    const session = await getServerSession(authConfig as unknown as AuthOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const orgContext = await getOrgContext(session.user.id, params.orgId);
    if (!orgContext) {
      return NextResponse.json({ error: 'Organização não encontrada' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const severity = searchParams.get('severity') as AlertSeverity | null;
    const type = searchParams.get('type') as AlertType | null;
    const limit = parseInt(searchParams.get('limit') || '50');

    const alerts = await alertManager.getRecentAlerts({
      organizationId: params.orgId,
      severity: severity || undefined,
      type: type || undefined,
      limit,
    });

    return NextResponse.json({ alerts });
  } catch (error) {
    console.error('Erro ao buscar alertas:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar alertas' },
      { status: 500 }
    );
  }
}

