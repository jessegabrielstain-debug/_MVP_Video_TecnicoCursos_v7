'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Eye, 
  Heart, 
  Star,
  User,
  Users,
  Palette,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Maximize,
  Share2
} from 'lucide-react';
import { toast } from 'sonner';

// Interfaces
interface Avatar {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  modelUrl: string;
  category: 'realistic' | 'cartoon' | 'anime' | 'business' | 'casual';
  gender: 'male' | 'female' | 'neutral';
  ethnicity: string;
  age: 'young' | 'adult' | 'senior';
  style: string;
  tags: string[];
  rating: number;
  downloads: number;
  isFavorite: boolean;
  isCustom: boolean;
  createdAt: Date;
  author?: string;
  license: 'free' | 'premium' | 'custom';
  blendShapes: string[];
  animations: string[];
}

interface AvatarFilter {
  category?: string;
  gender?: string;
  age?: string;
  license?: string;
  search?: string;
  tags?: string[];
  rating?: number;
}

interface AvatarPreview {
  avatar: Avatar;
  isLoading: boolean;
  currentAnimation?: string;
  isPlaying: boolean;
}

export default function AvatarLibrary() {
  // Estados
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [filteredAvatars, setFilteredAvatars] = useState<Avatar[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(null);
  const [previewAvatar, setPreviewAvatar] = useState<AvatarPreview | null>(null);
  const [filters, setFilters] = useState<AvatarFilter>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'downloads' | 'date'>('rating');
  const [showFilters, setShowFilters] = useState(false);

  // Carregar avatares
  useEffect(() => {
    loadAvatars();
  }, []);

  // Aplicar filtros
  useEffect(() => {
    applyFilters();
  }, [avatars, filters, searchTerm, sortBy]);

  const loadAvatars = async () => {
    try {
      setIsLoading(true);
      
      // Simular carregamento de avatares
      const mockAvatars: Avatar[] = [
        {
          id: '1',
          name: 'Ana Silva',
          description: 'Avatar profissional feminino para apresentações corporativas',
          thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20female%20avatar%20business%20suit%20friendly%20smile%20corporate%20headshot&image_size=square',
          modelUrl: '/models/ana-silva.glb',
          category: 'business',
          gender: 'female',
          ethnicity: 'latina',
          age: 'adult',
          style: 'professional',
          tags: ['business', 'professional', 'corporate', 'friendly'],
          rating: 4.8,
          downloads: 1250,
          isFavorite: true,
          isCustom: false,
          createdAt: new Date('2024-01-15'),
          author: 'Ready Player Me',
          license: 'free',
          blendShapes: ['mouthOpen', 'eyeBlink', 'browUp', 'jawOpen', 'smile'],
          animations: ['idle', 'talking', 'greeting', 'pointing']
        },
        {
          id: '2',
          name: 'Carlos Mendes',
          description: 'Avatar masculino casual para conteúdo educativo',
          thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=casual%20male%20avatar%20friendly%20teacher%20polo%20shirt%20educational%20content&image_size=square',
          modelUrl: '/models/carlos-mendes.glb',
          category: 'casual',
          gender: 'male',
          ethnicity: 'latino',
          age: 'adult',
          style: 'casual',
          tags: ['education', 'casual', 'teacher', 'friendly'],
          rating: 4.6,
          downloads: 890,
          isFavorite: false,
          isCustom: false,
          createdAt: new Date('2024-01-20'),
          author: 'Ready Player Me',
          license: 'free',
          blendShapes: ['mouthOpen', 'eyeBlink', 'browUp', 'jawOpen', 'smile'],
          animations: ['idle', 'talking', 'explaining', 'thinking']
        },
        {
          id: '3',
          name: 'Sophia Chen',
          description: 'Avatar realista para apresentações técnicas',
          thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=realistic%20asian%20female%20avatar%20tech%20professional%20modern%20style%20confident&image_size=square',
          modelUrl: '/models/sophia-chen.glb',
          category: 'realistic',
          gender: 'female',
          ethnicity: 'asian',
          age: 'young',
          style: 'modern',
          tags: ['tech', 'realistic', 'modern', 'professional'],
          rating: 4.9,
          downloads: 2100,
          isFavorite: true,
          isCustom: false,
          createdAt: new Date('2024-02-01'),
          author: 'Ready Player Me',
          license: 'premium',
          blendShapes: ['mouthOpen', 'eyeBlink', 'browUp', 'jawOpen', 'smile', 'surprised'],
          animations: ['idle', 'talking', 'presenting', 'gesturing', 'nodding']
        },
        {
          id: '4',
          name: 'Avatar Personalizado',
          description: 'Meu avatar personalizado criado no editor',
          thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=custom%20avatar%20unique%20style%20personalized%20character%20creative&image_size=square',
          modelUrl: '/models/custom-avatar.glb',
          category: 'cartoon',
          gender: 'neutral',
          ethnicity: 'mixed',
          age: 'adult',
          style: 'creative',
          tags: ['custom', 'unique', 'personal', 'creative'],
          rating: 5.0,
          downloads: 0,
          isFavorite: true,
          isCustom: true,
          createdAt: new Date('2024-02-10'),
          author: 'Você',
          license: 'custom',
          blendShapes: ['mouthOpen', 'eyeBlink', 'browUp', 'jawOpen', 'smile'],
          animations: ['idle', 'talking', 'dancing', 'waving']
        }
      ];
      
      setAvatars(mockAvatars);
    } catch (error) {
      toast.error('Erro ao carregar avatares');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...avatars];

    // Filtro de busca
    if (searchTerm) {
      filtered = filtered.filter(avatar => 
        avatar.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        avatar.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        avatar.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filtros específicos
    if (filters.category) {
      filtered = filtered.filter(avatar => avatar.category === filters.category);
    }
    if (filters.gender) {
      filtered = filtered.filter(avatar => avatar.gender === filters.gender);
    }
    if (filters.age) {
      filtered = filtered.filter(avatar => avatar.age === filters.age);
    }
    if (filters.license) {
      filtered = filtered.filter(avatar => avatar.license === filters.license);
    }
    if (filters.rating) {
      filtered = filtered.filter(avatar => avatar.rating >= filters.rating);
    }

    // Ordenação
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'rating':
          return b.rating - a.rating;
        case 'downloads':
          return b.downloads - a.downloads;
        case 'date':
          return b.createdAt.getTime() - a.createdAt.getTime();
        default:
          return 0;
      }
    });

    setFilteredAvatars(filtered);
  };

  const toggleFavorite = (avatarId: string) => {
    setAvatars(prev => prev.map(avatar => 
      avatar.id === avatarId 
        ? { ...avatar, isFavorite: !avatar.isFavorite }
        : avatar
    ));
  };

  const previewAvatar3D = (avatar: Avatar) => {
    setPreviewAvatar({
      avatar,
      isLoading: true,
      isPlaying: false
    });

    // Simular carregamento do modelo 3D
    setTimeout(() => {
      setPreviewAvatar(prev => prev ? { ...prev, isLoading: false } : null);
    }, 2000);
  };

  const playAnimation = (animationName: string) => {
    if (!previewAvatar) return;

    setPreviewAvatar(prev => prev ? {
      ...prev,
      currentAnimation: animationName,
      isPlaying: true
    } : null);

    // Simular duração da animação
    setTimeout(() => {
      setPreviewAvatar(prev => prev ? { ...prev, isPlaying: false } : null);
    }, 3000);
  };

  const downloadAvatar = (avatar: Avatar) => {
    toast.success(`Baixando ${avatar.name}...`);
    // Simular download
    setTimeout(() => {
      toast.success('Avatar baixado com sucesso!');
    }, 2000);
  };

  const getLicenseBadge = (license: Avatar['license']) => {
    switch (license) {
      case 'free':
        return <Badge variant="default" className="bg-green-500">Grátis</Badge>;
      case 'premium':
        return <Badge variant="default" className="bg-yellow-500">Premium</Badge>;
      case 'custom':
        return <Badge variant="outline">Personalizado</Badge>;
    }
  };

  const getCategoryIcon = (category: Avatar['category']) => {
    switch (category) {
      case 'business':
        return <User className="w-4 h-4" />;
      case 'casual':
        return <Users className="w-4 h-4" />;
      case 'realistic':
        return <Eye className="w-4 h-4" />;
      case 'cartoon':
        return <Palette className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Biblioteca de Avatares</h1>
          <p className="text-muted-foreground">
            Explore e gerencie avatares 3D para seus vídeos
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Importar
          </Button>
          <Button>
            <Settings className="w-4 h-4 mr-2" />
            Criar Avatar
          </Button>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar avatares..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={(value: string) => setSortBy(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">Melhor Avaliado</SelectItem>
              <SelectItem value="downloads">Mais Baixados</SelectItem>
              <SelectItem value="date">Mais Recentes</SelectItem>
              <SelectItem value="name">Nome A-Z</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
        </div>
      </div>

      {/* Painel de Filtros */}
      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>Categoria</Label>
                <Select value={filters.category || ''} onValueChange={(value) => 
                  setFilters(prev => ({ ...prev, category: value || undefined }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    <SelectItem value="business">Profissional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="realistic">Realista</SelectItem>
                    <SelectItem value="cartoon">Cartoon</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Gênero</Label>
                <Select value={filters.gender || ''} onValueChange={(value) => 
                  setFilters(prev => ({ ...prev, gender: value || undefined }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="male">Masculino</SelectItem>
                    <SelectItem value="female">Feminino</SelectItem>
                    <SelectItem value="neutral">Neutro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Idade</Label>
                <Select value={filters.age || ''} onValueChange={(value) => 
                  setFilters(prev => ({ ...prev, age: value || undefined }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    <SelectItem value="young">Jovem</SelectItem>
                    <SelectItem value="adult">Adulto</SelectItem>
                    <SelectItem value="senior">Sênior</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Licença</Label>
                <Select value={filters.license || ''} onValueChange={(value) => 
                  setFilters(prev => ({ ...prev, license: value || undefined }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    <SelectItem value="free">Grátis</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grid de Avatares */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="aspect-square bg-muted rounded-t-lg" />
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded mb-2" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </CardContent>
            </Card>
          ))
        ) : filteredAvatars.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum avatar encontrado</h3>
            <p className="text-muted-foreground">
              Tente ajustar os filtros ou criar um novo avatar
            </p>
          </div>
        ) : (
          filteredAvatars.map((avatar) => (
            <Card key={avatar.id} className="group hover:shadow-lg transition-shadow">
              <div className="relative aspect-square overflow-hidden rounded-t-lg">
                <img
                  src={avatar.thumbnail}
                  alt={avatar.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                
                {/* Overlay com ações */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => previewAvatar3D(avatar)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                      <DialogHeader>
                        <DialogTitle>Preview 3D - {avatar.name}</DialogTitle>
                        <DialogDescription>
                          Visualize o avatar em 3D e teste as animações
                        </DialogDescription>
                      </DialogHeader>
                      
                      {previewAvatar && (
                        <div className="space-y-4">
                          {/* Viewport 3D simulado */}
                          <div className="aspect-video bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center relative">
                            {previewAvatar.isLoading ? (
                              <div className="text-center">
                                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                                <p>Carregando modelo 3D...</p>
                              </div>
                            ) : (
                              <div className="text-center">
                                <div className="w-32 h-32 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                                  <User className="w-16 h-16 text-primary" />
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {previewAvatar.isPlaying ? `Reproduzindo: ${previewAvatar.currentAnimation}` : 'Modelo 3D carregado'}
                                </p>
                              </div>
                            )}
                            
                            {/* Controles de viewport */}
                            <div className="absolute top-2 right-2 flex gap-1">
                              <Button size="sm" variant="outline">
                                <RotateCcw className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Maximize className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Controles de animação */}
                          <div>
                            <h4 className="font-medium mb-2">Animações</h4>
                            <div className="flex flex-wrap gap-2">
                              {avatar.animations.map((animation) => (
                                <Button
                                  key={animation}
                                  size="sm"
                                  variant={previewAvatar.currentAnimation === animation ? "default" : "outline"}
                                  onClick={() => playAnimation(animation)}
                                  disabled={previewAvatar.isLoading || previewAvatar.isPlaying}
                                >
                                  {previewAvatar.isPlaying && previewAvatar.currentAnimation === animation ? (
                                    <Pause className="w-4 h-4 mr-1" />
                                  ) : (
                                    <Play className="w-4 h-4 mr-1" />
                                  )}
                                  {animation}
                                </Button>
                              ))}
                            </div>
                          </div>
                          
                          {/* Informações do avatar */}
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <strong>Blend Shapes:</strong>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {avatar.blendShapes.map((shape) => (
                                  <Badge key={shape} variant="outline" className="text-xs">
                                    {shape}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <strong>Tags:</strong>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {avatar.tags.map((tag) => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                  
                  <Button 
                    size="sm" 
                    variant="secondary"
                    onClick={() => downloadAvatar(avatar)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="secondary"
                    onClick={() => toggleFavorite(avatar.id)}
                  >
                    <Heart className={`w-4 h-4 ${avatar.isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                  </Button>
                </div>
                
                {/* Badges */}
                <div className="absolute top-2 left-2 flex gap-1">
                  {getLicenseBadge(avatar.license)}
                  {avatar.isCustom && <Badge variant="outline">Custom</Badge>}
                </div>
              </div>
              
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-medium truncate">{avatar.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {avatar.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    {getCategoryIcon(avatar.category)}
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span>{avatar.rating}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Download className="w-3 h-3" />
                    <span>{avatar.downloads}</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1 mt-2">
                  {avatar.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {avatar.tags.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{avatar.tags.length - 2}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Estatísticas */}
      <Card>
        <CardHeader>
          <CardTitle>Estatísticas da Biblioteca</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{avatars.length}</div>
              <div className="text-sm text-muted-foreground">Total de Avatares</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{avatars.filter(a => a.isFavorite).length}</div>
              <div className="text-sm text-muted-foreground">Favoritos</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{avatars.filter(a => a.isCustom).length}</div>
              <div className="text-sm text-muted-foreground">Personalizados</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{avatars.reduce((sum, a) => sum + a.downloads, 0)}</div>
              <div className="text-sm text-muted-foreground">Total Downloads</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
