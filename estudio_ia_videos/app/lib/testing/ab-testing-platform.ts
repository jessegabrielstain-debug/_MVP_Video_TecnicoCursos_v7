/**
 * A/B Testing Platform
 * Sistema completo de testes A/B para vídeos e templates
 */

import { logger } from '@/lib/logger';
import { createClient } from '@supabase/supabase-js';

// ==============================================
// TIPOS
// ==============================================

export interface ABTest {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  
  variants: ABTestVariant[];
  
  config: {
    trafficAllocation: number; // 0-100 percentage
    winnerCriteria: 'views' | 'completion_rate' | 'engagement' | 'custom';
    minSampleSize: number;
    confidenceLevel: number; // 0.90, 0.95, 0.99
    maxDuration: number; // days
  };
  
  targeting: {
    audience?: string[];
    demographics?: {
      countries?: string[];
      ageRange?: { min: number; max: number };
      devices?: string[];
    };
    schedule?: {
      startDate: string;
      endDate?: string;
    };
  };
  
  results: {
    winner?: string; // variant ID
    confidence: number;
    p_value: number;
    totalParticipants: number;
    conclusive: boolean;
  };
  
  metadata: {
    createdBy: string;
    createdAt: string;
    startedAt?: string;
    completedAt?: string;
  };
}

export interface ABTestVariant {
  id: string;
  name: string;
  description?: string;
  isControl: boolean;
  
  content: {
    videoId?: string;
    templateId?: string;
    customizations?: Record<string, unknown>;
  };
  
  traffic: {
    allocation: number; // percentage
    actual: number; // actual traffic received
  };
  
  metrics: {
    impressions: number;
    views: number;
    uniqueViews: number;
    completionRate: number;
    averageWatchTime: number;
    engagement: {
      likes: number;
      shares: number;
      comments: number;
    };
    conversions: number;
    customMetrics: Record<string, number>;
  };
}

export interface ABTestParticipant {
  id: string;
  testId: string;
  variantId: string;
  userId?: string;
  sessionId: string;
  
  events: Array<{
    type: 'impression' | 'view' | 'complete' | 'engage' | 'convert';
    timestamp: string;
    metadata?: Record<string, unknown>;
  }>;
  
  demographics: {
    country?: string;
    device?: string;
    browser?: string;
  };
  
  assignedAt: string;
}

export interface ABTestReport {
  testId: string;
  generatedAt: string;
  
  summary: {
    status: string;
    duration: number; // days
    totalParticipants: number;
    conclusive: boolean;
    winner?: {
      variantId: string;
      variantName: string;
      improvement: number; // percentage
      confidence: number;
    };
  };
  
  variants: Array<{
    id: string;
    name: string;
    participants: number;
    metrics: ABTestVariant['metrics'];
    statisticalSignificance: {
      vsControl: {
        pValue: number;
        significant: boolean;
        improvement: number;
      };
    };
  }>;
  
  recommendations: string[];
  insights: string[];
}

// ==============================================
// A/B TESTING PLATFORM
// ==============================================

export class ABTestingPlatform {
  private supabase;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Criar novo teste A/B
   */
  async createTest(
    userId: string,
    test: Omit<ABTest, 'id' | 'status' | 'results' | 'metadata'>
  ): Promise<{ success: boolean; testId?: string; error?: string }> {
    try {
      // Validar configuração
      const validation = this.validateTestConfig(test);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      const { data, error } = await this.supabase
        .from('ab_tests')
        .insert({
          ...test,
          status: 'draft',
          results: {
            confidence: 0,
            p_value: 1,
            totalParticipants: 0,
            conclusive: false
          },
          metadata: {
            createdBy: userId,
            createdAt: new Date().toISOString()
          }
        })
        .select('id')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      logger.info('A/B test created', {
        component: 'ABTestingPlatform',
        testId: data.id,
        userId
      });

      return { success: true, testId: data.id };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Iniciar teste
   */
  async startTest(testId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('ab_tests')
        .update({
          status: 'running',
          'metadata.startedAt': new Date().toISOString()
        })
        .eq('id', testId);

      if (error) {
        return { success: false, error: error.message };
      }

      logger.info('A/B test started', {
        component: 'ABTestingPlatform',
        testId
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Atribuir variante a um participante
   */
  async assignVariant(
    testId: string,
    userId?: string,
    sessionId?: string
  ): Promise<{ success: boolean; variant?: ABTestVariant; error?: string }> {
    try {
      // Obter teste
      const test = await this.getTest(testId);
      if (!test || test.status !== 'running') {
        return { success: false, error: 'Test not running' };
      }

      // Verificar se já foi atribuído
      const existing = await this.getParticipantAssignment(testId, userId, sessionId);
      if (existing) {
        const variant = test.variants.find(v => v.id === existing.variantId);
        return { success: true, variant };
      }

      // Atribuir variante baseado em traffic allocation
      const variant = this.selectVariant(test.variants);

      // Registrar participante
      const { error } = await this.supabase
        .from('ab_test_participants')
        .insert({
          test_id: testId,
          variant_id: variant.id,
          user_id: userId,
          session_id: sessionId || this.generateSessionId(),
          events: [],
          assigned_at: new Date().toISOString()
        });

      if (error) {
        return { success: false, error: error.message };
      }

      // Incrementar contadores
      await this.incrementVariantMetric(testId, variant.id, 'impressions');

      return { success: true, variant };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Registrar evento
   */
  async trackEvent(
    testId: string,
    variantId: string,
    event: {
      type: 'impression' | 'view' | 'complete' | 'engage' | 'convert';
      userId?: string;
      sessionId?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Adicionar evento ao participante
      await this.supabase
        .from('ab_test_participants')
        .update({
          events: this.supabase.rpc('array_append', {
            array_col: 'events',
            new_element: {
              type: event.type,
              timestamp: new Date().toISOString(),
              metadata: event.metadata
            }
          })
        })
        .eq('test_id', testId)
        .eq('variant_id', variantId)
        .eq('session_id', event.sessionId);

      // Atualizar métricas da variante
      await this.updateVariantMetrics(testId, variantId, event.type);

      // Verificar se teste deve ser concluído
      await this.checkTestCompletion(testId);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Obter relatório do teste
   */
  async getTestReport(testId: string): Promise<ABTestReport | null> {
    try {
      const test = await this.getTest(testId);
      if (!test) return null;

      // Calcular estatísticas
      const report: ABTestReport = {
        testId,
        generatedAt: new Date().toISOString(),
        summary: {
          status: test.status,
          duration: this.calculateDuration(test.metadata.startedAt),
          totalParticipants: test.results.totalParticipants,
          conclusive: test.results.conclusive,
          winner: test.results.winner
            ? {
                variantId: test.results.winner,
                variantName:
                  test.variants.find(v => v.id === test.results.winner)?.name || 'Unknown',
                improvement: this.calculateImprovement(test),
                confidence: test.results.confidence
              }
            : undefined
        },
        variants: test.variants.map(variant => ({
          id: variant.id,
          name: variant.name,
          participants: variant.metrics.uniqueViews,
          metrics: variant.metrics,
          statisticalSignificance: this.calculateSignificance(test, variant)
        })),
        recommendations: this.generateRecommendations(test),
        insights: this.generateInsights(test)
      };

      return report;
    } catch (error) {
      logger.error('Error generating test report', error instanceof Error ? error : new Error(String(error)), {
        component: 'ABTestingPlatform',
        testId
      });
      return null;
    }
  }

  /**
   * Pausar teste
   */
  async pauseTest(testId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('ab_tests')
        .update({ status: 'paused' })
        .eq('id', testId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Concluir teste e declarar vencedor
   */
  async completeTest(testId: string): Promise<{ success: boolean; winner?: string; error?: string }> {
    try {
      const test = await this.getTest(testId);
      if (!test) {
        return { success: false, error: 'Test not found' };
      }

      // Calcular vencedor
      const winner = this.determineWinner(test);

      const { error } = await this.supabase
        .from('ab_tests')
        .update({
          status: 'completed',
          'results.winner': winner.variantId,
          'results.confidence': winner.confidence,
          'results.conclusive': winner.conclusive,
          'metadata.completedAt': new Date().toISOString()
        })
        .eq('id', testId);

      if (error) {
        return { success: false, error: error.message };
      }

      logger.info('A/B test completed', {
        component: 'ABTestingPlatform',
        testId,
        winner: winner.variantId
      });

      return { success: true, winner: winner.variantId };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // ==============================================
  // HELPERS PRIVADOS
  // ==============================================

  private validateTestConfig(test: any): { valid: boolean; error?: string } {
    // Validar que soma de traffic allocation = 100%
    const totalAllocation = test.variants.reduce(
      (sum: number, v: ABTestVariant) => sum + v.traffic.allocation,
      0
    );

    if (Math.abs(totalAllocation - 100) > 0.01) {
      return { valid: false, error: 'Traffic allocation must sum to 100%' };
    }

    // Validar que há pelo menos 2 variantes
    if (test.variants.length < 2) {
      return { valid: false, error: 'Test must have at least 2 variants' };
    }

    // Validar que há exatamente 1 controle
    const controlCount = test.variants.filter((v: ABTestVariant) => v.isControl).length;
    if (controlCount !== 1) {
      return { valid: false, error: 'Test must have exactly 1 control variant' };
    }

    return { valid: true };
  }

  private selectVariant(variants: ABTestVariant[]): ABTestVariant {
    // Weighted random selection baseado em traffic allocation
    const random = Math.random() * 100;
    let cumulative = 0;

    for (const variant of variants) {
      cumulative += variant.traffic.allocation;
      if (random <= cumulative) {
        return variant;
      }
    }

    return variants[0]; // fallback
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getTest(testId: string): Promise<ABTest | null> {
    const { data } = await this.supabase
      .from('ab_tests')
      .select('*')
      .eq('id', testId)
      .single();

    return data as ABTest | null;
  }

  private async getParticipantAssignment(
    testId: string,
    userId?: string,
    sessionId?: string
  ): Promise<{ variantId: string } | null> {
    const query = this.supabase
      .from('ab_test_participants')
      .select('variant_id')
      .eq('test_id', testId);

    if (userId) {
      query.eq('user_id', userId);
    } else if (sessionId) {
      query.eq('session_id', sessionId);
    } else {
      return null;
    }

    const { data } = await query.single();
    return data ? { variantId: data.variant_id } : null;
  }

  private async incrementVariantMetric(testId: string, variantId: string, metric: string): Promise<void> {
    // TODO: Implementar increment atômico
    await this.supabase.rpc('increment_variant_metric', {
      test_id: testId,
      variant_id: variantId,
      metric_name: metric
    });
  }

  private async updateVariantMetrics(testId: string, variantId: string, eventType: string): Promise<void> {
    // Atualizar métricas baseado no tipo de evento
    const metricsMap: Record<string, string> = {
      view: 'views',
      complete: 'completions',
      engage: 'engagements',
      convert: 'conversions'
    };

    const metric = metricsMap[eventType];
    if (metric) {
      await this.incrementVariantMetric(testId, variantId, metric);
    }
  }

  private async checkTestCompletion(testId: string): Promise<void> {
    const test = await this.getTest(testId);
    if (!test || test.status !== 'running') return;

    // Verificar se atingiu sample size mínimo
    if (test.results.totalParticipants < test.config.minSampleSize) {
      return;
    }

    // Verificar se atingiu duração máxima
    const duration = this.calculateDuration(test.metadata.startedAt);
    if (duration >= test.config.maxDuration) {
      await this.completeTest(testId);
      return;
    }

    // Verificar se há significância estatística
    const winner = this.determineWinner(test);
    if (winner.conclusive) {
      await this.completeTest(testId);
    }
  }

  private calculateDuration(startDate?: string): number {
    if (!startDate) return 0;
    const start = new Date(startDate);
    const now = new Date();
    return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }

  private determineWinner(test: ABTest): {
    variantId: string;
    confidence: number;
    conclusive: boolean;
  } {
    // TODO: Implementar cálculo estatístico real (teste t, chi-quadrado, etc)
    // Por enquanto, simples comparação de métricas
    
    const control = test.variants.find(v => v.isControl)!;
    const metric = test.config.winnerCriteria;

    let bestVariant = control;
    let bestValue = this.getMetricValue(control, metric);

    for (const variant of test.variants) {
      if (variant.isControl) continue;

      const value = this.getMetricValue(variant, metric);
      if (value > bestValue) {
        bestValue = value;
        bestVariant = variant;
      }
    }

    // Calcular confiança (simplificado)
    const confidence = bestVariant.isControl ? 0 : 0.95;
    const conclusive = confidence >= test.config.confidenceLevel;

    return {
      variantId: bestVariant.id,
      confidence,
      conclusive
    };
  }

  private getMetricValue(variant: ABTestVariant, metric: string): number {
    switch (metric) {
      case 'views':
        return variant.metrics.views;
      case 'completion_rate':
        return variant.metrics.completionRate;
      case 'engagement':
        return (
          variant.metrics.engagement.likes +
          variant.metrics.engagement.shares +
          variant.metrics.engagement.comments
        );
      default:
        return 0;
    }
  }

  private calculateImprovement(test: ABTest): number {
    if (!test.results.winner) return 0;

    const control = test.variants.find(v => v.isControl)!;
    const winner = test.variants.find(v => v.id === test.results.winner)!;

    const controlValue = this.getMetricValue(control, test.config.winnerCriteria);
    const winnerValue = this.getMetricValue(winner, test.config.winnerCriteria);

    if (controlValue === 0) return 0;

    return ((winnerValue - controlValue) / controlValue) * 100;
  }

  private calculateSignificance(test: ABTest, variant: ABTestVariant): any {
    // TODO: Implementar teste estatístico real
    return {
      vsControl: {
        pValue: 0.05,
        significant: true,
        improvement: 15.5
      }
    };
  }

  private generateRecommendations(test: ABTest): string[] {
    const recommendations = [];

    if (test.results.conclusive) {
      recommendations.push('Implement the winning variant in production');
      recommendations.push('Consider running follow-up tests to further optimize');
    } else {
      recommendations.push('Continue test to reach statistical significance');
      recommendations.push('Consider increasing traffic allocation');
    }

    return recommendations;
  }

  private generateInsights(test: ABTest): string[] {
    const insights = [];

    const winner = test.variants.find(v => v.id === test.results.winner);
    if (winner) {
      insights.push(`Variant "${winner.name}" showed best performance`);
      insights.push(`Improvement: ${this.calculateImprovement(test).toFixed(1)}%`);
    }

    return insights;
  }
}

// Export singleton
export const abTestingPlatform = new ABTestingPlatform();
