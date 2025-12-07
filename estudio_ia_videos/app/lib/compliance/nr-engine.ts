/**
 * NR Compliance Engine
 * Motor de verificação de conformidade com Normas Regulamentadoras
 */

export type NRCode = 'NR-01' | 'NR-06' | 'NR-10' | 'NR-12' | 'NR-18' | 'NR-35';

export interface ComplianceResult {
  nr: string;
  nrName: string;
  status: 'compliant' | 'non_compliant' | 'warning';
  score: number;
  finalScore: number;
  requirementsMet: number;
  requirementsTotal: number;
  recommendations: string[];
  criticalPoints: string[];
  aiAnalysis: string;
  aiScore: number;
  confidence: number;
}

const NR_NAMES: Record<NRCode, string> = {
  'NR-01': 'Disposições Gerais',
  'NR-06': 'Equipamento de Proteção Individual',
  'NR-10': 'Segurança em Instalações e Serviços em Eletricidade',
  'NR-12': 'Segurança no Trabalho em Máquinas e Equipamentos',
  'NR-18': 'Condições e Meio Ambiente de Trabalho na Indústria da Construção',
  'NR-35': 'Trabalho em Altura'
};

export async function checkCompliance(
  nr: NRCode,
  content: unknown,
  useAi: boolean = false
): Promise<ComplianceResult> {
  // Simulação de análise
  // Em produção, isso usaria um LLM ou regras complexas
  
  const nrName = NR_NAMES[nr] || nr;
  
  // Mock result
  const result: ComplianceResult = {
    nr,
    nrName,
    status: 'compliant',
    score: 95,
    finalScore: 95,
    requirementsMet: 19,
    requirementsTotal: 20,
    recommendations: [
      'Adicionar referência explícita ao item 10.2.3',
      'Melhorar descrição dos EPIs necessários'
    ],
    criticalPoints: [],
    aiAnalysis: useAi 
      ? `Análise AI completa para ${nr}: O conteúdo está bem estruturado e atende à maioria dos requisitos.`
      : 'Análise básica realizada.',
    aiScore: 98,
    confidence: 0.95
  };

  // Simples validação baseada em conteúdo (mock)
  if (typeof content === 'string' && content.length < 100) {
    result.status = 'warning';
    result.score = 60;
    result.finalScore = 60;
    result.recommendations.push('Conteúdo muito curto para análise detalhada');
  }

  return result;
}

export const nrEngine = {
  checkCompliance
};
