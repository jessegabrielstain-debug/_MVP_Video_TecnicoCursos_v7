
/**
 * 🎬 Componente de Renderização em Tempo Real
 * Interface para controlar renderização de vídeos
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { toast } from 'react-hot-toast'
import { 
  Play, 
  Download, 
  Settings, 
  Clock, 
  FileVideo,
  Mic,
  Volume2,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Loader
} from 'lucide-react'

interface RenderOptions {
  width: number
  height: number
  fps: number
  quality: 'low' | 'medium' | 'high' | 'ultra'
  format: 'mp4' | 'webm' | 'gif' | 'mov'
}

interface RenderJob {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress: number
  outputUrl?: string
  error?: string
  estimatedTimeRemaining?: number
}

interface Props {
  projectId: string
  timeline: any
  onRenderComplete?: (videoUrl: string) => void
  onRenderError?: (error: string) => void
}

export function RealTimeRenderer({ projectId, timeline, onRenderComplete, onRenderError }: Props) {
  const [currentJob, setCurrentJob] = useState<RenderJob | null>(null)
  const [renderOptions, setRenderOptions] = useState<RenderOptions>({
    width: 1920,
    height: 1080,
    fps: 30,
    quality: 'high',
    format: 'mp4'
  })
  const [generateTTS, setGenerateTTS] = useState(true)
  const [selectedVoice, setSelectedVoice] = useState('pt-BR-Neural2-A')
  const [isRendering, setIsRendering] = useState(false)

  // Polling para status do job
  useEffect(() => {
    if (!currentJob || currentJob.status === 'completed' || currentJob.status === 'error') {
      return
    }

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/v1/render/status/${currentJob.id}`)
        const data = await response.json()
        
        if (data.success) {
          setCurrentJob(data.job)
          
          if (data.job.status === 'completed') {
            setIsRendering(false)
            toast.success('🎉 Vídeo renderizado com sucesso!')
            onRenderComplete?.(data.job.outputUrl)
          } else if (data.job.status === 'error') {
            setIsRendering(false)
            toast.error(`❌ Erro na renderização: ${data.job.error}`)
            onRenderError?.(data.job.error)
          }
        }
      } catch (error) {
        console.error('Error polling job status:', error)
      }
    }, 2000) // Check a cada 2 segundos

    return () => clearInterval(interval)
  }, [currentJob, onRenderComplete, onRenderError])

  const handleStartRender = async () => {
    if (!timeline || timeline.scenes.length === 0) {
      toast.error('❌ Timeline vazia. Adicione slides para renderizar.')
      return
    }

    try {
      setIsRendering(true)
      
      const response = await fetch('/api/v1/render/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId,
          timeline,
          options: renderOptions,
          generateTTS
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setCurrentJob({
          id: data.jobId,
          status: 'pending',
          progress: 0
        })
        toast.success('🚀 Renderização iniciada!')
      } else {
        setIsRendering(false)
        toast.error(`❌ ${data.error}`)
      }

    } catch (error) {
      setIsRendering(false)
      toast.error('❌ Erro ao iniciar renderização')
      console.error('Render start error:', error)
    }
  }

  const handleDownload = () => {
    if (currentJob?.outputUrl) {
      window.open(currentJob.outputUrl, '_blank')
      toast.success('📥 Download iniciado!')
    }
  }

  const handleCancelRender = async () => {
    if (currentJob?.id) {
      try {
        const response = await fetch(`/api/v1/render/status/${currentJob.id}`, {
          method: 'DELETE'
        })
        
        if (response.ok) {
          setCurrentJob(null)
          setIsRendering(false)
          toast.success('🛑 Renderização cancelada')
        }
      } catch (error) {
        toast.error('❌ Erro ao cancelar renderização')
      }
    }
  }

  const getQualityDescription = (quality: string) => {
    switch (quality) {
      case 'low': return '720p - Rápido'
      case 'medium': return '1080p - Balanceado'
      case 'high': return '1080p - Alta Qualidade'
      case 'ultra': return '4K - Ultra HD'
      default: return 'Qualidade Padrão'
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileVideo className="h-5 w-5 mr-2 text-blue-600" />
          Sistema de Renderização Real
          {currentJob && (
            <Badge variant="outline" className="ml-2">
              {currentJob.status === 'processing' && <Loader className="h-3 w-3 mr-1 animate-spin" />}
              {currentJob.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1 text-green-600" />}
              {currentJob.status === 'error' && <AlertCircle className="h-3 w-3 mr-1 text-red-600" />}
              {currentJob.status}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Configurações de Renderização */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="text-sm font-medium">Qualidade do Vídeo</label>
            <Select 
              value={renderOptions.quality} 
              onValueChange={(value: string) => setRenderOptions(prev => ({ ...prev, quality: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">720p - Rápido (10MB)</SelectItem>
                <SelectItem value="medium">1080p - Balanceado (25MB)</SelectItem>
                <SelectItem value="high">1080p - Alta Qualidade (50MB)</SelectItem>
                <SelectItem value="ultra">4K - Ultra HD (100MB)</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="text-xs text-gray-600">
              {getQualityDescription(renderOptions.quality)}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">Formato de Saída</label>
            <Select 
              value={renderOptions.format} 
              onValueChange={(value: string) => setRenderOptions(prev => ({ ...prev, format: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mp4">MP4 - Universal</SelectItem>
                <SelectItem value="webm">WebM - Web Otimizado</SelectItem>
                <SelectItem value="gif">GIF - Animação</SelectItem>
                <SelectItem value="mov">MOV - Alta Qualidade</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Configurações TTS */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              checked={generateTTS}
              onChange={(e) => setGenerateTTS(e.target.checked)}
              className="rounded"
            />
            <label className="text-sm font-medium flex items-center">
              <Mic className="h-4 w-4 mr-1" />
              Gerar Narração Automática (TTS)
            </label>
          </div>
          
          {generateTTS && (
            <Select value={selectedVoice} onValueChange={setSelectedVoice}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt-BR-Neural2-A">Ana Clara (Neural - Feminina)</SelectItem>
                <SelectItem value="pt-BR-Neural2-B">João Pedro (Neural - Masculina)</SelectItem>
                <SelectItem value="pt-BR-Wavenet-A">Camila (Wavenet - Feminina)</SelectItem>
                <SelectItem value="pt-BR-Wavenet-B">Ricardo (Wavenet - Masculina)</SelectItem>
                <SelectItem value="pt-BR-Standard-A">Mariana (Padrão - Feminina)</SelectItem>
                <SelectItem value="pt-BR-Standard-B">Carlos (Padrão - Masculina)</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Preview do Timeline */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium mb-2 flex items-center">
            <Sparkles className="h-4 w-4 mr-2 text-purple-600" />
            Preview do Projeto
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total de Slides:</span>
              <span className="ml-2 font-medium">{timeline?.scenes?.length || 0}</span>
            </div>
            <div>
              <span className="text-gray-600">Duração:</span>
              <span className="ml-2 font-medium">{timeline?.totalDuration || 0}s</span>
            </div>
            <div>
              <span className="text-gray-600">Resolução:</span>
              <span className="ml-2 font-medium">{renderOptions.width}x{renderOptions.height}</span>
            </div>
            <div>
              <span className="text-gray-600">FPS:</span>
              <span className="ml-2 font-medium">{renderOptions.fps}</span>
            </div>
          </div>
        </div>

        {/* Status de Renderização */}
        {currentJob && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Progresso da Renderização</span>
              <Badge variant={currentJob.status === 'error' ? 'destructive' : 'default'}>
                {currentJob.status}
              </Badge>
            </div>
            
            <Progress value={currentJob.progress} className="w-full" />
            
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>{currentJob.progress}% completo</span>
              {currentJob.estimatedTimeRemaining && currentJob.status === 'processing' && (
                <span className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  ~{currentJob.estimatedTimeRemaining}s restantes
                </span>
              )}
            </div>

            {currentJob.error && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                ❌ {currentJob.error}
              </div>
            )}
          </div>
        )}

        {/* Ações */}
        <div className="flex items-center space-x-3">
          {!isRendering ? (
            <Button 
              onClick={handleStartRender}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!timeline || timeline.scenes?.length === 0}
            >
              <Play className="h-4 w-4 mr-2" />
              Renderizar Vídeo
            </Button>
          ) : (
            <Button 
              onClick={handleCancelRender}
              variant="destructive"
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Cancelar Renderização
            </Button>
          )}

          {currentJob?.status === 'completed' && (
            <Button 
              onClick={handleDownload}
              variant="outline"
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Download MP4
            </Button>
          )}

          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configurações Avançadas
          </Button>
        </div>

        {/* Informações de Custo (TTS) */}
        {generateTTS && timeline?.scenes && (
          <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
            💡 <strong>TTS:</strong> ~{timeline.scenes.filter((s: any) => s.narrationText).length} narrações, 
            ~{timeline.scenes.reduce((total: number, s: any) => total + (s.narrationText?.length || 0), 0)} caracteres
            (Custo estimado: $0.02)
          </div>
        )}
      </CardContent>
    </Card>
  )
}
