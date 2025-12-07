
/**
 * 📤 Enhanced PPTX Uploader v2.0
 * Uploader que usa o parser real v2 e gera elementos editáveis
 */

'use client'

import React, { useState, useCallback } from 'react'
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
  AlertTriangle,
  Brain,
  Edit3,
  Type,
  Image as ImageIcon,
  Video,
  Layers,
  Download,
  X
} from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { UnifiedParseResult } from '@/lib/types-unified-v2'

interface EnhancedPPTXUploaderV2Props {
  onAnalysisComplete: (result: UnifiedParseResult & { fileInfo: any }) => void
  onCancel: () => void
}

interface UploadedFile {
  file: File
  s3Key?: string
  analysis?: UnifiedParseResult
}

export function EnhancedPPTXUploaderV2({ onAnalysisComplete, onCancel }: EnhancedPPTXUploaderV2Props) {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [currentStage, setCurrentStage] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Upload para S3
  const uploadToS3 = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'pptx_v2')

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

  // Análise com parser real v2
  const analyzeFile = async (s3Key: string, filename: string): Promise<UnifiedParseResult> => {
    const stages = [
      { stage: 'Baixando do S3...', progress: 10 },
      { stage: 'Extraindo estrutura PPTX...', progress: 25 },
      { stage: 'Analisando slides individuais...', progress: 45 },
      { stage: 'Extraindo elementos editáveis...', progress: 65 },
      { stage: 'Processando assets (imagens/vídeos)...', progress: 80 },
      { stage: 'Gerando timeline e keyframes...', progress: 90 },
      { stage: 'Finalizando análise...', progress: 100 }
    ]

    // Simular progresso visual
    const progressPromise = (async () => {
      for (const { stage, progress } of stages) {
        setCurrentStage(stage)
        setAnalysisProgress(progress)
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    })()

    try {
      // Chamar API de processamento v2 (PARSER REAL)
      const response = await fetch('/api/v1/pptx/enhanced-process-v2', {
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
            extractAnimations: true,
            parseElements: true // NOVO: extrai elementos individuais
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Falha na análise')
      }

      // Aguardar progresso visual terminar
      await progressPromise

      console.log('✅ Análise v2 concluída:', {
        slides: result.data.slides.length,
        totalElements: result.statistics.totalElements,
        editableElements: result.statistics.editableElements,
        elementsByType: result.statistics.elementsByType
      })

      // Validar que temos elementos editáveis
      if (result.statistics.editableElements === 0) {
        console.warn('⚠️ Nenhum elemento editável extraído!')
        toast.error('Nenhum elemento editável foi encontrado no PPTX')
      }

      return result.data

    } catch (error) {
      await progressPromise.catch(() => {})
      throw error
    }
  }

  // Handler do upload
  const handleFileUpload = async (file: File) => {
    setError(null)
    
    // Validações
    if (!file.name.toLowerCase().endsWith('.pptx')) {
      setError('Apenas arquivos .pptx são aceitos')
      return
    }

    if (file.size > 100 * 1024 * 1024) {
      setError('Arquivo muito grande (máx. 100MB)')
      return
    }

    setUploadedFile({ file })

    try {
      // 1. Upload
      setIsUploading(true)
      setUploadProgress(0)
      
      const uploadInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const s3Key = await uploadToS3(file)
      clearInterval(uploadInterval)
      setUploadProgress(100)
      setIsUploading(false)

      toast.success('Upload concluído!')

      // 2. Análise v2 (PARSER REAL)
      setIsAnalyzing(true)
      setAnalysisProgress(0)
      setCurrentStage('Iniciando análise...')

      const analysis = await analyzeFile(s3Key, file.name)

      setUploadedFile(prev => prev ? { ...prev, s3Key, analysis } : null)
      setIsAnalyzing(false)

      toast.success('Análise concluída!')

      // 3. Validar resultado
      if (!analysis.slides || analysis.slides.length === 0) {
        throw new Error('Nenhum slide foi extraído do PPTX')
      }

      const totalElements = analysis.slides.reduce((acc, slide) => acc + slide.elements.length, 0)
      if (totalElements === 0) {
        throw new Error('Nenhum elemento foi extraído do PPTX')
      }

      // 4. Passar para o editor
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

  // Dropzone
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

  // Render preview
  const renderAnalysisPreview = () => {
    if (!uploadedFile?.analysis) return null

    const { slides, assets, statistics } = uploadedFile.analysis

    return (
      <Card className="mt-4" data-testid="analysis-complete">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Análise Concluída (Parser v2.0)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Estatísticas principais */}
          <div 
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
            data-testid="processing-stats"
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600" data-stat="slides">
                {slides.length}
              </div>
              <div className="text-sm text-gray-600">Slides</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600" data-stat="elements">
                {statistics.totalElements}
              </div>
              <div className="text-sm text-gray-600">Elementos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600" data-stat="editable-elements">
                {statistics.editableElements}
              </div>
              <div className="text-sm text-gray-600">Editáveis</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {assets.images.length}
              </div>
              <div className="text-sm text-gray-600">Imagens</div>
            </div>
          </div>

          {/* Validação de elementos editáveis */}
          {statistics.editableElements > 0 ? (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                ✅ {statistics.editableElements} elementos editáveis extraídos com sucesso!
                O editor poderá manipular textos, formas e outros objetos individualmente.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                ⚠️ Nenhum elemento editável foi encontrado. O PPTX pode conter apenas imagens ou elementos não suportados.
              </AlertDescription>
            </Alert>
          )}

          {/* Elementos por tipo */}
          <div>
            <h4 className="font-semibold mb-2">Elementos Extraídos:</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(statistics.elementsByType).map(([type, count]) => (
                <Badge key={type} variant="secondary" className="text-xs">
                  {type === 'text' && <Type className="w-3 h-3 mr-1" />}
                  {type === 'image' && <ImageIcon className="w-3 h-3 mr-1" />}
                  {type === 'video' && <Video className="w-3 h-3 mr-1" />}
                  {type === 'shape' && <Layers className="w-3 h-3 mr-1" />}
                  {count} {type}
                </Badge>
              ))}
            </div>
          </div>

          {/* Preview dos slides */}
          <div>
            <h4 className="font-semibold mb-2">Preview dos Slides:</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
              {slides.slice(0, 6).map((slide, index) => (
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
                  <div className="text-xs text-blue-600">
                    {slide.elements.filter(el => el.type !== 'image').length} editáveis
                  </div>
                </div>
              ))}
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
              data-testid="open-editor-btn"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Abrir no Editor
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => {
                setUploadedFile(null)
                setError(null)
              }}
            >
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
        <h1 className="text-3xl font-bold mb-2">Upload e Análise PPTX v2.0</h1>
        <p className="text-gray-600">
          Parser real que extrai elementos editáveis individuais (textos, formas, imagens)
        </p>
      </div>

      {/* Dropzone */}
      <Card className="mb-6" data-testid="pptx-uploader">
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
            <input {...getInputProps()} />
            
            {isUploading ? (
              <div className="space-y-4">
                <Upload className="w-16 h-16 mx-auto text-blue-600 animate-bounce" />
                <div>
                  <p className="text-lg font-medium">Fazendo upload...</p>
                  <Progress value={uploadProgress} className="w-full max-w-md mx-auto mt-2" />
                  <p className="text-sm text-gray-600 mt-1">{uploadProgress}%</p>
                </div>
              </div>
            ) : isAnalyzing ? (
              <div className="space-y-4">
                <Brain className="w-16 h-16 mx-auto text-purple-600 animate-pulse" />
                <div>
                  <p className="text-lg font-medium">Extraindo elementos editáveis...</p>
                  <Progress value={analysisProgress} className="w-full max-w-md mx-auto mt-2" />
                  <p className="text-sm text-gray-600 mt-1">{currentStage}</p>
                </div>
              </div>
            ) : isDragActive ? (
              <div className="space-y-4">
                <Download className="w-16 h-16 mx-auto text-blue-600" />
                <p className="text-lg font-medium text-blue-600">
                  Solte o arquivo aqui
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <FileText className="w-16 h-16 mx-auto text-gray-600" />
                <div>
                  <p className="text-lg font-medium">
                    Arraste um arquivo PPTX ou clique para selecionar
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    Parser v2.0 - Extrai elementos editáveis individuais
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

      {/* Error */}
      {error && (
        <Alert className="mb-6 border-red-200 bg-red-50">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Preview */}
      {renderAnalysisPreview()}

      {/* Cancel */}
      <div className="flex justify-center mt-6">
        <Button variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" />
          Cancelar
        </Button>
      </div>
    </div>
  )
}

export default EnhancedPPTXUploaderV2
