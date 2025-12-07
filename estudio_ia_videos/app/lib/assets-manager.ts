/**
 * Assets Manager Library
 * 
 * Gerenciamento centralizado de assets (imagens, áudio, vídeo, fontes)
 * Integração com Unsplash, Freesound e uploads locais
 */

export interface AssetItem {
  id: string;
  title: string;
  type: 'image' | 'audio' | 'video' | 'font' | 'template';
  url: string;
  thumbnailUrl?: string;
  source: 'unsplash' | 'freesound' | 'local' | 'custom' | 'system';
  category?: string;
  tags: string[];
  license: 'free' | 'creative-commons' | 'royalty-free' | 'paid';
  width?: number;
  height?: number;
  duration?: number; // em segundos
  size?: number; // em bytes
  favorites?: number;
  author?: {
    name: string;
    url?: string;
  };
  metadata?: Record<string, unknown>;
}

export interface AssetCollection {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  assetsCount: number;
  isSystem?: boolean;
  userId?: string;
}

export interface SearchFilters {
  category?: string;
  type?: 'image' | 'audio' | 'video' | 'font' | 'template';
  license?: 'all' | 'free' | 'creative-commons' | 'royalty-free';
  orientation?: 'landscape' | 'portrait' | 'square';
  quality?: 'high' | 'medium' | 'low';
  safeSearch?: boolean;
}

export const SEARCH_PRESETS = {
  'corporate-bg': {
    query: 'corporate office background',
    filters: { type: 'image', orientation: 'landscape' }
  },
  'upbeat-music': {
    query: 'upbeat corporate music',
    filters: { type: 'audio', license: 'royalty-free' }
  },
  'nature-video': {
    query: 'nature landscape drone',
    filters: { type: 'video', quality: 'high' }
  },
  'tech-icons': {
    query: 'technology icons minimal',
    filters: { type: 'image', license: 'free' }
  }
};

class AssetsManager {
  private mockAssets: AssetItem[] = [
    {
      id: 'img-1',
      title: 'Modern Office',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1497366216548-37526070297c',
      thumbnailUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=300',
      source: 'unsplash',
      category: 'business',
      tags: ['office', 'modern', 'work'],
      license: 'free',
      width: 1920,
      height: 1080,
      favorites: 120,
      author: { name: 'Unsplash' }
    },
    {
      id: 'audio-1',
      title: 'Corporate Upbeat',
      type: 'audio',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      source: 'freesound',
      category: 'music',
      tags: ['corporate', 'upbeat', 'background'],
      license: 'royalty-free',
      duration: 120,
      favorites: 45,
      author: { name: 'AudioLib' }
    }
  ];

  private mockCollections: AssetCollection[] = [
    {
      id: 'col-1',
      name: 'Business Essentials',
      description: 'Imagens e ícones para apresentações corporativas',
      assetsCount: 24,
      isSystem: true
    },
    {
      id: 'col-2',
      name: 'Nature Backgrounds',
      description: 'Paisagens naturais em alta resolução',
      assetsCount: 15,
      isSystem: true
    }
  ];

  private userFavorites: Set<string> = new Set();

  async searchAll(query: string, filters?: SearchFilters): Promise<AssetItem[]> {
    // Simulação de busca
    // Em produção, chamaria APIs reais (Unsplash, Freesound, DB local)
    console.log(`Searching for "${query}" with filters:`, filters);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        const results = this.mockAssets.filter(asset => 
          asset.title.toLowerCase().includes(query.toLowerCase()) ||
          asset.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
        );
        
        // Se não encontrar nada, retorna mocks genéricos para não ficar vazio na demo
        if (results.length === 0) {
          resolve(this.generateMockResults(query, filters?.type));
        } else {
          resolve(results);
        }
      }, 500);
    });
  }

  private generateMockResults(query: string, type?: string): AssetItem[] {
    const count = 8;
    const results: AssetItem[] = [];
    const assetType = type || 'image';
    
    for (let i = 0; i < count; i++) {
      results.push({
        id: `mock-${Date.now()}-${i}`,
        title: `${query} ${i + 1}`,
        type: assetType as AssetItem['type'],
        url: assetType === 'image' 
          ? `https://source.unsplash.com/random/800x600?${encodeURIComponent(query)}&sig=${i}`
          : 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        thumbnailUrl: assetType === 'image'
          ? `https://source.unsplash.com/random/300x200?${encodeURIComponent(query)}&sig=${i}`
          : undefined,
        source: 'unsplash',
        tags: [query, 'mock', 'demo'],
        license: 'free',
        favorites: Math.floor(Math.random() * 100),
        width: 1920,
        height: 1080,
        duration: assetType === 'audio' ? 120 : undefined
      });
    }
    return results;
  }

  async getAllCollections(): Promise<AssetCollection[]> {
    return Promise.resolve(this.mockCollections);
  }

  async getFavorites(userId: string): Promise<string[]> {
    return Promise.resolve(Array.from(this.userFavorites));
  }

  async addToFavorites(assetId: string, userId: string): Promise<void> {
    this.userFavorites.add(assetId);
    return Promise.resolve();
  }

  async removeFromFavorites(assetId: string, userId: string): Promise<void> {
    this.userFavorites.delete(assetId);
    return Promise.resolve();
  }

  async uploadCustomAsset(file: File, data: Partial<AssetItem>): Promise<AssetItem> {
    // Simulação de upload
    return new Promise((resolve) => {
      setTimeout(() => {
        const newAsset: AssetItem = {
          id: data.id || `custom-${Date.now()}`,
          title: data.title || file.name,
          type: data.type || (file.type.startsWith('image/') ? 'image' : 'audio'),
          url: data.url || URL.createObjectURL(file),
          source: 'custom',
          category: data.category || 'custom',
          tags: ['upload', 'custom'],
          license: 'royalty-free',
          favorites: 0,
          size: file.size
        };
        this.mockAssets.unshift(newAsset);
        resolve(newAsset);
      }, 1000);
    });
  }
}

export const assetsManager = new AssetsManager();
