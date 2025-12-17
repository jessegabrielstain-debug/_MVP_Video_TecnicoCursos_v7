'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Download,
  TrendingUp,
  Clock,
  Zap,
  Target,
  BarChart3,
  Activity
} from 'lucide-react';
import { 
  useComplianceAnalyzer, 
  ComplianceReport, 
  ComplianceViolation,
  ComplianceProjectData
} from '@/hooks/useComplianceAnalyzer';
import { Template } from '@/types/templates';

interface ComplianceDashboardProps {
  template?: Template;
  showRealTime?: boolean;
  className?: string;
}

export const ComplianceDashboard: React.FC<ComplianceDashboardProps> = ({
  template,
  showRealTime = false,
  className = ''
}) => {
  const {
    isAnalyzing,
    currentReport,
    analyzeProject,
    applyFix,
    implementRecommendation,
    startMonitoring,
    stopMonitoring,
    generateReport
  } = useComplianceAnalyzer();

  const [activeTab, setActiveTab] = useState('overview');
  const [isRealTimeActive, setIsRealTimeActive] = useState(false);
  const [autoFixing, setAutoFixing] = useState<string | null>(null);
  const [applyingSuggestion, setApplyingSuggestion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Helper to convert Template to ComplianceProjectData
  const projectData: ComplianceProjectData | undefined = useMemo(() => {
    if (!template) return undefined;
    return {
      id: template.id,
      metadata: {
        name: template.name,
        description: template.description,
        category: template.category,
        ...template.metadata
      },
      // ComplianceProjectData accepts [key: string]: unknown, so we use unknown cast
      content: template.content as unknown as ComplianceProjectData['content'],
      assets: template.content.assets as unknown as ComplianceProjectData['assets']
    };
  }, [template]);

  const handleAnalyze = async () => {
    if (!projectData) return;
    setError(null);
    try {
      await analyzeProject(projectData);
    } catch (err) {
      logger.error('Error analyzing compliance', err instanceof Error ? err : new Error(String(err)), { component: 'ComplianceDashboard' });
      setError('Falha ao analisar compliance. Tente novamente.');
    }
  };

  useEffect(() => {
    if (projectData && !currentReport) {
      handleAnalyze();
    }
  }, [projectData, currentReport]);

  useEffect(() => {
    if (showRealTime && isRealTimeActive) {
      startMonitoring({ realTimeAnalysis: true });
    } else {
      stopMonitoring();
    }

    return () => stopMonitoring();
  }, [showRealTime, isRealTimeActive, startMonitoring, stopMonitoring]);

  const handleAutoFix = async (violationId: string) => {
    setAutoFixing(violationId);
    try {
      await applyFix(violationId);
      // Re-analyze after fix
      await handleAnalyze();
    } catch (err) {
      logger.error('Error applying fix', err instanceof Error ? err : new Error(String(err)), { violationId, component: 'ComplianceDashboard' });
      setError('Falha ao aplicar correção.');
    } finally {
      setAutoFixing(null);
    }
  };

  const handleApplySuggestion = async (recommendationId: string) => {
    setApplyingSuggestion(recommendationId);
    try {
      await implementRecommendation(recommendationId);
      await handleAnalyze();
    } catch (err) {
      logger.error('Error applying suggestion', err instanceof Error ? err : new Error(String(err)), { recommendationId, component: 'ComplianceDashboard' });
      setError('Falha ao aplicar sugestão.');
    } finally {
      setApplyingSuggestion(null);
    }
  };

  const handleDownloadReport = async () => {
    if (template) {
      try {
        const report = await generateReport(template.id);
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `compliance-report-${template.name}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        logger.error('Error downloading report', err instanceof Error ? err : new Error(String(err)), { templateId: template.id, component: 'ComplianceDashboard' });
        setError('Falha ao gerar relatório.');
      }
    }
  };

  const getStatusColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getStatusIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (score >= 70) return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    return <XCircle className="h-5 w-5 text-red-600" />;
  };

  // Helper to filter violations
  const getViolationsBySeverity = (severity: 'critical' | 'high' | 'medium' | 'low') => {
    return currentReport?.violations.filter(v => v.severity === severity) || [];
  };

  const criticalIssues = getViolationsBySeverity('critical');
  const highIssues = getViolationsBySeverity('high');
  const mediumIssues = getViolationsBySeverity('medium');
  const lowIssues = getViolationsBySeverity('low');
  
  // Group warnings (high/medium) and info (low)
  const warningIssues = [...highIssues, ...mediumIssues];
  const infoIssues = lowIssues;

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Erro na Análise de Compliance</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard de Compliance</h2>
          <p className="text-gray-600">
            Análise automática de conformidade NR em tempo real
          </p>
        </div>
        <div className="flex items-center gap-3">
          {showRealTime && (
            <Button
              variant={isRealTimeActive ? "destructive" : "outline"}
              size="sm"
              onClick={() => setIsRealTimeActive(!isRealTimeActive)}
            >
              <Activity className="h-4 w-4 mr-2" />
              {isRealTimeActive ? 'Parar Monitoramento' : 'Monitoramento em Tempo Real'}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
            Reanalisar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadReport}
            disabled={!currentReport}
          >
            <Download className="h-4 w-4 mr-2" />
            Relatório
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isAnalyzing && !currentReport && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Analisando compliance...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      {currentReport && (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className={`border-2 ${getStatusColor(currentReport.overallScore)}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Score de Compliance</p>
                    <p className="text-3xl font-bold">{Math.round(currentReport.overallScore)}%</p>
                  </div>
                  {getStatusIcon(currentReport.overallScore)}
                </div>
                <Progress value={currentReport.overallScore} className="mt-3" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Problemas Críticos</p>
                    <p className="text-3xl font-bold text-red-600">{criticalIssues.length}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avisos</p>
                    <p className="text-3xl font-bold text-yellow-600">{warningIssues.length}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Recomendações</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {currentReport.recommendations.length}
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analysis */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="issues">Problemas</TabsTrigger>
              <TabsTrigger value="suggestions">Sugestões</TabsTrigger>
              <TabsTrigger value="requirements">Requisitos</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Distribuição de Problemas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Críticos</span>
                        <Badge variant="destructive">{criticalIssues.length}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Avisos (Alto/Médio)</span>
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          {warningIssues.length}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Informativos (Baixo)</span>
                        <Badge variant="outline">{infoIssues.length}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Última Análise
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      {new Date(currentReport.timestamp).toLocaleString('pt-BR')}
                    </p>
                    {isRealTimeActive && (
                      <Badge variant="outline" className="mt-2 bg-green-50 text-green-700 border-green-200">
                        <Activity className="h-3 w-3 mr-1" />
                        Monitoramento Ativo
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="issues" className="space-y-4">
              {currentReport.violations.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Nenhum problema encontrado!
                    </h3>
                    <p className="text-gray-600">
                      O template está em conformidade com todas as regras NR.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {currentReport.violations.map((violation) => (
                    <Card key={violation.id} className={`border-l-4 ${
                      violation.severity === 'critical' ? 'border-l-red-500' :
                      (violation.severity === 'high' || violation.severity === 'medium') ? 'border-l-yellow-500' : 'border-l-blue-500'
                    }`}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant={
                                violation.severity === 'critical' ? 'destructive' :
                                (violation.severity === 'high' || violation.severity === 'medium') ? 'secondary' : 'outline'
                              }>
                                {violation.severity === 'critical' ? 'Crítico' :
                                 violation.severity === 'high' ? 'Alto' :
                                 violation.severity === 'medium' ? 'Médio' : 'Baixo'}
                              </Badge>
                              <Badge variant="outline">{violation.ruleId}</Badge>
                            </div>
                            <h4 className="font-semibold text-gray-900 mb-1">{violation.message}</h4>
                            <p className="text-gray-600 text-sm">{violation.suggestedFix}</p>
                            {violation.location?.elementId && (
                              <p className="text-xs text-gray-500 mt-2">
                                Elemento: {violation.location.elementId}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2 ml-4">
                            {violation.autoFixable && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAutoFix(violation.id)}
                                disabled={autoFixing === violation.id}
                              >
                                {autoFixing === violation.id ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Zap className="h-4 w-4" />
                                )}
                                Corrigir
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="suggestions" className="space-y-4">
              {currentReport.recommendations.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <TrendingUp className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Nenhuma sugestão no momento
                    </h3>
                    <p className="text-gray-600">
                      O template está otimizado conforme as melhores práticas.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {currentReport.recommendations.map((recommendation) => (
                    <Card key={recommendation.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">{recommendation.type}</Badge>
                              <Badge variant={
                                recommendation.impact === 'high' ? 'destructive' :
                                recommendation.impact === 'medium' ? 'secondary' : 'outline'
                              }>
                                Impacto: {recommendation.impact === 'high' ? 'Alto' :
                                         recommendation.impact === 'medium' ? 'Médio' : 'Baixo'}
                              </Badge>
                              <Badge variant="outline">
                                Esforço: {recommendation.effort === 'high' ? 'Alto' :
                                         recommendation.effort === 'medium' ? 'Médio' : 'Baixo'}
                              </Badge>
                            </div>
                            <h4 className="font-semibold text-gray-900 mb-1">{recommendation.title}</h4>
                            <p className="text-gray-600 text-sm">{recommendation.description}</p>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              size="sm"
                              onClick={() => handleApplySuggestion(recommendation.id)}
                              disabled={applyingSuggestion === recommendation.id}
                            >
                              {applyingSuggestion === recommendation.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <Zap className="h-4 w-4" />
                              )}
                              Aplicar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="requirements" className="space-y-4">
              <div className="space-y-4">
                {Object.entries(currentReport.nrStandardsCompliance || {}).map(([standard, score]) => (
                  <Card key={standard}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={
                              score >= 100 ? 'default' :
                              score >= 50 ? 'secondary' : 'destructive'
                            }>
                              {score >= 100 ? 'Atendido' :
                               score >= 50 ? 'Parcial' : 'Não Atendido'}
                            </Badge>
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-1">
                            {standard}
                          </h4>
                          <Progress value={score} className="mb-2" />
                          <p className="text-xs text-gray-500">
                            Conformidade: {score}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};
