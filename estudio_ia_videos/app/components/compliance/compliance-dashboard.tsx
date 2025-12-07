'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useComplianceAnalyzer } from '@/hooks/useComplianceAnalyzer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Download,
  Play,
  Pause,
  Settings,
  RefreshCw,
  FileText,
  BarChart3,
  Target,
  Zap,
  Brain,
  Users,
  Eye,
  Filter,
  Search,
  Calendar,
  ArrowUp,
  ArrowDown,
  Minus,
  Plus,
  X,
  ExternalLink,
  Info,
  Lightbulb,
  Wrench,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';

interface ComplianceDashboardProps {
  projectId?: string;
  className?: string;
}

export const ComplianceDashboard: React.FC<ComplianceDashboardProps> = ({
  projectId = 'demo-project',
  className = '',
}) => {
  const {
    currentReport,
    isAnalyzing,
    monitoring,
    history,
    rules,
    analyzeProject,
    autoFixViolations,
    startMonitoring,
    stopMonitoring,
    exportReport,
    getComplianceRecommendations,
  } = useComplianceAnalyzer();

  const [activeTab, setActiveTab] = useState('overview');
  const [selectedSeverity, setSelectedSeverity] = useState<string[]>(['critical', 'high', 'medium', 'low']);
  const [searchTerm, setSearchTerm] = useState('');
  const [autoFixInProgress, setAutoFixInProgress] = useState(false);

  // Simular dados do projeto para demonstração
  useEffect(() => {
    const demoProjectData = {
      id: projectId,
      name: 'Treinamento de Segurança NR-12',
      content: {
        layers: [
          { id: 'bg', type: 'image', src: 'workplace.jpg' },
          { id: 'text1', type: 'text', content: 'Segurança em Máquinas' },
        ],
        timeline: { duration: 60000 },
        interactions: [],
      },
    };

    analyzeProject(demoProjectData);
  }, [projectId, analyzeProject]);

  const handleAutoFix = useCallback(async () => {
    if (!currentReport) return;

    setAutoFixInProgress(true);
    try {
      const fixableViolations = currentReport.violations.filter(v => v.autoFixable);
      const results = await autoFixViolations(fixableViolations);
      
      const fixedCount = Object.values(results).filter(Boolean).length;
      toast.success(`${fixedCount} violações corrigidas automaticamente!`);
      
      // Re-analisar após correções
      setTimeout(() => {
        analyzeProject({ id: projectId });
      }, 1000);
    } catch (error) {
      toast.error('Erro ao aplicar correções automáticas');
    } finally {
      setAutoFixInProgress(false);
    }
  }, [currentReport, autoFixViolations, analyzeProject, projectId]);

  const handleExport = useCallback(async (format: 'pdf' | 'json' | 'csv') => {
    try {
      const blob = await exportReport(format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compliance-report.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Relatório exportado em ${format.toUpperCase()}!`);
    } catch (error) {
      toast.error('Erro ao exportar relatório');
    }
  }, [exportReport]);

  const toggleMonitoring = useCallback(() => {
    if (monitoring.isActive) {
      stopMonitoring();
      toast.info('Monitoramento pausado');
    } else {
      startMonitoring({ interval: 30000, autoFix: false, notifications: true });
      toast.success('Monitoramento ativado');
    }
  }, [monitoring.isActive, startMonitoring, stopMonitoring]);

  const filteredViolations = currentReport?.violations.filter(violation => {
    const matchesSeverity = selectedSeverity.includes(violation.severity);
    const matchesSearch = violation.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         violation.suggestedFix.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSeverity && matchesSearch;
  }) || [];

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-100';
    if (score >= 70) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Scores principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-500" />
              Score Geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getScoreColor(currentReport?.overallScore || 0)}`}>
              {currentReport?.overallScore || 0}/100
            </div>
            <Progress 
              value={currentReport?.overallScore || 0} 
              className="mt-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              {currentReport?.violations.length || 0} violações encontradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="w-4 h-4 text-green-500" />
              Acessibilidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getScoreColor(currentReport?.accessibilityScore || 0)}`}>
              {currentReport?.accessibilityScore || 0}/100
            </div>
            <Progress 
              value={currentReport?.accessibilityScore || 0} 
              className="mt-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              Conformidade WCAG 2.1
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="w-4 h-4 text-orange-500" />
              Segurança NR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getScoreColor(currentReport?.safetyScore || 0)}`}>
              {currentReport?.safetyScore || 0}/100
            </div>
            <Progress 
              value={currentReport?.safetyScore || 0} 
              className="mt-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              Normas Regulamentadoras
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Resumo de violações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Resumo de Violações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {currentReport?.summary.critical || 0}
              </div>
              <div className="text-sm text-gray-500">Críticas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {currentReport?.summary.high || 0}
              </div>
              <div className="text-sm text-gray-500">Altas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {currentReport?.summary.medium || 0}
              </div>
              <div className="text-sm text-gray-500">Médias</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {currentReport?.summary.low || 0}
              </div>
              <div className="text-sm text-gray-500">Baixas</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações rápidas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleAutoFix}
              disabled={autoFixInProgress || !currentReport?.violations.some(v => v.autoFixable)}
              className="flex items-center gap-2"
            >
              <Wrench className="w-4 h-4" />
              {autoFixInProgress ? 'Corrigindo...' : 'Correção Automática'}
            </Button>

            <Button
              variant="outline"
              onClick={toggleMonitoring}
              className="flex items-center gap-2"
            >
              {monitoring.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {monitoring.isActive ? 'Pausar' : 'Iniciar'} Monitoramento
            </Button>

            <Button
              variant="outline"
              onClick={() => handleExport('json')}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar Relatório
            </Button>

            <Button
              variant="outline"
              onClick={() => analyzeProject({ id: projectId })}
              disabled={isAnalyzing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
              {isAnalyzing ? 'Analisando...' : 'Re-analisar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status do monitoramento */}
      {monitoring.isActive && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-green-600 animate-pulse" />
              <span className="text-sm font-medium text-green-800">
                Monitoramento ativo
              </span>
              <Badge variant="outline" className="text-green-700 border-green-300">
                Última verificação: {monitoring.lastCheck?.toLocaleTimeString() || 'Nunca'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderViolations = () => (
    <div className="space-y-4">
      {/* Filtros */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar violações..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              {['critical', 'high', 'medium', 'low'].map(severity => (
                <Button
                  key={severity}
                  variant={selectedSeverity.includes(severity) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setSelectedSeverity(prev => 
                      prev.includes(severity) 
                        ? prev.filter(s => s !== severity)
                        : [...prev, severity]
                    );
                  }}
                  className="capitalize"
                >
                  {severity}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de violações */}
      <div className="space-y-3">
        {filteredViolations.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                <h3 className="text-lg font-medium mb-2">Nenhuma violação encontrada!</h3>
                <p className="text-sm">
                  {currentReport?.violations.length === 0 
                    ? 'Parabéns! Seu projeto está em total conformidade.'
                    : 'Nenhuma violação corresponde aos filtros selecionados.'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredViolations.map((violation) => (
            <Card key={violation.id} className="border-l-4" style={{ borderLeftColor: getSeverityColor(violation.severity).replace('bg-', '#') }}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge 
                        className={`${getSeverityColor(violation.severity)} text-white`}
                      >
                        {violation.severity.toUpperCase()}
                      </Badge>
                      {violation.autoFixable && (
                        <Badge variant="outline" className="text-green-600 border-green-300">
                          <Wrench className="w-3 h-3 mr-1" />
                          Auto-corrigível
                        </Badge>
                      )}
                    </div>
                    
                    <h4 className="font-medium mb-1">{violation.message}</h4>
                    <p className="text-sm text-gray-600 mb-2">{violation.impact}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {violation.location.elementId && (
                        <span>Elemento: {violation.location.elementId}</span>
                      )}
                      {violation.location.layerId && (
                        <span>Layer: {violation.location.layerId}</span>
                      )}
                      {violation.location.timeframe && (
                        <span>
                          Tempo: {violation.location.timeframe.start}s - {violation.location.timeframe.end}s
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      <Info className="w-3 h-3" />
                      Detalhes
                    </Button>
                    
                    {violation.autoFixable && (
                      <Button
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <Wrench className="w-3 h-3" />
                        Corrigir
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="mt-3 p-3 bg-blue-50 rounded-md">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-blue-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Correção Sugerida:</p>
                      <p className="text-sm text-blue-700">{violation.suggestedFix}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );

  const renderRecommendations = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Recomendações Inteligentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {currentReport?.recommendations.map((rec) => (
              <div key={rec.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-medium">{rec.title}</h4>
                    <p className="text-sm text-gray-600">{rec.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={rec.impact === 'high' ? 'default' : 'outline'}>
                      Impacto: {rec.impact}
                    </Badge>
                    <Badge variant={rec.effort === 'low' ? 'default' : 'outline'}>
                      Esforço: {rec.effort}
                    </Badge>
                  </div>
                </div>
                
                <div className="text-sm text-gray-700 mb-3">
                  <p><strong>Implementação:</strong> {rec.implementation}</p>
                  <p><strong>Benefício esperado:</strong> {rec.expectedBenefit}</p>
                </div>
                
                <Button size="sm" className="flex items-center gap-1">
                  <Plus className="w-3 h-3" />
                  Implementar
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Histórico de Compliance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {history.reports.slice(0, 10).map((report, index) => (
              <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">
                    Relatório #{history.reports.length - index}
                  </div>
                  <div className="text-sm text-gray-500">
                    {report.timestamp.toLocaleString()}
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className={`text-lg font-bold ${getScoreColor(report.overallScore)}`}>
                    {report.overallScore}/100
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    {report.violations.length} violações
                  </div>
                  
                  <Button size="sm" variant="outline">
                    <Eye className="w-3 h-3 mr-1" />
                    Ver
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard de Compliance</h1>
          <p className="text-gray-600">
            Análise automática de conformidade e segurança
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge 
            variant={isAnalyzing ? 'default' : 'outline'}
            className="flex items-center gap-1"
          >
            {isAnalyzing ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <CheckCircle className="w-3 h-3" />
            )}
            {isAnalyzing ? 'Analisando...' : 'Atualizado'}
          </Badge>
          
          {currentReport && (
            <Badge variant="outline">
              Última análise: {currentReport.timestamp.toLocaleTimeString()}
            </Badge>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="violations">Violações</TabsTrigger>
          <TabsTrigger value="recommendations">Recomendações</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          {renderOverview()}
        </TabsContent>

        <TabsContent value="violations" className="mt-6">
          {renderViolations()}
        </TabsContent>

        <TabsContent value="recommendations" className="mt-6">
          {renderRecommendations()}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          {renderHistory()}
        </TabsContent>
      </Tabs>
    </div>
  );
};