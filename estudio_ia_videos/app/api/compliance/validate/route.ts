/**
 * POST /api/compliance/validate
 * Nova API de validação usando Smart Compliance Validator com GPT-4
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/auth-config';
import { SmartComplianceValidator } from '@/lib/compliance/smart-validator';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { projectId, nrType } = await request.json();

    if (!projectId || !nrType) {
      return NextResponse.json({
        error: 'Project ID and NR type required'
      }, { status: 400 });
    }

    console.log(`🔍 Starting compliance validation: ${projectId} - ${nrType}`);

    // Verificar se o projeto existe e pertence ao usuário
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true }
    });

    if (!project) {
      return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });
    }

    if (project.userId !== session.user.id) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    // Validação com GPT-4 + análise estrutural
    const validator = new SmartComplianceValidator();
    const result = await validator.validate(projectId, nrType);

    // Salvar resultado no banco
    await prisma.complianceValidation.create({
      data: {
        projectId,
        nrType,
        score: result.score,
        passed: result.passed,
        report: result.report as unknown,
        validatedAt: result.timestamp,
        validatedBy: session.user.id
      }
    });

    console.log(`✅ Compliance validation complete. Score: ${result.score}`);

    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error: any) {
    console.error('Compliance validation error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 });
  }
}

/**
 * POST /api/compliance/validate/quick
 * Validação rápida para feedback em tempo real
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { content, nrType } = await request.json();

    if (!content || !nrType) {
      return NextResponse.json({
        error: 'Content and NR type required'
      }, { status: 400 });
    }

    console.log(`⚡ Quick validation for ${nrType}`);

    // Validação rápida
    const validator = new SmartComplianceValidator();
    const result = await validator.quickValidate(content, nrType);

    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error: any) {
    console.error('Quick validation error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 });
  }
}

/**
 * GET /api/compliance/validate
 * Buscar histórico de validações
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({
        error: 'Project ID required'
      }, { status: 400 });
    }

    // Verificar permissão
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true }
    });

    if (!project) {
      return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });
    }

    if (project.userId !== session.user.id) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    // Buscar validações
    const validations = await prisma.complianceValidation.findMany({
      where: { projectId },
      orderBy: { validatedAt: 'desc' },
      take: 10
    });

    return NextResponse.json({
      success: true,
      validations
    });

  } catch (error: any) {
    console.error('Get validations error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 });
  }
}