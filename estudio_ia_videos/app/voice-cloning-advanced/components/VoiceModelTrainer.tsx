'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { 
  Brain, 
  Play, 
  Pause, 
  Square, 
  Settings, 
  Zap,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  TrendingUp,
  Database,
  Cpu,
  Activity,
  Target,
  Layers,
  Gauge,
  FileAudio,
  Download,
  Upload,
  RefreshCw,
  Save,
  Trash2,
  Eye,
  Volume2
} from 'lucide-react'

interface TrainingModel {
  id: string
  name: string
  status: 'idle' | 'training' | 'completed' | 'failed' | 'paused'
  progress: number
  accuracy: number
  loss: number
  epochs: number
  currentEpoch: number
  estimatedTime: number
  elapsedTime: number
  datasetSize: number
  modelSize: string
  architecture: string
  createdAt: Date
  lastUpdated: Date
}

interface TrainingConfig {
  epochs: number
  batchSize: number
  learningRate: number
  architecture: string
  dataAugmentation: boolean
  noiseReduction: boolean
  voiceEnhancement: boolean
  qualityThreshold: number
}

export default function VoiceModelTrainer() {
  const [models, setModels] = useState<TrainingModel[]>([
    {
      id: '1',
      name: 'Modelo Personalizado Ana',
      status: 'training',
      progress: 65,
      accuracy: 0.87,
      loss: 0.23,
      epochs: 100,
      currentEpoch: 65,
      estimatedTime: 45,
      elapsedTime: 120,
      datasetSize: 1500,
      modelSize: '2.3 GB',
      architecture: 'Transformer',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      lastUpdated: new Date()
    },
    {
      id: '2',
      name: 'Voz Executiva Carlos',
      status: 'completed',
      progress: 100,
      accuracy: 0.94,
      loss: 0.12,
      epochs: 80,
      currentEpoch: 80,
      estimatedTime: 0,
      elapsedTime: 180,
      datasetSize: 2200,
      modelSize: '3.1 GB',
      architecture: 'WaveNet',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000)
    }
  ])

  const [selectedModel, setSelectedModel] = useState<TrainingModel | null>(null)
  const [trainingConfig, setTrainingConfig] = useState<TrainingConfig>({
    epochs: 100,
    batchSize: 32,
    learningRate: 0.001,
    architecture: 'transformer',
    dataAugmentation: true,
    noiseReduction: true,
    voiceEnhancement: true,
    qualityThreshold: 0.85
  })

  const [newModelName, setNewModelName] = useState('')
  const [isCreatingModel, setIsCreatingModel] = useState(false)

  // Simular atualização em tempo real para modelos em treinamento
  useEffect(() => {
    const interval = setInterval(() => {
      setModels(prev => prev.map(model => {
        if (model.status === 'training' && model.progress < 100) {
          const newProgress = Math.min(model.progress + Math.random() * 2, 100)
          const newEpoch = Math.floor((newProgress / 100) * model.epochs)
          const newAccuracy = Math.min(0.5 + (newProgress / 100) * 0.45, 0.95)
          const newLoss = Math.max(0.5 - (newProgress / 100) * 0.4, 0.05)
          
          return {
            ...model,
            progress: newProgress,
            currentEpoch: newEpoch,
            accuracy: newAccuracy,
            loss: newLoss,
            elapsedTime: model.elapsedTime + 5,
            estimatedTime: Math.max(model.estimatedTime - 1, 0),
            lastUpdated: new Date(),
            status: newProgress >= 100 ? 'completed' : 'training'
          }
        }
        return model
      }))
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const startTraining = (modelId: string) => {
    setModels(prev => prev.map(model => 
      model.id === modelId 
        ? { ...model, status: 'training', lastUpdated: new Date() }
        : model
    ))
  }

  const pauseTraining = (modelId: string) => {
    setModels(prev => prev.map(model => 
      model.id === modelId 
        ? { ...model, status: 'paused', lastUpdated: new Date() }
        : model
    ))
  }

  const stopTraining = (modelId: string) => {
    setModels(prev => prev.map(model => 
      model.id === modelId 
        ? { ...model, status: 'idle', progress: 0, currentEpoch: 0, lastUpdated: new Date() }
        : model
    ))
  }

  const createNewModel = () => {
    if (!newModelName.trim()) return

    setIsCreatingModel(true)
    
    setTimeout(() => {
      const newModel: TrainingModel = {
        id: Math.random().toString(36).substr(2, 9),
        name: newModelName,
        status: 'idle',
        progress: 0,
        accuracy: 0,
        loss: 0,
        epochs: trainingConfig.epochs,
        currentEpoch: 0,
        estimatedTime: trainingConfig.epochs * 2,
        elapsedTime: 0,
        datasetSize: 0,
        modelSize: '0 MB',
        architecture: trainingConfig.architecture,
        createdAt: new Date(),
        lastUpdated: new Date()
      }
      
      setModels(prev => [...prev, newModel])
      setNewModelName('')
      setIsCreatingModel(false)
    }, 2000)
  }

  const deleteModel = (modelId: string) => {
    setModels(prev => prev.filter(model => model.id !== modelId))
    if (selectedModel?.id === modelId) {
      setSelectedModel(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'training':
        return <Badge className="bg-blue-100 text-blue-800">Treinando</Badge>
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Concluído</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Falhou</Badge>
      case 'paused':
        return <Badge className="bg-yellow-100 text-yellow-800">Pausado</Badge>
      default:
        return <Badge variant="secondary">Inativo</Badge>
    }
  }

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 0.9) return 'text-green-600'
    if (accuracy >= 0.8) return 'text-yellow-600'
    return 'text-red-600'
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Treinamento de Modelos de Voz
          </CardTitle>
          <CardDescription>
            Configure e monitore o treinamento de modelos de IA para clonagem de voz
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="models" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="models">Modelos</TabsTrigger>
          <TabsTrigger value="config">Configuração</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoramento</TabsTrigger>
        </TabsList>

        {/* Lista de Modelos */}
        <TabsContent value="models" className="space-y-6">
          {/* Criar Novo Modelo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Criar Novo Modelo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="model-name">Nome do Modelo</Label>
                  <Input
                    id="model-name"
                    placeholder="Ex: Minha Voz Personalizada"
                    value={newModelName}
                    onChange={(e) => setNewModelName(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={createNewModel}
                    disabled={!newModelName.trim() || isCreatingModel}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {isCreatingModel ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      <>
                        <Database className="w-4 h-4 mr-2" />
                        Criar Modelo
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Modelos Existentes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5" />
                Modelos Existentes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {models.map((model) => (
                <Card 
                  key={model.id} 
                  className={`cursor-pointer transition-all duration-200 ${
                    selectedModel?.id === model.id 
                      ? 'ring-2 ring-purple-500 bg-purple-50' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedModel(model)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Brain className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{model.name}</h4>
                          <p className="text-sm text-gray-500">
                            {model.architecture} • {model.modelSize} • {model.datasetSize} amostras
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {getStatusBadge(model.status)}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteModel(model.id)
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Métricas */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {model.progress.toFixed(0)}%
                        </div>
                        <div className="text-sm text-gray-500">Progresso</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${getAccuracyColor(model.accuracy)}`}>
                          {(model.accuracy * 100).toFixed(0)}%
                        </div>
                        <div className="text-sm text-gray-500">Precisão</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {model.currentEpoch}/{model.epochs}
                        </div>
                        <div className="text-sm text-gray-500">Épocas</div>
                      </div>
                    </div>

                    {/* Barra de Progresso */}
                    {model.status === 'training' && (
                      <div className="space-y-2">
                        <Progress value={model.progress} className="h-3" />
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>Tempo decorrido: {formatTime(model.elapsedTime)}</span>
                          <span>Estimativa: {formatTime(model.estimatedTime)}</span>
                        </div>
                      </div>
                    )}

                    {/* Controles */}
                    <div className="flex gap-2 mt-4">
                      {model.status === 'idle' || model.status === 'paused' ? (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            startTraining(model.id)
                          }}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Iniciar
                        </Button>
                      ) : model.status === 'training' ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              pauseTraining(model.id)
                            }}
                          >
                            <Pause className="w-4 h-4 mr-2" />
                            Pausar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              stopTraining(model.id)
                            }}
                          >
                            <Square className="w-4 h-4 mr-2" />
                            Parar
                          </Button>
                        </>
                      ) : null}
                      
                      {model.status === 'completed' && (
                        <Button size="sm" variant="outline">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuração de Treinamento */}
        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Configurações de Treinamento
              </CardTitle>
              <CardDescription>
                Ajuste os parâmetros para otimizar o treinamento do modelo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Parâmetros Básicos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Número de Épocas</Label>
                  <Slider
                    value={[trainingConfig.epochs]}
                    onValueChange={(value) => setTrainingConfig(prev => ({ ...prev, epochs: value[0] }))}
                    min={10}
                    max={200}
                    step={10}
                    className="w-full"
                  />
                  <div className="text-sm text-gray-500">{trainingConfig.epochs} épocas</div>
                </div>

                <div className="space-y-2">
                  <Label>Tamanho do Lote</Label>
                  <Select
                    value={trainingConfig.batchSize.toString()}
                    onValueChange={(value) => setTrainingConfig(prev => ({ ...prev, batchSize: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="8">8</SelectItem>
                      <SelectItem value="16">16</SelectItem>
                      <SelectItem value="32">32</SelectItem>
                      <SelectItem value="64">64</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Taxa de Aprendizado</Label>
                  <Slider
                    value={[trainingConfig.learningRate * 1000]}
                    onValueChange={(value) => setTrainingConfig(prev => ({ ...prev, learningRate: value[0] / 1000 }))}
                    min={0.1}
                    max={10}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="text-sm text-gray-500">{trainingConfig.learningRate.toFixed(3)}</div>
                </div>

                <div className="space-y-2">
                  <Label>Arquitetura do Modelo</Label>
                  <Select
                    value={trainingConfig.architecture}
                    onValueChange={(value) => setTrainingConfig(prev => ({ ...prev, architecture: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transformer">Transformer</SelectItem>
                      <SelectItem value="wavenet">WaveNet</SelectItem>
                      <SelectItem value="tacotron">Tacotron 2</SelectItem>
                      <SelectItem value="fastspeech">FastSpeech 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Opções Avançadas */}
              <div className="space-y-4">
                <h4 className="font-semibold">Opções Avançadas</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="data-augmentation"
                      checked={trainingConfig.dataAugmentation}
                      onChange={(e) => setTrainingConfig(prev => ({ ...prev, dataAugmentation: e.target.checked }))}
                      className="rounded"
                    />
                    <Label htmlFor="data-augmentation">Aumento de Dados</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="noise-reduction"
                      checked={trainingConfig.noiseReduction}
                      onChange={(e) => setTrainingConfig(prev => ({ ...prev, noiseReduction: e.target.checked }))}
                      className="rounded"
                    />
                    <Label htmlFor="noise-reduction">Redução de Ruído</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="voice-enhancement"
                      checked={trainingConfig.voiceEnhancement}
                      onChange={(e) => setTrainingConfig(prev => ({ ...prev, voiceEnhancement: e.target.checked }))}
                      className="rounded"
                    />
                    <Label htmlFor="voice-enhancement">Melhoria de Voz</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Limite de Qualidade</Label>
                  <Slider
                    value={[trainingConfig.qualityThreshold * 100]}
                    onValueChange={(value) => setTrainingConfig(prev => ({ ...prev, qualityThreshold: value[0] / 100 }))}
                    min={50}
                    max={95}
                    step={5}
                    className="w-full"
                  />
                  <div className="text-sm text-gray-500">{(trainingConfig.qualityThreshold * 100).toFixed(0)}%</div>
                </div>
              </div>

              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                <Save className="w-4 h-4 mr-2" />
                Salvar Configurações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monitoramento */}
        <TabsContent value="monitoring" className="space-y-6">
          {selectedModel ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Monitoramento: {selectedModel.name}
                </CardTitle>
                <CardDescription>
                  Acompanhe métricas detalhadas do treinamento em tempo real
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Métricas Principais */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {selectedModel.progress.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-500">Progresso</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className={`text-2xl font-bold ${getAccuracyColor(selectedModel.accuracy)}`}>
                        {(selectedModel.accuracy * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-500">Precisão</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {selectedModel.loss.toFixed(3)}
                      </div>
                      <div className="text-sm text-gray-500">Loss</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {formatTime(selectedModel.elapsedTime)}
                      </div>
                      <div className="text-sm text-gray-500">Tempo</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Gráfico de Progresso */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Progresso do Treinamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Época {selectedModel.currentEpoch} de {selectedModel.epochs}</span>
                          <span>{selectedModel.progress.toFixed(1)}%</span>
                        </div>
                        <Progress value={selectedModel.progress} className="h-4" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Tempo restante estimado:</span>
                          <span className="ml-2 font-medium">{formatTime(selectedModel.estimatedTime)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Última atualização:</span>
                          <span className="ml-2 font-medium">
                            {selectedModel.lastUpdated.toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Informações do Sistema */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Cpu className="w-5 h-5" />
                      Recursos do Sistema
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>GPU</span>
                          <span>85%</span>
                        </div>
                        <Progress value={85} className="h-2" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>RAM</span>
                          <span>67%</span>
                        </div>
                        <Progress value={67} className="h-2" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>CPU</span>
                          <span>45%</span>
                        </div>
                        <Progress value={45} className="h-2" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Disco</span>
                          <span>23%</span>
                        </div>
                        <Progress value={23} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Eye className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">Selecione um Modelo</h3>
                <p className="text-gray-500">
                  Escolha um modelo na aba "Modelos" para visualizar o monitoramento detalhado
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}