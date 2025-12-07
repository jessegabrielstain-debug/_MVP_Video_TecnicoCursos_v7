
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { FileText, Upload, CheckCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface EnhancedPPTXWizardProps {
  onProjectReady: (projectData: any) => void
  onCancel: () => void
}

export function EnhancedPPTXWizard({ onProjectReady, onCancel }: EnhancedPPTXWizardProps) {
  const [step, setStep] = useState(1)
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      setFile(files[0])
      setStep(2)
    }
  }

  const handleProcess = async () => {
    if (!file) return
    
    setIsProcessing(true)
    
    try {
      await new Promise(resolve => setTimeout(resolve, 3000))
      setStep(3)
      
      // Simular dados do projeto processado
      const projectData = {
        id: `project_${Date.now()}`,
        name: file.name.replace('.pptx', ''),
        slides: 10,
        duration: 120,
        status: 'ready'
      }
      
      toast.success('Processamento concluído!')
      onProjectReady(projectData)
    } catch (error) {
      toast.error('Erro no processamento')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Enhanced PPTX Wizard</CardTitle>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="text-center space-y-4">
              <Upload className="h-12 w-12 mx-auto text-gray-400" />
              <div className="space-y-3">
                <input
                  type="file"
                  accept=".pptx,.ppt"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-wizard"
                />
                <label htmlFor="file-wizard">
                  <Button className="cursor-pointer">
                    Selecionar PPTX
                  </Button>
                </label>
                <div>
                  <Button onClick={onCancel} variant="outline">
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {step === 2 && file && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>{file.name}</span>
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleProcess} disabled={isProcessing}>
                  {isProcessing ? 'Processando...' : 'Processar Arquivo'}
                </Button>
                <Button onClick={onCancel} variant="outline" disabled={isProcessing}>
                  Cancelar
                </Button>
              </div>
              {isProcessing && <Progress value={50} />}
            </div>
          )}
          
          {step === 3 && (
            <div className="text-center space-y-4">
              <CheckCircle className="h-12 w-12 mx-auto text-green-600" />
              <p>Processamento concluído!</p>
              <Button onClick={() => setStep(1)}>
                Novo Upload
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
