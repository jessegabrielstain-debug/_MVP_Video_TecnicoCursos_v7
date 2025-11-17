
'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Play, 
  Square, 
  Download, 
  Settings, 
  Mic, 
  Globe, 
  User,
  Volume2,
  Star,
  Zap,
  Sparkles,
  Crown
} from 'lucide-react'
import ElevenLabsService, { ElevenLabsVoice, VoiceSettings } from '@/lib/elevenlabs-service'

interface AudioState {
  isPlaying: boolean
  isLoading: boolean
  currentAudio: HTMLAudioElement | null
  duration: number
  currentTime: number
}

export default function ProfessionalVoiceStudioV3() {
  // Estados principais
  const [voices, setVoices] = useState<ElevenLabsVoice[]>([])
  const [selectedVoice, setSelectedVoice] = useState<ElevenLabsVoice | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estados de geração TTS
  const [text, setText] = useState('Olá! Este é um exemplo de narração para vídeos de treinamento em segurança do trabalho. Nossa plataforma utiliza inteligência artificial para criar conteúdos educativos de alta qualidade.')
  const [isGenerating, setIsGenerating] = useState(false)
  const [audioState, setAudioState] = useState<AudioState>({
    isPlaying: false,
    isLoading: false,
    currentAudio: null,
    duration: 0,
    currentTime: 0
  })

  // Estados de configuração de voz
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    stability: 0.5,
    similarity_boost: 0.5,
    style: 0.0,
    use_speaker_boost: true
  })

  // Estados de filtros
  const [languageFilter, setLanguageFilter] = useState<string>('all')
  const [genderFilter, setGenderFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Estados de informação do usuário
  const [userInfo, setUserInfo] = useState<unknown>(null)

  const elevenLabsService = ElevenLabsService.getInstance()

  // Carregar vozes e informações do usuário
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const [voicesData, userData] = await Promise.all([
          elevenLabsService.getVoices(),
          elevenLabsService.getUserInfo().catch(() => null)
        ])
        
        setVoices(voicesData)
        setUserInfo(userData)
        
        // Selecionar primeira voz brasileira como padrão
        const brazilianVoice = voicesData.find(v => v.language === 'portuguese')
        if (brazilianVoice) {
          setSelectedVoice(brazilianVoice)
        }
        
      } catch (err) {
        setError('Erro ao carregar dados do ElevenLabs')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Filtrar vozes
  const filteredVoices = voices.filter(voice => {
    if (languageFilter !== 'all' && voice.language !== languageFilter) return false
    if (genderFilter !== 'all' && voice.gender !== genderFilter) return false
    if (categoryFilter !== 'all' && voice.category !== categoryFilter) return false
    return true
  })

  // Gerar TTS
  const generateTTS = async () => {
    if (!selectedVoice || !text.trim()) return

    try {
      setIsGenerating(true)
      
      const audioBuffer = await elevenLabsService.generateSpeech({
        text: text.trim(),
        voice_id: selectedVoice.id,
        model_id: 'eleven_multilingual_v2',
        voice_settings: voiceSettings
      })

      // Criar URL do áudio e reproduzir
      const blob = new Blob([audioBuffer], { type: 'audio/mpeg' })
      const audioUrl = URL.createObjectURL(blob)
      const audio = new Audio(audioUrl)
      
      // Configurar eventos de áudio
      audio.onloadedmetadata = () => {
        setAudioState(prev => ({
          ...prev,
          currentAudio: audio,
          duration: audio.duration
        }))
      }
      
      audio.ontimeupdate = () => {
        setAudioState(prev => ({
          ...prev,
          currentTime: audio.currentTime
        }))
      }
      
      audio.onended = () => {
        setAudioState(prev => ({
          ...prev,
          isPlaying: false,
          currentTime: 0
        }))
      }
      
      // Reproduzir automaticamente
      await audio.play()
      setAudioState(prev => ({
        ...prev,
        isPlaying: true,
        currentAudio: audio
      }))
      
    } catch (err) {
      console.error('Erro ao gerar TTS:', err)
      setError('Erro ao gerar áudio. Tente novamente.')
    } finally {
      setIsGenerating(false)
    }
  }

  // Controles de reprodução
  const togglePlayback = () => {
    if (!audioState.currentAudio) return

    if (audioState.isPlaying) {
      audioState.currentAudio.pause()
      setAudioState(prev => ({ ...prev, isPlaying: false }))
    } else {
      audioState.currentAudio.play()
      setAudioState(prev => ({ ...prev, isPlaying: true }))
    }
  }

  const stopPlayback = () => {
    if (audioState.currentAudio) {
      audioState.currentAudio.pause()
      audioState.currentAudio.currentTime = 0
      setAudioState(prev => ({ 
        ...prev, 
        isPlaying: false, 
        currentTime: 0 
      }))
    }
  }

  // Download do áudio
  const downloadAudio = () => {
    if (!audioState.currentAudio) return
    
    const link = document.createElement('a')
    link.href = audioState.currentAudio.src
    link.download = `tts-audio-${selectedVoice?.name || 'voice'}.mp3`
    link.click()
  }

  // Formatação de tempo
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-sm text-muted-foreground">Carregando Professional Voice Studio...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Crown className="h-8 w-8 text-purple-600" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Professional Voice Studio V3
          </h1>
          <Badge variant="secondary" className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700">
            ElevenLabs Premium
          </Badge>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Sistema profissional de TTS com 29+ vozes premium, clonagem de voz e controles avançados para narração de vídeos educativos.
        </p>
      </div>

      {/* User Info */}
      {userInfo && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">
                    Caracteres: {userInfo.character_count.toLocaleString()} / {userInfo.character_limit.toLocaleString()}
                  </span>
                </div>
                <Progress 
                  value={(userInfo.character_count / userInfo.character_limit) * 100} 
                  className="w-32"
                />
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {userInfo.subscription.tier} Plan
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Painel de Vozes */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Voice Library
                <Badge variant="secondary">{filteredVoices.length} vozes</Badge>
              </CardTitle>
              <CardDescription>
                Selecione uma voz premium para narração
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filtros */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Idioma</Label>
                  <Select value={languageFilter} onValueChange={setLanguageFilter}>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os idiomas</SelectItem>
                      <SelectItem value="portuguese">Português</SelectItem>
                      <SelectItem value="english">Inglês</SelectItem>
                      <SelectItem value="spanish">Espanhol</SelectItem>
                      <SelectItem value="french">Francês</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Gênero</Label>
                  <Select value={genderFilter} onValueChange={setGenderFilter}>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="male">Masculino</SelectItem>
                      <SelectItem value="female">Feminino</SelectItem>
                      <SelectItem value="neutral">Neutro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Categoria</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="premade">Premium</SelectItem>
                      <SelectItem value="cloned">Clonadas</SelectItem>
                      <SelectItem value="professional">Profissionais</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Lista de Vozes */}
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {filteredVoices.map((voice) => (
                    <Card 
                      key={voice.id}
                      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                        selectedVoice?.id === voice.id 
                          ? 'ring-2 ring-purple-500 bg-purple-50/50' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedVoice(voice)}
                    >
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">{voice.name}</h4>
                          {voice.category === 'premade' && (
                            <Star className="h-3 w-3 text-yellow-500" />
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="outline" className="text-xs px-1 py-0.5">
                            {voice.language}
                          </Badge>
                          <Badge variant="outline" className="text-xs px-1 py-0.5">
                            {voice.gender}
                          </Badge>
                          <Badge variant="outline" className="text-xs px-1 py-0.5">
                            {voice.accent}
                          </Badge>
                        </div>
                        
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {voice.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Painel Principal */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                Text-to-Speech Generator
                {selectedVoice && (
                  <Badge variant="outline" className="ml-auto">
                    {selectedVoice.name}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Digite o texto para gerar narração profissional
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Área de Texto */}
              <div className="space-y-2">
                <Label>Texto para Narração</Label>
                <Textarea
                  placeholder="Digite aqui o texto para ser convertido em narração..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="min-h-[120px] resize-none"
                />
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>{text.length} caracteres</span>
                  <span>~{Math.ceil(text.length / 1000)} segundos de áudio</span>
                </div>
              </div>

              {/* Configurações de Voz */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Configurações de Voz
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Estabilidade: {voiceSettings.stability}</Label>
                      <Slider
                        value={[voiceSettings.stability]}
                        onValueChange={([value]) => setVoiceSettings(prev => ({
                          ...prev,
                          stability: value
                        }))}
                        max={1}
                        step={0.1}
                        className="w-full"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs">Similaridade: {voiceSettings.similarity_boost}</Label>
                      <Slider
                        value={[voiceSettings.similarity_boost]}
                        onValueChange={([value]) => setVoiceSettings(prev => ({
                          ...prev,
                          similarity_boost: value
                        }))}
                        max={1}
                        step={0.1}
                        className="w-full"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs">Estilo: {voiceSettings.style}</Label>
                      <Slider
                        value={[voiceSettings.style]}
                        onValueChange={([value]) => setVoiceSettings(prev => ({
                          ...prev,
                          style: value
                        }))}
                        max={1}
                        step={0.1}
                        className="w-full"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2 pt-4">
                      <input
                        type="checkbox"
                        id="speaker-boost"
                        checked={voiceSettings.use_speaker_boost}
                        onChange={(e) => setVoiceSettings(prev => ({
                          ...prev,
                          use_speaker_boost: e.target.checked
                        }))}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor="speaker-boost" className="text-xs">
                        Speaker Boost
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Controles de Geração e Reprodução */}
              <div className="flex flex-col gap-4">
                {/* Botão de Geração */}
                <Button 
                  onClick={generateTTS}
                  disabled={isGenerating || !selectedVoice || !text.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Gerando Áudio...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Gerar Narração
                    </>
                  )}
                </Button>

                {/* Player de Áudio */}
                {audioState.currentAudio && (
                  <Card>
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        {/* Controles de Reprodução */}
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={togglePlayback}
                            className="flex items-center gap-2"
                          >
                            {audioState.isPlaying ? (
                              <Square className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                            {audioState.isPlaying ? 'Pausar' : 'Reproduzir'}
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={stopPlayback}
                          >
                            <Square className="h-4 w-4 mr-1" />
                            Parar
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={downloadAudio}
                            className="flex items-center gap-2"
                          >
                            <Download className="h-4 w-4" />
                            Download
                          </Button>
                        </div>

                        {/* Barra de Progresso */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{formatTime(audioState.currentTime)}</span>
                            <span>{formatTime(audioState.duration)}</span>
                          </div>
                          <Progress 
                            value={(audioState.currentTime / audioState.duration) * 100} 
                            className="w-full"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                  {error}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
