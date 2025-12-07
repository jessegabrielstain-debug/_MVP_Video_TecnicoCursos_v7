'use client'

import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Loader2,
  AlertCircle 
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface PPTXFile {
  file: File
  id: string
  status: 'uploading' | 'processing' | 'completed' | 'error'
  progress: number
  projectId?: string
  errorMessage?: string
}

interface FunctionalPPTXUploaderProps {
  onUploadComplete?: (projectId: string, fileName: string) => void
  maxFiles?: number
  acceptedTypes?: string[]
}

export function FunctionalPPTXUploader({ 
  onUploadComplete,
  maxFiles = 5,
  acceptedTypes = ['.pptx', '.ppt', '.odp']
}: FunctionalPPTXUploaderProps) {
  const [files, setFiles] = useState<PPTXFile[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'uploading' as const,
      progress: 0
    }))

    setFiles(prev => [...prev, ...newFiles])
    
    // Processar cada arquivo
    newFiles.forEach(fileData => {
      uploadFile(fileData)
    })
  }, [])

  const uploadFile = async (fileData: PPTXFile) => {
    setIsUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('file', fileData.file)
      formData.append('type', 'pptx')
      formData.append('userId', 'demo-user')

      // Simular progresso de upload
      const updateProgress = (progress: number) => {
        setFiles(prev => prev.map(f => 
          f.id === fileData.id 
            ? { ...f, progress }
            : f
        ))
      }

      // Progresso simulado
      for (let progress = 0; progress <= 90; progress += 10) {
        updateProgress(progress)
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      // Fazer upload real
      const response = await fetch('/api/pptx/upload', {
        method: 'POST',
        body: formData
      })

      updateProgress(100)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        setFiles(prev => prev.map(f => 
          f.id === fileData.id 
            ? { 
                ...f, 
                status: 'completed',
                projectId: result.data?.projectId || result.projectId 
              }
            : f
        ))

        toast.success(`✅ ${fileData.file.name} processado com sucesso!`)
        
        if (onUploadComplete && result.data?.projectId) {
          onUploadComplete(result.data.projectId, fileData.file.name)
        }
      } else {
        throw new Error(result.message || 'Erro no upload')
      }

    } catch (error) {
      console.error('Erro no upload:', error)
      
      setFiles(prev => prev.map(f => 
        f.id === fileData.id 
          ? { 
              ...f, 
              status: 'error',
              errorMessage: error instanceof Error ? error.message : 'Erro desconhecido'
            }
          : f
      ))

      toast.error(`❌ Erro ao processar ${fileData.file.name}`)
    } finally {
      setIsUploading(false)
    }
  }

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const retryUpload = (fileId: string) => {
    const fileData = files.find(f => f.id === fileId)
    if (fileData) {
      setFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, status: 'uploading', progress: 0, errorMessage: undefined }
          : f
      ))
      uploadFile(fileData)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.oasis.opendocument.presentation': ['.odp']
    },
    maxFiles,
    maxSize: 50 * 1024 * 1024, // 50MB
    onDropRejected: (fileRejections) => {
      fileRejections.forEach(rejection => {
        const errorMessages = rejection.errors.map(e => e.message).join(', ')
        toast.error(`❌ ${rejection.file.name}: ${errorMessages}`)
      })
    }
  })

  const getStatusIcon = (status: PPTXFile['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: PPTXFile['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return 'bg-blue-500'
      case 'completed':
        return 'bg-green-500'
      case 'error':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Upload className="mr-2 h-5 w-5 text-blue-600" />
          Upload de Apresentações PPTX
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Zona de Drop */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          {isDragActive ? (
            <div>
              <h3 className="text-lg font-medium text-blue-600 mb-2">
                Solte os arquivos aqui...
              </h3>
              <p className="text-sm text-blue-500">
                Arquivos PPTX, PPT ou ODP até 50MB
              </p>
            </div>
          ) : (
            <div>
              <h3 className="text-lg font-medium mb-2">
                Arraste arquivos PPTX aqui
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Ou clique para selecionar (máximo {maxFiles} arquivos, até 50MB cada)
              </p>
              <Button variant="outline" disabled={isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Selecionar Arquivos
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Lista de Arquivos */}
        {files.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">
              Arquivos ({files.length})
            </h4>
            {files.map(fileData => (
              <div key={fileData.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(fileData.status)}
                    <div>
                      <p className="font-medium text-sm">{fileData.file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(fileData.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {fileData.status === 'error' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => retryUpload(fileData.id)}
                      >
                        Tentar Novamente
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFile(fileData.id)}
                    >
                      ✕
                    </Button>
                  </div>
                </div>

                {/* Barra de Progresso */}
                {(fileData.status === 'uploading' || fileData.status === 'processing') && (
                  <Progress 
                    value={fileData.progress} 
                    className={`h-2 ${getStatusColor(fileData.status)}`}
                  />
                )}

                {/* Mensagem de Erro */}
                {fileData.status === 'error' && fileData.errorMessage && (
                  <div className="flex items-center space-x-2 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{fileData.errorMessage}</span>
                  </div>
                )}

                {/* Status de Sucesso */}
                {fileData.status === 'completed' && fileData.projectId && (
                  <div className="flex items-center space-x-2 text-green-600 text-sm">
                    <CheckCircle className="h-4 w-4" />
                    <span>Processado com sucesso! ID: {fileData.projectId}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Resumo */}
        {files.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <div className="grid grid-cols-4 gap-4 text-center text-sm">
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-300">Total</p>
                <p className="text-lg font-bold">{files.length}</p>
              </div>
              <div>
                <p className="font-medium text-blue-600">Processando</p>
                <p className="text-lg font-bold text-blue-600">
                  {files.filter(f => f.status === 'uploading' || f.status === 'processing').length}
                </p>
              </div>
              <div>
                <p className="font-medium text-green-600">Concluídos</p>
                <p className="text-lg font-bold text-green-600">
                  {files.filter(f => f.status === 'completed').length}
                </p>
              </div>
              <div>
                <p className="font-medium text-red-600">Erros</p>
                <p className="text-lg font-bold text-red-600">
                  {files.filter(f => f.status === 'error').length}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}