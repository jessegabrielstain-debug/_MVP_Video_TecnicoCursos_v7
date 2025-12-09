
'use client'

/**
 * 🎭 Hyperreal Avatar Studio - Interface Completa
 * Sistema de avatares 3D falantes hiper-realistas baseado em Vidnoz
 */

import React, { useState, useEffect } from 'react'
import { logger } from '@/lib/logger'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Play, 
  Pause,
  Download,
  User,
  Mic,
  Video,
  Settings,
  Palette,
  Shirt,
  Camera,
  Zap,
  CheckCircle,
  Clock,
  Star,
  Users,
  Eye,
  Volume2,
  Sparkles
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import Image from 'next/image'
import { HyperRealisticAvatar, AvatarRenderJob, AvatarGenerationOptions } from '@/lib/vidnoz-avatar-engine'

interface HyperRealAvatarStudioProps {
  onVideoGenerated?: (videoUrl: string) => void
  initialText?: string
}

export default function HyperRealAvatarStudio({ 
  onVideoGenerated,
  initialText = ''
}: HyperRealAvatarStudioProps) {
  // Estados principais
  const [avatars, setAvatars] = useState<HyperRealisticAvatar[]>([])
  const [selectedAvatar, setSelectedAvatar] = useState<HyperRealisticAvatar | null>(null)
  const [text, setText] = useState(initialText)
  const [isGenerating, setIsGenerating] = useState(false)
  const [renderJob, setRenderJob] = useState<AvatarRenderJob | null>(null)
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null)

  // Configurações de voz
  const [voiceSpeed, setVoiceSpeed] = useState([1.0])
  const [voicePitch, setVoicePitch] = useState([0])
  const [selectedEmotion, setSelectedEmotion] = useState('professional')

  // Configurações visuais
  const [selectedGesture, setSelectedGesture] = useState('explaining')
  const [selectedClothing, setSelectedClothing] = useState('')
  const [selectedBackground, setSelectedBackground] = useState('office_modern')
  const [selectedLighting, setSelectedLighting] = useState<'soft' | 'natural' | 'professional' | 'dramatic'>('professional')

  // Configurações de output
  const [resolution, setResolution] = useState<'HD' | '4K' | '8K'>('4K')
  const [fps, setFps] = useState<24 | 30 | 60>(30)

  // Estado da UI
  const [activeTab, setActiveTab] = useState('avatars')
  const [previewVideo, setPreviewVideo] = useState<string | null>(null)

  useEffect(() => {
    loadAvatars()
  }, [])

  const loadAvatars = async () => {
    try {
      const response = await fetch('/api/avatars/hyperreal/gallery')
      const data = await response.json()
      setAvatars(data.avatars || [])
      
      if (data.avatars?.length > 0) {
        setSelectedAvatar(data.avatars[0])
        setSelectedClothing(data.avatars[0].clothing[0]?.id || '')
      }
    } catch (error) {
      logger.error('Erro ao carregar avatares', error instanceof Error ? error : new Error(String(error)), { component: 'HyperrealAvatarStudio' })
      toast.error('Erro ao carregar galeria de avatares')
    }
  }

  const handleAvatarSelect = (avatar: HyperRealisticAvatar) => {
    setSelectedAvatar(avatar)
    setSelectedClothing(avatar.clothing[0]?.id || '')
    setSelectedEmotion(avatar.emotions[0]?.id || 'professional')
    setSelectedGesture(avatar.gestureSet[0] || 'explaining')
    setPreviewVideo(avatar.previewVideoUrl)
  }

  const generateVideo = async () => {
    if (!selectedAvatar || !text.trim()) {
      toast.error('Selecione um avatar e digite o texto')
      return
    }

    try {
      setIsGenerating(true)
      setRenderJob(null)
      setGeneratedVideoUrl(null)

      const options: AvatarGenerationOptions = {
        avatarId: selectedAvatar.id,
        text: text.trim(),
        voiceSettings: {
          speed: voiceSpeed[0],
          pitch: voicePitch[0],
          emotion: selectedEmotion,
          emphasis: []
        },
        visualSettings: {
          emotion: selectedEmotion,
          gesture: selectedGesture,
          clothing: selectedClothing,
          background: selectedBackground,
          lighting: selectedLighting
        },
        outputSettings: {
          resolution,
          fps,
          format: 'mp4',
          duration: 0
        }
      }

      const response = await fetch('/api/avatars/hyperreal/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(options)
      })

      const data = await response.json()

      if (data.success) {
        setRenderJob(data.job)
        monitorRenderProgress(data.job.id)
        toast.success('🎬 Geração iniciada!')
      } else {
        throw new Error(data.error || 'Erro na geração')
      }

    } catch (error: any) {
      logger.error('Erro na geração de avatar', error instanceof Error ? error : new Error(String(error)), { component: 'HyperrealAvatarStudio', avatarId: selectedAvatar?.id })
      toast.error(`❌ ${error.message}`)
      setIsGenerating(false)
    }
  }

  const monitorRenderProgress = async (jobId: string) => {
    const checkProgress = async () => {
      try {
        const response = await fetch(`/api/avatars/hyperreal/status/${jobId}`)
        const job = await response.json()
        
        setRenderJob(job)
        
        if (job.status === 'completed') {
          setGeneratedVideoUrl(job.outputUrl)
          setIsGenerating(false)
          toast.success('🎉 Avatar gerado com sucesso!')
          onVideoGenerated?.(job.outputUrl)
        } else if (job.status === 'error') {
          setIsGenerating(false)
          toast.error(`❌ ${job.error || 'Erro na renderização'}`)
        } else {
          setTimeout(checkProgress, 2000)
        }
      } catch (error) {
        logger.error('Erro ao verificar progresso', error instanceof Error ? error : new Error(String(error)), { component: 'HyperrealAvatarStudio', jobId })
        setIsGenerating(false)
      }
    }

    setTimeout(checkProgress, 1000)
  }

  const downloadVideo = () => {
    if (!generatedVideoUrl) return

    const a = document.createElement('a')
    a.href = generatedVideoUrl
    a.download = `${selectedAvatar?.name || 'avatar'}_video.mp4`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    toast.success('📥 Download iniciado!')
  }

  const estimatedDuration = Math.ceil(text.split(/\s+/).length / 2.5)

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            <div className="bg-purple-600 p-2 rounded-full">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Avatar Studio Hiper-realista
              </span>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="secondary" className="text-purple-700 bg-purple-100">
                  🎭 Vidnoz Technology
                </Badge>
                <Badge variant="secondary" className="text-blue-700 bg-blue-100">
                  ✅ 4K Ready
                </Badge>
                <Badge variant="secondary" className="text-green-700 bg-green-100">
                  🚀 Real-time
                </Badge>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Esquerda - Configurações */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="avatars" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Avatares</span>
              </TabsTrigger>
              <TabsTrigger value="voice" className="flex items-center space-x-2">
                <Mic className="h-4 w-4" />
                <span>Voz</span>
              </TabsTrigger>
              <TabsTrigger value="visual" className="flex items-center space-x-2">
                <Eye className="h-4 w-4" />
                <span>Visual</span>
              </TabsTrigger>
              <TabsTrigger 
                value="output" 
                className="flex items-center space-x-2"
                onClick={() => {
                  toast.success('Configurações de Output abertas!')
                  logger.debug('Tab Output ativada', { component: 'HyperrealAvatarStudio' })
                }}
              >
                <Video className="h-4 w-4" />
                <span>Output</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab: Seleção de Avatares */}
            <TabsContent value="avatars" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Galeria de Avatares Hiper-realistas</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {avatars.map((avatar) => (
                        <div
                          key={avatar.id}
                          onClick={() => handleAvatarSelect(avatar)}
                          className={`
                            relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all
                            ${selectedAvatar?.id === avatar.id 
                              ? 'border-purple-500 ring-2 ring-purple-200' 
                              : 'border-gray-200 hover:border-purple-300'
                            }
                          `}
                        >
                          <div className="aspect-[3/4] bg-gray-100 relative">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                              <h3 className="font-bold text-sm">{avatar.name}</h3>
                              <div className="flex items-center space-x-1 text-xs">
                                <Badge variant="outline" className="text-white border-white/50 text-xs">
                                  {avatar.quality}
                                </Badge>
                                <span>•</span>
                                <span>{avatar.lipSyncAccuracy}% sync</span>
                              </div>
                            </div>
                            
                            {/* Quality indicators */}
                            <div className="absolute top-2 right-2 flex space-x-1">
                              <Badge variant="secondary" className="text-xs bg-black/70 text-white">
                                {avatar.facialExpressions} expr.
                              </Badge>
                            </div>

                            {/* Preview play button */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="bg-purple-600/80 rounded-full p-3">
                                <Play className="h-6 w-6 text-white" />
                              </div>
                            </div>
                          </div>

                          <div className="p-3 bg-white">
                            <div className="flex items-center justify-between text-xs text-gray-600">
                              <span>{avatar.style}</span>
                              <span>{avatar.languages.length} idiomas</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Configurações de Voz */}
            <TabsContent value="voice" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Volume2 className="h-5 w-5" />
                    <span>Configurações de Voz</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Texto */}
                  <div className="space-y-2">
                    <Label>Texto para Fala</Label>
                    <Textarea
                      placeholder="Digite o texto que o avatar irá falar..."
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

                  {/* Emoção */}
                  <div className="space-y-2">
                    <Label>Emoção da Voz</Label>
                    <Select value={selectedEmotion} onValueChange={setSelectedEmotion}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma emoção" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedAvatar?.emotions.map((emotion: any) => (
                          <SelectItem key={emotion.id} value={emotion.id}>
                            <div className="flex items-center space-x-2">
                              <span>{emotion.name}</span>
                              <Badge variant="outline">
                                {emotion.intensity}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Velocidade */}
                  <div className="space-y-2">
                    <Label>Velocidade: {voiceSpeed[0]}x</Label>
                    <Slider
                      value={voiceSpeed}
                      onValueChange={setVoiceSpeed}
                      min={0.5}
                      max={2.0}
                      step={0.1}
                    />
                  </div>

                  {/* Tom */}
                  <div className="space-y-2">
                    <Label>Tom: {voicePitch[0] > 0 ? '+' : ''}{voicePitch[0]}</Label>
                    <Slider
                      value={voicePitch}
                      onValueChange={setVoicePitch}
                      min={-10}
                      max={10}
                      step={1}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Configurações Visuais */}
            <TabsContent value="visual" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Palette className="h-5 w-5" />
                    <span>Configurações Visuais</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Gestos */}
                  <div className="space-y-2">
                    <Label>Gestos</Label>
                    <Select value={selectedGesture} onValueChange={setSelectedGesture}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um gesto" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedAvatar?.gestureSet.map((gesture: any) => (
                          <SelectItem key={gesture} value={gesture}>
                            {gesture.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Roupas */}
                  <div className="space-y-2">
                    <Label>Vestimenta</Label>
                    <Select value={selectedClothing} onValueChange={setSelectedClothing}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma roupa" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedAvatar?.clothing.map((item: any) => (
                          <SelectItem key={item.id} value={item.id}>
                            <div className="flex items-center space-x-2">
                              <Shirt className="h-4 w-4" />
                              <span>{item.style} {item.color}</span>
                              <Badge variant="outline">
                                {item.type}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Fundo */}
                  <div className="space-y-2">
                    <Label>Fundo</Label>
                    <Select value={selectedBackground} onValueChange={setSelectedBackground}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um fundo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="office_modern">Escritório Moderno</SelectItem>
                        <SelectItem value="conference_room">Sala de Conferência</SelectItem>
                        <SelectItem value="training_room">Sala de Treinamento</SelectItem>
                        <SelectItem value="industrial_site">Local Industrial</SelectItem>
                        <SelectItem value="hospital">Hospital</SelectItem>
                        <SelectItem value="neutral_studio">Estúdio Neutro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Iluminação */}
                  <div className="space-y-2">
                    <Label>Iluminação</Label>
                    <Select value={selectedLighting} onValueChange={(value) => setSelectedLighting(value as 'soft' | 'natural' | 'professional' | 'dramatic')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a iluminação" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="soft">Suave</SelectItem>
                        <SelectItem value="natural">Natural</SelectItem>
                        <SelectItem value="professional">Profissional</SelectItem>
                        <SelectItem value="dramatic">Dramática</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Configurações de Output */}
            <TabsContent value="output" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Video className="h-5 w-5" />
                    <span>Configurações de Saída</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Resolução</Label>
                      <Select value={resolution} onValueChange={(value: 'HD' | '4K' | '8K') => setResolution(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="HD">HD (1080p)</SelectItem>
                          <SelectItem value="4K">4K UHD</SelectItem>
                          <SelectItem value="8K">8K Ultra HD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>FPS</Label>
                      <Select value={fps.toString()} onValueChange={(value) => setFps(Number(value) as 24 | 30 | 60)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="24">24 FPS</SelectItem>
                          <SelectItem value="30">30 FPS</SelectItem>
                          <SelectItem value="60">60 FPS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Estimativas de Renderização</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-bold text-blue-800">
                          {renderJob?.estimatedTime || Math.ceil(estimatedDuration * 2.5)}s
                        </div>
                        <div className="text-blue-600">Tempo estimado</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-blue-800">
                          {resolution === '8K' ? '~200MB' : resolution === '4K' ? '~80MB' : '~30MB'}
                        </div>
                        <div className="text-blue-600">Tamanho arquivo</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-blue-800">MP4</div>
                        <div className="text-blue-600">Formato</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Botão de Geração */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <Button
                  onClick={generateVideo}
                  disabled={isGenerating || !selectedAvatar || !text.trim()}
                  size="lg"
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  <Zap className="h-5 w-5 mr-2" />
                  {isGenerating ? 'Gerando Avatar...' : 'Gerar Vídeo com Avatar'}
                </Button>

                {/* Progress */}
                {renderJob && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{renderJob.status}</span>
                      <span>{renderJob.progress}%</span>
                    </div>
                    <Progress value={renderJob.progress} />
                    <p className="text-center text-sm text-gray-600">
                      {renderJob.status === 'processing' && 'Processando TTS e sincronização labial...'}
                      {renderJob.status === 'rendering' && 'Renderizando avatar em alta qualidade...'}
                      {renderJob.status === 'completed' && 'Avatar concluído!'}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna Direita - Preview e Resultado */}
        <div className="space-y-6">
          {/* Avatar Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5" />
                <span>Preview Avatar</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-gray-100 rounded-lg relative overflow-hidden">
                {selectedAvatar ? (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent">
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <h3 className="font-bold text-lg">{selectedAvatar.name}</h3>
                      <div className="flex items-center space-x-2 text-sm">
                        <Badge variant="outline" className="text-white border-white/50">
                          {selectedAvatar.quality}
                        </Badge>
                        <Badge variant="outline" className="text-white border-white/50">
                          {selectedAvatar.lipSyncAccuracy}% sync
                        </Badge>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <User className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500">Selecione um avatar</p>
                    </div>
                  </div>
                )}
              </div>

              {selectedAvatar && (
                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="font-medium">Estilo:</span>
                      <br />
                      <span className="text-gray-600 capitalize">{selectedAvatar.style}</span>
                    </div>
                    <div>
                      <span className="font-medium">Expressões:</span>
                      <br />
                      <span className="text-gray-600">{selectedAvatar.facialExpressions}</span>
                    </div>
                    <div>
                      <span className="font-medium">Idiomas:</span>
                      <br />
                      <span className="text-gray-600">{selectedAvatar.languages.join(', ')}</span>
                    </div>
                    <div>
                      <span className="font-medium">Gestos:</span>
                      <br />
                      <span className="text-gray-600">{selectedAvatar.gestureSet.length}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vídeo Resultado */}
          {generatedVideoUrl && (
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-green-800">
                  <CheckCircle className="h-5 w-5" />
                  <span>Avatar Gerado!</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-black rounded-lg mb-4">
                  <video
                    controls
                    className="w-full h-full rounded-lg"
                    poster="/placeholder-video.jpg"
                  >
                    <source src={generatedVideoUrl} type="video/mp4" />
                    Seu navegador não suporta o elemento de vídeo.
                  </video>
                </div>

                <div className="flex space-x-2">
                  <Button onClick={downloadVideo} className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Download MP4
                  </Button>
                  <Button variant="outline" onClick={() => window.open(generatedVideoUrl, '_blank')}>
                    <Eye className="h-4 w-4 mr-2" />
                    Visualizar
                  </Button>
                </div>

                <div className="mt-4 text-center">
                  <Badge variant="secondary" className="text-green-700 bg-green-100">
                    🎉 Qualidade {resolution} • {fps}fps
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Info Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Star className="h-5 w-5" />
                <span>Tecnologia</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Lip Sync</span>
                  <Badge variant="secondary" className="text-green-700 bg-green-100">
                    95-99%
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Renderização</span>
                  <Badge variant="secondary" className="text-blue-700 bg-blue-100">
                    Real-time
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Qualidade</span>
                  <Badge variant="secondary" className="text-purple-700 bg-purple-100">
                    Até 8K
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Expressões</span>
                  <Badge variant="secondary" className="text-orange-700 bg-orange-100">
                    34-56
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
