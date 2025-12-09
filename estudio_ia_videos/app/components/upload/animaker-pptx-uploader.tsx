/**
 * 📁 Animaker PPTX Uploader
 * Upload especializado para parser Animaker com preview em tempo real
 */

'use client'

import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { logger } from '@/lib/logger'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Play,
  Eye,
  Sparkles,
  Layers,
  Clock
} from 'lucide-react'
import { AnimakerProject } from '@/lib/pptx-parser-animaker'

interface AnimakerPPTXUploaderProps {
  onProjectCreated?: (project: AnimakerProject) => void
  onCancel?: () => void
}

interface UploadState {
  status: 'idle' | 'uploading' | 'parsing' | 'completed' | 'error'
  progress: number
  error?: string
  project?: AnimakerProject
  stats?: {
    fileName: string
    fileSize: number
    processingTime: number
    slidesCount: number
    elementsCount: number
    imagesCount: number
    totalDuration: number
  }
}

export function AnimakerPPTXUploader({ onProjectCreated, onCancel }: AnimakerPPTXUploaderProps) {
  const router = useRouter()
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    progress: 0
  })

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    logger.debug('Arquivo selecionado', { component: 'AnimakerPPTXUploader', fileName: file.name, fileSize: file.size })
    await processFile(file)
  }, [])

  const processFile = async (file: File) => {
    try {
      // Step 1: Validações
      setUploadState({
        status: 'uploading',
        progress: 10
      })
      
      if (!file.name.endsWith('.pptx') && !file.name.endsWith('.ppt')) {
        throw new Error('Tipo de arquivo inválido. Use arquivos .pptx ou .ppt')
      }

      if (file.size > 100 * 1024 * 1024) { // 100MB
        throw new Error('Arquivo muito grande. Máximo 100MB')
      }

      // Step 2: Upload para parsing
      setUploadState(prev => ({
        ...prev,
        progress: 30
      }))

      const formData = new FormData()
      formData.append('file', file)
      
      toast.loading('Processando PPTX com parser avançado...', { id: 'parsing' })
      
      const response = await fetch('/api/pptx/parse-animaker', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `HTTP Error: ${response.status}`)
      }

      // Step 3: Parsing completo
      setUploadState(prev => ({
        ...prev,
        status: 'parsing',
        progress: 70
      }))

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Erro no parsing PPTX')
      }

      // Step 4: Finalização
      setUploadState({
        status: 'completed',
        progress: 100,
        project: result.data.project,
        stats: result.data.stats
      })

      toast.success(
        `🎉 PPTX processado! ${result.data.stats.slidesCount} slides importados`,
        { id: 'parsing' }
      )
      
      // Callback opcional
      if (onProjectCreated) {
        onProjectCreated(result.data.project)
      }

    } catch (error) {
      logger.error('Erro no processamento PPTX', error instanceof Error ? error : new Error(String(error)), { component: 'AnimakerPPTXUploader' })
      
      setUploadState({
        status: 'error',
        progress: 0,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      })
      
      toast.error(
        error instanceof Error ? error.message : 'Erro no processamento',
        { id: 'parsing' }
      )
    }
  }

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/vnd.ms-powerpoint': ['.ppt']
    },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024, // 100MB
    multiple: false
  })

  const handleOpenEditor = () => {
    if (uploadState.project) {
      // Salvar projeto temporariamente e redirecionar
      const projectId = uploadState.project.id
      localStorage.setItem(`project_${projectId}`, JSON.stringify(uploadState.project))
      router.push(`/pptx-editor-animaker?projectId=${projectId}`)
    }
  }

  const handleReset = () => {
    setUploadState({
      status: 'idle',
      progress: 0
    })
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-purple-500" />
          Upload PPTX para Editor Animaker
        </CardTitle>
        <p className="text-sm text-gray-600">
          Parser avançado com extração de elementos interativos e timeline multicamadas
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Upload Area */}
        {uploadState.status === 'idle' && (
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer
              ${isDragActive && !isDragReject ? 'border-purple-500 bg-purple-50' : ''}
              ${isDragReject ? 'border-red-500 bg-red-50' : ''}
              ${!isDragActive ? 'border-gray-300 hover:border-gray-400' : ''}
            `}
          >
            <input {...getInputProps()} />
            <div className="space-y-3">
              <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                <Upload className="h-8 w-8 text-purple-500" />
              </div>
              
              {isDragActive ? (
                isDragReject ? (
                  <p className="text-red-600 font-medium">Tipo de arquivo não suportado</p>
                ) : (
                  <p className="text-purple-600 font-medium">Solte o arquivo PPTX aqui...</p>
                )
              ) : (
                <>
                  <h3 className="text-lg font-semibold">Arraste um arquivo PPTX aqui</h3>
                  <p className="text-gray-500">
                    ou clique para selecionar • Máximo 100MB
                  </p>
                  
                  <div className="flex justify-center gap-2 mt-4">
                    <Badge variant="secondary">.pptx</Badge>
                    <Badge variant="secondary">.ppt</Badge>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Processing */}
        {(uploadState.status === 'uploading' || uploadState.status === 'parsing') && (
          <div className="space-y-4">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-purple-500 mb-4" />
              <h3 className="text-lg font-semibold">
                {uploadState.status === 'uploading' ? 'Fazendo Upload...' : 'Processando PPTX...'}
              </h3>
              <p className="text-gray-600 mt-2">
                {uploadState.status === 'uploading' 
                  ? 'Enviando arquivo para processamento'
                  : 'Extraindo elementos e criando timeline interativo'
                }
              </p>
            </div>
            
            <Progress value={uploadState.progress} className="h-3" />
            
            <div className="text-center">
              <span className="text-sm font-medium">{uploadState.progress}%</span>
            </div>
          </div>
        )}

        {/* Error */}
        {uploadState.status === 'error' && (
          <Alert className="border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-700">
              <div className="font-medium mb-2">Erro no processamento</div>
              <p>{uploadState.error}</p>
              
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="outline" onClick={handleReset}>
                  Tentar Novamente
                </Button>
                {onCancel && (
                  <Button size="sm" variant="ghost" onClick={onCancel}>
                    Cancelar
                  </Button>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Success */}
        {uploadState.status === 'completed' && uploadState.project && uploadState.stats && (
          <div className="space-y-6">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700">
                <div className="font-medium mb-2">🎉 PPTX processado com sucesso!</div>
                <p>Projeto pronto para edição no editor Animaker</p>
              </AlertDescription>
            </Alert>

            {/* Project Preview */}
            <Card className="bg-gradient-to-r from-purple-50 to-blue-50">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {uploadState.project.metadata.title}
                    </h3>
                    <p className="text-gray-600 mt-1">
                      Projeto importado em {new Date(uploadState.project.metadata.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge className="bg-purple-100 text-purple-700">
                    Projeto Animaker
                  </Badge>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-2">
                      <Layers className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="font-semibold text-lg">{uploadState.stats.slidesCount}</div>
                    <div className="text-sm text-gray-600">Slides</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-2">
                      <Sparkles className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="font-semibold text-lg">{uploadState.stats.elementsCount}</div>
                    <div className="text-sm text-gray-600">Elementos</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-2">
                      <Eye className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="font-semibold text-lg">{uploadState.stats.imagesCount}</div>
                    <div className="text-sm text-gray-600">Imagens</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mx-auto mb-2">
                      <Clock className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="font-semibold text-lg">{Math.floor(uploadState.stats.totalDuration)}s</div>
                    <div className="text-sm text-gray-600">Duração</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button 
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                    onClick={handleOpenEditor}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Abrir no Editor Animaker
                  </Button>
                  
                  <Button variant="outline" onClick={handleReset}>
                    Processar Outro
                  </Button>
                  
                  {onCancel && (
                    <Button variant="ghost" onClick={onCancel}>
                      Cancelar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Info Footer */}
        <div className="text-center text-sm text-gray-500 pt-4 border-t">
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <span>✅ Elementos interativos</span>
            <span>✅ Timeline multicamadas</span>
            <span>✅ Animações preservadas</span>
            <span>✅ Assets organizados</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
