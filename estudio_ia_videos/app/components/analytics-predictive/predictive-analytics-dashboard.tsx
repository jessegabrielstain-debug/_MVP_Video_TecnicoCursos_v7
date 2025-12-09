// TODO: Fixar TimeRange e tipos de tab states
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingUp, TrendingDown, BarChart3, PieChart,
  Target, Zap, Brain, Activity, Calendar,
  Users, Clock, Award, AlertTriangle,
  Sparkles, LineChart, ArrowUp, ArrowDown,
  RefreshCw, Download, Settings, Filter
} from 'lucide-react';

interface PredictionData {
  metric: string;
  current: number;
  predicted: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  timeframe: string;
}

interface EngagementMetric {
  name: string;
  value: number;
  change: number;
  prediction: number;
  factors: string[];
}

interface ContentPerformance {
  contentId: string;
  title: string;
  type: 'video' | 'presentation' | 'interactive';
  currentScore: number;
  predictedScore: number;
  engagement: number;
  completion: number;
  retention: number;
  recommendations: string[];
}

interface AIPrediction {
  id: string;
  category: 'performance' | 'engagement' | 'completion' | 'optimization';
  title: string;
  description: string;
  prediction: string;
  confidence: number;
  timeline: string;
  impact: 'high' | 'medium' | 'low';
  actions: string[];
}

const PredictiveAnalyticsDashboard = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'predictions' | 'optimization'>('overview');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedMetric, setSelectedMetric] = useState<string>('engagement');
  const [isUpdating, setIsUpdating] = useState(false);

  const [predictions] = useState<PredictionData[]>([
    {
      metric: 'Engajamento Geral',
      current: 87.5,
      predicted: 92.3,
      confidence: 94.2,
      trend: 'up',
      timeframe: '30 dias'
    },
    {
      metric: 'Taxa de Conclusão',
      current: 78.2,
      predicted: 83.7,
      confidence: 89.1,
      trend: 'up',
      timeframe: '30 dias'
    },
    {
      metric: 'Tempo de Retenção',
      current: 65.8,
      predicted: 72.4,
      confidence: 91.5,
      trend: 'up',
      timeframe: '30 dias'
    },
    {
      metric: 'Score de Qualidade',
      current: 91.2,
      predicted: 88.9,
      confidence: 76.3,
      trend: 'down',
      timeframe: '30 dias'
    }
  ]);

  const [engagementMetrics] = useState<EngagementMetric[]>([
    {
      name: 'Visualizações',
      value: 15420,
      change: 12.4,
      prediction: 17850,
      factors: ['Conteúdo NR-10', 'Melhor SEO', 'Compartilhamentos']
    },
    {
      name: 'Tempo Médio',
      value: 8.5,
      change: -3.2,
      prediction: 9.8,
      factors: ['Otimização IA', 'Conteúdo mais conciso', 'Melhor ritmo']
    },
    {
      name: 'Interações',
      value: 2340,
      change: 28.7,
      prediction: 3200,
      factors: ['Elementos interativos', 'Gamificação', 'Q&A dinâmico']
    },
    {
      name: 'Conversões',
      value: 1850,
      change: 15.3,
      prediction: 2400,
      factors: ['CTAs otimizadas', 'Fluxo melhorado', 'Personalização']
    }
  ]);

  const [contentPerformance] = useState<ContentPerformance[]>([
    {
      contentId: 'content-1',
      title: 'Treinamento NR-10 - Segurança Elétrica',
      type: 'video',
      currentScore: 94.5,
      predictedScore: 97.2,
      engagement: 89.3,
      completion: 87.8,
      retention: 92.1,
      recommendations: [
        'Adicionar quiz interativo no meio do vídeo',
        'Otimizar áudio para melhor clareza',
        'Incluir exemplos práticos visuais'
      ]
    },
    {
      contentId: 'content-2',
      title: 'EPI - Equipamentos de Proteção Individual',
      type: 'presentation',
      currentScore: 88.7,
      predictedScore: 91.4,
      engagement: 82.5,
      completion: 79.3,
      retention: 85.6,
      recommendations: [
        'Reduzir número de slides densos',
        'Adicionar demonstrações visuais',
        'Implementar checkpoint de conhecimento'
      ]
    },
    {
      contentId: 'content-3',
      title: 'Primeiros Socorros - Procedimentos Básicos',
      type: 'interactive',
      currentScore: 92.1,
      predictedScore: 95.8,
      engagement: 95.7,
      completion: 91.2,
      retention: 88.9,
      recommendations: [
        'Expandir simulações práticas',
        'Adicionar cenários de emergência',
        'Integrar certificação digital'
      ]
    }
  ]);

  const [aiPredictions] = useState<AIPrediction[]>([
    {
      id: 'pred-1',
      category: 'engagement',
      title: 'Pico de Engajamento Previsto',
      description: 'IA prevê aumento significativo no engajamento nos próximos 15 dias',
      prediction: '+23% no engajamento geral',
      confidence: 92.4,
      timeline: '15 dias',
      impact: 'high',
      actions: [
        'Preparar conteúdo adicional para demanda',
        'Otimizar infraestrutura para tráfego',
        'Ativar campanhas promocionais'
      ]
    },
    {
      id: 'pred-2',
      category: 'completion',
      title: 'Oportunidade de Melhoria',
      description: 'Identificado padrão de abandono específico que pode ser otimizado',
      prediction: 'Taxa de conclusão pode aumentar 18%',
      confidence: 87.9,
      timeline: '7 dias',
      impact: 'medium',
      actions: [
        'Implementar checkpoints motivacionais',
        'Personalizar ritmo de apresentação',
        'Adicionar lembretes inteligentes'
      ]
    },
    {
      id: 'pred-3',
      category: 'optimization',
      title: 'Otimização de Recursos',
      description: 'IA sugere realocação de recursos para maximizar ROI',
      prediction: 'Economia de 35% nos custos operacionais',
      confidence: 79.6,
      timeline: '30 dias',
      impact: 'high',
      actions: [
        'Automatizar processos manuais',
        'Consolidar infraestrutura redundante',
        'Implementar cache inteligente'
      ]
    }
  ]);

  // Analytics functions
  const handleRefreshData = useCallback(async () => {
    setIsUpdating(true);
    // Simular atualização de dados
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsUpdating(false);
    logger.debug('Dados atualizados com IA', { component: 'PredictiveAnalyticsDashboard' });
  }, []);

  const handleExportReport = useCallback(() => {
    logger.debug('Exportando relatório preditivo', { component: 'PredictiveAnalyticsDashboard' });
  }, []);

  const handleApplyRecommendation = useCallback((contentId: string, recommendation: string) => {
    logger.debug('Aplicando recomendação', { component: 'PredictiveAnalyticsDashboard', contentId, recommendation });
  }, []);

  // Calculation helpers
  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-400" />;
      default: return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-400 bg-red-900/20';
      case 'medium': return 'text-yellow-400 bg-yellow-900/20';
      case 'low': return 'text-green-400 bg-green-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'performance': return <BarChart3 className="w-4 h-4" />;
      case 'engagement': return <Users className="w-4 h-4" />;
      case 'completion': return <Award className="w-4 h-4" />;
      case 'optimization': return <Zap className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const overallStats = useMemo(() => ({
    totalContent: contentPerformance.length,
    avgCurrentScore: (contentPerformance.reduce((acc, content) => acc + content.currentScore, 0) / contentPerformance.length).toFixed(1),
    avgPredictedScore: (contentPerformance.reduce((acc, content) => acc + content.predictedScore, 0) / contentPerformance.length).toFixed(1),
    improvementPotential: ((contentPerformance.reduce((acc, content) => acc + content.predictedScore, 0) - 
                           contentPerformance.reduce((acc, content) => acc + content.currentScore, 0)) / contentPerformance.length).toFixed(1)
  }), [contentPerformance]);

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-purple-400">🔮 Predictive Analytics</h2>
          <Badge variant="outline" className="border-purple-400 text-purple-400">
            <Brain className="w-3 h-3 mr-1" />
            AI Powered
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={(value) => setTimeRange(value as any)}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7d</SelectItem>
              <SelectItem value="30d">30d</SelectItem>
              <SelectItem value="90d">90d</SelectItem>
              <SelectItem value="1y">1y</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefreshData}
            disabled={isUpdating}
            className="text-blue-400 hover:text-blue-300"
          >
            <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExportReport}
            className="text-green-400 hover:text-green-300"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="h-full flex flex-col">
          <TabsList className="w-full">
            <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
            <TabsTrigger value="content" className="flex-1">Content Performance</TabsTrigger>
            <TabsTrigger value="predictions" className="flex-1">AI Predictions</TabsTrigger>
            <TabsTrigger value="optimization" className="flex-1">Optimization</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {predictions.map((prediction) => (
                  <Card key={prediction.metric} className="bg-gray-800 border-gray-700">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center justify-between">
                        {prediction.metric}
                        {getTrendIcon(prediction.trend)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-white">
                            {prediction.current}%
                          </span>
                          <span className="text-sm text-gray-400">atual</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-purple-400">
                            Previsto: {prediction.predicted}%
                          </span>
                          {prediction.trend === 'up' && (
                            <ArrowUp className="w-3 h-3 text-green-400" />
                          )}
                          {prediction.trend === 'down' && (
                            <ArrowDown className="w-3 h-3 text-red-400" />
                          )}
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Confiança</span>
                            <span>{prediction.confidence}%</span>
                          </div>
                          <Progress value={prediction.confidence} className="h-1" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Engagement Trends */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-400" />
                      Métricas de Engajamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {engagementMetrics.map((metric) => (
                      <div key={metric.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{metric.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold">
                              {typeof metric.value === 'number' && metric.value > 1000 
                                ? `${(metric.value / 1000).toFixed(1)}k`
                                : metric.value
                              }
                            </span>
                            <Badge className={`text-xs ${
                              metric.change > 0 ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'
                            }`}>
                              {metric.change > 0 ? '+' : ''}{metric.change}%
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="text-xs text-purple-400">
                          Previsão: {typeof metric.prediction === 'number' && metric.prediction > 1000 
                            ? `${(metric.prediction / 1000).toFixed(1)}k`
                            : metric.prediction
                          }
                        </div>
                        
                        <div className="flex flex-wrap gap-1">
                          {metric.factors.slice(0, 3).map((factor, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {factor}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-blue-400" />
                      Visão Geral do Sistema
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-700 p-3 rounded">
                        <div className="text-2xl font-bold text-blue-400">{overallStats.totalContent}</div>
                        <div className="text-sm text-gray-400">Total de Conteúdos</div>
                      </div>
                      
                      <div className="bg-gray-700 p-3 rounded">
                        <div className="text-2xl font-bold text-green-400">{overallStats.avgCurrentScore}%</div>
                        <div className="text-sm text-gray-400">Score Médio Atual</div>
                      </div>
                      
                      <div className="bg-gray-700 p-3 rounded">
                        <div className="text-2xl font-bold text-purple-400">{overallStats.avgPredictedScore}%</div>
                        <div className="text-sm text-gray-400">Score Previsto</div>
                      </div>
                      
                      <div className="bg-gray-700 p-3 rounded">
                        <div className="text-2xl font-bold text-yellow-400">+{overallStats.improvementPotential}%</div>
                        <div className="text-sm text-gray-400">Potencial de Melhoria</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold">Próximas Ações Recomendadas</h4>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-gray-300">
                          <Target className="w-3 h-3 text-blue-400" />
                          Otimizar 3 conteúdos com maior potencial
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-300">
                          <Users className="w-3 h-3 text-green-400" />
                          Implementar personalização por perfil
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-300">
                          <Zap className="w-3 h-3 text-purple-400" />
                          Ativar automações de engajamento
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="content" className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Performance por Conteúdo</h3>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-xs">
                    <Filter className="w-3 h-3 mr-1" />
                    Filtros
                  </Button>
                </div>
              </div>
              
              {contentPerformance.map((content) => (
                <Card key={content.contentId} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-semibold text-white">{content.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {content.type}
                            </Badge>
                            <span className="text-xs text-gray-400">
                              Atual: {content.currentScore}% • Previsto: {content.predictedScore}%
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className={`text-lg ${
                            content.predictedScore > content.currentScore 
                              ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {content.predictedScore > content.currentScore ? '📈' : '📉'}
                          </div>
                          <Badge className={`text-xs ${
                            content.predictedScore > content.currentScore 
                              ? 'bg-green-900/20 text-green-400' 
                              : 'bg-red-900/20 text-red-400'
                          }`}>
                            {content.predictedScore > content.currentScore ? '+' : ''}
                            {(content.predictedScore - content.currentScore).toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Engajamento</div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{content.engagement}%</span>
                            <Progress value={content.engagement} className="flex-1 h-2" />
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Conclusão</div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{content.completion}%</span>
                            <Progress value={content.completion} className="flex-1 h-2" />
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Retenção</div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{content.retention}%</span>
                            <Progress value={content.retention} className="flex-1 h-2" />
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="text-xs font-semibold text-gray-300 mb-2">Recomendações IA:</h5>
                        <div className="space-y-1">
                          {content.recommendations.map((rec, index) => (
                            <div key={index} className="flex items-center justify-between text-xs">
                              <span className="text-gray-300 flex-1">{rec}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleApplyRecommendation(content.contentId, rec)}
                                className="text-purple-400 hover:text-purple-300 ml-2 px-2 py-1 h-6"
                              >
                                Aplicar
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="predictions" className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-4">
              {aiPredictions.map((prediction) => (
                <Card key={prediction.id} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="text-purple-400 mt-0.5">
                            {getCategoryIcon(prediction.category)}
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-white">{prediction.title}</h4>
                            <p className="text-sm text-gray-300 mt-1">{prediction.description}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge className={`text-xs ${getImpactColor(prediction.impact)}`}>
                            {prediction.impact}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {prediction.category}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="bg-gray-700 p-3 rounded">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-purple-400">
                            {prediction.prediction}
                          </span>
                          <span className="text-xs text-gray-400">
                            {prediction.timeline}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">Confiança:</span>
                          <Progress value={prediction.confidence} className="flex-1 h-2" />
                          <span className="text-xs text-white">{prediction.confidence}%</span>
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="text-xs font-semibold text-gray-300 mb-2">Ações Recomendadas:</h5>
                        <div className="space-y-1">
                          {prediction.actions.map((action, index) => (
                            <div key={index} className="flex items-start gap-2 text-xs">
                              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5" />
                              <span className="text-gray-300">{action}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-xs">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Implementar IA
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs">
                          Ver Detalhes
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="optimization" className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    Otimizações Automáticas Disponíveis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    {
                      title: 'Otimização de Performance',
                      description: 'Aplicar 12 melhorias automáticas detectadas pela IA',
                      impact: '+15% performance geral',
                      effort: 'Baixo',
                      time: '5 minutos'
                    },
                    {
                      title: 'Personalização de Conteúdo',
                      description: 'Adaptar conteúdo baseado no perfil dos usuários',
                      impact: '+28% engajamento',
                      effort: 'Médio',
                      time: '30 minutos'
                    },
                    {
                      title: 'Automação de Workflows',
                      description: 'Implementar 8 automações inteligentes',
                      impact: '-35% tempo operacional',
                      effort: 'Alto',
                      time: '2 horas'
                    }
                  ].map((optimization, index) => (
                    <Card key={index} className="bg-gray-700 border-gray-600">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-white">{optimization.title}</h4>
                          <Badge className="text-xs bg-green-900/20 text-green-400">
                            {optimization.impact}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-300 mb-3">{optimization.description}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-xs text-gray-400">
                            <span>Esforço: {optimization.effort}</span>
                            <span>Tempo: {optimization.time}</span>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="text-xs">
                              Detalhes
                            </Button>
                            <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700 text-xs">
                              <Zap className="w-3 h-3 mr-1" />
                              Aplicar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
              
              {/* Resource Usage Prediction */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-400" />
                    Previsão de Uso de Recursos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { name: 'CPU', current: 45, predicted: 38, unit: '%' },
                      { name: 'Memória', current: 2.3, predicted: 1.8, unit: 'GB' },
                      { name: 'Armazenamento', current: 156, predicted: 189, unit: 'GB' }
                    ].map((resource, index) => (
                      <div key={index} className="bg-gray-700 p-3 rounded">
                        <div className="text-sm font-medium text-white mb-2">{resource.name}</div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Atual</span>
                            <span className="text-white">{resource.current}{resource.unit}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Previsto</span>
                            <span className={`${
                              resource.predicted < resource.current ? 'text-green-400' : 'text-yellow-400'
                            }`}>
                              {resource.predicted}{resource.unit}
                            </span>
                          </div>
                          <Progress 
                            value={resource.predicted} 
                            className="h-2"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PredictiveAnalyticsDashboard;
