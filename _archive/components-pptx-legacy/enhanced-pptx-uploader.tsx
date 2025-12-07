
/**
 * 📤 Enhanced PPTX Uploader 
 * Upload com preview, análise IA e integração com o Editor Animaker
 */

'use client'

import React, { useState, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { toast } from 'react-hot-toast'
import { 
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  Brain,
  Wand2,
  Eye,
  Edit3,
  Sparkles,
  Clock,
  Image as ImageIcon,
  Video,
  Type,
  Layers,
  Download,
  X
} from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { UnifiedParseResult, convertRealToUnifiedParseResult } from '@/lib/types-unified-v2'

interface EnhancedPPTXUploaderProps {
  onAnalysisComplete: (result: UnifiedParseResult & { fileInfo: any }) => void
  onCancel: () => void
}

interface UploadedFile {
  file: File
  preview?: string
  s3Key?: string
  analysis?: UnifiedParseResult
}

export function EnhancedPPTXUploader({ onAnalysisComplete, onCancel }: EnhancedPPTXUploaderProps) {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [currentStage, setCurrentStage] = useState('')
  const [error, setError] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Validação de arquivos
  const validateFile = (file: File): string | null => {
    if (!file.name.toLowerCase().endsWith('.pptx')) {
      return 'Apenas arquivos .pptx são aceitos'
    }
    
    if (file.size > 100 * 1024 * 1024) { // 100MB
      return 'Arquivo muito grande. Limite: 100MB'
    }
    
    if (file.size < 1024) { // 1KB
      return 'Arquivo muito pequeno. Verifique se o arquivo não está corrompido'
    }
    
    return null
  }

  // Upload para S3
  const uploadToS3 = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'pptx_enhanced')

    const response = await fetch('/api/v1/pptx/upload', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Erro no upload: ${error}`)
    }

    const result = await response.json()
    return result.s3Key
  }

  // Análise com parser real
  const analyzeFile = async (s3Key: string, filename: string): Promise<UnifiedParseResult> => {
    const stages = [
      { stage: 'Baixando arquivo do S3...', progress: 15 },
      { stage: 'Extraindo estrutura PPTX...', progress: 35 },
      { stage: 'Analisando slides e elementos...', progress: 55 },
      { stage: 'Processando assets (imagens/vídeos)...', progress: 75 },
      { stage: 'Calculando timeline e compliance...', progress: 90 },
      { stage: 'Finalizando análise...', progress: 100 }
    ]

    // Simular progresso visual
    const progressPromise = (async () => {
      for (const { stage, progress } of stages) {
        setCurrentStage(stage)
        setAnalysisProgress(progress)
        await new Promise(resolve => setTimeout(resolve, 600))
      }
    })()

    try {
      // Chamar API real de processamento
      const response = await fetch('/api/v1/pptx/enhanced-process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          s3Key, 
          filename,
          options: {
            generateThumbnails: true,
            analyzeCompliance: true,
            extractAnimations: true
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Falha na análise do arquivo')
      }

      // Aguardar o progresso visual terminar
      await progressPromise

      // Converter resultado do parser real para formato unificado
      const unifiedResult = convertRealToUnifiedParseResult(result.data)
      
      console.log('✅ Análise real concluída:', {
        slides: unifiedResult.slides.length,
        elements: unifiedResult.slides.reduce((acc, slide) => acc + slide.elements.length, 0),
        compliance: unifiedResult.compliance?.score
      })

      return unifiedResult

    } catch (error) {
      // Garantir que o progresso visual termine mesmo com erro
      await progressPromise.catch(() => {})
      throw error
    }
  }

  // Handler principal do upload
  const handleFileUpload = async (file: File) => {
    setError(null)
    
    // Validar arquivo
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setUploadedFile({ file })

    try {
      // 1. Upload para S3
      setIsUploading(true)
      setUploadProgress(0)
      
      // Simular progresso do upload
      const uploadInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const s3Key = await uploadToS3(file)
      clearInterval(uploadInterval)
      setUploadProgress(100)
      setIsUploading(false)

      toast.success('📤 Upload concluído!')

      // 2. Análise expandida
      setIsAnalyzing(true)
      setAnalysisProgress(0)
      setCurrentStage('Iniciando análise...')

      const analysis = await analyzeFile(s3Key, file.name)

      setUploadedFile(prev => prev ? { ...prev, s3Key, analysis } : null)
      setIsAnalyzing(false)

      toast.success('🧠 Análise concluída!')

      // 3. Passar resultado para o editor
      const fileInfo = {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        s3Key
      }

      onAnalysisComplete({ ...analysis, fileInfo })

    } catch (error) {
      console.error('Erro no processamento:', error)
      setError(error instanceof Error ? error.message : 'Erro desconhecido')
      setIsUploading(false)
      setIsAnalyzing(false)
      setUploadedFile(null)
    }
  }

  // Dropzone configuration
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      handleFileUpload(acceptedFiles[0])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx']
    },
    multiple: false,
    disabled: isUploading || isAnalyzing
  })

  // Renderizar preview da análise
  const renderAnalysisPreview = () => {
    if (!uploadedFile?.analysis) return null

    const { slides, metadata, assets, timeline } = uploadedFile.analysis

    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Análise Completa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Estatísticas principais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{slides.length}</div>
              <div className="text-sm text-gray-600">Slides</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {slides.reduce((acc: number, slide: any) => acc + slide.elements.length, 0)}
              </div>
              <div className="text-sm text-gray-600">Elementos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{assets.images.length}</div>
              <div className="text-sm text-gray-600">Imagens</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {Math.round(timeline.totalDuration)}s
              </div>
              <div className="text-sm text-gray-600">Duração</div>
            </div>
          </div>

          <Separator />

          {/* Detalhes dos elementos */}
          <div>
            <h4 className="font-semibold mb-2">Elementos Extraídos:</h4>
            <div className="flex flex-wrap gap-2">
              {slides.map((slide: any) => {
                const elementTypes = slide.elements.reduce((acc: Record<string, number>, el: any) => {
                  acc[el.type] = (acc[el.type] || 0) + 1
                  return acc
                }, {} as Record<string, number>)

                return Object.entries(elementTypes).map(([type, count]) => (
                  <Badge key={`${slide.id}-${type}`} variant="secondary" className="text-xs">
                    {type === 'text' && <Type className="w-3 h-3 mr-1" />}
                    {type === 'image' && <ImageIcon className="w-3 h-3 mr-1" />}
                    {type === 'video' && <Video className="w-3 h-3 mr-1" />}
                    {type === 'shape' && <Layers className="w-3 h-3 mr-1" />}
                    {count as number} {type}
                  </Badge>
                ))
              }).flat()}
            </div>
          </div>

          <Separator />

          {/* Preview dos slides */}
          <div>
            <h4 className="font-semibold mb-2">Preview dos Slides:</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
              {slides.slice(0, 6).map((slide: any, index: number) => (
                <div
                  key={slide.id}
                  className="aspect-video bg-gray-100 rounded-lg p-2 border text-center flex flex-col justify-center"
                >
                  <div className="text-xs font-bold text-gray-700 mb-1">
                    Slide {slide.index}
                  </div>
                  <div className="text-xs text-gray-600 truncate">
                    {slide.title}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {slide.elements.length} elementos
                  </div>
                </div>
              ))}
              
              {slides.length > 6 && (
                <div className="aspect-video bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <div className="text-lg font-bold">+{slides.length - 6}</div>
                    <div className="text-xs">mais slides</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Ações */}
          <div className="flex gap-2 pt-4">
            <Button 
              className="flex-1" 
              onClick={() => uploadedFile.analysis && onAnalysisComplete({
                ...uploadedFile.analysis,
                fileInfo: {
                  name: uploadedFile.file.name,
                  size: uploadedFile.file.size,
                  s3Key: uploadedFile.s3Key
                }
              })}
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Abrir no Editor
            </Button>
            
            <Button variant="outline" onClick={() => {
              setUploadedFile(null)
              setError(null)
            }}>
              <Upload className="w-4 h-4 mr-2" />
              Novo Upload
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold mb-2">Upload e Análise PPTX</h1>
        <p className="text-gray-600">
          Faça upload de sua apresentação PowerPoint para converter em vídeo interativo
        </p>
      </div>

      {/* Dropzone */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
              isDragActive
                ? 'border-blue-400 bg-blue-50'
                : isUploading || isAnalyzing
                ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            <input {...getInputProps()} ref={fileInputRef} />
            
            {isUploading ? (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                  <Upload className="w-8 h-8 text-blue-600 animate-bounce" />
                </div>
                <div>
                  <p className="text-lg font-medium">Fazendo upload...</p>
                  <Progress value={uploadProgress} className="w-full max-w-md mx-auto mt-2" />
                  <p className="text-sm text-gray-600 mt-1">{uploadProgress}%</p>
                </div>
              </div>
            ) : isAnalyzing ? (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center">
                  <Brain className="w-8 h-8 text-purple-600 animate-pulse" />
                </div>
                <div>
                  <p className="text-lg font-medium">Analisando conteúdo...</p>
                  <Progress value={analysisProgress} className="w-full max-w-md mx-auto mt-2" />
                  <p className="text-sm text-gray-600 mt-1">{currentStage}</p>
                </div>
              </div>
            ) : isDragActive ? (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                  <Download className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-lg font-medium text-blue-600">
                  Solte o arquivo aqui
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                  <FileText className="w-8 h-8 text-gray-600" />
                </div>
                <div>
                  <p className="text-lg font-medium">
                    Arraste um arquivo PPTX ou clique para selecionar
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    Suporte a arquivos até 100MB
                  </p>
                </div>
                <Button className="mt-4">
                  <Upload className="w-4 h-4 mr-2" />
                  Selecionar Arquivo
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Analysis Preview */}
      {renderAnalysisPreview()}

      {/* Cancel Button */}
      <div className="flex justify-center mt-6">
        <Button variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" />
          Cancelar
        </Button>
      </div>
    </div>
  )
}
