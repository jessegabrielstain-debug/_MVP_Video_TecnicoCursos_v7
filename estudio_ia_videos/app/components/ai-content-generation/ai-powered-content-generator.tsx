// TODO: Fixar tipos de tab states com enums apropriados
'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Sparkles, 
  Brain, 
  Wand2, 
  FileText, 
  Video,
  Mic,
  Image as ImageIcon,
  Download,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Target,
  Clock,
  Layers,
  Star,
  TrendingUp,
  Users,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Rocket,
  Eye,
  Settings
} from 'lucide-react'

interface GenerationRequest {
  id: string
  type: 'video' | 'audio' | 'text' | 'template'
  nr_focus: string
  industry: string
  complexity: 'basic' | 'intermediate' | 'advanced'
  duration: number
  status: 'pending' | 'generating' | 'completed' | 'failed'
  progress: number
  result?: any
  created_at: string
}

interface AIModel {
  id: string
  name: string
  type: 'text' | 'video' | 'audio' | 'multimodal'
  accuracy: number
  speed: 'fast' | 'medium' | 'slow'
  specialty: string[]
  status: 'active' | 'training' | 'offline'
}

interface ContentTemplate {
  id: string
  title: string
  category: string
  nr_compliance: string[]
  industry: string[]
  complexity: 'basic' | 'intermediate' | 'advanced'
  estimated_duration: number
  ai_confidence: number
  preview_url?: string
}

const AIPoweredContentGenerator = () => {
  const [activeTab, setActiveTab] = useState('generate')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [currentRequest, setCurrentRequest] = useState<GenerationRequest | null>(null)

  // Estados do formulário
  const [contentType, setContentType] = useState<'video' | 'audio' | 'text' | 'template'>('video')
  const [nrFocus, setNrFocus] = useState('')
  const [industry, setIndustry] = useState('')
  const [complexity, setComplexity] = useState<'basic' | 'intermediate' | 'advanced'>('intermediate')
  const [duration, setDuration] = useState(5)
  const [customPrompt, setCustomPrompt] = useState('')

  // Mock data
  const [aiModels] = useState<AIModel[]>([
    {
      id: 'gpt-nr-specialist',
      name: 'GPT NR Specialist',
      type: 'text',
      accuracy: 97.8,
      speed: 'fast',
      specialty: ['NR-06', 'NR-10', 'NR-12', 'NR-33', 'NR-35'],
      status: 'active'
    },
    {
      id: 'video-gen-pro',
      name: 'Video Generator Pro',
      type: 'video',
      accuracy: 94.2,
      speed: 'medium',
      specialty: ['safety-scenarios', 'demonstrations', 'simulations'],
      status: 'active'
    },
    {
      id: 'voice-cloning-nr',
      name: 'Voice Cloning NR',
      type: 'audio',
      accuracy: 96.5,
      speed: 'fast',
      specialty: ['brazilian-portuguese', 'technical-terms', 'clear-diction'],
      status: 'active'
    },
    {
      id: 'multimodal-creator',
      name: 'Multimodal Creator',
      type: 'multimodal',
      accuracy: 92.1,
      speed: 'slow',
      specialty: ['comprehensive-training', 'interactive-elements', 'compliance-check'],
      status: 'training'
    }
  ])

  const [contentTemplates] = useState<ContentTemplate[]>([
    {
      id: 'nr06-epi-intro',
      title: 'NR-06: Introdução aos EPIs',
      category: 'Equipamentos de Proteção',
      nr_compliance: ['NR-06'],
      industry: ['Construção', 'Indústria', 'Mineração'],
      complexity: 'basic',
      estimated_duration: 8,
      ai_confidence: 98.7,
      preview_url: '/previews/nr06-intro.mp4'
    },
    {
      id: 'nr10-electrical-advanced',
      title: 'NR-10: Segurança em Instalações Elétricas Avançada',
      category: 'Segurança Elétrica',
      nr_compliance: ['NR-10'],
      industry: ['Energia', 'Indústria', 'Manutenção'],
      complexity: 'advanced',
      estimated_duration: 25,
      ai_confidence: 96.4
    },
    {
      id: 'nr33-confined-spaces',
      title: 'NR-33: Procedimentos para Espaços Confinados',
      category: 'Espaços Confinados',
      nr_compliance: ['NR-33'],
      industry: ['Petróleo', 'Química', 'Saneamento'],
      complexity: 'intermediate',
      estimated_duration: 15,
      ai_confidence: 95.8
    }
  ])

  const [generationHistory, setGenerationHistory] = useState<GenerationRequest[]>([
    {
      id: 'gen-001',
      type: 'video',
      nr_focus: 'NR-06',
      industry: 'Construção Civil',
      complexity: 'intermediate',
      duration: 12,
      status: 'completed',
      progress: 100,
      created_at: '2025-09-26T10:30:00Z'
    },
    {
      id: 'gen-002',
      type: 'audio',
      nr_focus: 'NR-35',
      industry: 'Manutenção Industrial',
      complexity: 'advanced',
      duration: 8,
      status: 'completed',
      progress: 100,
      created_at: '2025-09-26T09:15:00Z'
    },
    {
      id: 'gen-003',
      type: 'template',
      nr_focus: 'NR-12',
      industry: 'Metalúrgica',
      complexity: 'basic',
      duration: 5,
      status: 'generating',
      progress: 67,
      created_at: '2025-09-26T11:45:00Z'
    }
  ])

  const generateContent = async () => {
    if (!nrFocus || !industry) {
      alert('Por favor, preencha todos os campos obrigatórios')
      return
    }

    setIsGenerating(true)
    setGenerationProgress(0)

    const newRequest: GenerationRequest = {
      id: `gen-${Date.now()}`,
      type: contentType,
      nr_focus: nrFocus,
      industry,
      complexity,
      duration,
      status: 'generating',
      progress: 0,
      created_at: new Date().toISOString()
    }

    setCurrentRequest(newRequest)

    // Simulação da geração com progresso
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          setIsGenerating(false)
          setCurrentRequest(prev => prev ? { ...prev, status: 'completed', progress: 100 } : null)
          
          // Adicionar ao histórico
          setGenerationHistory(prev => [newRequest, ...prev])
          
          return 100
        }
        return prev + Math.random() * 15
      })
    }, 800)

    // Em produção, aqui seria a chamada real para a API
    await new Promise(resolve => setTimeout(resolve, 8000))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-500'
      case 'generating': return 'text-blue-500'
      case 'pending': return 'text-yellow-500'
      case 'failed': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'generating': return <Brain className="h-4 w-4 text-blue-500 animate-pulse" />
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />
      default: return <Sparkles className="h-4 w-4 text-gray-500" />
    }
  }

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />
      case 'audio': return <Mic className="h-4 w-4" />
      case 'text': return <FileText className="h-4 w-4" />
      case 'template': return <Layers className="h-4 w-4" />
      default: return <Sparkles className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">AI-Powered Content Generator</h2>
          <p className="text-muted-foreground">
            Geração automática de conteúdo de treinamento NR com IA avançada
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="flex items-center space-x-1">
            <Brain className="h-3 w-3" />
            <span>4 Modelos IA</span>
          </Badge>
          <Badge variant="outline" className="flex items-center space-x-1">
            <Rocket className="h-3 w-3" />
            <span>97.8% Precisão</span>
          </Badge>
        </div>
      </div>

      {/* Status das IAs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {aiModels.map((model) => (
          <Card key={model.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{model.name}</CardTitle>
              <div className={`h-2 w-2 rounded-full ${model.status === 'active' ? 'bg-green-500' : 
                model.status === 'training' ? 'bg-yellow-500' : 'bg-red-500'}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{model.accuracy}%</div>
              <p className="text-xs text-muted-foreground capitalize">
                {model.type} • {model.speed}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs Principais */}
      <Tabs defaultValue="generate" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="generate">Gerar Conteúdo</TabsTrigger>
          <TabsTrigger value="templates">Templates IA</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="models">Modelos IA</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Formulário de Geração */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Wand2 className="h-5 w-5" />
                    <span>Configuração de Geração</span>
                  </CardTitle>
                  <CardDescription>
                    Configure os parâmetros para geração automática de conteúdo
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contentType">Tipo de Conteúdo</Label>
                      <Select value={contentType} onValueChange={(value: string) => setContentType(value as any)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="video">Vídeo Completo</SelectItem>
                          <SelectItem value="audio">Narração/Áudio</SelectItem>
                          <SelectItem value="text">Roteiro/Texto</SelectItem>
                          <SelectItem value="template">Template Interativo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nrFocus">Norma Regulamentadora</Label>
                      <Select value={nrFocus} onValueChange={setNrFocus}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a NR" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NR-06">NR-06 - EPIs</SelectItem>
                          <SelectItem value="NR-10">NR-10 - Instalações Elétricas</SelectItem>
                          <SelectItem value="NR-12">NR-12 - Máquinas e Equipamentos</SelectItem>
                          <SelectItem value="NR-18">NR-18 - Construção Civil</SelectItem>
                          <SelectItem value="NR-33">NR-33 - Espaços Confinados</SelectItem>
                          <SelectItem value="NR-35">NR-35 - Trabalho em Altura</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="industry">Setor Industrial</Label>
                      <Select value={industry} onValueChange={setIndustry}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o setor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="construcao">Construção Civil</SelectItem>
                          <SelectItem value="industria">Indústria Geral</SelectItem>
                          <SelectItem value="mineracao">Mineração</SelectItem>
                          <SelectItem value="petroleo">Petróleo e Gás</SelectItem>
                          <SelectItem value="quimica">Química</SelectItem>
                          <SelectItem value="metalurgia">Metalurgia</SelectItem>
                          <SelectItem value="alimenticia">Alimentícia</SelectItem>
                          <SelectItem value="textil">Têxtil</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="complexity">Complexidade</Label>
                      <Select value={complexity} onValueChange={(value: string) => setComplexity(value as any)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic">Básico (Introdução)</SelectItem>
                          <SelectItem value="intermediate">Intermediário (Prático)</SelectItem>
                          <SelectItem value="advanced">Avançado (Especializado)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Duração (minutos): {duration}</Label>
                    <input
                      type="range"
                      min="1"
                      max="30"
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>1 min</span>
                      <span>15 min</span>
                      <span>30 min</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customPrompt">Prompt Personalizado (Opcional)</Label>
                    <Textarea
                      id="customPrompt"
                      placeholder="Descreva requisitos específicos ou contexto adicional..."
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <Button 
                    onClick={generateContent}
                    disabled={isGenerating || !nrFocus || !industry}
                    className="w-full"
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <Brain className="h-4 w-4 mr-2 animate-spin" />
                        Gerando... {Math.round(generationProgress)}%
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Gerar com IA
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Status da Geração */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5" />
                    <span>Status da Geração</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentRequest ? (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(currentRequest.status)}
                        <span className="font-medium">
                          {currentRequest.status === 'generating' ? 'Gerando...' : 'Concluído'}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progresso</span>
                          <span>{Math.round(generationProgress)}%</span>
                        </div>
                        <Progress value={generationProgress} />
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Tipo:</span>
                          <span className="capitalize">{currentRequest.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>NR:</span>
                          <span>{currentRequest.nr_focus}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Setor:</span>
                          <span>{currentRequest.industry}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Duração:</span>
                          <span>{currentRequest.duration}min</span>
                        </div>
                      </div>

                      {currentRequest.status === 'completed' && (
                        <div className="pt-2 border-t space-y-2">
                          <Button size="sm" className="w-full">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                          <Button size="sm" variant="outline" className="w-full">
                            <Eye className="h-4 w-4 mr-2" />
                            Visualizar
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhuma geração ativa</p>
                      <p className="text-sm">Configure e inicie uma nova geração</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Dicas IA */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Lightbulb className="h-5 w-5" />
                    <span>Dicas IA</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-start space-x-2">
                    <Star className="h-4 w-4 text-yellow-500 mt-0.5" />
                    <span>Use prompts específicos para melhor precisão</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Star className="h-4 w-4 text-yellow-500 mt-0.5" />
                    <span>Conteúdo básico gera mais rápido</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Star className="h-4 w-4 text-yellow-500 mt-0.5" />
                    <span>Templates avançados incluem quizzes</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4">
            {contentTemplates.map((template) => (
              <Card key={template.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        {getContentTypeIcon('template')}
                        <span>{template.title}</span>
                      </CardTitle>
                      <CardDescription>
                        {template.category} • {template.estimated_duration} minutos
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="mb-2">
                        {template.complexity === 'basic' ? 'Básico' :
                         template.complexity === 'intermediate' ? 'Intermediário' : 'Avançado'}
                      </Badge>
                      <div className="text-sm text-green-500 font-bold">
                        {template.ai_confidence}% IA
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {template.nr_compliance.map((nr) => (
                      <Badge key={nr} variant="secondary">{nr}</Badge>
                    ))}
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {template.industry.map((ind) => (
                      <Badge key={ind} variant="outline" className="text-xs">{ind}</Badge>
                    ))}
                  </div>

                  <div className="flex space-x-2">
                    <Button size="sm" className="flex-1">
                      <Wand2 className="h-4 w-4 mr-2" />
                      Gerar com IA
                    </Button>
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    {template.preview_url && (
                      <Button size="sm" variant="outline">
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>Histórico de Gerações</span>
              </CardTitle>
              <CardDescription>
                Todas as gerações de conteúdo realizadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {generationHistory.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getContentTypeIcon(request.type)}
                        <div>
                          <div className="font-medium">{request.nr_focus} - {request.industry}</div>
                          <div className="text-sm text-muted-foreground capitalize">
                            {request.type} • {request.complexity} • {request.duration}min
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(request.status)}
                        <span className={`text-sm font-medium ${getStatusColor(request.status)}`}>
                          {request.status === 'completed' ? 'Concluído' :
                           request.status === 'generating' ? 'Gerando' :
                           request.status === 'pending' ? 'Pendente' : 'Erro'}
                        </span>
                        {request.status === 'generating' && (
                          <span className="text-sm text-muted-foreground">
                            {request.progress}%
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <div className="grid gap-4">
            {aiModels.map((model) => (
              <Card key={model.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <Brain className="h-5 w-5" />
                        <span>{model.name}</span>
                      </CardTitle>
                      <CardDescription className="capitalize">
                        {model.type} • {model.speed} • {model.accuracy}% precisão
                      </CardDescription>
                    </div>
                    <Badge variant={model.status === 'active' ? 'default' : 
                                   model.status === 'training' ? 'secondary' : 'outline'}>
                      {model.status === 'active' ? 'Ativo' :
                       model.status === 'training' ? 'Treinando' : 'Offline'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm font-medium mb-2">Especialidades:</div>
                    <div className="flex flex-wrap gap-2">
                      {model.specialty.map((spec, index) => (
                        <Badge key={index} variant="outline" className="text-xs">{spec}</Badge>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-500">{model.accuracy}%</div>
                      <div className="text-xs text-muted-foreground">Precisão</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold capitalize">{model.speed}</div>
                      <div className="text-xs text-muted-foreground">Velocidade</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{model.specialty.length}</div>
                      <div className="text-xs text-muted-foreground">Especialidades</div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" disabled={model.status !== 'active'}>
                      <Settings className="h-4 w-4 mr-2" />
                      Configurar
                    </Button>
                    <Button size="sm" variant="outline">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Estatísticas
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AIPoweredContentGenerator
