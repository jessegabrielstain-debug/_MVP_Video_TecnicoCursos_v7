
/**
 * 📊 API: Generate Report
 * POST /api/org/{orgId}/reports/generate
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getOrgContext, hasPermission } from '@/lib/multi-tenancy/org-context';
import { reportGenerator, ReportType } from '@/lib/reports/report-generator';
import fs from 'fs';

export async function POST(
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

    // Apenas ADMIN e OWNER podem gerar relatórios
    if (!hasPermission(orgContext.role, 'org:manage')) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const body = await req.json();
    const { type, startDate, endDate, format = 'pdf' } = body;

    if (!type || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios: type, startDate, endDate' },
        { status: 400 }
      );
    }

    // Valida tipo de relatório
    const validTypes: ReportType[] = [
      'analytics',
      'security',
      'audit_logs',
      'billing',
      'usage',
      'sso',
      'members',
    ];

    if (!validTypes.includes(type as ReportType)) {
      return NextResponse.json({ error: 'Tipo de relatório inválido' }, { status: 400 });
    }

    // Gera relatório
    const filePath = await reportGenerator.generateReport({
      type: type as ReportType,
      organizationId: params.orgId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      format: format as 'pdf' | 'csv',
    });

    // Lê arquivo
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = filePath.split('/').pop() || `report.${format}`;

    // Remove arquivo temporário após leitura
    fs.unlinkSync(filePath);

    // Retorna arquivo
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': format === 'pdf' ? 'text/html' : 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar relatório' },
      { status: 500 }
    );
  }
}

