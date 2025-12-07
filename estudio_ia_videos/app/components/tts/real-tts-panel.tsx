
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Volume2, 
  Play, 
  Pause, 
  Download,
  Mic,
  Settings,
  Music,
  Clock,
  CheckCircle
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface TTSVoice {
  id: string
  name: string
  language: string
  gender: 'male' | 'female'
  description: string
}

interface RealTTSPanelProps {
  onAudioGenerated?: (audioUrl: string, duration: number) => void
  initialText?: string
}

export default function RealTTSPanel({ 
  onAudioGenerated, 
  initialText = '' 
}: RealTTSPanelProps) {
  const [voices, setVoices] = useState<TTSVoice[]>([])
  const [selectedVoice, setSelectedVoice] = useState<string>('')
  const [text, setText] = useState(initialText)
  const [speed, setSpeed] = useState([1.0])
  const [pitch, setPitch] = useState([0])
  const [volume, setVolume] = useState([0])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioDuration, setAudioDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null)

  useEffect(() => {
    fetchVoices()
  }, [])

  useEffect(() => {
    if (audioUrl && !audio) {
      const audioElement = new Audio(audioUrl)
      audioElement.addEventListener('ended', () => setIsPlaying(false))
      setAudio(audioElement)
    }
    return () => {
      if (audio) {
        audio.pause()
        audio.removeEventListener('ended', () => setIsPlaying(false))
      }
    }
  }, [audioUrl, audio])

  const fetchVoices = async () => {
    try {
      const response = await fetch('/api/v1/tts/google-real')
      const data = await response.json()
      setVoices(data.voices || [])
      if (data.voices?.length > 0) {
        setSelectedVoice(data.voices[0].id)
      }
    } catch (error) {
      console.error('Error fetching voices:', error)
      toast.error('Erro ao carregar vozes')
    }
  }

  const generateAudio = async () => {
    if (!text.trim() || !selectedVoice) {
      toast.error('Preencha o texto e selecione uma voz')
      return
    }

    try {
      setIsGenerating(true)
      setGenerationProgress(0)
      setAudioUrl(null)

      // Simulate progress
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + Math.random() * 20
        })
      }, 200)

      const response = await fetch('/api/v1/tts/google-real', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voiceId: selectedVoice,
          speed: speed[0],
          pitch: pitch[0],
          volume: volume[0]
        })
      })

      clearInterval(progressInterval)
      setGenerationProgress(100)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro na geração')
      }

      const data = await response.json()
      
      if (data.success) {
        setAudioUrl(data.audioUrl)
        setAudioDuration(data.duration)
        toast.success('✅ Áudio gerado com sucesso!')
        onAudioGenerated?.(data.audioUrl, data.duration)
      } else {
        throw new Error(data.error || 'Erro na geração')
      }

    } catch (error: unknown) {
      console.error('TTS generation error:', error)
      toast.error(`❌ ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const togglePlayPause = () => {
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const downloadAudio = () => {
    if (!audioUrl) return

    const a = document.createElement('a')
    a.href = audioUrl
    a.download = 'tts-audio.mp3'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const estimatedDuration = Math.ceil(text.split(/\s+/).length / 2.5) // ~150 words per minute

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Volume2 className="h-6 w-6" />
            <span>Text-to-Speech Real</span>
            <Badge variant="secondary">Google Cloud</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Text Input */}
          <div className="space-y-2">
            <Label htmlFor="tts-text">Texto para Narração</Label>
            <Textarea
              id="tts-text"
              placeholder="Digite o texto que será convertido em áudio..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>{text.split(/\s+/).filter(w => w.length > 0).length} palavras</span>
              <span>~{estimatedDuration}s estimados</span>
            </div>
          </div>

          {/* Voice Selection */}
          <div className="space-y-2">
            <Label>Voz</Label>
            <Select value={selectedVoice} onValueChange={setSelectedVoice}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma voz" />
              </SelectTrigger>
              <SelectContent>
                {voices.map((voice) => (
                  <SelectItem key={voice.id} value={voice.id}>
                    <div className="flex items-center space-x-2">
                      <span>{voice.name}</span>
                      <Badge variant={voice.gender === 'female' ? 'secondary' : 'outline'}>
                        {voice.gender === 'female' ? '♀' : '♂'}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedVoice && (
              <p className="text-sm text-gray-600">
                {voices.find(v => v.id === selectedVoice)?.description}
              </p>
            )}
          </div>

          {/* Advanced Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Velocidade: {speed[0]}x</Label>
              <Slider
                value={speed}
                onValueChange={setSpeed}
                min={0.25}
                max={4.0}
                step={0.25}
              />
            </div>
            <div className="space-y-2">
              <Label>Tom: {pitch[0] > 0 ? '+' : ''}{pitch[0]}</Label>
              <Slider
                value={pitch}
                onValueChange={setPitch}
                min={-20}
                max={20}
                step={1}
              />
            </div>
            <div className="space-y-2">
              <Label>Volume: {volume[0] > 0 ? '+' : ''}{volume[0]}dB</Label>
              <Slider
                value={volume}
                onValueChange={setVolume}
                min={-20}
                max={20}
                step={1}
              />
            </div>
          </div>

          {/* Generation Button */}
          <div className="space-y-4">
            <Button 
              onClick={generateAudio}
              disabled={isGenerating || !text.trim() || !selectedVoice}
              size="lg"
              className="w-full"
            >
              <Mic className="h-4 w-4 mr-2" />
              {isGenerating ? 'Gerando Áudio...' : 'Gerar Áudio TTS'}
            </Button>

            {isGenerating && (
              <div className="space-y-2">
                <Progress value={generationProgress} />
                <p className="text-center text-sm text-gray-600">
                  Processando com Google Cloud TTS... {Math.round(generationProgress)}%
                </p>
              </div>
            )}
          </div>

          {/* Audio Player */}
          {audioUrl && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Button
                      size="sm"
                      onClick={togglePlayPause}
                      variant="outline"
                    >
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <div>
                      <div className="flex items-center space-x-2">
                        <Music className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Áudio Gerado</span>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="text-xs text-gray-600 flex items-center space-x-2">
                        <Clock className="h-3 w-3" />
                        <span>{audioDuration}s</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    onClick={downloadAudio}
                    variant="outline"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
            <div>
              <div className="font-bold text-blue-800">6 Vozes</div>
              <div className="text-blue-600">Brasileiras Neural</div>
            </div>
            <div>
              <div className="font-bold text-blue-800">Google Cloud</div>
              <div className="text-blue-600">TTS Premium</div>
            </div>
            <div>
              <div className="font-bold text-blue-800">Qualidade</div>
              <div className="text-blue-600">Studio Grade</div>
            </div>
            <div>
              <div className="font-bold text-blue-800">Real-time</div>
              <div className="text-blue-600">Generation</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
