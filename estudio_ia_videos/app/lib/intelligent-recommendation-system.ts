/**
 * Intelligent Recommendation System
 * Sistema inteligente de recomendações
 */

import { prisma } from '@/lib/prisma';

export interface RecommendationItem {
  id: string;
  type: 'template' | 'asset' | 'course' | 'feature';
  title: string;
  description?: string;
  relevanceScore: number;
  metadata?: Record<string, unknown>;
}

export class IntelligentRecommendationSystem {
  async getRecommendations(
    userId: string,
    context?: Record<string, unknown>,
    limit = 10
  ): Promise<RecommendationItem[]> {
    console.log(`[Recommendations] Getting for user ${userId}`);
    
    const recommendations: RecommendationItem[] = [];

    try {
      // 1. Recommend NR Templates (Cold Start / Popular)
      const templates = await prisma.nrTemplate.findMany({
        take: 5,
        orderBy: { updatedAt: 'desc' } // Simple heuristic: newest first
      });

      templates.forEach(t => {
        recommendations.push({
          id: t.id,
          type: 'template',
          title: t.title,
          description: t.description || `Template for ${t.nrNumber}`,
          relevanceScore: 0.8, // Static score for now
          metadata: { nrNumber: t.nrNumber, duration: t.durationSeconds }
        });
      });

      // 2. Recommend recent courses (if any)
      const courses = await prisma.course.findMany({
        take: 3,
        orderBy: { createdAt: 'desc' }
      });

      courses.forEach(c => {
        recommendations.push({
          id: c.id,
          type: 'course',
          title: c.title,
          description: c.description || '',
          relevanceScore: 0.7,
          metadata: { authorId: c.authorId }
        });
      });

    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }

    return recommendations.slice(0, limit);
  }
  
  async trackInteraction(
    userId: string,
    itemId: string,
    interactionType: 'view' | 'use' | 'like' | 'skip'
  ): Promise<void> {
    // Log interaction to analytics events for future training
    try {
      await prisma.analyticsEvent.create({
        data: {
          userId,
          eventType: 'recommendation_interaction',
          eventData: {
            itemId,
            interactionType,
            timestamp: new Date().toISOString()
          }
        }
      });
    } catch (error) {
      console.error('Error tracking interaction:', error);
    }
  }
}

export const recommendationSystem = new IntelligentRecommendationSystem();
