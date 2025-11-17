'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { 
  Play, 
  Pause, 
  Square, 
  Volume2, 
  Download,
  Mic,
  MicOff,
  Settings,
  Waves,
  Clock,
  FileAudio,
  Zap,
  Activity,
  BarChart3,
  RefreshCw
} from 'lucide-react'

interface VoiceModel {
  id: string
  name: string
  type: 'custom' | 'professional' | 'ai-generated'
  quality: 'standard' | 'premium' | 'ultra'
  language: string
  gender: 'male' | 'female' | 'neutral'
  accent: string
  description: string
}

interface TTSSettings {
  speed: number
  pitch: number
  volume: number
  emotion: string
  emphasis: number
  pauseDuration: number
  breathiness: number
  clarity: number
}

export default function RealTimeTTS() {
  const [text, setText] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  
  const audioRef = useRef<HTMLAudioElement>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const [selectedVoice, setSelectedVoice] = useState<VoiceModel>({
    id: '1',
    name: 'Ana Silva',
    type: 'custom',
    quality: 'ultra',
    language: 'pt-BR',
    gender: 'female',
    accent: 'Brasileiro',
    description: 'Voz feminina brasileira, clara e profissional'
  })

  const [ttsSettings, setTtsSettings] = useState<TTSSettings>({
    speed: 1.0,
    pitch: 1.0,
    volume: 0.8,
    emotion: 'neutral',
    emphasis: 0.5,
    pauseDuration: 0.3,
    breathiness: 0.2,
    clarity: 0.9
  })

  const voiceModels: VoiceModel[] = [
    {
      id: '1',
      name: 'Ana Silva',
      type: 'custom',
      quality: 'ultra',
      language: 'pt-BR',
      gender: 'female',
      accent: 'Brasileiro',
      description: 'Voz feminina brasileira, clara e profissional'
    },
    {
      id: '2',
      name: 'Carlos Santos',
      type: 'custom',
      quality: 'premium',
      language: 'pt-BR',
      gender: 'male',
      accent: 'Brasileiro',
      description: 'Voz masculina brasileira, grave e autoritária'
    },
    {
      id: '3',
      name: 'Emma Watson',
      type: 'professional',
      quality: 'ultra',
      language: 'en-US',
      gender: 'female',
      accent: 'Americano',
      description: 'Voz feminina americana, elegante e sofisticada'
    },
    {
      id: '4',
      name: 'David Johnson',
      type: 'professional',
      quality: 'premium',
      language: 'en-US',
      gender: 'male',
      accent: 'Americano',
      description: 'Voz masculina americana, confiante e clara'
    }
  ]

  const emotions = [
    { value: 'neutral', label: 'Neutro' },
    { value: 'happy', label: 'Alegre' },
    { value: 'sad', label: 'Triste' },
    { value: 'excited', label: 'Animado' },
    { value: 'calm', label: 'Calmo' },
    { value: 'serious', label: 'Sério' },
    { value: 'friendly', label: 'Amigável' },
    { value: 'professional', label: 'Profissional' }
  ]

  useEffect(() => {
    if (isRecording) {
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } else {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }

    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }, [isRecording])

  const generateSpeech = async () => {
    if (!text.trim()) return

    setIsGenerating(true)
    setProgress(0)

    // Simular progresso de geração
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + Math.random() * 15
      })
    }, 200)

    // Simular geração de áudio
    setTimeout(() => {
      clearInterval(progressInterval)
      setProgress(100)
      setIsGenerating(false)
      
      // Simular URL de áudio gerado
      setAudioUrl('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT')
    }, 3000)
  }

  const playAudio = () => {
    if (audioRef.current && audioUrl) {
      if (isPaused) {
        audioRef.current.play()
        setIsPaused(false)
      } else {
        audioRef.current.play()
      }
      setIsPlaying(true)
    }
  }

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
      setIsPaused(true)
    }
  }

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setIsPlaying(false)
      setIsPaused(false)
    }
  }

  const downloadAudio = () => {
    if (audioUrl) {
      const link = document.createElement('a')
      link.href = audioUrl
      link.download = `voice-clone-${Date.now()}.wav`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const startRecording = () => {
    setIsRecording(true)
    setRecordingTime(0)
    // Aqui implementaria a gravação real usando Web Audio API
  }

  const stopRecording = () => {
    setIsRecording(false)
    setRecordingTime(0)
    // Aqui pararia a gravação e processaria o áudio
  }

  const getQualityBadge = (quality: string) => {
    switch (quality) {
      case 'ultra':
        return <Badge className="bg-purple-100 text-purple-800">Ultra HD</Badge>
      case 'premium':
        return <Badge className="bg-blue-100 text-blue-800">Premium</Badge>
      default:
        return <Badge variant="secondary">Standard</Badge>
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'custom':
        return <Badge className="bg-green-100 text-green-800">Personalizada</Badge>
      case 'professional':
        return <Badge className="bg-orange-100 text-orange-800">Profissional</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">IA</Badge>
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Síntese de Fala em Tempo Real
          </CardTitle>
          <CardDescription>
            Converta texto em fala usando modelos de voz personalizados com qualidade profissional
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel Principal */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileAudio className="w-5 h-5" />
                Entrada de Texto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="text-input">Texto para Conversão</Label>
                <Textarea
                  id="text-input"
                  placeholder="Digite ou cole o texto que deseja converter em fala..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{text.length} caracteres</span>
                  <span>Tempo estimado: {Math.ceil(text.length / 200)} min</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={generateSpeech}
                  disabled={!text.trim() || isGenerating}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Gerar Fala
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={isRecording ? 'bg-red-50 border-red-200' : ''}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="w-4 h-4 mr-2" />
                      Parar ({formatTime(recordingTime)})
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 mr-2" />
                      Gravar Voz
                    </>
                  )}
                </Button>
              </div>

              {isGenerating && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Processando...</span>
                    <span>{progress.toFixed(0)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="w-5 h-5" />
                Reprodução de Áudio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {audioUrl ? (
                <>
                  <audio ref={audioRef} src={audioUrl} />
                  
                  <div className="flex items-center gap-4">
                    <div className="flex gap-2">
                      {!isPlaying ? (
                        <Button
                          onClick={playAudio}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Reproduzir
                        </Button>
                      ) : (
                        <Button
                          onClick={pauseAudio}
                          variant="outline"
                        >
                          <Pause className="w-4 h-4 mr-2" />
                          Pausar
                        </Button>
                      )}
                      
                      <Button
                        onClick={stopAudio}
                        variant="outline"
                      >
                        <Square className="w-4 h-4 mr-2" />
                        Parar
                      </Button>
                      
                      <Button
                        onClick={downloadAudio}
                        variant="outline"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Waves className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium">Forma de Onda</span>
                    </div>
                    <div className="h-16 bg-gradient-to-r from-purple-200 via-purple-400 to-purple-200 rounded flex items-end justify-center gap-1 p-2">
                      {Array.from({ length: 50 }).map((_, i) => (
                        <div
                          key={i}
                          className="bg-purple-600 rounded-t"
                          style={{
                            height: `${Math.random() * 100}%`,
                            width: '2px'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <Volume2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhum áudio gerado ainda</p>
                  <p className="text-sm">Digite um texto e clique em "Gerar Fala"</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Painel de Configurações */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Modelo de Voz
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Voz Selecionada</Label>
                <Select
                  value={selectedVoice.id}
                  onValueChange={(value) => {
                    const voice = voiceModels.find(v => v.id === value)
                    if (voice) setSelectedVoice(voice)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {voiceModels.map((voice) => (
                      <SelectItem key={voice.id} value={voice.id}>
                        {voice.name} ({voice.language})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{selectedVoice.name}</span>
                  <div className="flex gap-1">
                    {getTypeBadge(selectedVoice.type)}
                    {getQualityBadge(selectedVoice.quality)}
                  </div>
                </div>
                <p className="text-sm text-gray-600">{selectedVoice.description}</p>
                <div className="text-xs text-gray-500">
                  {selectedVoice.gender} • {selectedVoice.accent} • {selectedVoice.language}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Controles de Voz
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Velocidade</Label>
                <Slider
                  value={[ttsSettings.speed]}
                  onValueChange={(value) => setTtsSettings(prev => ({ ...prev, speed: value[0] }))}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  className="w-full"
                />
                <div className="text-sm text-gray-500">{ttsSettings.speed.toFixed(1)}x</div>
              </div>

              <div className="space-y-2">
                <Label>Tom</Label>
                <Slider
                  value={[ttsSettings.pitch]}
                  onValueChange={(value) => setTtsSettings(prev => ({ ...prev, pitch: value[0] }))}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  className="w-full"
                />
                <div className="text-sm text-gray-500">{ttsSettings.pitch.toFixed(1)}x</div>
              </div>

              <div className="space-y-2">
                <Label>Volume</Label>
                <Slider
                  value={[ttsSettings.volume]}
                  onValueChange={(value) => setTtsSettings(prev => ({ ...prev, volume: value[0] }))}
                  min={0.0}
                  max={1.0}
                  step={0.1}
                  className="w-full"
                />
                <div className="text-sm text-gray-500">{(ttsSettings.volume * 100).toFixed(0)}%</div>
              </div>

              <div className="space-y-2">
                <Label>Emoção</Label>
                <Select
                  value={ttsSettings.emotion}
                  onValueChange={(value) => setTtsSettings(prev => ({ ...prev, emotion: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {emotions.map((emotion) => (
                      <SelectItem key={emotion.value} value={emotion.value}>
                        {emotion.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Ênfase</Label>
                <Slider
                  value={[ttsSettings.emphasis]}
                  onValueChange={(value) => setTtsSettings(prev => ({ ...prev, emphasis: value[0] }))}
                  min={0.0}
                  max={1.0}
                  step={0.1}
                  className="w-full"
                />
                <div className="text-sm text-gray-500">{(ttsSettings.emphasis * 100).toFixed(0)}%</div>
              </div>

              <div className="space-y-2">
                <Label>Clareza</Label>
                <Slider
                  value={[ttsSettings.clarity]}
                  onValueChange={(value) => setTtsSettings(prev => ({ ...prev, clarity: value[0] }))}
                  min={0.0}
                  max={1.0}
                  step={0.1}
                  className="w-full"
                />
                <div className="text-sm text-gray-500">{(ttsSettings.clarity * 100).toFixed(0)}%</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Estatísticas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-purple-600">4.2s</div>
                  <div className="text-sm text-gray-500">Tempo de Geração</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">98%</div>
                  <div className="text-sm text-gray-500">Qualidade</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">156</div>
                  <div className="text-sm text-gray-500">Palavras/min</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">24kHz</div>
                  <div className="text-sm text-gray-500">Sample Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}