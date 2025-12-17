/**
 * 🎤 TTS MODULE
 * Módulo de Text-to-Speech para o Studio Unificado
 */

'use client'

import React, { useState, useEffect, useRef } from 'react'
import { logger } from '@/lib/logger'
import { 
  Mic, 
  Play, 
  Pause, 
  Square, 
  Volume2, 
  VolumeX, 
  Download, 
  Upload, 
  Settings, 
  Zap,
  RotateCcw,
  FileAudio,
  Activity,
  Clock,
  User,
  Globe,
  Sliders
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

import type { UnifiedProject, TTSConfig, ProjectSlide, WorkflowStepData } from '@/lib/stores/unified-project-store'

interface TTSModuleProps {
  project: UnifiedProject
  onTTSUpdate: (tts: TTSConfig) => void
  onExecuteStep: (data: WorkflowStepData) => Promise<void>
}

interface VoiceOption {
  id: string
  name: string
  gender: 'male' | 'female'
  language: string
  provider: 'elevenlabs' | 'azure' | 'openai'
  accent: string
  description: string
  previewUrl?: string
  quality: 'standard' | 'premium' | 'neural'
}

interface AudioGeneration {
  slideId: string
  status: 'pending' | 'generating' | 'completed' | 'error'
  progress: number
  audioUrl?: string
  duration?: number
  error?: string
}

const voiceOptions: VoiceOption[] = [
  {
    id: 'pt-BR-female-1',
    name: 'Ana Clara',
    gender: 'female',
    language: 'pt-BR',
    provider: 'elevenlabs',
    accent: 'brasileiro',
    description: 'Voz feminina brasileira, natural e profissional',
    quality: 'neural'
  },
  {
    id: 'pt-BR-male-1',
    name: 'Carlos Eduardo',
    gender: 'male',
    language: 'pt-BR',
    provider: 'elevenlabs',
    accent: 'brasileiro',
    description: 'Voz masculina brasileira, confiante e clara',
    quality: 'neural'
  },
  {
    id: 'pt-BR-female-2',
    name: 'Beatriz Santos',
    gender: 'female',
    language: 'pt-BR',
    provider: 'azure',
    accent: 'paulista',
    description: 'Voz feminina com sotaque paulista, jovem e dinâmica',
    quality: 'premium'
  },
  {
    id: 'pt-BR-male-2',
    name: 'Roberto Silva',
    gender: 'male',
    language: 'pt-BR',
    provider: 'azure',
    accent: 'carioca',
    description: 'Voz masculina com sotaque carioca, amigável e calorosa',
    quality: 'premium'
  },
  {
    id: 'pt-BR-female-3',
    name: 'Mariana Costa',
    gender: 'female',
    language: 'pt-BR',
    provider: 'openai',
    accent: 'neutro',
    description: 'Voz feminina neutra, ideal para conteúdo educacional',
    quality: 'standard'
  }
]

export default function TTSModule({ 
  project, 
  onTTSUpdate, 
  onExecuteStep 
}: TTSModuleProps) {
  const [ttsConfig, setTTSConfig] = useState<TTSConfig>(
    project.tts || {
      voice: 'pt-BR-female-1',
      language: 'pt-BR',
      speed: 1.0,
      pitch: 1.0,
      volume: 1.0,
      provider: 'elevenlabs'
    }
  )
  
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption | null>(
    voiceOptions.find(v => v.id === ttsConfig.voice) || voiceOptions[0]
  )
  
  const [audioGenerations, setAudioGenerations] = useState<Record<string, AudioGeneration>>({})
  const [isGeneratingAll, setIsGeneratingAll] = useState(false)
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
  const [previewText, setPreviewText] = useState('Olá! Esta é uma demonstração da voz selecionada. Como você pode ouvir, a qualidade é excelente para apresentações profissionais.')
  
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({})

  // Update TTS config when project changes
  useEffect(() => {
    if (project.tts) {
      setTTSConfig(project.tts)
      const voice = voiceOptions.find(v => v.id === project.tts?.voice)
      if (voice) {
        setSelectedVoice(voice)
      }
    }
  }, [project.tts])

  // Initialize audio generations for slides
  useEffect(() => {
    const generations: Record<string, AudioGeneration> = {}
    project.slides.forEach(slide => {
      generations[slide.id] = {
        slideId: slide.id,
        status: 'pending',
        progress: 0
      }
    })
    setAudioGenerations(generations)
  }, [project.slides])

  // Handle voice selection
  const handleVoiceSelect = (voice: VoiceOption) => {
    setSelectedVoice(voice)
    const newConfig = {
      ...ttsConfig,
      voice: voice.id,
      provider: voice.provider,
      language: voice.language
    }
    setTTSConfig(newConfig)
    onTTSUpdate(newConfig)
  }

  // Handle TTS parameter changes
  const updateTTSParameter = (key: keyof TTSConfig, value: string | number) => {
    const newConfig = { ...ttsConfig, [key]: value }
    setTTSConfig(newConfig)
    onTTSUpdate(newConfig)
  }

  // Generate voice preview
  const generateVoicePreview = async () => {
    if (!selectedVoice) return

    try {
      const response = await fetch('/api/tts/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: previewText,
          voice: selectedVoice.id,
          config: ttsConfig
        })
      })

      if (!response.ok) {
        throw new Error('Falha na geração do preview')
      }

      const { audioUrl } = await response.json()
      
      // Play preview
      const audio = new Audio(audioUrl)
      audio.play()
      
      toast.success('Preview gerado!')

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error('Preview generation error', error instanceof Error ? error : new Error(errorMessage), { component: 'TTSModule' })
      toast.error('Erro ao gerar preview: ' + errorMessage)
    }
  }

  // Generate audio for single slide
  const generateSlideAudio = async (slide: ProjectSlide) => {
    if (!slide.content.trim()) {
      toast.error('Slide não possui conteúdo para gerar áudio')
      return
    }

    setAudioGenerations(prev => ({
      ...prev,
      [slide.id]: {
        ...prev[slide.id],
        status: 'generating',
        progress: 0
      }
    }))

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setAudioGenerations(prev => ({
          ...prev,
          [slide.id]: {
            ...prev[slide.id],
            progress: Math.min(prev[slide.id].progress + 10, 90)
          }
        }))
      }, 500)

      const response = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: slide.content,
          voice: selectedVoice?.id,
          config: ttsConfig,
          slideId: slide.id
        })
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        throw new Error('Falha na geração do áudio')
      }

      const { audioUrl, duration } = await response.json()

      setAudioGenerations(prev => ({
        ...prev,
        [slide.id]: {
          ...prev[slide.id],
          status: 'completed',
          progress: 100,
          audioUrl,
          duration
        }
      }))

      toast.success(`Áudio gerado para slide ${slide.slideNumber}`)

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error('Audio generation error', error instanceof Error ? error : new Error(errorMessage), { component: 'TTSModule', slideId: slide.id })
      setAudioGenerations(prev => ({
        ...prev,
        [slide.id]: {
          ...prev[slide.id],
          status: 'error',
          progress: 0,
          error: errorMessage
        }
      }))
      toast.error('Erro ao gerar áudio: ' + errorMessage)
    }
  }

  // Generate audio for all slides
  const generateAllAudio = async () => {
    setIsGeneratingAll(true)

    try {
      for (const slide of project.slides) {
        if (slide.content.trim()) {
          await generateSlideAudio(slide)
        }
      }
      toast.success('Todos os áudios foram gerados!')
    } catch (error) {
      toast.error('Erro ao gerar áudios')
    } finally {
      setIsGeneratingAll(false)
    }
  }

  // Play/pause audio
  const toggleAudio = (slideId: string, audioUrl: string) => {
    const audio = audioRefs.current[slideId] || new Audio(audioUrl)
    audioRefs.current[slideId] = audio

    if (currentlyPlaying === slideId) {
      audio.pause()
      setCurrentlyPlaying(null)
    } else {
      // Pause any currently playing audio
      Object.values(audioRefs.current).forEach(a => a.pause())
      
      audio.play()
      setCurrentlyPlaying(slideId)
      
      audio.onended = () => {
        setCurrentlyPlaying(null)
      }
    }
  }

  // Handle execute step
  const handleExecuteStep = async () => {
    const completedAudios = Object.values(audioGenerations).filter(
      gen => gen.status === 'completed'
    )

    if (completedAudios.length === 0) {
      toast.error('Gere pelo menos um áudio antes de continuar')
      return
    }

    try {
      await onExecuteStep({
        stepType: 'generate-tts',
        config: {
          ttsConfig,
          audioFiles: completedAudios.map(gen => ({
            slideId: gen.slideId,
            audioUrl: gen.audioUrl,
            duration: gen.duration
          })),
          settings: {
            syncWithAvatar: true,
            generateSubtitles: true,
            normalizeVolume: true
          }
        }
      })
      toast.success('TTS configurado! Prosseguindo para Render...')
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      toast.error('Erro ao configurar TTS: ' + errorMessage)
    }
  }

  // Render voice selection
  const renderVoiceSelection = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {voiceOptions.map((voice) => (
        <Card 
          key={voice.id}
          className={`cursor-pointer transition-all hover:shadow-md ${
            selectedVoice?.id === voice.id 
              ? 'ring-2 ring-blue-500 bg-blue-50' 
              : 'hover:bg-gray-50'
          }`}
          onClick={() => handleVoiceSelect(voice)}
        >
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">{voice.name}</h4>
                {selectedVoice?.id === voice.id && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  {voice.gender === 'male' ? 'Masculino' : 'Feminino'}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {voice.accent}
                </Badge>
              </div>
              
              <p className="text-xs text-gray-600 line-clamp-2">
                {voice.description}
              </p>
              
              <div className="flex items-center justify-between">
                <Badge 
                  variant={voice.quality === 'neural' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {voice.quality === 'standard' ? 'Padrão' :
                   voice.quality === 'premium' ? 'Premium' : 'Neural'}
                </Badge>
                
                <Badge variant="outline" className="text-xs">
                  {voice.provider}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  // Render TTS controls
  const renderTTSControls = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Sliders className="w-5 h-5" />
          <span>Configurações de Voz</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <Label>Velocidade: {ttsConfig.speed.toFixed(1)}x</Label>
            <Slider
              min={0.5}
              max={2.0}
              step={0.1}
              value={[ttsConfig.speed]}
              onValueChange={([value]) => updateTTSParameter('speed', value)}
              className="mt-2"
            />
          </div>

          <div>
            <Label>Tom: {ttsConfig.pitch.toFixed(1)}</Label>
            <Slider
              min={0.5}
              max={1.5}
              step={0.1}
              value={[ttsConfig.pitch]}
              onValueChange={([value]) => updateTTSParameter('pitch', value)}
              className="mt-2"
            />
          </div>

          <div>
            <Label>Volume: {Math.round(ttsConfig.volume * 100)}%</Label>
            <Slider
              min={0.1}
              max={1.0}
              step={0.1}
              value={[ttsConfig.volume]}
              onValueChange={([value]) => updateTTSParameter('volume', value)}
              className="mt-2"
            />
          </div>
        </div>

        <Separator />

        <div>
          <Label htmlFor="previewText">Texto de Teste</Label>
          <Textarea
            id="previewText"
            value={previewText}
            onChange={(e) => setPreviewText(e.target.value)}
            placeholder="Digite um texto para testar a voz"
            rows={3}
            className="mt-2"
          />
          <Button
            onClick={generateVoicePreview}
            disabled={!previewText.trim()}
            className="mt-2"
            size="sm"
          >
            <Play className="w-4 h-4 mr-2" />
            Testar Voz
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  // Render slides audio generation
  const renderSlidesAudio = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <FileAudio className="w-5 h-5" />
            <span>Geração de Áudio por Slide</span>
          </CardTitle>
          
          <Button
            onClick={generateAllAudio}
            disabled={isGeneratingAll}
            size="sm"
          >
            <Zap className="w-4 h-4 mr-2" />
            Gerar Todos
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {project.slides.map((slide) => {
              const generation = audioGenerations[slide.id]
              if (!generation) return null

              return (
                <Card key={slide.id} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            Slide {slide.slideNumber}
                          </Badge>
                          <Badge 
                            variant={
                              generation.status === 'completed' ? 'default' :
                              generation.status === 'generating' ? 'secondary' :
                              generation.status === 'error' ? 'destructive' : 'outline'
                            }
                            className="text-xs"
                          >
                            {generation.status === 'pending' ? 'Pendente' :
                             generation.status === 'generating' ? 'Gerando' :
                             generation.status === 'completed' ? 'Concluído' : 'Erro'}
                          </Badge>
                        </div>
                        
                        <h4 className="font-medium text-sm mb-1">{slide.title}</h4>
                        <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                          {slide.content}
                        </p>
                        
                        {generation.duration && (
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            <span>{Math.round(generation.duration)}s</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        {generation.status === 'completed' && generation.audioUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleAudio(slide.id, generation.audioUrl!)}
                          >
                            {currentlyPlaying === slide.id ? 
                              <Pause className="w-4 h-4" /> : 
                              <Play className="w-4 h-4" />
                            }
                          </Button>
                        )}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => generateSlideAudio(slide)}
                          disabled={generation.status === 'generating' || !slide.content.trim()}
                        >
                          {generation.status === 'generating' ? (
                            <RotateCcw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Mic className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    {generation.status === 'generating' && (
                      <Progress value={generation.progress} className="mb-2" />
                    )}
                    
                    {generation.error && (
                      <p className="text-xs text-red-600 mt-2">{generation.error}</p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Voice Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>Seleção de Voz</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderVoiceSelection()}
        </CardContent>
      </Card>

      {/* TTS Controls */}
      {renderTTSControls()}

      {/* Slides Audio Generation */}
      {renderSlidesAudio()}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <Button 
          variant="outline"
          onClick={generateVoicePreview}
          disabled={!selectedVoice}
        >
          <Volume2 className="w-4 h-4 mr-2" />
          Testar Voz
        </Button>
        
        <Button 
          onClick={handleExecuteStep}
          disabled={Object.values(audioGenerations).every(gen => gen.status !== 'completed')}
        >
          <Zap className="w-4 h-4 mr-2" />
          Continuar para Render
        </Button>
      </div>
    </div>
  )
}