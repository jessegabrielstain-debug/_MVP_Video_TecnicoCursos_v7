'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Save, 
  X, 
  Plus, 
  Trash2, 
  Upload, 
  Settings, 
  Eye, 
  Play,
  Image,
  Video,
  Music,
  Type,
  Square
} from 'lucide-react';
import { Template, NRCategory, TemplateSlide } from '@/types/templates';

interface TemplateEditorProps {
  template: Template | null;
  onClose: () => void;
  onSave: (template: Partial<Template>) => void;
}

export const TemplateEditor: React.FC<TemplateEditorProps> = ({
  template,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    description: template?.description || '',
    category: template?.category || 'CUSTOM' as NRCategory,
    tags: template?.tags || [],
    thumbnail: template?.thumbnail || '',
    preview: template?.preview || '',
    content: template?.content || {
      slides: [],
      animations: [],
      assets: [],
      interactions: [],
      compliance: {
        nrCategory: 'NR-01',
        requirements: [],
        checkpoints: [],
        certifications: []
      },
      settings: {
        resolution: { width: 1920, height: 1080 },
        frameRate: 30,
        duration: 60,
        audioSettings: {
          enabled: true,
          volume: 100,
          fadeIn: 0,
          fadeOut: 0,
        },
        renderSettings: {
          quality: 'high' as const,
          format: 'mp4' as const,
          codec: 'h264',
          bitrate: 5000,
        },
      },
    },
  });

  const [newTag, setNewTag] = useState('');
  const [activeTab, setActiveTab] = useState('basic');

  const nrCategories: NRCategory[] = [
    'NR-01', 'NR-02', 'NR-03', 'NR-04', 'NR-05',
    'NR-06', 'NR-07', 'NR-08', 'NR-09', 'NR-10',
    'NR-11', 'NR-12', 'NR-13', 'NR-14', 'NR-15',
    'NR-16', 'NR-17', 'NR-18', 'NR-19', 'NR-20',
    'NR-21', 'NR-22', 'NR-23', 'NR-24', 'NR-25',
    'NR-26', 'NR-27', 'NR-28', 'NR-29', 'NR-30',
    'NR-31', 'NR-32', 'NR-33', 'NR-34', 'NR-35',
    'NR-36', 'NR-37', 'CUSTOM'
  ];

  const handleInputChange = (field: string, value: string | number | boolean | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleContentChange = (field: string, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        [field]: value,
      },
    }));
  };

  const handleSettingsChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        settings: {
          ...prev.content.settings,
          [field]: value,
        },
      },
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      handleInputChange('tags', [...formData.tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    handleInputChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };

  const handleAddSlide = () => {
    const newSlide: TemplateSlide = {
      id: `slide-${Date.now()}`,
      type: 'content',
      layout: 'default',
      title: `Slide ${formData.content.slides.length + 1}`,
      content: '',
      duration: 5,
      background: '#ffffff',
      elements: [],
      transitions: [],
    };
    
    handleContentChange('slides', [...formData.content.slides, newSlide]);
  };

  const handleRemoveSlide = (slideId: string) => {
    handleContentChange('slides', formData.content.slides.filter(slide => slide.id !== slideId));
  };

  const handleSlideChange = (slideId: string, field: string, value: string | number | boolean) => {
    const updatedSlides = formData.content.slides.map(slide =>
      slide.id === slideId ? { ...slide, [field]: value } : slide
    );
    handleContentChange('slides', updatedSlides);
  };

  const handleSave = () => {
    const templateData = {
      ...formData,
      isCustom: true,
      updatedAt: new Date(),
      ...(template ? {} : { 
        id: `template-${Date.now()}`,
        createdAt: new Date(),
        author: 'Usuário Atual',
        version: '1.0.0',
        downloads: 0,
        rating: 0,
        isFavorite: false,
        metadata: {
          difficulty: 'beginner' as const,
          estimatedDuration: 60,
          targetAudience: ['General'],
          learningObjectives: [],
          prerequisites: [],
          language: 'pt-BR',
          accessibility: {
            screenReader: true,
            highContrast: false,
            keyboardNavigation: true,
            closedCaptions: false,
            audioDescription: false,
            signLanguage: false,
          },
          compliance: {
            nrCategories: [formData.category],
            requirements: [],
            certifications: [],
            lastAudit: new Date(),
            status: 'compliant' as const,
            auditScore: 100,
          },
          performance: {
            renderTime: 0,
            fileSize: 0,
            complexity: 'medium' as const,
            optimization: 85,
          },
          compatibility: {
            browsers: ['Chrome', 'Firefox', 'Safari', 'Edge'],
            devices: ['Desktop', 'Mobile', 'Tablet'],
            resolutions: ['1920x1080', '1280x720', '3840x2160'],
            formats: ['mp4', 'webm'],
          },
          usage: {
            views: 0,
            downloads: 0,
            likes: 0,
            shares: 0,
            lastUsed: new Date(),
          },
        },
      }),
    };

    onSave(templateData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {template ? 'Editar Template' : 'Criar Novo Template'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Básico</TabsTrigger>
            <TabsTrigger value="slides">Slides</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome do Template</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Digite o nome do template..."
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Descreva o template..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="category">Categoria NR</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleInputChange('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria..." />
                    </SelectTrigger>
                    <SelectContent>
                      {nrCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Tags</Label>
                  <div className="flex space-x-2 mb-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Adicionar tag..."
                      onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    />
                    <Button onClick={handleAddTag} size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {formData.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <X 
                          className="w-3 h-3 cursor-pointer" 
                          onClick={() => handleRemoveTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="thumbnail">URL da Thumbnail</Label>
                  <Input
                    id="thumbnail"
                    value={formData.thumbnail}
                    onChange={(e) => handleInputChange('thumbnail', e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <Label htmlFor="preview">URL do Preview</Label>
                  <Input
                    id="preview"
                    value={formData.preview}
                    onChange={(e) => handleInputChange('preview', e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                {formData.thumbnail && (
                  <div>
                    <Label>Preview da Thumbnail</Label>
                    <div className="mt-2 border rounded-lg overflow-hidden">
                      <img
                        src={formData.thumbnail}
                        alt="Thumbnail preview"
                        className="w-full h-32 object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="slides" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Slides ({formData.content.slides.length})</h3>
              <Button onClick={handleAddSlide}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Slide
              </Button>
            </div>

            <div className="space-y-4">
              {formData.content.slides.map((slide, index) => (
                <Card key={slide.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Slide {index + 1}</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveSlide(slide.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label>Título</Label>
                        <Input
                          value={slide.title}
                          onChange={(e) => handleSlideChange(slide.id, 'title', e.target.value)}
                          placeholder="Título do slide..."
                        />
                      </div>
                      <div>
                        <Label>Duração (segundos)</Label>
                        <Input
                          type="number"
                          value={slide.duration}
                          onChange={(e) => handleSlideChange(slide.id, 'duration', parseInt(e.target.value) || 5)}
                          min="1"
                          max="60"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Conteúdo</Label>
                      <Textarea
                        value={slide.content}
                        onChange={(e) => handleSlideChange(slide.id, 'content', e.target.value)}
                        placeholder="Conteúdo do slide..."
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label>Cor de Fundo</Label>
                      <Input
                        type="color"
                        value={slide.background}
                        onChange={(e) => handleSlideChange(slide.id, 'background', e.target.value)}
                        className="w-20 h-10"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}

              {formData.content.slides.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Square className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhum slide adicionado ainda.</p>
                  <p className="text-sm">Clique em "Adicionar Slide" para começar.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Configurações de Vídeo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Largura</Label>
                      <Input
                        type="number"
                        value={formData.content.settings.resolution.width}
                        onChange={(e) => handleSettingsChange('resolution', {
                          ...formData.content.settings.resolution,
                          width: parseInt(e.target.value) || 1920
                        })}
                      />
                    </div>
                    <div>
                      <Label>Altura</Label>
                      <Input
                        type="number"
                        value={formData.content.settings.resolution.height}
                        onChange={(e) => handleSettingsChange('resolution', {
                          ...formData.content.settings.resolution,
                          height: parseInt(e.target.value) || 1080
                        })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Taxa de Quadros (FPS)</Label>
                    <Select
                      value={formData.content.settings.frameRate.toString()}
                      onValueChange={(value) => handleSettingsChange('frameRate', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24">24 FPS</SelectItem>
                        <SelectItem value="30">30 FPS</SelectItem>
                        <SelectItem value="60">60 FPS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Duração Total (segundos)</Label>
                    <Input
                      type="number"
                      value={formData.content.settings.duration}
                      onChange={(e) => handleSettingsChange('duration', parseInt(e.target.value) || 60)}
                      min="1"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Configurações de Renderização</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Qualidade</Label>
                    <Select
                      value={formData.content.settings.renderSettings.quality}
                      onValueChange={(value) => handleSettingsChange('renderSettings', {
                        ...formData.content.settings.renderSettings,
                        quality: value
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="ultra">Ultra</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Formato</Label>
                    <Select
                      value={formData.content.settings.renderSettings.format}
                      onValueChange={(value) => handleSettingsChange('renderSettings', {
                        ...formData.content.settings.renderSettings,
                        format: value
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mp4">MP4</SelectItem>
                        <SelectItem value="webm">WebM</SelectItem>
                        <SelectItem value="avi">AVI</SelectItem>
                        <SelectItem value="mov">MOV</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Bitrate (kbps)</Label>
                    <Input
                      type="number"
                      value={formData.content.settings.renderSettings.bitrate}
                      onChange={(e) => handleSettingsChange('renderSettings', {
                        ...formData.content.settings.renderSettings,
                        bitrate: parseInt(e.target.value) || 5000
                      })}
                      min="1000"
                      max="50000"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Preview do Template</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Play className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600">Preview será gerado após salvar</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Resumo do Template</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Nome:</span> {formData.name || 'Sem nome'}
                  </div>
                  <div>
                    <span className="font-medium">Categoria:</span> {formData.category}
                  </div>
                  <div>
                    <span className="font-medium">Slides:</span> {formData.content.slides.length}
                  </div>
                  <div>
                    <span className="font-medium">Duração:</span> {formData.content.settings.duration}s
                  </div>
                  <div>
                    <span className="font-medium">Resolução:</span> {formData.content.settings.resolution.width}x{formData.content.settings.resolution.height}
                  </div>
                  <div>
                    <span className="font-medium">FPS:</span> {formData.content.settings.frameRate}
                  </div>
                </div>
                
                {formData.tags.length > 0 && (
                  <div>
                    <span className="font-medium text-sm">Tags:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {formData.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" />
            {template ? 'Salvar Alterações' : 'Criar Template'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};