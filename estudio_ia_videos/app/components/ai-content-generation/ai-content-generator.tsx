
'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Sparkles, Zap, Brain, Wand2, FileText,
  Video, Image, Mic, Music, Download,
  Play, Pause, Settings, RefreshCw,
  Copy, Share2, Save, Eye, Target,
  PenTool, Palette, Camera, VolumeX,
  Clock, Users, Award, TrendingUp, BarChart3
} from 'lucide-react';

interface GenerationRequest {
  id: string;
  type: 'script' | 'video' | 'image' | 'audio' | 'presentation' | 'quiz';
  prompt: string;
  parameters: {
    duration?: number;
    style?: string;
    tone?: string;
    audience?: string;
    language?: string;
    format?: string;
  };
  status: 'pending' | 'generating' | 'completed' | 'error';
  progress: number;
  result?: any;
  createdAt: string;
}

interface AITemplate {
  id: string;
  name: string;
  category: 'safety' | 'training' | 'corporate' | 'educational';
  type: 'script' | 'video' | 'presentation';
  description: string;
  prompt: string;
  parameters: any;
  thumbnail: string;
  usage: number;
  rating: number;
}

interface ContentAnalysis {
  quality: number;
  engagement: number;
  clarity: number;
  compliance: number;
  recommendations: string[];
}

const AIContentGenerator = () => {
  const [activeTab, setActiveTab] = useState<'generate' | 'templates' | 'history' | 'analytics'>('generate');
  const [generationType, setGenerationType] = useState<'script' | 'video' | 'image' | 'audio' | 'presentation' | 'quiz'>('script');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  const [generationHistory, setGenerationHistory] = useState<GenerationRequest[]>([
    {
      id: 'gen-1',
      type: 'script',
      prompt: 'Criar roteiro para treinamento NR-10 sobre segurança elétrica',
      parameters: {
        duration: 10,
        tone: 'professional',
        audience: 'workers',
        language: 'pt-BR'
      },
      status: 'completed',
      progress: 100,
      result: {
        content: 'Roteiro completo gerado com 15 seções sobre segurança elétrica...',
        analysis: { quality: 94.5, engagement: 87.2, clarity: 91.8 }
      },
      createdAt: '2024-09-26T14:30:00Z'
    },
    {
      id: 'gen-2',
      type: 'image',
      prompt: 'Gerar imagens ilustrativas para equipamentos de proteção individual',
      parameters: {
        style: 'technical',
        format: 'png'
      },
      status: 'completed',
      progress: 100,
      result: {
        images: ['epi-1.png', 'epi-2.png', 'epi-3.png'],
        analysis: { quality: 89.3, engagement: 82.1 }
      },
      createdAt: '2024-09-26T13:15:00Z'
    },
    {
      id: 'gen-3',
      type: 'quiz',
      prompt: 'Criar questionário interativo sobre NR-33 Espaços Confinados',
      parameters: {
        duration: 5,
        audience: 'supervisors'
      },
      status: 'generating',
      progress: 65,
      createdAt: '2024-09-26T15:00:00Z'
    }
  ]);

  const [aiTemplates] = useState<AITemplate[]>([
    {
      id: 'template-1',
      name: 'Treinamento de Segurança NR',
      category: 'safety',
      type: 'script',
      description: 'Template otimizado para criação de treinamentos de Normas Regulamentadoras',
      prompt: 'Criar treinamento completo sobre {nr_number} focando em {focus_area} para {target_audience}',
      parameters: {
        duration: [5, 60],
        tone: ['professional', 'friendly', 'authoritative'],
        compliance: 'required'
      },
      thumbnail: '🛡️',
      usage: 342,
      rating: 4.8
    },
    {
      id: 'template-2',
      name: 'Apresentação Corporativa',
      category: 'corporate',
      type: 'presentation',
      description: 'Template para apresentações executivas com dados e métricas',
      prompt: 'Criar apresentação executiva sobre {topic} incluindo métricas e análises para {stakeholders}',
      parameters: {
        slides: [10, 50],
        style: ['modern', 'classic', 'minimal'],
        charts: 'included'
      },
      thumbnail: '📊',
      usage: 189,
      rating: 4.6
    },
    {
      id: 'template-3',
      name: 'Conteúdo Educacional Interativo',
      category: 'educational',
      type: 'video',
      description: 'Template para vídeos educacionais com elementos interativos',
      prompt: 'Criar vídeo educacional sobre {subject} com elementos interativos para {age_group}',
      parameters: {
        duration: [3, 30],
        interaction: ['quiz', 'polls', 'exercises'],
        accessibility: 'required'
      },
      thumbnail: '🎓',
      usage: 267,
      rating: 4.9
    }
  ]);

  const [contentAnalytics] = useState({
    totalGenerated: 1247,
    successRate: 96.3,
    averageQuality: 91.5,
    timeSaved: 156.7,
    topCategories: [
      { name: 'Safety Training', count: 523, percentage: 42 },
      { name: 'Corporate Content', count: 287, percentage: 23 },
      { name: 'Educational Material', count: 312, percentage: 25 },
      { name: 'Interactive Quizzes', count: 125, percentage: 10 }
    ]
  });

  // Generation functions
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;

    const newRequest: GenerationRequest = {
      id: `gen-${Date.now()}`,
      type: generationType,
      prompt,
      parameters: {
        tone: 'professional',
        audience: 'workers',
        language: 'pt-BR'
      },
      status: 'generating',
      progress: 0,
      createdAt: new Date().toISOString()
    };

    setGenerationHistory(prev => [newRequest, ...prev]);
    setIsGenerating(true);

    // Simulate generation process
    for (let i = 0; i <= 100; i += 5) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setGenerationHistory(prev => prev.map(req =>
        req.id === newRequest.id ? { ...req, progress: i } : req
      ));
    }

    // Complete generation
    setGenerationHistory(prev => prev.map(req =>
      req.id === newRequest.id ? {
        ...req,
        status: 'completed' as const,
        result: {
          content: `Conteúdo gerado para: ${prompt}`,
          analysis: {
            quality: 85 + Math.random() * 15,
            engagement: 80 + Math.random() * 20,
            clarity: 85 + Math.random() * 15,
            compliance: 90 + Math.random() * 10,
            recommendations: [
              'Adicionar mais exemplos práticos',
              'Incluir checklist de verificação',
              'Otimizar para mobile'
            ]
          }
        }
      } : req
    ));

    setIsGenerating(false);
    setPrompt('');
  }, [prompt, generationType]);

  const handleUseTemplate = useCallback((template: AITemplate) => {
    setSelectedTemplate(template.id);
    setGenerationType(template.type);
    setPrompt(template.prompt);
    setActiveTab('generate');
  }, []);

  const handleRegenerateContent = useCallback((requestId: string) => {
    console.log(`🔄 Regenerando conteúdo: ${requestId}`);
  }, []);

  const handleOptimizeContent = useCallback((requestId: string) => {
    console.log(`✨ Otimizando conteúdo com IA: ${requestId}`);
  }, []);

  const getTypeIcon = (type: GenerationRequest['type']) => {
    switch (type) {
      case 'script': return <FileText className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'image': return <Image className="w-4 h-4" />;
      case 'audio': return <Mic className="w-4 h-4" />;
      case 'presentation': return <PenTool className="w-4 h-4" />;
      case 'quiz': return <Target className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: GenerationRequest['status']) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-900/20';
      case 'generating': return 'text-yellow-400 bg-yellow-900/20';
      case 'error': return 'text-red-400 bg-red-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-purple-400">🤖 AI Content Generator</h2>
          <Badge variant="outline" className="border-purple-400 text-purple-400">
            <Brain className="w-3 h-3 mr-1" />
            GPT-4 Enhanced
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge className="bg-green-900/20 text-green-400 border-green-400">
            {contentAnalytics.successRate}% Taxa de Sucesso
          </Badge>
          
          <Button
            variant="ghost"
            size="sm"
            className="text-blue-400 hover:text-blue-300"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value)} className="h-full flex flex-col">
          <TabsList className="w-full">
            <TabsTrigger value="generate" className="flex-1">Gerar Conteúdo</TabsTrigger>
            <TabsTrigger value="templates" className="flex-1">Templates IA</TabsTrigger>
            <TabsTrigger value="history" className="flex-1">Histórico</TabsTrigger>
            <TabsTrigger value="analytics" className="flex-1">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="generate" className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-6">
              {/* Generation Form */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="w-5 h-5 text-purple-400" />
                    Novo Conteúdo IA
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Tipo de Conteúdo</label>
                      <Select value={generationType} onValueChange={(value) => setGenerationType(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="script">📝 Roteiro</SelectItem>
                          <SelectItem value="video">🎥 Vídeo</SelectItem>
                          <SelectItem value="image">🖼️ Imagem</SelectItem>
                          <SelectItem value="audio">🎵 Áudio</SelectItem>
                          <SelectItem value="presentation">📊 Apresentação</SelectItem>
                          <SelectItem value="quiz">❓ Quiz</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Categoria NR</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a NR" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nr-10">NR-10 - Instalações Elétricas</SelectItem>
                          <SelectItem value="nr-12">NR-12 - Máquinas e Equipamentos</SelectItem>
                          <SelectItem value="nr-18">NR-18 - Construção Civil</SelectItem>
                          <SelectItem value="nr-33">NR-33 - Espaços Confinados</SelectItem>
                          <SelectItem value="nr-35">NR-35 - Trabalho em Altura</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Prompt Detalhado</label>
                    <Textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Descreva detalhadamente o que você deseja gerar..."
                      className="min-h-[120px]"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Tom</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Profissional" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professional">Profissional</SelectItem>
                          <SelectItem value="friendly">Amigável</SelectItem>
                          <SelectItem value="authoritative">Autoritário</SelectItem>
                          <SelectItem value="educational">Educacional</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Público-Alvo</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Trabalhadores" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="workers">Trabalhadores</SelectItem>
                          <SelectItem value="supervisors">Supervisores</SelectItem>
                          <SelectItem value="managers">Gestores</SelectItem>
                          <SelectItem value="executives">Executivos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Duração (min)</label>
                      <Input type="number" placeholder="10" min="1" max="60" />
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={handleGenerate}
                      disabled={!prompt.trim() || isGenerating}
                      className="bg-purple-600 hover:bg-purple-700 flex-1"
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Gerando...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Gerar com IA
                        </>
                      )}
                    </Button>
                    
                    <Button variant="outline" className="px-6">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Templates */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-sm">Templates Rápidos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {aiTemplates.slice(0, 4).map((template) => (
                      <Button
                        key={template.id}
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUseTemplate(template)}
                        className="p-3 h-auto flex flex-col gap-1 hover:bg-gray-700"
                      >
                        <div className="text-lg">{template.thumbnail}</div>
                        <div className="text-xs text-center">{template.name}</div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="templates" className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-4">
              {aiTemplates.map((template) => (
                <Card key={template.id} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="text-3xl">{template.thumbnail}</div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold text-white">{template.name}</h4>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {template.category}
                            </Badge>
                            <Badge className="text-xs bg-blue-900/20 text-blue-400">
                              {template.type}
                            </Badge>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-300 mb-3">{template.description}</p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {template.usage} usos
                          </span>
                          <span className="flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            {template.rating}/5.0
                          </span>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleUseTemplate(template)}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            <Wand2 className="w-3 h-3 mr-1" />
                            Usar Template
                          </Button>
                          <Button size="sm" variant="ghost" className="text-xs">
                            Personalizar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="history" className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-3">
              {generationHistory.map((request) => (
                <Card key={request.id} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="text-purple-400">{getTypeIcon(request.type)}</div>
                          <span className="text-sm font-medium">{request.type.toUpperCase()}</span>
                          <Badge className={`text-xs ${getStatusColor(request.status)}`}>
                            {request.status}
                          </Badge>
                        </div>
                        
                        <div className="text-xs text-gray-400">
                          {formatTime(request.createdAt)}
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-300">{request.prompt}</p>
                      
                      {request.status === 'generating' && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span>Gerando...</span>
                            <span>{request.progress}%</span>
                          </div>
                          <Progress value={request.progress} className="h-2" />
                        </div>
                      )}
                      
                      {request.status === 'completed' && request.result && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-4 gap-3 text-xs">
                            {request.result.analysis && (
                              <>
                                <div className="bg-gray-700 p-2 rounded text-center">
                                  <div className="font-semibold text-green-400">
                                    {request.result.analysis.quality?.toFixed(1)}%
                                  </div>
                                  <div className="text-gray-400">Qualidade</div>
                                </div>
                                <div className="bg-gray-700 p-2 rounded text-center">
                                  <div className="font-semibold text-blue-400">
                                    {request.result.analysis.engagement?.toFixed(1)}%
                                  </div>
                                  <div className="text-gray-400">Engajamento</div>
                                </div>
                                <div className="bg-gray-700 p-2 rounded text-center">
                                  <div className="font-semibold text-purple-400">
                                    {request.result.analysis.clarity?.toFixed(1)}%
                                  </div>
                                  <div className="text-gray-400">Clareza</div>
                                </div>
                                <div className="bg-gray-700 p-2 rounded text-center">
                                  <div className="font-semibold text-yellow-400">
                                    {request.result.analysis.compliance?.toFixed(1)}%
                                  </div>
                                  <div className="text-gray-400">Compliance</div>
                                </div>
                              </>
                            )}
                          </div>
                          
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="text-xs">
                              <Eye className="w-3 h-3 mr-1" />
                              Ver Resultado
                            </Button>
                            <Button size="sm" variant="ghost" className="text-xs">
                              <Download className="w-3 h-3 mr-1" />
                              Download
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRegenerateContent(request.id)}
                              className="text-xs text-purple-400"
                            >
                              <RefreshCw className="w-3 h-3 mr-1" />
                              Regenerar
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOptimizeContent(request.id)}
                              className="text-xs text-green-400"
                            >
                              <Sparkles className="w-3 h-3 mr-1" />
                              Otimizar
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="analytics" className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-6">
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-400">{contentAnalytics.totalGenerated}</div>
                    <div className="text-sm text-gray-400">Conteúdos Gerados</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-400">{contentAnalytics.successRate}%</div>
                    <div className="text-sm text-gray-400">Taxa de Sucesso</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-400">{contentAnalytics.averageQuality}</div>
                    <div className="text-sm text-gray-400">Qualidade Média</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-400">{contentAnalytics.timeSaved}h</div>
                    <div className="text-sm text-gray-400">Tempo Economizado</div>
                  </CardContent>
                </Card>
              </div>

              {/* Category Distribution */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-400" />
                    Distribuição por Categoria
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {contentAnalytics.topCategories.map((category, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">{category.name}</span>
                        <span className="text-white">{category.count} ({category.percentage}%)</span>
                      </div>
                      <Progress value={category.percentage} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Performance Trends */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    Tendências de Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-700 p-3 rounded">
                      <div className="text-lg font-bold text-green-400">+23%</div>
                      <div className="text-sm text-gray-400">Qualidade vs mês passado</div>
                    </div>
                    <div className="bg-gray-700 p-3 rounded">
                      <div className="text-lg font-bold text-blue-400">+18%</div>
                      <div className="text-sm text-gray-400">Velocidade de geração</div>
                    </div>
                    <div className="bg-gray-700 p-3 rounded">
                      <div className="text-lg font-bold text-purple-400">+31%</div>
                      <div className="text-sm text-gray-400">Satisfação do usuário</div>
                    </div>
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

export default AIContentGenerator;
