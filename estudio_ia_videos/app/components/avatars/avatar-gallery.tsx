/**
 * 🎭 Avatar Gallery Component v2 - Hiper-Realista
 * Galeria de avatares 3D com qualidade cinematográfica UE5 + Audio2Face
 * FASE 2: Sprint 1 - Audio2Face Integration
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User,
  Video,
  Crown,
  Star,
  Download,
  Eye,
  Languages,
  Palette,
  Zap,
  Sparkles,
  Camera,
  Monitor,
  Search,
  Filter,
  Grid3X3,
  List,
  Play,
  Mic,
  Volume2,
  Settings,
  Heart,
  Share2,
  MoreVertical,
  X,
  Loader2
} from 'lucide-react';
import Image from 'next/image';

export interface HyperRealisticAvatar {
  id: string;
  name: string;
  category: string;
  gender: string;
  ethnicity: string;
  quality: 'standard' | 'premium' | 'cinematic' | 'hyperreal';
  engine?: 'ue5' | 'heygen';
  features: {
    lipSyncAccuracy: number;
    facialDetails: string;
    skinTexture: string;
    hairSystem: string;
    audio2FaceCompatible: boolean;
    arkitBlendShapes: number;
    realTimeLipSync: boolean;
  };
  rendering: {
    rayTracing: boolean;
    resolution: string;
    maxFPS: number;
    globalIllumination: boolean;
  };
  premium: boolean;
  price: number;
  preview: string;
  clothing: string;
  languages: string[];
  expressions: string[];
  voiceCloning: {
    supported: boolean;
    samples: number;
    quality: string;
  };
  stats: {
    downloads: number;
    rating: number;
    reviews: number;
    renderTime: number;
  };
  metadata: {
    created: string;
    updated: string;
    version: string;
    tags: string[];
  };
  personality?: any;
  voice?: any;
}

interface ApiAvatar {
  id: string;
  displayName?: string;
  name: string;
  category: string;
  gender?: string;
  ethnicity?: string;
  quality: 'standard' | 'premium' | 'cinematic' | 'hyperreal';
  features: {
    lipSyncAccuracy: number;
    audio2FaceCompatible: boolean;
    realTimeLipSync: boolean;
    rayTracing: boolean;
  };
  preview: {
    thumbnail: string;
  };
  supportedLanguages: string[];
  usageCount: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

interface PipelineStats {
  audio2FaceStatus: 'active' | 'inactive';
  activeJobs: number;
  activePreviews: number;
  totalPreviews: number;
}

interface PreviewData {
  avatarId: string;
  previewUrl: string;
  audio2FaceData: {
    lipSyncAccuracy: number;
  };
  lipSyncCurves: {
    jawOpen?: number;
    mouthClose?: number;
    mouthFunnel?: number;
    mouthPucker?: number;
    mouthLeft?: number;
    mouthRight?: number;
  };
  estimatedTime: string;
}

interface AvatarGalleryProps {
  avatars?: HyperRealisticAvatar[];
  selectedAvatar?: HyperRealisticAvatar;
  onAvatarSelect: (avatar: HyperRealisticAvatar) => void;
  onPreview?: (avatar: HyperRealisticAvatar) => void;
  onRender?: (avatar: HyperRealisticAvatar) => void;
  viewMode?: 'grid' | 'list';
}

export default function AvatarGallery({ 
  avatars: propAvatars, 
  selectedAvatar, 
  onAvatarSelect,
  onPreview,
  onRender,
  viewMode: initialViewMode = 'grid'
}: AvatarGalleryProps) {
  const [avatars, setAvatars] = useState<HyperRealisticAvatar[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [qualityFilter, setQualityFilter] = useState('all');
  const [viewMode, setViewMode] = useState(initialViewMode);
  const [sortBy, setSortBy] = useState('popularity');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [pipelineStats, setPipelineStats] = useState<PipelineStats | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);

  useEffect(() => {
    if (propAvatars) {
      setAvatars(propAvatars);
      setLoading(false);
    } else {
      loadHyperRealisticAvatars();
    }
  }, [propAvatars]);

  const loadHyperRealisticAvatars = async () => {
    try {
      setLoading(true);
      
      // Carregar avatares da API v2 com filtros melhorados
      const params = new URLSearchParams({
        category: categoryFilter !== 'all' ? categoryFilter : '',
        quality: qualityFilter !== 'all' ? qualityFilter : '',
        search: searchTerm,
        page: '1',
        limit: '20'
      });

      const response = await fetch(`/api/v2/avatars/gallery?${params}`);
      const data = await response.json();
      
      if (data.success) {
        // Mapear dados da API v2 para o formato do componente
        const mappedAvatars = data.data.avatars.map((avatar: ApiAvatar) => ({
          id: avatar.id,
          name: avatar.displayName || avatar.name,
          category: avatar.category,
          gender: avatar.gender || 'unisex',
          ethnicity: avatar.ethnicity || 'diverse',
          quality: avatar.quality,
          features: {
            lipSyncAccuracy: avatar.features.lipSyncAccuracy,
            facialDetails: 'Ultra HD',
            skinTexture: 'Photorealistic',
            hairSystem: 'Advanced',
            audio2FaceCompatible: avatar.features.audio2FaceCompatible,
            arkitBlendShapes: 52,
            realTimeLipSync: avatar.features.realTimeLipSync
          },
          rendering: {
            rayTracing: avatar.features.rayTracing,
            resolution: '4K',
            maxFPS: 60,
            globalIllumination: true
          },
          premium: avatar.quality === 'hyperreal' || avatar.quality === 'cinematic',
          price: avatar.quality === 'hyperreal' ? 50 : avatar.quality === 'cinematic' ? 25 : 0,
          preview: avatar.preview.thumbnail,
          clothing: 'Professional',
          languages: avatar.supportedLanguages,
          expressions: ['neutral', 'happy', 'serious', 'friendly'],
          voiceCloning: {
            supported: avatar.features.audio2FaceCompatible,
            samples: 10,
            quality: 'high'
          },
          stats: {
            downloads: avatar.usageCount,
            rating: avatar.rating,
            reviews: Math.floor(avatar.usageCount / 10),
            renderTime: 45
          },
          metadata: {
            created: avatar.createdAt,
            updated: avatar.updatedAt,
            version: '2.0.0',
            tags: [avatar.category, avatar.quality, 'audio2face']
          }
        }));

        setAvatars(mappedAvatars);
        setPipelineStats(data.data.stats);
      } else {
        console.error('Erro ao carregar avatares:', data.error);
        // Fallback para dados mock se a API falhar
        setAvatars(generateMockAvatars());
      }
    } catch (error) {
      console.error('Erro ao carregar avatares hiper-realistas:', error);
      // Fallback para dados mock
      setAvatars(generateMockAvatars());
    } finally {
      setLoading(false);
    }
  };

  // Função para gerar avatares mock para demonstração
  const generateMockAvatars = (): HyperRealisticAvatar[] => {
    return [
      {
        id: 'heygen_anna_news',
        name: 'Anna (News Anchor)',
        category: 'business',
        gender: 'female',
        ethnicity: 'caucasian',
        quality: 'hyperreal',
        engine: 'heygen',
        features: {
          lipSyncAccuracy: 99,
          facialDetails: 'Video Real',
          skinTexture: 'Real Video',
          hairSystem: 'Real Video',
          audio2FaceCompatible: true,
          arkitBlendShapes: 0,
          realTimeLipSync: true
        },
        rendering: {
          rayTracing: false,
          resolution: '4K',
          maxFPS: 60,
          globalIllumination: false
        },
        premium: true,
        price: 100,
        preview: 'https://files.heygen.ai/avatar/v3/3f2583200c854a0397f129e60b811467/full/preview_target.webp',
        clothing: 'Professional Suit',
        languages: ['en-US', 'pt-BR', 'es-ES', 'fr-FR', 'de-DE'],
        expressions: ['neutral', 'happy', 'serious'],
        voiceCloning: {
          supported: true,
          samples: 50,
          quality: 'ultra'
        },
        stats: {
          downloads: 5000,
          rating: 5.0,
          reviews: 450,
          renderTime: 60
        },
        metadata: {
          created: '2024-01-20',
          updated: '2024-01-25',
          version: '3.0.0',
          tags: ['news', 'hyperreal', 'heygen', 'anchor']
        }
      },
      {
        id: 'heygen_abigail_expressive',
        name: 'Abigail (Expressive)',
        category: 'business',
        gender: 'female',
        ethnicity: 'caucasian',
        quality: 'hyperreal',
        engine: 'heygen',
        features: {
          lipSyncAccuracy: 99,
          facialDetails: 'Video Real',
          skinTexture: 'Real Video',
          hairSystem: 'Real Video',
          audio2FaceCompatible: true,
          arkitBlendShapes: 0,
          realTimeLipSync: true
        },
        rendering: {
          rayTracing: false,
          resolution: '4K',
          maxFPS: 60,
          globalIllumination: false
        },
        premium: true,
        price: 100,
        preview: 'https://files2.heygen.ai/avatar/v3/1ad51ab9fee24ae88af067206e14a1d8_44250/preview_target.webp',
        clothing: 'Casual',
        languages: ['en-US', 'pt-BR'],
        expressions: ['neutral', 'happy'],
        voiceCloning: {
          supported: true,
          samples: 50,
          quality: 'ultra'
        },
        stats: {
          downloads: 3000,
          rating: 4.8,
          reviews: 200,
          renderTime: 60
        },
        metadata: {
          created: '2024-11-25',
          updated: '2024-11-25',
          version: '3.0.0',
          tags: ['expressive', 'hyperreal', 'heygen']
        }
      },
      {
        id: 'avatar-hyperreal-1',
        name: 'Sofia Executiva',
        category: 'business',
        gender: 'female',
        ethnicity: 'latina',
        quality: 'hyperreal',
        features: {
          lipSyncAccuracy: 98,
          facialDetails: 'Ultra HD',
          skinTexture: 'Photorealistic',
          hairSystem: 'Advanced',
          audio2FaceCompatible: true,
          arkitBlendShapes: 52,
          realTimeLipSync: true
        },
        rendering: {
          rayTracing: true,
          resolution: '8K',
          maxFPS: 60,
          globalIllumination: true
        },
        premium: true,
        price: 50,
        preview: '/avatars/sofia-preview.jpg',
        clothing: 'Business Suit',
        languages: ['pt-BR', 'en-US', 'es-ES'],
        expressions: ['neutral', 'happy', 'serious', 'friendly', 'confident'],
        voiceCloning: {
          supported: true,
          samples: 15,
          quality: 'ultra'
        },
        stats: {
          downloads: 1250,
          rating: 4.9,
          reviews: 125,
          renderTime: 35
        },
        metadata: {
          created: '2024-01-15',
          updated: '2024-01-20',
          version: '2.0.0',
          tags: ['business', 'hyperreal', 'audio2face', 'executive']
        }
      },
      {
        id: 'avatar-cinematic-1',
        name: 'Dr. Carlos Médico',
        category: 'healthcare',
        gender: 'male',
        ethnicity: 'latino',
        quality: 'cinematic',
        features: {
          lipSyncAccuracy: 96,
          facialDetails: 'High Definition',
          skinTexture: 'Realistic',
          hairSystem: 'Standard',
          audio2FaceCompatible: true,
          arkitBlendShapes: 52,
          realTimeLipSync: true
        },
        rendering: {
          rayTracing: true,
          resolution: '4K',
          maxFPS: 60,
          globalIllumination: true
        },
        premium: true,
        price: 25,
        preview: '/avatars/carlos-preview.jpg',
        clothing: 'Medical Coat',
        languages: ['pt-BR', 'en-US'],
        expressions: ['neutral', 'caring', 'serious', 'reassuring'],
        voiceCloning: {
          supported: true,
          samples: 12,
          quality: 'high'
        },
        stats: {
          downloads: 890,
          rating: 4.8,
          reviews: 89,
          renderTime: 42
        },
        metadata: {
          created: '2024-01-10',
          updated: '2024-01-18',
          version: '2.0.0',
          tags: ['healthcare', 'cinematic', 'audio2face', 'doctor']
        }
      },
      {
        id: 'avatar-premium-1',
        name: 'Ana Professora',
        category: 'education',
        gender: 'female',
        ethnicity: 'brasileira',
        quality: 'premium',
        features: {
          lipSyncAccuracy: 94,
          facialDetails: 'Standard HD',
          skinTexture: 'Enhanced',
          hairSystem: 'Standard',
          audio2FaceCompatible: true,
          arkitBlendShapes: 52,
          realTimeLipSync: true
        },
        rendering: {
          rayTracing: false,
          resolution: '4K',
          maxFPS: 30,
          globalIllumination: false
        },
        premium: false,
        price: 0,
        preview: '/avatars/ana-preview.jpg',
        clothing: 'Casual Professional',
        languages: ['pt-BR'],
        expressions: ['neutral', 'happy', 'encouraging', 'explaining'],
        voiceCloning: {
          supported: true,
          samples: 8,
          quality: 'medium'
        },
        stats: {
          downloads: 2150,
          rating: 4.7,
          reviews: 215,
          renderTime: 55
        },
        metadata: {
          created: '2024-01-05',
          updated: '2024-01-15',
          version: '2.0.0',
          tags: ['education', 'premium', 'audio2face', 'teacher']
        }
      }
    ];
  };

  const filteredAvatars = avatars.filter(avatar => {
    const matchesSearch = avatar.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         avatar.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         avatar.metadata.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = categoryFilter === 'all' || avatar.category === categoryFilter;
    const matchesQuality = qualityFilter === 'all' || avatar.quality === qualityFilter;
    
    return matchesSearch && matchesCategory && matchesQuality;
  });

  const sortedAvatars = [...filteredAvatars].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'rating':
        return b.stats.rating - a.stats.rating;
      case 'newest':
        return new Date(b.metadata.updated).getTime() - new Date(a.metadata.updated).getTime();
      case 'renderTime':
        return a.stats.renderTime - b.stats.renderTime;
      default: // popularity
        return b.stats.downloads - a.stats.downloads;
    }
  });
  
  const getCategoryColor = (category: string) => {
    const colors = {
      'business': 'bg-blue-100 text-blue-800',
      'safety': 'bg-red-100 text-red-800',
      'healthcare': 'bg-green-100 text-green-800',
      'education': 'bg-purple-100 text-purple-800',
      'entertainment': 'bg-pink-100 text-pink-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getQualityBadge = (quality: string) => {
    const badges = {
      'standard': { color: 'bg-gray-100 text-gray-800', icon: Monitor },
      'premium': { color: 'bg-blue-100 text-blue-800', icon: Star },
      'cinematic': { color: 'bg-purple-100 text-purple-800', icon: Camera },
      'hyperreal': { color: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white', icon: Sparkles }
    };
    return badges[quality as keyof typeof badges] || badges.standard;
  };



  const handlePreview = async (avatar: HyperRealisticAvatar) => {
    if (onPreview) {
      onPreview(avatar);
      return;
    }

    try {
      setPreviewLoading(true);
      
      // Verificar se Audio2Face está disponível
      const audio2FaceStatus = await fetch('/api/v2/avatars/audio2face/status');
      const statusData = await audio2FaceStatus.json();
      
      if (!statusData.available) {
        console.error('Audio2Face não está disponível no momento');
        return;
      }

      // Preparar dados para preview
      const previewData = {
        avatarId: avatar.id,
        text: 'Olá! Este é um preview do avatar com Audio2Face.',
        language: 'pt-BR',
        quality: 'preview', // Qualidade reduzida para preview rápido
        audio2Face: {
          enabled: avatar.features.audio2FaceCompatible,
          lipSyncAccuracy: avatar.features.lipSyncAccuracy,
          realTime: true
        }
      };

      // Iniciar preview via API v2
      const response = await fetch('/api/v2/avatars/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(previewData)
      });

      const result = await response.json();
      
      if (result.success) {
        // Atualizar estado do preview
        setPreviewData({
          avatarId: avatar.id,
          previewUrl: result.data.previewUrl,
          audio2FaceData: result.data.audio2Face,
          lipSyncCurves: result.data.lipSyncCurves,
          estimatedTime: result.data.estimatedTime
        });
        
        // Mostrar modal de preview
        setShowPreview(true);
        
        // Atualizar estatísticas do pipeline
        setPipelineStats(prev => {
          if (!prev) return {
            audio2FaceStatus: 'active',
            activeJobs: 0,
            activePreviews: 1,
            totalPreviews: 1
          };
          return {
            ...prev,
            activePreviews: prev.activePreviews + 1,
            totalPreviews: prev.totalPreviews + 1
          };
        });

        console.log(`Preview iniciado para ${avatar.name}`);
      } else {
        console.error(`Erro no preview: ${result.error}`);
      }
    } catch (error) {
      console.error('Erro ao iniciar preview:', error);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Função para fechar preview e limpar recursos
  const handleClosePreview = async () => {
    if (previewData?.avatarId) {
      try {
        // Notificar API para limpar recursos do preview
        await fetch(`/api/v2/avatars/preview/${previewData.avatarId}`, {
          method: 'DELETE'
        });
        
        // Atualizar estatísticas
        setPipelineStats(prev => {
          if (!prev) return null;
          return {
            ...prev,
            activePreviews: Math.max(0, prev.activePreviews - 1)
          };
        });
      } catch (error) {
        console.error('Erro ao limpar preview:', error);
      }
    }
    
    setShowPreview(false);
    setPreviewData(null);
  };

  // Função para favoritar avatar
  const handleFavorite = async (avatarId: string) => {
    try {
      const isFavorited = favorites.includes(avatarId);
      const method = isFavorited ? 'DELETE' : 'POST';
      
      const response = await fetch(`/api/v2/avatars/favorites/${avatarId}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        if (isFavorited) {
          setFavorites(prev => prev.filter(id => id !== avatarId));
          console.log('Avatar removido dos favoritos');
        } else {
          setFavorites(prev => [...prev, avatarId]);
          console.log('Avatar adicionado aos favoritos');
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar favoritos:', error);
    }
  };

  // Função para selecionar avatar para renderização
  const handleSelectAvatar = (avatar: HyperRealisticAvatar) => {
    onAvatarSelect(avatar);
    console.log(`Avatar ${avatar.name} selecionado para renderização`);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando avatares hiper-realistas...</p>
            <p className="text-sm text-gray-500">Inicializando Audio2Face...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Galeria de Avatares 3D</h2>
          <p className="text-gray-600">
            {sortedAvatars.length} avatares hiper-realistas • Audio2Face Ready
          </p>
        </div>
        {pipelineStats && (
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full ${pipelineStats.audio2FaceStatus === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>Audio2Face {pipelineStats.audio2FaceStatus === 'active' ? 'Ativo' : 'Inativo'}</span>
            </div>
            <div className="text-gray-500">
              {pipelineStats.activeJobs} jobs ativos
            </div>
          </div>
        )}
      </div>

      {/* Filtros e Controles */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Busca */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar avatares, categorias, tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtros */}
            <div className="flex gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="business">Negócios</SelectItem>
                  <SelectItem value="safety">Segurança</SelectItem>
                  <SelectItem value="healthcare">Saúde</SelectItem>
                  <SelectItem value="education">Educação</SelectItem>
                  <SelectItem value="entertainment">Entretenimento</SelectItem>
                </SelectContent>
              </Select>

              <Select value={qualityFilter} onValueChange={setQualityFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Qualidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="cinematic">Cinematic</SelectItem>
                  <SelectItem value="hyperreal">Hiper-Real</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popularity">Popularidade</SelectItem>
                  <SelectItem value="name">Nome</SelectItem>
                  <SelectItem value="rating">Avaliação</SelectItem>
                  <SelectItem value="newest">Mais Recente</SelectItem>
                  <SelectItem value="renderTime">Tempo Render</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode */}
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid de Avatares */}
      <div className={viewMode === 'grid' 
        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
        : "space-y-4"
      }>
        {sortedAvatars.map((avatar) => {
          const isSelected = selectedAvatar?.id === avatar.id;
          const isFavorite = favorites.includes(avatar.id);
          const qualityBadge = getQualityBadge(avatar.quality);
          const QualityIcon = qualityBadge.icon;
          
          return (
            <Card
              key={avatar.id}
              className={`cursor-pointer transition-all duration-300 ${
                isSelected
                  ? 'ring-2 ring-purple-500 shadow-lg scale-105'
                  : 'hover:shadow-md hover:scale-102'
              } ${viewMode === 'list' ? 'flex' : ''}`}
              onClick={() => onAvatarSelect(avatar)}
            >
              <CardContent className={`p-4 ${viewMode === 'list' ? 'flex space-x-4 w-full' : ''}`}>
                {/* Avatar Preview */}
                <div className={`relative ${viewMode === 'list' ? 'w-32 h-32' : 'aspect-square'} rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200`}>
                  <Image
                    src={`https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(`Professional ${avatar.gender} avatar ${avatar.name} ${avatar.category} style, hyper-realistic, 8K quality, studio lighting`)}&image_size=square_hd`}
                    alt={`Preview do avatar ${avatar.name}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-black/10 hover:bg-black/20 transition-colors" />
                  
                  {/* Badges */}
                  <div className="absolute top-2 right-2 space-y-1">
                    {avatar.premium && (
                      <Badge className="bg-yellow-100 text-yellow-800 flex items-center space-x-1">
                        <Crown className="h-3 w-3" />
                        <span>Premium</span>
                      </Badge>
                    )}
                    {avatar.features.audio2FaceCompatible && (
                      <Badge className="bg-green-100 text-green-800 flex items-center space-x-1">
                        <Mic className="h-3 w-3" />
                        <span>A2F</span>
                      </Badge>
                    )}
                    {avatar.engine === 'heygen' && (
                      <Badge className="bg-purple-100 text-purple-800 flex items-center space-x-1">
                        <Video className="h-3 w-3" />
                        <span>HeyGen</span>
                      </Badge>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="absolute bottom-2 left-2 flex space-x-2">
                    <div className="flex items-center space-x-1 bg-black/50 text-white px-2 py-1 rounded text-xs">
                      <Eye className="h-3 w-3" />
                      <span>{avatar.stats.downloads}</span>
                    </div>
                    <div className="flex items-center space-x-1 bg-black/50 text-white px-2 py-1 rounded text-xs">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>{avatar.stats.rating.toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="absolute bottom-2 right-2 flex space-x-1 opacity-0 hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreview(avatar);
                      }}
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFavorite(avatar.id);
                      }}
                    >
                      <Heart className={`h-3 w-3 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                    </Button>
                  </div>
                </div>

                {/* Avatar Info */}
                <div className={`space-y-3 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900">{avatar.name}</h4>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center space-x-2 flex-wrap">
                      <Badge className={getCategoryColor(avatar.category)}>
                        {avatar.category}
                      </Badge>
                      <Badge className={qualityBadge.color}>
                        <QualityIcon className="h-3 w-3 mr-1" />
                        {avatar.quality}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {avatar.ethnicity}
                      </Badge>
                    </div>

                    {/* Features */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Lip Sync:</span>
                        <div className="flex items-center space-x-1">
                          <div className={`w-2 h-2 rounded-full ${avatar.features.lipSyncAccuracy >= 95 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                          <span className="font-medium">{avatar.features.lipSyncAccuracy}%</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Render:</span>
                        <span className="font-medium">{avatar.stats.renderTime}s</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Idiomas:</span>
                        <div className="flex items-center space-x-1">
                          <Languages className="h-3 w-3" />
                          <span className="font-medium">{avatar.languages.length}</span>
                        </div>
                      </div>

                      {avatar.voiceCloning.supported && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Voice Clone:</span>
                          <div className="flex items-center space-x-1">
                            <Volume2 className="h-3 w-3" />
                            <span className="font-medium">{avatar.voiceCloning.quality}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Technical Specs */}
                    {viewMode === 'list' && (
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                        <div>ARKit: {avatar.features.arkitBlendShapes} shapes</div>
                        <div>Ray Tracing: {avatar.rendering.rayTracing ? 'Sim' : 'Não'}</div>
                        <div>Resolução: {avatar.rendering.resolution}</div>
                        <div>FPS: {avatar.rendering.maxFPS}</div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex space-x-2 pt-2">
                      <Button
                        size="sm"
                        variant={isSelected ? "default" : "outline"}
                        className="flex-1 flex items-center space-x-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectAvatar(avatar);
                        }}
                      >
                        <User className="h-3 w-3" />
                        <span>{isSelected ? 'Selecionado' : 'Selecionar'}</span>
                      </Button>
                      
                      {onRender && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRender(avatar);
                          }}
                        >
                          <Zap className="h-3 w-3" />
                        </Button>
                      )}
                    </div>

                    {/* Pricing */}
                    {avatar.premium && (
                      <div className="text-center pt-2 border-t">
                        <div className="text-lg font-bold text-purple-600">
                          {avatar.price === 0 ? 'Gratuito' : `R$ ${avatar.price}`}
                        </div>
                        {avatar.price > 0 && (
                          <div className="text-xs text-gray-500">por renderização</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Load More */}
      {sortedAvatars.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            <Search className="h-12 w-12 mx-auto mb-2" />
            <p>Nenhum avatar encontrado</p>
            <p className="text-sm">Tente ajustar os filtros de busca</p>
          </div>
        </div>
      )}

      {sortedAvatars.length > 0 && (
        <div className="text-center pt-4">
          <Button variant="outline" className="flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Carregar Mais Avatares</span>
          </Button>
        </div>
      )}

      {/* Modal de Preview Audio2Face */}
      {showPreview && previewData && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Preview Audio2Face</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClosePreview}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Preview do Avatar */}
              <div className="space-y-4">
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                  {previewData.previewUrl ? (
                    <video
                      src={previewData.previewUrl}
                      controls
                      autoPlay
                      className="w-full h-full rounded-lg"
                    />
                  ) : (
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                      <p>Gerando preview...</p>
                    </div>
                  )}
                </div>
                
                {/* Controles de Preview */}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Play className="h-4 w-4 mr-2" />
                    Reproduzir
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button size="sm" variant="outline">
                    <Share2 className="h-4 w-4 mr-2" />
                    Compartilhar
                  </Button>
                </div>
              </div>
              
              {/* Dados Audio2Face */}
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3">Dados Audio2Face</h4>
                  
                  {/* Precisão Lip-Sync */}
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Precisão Lip-Sync</span>
                      <span>{previewData.audio2FaceData?.lipSyncAccuracy || 95}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${previewData.audio2FaceData?.lipSyncAccuracy || 95}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Tempo de Processamento */}
                  <div className="mb-3">
                    <div className="flex justify-between text-sm">
                      <span>Tempo Estimado</span>
                      <span>{previewData.estimatedTime || '2-3'} min</span>
                    </div>
                  </div>
                  
                  {/* Status do Pipeline */}
                  <div className="mb-3">
                    <div className="flex justify-between text-sm">
                      <span>Status Pipeline</span>
                      <span className="text-green-600">✓ Ativo</span>
                    </div>
                  </div>
                </div>
                
                {/* Curvas de Lip-Sync */}
                {previewData.lipSyncCurves && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-3">Curvas ARKit</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>jawOpen: {previewData.lipSyncCurves.jawOpen?.toFixed(3) || '0.000'}</div>
                      <div>mouthClose: {previewData.lipSyncCurves.mouthClose?.toFixed(3) || '0.000'}</div>
                      <div>mouthFunnel: {previewData.lipSyncCurves.mouthFunnel?.toFixed(3) || '0.000'}</div>
                      <div>mouthPucker: {previewData.lipSyncCurves.mouthPucker?.toFixed(3) || '0.000'}</div>
                      <div>mouthLeft: {previewData.lipSyncCurves.mouthLeft?.toFixed(3) || '0.000'}</div>
                      <div>mouthRight: {previewData.lipSyncCurves.mouthRight?.toFixed(3) || '0.000'}</div>
                    </div>
                  </div>
                )}
                
                {/* Ações */}
                <div className="flex gap-2">
                  <Button 
                    className="flex-1"
                    onClick={() => {
                      const avatar = avatars.find(a => a.id === previewData.avatarId);
                      if (avatar) {
                        handleSelectAvatar(avatar);
                        handleClosePreview();
                      }
                    }}
                  >
                    Usar este Avatar
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      handleFavorite(previewData.avatarId);
                    }}
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
