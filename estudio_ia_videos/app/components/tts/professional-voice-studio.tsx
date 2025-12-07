// TODO: Verificar módulo azure-speech-service e tipos

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Slider } from '../ui/slider'
import { Switch } from '../ui/switch'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Alert, AlertDescription } from '../ui/alert'
import { Separator } from '../ui/separator'
import { Progress } from '../ui/progress'
import { 
  Mic,
  Play, 
  Pause,
  Volume2,
  Settings,
  Zap,
  Crown,
  CheckCircle,
  XCircle,
  Loader2,
  Headphones,
  BarChart3,
  DollarSign
} from 'lucide-react'
import { azureSpeechService, AzureVoice } from '../../lib/tts/azure-speech-service'
import { BrazilianRegionalTTS, BrazilianVoiceRegional } from '../../lib/tts/brazilian-regional-tts'
import { toast } from 'react-hot-toast'

interface ProfessionalVoiceStudioProps {
  onVoiceConfigChange: (config: VoiceConfiguration) => void
  defaultText?: string
  contentType?: 'treinamento' | 'apresentacao' | 'marketing' | 'educacional'
}

export interface VoiceConfiguration {
  provider: 'azure' | 'elevenlabs' | 'regional'
  voiceId: string
  displayName: string
  style: string
  speed: number
  pitch: number
  emotion: 'neutro' | 'animado' | 'serio' | 'preocupado'
  regional_expressions: boolean
  quality: 'standard' | 'premium' | 'studio'
}

interface VoiceTestResult {
  audioUrl: string
  duration: number
  quality: {
    pronunciation_score: number
    clarity_score: number
    naturalness_score: number
  }
  cost: number
  processingTime: number
}

interface TextAnalysis {
  complexity: string
  readability: number
  technicalTerms: string[]
  recommendedAdjustments: string[]
}

export default function ProfessionalVoiceStudio({
  onVoiceConfigChange,
  defaultText = "Bem-vindos ao treinamento de segurança do trabalho. Hoje vamos aprender sobre os procedimentos essenciais da NR-12 para proteção em máquinas e equipamentos.",
  contentType = 'treinamento'
}: ProfessionalVoiceStudioProps) {
  
  // Estados de configuração
  const [selectedProvider, setSelectedProvider] = useState<'azure' | 'elevenlabs' | 'regional'>('azure')
  const [selectedVoice, setSelectedVoice] = useState<string>('')
  const [voiceConfig, setVoiceConfig] = useState<VoiceConfiguration>({
    provider: 'azure',
    voiceId: '',
    displayName: '',
    style: 'neutral',
    speed: 1.0,
    pitch: 1.0,
    emotion: 'neutro',
    regional_expressions: false,
    quality: 'premium'
  })
  
  // Estados de teste
  const [testText, setTestText] = useState(defaultText)
  const [isTestingVoice, setIsTestingVoice] = useState(false)
  const [testResult, setTestResult] = useState<VoiceTestResult | null>(null)
  const [playingAudio, setPlayingAudio] = useState<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  
  // Estados de dados
  const [azureVoices] = useState<AzureVoice[]>(azureSpeechService.getAvailableVoices())
  const [regionalVoices] = useState<BrazilianVoiceRegional[]>(BrazilianRegionalTTS.REGIONAL_VOICES)
  const [textAnalysis, setTextAnalysis] = useState<TextAnalysis | null>(null)

  // Analisar texto quando muda
  useEffect(() => {
    if (testText.length > 10) {
      const analysis = azureSpeechService.analyzeTextQuality(testText)
      setTextAnalysis(analysis as TextAnalysis)
    }
  }, [testText])

  // Otimizar configurações baseadas no tipo de conteúdo
  useEffect(() => {
    const optimization = azureSpeechService.optimizeForContentType(contentType)
    
    if (selectedProvider === 'azure' && optimization.recommendedVoices.length > 0) {
      const recommendedVoice = optimization.recommendedVoices[0]
      if (!selectedVoice) {
        setSelectedVoice(recommendedVoice)
        updateVoiceConfig({ 
          voiceId: recommendedVoice,
          style: optimization.recommendedStyle,
          speed: optimization.recommendedSpeed
        })
      }
    }
  }, [contentType, selectedProvider, selectedVoice])

  // Atualizar configuração e notificar parent
  const updateVoiceConfig = useCallback((updates: Partial<VoiceConfiguration>) => {
    const newConfig = { ...voiceConfig, ...updates }
    setVoiceConfig(newConfig)
    onVoiceConfigChange(newConfig)
  }, [voiceConfig, onVoiceConfigChange])

  // Trocar provider
  const handleProviderChange = (provider: 'azure' | 'elevenlabs' | 'regional') => {
    setSelectedProvider(provider)
    setSelectedVoice('')
    setTestResult(null)
    
    updateVoiceConfig({
      provider,
      voiceId: '',
      displayName: ''
    })
  }

  // Selecionar voz
  const handleVoiceSelect = (voiceId: string) => {
    setSelectedVoice(voiceId)
    
    let displayName = ''
    let availableStyles: string[] = []
    
    if (selectedProvider === 'azure') {
      const voice = azureVoices.find(v => v.name === voiceId)
      displayName = voice?.displayName || voiceId
      availableStyles = voice?.styleList || ['neutral']
    } else if (selectedProvider === 'regional') {
      const voice = regionalVoices.find(v => v.id === voiceId)
      displayName = voice?.display_name || voiceId
    }
    
    updateVoiceConfig({
      voiceId,
      displayName,
      style: availableStyles[0] || 'neutral'
    })
  }

  // Testar voz selecionada
  const handleTestVoice = async () => {
    if (!selectedVoice) {
      toast.error('Selecione uma voz primeiro')
      return
    }

    if (!testText.trim()) {
      toast.error('Digite um texto para teste')
      return
    }

    setIsTestingVoice(true)
    setTestResult(null)

    try {
      const response = await fetch('/api/tts/enhanced-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: testText,
          voiceId: selectedVoice,
          speed: voiceConfig.speed,
          emotion: voiceConfig.emotion,
          regional_expressions: voiceConfig.regional_expressions,
          sync_with_avatar: false,
          quality: voiceConfig.quality,
          output_format: 'mp3'
        })
      })

      const data = await response.json()

      if (data.success) {
        setTestResult(data.data)
        toast.success(`Teste concluído! Duração: ${Math.round(data.data.duration)}s`)
      } else {
        throw new Error(data.error)
      }

    } catch (error) {
      console.error('Erro no teste de voz:', error)
      toast.error(`Erro no teste: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setIsTestingVoice(false)
    }
  }

  // Reproduzir áudio de teste
  const handlePlayTestAudio = async () => {
    if (!testResult?.audioUrl) return

    try {
      if (playingAudio) {
        playingAudio.pause()
        playingAudio.src = ''
      }

      const audio = new Audio(testResult.audioUrl)
      setPlayingAudio(audio)
      setIsPlaying(true)

      audio.onended = () => {
        setIsPlaying(false)
      }

      audio.onerror = () => {
        toast.error('Erro ao reproduzir áudio')
        setIsPlaying(false)
      }

      await audio.play()

    } catch (error) {
      console.error('Erro na reprodução:', error)
      toast.error('Erro ao reproduzir áudio de teste')
      setIsPlaying(false)
    }
  }

  // Parar áudio
  const handleStopAudio = () => {
    if (playingAudio) {
      playingAudio.pause()
      playingAudio.currentTime = 0
    }
    setIsPlaying(false)
  }

  // Obter vozes do provider atual
  const getCurrentVoices = () => {
    switch (selectedProvider) {
      case 'azure':
        return azureVoices.map(v => ({ id: v.name, name: v.displayName, extra: v.voiceType }))
      case 'regional':
        return regionalVoices.map(v => ({ id: v.id, name: v.display_name, extra: v.region.name }))
      default:
        return []
    }
  }

  // Obter estilos disponíveis para voz selecionada
  const getAvailableStyles = () => {
    if (selectedProvider === 'azure') {
      const voice = azureVoices.find(v => v.name === selectedVoice)
      return voice?.styleList || ['neutral']
    }
    return ['neutral', 'cheerful', 'serious', 'calm']
  }

  const currentVoices = getCurrentVoices()
  const availableStyles = getAvailableStyles()

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-3">
            <Crown className="h-7 w-7 text-yellow-600" />
            Estúdio de Voz Profissional
          </h3>
          <p className="text-muted-foreground mt-1">
            Configure vozes brasileiras de qualidade profissional para narração de slides
          </p>
        </div>
        
        {testResult && (
          <Badge variant="outline" className="flex items-center gap-1">
            <CheckCircle className="w-4 h-4 text-green-500" />
            Voz Testada - {Math.round(testResult.duration)}s
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Configurações de Voz */}
        <div className="space-y-4">
          
          {/* Seleção de Provider */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Provedor de TTS</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={selectedProvider === 'azure' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleProviderChange('azure')}
                  className="flex flex-col items-center gap-1 h-auto py-2"
                >
                  <Crown className="h-4 w-4" />
                  <span className="text-xs">Azure</span>
                  <span className="text-xs font-normal">Neural</span>
                </Button>
                <Button
                  variant={selectedProvider === 'elevenlabs' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleProviderChange('elevenlabs')}
                  className="flex flex-col items-center gap-1 h-auto py-2"
                >
                  <Zap className="h-4 w-4" />
                  <span className="text-xs">ElevenLabs</span>
                  <span className="text-xs font-normal">IA</span>
                </Button>
                <Button
                  variant={selectedProvider === 'regional' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleProviderChange('regional')}
                  className="flex flex-col items-center gap-1 h-auto py-2"
                >
                  <Volume2 className="h-4 w-4" />
                  <span className="text-xs">Regional</span>
                  <span className="text-xs font-normal">BR</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Seleção de Voz */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Voz</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedVoice} onValueChange={handleVoiceSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma voz" />
                </SelectTrigger>
                <SelectContent>
                  {currentVoices.map(voice => (
                    <SelectItem key={voice.id} value={voice.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{voice.name}</span>
                        <Badge variant="outline" className="text-xs ml-2">
                          {voice.extra}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedProvider === 'azure' && selectedVoice && (
                <div>
                  <Label>Estilo de Fala</Label>
                  <Select 
                    value={voiceConfig.style} 
                    onValueChange={(style) => updateVoiceConfig({ style })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStyles.map((style: string) => (
                        <SelectItem key={style} value={style}>
                          {style === 'neutral' ? '😐 Neutro' :
                           style === 'cheerful' ? '😊 Animado' :
                           style === 'serious' ? '🧐 Sério' :
                           style === 'calm' ? '😌 Calmo' :
                           style === 'sad' ? '😔 Triste' :
                           style === 'angry' ? '😠 Irritado' :
                           style === 'fearful' ? '😨 Receoso' : style}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Configurações Avançadas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configurações Avançadas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Velocidade */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Velocidade da Fala</Label>
                  <span className="text-sm text-muted-foreground">{voiceConfig.speed}x</span>
                </div>
                <Slider
                  value={[voiceConfig.speed]}
                  onValueChange={([value]) => updateVoiceConfig({ speed: value })}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0.5x (Muito Lento)</span>
                  <span>1.0x (Normal)</span>
                  <span>2.0x (Muito Rápido)</span>
                </div>
              </div>

              {/* Tom de Voz */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Tom de Voz</Label>
                  <span className="text-sm text-muted-foreground">{voiceConfig.pitch}x</span>
                </div>
                <Slider
                  value={[voiceConfig.pitch]}
                  onValueChange={([value]) => updateVoiceConfig({ pitch: value })}
                  min={0.8}
                  max={1.2}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0.8x (Grave)</span>
                  <span>1.0x (Normal)</span>
                  <span>1.2x (Agudo)</span>
                </div>
              </div>

              {/* Qualidade */}
              <div className="space-y-3">
                <Label>Qualidade de Áudio</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={voiceConfig.quality === 'standard' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateVoiceConfig({ quality: 'standard' })}
                  >
                    Padrão
                  </Button>
                  <Button
                    variant={voiceConfig.quality === 'premium' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateVoiceConfig({ quality: 'premium' })}
                  >
                    Premium
                  </Button>
                  <Button
                    variant={voiceConfig.quality === 'studio' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateVoiceConfig({ quality: 'studio' })}
                  >
                    Estúdio
                  </Button>
                </div>
              </div>

              {/* Expressões Regionais */}
              <div className="flex items-center justify-between">
                <div>
                  <Label>Expressões Regionais</Label>
                  <p className="text-xs text-muted-foreground">
                    Usar gírias e expressões típicas brasileiras
                  </p>
                </div>
                <Switch
                  checked={voiceConfig.regional_expressions}
                  onCheckedChange={(checked) => updateVoiceConfig({ regional_expressions: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Área de Teste e Resultados */}
        <div className="space-y-4">
          
          {/* Área de Teste */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Headphones className="h-4 w-4" />
                Teste de Voz
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Texto de Teste */}
              <div>
                <Label>Texto de Teste</Label>
                <Textarea
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  placeholder="Digite o texto para testar a voz..."
                  rows={4}
                  maxLength={1000}
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-muted-foreground">
                    {testText.length}/1000 caracteres
                  </span>
                  {textAnalysis && (
                    <Badge variant="outline" className="text-xs">
                      Complexidade: {textAnalysis.complexity}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Botões de Teste */}
              <div className="flex gap-2">
                <Button
                  onClick={handleTestVoice}
                  disabled={isTestingVoice || !selectedVoice || !testText.trim()}
                  className="flex-1"
                >
                  {isTestingVoice ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 mr-2" />
                      Testar Voz
                    </>
                  )}
                </Button>
                
                {testResult && (
                  <Button
                    variant="outline"
                    onClick={isPlaying ? handleStopAudio : handlePlayTestAudio}
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Resultado do Teste */}
          {testResult && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Resultado do Teste
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Métricas de Qualidade */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {Math.round(testResult.duration)}s
                    </div>
                    <div className="text-xs text-muted-foreground">Duração</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">
                      R$ {testResult.cost.toFixed(3)}
                    </div>
                    <div className="text-xs text-muted-foreground">Custo</div>
                  </div>
                </div>

                <Separator />

                {/* Pontuações de Qualidade */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Pronúncia</span>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={testResult.quality.pronunciation_score * 100} 
                        className="w-20 h-2"
                      />
                      <span className="text-xs w-8">
                        {(testResult.quality.pronunciation_score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Clareza</span>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={testResult.quality.clarity_score * 100} 
                        className="w-20 h-2"
                      />
                      <span className="text-xs w-8">
                        {(testResult.quality.clarity_score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Naturalidade</span>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={testResult.quality.naturalness_score * 100} 
                        className="w-20 h-2"
                      />
                      <span className="text-xs w-8">
                        {(testResult.quality.naturalness_score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  Tempo de processamento: {testResult.processingTime}ms
                </div>
              </CardContent>
            </Card>
          )}

          {/* Análise do Texto */}
          {textAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Análise do Texto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Complexidade:</span>
                    <Badge variant="outline" className="ml-2 text-xs">
                      {textAnalysis.complexity}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Legibilidade:</span>
                    <span className="ml-2 font-medium">{textAnalysis.readability}%</span>
                  </div>
                </div>
                
                {textAnalysis.technicalTerms.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">Termos Técnicos Detectados:</p>
                    <div className="flex flex-wrap gap-1">
                      {textAnalysis.technicalTerms.slice(0, 5).map((term: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {term}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {textAnalysis.recommendedAdjustments.length > 0 && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Recomendações:</strong>
                      <ul className="mt-1 text-xs list-disc list-inside">
                        {textAnalysis.recommendedAdjustments.map((rec: string, index: number) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Configuração Atual */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuração Atual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Provider:</span>
              <div className="font-medium capitalize">{selectedProvider}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Voz:</span>
              <div className="font-medium">{voiceConfig.displayName || 'Não selecionada'}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Velocidade:</span>
              <div className="font-medium">{voiceConfig.speed}x</div>
            </div>
            <div>
              <span className="text-muted-foreground">Qualidade:</span>
              <div className="font-medium capitalize">{voiceConfig.quality}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

