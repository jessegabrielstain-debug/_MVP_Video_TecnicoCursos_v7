

'use client'

import { useState, useEffect, useCallback } from 'react'
import { logger } from '@/lib/logger'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { Alert, AlertDescription } from '../ui/alert'
import { Separator } from '../ui/separator'
import { Slider } from '../ui/slider'
import { Switch } from '../ui/switch'
import { Label } from '../ui/label'
import { 
  Play, 
  Pause, 
  Square,
  Volume2, 
  Mic,
  Clock,
  User,
  Settings,
  Zap,
  CheckCircle,
  XCircle,
  Loader2,
  BarChart3,
  DollarSign,
  FileAudio,
  Users
} from 'lucide-react'
import BrazilianVoiceSelector from '../tts/brazilian-voice-selector'
import { BrazilianVoiceRegional } from '../../lib/tts/brazilian-regional-tts'
import { SlideNarrationResult, BatchNarrationProgress } from '../../lib/tts/slide-narration-service'
import { toast } from 'react-hot-toast'

interface SlideNarrationStudioProps {
  slides: any[]
  onNarrationComplete: (results: SlideNarrationResult[]) => void
  syncWithAvatars?: boolean
  projectId?: string
}

interface VoiceSettings {
  speed: number
  emotion: 'neutro' | 'animado' | 'serio' | 'preocupado'
  regional_expressions: boolean
  emphasis_level: number
}

export default function SlideNarrationStudio({
  slides,
  onNarrationComplete,
  syncWithAvatars = true,
  projectId = `project_${Date.now()}`
}: SlideNarrationStudioProps) {
  
  // Estados principais
  const [selectedVoice, setSelectedVoice] = useState<BrazilianVoiceRegional | null>(null)
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    speed: 1.0,
    emotion: 'neutro',
    regional_expressions: true,
    emphasis_level: 5
  })
  
  // Estados de processamento
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState<BatchNarrationProgress | null>(null)
  const [results, setResults] = useState<SlideNarrationResult[]>([])
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null)
  const [playingSlide, setPlayingSlide] = useState<number | null>(null)
  
  // Estados de configuração
  const [autoAdjustTiming, setAutoAdjustTiming] = useState(true)
  const [enableRegionalExpressions, setEnableRegionalExpressions] = useState(true)
  const [qualityLevel, setQualityLevel] = useState<'standard' | 'premium' | 'studio'>('premium')

  // Cleanup do áudio ao desmontar
  useEffect(() => {
    return () => {
      if (previewAudio) {
        previewAudio.pause()
        previewAudio.src = ''
      }
    }
  }, [previewAudio])

  // Iniciar geração de narração
  const handleGenerateNarration = useCallback(async () => {
    if (!selectedVoice) {
      toast.error('Selecione uma voz antes de gerar a narração')
      return
    }

    if (slides.length === 0) {
      toast.error('Nenhum slide disponível para narração')
      return
    }

    setIsProcessing(true)
    setProgress(null)
    setResults([])

    try {
      const response = await fetch('/api/narration/auto-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slides,
          voiceConfig: {
            voiceId: selectedVoice.id,
            speed: voiceSettings.speed,
            pitch: 1.0,
            emotion: voiceSettings.emotion,
            regional_expressions: voiceSettings.regional_expressions
          },
          projectId,
          syncWithAvatar: syncWithAvatars,
          qualityLevel,
          autoAdjustTiming
        })
      })

      const data = await response.json()

      if (data.success) {
        setResults(data.data.results)
        onNarrationComplete(data.data.results)
        
        toast.success(
          `🎉 Narração gerada com sucesso! ${data.data.summary.successfulSlides}/${data.data.summary.totalSlides} slides`
        )
        
        logger.info('Resumo da narração', { component: 'SlideNarrationStudio', summary: data.data.summary })
        
      } else {
        throw new Error(data.error)
      }

    } catch (error) {
      logger.error('Erro na geração de narração', error instanceof Error ? error : new Error(String(error)), { component: 'SlideNarrationStudio', projectId })
      toast.error(`Erro: ${error instanceof Error ? error.message : 'Falha na geração'}`)
    } finally {
      setIsProcessing(false)
    }
  }, [selectedVoice, voiceSettings, slides, syncWithAvatars, projectId, qualityLevel, autoAdjustTiming, onNarrationComplete])

  // Preview de áudio de um slide
  const handlePreviewSlide = useCallback(async (slideIndex: number) => {
    const result = results[slideIndex]
    if (!result || !result.audioUrl) {
      toast.error('Áudio não disponível para este slide')
      return
    }

    try {
      // Parar áudio atual se estiver tocando
      if (previewAudio) {
        previewAudio.pause()
        previewAudio.src = ''
      }

      // Criar novo áudio
      const audio = new Audio(result.audioUrl)
      setPreviewAudio(audio)
      setPlayingSlide(slideIndex)

      audio.onended = () => {
        setPlayingSlide(null)
      }

      audio.onerror = () => {
        toast.error('Erro ao reproduzir áudio')
        setPlayingSlide(null)
      }

      await audio.play()

    } catch (error) {
      logger.error('Erro no preview', error instanceof Error ? error : new Error(String(error)), { component: 'SlideNarrationStudio', slideIndex })
      toast.error('Erro ao reproduzir preview')
      setPlayingSlide(null)
    }
  }, [results, previewAudio])

  // Parar preview de áudio
  const handleStopPreview = () => {
    if (previewAudio) {
      previewAudio.pause()
      previewAudio.currentTime = 0
    }
    setPlayingSlide(null)
  }

  // Calcular estatísticas totais
  const totalStats = results.length > 0 ? {
    totalDuration: results.reduce((sum, r) => sum + r.totalDuration, 0),
    totalCost: results.reduce((sum, r) => sum + r.cost, 0),
    avgQuality: results.reduce((sum, r) => sum + r.quality.pronunciation_score, 0) / results.length,
    completedSlides: results.filter(r => r.segments.length > 0).length
  } : null

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-3">
            <Mic className="h-7 w-7 text-blue-600" />
            Estúdio de Narração Automática
          </h3>
          <p className="text-muted-foreground mt-1">
            Gere narração profissional para {slides.length} slides com vozes brasileiras autênticas
          </p>
        </div>
        
        {results.length > 0 && (
          <Badge variant="outline" className="text-sm">
            <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
            {results.filter(r => r.segments.length > 0).length} slides processados
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Configurações de Voz */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Seleção de Voz Brasileira
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BrazilianVoiceSelector
                onVoiceSelect={(voice, settings) => {
                  setSelectedVoice(voice)
                  setVoiceSettings(settings)
                }}
                selectedVoice={selectedVoice || undefined}
                contentType="treinamento"
                targetAudience="funcionarios"
              />
            </CardContent>
          </Card>

          {/* Configurações Avançadas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações de Narração
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Velocidade de Fala */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Velocidade da Fala</Label>
                  <span className="text-sm text-muted-foreground">{voiceSettings.speed}x</span>
                </div>
                <Slider
                  value={[voiceSettings.speed]}
                  onValueChange={([value]) => setVoiceSettings(prev => ({ ...prev, speed: value }))}
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

              {/* Qualidade de Áudio */}
              <div className="space-y-3">
                <Label>Qualidade de Áudio</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={qualityLevel === 'standard' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setQualityLevel('standard')}
                  >
                    Padrão
                  </Button>
                  <Button
                    variant={qualityLevel === 'premium' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setQualityLevel('premium')}
                  >
                    Premium
                  </Button>
                  <Button
                    variant={qualityLevel === 'studio' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setQualityLevel('studio')}
                  >
                    Estúdio
                  </Button>
                </div>
              </div>

              {/* Ajustes Automáticos */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Ajuste Automático de Timing</Label>
                    <p className="text-xs text-muted-foreground">
                      Ajustar duração do slide baseado na narração
                    </p>
                  </div>
                  <Switch
                    checked={autoAdjustTiming}
                    onCheckedChange={setAutoAdjustTiming}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Sincronização com Avatares 3D</Label>
                    <p className="text-xs text-muted-foreground">
                      Gerar dados de sincronização labial
                    </p>
                  </div>
                  <Switch
                    checked={syncWithAvatars}
                    onCheckedChange={() => {}} // Controlado pelo props
                    disabled
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botão de Geração */}
          <Card>
            <CardContent className="pt-6">
              <Button
                onClick={handleGenerateNarration}
                disabled={isProcessing || !selectedVoice}
                className="w-full h-12"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Gerando Narração...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5 mr-2" />
                    Gerar Narração Automática
                  </>
                )}
              </Button>
              
              {selectedVoice && (
                <div className="mt-3 text-center">
                  <p className="text-sm text-muted-foreground">
                    Voz selecionada: <span className="font-medium">{selectedVoice.display_name}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Custo estimado: R$ {((slides.length * 0.30) * (qualityLevel === 'studio' ? 1.5 : qualityLevel === 'premium' ? 1.2 : 1.0)).toFixed(2)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Painel de Status e Resultados */}
        <div className="space-y-4">
          
          {/* Progresso */}
          {isProcessing && progress && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processando...
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Slide {progress.currentSlide.number}</span>
                    <span>{progress.completedSlides}/{progress.totalSlides}</span>
                  </div>
                  <Progress 
                    value={(progress.completedSlides / progress.totalSlides) * 100} 
                    className="w-full"
                  />
                </div>
                
                <div className="text-sm">
                  <p className="font-medium truncate">{progress.currentSlide.title}</p>
                  <p className="text-muted-foreground">
                    {Math.round(progress.estimatedTimeRemaining)}s restantes
                  </p>
                </div>

                {progress.errors.length > 0 && (
                  <Alert>
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      {progress.errors.length} erro(s) encontrado(s)
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Estatísticas */}
          {totalStats && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Estatísticas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {Math.round(totalStats.totalDuration)}s
                    </div>
                    <div className="text-xs text-muted-foreground">Duração Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">
                      {(totalStats.avgQuality * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Qualidade Média</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">
                      R$ {totalStats.totalCost.toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">Custo Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-slate-600">
                      {totalStats.completedSlides}/{slides.length}
                    </div>
                    <div className="text-xs text-muted-foreground">Concluídos</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista de Resultados */}
          {results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileAudio className="h-4 w-4" />
                  Áudios Gerados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {results.map((result, index) => (
                    <div
                      key={result.slideId}
                      className="flex items-center justify-between p-2 rounded border hover:bg-muted/50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          Slide {result.slideNumber}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {Math.round(result.totalDuration)}s
                          </span>
                          {result.quality.pronunciation_score > 0.9 && (
                            <Badge variant="outline" className="text-xs">
                              <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                              Alta Qualidade
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePreviewSlide(index)}
                          disabled={!result.audioUrl}
                        >
                          {playingSlide === index ? (
                            <Pause className="h-3 w-3" />
                          ) : (
                            <Play className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {playingSlide !== null && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStopPreview}
                    className="w-full"
                  >
                    <Square className="h-3 w-3 mr-1" />
                    Parar Preview
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Informações sobre Sincronização */}
          {syncWithAvatars && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Sincronização 3D
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Dados de Lip-Sync</span>
                    <Badge variant={syncWithAvatars ? 'default' : 'secondary'}>
                      {syncWithAvatars ? 'Ativado' : 'Desativado'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Expressões Faciais</span>
                    <Badge variant="default">Automático</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Gestos Corporais</span>
                    <Badge variant="default">Integrado</Badge>
                  </div>
                </div>
                
                <Separator className="my-3" />
                
                <p className="text-xs text-muted-foreground">
                  A narração será sincronizada automaticamente com avatares 3D, 
                  incluindo movimentos labiais e expressões faciais.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Resumo de Qualidade */}
      {results.length > 0 && totalStats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resumo da Qualidade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.floor(totalStats.totalDuration / 60)}:{(totalStats.totalDuration % 60).toFixed(0).padStart(2, '0')}
                </div>
                <div className="text-xs text-muted-foreground">Duração Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {(totalStats.avgQuality * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-muted-foreground">Qualidade Média</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  R$ {totalStats.totalCost.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">Custo Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-600">
                  {totalStats.completedSlides}/{slides.length}
                </div>
                <div className="text-xs text-muted-foreground">Taxa de Sucesso</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

