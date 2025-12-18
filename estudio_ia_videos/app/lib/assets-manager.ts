/**
 * Assets Manager Library
 * 
 * Gerenciamento centralizado de assets (imagens, áudio, vídeo, fontes)
 * Integração com Unsplash, Freesound e uploads locais
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

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
  /**
   * Buscar assets no banco de dados e APIs externas
   */
  async searchAll(query: string, filters?: SearchFilters, userId?: string): Promise<AssetItem[]> {
    try {
      // Construir condições de busca
      const where: any = {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { tags: { hasSome: [query] } }
        ]
      };

      // Aplicar filtros
      if (filters?.type) {
        where.type = filters.type;
      }
      if (filters?.category) {
        where.category = filters.category;
      }
      if (filters?.license && filters.license !== 'all') {
        where.license = filters.license;
      }

      // Buscar apenas assets públicos ou do usuário
      if (userId) {
        where.OR = [
          { isPublic: true },
          { userId }
        ];
      } else {
        where.isPublic = true;
      }

      // Buscar no banco de dados
      const dbAssets = await prisma.asset.findMany({
        where,
        take: 50,
        orderBy: { favorites: 'desc' }
      });

      // Converter para formato AssetItem
      const results: AssetItem[] = dbAssets.map(asset => ({
        id: asset.id,
        title: asset.name,
        type: asset.type as AssetItem['type'],
        url: asset.url,
        thumbnailUrl: asset.thumbnailUrl || undefined,
        source: asset.provider as AssetItem['source'],
        category: asset.category || undefined,
        tags: asset.tags,
        license: asset.license as AssetItem['license'],
        width: asset.width || undefined,
        height: asset.height || undefined,
        duration: asset.duration || undefined,
        size: asset.size ? Number(asset.size) : undefined,
        favorites: asset.favorites,
        metadata: asset.metadata as Record<string, unknown> | undefined
      }));

      logger.info('Busca de assets realizada', { query, resultsCount: results.length, component: 'AssetsManager' });

      return results;
    } catch (error) {
      logger.error('Erro ao buscar assets', error instanceof Error ? error : new Error(String(error)), {
        query,
        component: 'AssetsManager'
      });
      return [];
    }
  }

  /**
   * Buscar todas as coleções
   */
  async getAllCollections(userId?: string): Promise<AssetCollection[]> {
    try {
      const where: any = {
        OR: [
          { isSystem: true }
        ]
      };

      if (userId) {
        where.OR.push({ userId });
      }

      const collections = await prisma.assetCollection.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      });

      return collections.map(col => ({
        id: col.id,
        name: col.name,
        description: col.description || undefined,
        coverImage: col.coverImage || undefined,
        assetsCount: col.assetsCount,
        isSystem: col.isSystem,
        userId: col.userId || undefined
      }));
    } catch (error) {
      logger.error('Erro ao buscar coleções', error instanceof Error ? error : new Error(String(error)), {
        component: 'AssetsManager'
      });
      return [];
    }
  }

  /**
   * Obter favoritos do usuário
   */
  async getFavorites(userId: string): Promise<string[]> {
    try {
      const favorites = await prisma.assetFavorite.findMany({
        where: { userId },
        select: { assetId: true }
      });

      return favorites.map(fav => fav.assetId);
    } catch (error) {
      logger.error('Erro ao buscar favoritos', error instanceof Error ? error : new Error(String(error)), {
        userId,
        component: 'AssetsManager'
      });
      return [];
    }
  }

  /**
   * Adicionar aos favoritos
   */
  async addToFavorites(assetId: string, userId: string): Promise<void> {
    try {
      await prisma.assetFavorite.upsert({
        where: {
          assetId_userId: {
            assetId,
            userId
          }
        },
        create: {
          assetId,
          userId
        },
        update: {}
      });

      // Incrementar contador de favoritos
      await prisma.asset.update({
        where: { id: assetId },
        data: { favorites: { increment: 1 } }
      });
    } catch (error) {
      logger.error('Erro ao adicionar favorito', error instanceof Error ? error : new Error(String(error)), {
        assetId,
        userId,
        component: 'AssetsManager'
      });
      throw error;
    }
  }

  /**
   * Remover dos favoritos
   */
  async removeFromFavorites(assetId: string, userId: string): Promise<void> {
    try {
      await prisma.assetFavorite.deleteMany({
        where: {
          assetId,
          userId
        }
      });

      // Decrementar contador de favoritos
      await prisma.asset.update({
        where: { id: assetId },
        data: { favorites: { decrement: 1 } }
      });
    } catch (error) {
      logger.error('Erro ao remover favorito', error instanceof Error ? error : new Error(String(error)), {
        assetId,
        userId,
        component: 'AssetsManager'
      });
      throw error;
    }
  }

  /**
   * Upload de asset customizado
   */
  async uploadCustomAsset(file: File, data: Partial<AssetItem>, userId?: string): Promise<AssetItem> {
    try {
      // TODO: Upload real do arquivo para S3/Supabase Storage
      // Por enquanto, assume que a URL já foi gerada
      const assetType = data.type || (file.type.startsWith('image/') ? 'image' : 
                                      file.type.startsWith('video/') ? 'video' : 
                                      file.type.startsWith('audio/') ? 'audio' : 'template');

      const asset = await prisma.asset.create({
        data: {
          name: data.title || file.name,
          description: data.metadata?.description as string || undefined,
          type: assetType,
          url: data.url || '', // Deve ser preenchido após upload
          thumbnailUrl: data.thumbnailUrl || undefined,
          license: data.license || 'royalty-free',
          provider: 'custom',
          tags: data.tags || ['upload', 'custom'],
          category: data.category || 'custom',
          width: data.width,
          height: data.height,
          duration: data.duration,
          size: data.size ? BigInt(data.size) : BigInt(file.size),
          userId: userId || undefined,
          isPublic: false,
          metadata: data.metadata || {}
        }
      });

      return {
        id: asset.id,
        title: asset.name,
        type: asset.type as AssetItem['type'],
        url: asset.url,
        thumbnailUrl: asset.thumbnailUrl || undefined,
        source: asset.provider as AssetItem['source'],
        category: asset.category || undefined,
        tags: asset.tags,
        license: asset.license as AssetItem['license'],
        width: asset.width || undefined,
        height: asset.height || undefined,
        duration: asset.duration || undefined,
        size: asset.size ? Number(asset.size) : undefined,
        favorites: asset.favorites,
        metadata: asset.metadata as Record<string, unknown> | undefined
      };
    } catch (error) {
      logger.error('Erro ao fazer upload de asset', error instanceof Error ? error : new Error(String(error)), {
        fileName: file.name,
        component: 'AssetsManager'
      });
      throw error;
    }
  }
}

export const assetsManager = new AssetsManager();
