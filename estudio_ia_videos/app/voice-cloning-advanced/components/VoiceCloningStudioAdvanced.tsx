'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { 
  Mic, 
  Upload, 
  Play, 
  Pause, 
  Download, 
  Settings, 
  Volume2, 
  Brain, 
  Wand2,
  Save,
  RefreshCw,
  Sparkles,
  Clock,
  CheckCircle,
  AlertCircle,
  Music,
  Radio,
  Mic,
  Headphones,
  Users,
  Star,
  Zap,
  Eye,
  Camera,
  FileAudio,
  Waves,
  BarChart3,
  Target,
  Layers,
  Palette
} from 'lucide-react'

import VoiceUploadAnalyzer from './VoiceUploadAnalyzer'
import VoiceModelTrainer from './VoiceModelTrainer'
import RealTimeTTSEngine from './RealTimeTTSEngine'
import { VoiceLibraryProfessional } from './VoiceLibraryProfessional'
import { VoiceControlsAdvanced } from './VoiceControlsAdvanced'
import { FewShotCloningSystem } from './FewShotCloningSystem'
import { AudioExportStudio } from './AudioExportStudio'
import { VoicePresetsManager } from './VoicePresetsManager'

interface VoiceModel {
  id: string
  name: string
  type: 'custom' | 'professional' | 'few-shot'
  quality: number
  language: string
  gender: 'male' | 'female' | 'neutral'
  age: string
  accent: string
  trainingStatus: 'training' | 'ready' | 'failed'
  trainingProgress: number
  sampleDuration: number
  createdAt: Date
}

interface VoiceSettings {
  speed: number
  pitch: number
  emotion: string
  emphasis: number
  pause: number
  volume: number
  clarity: number
  warmth: number
}

export default function VoiceCloningStudioAdvanced() {
  const [selectedModel, setSelectedModel] = useState<VoiceModel | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isTraining, setIsTraining] = useState(false)
  const [trainingProgress, setTrainingProgress] = useState(0)
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null)
  const [inputText, setInputText] = useState('')
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    speed: 1.0,
    pitch: 1.0,
    emotion: 'neutral',
    emphasis: 0.5,
    pause: 0.5,
    volume: 1.0,
    clarity: 0.8,
    warmth: 0.6
  })

  const audioRef = useRef<HTMLAudioElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)

  const [voiceModels, setVoiceModels] = useState<VoiceModel[]>([
    {
      id: '1',
      name: 'Ana Profissional',
      type: 'professional',
      quality: 0.95,
      language: 'pt-BR',
      gender: 'female',
      age: '30-40',
      accent: 'São Paulo',
      trainingStatus: 'ready',
      trainingProgress: 100,
      sampleDuration: 300,
      createdAt: new Date()
    },
    {
      id: '2',
      name: 'Carlos Executivo',
      type: 'professional',
      quality: 0.92,
      language: 'pt-BR',
      gender: 'male',
      age: '35-45',
      accent: 'Rio de Janeiro',
      trainingStatus: 'ready',
      trainingProgress: 100,
      sampleDuration: 280,
      createdAt: new Date()
    },
    {
      id: '3',
      name: 'Minha Voz Personalizada',
      type: 'custom',
      quality: 0.88,
      language: 'pt-BR',
      gender: 'neutral',
      age: '25-35',
      accent: 'Personalizado',
      trainingStatus: 'training',
      trainingProgress: 65,
      sampleDuration: 45,
      createdAt: new Date()
    }
  ])

  const emotions = [
    { value: 'neutral', label: 'Neutro', color: 'bg-gray-500' },
    { value: 'happy', label: 'Alegre', color: 'bg-yellow-500' },
    { value: 'sad', label: 'Triste', color: 'bg-blue-500' },
    { value: 'excited', label: 'Animado', color: 'bg-orange-500' },
    { value: 'calm', label: 'Calmo', color: 'bg-green-500' },
    { value: 'serious', label: 'Sério', color: 'bg-purple-500' },
    { value: 'friendly', label: 'Amigável', color: 'bg-pink-500' },
    { value: 'professional', label: 'Profissional', color: 'bg-indigo-500' }
  ]

  const handleGenerateAudio = async () => {
    if (!selectedModel || !inputText.trim()) return

    setIsTraining(true)
    setTrainingProgress(0)

    // Simular processo de geração
    const interval = setInterval(() => {
      setTrainingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsTraining(false)
          // Simular URL de áudio gerado
          setGeneratedAudio('/audio/generated-voice-sample.mp3')
          return 100
        }
        return prev + 10
      })
    }, 200)
  }

  const handlePlayAudio = () => {
    if (audioRef.current && generatedAudio) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleDownloadAudio = () => {
    if (generatedAudio) {
      const link = document.createElement('a')
      link.href = generatedAudio
      link.download = `voice-clone-${selectedModel?.name}-${Date.now()}.mp3`
      link.click()
    }
  }

  const getQualityColor = (quality: number) => {
    if (quality >= 0.9) return 'text-green-600'
    if (quality >= 0.8) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return <Badge className="bg-green-100 text-green-800">Pronto</Badge>
      case 'training':
        return <Badge className="bg-yellow-100 text-yellow-800">Treinando</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Falhou</Badge>
      default:
        return <Badge variant="secondary">Desconhecido</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl">
              <Mic className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Voice Cloning Studio Advanced
              </h1>
              <p className="text-gray-600">Sistema avançado de clonagem de voz com IA neural</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="px-3 py-1">
              <Brain className="w-4 h-4 mr-2" />
              IA Neural Ativa
            </Badge>
            <Badge variant="secondary" className="px-3 py-1">
              <Zap className="w-4 h-4 mr-2" />
              Tempo Real
            </Badge>
            <Badge variant="secondary" className="px-3 py-1">
              <Star className="w-4 h-4 mr-2" />
              Qualidade Studio
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="generator" className="space-y-6">
          <TabsList className="grid w-full grid-cols-8 bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="generator" className="flex items-center gap-2">
              <Wand2 className="w-4 h-4" />
              Gerador
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="training" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Treinamento
            </TabsTrigger>
            <TabsTrigger value="library" className="flex items-center gap-2">
              <Music className="w-4 h-4" />
              Biblioteca
            </TabsTrigger>
            <TabsTrigger value="controls" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Controles
            </TabsTrigger>
            <TabsTrigger value="few-shot" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Few-Shot
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Exportar
            </TabsTrigger>
            <TabsTrigger value="presets" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Presets
            </TabsTrigger>
          </TabsList>

          {/* Gerador Principal */}
          <TabsContent value="generator" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Seleção de Modelo */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Modelos de Voz
                  </CardTitle>
                  <CardDescription>
                    Selecione um modelo de voz para síntese
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {voiceModels.map((model) => (
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
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold">{model.name}</h4>
                            <p className="text-sm text-gray-600">
                              {model.gender} • {model.age} • {model.accent}
                            </p>
                          </div>
                          {getStatusBadge(model.trainingStatus)}
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className={`font-medium ${getQualityColor(model.quality)}`}>
                            Qualidade: {(model.quality * 100).toFixed(0)}%
                          </span>
                          <span className="text-gray-500">
                            {model.sampleDuration}s
                          </span>
                        </div>

                        {model.trainingStatus === 'training' && (
                          <div className="mt-2">
                            <Progress value={model.trainingProgress} className="h-2" />
                            <p className="text-xs text-gray-500 mt-1">
                              Treinando... {model.trainingProgress}%
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>

              {/* Geração de Áudio */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mic className="w-5 h-5" />
                    Síntese de Voz
                  </CardTitle>
                  <CardDescription>
                    Digite o texto para gerar áudio com a voz selecionada
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Entrada de Texto */}
                  <div className="space-y-2">
                    <Label htmlFor="text-input">Texto para Síntese</Label>
                    <Textarea
                      id="text-input"
                      placeholder="Digite o texto que deseja converter em fala..."
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      rows={4}
                      className="resize-none"
                    />
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>{inputText.length} caracteres</span>
                      <span>Máximo: 5000 caracteres</span>
                    </div>
                  </div>

                  {/* Controles de Voz */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Velocidade</Label>
                      <Slider
                        value={[voiceSettings.speed]}
                        onValueChange={(value) => setVoiceSettings(prev => ({ ...prev, speed: value[0] }))}
                        min={0.5}
                        max={2.0}
                        step={0.1}
                        className="w-full"
                      />
                      <div className="text-sm text-gray-500">{voiceSettings.speed.toFixed(1)}x</div>
                    </div>

                    <div className="space-y-2">
                      <Label>Tom</Label>
                      <Slider
                        value={[voiceSettings.pitch]}
                        onValueChange={(value) => setVoiceSettings(prev => ({ ...prev, pitch: value[0] }))}
                        min={0.5}
                        max={2.0}
                        step={0.1}
                        className="w-full"
                      />
                      <div className="text-sm text-gray-500">{voiceSettings.pitch.toFixed(1)}x</div>
                    </div>
                  </div>

                  {/* Seleção de Emoção */}
                  <div className="space-y-2">
                    <Label>Emoção</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {emotions.map((emotion) => (
                        <Button
                          key={emotion.value}
                          variant={voiceSettings.emotion === emotion.value ? "default" : "outline"}
                          size="sm"
                          onClick={() => setVoiceSettings(prev => ({ ...prev, emotion: emotion.value }))}
                          className="flex items-center gap-2"
                        >
                          <div className={`w-3 h-3 rounded-full ${emotion.color}`} />
                          {emotion.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Botão de Geração */}
                  <div className="flex gap-4">
                    <Button
                      onClick={handleGenerateAudio}
                      disabled={!selectedModel || !inputText.trim() || isTraining}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700"
                    >
                      {isTraining ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Gerando... {trainingProgress}%
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4 mr-2" />
                          Gerar Áudio
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Progresso de Geração */}
                  {isTraining && (
                    <div className="space-y-2">
                      <Progress value={trainingProgress} className="h-3" />
                      <p className="text-sm text-gray-600 text-center">
                        Processando com IA neural... {trainingProgress}%
                      </p>
                    </div>
                  )}

                  {/* Player de Áudio */}
                  {generatedAudio && (
                    <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Button
                              onClick={handlePlayAudio}
                              variant="outline"
                              size="sm"
                            >
                              {isPlaying ? (
                                <Pause className="w-4 h-4" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                            </Button>
                            <div>
                              <p className="font-medium">Áudio Gerado</p>
                              <p className="text-sm text-gray-600">
                                Modelo: {selectedModel?.name}
                              </p>
                            </div>
                          </div>
                          <Button
                            onClick={handleDownloadAudio}
                            variant="outline"
                            size="sm"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </div>
                        <audio
                          ref={audioRef}
                          src={generatedAudio}
                          onEnded={() => setIsPlaying(false)}
                          className="hidden"
                        />
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Upload e Análise */}
          <TabsContent value="upload">
            <VoiceUploadAnalyzer />
          </TabsContent>

          {/* Treinamento de Modelos */}
          <TabsContent value="training">
            <VoiceModelTrainer />
          </TabsContent>

          {/* Biblioteca de Vozes */}
          <TabsContent value="library">
            <VoiceLibraryProfessional />
          </TabsContent>

          {/* Controles Avançados */}
          <TabsContent value="controls">
            <VoiceControlsAdvanced />
          </TabsContent>

          {/* Few-Shot Cloning */}
          <TabsContent value="few-shot">
            <FewShotCloningSystem />
          </TabsContent>

          {/* Exportação */}
          <TabsContent value="export">
            <AudioExportStudio />
          </TabsContent>

          {/* Presets */}
          <TabsContent value="presets">
            <VoicePresetsManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

