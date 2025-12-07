'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAdvancedAI } from './useAdvancedAI';
import { useRealTimeCollaboration } from './useRealTimeCollaboration';
import type { OptimizableContentInput } from './useAdvancedAI';
import type { SerializedProjectState } from './useRealTimeCollaboration';

export type ComplianceAnalyzableContent =
  | ComplianceProjectData
  | ComplianceChangeSet
  | OptimizableContentInput;

export interface ComplianceProjectData {
  id?: string;
  state?: SerializedProjectState;
  metadata?: Record<string, unknown>;
  content?: OptimizableContentInput;
  assets?: Record<string, unknown>;
  summary?: string;
  [key: string]: unknown;
}

export interface ComplianceChangeEvent {
  id?: string;
  elementId?: string;
  layerId?: string;
  type: 'element' | 'layer' | 'timeline' | 'metadata' | 'asset';
  payload: Record<string, unknown>;
  occurredAt?: Date;
}

export interface ComplianceChangeSet {
  projectId?: string;
  changes: ComplianceChangeEvent[];
  summary?: string;
  metadata?: Record<string, unknown>;
}

export interface ComplianceReportComparison {
  reportA: ComplianceReport | null;
  reportB: ComplianceReport | null;
  differences: ComplianceViolation[];
  summary: {
    improved: number;
    regressed: number;
    unchanged: number;
  };
}

export interface ComplianceTrendOverview {
  timeframe: 'week' | 'month' | 'quarter';
  scoreTrend: Array<{ date: Date; score: number }>;
  violationHeatmap: Record<string, number>;
  topImprovementAreas: string[];
}

// Interfaces para Compliance
export interface ComplianceRule {
  id: string;
  nrStandard: string;
  category: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  autoFixable: boolean;
  checkFunction: (content: ComplianceAnalyzableContent) => ComplianceViolation[];
  suggestedFix?: string;
  references: string[];
}

export interface ComplianceViolation {
  id: string;
  ruleId: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  location: {
    elementId?: string;
    layerId?: string;
    timeframe?: { start: number; end: number };
    coordinates?: { x: number; y: number };
  };
  suggestedFix: string;
  autoFixable: boolean;
  impact: string;
  priority: number;
}

export interface ComplianceReport {
  id: string;
  projectId: string;
  timestamp: Date;
  overallScore: number;
  violations: ComplianceViolation[];
  passedRules: string[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };
  recommendations: ComplianceRecommendation[];
  nrStandardsCompliance: Record<string, number>;
  accessibilityScore: number;
  safetyScore: number;
  estimatedFixTime: number;
}

export interface ComplianceRecommendation {
  id: string;
  type: 'improvement' | 'optimization' | 'best-practice';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  category: string;
  implementation: string;
  expectedBenefit: string;
}

export interface ComplianceMonitoring {
  isActive: boolean;
  interval: number;
  lastCheck: Date | null;
  autoFix: boolean;
  notifications: boolean;
  realTimeAnalysis: boolean;
}

export interface ComplianceHistory {
  reports: ComplianceReport[];
  trends: {
    scoreHistory: Array<{ date: Date; score: number }>;
    violationTrends: Record<string, number[]>;
    improvementAreas: string[];
  };
}

export interface UseComplianceAnalyzerReturn {
  // Estado
  currentReport: ComplianceReport | null;
  isAnalyzing: boolean;
  monitoring: ComplianceMonitoring;
  history: ComplianceHistory;
  rules: ComplianceRule[];
  
  // Análise
  analyzeProject: (projectData: ComplianceProjectData) => Promise<ComplianceReport>;
  analyzeContent: (content: ComplianceAnalyzableContent) => Promise<ComplianceViolation[]>;
  analyzeRealTime: (changes: ComplianceChangeSet) => Promise<ComplianceViolation[]>;
  
  // Correções
  autoFixViolations: (violations: ComplianceViolation[]) => Promise<Record<string, boolean>>;
  applyFix: (violationId: string) => Promise<boolean>;
  getSuggestedFixes: (violation: ComplianceViolation) => Promise<string[]>;
  
  // Relatórios
  generateReport: (projectId: string) => Promise<ComplianceReport>;
  exportReport: (format: 'pdf' | 'json' | 'csv') => Promise<Blob>;
  compareReports: (reportA: string, reportB: string) => Promise<ComplianceReportComparison>;
  
  // Monitoramento
  startMonitoring: (config: Partial<ComplianceMonitoring>) => void;
  stopMonitoring: () => void;
  updateMonitoringConfig: (config: Partial<ComplianceMonitoring>) => void;
  
  // Regras
  addCustomRule: (rule: Omit<ComplianceRule, 'id'>) => void;
  updateRule: (ruleId: string, updates: Partial<ComplianceRule>) => void;
  disableRule: (ruleId: string) => void;
  enableRule: (ruleId: string) => void;
  
  // Histórico
  getComplianceHistory: (projectId: string) => Promise<ComplianceHistory>;
  getTrends: (timeframe: 'week' | 'month' | 'quarter') => Promise<ComplianceTrendOverview>;
  
  // Recomendações
  getComplianceRecommendations: (projectData: ComplianceProjectData) => Promise<ComplianceRecommendation[]>;
  implementRecommendation: (recommendationId: string) => Promise<boolean>;
  
  // Integração
  syncWithNRDatabase: () => Promise<void>;
  validateAgainstStandards: (standards: string[]) => Promise<ComplianceReport>;
  
  // Utilitários
  calculateComplianceScore: (violations: ComplianceViolation[]) => number;
  prioritizeViolations: (violations: ComplianceViolation[]) => ComplianceViolation[];
  estimateFixTime: (violations: ComplianceViolation[]) => number;
}

export const useComplianceAnalyzer = (): UseComplianceAnalyzerReturn => {
  const [currentReport, setCurrentReport] = useState<ComplianceReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [monitoring, setMonitoring] = useState<ComplianceMonitoring>({
    isActive: false,
    interval: 30000, // 30 segundos
    lastCheck: null,
    autoFix: false,
    notifications: true,
    realTimeAnalysis: true,
  });
  const [history, setHistory] = useState<ComplianceHistory>({
    reports: [],
    trends: {
      scoreHistory: [],
      violationTrends: {},
      improvementAreas: [],
    },
  });
  const [rules, setRules] = useState<ComplianceRule[]>([]);

  const { generateContent } = useAdvancedAI();
  const { broadcastUpdate } = useRealTimeCollaboration();
  const monitoringInterval = useRef<NodeJS.Timeout | null>(null);

  // Inicializar regras padrão
  useEffect(() => {
    initializeDefaultRules();
  }, []);

  const initializeDefaultRules = useCallback(() => {
    const defaultRules: ComplianceRule[] = [
      {
        id: 'nr12-safety-distance',
        nrStandard: 'NR-12',
        category: 'Segurança de Máquinas',
        title: 'Distância de Segurança',
        description: 'Verificar se as distâncias de segurança estão adequadas',
        severity: 'critical',
        autoFixable: true,
        checkFunction: (content) => {
          // Lógica de verificação
          return [];
        },
        suggestedFix: 'Ajustar distâncias conforme NR-12',
        references: ['NR-12.38', 'NR-12.39'],
      },
      {
        id: 'nr35-height-safety',
        nrStandard: 'NR-35',
        category: 'Trabalho em Altura',
        title: 'Equipamentos de Proteção',
        description: 'Verificar uso correto de EPIs para trabalho em altura',
        severity: 'critical',
        autoFixable: false,
        checkFunction: (content) => {
          return [];
        },
        references: ['NR-35.2', 'NR-35.3'],
      },
      {
        id: 'accessibility-contrast',
        nrStandard: 'WCAG',
        category: 'Acessibilidade',
        title: 'Contraste de Cores',
        description: 'Verificar contraste adequado para acessibilidade',
        severity: 'medium',
        autoFixable: true,
        checkFunction: (content) => {
          return [];
        },
        suggestedFix: 'Ajustar cores para contraste mínimo de 4.5:1',
        references: ['WCAG 2.1 AA'],
      },
    ];

    setRules(defaultRules);
  }, []);

  const analyzeProject = useCallback(async (
    projectData: ComplianceProjectData
  ): Promise<ComplianceReport> => {
    setIsAnalyzing(true);
    
    try {
      const violations: ComplianceViolation[] = [];
      const passedRules: string[] = [];

      // Executar todas as regras
      for (const rule of rules) {
        try {
          const ruleViolations = rule.checkFunction(projectData);
          if (ruleViolations.length > 0) {
            violations.push(...ruleViolations);
          } else {
            passedRules.push(rule.id);
          }
        } catch (error) {
          console.error(`Erro ao executar regra ${rule.id}:`, error);
        }
      }

      // Calcular scores
      const overallScore = calculateComplianceScore(violations);
      const accessibilityScore = calculateAccessibilityScore(violations);
      const safetyScore = calculateSafetyScore(violations);

      // Gerar recomendações
      const recommendations = await getComplianceRecommendations(projectData);

      // Calcular compliance por NR
      const nrStandardsCompliance = calculateNRCompliance(violations);

      const report: ComplianceReport = {
        id: `report-${Date.now()}`,
        projectId: projectData.id || 'unknown',
        timestamp: new Date(),
        overallScore,
        violations: prioritizeViolations(violations),
        passedRules,
        summary: {
          critical: violations.filter(v => v.severity === 'critical').length,
          high: violations.filter(v => v.severity === 'high').length,
          medium: violations.filter(v => v.severity === 'medium').length,
          low: violations.filter(v => v.severity === 'low').length,
          total: violations.length,
        },
        recommendations,
        nrStandardsCompliance,
        accessibilityScore,
        safetyScore,
        estimatedFixTime: estimateFixTime(violations),
      };

      setCurrentReport(report);
      
      // Atualizar histórico
      setHistory(prev => ({
        ...prev,
        reports: [report, ...prev.reports.slice(0, 49)], // Manter últimos 50
        trends: {
          ...prev.trends,
          scoreHistory: [
            { date: new Date(), score: overallScore },
            ...prev.trends.scoreHistory.slice(0, 29)
          ],
        },
      }));

      // Broadcast para colaboradores
      broadcastUpdate('compliance-report', report);

      return report;
    } finally {
      setIsAnalyzing(false);
    }
  }, [rules, broadcastUpdate]);

  const analyzeContent = useCallback(async (
    content: ComplianceAnalyzableContent
  ): Promise<ComplianceViolation[]> => {
    const violations: ComplianceViolation[] = [];

    for (const rule of rules) {
      try {
        const ruleViolations = rule.checkFunction(content);
        violations.push(...ruleViolations);
      } catch (error) {
        console.error(`Erro ao analisar conteúdo com regra ${rule.id}:`, error);
      }
    }

    return violations;
  }, [rules]);

  const analyzeRealTime = useCallback(async (
    changes: ComplianceChangeSet
  ): Promise<ComplianceViolation[]> => {
    if (!monitoring.realTimeAnalysis) return [];

    // Análise rápida apenas das mudanças
    const relevantRules = rules.filter(rule => 
      rule.severity === 'critical' || rule.severity === 'high'
    );

    const violations: ComplianceViolation[] = [];

    for (const rule of relevantRules) {
      try {
        const ruleViolations = rule.checkFunction(changes);
        violations.push(...ruleViolations);
      } catch (error) {
        console.error(`Erro na análise em tempo real:`, error);
      }
    }

    return violations;
  }, [rules, monitoring.realTimeAnalysis]);

  const applyFix = useCallback(async (violationId: string): Promise<boolean> => {
    // Implementar lógica de correção específica
    try {
      // Simular correção
      await new Promise(resolve => setTimeout(resolve, 1000));
      return true;
    } catch (error) {
      console.error(`Erro ao aplicar correção:`, error);
      return false;
    }
  }, []);

  const autoFixViolations = useCallback(async (
    violations: ComplianceViolation[]
  ): Promise<Record<string, boolean>> => {
    const fixableViolations = violations.filter(v => v.autoFixable);
    const fixes: Record<string, boolean> = {};

    for (const violation of fixableViolations) {
      try {
        // Aplicar correção automática
        const fix = await applyFix(violation.id);
        if (fix) {
          fixes[violation.id] = true;
        }
      } catch (error) {
        console.error(`Erro ao corrigir violação ${violation.id}:`, error);
        fixes[violation.id] = false;
      }
    }

    return fixes;
  }, [applyFix]);

  const getSuggestedFixes = useCallback(async (violation: ComplianceViolation): Promise<string[]> => {
    try {
      const result = await generateContent({
        type: 'text',
        prompt: `Gere sugestões de correção para a violação de compliance: ${violation.message}`,
        model: 'gpt-4',
        parameters: {},
        context: {
             previousContent: JSON.stringify(violation)
        }
      });

      const suggestionsText = result?.content && typeof result.content === 'string' ? result.content : '';

      return [
        violation.suggestedFix,
        ...suggestionsText.split('\n').filter(s => s.trim()),
      ];
    } catch (error) {
      console.error('Erro ao gerar sugestões:', error);
      return [violation.suggestedFix];
    }
  }, [generateContent]);

  const generateReport = useCallback(async (projectId: string): Promise<ComplianceReport> => {
    // Buscar dados do projeto e gerar relatório
    const projectData = { id: projectId }; // Buscar dados reais
    return analyzeProject(projectData);
  }, [analyzeProject]);

  const exportReport = useCallback(async (format: 'pdf' | 'json' | 'csv'): Promise<Blob> => {
    if (!currentReport) {
      throw new Error('Nenhum relatório disponível para exportação');
    }

    switch (format) {
      case 'json':
        return new Blob([JSON.stringify(currentReport, null, 2)], {
          type: 'application/json',
        });
      case 'csv':
        const csvData = generateCSVFromReport(currentReport);
        return new Blob([csvData], { type: 'text/csv' });
      case 'pdf':
        // Implementar geração de PDF
        throw new Error('Exportação PDF não implementada ainda');
      default:
        throw new Error(`Formato ${format} não suportado`);
    }
  }, [currentReport]);

  const startMonitoring = useCallback((config: Partial<ComplianceMonitoring>) => {
    setMonitoring(prev => ({ ...prev, ...config, isActive: true }));

    if (monitoringInterval.current) {
      clearInterval(monitoringInterval.current);
    }

    monitoringInterval.current = setInterval(async () => {
      setMonitoring(prev => ({ ...prev, lastCheck: new Date() }));
      
      // Executar verificação automática
      if (monitoring.autoFix) {
        // Implementar verificação e correção automática
      }
    }, config.interval || monitoring.interval);
  }, [monitoring.interval, monitoring.autoFix]);

  const stopMonitoring = useCallback(() => {
    setMonitoring(prev => ({ ...prev, isActive: false }));
    
    if (monitoringInterval.current) {
      clearInterval(monitoringInterval.current);
      monitoringInterval.current = null;
    }
  }, []);

  const calculateComplianceScore = useCallback((violations: ComplianceViolation[]): number => {
    if (violations.length === 0) return 100;

    const weights = { critical: 25, high: 10, medium: 5, low: 1 };
    const totalPenalty = violations.reduce((sum, v) => sum + weights[v.severity], 0);
    
    return Math.max(0, 100 - totalPenalty);
  }, []);

  const calculateAccessibilityScore = useCallback((violations: ComplianceViolation[]): number => {
    const accessibilityViolations = violations.filter(v => 
      rules.find(r => r.id === v.ruleId)?.category === 'Acessibilidade'
    );
    
    return calculateComplianceScore(accessibilityViolations);
  }, [rules, calculateComplianceScore]);

  const calculateSafetyScore = useCallback((violations: ComplianceViolation[]): number => {
    const safetyViolations = violations.filter(v => {
      const rule = rules.find(r => r.id === v.ruleId);
      return rule?.nrStandard.startsWith('NR-');
    });
    
    return calculateComplianceScore(safetyViolations);
  }, [rules, calculateComplianceScore]);

  const calculateNRCompliance = useCallback((violations: ComplianceViolation[]): Record<string, number> => {
    const nrStandards: Record<string, number> = {};

    rules.forEach(rule => {
      if (rule.nrStandard.startsWith('NR-')) {
        if (!nrStandards[rule.nrStandard]) {
          nrStandards[rule.nrStandard] = 100;
        }

        const ruleViolations = violations.filter(v => v.ruleId === rule.id);
        if (ruleViolations.length > 0) {
          nrStandards[rule.nrStandard] -= ruleViolations.length * 10;
        }
      }
    });

    return nrStandards;
  }, [rules]);

  const prioritizeViolations = useCallback((violations: ComplianceViolation[]): ComplianceViolation[] => {
    return violations.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity] || b.priority - a.priority;
    });
  }, []);

  const estimateFixTime = useCallback((violations: ComplianceViolation[]): number => {
    const timeEstimates = { critical: 120, high: 60, medium: 30, low: 15 };
    
    return violations.reduce((total, v) => {
      const baseTime = timeEstimates[v.severity];
      return total + (v.autoFixable ? baseTime * 0.2 : baseTime);
    }, 0);
  }, []);

  const getComplianceRecommendations = useCallback(async (
    projectData: ComplianceProjectData
  ): Promise<ComplianceRecommendation[]> => {
    const recommendations: ComplianceRecommendation[] = [
      {
        id: 'rec-1',
        type: 'improvement',
        title: 'Melhorar Contraste de Cores',
        description: 'Aumentar o contraste para melhor acessibilidade',
        impact: 'medium',
        effort: 'low',
        category: 'Acessibilidade',
        implementation: 'Ajustar cores do tema para contraste mínimo 4.5:1',
        expectedBenefit: 'Melhor experiência para usuários com deficiência visual',
      },
    ];

    if (projectData.summary) {
      recommendations.push({
        id: 'rec-2',
        type: 'optimization',
        title: 'Atualizar sumário de segurança',
        description: 'Revise o sumário para incluir referências atualizadas das NR aplicáveis.',
        impact: 'high',
        effort: 'medium',
        category: 'Segurança',
        implementation: 'Alinhar o sumário com as últimas revisões das normas regulatórias.',
        expectedBenefit: 'Garante conformidade documental e reduz riscos operacionais.',
      });
    }

    return recommendations;
  }, []);

  const generateCSVFromReport = useCallback((report: ComplianceReport): string => {
    const headers = ['ID', 'Severidade', 'Mensagem', 'Localização', 'Correção Sugerida'];
    const rows = report.violations.map(v => [
      v.id,
      v.severity,
      v.message,
      JSON.stringify(v.location),
      v.suggestedFix,
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }, []);

  const compareReports = useCallback(async (
    reportAId: string,
    reportBId: string
  ): Promise<ComplianceReportComparison> => {
    const reportA = history.reports.find(report => report.id === reportAId) ?? null;
    const reportB = history.reports.find(report => report.id === reportBId) ?? null;

    const differences: ComplianceViolation[] = [];

    if (reportA && reportB) {
      const reportAViolations = new Map(reportA.violations.map(v => [v.id, v]));
      reportB.violations.forEach(violation => {
        if (!reportAViolations.has(violation.id)) {
          differences.push(violation);
        }
      });
    }

    const summary = {
      improved:
        reportA && reportB
          ? Math.max(reportA.summary.total - reportB.summary.total, 0)
          : 0,
      regressed:
        reportA && reportB
          ? Math.max(reportB.summary.total - reportA.summary.total, 0)
          : 0,
      unchanged:
        reportA && reportB
          ? Math.min(reportA.summary.total, reportB.summary.total)
          : 0,
    };

    return {
      reportA,
      reportB,
      differences,
      summary,
    };
  }, [history.reports]);

  const getComplianceHistory = useCallback(async (_projectId: string): Promise<ComplianceHistory> => {
    return history;
  }, [history]);

  const getTrends = useCallback(async (
    timeframe: 'week' | 'month' | 'quarter'
  ): Promise<ComplianceTrendOverview> => {
    const timeframeDays: Record<typeof timeframe, number> = {
      week: 7,
      month: 30,
      quarter: 90,
    } as const;

    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - timeframeDays[timeframe]);

    const scoreTrend = history.trends.scoreHistory
      .filter(entry => entry.date >= start)
      .map(entry => ({ date: new Date(entry.date), score: entry.score }));

    const violationHeatmap: Record<string, number> = {};
    history.reports.forEach(report => {
      if (report.timestamp >= start) {
        report.violations.forEach(violation => {
          violationHeatmap[violation.ruleId] = (violationHeatmap[violation.ruleId] ?? 0) + 1;
        });
      }
    });

    const topImprovementAreas = Object.entries(violationHeatmap)
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, 5)
      .map(([ruleId]) => ruleId);

    return {
      timeframe,
      scoreTrend,
      violationHeatmap,
      topImprovementAreas,
    };
  }, [history]);

  const implementRecommendation = useCallback(async (recommendationId: string): Promise<boolean> => {
    console.info('Implementação pendente para recomendação:', recommendationId);
    return true;
  }, []);

  const syncWithNRDatabase = useCallback(async (): Promise<void> => {
    // Placeholder para integração futura com base oficial
  }, []);

  const validateAgainstStandards = useCallback(async (
    standards: string[]
  ): Promise<ComplianceReport> => {
    if (!currentReport) {
      throw new Error('Nenhum relatório disponível para validação');
    }

    const updatedCompliance = { ...currentReport.nrStandardsCompliance };
    standards.forEach(standard => {
      if (!(standard in updatedCompliance)) {
        updatedCompliance[standard] = 0;
      }
    });

    return {
      ...currentReport,
      nrStandardsCompliance: updatedCompliance,
    };
  }, [currentReport]);

  const updateMonitoringConfig = useCallback((config: Partial<ComplianceMonitoring>) => {
    setMonitoring(prev => ({ ...prev, ...config }));
  }, []);

  const addCustomRule = useCallback((rule: Omit<ComplianceRule, 'id'>) => {
    setRules(prev => [...prev, { ...rule, id: `custom-${Date.now()}` }]);
  }, []);

  const updateRule = useCallback((ruleId: string, updates: Partial<ComplianceRule>) => {
    setRules(prev => prev.map(r => (r.id === ruleId ? { ...r, ...updates } : r)));
  }, []);

  const disableRule = useCallback((ruleId: string) => {
    setRules(prev => prev.filter(r => r.id !== ruleId));
  }, []);

  const enableRule = useCallback((_ruleId: string) => {
    // Implementação futura
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (monitoringInterval.current) {
        clearInterval(monitoringInterval.current);
      }
    };
  }, []);

  return {
    // Estado
    currentReport,
    isAnalyzing,
    monitoring,
    history,
    rules,
    
    // Análise
    analyzeProject,
    analyzeContent,
    analyzeRealTime,
    
    // Correções
    autoFixViolations,
    applyFix,
    getSuggestedFixes,
    
    // Relatórios
    generateReport,
    exportReport,
    compareReports,
    
    // Monitoramento
    startMonitoring,
    stopMonitoring,
    updateMonitoringConfig,
    
    // Regras
    addCustomRule,
    updateRule,
    disableRule,
    enableRule,
    
    // Histórico
    getComplianceHistory,
    getTrends,
    
    // Recomendações
    getComplianceRecommendations,
    implementRecommendation,
    
    // Integração
    syncWithNRDatabase,
    validateAgainstStandards,
    
    // Utilitários
    calculateComplianceScore,
    prioritizeViolations,
    estimateFixTime,
  };
};