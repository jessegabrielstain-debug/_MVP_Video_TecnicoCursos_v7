
'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  ArrowRight,
  Sparkles,
  Play,
  Settings
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface UploadPrototypeProps {
  onComplete?: (result: Record<string, unknown>) => void
}

export function UploadPrototype({ onComplete }: UploadPrototypeProps) {
  const [uploadProgress, setUploadProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState<'select' | 'uploading' | 'processing' | 'complete'>('select')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      toast.success(`Arquivo "${file.name}" selecionado!`)
    }
  }

  const handleUpload = () => {
    if (!selectedFile) return
    
    setCurrentStep('uploading')
    setUploadProgress(0)

    // Simular progresso de upload
    const uploadInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(uploadInterval)
          setCurrentStep('processing')
          
          // Simular processamento
          setTimeout(() => {
            setCurrentStep('complete')
            toast.success('Upload concluído (mock)!')
            
            const mockResult = {
              id: `project_${Date.now()}`,
              name: selectedFile?.name.replace('.pptx', ''),
              slides: 8,
              duration: '4:30',
              thumbnails: ['/nr12-intro.jpg', '/nr12-seguranca.jpg', '/nr12-procedimentos.jpg']
            }
            
            onComplete?.(mockResult)
          }, 2000)
          
          return 100
        }
        return prev + 5
      })
    }, 100)
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Upload className="h-6 w-6 text-blue-600" />
          Upload PPTX - Protótipo Navegável
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {currentStep === 'select' && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
              <Upload className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              <h3 className="font-medium text-gray-900 mb-2">Selecione um arquivo PPTX</h3>
              <p className="text-sm text-gray-500 mb-4">Arraste e solte ou clique para escolher</p>
              
              <input
                type="file"
                accept=".pptx,.ppt"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <Button asChild>
                <label htmlFor="file-upload" className="cursor-pointer">
                  Escolher Arquivo
                </label>
              </Button>
            </div>
            
            {selectedFile && (
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button onClick={handleUpload} className="bg-blue-600">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Processar
                </Button>
              </div>
            )}
          </div>
        )}

        {currentStep === 'uploading' && (
          <div className="space-y-4 text-center">
            <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
            <h3 className="font-medium">Enviando arquivo...</h3>
            <Progress value={uploadProgress} className="w-full" />
            <p className="text-sm text-gray-500">{uploadProgress}% concluído</p>
          </div>
        )}

        {currentStep === 'processing' && (
          <div className="space-y-4 text-center">
            <Sparkles className="h-12 w-12 text-purple-600 mx-auto animate-pulse" />
            <h3 className="font-medium">Processando com IA...</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Extraindo texto</span>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex justify-between text-sm">
                <span>Identificando imagens</span>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex justify-between text-sm">
                <span>Gerando timeline</span>
                <div className="animate-spin h-4 w-4 border-2 border-purple-600 border-t-transparent rounded-full" />
              </div>
            </div>
          </div>
        )}

        {currentStep === 'complete' && (
          <div className="space-y-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
            <div>
              <h3 className="text-xl font-bold text-green-600 mb-2">Upload Concluído!</h3>
              <p className="text-gray-600">Sua apresentação foi processada com sucesso</p>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">8</div>
                <div className="text-sm text-gray-600">Slides</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">4:30</div>
                <div className="text-sm text-gray-600">Duração</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">95%</div>
                <div className="text-sm text-gray-600">Compliance</div>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <Button className="bg-blue-600">
                <Play className="h-4 w-4 mr-2" />
                Ir para Editor
              </Button>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Configurar
              </Button>
            </div>
          </div>
        )}

        <div className="flex justify-center">
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Protótipo Navegável - Sem Backend Real
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
