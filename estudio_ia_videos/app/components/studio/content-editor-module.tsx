/**
 * ✏️ CONTENT EDITOR MODULE
 * Módulo de edição de conteúdo para o Studio Unificado
 */

'use client'

import React, { useState, useEffect } from 'react'
import { 
  Edit3, 
  Save, 
  Undo, 
  Redo, 
  Type, 
  Image, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward,
  Clock,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Copy,
  Move,
  Zap
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'

import type { UnifiedProject, ProjectSlide } from '@/lib/stores/unified-project-store'

interface ContentEditorModuleProps {
  project: UnifiedProject
  onSlidesUpdate: (slides: ProjectSlide[]) => void
  onExecuteStep: (data: any) => Promise<void>
}

export default function ContentEditorModule({ 
  project, 
  onSlidesUpdate, 
  onExecuteStep 
}: ContentEditorModuleProps) {
  const [slides, setSlides] = useState<ProjectSlide[]>(project.slides || [])
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackTime, setPlaybackTime] = useState(0)
  const [history, setHistory] = useState<ProjectSlide[][]>([slides])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [isPreviewMode, setIsPreviewMode] = useState(false)

  const currentSlide = slides[currentSlideIndex]

  // Update slides when project changes
  useEffect(() => {
    if (project.slides && project.slides.length > 0) {
      setSlides(project.slides)
      setHistory([project.slides])
      setHistoryIndex(0)
    }
  }, [project.slides])

  // Auto-save slides
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (slides.length > 0) {
        onSlidesUpdate(slides)
      }
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [slides, onSlidesUpdate])

  // History management
  const addToHistory = (newSlides: ProjectSlide[]) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push([...newSlides])
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setSlides([...history[newIndex]])
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      setSlides([...history[newIndex]])
    }
  }

  // Slide management
  const updateSlide = (index: number, updates: Partial<ProjectSlide>) => {
    const newSlides = [...slides]
    newSlides[index] = { ...newSlides[index], ...updates }
    setSlides(newSlides)
    addToHistory(newSlides)
  }

  const addSlide = (afterIndex?: number) => {
    const insertIndex = afterIndex !== undefined ? afterIndex + 1 : slides.length
    const newSlide: ProjectSlide = {
      id: `slide-${Date.now()}`,
      slideNumber: insertIndex + 1,
      title: `Slide ${insertIndex + 1}`,
      content: '',
      type: 'content',
      duration: 5,
      notes: '',
      animations: [],
      transitions: {}
    }

    const newSlides = [...slides]
    newSlides.splice(insertIndex, 0, newSlide)
    
    // Renumber slides
    newSlides.forEach((slide, index) => {
      slide.slideNumber = index + 1
    })

    setSlides(newSlides)
    addToHistory(newSlides)
    setCurrentSlideIndex(insertIndex)
    toast.success('Slide adicionado!')
  }

  const deleteSlide = (index: number) => {
    if (slides.length <= 1) {
      toast.error('Não é possível excluir o último slide')
      return
    }

    const newSlides = slides.filter((_, i) => i !== index)
    
    // Renumber slides
    newSlides.forEach((slide, i) => {
      slide.slideNumber = i + 1
    })

    setSlides(newSlides)
    addToHistory(newSlides)
    
    if (currentSlideIndex >= newSlides.length) {
      setCurrentSlideIndex(newSlides.length - 1)
    }
    
    toast.success('Slide excluído!')
  }

  const duplicateSlide = (index: number) => {
    const slideToClone = slides[index]
    const newSlide: ProjectSlide = {
      ...slideToClone,
      id: `slide-${Date.now()}`,
      slideNumber: index + 2,
      title: `${slideToClone.title} (Cópia)`
    }

    const newSlides = [...slides]
    newSlides.splice(index + 1, 0, newSlide)
    
    // Renumber slides
    newSlides.forEach((slide, i) => {
      slide.slideNumber = i + 1
    })

    setSlides(newSlides)
    addToHistory(newSlides)
    setCurrentSlideIndex(index + 1)
    toast.success('Slide duplicado!')
  }

  const moveSlide = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return

    const newSlides = [...slides]
    const [movedSlide] = newSlides.splice(fromIndex, 1)
    newSlides.splice(toIndex, 0, movedSlide)
    
    // Renumber slides
    newSlides.forEach((slide, index) => {
      slide.slideNumber = index + 1
    })

    setSlides(newSlides)
    addToHistory(newSlides)
    setCurrentSlideIndex(toIndex)
    toast.success('Slide movido!')
  }

  // Playback controls
  const togglePlayback = () => {
    setIsPlaying(!isPlaying)
  }

  const nextSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1)
      setPlaybackTime(0)
    }
  }

  const previousSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1)
      setPlaybackTime(0)
    }
  }

  // Calculate total duration
  const totalDuration = slides.reduce((total, slide) => total + (slide.duration || 0), 0)

  // Handle execute step
  const handleExecuteStep = async () => {
    try {
      await onExecuteStep({
        slides,
        totalDuration,
        settings: {
          autoAdvance: true,
          includeTransitions: true,
          includeAnimations: true
        }
      })
      toast.success('Edição concluída! Prosseguindo para Avatar...')
    } catch (error: any) {
      toast.error('Erro ao processar edição: ' + error.message)
    }
  }

  // Render slide thumbnail
  const renderSlideThumbnail = (slide: ProjectSlide, index: number) => (
    <Card 
      key={slide.id}
      className={`cursor-pointer transition-all ${
        index === currentSlideIndex 
          ? 'ring-2 ring-blue-500 bg-blue-50' 
          : 'hover:bg-gray-50'
      }`}
      onClick={() => setCurrentSlideIndex(index)}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline" className="text-xs">
            {slide.slideNumber}
          </Badge>
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3 text-gray-500" />
            <span className="text-xs text-gray-500">{slide.duration}s</span>
          </div>
        </div>
        
        {slide.thumbnailUrl ? (
          <img 
            src={slide.thumbnailUrl} 
            alt={slide.title}
            className="w-full h-16 object-cover rounded border mb-2"
          />
        ) : (
          <div className="w-full h-16 bg-gray-100 rounded border mb-2 flex items-center justify-center">
            <Type className="w-6 h-6 text-gray-400" />
          </div>
        )}
        
        <h4 className="font-medium text-xs line-clamp-1 mb-1">
          {slide.title}
        </h4>
        
        <p className="text-xs text-gray-600 line-clamp-2">
          {slide.content || 'Sem conteúdo'}
        </p>

        {/* Slide actions */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t">
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation()
                duplicateSlide(index)
              }}
            >
              <Copy className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation()
                deleteSlide(index)
              }}
              disabled={slides.length <= 1}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
          
          <div className="flex items-center space-x-1">
            {index > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  moveSlide(index, index - 1)
                }}
              >
                ↑
              </Button>
            )}
            {index < slides.length - 1 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  moveSlide(index, index + 1)
                }}
              >
                ↓
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (!currentSlide) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Nenhum slide disponível</p>
        <Button onClick={() => addSlide()}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Primeiro Slide
        </Button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
      {/* Slides Panel */}
      <div className="lg:col-span-1">
        <Card className="h-full">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Slides ({slides.length})</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addSlide(currentSlideIndex)}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-96">
              <div className="space-y-2 p-3">
                {slides.map((slide, index) => renderSlideThumbnail(slide, index))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Main Editor */}
      <div className="lg:col-span-2">
        <Card className="h-full">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CardTitle className="text-sm">
                  Editor - Slide {currentSlide.slideNumber}
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  {currentSlide.duration}s
                </Badge>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={undo}
                  disabled={historyIndex <= 0}
                >
                  <Undo className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={redo}
                  disabled={historyIndex >= history.length - 1}
                >
                  <Redo className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsPreviewMode(!isPreviewMode)}
                >
                  {isPreviewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {!isPreviewMode ? (
              <>
                {/* Slide Title */}
                <div>
                  <Label htmlFor="slideTitle">Título do Slide</Label>
                  <Input
                    id="slideTitle"
                    value={currentSlide.title}
                    onChange={(e) => updateSlide(currentSlideIndex, { title: e.target.value })}
                    placeholder="Digite o título do slide"
                  />
                </div>

                {/* Slide Content */}
                <div>
                  <Label htmlFor="slideContent">Conteúdo</Label>
                  <Textarea
                    id="slideContent"
                    value={currentSlide.content}
                    onChange={(e) => updateSlide(currentSlideIndex, { content: e.target.value })}
                    placeholder="Digite o conteúdo do slide"
                    rows={8}
                  />
                </div>

                {/* Slide Duration */}
                <div>
                  <Label htmlFor="slideDuration">
                    Duração: {currentSlide.duration} segundos
                  </Label>
                  <Slider
                    id="slideDuration"
                    min={1}
                    max={30}
                    step={1}
                    value={[currentSlide.duration || 5]}
                    onValueChange={([value]) => updateSlide(currentSlideIndex, { duration: value })}
                    className="mt-2"
                  />
                </div>

                {/* Speaker Notes */}
                <div>
                  <Label htmlFor="slideNotes">Notas do Apresentador</Label>
                  <Textarea
                    id="slideNotes"
                    value={currentSlide.notes || ''}
                    onChange={(e) => updateSlide(currentSlideIndex, { notes: e.target.value })}
                    placeholder="Adicione notas para o apresentador (opcional)"
                    rows={3}
                  />
                </div>
              </>
            ) : (
              /* Preview Mode */
              <div className="space-y-4">
                <div className="bg-gray-900 text-white p-8 rounded-lg min-h-64 flex flex-col justify-center">
                  <h2 className="text-2xl font-bold mb-4 text-center">
                    {currentSlide.title}
                  </h2>
                  <div className="text-lg leading-relaxed whitespace-pre-wrap">
                    {currentSlide.content}
                  </div>
                </div>
                
                {currentSlide.notes && (
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <h4 className="font-medium text-yellow-800 mb-2">Notas do Apresentador:</h4>
                    <p className="text-yellow-700 whitespace-pre-wrap">{currentSlide.notes}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Controls Panel */}
      <div className="lg:col-span-1">
        <div className="space-y-4">
          {/* Playback Controls */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Controles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={previousSlide}
                  disabled={currentSlideIndex === 0}
                >
                  <SkipBack className="w-4 h-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={togglePlayback}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextSlide}
                  disabled={currentSlideIndex === slides.length - 1}
                >
                  <SkipForward className="w-4 h-4" />
                </Button>
              </div>

              <div className="text-center text-sm text-gray-600">
                Slide {currentSlideIndex + 1} de {slides.length}
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Duração Total:</span>
                  <span>{Math.floor(totalDuration / 60)}:{(totalDuration % 60).toString().padStart(2, '0')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Slides:</span>
                  <span>{slides.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => addSlide(currentSlideIndex)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Slide
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => duplicateSlide(currentSlideIndex)}
              >
                <Copy className="w-4 h-4 mr-2" />
                Duplicar Slide
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => deleteSlide(currentSlideIndex)}
                disabled={slides.length <= 1}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir Slide
              </Button>
            </CardContent>
          </Card>

          {/* Continue Button */}
          <Button 
            className="w-full"
            onClick={handleExecuteStep}
            disabled={slides.length === 0}
          >
            <Zap className="w-4 h-4 mr-2" />
            Continuar para Avatar
          </Button>
        </div>
      </div>
    </div>
  )
}