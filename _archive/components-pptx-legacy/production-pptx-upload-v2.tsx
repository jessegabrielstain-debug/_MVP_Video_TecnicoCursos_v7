
"use client"

/**
 * Production PPTX Upload V2 - Complete S3 Integration
 * Real upload with progress tracking and processing
 */

import React, { useCallback, useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { toast } from 'react-hot-toast'
import { 
  Upload, 
  File, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Loader2,
  FileText,
  Image,
  Clock,
  Download,
  Play,
  Settings,
  Zap
} from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import 'react-circular-progressbar/dist/styles.css'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'

interface UploadedFile {
  id: string
  status: 'uploading' | 'uploaded' | 'processing' | 'completed' | 'error'
  progress: number
  error?: string
  result?: ProcessedResult
  // File properties
  name: string
  size: number
  type: string
  lastModified: number
  file: File
  // S3 properties
  s3Key?: string
  jobId?: string
}

interface ProcessedResult {
  slides: Array<{
    id: string
    title: string
    content: string
    images: number
    duration: number
  }>
  totalDuration: number
  slideCount: number
  imageCount: number
  hasAnimations: boolean
}

interface ProductionPPTXUploadV2Props {
  onProcessComplete?: (data: any) => void
  onCancel?: () => void
  maxFiles?: number
  acceptedTypes?: string[]
}

export function ProductionPPTXUploadV2({ 
  onProcessComplete, 
  onCancel,
  maxFiles = 5,
  acceptedTypes = ['.pptx', '.ppt', '.pdf']
}: ProductionPPTXUploadV2Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])

  const search = useMemo(() => searchParams?.toString() ?? '', [searchParams])
  const redirectTarget = useMemo(() => {
    const basePath = pathname || '/pptx-upload-production-test'
    return search ? `${basePath}?${search}` : basePath
  }, [pathname, search])
  const loginHref = useMemo(
    () => `/login?redirect=${encodeURIComponent(redirectTarget)}`,
    [redirectTarget]
  )
  const canUpload = !!user && !authLoading

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user) {
      toast.error('Faça login para enviar apresentações PPTX.')
      router.push(loginHref)
      return
    }

    console.log('📁 Files dropped:', acceptedFiles.length)
    
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      id: crypto.randomUUID(),
      status: 'uploading' as const,
      progress: 0,
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      file
    }))
    
    setUploadedFiles(prev => [...prev, ...newFiles])
    
    // Process each file
    for (const fileObj of newFiles) {
      await processFile(fileObj)
    }
  }, [loginHref, router, user])

  const processFile = async (fileObj: UploadedFile) => {
    try {
      // Update to uploading
      updateFileStatus(fileObj.id, 'uploading', 10)
      
      // Create FormData for upload
      const formData = new FormData()
      formData.append('file', fileObj.file)
      
      // Upload to S3
      updateFileStatus(fileObj.id, 'uploading', 50)
      
      // Get auth token
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      if (!token) {
        console.warn('⚠️ No auth token found in session')
      } else {
        console.log('🔑 Auth token found, length:', token.length)
      }

      const headers: Record<string, string> = {}
      if (token) headers['Authorization'] = `Bearer ${token}`

      const uploadResponse = await fetch('/api/v1/pptx/upload-production', {
        method: 'POST',
        headers,
        body: formData,
        credentials: 'include'
      })
      
      if (!uploadResponse.ok) {
        const error = await uploadResponse.json()
        throw new Error(error.error || 'Erro no upload')
      }
      
      const uploadResult = await uploadResponse.json()
      console.log('✅ Upload successful:', uploadResult)
      
      // Update file with S3 info
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileObj.id 
          ? { 
              ...f, 
              status: 'uploaded',
              progress: 100,
              s3Key: uploadResult.job.s3Key,
              jobId: uploadResult.job.id
            }
          : f
      ))
      
      // Start processing
      await processFileContent(fileObj.id, uploadResult.job.s3Key, uploadResult.job.id)
      
    } catch (error) {
      console.error('File processing error:', error)
      updateFileStatus(
        fileObj.id, 
        'error', 
        0, 
        error instanceof Error ? error.message : 'Erro desconhecido'
      )
      toast.error(`Erro ao processar ${fileObj.name}`)
    }
  }

  const processFileContent = async (fileId: string, s3Key: string, jobId: string) => {
    try {
      updateFileStatus(fileId, 'processing', 0)
      
      // Get auth token
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      if (token) headers['Authorization'] = `Bearer ${token}`
      else console.warn('⚠️ No auth token found while processing PPTX job')

      // Process content
      const processResponse = await fetch('/api/v1/pptx/process-production', {
        method: 'POST',
        headers,
        body: JSON.stringify({ s3Key, jobId }),
        credentials: 'include'
      })
      
      if (!processResponse.ok) {
        const error = await processResponse.json()
        throw new Error(error.error || 'Erro no processamento')
      }
      
      const processResult = await processResponse.json()
      console.log('✅ Processing successful:', processResult)
      
      // Update with results
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { 
              ...f, 
              status: 'completed',
              progress: 100,
              result: {
                slides: processResult.data.slides.map((slide: any) => ({
                  id: slide.id,
                  title: slide.title,
                  content: slide.content,
                  images: slide.images.length,
                  duration: slide.duration
                })),
                totalDuration: processResult.data.totalDuration,
                slideCount: processResult.data.slides.length,
                imageCount: processResult.data.slides.reduce((acc: number, slide: any) => acc + slide.images.length, 0),
                hasAnimations: processResult.data.slides.some((slide: any) => slide.animations.length > 0)
              }
            }
          : f
      ))
      
      toast.success(`Processamento concluído: ${processResult.data.slides.length} slides`)
      
      // Call completion callback
      if (onProcessComplete) {
        onProcessComplete(processResult)
      }
      
    } catch (error) {
      console.error('Content processing error:', error)
      updateFileStatus(
        fileId, 
        'error', 
        0, 
        error instanceof Error ? error.message : 'Erro no processamento'
      )
    }
  }

  const updateFileStatus = (
    fileId: string, 
    status: UploadedFile['status'], 
    progress: number, 
    error?: string
  ) => {
    setUploadedFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, status, progress, error } : f
    ))
  }

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/pdf': ['.pdf']
    },
    maxFiles,
    maxSize: 100 * 1024 * 1024, // 100MB
    multiple: true,
    disabled: !canUpload
  })

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const retryFile = (fileId: string) => {
    const fileObj = uploadedFiles.find(f => f.id === fileId)
    if (fileObj) {
      processFile(fileObj)
    }
  }

  const completedFiles = uploadedFiles.filter(f => f.status === 'completed')
  const hasErrors = uploadedFiles.some(f => f.status === 'error')
  const isUploading = uploadedFiles.some(f => f.status === 'uploading' || f.status === 'processing')

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-6 w-6" />
          Upload PPTX Production
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Drop Zone */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer
            ${isDragActive && !isDragReject ? 'border-blue-500 bg-blue-50' : ''}
            ${isDragReject ? 'border-red-500 bg-red-50' : ''}
            ${!isDragActive ? 'border-gray-300 hover:border-gray-400' : ''}
            ${!canUpload ? 'opacity-60 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          <div className="space-y-2">
            <Upload className="h-12 w-12 text-gray-400 mx-auto" />
            {isDragActive ? (
              isDragReject ? (
                <p className="text-red-600">Tipo de arquivo não suportado</p>
              ) : (
                <p className="text-blue-600">Solte os arquivos aqui...</p>
              )
            ) : (
              <>
                <p className="text-lg font-medium">
                  {canUpload ? 'Arraste arquivos PPTX aqui' : 'Faça login para enviar arquivos'}
                </p>
                <p className="text-sm text-gray-500">
                  {canUpload
                    ? `ou clique para selecionar • Máximo ${maxFiles} arquivos • Até 100MB cada`
                    : 'Esta área fica ativa após autenticação.'}
                </p>
                <Badge variant="outline" className="mt-2">
                  .pptx • .ppt • .pdf
                </Badge>
              </>
            )}
          </div>
        </div>

        {!authLoading && !user && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="flex flex-col gap-3 text-yellow-900">
              <span>
                É necessário estar autenticado para usar o upload de PPTX em produção. Faça login e tente novamente.
              </span>
              <div className="flex flex-wrap gap-2">
                <Link href={loginHref} prefetch={false}>
                  <Button size="sm">
                    Ir para login
                  </Button>
                </Link>
                <Button size="sm" variant="outline" onClick={() => router.refresh()}>
                  Já fiz login
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Upload Progress */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Arquivos ({uploadedFiles.length})
            </h3>
            
            {uploadedFiles.map(file => (
              <FileUploadItem
                key={file.id}
                file={file}
                onRemove={removeFile}
                onRetry={retryFile}
              />
            ))}
          </div>
        )}

        {/* Summary */}
        {completedFiles.length > 0 && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span>
                  {completedFiles.length} arquivo(s) processado(s) com sucesso
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      // Get project ID from the first completed file
                      const projectId = completedFiles[0]?.jobId
                      if (projectId) {
                        console.log(`🔗 Navigating to editor with project: ${projectId}`)
                        // Navega para o editor sem chamar onProcessComplete (evita loop)
                        router.push(`/pptx-editor-real?projectId=${projectId}`)
                        toast.success('Redirecionando para o editor com dados reais...')
                      } else {
                        router.push('/pptx-editor-real')
                        toast.success('Redirecionando para o editor...')
                      }
                    }}
                    className="flex items-center gap-1"
                  >
                    <Play className="h-3 w-3" />
                    Ir para Editor
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex justify-between pt-4">
          <Button 
            variant="outline" 
            onClick={onCancel}
          >
            Cancelar
          </Button>
          
          <div className="flex gap-2">
            <Badge variant={isUploading ? "default" : "secondary"}>
              {isUploading ? 'Processando...' : 'Pronto'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// File Upload Item Component
interface FileUploadItemProps {
  file: UploadedFile
  onRemove: (fileId: string) => void
  onRetry: (fileId: string) => void
}

function FileUploadItem({ file, onRemove, onRetry }: FileUploadItemProps) {
  const getStatusIcon = () => {
    switch (file.status) {
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case 'uploaded':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'processing':
        return <Settings className="h-4 w-4 animate-spin text-orange-500" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <File className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusText = () => {
    switch (file.status) {
      case 'uploading':
        return 'Enviando...'
      case 'uploaded':
        return 'Enviado'
      case 'processing':
        return 'Processando...'
      case 'completed':
        return 'Concluído'
      case 'error':
        return 'Erro'
      default:
        return 'Aguardando'
    }
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-4">
        {/* Progress Circle */}
        <div className="w-12 h-12 flex-shrink-0">
          {file.status === 'completed' || file.status === 'error' ? (
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              {getStatusIcon()}
            </div>
          ) : (
            <CircularProgressbar
              value={file.progress}
              text={`${file.progress}%`}
              styles={buildStyles({
                textSize: '24px',
                pathColor: file.status === 'uploading' ? '#3b82f6' : file.status === 'processing' ? '#f59e0b' : '#3b82f6',
                textColor: '#374151',
                trailColor: '#e5e7eb'
              })}
            />
          )}
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">{file.name}</p>
            <Badge variant="outline" className="flex-shrink-0">
              {getStatusText()}
            </Badge>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
            <span>{(file.size / 1024 / 1024).toFixed(1)} MB</span>
            
            {file.result && (
              <>
                <span>•</span>
                <span>{file.result.slideCount} slides</span>
                <span>•</span>
                <span>{file.result.imageCount} imagens</span>
                <span>•</span>
                <span>{Math.round(file.result.totalDuration)}s</span>
              </>
            )}
          </div>

          {file.error && (
            <p className="text-sm text-red-600 mt-1">{file.error}</p>
          )}

          {/* Linear progress for active uploads */}
          {(file.status === 'uploading' || file.status === 'processing') && (
            <Progress value={file.progress} className="mt-2" />
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-1">
          {file.status === 'error' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRetry(file.id)}
            >
              Tentar Novamente
            </Button>
          )}
          
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onRemove(file.id)}
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
