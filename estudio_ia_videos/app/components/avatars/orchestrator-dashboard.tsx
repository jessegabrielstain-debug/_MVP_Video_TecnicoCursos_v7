
/**
 * 🎛️ Dashboard do Orquestrador de Avatar 3D Hiper-Realista
 * Interface completa para criação e monitoramento de avatares
 */

"use client"

import React, { useState, useEffect } from 'react'
import { logger } from '@/lib/logger'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, CheckCircle, Clock, Play, Pause, Download, Eye, Settings } from 'lucide-react'
import type { OrchestratorPayload, OrchestratorResponse, CheckpointStatus, ModuleCatalogEntry } from '@/lib/orchestrator/avatar-3d-hyperreal-orchestrator'

interface OrchestratorDashboardProps {
  className?: string
}

export default function OrchestratorDashboard({ className }: OrchestratorDashboardProps) {
  const [activeJob, setActiveJob] = useState<OrchestratorResponse | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [consentConfirmed, setConsentConfirmed] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState<Partial<OrchestratorPayload>>({
    job_id: '',
    primary_image_url: '',
    input_images: [],
    create_avatar: true,
    avatar_name: '',
    target_style: 'photorealistic',
    locale: 'pt-BR',
    audio: {
      mode: 'tts',
      tts: {
        voice_name: 'pt-BR-AntonioNeural',
        ssml: ''
      }
    },
    script_text_or_ssml: '',
    lip_sync_mode: 'phoneme_align',
    emotion: {
      type: 'neutral',
      intensity: 'moderate'
    },
    motion_profile: {
      blink_rate: 1.0,
      microexpressions: true
    },
    render: {
      checkpoints: [],
      await_approval_on: ['preview_lowres', 'audio_sync_preview'],
      resolution: '4K',
      fps: 30
    },
    mesh: {
      texture_resolution: '4K'
    },
    phoneme_align_accuracy: 'high',
    smoothing_frames: 5,
    consent_confirmed: false,
    prefer_reuse_of_existing_modules: true
  })

  // Gerar job ID único
  useEffect(() => {
    if (!formData.job_id) {
      setFormData(prev => ({
        ...prev,
        job_id: `avatar3d_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }))
    }
  }, [formData.job_id])

  // Polling para status do job
  useEffect(() => {
    if (activeJob && ['processing', 'awaiting_approval'].includes(activeJob.job_status)) {
      const interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/avatars/orchestrator?job_id=${activeJob.job_id}`)
          if (response.ok) {
            const updatedStatus = await response.json()
            setActiveJob(updatedStatus)
          }
        } catch (error) {
          logger.error('Erro ao atualizar status', error instanceof Error ? error : new Error(String(error)), { component: 'OrchestratorDashboard' })
        }
      }, 2000)

      return () => clearInterval(interval)
    }
  }, [activeJob])

  const handleCreateAvatar = async () => {
    if (!consentConfirmed) {
      alert('Você deve confirmar o consentimento para prosseguir')
      return
    }

    setIsCreating(true)
    
    try {
      const payload: OrchestratorPayload = {
        ...formData,
        consent_confirmed: consentConfirmed
      } as OrchestratorPayload

      const response = await fetch('/api/avatars/orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const result = await response.json()
        setActiveJob(result)
      } else {
        const error = await response.json()
        alert(`Erro: ${error.error}`)
      }
    } catch (error) {
      logger.error('Erro ao criar avatar', error instanceof Error ? error : new Error(String(error)), { component: 'OrchestratorDashboard' })
      alert('Erro ao criar avatar')
    } finally {
      setIsCreating(false)
    }
  }

  const handleApproveCheckpoint = async (stage: string) => {
    if (!activeJob) return

    try {
      const response = await fetch('/api/avatars/orchestrator/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: activeJob.job_id,
          stage,
          approve: true
        })
      })

      if (response.ok) {
        const result = await response.json()
        setActiveJob(result.job_status)
      }
    } catch (error) {
      logger.error('Erro ao aprovar checkpoint', error instanceof Error ? error : new Error(String(error)), { component: 'OrchestratorDashboard' })
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-gray-500',
      running: 'bg-blue-500',
      done: 'bg-green-500',
      failed: 'bg-red-500',
      awaiting_approval: 'bg-yellow-500'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-500'
  }

  const getStatusIcon = (status: string) => {
    const icons = {
      pending: <Clock className="w-4 h-4" />,
      running: <Play className="w-4 h-4" />,
      done: <CheckCircle className="w-4 h-4" />,
      failed: <AlertTriangle className="w-4 h-4" />,
      awaiting_approval: <Pause className="w-4 h-4" />
    }
    return icons[status as keyof typeof icons] || <Clock className="w-4 h-4" />
  }

  return (
    <div className={`p-6 max-w-7xl mx-auto space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          🎭 Orquestrador de Avatar 3D Hiper-Realista
        </h1>
        <p className="text-muted-foreground mt-2">
          Sistema avançado de criação cinematográfica com pipeline modular
        </p>
      </div>

      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="create">Criar Avatar</TabsTrigger>
          <TabsTrigger value="monitor">Monitoramento</TabsTrigger>
          <TabsTrigger value="modules">Módulos</TabsTrigger>
          <TabsTrigger value="artifacts">Artefatos</TabsTrigger>
        </TabsList>

        {/* TAB: Criar Avatar */}
        <TabsContent value="create" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Configuração Básica */}
            <Card>
              <CardHeader>
                <CardTitle>Configuração Básica</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="avatar_name">Nome do Avatar</Label>
                  <Input
                    id="avatar_name"
                    value={formData.avatar_name || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, avatar_name: e.target.value }))}
                    placeholder="Ex: Dr. Silva - Especialista em Segurança"
                  />
                </div>

                <div>
                  <Label htmlFor="primary_image">URL da Imagem Principal</Label>
                  <Input
                    id="primary_image"
                    value={formData.primary_image_url || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, primary_image_url: e.target.value }))}
                    placeholder="https://upload.wikimedia.org/wikipedia/commons/7/74/Social_media_collection_2020s.png"
                  />
                </div>

                <div>
                  <Label htmlFor="target_style">Estilo do Avatar</Label>
                  <Select
                    value={formData.target_style || 'photorealistic'}
                    onValueChange={(value: 'photorealistic' | 'stylized') => 
                      setFormData(prev => ({ ...prev, target_style: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="photorealistic">Fotorrealista</SelectItem>
                      <SelectItem value="stylized">Estilizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="resolution">Resolução de Render</Label>
                  <Select
                    value={formData.render?.resolution || '4K'}
                    onValueChange={(value: '2K' | '4K' | '8K') => 
                      setFormData(prev => ({ 
                        ...prev, 
                        render: { ...prev.render!, resolution: value } 
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2K">2K (Rápido)</SelectItem>
                      <SelectItem value="4K">4K (Balanceado)</SelectItem>
                      <SelectItem value="8K">8K (Máxima Qualidade)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Configuração de Áudio */}
            <Card>
              <CardHeader>
                <CardTitle>Configuração de Áudio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="script">Texto/Script</Label>
                  <Textarea
                    id="script"
                    value={formData.script_text_or_ssml || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, script_text_or_ssml: e.target.value }))}
                    placeholder="Digite o texto que o avatar deve falar..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="voice">Voz TTS</Label>
                  <Select
                    value={formData.audio?.tts?.voice_name || 'pt-BR-AntonioNeural'}
                    onValueChange={(value) => 
                      setFormData(prev => ({ 
                        ...prev, 
                        audio: { 
                          ...prev.audio!, 
                          tts: { ...prev.audio!.tts!, voice_name: value } 
                        } 
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR-AntonioNeural">Antonio (Masculino)</SelectItem>
                      <SelectItem value="pt-BR-FranciscaNeural">Francisca (Feminino)</SelectItem>
                      <SelectItem value="pt-BR-DonatoNeural">Donato (Masculino)</SelectItem>
                      <SelectItem value="pt-BR-ElzaNeural">Elza (Feminino)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="lip_sync">Modo de Sincronização Labial</Label>
                  <Select
                    value={formData.lip_sync_mode || 'phoneme_align'}
                    onValueChange={(value: 'phoneme_align' | 'viseme_only' | 'simple_sync') => 
                      setFormData(prev => ({ ...prev, lip_sync_mode: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="phoneme_align">Alinhamento de Fonemas (Recomendado)</SelectItem>
                      <SelectItem value="viseme_only">Somente Visemas</SelectItem>
                      <SelectItem value="simple_sync">Sincronização Simples</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="phoneme_accuracy">Precisão de Fonemas</Label>
                  <Select
                    value={formData.phoneme_align_accuracy || 'high'}
                    onValueChange={(value: 'low' | 'medium' | 'high') => 
                      setFormData(prev => ({ ...prev, phoneme_align_accuracy: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa (Mais Rápido)</SelectItem>
                      <SelectItem value="medium">Média (Balanceado)</SelectItem>
                      <SelectItem value="high">Alta (Máxima Precisão)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Configurações Avançadas */}
          <Card>
            <CardHeader>
              <CardTitle>Configurações Avançadas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="microexpressions"
                    checked={formData.motion_profile?.microexpressions || false}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ 
                        ...prev, 
                        motion_profile: { ...prev.motion_profile!, microexpressions: checked } 
                      }))
                    }
                  />
                  <Label htmlFor="microexpressions">Micro-expressões</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="reuse_modules"
                    checked={formData.prefer_reuse_of_existing_modules || false}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, prefer_reuse_of_existing_modules: checked }))
                    }
                  />
                  <Label htmlFor="reuse_modules">Reutilizar Módulos</Label>
                </div>

                <div>
                  <Label htmlFor="emotion_type">Emoção Base</Label>
                  <Select
                    value={formData.emotion?.type || 'neutral'}
                    onValueChange={(value) => 
                      setFormData(prev => ({ 
                        ...prev, 
                        emotion: { ...prev.emotion!, type: value } 
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="neutral">Neutro</SelectItem>
                      <SelectItem value="happy">Alegre</SelectItem>
                      <SelectItem value="professional">Profissional</SelectItem>
                      <SelectItem value="serious">Sério</SelectItem>
                      <SelectItem value="friendly">Amigável</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Consentimento e Criação */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                Consentimento e Disclosure
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Aviso Importante:</strong> Este sistema criará um avatar digital baseado em sua imagem.
                  Isso pode ser considerado deepfake technology. Ao prosseguir, você confirma:
                </p>
                <ul className="list-disc list-inside mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                  <li>Você possui direitos sobre as imagens fornecidas</li>
                  <li>Você consente com a criação do avatar digital</li>
                  <li>Você usará o avatar de forma ética e legal</li>
                  <li>Você entende as implicações da tecnologia deepfake</li>
                </ul>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="consent"
                  checked={consentConfirmed}
                  onCheckedChange={setConsentConfirmed}
                />
                <Label htmlFor="consent" className="text-sm">
                  Eu confirmo que li e aceito todos os termos acima
                </Label>
              </div>

              <Button
                onClick={handleCreateAvatar}
                disabled={!consentConfirmed || isCreating || !formData.primary_image_url || !formData.script_text_or_ssml}
                className="w-full"
                size="lg"
              >
                {isCreating ? 'Criando Avatar...' : '🎭 Criar Avatar 3D Hiper-Realista'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Monitoramento */}
        <TabsContent value="monitor">
          {activeJob ? (
            <div className="space-y-6">
              {/* Status Geral */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Job: {activeJob.job_id}</span>
                    <Badge variant={
                      activeJob.job_status === 'completed' ? 'default' :
                      activeJob.job_status === 'failed' ? 'destructive' :
                      activeJob.job_status === 'awaiting_approval' ? 'secondary' : 'outline'
                    }>
                      {activeJob.job_status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total de Checkpoints</p>
                      <p className="text-2xl font-bold">{activeJob.checkpoints.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Concluídos</p>
                      <p className="text-2xl font-bold text-green-600">
                        {activeJob.checkpoints.filter(cp => cp.status === 'done').length}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Artefatos Gerados</p>
                      <p className="text-2xl font-bold text-blue-600">{activeJob.artifact_urls.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Checkpoints */}
              <Card>
                <CardHeader>
                  <CardTitle>Pipeline de Processamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activeJob.checkpoints.map((checkpoint, index) => (
                      <div key={checkpoint.stage} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${getStatusColor(checkpoint.status)}`} />
                            {getStatusIcon(checkpoint.status)}
                            <span className="font-medium capitalize">
                              {checkpoint.stage.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {checkpoint.status === 'done' && checkpoint.artifact_urls.length > 0 && (
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4 mr-1" />
                                Preview
                              </Button>
                            )}
                            {checkpoint.status === 'done' && activeJob.job_status === 'awaiting_approval' && (
                              <Button
                                onClick={() => handleApproveCheckpoint(checkpoint.stage)}
                                size="sm"
                              >
                                ✅ Aprovar
                              </Button>
                            )}
                          </div>
                        </div>

                        {checkpoint.status === 'running' && (
                          <Progress value={checkpoint.progress_percentage} className="mb-2" />
                        )}

                        <div className="text-sm text-muted-foreground space-y-1">
                          {checkpoint.logs.slice(-3).map((log, logIndex) => (
                            <p key={logIndex}>• {log}</p>
                          ))}
                        </div>

                        {checkpoint.artifact_urls.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {checkpoint.artifact_urls.map((url, urlIndex) => (
                              <Badge key={urlIndex} variant="outline">
                                {url.split('/').pop()}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Métricas de Qualidade */}
              {activeJob.metadata.quality_metrics && (
                <Card>
                  <CardHeader>
                    <CardTitle>Métricas de Qualidade</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Precisão Lip-Sync</p>
                        <p className="text-2xl font-bold text-green-600">
                          {activeJob.metadata.quality_metrics.lip_sync_accuracy}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Score de Expressões</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {activeJob.metadata.quality_metrics.facial_expression_score}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Fidelidade de Textura</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {activeJob.metadata.quality_metrics.texture_fidelity}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum job ativo. Crie um avatar para começar o monitoramento.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* TAB: Módulos */}
        <TabsContent value="modules">
          <div className="space-y-4">
            {activeJob?.modules_catalog.map((module, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{module.module_name}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        module.status === 'in_use' ? 'default' :
                        module.status === 'available' ? 'secondary' :
                        module.status === 'deprecated' ? 'destructive' : 'outline'
                      }>
                        {module.status}
                      </Badge>
                      <Badge variant="outline">
                        Score: {Math.round(module.readiness_score * 100)}%
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium mb-2">Capabilities:</p>
                      <div className="flex flex-wrap gap-1">
                        {module.capabilities.map((cap, capIndex) => (
                          <Badge key={capIndex} variant="outline" className="text-xs">
                            {cap.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="font-medium mb-2">API Endpoints:</p>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        {module.api_endpoints.map((endpoint, endIndex) => (
                          <p key={endIndex} className="font-mono bg-muted px-2 py-1 rounded">
                            {endpoint}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {module.integration_notes.length > 0 && (
                    <div className="mt-4">
                      <p className="font-medium mb-2">Notas de Integração:</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {module.integration_notes.map((note, noteIndex) => (
                          <li key={noteIndex}>• {note}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* TAB: Artefatos */}
        <TabsContent value="artifacts">
          {activeJob && activeJob.artifact_urls.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Artefatos Gerados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeJob.artifact_urls.map((url, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <p className="font-medium mb-2">{url.split('/').pop()}</p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          Preview
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Download className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum artefato gerado ainda. Complete a criação do avatar para ver os downloads.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
