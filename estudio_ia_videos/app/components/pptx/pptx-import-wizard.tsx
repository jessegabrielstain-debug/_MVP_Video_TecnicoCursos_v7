
'use client'

import { useState } from 'react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { Upload, FileText, CheckCircle, Settings } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface PPTXImportWizardProps {
  onComplete?: (data: Record<string, unknown>) => void
  onCancel?: () => void
}

export default function PPTXImportWizard({ onComplete, onCancel }: PPTXImportWizardProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [step, setStep] = useState(1)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const selectedFile = files[0]
      
      if (!selectedFile.name.toLowerCase().endsWith('.pptx') && !selectedFile.name.toLowerCase().endsWith('.ppt')) {
        toast.error('Apenas arquivos PPTX e PPT são aceitos')
        return
      }
      
      if (selectedFile.size > 50 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Máximo 50MB')
        return
      }
      
      setFile(selectedFile)
      setStep(2)
    }
  }

  const startImport = async () => {
    if (!file) return
    
    setIsProcessing(true)
    setProgress(0)
    
    try {
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + Math.random() * 15
          return newProgress >= 100 ? 100 : newProgress
        })
      }, 250)
      
      await new Promise(resolve => setTimeout(resolve, 4000))
      clearInterval(interval)
      setProgress(100)
      setStep(3)
      
      toast.success('✅ Importação concluída!')
      
      // Dados simulados do projeto importado
      const projectData = {
        id: `project_${Date.now()}`,
        name: file.name.replace(/\.(pptx|ppt)$/i, ''),
        slides: Math.floor(Math.random() * 30) + 10,
        duration: Math.floor(Math.random() * 5) + 3,
        status: 'imported',
        createdAt: new Date().toISOString()
      }
      
      onComplete?.(projectData)
      
    } catch (error) {
      toast.error('❌ Erro na importação')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Assistente de Importação PPTX
        </h1>
        <p className="text-gray-600">
          Importe e converta suas apresentações em projetos de vídeo
        </p>
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Selecionar Arquivo</CardTitle>
            <CardDescription>
              Escolha o arquivo PPTX que deseja importar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-6">
              <Upload className="h-16 w-16 mx-auto text-gray-400" />
              <div className="space-y-3">
                <input
                  type="file"
                  accept=".pptx,.ppt"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="import-wizard-file"
                />
                <label htmlFor="import-wizard-file">
                  <Button size="lg" className="cursor-pointer">
                    Selecionar PPTX
                  </Button>
                </label>
                {onCancel && (
                  <div>
                    <Button onClick={onCancel} variant="outline" size="lg">
                      Cancelar
                    </Button>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500">
                Formatos: PPTX, PPT • Tamanho máximo: 50MB
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && file && (
        <Card>
          <CardHeader>
            <CardTitle>Confirmar Importação</CardTitle>
            <CardDescription>
              Verifique os detalhes do arquivo antes de prosseguir
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="flex-1">
                <h3 className="font-semibold">{file.name}</h3>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
              <Badge variant="outline">PPTX</Badge>
            </div>
            
            {isProcessing ? (
              <div className="space-y-4">
                <Progress value={progress} />
                <p className="text-center text-sm text-gray-600">
                  Importando... {progress.toFixed(0)}%
                </p>
              </div>
            ) : (
              <div className="flex justify-center space-x-4">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Voltar
                </Button>
                <Button onClick={startImport}>
                  Iniciar Importação
                </Button>
                {onCancel && (
                  <Button variant="outline" onClick={onCancel}>
                    Cancelar
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center space-x-2">
              <CheckCircle className="h-6 w-6" />
              <span>Importação Concluída</span>
            </CardTitle>
            <CardDescription className="text-green-700">
              Seu arquivo foi importado e está pronto para edição
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-800">
                  {Math.floor(Math.random() * 30) + 10}
                </div>
                <div className="text-sm text-green-600">Slides</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-800">
                  {Math.floor(Math.random() * 5) + 3}min
                </div>
                <div className="text-sm text-green-600">Duração</div>
              </div>
            </div>
            
            <div className="flex justify-center space-x-4">
              <Button onClick={() => window.location.href = '/pptx-editor-real'}>
                Abrir no Editor
              </Button>
              <Button variant="outline" onClick={() => {
                setStep(1)
                setFile(null)
                setProgress(0)
              }}>
                Nova Importação
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
