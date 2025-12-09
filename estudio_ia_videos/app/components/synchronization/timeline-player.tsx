

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { logger } from '@/lib/logger'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { Slider } from '../ui/slider'
import { Alert, AlertDescription } from '../ui/alert'
import { 
  Play, 
  Pause, 
  Square,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  Settings,
  User,
  Clock,
  Zap,
  Eye,
  Headphones,
  Users
} from 'lucide-react'
import { 
  SyncTimeline, 
  AvatarSyncAction, 
  NarrationSyncSegment,
  slideAvatarSyncController 
} from '../../lib/synchronization/slide-avatar-sync'

interface TimelinePlayerProps {
  timeline: SyncTimeline[]
  onSlideChange?: (slideIndex: number, slide: SyncTimeline) => void
  onAvatarAction?: (action: AvatarSyncAction) => void
  onNarrationSegment?: (segment: NarrationSyncSegment) => void
  className?: string
}

interface PlayerState {
  isPlaying: boolean
  isPaused: boolean
  currentSlideIndex: number
  currentTime: number
  totalDuration: number
  volume: number
  isMuted: boolean
  playbackSpeed: number
}

export default function TimelinePlayer({
  timeline,
  onSlideChange,
  onAvatarAction,
  onNarrationSegment,
  className = ''
}: TimelinePlayerProps) {
  
  const [playerState, setPlayerState] = useState<PlayerState>({
    isPlaying: false,
    isPaused: false,
    currentSlideIndex: 0,
    currentTime: 0,
    totalDuration: 0,
    volume: 0.8,
    isMuted: false,
    playbackSpeed: 1.0
  })
  
  const [currentSlide, setCurrentSlide] = useState<SyncTimeline | null>(null)
  const [activeSegment, setActiveSegment] = useState<NarrationSyncSegment | null>(null)
  const [activeAvatarAction, setActiveAvatarAction] = useState<AvatarSyncAction | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)

  // Calcular duração total
  useEffect(() => {
    const totalDuration = timeline.reduce((sum, slide) => sum + slide.duration, 0)
    setPlayerState(prev => ({ ...prev, totalDuration }))
  }, [timeline])

  // Atualizar slide atual baseado no tempo
  useEffect(() => {
    if (timeline.length === 0) return
    
    let cumulativeTime = 0
    for (let i = 0; i < timeline.length; i++) {
      const slide = timeline[i]
      if (playerState.currentTime >= cumulativeTime && 
          playerState.currentTime < cumulativeTime + slide.duration) {
        
        if (playerState.currentSlideIndex !== i) {
          setPlayerState(prev => ({ ...prev, currentSlideIndex: i }))
          setCurrentSlide(slide)
          
          if (onSlideChange) {
            onSlideChange(i, slide)
          }
        }
        break
      }
      cumulativeTime += slide.duration
    }
  }, [playerState.currentTime, timeline, playerState.currentSlideIndex, onSlideChange])

  // Timer de atualização
  const updateTimer = useCallback(() => {
    if (playerState.isPlaying && !playerState.isPaused) {
      const elapsed = (Date.now() - startTimeRef.current) / 1000 * playerState.playbackSpeed
      setPlayerState(prev => ({ ...prev, currentTime: elapsed }))
      
      // Verificar se chegou ao fim
      if (elapsed >= playerState.totalDuration) {
        handleStop()
      }
    }
  }, [playerState.isPlaying, playerState.isPaused, playerState.totalDuration, playerState.playbackSpeed])

  // Iniciar/parar timer
  useEffect(() => {
    if (playerState.isPlaying && !playerState.isPaused) {
      intervalRef.current = setInterval(updateTimer, 100) // Atualizar a cada 100ms
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [playerState.isPlaying, playerState.isPaused, updateTimer])

  // Reproduzir/pausar
  const handlePlayPause = useCallback(async () => {
    if (playerState.isPlaying) {
      // Pausar
      setPlayerState(prev => ({ ...prev, isPaused: true }))
      slideAvatarSyncController.pause()
    } else {
      // Iniciar/retomar
      if (playerState.isPaused) {
        // Retomar
        setPlayerState(prev => ({ ...prev, isPaused: false }))
        slideAvatarSyncController.resume()
        startTimeRef.current = Date.now() - (playerState.currentTime * 1000 / playerState.playbackSpeed)
      } else {
        // Iniciar nova reprodução
        setPlayerState(prev => ({ 
          ...prev, 
          isPlaying: true, 
          isPaused: false, 
          currentTime: 0,
          currentSlideIndex: 0
        }))
        startTimeRef.current = Date.now()
        
        try {
          await slideAvatarSyncController.playTimeline(
            (slideIndex) => {
              // Callback de mudança de slide
              logger.debug('Mudando para slide', { component: 'TimelinePlayer', slideIndex: slideIndex + 1 })
            },
            (action) => {
              // Callback de ação de avatar
              setActiveAvatarAction(action)
              if (onAvatarAction) {
                onAvatarAction(action)
              }
            },
            (segment) => {
              // Callback de segmento de narração
              setActiveSegment(segment)
              if (onNarrationSegment) {
                onNarrationSegment(segment)
              }
            }
          )
        } catch (error) {
          logger.error('Erro na reprodução', error instanceof Error ? error : new Error(String(error)), { component: 'TimelinePlayer' })
          handleStop()
        }
      }
    }
  }, [playerState, onAvatarAction, onNarrationSegment])

  // Parar reprodução
  const handleStop = useCallback(() => {
    setPlayerState(prev => ({ 
      ...prev, 
      isPlaying: false, 
      isPaused: false, 
      currentTime: 0,
      currentSlideIndex: 0
    }))
    setCurrentSlide(null)
    setActiveSegment(null)
    setActiveAvatarAction(null)
    slideAvatarSyncController.stop()
    startTimeRef.current = 0
  }, [])

  // Pular para slide anterior
  const handlePreviousSlide = useCallback(() => {
    if (playerState.currentSlideIndex > 0) {
      const newIndex = playerState.currentSlideIndex - 1
      const newTime = timeline.slice(0, newIndex).reduce((sum, slide) => sum + slide.duration, 0)
      
      setPlayerState(prev => ({ 
        ...prev, 
        currentSlideIndex: newIndex,
        currentTime: newTime
      }))
      
      slideAvatarSyncController.seekToSlide(newIndex)
      startTimeRef.current = Date.now() - (newTime * 1000 / playerState.playbackSpeed)
    }
  }, [playerState.currentSlideIndex, timeline, playerState.playbackSpeed])

  // Pular para próximo slide
  const handleNextSlide = useCallback(() => {
    if (playerState.currentSlideIndex < timeline.length - 1) {
      const newIndex = playerState.currentSlideIndex + 1
      const newTime = timeline.slice(0, newIndex).reduce((sum, slide) => sum + slide.duration, 0)
      
      setPlayerState(prev => ({ 
        ...prev, 
        currentSlideIndex: newIndex,
        currentTime: newTime
      }))
      
      slideAvatarSyncController.seekToSlide(newIndex)
      startTimeRef.current = Date.now() - (newTime * 1000 / playerState.playbackSpeed)
    }
  }, [playerState.currentSlideIndex, timeline, playerState.playbackSpeed])

  // Pular para tempo específico
  const handleSeek = useCallback((newTime: number) => {
    setPlayerState(prev => ({ ...prev, currentTime: newTime }))
    startTimeRef.current = Date.now() - (newTime * 1000 / playerState.playbackSpeed)
  }, [playerState.playbackSpeed])

  // Alterar volume
  const handleVolumeChange = useCallback((volume: number) => {
    setPlayerState(prev => ({ ...prev, volume, isMuted: false }))
  }, [])

  // Mutar/desmutar
  const handleMuteToggle = useCallback(() => {
    setPlayerState(prev => ({ ...prev, isMuted: !prev.isMuted }))
  }, [])

  // Alterar velocidade de reprodução
  const handleSpeedChange = useCallback((speed: number) => {
    setPlayerState(prev => ({ ...prev, playbackSpeed: speed }))
    // Recalcular tempo baseado na nova velocidade
    if (playerState.isPlaying) {
      startTimeRef.current = Date.now() - (playerState.currentTime * 1000 / speed)
    }
  }, [playerState.isPlaying, playerState.currentTime])

  // Formatação de tempo
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className={`space-y-4 ${className}`}>
      
      {/* Player Principal */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              Player de Sincronização
            </CardTitle>
            
            {timeline.length > 0 && (
              <Badge variant="outline">
                {timeline.length} slides • {formatTime(playerState.totalDuration)}
              </Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          
          {/* Informações do Slide Atual */}
          {currentSlide && (
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">
                  Slide {currentSlide.slideNumber}: {timeline[playerState.currentSlideIndex]?.slideId}
                </h4>
                <div className="flex items-center gap-2">
                  {activeSegment && (
                    <Badge variant="secondary" className="animate-pulse">
                      <Headphones className="w-3 h-3 mr-1" />
                      Narrando
                    </Badge>
                  )}
                  {activeAvatarAction && (
                    <Badge variant="secondary" className="animate-pulse">
                      <Users className="w-3 h-3 mr-1" />
                      Avatar: {activeAvatarAction.type}
                    </Badge>
                  )}
                </div>
              </div>
              
              {activeSegment && (
                <p className="text-sm text-muted-foreground italic">
                  "{activeSegment.text}"
                </p>
              )}
            </div>
          )}

          {/* Barra de Progresso Principal */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{formatTime(playerState.currentTime)}</span>
              <span>{formatTime(playerState.totalDuration)}</span>
            </div>
            <Slider
              value={[playerState.currentTime]}
              onValueChange={([value]) => handleSeek(value)}
              max={playerState.totalDuration}
              step={0.1}
              className="w-full"
              disabled={timeline.length === 0}
            />
          </div>

          {/* Controles de Reprodução */}
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousSlide}
              disabled={playerState.currentSlideIndex === 0 || timeline.length === 0}
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            
            <Button
              onClick={handlePlayPause}
              disabled={timeline.length === 0}
              className="h-10 w-10"
            >
              {playerState.isPlaying && !playerState.isPaused ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleStop}
              disabled={!playerState.isPlaying && !playerState.isPaused}
            >
              <Square className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextSlide}
              disabled={playerState.currentSlideIndex >= timeline.length - 1 || timeline.length === 0}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          {/* Controles de Volume e Velocidade */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMuteToggle}
                >
                  {playerState.isMuted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
                <Slider
                  value={[playerState.isMuted ? 0 : playerState.volume]}
                  onValueChange={([value]) => handleVolumeChange(value)}
                  max={1}
                  step={0.1}
                  className="flex-1"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground w-12">
                  {playerState.playbackSpeed}x
                </span>
                <Slider
                  value={[playerState.playbackSpeed]}
                  onValueChange={([value]) => handleSpeedChange(value)}
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Visual */}
      {timeline.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Timeline Visual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              
              {/* Barra de Timeline */}
              <div className="relative bg-muted rounded-lg h-16 overflow-hidden">
                {timeline.map((slide, index) => {
                  const widthPercent = (slide.duration / playerState.totalDuration) * 100
                  const leftPercent = timeline.slice(0, index).reduce((sum, s) => sum + s.duration, 0) / playerState.totalDuration * 100
                  const isActive = index === playerState.currentSlideIndex
                  
                  return (
                    <div
                      key={slide.slideId}
                      className={`absolute top-0 h-full border-r border-background cursor-pointer transition-all ${
                        isActive ? 'bg-blue-600 text-white' : 'bg-muted-foreground/20 hover:bg-muted-foreground/30'
                      }`}
                      style={{
                        left: `${leftPercent}%`,
                        width: `${widthPercent}%`
                      }}
                      onClick={() => {
                        const newTime = timeline.slice(0, index).reduce((sum, s) => sum + s.duration, 0)
                        handleSeek(newTime)
                      }}
                    >
                      <div className="p-2 h-full flex flex-col justify-center">
                        <div className="text-xs font-medium truncate">
                          Slide {slide.slideNumber}
                        </div>
                        <div className="text-xs opacity-75">
                          {Math.round(slide.duration)}s
                        </div>
                      </div>
                      
                      {/* Indicador de progresso no slide atual */}
                      {isActive && (
                        <div
                          className="absolute bottom-0 left-0 h-1 bg-yellow-400"
                          style={{
                            width: `${Math.min(100, ((playerState.currentTime - slide.startTime) / slide.duration) * 100)}%`
                          }}
                        />
                      )}
                    </div>
                  )
                })}
                
                {/* Indicador de posição atual */}
                <div
                  className="absolute top-0 w-0.5 h-full bg-red-500 z-10"
                  style={{
                    left: `${(playerState.currentTime / playerState.totalDuration) * 100}%`
                  }}
                />
              </div>
              
              {/* Legenda */}
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-600 rounded" />
                  <span>Slide Atual</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-muted-foreground/20 rounded" />
                  <span>Próximos Slides</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-0.5 bg-red-500 rounded" />
                  <span>Posição Atual</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status de Sincronização */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Narração Ativa */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              Narração
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeSegment ? (
              <div className="space-y-2">
                <Badge variant="default" className="animate-pulse">
                  Reproduzindo
                </Badge>
                <p className="text-xs text-muted-foreground">
                  {activeSegment.text.substring(0, 60)}...
                </p>
                <div className="text-xs">
                  Tempo: {formatTime(activeSegment.startTime)} - {formatTime(activeSegment.endTime)}
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Nenhuma narração ativa
              </div>
            )}
          </CardContent>
        </Card>

        {/* Avatar Ativo */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="h-4 w-4" />
              Avatar
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeAvatarAction ? (
              <div className="space-y-2">
                <Badge variant="default" className="animate-pulse">
                  {activeAvatarAction.type}
                </Badge>
                <div className="text-xs">
                  Gesto: {activeAvatarAction.parameters.gestureType || 'Neutro'}
                </div>
                <div className="text-xs">
                  Expressão: {activeAvatarAction.parameters.expression || 'Neutra'}
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Avatar em repouso
              </div>
            )}
          </CardContent>
        </Card>

        {/* Slide Atual */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Slide
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentSlide ? (
              <div className="space-y-2">
                <Badge variant="default">
                  Slide {currentSlide.slideNumber}
                </Badge>
                <div className="text-xs">
                  Segmentos: {currentSlide.narrationSegments.length}
                </div>
                <div className="text-xs">
                  Ações: {currentSlide.avatarActions.length}
                </div>
                <Progress 
                  value={currentSlide.duration > 0 ? ((playerState.currentTime - currentSlide.startTime) / currentSlide.duration) * 100 : 0}
                  className="h-2"
                />
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Nenhum slide selecionado
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mensagem quando não há timeline */}
      {timeline.length === 0 && (
        <Alert>
          <Settings className="h-4 w-4" />
          <AlertDescription>
            Gere a narração dos slides primeiro para usar o player de sincronização.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

