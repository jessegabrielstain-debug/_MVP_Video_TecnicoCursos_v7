
'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  Maximize,
  Download,
  Share2,
  Settings,
  SkipBack,
  SkipForward,
  RotateCcw
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface PreviewPrototypeProps {
  project?: Record<string, unknown>
  onExport?: () => void
}

export function PreviewPrototype({ project, onExport }: PreviewPrototypeProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration] = useState(270) // 4:30 em segundos
  const [volume, setVolume] = useState(80)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [quality, setQuality] = useState('1080p')

  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= duration) {
            setIsPlaying(false)
            return duration
          }
          return prev + 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isPlaying, duration])

  const handlePlay = () => {
    setIsPlaying(!isPlaying)
    if (!isPlaying) {
      toast.success('Reproduzindo vídeo demo...')
    }
  }

  const handleSeek = (value: number) => {
    setCurrentTime(value)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleExport = () => {
    toast.success('Iniciando exportação do vídeo...')
    setTimeout(() => {
      toast.success('Vídeo exportado com sucesso! (simulação)')
      onExport?.()
    }, 3000)
  }

  const handleShare = () => {
    toast.success('Link de compartilhamento copiado!')
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Preview do Vídeo</h2>
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          Protótipo com Vídeo Demo
        </Badge>
      </div>

      {/* Video Player */}
      <Card className="relative overflow-hidden">
        <CardContent className="p-0">
          <div className="relative bg-black" style={{ aspectRatio: '16/9' }}>
            {/* Mock Video Content */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-green-600 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="text-6xl mb-4">🎬</div>
                <h3 className="text-2xl font-bold mb-2">NR-12: Segurança em Máquinas</h3>
                <p className="text-lg opacity-90">Vídeo de treinamento gerado por IA</p>
                
                {/* Play Overlay */}
                {!isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button
                      size="lg"
                      onClick={handlePlay}
                      className="w-20 h-20 rounded-full bg-white/20 hover:bg-white/30"
                    >
                      <Play className="h-8 w-8 text-white ml-1" />
                    </Button>
                  </div>
                )}
                
                {/* Mock Avatar */}
                <div className="absolute bottom-20 right-8 w-32 h-32 bg-white/20 rounded-full flex items-center justify-center text-6xl">
                  👨‍💼
                </div>
              </div>
            </div>

            {/* Video Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="space-y-3">
                {/* Progress Bar */}
                <div className="flex items-center gap-3">
                  <span className="text-white text-sm">{formatTime(currentTime)}</span>
                  <div className="flex-1 cursor-pointer">
                    <Progress
                      value={(currentTime / duration) * 100}
                      className="h-2 bg-white/20"
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect()
                        const percent = (e.clientX - rect.left) / rect.width
                        handleSeek(Math.floor(percent * duration))
                      }}
                    />
                  </div>
                  <span className="text-white text-sm">{formatTime(duration)}</span>
                </div>

                {/* Control Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20"
                      onClick={handlePlay}
                    >
                      {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20"
                      onClick={() => handleSeek(Math.max(0, currentTime - 10))}
                    >
                      <SkipBack className="h-5 w-5" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20"
                      onClick={() => handleSeek(Math.min(duration, currentTime + 10))}
                    >
                      <SkipForward className="h-5 w-5" />
                    </Button>

                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white/20"
                        onClick={() => setIsMuted(!isMuted)}
                      >
                        {isMuted || volume === 0 ? 
                          <VolumeX className="h-5 w-5" /> : 
                          <Volume2 className="h-5 w-5" />
                        }
                      </Button>
                      <div className="w-20">
                        <Progress
                          value={isMuted ? 0 : volume}
                          className="h-1 bg-white/20"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <select 
                      value={quality}
                      onChange={(e) => setQuality(e.target.value)}
                      className="bg-black/50 text-white border border-white/20 rounded px-2 py-1 text-sm"
                    >
                      <option value="720p">720p</option>
                      <option value="1080p">1080p HD</option>
                      <option value="4k">4K Ultra HD</option>
                    </select>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20"
                      onClick={() => setIsFullscreen(!isFullscreen)}
                    >
                      <Maximize className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Video Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informações do Vídeo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Duração:</span>
              <span className="text-sm font-medium">{formatTime(duration)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Resolução:</span>
              <span className="text-sm font-medium">{quality}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Slides:</span>
              <span className="text-sm font-medium">8 slides</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Avatares:</span>
              <span className="text-sm font-medium">3 personagens</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Narração:</span>
              <span className="text-sm font-medium">TTS ElevenLabs</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Qualidade do Conteúdo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Compliance NR:</span>
              <Badge variant="default" className="bg-green-600">95%</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Áudio:</span>
              <Badge variant="default" className="bg-blue-600">Premium</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Efeitos:</span>
              <Badge variant="default" className="bg-purple-600">3D+IA</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Legendas:</span>
              <Badge variant="secondary">Auto-geradas</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Certificação:</span>
              <Badge variant="default" className="bg-orange-600">Válida</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={handleExport} className="w-full bg-green-600 hover:bg-green-700">
              <Download className="h-4 w-4 mr-2" />
              Exportar MP4
            </Button>
            <Button onClick={handleShare} variant="outline" className="w-full">
              <Share2 className="h-4 w-4 mr-2" />
              Compartilhar
            </Button>
            <Button variant="outline" className="w-full">
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </Button>
            <Button variant="outline" className="w-full">
              <RotateCcw className="h-4 w-4 mr-2" />
              Voltar ao Editor
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Export Progress (when exporting) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status da Exportação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Renderização:</span>
              <span className="font-medium text-green-600">Concluída</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Compressão:</span>
              <span className="font-medium text-green-600">Concluída</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Upload para S3:</span>
              <span className="font-medium text-blue-600">Em progresso...</span>
            </div>
            <Progress value={75} className="mt-3" />
            <p className="text-xs text-gray-600 text-center">
              Vídeo será salvo automaticamente quando concluído
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
