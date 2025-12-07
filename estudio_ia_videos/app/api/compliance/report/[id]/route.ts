/**
 * GET /api/compliance/report/[id]
 * Gera relatório inteligente de compliance em PDF
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateComplianceReport } from '@/lib/compliance/report-generator'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const recordId = params.id

    // Busca registro de compliance
    const record = await prisma.nRComplianceRecord.findUnique({
      where: { id: recordId },
      include: {
        project: {
          include: {
            slides: {
              orderBy: { orderIndex: 'asc' }
            }
          }
        }
      }
    })

    if (!record) {
      return NextResponse.json({ error: 'Registro não encontrado' }, { status: 404 })
    }

    // Verifica permissão
    if (record.project.userId !== session.user.id) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    // Gera relatório PDF
    const reportBuffer = await generateComplianceReport(record)

    // Retorna PDF
    return new NextResponse(reportBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="relatorio-compliance-${record.nr}-${record.id}.pdf"`
      }
    })

  } catch (error) {
    console.error('[COMPLIANCE_REPORT_ERROR]', error)
    return NextResponse.json(
      { error: 'Erro ao gerar relatório' },
      { status: 500 }
    )
  }
}