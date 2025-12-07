

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Progress } from '../ui/progress'
import { 
  Box,
  Eye,
  Settings,
  Sparkles,
  Play,
  Gamepad2,
  Monitor,
  Smartphone,
  Glasses,
  BarChart3,
  Zap,
  Brain,
  Target,
  Clock
} from 'lucide-react'
import { ImmersiveEnvironmentEngine, Environment3D, ImmersiveScenario } from '../../lib/immersive/3d-environments'

interface GenerationProgress {
  stage: string
  progress: number
  error?: string
}

export default function ImmersiveStudio() {
  const [environments, setEnvironments] = useState<Environment3D[]>([])
  const [selectedEnvironment, setSelectedEnvironment] = useState<Environment3D | null>(null)
  const [scenarios, setScenarios] = useState<ImmersiveScenario[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress | null>(null)
  const [deviceType, setDeviceType] = useState<'mobile' | 'desktop' | 'vr_headset'>('desktop')

  useEffect(() => {
    loadEnvironments()
  }, [])

  const loadEnvironments = () => {
    setEnvironments(ImmersiveEnvironmentEngine.ENVIRONMENT_LIBRARY)
    if (ImmersiveEnvironmentEngine.ENVIRONMENT_LIBRARY.length > 0) {
      setSelectedEnvironment(ImmersiveEnvironmentEngine.ENVIRONMENT_LIBRARY[0])
    }
  }

  const handleGenerateCustomEnvironment = async () => {
    setIsGenerating(true)
    setGenerationProgress({ stage: 'Iniciando', progress: 0 })

    try {
      const result = await ImmersiveEnvironmentEngine.createCustomEnvironment({
        name: 'Ambiente Personalizado',
        category: 'industrial',
        complexity_level: 'detailed',
        requirements: {
          nr_standards: ['NR-12', 'NR-35'],
          safety_elements: ['EPIs', 'Saídas de emergência'],
          interactive_features: ['Máquinas', 'Painéis informativos']
        }
      })

      // Simular progresso
      const stages = [
        { stage: 'Gerando layout', progress: 20 },
        { stage: 'Adicionando objetos', progress: 40 },
        { stage: 'Aplicando texturas', progress: 60 },
        { stage: 'Configurando iluminação', progress: 80 },
        { stage: 'Otimizando performance', progress: 100 }
      ]

      for (const stageData of stages) {
        setGenerationProgress(stageData)
        await new Promise(resolve => setTimeout(resolve, 3000))
      }

      // Adicionar ambiente gerado
      const newEnvironment: Environment3D = {
        id: result.environment_id,
        name: 'Ambiente Personalizado',
        description: 'Ambiente gerado com IA personalizada',
        category: 'industrial',
        environment_type: 'realistic',
        complexity_level: 'detailed',
        visual_properties: ImmersiveEnvironmentEngine.ENVIRONMENT_LIBRARY[0].visual_properties,
        interactive_elements: [],
        camera_settings: ImmersiveEnvironmentEngine.ENVIRONMENT_LIBRARY[0].camera_settings,
        performance_optimization: ImmersiveEnvironmentEngine.ENVIRONMENT_LIBRARY[0].performance_optimization,
        nr_compliance: ImmersiveEnvironmentEngine.ENVIRONMENT_LIBRARY[0].nr_compliance
      }

      setEnvironments(prev => [newEnvironment, ...prev])
      setGenerationProgress(null)

    } catch (error) {
      console.error('Erro ao gerar ambiente:', error)
      setGenerationProgress({ stage: 'Erro', progress: 0, error: 'Falha na geração' })
    } finally {
      setIsGenerating(false)
    }
  }

  const getComplexityColor = (level: Environment3D['complexity_level']) => {
    switch (level) {
      case 'simple': return 'bg-green-100 text-green-700'
      case 'moderate': return 'bg-yellow-100 text-yellow-700'
      case 'detailed': return 'bg-orange-100 text-orange-700'
      case 'ultra_realistic': return 'bg-red-100 text-red-700'
    }
  }

  const getCategoryIcon = (category: Environment3D['category']) => {
    switch (category) {
      case 'industrial': return '🏭'
      case 'office': return '🏢'
      case 'outdoor': return '🌳'
      case 'construction': return '🚧'
      case 'medical': return '🏥'
      case 'laboratory': return '🧪'
      case 'educational': return '🎓'
      default: return '🏗️'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Box className="h-6 w-6 text-indigo-600" />
            Immersive 3D Studio
          </h3>
          <p className="text-muted-foreground">
            Crie ambientes 3D imersivos para treinamentos avançados
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={deviceType} onValueChange={(value) => setDeviceType(value as 'mobile' | 'desktop' | 'vr_headset')}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desktop">
                <Monitor className="h-4 w-4 mr-2 inline" />
                Desktop
              </SelectItem>
              <SelectItem value="mobile">
                <Smartphone className="h-4 w-4 mr-2 inline" />
                Mobile
              </SelectItem>
              <SelectItem value="vr_headset">
                <Glasses className="h-4 w-4 mr-2 inline" />
                VR Headset
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="environments" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="environments">Ambientes</TabsTrigger>
          <TabsTrigger value="scenarios">Cenários</TabsTrigger>
          <TabsTrigger value="generate">Gerar com IA</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Ambientes 3D */}
        <TabsContent value="environments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Biblioteca de Ambientes 3D</CardTitle>
              <CardDescription>
                Ambientes pré-criados otimizados para diferentes tipos de treinamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {environments.map((environment) => (
                  <Card 
                    key={environment.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedEnvironment?.id === environment.id ? 'ring-2 ring-indigo-500' : ''
                    }`}
                    onClick={() => setSelectedEnvironment(environment)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{getCategoryIcon(environment.category)}</span>
                          <div>
                            <h4 className="font-medium">{environment.name}</h4>
                            <p className="text-sm text-muted-foreground">{environment.description}</p>
                          </div>
                        </div>
                        <Badge className={getComplexityColor(environment.complexity_level)}>
                          {environment.complexity_level}
                        </Badge>
                      </div>

                      {/* Características */}
                      <div className="space-y-2 mb-3">
                        <div className="flex flex-wrap gap-1">
                          {environment.nr_compliance.applicable_nrs.map(nr => (
                            <Badge key={nr} variant="outline" className="text-xs">
                              {nr}
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                          <div>
                            <span className="font-medium">Tipo:</span>
                            <p>{environment.environment_type}</p>
                          </div>
                          <div>
                            <span className="font-medium">Elementos:</span>
                            <p>{environment.interactive_elements.length}</p>
                          </div>
                          <div>
                            <span className="font-medium">FPS Alvo:</span>
                            <p>{environment.performance_optimization.target_fps}</p>
                          </div>
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Eye className="h-3 w-3 mr-1" />
                          Preview
                        </Button>
                        <Button size="sm" variant="outline">
                          <Settings className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Detalhes do Ambiente Selecionado */}
          {selectedEnvironment && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-lg">{getCategoryIcon(selectedEnvironment.category)}</span>
                  {selectedEnvironment.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Propriedades Visuais */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Iluminação</h4>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>• Tipo: {selectedEnvironment.visual_properties.lighting.type}</p>
                      <p>• Intensidade: {selectedEnvironment.visual_properties.lighting.intensity}%</p>
                      <p>• Sombras: {selectedEnvironment.visual_properties.lighting.shadows_enabled ? 'Sim' : 'Não'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Materiais</h4>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>• PBR: {selectedEnvironment.visual_properties.materials.pbr_enabled ? 'Ativado' : 'Desativado'}</p>
                      <p>• Texturas: {selectedEnvironment.visual_properties.materials.texture_quality}</p>
                      <p>• Reflexões: {selectedEnvironment.visual_properties.materials.reflections_quality}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Performance</h4>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>• FPS Alvo: {selectedEnvironment.performance_optimization.target_fps}</p>
                      <p>• LOD: {selectedEnvironment.performance_optimization.lod_enabled ? 'Sim' : 'Não'}</p>
                      <p>• Culling: {selectedEnvironment.performance_optimization.occlusion_culling ? 'Sim' : 'Não'}</p>
                    </div>
                  </div>
                </div>

                {/* Elementos Interativos */}
                <div>
                  <h4 className="font-medium mb-2">Elementos Interativos ({selectedEnvironment.interactive_elements.length})</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {selectedEnvironment.interactive_elements.slice(0, 6).map((element) => (
                      <div key={element.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded text-sm">
                        <div className="w-2 h-2 bg-indigo-600 rounded-full" />
                        <span>{element.metadata.name}</span>
                        {element.interactive && (
                          <Badge variant="secondary" className="text-xs">Interativo</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Compliance */}
                <div className="bg-green-50 rounded-lg p-3">
                  <h4 className="font-medium mb-2 text-green-800">Conformidade NR</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedEnvironment.nr_compliance.applicable_nrs.map(nr => (
                      <Badge key={nr} className="bg-green-100 text-green-700 text-xs">
                        {nr}
                      </Badge>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-green-700">
                    <div className="flex items-center gap-1">
                      {selectedEnvironment.nr_compliance.safety_zones_marked ? '✅' : '❌'}
                      <span>Zonas de segurança</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {selectedEnvironment.nr_compliance.emergency_exits_visible ? '✅' : '❌'}
                      <span>Saídas de emergência</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Cenários de Treinamento */}
        <TabsContent value="scenarios" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Cenários de Treinamento
              </CardTitle>
              <CardDescription>
                Sequências de aprendizagem estruturadas nos ambientes 3D
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scenarios.length === 0 ? (
                <div className="text-center py-12">
                  <Gamepad2 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h4 className="font-semibold mb-2">Nenhum cenário criado</h4>
                  <p className="text-sm text-muted-foreground mb-6">
                    Crie cenários interativos para seus ambientes 3D
                  </p>
                  <Button>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Criar Primeiro Cenário
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Lista de cenários será renderizada aqui */}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gerador com IA */}
        <TabsContent value="generate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Gerador de Ambientes com IA
              </CardTitle>
              <CardDescription>
                Crie ambientes 3D personalizados usando inteligência artificial
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Descrição do Ambiente</label>
                <Input
                  placeholder="Ex: Fábrica de automóveis com linha de montagem e área de soldagem..."
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Categoria</label>
                  <Select defaultValue="industrial">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="industrial">🏭 Industrial</SelectItem>
                      <SelectItem value="construction">🚧 Construção</SelectItem>
                      <SelectItem value="office">🏢 Escritório</SelectItem>
                      <SelectItem value="laboratory">🧪 Laboratório</SelectItem>
                      <SelectItem value="medical">🏥 Médico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Complexidade</label>
                  <Select defaultValue="moderate">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simple">Simples (5-15 min)</SelectItem>
                      <SelectItem value="moderate">Moderado (15-45 min)</SelectItem>
                      <SelectItem value="detailed">Detalhado (45-120 min)</SelectItem>
                      <SelectItem value="ultra_realistic">Ultra Realista (2-8 horas)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Normas Regulamentadoras (NRs)</label>
                <div className="flex flex-wrap gap-2">
                  {['NR-12', 'NR-35', 'NR-10', 'NR-33', 'NR-6', 'NR-18'].map(nr => (
                    <label key={nr} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="rounded" />
                      <Badge variant="outline" className="text-xs">{nr}</Badge>
                    </label>
                  ))}
                </div>
              </div>

              <Button 
                onClick={handleGenerateCustomEnvironment}
                disabled={isGenerating}
                className="w-full h-12"
              >
                {isGenerating ? (
                  <>
                    <Brain className="h-4 w-4 mr-2 animate-pulse" />
                    Gerando Ambiente...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Gerar Ambiente com IA
                  </>
                )}
              </Button>

              {/* Progresso da Geração */}
              {generationProgress && (
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>{generationProgress.stage}</span>
                        <span>{generationProgress.progress}%</span>
                      </div>
                      <Progress value={generationProgress.progress} className="h-3" />
                      {generationProgress.error && (
                        <p className="text-sm text-red-600">{generationProgress.error}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Exemplo de Prompts */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2 text-blue-800">💡 Exemplos de Prompts</h4>
                  <div className="space-y-1 text-sm text-blue-700">
                    <p><strong>Industrial:</strong> "Fábrica têxtil com teares, área de corte e seção de acabamento"</p>
                    <p><strong>Construção:</strong> "Canteiro de obras com andaimes, guindastes e área de soldagem"</p>
                    <p><strong>Laboratório:</strong> "Laboratório químico com capelas, bancadas e área de armazenamento"</p>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Ambientes Ativos</p>
                    <p className="text-2xl font-bold">12</p>
                  </div>
                  <Box className="h-8 w-8 text-indigo-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Sessões Imersivas</p>
                    <p className="text-2xl font-bold">3,247</p>
                  </div>
                  <Eye className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Tempo Médio</p>
                    <p className="text-2xl font-bold">7.2min</p>
                  </div>
                  <Clock className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Engajamento</p>
                    <p className="text-2xl font-bold">94%</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance dos Ambientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {environments.slice(0, 3).map((env, index) => (
                  <div key={env.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{getCategoryIcon(env.category)}</span>
                      <div>
                        <h4 className="font-medium text-sm">{env.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {Math.floor(Math.random() * 500 + 200)} sessões
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">
                          {Math.floor(Math.random() * 10 + 85)}%
                        </div>
                        <div className="text-xs text-muted-foreground">Engajamento</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">
                          {Math.floor(Math.random() * 15 + 50)} FPS
                        </div>
                        <div className="text-xs text-muted-foreground">Performance</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-600">
                          {Math.floor(Math.random() * 2 + 4)}.{Math.floor(Math.random() * 10)}
                        </div>
                        <div className="text-xs text-muted-foreground">Satisfação</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

