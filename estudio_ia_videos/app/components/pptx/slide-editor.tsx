

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Switch } from '../ui/switch'
import { Label } from '../ui/label'
import { Alert, AlertDescription } from '../ui/alert'
import { 
  Eye, 
  Play, 
  Pause, 
  RotateCcw, 
  Settings, 
  Image as ImageIcon,
  Type,
  Clock,
  Volume2,
  User,
  AlertTriangle,
  CheckCircle,
  Edit3
} from 'lucide-react'
import { CanvasEditor } from './canvas-editor'
import { PPTXSlide } from '@/types/pptx-types'

interface AvailableTemplate {
  id: string
  name: string
  layout?: string
}

interface SlideSceneMapping {
  templateId?: string
  customizations?: {
    avatarEnabled?: boolean
    [key: string]: unknown
  }
  [key: string]: unknown
}

interface SlideNarrationResult {
  totalDuration?: number
  segments?: Array<{ text: string; [key: string]: unknown }>
  [key: string]: unknown
}

interface SlideEditorProps {
  slide: PPTXSlide
  sceneMapping: SlideSceneMapping | null
  narrationResult: SlideNarrationResult | null
  availableTemplates: AvailableTemplate[]
  onSlideUpdate: (slideId: string, updates: Partial<PPTXSlide>) => void
  onTemplateChange: (slideId: string, templateId: string) => void
  onPreview: (slideId: string) => void
}

export function SlideEditor({ 
  slide, 
  sceneMapping, 
  narrationResult, 
  availableTemplates,
  onSlideUpdate,
  onTemplateChange,
  onPreview 
}: SlideEditorProps) {
  
  const [editMode, setEditMode] = useState(false)
  const [localSlide, setLocalSlide] = useState(slide)
  const [isPlaying, setIsPlaying] = useState(false)
  
  useEffect(() => {
    setLocalSlide(slide)
  }, [slide])

  const currentTemplate = availableTemplates.find(t => t.id === sceneMapping?.templateId)
  
  const handleSaveEdits = () => {
    onSlideUpdate(slide.slideNumber.toString(), localSlide)
    setEditMode(false)
  }

  const handleTemplateChange = (newTemplateId: string) => {
    onTemplateChange(slide.slideNumber.toString(), newTemplateId)
  }

  const handlePreviewAudio = () => {
    setIsPlaying(!isPlaying)
    onPreview(slide.slideNumber.toString())
    
    // Auto-stop after preview duration
    if (!isPlaying && narrationResult?.totalDuration) {
      setTimeout(() => setIsPlaying(false), narrationResult.totalDuration * 1000)
    }
  }

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              {slide.slideNumber}
            </div>
            <div>
              <CardTitle className="text-lg">{slide.title}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {currentTemplate?.name || 'Template Padrão'}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  {narrationResult?.totalDuration ? `${Math.round(narrationResult.totalDuration)}s` : '15s'}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditMode(!editMode)}
            >
              <Edit3 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePreviewAudio}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        
        {/* Template Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor={`template-${slide.slideNumber}`}>Template</Label>
            <Select value={sceneMapping?.templateId || ''} onValueChange={handleTemplateChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar template" />
              </SelectTrigger>
              <SelectContent>
                {availableTemplates.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Configurações Extras</Label>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={sceneMapping?.customizations?.avatarEnabled !== false}
                  onCheckedChange={(checked) => {
                    const updates = {
                      ...sceneMapping,
                      customizations: {
                        ...sceneMapping?.customizations,
                        avatarEnabled: checked
                      }
                    } as Record<string, unknown>
                    onSlideUpdate(slide.slideNumber.toString(), updates as Partial<PPTXSlide>)
                  }}
                />
                <Label className="text-sm">Avatar</Label>
              </div>
              
              <Button variant="ghost" size="sm" onClick={() => onPreview(slide.slideNumber.toString())}>
                <Eye className="w-4 h-4 mr-1" />
                Preview
              </Button>
            </div>
          </div>
        </div>

        {editMode ? (
          <div className="space-y-4 border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
            <div>
              <Label htmlFor={`title-${slide.slideNumber}`}>Título</Label>
              <Textarea
                id={`title-${slide.slideNumber}`}
                value={localSlide.title}
                onChange={(e) => setLocalSlide((prev: PPTXSlide) => ({ ...prev, title: e.target.value }))}
                placeholder="Título do slide"
                rows={1}
              />
            </div>
            
            <div>
              <Label htmlFor={`bullets-${slide.slideNumber}`}>Conteúdo (um item por linha)</Label>
              <Textarea
                id={`bullets-${slide.slideNumber}`}
                value={localSlide.bullets?.join('\n') || ''}
                onChange={(e) => setLocalSlide((prev: PPTXSlide) => ({ 
                  ...prev, 
                  bullets: e.target.value.split('\n').filter(line => line.trim())
                }))}
                placeholder="Digite o conteúdo do slide, um ponto por linha"
                rows={4}
              />
            </div>
            
            <div>
              <Label>Canvas</Label>
              <CanvasEditor
                slide={slide}
                onChange={(updates) => {
                  setLocalSlide((prev: PPTXSlide) => ({ ...prev, elements: updates.elements }))
                  onSlideUpdate(slide.slideNumber.toString(), { elements: updates.elements } as any)
                }}
              />
            </div>
            
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveEdits}>
                <CheckCircle className="w-4 h-4 mr-1" />
                Salvar
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                setLocalSlide(slide)
                setEditMode(false)
              }}>
                <RotateCcw className="w-4 h-4 mr-1" />
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Content Display */}
            <div>
              {slide.bullets && slide.bullets.length > 0 ? (
                <ul className="space-y-1">
                  {slide.bullets.map((bullet: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                      {bullet}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                  {slide.notes || 'Sem conteúdo adicional'}
                </p>
              )}
            </div>
            
            {/* Images */}
            {slide.images && slide.images.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <ImageIcon className="w-4 h-4" />
                <span>{slide.images.length} imagem(ns) detectada(s)</span>
              </div>
            )}
          </div>
        )}

        {/* Narration Preview */}
        {narrationResult && (
          <div className="border rounded-lg p-3 bg-blue-50 dark:bg-blue-950">
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-medium text-sm flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                Narração Gerada
              </h5>
              <Badge variant="outline" className="text-xs">
                {narrationResult.segments?.length || 0} segmentos
              </Badge>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {narrationResult.segments?.map((seg) => seg.text).join(' ') || 'Processando narração...'}
            </p>
          </div>
        )}

        {/* Quality Indicators */}
        <div className="flex items-center gap-2 text-xs">
          {slide.title && slide.title.length > 0 ? (
            <Badge variant="outline" className="text-green-600">
              <CheckCircle className="w-3 h-3 mr-1" />
              Título OK
            </Badge>
          ) : (
            <Badge variant="outline" className="text-red-600">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Sem título
            </Badge>
          )}
          
          {(slide.bullets && slide.bullets.length > 0) || slide.notes ? (
            <Badge variant="outline" className="text-green-600">
              <CheckCircle className="w-3 h-3 mr-1" />
              Conteúdo OK
            </Badge>
          ) : (
            <Badge variant="outline" className="text-yellow-600">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Conteúdo limitado
            </Badge>
          )}
          
          {currentTemplate && (
            <Badge variant="outline" className="text-blue-600">
              <Type className="w-3 h-3 mr-1" />
              {currentTemplate.layout}
            </Badge>
          )}
        </div>

      </CardContent>
    </Card>
  )
}
