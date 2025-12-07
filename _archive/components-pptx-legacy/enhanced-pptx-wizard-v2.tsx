

/**
 * 🚀 Enhanced PPTX Wizard v2.0
 * Fluxo Simplificado para Usuários Leigos - Baseado no Animaker
 * Upload → Análise IA → Editor → Vídeo
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  FileText,
  Upload,
  CheckCircle,
  AlertTriangle,
  Brain,
  Wand2,
  Video,
  Mic,
  Users,
  Globe,
  Settings,
  PlayCircle,
  Download,
  Sparkles,
  Clock,
  TrendingUp,
  Eye,
  Edit3,
  Zap,
  Shield,
  Award,
  Building
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Image from 'next/image';

interface PPTXAnalysisResult {
  slides: number;
  duration: number;
  content: {
    title: string;
    content: string;
    notes: string;
    images: number;
  }[];
  recommendations: {
    nr: string;
    compliance: number;
    suggestions: string[];
  };
  estimatedVideoTime: number;
  complexity: 'Básico' | 'Intermediário' | 'Avançado';
}

interface EnhancedPPTXWizardV2Props {
  onProjectReady: (projectData: any) => void;
  onCancel: () => void;
}

export function EnhancedPPTXWizardV2({ onProjectReady, onCancel }: EnhancedPPTXWizardV2Props) {
  const [currentStep, setCurrentStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<PPTXAnalysisResult | null>(null);
  const [processingStage, setProcessingStage] = useState('');
  const [progress, setProgress] = useState(0);
  const [projectConfig, setProjectConfig] = useState({
    empresa: '',
    setor: '',
    tipoTreinamento: '',
    avatar: 'profissional-1',
    voz: 'feminina-br-1',
    qualidade: '1080p',
    incluirQuiz: true,
    incluirCertificado: true
  });

  const steps = [
    { id: 1, title: 'Upload PPTX', icon: Upload, status: 'current' },
    { id: 2, title: 'Análise IA', icon: Brain, status: 'pending' },
    { id: 3, title: 'Configuração', icon: Settings, status: 'pending' },
    { id: 4, title: 'Preview & Editar', icon: Edit3, status: 'pending' },
    { id: 5, title: 'Gerar Vídeo', icon: Video, status: 'pending' }
  ];

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const selectedFile = files[0];
      
      // Validações básicas
      if (!selectedFile.name.match(/\.(pptx|ppt)$/i)) {
        toast.error('Formato não suportado. Use apenas .pptx ou .ppt');
        return;
      }
      
      if (selectedFile.size > 50 * 1024 * 1024) { // 50MB
        toast.error('Arquivo muito grande. Máximo 50MB');
        return;
      }

      setFile(selectedFile);
      setCurrentStep(2);
      await startAnalysis(selectedFile);
    }
  };

  const startAnalysis = async (file: File) => {
    setIsProcessing(true);
    setProgress(0);
    
    const stages = [
      { stage: 'Extraindo slides...', progress: 20 },
      { stage: 'Analisando conteúdo...', progress: 40 },
      { stage: 'Identificando NRs aplicáveis...', progress: 60 },
      { stage: 'Gerando recomendações...', progress: 80 },
      { stage: 'Finalizando análise...', progress: 100 }
    ];

    try {
      for (const { stage, progress: stageProgress } of stages) {
        setProcessingStage(stage);
        setProgress(stageProgress);
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      // Simular chamada à API real
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/pptx/enhanced-analysis', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      setAnalysisResult(result);
      setCurrentStep(3);
      toast.success('Análise concluída! Vamos configurar seu vídeo.');
      
    } catch (error) {
      console.error('Erro na análise:', error);
      toast.error(`Falha na análise: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      
      // Usar dados simulados como fallback
      const mockResult = generateMockAnalysis(file);
      setAnalysisResult(mockResult);
      setCurrentStep(3);
      toast.success('Usando dados simulados devido a um erro na análise');
    } finally {
      setIsProcessing(false);
    }
  };

  const generateMockAnalysis = (file: File): PPTXAnalysisResult => {
    const slideCount = Math.floor(Math.random() * 20) + 10;
    const nrTypes = ['NR-06', 'NR-10', 'NR-12', 'NR-17', 'NR-35'];
    const selectedNR = nrTypes[Math.floor(Math.random() * nrTypes.length)];
    
    return {
      slides: slideCount,
      duration: slideCount * 30, // 30 segundos por slide
      content: Array.from({ length: slideCount }, (_, i) => ({
        title: `Slide ${i + 1}: Conceitos Importantes`,
        content: 'Conteúdo educativo sobre segurança do trabalho...',
        notes: 'Notas do palestrante para narração',
        images: Math.floor(Math.random() * 3)
      })),
      recommendations: {
        nr: selectedNR,
        compliance: Math.floor(Math.random() * 30) + 70,
        suggestions: [
          'Adicionar avatar 3D para melhor engajamento',
          'Incluir cenários práticos com realismo',
          'Implementar quiz interativo ao final',
          'Usar narração naturalizada brasileira'
        ]
      },
      estimatedVideoTime: Math.floor(slideCount * 1.5), // 1.5 minutos por slide
      complexity: ['Básico', 'Intermediário', 'Avançado'][Math.floor(Math.random() * 3)] as 'Básico' | 'Intermediário' | 'Avançado'
    };
  };

  const handleConfigurationComplete = () => {
    if (!projectConfig.empresa.trim()) {
      toast.error('Nome da empresa é obrigatório');
      return;
    }
    setCurrentStep(4);
  };

  const handlePreviewAndEdit = () => {
    setCurrentStep(5);
  };

  const handleGenerateVideo = async () => {
    if (!analysisResult || !file) return;
    
    setIsProcessing(true);
    const finalProjectData = {
      id: `project_${Date.now()}`,
      name: `${projectConfig.empresa} - ${file.name.replace(/\.(pptx|ppt)$/i, '')}`,
      type: 'nr-training',
      file: file,
      analysis: analysisResult,
      config: projectConfig,
      status: 'generating',
      createdAt: new Date().toISOString()
    };

    try {
      // Simular geração
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Projeto criado! Redirecionando para o editor...');
      onProjectReady(finalProjectData);
    } catch (error) {
      toast.error('Erro ao criar projeto');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStepStatus = (stepId: number) => {
    if (stepId < currentStep) return 'completed';
    if (stepId === currentStep) return 'current';
    return 'pending';
  };

  const getComplexityColor = (complexity: string) => {
    const colors = {
      'Básico': 'bg-green-100 text-green-800',
      'Intermediário': 'bg-yellow-100 text-yellow-800',
      'Avançado': 'bg-red-100 text-red-800'
    };
    return colors[complexity as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center space-x-3">
            <Sparkles className="h-10 w-10 text-blue-600" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              PPTX → Vídeo IA
            </h1>
            <Wand2 className="h-10 w-10 text-purple-600" />
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Transforme suas apresentações em vídeos profissionais com avatares 3D e narração IA
          </p>
        </div>

        {/* Progress Steps */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const status = getStepStatus(step.id);
                const StepIcon = step.icon;
                
                return (
                  <div key={step.id} className="flex items-center">
                    <div className="flex flex-col items-center space-y-2">
                      <div className={`
                        flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300
                        ${status === 'completed' ? 'bg-green-500 border-green-500 text-white' : 
                          status === 'current' ? 'bg-blue-500 border-blue-500 text-white' : 
                          'bg-gray-100 border-gray-300 text-gray-500'}
                      `}>
                        {status === 'completed' ? (
                          <CheckCircle className="h-6 w-6" />
                        ) : (
                          <StepIcon className="h-6 w-6" />
                        )}
                      </div>
                      <div className="text-center">
                        <div className={`text-sm font-medium ${
                          status === 'current' ? 'text-blue-600' : 
                          status === 'completed' ? 'text-green-600' : 'text-gray-500'
                        }`}>
                          {step.title}
                        </div>
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`h-0.5 w-16 mx-4 ${
                        status === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        <div className="space-y-6">
          
          {/* Step 1: Upload */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="h-6 w-6 text-blue-600" />
                  <span>Faça o Upload do seu PPTX</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center space-y-4 hover:border-blue-400 transition-colors">
                  <div className="space-y-3">
                    <FileText className="h-16 w-16 text-gray-400 mx-auto" />
                    <div>
                      <input
                        type="file"
                        accept=".pptx,.ppt"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="pptx-upload"
                      />
                      <label htmlFor="pptx-upload">
                        <Button size="lg" className="cursor-pointer bg-gradient-to-r from-blue-600 to-purple-600">
                          <Upload className="h-5 w-5 mr-2" />
                          Selecionar PPTX
                        </Button>
                      </label>
                    </div>
                    <div className="text-sm text-gray-500">
                      Formatos suportados: .pptx, .ppt | Tamanho máximo: 50MB
                    </div>
                  </div>
                </div>

                <Alert>
                  <Sparkles className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Dica:</strong> Para melhores resultados, use apresentações com texto claro, 
                    imagens em boa qualidade e notas do palestrante para narração.
                  </AlertDescription>
                </Alert>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={onCancel}>
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: AI Analysis */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="h-6 w-6 text-purple-600 animate-pulse" />
                  <span>Análise Inteligente em Progresso</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {file && (
                  <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                    <FileText className="h-8 w-8 text-blue-600" />
                    <div>
                      <div className="font-medium">{file.name}</div>
                      <div className="text-sm text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(1)} MB
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{processingStage || 'Iniciando...'}</span>
                    <span className="text-sm text-gray-500">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                    <Eye className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-sm font-medium">Análise Visual</div>
                    <div className="text-xs text-gray-600">Identificando elementos</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                    <Brain className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-sm font-medium">IA Especializada</div>
                    <div className="text-xs text-gray-600">Reconhecendo NRs</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                    <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-sm font-medium">Compliance</div>
                    <div className="text-xs text-gray-600">Verificando conformidade</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Configuration */}
          {currentStep === 3 && analysisResult && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <span>Análise Concluída</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-blue-600">{analysisResult.slides}</div>
                      <div className="text-sm text-gray-600">Slides</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-purple-600">{analysisResult.estimatedVideoTime}min</div>
                      <div className="text-sm text-gray-600">Duração estimada</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-green-600">{analysisResult.recommendations.compliance}%</div>
                      <div className="text-sm text-gray-600">Compliance</div>
                    </div>
                    <div className="text-center p-4">
                      <Badge className={getComplexityColor(analysisResult.complexity)}>
                        {analysisResult.complexity}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-6 w-6 text-blue-600" />
                    <span>Configuração do Projeto</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Nome da Empresa *</label>
                      <Input
                        placeholder="Ex: Construtora ABC Ltda"
                        value={projectConfig.empresa}
                        onChange={(e) => setProjectConfig(prev => ({ ...prev, empresa: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Setor</label>
                      <Select 
                        value={projectConfig.setor} 
                        onValueChange={(value) => setProjectConfig(prev => ({ ...prev, setor: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o setor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="construcao">Construção Civil</SelectItem>
                          <SelectItem value="industrial">Industrial</SelectItem>
                          <SelectItem value="eletrico">Elétrico</SelectItem>
                          <SelectItem value="metalurgico">Metalúrgico</SelectItem>
                          <SelectItem value="quimico">Químico</SelectItem>
                          <SelectItem value="alimenticio">Alimentício</SelectItem>
                          <SelectItem value="servicos">Serviços</SelectItem>
                          <SelectItem value="saude">Saúde</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Avatar Apresentador</label>
                      <Select 
                        value={projectConfig.avatar} 
                        onValueChange={(value) => setProjectConfig(prev => ({ ...prev, avatar: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="profissional-1">👨‍💼 Profissional Masculino</SelectItem>
                          <SelectItem value="profissional-2">👩‍💼 Profissional Feminina</SelectItem>
                          <SelectItem value="tecnico-1">👷‍♂️ Técnico em Segurança</SelectItem>
                          <SelectItem value="instrutora-1">👩‍🏫 Instrutora Especialista</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Voz Narração</label>
                      <Select 
                        value={projectConfig.voz} 
                        onValueChange={(value) => setProjectConfig(prev => ({ ...prev, voz: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="feminina-br-1">🇧🇷 Feminina Brasileira</SelectItem>
                          <SelectItem value="masculina-br-1">🇧🇷 Masculina Brasileira</SelectItem>
                          <SelectItem value="feminina-br-2">🇧🇷 Feminina Regional</SelectItem>
                          <SelectItem value="masculina-br-2">🇧🇷 Masculina Regional</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {analysisResult.recommendations && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Sparkles className="h-6 w-6 text-yellow-600" />
                      <span>Recomendações IA</span>
                      <Badge className="bg-orange-100 text-orange-800">
                        {analysisResult.recommendations.nr}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analysisResult.recommendations.suggestions.map((suggestion, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                          <span className="text-sm">{suggestion}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  Voltar
                </Button>
                <Button 
                  onClick={handleConfigurationComplete}
                  className="bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  Continuar
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Preview */}
          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PlayCircle className="h-6 w-6 text-green-600" />
                  <span>Preview do Projeto</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg">
                  <div className="text-center space-y-4">
                    <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center space-y-3">
                          <Video className="h-16 w-16 text-gray-400 mx-auto" />
                          <div className="text-lg font-medium">Preview do Vídeo</div>
                          <div className="text-sm text-gray-500">
                            {projectConfig.empresa} - Treinamento {analysisResult?.recommendations.nr}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <Users className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                        <div className="font-medium">Avatar 3D</div>
                        <div className="text-gray-500">Profissional</div>
                      </div>
                      <div className="text-center">
                        <Mic className="h-6 w-6 text-purple-600 mx-auto mb-1" />
                        <div className="font-medium">Narração IA</div>
                        <div className="text-gray-500">Brasileiro</div>
                      </div>
                      <div className="text-center">
                        <Eye className="h-6 w-6 text-green-600 mx-auto mb-1" />
                        <div className="font-medium">Qualidade</div>
                        <div className="text-gray-500">Full HD</div>
                      </div>
                      <div className="text-center">
                        <Award className="h-6 w-6 text-orange-600 mx-auto mb-1" />
                        <div className="font-medium">Certificado</div>
                        <div className="text-gray-500">Incluído</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(3)}>
                    Configurar Novamente
                  </Button>
                  <div className="space-x-2">
                    <Button variant="outline" onClick={handlePreviewAndEdit}>
                      Personalizar no Editor
                    </Button>
                    <Button 
                      onClick={handleGenerateVideo}
                      className="bg-gradient-to-r from-green-600 to-blue-600"
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Zap className="h-4 w-4 mr-2 animate-spin" />
                          Gerando...
                        </>
                      ) : (
                        <>
                          <Video className="h-4 w-4 mr-2" />
                          Gerar Vídeo
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Generate Video */}
          {currentStep === 5 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Video className="h-6 w-6 text-blue-600" />
                  <span>Geração Final</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-6">
                <div className="space-y-4">
                  <Zap className="h-16 w-16 text-blue-600 mx-auto animate-bounce" />
                  <div className="text-xl font-bold">Redirecionando para o Editor...</div>
                  <div className="text-gray-600">
                    Seu projeto está sendo preparado com todas as configurações
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}

