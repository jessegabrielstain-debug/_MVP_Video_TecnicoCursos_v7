'use client'

import React, { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { 
  Zap, 
  Upload, 
  Mic, 
  MicOff,
  Play, 
  Pause, 
  Square,
  Download,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Waves,
  Brain,
  Sparkles,
  FileAudio,
  Volume2
} from 'lucide-react'

interface AudioSample {
  id: string
  name: string
  duration: number
  quality: number
  url: string
  isProcessed: boolean
}

interface CloneResult {
  id: string
  originalText: string
  generatedAudioUrl: string
  similarity: number
  quality: number
  processingTime: number
  createdAt: Date
}

export default function FewShotCloning() {
  const [audioSamples, setAudioSamples] = useState<AudioSample[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [testText, setTestText] = useState('')
  const [cloneResults, setCloneResults] = useState<CloneResult[]>([])
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)
  const [voiceModelReady, setVoiceModelReady] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const sampleTexts = [
    "Olá, meu nome é Ana e estou testando a clonagem de voz.",
    "Esta é uma demonstração da tecnologia de síntese de fala.",
    "A inteligência artificial pode replicar características vocais únicas.",
    "Cada pessoa tem uma assinatura vocal distinta e reconhecível.",
    "A qualidade do áudio é fundamental para um bom resultado."
  ]

  const startRecording = () => {
    setIsRecording(true)
    setRecordingTime(0)
    
    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1)
    }, 1000)

    // Simular gravação
    setTimeout(() => {
      stopRecording()
    }, 10000) // Para automaticamente após 10 segundos para demo
  }

  const stopRecording = () => {
    setIsRecording(false)
    
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current)
    }

    // Simular criação de amostra de áudio
    const newSample: AudioSample = {
      id: Math.random().toString(36).substr(2, 9),
      name: `Gravação ${audioSamples.length + 1}`,
      duration: recordingTime,
      quality: Math.random() * 0.3 + 0.7, // 70-100%
      url: `data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT`,
      isProcessed: false
    }

    setAudioSamples(prev => [...prev, newSample])
    setRecordingTime(0)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    Array.from(files).forEach((file, index) => {
      const newSample: AudioSample = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        duration: Math.random() * 30 + 10, // 10-40 segundos
        quality: Math.random() * 0.3 + 0.7,
        url: URL.createObjectURL(file),
        isProcessed: false
      }

      setAudioSamples(prev => [...prev, newSample])
    })

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const processVoiceModel = async () => {
    if (audioSamples.length < 3) {
      alert('Você precisa de pelo menos 3 amostras de áudio para criar um modelo de voz.')
      return
    }

    setIsProcessing(true)
    setProcessingProgress(0)

    // Simular processamento
    const progressInterval = setInterval(() => {
      setProcessingProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + Math.random() * 10
      })
    }, 300)

    setTimeout(() => {
      clearInterval(progressInterval)
      setProcessingProgress(100)
      setIsProcessing(false)
      setVoiceModelReady(true)
      
      // Marcar todas as amostras como processadas
      setAudioSamples(prev => prev.map(sample => ({ ...sample, isProcessed: true })))
    }, 5000)
  }

  const generateClone = async () => {
    if (!testText.trim() || !voiceModelReady) return

    const newResult: CloneResult = {
      id: Math.random().toString(36).substr(2, 9),
      originalText: testText,
      generatedAudioUrl: `data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT`,
      similarity: Math.random() * 0.2 + 0.8, // 80-100%
      quality: Math.random() * 0.15 + 0.85, // 85-100%
      processingTime: Math.random() * 3 + 2, // 2-5 segundos
      createdAt: new Date()
    }

    setCloneResults(prev => [newResult, ...prev])
    setTestText('')
  }

  const playAudio = (audioId: string) => {
    if (playingAudio === audioId) {
      setPlayingAudio(null)
    } else {
      setPlayingAudio(audioId)
      // Simular reprodução por 3 segundos
      setTimeout(() => setPlayingAudio(null), 3000)
    }
  }

  const downloadAudio = (url: string, filename: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const removeSample = (sampleId: string) => {
    setAudioSamples(prev => prev.filter(sample => sample.id !== sampleId))
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getQualityColor = (quality: number) => {
    if (quality >= 0.9) return 'text-green-600'
    if (quality >= 0.7) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Clonagem Rápida (Few-Shot Learning)
          </CardTitle>
          <CardDescription>
            Crie um modelo de voz personalizado com apenas algumas amostras de áudio
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Painel de Coleta de Amostras */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileAudio className="w-5 h-5" />
                Coleta de Amostras de Voz
              </CardTitle>
              <CardDescription>
                Forneça 3-5 amostras de áudio de alta qualidade (mínimo 10 segundos cada)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="h-20 flex-col"
                >
                  <Upload className="w-6 h-6 mb-2" />
                  Upload de Arquivos
                </Button>
                
                <Button
                  onClick={isRecording ? stopRecording : startRecording}
                  variant="outline"
                  className={`h-20 flex-col ${isRecording ? 'bg-red-50 border-red-200' : ''}`}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="w-6 h-6 mb-2 text-red-600" />
                      Parar ({formatTime(recordingTime)})
                    </>
                  ) : (
                    <>
                      <Mic className="w-6 h-6 mb-2" />
                      Gravar Voz
                    </>
                  )}
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />

              <div className="space-y-3">
                <h4 className="font-medium">Amostras Coletadas ({audioSamples.length}/5)</h4>
                
                {audioSamples.map((sample) => (
                  <div key={sample.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded">
                        <Waves className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{sample.name}</div>
                        <div className="text-xs text-gray-500">
                          {formatTime(sample.duration)} • Qualidade: {(sample.quality * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {sample.isProcessed && (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => playAudio(sample.id)}
                      >
                        {playingAudio === sample.id ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSample(sample.id)}
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                ))}

                {audioSamples.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FileAudio className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p>Nenhuma amostra coletada ainda</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progresso da Coleta</span>
                  <span>{Math.min(audioSamples.length, 5)}/5</span>
                </div>
                <Progress value={(audioSamples.length / 5) * 100} className="h-2" />
              </div>

              <Button
                onClick={processVoiceModel}
                disabled={audioSamples.length < 3 || isProcessing}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Processando Modelo...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    Criar Modelo de Voz
                  </>
                )}
              </Button>

              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Treinando modelo...</span>
                    <span>{processingProgress.toFixed(0)}%</span>
                  </div>
                  <Progress value={processingProgress} className="h-2" />
                </div>
              )}

              {voiceModelReady && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-800">Modelo de voz criado com sucesso!</span>
                  </div>
                  <p className="text-sm text-green-600 mt-1">
                    Agora você pode gerar fala personalizada usando o painel ao lado.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Textos Sugeridos para Teste</CardTitle>
              <CardDescription>
                Use estes textos para testar a qualidade da clonagem
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {sampleTexts.map((text, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setTestText(text)}
                  className="w-full text-left justify-start h-auto p-3"
                >
                  <span className="text-sm">{text}</span>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Painel de Geração */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Geração de Fala Clonada
              </CardTitle>
              <CardDescription>
                Digite um texto para gerar fala usando seu modelo personalizado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="test-text">Texto para Síntese</Label>
                <Textarea
                  id="test-text"
                  placeholder="Digite o texto que deseja converter em fala..."
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  rows={4}
                  disabled={!voiceModelReady}
                />
                <div className="text-sm text-gray-500">
                  {testText.length} caracteres
                </div>
              </div>

              <Button
                onClick={generateClone}
                disabled={!testText.trim() || !voiceModelReady}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Gerar Fala Clonada
              </Button>

              {!voiceModelReady && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    <span className="font-medium text-yellow-800">Modelo não está pronto</span>
                  </div>
                  <p className="text-sm text-yellow-600 mt-1">
                    Colete pelo menos 3 amostras de áudio e processe o modelo primeiro.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="w-5 h-5" />
                Resultados da Clonagem
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cloneResults.length > 0 ? (
                cloneResults.map((result) => (
                  <div key={result.id} className="p-4 border rounded-lg space-y-3">
                    <div className="text-sm text-gray-600">
                      "{result.originalText}"
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className={`text-lg font-bold ${getQualityColor(result.similarity)}`}>
                          {(result.similarity * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-500">Similaridade</div>
                      </div>
                      <div>
                        <div className={`text-lg font-bold ${getQualityColor(result.quality)}`}>
                          {(result.quality * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-500">Qualidade</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-blue-600">
                          {result.processingTime.toFixed(1)}s
                        </div>
                        <div className="text-xs text-gray-500">Tempo</div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => playAudio(result.id)}
                        className="flex-1"
                      >
                        {playingAudio === result.id ? (
                          <>
                            <Pause className="w-4 h-4 mr-2" />
                            Pausar
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Reproduzir
                          </>
                        )}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadAudio(result.generatedAudioUrl, `clone-${result.id}.wav`)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>

                    <div className="text-xs text-gray-500">
                      Gerado em {result.createdAt.toLocaleString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Volume2 className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>Nenhuma fala gerada ainda</p>
                  <p className="text-sm">Digite um texto e clique em "Gerar Fala Clonada"</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}