

'use client'

/**
 * 🎤 Advanced TTS Panel - Sprint 28
 * Features: Progress Bar, Audio Preview, Redis Cache Support
 */

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Volume2, Play, Pause, Download, Loader2, CheckCircle2, XCircle, Zap } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface TTSVoice {
  id: string
  name: string
  language: string
  gender?: string
}

interface TTSResult {
  success: boolean
  audioUrl?: string
  duration?: number
  provider?: string
  cached?: boolean
  cacheKey?: string
  error?: string
}

const PROVIDERS: Array<{ value: string; label: string; icon: string }> = [
  { value: 'auto', label: 'Automático (Fallback)', icon: '🔄' },
  { value: 'elevenlabs', label: 'ElevenLabs (Premium)', icon: '⭐' },
  { value: 'azure', label: 'Azure Speech', icon: '☁️' },
  { value: 'google', label: 'Google Cloud TTS', icon: '🌐' }
]

export default function AdvancedTTSPanelSprint28() {
  const [text, setText] = useState('')
  const [provider, setProvider] = useState('auto')
  const [voice, setVoice] = useState('')
  const [speed, setSpeed] = useState([1.0])
  const [pitch, setPitch] = useState([0])
  const [language, setLanguage] = useState('pt-BR')
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<TTSResult | null>(null)
  
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  
  const [voices, setVoices] = useState<{ [key: string]: TTSVoice[] }>({})
  const [availableVoices, setAvailableVoices] = useState<TTSVoice[]>([])

  // Load voices on mount
  useEffect(() => {
    loadVoices()
  }, [])

  // Update available voices when provider changes
  useEffect(() => {
    if (provider === 'auto') {
      setAvailableVoices(voices.azure || [])
      setVoice(voices.azure?.[0]?.id || '')
    } else {
      setAvailableVoices(voices[provider] || [])
      setVoice(voices[provider]?.[0]?.id || '')
    }
  }, [provider, voices])

  /**
   * Load available voices
   */
  const loadVoices = async () => {
    try {
      const response = await fetch('/api/tts/generate')
      if (response.ok) {
        const data = await response.json()
        setVoices(data)
      }
    } catch (error) {
      console.error('Failed to load voices:', error)
    }
  }

  /**
   * Generate TTS audio
   */
  const handleGenerate = async () => {
    if (!text.trim()) {
      toast.error('Digite um texto para gerar áudio')
      return
    }

    if (text.length > 5000) {
      toast.error('Texto muito longo (máximo 5000 caracteres)')
      return
    }

    setIsGenerating(true)
    setProgress(0)
    setResult(null)

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90))
    }, 300)

    try {
      const response = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          provider: provider === 'auto' ? undefined : provider,
          voice,
          language,
          speed: speed[0],
          pitch: pitch[0],
          cache: true
        })
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Falha ao gerar áudio')
      }

      const data: TTSResult = await response.json()
      
      setProgress(100)
      setResult(data)

      if (data.success) {
        toast.success(
          data.cached 
            ? '✅ Áudio recuperado do cache!' 
            : `✅ Áudio gerado com ${data.provider}!`
        )
      } else {
        toast.error(data.error || 'Erro ao gerar áudio')
      }

    } catch (error: unknown) {
      clearInterval(progressInterval)
      const errorMessage = error instanceof Error ? error.message : 'Erro ao gerar áudio';
      toast.error(errorMessage)
      setResult({
        success: false,
        error: errorMessage
      })
    } finally {
      setIsGenerating(false)
    }
  }

  /**
   * Play/Pause audio preview
   */
  const togglePlayback = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  /**
   * Download audio file
   */
  const handleDownload = () => {
    if (!result?.audioUrl) return
    
    const link = document.createElement('a')
    link.href = result.audioUrl
    link.download = `audio-${Date.now()}.mp3`
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.success('Download iniciado!')
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-6 w-6" />
            Gerador de Áudio TTS Avançado
          </CardTitle>
          <CardDescription>
            Sistema multi-provider com fallback automático e cache Redis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Text Input */}
          <div className="space-y-2">
            <Label htmlFor="text">Texto para Conversão</Label>
            <Textarea
              id="text"
              placeholder="Digite ou cole o texto que deseja converter em áudio..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              className="resize-none"
            />
            <p className="text-sm text-muted-foreground">
              {text.length} / 5000 caracteres
            </p>
          </div>

          {/* Provider Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger id="provider">
                  <SelectValue placeholder="Selecione o provider" />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      <span className="flex items-center gap-2">
                        <span>{p.icon}</span>
                        <span>{p.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="voice">Voz</Label>
              <Select value={voice} onValueChange={setVoice}>
                <SelectTrigger id="voice">
                  <SelectValue placeholder="Selecione a voz" />
                </SelectTrigger>
                <SelectContent>
                  {availableVoices.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name} {v.gender && `(${v.gender})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Speed and Pitch */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Velocidade: {speed[0].toFixed(1)}x</Label>
              <Slider
                value={speed}
                onValueChange={setSpeed}
                min={0.5}
                max={2.0}
                step={0.1}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>Pitch: {pitch[0] > 0 ? `+${pitch[0]}` : pitch[0]}</Label>
              <Slider
                value={pitch}
                onValueChange={setPitch}
                min={-10}
                max={10}
                step={1}
                className="w-full"
              />
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !text.trim()}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Gerando áudio...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-5 w-5" />
                Gerar Áudio TTS
              </>
            )}
          </Button>

          {/* Progress Bar */}
          {isGenerating && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-center text-muted-foreground">
                Processando... {progress}%
              </p>
            </div>
          )}

          {/* Result */}
          {result && (
            <Card className={result.success ? 'border-green-500' : 'border-red-500'}>
              <CardContent className="pt-6 space-y-4">
                {result.success ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <span className="font-semibold">Áudio gerado com sucesso!</span>
                      </div>
                      <div className="flex gap-2">
                        {result.cached && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            Cache
                          </Badge>
                        )}
                        <Badge variant="outline">{result.provider}</Badge>
                        <Badge variant="outline">{result.duration?.toFixed(1)}s</Badge>
                      </div>
                    </div>

                    {/* Audio Player */}
                    {result.audioUrl && (
                      <div className="space-y-3">
                        <audio
                          ref={audioRef}
                          src={result.audioUrl}
                          onEnded={() => setIsPlaying(false)}
                          onPlay={() => setIsPlaying(true)}
                          onPause={() => setIsPlaying(false)}
                        />
                        
                        <div className="flex items-center gap-3">
                          <Button
                            onClick={togglePlayback}
                            variant="outline"
                            size="icon"
                          >
                            {isPlaying ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>

                          <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary transition-all" />
                          </div>

                          <Button
                            onClick={handleDownload}
                            variant="outline"
                            size="icon"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-red-500">
                    <XCircle className="h-5 w-5" />
                    <span>{result.error || 'Erro desconhecido'}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Cache Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Cache Redis Ativo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Os áudios gerados são automaticamente armazenados em cache por 7 dias. 
            Requisições repetidas com o mesmo texto e configurações são instantâneas! ⚡
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
