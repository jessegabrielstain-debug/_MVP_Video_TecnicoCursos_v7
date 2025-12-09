
/**
 * 🤖 Estúdio IA de Vídeos - Sprint 5
 * Studio de Geração de Templates com IA
 */

'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Brain,
  Wand2,
  Target,
  Users,
  Clock,
  Settings,
  Download,
  Eye,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  Zap,
  FileText,
  BarChart3
} from 'lucide-react';

export default function TemplateGeneratorStudio() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedTemplate, setGeneratedTemplate] = useState<any>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [optimizationSuggestions, setOptimizationSuggestions] = useState<any[]>([]);

  // Form data
  const [formData, setFormData] = useState({
    context: 'safety_training',
    industry: 'construction',
    compliance: ['NR-35'],
    audience: 'workers',
    duration: 'medium',
    tone: 'authoritative',
    objectives: [''],
    customRequirements: ''
  });

  useEffect(() => {
    loadExistingTemplates();
  }, []);

  const loadExistingTemplates = async () => {
    try {
      const response = await fetch('/api/ai-templates/list');
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      logger.error('Erro ao carregar templates', error instanceof Error ? error : new Error(String(error)), { component: 'TemplateGeneratorStudio' });
      setTemplates(mockTemplates);
    }
  };

  const mockTemplates = [
    {
      id: 'template-1',
      name: 'Treinamento de Segurança para Construção Civil - NR-35',
      description: 'Template especializado em trabalho em altura',
      category: 'Segurança',
      analytics: { expectedEngagement: 0.85, difficultyLevel: 0.6, retentionScore: 0.78 },
      metadata: { confidence: 0.92, usage: 45, generatedAt: '2025-08-29T10:30:00Z' }
    },
    {
      id: 'template-2', 
      name: 'Treinamento Corporativo para Indústria - NR-10',
      description: 'Template para segurança elétrica industrial',
      category: 'Corporativo',
      analytics: { expectedEngagement: 0.78, difficultyLevel: 0.7, retentionScore: 0.72 },
      metadata: { confidence: 0.88, usage: 32, generatedAt: '2025-08-28T14:20:00Z' }
    }
  ];

  const handleGenerateTemplate = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      // Simula progresso da geração
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          const newProgress = prev + Math.random() * 15;
          if (newProgress >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return newProgress;
        });
      }, 400);

      const response = await fetch('/api/ai-templates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      clearInterval(progressInterval);
      setGenerationProgress(100);

      if (response.ok) {
        const template = await response.json();
        setGeneratedTemplate(template);
        
        // Carrega sugestões de otimização
        loadOptimizationSuggestions(template.id);
      }
    } catch (error) {
      logger.error('Erro ao gerar template', error instanceof Error ? error : new Error(String(error)), { formData, component: 'TemplateGeneratorStudio' });
      // Mock para demonstração
      setTimeout(() => {
        setGenerationProgress(100);
        setGeneratedTemplate(mockGeneratedTemplate);
        setOptimizationSuggestions(mockOptimizationSuggestions);
      }, 2000);
    } finally {
      setIsGenerating(false);
    }
  };

  const loadOptimizationSuggestions = async (templateId: string) => {
    try {
      const response = await fetch(`/api/ai-templates/${templateId}/optimize`);
      const suggestions = await response.json();
      setOptimizationSuggestions(suggestions);
    } catch (error) {
      logger.error('Erro ao carregar sugestões', error instanceof Error ? error : new Error(String(error)), { templateId, component: 'TemplateGeneratorStudio' });
      setOptimizationSuggestions(mockOptimizationSuggestions);
    }
  };

  const mockGeneratedTemplate = {
    id: 'generated-1',
    name: 'Treinamento de Segurança para Construção Civil - NR-35',
    description: 'Template especializado em treinamentos de segurança do trabalho para trabalho em altura',
    structure: {
      intro: {
        duration: 90,
        objectives: ['Identificar riscos de altura', 'Usar EPIs corretamente', 'Aplicar procedimentos de segurança'],
        hooks: ['80% dos acidentes em altura podem ser evitados', 'Sua segurança é nossa prioridade']
      },
      modules: [
        {
          id: 'module_1',
          title: 'Introdução à Segurança em Altura',
          duration: 180,
          content: ['Conceitos básicos', 'Legislação aplicável', 'Estatísticas de acidentes'],
          keyPoints: ['NR-35 é obrigatória', 'Prevenção salva vidas']
        },
        {
          id: 'module_2',
          title: 'Equipamentos de Proteção',
          duration: 240,
          content: ['Tipos de EPIs', 'Inspeção de equipamentos', 'Uso correto'],
          keyPoints: ['Inspeção diária é obrigatória', 'EPI danificado deve ser descartado']
        }
      ],
      conclusion: {
        duration: 90,
        summary: ['Principais riscos identificados', 'Procedimentos essenciais aprendidos'],
        callToAction: 'Aplique estes conhecimentos e trabalhe com segurança!'
      }
    },
    analytics: {
      expectedEngagement: 0.85,
      difficultyLevel: 0.6,
      completionTime: 1.0,
      retentionScore: 0.78
    },
    metadata: {
      confidence: 0.92,
      generatedAt: new Date().toISOString(),
      aiModel: 'EstudioIA-Template-v2.0'
    }
  };

  const mockOptimizationSuggestions = [
    {
      type: 'engagement',
      priority: 'high',
      suggestion: 'Adicionar quiz interativo após introdução para aumentar engajamento',
      expectedImpact: 0.25,
      autoImplementable: true
    },
    {
      type: 'structure',
      priority: 'medium',
      suggestion: 'Dividir módulo 2 em duas partes para melhor digestibilidade',
      expectedImpact: 0.15,
      autoImplementable: true
    }
  ];

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const steps = [
    { number: 1, title: 'Contexto', icon: Target },
    { number: 2, title: 'Audiência', icon: Users },
    { number: 3, title: 'Geração', icon: Brain },
    { number: 4, title: 'Revisão', icon: Eye }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🤖 AI Template Generator
          </h1>
          <p className="text-gray-600 text-lg">
            Crie templates personalizados automaticamente com inteligência artificial avançada
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Step Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>📋 Passos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {steps.map((step) => (
                    <div
                      key={step.number}
                      className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all ${
                        currentStep === step.number
                          ? 'bg-blue-100 border border-blue-300'
                          : currentStep > step.number
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-gray-50 border border-gray-200'
                      }`}
                      onClick={() => setCurrentStep(step.number)}
                    >
                      <div className={`p-2 rounded-full ${
                        currentStep === step.number
                          ? 'bg-blue-600 text-white'
                          : currentStep > step.number
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-300 text-gray-600'
                      }`}>
                        {currentStep > step.number ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <step.icon className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">{step.title}</h4>
                        <p className="text-xs text-gray-600">Passo {step.number}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Template Library Quick Access */}
                <div className="mt-6 pt-6 border-t">
                  <h4 className="text-sm font-medium mb-3">Templates Recentes</h4>
                  <div className="space-y-2">
                    {templates.slice(0, 3).map((template) => (
                      <div key={template.id} className="p-2 border rounded text-xs">
                        <div className="font-medium line-clamp-1">{template.name}</div>
                        <div className="text-gray-600">
                          Confiança: {(template.metadata.confidence * 100).toFixed(0)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5" />
                    <span>Definir Contexto do Template</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Contexto do Treinamento</label>
                        <select 
                          value={formData.context}
                          onChange={(e) => updateFormData('context', e.target.value)}
                          className="w-full px-3 py-2 border rounded-md"
                        >
                          <option value="safety_training">🦺 Treinamento de Segurança</option>
                          <option value="corporate_training">🏢 Treinamento Corporativo</option>
                          <option value="product_demo">📦 Demonstração de Produto</option>
                          <option value="compliance">⚖️ Compliance e Regulamentação</option>
                          <option value="onboarding">🚀 Integração de Funcionários</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Setor Industrial</label>
                        <select 
                          value={formData.industry}
                          onChange={(e) => updateFormData('industry', e.target.value)}
                          className="w-full px-3 py-2 border rounded-md"
                        >
                          <option value="construction">🏗️ Construção Civil</option>
                          <option value="manufacturing">🏭 Indústria</option>
                          <option value="healthcare">🏥 Saúde</option>
                          <option value="education">🎓 Educação</option>
                          <option value="retail">🛒 Varejo</option>
                          <option value="tech">💻 Tecnologia</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Normas Regulamentadoras</label>
                        <div className="space-y-2">
                          {['NR-10', 'NR-12', 'NR-33', 'NR-35'].map(nr => (
                            <label key={nr} className="flex items-center space-x-2">
                              <input 
                                type="checkbox"
                                checked={formData.compliance.includes(nr)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    updateFormData('compliance', [...formData.compliance, nr]);
                                  } else {
                                    updateFormData('compliance', formData.compliance.filter(c => c !== nr));
                                  }
                                }}
                              />
                              <span className="text-sm">{nr}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Duração Esperada</label>
                        <select 
                          value={formData.duration}
                          onChange={(e) => updateFormData('duration', e.target.value)}
                          className="w-full px-3 py-2 border rounded-md"
                        >
                          <option value="short">Curto (menos de 5 minutos)</option>
                          <option value="medium">Médio (5-15 minutos)</option>
                          <option value="long">Longo (mais de 15 minutos)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Tom do Conteúdo</label>
                        <select 
                          value={formData.tone}
                          onChange={(e) => updateFormData('tone', e.target.value)}
                          className="w-full px-3 py-2 border rounded-md"
                        >
                          <option value="formal">Formal</option>
                          <option value="friendly">Amigável</option>
                          <option value="authoritative">Autoritativo</option>
                          <option value="engaging">Envolvente</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Objetivos de Aprendizagem</label>
                        <Textarea
                          value={formData.objectives.join('\n')}
                          onChange={(e) => updateFormData('objectives', e.target.value.split('\n').filter(obj => obj.trim()))}
                          placeholder="Digite um objetivo por linha&#10;Ex: Identificar riscos de segurança&#10;Aplicar procedimentos corretos"
                          rows={4}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={() => setCurrentStep(2)}>
                      Próximo: Audiência
                      <Target className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Definir Audiência</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-3">Público-Alvo Principal</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { value: 'workers', label: 'Trabalhadores', icon: 'worker' },
                        { value: 'supervisors', label: 'Supervisores', icon: 'supervisor' },
                        { value: 'executives', label: 'Executivos', icon: 'exec' },
                        { value: 'mixed', label: 'Misto', icon: 'mixed' }
                      ].map((audience) => (
                        <div
                          key={audience.value}
                          onClick={() => updateFormData('audience', audience.value)}
                          className={`p-4 border-2 rounded-lg cursor-pointer text-center transition-all ${
                            formData.audience === audience.value
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="text-3xl mb-2">{audience.icon}</div>
                          <h4 className="font-semibold text-sm">{audience.label}</h4>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Requisitos Customizados</label>
                    <Textarea
                      value={formData.customRequirements}
                      onChange={(e) => updateFormData('customRequirements', e.target.value)}
                      placeholder="Descreva requisitos específicos para este template...&#10;Ex: Incluir procedimentos específicos da empresa&#10;Usar terminologia técnica específica&#10;Focar em casos reais da indústria"
                      rows={4}
                    />
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setCurrentStep(1)}>
                      Voltar
                    </Button>
                    <Button onClick={() => setCurrentStep(3)}>
                      Próximo: Gerar Template
                      <Brain className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Brain className="h-5 w-5" />
                    <span>🤖 Geração com IA</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Generation Summary */}
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">📋 Resumo da Configuração</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Contexto:</span> {formData.context}
                      </div>
                      <div>
                        <span className="font-medium">Setor:</span> {formData.industry}
                      </div>
                      <div>
                        <span className="font-medium">NRs:</span> {formData.compliance.join(', ')}
                      </div>
                      <div>
                        <span className="font-medium">Audiência:</span> {formData.audience}
                      </div>
                      <div>
                        <span className="font-medium">Duração:</span> {formData.duration}
                      </div>
                      <div>
                        <span className="font-medium">Tom:</span> {formData.tone}
                      </div>
                    </div>
                  </div>

                  {/* Generation Progress */}
                  {isGenerating && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Gerando template com IA...</span>
                        <span className="text-sm text-gray-600">{generationProgress.toFixed(0)}%</span>
                      </div>
                      <Progress value={generationProgress} className="h-3" />
                      
                      <div className="text-center">
                        <div className="inline-flex items-center space-x-2 text-sm text-gray-600">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                          <span>
                            {generationProgress < 30 && 'Analisando contexto e requisitos...'}
                            {generationProgress >= 30 && generationProgress < 60 && 'Gerando estrutura e conteúdo...'}
                            {generationProgress >= 60 && generationProgress < 90 && 'Otimizando engajamento e flow...'}
                            {generationProgress >= 90 && 'Finalizando template...'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Generated Template Preview */}
                  {generatedTemplate && (
                    <div className="space-y-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-3">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <h4 className="font-semibold text-green-800">Template Gerado com Sucesso!</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {(generatedTemplate.analytics.expectedEngagement * 100).toFixed(0)}%
                            </div>
                            <p className="text-xs text-gray-600">Engajamento Esperado</p>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {(generatedTemplate.analytics.retentionScore * 100).toFixed(0)}%
                            </div>
                            <p className="text-xs text-gray-600">Score de Retenção</p>
                          </div>
                          
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">
                              {(generatedTemplate.metadata.confidence * 100).toFixed(0)}%
                            </div>
                            <p className="text-xs text-gray-600">Confiança da IA</p>
                          </div>
                        </div>

                        <h4 className="font-semibold mb-2">{generatedTemplate.name}</h4>
                        <p className="text-sm text-gray-700">{generatedTemplate.description}</p>
                      </div>

                      <div className="flex justify-between">
                        <Button variant="outline" onClick={() => setCurrentStep(2)}>
                          Voltar
                        </Button>
                        <Button onClick={() => setCurrentStep(4)}>
                          Revisar Template
                          <Eye className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Generation Button */}
                  {!generatedTemplate && !isGenerating && (
                    <div className="text-center">
                      <Button 
                        onClick={handleGenerateTemplate}
                        size="lg"
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                      >
                        <Wand2 className="h-5 w-5 mr-2" />
                        Gerar Template com IA
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {currentStep === 4 && generatedTemplate && (
              <div className="space-y-6">
                {/* Template Structure */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="h-5 w-5" />
                      <span>📋 Estrutura do Template</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="structure">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="structure">🏗️ Estrutura</TabsTrigger>
                        <TabsTrigger value="analytics">📊 Analytics</TabsTrigger>
                        <TabsTrigger value="optimization">🚀 Otimização</TabsTrigger>
                      </TabsList>

                      <TabsContent value="structure" className="space-y-4">
                        {/* Intro */}
                        <div className="border rounded-lg p-4">
                          <h4 className="font-semibold mb-2">🚀 Introdução ({generatedTemplate.structure.intro.duration}s)</h4>
                          <div className="space-y-2">
                            <div>
                              <span className="text-xs font-medium text-gray-600">Objetivos:</span>
                              <ul className="text-sm mt-1 space-y-1">
                                {generatedTemplate.structure.intro.objectives.map((obj: string, i: number) => (
                                  <li key={i} className="flex items-start space-x-2">
                                    <span className="text-blue-600">•</span>
                                    <span>{obj}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <span className="text-xs font-medium text-gray-600">Ganchos de Engajamento:</span>
                              <ul className="text-sm mt-1 space-y-1">
                                {generatedTemplate.structure.intro.hooks.map((hook: string, i: number) => (
                                  <li key={i} className="flex items-start space-x-2">
                                    <span className="text-orange-600">🎣</span>
                                    <span>{hook}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>

                        {/* Modules */}
                        {generatedTemplate.structure.modules.map((module: any, index: number) => (
                          <div key={module.id} className="border rounded-lg p-4">
                            <h4 className="font-semibold mb-2">
                              📚 {module.title} ({module.duration}s)
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="font-medium text-gray-600">Pontos-chave:</span>
                                <ul className="mt-1 space-y-1">
                                  {module.keyPoints.map((point: string, i: number) => (
                                    <li key={i} className="flex items-start space-x-2">
                                      <span className="text-green-600">✓</span>
                                      <span>{point}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Conclusion */}
                        <div className="border rounded-lg p-4">
                          <h4 className="font-semibold mb-2">Conclusão ({generatedTemplate.structure.conclusion.duration}s)</h4>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="font-medium text-gray-600">Resumo:</span>
                              <ul className="mt-1 space-y-1">
                                {generatedTemplate.structure.conclusion.summary.map((point: string, i: number) => (
                                  <li key={i} className="flex items-start space-x-2">
                                    <span className="text-purple-600">📝</span>
                                    <span>{point}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                              <span className="font-medium text-blue-800">Call to Action:</span>
                              <p className="text-blue-700 mt-1">{generatedTemplate.structure.conclusion.callToAction}</p>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="analytics" className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center p-4 border rounded-lg">
                            <TrendingUp className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                            <div className="text-lg font-bold">{(generatedTemplate.analytics.expectedEngagement * 100).toFixed(0)}%</div>
                            <p className="text-xs text-gray-600">Engajamento</p>
                          </div>
                          
                          <div className="text-center p-4 border rounded-lg">
                            <BarChart3 className="h-6 w-6 mx-auto mb-2 text-green-600" />
                            <div className="text-lg font-bold">{(generatedTemplate.analytics.retentionScore * 100).toFixed(0)}%</div>
                            <p className="text-xs text-gray-600">Retenção</p>
                          </div>
                          
                          <div className="text-center p-4 border rounded-lg">
                            <Clock className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                            <div className="text-lg font-bold">{(generatedTemplate.analytics.completionTime * 100).toFixed(0)}%</div>
                            <p className="text-xs text-gray-600">Tempo Conclusão</p>
                          </div>
                          
                          <div className="text-center p-4 border rounded-lg">
                            <Target className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                            <div className="text-lg font-bold">{(generatedTemplate.analytics.difficultyLevel * 100).toFixed(0)}%</div>
                            <p className="text-xs text-gray-600">Dificuldade</p>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="optimization" className="space-y-4">
                        {optimizationSuggestions.length > 0 ? (
                          <div className="space-y-3">
                            {optimizationSuggestions.map((suggestion, index) => (
                              <div key={index} className={`p-4 border rounded-lg ${getPriorityColor(suggestion.priority)}`}>
                                <div className="flex items-start justify-between mb-2">
                                  <h4 className="font-semibold">
                                    <Lightbulb className="h-4 w-4 inline mr-1" />
                                    Sugestão de Otimização
                                  </h4>
                                  <Badge variant="outline">{suggestion.priority}</Badge>
                                </div>
                                <p className="text-sm mb-3">{suggestion.suggestion}</p>
                                <div className="flex items-center justify-between text-xs">
                                  <span>Impacto esperado: +{(suggestion.expectedImpact * 100).toFixed(0)}%</span>
                                  {suggestion.autoImplementable && (
                                    <Button size="sm" variant="outline">
                                      <Zap className="h-3 w-3 mr-1" />
                                      Aplicar
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
                            <h3 className="text-lg font-semibold text-green-800 mb-2">
                              Template Otimizado!
                            </h3>
                            <p className="text-green-700">
                              Nenhuma otimização necessária. O template está em excelente qualidade.
                            </p>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>

                {/* Actions */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex justify-between">
                      <Button variant="outline" onClick={() => setCurrentStep(2)}>
                        Voltar
                      </Button>
                      <div className="flex space-x-3">
                        <Button variant="outline">
                          <Download className="h-4 w-4 mr-2" />
                          Exportar
                        </Button>
                        <Button>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Usar Template
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
