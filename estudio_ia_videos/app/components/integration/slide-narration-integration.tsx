

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Alert, AlertDescription } from '../ui/alert'
import { Progress } from '../ui/progress'
import { Separator } from '../ui/separator'
import { 
  Play, 
  Pause,
  Square,
  Volume2,
  Users,
  Clock,
  Zap,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Settings,
  Eye,
  Download
} from 'lucide-react'
import SlideNarrationStudio from '../narration/slide-narration-studio'
import TimelinePlayer from '../synchronization/timeline-player'
import ProfessionalVoiceStudio, { type VoiceConfiguration } from '../tts/professional-voice-studio'
import { SlideNarrationResult } from '../../lib/tts/slide-narration-service'
import { SyncTimeline, AvatarSyncAction, NarrationSyncSegment } from '../../lib/synchronization/slide-avatar-sync'
import { toast } from 'react-hot-toast'
import { logger } from '@/lib/logger'

interface Slide {
  id?: string
  slideNumber?: number
  title: string
  duration: number
  original_duration?: number
  adjusted_by_narration?: boolean
  content?: unknown[]
  [key: string]: unknown
}

interface ExportData {
  projectId: string
  slides: Slide[]
  narrationResults: SlideNarrationResult[]
  syncTimeline: SyncTimeline[]
  voiceConfig: VoiceConfiguration | null
  exportedAt: string
  version: string
}

interface SlideNarrationIntegrationProps {
  slides: Slide[]
  onSlidesUpdate?: (slides: Slide[]) => void
  onExport?: (data: ExportData) => void
  projectId?: string
  className?: string
}

interface IntegrationState {
  step: 'config' | 'narration' | 'sync' | 'preview' | 'complete'
  voiceConfig: VoiceConfiguration | null
  narrationResults: SlideNarrationResult[]
  syncTimeline: SyncTimeline[]
  isProcessing: boolean
  processingStep: string
  error: string | null
}

export default function SlideNarrationIntegration({
  slides,
  onSlidesUpdate,
  onExport,
  projectId = `integration_${Date.now()}`,
  className = ''
}: SlideNarrationIntegrationProps) {
  
  const [state, setState] = useState<IntegrationState>({
    step: 'config',
    voiceConfig: null,
    narrationResults: [],
    syncTimeline: [],
    isProcessing: false,
    processingStep: '',
    error: null
  })

  const [adjustedSlides, setAdjustedSlides] = useState(slides)

  // Atualizar slides quando props mudam
  useEffect(() => {
    setAdjustedSlides(slides)
  }, [slides])

  // Processar sincronização completa
  const handleProcessComplete = async () => {
    if (!state.voiceConfig) {
      toast.error('Configure a voz primeiro')
      return
    }

    setState(prev => ({ 
      ...prev, 
      isProcessing: true, 
      processingStep: 'Iniciando processamento...',
      error: null
    }))

    try {
      // Etapa 1: Configurar sincronização
      setState(prev => ({ 
        ...prev, 
        processingStep: 'Configurando sincronização...'
      }))

      const response = await fetch('/api/slides/narration-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slides: adjustedSlides,
          voiceConfig: state.voiceConfig,
          avatarConfig: {
            enabled: true,
            gesturesEnabled: true,
            expressionsEnabled: true,
            lipSyncEnabled: true,
            gestureIntensity: 0.7
          },
          syncSettings: {
            autoTransition: true,
            waitForNarrationComplete: true,
            autoAdjustTiming: true,
            lipSyncPrecision: 'high',
            transitionDelay: 1000
          },
          projectId
        })
      })

      setState(prev => ({ 
        ...prev, 
        processingStep: 'Processando resposta...'
      }))

      const data = await response.json()

      if (data.success) {
        const result = data.data
        
        // Atualizar estado com resultados
        setState(prev => ({
          ...prev,
          narrationResults: result.narrationResults,
          syncTimeline: result.timeline,
          step: 'preview',
          isProcessing: false,
          processingStep: ''
        }))

        // Atualizar slides com timing ajustado
        if (result.slides) {
          setAdjustedSlides(result.slides)
          if (onSlidesUpdate) {
            onSlidesUpdate(result.slides)
          }
        }

        toast.success(`🎉 Processamento completo! ${result.summary.successfulSlides} slides sincronizados`)
        
        logger.info('Resultado da sincronização', { component: 'SlideNarrationIntegration', summary: result.summary })

      } else {
        throw new Error(data.error || 'Erro no processamento')
      }

    } catch (error) {
      logger.error('Erro na integração', error instanceof Error ? error : new Error(String(error)), { component: 'SlideNarrationIntegration' })
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      
      setState(prev => ({
        ...prev,
        isProcessing: false,
        processingStep: '',
        error: errorMessage
      }))
      
      toast.error(`Erro no processamento: ${errorMessage}`)
    }
  }

  // Exportar projeto completo
  const handleExportProject = () => {
    if (state.syncTimeline.length === 0) {
      toast.error('Complete o processamento antes de exportar')
      return
    }

    const exportData = {
      projectId,
      slides: adjustedSlides,
      narrationResults: state.narrationResults,
      syncTimeline: state.syncTimeline,
      voiceConfig: state.voiceConfig,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    }

    if (onExport) {
      onExport(exportData)
    }

    // Também criar download do arquivo
    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `projeto_${projectId}_completo.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success('Projeto exportado com sucesso!')
  }

  // Reset para recomeçar
  const handleReset = () => {
    setState({
      step: 'config',
      voiceConfig: null,
      narrationResults: [],
      syncTimeline: [],
      isProcessing: false,
      processingStep: '',
      error: null
    })
    setAdjustedSlides(slides)
  }

  // Callbacks do timeline player
  const handleSlideChange = (slideIndex: number, slide: SyncTimeline) => {
    logger.debug('Player: mudança de slide', { component: 'SlideNarrationIntegration', slideIndex: slideIndex + 1 })
  }

  const handleAvatarAction = (action: AvatarSyncAction) => {
    logger.debug('Player: ação de avatar', { component: 'SlideNarrationIntegration', actionType: action.type })
  }

  const handleNarrationSegment = (segment: NarrationSyncSegment) => {
    logger.debug('Player: narração', { component: 'SlideNarrationIntegration', textPreview: segment.text.substring(0, 50) })
  }

  return (
    <div className={`space-y-8 ${className}`}>
      
      {/* Header com Steps */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">
          Sistema Integrado de Narração e Sincronização
        </h2>
        
        {/* Indicador de Progresso */}
        <div className="flex items-center justify-center space-x-4 mb-6">
          <div className={`flex items-center gap-2 ${
            state.step === 'config' ? 'text-blue-600' : 
            ['narration', 'sync', 'preview', 'complete'].includes(state.step) ? 'text-green-600' : 'text-gray-400'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              state.step === 'config' ? 'bg-blue-100 text-blue-600' :
              ['narration', 'sync', 'preview', 'complete'].includes(state.step) ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
            }`}>
              1
            </div>
            <span className="text-sm font-medium">Configurar Voz</span>
          </div>
          
          <div className={`w-8 h-0.5 ${
            ['narration', 'sync', 'preview', 'complete'].includes(state.step) ? 'bg-green-400' : 'bg-gray-200'
          }`} />
          
          <div className={`flex items-center gap-2 ${
            state.step === 'narration' ? 'text-blue-600' : 
            ['sync', 'preview', 'complete'].includes(state.step) ? 'text-green-600' : 'text-gray-400'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              state.step === 'narration' ? 'bg-blue-100 text-blue-600' :
              ['sync', 'preview', 'complete'].includes(state.step) ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
            }`}>
              2
            </div>
            <span className="text-sm font-medium">Gerar Narração</span>
          </div>
          
          <div className={`w-8 h-0.5 ${
            ['sync', 'preview', 'complete'].includes(state.step) ? 'bg-green-400' : 'bg-gray-200'
          }`} />
          
          <div className={`flex items-center gap-2 ${
            state.step === 'sync' ? 'text-blue-600' : 
            ['preview', 'complete'].includes(state.step) ? 'text-green-600' : 'text-gray-400'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              state.step === 'sync' ? 'bg-blue-100 text-blue-600' :
              ['preview', 'complete'].includes(state.step) ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
            }`}>
              3
            </div>
            <span className="text-sm font-medium">Sincronizar</span>
          </div>
          
          <div className={`w-8 h-0.5 ${
            ['preview', 'complete'].includes(state.step) ? 'bg-green-400' : 'bg-gray-200'
          }`} />
          
          <div className={`flex items-center gap-2 ${
            ['preview', 'complete'].includes(state.step) ? 'text-green-600' : 'text-gray-400'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              ['preview', 'complete'].includes(state.step) ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
            }`}>
              4
            </div>
            <span className="text-sm font-medium">Preview & Export</span>
          </div>
        </div>
      </div>

      {/* Erro Global */}
      {state.error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Erro:</strong> {state.error}
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-4"
              onClick={handleReset}
            >
              Tentar Novamente
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Indicador de Processamento */}
      {state.isProcessing && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-4">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <div>
                <p className="font-medium">Processando Sincronização...</p>
                <p className="text-sm text-muted-foreground">{state.processingStep}</p>
              </div>
            </div>
            <Progress value={85} className="w-full mt-4" />
          </CardContent>
        </Card>
      )}

      {/* Conteúdo baseado no step atual */}
      {state.step === 'config' && (
        <div className="space-y-6">
          <ProfessionalVoiceStudio
            onVoiceConfigChange={(config) => {
              setState(prev => ({ ...prev, voiceConfig: config }))
            }}
            contentType="treinamento"
          />
          
          <div className="text-center">
            <Button
              onClick={() => setState(prev => ({ ...prev, step: 'narration' }))}
              disabled={!state.voiceConfig}
              size="lg"
            >
              <Settings className="w-5 h-5 mr-2" />
              Continuar para Narração
            </Button>
          </div>
        </div>
      )}

      {state.step === 'narration' && (
        <div className="space-y-6">
          <SlideNarrationStudio
            slides={adjustedSlides}
            onNarrationComplete={(results) => {
              setState(prev => ({ 
                ...prev, 
                narrationResults: results, 
                step: 'sync' 
              }))
            }}
            syncWithAvatars={true}
            projectId={projectId}
          />
          
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setState(prev => ({ ...prev, step: 'config' }))}
            >
              Voltar
            </Button>
            
            <Button
              onClick={handleProcessComplete}
              disabled={state.narrationResults.length === 0}
            >
              <Zap className="w-4 h-4 mr-2" />
              Processar Sincronização Completa
            </Button>
          </div>
        </div>
      )}

      {['sync', 'preview', 'complete'].includes(state.step) && (
        <div className="space-y-6">
          
          {/* Resumo da Sincronização */}
          {state.syncTimeline.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Sincronização Completa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {state.syncTimeline.length}
                    </div>
                    <div className="text-xs text-muted-foreground">Slides Sincronizados</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round(state.syncTimeline.reduce((sum, slide) => sum + slide.duration, 0))}s
                    </div>
                    <div className="text-xs text-muted-foreground">Duração Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {state.syncTimeline.reduce((sum, slide) => sum + slide.narrationSegments.length, 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">Segmentos de Áudio</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-600">
                      {state.syncTimeline.reduce((sum, slide) => sum + slide.avatarActions.length, 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">Ações de Avatar</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Player de Timeline */}
          {state.syncTimeline.length > 0 && (
            <TimelinePlayer
              timeline={state.syncTimeline}
              onSlideChange={handleSlideChange}
              onAvatarAction={handleAvatarAction}
              onNarrationSegment={handleNarrationSegment}
            />
          )}

          {/* Slides Ajustados */}
          {adjustedSlides.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Timing Ajustado dos Slides
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {adjustedSlides.map((slide: Slide, index: number) => (
                    <div key={slide.id || index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">Slide {slide.slideNumber || index + 1}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {slide.title}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {slide.adjusted_by_narration && (
                          <Badge variant="outline" className="text-xs">
                            <Zap className="w-3 h-3 mr-1" />
                            Auto-ajustado
                          </Badge>
                        )}
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {slide.duration}s
                          </div>
                          {slide.original_duration && slide.original_duration !== slide.duration && (
                            <div className="text-xs text-muted-foreground">
                              (era {slide.original_duration}s)
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ações Finais */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleReset}
            >
              Recomeçar
            </Button>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setState(prev => ({ ...prev, step: 'narration' }))}
              >
                Voltar
              </Button>
              
              <Button
                onClick={handleExportProject}
                disabled={state.syncTimeline.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar Projeto
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Slides (Sempre Visível) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Slides do Projeto ({adjustedSlides.length})
            </div>
            
            {state.narrationResults.length > 0 && (
              <Badge variant="default">
                <Volume2 className="w-4 h-4 mr-1" />
                Com Narração
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {adjustedSlides.map((slide: Slide, index: number) => {
              const hasNarration = state.narrationResults[index]?.segments.length > 0
              const narrationDuration = state.narrationResults[index]?.totalDuration
              
              return (
                <div key={slide.id || index} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm mb-1">
                        Slide {slide.slideNumber || index + 1}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {slide.title}
                      </p>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="outline" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        {slide.duration}s
                      </Badge>
                      
                      {hasNarration && (
                        <Badge variant="default" className="text-xs">
                          <Volume2 className="w-3 h-3 mr-1" />
                          {Math.round(narrationDuration || 0)}s
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Content Preview */}
                  {slide.content && slide.content.length > 0 && (
                    <div className="text-xs text-muted-foreground mt-2">
                      {Array.isArray(slide.content) ? slide.content.length : 1} item(s) de conteúdo
                    </div>
                  )}
                  
                  {/* Quality Indicator */}
                  {hasNarration && state.narrationResults[index] && (
                    <div className="mt-2 pt-2 border-t">
                      <div className="flex items-center justify-between text-xs">
                        <span>Qualidade:</span>
                        <span className="font-medium">
                          {(state.narrationResults[index].quality.pronunciation_score * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

