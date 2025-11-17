'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Layers,
  Layout,
  Palette,
  FileText,
  Image,
  Video,
  Music,
  Wand2,
  Star,
  Crown,
  Trophy,
  Rocket,
  Target,
  CheckCircle,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Play,
  Pause,
  Edit,
  Copy,
  Share,
  Trash2,
  Eye,
  Heart,
  ThumbsUp,
  Bookmark,
  Grid,
  List,
  Maximize,
  Minimize,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  ZoomIn,
  ZoomOut,
  Move,
  Scissors,
  Brush,
  PaintBucket,
  Type,
  Settings,
  Sparkles,
  Globe,
  Users,
  Clock,
  Calendar,
  TrendingUp,
  Award,
  Shield,
  Zap,
  Database,
  Cloud,
  Smartphone,
  Monitor,
  Tablet,
  Tv
} from 'lucide-react';

// Types
interface Template {
  id: string;
  name: string;
  category: 'education' | 'business' | 'marketing' | 'entertainment' | 'health' | 'tech' | 'custom';
  subcategory: string;
  thumbnail: string;
  preview?: string;
  description: string;
  tags: string[];
  author: string;
  rating: number;
  downloads: number;
  premium: boolean;
  duration: number; // in seconds
  resolution: '720p' | '1080p' | '4k';
  assets: TemplateAsset[];
  customizable: boolean;
  aiGenerated?: boolean;
  lastUpdated: Date;
}

interface TemplateAsset {
  id: string;
  type: 'video' | 'audio' | 'image' | 'text' | 'effect';
  name: string;
  url: string;
  duration?: number;
  customizable: boolean;
  aiEnhanced?: boolean;
}

interface TemplateProject {
  id: string;
  templateId: string;
  name: string;
  customizations: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'processing' | 'completed';
  outputUrl?: string;
}

export default function TemplateStudio() {
  const [activeTab, setActiveTab] = useState('browse');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [myProjects, setMyProjects] = useState<TemplateProject[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // URL parameters handling
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab && ['browse', 'create', 'my-templates', 'editor', 'ai-generate', 'marketplace'].includes(tab)) {
      setActiveTab(tab);
    }
  }, []);

  // Mock templates data
  const templates: Template[] = [
    {
      id: 'edu_001',
      name: 'Aula Interativa - Matemática',
      category: 'education',
      subcategory: 'Mathematics',
      thumbnail: '/templates/edu_math.jpg',
      description: 'Template profissional para aulas de matemática com animações e gráficos interativos',
      tags: ['educação', 'matemática', 'interativo', 'animação'],
      author: 'EduTech Studio',
      rating: 4.8,
      downloads: 1247,
      premium: false,
      duration: 180,
      resolution: '1080p',
      assets: [
        {
          id: 'a1',
          type: 'video',
          name: 'Intro Animation',
          url: '/assets/intro_math.mp4',
          duration: 10,
          customizable: true
        },
        {
          id: 'a2',
          type: 'image',
          name: 'Math Graphics',
          url: '/assets/math_bg.jpg',
          customizable: true,
          aiEnhanced: true
        }
      ],
      customizable: true,
      aiGenerated: false,
      lastUpdated: new Date('2024-01-15')
    },
    {
      id: 'biz_001',
      name: 'Apresentação Corporativa Premium',
      category: 'business',
      subcategory: 'Corporate',
      thumbnail: '/templates/biz_corporate.jpg',
      description: 'Template elegante para apresentações executivas com avatares profissionais',
      tags: ['negócios', 'corporativo', 'apresentação', 'avatar'],
      author: 'BusinessPro Templates',
      rating: 4.9,
      downloads: 2156,
      premium: true,
      duration: 300,
      resolution: '4k',
      assets: [
        {
          id: 'b1',
          type: 'video',
          name: 'Corporate Intro',
          url: '/assets/corp_intro.mp4',
          duration: 15,
          customizable: true
        },
        {
          id: 'b2',
          type: 'audio',
          name: 'Background Music',
          url: '/assets/corp_music.mp3',
          duration: 300,
          customizable: true
        }
      ],
      customizable: true,
      aiGenerated: true,
      lastUpdated: new Date('2024-02-01')
    },
    {
      id: 'mk_001',
      name: 'Campanha Social Media',
      category: 'marketing',
      subcategory: 'Social Media',
      thumbnail: '/templates/mk_social.jpg',
      description: 'Template moderno para campanhas de marketing digital com elementos animados',
      tags: ['marketing', 'social media', 'campanha', 'moderno'],
      author: 'Digital Marketing Hub',
      rating: 4.7,
      downloads: 892,
      premium: false,
      duration: 60,
      resolution: '1080p',
      assets: [
        {
          id: 'm1',
          type: 'effect',
          name: 'Text Animations',
          url: '/assets/text_fx.json',
          customizable: true,
          aiEnhanced: true
        }
      ],
      customizable: true,
      aiGenerated: false,
      lastUpdated: new Date('2024-01-28')
    },
    {
      id: 'ent_001',
      name: 'Vinheta de Abertura Épica',
      category: 'entertainment',
      subcategory: 'Intros',
      thumbnail: '/templates/ent_epic.jpg',
      description: 'Vinheta cinematográfica com efeitos épicos e música envolvente',
      tags: ['entretenimento', 'épico', 'cinematográfico', 'intro'],
      author: 'Epic Studios',
      rating: 4.6,
      downloads: 3401,
      premium: true,
      duration: 45,
      resolution: '4k',
      assets: [
        {
          id: 'e1',
          type: 'video',
          name: 'Epic Sequence',
          url: '/assets/epic_seq.mp4',
          duration: 30,
          customizable: true
        }
      ],
      customizable: true,
      aiGenerated: true,
      lastUpdated: new Date('2024-02-05')
    }
  ];

  // Categories configuration
  const categories = [
    { id: 'all', name: 'Todos', icon: Grid, count: templates.length },
    { id: 'education', name: 'Educação', icon: FileText, count: templates.filter(t => t.category === 'education').length },
    { id: 'business', name: 'Negócios', icon: Trophy, count: templates.filter(t => t.category === 'business').length },
    { id: 'marketing', name: 'Marketing', icon: Target, count: templates.filter(t => t.category === 'marketing').length },
    { id: 'entertainment', name: 'Entretenimento', icon: Video, count: templates.filter(t => t.category === 'entertainment').length },
    { id: 'health', name: 'Saúde', icon: Heart, count: templates.filter(t => t.category === 'health').length },
    { id: 'tech', name: 'Tecnologia', icon: Zap, count: templates.filter(t => t.category === 'tech').length },
    { id: 'custom', name: 'Personalizados', icon: Wand2, count: templates.filter(t => t.category === 'custom').length }
  ];

  // Filter templates based on category and search
  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  // Handle template selection
  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  // Create project from template
  const createProject = (template: Template) => {
    const newProject: TemplateProject = {
      id: Date.now().toString(),
      templateId: template.id,
      name: `${template.name} - Projeto`,
      customizations: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'draft'
    };
    
    setMyProjects([...myProjects, newProject]);
    setActiveTab('editor');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Template Studio
              </h1>
              <p className="text-gray-600 mt-2">
                Biblioteca completa de templates para criação de vídeos profissionais
              </p>
            </div>
            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
              <Layers className="w-4 h-4 mr-1" />
              {templates.length} Templates
            </Badge>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 bg-white shadow-sm">
            <TabsTrigger value="browse" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Explorar
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Criar
            </TabsTrigger>
            <TabsTrigger value="my-templates" className="flex items-center gap-2">
              <Bookmark className="w-4 h-4" />
              Meus Templates
            </TabsTrigger>
            <TabsTrigger value="editor" className="flex items-center gap-2">
              <Edit className="w-4 h-4" />
              Editor
            </TabsTrigger>
            <TabsTrigger value="ai-generate" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              IA Generate
            </TabsTrigger>
            <TabsTrigger value="marketplace" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Marketplace
            </TabsTrigger>
          </TabsList>

          {/* Browse Templates Tab */}
          <TabsContent value="browse" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Sidebar - Categories & Filters */}
              <div className="lg:col-span-1">
                <Card className="shadow-lg border-0 bg-white/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Filter className="w-5 h-5 text-indigo-600" />
                      Filtros
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Search */}
                    <div>
                      <Label htmlFor="search">Buscar Templates</Label>
                      <div className="relative mt-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          id="search"
                          placeholder="Digite para buscar..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    {/* Categories */}
                    <div>
                      <Label>Categorias</Label>
                      <div className="space-y-2 mt-2">
                        {categories.map((category) => {
                          const Icon = category.icon;
                          return (
                            <button
                              key={category.id}
                              onClick={() => setSelectedCategory(category.id)}
                              className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                                selectedCategory === category.id
                                  ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                                  : 'hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <Icon className="w-4 h-4" />
                                <span className="font-medium">{category.name}</span>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {category.count}
                              </Badge>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Quick Filters */}
                    <div>
                      <Label>Filtros Rápidos</Label>
                      <div className="space-y-2 mt-2">
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="premium-only" />
                          <Label htmlFor="premium-only" className="text-sm">Apenas Premium</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="ai-generated" />
                          <Label htmlFor="ai-generated" className="text-sm">Gerados por IA</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="customizable" />
                          <Label htmlFor="customizable" className="text-sm">Personalizáveis</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="high-rated" />
                          <Label htmlFor="high-rated" className="text-sm">Mais Avaliados</Label>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Main Content - Templates Grid */}
              <div className="lg:col-span-4">
                <Card className="shadow-lg border-0 bg-white/50 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Layout className="w-5 h-5 text-indigo-600" />
                        Templates Disponíveis
                        <Badge variant="outline">{filteredTemplates.length}</Badge>
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Select defaultValue="newest">
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="newest">Mais Novos</SelectItem>
                            <SelectItem value="popular">Mais Populares</SelectItem>
                            <SelectItem value="rating">Melhor Avaliados</SelectItem>
                            <SelectItem value="downloads">Mais Baixados</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex border rounded-lg overflow-hidden">
                          <Button
                            size="sm"
                            variant={viewMode === 'grid' ? 'default' : 'outline'}
                            onClick={() => setViewMode('grid')}
                            className="rounded-none"
                          >
                            <Grid className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={viewMode === 'list' ? 'default' : 'outline'}
                            onClick={() => setViewMode('list')}
                            className="rounded-none"
                          >
                            <List className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Templates Grid/List View */}
                    <div className={viewMode === 'grid' ? 
                      'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 
                      'space-y-4'
                    }>
                      {filteredTemplates.map((template) => (
                        <Card 
                          key={template.id}
                          className={`hover:shadow-lg transition-all cursor-pointer group ${
                            viewMode === 'list' ? 'flex items-center' : ''
                          }`}
                          onClick={() => handleTemplateSelect(template)}
                        >
                          <div className={viewMode === 'list' ? 'w-48 flex-shrink-0' : ''}>
                            <div className={`${viewMode === 'list' ? 'aspect-video h-24' : 'aspect-video'} bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg ${viewMode === 'grid' ? 'mb-4' : ''} overflow-hidden relative`}>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Video className="w-8 h-8 text-indigo-400" />
                              </div>
                              <div className="absolute top-2 right-2 flex gap-1">
                                {template.premium && (
                                  <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                                    <Crown className="w-3 h-3 mr-1" />
                                    Premium
                                  </Badge>
                                )}
                                {template.aiGenerated && (
                                  <Badge className="bg-purple-100 text-purple-800 text-xs">
                                    <Sparkles className="w-3 h-3 mr-1" />
                                    IA
                                  </Badge>
                                )}
                              </div>
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                <Play className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </div>
                          </div>
                          
                          <CardContent className={`${viewMode === 'list' ? 'flex-1 py-4' : 'p-4'}`}>
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-semibold text-lg leading-tight">{template.name}</h3>
                              <div className="flex items-center gap-1 text-yellow-500">
                                <Star className="w-4 h-4 fill-current" />
                                <span className="text-sm font-medium">{template.rating}</span>
                              </div>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {template.description}
                            </p>
                            
                            <div className="flex flex-wrap gap-1 mb-3">
                              {template.tags.slice(0, 3).map((tag, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            
                            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                              <span>Por {template.author}</span>
                              <span>{template.downloads} downloads</span>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                className="flex-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  createProject(template);
                                }}
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Usar Template
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTemplateSelect(template);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {filteredTemplates.length === 0 && (
                      <div className="text-center py-12">
                        <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Nenhum template encontrado
                        </h3>
                        <p className="text-gray-600">
                          Tente ajustar os filtros ou termos de busca
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Create Template Tab */}
          <TabsContent value="create" className="mt-6">
            <Card className="shadow-lg border-0 bg-white/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-green-600" />
                  Criar Novo Template
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                    <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                      <FileText className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">Template em Branco</h3>
                      <p className="text-sm text-gray-600 mb-4">Comece do zero com um template personalizado</p>
                      <Button className="w-full">Criar</Button>
                    </Card>

                    <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                      <Wand2 className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">Assistente IA</h3>
                      <p className="text-sm text-gray-600 mb-4">Deixe a IA criar um template baseado na sua descrição</p>
                      <Button className="w-full">Usar IA</Button>
                    </Card>

                    <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                      <Copy className="w-12 h-12 text-green-600 mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">Duplicar Existente</h3>
                      <p className="text-sm text-gray-600 mb-4">Copie e modifique um template existente</p>
                      <Button className="w-full">Duplicar</Button>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Templates Tab */}
          <TabsContent value="my-templates" className="mt-6">
            <Card className="shadow-lg border-0 bg-white/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bookmark className="w-5 h-5 text-orange-600" />
                  Meus Templates e Projetos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Bookmark className="w-16 h-16 text-orange-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Seus Templates Personalizados
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Gerencie seus templates criados e projetos salvos
                  </p>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeiro Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Editor Tab */}
          <TabsContent value="editor" className="mt-6">
            <Card className="shadow-lg border-0 bg-white/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit className="w-5 h-5 text-blue-600" />
                  Editor de Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Edit className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Editor Avançado
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Personalize cada aspecto do seu template com ferramentas profissionais
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
                    <Card className="p-4">
                      <Type className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <h4 className="font-semibold mb-1">Textos</h4>
                      <p className="text-xs text-gray-600">Edite títulos e legendas</p>
                    </Card>
                    <Card className="p-4">
                      <Palette className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <h4 className="font-semibold mb-1">Cores</h4>
                      <p className="text-xs text-gray-600">Personalize paleta de cores</p>
                    </Card>
                    <Card className="p-4">
                      <Music className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <h4 className="font-semibold mb-1">Áudio</h4>
                      <p className="text-xs text-gray-600">Adicione música e efeitos</p>
                    </Card>
                    <Card className="p-4">
                      <Zap className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                      <h4 className="font-semibold mb-1">Efeitos</h4>
                      <p className="text-xs text-gray-600">Animações e transições</p>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Generate Tab */}
          <TabsContent value="ai-generate" className="mt-6">
            <Card className="shadow-lg border-0 bg-white/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Geração por Inteligência Artificial
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-w-4xl mx-auto">
                  <div className="text-center mb-8">
                    <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Crie Templates com IA
                    </h3>
                    <p className="text-gray-600">
                      Descreva sua ideia e deixe a inteligência artificial criar um template personalizado
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="ai-prompt">Descreva seu template ideal</Label>
                      <Textarea
                        id="ai-prompt"
                        placeholder="Ex: Crie um template para aula de biologia sobre o sistema circulatório, com animações de órgãos, cores azul e branco, duração de 3 minutos..."
                        rows={4}
                        className="resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Categoria</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="education">Educação</SelectItem>
                            <SelectItem value="business">Negócios</SelectItem>
                            <SelectItem value="marketing">Marketing</SelectItem>
                            <SelectItem value="entertainment">Entretenimento</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Duração</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Duração do vídeo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="30">30 segundos</SelectItem>
                            <SelectItem value="60">1 minuto</SelectItem>
                            <SelectItem value="180">3 minutos</SelectItem>
                            <SelectItem value="300">5 minutos</SelectItem>
                            <SelectItem value="custom">Personalizado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Estilo Visual</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Escolha um estilo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="professional">Profissional</SelectItem>
                            <SelectItem value="creative">Criativo</SelectItem>
                            <SelectItem value="minimalist">Minimalista</SelectItem>
                            <SelectItem value="dynamic">Dinâmico</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="include-avatar" />
                      <Label htmlFor="include-avatar">Incluir avatar narrador</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="include-music" />
                      <Label htmlFor="include-music">Adicionar música de fundo</Label>
                    </div>

                    <Button className="w-full bg-purple-600 hover:bg-purple-700" size="lg">
                      <Sparkles className="w-5 h-5 mr-2" />
                      Gerar Template com IA
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Marketplace Tab */}
          <TabsContent value="marketplace" className="mt-6">
            <Card className="shadow-lg border-0 bg-white/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-600" />
                  Marketplace de Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Globe className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Marketplace Global
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Compre, venda e compartilhe templates com a comunidade mundial
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                    <Card className="p-6">
                      <Download className="w-8 h-8 text-green-600 mx-auto mb-3" />
                      <h4 className="font-semibold mb-2">Comprar Templates</h4>
                      <p className="text-sm text-gray-600">Acesse milhares de templates premium</p>
                    </Card>
                    <Card className="p-6">
                      <Upload className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                      <h4 className="font-semibold mb-2">Vender Seus Templates</h4>
                      <p className="text-sm text-gray-600">Monetize sua criatividade</p>
                    </Card>
                    <Card className="p-6">
                      <Users className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                      <h4 className="font-semibold mb-2">Comunidade</h4>
                      <p className="text-sm text-gray-600">Conecte-se com outros criadores</p>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Template Preview Modal */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Preview do Template</DialogTitle>
            </DialogHeader>
            {selectedTemplate && (
              <div className="space-y-6">
                {/* Preview Video */}
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Preview do Template</p>
                    <Button className="mt-4">
                      <Play className="w-4 h-4 mr-2" />
                      Reproduzir Preview
                    </Button>
                  </div>
                </div>

                {/* Template Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xl font-bold mb-2">{selectedTemplate.name}</h3>
                    <p className="text-gray-600 mb-4">{selectedTemplate.description}</p>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Autor:</span>
                        <span className="font-medium">{selectedTemplate.author}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avaliação:</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span>{selectedTemplate.rating}</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span>Downloads:</span>
                        <span>{selectedTemplate.downloads}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Duração:</span>
                        <span>{Math.floor(selectedTemplate.duration / 60)}:{(selectedTemplate.duration % 60).toString().padStart(2, '0')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Resolução:</span>
                        <span>{selectedTemplate.resolution}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Tags</h4>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {selectedTemplate.tags.map((tag, i) => (
                        <Badge key={i} variant="outline">{tag}</Badge>
                      ))}
                    </div>

                    <h4 className="font-semibold mb-3">Assets Inclusos</h4>
                    <div className="space-y-2">
                      {selectedTemplate.assets.map((asset) => (
                        <div key={asset.id} className="flex items-center gap-2 text-sm">
                          {asset.type === 'video' && <Video className="w-4 h-4" />}
                          {asset.type === 'audio' && <Music className="w-4 h-4" />}
                          {asset.type === 'image' && <Image className="w-4 h-4" />}
                          {asset.type === 'text' && <Type className="w-4 h-4" />}
                          {asset.type === 'effect' && <Zap className="w-4 h-4" />}
                          <span>{asset.name}</span>
                          {asset.aiEnhanced && (
                            <Badge variant="outline" className="text-xs">IA</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4 border-t">
                  <Button 
                    className="flex-1"
                    onClick={() => {
                      createProject(selectedTemplate);
                      setShowPreview(false);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Usar Este Template
                  </Button>
                  <Button variant="outline">
                    <Heart className="w-4 h-4 mr-2" />
                    Favoritar
                  </Button>
                  <Button variant="outline">
                    <Share className="w-4 h-4 mr-2" />
                    Compartilhar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}