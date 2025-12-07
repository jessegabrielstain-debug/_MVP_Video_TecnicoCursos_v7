

'use client'

/**
 * Enhanced PPTX Upload - Production Integration V3
 * Real S3 upload + PPTX processing + Database persistence + Editor integration
 */

import React, { useState, useCallback, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'react-hot-toast'
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Play,
  ArrowRight,
  Image,
  Clock,
  Settings,
  Zap,
  Download,
  Database
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import 'react-circular-progressbar/dist/styles.css'

export interface ProcessedResult {
  slides: number
  duration: number
  assets: number
  timeline: Record<string, unknown>
  s3Key: string
  fileName: string
  processingTime: number
  projectId: string // NEW: Project ID from database
}

interface UploadState {
  status: 'idle' | 'uploading' | 'processing' | 'complete' | 'error'
  progress: number
  file?: File
  error?: string
  projectId?: string // NEW: Track project ID
  result?: ProcessedResult
}

interface EnhancedPPTXUploadProps {
  onProcessComplete?: (data: ProcessedResult) => void
  onCancel?: () => void
}

export function EnhancedPPTXUpload({ onProcessComplete, onCancel }: EnhancedPPTXUploadProps) {
  const router = useRouter()
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    progress: 0
  })
  
  const [logs, setLogs] = useState<string[]>([])
  
  const addLog = (message: string) => {
    console.log(`📋 UPLOAD LOG: ${message}`)
    setLogs(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    // Reset state
    setUploadState({ status: 'uploading', progress: 0, file })
    setLogs([])
    addLog(`Iniciando upload: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`)

    try {
      // Step 1: Upload file to S3
      addLog('📤 Enviando arquivo para S3...')
      
      const formData = new FormData()
      formData.append('file', file)
      
      const uploadResponse = await fetch('/api/v1/pptx/upload-production', {
        method: 'POST',
        body: formData
      })
      
      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        throw new Error(errorData.error || 'Erro no upload')
      }
      
      const uploadResult = await uploadResponse.json()
      addLog(`✅ Upload concluído! Projeto criado: ${uploadResult.project.id}`)
      
      // Update state with project ID
      setUploadState(prev => ({
        ...prev,
        progress: 50,
        projectId: uploadResult.project.id
      }))

      // Step 2: Process PPTX content
      addLog('🔧 Iniciando processamento do PPTX...')
      setUploadState(prev => ({ ...prev, status: 'processing', progress: 60 }))

      const processResponse = await fetch('/api/v1/pptx/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          s3Key: uploadResult.job.s3Key,
          projectId: uploadResult.project.id
        })
      })

      if (!processResponse.ok) {
        const errorData = await processResponse.json()
        throw new Error(errorData.error || 'Erro no processamento')
      }

      const processResult = await processResponse.json()
      addLog(`✅ Processamento concluído! ${processResult.extractedContent?.slides?.length || 0} slides extraídos`)
      
      // Step 3: Final result
      const finalResult: ProcessedResult = {
        slides: processResult.extractedContent?.slides?.length || 0,
        duration: Math.round(processResult.extractedContent?.timeline?.totalDuration || 0),
        assets: processResult.extractedContent?.assets?.images?.length || 0,
        timeline: processResult.extractedContent?.timeline,
        s3Key: uploadResult.job.s3Key,
        fileName: file.name,
        processingTime: 0, // TODO: Calculate actual time
        projectId: uploadResult.project.id
      }

      setUploadState({
        status: 'complete',
        progress: 100,
        file,
        result: finalResult,
        projectId: uploadResult.project.id
      })

      addLog('🎉 Processo completo! Dados salvos no banco de dados.')
      
      toast.success('✅ Upload e processamento concluídos!')
      
      if (onProcessComplete) {
        onProcessComplete(finalResult)
      }

    } catch (error) {
      console.error('❌ Upload/Processing Error:', error)
      addLog(`❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      
      setUploadState({
        status: 'error',
        progress: 0,
        file,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      })
      
      toast.error('❌ Erro no upload/processamento')
    }
  }, [onProcessComplete])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx']
    },
    maxFiles: 1,
    disabled: uploadState.status === 'uploading' || uploadState.status === 'processing'
  })

  // Navigate to editor with project ID
  const handleGoToEditor = () => {
    if (uploadState.projectId) {
      addLog(`🔗 Redirecionando para editor com projeto: ${uploadState.projectId}`)
      router.push(`/pptx-editor-real?projectId=${uploadState.projectId}`)
    } else {
      toast.error('ID do projeto não disponível')
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Upload className="h-6 w-6" />
          Upload PPTX Real - Produção
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
            ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            ${uploadState.status === 'uploading' || uploadState.status === 'processing' ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {isDragActive ? 'Solte o arquivo aqui...' : 'Arraste um arquivo PPTX ou clique para selecionar'}
          </h3>
          <p className="text-gray-500">Apenas arquivos .pptx são aceitos (máx. 100MB)</p>
        </div>

        {/* Processing Status */}
        {uploadState.status !== 'idle' && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {uploadState.status === 'uploading' && <Loader2 className="h-5 w-5 animate-spin text-blue-500" />}
                  {uploadState.status === 'processing' && <Settings className="h-5 w-5 animate-spin text-orange-500" />}
                  {uploadState.status === 'complete' && <CheckCircle className="h-5 w-5 text-green-500" />}
                  {uploadState.status === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
                  
                  <div>
                    <div className="font-medium">
                      {uploadState.file?.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {uploadState.status === 'uploading' && 'Enviando para S3...'}
                      {uploadState.status === 'processing' && 'Processando conteúdo...'}
                      {uploadState.status === 'complete' && 'Processamento concluído'}
                      {uploadState.status === 'error' && 'Erro no processamento'}
                    </div>
                  </div>
                </div>
                
                {uploadState.status !== 'error' && (
                  <div className="w-16 h-16">
                    <CircularProgressbar
                      value={uploadState.progress}
                      text={`${uploadState.progress}%`}
                      styles={buildStyles({
                        textSize: '20px',
                        pathColor: uploadState.status === 'complete' ? '#10B981' : '#3B82F6',
                        textColor: uploadState.status === 'complete' ? '#10B981' : '#3B82F6'
                      })}
                    />
                  </div>
                )}
              </div>
              
              <Progress value={uploadState.progress} className="mb-4" />
              
              {/* Show project ID when available */}
              {uploadState.projectId && (
                <div className="flex items-center gap-2 mb-2">
                  <Database className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-mono">Projeto ID: {uploadState.projectId}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {uploadState.status === 'complete' && uploadState.result && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-green-800">Processamento Concluído!</h3>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <FileText className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <div className="font-bold text-xl">{uploadState.result.slides}</div>
                  <div className="text-sm text-gray-600">Slides</div>
                </div>
                <div className="text-center">
                  <Clock className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <div className="font-bold text-xl">{uploadState.result.duration}s</div>
                  <div className="text-sm text-gray-600">Duração</div>
                </div>
                <div className="text-center">
                  <Image className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                  <div className="font-bold text-xl">{uploadState.result.assets}</div>
                  <div className="text-sm text-gray-600">Assets</div>
                </div>
                <div className="text-center">
                  <Database className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <div className="font-bold text-xl">✓</div>
                  <div className="text-sm text-gray-600">Salvo no DB</div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button onClick={handleGoToEditor} className="flex-1">
                  <Play className="h-4 w-4 mr-2" />
                  Ir para Editor
                </Button>
                <Button variant="outline" onClick={() => setUploadState({ status: 'idle', progress: 0 })}>
                  Novo Upload
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {uploadState.status === 'error' && uploadState.error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {uploadState.error}
            </AlertDescription>
          </Alert>
        )}

        {/* Debug Logs */}
        {logs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Logs de Processamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-xs space-y-1 max-h-32 overflow-y-auto">
                {logs.map((log, index) => (
                  <div key={index}>{log}</div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  )
}
