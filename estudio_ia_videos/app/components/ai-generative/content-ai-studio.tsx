
/**
 * 🤖 Estúdio IA de Vídeos - Sprint 8
 * Content AI Studio - Interface para IA Generativa
 */

'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import {
  Brain,
  Sparkles,
  FileText,
  Mic,
  Settings,
  Download,
  Copy,
  RefreshCw,
  BarChart3,
  Target,
  Zap,
  Clock,
  Users,
  Star,
  CheckCircle,
  AlertCircle,
  Loader
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface GeneratedContent {
  content: string;
  quality?: {
    score: number;
  };
  metadata?: {
    wordCount: number;
    readingTime: number;
    complexity: number;
  };
}

interface Analysis {
  factors: Record<string, number>;
  strengths: string[];
  improvements: string[];
}

interface ContentRequest {
  type: string;
  context: {
    topic: string;
    audience: string;
    industry: string;
    duration: number;
    tone: string;
    complexity: string;
  };
  requirements: {
    keywords: string[];
    compliance: string[];
    callToAction: string;
  };
  existingContent?: string;
}

export default function ContentAIStudio() {
  const [contentType, setContentType] = useState('script');
  const [topic, setTopic] = useState('');
  const [audience, setAudience] = useState('workers');
  const [industry, setIndustry] = useState('construction');
  const [tone, setTone] = useState('friendly');
  const [complexity, setComplexity] = useState('intermediate');
  const [duration, setDuration] = useState([300]); // 5 minutos em segundos
  const [keywords, setKeywords] = useState('');
  const [compliance, setCompliance] = useState(['NR-10']);
  const [existingContent, setExistingContent] = useState('');
  
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [variations, setVariations] = useState<string[]>([]);

  const contentTypes = [
    { value: 'script', label: 'Script de Vídeo', icon: FileText },
    { value: 'narration', label: 'Narração TTS', icon: Mic },
    { value: 'description', label: 'Descrição', icon: FileText },
    { value: 'title', label: 'Título', icon: Target },
    { value: 'summary', label: 'Resumo', icon: BarChart3 }
  ];

  const audiences = [
    { value: 'workers', label: 'Trabalhadores', icon: '👷' },
    { value: 'supervisors', label: 'Supervisores', icon: '👨‍💼' },
    { value: 'executives', label: 'Executivos', icon: '💼' },
    { value: 'mixed', label: 'Misto', icon: '👥' }
  ];

  const industries = [
    { value: 'construction', label: 'Construção Civil' },
    { value: 'manufacturing', label: 'Indústria' },
    { value: 'healthcare', label: 'Saúde' },
    { value: 'education', label: 'Educação' },
    { value: 'retail', label: 'Varejo' },
    { value: 'tech', label: 'Tecnologia' }
  ];

  const tones = [
    { value: 'formal', label: 'Formal' },
    { value: 'friendly', label: 'Amigável' },
    { value: 'authoritative', label: 'Autoritativo' },
    { value: 'engaging', label: 'Envolvente' }
  ];

  const complexities = [
    { value: 'basic', label: 'Básico' },
    { value: 'intermediate', label: 'Intermediário' },
    { value: 'advanced', label: 'Avançado' }
  ];

  const complianceOptions = [
    'NR-10', 'NR-12', 'NR-33', 'NR-35', 'ISO-45001', 'CIPA'
  ];

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error('Digite um tópico para gerar conteúdo');
      return;
    }

    setIsGenerating(true);
    try {
      const request: ContentRequest = {
        type: contentType,
        context: {
          topic,
          audience,
          industry,
          duration: duration[0],
          tone,
          complexity
        },
        requirements: {
          keywords: keywords.split(',').map(k => k.trim()).filter(k => k),
          compliance,
          callToAction: 'Aplique estes conhecimentos em seu ambiente de trabalho'
        },
        existingContent: existingContent || undefined
      };

      const response = await fetch('/api/ai-generative/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      if (!response.ok) throw new Error('Falha na geração');

      const result = await response.json();
      setGeneratedContent(result);
      
      // Análise automática do conteúdo gerado
      if (result.content) {
        await analyzeContent(result.content);
      }

      toast.success('Conteúdo gerado com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar conteúdo: ' + (error as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const analyzeContent = async (content: string) => {
    try {
      const response = await fetch('/api/ai-generative/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          context: { topic, audience, industry, tone }
        })
      });

      if (response.ok) {
        const result = await response.json();
        setAnalysis(result);
      }
    } catch (error) {
      logger.error('Erro na análise', error instanceof Error ? error : new Error(String(error)), { component: 'ContentAIStudio' });
    }
  };

  const generateVariations = async (variationType: string) => {
    if (!generatedContent?.content) return;

    try {
      const response = await fetch('/api/ai-generative/variations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseContent: generatedContent.content,
          context: { audience, industry },
          variationType
        })
      });

      if (response.ok) {
        const result = await response.json();
        setVariations(result.variations || []);
        toast.success(`${result.variations?.length || 0} variações geradas`);
      }
    } catch (error) {
      toast.error('Erro ao gerar variações');
    }
  };

  const optimizeContent = async () => {
    if (!generatedContent?.content) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai-generative/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: generatedContent.content,
          context: { topic, audience, industry, tone, complexity },
          goals: ['Aumentar engajamento', 'Melhorar clareza', 'Otimizar para TTS']
        })
      });

      if (response.ok) {
        const result = await response.json();
        setGeneratedContent(result);
        toast.success('Conteúdo otimizado com sucesso!');
      }
    } catch (error) {
      toast.error('Erro na otimização');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Content AI Studio</h1>
              <p className="text-gray-600">Geração avançada de conteúdo com inteligência artificial</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="flex items-center space-x-1">
              <Sparkles className="h-3 w-3" />
              <span>IA Generativa</span>
            </Badge>
            <Badge variant="secondary" className="flex items-center space-x-1">
              <Zap className="h-3 w-3" />
              <span>Otimização Automática</span>
            </Badge>
            <Badge variant="secondary" className="flex items-center space-x-1">
              <Target className="h-3 w-3" />
              <span>Análise de Qualidade</span>
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Painel de Configuração */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Configurações</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Tipo de Conteúdo */}
                <div>
                  <label className="block text-sm font-medium mb-3">Tipo de Conteúdo</label>
                  <div className="grid grid-cols-2 gap-2">
                    {contentTypes.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setContentType(type.value)}
                        className={`p-3 rounded-lg border text-sm transition-all ${
                          contentType === type.value
                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <type.icon className="h-4 w-4 mx-auto mb-1" />
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tópico */}
                <div>
                  <label className="block text-sm font-medium mb-2">Tópico Principal</label>
                  <Textarea
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Ex: Uso correto de EPIs na construção civil"
                    className="h-20"
                  />
                </div>

                {/* Audiência */}
                <div>
                  <label className="block text-sm font-medium mb-3">Audiência</label>
                  <div className="grid grid-cols-2 gap-2">
                    {audiences.map((aud) => (
                      <button
                        key={aud.value}
                        onClick={() => setAudience(aud.value)}
                        className={`p-3 rounded-lg border text-sm transition-all ${
                          audience === aud.value
                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-lg mb-1 block">{aud.icon}</span>
                        {aud.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Indústria e Tom */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Indústria</label>
                    <Select value={industry} onValueChange={setIndustry}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {industries.map(ind => (
                          <SelectItem key={ind.value} value={ind.value}>
                            {ind.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Tom</label>
                    <Select value={tone} onValueChange={setTone}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {tones.map(t => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Complexidade e Duração */}
                <div>
                  <label className="block text-sm font-medium mb-2">Complexidade</label>
                  <Select value={complexity} onValueChange={setComplexity}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {complexities.map(comp => (
                        <SelectItem key={comp.value} value={comp.value}>
                          {comp.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Duração: {Math.floor(duration[0] / 60)} min {duration[0] % 60}s
                  </label>
                  <Slider
                    value={duration}
                    onValueChange={setDuration}
                    min={60}
                    max={1800}
                    step={30}
                    className="w-full"
                  />
                </div>

                {/* Palavras-chave */}
                <div>
                  <label className="block text-sm font-medium mb-2">Palavras-chave</label>
                  <Input
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="segurança, EPI, prevenção"
                  />
                </div>

                {/* Compliance */}
                <div>
                  <label className="block text-sm font-medium mb-3">Normas de Compliance</label>
                  <div className="flex flex-wrap gap-2">
                    {complianceOptions.map(norm => (
                      <button
                        key={norm}
                        onClick={() => {
                          setCompliance(prev => 
                            prev.includes(norm) 
                              ? prev.filter(n => n !== norm)
                              : [...prev, norm]
                          );
                        }}
                        className={`px-3 py-1 rounded-full text-sm transition-all ${
                          compliance.includes(norm)
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {norm}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Botão de Gerar */}
                <Button 
                  onClick={handleGenerate}
                  disabled={isGenerating || !topic.trim()}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Gerar Conteúdo
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Área de Resultado */}
          <div className="lg:col-span-2 space-y-6">
            {generatedContent ? (
              <>
                {/* Conteúdo Gerado */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-5 w-5" />
                        <span>Conteúdo Gerado</span>
                        {generatedContent.quality && (
                          <Badge 
                            variant={generatedContent.quality.score >= 80 ? "default" : "secondary"}
                            className="ml-2"
                          >
                            <Star className="h-3 w-3 mr-1" />
                            {generatedContent.quality.score}/100
                          </Badge>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={optimizeContent}
                          disabled={isGenerating}
                        >
                          <Zap className="h-4 w-4 mr-2" />
                          Otimizar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(generatedContent.content)}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copiar
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <pre className="whitespace-pre-wrap text-sm text-gray-800">
                        {generatedContent.content}
                      </pre>
                    </div>

                    {/* Metadados */}
                    {generatedContent.metadata && (
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <FileText className="h-4 w-4" />
                          <span>{generatedContent.metadata.wordCount} palavras</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{generatedContent.metadata.readingTime} min de leitura</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <BarChart3 className="h-4 w-4" />
                          <span>
                            Complexidade: {
                              generatedContent.metadata.complexity === 1 ? 'Básica' :
                              generatedContent.metadata.complexity === 2 ? 'Intermediária' : 'Avançada'
                            }
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Análise de Qualidade */}
                {analysis && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <BarChart3 className="h-5 w-5" />
                        <span>Análise de Qualidade</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {Object.entries(analysis.factors).map(([factor, score]) => (
                          <div key={factor} className="text-center">
                            <div className="text-2xl font-bold text-purple-600">{score}</div>
                            <div className="text-sm text-gray-600 capitalize">
                              {factor.replace('_', ' ')}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Pontos Fortes */}
                        <div>
                          <h4 className="font-semibold text-green-700 mb-3 flex items-center">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Pontos Fortes
                          </h4>
                          <ul className="space-y-1">
                            {analysis.strengths.map((strength, index) => (
                              <li key={index} className="text-sm text-gray-600 flex items-start">
                                <span className="text-green-500 mr-2">•</span>
                                {strength}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Melhorias */}
                        <div>
                          <h4 className="font-semibold text-orange-700 mb-3 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-2" />
                            Sugestões de Melhoria
                          </h4>
                          <ul className="space-y-1">
                            {analysis.improvements.map((improvement, index) => (
                              <li key={index} className="text-sm text-gray-600 flex items-start">
                                <span className="text-orange-500 mr-2">•</span>
                                {improvement}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Variações e Ações */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <RefreshCw className="h-5 w-5" />
                      <span>Variações e Otimizações</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateVariations('tone')}
                      >
                        Variar Tom
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateVariations('complexity')}
                      >
                        Variar Complexidade
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateVariations('length')}
                      >
                        Variar Tamanho
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateVariations('audience')}
                      >
                        Variar Audiência
                      </Button>
                    </div>

                    {variations.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="font-semibold">Variações Geradas:</h4>
                        {variations.map((variation, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-medium text-sm">Variação {index + 1}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(variation)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="text-sm text-gray-700 line-clamp-3">{variation}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="h-96 flex items-center justify-center">
                <div className="text-center">
                  <Brain className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">
                    Pronto para Gerar Conteúdo
                  </h3>
                  <p className="text-gray-500">
                    Configure os parâmetros à esquerda e clique em "Gerar Conteúdo"
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
