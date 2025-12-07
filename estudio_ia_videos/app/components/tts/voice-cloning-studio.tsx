
'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  Upload, 
  Mic, 
  FileAudio, 
  CheckCircle, 
  XCircle, 
  Clock,
  Star,
  Sparkles,
  Wand2,
  AlertCircle,
  Play,
  Trash2
} from 'lucide-react'
import ElevenLabsService from '@/lib/elevenlabs-service'

interface AudioFile {
  id: string
  file: File
  name: string
  size: number
  duration: number
  status: 'pending' | 'analyzing' | 'valid' | 'invalid'
  error?: string
}

interface CloningProject {
  id: string
  name: string
  description: string
  status: 'preparing' | 'training' | 'complete' | 'error'
  progress: number
  voice_id?: string
  error?: string
}

export default function VoiceCloningStudio() {
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([])
  const [cloningProject, setCloningProject] = useState<CloningProject | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // Dados do projeto de clonagem
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')

  const elevenLabsService = ElevenLabsService.getInstance()

  // Análise de qualidade de áudio
  const analyzeAudioFile = async (file: File): Promise<{ valid: boolean; duration: number; error?: string }> => {
    return new Promise((resolve) => {
      const audio = new Audio(URL.createObjectURL(file))
      
      audio.onloadedmetadata = () => {
        const duration = audio.duration
        
        // Validações
        if (duration < 30) {
          resolve({ valid: false, duration, error: 'Áudio muito curto. Mínimo 30 segundos.' })
          return
        }
        
        if (duration > 300) {
          resolve({ valid: false, duration, error: 'Áudio muito longo. Máximo 5 minutos.' })
          return
        }
        
        if (file.size > 25 * 1024 * 1024) { // 25MB
          resolve({ valid: false, duration, error: 'Arquivo muito grande. Máximo 25MB.' })
          return
        }
        
        resolve({ valid: true, duration })
      }
      
      audio.onerror = () => {
        resolve({ valid: false, duration: 0, error: 'Formato de áudio inválido.' })
      }
    })
  }

  // Handler para drag & drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('audio/') || 
      file.name.toLowerCase().endsWith('.mp3') ||
      file.name.toLowerCase().endsWith('.wav') ||
      file.name.toLowerCase().endsWith('.m4a')
    )
    
    await processFiles(files)
  }, [])

  // Processar arquivos de áudio
  const processFiles = async (files: File[]) => {
    setIsUploading(true)
    
    for (const file of files) {
      const fileId = `${Date.now()}-${file.name}`
      
      // Adicionar arquivo na lista
      const newFile: AudioFile = {
        id: fileId,
        file,
        name: file.name,
        size: file.size,
        duration: 0,
        status: 'analyzing'
      }
      
      setAudioFiles(prev => [...prev, newFile])
      
      // Analisar qualidade do áudio
      const analysis = await analyzeAudioFile(file)
      
      setAudioFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { 
              ...f, 
              duration: analysis.duration,
              status: analysis.valid ? 'valid' : 'invalid',
              error: analysis.error
            }
          : f
      ))
    }
    
    setIsUploading(false)
  }

  // Handler para input de arquivo
  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    await processFiles(files)
  }

  // Remover arquivo
  const removeFile = (fileId: string) => {
    setAudioFiles(prev => prev.filter(f => f.id !== fileId))
  }

  // Reproduzir amostra
  const playAudioSample = (file: File) => {
    const audio = new Audio(URL.createObjectURL(file))
    audio.play()
  }

  // Iniciar clonagem de voz
  const startVoiceCloning = async () => {
    if (!projectName.trim() || !projectDescription.trim()) {
      return
    }
    
    const validFiles = audioFiles.filter(f => f.status === 'valid')
    if (validFiles.length === 0) {
      return
    }

    try {
      const project: CloningProject = {
        id: `${Date.now()}`,
        name: projectName.trim(),
        description: projectDescription.trim(),
        status: 'preparing',
        progress: 0
      }
      
      setCloningProject(project)
      
      // Simular progresso
      const progressInterval = setInterval(() => {
        setCloningProject(prev => {
          if (!prev) return null
          
          const newProgress = Math.min(prev.progress + Math.random() * 15, 90)
          
          if (newProgress >= 90) {
            clearInterval(progressInterval)
            
            // Iniciar clonagem real
            elevenLabsService.cloneVoice(
              project.name,
              project.description,
              validFiles.map(f => f.file)
            ).then((result: any) => {
              setCloningProject(prev => prev ? {
                ...prev,
                status: 'complete',
                progress: 100,
                voice_id: result.voice_id
              } : null)
            }).catch((error: any) => {
              setCloningProject(prev => prev ? {
                ...prev,
                status: 'error',
                progress: 100,
                error: 'Erro ao processar clonagem de voz.'
              } : null)
            })
            
            return {
              ...prev,
              status: 'training',
              progress: newProgress
            }
          }
          
          return {
            ...prev,
            progress: newProgress
          }
        })
      }, 2000)
      
    } catch (error) {
      setCloningProject(prev => prev ? {
        ...prev,
        status: 'error',
        error: 'Erro ao iniciar clonagem de voz.'
      } : null)
    }
  }

  // Formatação de tamanho de arquivo
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Formatação de duração
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const validFilesCount = audioFiles.filter(f => f.status === 'valid').length
  const totalDuration = audioFiles
    .filter(f => f.status === 'valid')
    .reduce((sum, f) => sum + f.duration, 0)

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Wand2 className="h-8 w-8 text-purple-600" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Voice Cloning Studio
          </h1>
          <Badge variant="secondary" className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700">
            AI Powered
          </Badge>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Clone qualquer voz com inteligência artificial. Carregue amostras de áudio e crie vozes personalizadas para seus vídeos educativos.
        </p>
      </div>

      {!cloningProject ? (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Painel de Upload */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload de Amostras de Áudio
                </CardTitle>
                <CardDescription>
                  Carregue 3-10 amostras de áudio (30s - 5min cada) da voz que deseja clonar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Zona de Upload */}
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                    isDragOver
                      ? 'border-purple-400 bg-purple-50'
                      : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <FileAudio className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Arraste arquivos de áudio aqui
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    ou clique para selecionar arquivos
                  </p>
                  <Input
                    type="file"
                    multiple
                    accept="audio/*,.mp3,.wav,.m4a"
                    onChange={handleFileInput}
                    className="hidden"
                    id="audio-upload"
                  />
                  <Label htmlFor="audio-upload">
                    <Button variant="outline" className="cursor-pointer" asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        Selecionar Arquivos
                      </span>
                    </Button>
                  </Label>
                </div>

                {/* Requisitos */}
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <strong>Requisitos:</strong> Audio claro e limpo, 30s-5min por arquivo, 
                    máximo 25MB, formato MP3/WAV/M4A, mesma pessoa falando
                  </AlertDescription>
                </Alert>

                {/* Lista de Arquivos */}
                {audioFiles.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Arquivos Carregados</h4>
                      <Badge variant="outline">
                        {validFilesCount} de {audioFiles.length} válidos
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {audioFiles.map((audioFile) => (
                        <Card key={audioFile.id} className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="flex-shrink-0">
                                {audioFile.status === 'analyzing' && (
                                  <Clock className="h-4 w-4 text-yellow-500 animate-spin" />
                                )}
                                {audioFile.status === 'valid' && (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                )}
                                {audioFile.status === 'invalid' && (
                                  <XCircle className="h-4 w-4 text-red-500" />
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{audioFile.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatFileSize(audioFile.size)}
                                  {audioFile.duration > 0 && ` • ${formatDuration(audioFile.duration)}`}
                                </p>
                                {audioFile.error && (
                                  <p className="text-xs text-red-600">{audioFile.error}</p>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              {audioFile.status === 'valid' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => playAudioSample(audioFile.file)}
                                >
                                  <Play className="h-3 w-3" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(audioFile.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {isUploading && (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Analisando qualidade do áudio...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Painel de Configuração */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="h-5 w-5" />
                  Configuração do Projeto
                </CardTitle>
                <CardDescription>
                  Configure os detalhes da voz clonada
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Nome do Projeto */}
                <div className="space-y-2">
                  <Label>Nome da Voz</Label>
                  <Input
                    placeholder="Ex: João - Narrador Corporativo"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                  />
                </div>

                {/* Descrição */}
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    placeholder="Descreva as características da voz, contexto de uso, etc."
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    className="resize-none h-24"
                  />
                </div>

                <Separator />

                {/* Estatísticas */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Estatísticas do Projeto
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {validFilesCount}
                      </div>
                      <div className="text-muted-foreground">Amostras Válidas</div>
                    </div>
                    
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {formatDuration(totalDuration)}
                      </div>
                      <div className="text-muted-foreground">Duração Total</div>
                    </div>
                  </div>
                </div>

                {/* Botão de Clonagem */}
                <Button
                  onClick={startVoiceCloning}
                  disabled={
                    !projectName.trim() || 
                    !projectDescription.trim() || 
                    validFilesCount < 1 ||
                    totalDuration < 60
                  }
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Iniciar Clonagem de Voz
                </Button>

                {/* Alertas de Validação */}
                {totalDuration > 0 && totalDuration < 60 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      Duração mínima recomendada: 60 segundos de áudio válido
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* Painel de Progresso da Clonagem */
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Wand2 className="h-6 w-6" />
              {cloningProject.status === 'preparing' && 'Preparando Clonagem...'}
              {cloningProject.status === 'training' && 'Treinando Modelo de Voz...'}
              {cloningProject.status === 'complete' && 'Clonagem Concluída!'}
              {cloningProject.status === 'error' && 'Erro na Clonagem'}
            </CardTitle>
            <CardDescription>
              Projeto: {cloningProject.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Barra de Progresso */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso</span>
                <span>{cloningProject.progress.toFixed(0)}%</span>
              </div>
              <Progress value={cloningProject.progress} className="w-full" />
            </div>

            {/* Status Messages */}
            <div className="text-center space-y-2">
              {cloningProject.status === 'preparing' && (
                <p className="text-muted-foreground">
                  Analisando amostras de áudio e preparando modelo...
                </p>
              )}
              {cloningProject.status === 'training' && (
                <p className="text-muted-foreground">
                  Treinando modelo de inteligência artificial com suas amostras...
                </p>
              )}
              {cloningProject.status === 'complete' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Voz clonada com sucesso!</span>
                  </div>
                  <p className="text-muted-foreground">
                    Sua voz personalizada está pronta para uso no Professional Voice Studio
                  </p>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    ID: {cloningProject.voice_id}
                  </Badge>
                </div>
              )}
              {cloningProject.status === 'error' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 text-red-600">
                    <XCircle className="h-5 w-5" />
                    <span className="font-medium">Falha na clonagem</span>
                  </div>
                  <p className="text-red-600 text-sm">
                    {cloningProject.error}
                  </p>
                </div>
              )}
            </div>

            {/* Ações */}
            <div className="flex justify-center gap-3">
              {cloningProject.status === 'complete' && (
                <Button
                  onClick={() => {
                    setCloningProject(null)
                    setAudioFiles([])
                    setProjectName('')
                    setProjectDescription('')
                  }}
                  variant="outline"
                >
                  Criar Nova Clonagem
                </Button>
              )}
              
              {(cloningProject.status === 'error' || cloningProject.status === 'complete') && (
                <Button
                  onClick={() => {
                    setCloningProject(null)
                    setAudioFiles([])
                    setProjectName('')
                    setProjectDescription('')
                  }}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  Voltar ao Estúdio
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
