

/**
 * 🛡️ Sistema de Detecção de Compliance NR
 * Análise Automática de Conformidade Regulamentária
 */

'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Award,
  TrendingUp,
  Brain,
  Zap,
  Target,
  Activity,
  BarChart3,
  Settings,
  Sparkles
} from 'lucide-react';

interface ComplianceRule {
  id: string;
  nr: string;
  rule: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'compliant' | 'partial' | 'non-compliant' | 'not-applicable';
  score: number;
  suggestions?: string[];
  reference?: string;
}

interface ComplianceReport {
  overallScore: number;
  totalRules: number;
  compliantRules: number;
  criticalIssues: number;
  recommendations: string[];
  detectedNRs: string[];
  rules: ComplianceRule[];
  lastAnalysis: string;
}

interface ComplianceDetectorProps {
  content?: string;
  projectType?: string;
  onComplianceUpdate?: (report: ComplianceReport) => void;
}

export default function ComplianceDetector({ 
  content, 
  projectType = 'training',
  onComplianceUpdate 
}: ComplianceDetectorProps) {
  const [report, setReport] = useState<ComplianceReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [selectedNR, setSelectedNR] = useState<string>('all');

  useEffect(() => {
    if (content) {
      analyzeCompliance();
    }
  }, [content]);

  const analyzeCompliance = async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    try {
      // Simular análise progressiva
      const stages = [
        'Identificando NRs aplicáveis...',
        'Analisando conteúdo...',
        'Verificando conformidade...',
        'Gerando recomendações...',
        'Finalizando relatório...'
      ];

      for (let i = 0; i < stages.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 800));
        setAnalysisProgress((i + 1) * 20);
      }

      // Gerar relatório simulado
      const mockReport = generateMockComplianceReport();
      setReport(mockReport);
      
      if (onComplianceUpdate) {
        onComplianceUpdate(mockReport);
      }
    } catch (error) {
      logger.error('Erro na análise de compliance', error instanceof Error ? error : new Error(String(error)), { component: 'ComplianceDetector' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateMockComplianceReport = (): ComplianceReport => {
    const nrs = ['NR-06', 'NR-10', 'NR-12', 'NR-17', 'NR-35'];
    const detectedNRs = nrs.slice(0, Math.floor(Math.random() * 3) + 1);
    
    const rules: ComplianceRule[] = [
      {
        id: '1',
        nr: 'NR-06',
        rule: 'Fornecimento gratuito de EPIs',
        description: 'Empregador deve fornecer EPIs adequados gratuitamente',
        severity: 'critical',
        status: 'compliant',
        score: 100,
        suggestions: ['Documentar entrega de EPIs', 'Manter registros atualizados'],
        reference: 'NR-06 item 6.6.1'
      },
      {
        id: '2',
        nr: 'NR-10',
        rule: 'Treinamento em segurança elétrica',
        description: 'Trabalhadores devem receber treinamento específico',
        severity: 'high',
        status: 'partial',
        score: 75,
        suggestions: ['Incluir mais horas de treinamento prático', 'Adicionar avaliação periódica'],
        reference: 'NR-10 item 10.8'
      },
      {
        id: '3',
        nr: 'NR-12',
        rule: 'Dispositivos de segurança em máquinas',
        description: 'Máquinas devem ter proteções adequadas',
        severity: 'critical',
        status: 'non-compliant',
        score: 45,
        suggestions: ['Instalar proteções físicas', 'Implementar sistema de parada de emergência', 'Realizar avaliação de riscos'],
        reference: 'NR-12 item 12.38'
      },
      {
        id: '4',
        nr: 'NR-17',
        rule: 'Análise ergonômica do trabalho',
        description: 'Realizar AET quando necessário',
        severity: 'medium',
        status: 'compliant',
        score: 90,
        suggestions: ['Manter documentação atualizada'],
        reference: 'NR-17 item 17.1.2'
      },
      {
        id: '5',
        nr: 'NR-35',
        rule: 'Sistema de proteção contra quedas',
        description: 'Implementar medidas de proteção coletiva e individual',
        severity: 'critical',
        status: 'partial',
        score: 65,
        suggestions: ['Melhorar sinalização', 'Treinar sobre uso de cinturão de segurança'],
        reference: 'NR-35 item 35.4'
      }
    ];

    const compliantRules = rules.filter(r => r.status === 'compliant').length;
    const criticalIssues = rules.filter(r => r.severity === 'critical' && r.status !== 'compliant').length;
    const overallScore = Math.round(rules.reduce((acc, rule) => acc + rule.score, 0) / rules.length);

    return {
      overallScore,
      totalRules: rules.length,
      compliantRules,
      criticalIssues,
      recommendations: [
        'Priorizar correção de issues críticas',
        'Implementar treinamentos periódicos',
        'Manter documentação atualizada',
        'Realizar auditorias internas regulares'
      ],
      detectedNRs,
      rules,
      lastAnalysis: new Date().toISOString()
    };
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      low: 'text-blue-600',
      medium: 'text-yellow-600',
      high: 'text-orange-600',
      critical: 'text-red-600'
    };
    return colors[severity as keyof typeof colors] || 'text-gray-600';
  };

  const getSeverityBadge = (severity: string) => {
    const badges = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return badges[severity as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'partial':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'non-compliant':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      compliant: 'bg-green-100 text-green-800',
      partial: 'bg-yellow-100 text-yellow-800',
      'non-compliant': 'bg-red-100 text-red-800',
      'not-applicable': 'bg-gray-100 text-gray-800'
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const filteredRules = report?.rules.filter(rule => 
    selectedNR === 'all' || rule.nr === selectedNR
  ) || [];

  if (isAnalyzing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-6 w-6 text-purple-600 animate-pulse" />
            <span>Análise de Compliance em Progresso</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Analisando conformidade regulamentária...</span>
            <span className="text-sm text-gray-500">{analysisProgress}%</span>
          </div>
          <Progress value={analysisProgress} className="h-3" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-sm font-medium">Identificando NRs</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Shield className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-sm font-medium">Verificando Conformidade</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Target className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-sm font-medium">Gerando Recomendações</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!report) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-blue-600" />
            <span>Detector de Compliance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <Brain className="h-16 w-16 text-gray-400 mx-auto" />
            <div>
              <div className="text-lg font-medium">Aguardando Conteúdo</div>
              <div className="text-sm text-gray-500">
                Carregue um projeto para iniciar a análise de compliance
              </div>
            </div>
            <Button onClick={analyzeCompliance} className="bg-blue-600">
              <Zap className="h-4 w-4 mr-2" />
              Iniciar Análise
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-blue-600" />
              <span>Relatório de Compliance</span>
            </div>
            <Button
              onClick={analyzeCompliance}
              variant="outline"
              size="sm"
              className="text-blue-600"
            >
              <Activity className="h-4 w-4 mr-2" />
              Reanalisar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
              <div className="text-3xl font-bold text-green-600">
                {report.overallScore}%
              </div>
              <div className="text-sm text-gray-600">Score Geral</div>
              <Progress value={report.overallScore} className="h-2 mt-2" />
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">
                {report.compliantRules}/{report.totalRules}
              </div>
              <div className="text-sm text-gray-600">Regras Conformes</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-lg">
              <div className="text-3xl font-bold text-red-600">
                {report.criticalIssues}
              </div>
              <div className="text-sm text-gray-600">Issues Críticas</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">
                {report.detectedNRs.length}
              </div>
              <div className="text-sm text-gray-600">NRs Detectadas</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* NRs Detectadas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <span>NRs Aplicáveis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {report.detectedNRs.map((nr) => (
              <Badge key={nr} className="bg-blue-100 text-blue-800">
                {nr}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Análise Detalhada */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <span>Análise Detalhada</span>
            </div>
            <select 
              value={selectedNR} 
              onChange={(e) => setSelectedNR(e.target.value)}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="all">Todas as NRs</option>
              {report.detectedNRs.map(nr => (
                <option key={nr} value={nr}>{nr}</option>
              ))}
            </select>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredRules.map((rule) => (
              <div key={rule.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(rule.status)}
                      <Badge className="bg-orange-100 text-orange-800">
                        {rule.nr}
                      </Badge>
                      <span className="font-medium">{rule.rule}</span>
                    </div>
                    <p className="text-sm text-gray-600">{rule.description}</p>
                    {rule.reference && (
                      <div className="text-xs text-gray-500">
                        Referência: {rule.reference}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right space-y-1">
                    <Badge className={getSeverityBadge(rule.severity)}>
                      {rule.severity.toUpperCase()}
                    </Badge>
                    <div className="text-sm">
                      <Badge className={getStatusBadge(rule.status)}>
                        {rule.status.replace('-', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-lg font-bold text-blue-600">
                      {rule.score}%
                    </div>
                  </div>
                </div>

                {rule.suggestions && rule.suggestions.length > 0 && (
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <div className="text-sm font-medium text-yellow-800 mb-2">
                      Sugestões de Melhoria:
                    </div>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      {rule.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <TrendingUp className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recomendações Gerais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <span>Recomendações Prioritárias</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {report.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start space-x-3">
                <Award className="h-5 w-5 text-blue-600 mt-0.5" />
                <span className="text-sm">{rec}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {report.criticalIssues > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Atenção:</strong> {report.criticalIssues} issue{report.criticalIssues > 1 ? 's' : ''} crítica{report.criticalIssues > 1 ? 's' : ''} encontrada{report.criticalIssues > 1 ? 's' : ''}. 
            Recomenda-se correção imediata para garantir conformidade regulamentária.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

