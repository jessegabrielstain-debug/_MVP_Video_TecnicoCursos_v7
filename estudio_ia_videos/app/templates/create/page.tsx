// TODO: Alinhar Template type com Omit<Template, ...>
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTemplates } from '@/hooks/useTemplates';
import { Template, NRCategory } from '@/types/templates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Plus, 
  X, 
  Upload,
  BookOpen,
  Users,
  Clock,
  Award,
  Accessibility,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';

const NR_CATEGORIES: NRCategory[] = [
  'NR-01', 'NR-02', 'NR-03', 'NR-04', 'NR-05', 'NR-06', 'NR-07', 'NR-08', 'NR-09', 'NR-10',
  'NR-11', 'NR-12', 'NR-13', 'NR-14', 'NR-15', 'NR-16', 'NR-17', 'NR-18', 'NR-19', 'NR-20',
  'NR-21', 'NR-22', 'NR-23', 'NR-24', 'NR-25', 'NR-26', 'NR-27', 'NR-28', 'NR-29', 'NR-30',
  'NR-31', 'NR-32', 'NR-33', 'NR-34', 'NR-35', 'NR-36', 'NR-37'
];

const DIFFICULTY_OPTIONS = [
  { value: 'beginner', label: 'Básico' },
  { value: 'intermediate', label: 'Intermediário' },
  { value: 'advanced', label: 'Avançado' }
];

export default function CreateTemplatePage() {
  const router = useRouter();
  const { createTemplate } = useTemplates();
  
  const [isLoading, setIsLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState('basic');
  
  // Basic Information
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<NRCategory>('NR-12');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  
  // Metadata
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [estimatedDuration, setEstimatedDuration] = useState(30);
  const [targetAudience, setTargetAudience] = useState<string[]>([]);
  const [newAudience, setNewAudience] = useState('');
  const [learningObjectives, setLearningObjectives] = useState<string[]>([]);
  const [newObjective, setNewObjective] = useState('');
  const [prerequisites, setPrerequisites] = useState<string[]>([]);
  const [newPrerequisite, setNewPrerequisite] = useState('');
  
  // Accessibility
  const [accessibility, setAccessibility] = useState({
    screenReader: false,
    highContrast: false,
    keyboardNavigation: false,
    closedCaptions: false,
    audioDescription: false,
    signLanguage: false,
  });
  
  // Compliance
  const [certifications, setCertifications] = useState<string[]>([]);
  const [newCertification, setNewCertification] = useState('');
  
  // Media
  const [thumbnail, setThumbnail] = useState('');
  const [preview, setPreview] = useState('');

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const addAudience = () => {
    if (newAudience.trim() && !targetAudience.includes(newAudience.trim())) {
      setTargetAudience([...targetAudience, newAudience.trim()]);
      setNewAudience('');
    }
  };

  const removeAudience = (audienceToRemove: string) => {
    setTargetAudience(targetAudience.filter(audience => audience !== audienceToRemove));
  };

  const addObjective = () => {
    if (newObjective.trim() && !learningObjectives.includes(newObjective.trim())) {
      setLearningObjectives([...learningObjectives, newObjective.trim()]);
      setNewObjective('');
    }
  };

  const removeObjective = (objectiveToRemove: string) => {
    setLearningObjectives(learningObjectives.filter(objective => objective !== objectiveToRemove));
  };

  const addPrerequisite = () => {
    if (newPrerequisite.trim() && !prerequisites.includes(newPrerequisite.trim())) {
      setPrerequisites([...prerequisites, newPrerequisite.trim()]);
      setNewPrerequisite('');
    }
  };

  const removePrerequisite = (prerequisiteToRemove: string) => {
    setPrerequisites(prerequisites.filter(prerequisite => prerequisite !== prerequisiteToRemove));
  };

  const addCertification = () => {
    if (newCertification.trim() && !certifications.includes(newCertification.trim())) {
      setCertifications([...certifications, newCertification.trim()]);
      setNewCertification('');
    }
  };

  const removeCertification = (certificationToRemove: string) => {
    setCertifications(certifications.filter(cert => cert !== certificationToRemove));
  };

  const generateDefaultThumbnail = () => {
    const prompts: Record<string, string> = {
      'NR-12': 'safety training machines equipment industrial workplace',
      'NR-35': 'height work safety training construction harness',
      'NR-33': 'confined spaces safety training industrial tank',
      'NR-10': 'electrical safety training power lines equipment',
      'NR-06': 'personal protective equipment safety training',
      'NR-18': 'construction safety training building site',
      'NR-20': 'flammable combustible safety training industrial',
      'NR-23': 'fire protection safety training emergency',
    };
    
    const prompt = prompts[category] || 'safety training workplace industrial';
    const thumbnailUrl = `https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=square`;
    const previewUrl = `https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt + ' preview')}&image_size=landscape_16_9`;
    
    setThumbnail(thumbnailUrl);
    setPreview(previewUrl);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Nome do template é obrigatório');
      return;
    }

    if (!description.trim()) {
      toast.error('Descrição do template é obrigatória');
      return;
    }

    setIsLoading(true);

    try {
      const templateData = {
        name: name.trim(),
        description: description.trim(),
        category,
        thumbnail: thumbnail || `https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent('safety training ' + category)}&image_size=square`,
        preview: preview || `https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent('safety training preview ' + category)}&image_size=landscape_16_9`,
        tags,
        author: 'User',
        version: '1.0',
        rating: 0,
        downloads: 0,
        isCustom: true,
        isFavorite: false,
        content: {
          slides: [],
          assets: [],
          animations: [],
          interactions: [],
          compliance: {
            nrCategory: category,
            requirements: [],
            checkpoints: [],
            certifications: certifications.map(cert => ({
              id: `cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              name: cert,
              authority: 'Sistema',
              validityPeriod: 365,
              requirements: [],
              template: '',
            })),
          },
          settings: {
            duration: estimatedDuration * 60,
            resolution: { width: 1920, height: 1080 },
            frameRate: 30,
            renderSettings: {
              quality: 'high' as const,
              format: 'mp4' as const,
            },
          },
        },
        metadata: {
          difficulty,
          estimatedDuration,
          targetAudience,
          learningObjectives,
          prerequisites,
          language: 'pt-BR',
          accessibility,
          compliance: {
            nrCategories: [category],
            lastAudit: new Date(),
            auditScore: 0,
            certifications,
            status: 'pending' as const,
            requirements: [],
          },
          performance: {
            renderTime: 0,
            fileSize: 0,
            complexity: 'low' as const,
          },
        },
      };

      const newTemplate = await createTemplate(templateData);
      
      toast.success('Template criado com sucesso!');
      router.push(`/templates`);
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Erro ao criar template');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = () => {
    // Open preview in new tab or modal
    toast.info('Funcionalidade de preview em desenvolvimento');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Criar Novo Template</h1>
              <p className="text-muted-foreground">
                Configure seu template personalizado para treinamentos
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handlePreview}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              Preview
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {isLoading ? 'Salvando...' : 'Salvar Template'}
            </Button>
          </div>
        </div>

        {/* Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Tabs value={currentTab} onValueChange={setCurrentTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="basic">Básico</TabsTrigger>
                <TabsTrigger value="content">Conteúdo</TabsTrigger>
                <TabsTrigger value="metadata">Metadados</TabsTrigger>
                <TabsTrigger value="accessibility">Acessibilidade</TabsTrigger>
                <TabsTrigger value="compliance">Compliance</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Informações Básicas
                    </CardTitle>
                    <CardDescription>
                      Configure as informações principais do template
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="name">Nome do Template *</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: NR-12 Segurança em Máquinas - Básico"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="description">Descrição *</Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Descreva o objetivo e conteúdo do template..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="category">Categoria NR *</Label>
                      <Select value={category} onValueChange={(value: NRCategory) => setCategory(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {NR_CATEGORIES.map(nr => (
                            <SelectItem key={nr} value={nr}>
                              {nr}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Tags</Label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          placeholder="Adicionar tag..."
                          onKeyPress={(e) => e.key === 'Enter' && addTag()}
                        />
                        <Button type="button" onClick={addTag} size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="gap-1">
                            {tag}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => removeTag(tag)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="content" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="h-5 w-5" />
                      Mídia e Conteúdo
                    </CardTitle>
                    <CardDescription>
                      Configure as imagens e conteúdo do template
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="thumbnail">URL da Thumbnail</Label>
                      <div className="flex gap-2">
                        <Input
                          id="thumbnail"
                          value={thumbnail}
                          onChange={(e) => setThumbnail(e.target.value)}
                          placeholder="URL da imagem de thumbnail..."
                        />
                        <Button
                          type="button"
                          onClick={generateDefaultThumbnail}
                          variant="outline"
                          size="sm"
                        >
                          Gerar
                        </Button>
                      </div>
                      {thumbnail && (
                        <img
                          src={thumbnail}
                          alt="Thumbnail preview"
                          className="mt-2 w-32 h-32 object-cover rounded border"
                        />
                      )}
                    </div>

                    <div>
                      <Label htmlFor="preview">URL do Preview</Label>
                      <Input
                        id="preview"
                        value={preview}
                        onChange={(e) => setPreview(e.target.value)}
                        placeholder="URL da imagem de preview..."
                      />
                      {preview && (
                        <img
                          src={preview}
                          alt="Preview"
                          className="mt-2 w-full h-32 object-cover rounded border"
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="metadata" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Metadados Educacionais
                    </CardTitle>
                    <CardDescription>
                      Configure informações sobre o público-alvo e objetivos
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="difficulty">Nível de Dificuldade</Label>
                      <Select value={difficulty} onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') => setDifficulty(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DIFFICULTY_OPTIONS.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="duration">Duração Estimada (minutos)</Label>
                      <Input
                        id="duration"
                        type="number"
                        value={estimatedDuration}
                        onChange={(e) => setEstimatedDuration(parseInt(e.target.value) || 30)}
                        min="1"
                        max="300"
                      />
                    </div>

                    <div>
                      <Label>Público-alvo</Label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          value={newAudience}
                          onChange={(e) => setNewAudience(e.target.value)}
                          placeholder="Ex: Operadores de máquinas..."
                          onKeyPress={(e) => e.key === 'Enter' && addAudience()}
                        />
                        <Button type="button" onClick={addAudience} size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {targetAudience.map(audience => (
                          <Badge key={audience} variant="outline" className="gap-1">
                            {audience}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => removeAudience(audience)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Objetivos de Aprendizagem</Label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          value={newObjective}
                          onChange={(e) => setNewObjective(e.target.value)}
                          placeholder="Ex: Identificar riscos em máquinas..."
                          onKeyPress={(e) => e.key === 'Enter' && addObjective()}
                        />
                        <Button type="button" onClick={addObjective} size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-1">
                        {learningObjectives.map(objective => (
                          <div key={objective} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm">{objective}</span>
                            <X
                              className="h-4 w-4 cursor-pointer text-gray-500 hover:text-red-500"
                              onClick={() => removeObjective(objective)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Pré-requisitos</Label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          value={newPrerequisite}
                          onChange={(e) => setNewPrerequisite(e.target.value)}
                          placeholder="Ex: Treinamento básico de segurança..."
                          onKeyPress={(e) => e.key === 'Enter' && addPrerequisite()}
                        />
                        <Button type="button" onClick={addPrerequisite} size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {prerequisites.map(prerequisite => (
                          <Badge key={prerequisite} variant="outline" className="gap-1">
                            {prerequisite}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => removePrerequisite(prerequisite)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="accessibility" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Accessibility className="h-5 w-5" />
                      Recursos de Acessibilidade
                    </CardTitle>
                    <CardDescription>
                      Configure os recursos de acessibilidade do template
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries({
                      screenReader: 'Compatível com leitor de tela',
                      highContrast: 'Suporte a alto contraste',
                      keyboardNavigation: 'Navegação por teclado',
                      closedCaptions: 'Legendas fechadas',
                      audioDescription: 'Audiodescrição',
                      signLanguage: 'Linguagem de sinais',
                    }).map(([key, label]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Checkbox
                          id={key}
                          checked={accessibility[key as keyof typeof accessibility]}
                          onCheckedChange={(checked) =>
                            setAccessibility(prev => ({
                              ...prev,
                              [key]: checked,
                            }))
                          }
                        />
                        <Label htmlFor={key}>{label}</Label>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="compliance" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Compliance e Certificações
                    </CardTitle>
                    <CardDescription>
                      Configure informações de compliance e certificações
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Certificações</Label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          value={newCertification}
                          onChange={(e) => setNewCertification(e.target.value)}
                          placeholder="Ex: ISO 45001..."
                          onKeyPress={(e) => e.key === 'Enter' && addCertification()}
                        />
                        <Button type="button" onClick={addCertification} size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {certifications.map(cert => (
                          <Badge key={cert} variant="secondary" className="gap-1">
                            <Award className="h-3 w-3" />
                            {cert}
                            <X
                              className="h-3 w-3 cursor-pointer"
                              onClick={() => removeCertification(cert)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Preview do Template
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {thumbnail && (
                  <img
                    src={thumbnail}
                    alt="Template preview"
                    className="w-full h-32 object-cover rounded border"
                  />
                )}
                
                <div>
                  <h3 className="font-semibold">{name || 'Nome do Template'}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {description || 'Descrição do template...'}
                  </p>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <Badge variant="outline">{category}</Badge>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {estimatedDuration}min
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4" />
                    <span>Dificuldade: {DIFFICULTY_OPTIONS.find(d => d.value === difficulty)?.label}</span>
                  </div>
                  
                  {targetAudience.length > 0 && (
                    <div className="text-sm">
                      <span className="font-medium">Público:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {targetAudience.slice(0, 2).map(audience => (
                          <Badge key={audience} variant="secondary" className="text-xs">
                            {audience}
                          </Badge>
                        ))}
                        {targetAudience.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{targetAudience.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {tags.length > 0 && (
                    <div className="text-sm">
                      <span className="font-medium">Tags:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {tags.slice(0, 3).map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}