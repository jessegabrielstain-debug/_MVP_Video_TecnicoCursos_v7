/**
 * Template Marketplace
 * Sistema completo de compra/venda de templates
 */

import { logger } from '@/lib/logger';
import { createClient } from '@supabase/supabase-js';

// ==============================================
// TIPOS
// ==============================================

export interface MarketplaceTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  price: number; // em centavos
  currency: 'USD' | 'BRL' | 'EUR';
  isPremium: boolean;
  isFree: boolean;
  
  author: {
    id: string;
    name: string;
    avatar?: string;
    verified: boolean;
  };
  
  preview: {
    thumbnailUrl: string;
    videoUrl?: string;
    images: string[];
    demoUrl?: string;
  };
  
  stats: {
    sales: number;
    rating: number; // 0-5
    reviews: number;
    downloads: number;
    views: number;
  };
  
  content: {
    templateId: string; // Referência ao template real
    variables: unknown[];
    slides: unknown[];
  };
  
  licensing: {
    type: 'single' | 'unlimited' | 'commercial';
    allowRedistribution: boolean;
    allowModification: boolean;
    requiresAttribution: boolean;
  };
  
  metadata: {
    version: string;
    lastUpdated: string;
    createdAt: string;
    compatibility: string[];
  };
}

export interface MarketplaceReview {
  id: string;
  templateId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number; // 1-5
  comment: string;
  helpful: number;
  createdAt: string;
  response?: {
    from: 'author' | 'admin';
    text: string;
    createdAt: string;
  };
}

export interface MarketplacePurchase {
  id: string;
  templateId: string;
  userId: string;
  price: number;
  currency: string;
  paymentMethod: string;
  status: 'pending' | 'completed' | 'refunded' | 'failed';
  createdAt: string;
  licenseKey: string;
}

export interface MarketplaceRevenue {
  templateId: string;
  authorId: string;
  totalSales: number;
  totalRevenue: number;
  platformFee: number; // Percentage
  authorEarnings: number;
  period: {
    start: string;
    end: string;
  };
}

// ==============================================
// TEMPLATE MARKETPLACE ENGINE
// ==============================================

export class TemplateMarketplaceEngine {
  private supabase;
  private readonly PLATFORM_FEE = 0.20; // 20% platform fee

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Listar templates do marketplace
   */
  async listTemplates(filters?: {
    category?: string;
    tags?: string[];
    minPrice?: number;
    maxPrice?: number;
    isPremium?: boolean;
    isFree?: boolean;
    authorId?: string;
    sortBy?: 'popular' | 'recent' | 'rating' | 'price-asc' | 'price-desc';
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ templates: MarketplaceTemplate[]; total: number; page: number }> {
    try {
      logger.info('Listing marketplace templates', {
        component: 'TemplateMarketplaceEngine',
        filters
      });

      let query = this.supabase
        .from('marketplace_templates')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags);
      }

      if (filters?.minPrice !== undefined) {
        query = query.gte('price', filters.minPrice);
      }

      if (filters?.maxPrice !== undefined) {
        query = query.lte('price', filters.maxPrice);
      }

      if (filters?.isPremium !== undefined) {
        query = query.eq('is_premium', filters.isPremium);
      }

      if (filters?.isFree !== undefined) {
        query = query.eq('is_free', filters.isFree);
      }

      if (filters?.authorId) {
        query = query.eq('author_id', filters.authorId);
      }

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      // Sorting
      switch (filters?.sortBy) {
        case 'popular':
          query = query.order('stats->>sales', { ascending: false });
          break;
        case 'rating':
          query = query.order('stats->>rating', { ascending: false });
          break;
        case 'price-asc':
          query = query.order('price', { ascending: true });
          break;
        case 'price-desc':
          query = query.order('price', { ascending: false });
          break;
        case 'recent':
        default:
          query = query.order('created_at', { ascending: false });
      }

      // Pagination
      const page = filters?.page || 1;
      const limit = filters?.limit || 20;
      const start = (page - 1) * limit;
      const end = start + limit - 1;

      query = query.range(start, end);

      const { data, error, count } = await query;

      if (error) {
        logger.error('Error listing templates', error, {
          component: 'TemplateMarketplaceEngine'
        });
        return { templates: [], total: 0, page };
      }

      return {
        templates: data as MarketplaceTemplate[],
        total: count || 0,
        page
      };
    } catch (error) {
      logger.error('Error in listTemplates', error instanceof Error ? error : new Error(String(error)), {
        component: 'TemplateMarketplaceEngine'
      });
      return { templates: [], total: 0, page: 1 };
    }
  }

  /**
   * Obter detalhes de um template
   */
  async getTemplate(templateId: string): Promise<MarketplaceTemplate | null> {
    try {
      const { data, error } = await this.supabase
        .from('marketplace_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error || !data) {
        return null;
      }

      // Increment view count
      await this.incrementViews(templateId);

      return data as MarketplaceTemplate;
    } catch (error) {
      logger.error('Error getting template', error instanceof Error ? error : new Error(String(error)), {
        component: 'TemplateMarketplaceEngine',
        templateId
      });
      return null;
    }
  }

  /**
   * Publicar template no marketplace
   */
  async publishTemplate(
    authorId: string,
    template: Omit<MarketplaceTemplate, 'id' | 'author' | 'stats' | 'metadata'>
  ): Promise<{ success: boolean; templateId?: string; error?: string }> {
    try {
      // Verificar se autor pode publicar (verificação, limites, etc)
      const canPublish = await this.canAuthorPublish(authorId);
      if (!canPublish.allowed) {
        return { success: false, error: canPublish.reason };
      }

      const { data, error } = await this.supabase
        .from('marketplace_templates')
        .insert({
          ...template,
          author_id: authorId,
          stats: {
            sales: 0,
            rating: 0,
            reviews: 0,
            downloads: 0,
            views: 0
          },
          metadata: {
            version: '1.0.0',
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            compatibility: ['v2.0', 'v2.1']
          }
        })
        .select('id')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      logger.info('Template published to marketplace', {
        component: 'TemplateMarketplaceEngine',
        templateId: data.id,
        authorId
      });

      return { success: true, templateId: data.id };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Comprar template
   */
  async purchaseTemplate(
    userId: string,
    templateId: string,
    paymentMethod: string
  ): Promise<{ success: boolean; purchase?: MarketplacePurchase; error?: string }> {
    try {
      // 1. Verificar se template existe e está disponível
      const template = await this.getTemplate(templateId);
      if (!template) {
        return { success: false, error: 'Template not found' };
      }

      // 2. Verificar se usuário já comprou
      const alreadyPurchased = await this.hasUserPurchased(userId, templateId);
      if (alreadyPurchased) {
        return { success: false, error: 'Already purchased' };
      }

      // 3. Processar pagamento
      // TODO: Integrar com Stripe/PayPal
      const paymentResult = await this.processPayment({
        userId,
        amount: template.price,
        currency: template.currency,
        method: paymentMethod
      });

      if (!paymentResult.success) {
        return { success: false, error: 'Payment failed' };
      }

      // 4. Criar compra
      const { data: purchase, error } = await this.supabase
        .from('marketplace_purchases')
        .insert({
          template_id: templateId,
          user_id: userId,
          price: template.price,
          currency: template.currency,
          payment_method: paymentMethod,
          status: 'completed',
          license_key: this.generateLicenseKey(),
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      // 5. Atualizar estatísticas
      await this.incrementSales(templateId);

      // 6. Calcular e registrar revenue
      await this.calculateRevenue(templateId, template.price);

      logger.info('Template purchased', {
        component: 'TemplateMarketplaceEngine',
        templateId,
        userId,
        price: template.price
      });

      return { success: true, purchase: purchase as MarketplacePurchase };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Adicionar review
   */
  async addReview(
    userId: string,
    templateId: string,
    rating: number,
    comment: string
  ): Promise<{ success: boolean; review?: MarketplaceReview; error?: string }> {
    try {
      // Verificar se usuário comprou o template
      const hasPurchased = await this.hasUserPurchased(userId, templateId);
      if (!hasPurchased) {
        return { success: false, error: 'Must purchase template before reviewing' };
      }

      // Verificar se já reviewou
      const { data: existing } = await this.supabase
        .from('marketplace_reviews')
        .select('id')
        .eq('template_id', templateId)
        .eq('user_id', userId)
        .single();

      if (existing) {
        return { success: false, error: 'Already reviewed' };
      }

      // Criar review
      const { data, error } = await this.supabase
        .from('marketplace_reviews')
        .insert({
          template_id: templateId,
          user_id: userId,
          rating,
          comment,
          helpful: 0,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      // Atualizar rating do template
      await this.updateTemplateRating(templateId);

      return { success: true, review: data as MarketplaceReview };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Obter revenue do autor
   */
  async getAuthorRevenue(
    authorId: string,
    period?: { start: string; end: string }
  ): Promise<MarketplaceRevenue | null> {
    try {
      const { data, error } = await this.supabase
        .rpc('calculate_author_revenue', {
          author_id: authorId,
          period_start: period?.start,
          period_end: period?.end
        });

      if (error) {
        return null;
      }

      return data as MarketplaceRevenue;
    } catch (error) {
      return null;
    }
  }

  // ==============================================
  // HELPERS PRIVADOS
  // ==============================================

  private async canAuthorPublish(authorId: string): Promise<{ allowed: boolean; reason?: string }> {
    // TODO: Implementar verificações:
    // - Autor verificado?
    // - Limite de templates atingido?
    // - Conta em boas condições?
    return { allowed: true };
  }

  private async hasUserPurchased(userId: string, templateId: string): Promise<boolean> {
    const { data } = await this.supabase
      .from('marketplace_purchases')
      .select('id')
      .eq('user_id', userId)
      .eq('template_id', templateId)
      .eq('status', 'completed')
      .single();

    return !!data;
  }

  private async processPayment(payment: {
    userId: string;
    amount: number;
    currency: string;
    method: string;
  }): Promise<{ success: boolean; error?: string }> {
    // TODO: Integrar com Stripe
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // const paymentIntent = await stripe.paymentIntents.create({ ... });
    
    return { success: true };
  }

  private generateLicenseKey(): string {
    // Gerar chave única de licença
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segments = 4;
    const segmentLength = 4;

    return Array.from({ length: segments }, () =>
      Array.from(
        { length: segmentLength },
        () => chars[Math.floor(Math.random() * chars.length)]
      ).join('')
    ).join('-');
  }

  private async incrementViews(templateId: string): Promise<void> {
    await this.supabase.rpc('increment_template_views', { template_id: templateId });
  }

  private async incrementSales(templateId: string): Promise<void> {
    await this.supabase.rpc('increment_template_sales', { template_id: templateId });
  }

  private async updateTemplateRating(templateId: string): Promise<void> {
    await this.supabase.rpc('update_template_rating', { template_id: templateId });
  }

  private async calculateRevenue(templateId: string, price: number): Promise<void> {
    const platformFee = price * this.PLATFORM_FEE;
    const authorEarnings = price - platformFee;

    await this.supabase.from('marketplace_revenue').insert({
      template_id: templateId,
      total_revenue: price,
      platform_fee: platformFee,
      author_earnings: authorEarnings,
      created_at: new Date().toISOString()
    });
  }
}

// Export singleton
export const templateMarketplaceEngine = new TemplateMarketplaceEngine();
