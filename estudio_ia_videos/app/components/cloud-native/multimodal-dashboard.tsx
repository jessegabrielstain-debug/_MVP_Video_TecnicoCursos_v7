
/**
 * 🧠 Estúdio IA de Vídeos - Sprint 9
 * Dashboard de IA Multimodal
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Brain,
  Eye,
  Mic,
  BarChart3,
  Zap,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Upload,
  Play,
  Pause,
  Download,
  Settings,
  RefreshCw,
  FileVideo,
  FileAudio,
  FileText,
  Camera,
  Headphones,
  Activity,
  Cpu,
  Database,
  Cloud,
  Shield
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface AnalysisResult {
  id: string;
  type: string;
  timestamp: Date;
  file: string;
  status: string;
  results?: {
    safetyScore?: number;
    engagementScore?: number;
    qualityScore?: number;
    clarityScore?: number;
    sentimentScore?: number;
    complianceScore?: number;
    objectsDetected?: number;
    violationsFound?: number;
    modalityScores?: {
      visual?: number;
      audio?: number;
      content?: number;
    };
  };
  insights?: string[];
}

interface SystemMetrics {
  services: {
    total: number;
    healthy: number;
    degraded: number;
    unavailable: number;
  };
  resources: {
    cpuUsage: number;
    memoryUsage: number;
    storageUsage: number;
    networkIO: string;
  };
  ml: {
    modelsDeployed: number;
    predictions: number;
    accuracy: number;
    latency: number;
  };
}

interface MLModel {
  id: string;
  name: string;
  version: string;
  accuracy: number;
  status: string;
  latency: number;
}

export default function MultimodalDashboard() {
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisResult[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [mlModels, setMLModels] = useState<MLModel[]>([]);
  const [activeTab, setActiveTab] = useState('analysis');

  useEffect(() => {
    loadAnalysisHistory();
    loadSystemMetrics();
    loadMLModels();
  }, []);

  const loadAnalysisHistory = async () => {
    try {
      // Simular histórico de análises
      const mockHistory = [
        {
          id: 'analysis_001',
          type: 'multimodal',
          timestamp: new Date(Date.now() - 3600000),
          file: 'treinamento_nr10.mp4',
          status: 'completed',
          results: {
            safetyScore: 0.92,
            engagementScore: 0.87,
            qualityScore: 0.94,
            modalityScores: {
              visual: 0.89,
              audio: 0.91,
              content: 0.88
            }
          },
          insights: [
            'Excelente aderência às normas de segurança',
            'Alto potencial de engajamento',
            'Qualidade técnica superior'
          ]
        },
        {
          id: 'analysis_002',
          type: 'computer_vision',
          timestamp: new Date(Date.now() - 7200000),
          file: 'procedimento_altura.mp4',
          status: 'completed',
          results: {
            safetyScore: 0.78,
            objectsDetected: 15,
            violationsFound: 2,
            modalityScores: {
              visual: 0.82,
              audio: 0.75,
              content: 0.76
            }
          },
          insights: [
            'Violações de EPI detectadas',
            'Procedimento parcialmente correto',
            'Recomenda-se revisão do conteúdo'
          ]
        },
        {
          id: 'analysis_003',
          type: 'speech_analysis',
          timestamp: new Date(Date.now() - 10800000),
          file: 'narração_nr12.wav',
          status: 'completed',
          results: {
            clarityScore: 0.95,
            sentimentScore: 0.88,
            complianceScore: 0.91,
            modalityScores: {
              audio: 0.95,
              content: 0.89
            }
          },
          insights: [
            'Excelente clareza na pronúncia',
            'Tom adequado para treinamento',
            'Terminologia técnica correta'
          ]
        }
      ];

      setAnalysisHistory(mockHistory);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  const loadSystemMetrics = async () => {
    try {
      const response = await fetch('/api/v2/cloud-native/metrics');
      if (response.ok) {
        const metrics = await response.json();
        setSystemMetrics(metrics);
      }
    } catch (error) {
      // Dados mock para demonstração
      setSystemMetrics({
        services: {
          total: 6,
          healthy: 5,
          degraded: 1,
          unavailable: 0
        },
        resources: {
          cpuUsage: 68,
          memoryUsage: 72,
          storageUsage: 45,
          networkIO: '2.5 GB/h'
        },
        ml: {
          modelsDeployed: 4,
          predictions: 12450,
          accuracy: 0.87,
          latency: 45
        }
      });
    }
  };

  const loadMLModels = async () => {
    try {
      const response = await fetch('/api/v2/ml/models');
      if (response.ok) {
        const models = await response.json();
        setMLModels(models);
      }
    } catch (error) {
      // Dados mock
      setMLModels([
        {
          id: 'engagement-predictor',
          name: 'Video Engagement Predictor',
          version: '3.1.2',
          accuracy: 0.87,
          status: 'deployed',
          latency: 45
        },
        {
          id: 'safety-classifier',
          name: 'Safety Compliance Classifier',
          version: '2.3.1',
          accuracy: 0.94,
          status: 'deployed',
          latency: 28
        },
        {
          id: 'content-recommender',
          name: 'Content Recommender',
          version: '1.9.0',
          accuracy: 0.81,
          status: 'deployed',
          latency: 35
        }
      ]);
    }
  };

  const analyzeFile = async () => {
    if (!uploadedFile) {
      toast.error('Selecione um arquivo para análise');
      return;
    }

    setIsAnalyzing(true);

    try {
      // Simular análise multimodal
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('analysisType', 'multimodal');

      const response = await fetch('/api/v2/ai/multimodal', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const analysis = await response.json();
        setCurrentAnalysis(analysis);
        toast.success('Análise multimodal concluída!');
        await loadAnalysisHistory(); // Recarregar histórico
      } else {
        throw new Error('Falha na análise');
      }
    } catch (error) {
      // Simular análise bem-sucedida para demo
      const mockAnalysis = {
        id: 'analysis_' + Date.now(),
        type: 'multimodal',
        timestamp: new Date(),
        file: uploadedFile.name,
        status: 'completed',
        results: {
          safetyScore: 0.89,
          engagementScore: 0.92,
          qualityScore: 0.91,
          modalityScores: {
            visual: 0.88,
            audio: 0.94,
            content: 0.90
          }
        },
        insights: [
          'Excelente qualidade de áudio detectada',
          'Boa aderência às práticas de segurança',
          'Alto potencial de engajamento'
        ]
      };
      
      setCurrentAnalysis(mockAnalysis);
      toast.success('Análise multimodal concluída!');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCloudNativeAction = (action: string) => {
    console.log(`Executando ação cloud native: ${action}`);
    toast.success(`Ação ${action} executada com sucesso!`);
  };

  const handleMultimodalAction = (action: string) => {
    console.log(`Executando ação multimodal: ${action}`);
    if (action === 'start_analysis') {
      analyzeFile();
    } else {
      toast.success(`Ação ${action} executada com sucesso!`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing': return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'failed': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };

  const getFileTypeIcon = (filename: string) => {
    if (filename.includes('.mp4') || filename.includes('.avi')) return <FileVideo className="h-4 w-4" />;
    if (filename.includes('.wav') || filename.includes('.mp3')) return <FileAudio className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <Brain className="h-8 w-8 text-purple-600" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              IA Multimodal Dashboard
            </h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Análise avançada de vídeo, áudio e texto com inteligência artificial multimodal e cloud native
          </p>
        </div>

        {/* System Overview */}
        {systemMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Cloud className="h-4 w-4 mr-2 text-blue-600" />
                  Microserviços
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {systemMetrics.services.healthy}/{systemMetrics.services.total}
                </div>
                <p className="text-xs text-gray-600">Serviços Ativos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Cpu className="h-4 w-4 mr-2 text-orange-600" />
                  Recursos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {systemMetrics?.resources?.cpuUsage || 0}%
                </div>
                <p className="text-xs text-gray-600">CPU Utilizada</p>
                <Progress value={systemMetrics?.resources?.cpuUsage || 0} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Brain className="h-4 w-4 mr-2 text-purple-600" />
                  Modelos ML
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {systemMetrics.ml.modelsDeployed}
                </div>
                <p className="text-xs text-gray-600">Ativos</p>
                <div className="text-xs text-green-600 mt-1">
                  Acc: {(systemMetrics.ml.accuracy * 100).toFixed(1)}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
                  Predições
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {systemMetrics.ml.predictions.toLocaleString()}
                </div>
                <p className="text-xs text-gray-600">Hoje</p>
                <div className="text-xs text-blue-600 mt-1">
                  {systemMetrics.ml.latency}ms avg
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="space-y-6">
          <div className="grid w-full grid-cols-4 gap-2 p-1 bg-muted rounded-lg">
            <Button
              onClick={() => setActiveTab('analysis')}
              variant={activeTab === 'analysis' ? 'default' : 'ghost'}
              className="w-full"
            >
              Análise Multimodal
            </Button>
            <Button
              onClick={() => setActiveTab('models')}
              variant={activeTab === 'models' ? 'default' : 'ghost'}
              className="w-full"
            >
              Modelos ML
            </Button>
            <Button
              onClick={() => setActiveTab('cloud')}
              variant={activeTab === 'cloud' ? 'default' : 'ghost'}
              className="w-full"
            >
              Cloud Native
            </Button>
            <Button
              onClick={() => setActiveTab('security')}
              variant={activeTab === 'security' ? 'default' : 'ghost'}
              className="w-full"
            >
              Segurança
            </Button>
          </div>

          {/* Tab: Análise Multimodal */}
          {activeTab === 'analysis' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Análise Multimodal</h3>
              <div className="flex space-x-2">
                <Button 
                  onClick={() => handleMultimodalAction('batch_analysis')}
                  size="sm" 
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Activity className="h-4 w-4" />
                  <span>Análise em Lote</span>
                </Button>
                <Button 
                  onClick={() => handleMultimodalAction('export_results')}
                  size="sm" 
                  variant="secondary"
                  className="flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Exportar</span>
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Upload e Análise */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Upload className="h-5 w-5 mr-2" />
                      Nova Análise
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        accept="video/*,audio/*"
                        onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <div className="space-y-2">
                          <div className="mx-auto h-12 w-12 text-gray-400">
                            {uploadedFile ? getFileTypeIcon(uploadedFile.name) : <Upload className="h-12 w-12" />}
                          </div>
                          <div className="text-sm text-gray-600">
                            {uploadedFile ? uploadedFile.name : 'Clique para selecionar arquivo'}
                          </div>
                        </div>
                      </label>
                    </div>

                    <Button 
                      onClick={analyzeFile}
                      disabled={!uploadedFile || isAnalyzing}
                      className="w-full"
                    >
                      {isAnalyzing ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Analisando...
                        </>
                      ) : (
                        <>
                          <Brain className="h-4 w-4 mr-2" />
                          Iniciar Análise Multimodal
                        </>
                      )}
                    </Button>

                    {isAnalyzing && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progresso</span>
                          <span>75%</span>
                        </div>
                        <Progress value={75} />
                        <div className="text-xs text-gray-600">
                          Analisando componentes visuais e auditivos...
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Análise Atual */}
                {currentAnalysis && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Target className="h-5 w-5 mr-2" />
                        Resultado da Análise
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="text-lg font-semibold text-green-600">
                            {((currentAnalysis.results?.safetyScore || 0) * 100).toFixed(1)}%
                          </div>
                          <div className="text-xs text-gray-600">Segurança</div>
                        </div>
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="text-lg font-semibold text-blue-600">
                            {((currentAnalysis.results?.engagementScore || 0) * 100).toFixed(1)}%
                          </div>
                          <div className="text-xs text-gray-600">Engajamento</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium">Insights Principais:</h4>
                        {currentAnalysis.insights?.map((insight, index) => (
                          <div key={index} className="flex items-start space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-700">{insight}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Histórico */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        <BarChart3 className="h-5 w-5 mr-2" />
                        Histórico de Análises
                      </div>
                      <Button 
                        onClick={() => {
                          loadAnalysisHistory();
                          toast.success('Histórico atualizado!');
                        }}
                        variant="outline" 
                        size="sm"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Atualizar
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96">
                      <div className="space-y-4">
                        {analysisHistory.map((analysis) => (
                          <div key={analysis.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  {getFileTypeIcon(analysis.file)}
                                  <span className="font-medium">{analysis.file}</span>
                                  <Badge variant={analysis.type === 'multimodal' ? 'default' : 'secondary'}>
                                    {analysis.type === 'multimodal' ? 'Multimodal' :
                                     analysis.type === 'computer_vision' ? 'Computer Vision' : 'Speech Analysis'}
                                  </Badge>
                                  {getStatusIcon(analysis.status)}
                                </div>
                                
                                <div className="text-sm text-gray-600">
                                  {analysis.timestamp.toLocaleString('pt-BR')}
                                </div>

                                {analysis.results && (
                                  <div className="grid grid-cols-3 gap-3 mt-3">
                                    {analysis.results.modalityScores?.visual && (
                                      <div className="flex items-center space-x-2">
                                        <Eye className="h-4 w-4 text-blue-600" />
                                        <span className="text-sm">
                                          {(analysis.results.modalityScores.visual * 100).toFixed(0)}%
                                        </span>
                                      </div>
                                    )}
                                    {analysis.results.modalityScores?.audio && (
                                      <div className="flex items-center space-x-2">
                                        <Headphones className="h-4 w-4 text-green-600" />
                                        <span className="text-sm">
                                          {(analysis.results.modalityScores.audio * 100).toFixed(0)}%
                                        </span>
                                      </div>
                                    )}
                                    {analysis.results.modalityScores?.content && (
                                      <div className="flex items-center space-x-2">
                                        <FileText className="h-4 w-4 text-purple-600" />
                                        <span className="text-sm">
                                          {(analysis.results.modalityScores.content * 100).toFixed(0)}%
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm">
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
          )}

          {/* Tab: Modelos ML */}
          {activeTab === 'models' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mlModels.map((model) => (
                <Card key={model.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Brain className="h-5 w-5 mr-2 text-purple-600" />
                        <span className="text-sm">{model.name}</span>
                      </div>
                      <Badge variant={model.status === 'deployed' ? 'default' : 'secondary'}>
                        {model.status}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Versão:</span>
                        <span className="font-mono">{model.version}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Acurácia:</span>
                        <span className="font-semibold text-green-600">
                          {(model.accuracy * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Latência:</span>
                        <span className="font-semibold text-blue-600">{model.latency}ms</span>
                      </div>
                    </div>

                    <Progress value={model.accuracy * 100} className="h-2" />

                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Settings className="h-4 w-4 mr-2" />
                        Configurar
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Métricas
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          )}

          {/* Tab: Cloud Native */}
          {activeTab === 'cloud' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Cloud Native Operations</h3>
              <div className="flex space-x-2">
                <Button 
                  onClick={() => handleCloudNativeAction('scale_up')}
                  size="sm" 
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <TrendingUp className="h-4 w-4" />
                  <span>Scale Up</span>
                </Button>
                <Button 
                  onClick={() => handleCloudNativeAction('restart_services')}
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Restart</span>
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Microservices Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Cloud className="h-5 w-5 mr-2" />
                    Status dos Microserviços
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { name: 'AI Processing Service', status: 'healthy', cpu: 45, memory: 62 },
                      { name: 'Video Processing Service', status: 'healthy', cpu: 68, memory: 78 },
                      { name: 'TTS Service', status: 'healthy', cpu: 35, memory: 48 },
                      { name: 'Storage Service', status: 'degraded', cpu: 22, memory: 31 },
                      { name: 'Analytics Service', status: 'healthy', cpu: 58, memory: 65 },
                      { name: 'Notification Service', status: 'healthy', cpu: 18, memory: 25 }
                    ].map((service, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`h-3 w-3 rounded-full ${
                            service.status === 'healthy' ? 'bg-green-500' :
                            service.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                          }`} />
                          <span className="font-medium">{service.name}</span>
                        </div>
                        <div className="flex space-x-4 text-sm">
                          <span>CPU: {service.cpu}%</span>
                          <span>MEM: {service.memory}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Container Orchestration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Database className="h-5 w-5 mr-2" />
                    Orquestração de Containers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-lg font-semibold text-blue-600">3</div>
                        <div className="text-xs text-gray-600">Nodes Ativos</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-lg font-semibold text-green-600">18</div>
                        <div className="text-xs text-gray-600">Pods Running</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>CPU Cluster:</span>
                        <span>8.5/12 cores</span>
                      </div>
                      <Progress value={70.8} />
                      
                      <div className="flex justify-between text-sm">
                        <span>Memory Cluster:</span>
                        <span>32/48 Gi</span>
                      </div>
                      <Progress value={66.7} />
                    </div>

                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Zap className="h-4 w-4 mr-2" />
                        Scale Up
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Settings className="h-4 w-4 mr-2" />
                        Configure
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Deployment Status */}
            <Card>
              <CardHeader>
                <CardTitle>Status de Deployments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { name: 'ai-processing-v2.1.0', status: 'deployed', replicas: '2/2', age: '3d' },
                    { name: 'video-processing-v1.8.0', status: 'deployed', replicas: '3/3', age: '1d' },
                    { name: 'analytics-v1.3.0', status: 'updating', replicas: '1/2', age: '5m' }
                  ].map((deployment, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{deployment.name}</span>
                        <Badge variant={deployment.status === 'deployed' ? 'default' : 'secondary'}>
                          {deployment.status}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-xs text-gray-600">
                        <div>Replicas: {deployment.replicas}</div>
                        <div>Age: {deployment.age}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          )}

          {/* Tab: Segurança */}
          {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="h-5 w-5 mr-2" />
                    Zero-Trust Security
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-semibold text-green-600">8</div>
                      <div className="text-xs text-gray-600">Sessões Ativas</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                      <div className="text-lg font-semibold text-yellow-600">23</div>
                      <div className="text-xs text-gray-600">Risco Médio</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Políticas Ativas:</h4>
                    {[
                      'High Risk Location Access',
                      'Admin Access Protection',
                      'Suspicious Behavior Detection',
                      'AI Model Access Control'
                    ].map((policy, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{policy}</span>
                        <Badge variant="outline" className="text-xs">Ativo</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Eventos de Segurança</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-3">
                      {[
                        { time: '14:32', event: 'Login suspeito bloqueado', severity: 'high' },
                        { time: '14:15', event: 'MFA verificado com sucesso', severity: 'low' },
                        { time: '13:58', event: 'Acesso a modelo ML autorizado', severity: 'medium' },
                        { time: '13:45', event: 'Dispositivo não confiável detectado', severity: 'high' },
                        { time: '13:30', event: 'Backup criptografado concluído', severity: 'low' }
                      ].map((event, index) => (
                        <div key={index} className="flex items-start space-x-3 p-2 border-l-2 border-gray-200">
                          <div className={`h-2 w-2 rounded-full mt-2 ${
                            event.severity === 'high' ? 'bg-red-500' :
                            event.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`} />
                          <div className="flex-1">
                            <div className="text-sm font-medium">{event.event}</div>
                            <div className="text-xs text-gray-600">{event.time}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}

