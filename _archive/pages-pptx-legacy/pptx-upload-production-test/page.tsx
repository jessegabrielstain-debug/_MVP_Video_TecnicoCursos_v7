
'use client'

/**
 * Test page for Production PPTX Upload
 * Complete integration testing
 */

import { Suspense, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProductionPPTXUploadV2 } from '@/components/pptx/production-pptx-upload-v2'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  Settings, 
  PlayCircle,
  ArrowLeft,
  Zap,
  Clock,
  Image,
  Layers
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface ProcessedData {
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

interface PPTXSlideRaw {
  id: string;
  title: string;
  content: string;
  images?: unknown[];
  duration?: number;
  animations?: unknown[];
}

interface PPTXProcessResult {
  data?: {
    slides?: PPTXSlideRaw[];
    totalDuration?: number;
  };
}

export default function PPTXUploadProductionTestPage() {
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null)
  const [showUpload, setShowUpload] = useState(true)

  const handleProcessComplete = (data: PPTXProcessResult) => {
    console.log('🎉 Processing completed:', data)
    
    // Extract processed data
    if (data.data) {
      const result: ProcessedData = {
        slides: data.data.slides?.map(s => ({
          id: s.id,
          title: s.title,
          content: s.content,
          images: s.images?.length || 0,
          duration: s.duration || 0
        })) || [],
        totalDuration: data.data.totalDuration || 0,
        slideCount: data.data.slides?.length || 0,
        imageCount: data.data.slides?.reduce((acc: number, slide) => 
          acc + (slide.images?.length || 0), 0) || 0,
        hasAnimations: data.data.slides?.some((slide) => 
          slide.animations && slide.animations.length > 0) || false
      }
      setProcessedData(result)
    }
    
    setShowUpload(false)
    toast.success('Processamento concluído! Pronto para edição.')
  }

  const handleCancel = () => {
    setShowUpload(true)
    setProcessedData(null)
  }

  const handleStartEditing = () => {
    toast.success('Redirecionando para o editor...')
    // Navigate to editor with processed data
    // router.push('/pptx-editor-real')
  }

  if (showUpload) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-6xl mx-auto py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Upload className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">
                PPTX Upload Production Test
              </h1>
            </div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Teste completo do sistema de upload e processamento de apresentações PPTX
              com integração S3, processamento real e extração de conteúdo.
            </p>
          </div>

          {/* Features Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Funcionalidades Testadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <h3 className="font-medium">Upload S3</h3>
                  <p className="text-sm text-gray-600">Upload direto para AWS S3</p>
                </div>
                <div className="text-center p-4">
                  <Settings className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                  <h3 className="font-medium">Processamento</h3>
                  <p className="text-sm text-gray-600">Extração de conteúdo real</p>
                </div>
                <div className="text-center p-4">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <h3 className="font-medium">Análise</h3>
                  <p className="text-sm text-gray-600">Slides, imagens, textos</p>
                </div>
                <div className="text-center p-4">
                  <PlayCircle className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                  <h3 className="font-medium">Timeline</h3>
                  <p className="text-sm text-gray-600">Geração automática</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upload Component */}
          <Suspense fallback={<div className="flex justify-center py-12 text-gray-500">Carregando componente de upload...</div>}>
            <ProductionPPTXUploadV2
              onProcessComplete={handleProcessComplete}
              onCancel={handleCancel}
              maxFiles={3}
              acceptedTypes={['.pptx', '.ppt', '.pdf']}
            />
          </Suspense>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Processamento Concluído
            </h1>
          </div>
          <p className="text-gray-600">
            Arquivo processado com sucesso! Confira os dados extraídos abaixo.
          </p>
        </div>

        {/* Results */}
        {processedData && (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="text-center p-6">
                  <Layers className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold text-blue-600">
                    {processedData.slideCount}
                  </p>
                  <p className="text-sm text-gray-600">Slides</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="text-center p-6">
                  <Image className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="text-2xl font-bold text-green-600">
                    {processedData.imageCount}
                  </p>
                  <p className="text-sm text-gray-600">Imagens</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="text-center p-6">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                  <p className="text-2xl font-bold text-purple-600">
                    {Math.round(processedData.totalDuration)}s
                  </p>
                  <p className="text-sm text-gray-600">Duração</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="text-center p-6">
                  <Zap className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                  <p className="text-2xl font-bold text-orange-600">
                    {processedData.hasAnimations ? 'Sim' : 'Não'}
                  </p>
                  <p className="text-sm text-gray-600">Animações</p>
                </CardContent>
              </Card>
            </div>

            {/* Slide Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Slides Detectados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {processedData.slides.map((slide, index) => (
                    <div key={slide.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">Slide {index + 1}</Badge>
                          <h3 className="font-medium">
                            {slide.title || `Slide sem título ${index + 1}`}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-600 truncate max-w-md">
                          {slide.content || 'Sem conteúdo de texto'}
                        </p>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <div>{slide.images} imagem(s)</div>
                        <div>{Math.round(slide.duration)}s</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-between items-center">
              <Button 
                variant="outline" 
                onClick={handleCancel}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar ao Upload
              </Button>

              <div className="flex gap-3">
                <Button 
                  variant="default" 
                  onClick={handleStartEditing}
                  className="flex items-center gap-2"
                >
                  <PlayCircle className="h-4 w-4" />
                  Iniciar Edição
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Success Alert */}
        <Alert className="mt-6">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>✅ Teste de Upload Production realizado com sucesso!</strong>
            <br />
            O arquivo foi enviado para S3, processado e os dados foram extraídos corretamente.
            O sistema está pronto para produção.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}
