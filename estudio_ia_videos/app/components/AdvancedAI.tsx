'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

import { 
  useAdvancedAI, 
  ContentGenerationRequest, 
  AIInsight, 
  SentimentAnalysisResult, 
  ContentOptimization,
  AIModel,
  ContentGenerationResult as GenerationHistoryItem
} from '@/hooks/useAdvancedAI';

import { 
  Brain, 
  Sparkles, 
  Wand2, 
  MessageSquare, 
  TrendingUp, 
  Target, 
  Lightbulb, 
  Zap, 
  BarChart3, 
  Users, 
  Globe, 
  FileText, 
  Image, 
  Mic, 
  Video, 
  Download, 
  Upload, 
  RefreshCw, 
  Play, 
  Pause, 
  Square, 
  Copy, 
  Check, 
  X, 
  AlertCircle, 
  Info, 
  Settings, 
  Filter, 
  Search,
  ChevronRight,
  Star,
  ThumbsUp,
  ThumbsDown,
  Clock,
  DollarSign,
  Activity
} from 'lucide-react';

const CONTENT_TYPE_OPTIONS = ['text', 'image', 'audio', 'video_script', 'slide_content', 'quiz_questions'] as const;
type ContentTypeOption = (typeof CONTENT_TYPE_OPTIONS)[number];

const isContentTypeOption = (value: string): value is ContentTypeOption => {
  return CONTENT_TYPE_OPTIONS.some((option) => option === value);
};

export const AdvancedAI: React.FC = () => {
  const {
    models,
    isLoading,
    error,
    generationHistory,
    insights,
    usageStats,
    generateContent,
    generatePersonalizedContent,
    analyzeSentiment,
    optimizeContent,
    getSmartSuggestions,
    autoCompleteContent,
    translateContent,
    summarizeContent,
    markInsightAsRead,
    executeInsightAction,
    cancelGeneration
  } = useAdvancedAI();

  const [activeTab, setActiveTab] = useState('generate');
  const [selectedModel, setSelectedModel] = useState('');
  const [generationRequest, setGenerationRequest] = useState<Partial<ContentGenerationRequest>>({
    type: 'text',
    prompt: '',
    parameters: {
      temperature: 0.7,
      maxTokens: 1000,
      tone: 'professional',
      language: 'pt-BR'
    }
  });
  const [analysisContent, setAnalysisContent] = useState('');
  const [sentimentResult, setSentimentResult] = useState<SentimentAnalysisResult | null>(null);
  const [optimizationResult, setOptimizationResult] = useState<ContentOptimization | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [autoCompletions, setAutoCompletions] = useState<string[]>([]);
  const [translatedContent, setTranslatedContent] = useState('');
  const [summarizedContent, setSummarizedContent] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle content generation
  const handleGenerate = useCallback(async () => {
    if (!generationRequest.prompt || !selectedModel) return;

    const request: ContentGenerationRequest = {
      type: generationRequest.type || 'text',
      prompt: generationRequest.prompt,
      model: selectedModel,
      parameters: generationRequest.parameters || {},
      context: generationRequest.context
    };

    await generateContent(request);
  }, [generationRequest, selectedModel, generateContent]);

  // Handle sentiment analysis
  const handleAnalyzeSentiment = useCallback(async () => {
    if (!analysisContent.trim()) return;
    
    const result = await analyzeSentiment(analysisContent);
    setSentimentResult(result);
  }, [analysisContent, analyzeSentiment]);

  // Handle content optimization
  const handleOptimizeContent = useCallback(async () => {
    if (!analysisContent.trim()) return;
    
    const result = await optimizeContent(analysisContent);
    if (result && typeof result === 'object' && 'score' in result) {
      setOptimizationResult(result as ContentOptimization);
    }
  }, [analysisContent, optimizeContent]);

  // Handle smart suggestions
  const handleGetSuggestions = useCallback(async () => {
    const context = {
      currentContent: analysisContent,
      contentType: generationRequest.type,
      targetAudience: 'professionals',
      objectives: ['engagement', 'clarity', 'compliance']
    };
    
    const result = await getSmartSuggestions(context);
    setSuggestions(result);
  }, [analysisContent, generationRequest.type, getSmartSuggestions]);

  // Handle auto-completion
  const handleAutoComplete = useCallback(async () => {
    if (!analysisContent.trim()) return;
    
    const completions = await autoCompleteContent(analysisContent);
    setAutoCompletions(completions);
  }, [analysisContent, autoCompleteContent]);

  // Handle translation
  const handleTranslate = useCallback(async (targetLanguage: string) => {
    if (!analysisContent.trim()) return;
    
    const result = await translateContent(analysisContent, targetLanguage);
    if (result) {
      setTranslatedContent(result);
    }
  }, [analysisContent, translateContent]);

  // Handle summarization
  const handleSummarize = useCallback(async (style: 'bullet_points' | 'paragraph' | 'key_points' = 'paragraph') => {
    if (!analysisContent.trim()) return;
    
    const result = await summarizeContent(analysisContent, 200, style);
    if (result) {
      setSummarizedContent(result);
    }
  }, [analysisContent, summarizeContent]);

  // Get sentiment color
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-50';
      case 'negative': return 'text-red-600 bg-red-50';
      case 'neutral': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Get insight priority color
  const getInsightPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        <AlertCircle className="h-8 w-8 mr-2" />
        <span>Erro: {error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">IA Avançada</h2>
          <p className="text-muted-foreground">
            Funcionalidades inteligentes para geração, análise e otimização de conteúdo
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {isLoading && (
            <Button variant="outline" onClick={cancelGeneration}>
              <Square className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          )}
        </div>
      </div>

      {/* Usage Statistics */}
      {usageStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Requisições</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usageStats.totalRequests}</div>
              <p className="text-xs text-muted-foreground">
                {usageStats.successRate.toFixed(1)}% de sucesso
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tokens Usados</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usageStats.totalTokensUsed.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Tempo médio: {usageStats.averageResponseTime.toFixed(1)}s
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Custo Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${usageStats.totalCost.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Este mês
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Satisfação</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usageStats.userSatisfaction.toFixed(1)}/5</div>
              <p className="text-xs text-muted-foreground">
                Avaliação dos usuários
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="generate">Geração</TabsTrigger>
          <TabsTrigger value="analyze">Análise</TabsTrigger>
          <TabsTrigger value="optimize">Otimização</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          <ContentGenerationPanel
            models={models}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            request={generationRequest}
            onRequestChange={setGenerationRequest}
            onGenerate={handleGenerate}
            isLoading={isLoading}
            history={generationHistory}
          />
        </TabsContent>

        <TabsContent value="analyze" className="space-y-4">
          <ContentAnalysisPanel
            content={analysisContent}
            onContentChange={setAnalysisContent}
            sentimentResult={sentimentResult}
            onAnalyzeSentiment={handleAnalyzeSentiment}
            suggestions={suggestions}
            onGetSuggestions={handleGetSuggestions}
            autoCompletions={autoCompletions}
            onAutoComplete={handleAutoComplete}
            translatedContent={translatedContent}
            onTranslate={handleTranslate}
            summarizedContent={summarizedContent}
            onSummarize={handleSummarize}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="optimize" className="space-y-4">
          <ContentOptimizationPanel
            content={analysisContent}
            onContentChange={setAnalysisContent}
            optimizationResult={optimizationResult}
            onOptimize={handleOptimizeContent}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <AIInsightsPanel
            insights={insights}
            onMarkAsRead={markInsightAsRead}
            onExecuteAction={executeInsightAction}
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <GenerationHistoryPanel history={generationHistory} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Content Generation Panel
const ContentGenerationPanel: React.FC<{
  models: AIModel[];
  selectedModel: string;
  onModelChange: (model: string) => void;
  request: Partial<ContentGenerationRequest>;
  onRequestChange: (request: Partial<ContentGenerationRequest>) => void;
  onGenerate: () => void;
  isLoading: boolean;
  history: GenerationHistoryItem[];
}> = ({ models, selectedModel, onModelChange, request, onRequestChange, onGenerate, isLoading, history }) => {
  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return <FileText className="h-4 w-4" />;
      case 'image': return <Image className="h-4 w-4" />;
      case 'audio': return <Mic className="h-4 w-4" />;
      case 'video_script': return <Video className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Generation Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5" />
            <span>Geração de Conteúdo</span>
          </CardTitle>
          <CardDescription>
            Configure os parâmetros e gere conteúdo inteligente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Content Type */}
          <div>
            <Label>Tipo de Conteúdo</Label>
            <Select 
              value={request.type} 
              onValueChange={(value) => {
                if (!isContentTypeOption(value)) {
                  return;
                }

                onRequestChange({ ...request, type: value });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>Texto</span>
                  </div>
                </SelectItem>
                <SelectItem value="image">
                  <div className="flex items-center space-x-2">
                    <Image className="h-4 w-4" />
                    <span>Imagem</span>
                  </div>
                </SelectItem>
                <SelectItem value="audio">
                  <div className="flex items-center space-x-2">
                    <Mic className="h-4 w-4" />
                    <span>Áudio</span>
                  </div>
                </SelectItem>
                <SelectItem value="video_script">
                  <div className="flex items-center space-x-2">
                    <Video className="h-4 w-4" />
                    <span>Script de Vídeo</span>
                  </div>
                </SelectItem>
                <SelectItem value="slide_content">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>Conteúdo de Slide</span>
                  </div>
                </SelectItem>
                <SelectItem value="quiz_questions">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-4 w-4" />
                    <span>Questões de Quiz</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Model Selection */}
          <div>
            <Label>Modelo de IA</Label>
            <Select value={selectedModel} onValueChange={onModelChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o modelo" />
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{model.name}</span>
                      <Badge variant={model.isAvailable ? 'default' : 'secondary'}>
                        {model.provider}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Prompt */}
          <div>
            <Label>Prompt</Label>
            <Textarea
              placeholder="Descreva o que você quer gerar..."
              value={request.prompt}
              onChange={(e) => onRequestChange({ ...request, prompt: e.target.value })}
              rows={4}
            />
          </div>

          {/* Parameters */}
          <div className="space-y-3">
            <Label>Parâmetros</Label>
            
            {/* Temperature */}
            <div>
              <div className="flex justify-between">
                <Label className="text-sm">Criatividade</Label>
                <span className="text-sm text-muted-foreground">
                  {request.parameters?.temperature || 0.7}
                </span>
              </div>
              <Slider
                value={[request.parameters?.temperature || 0.7]}
                onValueChange={([value]) => 
                  onRequestChange({
                    ...request,
                    parameters: { ...request.parameters, temperature: value }
                  })
                }
                max={1}
                min={0}
                step={0.1}
                className="mt-1"
              />
            </div>

            {/* Max Tokens */}
            <div>
              <div className="flex justify-between">
                <Label className="text-sm">Tamanho Máximo</Label>
                <span className="text-sm text-muted-foreground">
                  {request.parameters?.maxTokens || 1000} tokens
                </span>
              </div>
              <Slider
                value={[request.parameters?.maxTokens || 1000]}
                onValueChange={([value]) => 
                  onRequestChange({
                    ...request,
                    parameters: { ...request.parameters, maxTokens: value }
                  })
                }
                max={4000}
                min={100}
                step={100}
                className="mt-1"
              />
            </div>

            {/* Tone */}
            <div>
              <Label className="text-sm">Tom</Label>
              <Select 
                value={request.parameters?.tone} 
                onValueChange={(value) => 
                  onRequestChange({
                    ...request,
                    parameters: { ...request.parameters, tone: value }
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tom" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Profissional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="friendly">Amigável</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="enthusiastic">Entusiasmado</SelectItem>
                  <SelectItem value="educational">Educacional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Language */}
            <div>
              <Label className="text-sm">Idioma</Label>
              <Select 
                value={request.parameters?.language} 
                onValueChange={(value) => 
                  onRequestChange({
                    ...request,
                    parameters: { ...request.parameters, language: value }
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o idioma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                  <SelectItem value="en-US">English (US)</SelectItem>
                  <SelectItem value="es-ES">Español</SelectItem>
                  <SelectItem value="fr-FR">Français</SelectItem>
                  <SelectItem value="de-DE">Deutsch</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Generate Button */}
          <Button 
            onClick={onGenerate} 
            disabled={!request.prompt || !selectedModel || isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
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

      {/* Recent Generations */}
      <Card>
        <CardHeader>
          <CardTitle>Gerações Recentes</CardTitle>
          <CardDescription>
            Histórico das últimas gerações de conteúdo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {history.slice(0, 10).map((item) => (
                <Card key={item.id} className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      {getContentTypeIcon(item.type)}
                      <div>
                        <div className="font-medium text-sm">{item.type}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.metadata.model} • {item.metadata.tokensUsed} tokens
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Badge variant="outline" className="text-xs">
                        ${item.metadata.cost.toFixed(3)}
                      </Badge>
                      <Button size="sm" variant="ghost">
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground line-clamp-2">
                    {typeof item.content === 'string' ? item.content : 'Conteúdo binário'}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {item.createdAt.toLocaleString()}
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

// Content Analysis Panel
const ContentAnalysisPanel: React.FC<{
  content: string;
  onContentChange: (content: string) => void;
  sentimentResult: SentimentAnalysisResult | null;
  onAnalyzeSentiment: () => void;
  suggestions: string[];
  onGetSuggestions: () => void;
  autoCompletions: string[];
  onAutoComplete: () => void;
  translatedContent: string;
  onTranslate: (language: string) => void;
  summarizedContent: string;
  onSummarize: (style?: 'bullet_points' | 'paragraph' | 'key_points') => void;
  isLoading: boolean;
}> = ({ 
  content, 
  onContentChange, 
  sentimentResult, 
  onAnalyzeSentiment,
  suggestions,
  onGetSuggestions,
  autoCompletions,
  onAutoComplete,
  translatedContent,
  onTranslate,
  summarizedContent,
  onSummarize,
  isLoading 
}) => {
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-50';
      case 'negative': return 'text-red-600 bg-red-50';
      case 'neutral': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Analysis Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Análise de Conteúdo</span>
          </CardTitle>
          <CardDescription>
            Analise sentimento, obtenha sugestões e otimize seu conteúdo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Content Input */}
          <div>
            <Label>Conteúdo para Análise</Label>
            <Textarea
              placeholder="Cole ou digite o conteúdo que deseja analisar..."
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              rows={8}
            />
          </div>

          {/* Analysis Actions */}
          <div className="grid grid-cols-2 gap-2">
            <Button 
              onClick={onAnalyzeSentiment} 
              disabled={!content.trim() || isLoading}
              variant="outline"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Sentimento
            </Button>
            <Button 
              onClick={onGetSuggestions} 
              disabled={!content.trim() || isLoading}
              variant="outline"
            >
              <Lightbulb className="h-4 w-4 mr-2" />
              Sugestões
            </Button>
            <Button 
              onClick={onAutoComplete} 
              disabled={!content.trim() || isLoading}
              variant="outline"
            >
              <Wand2 className="h-4 w-4 mr-2" />
              Completar
            </Button>
            <Button 
              onClick={() => onSummarize()} 
              disabled={!content.trim() || isLoading}
              variant="outline"
            >
              <FileText className="h-4 w-4 mr-2" />
              Resumir
            </Button>
          </div>

          {/* Translation */}
          <div>
            <Label>Traduzir para:</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => onTranslate('en-US')}
                disabled={!content.trim() || isLoading}
              >
                English
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => onTranslate('es-ES')}
                disabled={!content.trim() || isLoading}
              >
                Español
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => onTranslate('fr-FR')}
                disabled={!content.trim() || isLoading}
              >
                Français
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      <div className="space-y-4">
        {/* Sentiment Analysis */}
        {sentimentResult && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Análise de Sentimento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Overall Sentiment */}
              <div className="flex items-center justify-between">
                <span className="font-medium">Sentimento Geral:</span>
                <Badge className={getSentimentColor(sentimentResult.overall.sentiment)}>
                  {sentimentResult.overall.sentiment}
                </Badge>
              </div>
              
              {/* Score */}
              <div>
                <div className="flex justify-between text-sm">
                  <span>Score</span>
                  <span>{sentimentResult.overall.score.toFixed(2)}</span>
                </div>
                <Progress 
                  value={(sentimentResult.overall.score + 1) * 50} 
                  className="mt-1"
                />
              </div>

              {/* Emotions */}
              <div>
                <Label className="text-sm font-medium">Emoções</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {Object.entries(sentimentResult.emotions).map(([emotion, value]) => (
                    <div key={emotion} className="flex justify-between text-sm">
                      <span className="capitalize">{emotion}</span>
                      <span>{(value * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Keywords */}
              <div>
                <Label className="text-sm font-medium">Palavras-chave</Label>
                <div className="flex flex-wrap gap-1 mt-2">
                  {sentimentResult.keywords.slice(0, 10).map((keyword) => (
                    <Badge 
                      key={keyword.word} 
                      variant="outline" 
                      className={keyword.sentiment > 0 ? 'border-green-200' : keyword.sentiment < 0 ? 'border-red-200' : 'border-gray-200'}
                    >
                      {keyword.word}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sugestões Inteligentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-start space-x-2 p-2 bg-blue-50 rounded">
                    <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5" />
                    <span className="text-sm">{suggestion}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Auto Completions */}
        {autoCompletions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sugestões de Continuação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {autoCompletions.map((completion, index) => (
                  <div key={index} className="p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100">
                    <span className="text-sm">{completion}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Translation Result */}
        {translatedContent && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tradução</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-sm">{translatedContent}</p>
              </div>
              <Button size="sm" variant="outline" className="mt-2">
                <Copy className="h-3 w-3 mr-1" />
                Copiar
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Summary Result */}
        {summarizedContent && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-sm">{summarizedContent}</p>
              </div>
              <Button size="sm" variant="outline" className="mt-2">
                <Copy className="h-3 w-3 mr-1" />
                Copiar
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

// Content Optimization Panel
const ContentOptimizationPanel: React.FC<{
  content: string;
  onContentChange: (content: string) => void;
  optimizationResult: ContentOptimization | null;
  onOptimize: () => void;
  isLoading: boolean;
}> = ({ content, onContentChange, optimizationResult, onOptimize, isLoading }) => {
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getSuggestionTypeIcon = (type: string) => {
    switch (type) {
      case 'error': return <X className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'improvement': return <Lightbulb className="h-4 w-4 text-blue-500" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Optimization Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Otimização de Conteúdo</span>
          </CardTitle>
          <CardDescription>
            Analise e otimize seu conteúdo para melhor performance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Content Input */}
          <div>
            <Label>Conteúdo para Otimização</Label>
            <Textarea
              placeholder="Cole ou digite o conteúdo que deseja otimizar..."
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              rows={10}
            />
          </div>

          {/* Optimize Button */}
          <Button 
            onClick={onOptimize} 
            disabled={!content.trim() || isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Target className="h-4 w-4 mr-2" />
                Otimizar Conteúdo
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Optimization Results */}
      {optimizationResult && (
        <div className="space-y-4">
          {/* Overall Score */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Score de Otimização</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">{optimizationResult.score}/100</div>
                <Progress value={optimizationResult.score} className="mb-4" />
              </div>
              
              {/* Metrics */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Legibilidade:</span>
                  <span className="ml-2 font-medium">{optimizationResult.metrics.readabilityScore}/100</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Engajamento:</span>
                  <span className="ml-2 font-medium">{optimizationResult.metrics.engagementScore}/100</span>
                </div>
                <div>
                  <span className="text-muted-foreground">SEO:</span>
                  <span className="ml-2 font-medium">{optimizationResult.metrics.seoScore}/100</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Acessibilidade:</span>
                  <span className="ml-2 font-medium">{optimizationResult.metrics.accessibilityScore}/100</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sugestões de Melhoria</CardTitle>
              <CardDescription>
                {optimizationResult.suggestions.length} sugestões encontradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {optimizationResult.suggestions.map((suggestion) => (
                    <Card key={suggestion.id} className="p-3">
                      <div className="flex items-start space-x-3">
                        {getSuggestionTypeIcon(suggestion.type)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm">{suggestion.title}</h4>
                            <div className="flex items-center space-x-1">
                              <Badge className={getImpactColor(suggestion.impact)} variant="outline">
                                {suggestion.impact}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {suggestion.category}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {suggestion.description}
                          </p>
                          
                          {/* Original vs Suggested Text */}
                          {suggestion.originalText && suggestion.suggestedText && (
                            <div className="mt-2 space-y-2">
                              <div className="p-2 bg-red-50 border border-red-200 rounded text-xs">
                                <span className="font-medium text-red-600">Original:</span>
                                <p className="mt-1">{suggestion.originalText}</p>
                              </div>
                              <div className="p-2 bg-green-50 border border-green-200 rounded text-xs">
                                <span className="font-medium text-green-600">Sugerido:</span>
                                <p className="mt-1">{suggestion.suggestedText}</p>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between mt-2">
                            <div className="text-xs text-muted-foreground">
                              Esforço: {suggestion.effort} • Impacto: {suggestion.impact}
                            </div>
                            <div className="flex items-center space-x-1">
                              <Button size="sm" variant="outline">
                                <Check className="h-3 w-3 mr-1" />
                                Aplicar
                              </Button>
                              <Button size="sm" variant="ghost">
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

// AI Insights Panel
const AIInsightsPanel: React.FC<{
  insights: AIInsight[];
  onMarkAsRead: (id: string) => void;
  onExecuteAction: (insightId: string, actionId: string) => void;
}> = ({ insights, onMarkAsRead, onExecuteAction }) => {
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'content_suggestion': return <Lightbulb className="h-4 w-4" />;
      case 'performance_optimization': return <TrendingUp className="h-4 w-4" />;
      case 'user_behavior': return <Users className="h-4 w-4" />;
      case 'trend_analysis': return <BarChart3 className="h-4 w-4" />;
      case 'compliance_alert': return <AlertCircle className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const unreadInsights = insights.filter(insight => !insight.isRead);
  const readInsights = insights.filter(insight => insight.isRead);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Insights de IA</h3>
          <p className="text-sm text-muted-foreground">
            {unreadInsights.length} insights não lidos
          </p>
        </div>
        <Badge variant="secondary">
          {insights.length} total
        </Badge>
      </div>

      {/* Unread Insights */}
      {unreadInsights.length > 0 && (
        <div>
          <h4 className="font-medium mb-3">Não Lidos</h4>
          <div className="space-y-3">
            {unreadInsights.map((insight) => (
              <Card key={insight.id} className={`border-l-4 ${getPriorityColor(insight.priority)}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getInsightIcon(insight.type)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{insight.title}</h4>
                          <Badge className={getPriorityColor(insight.priority)}>
                            {insight.priority}
                          </Badge>
                          <Badge variant="outline">
                            {insight.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {insight.description}
                        </p>
                        <div className="text-xs text-muted-foreground mt-2">
                          {insight.createdAt.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => onMarkAsRead(insight.id)}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Actions */}
                  {insight.actionable && insight.actions && insight.actions.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex flex-wrap gap-2">
                        {insight.actions.map((action) => (
                          <Button
                            key={action.id}
                            size="sm"
                            variant="outline"
                            onClick={() => onExecuteAction(insight.id, action.id)}
                          >
                            {action.type === 'auto' ? (
                              <Zap className="h-3 w-3 mr-1" />
                            ) : (
                              <Settings className="h-3 w-3 mr-1" />
                            )}
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Read Insights */}
      {readInsights.length > 0 && (
        <div>
          <h4 className="font-medium mb-3">Lidos</h4>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {readInsights.map((insight) => (
                <Card key={insight.id} className="opacity-60">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      {getInsightIcon(insight.type)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{insight.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {insight.category}
                          </Badge>
                          {insight.isActioned && (
                            <Badge variant="default" className="text-xs">
                              Executado
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {insight.description}
                        </p>
                        <div className="text-xs text-muted-foreground mt-2">
                          {insight.createdAt.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Empty State */}
      {insights.length === 0 && (
        <div className="text-center py-12">
          <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum insight disponível</h3>
          <p className="text-muted-foreground">
            Os insights de IA aparecerão aqui conforme você usa o sistema
          </p>
        </div>
      )}
    </div>
  );
};

// Generation History Panel
const GenerationHistoryPanel: React.FC<{
  history: GenerationHistoryItem[];
}> = ({ history }) => {
  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return <FileText className="h-4 w-4" />;
      case 'image': return <Image className="h-4 w-4" />;
      case 'audio': return <Mic className="h-4 w-4" />;
      case 'video_script': return <Video className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Histórico de Gerações</h3>
        <Badge variant="secondary">{history.length} gerações</Badge>
      </div>

      <ScrollArea className="h-[600px]">
        <div className="space-y-4">
          {history.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getContentTypeIcon(item.type)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{item.type}</Badge>
                        <Badge variant="secondary">{item.metadata.model}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {item.createdAt.toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="mt-2 p-3 bg-gray-50 rounded text-sm">
                        {typeof item.content === 'string' 
                          ? item.content.substring(0, 200) + (item.content.length > 200 ? '...' : '')
                          : 'Conteúdo binário'
                        }
                      </div>
                      
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span>{item.metadata.tokensUsed} tokens</span>
                          <span>${item.metadata.cost.toFixed(4)}</span>
                          <span>{item.metadata.generationTime.toFixed(1)}s</span>
                          <span>Qualidade: {(item.metadata.quality * 100).toFixed(0)}%</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button size="sm" variant="outline">
                            <Copy className="h-3 w-3 mr-1" />
                            Copiar
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="h-3 w-3 mr-1" />
                            Baixar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {history.length === 0 && (
        <div className="text-center py-12">
          <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhuma geração ainda</h3>
          <p className="text-muted-foreground">
            Suas gerações de conteúdo aparecerão aqui
          </p>
        </div>
      )}
    </div>
  );
};

export default AdvancedAI;