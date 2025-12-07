
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Loader2, Video, FileText, Upload as UploadIcon } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Project as VideoProject } from '../../hooks/use-projects'
import { useToast } from '../../hooks/use-toast'
import { PPTXUploadModal } from '../pptx/pptx-upload-modal'

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onProjectCreated: (project: VideoProject) => void
}

export default function CreateProjectModal({ isOpen, onClose, onProjectCreated }: CreateProjectModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'custom' // 'custom' | 'template' | 'pptx'
  })
  const [pptxModalOpen, setPptxModalOpen] = useState(false)
  const { toast } = useToast()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // If PPTX type, open PPTX upload modal
    if (formData.type === 'pptx') {
      setPptxModalOpen(true)
      return
    }
    
    setLoading(true)

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })


      if (response.ok) {
        const data = await response.json()
        onProjectCreated(data.project)
        setFormData({ title: '', description: '', type: 'basic' })
      } else {
        const error = await response.json()
        toast({
          title: 'Erro',
          description: error.error || 'Erro ao criar projeto',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro de conexão',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }
  
  const handlePPTXSuccess = (projectId: string) => {
    setPptxModalOpen(false)
    onClose()
    // Reload projects or redirect
    window.location.href = `/editor/${projectId}`
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl max-w-md w-full"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Novo Projeto</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Título do Projeto</Label>
              <Input
                id="title"
                type="text"
                placeholder="Ex: Treinamento NR-12 - Segurança em Máquinas"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                placeholder="Descreva brevemente o conteúdo do vídeo..."
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <Label>Tipo de Projeto</Label>
              <div className="grid grid-cols-3 gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => handleChange('type', 'custom')}
                  className={`p-4 border rounded-lg flex flex-col items-center space-y-2 transition-colors ${
                    formData.type === 'custom' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Video className="h-6 w-6 text-blue-600" />
                  <span className="text-sm font-medium">Do Zero</span>
                  <span className="text-xs text-gray-600 text-center">
                    Criar vídeo básico
                  </span>
                </button>
                
                <button
                  type="button"
                  onClick={() => handleChange('type', 'pptx')}
                  className={`p-4 border rounded-lg flex flex-col items-center space-y-2 transition-colors ${
                    formData.type === 'pptx' 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <UploadIcon className="h-6 w-6 text-green-600" />
                  <span className="text-sm font-medium">PPTX</span>
                  <span className="text-xs text-gray-600 text-center">
                    Importar slides
                  </span>
                </button>
                
                <button
                  type="button"
                  onClick={() => handleChange('type', 'template')}
                  className={`p-4 border rounded-lg flex flex-col items-center space-y-2 transition-colors ${
                    formData.type === 'template' 
                      ? 'border-orange-500 bg-orange-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <FileText className="h-6 w-6 text-orange-600" />
                  <span className="text-sm font-medium">Template</span>
                  <span className="text-xs text-gray-600 text-center">
                    Usar template NR
                  </span>
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {formData.type === 'pptx' ? 'Continuar para Upload' : 'Criar Projeto'}
            </Button>
          </form>
        </div>
      </motion.div>
      
      {/* PPTX Upload Modal */}
      <PPTXUploadModal
        open={pptxModalOpen}
        onOpenChange={setPptxModalOpen}
        onSuccess={handlePPTXSuccess}
      />
    </div>
  )
}
