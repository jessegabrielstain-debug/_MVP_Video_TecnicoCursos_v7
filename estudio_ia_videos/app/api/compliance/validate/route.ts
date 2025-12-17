/**
 * POST /api/compliance/validate
 * Nova API de validação usando Smart Compliance Validator com GPT-4
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getSupabaseForRequest } from '@/lib/supabase/server';
import { SmartComplianceValidator } from '@/lib/compliance/smart-validator';

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseForRequest(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { projectId, nrType } = await request.json();

    if (!projectId || !nrType) {
      return NextResponse.json({
        error: 'Project ID and NR type required'
      }, { status: 400 });
    }

    logger.info(`🔍 Starting compliance validation: ${projectId} - ${nrType}`, { component: 'API: compliance/validate' });

    // Verificar se o projeto existe e pertence ao usuário
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });
    }

    if (project.user_id !== user.id) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    // Validação com GPT-4 + análise estrutural
    const validator = new SmartComplianceValidator();
    const result = await validator.validate(projectId, nrType);

    // Salvar resultado no banco
    // Note: nr_compliance_records is a valid table but not in generated types
    const { error: insertError } = await supabase
      .from('nr_compliance_records')
      .insert({
        project_id: projectId,
        nr: nrType,
        nr_name: nrType,
        status: result.passed ? 'compliant' : 'non_compliant',
        score: result.score,
        final_score: result.score,
        requirements_met: Math.floor(result.score / 10),
        requirements_total: 10,
        validated_at: result.timestamp ? new Date(result.timestamp).toISOString() : new Date().toISOString(),
        validated_by: user.id,
        ai_analysis: result.report,
        recommendations: result.report.recommendations,
        critical_points: result.report.criticalPoints
      });

    if (insertError) {
        logger.error('Error saving compliance record:', insertError instanceof Error ? insertError : new Error(String(insertError)), { component: 'API: compliance/validate' });
        // We don't fail the request if saving fails, but we should log it.
    }

    logger.info(`✅ Compliance validation complete. Score: ${result.score}`, { component: 'API: compliance/validate' });

    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error: unknown) {
    logger.error('Compliance validation error:', error instanceof Error ? error : new Error(String(error)), { component: 'API: compliance/validate' });
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor'
    }, { status: 500 });
  }
}

/**
 * POST /api/compliance/validate/quick
 * Validação rápida para feedback em tempo real
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = getSupabaseForRequest(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { content, nrType } = await request.json();

    if (!content || !nrType) {
      return NextResponse.json({
        error: 'Content and NR type required'
      }, { status: 400 });
    }

    logger.info(`⚡ Quick validation for ${nrType}`, { component: 'API: compliance/validate' });

    // Validação rápida
    const validator = new SmartComplianceValidator();
    const result = await validator.quickValidate(content, nrType);

    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error: unknown) {
    logger.error('Quick validation error:', error instanceof Error ? error : new Error(String(error)), { component: 'API: compliance/validate' });
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor'
    }, { status: 500 });
  }
}

/**
 * GET /api/compliance/validate
 * Buscar histórico de validações
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseForRequest(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
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
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('user_id')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Projeto não encontrado' }, { status: 404 });
    }

    if (project.user_id !== user.id) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    // Buscar validações
    // Note: nr_compliance_records is a valid table but not in generated types
    const { data: validations, error: fetchError } = await supabase
      .from('nr_compliance_records')
      .select('*')
      .eq('project_id', projectId)
      .order('validated_at', { ascending: false })
      .limit(10);

    if (fetchError) {
        throw fetchError;
    }

    return NextResponse.json({
      success: true,
      validations
    });

  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Get validations error:', err, { component: 'API: compliance/validate' });
    return NextResponse.json({
      success: false,
      error: err.message || 'Erro interno do servidor',
      details: String(error)
    }, { status: 500 });
  }
}

