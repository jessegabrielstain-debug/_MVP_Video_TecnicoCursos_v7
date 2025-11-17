
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Templates NR simplificados (em produção, viria de um banco de dados)
const NR_TEMPLATES: Record<string, unknown> = {
  'NR-12': {
    id: 'NR-12',
    title: 'Segurança no Trabalho em Máquinas e Equipamentos',
    requiredTopics: [
      { id: 'introducao', title: 'Introdução à NR-12', minDuration: 60, keywords: ['NR-12', 'segurança', 'máquinas', 'equipamentos'] },
      { id: 'protecoes', title: 'Proteções de Segurança', minDuration: 120, keywords: ['proteção', 'dispositivo', 'segurança', 'emergência'] },
      { id: 'procedimentos', title: 'Procedimentos Seguros', minDuration: 90, keywords: ['procedimento', 'operação', 'seguro', 'manutenção'] },
      { id: 'riscos', title: 'Identificação de Riscos', minDuration: 90, keywords: ['risco', 'perigo', 'identificar', 'avaliar'] },
      { id: 'epi', title: 'Uso de EPIs', minDuration: 60, keywords: ['EPI', 'proteção individual', 'equipamento', 'obrigatório'] },
    ],
    criticalPoints: [
      { id: 'stop', title: 'Botão de Parada de Emergência', keywords: ['emergência', 'parada', 'botão', 'stop'] },
      { id: 'bloqueio', title: 'Sistema de Bloqueio', keywords: ['bloqueio', 'trava', 'lock', 'segurança'] },
    ],
  },
  'NR-35': {
    id: 'NR-35',
    title: 'Trabalho em Altura',
    requiredTopics: [
      { id: 'introducao', title: 'Introdução à NR-35', minDuration: 60, keywords: ['NR-35', 'altura', 'trabalho', 'elevado'] },
      { id: 'riscos', title: 'Riscos em Trabalho em Altura', minDuration: 90, keywords: ['queda', 'risco', 'altura', 'acidente'] },
      { id: 'epi', title: 'EPIs para Altura', minDuration: 120, keywords: ['cinto', 'trava-queda', 'capacete', 'EPI'] },
      { id: 'ancoragem', title: 'Pontos de Ancoragem', minDuration: 60, keywords: ['ancoragem', 'fixação', 'ponto', 'seguro'] },
      { id: 'resgate', title: 'Plano de Resgate', minDuration: 90, keywords: ['resgate', 'emergência', 'plano', 'socorro'] },
    ],
    criticalPoints: [
      { id: 'check', title: 'Checklist de Equipamentos', keywords: ['checklist', 'inspeção', 'equipamento', 'verificar'] },
      { id: 'autorização', title: 'Autorização para Trabalho', keywords: ['autorização', 'permissão', 'trabalho', 'liberado'] },
    ],
  },
  'NR-33': {
    id: 'NR-33',
    title: 'Segurança e Saúde no Trabalho em Espaços Confinados',
    requiredTopics: [
      { id: 'introducao', title: 'Introdução à NR-33', minDuration: 60, keywords: ['NR-33', 'espaço confinado', 'segurança'] },
      { id: 'caracteristicas', title: 'Características de Espaços Confinados', minDuration: 90, keywords: ['confinado', 'característica', 'espaço', 'entrada'] },
      { id: 'riscos', title: 'Riscos em Espaços Confinados', minDuration: 120, keywords: ['asfixia', 'tóxico', 'explosão', 'risco'] },
      { id: 'medicoes', title: 'Medições Atmosféricas', minDuration: 90, keywords: ['medição', 'atmosfera', 'gás', 'oxigênio'] },
      { id: 'resgate', title: 'Procedimentos de Resgate', minDuration: 90, keywords: ['resgate', 'emergência', 'salvamento'] },
    ],
    criticalPoints: [
      { id: 'pet', title: 'Permissão de Entrada e Trabalho (PET)', keywords: ['PET', 'permissão', 'entrada', 'trabalho'] },
      { id: 'vigia', title: 'Vigia Permanente', keywords: ['vigia', 'supervisor', 'monitoramento'] },
    ],
  },
};

// Função de validação de conteúdo
function validateContent(content: string, template: any): {
  score: number;
  topicsCovered: string[];
  topicsMissing: string[];
  criticalPointsCovered: string[];
  criticalPointsMissing: string[];
  suggestions: string[];
} {
  const lowerContent = content.toLowerCase();
  
  const topicsCovered: string[] = [];
  const topicsMissing: string[] = [];
  
  // Validar tópicos obrigatórios
  template.requiredTopics.forEach((topic: any) => {
    const keywordsFound = topic.keywords.filter((keyword: string) => 
      lowerContent.includes(keyword.toLowerCase())
    );
    
    if (keywordsFound.length >= 2) {
      topicsCovered.push(topic.title);
    } else {
      topicsMissing.push(topic.title);
    }
  });
  
  const criticalPointsCovered: string[] = [];
  const criticalPointsMissing: string[] = [];
  
  // Validar pontos críticos
  template.criticalPoints.forEach((point: any) => {
    const keywordsFound = point.keywords.filter((keyword: string) => 
      lowerContent.includes(keyword.toLowerCase())
    );
    
    if (keywordsFound.length >= 1) {
      criticalPointsCovered.push(point.title);
    } else {
      criticalPointsMissing.push(point.title);
    }
  });
  
  // Calcular score (0-100)
  const topicsScore = (topicsCovered.length / template.requiredTopics.length) * 70;
  const criticalScore = (criticalPointsCovered.length / template.criticalPoints.length) * 30;
  const score = Math.round(topicsScore + criticalScore);
  
  // Gerar sugestões
  const suggestions: string[] = [];
  if (topicsMissing.length > 0) {
    suggestions.push(`Adicionar conteúdo sobre: ${topicsMissing.join(', ')}`);
  }
  if (criticalPointsMissing.length > 0) {
    suggestions.push(`Incluir pontos críticos: ${criticalPointsMissing.join(', ')}`);
  }
  if (score < 80) {
    suggestions.push('Ampliar detalhamento dos tópicos existentes');
  }
  
  return {
    score,
    topicsCovered,
    topicsMissing,
    criticalPointsCovered,
    criticalPointsMissing,
    suggestions,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { nrType, content, projectId } = await req.json();
    
    if (!nrType || !content) {
      return NextResponse.json(
        { error: 'Tipo de NR e conteúdo são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Buscar template da NR
    const template = NR_TEMPLATES[nrType];
    if (!template) {
      return NextResponse.json(
        { error: 'Template NR não encontrado' },
        { status: 404 }
      );
    }
    
    // Validar conteúdo
    const validation = validateContent(content, template);
    
    // Salvar resultado no banco (se projectId fornecido)
    if (projectId) {
      await prisma.complianceValidation.create({
        data: {
          projectId,
          nrType,
          score: validation.score,
          topicsCovered: validation.topicsCovered,
          topicsMissing: validation.topicsMissing,
          criticalPointsCovered: validation.criticalPointsCovered,
          criticalPointsMissing: validation.criticalPointsMissing,
          suggestions: validation.suggestions,
          validatedAt: new Date(),
        },
      });
    }
    
    return NextResponse.json({
      success: true,
      nrType: template.id,
      nrTitle: template.title,
      validation,
      complianceStatus: validation.score >= 80 ? 'compliant' : validation.score >= 60 ? 'partial' : 'non-compliant',
    });
    
  } catch (error) {
    console.error('Erro na validação de compliance:', error);
    return NextResponse.json(
      { error: 'Erro na validação de compliance' },
      { status: 500 }
    );
  }
}

// GET: Listar templates NR disponíveis
export async function GET() {
  const templates = Object.values(NR_TEMPLATES).map(t => ({
    id: t.id,
    title: t.title,
    topicsCount: t.requiredTopics.length,
    criticalPointsCount: t.criticalPoints.length,
  }));
  
  return NextResponse.json({ templates });
}
