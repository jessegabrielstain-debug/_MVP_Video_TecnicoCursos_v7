
'use client'

/**
 * 🎬 DEMO: UE5 + Audio2Face Avatar System
 * Página de demonstração do novo sistema de avatares hiper-realistas
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Sparkles, Play, Download, CheckCircle, Clock, Zap } from 'lucide-react'
import { toast } from 'react-hot-toast'
import EngineSelector from '@/components/avatars/engine-selector'

interface MetaHuman {
  id: string
  name: string
  display_name: string
  gender: string
  ethnicity: string
  style: string
}

interface JobStatus {
  status: string;
  progress: number;
  error?: string;
  checkpoints?: {
    audio2face_completed?: boolean;
    ue5_scene_loaded?: boolean;
    animation_applied?: boolean;
    render_completed?: boolean;
    encoding_completed?: boolean;
  };
  timings?: {
    audio2face_seconds?: number;
    ue5_render_seconds?: number;
    encoding_seconds?: number;
    total_seconds?: number;
  };
  output?: {
    video_url?: string;
    metadata?: {
      duration_seconds?: number;
      file_size_mb?: number;
      resolution?: string;
    };
  };
}

export default function AvatarUE5DemoPage() {
  const [renderEngine, setRenderEngine] = useState<'vidnoz' | 'ue5'>('ue5')
  const [metahumans, setMetahumans] = useState<MetaHuman[]>([])
  const [selectedMetaHuman, setSelectedMetaHuman] = useState<string>('')
  const [text, setText] = useState('Olá! Bem-vindo ao Estúdio IA de Vídeos. Sou um avatar hiper-realista criado com Unreal Engine 5 e NVIDIA Audio2Face.')
  const [isGenerating, setIsGenerating] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  
  // Carregar MetaHumans disponíveis
  useEffect(() => {
    loadMetaHumans()
  }, [])
  
  // Monitorar job em andamento
  useEffect(() => {
    if (jobId && isGenerating) {
      const interval = setInterval(async () => {
        await checkJobStatus(jobId)
      }, 2000)
      
      return () => clearInterval(interval)
    }
  }, [jobId, isGenerating])
  
  const loadMetaHumans = async () => {
    try {
      const response = await fetch('/api/avatars/ue5/metahumans')
      const data = await response.json()
      
      if (data.success) {
        setMetahumans(data.metahumans)
        if (data.metahumans.length > 0) {
          setSelectedMetaHuman(data.metahumans[0].id)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar MetaHumans:', error)
      toast.error('Erro ao carregar lista de avatares')
    }
  }
  
  const generateAvatar = async () => {
    if (!selectedMetaHuman || !text.trim()) {
      toast.error('Selecione um MetaHuman e digite o texto')
      return
    }
    
    try {
      setIsGenerating(true)
      setJobId(null)
      setJobStatus(null)
      setVideoUrl(null)
      
      const config = {
        metahuman_id: selectedMetaHuman,
        audio_file_url: 'https://example.com/audio.mp3', // TODO: Gerar TTS primeiro
        clothing: {
          top: 'business_suit',
          bottom: 'dress_pants',
          shoes: 'formal_shoes',
          accessories: []
        },
        hair_style: 'professional',
        skin_tone: 'medium',
        environment: 'office',
        lighting_preset: 'corporate',
        camera_angle: 'medium',
        background_blur: true,
        emotion_override: 'professional',
        gesture_intensity: 2,
        eye_contact_mode: 'camera',
        resolution: '4K',
        fps: 30,
        ray_tracing: true,
        anti_aliasing: 'TSR',
        motion_blur: false,
        format: 'mp4',
        codec: 'h265',
        bitrate_mbps: 50,
        audio_quality_kbps: 192
      }
      
      const endpoint = renderEngine === 'vidnoz' 
        ? '/api/avatars/hyperreal/generate'
        : '/api/avatars/ue5/render'
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      
      const data = await response.json()
      
      if (data.success || data.job_id) {
        setJobId(data.job_id)
        toast.success(`🎬 Renderização ${renderEngine === 'ue5' ? 'UE5' : 'Vidnoz'} iniciada!`)
      } else {
        throw new Error(data.error || 'Erro na geração')
      }
      
    } catch (error: unknown) {
      console.error('Erro na geração:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      toast.error(`❌ ${errorMessage}`)
      setIsGenerating(false)
    }
  }
  
  const checkJobStatus = async (jid: string) => {
    try {
      const endpoint = renderEngine === 'ue5' 
        ? `/api/avatars/ue5/status/${jid}`
        : `/api/avatars/hyperreal/status/${jid}`
      
      const response = await fetch(endpoint)
      const data = await response.json()
      
      setJobStatus(data)
      
      if (data.status === 'completed' && data.output?.video_url) {
        setVideoUrl(data.output.video_url)
        setIsGenerating(false)
        toast.success('🎉 Avatar gerado com sucesso!')
      } else if (data.status === 'failed') {
        setIsGenerating(false)
        toast.error(`❌ ${data.error || 'Erro na renderização'}`)
      }
      
    } catch (error) {
      console.error('Erro ao verificar status:', error)
    }
  }
  
  const selectedMH = metahumans.find(mh => mh.id === selectedMetaHuman)
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-3 bg-white px-6 py-3 rounded-full shadow-lg mb-4">
            <Sparkles className="h-6 w-6 text-purple-600" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              UE5 + Audio2Face Demo
            </h1>
          </div>
          <p className="text-gray-600">
            Sistema de avatares hiper-realistas com tecnologia NVIDIA
          </p>
          <Badge variant="secondary" className="mt-2">
            Sprint 2 - Em Desenvolvimento
          </Badge>
        </div>
        
        {/* Engine Selector */}
        <EngineSelector 
          onEngineChange={setRenderEngine}
          defaultEngine="ue5"
        />
        
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Configuration */}
          <div className="space-y-6">
            {/* MetaHuman Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <span>Selecione o Avatar</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderEngine === 'ue5' ? (
                  <>
                    <Select value={selectedMetaHuman} onValueChange={setSelectedMetaHuman}>
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha um MetaHuman" />
                      </SelectTrigger>
                      <SelectContent>
                        {metahumans.map(mh => (
                          <SelectItem key={mh.id} value={mh.id}>
                            <div className="flex items-center space-x-2">
                              <span>{mh.display_name}</span>
                              <Badge variant="outline" className="text-xs">
                                {mh.gender === 'male' ? '👨' : '👩'}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {mh.style}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {selectedMH && (
                      <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                        <h4 className="font-semibold text-sm mb-2">Informações do MetaHuman:</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-600">Nome:</span>
                            <br />
                            <span className="font-medium">{selectedMH.display_name}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Estilo:</span>
                            <br />
                            <span className="font-medium capitalize">{selectedMH.style}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Gênero:</span>
                            <br />
                            <span className="font-medium">{selectedMH.gender === 'male' ? 'Masculino' : 'Feminino'}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Etnia:</span>
                            <br />
                            <span className="font-medium capitalize">{selectedMH.ethnicity}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <Alert>
                    <AlertDescription>
                      Modo Vidnoz: Usando galeria padrão de avatares
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
            
            {/* Script Input */}
            <Card>
              <CardHeader>
                <CardTitle>Texto para o Avatar</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={6}
                  placeholder="Digite o que o avatar deve falar..."
                  className="resize-none"
                />
                <div className="mt-2 text-sm text-gray-500">
                  {text.split(/\s+/).filter(w => w).length} palavras • 
                  ~{Math.ceil(text.split(/\s+/).filter(w => w).length / 2.5)}s estimados
                </div>
              </CardContent>
            </Card>
            
            {/* Generate Button */}
            <Button
              onClick={generateAvatar}
              disabled={isGenerating || !selectedMetaHuman || !text.trim()}
              size="lg"
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {isGenerating ? (
                <>
                  <Clock className="h-5 w-5 mr-2 animate-spin" />
                  Gerando Avatar...
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  Gerar Avatar {renderEngine === 'ue5' ? 'UE5' : 'Vidnoz'}
                </>
              )}
            </Button>
          </div>
          
          {/* Right Column - Status & Result */}
          <div className="space-y-6">
            {/* Job Status */}
            {jobStatus && (
              <Card className={jobStatus.status === 'completed' ? 'border-green-500 bg-green-50' : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    {jobStatus.status === 'completed' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <Zap className="h-5 w-5 text-purple-600 animate-pulse" />
                    )}
                    <span>Status da Renderização</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="capitalize">{jobStatus.status}</span>
                        <span className="font-bold">{jobStatus.progress}%</span>
                      </div>
                      <Progress value={jobStatus.progress} className="h-2" />
                    </div>
                    
                    {/* Checkpoints */}
                    {jobStatus.checkpoints && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Pipeline UE5:</h4>
                        <div className="space-y-1 text-sm">
                          <div className={`flex items-center space-x-2 ${jobStatus.checkpoints.audio2face_completed ? 'text-green-600' : 'text-gray-400'}`}>
                            <CheckCircle className="h-4 w-4" />
                            <span>Audio2Face Processing</span>
                          </div>
                          <div className={`flex items-center space-x-2 ${jobStatus.checkpoints.ue5_scene_loaded ? 'text-green-600' : 'text-gray-400'}`}>
                            <CheckCircle className="h-4 w-4" />
                            <span>UE5 Scene Loading</span>
                          </div>
                          <div className={`flex items-center space-x-2 ${jobStatus.checkpoints.animation_applied ? 'text-green-600' : 'text-gray-400'}`}>
                            <CheckCircle className="h-4 w-4" />
                            <span>Animation Applied</span>
                          </div>
                          <div className={`flex items-center space-x-2 ${jobStatus.checkpoints.render_completed ? 'text-green-600' : 'text-gray-400'}`}>
                            <CheckCircle className="h-4 w-4" />
                            <span>UE5 Rendering</span>
                          </div>
                          <div className={`flex items-center space-x-2 ${jobStatus.checkpoints.encoding_completed ? 'text-green-600' : 'text-gray-400'}`}>
                            <CheckCircle className="h-4 w-4" />
                            <span>FFmpeg Encoding</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Timings */}
                    {jobStatus.timings && Object.keys(jobStatus.timings).length > 0 && (
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <h4 className="font-semibold text-sm mb-2">Performance:</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {jobStatus.timings.audio2face_seconds && (
                            <div>
                              <span className="text-gray-600">Audio2Face:</span>
                              <br />
                              <span className="font-bold">{jobStatus.timings.audio2face_seconds}s</span>
                            </div>
                          )}
                          {jobStatus.timings.ue5_render_seconds && (
                            <div>
                              <span className="text-gray-600">UE5 Render:</span>
                              <br />
                              <span className="font-bold">{jobStatus.timings.ue5_render_seconds}s</span>
                            </div>
                          )}
                          {jobStatus.timings.encoding_seconds && (
                            <div>
                              <span className="text-gray-600">Encoding:</span>
                              <br />
                              <span className="font-bold">{jobStatus.timings.encoding_seconds}s</span>
                            </div>
                          )}
                          {jobStatus.timings.total_seconds && (
                            <div>
                              <span className="text-gray-600">Total:</span>
                              <br />
                              <span className="font-bold text-purple-600">{jobStatus.timings.total_seconds}s</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Video Result */}
            {videoUrl && (
              <Card className="border-green-500 bg-green-50">
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
                      <source src={videoUrl} type="video/mp4" />
                      Seu navegador não suporta o elemento de vídeo.
                    </video>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button variant="outline" className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button variant="outline" onClick={() => window.open(videoUrl, '_blank')}>
                      <Play className="h-4 w-4 mr-2" />
                      Abrir
                    </Button>
                  </div>
                  
                  {jobStatus?.output?.metadata && (
                    <div className="mt-4 p-3 bg-white rounded-lg border border-green-200">
                      <h5 className="font-semibold text-sm mb-2">Metadata:</h5>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-gray-600">Duração:</span>
                          <br />
                          <span className="font-bold">{jobStatus.output.metadata.duration_seconds?.toFixed(1)}s</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Tamanho:</span>
                          <br />
                          <span className="font-bold">{jobStatus.output.metadata.file_size_mb?.toFixed(1)}MB</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Qualidade:</span>
                          <br />
                          <span className="font-bold">{jobStatus.output.metadata.resolution}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
            {/* Info Panel */}
            {!isGenerating && !videoUrl && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    <span>Sobre o Sistema UE5</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tecnologia:</span>
                      <Badge variant="secondary">Unreal Engine 5.4</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Facial Animation:</span>
                      <Badge variant="secondary">NVIDIA Audio2Face</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Characters:</span>
                      <Badge variant="secondary">Epic MetaHuman</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Rendering:</span>
                      <Badge variant="secondary">Lumen + Ray Tracing</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Lip Sync Accuracy:</span>
                      <Badge variant="default" className="bg-green-600">99.5%</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
