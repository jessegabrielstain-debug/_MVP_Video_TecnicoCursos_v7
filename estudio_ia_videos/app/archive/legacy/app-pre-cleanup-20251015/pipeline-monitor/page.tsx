

'use client'

/**
 * 🎬 Pipeline Monitor - Sprint 27
 * Monitor render and TTS services
 */

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  TrendingUp,
  Video,
  Mic
} from 'lucide-react'
import Link from 'next/link'

interface HealthStatus {
  status: string
  timestamp: string
  responseTime: string
  services: {
    ffmpeg: string
    tts: {
      elevenlabs: boolean
      azure: boolean
      google: boolean
    }
    storage: string
  }
  version: string
  sprint: string
}

export default function PipelineMonitorPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const fetchHealth = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/render/health')
      const data = await response.json()
      setHealth(data)
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Failed to fetch health:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealth()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'available':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'degraded':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case 'unhealthy':
      case 'unavailable':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Activity className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string | boolean) => {
    const statusStr = typeof status === 'boolean' ? (status ? 'available' : 'unavailable') : status
    
    const variants: Record<string, unknown> = {
      healthy: 'default',
      available: 'default',
      degraded: 'secondary',
      unhealthy: 'destructive',
      unavailable: 'destructive',
      unknown: 'outline'
    }

    return (
      <Badge variant={variants[statusStr] || 'outline'}>
        {statusStr}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Pipeline Monitor
            </h1>
            <p className="text-gray-400">
              Monitoramento em tempo real dos serviços de produção
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={fetchHealth}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Link href="/dashboard">
              <Button variant="default">
                Voltar ao Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Overall Status */}
        {health && (
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(health.status)}
                  <div>
                    <CardTitle className="text-white">
                      Status Geral: {health.status.toUpperCase()}
                    </CardTitle>
                    <CardDescription>
                      {health.sprint} • Versão {health.version}
                    </CardDescription>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">
                    {health.responseTime}
                  </div>
                  <div className="text-sm text-gray-400">
                    Tempo de resposta
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-400">
                Última atualização: {lastUpdate.toLocaleString('pt-BR')}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Services Grid */}
        {health && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* FFmpeg Service */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Video className="h-8 w-8 text-primary" />
                    <div>
                      <CardTitle className="text-white">FFmpeg</CardTitle>
                      <CardDescription>Renderização de vídeo</CardDescription>
                    </div>
                  </div>
                  {getStatusIcon(health.services.ffmpeg)}
                </div>
              </CardHeader>
              <CardContent>
                {getStatusBadge(health.services.ffmpeg)}
                <p className="text-sm text-gray-400 mt-2">
                  {health.services.ffmpeg === 'available' 
                    ? 'Pronto para renderizar vídeos'
                    : 'Serviço indisponível'}
                </p>
              </CardContent>
            </Card>

            {/* TTS Services */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Mic className="h-8 w-8 text-primary" />
                    <div>
                      <CardTitle className="text-white">TTS Providers</CardTitle>
                      <CardDescription>Síntese de voz</CardDescription>
                    </div>
                  </div>
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">ElevenLabs</span>
                  {getStatusBadge(health.services.tts.elevenlabs)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Azure Speech</span>
                  {getStatusBadge(health.services.tts.azure)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Google TTS</span>
                  {getStatusBadge(health.services.tts.google)}
                </div>
              </CardContent>
            </Card>

            {/* Storage Service */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Activity className="h-8 w-8 text-primary" />
                    <div>
                      <CardTitle className="text-white">Storage</CardTitle>
                      <CardDescription>AWS S3</CardDescription>
                    </div>
                  </div>
                  {getStatusIcon(health.services.storage)}
                </div>
              </CardHeader>
              <CardContent>
                {getStatusBadge(health.services.storage)}
                <p className="text-sm text-gray-400 mt-2">
                  {health.services.storage === 'available'
                    ? 'Pronto para armazenar arquivos'
                    : 'Serviço indisponível'}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Loading State */}
        {loading && !health && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Quick Actions */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Ações Rápidas</CardTitle>
            <CardDescription>
              Teste os serviços de produção
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/canvas-editor-demo">
                <Button variant="outline" className="w-full">
                  Testar Canvas Editor
                </Button>
              </Link>
              <Button variant="outline" className="w-full" disabled>
                Testar TTS (Em breve)
              </Button>
              <Button variant="outline" className="w-full" disabled>
                Testar Render (Em breve)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
