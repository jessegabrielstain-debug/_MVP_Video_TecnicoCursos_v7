
/**
 * 🎬 Local Render Panel
 * Painel para iniciar renderização local de avatar
 */

'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Video, Sparkles, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { createBrowserSupabaseClient } from '@/lib/services'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface RenderJob {
  jobId: string
  status: string
  progress: number
  currentStage: string | null
  videoUrl: string | null
  error: string | null
}

export default function LocalRenderPanel() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), [])
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [text, setText] = useState('')
  const [avatarId, setAvatarId] = useState('avatar_executivo')
  const [voiceId, setVoiceId] = useState('elevenlabs_pt_female')
  const [resolution, setResolution] = useState('HD')
  const [isRendering, setIsRendering] = useState(false)
  const [currentJob, setCurrentJob] = useState<RenderJob | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadSession = async () => {
      try {
        const { data } = await supabase.auth.getUser()
        if (!isMounted) return
        setUser(data.user ?? null)
      } catch (error) {
        console.error('Erro ao carregar sessão do usuário:', error)
      }
    }

    void loadSession()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return
      setUser(session?.user ?? null)
    })

    return () => {
      isMounted = false
      listener?.subscription.unsubscribe()
    }
  }, [supabase])

  const avatars = [
    { id: 'avatar_executivo', name: 'Executivo Brasileiro', type: 'formal' },
    { id: 'avatar_instrutora', name: 'Instrutora de Segurança', type: 'professional' },
    { id: 'avatar_engenheiro', name: 'Engenheiro de Campo', type: 'technical' }
  ]

  const voices = [
    { id: 'elevenlabs_pt_female', name: 'Feminina PT-BR (ElevenLabs)', provider: 'elevenlabs' },
    { id: 'elevenlabs_pt_male', name: 'Masculina PT-BR (ElevenLabs)', provider: 'elevenlabs' },
    { id: 'azure_pt_francisca', name: 'Francisca (Azure)', provider: 'azure' },
    { id: 'azure_pt_antonio', name: 'Antônio (Azure)', provider: 'azure' }
  ]

  const handleStartRender = async () => {
    if (!text.trim()) {
      toast.error('Digite um texto para o avatar falar')
      return
    }

    if (!user?.id) {
      toast.error('Você precisa estar logado')
      return
    }

    setIsRendering(true)

    try {
      const response = await fetch('/api/avatars/local-render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          avatarId,
          voiceId,
          resolution,
          fps: 30,
          userId: user.id
        })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Falha ao iniciar renderização')
      }

      toast.success('Renderização iniciada!')

      setCurrentJob({
        jobId: data.jobId,
        status: 'queued',
        progress: 0,
        currentStage: 'preparation',
        videoUrl: null,
        error: null
      })

      // Inicia polling do status
      pollJobStatus(data.jobId)

    } catch (error: any) {
      console.error('Erro ao iniciar renderização:', error)
      toast.error(error.message || 'Erro ao iniciar renderização')
      setIsRendering(false)
    }
  }

  const pollJobStatus = async (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/avatars/local-render?jobId=${jobId}`)
        const data = await response.json()

        if (!data.success) {
          throw new Error('Falha ao consultar status')
        }

        setCurrentJob({
          jobId: data.jobId,
          status: data.status,
          progress: data.progress,
          currentStage: data.currentStage,
          videoUrl: data.videoUrl,
          error: data.error
        })

        if (data.status === 'completed') {
          clearInterval(interval)
          setIsRendering(false)
          toast.success('✅ Renderização concluída!')
        } else if (data.status === 'error') {
          clearInterval(interval)
          setIsRendering(false)
          toast.error('❌ Erro na renderização')
        }

      } catch (error) {
        console.error('Erro ao consultar status:', error)
        clearInterval(interval)
        setIsRendering(false)
      }
    }, 2000) // Poll a cada 2 segundos
  }

  const getStageLabel = (stage: string | null) => {
    const stages: Record<string, string> = {
      'preparation': 'Preparação',
      'audio': 'Gerando Áudio TTS',
      'lipsync': 'Sincronização Labial',
      'animation': 'Animação',
      'rendering': 'Renderizando Vídeo',
      'encoding': 'Codificação Final',
      'completed': 'Concluído'
    }
    return stages[stage || ''] || 'Processando...'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          Renderização Local de Avatar
          <Badge variant="secondary" className="ml-auto">
            <Sparkles className="h-3 w-3 mr-1" />
            Pipeline Local
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Seleção de Avatar */}
        <div className="space-y-2">
          <Label>Avatar</Label>
          <Select value={avatarId} onValueChange={setAvatarId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {avatars.map(avatar => (
                <SelectItem key={avatar.id} value={avatar.id}>
                  {avatar.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Seleção de Voz */}
        <div className="space-y-2">
          <Label>Voz</Label>
          <Select value={voiceId} onValueChange={setVoiceId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {voices.map(voice => (
                <SelectItem key={voice.id} value={voice.id}>
                  {voice.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Resolução */}
        <div className="space-y-2">
          <Label>Resolução</Label>
          <Select value={resolution} onValueChange={setResolution}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="HD">HD (1280x720)</SelectItem>
              <SelectItem value="FHD">Full HD (1920x1080)</SelectItem>
              <SelectItem value="4K">4K (3840x2160)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Texto */}
        <div className="space-y-2">
          <Label>Texto para o Avatar</Label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Digite o que o avatar deve falar... (máximo 800 caracteres)"
            className="min-h-[120px]"
            maxLength={800}
            disabled={isRendering}
          />
          <p className="text-xs text-muted-foreground text-right">
            {text.length}/800 caracteres
          </p>
        </div>

        {/* Status da Renderização */}
        {currentJob && (
          <div className="space-y-3 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {getStageLabel(currentJob.currentStage)}
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round(currentJob.progress)}%
              </span>
            </div>
            
            <Progress value={currentJob.progress} />

            <div className="flex items-center gap-2 text-sm">
              {currentJob.status === 'completed' && (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              {currentJob.status === 'error' && (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              {['queued', 'processing', 'rendering'].includes(currentJob.status) && (
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              )}
              <span className="text-muted-foreground">
                Status: {currentJob.status}
              </span>
            </div>

            {currentJob.videoUrl && (
              <Button
                className="w-full"
                onClick={() => window.open(currentJob.videoUrl!, '_blank')}
              >
                <Video className="h-4 w-4 mr-2" />
                Abrir Vídeo
              </Button>
            )}

            {currentJob.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                {currentJob.error}
              </div>
            )}
          </div>
        )}

        {/* Botão de Ação */}
        <Button
          className="w-full"
          size="lg"
          onClick={handleStartRender}
          disabled={isRendering || !text.trim()}
        >
          {isRendering ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Renderizando...
            </>
          ) : (
            <>
              <Video className="h-4 w-4 mr-2" />
              Iniciar Renderização Local
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
