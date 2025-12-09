'use client'

import { useState, useEffect } from 'react'
import { logger } from '@/lib/logger'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Progress } from '../ui/progress'
import { Separator } from '../ui/separator'
import { 
  Mic,
  Upload,
  Play,
  Pause,
  Volume2,
  Brain,
  Sparkles,
  Settings,
  Download,
  Share2,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  Zap,
  Users,
  Heart
} from 'lucide-react'
import { VoiceCloningSystem, VoiceProfile, VoiceCloneRequest, VoiceCloneAnalysis } from '../../lib/voice/voice-cloning-system'

interface TrainingProgress {
  job_id: string;
  progress: number;
  stage: string;
}

export default function VoiceCloningStudio() {
  const [voiceProfiles, setVoiceProfiles] = useState<VoiceProfile[]>([])
  const [selectedProfile, setSelectedProfile] = useState<VoiceProfile | null>(null)
  const [audioSamples, setAudioSamples] = useState<File[]>([])
  const [transcripts, setTranscripts] = useState<string[]>([])
  const [analysis, setAnalysis] = useState<VoiceCloneAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [trainingProgress, setTrainingProgress] = useState<TrainingProgress | null>(null)
  const [testText, setTestText] = useState('Olá! Esta é uma demonstração da minha voz clonada. Como você está hoje?')
  const [synthesizedAudio, setSynthesizedAudio] = useState<string | null>(null)

  useEffect(() => {
    loadVoiceProfiles()
  }, [])

  const loadVoiceProfiles = async () => {
    // Simular carregamento de perfis de voz
    const mockProfiles: VoiceProfile[] = [
      {
        id: 'voice-profile-1',
        name: 'Minha Voz - João Silva',
        owner_id: 'current-user',
        voice_characteristics: {
          gender: 'masculino',
          age_range: 'adulto',
          pitch_average: 125,
          speech_rate: 160,
          accent: 'brasileiro-neutro',
          emotional_range: ['neutral', 'happy', 'serious'],
          vocal_quality: 'clara'
        },
        training_data: {
          sample_count: 12,
          total_duration: 380,
          quality_score: 89,
          noise_level: 6,
          consistency_score: 92
        },
        model_metrics: {
          similarity_score: 91,
          naturalness_score: 87,
          intelligibility_score: 94,
          emotional_accuracy: 85,
          processing_quality: 'professional'
        },
        usage_rights: {
          commercial_use: true,
          modification_allowed: true,
          distribution_allowed: false,
          attribution_required: false
        },
        created_at: '2025-08-28T14:20:00Z',
        last_updated: '2025-08-29T09:15:00Z',
        status: 'ready'
      }
    ]
    
    setVoiceProfiles(mockProfiles)
    if (mockProfiles.length > 0) {
      setSelectedProfile(mockProfiles[0])
    }
  }

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return
    
    const audioFiles = Array.from(files).filter(file => 
      file.type.startsWith('audio/') && file.size < 10 * 1024 * 1024 // 10MB limit
    )
    
    setAudioSamples(prev => [...prev, ...audioFiles])
    setTranscripts(prev => [...prev, ...audioFiles.map(() => '')])
  }

  const handleAnalyzeSamples = async () => {
    if (audioSamples.length === 0) return

    setIsAnalyzing(true)
    try {
      const audioData = audioSamples.map((file, index) => ({
        url: URL.createObjectURL(file),
        transcript: transcripts[index]
      }))

      const analysisResult = await VoiceCloningSystem.analyzeAudioSamples(audioData)
      setAnalysis(analysisResult)
    } catch (error) {
      logger.error('Erro ao analisar samples', error instanceof Error ? error : new Error(String(error)), { component: 'VoiceCloningStudio' })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleStartTraining = async () => {
    if (!analysis || audioSamples.length === 0) return

    const cloneRequest: VoiceCloneRequest = {
      name: 'Minha Voz Personalizada',
      description: 'Clone criado para treinamentos corporativos',
      audio_samples: audioSamples.map((file, index) => ({
        file_url: URL.createObjectURL(file),
        transcript: transcripts[index],
        duration: 30, // estimate
        quality_rating: 4
      })),
      target_characteristics: {
        optimize_for: 'naturalness',
        emotional_presets: ['neutral', 'serious', 'happy'],
        speaking_style: 'formal'
      },
      usage_intent: 'corporate_training',
      privacy_settings: {
        share_with_team: false,
        public_showcase: false,
        data_retention_period: 24
      }
    }

    try {
      const trainingResult = await VoiceCloningSystem.createVoiceClone(cloneRequest)
      setTrainingProgress({
        job_id: trainingResult.training_job_id,
        progress: 0,
        stage: 'Iniciando...'
      })

      // Simular atualizações de progresso
      const progressInterval = setInterval(async () => {
        const status = await VoiceCloningSystem.processVoiceTraining(trainingResult.training_job_id)
        setTrainingProgress({
          job_id: trainingResult.training_job_id,
          progress: status.progress,
          stage: status.current_stage
        })

        if (status.progress >= 100) {
          clearInterval(progressInterval)
          if (status.voice_profile) {
            setVoiceProfiles(prev => [status.voice_profile!, ...prev])
            setSelectedProfile(status.voice_profile!)
          }
          setTrainingProgress(null)
        }
      }, 3000)

    } catch (error) {
      logger.error('Erro ao iniciar treinamento', error instanceof Error ? error : new Error(String(error)), { component: 'VoiceCloningStudio' })
    }
  }

  const handleTestVoice = async () => {
    if (!selectedProfile || !testText.trim()) return

    try {
      const synthesis = await VoiceCloningSystem.synthesizeSpeech({
        voice_profile_id: selectedProfile.id,
        text: testText,
        options: {
          emotion: 'neutral',
          speed: 1.0,
          pitch_adjustment: 0
        },
        output_format: 'mp3'
      })

      setSynthesizedAudio(synthesis.audio_url)
    } catch (error) {
      logger.error('Erro ao sintetizar voz', error instanceof Error ? error : new Error(String(error)), { component: 'VoiceCloningStudio', profileId: selectedProfile?.id })
    }
  }

  const removeAudioSample = (index: number) => {
    setAudioSamples(prev => prev.filter((_, i) => i !== index))
    setTranscripts(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Mic className="h-6 w-6 text-purple-600" />
            Voice Cloning Studio
          </h3>
          <p className="text-muted-foreground">
            Tecnologia avançada de clonagem de voz com IA neural
          </p>
        </div>
        <Badge variant="secondary" className="bg-purple-100 text-purple-700">
          Neural Technology
        </Badge>
      </div>

      <Tabs defaultValue="profiles" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profiles">Minhas Vozes</TabsTrigger>
          <TabsTrigger value="create">Criar Clone</TabsTrigger>
          <TabsTrigger value="test">Testar Voz</TabsTrigger>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
        </TabsList>

        {/* Perfis de Voz */}
        <TabsContent value="profiles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Seus Clones de Voz</CardTitle>
              <CardDescription>
                Gerencie seus perfis de voz personalizados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {voiceProfiles.length === 0 ? (
                <div className="text-center py-12">
                  <Mic className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h4 className="font-semibold mb-2">Nenhum clone de voz ainda</h4>
                  <p className="text-sm text-muted-foreground mb-6">
                    Crie seu primeiro clone personalizado
                  </p>
                  <Button>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Criar Primeiro Clone
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {voiceProfiles.map((profile) => (
                    <Card key={profile.id} className="relative">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium">{profile.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {profile.voice_characteristics.gender} • {profile.voice_characteristics.age_range} • {profile.voice_characteristics.accent}
                            </p>
                          </div>
                          <Badge 
                            variant={profile.status === 'ready' ? 'default' : 'secondary'}
                            className="flex items-center gap-1"
                          >
                            {profile.status === 'ready' ? (
                              <CheckCircle className="h-3 w-3" />
                            ) : (
                              <Clock className="h-3 w-3" />
                            )}
                            {profile.status}
                          </Badge>
                        </div>

                        {/* Métricas de Qualidade */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                          <div className="text-center">
                            <div className="text-lg font-bold text-blue-600">
                              {profile.model_metrics.similarity_score}%
                            </div>
                            <div className="text-xs text-muted-foreground">Similaridade</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-green-600">
                              {profile.model_metrics.naturalness_score}%
                            </div>
                            <div className="text-xs text-muted-foreground">Naturalidade</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-purple-600">
                              {profile.model_metrics.intelligibility_score}%
                            </div>
                            <div className="text-xs text-muted-foreground">Clareza</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-orange-600">
                              {profile.training_data.sample_count}
                            </div>
                            <div className="text-xs text-muted-foreground">Samples</div>
                          </div>
                        </div>

                        {/* Dados de Treinamento */}
                        <div className="bg-muted/50 rounded-lg p-3 mb-3">
                          <div className="grid grid-cols-3 gap-3 text-xs">
                            <div>
                              <span className="font-medium">Duração Total:</span>
                              <p>{Math.round(profile.training_data.total_duration / 60)}min</p>
                            </div>
                            <div>
                              <span className="font-medium">Qualidade:</span>
                              <p>{profile.training_data.quality_score}%</p>
                            </div>
                            <div>
                              <span className="font-medium">Consistência:</span>
                              <p>{profile.training_data.consistency_score}%</p>
                            </div>
                          </div>
                        </div>

                        {/* Ações */}
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline">
                            <Play className="h-3 w-3 mr-1" />
                            Preview
                          </Button>
                          <Button size="sm" variant="outline">
                            <Settings className="h-3 w-3 mr-1" />
                            Configurar
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="h-3 w-3 mr-1" />
                            Exportar
                          </Button>
                          <Button size="sm" variant="outline">
                            <Share2 className="h-3 w-3 mr-1" />
                            Compartilhar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Criar Clone */}
        <TabsContent value="create" className="space-y-6">
          
          {/* Upload de Amostras */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload de Amostras de Áudio
              </CardTitle>
              <CardDescription>
                Faça upload de 5-15 amostras de áudio para melhor qualidade
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Área de Upload */}
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <input
                  type="file"
                  multiple
                  accept="audio/*"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                  id="audio-upload"
                />
                <label htmlFor="audio-upload" className="cursor-pointer">
                  <Mic className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm font-medium mb-2">Clique para fazer upload</p>
                  <p className="text-xs text-muted-foreground">
                    Formatos: MP3, WAV, M4A • Máximo: 10MB por arquivo
                  </p>
                </label>
              </div>

              {/* Lista de Amostras */}
              {audioSamples.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium">Amostras Enviadas ({audioSamples.length})</h4>
                  {audioSamples.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <Volume2 className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Transcrição do áudio..."
                          value={transcripts[index]}
                          onChange={(e) => {
                            const newTranscripts = [...transcripts]
                            newTranscripts[index] = e.target.value
                            setTranscripts(newTranscripts)
                          }}
                          className="w-48 text-xs"
                        />
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => removeAudioSample(index)}
                        >
                          ✕
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Análise */}
              {audioSamples.length > 0 && (
                <div className="flex gap-2">
                  <Button 
                    onClick={handleAnalyzeSamples}
                    disabled={isAnalyzing || audioSamples.length === 0}
                    className="flex-1"
                  >
                    {isAnalyzing ? (
                      <>
                        <Brain className="h-4 w-4 mr-2 animate-pulse" />
                        Analisando...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4 mr-2" />
                        Analisar Qualidade
                      </>
                    )}
                  </Button>
                  
                  {analysis && (
                    <Button 
                      onClick={handleStartTraining}
                      disabled={!!trainingProgress}
                      className="flex-1 bg-purple-600"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Criar Clone
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Análise de Qualidade */}
          {analysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Análise de Qualidade
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Métricas de Qualidade */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {(Object.entries(analysis.input_quality) as [string, number][]).map(([metric, score]) => (
                    <div key={metric} className="text-center">
                      <div className={`text-lg font-bold ${
                        score > 80 ? 'text-green-600' : 
                        score > 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {score}%
                      </div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {metric.replace('_', ' ')}
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Recomendações */}
                <div className="space-y-3">
                  <h4 className="font-medium">Recomendações</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <h5 className="text-sm font-medium mb-2">Para Melhorar:</h5>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {analysis.recommendations.add_more_samples && (
                          <li>• Adicionar mais amostras (mín. 10)</li>
                        )}
                        {analysis.recommendations.improve_audio_quality && (
                          <li>• Melhorar qualidade do áudio</li>
                        )}
                        {analysis.recommendations.record_specific_emotions.map(emotion => (
                          <li key={emotion}>• Gravar com emoção: {emotion}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium mb-2">Previsões:</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Similaridade esperada:</span>
                          <span className="font-medium">{analysis.estimated_results.similarity_prediction}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tempo de treinamento:</span>
                          <span className="font-medium">{analysis.estimated_results.training_time_estimate}min</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Chance de sucesso:</span>
                          <span className="font-medium">{analysis.estimated_results.success_probability}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Progresso do Treinamento */}
          {trainingProgress && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-600 animate-pulse" />
                  Treinando Clone de Voz
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{trainingProgress.stage}</span>
                    <span>{trainingProgress.progress}%</span>
                  </div>
                  <Progress value={trainingProgress.progress} className="h-3" />
                </div>
                
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-sm text-blue-700">
                    <strong>Dica:</strong> O treinamento pode levar alguns minutos. Você pode fechar esta aba e voltar depois.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Testar Voz */}
        <TabsContent value="test" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Testar Clone de Voz
              </CardTitle>
              <CardDescription>
                Digite um texto para ouvir com sua voz clonada
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Seleção de Voz */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Perfil de Voz</label>
                <Select 
                  value={selectedProfile?.id || ''}
                  onValueChange={(value) => {
                    const profile = voiceProfiles.find(p => p.id === value)
                    setSelectedProfile(profile || null)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um perfil de voz" />
                  </SelectTrigger>
                  <SelectContent>
                    {voiceProfiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.name} ({profile.model_metrics.similarity_score}% similaridade)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Texto para Teste */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Texto para Síntese</label>
                <Textarea
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  placeholder="Digite o texto que você quer ouvir com sua voz clonada..."
                  rows={4}
                />
              </div>

              {/* Configurações de Síntese */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Emoção</label>
                  <Select defaultValue="neutral">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="neutral">😐 Neutro</SelectItem>
                      <SelectItem value="happy">😊 Feliz</SelectItem>
                      <SelectItem value="serious">😤 Sério</SelectItem>
                      <SelectItem value="excited">🤩 Animado</SelectItem>
                      <SelectItem value="calm">😌 Calmo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Velocidade</label>
                  <Select defaultValue="1.0">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.8">0.8x (Mais Lenta)</SelectItem>
                      <SelectItem value="1.0">1.0x (Normal)</SelectItem>
                      <SelectItem value="1.2">1.2x (Mais Rápida)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tom</label>
                  <Select defaultValue="0">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="-10">Mais Grave</SelectItem>
                      <SelectItem value="0">Normal</SelectItem>
                      <SelectItem value="10">Mais Agudo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Botão de Síntese */}
              <Button 
                onClick={handleTestVoice}
                disabled={!selectedProfile || !testText.trim()}
                className="w-full"
              >
                <Volume2 className="h-4 w-4 mr-2" />
                Gerar Áudio com Clone
              </Button>

              {/* Player de Resultado */}
              {synthesizedAudio && (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div className="flex-1">
                        <h4 className="font-medium">Áudio Gerado com Sucesso!</h4>
                        <p className="text-sm text-muted-foreground">
                          Clone: {selectedProfile?.name}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Play className="h-3 w-3 mr-1" />
                          Reproduzir
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Marketplace */}
        <TabsContent value="marketplace" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Marketplace de Vozes
              </CardTitle>
              <CardDescription>
                Descubra vozes profissionais criadas pela comunidade
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Heart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h4 className="font-semibold mb-2">Marketplace em Desenvolvimento</h4>
                <p className="text-sm text-muted-foreground mb-6">
                  Em breve você poderá comprar e vender clones de voz profissionais
                </p>
                
                <div className="space-y-3 max-w-md mx-auto">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Vozes profissionais verificadas</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Licenciamento comercial</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Preços competitivos</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Suporte técnico incluso</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

