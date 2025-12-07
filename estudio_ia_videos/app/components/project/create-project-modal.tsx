
'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Upload, Sparkles, Loader2, FileText, Zap } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { useProjects, processProjectPPTX } from '../../hooks/use-projects'

interface CreateProjectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function CreateProjectModal({ open, onOpenChange }: CreateProjectModalProps) {
  const router = useRouter()
  const { createProject } = useProjects()
  const [step, setStep] = useState<'choice' | 'pptx' | 'scratch'>('choice')
  const [loading, setLoading] = useState(false)
  
  // Form states
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleReset = () => {
    setStep('choice')
    setProjectName('')
    setProjectDescription('')
    setSelectedFile(null)
    setLoading(false)
  }

  const handleClose = () => {
    handleReset()
    onOpenChange(false)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.name.endsWith('.pptx') && !file.name.endsWith('.ppt')) {
        toast.error('Por favor, selecione um arquivo PowerPoint (.pptx ou .ppt)')
        return
      }
      setSelectedFile(file)
      // Auto-fill project name from filename
      if (!projectName) {
        const name = file.name.replace(/\.(pptx|ppt)$/i, '')
        setProjectName(name)
      }
    }
  }

  const handleCreateFromPPTX = async () => {
    if (!selectedFile) {
      toast.error('Por favor, selecione um arquivo PPTX')
      return
    }

    if (!projectName.trim()) {
      toast.error('Por favor, insira um nome para o projeto')
      return
    }

    setLoading(true)

    try {
      toast.loading('Enviando e processando PPTX...', { id: 'upload-pptx' })

      // Process PPTX - this creates the project automatically
      const result = await processProjectPPTX(selectedFile, projectName)

      toast.success('PPTX processado com sucesso!', { id: 'upload-pptx' })
      
      // Redirect to editor
      if (result.projectId) {
        router.push(`/editor/${result.projectId}`)
        handleClose()
      } else {
        throw new Error('Project ID not returned')
      }
    } catch (error: any) {
      console.error('Error processing PPTX:', error)
      toast.error(error.message || 'Erro ao processar PPTX', { id: 'upload-pptx' })
      setLoading(false)
    }
  }

  const handleCreateFromScratch = async () => {
    if (!projectName.trim()) {
      toast.error('Por favor, insira um nome para o projeto')
      return
    }

    setLoading(true)

    try {
      toast.loading('Criando projeto...', { id: 'create-project' })

      const project = await createProject({
        name: projectName,
        type: 'custom',
        description: projectDescription || undefined
      })

      toast.success('Projeto criado com sucesso!', { id: 'create-project' })
      
      // Redirect to editor
      if (project?.id) {
        router.push(`/editor/${project.id}`)
        handleClose()
      } else {
        throw new Error('Project ID not returned')
      }
    } catch (error: any) {
      console.error('Error creating project:', error)
      toast.error(error.message || 'Erro ao criar projeto', { id: 'create-project' })
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {step === 'choice' && '✨ Criar Novo Projeto'}
            {step === 'pptx' && '📤 Importar Apresentação'}
            {step === 'scratch' && '⚡ Criar do Zero'}
          </DialogTitle>
          <DialogDescription>
            {step === 'choice' && 'Escolha como você quer começar seu projeto'}
            {step === 'pptx' && 'Faça upload de uma apresentação PowerPoint para converter em vídeo'}
            {step === 'scratch' && 'Crie um vídeo profissional do zero com nosso editor'}
          </DialogDescription>
        </DialogHeader>

        {/* STEP 1: CHOICE */}
        {step === 'choice' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Option 1: Import PPTX */}
            <Card 
              className="cursor-pointer hover:shadow-lg hover:border-blue-500 transition-all"
              onClick={() => setStep('pptx')}
            >
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Upload className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Importar PPTX</CardTitle>
                <CardDescription>
                  Converta sua apresentação PowerPoint em vídeo profissional com IA
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                    Processamento automático de slides
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                    Geração de narração com TTS
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                    Templates NR automatizados
                  </li>
                </ul>
                <Button className="w-full mt-4" variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Começar Import
                </Button>
              </CardContent>
            </Card>

            {/* Option 2: Create from Scratch */}
            <Card 
              className="cursor-pointer hover:shadow-lg hover:border-purple-500 transition-all"
              onClick={() => setStep('scratch')}
            >
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Criar do Zero</CardTitle>
                <CardDescription>
                  Comece com um template vazio e personalize tudo do seu jeito
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-600 rounded-full" />
                    Editor visual completo
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-600 rounded-full" />
                    Biblioteca de assets premium
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-600 rounded-full" />
                    Avatares 3D hiper-realistas
                  </li>
                </ul>
                <Button className="w-full mt-4" variant="outline">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Começar Criação
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* STEP 2A: PPTX UPLOAD */}
        {step === 'pptx' && (
          <div className="space-y-6 mt-6">
            {/* Project Name */}
            <div className="space-y-2">
              <Label htmlFor="project-name">Nome do Projeto *</Label>
              <Input
                id="project-name"
                placeholder="Ex: Treinamento NR-12 - Segurança em Máquinas"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Project Description */}
            <div className="space-y-2">
              <Label htmlFor="project-description">Descrição (opcional)</Label>
              <Textarea
                id="project-description"
                placeholder="Descreva brevemente o conteúdo do vídeo..."
                rows={3}
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="file-upload">Arquivo PowerPoint *</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                <input
                  id="file-upload"
                  type="file"
                  accept=".ppt,.pptx"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={loading}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  {selectedFile ? (
                    <div className="space-y-2">
                      <FileText className="h-12 w-12 text-blue-600 mx-auto" />
                      <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <Button variant="outline" size="sm" type="button" disabled={loading}>
                        Trocar arquivo
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                      <p className="text-sm font-medium text-gray-900">
                        Clique para selecionar ou arraste o arquivo
                      </p>
                      <p className="text-xs text-gray-500">
                        Formatos aceitos: .pptx, .ppt (até 50 MB)
                      </p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button variant="ghost" onClick={() => setStep('choice')} disabled={loading}>
                Voltar
              </Button>
              <Button 
                onClick={handleCreateFromPPTX} 
                disabled={!selectedFile || !projectName.trim() || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Criar e Processar
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2B: FROM SCRATCH */}
        {step === 'scratch' && (
          <div className="space-y-6 mt-6">
            {/* Project Name */}
            <div className="space-y-2">
              <Label htmlFor="project-name-scratch">Nome do Projeto *</Label>
              <Input
                id="project-name-scratch"
                placeholder="Ex: Vídeo Institucional - Segurança do Trabalho"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Project Description */}
            <div className="space-y-2">
              <Label htmlFor="project-description-scratch">Descrição (opcional)</Label>
              <Textarea
                id="project-description-scratch"
                placeholder="Descreva o objetivo e público-alvo do vídeo..."
                rows={4}
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Template Preview (Future) */}
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <Sparkles className="h-12 w-12 text-purple-600 mx-auto mb-3" />
              <h4 className="font-semibold text-gray-900 mb-2">
                Você começará com um projeto vazio
              </h4>
              <p className="text-sm text-gray-600">
                Use nosso editor completo para adicionar slides, avatares, narrações e efeitos profissionais
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button variant="ghost" onClick={() => setStep('choice')} disabled={loading}>
                Voltar
              </Button>
              <Button 
                onClick={handleCreateFromScratch} 
                disabled={!projectName.trim() || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Criar Projeto
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
