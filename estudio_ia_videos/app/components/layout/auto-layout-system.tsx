
'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { 
  Layout, 
  Grid, 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  Shuffle, 
  Zap, 
  Eye,
  Download,
  Settings,
  Palette,
  Type,
  Image as ImageIcon,
  Video,
  Layers,
  Sparkles
} from 'lucide-react'
import { toast } from 'sonner'

interface LayoutTemplate {
  id: string
  name: string
  category: 'presentation' | 'training' | 'report' | 'infographic'
  description: string
  preview: string
  aiScore: number
  features: string[]
  elements: LayoutElement[]
}

interface LayoutElement {
  id: string
  type: 'text' | 'image' | 'video' | 'chart' | 'button'
  x: number
  y: number
  width: number
  height: number
  content?: string
  style?: React.CSSProperties
}

interface LayoutSettings {
  spacing: number
  alignment: 'left' | 'center' | 'right' | 'justify'
  colorScheme: 'corporate' | 'creative' | 'minimal' | 'vibrant'
  contrast: number
  responsiveBreakpoints: boolean
  accessibility: boolean
}

const mockLayoutTemplates: LayoutTemplate[] = [
  {
    id: 'nr-corporate',
    name: 'NR Corporate Professional',
    category: 'training',
    description: 'Layout otimizado para treinamentos NR com alta legibilidade e compliance',
    preview: '/layouts/nr-corporate.jpg',
    aiScore: 96,
    features: [
      'Hierarquia visual clara',
      'Espaçamento otimizado',
      'Cores acessíveis WCAG AA',
      'Typography profissional',
      'Elementos interativos'
    ],
    elements: [
      { id: '1', type: 'text', x: 50, y: 100, width: 800, height: 60, content: 'Título Principal' },
      { id: '2', type: 'image', x: 50, y: 200, width: 400, height: 300 },
      { id: '3', type: 'text', x: 500, y: 200, width: 350, height: 300, content: 'Conteúdo descritivo' }
    ]
  },
  {
    id: 'interactive-learning',
    name: 'Interactive Learning Hub',
    category: 'training',
    description: 'Layout focado em interatividade e engajamento do usuário',
    preview: '/layouts/interactive-learning.jpg',
    aiScore: 93,
    features: [
      'Elementos interativos',
      'Feedback visual',
      'Gamificação',
      'Progress tracking',
      'Mobile-first'
    ],
    elements: [
      { id: '1', type: 'text', x: 100, y: 50, width: 700, height: 40, content: 'Título Interativo' },
      { id: '2', type: 'video', x: 50, y: 120, width: 400, height: 250 },
      { id: '3', type: 'button', x: 500, y: 120, width: 300, height: 60, content: 'Iniciar Quiz' },
      { id: '4', type: 'chart', x: 500, y: 220, width: 300, height: 150 }
    ]
  },
  {
    id: 'minimal-focus',
    name: 'Minimal Focus',
    category: 'presentation',
    description: 'Layout minimalista para máxima concentração no conteúdo',
    preview: '/layouts/minimal-focus.jpg',
    aiScore: 89,
    features: [
      'Distração mínima',
      'Foco no conteúdo',
      'Tipografia elegante',
      'Espaço em branco',
      'Leitura fluida'
    ],
    elements: [
      { id: '1', type: 'text', x: 200, y: 150, width: 500, height: 50, content: 'Título Centralizado' },
      { id: '2', type: 'text', x: 150, y: 250, width: 600, height: 200, content: 'Conteúdo principal' }
    ]
  },
  {
    id: 'data-visualization',
    name: 'Data Visualization Pro',
    category: 'report',
    description: 'Layout especializado para apresentação de dados e métricas',
    preview: '/layouts/data-viz.jpg',
    aiScore: 94,
    features: [
      'Gráficos integrados',
      'Hierarquia de dados',
      'Cores semânticas',
      'Comparações visuais',
      'Insights destacados'
    ],
    elements: [
      { id: '1', type: 'text', x: 50, y: 50, width: 800, height: 40, content: 'Dashboard de Métricas' },
      { id: '2', type: 'chart', x: 50, y: 120, width: 350, height: 200 },
      { id: '3', type: 'chart', x: 450, y: 120, width: 350, height: 200 },
      { id: '4', type: 'text', x: 50, y: 350, width: 750, height: 100, content: 'Análise e insights' }
    ]
  }
]

export default function AutoLayoutSystem() {
  const [selectedTemplate, setSelectedTemplate] = useState<LayoutTemplate | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [layoutSettings, setLayoutSettings] = useState<LayoutSettings>({
    spacing: 20,
    alignment: 'left',
    colorScheme: 'corporate',
    contrast: 85,
    responsiveBreakpoints: true,
    accessibility: true
  })
  const [currentElements, setCurrentElements] = useState<LayoutElement[]>([])
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')

  const alignmentOptions: LayoutSettings['alignment'][] = ['left', 'center', 'right', 'justify']
  const colorSchemeOptions: LayoutSettings['colorScheme'][] = ['corporate', 'creative', 'minimal', 'vibrant']

  const isAlignmentValue = (value: string): value is LayoutSettings['alignment'] => {
    return alignmentOptions.some(option => option === value)
  }

  const generateAILayout = async () => {
    setIsGenerating(true)
    toast.info('Gerando layout otimizado com IA...')
    
    try {
      // Simulação de geração IA
      const steps = [
        'Analisando conteúdo atual...',
        'Aplicando princípios de design...',
        'Otimizando hierarquia visual...',
        'Ajustando acessibilidade...',
        'Validando responsividade...',
        'Finalizando layout inteligente...'
      ]
      
      for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, 700))
        toast.info(step)
      }
      
      // Gerar layout customizado baseado nas configurações
      const aiGeneratedElements: LayoutElement[] = [
        {
          id: 'ai-title',
          type: 'text',
          x: layoutSettings.spacing,
          y: layoutSettings.spacing,
          width: 800 - (layoutSettings.spacing * 2),
          height: 60,
          content: 'Layout Otimizado IA',
          style: {
            fontSize: '32px',
            fontWeight: 'bold',
            textAlign: layoutSettings.alignment,
            color: layoutSettings.colorScheme === 'corporate' ? '#1e40af' : '#7c3aed'
          }
        },
        {
          id: 'ai-content',
          type: 'text',
          x: layoutSettings.spacing,
          y: 100 + layoutSettings.spacing,
          width: 450 - layoutSettings.spacing,
          height: 250,
          content: 'Conteúdo principal otimizado para máxima legibilidade e engajamento',
          style: {
            fontSize: '16px',
            lineHeight: '1.6',
            textAlign: layoutSettings.alignment
          }
        },
        {
          id: 'ai-media',
          type: 'image',
          x: 500,
          y: 100 + layoutSettings.spacing,
          width: 300 - layoutSettings.spacing,
          height: 200
        }
      ]
      
      setCurrentElements(aiGeneratedElements)
      toast.success('Layout IA gerado com sucesso!')
      
    } catch (error) {
      toast.error('Erro ao gerar layout. Tente novamente.')
    } finally {
      setIsGenerating(false)
    }
  }

  const applyTemplate = (template: LayoutTemplate) => {
    setSelectedTemplate(template)
    setCurrentElements(template.elements)
    toast.success(`Template "${template.name}" aplicado com sucesso!`)
  }

  const optimizeForNR = () => {
    toast.info('Otimizando layout para compliance NR...')
    
    // Aplicar otimizações específicas para NR
    setTimeout(() => {
      setLayoutSettings(prev => ({
        ...prev,
        colorScheme: 'corporate',
        contrast: 95,
        accessibility: true,
        spacing: 24
      }))
      toast.success('Layout otimizado para conformidade NR!')
    }, 1000)
  }

  const exportLayout = () => {
    toast.success('Layout exportado como template personalizado!')
  }

  const getPreviewWidth = () => {
    switch (previewMode) {
      case 'tablet': return '768px'
      case 'mobile': return '375px'
      default: return '100%'
    }
  }

  const renderLayoutPreview = () => (
    <div 
      className="relative bg-white border rounded-lg p-4 mx-auto transition-all"
      style={{ 
        width: getPreviewWidth(),
        minHeight: '500px',
        transform: previewMode !== 'desktop' ? 'scale(0.8)' : 'scale(1)'
      }}
    >
      {currentElements.map((element) => (
        <div
          key={element.id}
          className={`absolute border-2 border-dashed border-blue-300 bg-blue-50/50 rounded flex items-center justify-center text-sm text-blue-600`}
          style={{
            left: element.x,
            top: element.y,
            width: element.width,
            height: element.height,
            ...element.style
          }}
        >
          {element.type === 'text' && (
            <div className="p-2 text-center">
              {element.content || `Elemento de Texto ${element.id}`}
            </div>
          )}
          {element.type === 'image' && (
            <div className="flex items-center space-x-2">
              <ImageIcon className="h-6 w-6" />
              <span>Imagem</span>
            </div>
          )}
          {element.type === 'video' && (
            <div className="flex items-center space-x-2">
              <Video className="h-6 w-6" />
              <span>Vídeo</span>
            </div>
          )}
          {element.type === 'chart' && (
            <div className="flex items-center space-x-2">
              <Grid className="h-6 w-6" />
              <span>Gráfico</span>
            </div>
          )}
          {element.type === 'button' && (
            <div className="bg-blue-500 text-white px-4 py-2 rounded">
              {element.content || 'Botão'}
            </div>
          )}
        </div>
      ))}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
            <Layout className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Auto Layout System</h1>
            <p className="text-muted-foreground">
              Sistema inteligente de layouts automatizados com IA
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={generateAILayout}
            disabled={isGenerating}
            className="flex items-center space-x-2"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Gerando...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Gerar IA</span>
              </>
            )}
          </Button>
          <Button 
            variant="outline"
            onClick={optimizeForNR}
            className="flex items-center space-x-2"
          >
            <Zap className="h-4 w-4" />
            <span>Otimizar NR</span>
          </Button>
          <Button 
            variant="outline"
            onClick={exportLayout}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Exportar</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          {/* Template Gallery */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockLayoutTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 rounded-t-lg flex items-center justify-center">
                  <Layout className="h-12 w-12 text-blue-500" />
                </div>
                
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {template.description}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      AI {template.aiScore}%
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="capitalize">
                      {template.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {template.elements.length} elementos
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Recursos</h4>
                    <div className="space-y-1">
                      {template.features.slice(0, 3).map((feature, index) => (
                        <div key={index} className="flex items-center space-x-2 text-xs">
                          <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      className="flex-1" 
                      onClick={() => applyTemplate(template)}
                    >
                      <Layout className="h-4 w-4 mr-1" />
                      Aplicar
                    </Button>
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          {/* Preview Controls */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Preview do Layout</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button
                    variant={previewMode === 'desktop' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewMode('desktop')}
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={previewMode === 'tablet' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewMode('tablet')}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={previewMode === 'mobile' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewMode('mobile')}
                  >
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="min-h-[600px] bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-hidden">
                {currentElements.length > 0 ? (
                  renderLayoutPreview()
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                    <Layout className="h-16 w-16 text-muted-foreground" />
                    <h3 className="text-lg font-semibold">Nenhum layout selecionado</h3>
                    <p className="text-muted-foreground max-w-md">
                      Selecione um template ou gere um layout personalizado com IA para ver o preview
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Layout Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Configurações de Layout</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Espaçamento ({layoutSettings.spacing}px)</Label>
                  <Slider
                    value={[layoutSettings.spacing]}
                    onValueChange={([value]) => setLayoutSettings(prev => ({ ...prev, spacing: value }))}
                    max={50}
                    min={10}
                    step={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Alinhamento</Label>
                  <select
                    value={layoutSettings.alignment}
                    onChange={(e) => {
                      const value = e.target.value
                      if (isAlignmentValue(value)) {
                        setLayoutSettings(prev => ({ ...prev, alignment: value }))
                      }
                    }}
                    className="w-full p-2 border rounded-md bg-background"
                  >
                    <option value="left">Esquerda</option>
                    <option value="center">Centro</option>
                    <option value="right">Direita</option>
                    <option value="justify">Justificado</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Contraste ({layoutSettings.contrast}%)</Label>
                  <Slider
                    value={[layoutSettings.contrast]}
                    onValueChange={([value]) => setLayoutSettings(prev => ({ ...prev, contrast: value }))}
                    max={100}
                    min={60}
                    step={5}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Responsivo</Label>
                  <Switch
                    checked={layoutSettings.responsiveBreakpoints}
                    onCheckedChange={(checked) => setLayoutSettings(prev => ({ ...prev, responsiveBreakpoints: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Acessibilidade WCAG</Label>
                  <Switch
                    checked={layoutSettings.accessibility}
                    onCheckedChange={(checked) => setLayoutSettings(prev => ({ ...prev, accessibility: checked }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Style Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="h-5 w-5" />
                  <span>Configurações de Estilo</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Esquema de Cores</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {colorSchemeOptions.map((scheme) => (
                      <Button
                        key={scheme}
                        variant={layoutSettings.colorScheme === scheme ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setLayoutSettings(prev => ({ ...prev, colorScheme: scheme }))}
                        className="capitalize"
                      >
                        {scheme}
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Elementos Disponíveis</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm">
                      <Type className="h-4 w-4 mr-2" />
                      Texto
                    </Button>
                    <Button variant="outline" size="sm">
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Imagem
                    </Button>
                    <Button variant="outline" size="sm">
                      <Video className="h-4 w-4 mr-2" />
                      Vídeo
                    </Button>
                    <Button variant="outline" size="sm">
                      <Grid className="h-4 w-4 mr-2" />
                      Gráfico
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset Layout
                </Button>
                <Button variant="outline" size="sm">
                  <Shuffle className="h-4 w-4 mr-2" />
                  Layout Aleatório
                </Button>
                <Button variant="outline" size="sm">
                  <Layers className="h-4 w-4 mr-2" />
                  Duplicar Página
                </Button>
                <Button variant="outline" size="sm">
                  <Grid className="h-4 w-4 mr-2" />
                  Grid Automático
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
