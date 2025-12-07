// TODO: Fixar tipos de content states com enums apropriados
"use client"

import React, { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { 
  Wand2, Brain, Sparkles, FileText, Video, Users, Settings,
  Download, Copy, RefreshCw, Lightbulb, Target, BookOpen,
  Mic, Camera, Palette, Zap
} from 'lucide-react'
import { toast } from 'sonner'

interface GenerationOptions {
  type: 'script' | 'presentation' | 'quiz' | 'summary'
  nrType: string
  audience: string
  duration: number
  tone: string
  includeImages: boolean
  includeQuiz: boolean
  language: string
}

interface GeneratedContent {
  title: string
  content: string
  slides?: string[]
  questions?: Array<{ question: string; options: string[]; correct: number }>
  metadata: {
    wordCount: number
    estimatedDuration: number
    complexity: string
    nrCompliance: string[]
  }
}

export default function IntelligentContentGenerator() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null)
  const [options, setOptions] = useState<GenerationOptions>({
    type: 'script',
    nrType: 'nr-12',
    audience: 'operadores',
    duration: 15,
    tone: 'professional',
    includeImages: true,
    includeQuiz: false,
    language: 'pt-br'
  })
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [userPrompt, setUserPrompt] = useState('')

  // Simulated AI content generation
  const generateContent = async () => {
    if (!userPrompt.trim()) {
      toast.error('Digite uma descrição ou tópico para gerar conteúdo')
      return
    }

    setIsGenerating(true)
    setGenerationProgress(0)

    // Simulate progressive generation
    const steps = [
      'Analisando requisitos...',
      'Consultando base de conhecimento NR...',
      'Gerando estrutura do conteúdo...',
      'Criando conteúdo principal...',
      'Otimizando para compliance...',
      'Adicionando elementos visuais...',
      'Finalizando conteúdo...'
    ]

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800))
      setGenerationProgress(((i + 1) / steps.length) * 100)
      toast.info(steps[i])
    }

    // Generate mock content based on options
    const mockContent: GeneratedContent = {
      title: `Treinamento ${options.nrType.toUpperCase()}: ${userPrompt}`,
      content: generateMockContent(userPrompt, options),
      slides: options.type === 'presentation' ? generateMockSlides(userPrompt, options) : undefined,
      questions: options.includeQuiz ? generateMockQuestions(options) : undefined,
      metadata: {
        wordCount: Math.floor(Math.random() * 500) + 300,
        estimatedDuration: options.duration,
        complexity: options.audience === 'operadores' ? 'Básico' : 'Intermediário',
        nrCompliance: [options.nrType.toUpperCase(), 'NR-01']
      }
    }

    setGeneratedContent(mockContent)
    setIsGenerating(false)
    toast.success('Conteúdo gerado com sucesso!')
  }

  const generateMockContent = (prompt: string, opts: GenerationOptions): string => {
    const templates = {
      'nr-12': {
        operadores: `# Segurança em Máquinas e Equipamentos - ${prompt}

## Objetivos do Treinamento
Este treinamento visa capacitar os operadores sobre os aspectos fundamentais de segurança relacionados a ${prompt}, conforme estabelecido pela Norma Regulamentadora NR-12.

## Principais Conceitos

### 1. Princípios Básicos de Segurança
- **Proteções fixas**: Elementos que impedem o acesso às zonas perigosas
- **Proteções móveis**: Dispositivos que podem ser abertos sem ferramentas
- **Dispositivos de segurança**: Equipamentos que reduzem o risco de acidentes

### 2. Procedimentos Operacionais
- Verificação pré-operacional dos equipamentos
- Uso correto de EPIs específicos
- Identificação de situações de risco
- Procedimentos de emergência

### 3. Responsabilidades
- **Do empregador**: Garantir máquinas seguras e treinamento adequado
- **Do trabalhador**: Seguir procedimentos e usar EPIs
- **Da equipe de manutenção**: Manter sistemas de segurança funcionais

## Casos Práticos
Apresentaremos situações reais relacionadas a ${prompt} e como aplicar corretamente os procedimentos de segurança.

## Conclusão
A segurança em máquinas e equipamentos é responsabilidade de todos. O cumprimento da NR-12 salva vidas e previne acidentes graves.`,
        
        supervisores: `# Manual Técnico: ${prompt} - Compliance NR-12

## Aspectos Regulamentares
A NR-12 estabelece requisitos mínimos para prevenção de acidentes e doenças do trabalho relacionados a máquinas e equipamentos.

### Análise de Riscos
- Identificação de perigos relacionados a ${prompt}
- Avaliação quantitativa de riscos
- Medidas de controle hierárquicas
- Documentação técnica necessária

### Implementação de Safeguards
1. **Proteções Físicas**
   - Grades de proteção
   - Barreiras fotoelétricas
   - Tapetes de segurança

2. **Sistemas de Controle**
   - Comando bimanual
   - Parada de emergência
   - Monitoramento contínuo

### Gestão de Mudanças
Procedimentos para modificações em ${prompt} que possam afetar a segurança operacional.`
      },
      'nr-33': {
        operadores: `# Segurança em Espaços Confinados - ${prompt}

## O que é um Espaço Confinado?
Espaços confinados são ambientes com aberturas limitadas de entrada e saída, não projetados para ocupação humana contínua.

## Principais Riscos
- **Atmosfera tóxica**: Gases e vapores perigosos
- **Deficiência de oxigênio**: Menos de 20,9%
- **Risco de explosão**: Atmosfera inflamável
- **Soterramento**: Materiais granulados

## Procedimentos de Segurança para ${prompt}
1. **Antes da entrada**:
   - Permissão de entrada assinada
   - Teste atmosférico
   - Ventilação adequada
   - EPIs específicos

2. **Durante o trabalho**:
   - Monitoramento contínuo
   - Comunicação constante
   - Vigia externo obrigatório

3. **Emergências**:
   - Procedimentos de resgate
   - Equipamentos de emergência
   - Comunicação imediata

## Equipamentos Necessários
- Detectores de gases
- Equipamentos de ventilação
- EPIs adequados
- Equipamentos de resgate`
      }
    }

    const nrContent = templates[opts.nrType as keyof typeof templates]
    return nrContent ? nrContent[opts.audience as keyof typeof nrContent] : 
      `# Conteúdo Gerado: ${prompt}\n\nConteúdo personalizado gerado pela IA baseado em suas especificações.`
  }

  const generateMockSlides = (prompt: string, opts: GenerationOptions): string[] => {
    return [
      `Slide 1: Introdução - ${prompt}`,
      `Slide 2: Objetivos do Treinamento`,
      `Slide 3: Norma Regulamentadora ${opts.nrType.toUpperCase()}`,
      `Slide 4: Principais Conceitos`,
      `Slide 5: Procedimentos de Segurança`,
      `Slide 6: Equipamentos Necessários`,
      `Slide 7: Casos Práticos`,
      `Slide 8: Responsabilidades`,
      `Slide 9: Conclusão e Próximos Passos`
    ]
  }

  const generateMockQuestions = (opts: GenerationOptions) => {
    const questions = [
      {
        question: `Qual é o principal objetivo da ${opts.nrType.toUpperCase()}?`,
        options: [
          'Aumentar a produtividade',
          'Prevenir acidentes e doenças ocupacionais',
          'Reduzir custos operacionais',
          'Melhorar a qualidade dos produtos'
        ],
        correct: 1
      },
      {
        question: 'Quando deve ser realizada a verificação de segurança?',
        options: [
          'Apenas quando há problemas',
          'Uma vez por mês',
          'Antes de cada operação',
          'Somente durante auditorias'
        ],
        correct: 2
      },
      {
        question: 'Qual é a responsabilidade do trabalhador em relação à segurança?',
        options: [
          'Apenas reportar problemas',
          'Seguir procedimentos e usar EPIs',
          'Supervisionar outros trabalhadores',
          'Criar novos procedimentos'
        ],
        correct: 1
      }
    ]
    return questions
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Conteúdo copiado para a área de transferência!')
  }

  const downloadContent = () => {
    if (!generatedContent) return

    const element = document.createElement('a')
    const file = new Blob([generatedContent.content], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = `${generatedContent.title}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
    toast.success('Arquivo baixado com sucesso!')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              <Brain className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Gerador IA de Conteúdo
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl mx-auto">
            Crie conteúdo educacional inteligente com IA avançada, otimizado para compliance de Normas Regulamentadoras
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Configuration Panel */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-purple-200 dark:border-purple-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Configurações
                </CardTitle>
                <CardDescription>
                  Personalize a geração de conteúdo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Content Type */}
                <div className="space-y-2">
                  <Label>Tipo de Conteúdo</Label>
                  <Select value={options.type} onValueChange={(value: string) => setOptions({...options, type: value as any})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="script">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Roteiro de Treinamento
                        </div>
                      </SelectItem>
                      <SelectItem value="presentation">
                        <div className="flex items-center gap-2">
                          <Video className="w-4 h-4" />
                          Apresentação/Slides
                        </div>
                      </SelectItem>
                      <SelectItem value="quiz">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          Quiz Interativo
                        </div>
                      </SelectItem>
                      <SelectItem value="summary">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4" />
                          Resumo Executivo
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* NR Type */}
                <div className="space-y-2">
                  <Label>Norma Regulamentadora</Label>
                  <Select value={options.nrType} onValueChange={(value) => setOptions({...options, nrType: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nr-12">NR-12 - Máquinas e Equipamentos</SelectItem>
                      <SelectItem value="nr-33">NR-33 - Espaços Confinados</SelectItem>
                      <SelectItem value="nr-35">NR-35 - Trabalho em Altura</SelectItem>
                      <SelectItem value="nr-06">NR-06 - Equipamentos de Proteção Individual</SelectItem>
                      <SelectItem value="nr-17">NR-17 - Ergonomia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Target Audience */}
                <div className="space-y-2">
                  <Label>Público Alvo</Label>
                  <Select value={options.audience} onValueChange={(value) => setOptions({...options, audience: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="operadores">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Operadores/Técnicos
                        </div>
                      </SelectItem>
                      <SelectItem value="supervisores">Supervisores/Líderes</SelectItem>
                      <SelectItem value="gestores">Gestores/Diretores</SelectItem>
                      <SelectItem value="cipeiros">CIPA/Segurança</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Duration */}
                <div className="space-y-2">
                  <Label>Duração Estimada (minutos)</Label>
                  <Input 
                    type="number" 
                    value={options.duration}
                    onChange={(e) => setOptions({...options, duration: parseInt(e.target.value) || 15})}
                    min="5"
                    max="60"
                  />
                </div>

                {/* Tone */}
                <div className="space-y-2">
                  <Label>Tom do Conteúdo</Label>
                  <Select value={options.tone} onValueChange={(value) => setOptions({...options, tone: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Profissional</SelectItem>
                      <SelectItem value="friendly">Amigável</SelectItem>
                      <SelectItem value="technical">Técnico</SelectItem>
                      <SelectItem value="engaging">Envolvente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Additional Options */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Incluir Sugestões de Imagens</Label>
                    <Switch 
                      checked={options.includeImages}
                      onCheckedChange={(value) => setOptions({...options, includeImages: value})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>Adicionar Quiz</Label>
                    <Switch 
                      checked={options.includeQuiz}
                      onCheckedChange={(value) => setOptions({...options, includeQuiz: value})}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Stats */}
            <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    <span className="font-semibold">Status da IA</span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Precisão NR</span>
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">98.7%</Badge>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm">Conteúdos Gerados</span>
                      <span className="font-semibold">15.4K</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm">Tempo Médio</span>
                      <span className="font-semibold">12s</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content Generation Area */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Input Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  Descreva o Conteúdo
                </CardTitle>
                <CardDescription>
                  Digite uma descrição, tópico ou pergunta sobre o que deseja criar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  ref={textareaRef}
                  placeholder="Exemplo: 'Criar treinamento sobre operação segura de prensas hidráulicas', 'Procedimentos de entrada em tanques de armazenamento', 'Quiz sobre uso correto de cintos de segurança'..."
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  className="min-h-24 resize-none"
                />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      IA otimizada para compliance NR
                    </span>
                  </div>
                  
                  <Button 
                    onClick={generateContent}
                    disabled={isGenerating || !userPrompt.trim()}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4" />
                        Gerar Conteúdo
                      </>
                    )}
                  </Button>
                </div>

                {isGenerating && (
                  <div className="space-y-2">
                    <Progress value={generationProgress} className="w-full" />
                    <p className="text-sm text-center text-slate-600 dark:text-slate-400">
                      Gerando conteúdo inteligente...
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Generated Content */}
            {generatedContent && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">{generatedContent.title}</CardTitle>
                      <CardDescription className="mt-2">
                        {generatedContent.metadata.wordCount} palavras • 
                        {generatedContent.metadata.estimatedDuration} min • 
                        Nível {generatedContent.metadata.complexity}
                      </CardDescription>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => copyToClipboard(generatedContent.content)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={downloadContent}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-4">
                    {generatedContent.metadata.nrCompliance.map(nr => (
                      <Badge key={nr} className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                        {nr}
                      </Badge>
                    ))}
                  </div>
                </CardHeader>
                
                <CardContent>
                  <Tabs defaultValue="content" className="space-y-4">
                    <TabsList>
                      <TabsTrigger value="content">Conteúdo</TabsTrigger>
                      {generatedContent.slides && <TabsTrigger value="slides">Slides</TabsTrigger>}
                      {generatedContent.questions && <TabsTrigger value="quiz">Quiz</TabsTrigger>}
                    </TabsList>
                    
                    <TabsContent value="content">
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-6">
                        <pre className="whitespace-pre-wrap font-mono text-sm">
                          {generatedContent.content}
                        </pre>
                      </div>
                    </TabsContent>
                    
                    {generatedContent.slides && (
                      <TabsContent value="slides">
                        <div className="space-y-3">
                          {generatedContent.slides.map((slide, index) => (
                            <div key={index} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                              <p className="font-medium">{slide}</p>
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                    )}
                    
                    {generatedContent.questions && (
                      <TabsContent value="quiz">
                        <div className="space-y-4">
                          {generatedContent.questions.map((q, index) => (
                            <div key={index} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                              <h4 className="font-semibold mb-3">{q.question}</h4>
                              <div className="space-y-2">
                                {q.options.map((option, optIndex) => (
                                  <div 
                                    key={optIndex}
                                    className={`p-2 rounded ${optIndex === q.correct 
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                                      : 'bg-white dark:bg-slate-800'
                                    }`}
                                  >
                                    {String.fromCharCode(65 + optIndex)}. {option}
                                    {optIndex === q.correct && <span className="ml-2">✓</span>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                    )}
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
