


'use client'

/**
 * 🎬 FFMPEG RENDER STUDIO - Versão Simplificada
 * Interface básica para renderização de vídeos
 */

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Progress } from '../ui/progress'
import { Badge } from '../ui/badge'
import { Alert, AlertDescription } from '../ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { 
  Play, 
  Square, 
  Settings, 
  Download,
  Video,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'

interface FFmpegRenderStudioProps {
  timelineData?: Record<string, unknown>
  onRenderComplete?: (outputUrl: string) => void
}

type RenderQuality = 'speed' | 'balanced' | 'quality'
type RenderStatus = 'idle' | 'preparing' | 'rendering' | 'completed' | 'error'

export default function FFmpegRenderStudio({ 
  timelineData, 
  onRenderComplete 
}: FFmpegRenderStudioProps) {
  
  const [renderStatus, setRenderStatus] = useState<RenderStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [selectedQuality, setSelectedQuality] = useState<RenderQuality>('balanced')
  const [estimatedTime, setEstimatedTime] = useState('--:--')
  const [outputUrl, setOutputUrl] = useState<string | null>(null)

  // Simulação básica de renderização
  const handleStartRender = async () => {
    setRenderStatus('preparing')
    setProgress(0)
    
    // Simular progresso
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          setRenderStatus('completed')
          const mockUrl = '/videos/rendered_output.mp4'
          setOutputUrl(mockUrl)
          onRenderComplete?.(mockUrl)
          return 100
        }
        return prev + 2
      })
    }, 200)
    
    setRenderStatus('rendering')
  }

  const handleStopRender = () => {
    setRenderStatus('idle')
    setProgress(0)
  }

  const getStatusColor = (status: RenderStatus) => {
    switch (status) {
      case 'preparing': return 'text-yellow-600'
      case 'rendering': return 'text-blue-600'
      case 'completed': return 'text-green-600'
      case 'error': return 'text-red-600'
      default: return 'text-muted-foreground'
    }
  }

  const getStatusIcon = (status: RenderStatus) => {
    switch (status) {
      case 'preparing':
      case 'rendering':
        return <Loader2 className="h-4 w-4 animate-spin" />
      case 'completed':
        return <CheckCircle className="h-4 w-4" />
      case 'error':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Video className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Estúdio de Renderização FFmpeg</h2>
        <p className="text-muted-foreground">
          Renderize seus vídeos com qualidade profissional
        </p>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(renderStatus)}
            Status da Renderização
          </CardTitle>
          <CardDescription>
            Acompanhe o progresso da renderização do seu vídeo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className={`font-medium ${getStatusColor(renderStatus)}`}>
              {renderStatus === 'idle' && 'Aguardando'}
              {renderStatus === 'preparing' && 'Preparando...'}
              {renderStatus === 'rendering' && 'Renderizando...'}
              {renderStatus === 'completed' && 'Concluído'}
              {renderStatus === 'error' && 'Erro'}
            </span>
            <Badge variant="outline">{progress}%</Badge>
          </div>

          {renderStatus !== 'idle' && (
            <Progress value={progress} className="w-full" />
          )}

          {estimatedTime && renderStatus === 'rendering' && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Tempo estimado: {estimatedTime}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configurações de Renderização
          </CardTitle>
          <CardDescription>
            Ajuste a qualidade e configurações do vídeo final
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Qualidade de Renderização
            </label>
            <Select value={selectedQuality} onValueChange={(value) => setSelectedQuality(value as RenderQuality)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="speed">Rápida (2 Mbps)</SelectItem>
                <SelectItem value="balanced">Balanceada (4 Mbps)</SelectItem>
                <SelectItem value="quality">Alta Qualidade (8 Mbps)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Resolução:</span>
              <span className="ml-2 font-mono">1920x1080</span>
            </div>
            <div>
              <span className="text-muted-foreground">FPS:</span>
              <span className="ml-2 font-mono">30</span>
            </div>
            <div>
              <span className="text-muted-foreground">Codec:</span>
              <span className="ml-2 font-mono">H.264</span>
            </div>
            <div>
              <span className="text-muted-foreground">Formato:</span>
              <span className="ml-2 font-mono">MP4</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex items-center gap-4">
        {renderStatus === 'idle' || renderStatus === 'error' ? (
          <Button 
            onClick={handleStartRender}
            disabled={!timelineData}
            size="lg"
            className="px-8"
          >
            <Play className="h-4 w-4 mr-2" />
            Iniciar Renderização
          </Button>
        ) : (
          <Button 
            onClick={handleStopRender}
            variant="destructive"
            size="lg"
            className="px-8"
          >
            <Square className="h-4 w-4 mr-2" />
            Parar Renderização
          </Button>
        )}

        {outputUrl && renderStatus === 'completed' && (
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => window.open(outputUrl, '_blank')}
          >
            <Download className="h-4 w-4 mr-2" />
            Download do Vídeo
          </Button>
        )}
      </div>

      {/* Alerts */}
      {!timelineData && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Nenhum projeto carregado. Importe um timeline para começar a renderização.
          </AlertDescription>
        </Alert>
      )}

      {renderStatus === 'error' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erro durante a renderização. Verifique as configurações e tente novamente.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
