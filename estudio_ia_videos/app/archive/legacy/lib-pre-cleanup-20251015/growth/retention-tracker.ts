
/**
 * Sprint 41: Retention Tracker
 * Rastreamento de retenção D1/D7/D30 e métricas de engajamento
 */

export interface UserRetentionMetrics {
  userId: string;
  signupDate: Date;
  lastActiveDate: Date;
  d1Retention: boolean; // Voltou no dia 1
  d7Retention: boolean; // Voltou no dia 7
  d30Retention: boolean; // Voltou no dia 30
  totalSessions: number;
  averageSessionDuration: number;
  keyActionsCompleted: string[];
  cohort: string;
}

export interface RetentionCohortAnalysis {
  cohortName: string;
  cohortStartDate: Date;
  totalUsers: number;
  d1RetentionRate: number;
  d7RetentionRate: number;
  d30RetentionRate: number;
  churnRate: number;
  averageLifetimeValue: number;
}

export interface FeatureUsageMetrics {
  featureName: string;
  totalUses: number;
  uniqueUsers: number;
  averageUsesPerUser: number;
  retentionImpact: number; // Correlação com retenção
  conversionImpact: number; // Correlação com conversão
}

export class RetentionTracker {
  /**
   * Rastreia evento de retenção do usuário
   */
  static trackUserActivity(
    userId: string,
    eventType: 'signup' | 'login' | 'feature_use' | 'video_render' | 'upgrade',
    metadata?: Record<string, unknown>
  ): void {
    const event = {
      userId,
      eventType,
      timestamp: new Date(),
      metadata: metadata || {},
    };

    // Em produção, enviar para Amplitude/Mixpanel
    console.log('[RetentionTracker] Tracking event:', event);

    // Salvar no banco para análise
    // await prisma.userEvent.create({ data: event });
  }

  /**
   * Calcula métricas de retenção para um usuário
   */
  static calculateUserRetention(
    userId: string,
    signupDate: Date,
    activityDates: Date[]
  ): Pick<UserRetentionMetrics, 'd1Retention' | 'd7Retention' | 'd30Retention'> {
    const daysSinceSignup = (date: Date) =>
      Math.floor((date.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24));

    const d1Retention = activityDates.some((date) => {
      const days = daysSinceSignup(date);
      return days >= 1 && days <= 2;
    });

    const d7Retention = activityDates.some((date) => {
      const days = daysSinceSignup(date);
      return days >= 7 && days <= 9;
    });

    const d30Retention = activityDates.some((date) => {
      const days = daysSinceSignup(date);
      return days >= 30 && days <= 32;
    });

    return { d1Retention, d7Retention, d30Retention };
  }

  /**
   * Analisa retenção por cohort
   */
  static analyzeCohort(
    cohortUsers: UserRetentionMetrics[]
  ): RetentionCohortAnalysis {
    const totalUsers = cohortUsers.length;
    const d1Count = cohortUsers.filter((u) => u.d1Retention).length;
    const d7Count = cohortUsers.filter((u) => u.d7Retention).length;
    const d30Count = cohortUsers.filter((u) => u.d30Retention).length;

    return {
      cohortName: cohortUsers[0]?.cohort || 'Unknown',
      cohortStartDate: cohortUsers[0]?.signupDate || new Date(),
      totalUsers,
      d1RetentionRate: totalUsers > 0 ? (d1Count / totalUsers) * 100 : 0,
      d7RetentionRate: totalUsers > 0 ? (d7Count / totalUsers) * 100 : 0,
      d30RetentionRate: totalUsers > 0 ? (d30Count / totalUsers) * 100 : 0,
      churnRate:
        totalUsers > 0
          ? ((totalUsers - d30Count) / totalUsers) * 100
          : 0,
      averageLifetimeValue: 0, // Calcular com dados de receita
    };
  }

  /**
   * Identifica features com maior impacto na retenção
   */
  static analyzeFeatureUsage(
    users: UserRetentionMetrics[]
  ): FeatureUsageMetrics[] {
    const featureMap = new Map<string, FeatureUsageMetrics>();

    users.forEach((user) => {
      user.keyActionsCompleted.forEach((feature) => {
        if (!featureMap.has(feature)) {
          featureMap.set(feature, {
            featureName: feature,
            totalUses: 0,
            uniqueUsers: 0,
            averageUsesPerUser: 0,
            retentionImpact: 0,
            conversionImpact: 0,
          });
        }

        const metrics = featureMap.get(feature)!;
        metrics.totalUses += 1;
        metrics.uniqueUsers += 1;
      });
    });

    return Array.from(featureMap.values()).map((metrics) => ({
      ...metrics,
      averageUsesPerUser: metrics.totalUses / metrics.uniqueUsers,
    }));
  }

  /**
   * Identifica usuários em risco de churn
   */
  static identifyChurnRisk(
    user: UserRetentionMetrics
  ): { riskLevel: 'low' | 'medium' | 'high'; reasons: string[] } {
    const reasons: string[] = [];
    let riskScore = 0;

    // Inatividade recente
    const daysSinceLastActive = Math.floor(
      (Date.now() - user.lastActiveDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastActive > 7) {
      reasons.push('Inativo há mais de 7 dias');
      riskScore += 30;
    }

    if (daysSinceLastActive > 14) {
      reasons.push('Inativo há mais de 14 dias');
      riskScore += 20;
    }

    // Baixo engajamento
    if (user.totalSessions < 3) {
      reasons.push('Poucas sessões de uso');
      riskScore += 20;
    }

    if (user.averageSessionDuration < 300) {
      // < 5 minutos
      reasons.push('Sessões muito curtas');
      riskScore += 15;
    }

    // Pouco uso de features chave
    if (user.keyActionsCompleted.length < 2) {
      reasons.push('Poucas features utilizadas');
      riskScore += 15;
    }

    const riskLevel =
      riskScore >= 50 ? 'high' : riskScore >= 25 ? 'medium' : 'low';

    return { riskLevel, reasons };
  }

  /**
   * Gera gatilhos de upgrade baseados em uso
   */
  static generateUpgradeTriggers(
    user: UserRetentionMetrics,
    usageData: {
      videosRendered: number;
      storageUsed: number;
      ttsMinutes: number;
    }
  ): { shouldTrigger: boolean; reason: string; timing: string } {
    // Trigger 1: Limite de renderizações
    if (usageData.videosRendered >= 5) {
      return {
        shouldTrigger: true,
        reason: 'Você já renderizou 5 vídeos! Faça upgrade para renderizações ilimitadas.',
        timing: 'immediate',
      };
    }

    // Trigger 2: Alto engajamento
    if (user.totalSessions >= 10 && user.averageSessionDuration > 600) {
      return {
        shouldTrigger: true,
        reason: 'Você está adorando a plataforma! Desbloqueie recursos premium.',
        timing: 'next_login',
      };
    }

    // Trigger 3: Uso de storage
    if (usageData.storageUsed > 500) {
      // > 500MB
      return {
        shouldTrigger: true,
        reason: 'Seu storage está quase cheio. Faça upgrade para mais espaço.',
        timing: 'immediate',
      };
    }

    // Trigger 4: TTS intensivo
    if (usageData.ttsMinutes > 30) {
      return {
        shouldTrigger: true,
        reason: 'Você está usando muitas vozes premium. Upgrade para acesso ilimitado.',
        timing: 'next_session',
      };
    }

    return { shouldTrigger: false, reason: '', timing: '' };
  }
}
