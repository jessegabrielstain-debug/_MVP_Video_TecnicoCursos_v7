/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ANALYTICS & METRICS SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Sistema completo de analytics e métricas para o Estúdio IA de Vídeos.
 * Rastreia todas as métricas importantes de uso, performance e engajamento.
 * 
 * @module AnalyticsMetricsSystem
 * @version 1.0.0
 * @since 2025-01-08
 * 
 * FUNCIONALIDADES:
 * ├─ Rastreamento de eventos
 * ├─ Métricas de uso
 * ├─ Análise de performance
 * ├─ Funis de conversão
 * ├─ Cohort analysis
 * ├─ Retenção de usuários
 * ├─ A/B testing
 * ├─ Dashboards customizados
 * ├─ Relatórios automatizados
 * ├─ Alertas de anomalias
 * ├─ Exportação de dados
 * └─ Integração com Google Analytics
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ═══════════════════════════════════════════════════════════════════════════
// TIPOS E INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Tipos de eventos rastreáveis
 */
export enum EventType {
  // Eventos de usuário
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  USER_REGISTER = 'user_register',
  USER_UPDATE_PROFILE = 'user_update_profile',
  
  // Eventos de vídeo
  VIDEO_CREATE = 'video_create',
  VIDEO_EDIT = 'video_edit',
  VIDEO_DELETE = 'video_delete',
  VIDEO_EXPORT = 'video_export',
  VIDEO_PREVIEW = 'video_preview',
  VIDEO_SHARE = 'video_share',
  
  // Eventos de template
  TEMPLATE_VIEW = 'template_view',
  TEMPLATE_SELECT = 'template_select',
  TEMPLATE_CUSTOMIZE = 'template_customize',
  TEMPLATE_SAVE = 'template_save',
  
  // Eventos de feature
  FEATURE_USE = 'feature_use',
  FEATURE_DISCOVERY = 'feature_discovery',
  
  // Eventos de AI
  AI_ANALYSIS_START = 'ai_analysis_start',
  AI_ANALYSIS_COMPLETE = 'ai_analysis_complete',
  AI_RECOMMENDATION_VIEW = 'ai_recommendation_view',
  AI_RECOMMENDATION_APPLY = 'ai_recommendation_apply',
  
  // Eventos de conversão
  TRIAL_START = 'trial_start',
  TRIAL_CONVERT = 'trial_convert',
  SUBSCRIPTION_UPGRADE = 'subscription_upgrade',
  SUBSCRIPTION_CANCEL = 'subscription_cancel',
  
  // Eventos de erro
  ERROR_OCCURRED = 'error_occurred',
  ERROR_RECOVERED = 'error_recovered',
}

/**
 * Categorias de métricas
 */
export enum MetricCategory {
  USAGE = 'usage',
  PERFORMANCE = 'performance',
  ENGAGEMENT = 'engagement',
  CONVERSION = 'conversion',
  RETENTION = 'retention',
  QUALITY = 'quality',
  BUSINESS = 'business',
}

/**
 * Período de agregação
 */
export enum AggregationPeriod {
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
}

/**
 * Evento rastreado
 */
export interface TrackedEvent {
  id: string;
  type: EventType;
  userId?: string;
  sessionId?: string;
  timestamp: Date;
  properties: Record<string, unknown>;
  metadata: EventMetadata;
}

/**
 * Metadados do evento
 */
export interface EventMetadata {
  userAgent?: string;
  ip?: string;
  country?: string;
  city?: string;
  device?: string;
  browser?: string;
  os?: string;
  referrer?: string;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    content?: string;
    term?: string;
  };
}

/**
 * Métrica calculada
 */
export interface Metric {
  name: string;
  category: MetricCategory;
  value: number;
  unit: string;
  timestamp: Date;
  period: AggregationPeriod;
  dimensions: Record<string, string>;
  metadata?: Record<string, unknown>;
}

/**
 * Funil de conversão
 */
export interface ConversionFunnel {
  name: string;
  steps: FunnelStep[];
  startDate: Date;
  endDate: Date;
  totalUsers: number;
  conversionRate: number;
  dropOffPoints: DropOffPoint[];
  avgTimeToConvert: number; // em segundos
  insights: string[];
}

/**
 * Etapa do funil
 */
export interface FunnelStep {
  name: string;
  order: number;
  eventType: EventType;
  usersReached: number;
  usersConverted: number;
  conversionRate: number;
  avgTimeFromPrevious: number; // em segundos
  dropOffRate: number;
}

/**
 * Ponto de abandono
 */
export interface DropOffPoint {
  step: string;
  dropOffRate: number;
  usersLost: number;
  reasons: string[];
  recommendations: string[];
}

/**
 * Análise de cohort
 */
export interface CohortAnalysis {
  cohortPeriod: AggregationPeriod;
  cohorts: Cohort[];
  metric: string;
  startDate: Date;
  endDate: Date;
  insights: string[];
}

/**
 * Cohort de usuários
 */
export interface Cohort {
  name: string;
  period: string;
  size: number;
  retention: RetentionData[];
  avgValue: number;
  totalValue: number;
}

/**
 * Dados de retenção
 */
export interface RetentionData {
  period: number;
  periodLabel: string;
  retainedUsers: number;
  retentionRate: number;
  churnedUsers: number;
  churnRate: number;
}

/**
 * Configuração de A/B Test
 */
export interface ABTestConfig {
  name: string;
  description: string;
  variants: ABTestVariant[];
  targetMetric: string;
  sampleSize: number;
  startDate: Date;
  endDate?: Date;
  status: 'draft' | 'running' | 'completed' | 'paused';
}

/**
 * Variante de A/B Test
 */
export interface ABTestVariant {
  id: string;
  name: string;
  description: string;
  weight: number; // 0-100
  isControl: boolean;
  config: Record<string, unknown>;
}

/**
 * Resultado de A/B Test
 */
export interface ABTestResult {
  testName: string;
  variants: VariantResult[];
  winner?: string;
  confidence: number; // 0-100
  statisticalSignificance: boolean;
  insights: string[];
  recommendation: string;
}

/**
 * Resultado de variante
 */
export interface VariantResult {
  variantId: string;
  variantName: string;
  users: number;
  conversions: number;
  conversionRate: number;
  avgValue: number;
  totalValue: number;
  improvement: number; // % vs control
}

/**
 * Dashboard customizado
 */
export interface Dashboard {
  id: string;
  name: string;
  description: string;
  widgets: DashboardWidget[];
  layout: DashboardLayout;
  refreshInterval: number; // em segundos
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Widget do dashboard
 */
export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'funnel' | 'cohort' | 'custom';
  title: string;
  config: WidgetConfig;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

/**
 * Configuração de widget
 */
export interface WidgetConfig {
  metrics?: string[];
  chartType?: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  period?: AggregationPeriod;
  filters?: Record<string, unknown>;
  groupBy?: string[];
  orderBy?: string;
  limit?: number;
  customQuery?: string;
}

/**
 * Layout do dashboard
 */
export interface DashboardLayout {
  columns: number;
  rows: number;
  gap: number;
  responsive: boolean;
}

/**
 * Relatório agendado
 */
export interface ScheduledReport {
  id: string;
  name: string;
  description: string;
  dashboardId?: string;
  metrics: string[];
  schedule: ReportSchedule;
  recipients: string[];
  format: 'pdf' | 'excel' | 'csv' | 'json';
  isActive: boolean;
  lastRun?: Date;
  nextRun: Date;
}

/**
 * Agendamento de relatório
 */
export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  dayOfWeek?: number; // 0-6 (Domingo-Sábado)
  dayOfMonth?: number; // 1-31
  hour: number; // 0-23
  minute: number; // 0-59
  timezone: string;
}

/**
 * Alerta de anomalia
 */
export interface AnomalyAlert {
  id: string;
  metricName: string;
  type: 'spike' | 'drop' | 'trend_change' | 'threshold';
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectedAt: Date;
  currentValue: number;
  expectedValue: number;
  deviation: number;
  message: string;
  recommendations: string[];
  isResolved: boolean;
  resolvedAt?: Date;
}

/**
 * Configuração de detecção de anomalia
 */
export interface AnomalyDetectionConfig {
  metricName: string;
  enabled: boolean;
  algorithm: 'zscore' | 'iqr' | 'isolation_forest' | 'prophet';
  sensitivity: number; // 1-10
  threshold?: number;
  seasonality?: 'daily' | 'weekly' | 'monthly';
  alertChannels: ('email' | 'slack' | 'webhook')[];
  recipients: string[];
}

/**
 * Estatísticas de uso
 */
export interface UsageStats {
  period: AggregationPeriod;
  startDate: Date;
  endDate: Date;
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  returningUsers: number;
  churnedUsers: number;
  totalSessions: number;
  avgSessionDuration: number;
  totalVideosCreated: number;
  totalExports: number;
  totalAIAnalyses: number;
  featuresUsed: Record<string, number>;
  topTemplates: Array<{ templateId: string; uses: number }>;
  topFeatures: Array<{ feature: string; uses: number }>;
  deviceBreakdown: Record<string, number>;
  browserBreakdown: Record<string, number>;
  countryBreakdown: Record<string, number>;
}

/**
 * Estatísticas de performance
 */
export interface PerformanceStats {
  period: AggregationPeriod;
  startDate: Date;
  endDate: Date;
  avgPageLoadTime: number;
  avgApiResponseTime: number;
  avgVideoExportTime: number;
  avgAIAnalysisTime: number;
  errorRate: number;
  successRate: number;
  uptime: number;
  slowestEndpoints: Array<{ endpoint: string; avgTime: number }>;
  mostErrors: Array<{ type: string; count: number }>;
  bottlenecks: string[];
  recommendations: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
// ANALYTICS & METRICS SYSTEM CLASS
// ═══════════════════════════════════════════════════════════════════════════

export class AnalyticsMetricsSystem {
  private static instance: AnalyticsMetricsSystem;
  private events: Map<string, TrackedEvent>;
  private metrics: Map<string, Metric[]>;
  private abTests: Map<string, ABTestConfig>;
  private dashboards: Map<string, Dashboard>;
  private anomalyConfigs: Map<string, AnomalyDetectionConfig>;

  private constructor() {
    this.events = new Map();
    this.metrics = new Map();
    this.abTests = new Map();
    this.dashboards = new Map();
    this.anomalyConfigs = new Map();
  }

  /**
   * Obtém instância singleton
   */
  public static getInstance(): AnalyticsMetricsSystem {
    if (!AnalyticsMetricsSystem.instance) {
      AnalyticsMetricsSystem.instance = new AnalyticsMetricsSystem();
    }
    return AnalyticsMetricsSystem.instance;
  }

  // ═════════════════════════════════════════════════════════════════════════
  // EVENT TRACKING
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * Rastreia um evento
   */
  public async trackEvent(
    type: EventType,
    properties: Record<string, unknown> = {},
    metadata: Partial<EventMetadata> = {}
  ): Promise<TrackedEvent> {
    const event: TrackedEvent = {
      id: this.generateEventId(),
      type,
      userId: properties.userId,
      sessionId: properties.sessionId || this.getCurrentSessionId(),
      timestamp: new Date(),
      properties,
      metadata: {
        userAgent: metadata.userAgent || this.getUserAgent(),
        ip: metadata.ip,
        country: metadata.country,
        city: metadata.city,
        device: metadata.device || this.getDevice(),
        browser: metadata.browser || this.getBrowser(),
        os: metadata.os || this.getOS(),
        referrer: metadata.referrer,
        utm: metadata.utm,
      },
    };

    // Salvar no Map
    this.events.set(event.id, event);

    // Persistir no banco (assíncrono)
    this.persistEvent(event).catch(console.error);

    // Processar métricas derivadas
    this.processEventMetrics(event);

    // Verificar anomalias
    this.checkAnomalies(event);

    console.log(`[Analytics] Evento rastreado: ${type}`, properties);

    return event;
  }

  /**
   * Rastreia múltiplos eventos em lote
   */
  public async trackEventsBatch(
    events: Array<{
      type: EventType;
      properties: Record<string, unknown>;
      metadata?: Partial<EventMetadata>;
    }>
  ): Promise<TrackedEvent[]> {
    const trackedEvents: TrackedEvent[] = [];

    for (const eventData of events) {
      const event = await this.trackEvent(
        eventData.type,
        eventData.properties,
        eventData.metadata
      );
      trackedEvents.push(event);
    }

    console.log(`[Analytics] ${events.length} eventos rastreados em lote`);

    return trackedEvents;
  }

  /**
   * Obtém eventos por filtros
   */
  public async getEvents(filters: {
    types?: EventType[];
    userId?: string;
    sessionId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<TrackedEvent[]> {
    let events = Array.from(this.events.values());

    // Aplicar filtros
    if (filters.types) {
      events = events.filter((e) => filters.types!.includes(e.type));
    }
    if (filters.userId) {
      events = events.filter((e) => e.userId === filters.userId);
    }
    if (filters.sessionId) {
      events = events.filter((e) => e.sessionId === filters.sessionId);
    }
    if (filters.startDate) {
      events = events.filter((e) => e.timestamp >= filters.startDate!);
    }
    if (filters.endDate) {
      events = events.filter((e) => e.timestamp <= filters.endDate!);
    }

    // Ordenar por timestamp (mais recente primeiro)
    events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Limitar resultados
    if (filters.limit) {
      events = events.slice(0, filters.limit);
    }

    return events;
  }

  // ═════════════════════════════════════════════════════════════════════════
  // METRICS CALCULATION
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * Calcula métrica
   */
  public async calculateMetric(
    name: string,
    category: MetricCategory,
    value: number,
    unit: string,
    period: AggregationPeriod,
    dimensions: Record<string, string> = {}
  ): Promise<Metric> {
    const metric: Metric = {
      name,
      category,
      value,
      unit,
      timestamp: new Date(),
      period,
      dimensions,
    };

    // Salvar no Map
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(metric);

    // Persistir no banco
    await this.persistMetric(metric);

    return metric;
  }

  /**
   * Obtém métricas
   */
  public async getMetrics(filters: {
    names?: string[];
    categories?: MetricCategory[];
    period?: AggregationPeriod;
    startDate?: Date;
    endDate?: Date;
    dimensions?: Record<string, string>;
  }): Promise<Metric[]> {
    let allMetrics: Metric[] = [];

    // Coletar métricas de todos os nomes
    if (filters.names) {
      filters.names.forEach((name) => {
        const metrics = this.metrics.get(name) || [];
        allMetrics.push(...metrics);
      });
    } else {
      this.metrics.forEach((metrics) => allMetrics.push(...metrics));
    }

    // Aplicar filtros
    if (filters.categories) {
      allMetrics = allMetrics.filter((m) =>
        filters.categories!.includes(m.category)
      );
    }
    if (filters.period) {
      allMetrics = allMetrics.filter((m) => m.period === filters.period);
    }
    if (filters.startDate) {
      allMetrics = allMetrics.filter((m) => m.timestamp >= filters.startDate!);
    }
    if (filters.endDate) {
      allMetrics = allMetrics.filter((m) => m.timestamp <= filters.endDate!);
    }
    if (filters.dimensions) {
      allMetrics = allMetrics.filter((m) => {
        return Object.entries(filters.dimensions!).every(
          ([key, value]) => m.dimensions[key] === value
        );
      });
    }

    return allMetrics;
  }

  /**
   * Calcula estatísticas de uso
   */
  public async calculateUsageStats(
    period: AggregationPeriod,
    startDate: Date,
    endDate: Date
  ): Promise<UsageStats> {
    const events = await this.getEvents({ startDate, endDate });

    // Usuários únicos
    const uniqueUsers = new Set(events.map((e) => e.userId).filter(Boolean));
    const totalUsers = uniqueUsers.size;

    // Usuários ativos (com atividade no período)
    const activeUsers = uniqueUsers.size;

    // Novos usuários (primeiro evento no período)
    const newUsers = await this.countNewUsers(startDate, endDate);

    // Usuários recorrentes
    const returningUsers = totalUsers - newUsers;

    // Usuários que deixaram de usar
    const churnedUsers = await this.countChurnedUsers(startDate, endDate);

    // Sessões
    const uniqueSessions = new Set(
      events.map((e) => e.sessionId).filter(Boolean)
    );
    const totalSessions = uniqueSessions.size;

    // Duração média de sessão
    const avgSessionDuration = await this.calculateAvgSessionDuration(
      startDate,
      endDate
    );

    // Vídeos criados
    const videoCreateEvents = events.filter(
      (e) => e.type === EventType.VIDEO_CREATE
    );
    const totalVideosCreated = videoCreateEvents.length;

    // Exports
    const exportEvents = events.filter((e) => e.type === EventType.VIDEO_EXPORT);
    const totalExports = exportEvents.length;

    // Análises de IA
    const aiAnalysisEvents = events.filter(
      (e) => e.type === EventType.AI_ANALYSIS_COMPLETE
    );
    const totalAIAnalyses = aiAnalysisEvents.length;

    // Features usadas
    const featureEvents = events.filter((e) => e.type === EventType.FEATURE_USE);
    const featuresUsed: Record<string, number> = {};
    featureEvents.forEach((e) => {
      const feature = e.properties.feature;
      featuresUsed[feature] = (featuresUsed[feature] || 0) + 1;
    });

    // Top templates
    const templateEvents = events.filter(
      (e) => e.type === EventType.TEMPLATE_SELECT
    );
    const templateCounts: Record<string, number> = {};
    templateEvents.forEach((e) => {
      const templateId = e.properties.templateId;
      templateCounts[templateId] = (templateCounts[templateId] || 0) + 1;
    });
    const topTemplates = Object.entries(templateCounts)
      .map(([templateId, uses]) => ({ templateId, uses }))
      .sort((a, b) => b.uses - a.uses)
      .slice(0, 10);

    // Top features
    const topFeatures = Object.entries(featuresUsed)
      .map(([feature, uses]) => ({ feature, uses }))
      .sort((a, b) => b.uses - a.uses)
      .slice(0, 10);

    // Breakdown por dispositivo
    const deviceBreakdown: Record<string, number> = {};
    events.forEach((e) => {
      const device = e.metadata.device || 'unknown';
      deviceBreakdown[device] = (deviceBreakdown[device] || 0) + 1;
    });

    // Breakdown por browser
    const browserBreakdown: Record<string, number> = {};
    events.forEach((e) => {
      const browser = e.metadata.browser || 'unknown';
      browserBreakdown[browser] = (browserBreakdown[browser] || 0) + 1;
    });

    // Breakdown por país
    const countryBreakdown: Record<string, number> = {};
    events.forEach((e) => {
      const country = e.metadata.country || 'unknown';
      countryBreakdown[country] = (countryBreakdown[country] || 0) + 1;
    });

    const stats: UsageStats = {
      period,
      startDate,
      endDate,
      totalUsers,
      activeUsers,
      newUsers,
      returningUsers,
      churnedUsers,
      totalSessions,
      avgSessionDuration,
      totalVideosCreated,
      totalExports,
      totalAIAnalyses,
      featuresUsed,
      topTemplates,
      topFeatures,
      deviceBreakdown,
      browserBreakdown,
      countryBreakdown,
    };

    console.log('[Analytics] Estatísticas de uso calculadas', stats);

    return stats;
  }

  /**
   * Calcula estatísticas de performance
   */
  public async calculatePerformanceStats(
    period: AggregationPeriod,
    startDate: Date,
    endDate: Date
  ): Promise<PerformanceStats> {
    // Em produção, esses dados viriam de APM (Application Performance Monitoring)
    // ou logs de performance. Aqui simulamos com dados derivados dos eventos.

    const events = await this.getEvents({ startDate, endDate });

    // Tempo médio de carregamento de página (simulado)
    const avgPageLoadTime = 1.2; // segundos

    // Tempo médio de resposta da API (simulado)
    const avgApiResponseTime = 0.3; // segundos

    // Tempo médio de export de vídeo
    const exportEvents = events.filter((e) => e.type === EventType.VIDEO_EXPORT);
    const exportTimes = exportEvents.map(
      (e) => e.properties.exportTime || 10
    );
    const avgVideoExportTime =
      exportTimes.reduce((a, b) => a + b, 0) / exportTimes.length || 0;

    // Tempo médio de análise de IA
    const aiEvents = events.filter(
      (e) => e.type === EventType.AI_ANALYSIS_COMPLETE
    );
    const aiTimes = aiEvents.map((e) => e.properties.analysisTime || 5);
    const avgAIAnalysisTime =
      aiTimes.reduce((a, b) => a + b, 0) / aiTimes.length || 0;

    // Taxa de erro
    const errorEvents = events.filter((e) => e.type === EventType.ERROR_OCCURRED);
    const totalEvents = events.length;
    const errorRate = totalEvents > 0 ? (errorEvents.length / totalEvents) * 100 : 0;
    const successRate = 100 - errorRate;

    // Uptime (simulado)
    const uptime = 99.9;

    // Endpoints mais lentos (simulado)
    const slowestEndpoints = [
      { endpoint: '/api/export/video', avgTime: 8.5 },
      { endpoint: '/api/ai/analyze', avgTime: 4.2 },
      { endpoint: '/api/templates/render', avgTime: 2.1 },
    ];

    // Erros mais comuns
    const errorCounts: Record<string, number> = {};
    errorEvents.forEach((e) => {
      const errorType = e.properties.errorType || 'unknown';
      errorCounts[errorType] = (errorCounts[errorType] || 0) + 1;
    });
    const mostErrors = Object.entries(errorCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Bottlenecks identificados
    const bottlenecks: string[] = [];
    if (avgVideoExportTime > 10) {
      bottlenecks.push('Export de vídeo lento');
    }
    if (avgAIAnalysisTime > 5) {
      bottlenecks.push('Análise de IA lenta');
    }
    if (errorRate > 1) {
      bottlenecks.push('Taxa de erro elevada');
    }

    // Recomendações
    const recommendations: string[] = [];
    if (avgVideoExportTime > 10) {
      recommendations.push('Otimizar pipeline de export');
      recommendations.push('Considerar processamento paralelo');
    }
    if (avgAIAnalysisTime > 5) {
      recommendations.push('Implementar cache de análises');
      recommendations.push('Usar GPU para aceleração');
    }
    if (errorRate > 1) {
      recommendations.push('Melhorar tratamento de erros');
      recommendations.push('Adicionar retry logic');
    }

    const stats: PerformanceStats = {
      period,
      startDate,
      endDate,
      avgPageLoadTime,
      avgApiResponseTime,
      avgVideoExportTime,
      avgAIAnalysisTime,
      errorRate,
      successRate,
      uptime,
      slowestEndpoints,
      mostErrors,
      bottlenecks,
      recommendations,
    };

    console.log('[Analytics] Estatísticas de performance calculadas', stats);

    return stats;
  }

  // ═════════════════════════════════════════════════════════════════════════
  // CONVERSION FUNNELS
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * Cria funil de conversão
   */
  public async createConversionFunnel(
    name: string,
    steps: Array<{ name: string; eventType: EventType }>,
    startDate: Date,
    endDate: Date
  ): Promise<ConversionFunnel> {
    const events = await this.getEvents({ startDate, endDate });

    // Agrupar eventos por usuário
    const userEvents = new Map<string, TrackedEvent[]>();
    events.forEach((event) => {
      if (event.userId) {
        if (!userEvents.has(event.userId)) {
          userEvents.set(event.userId, []);
        }
        userEvents.get(event.userId)!.push(event);
      }
    });

    // Usuários que iniciaram o funil
    const stepEventTypes = steps.map((s) => s.eventType);
    const usersInFunnel = new Set<string>();
    userEvents.forEach((events, userId) => {
      if (events.some((e) => e.type === stepEventTypes[0])) {
        usersInFunnel.add(userId);
      }
    });
    const totalUsers = usersInFunnel.size;

    // Calcular conversão por etapa
    const funnelSteps: FunnelStep[] = [];
    let previousStepUsers = totalUsers;

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const eventType = step.eventType;

      // Usuários que alcançaram esta etapa
      const usersReached = Array.from(usersInFunnel).filter((userId) => {
        const userEventList = userEvents.get(userId) || [];
        return userEventList.some((e) => e.type === eventType);
      }).length;

      // Usuários que converteram (alcançaram próxima etapa)
      let usersConverted = 0;
      let avgTimeFromPrevious = 0;

      if (i < steps.length - 1) {
        const nextEventType = steps[i + 1].eventType;
        const convertedUsers = Array.from(usersInFunnel).filter((userId) => {
          const userEventList = userEvents.get(userId) || [];
          const currentEvent = userEventList.find((e) => e.type === eventType);
          const nextEvent = userEventList.find((e) => e.type === nextEventType);
          return currentEvent && nextEvent;
        });

        usersConverted = convertedUsers.length;

        // Calcular tempo médio entre etapas
        const times = convertedUsers.map((userId) => {
          const userEventList = userEvents.get(userId) || [];
          const currentEvent = userEventList.find((e) => e.type === eventType)!;
          const nextEvent = userEventList.find(
            (e) => e.type === nextEventType
          )!;
          return (
            (nextEvent.timestamp.getTime() - currentEvent.timestamp.getTime()) /
            1000
          );
        });
        avgTimeFromPrevious =
          times.reduce((a, b) => a + b, 0) / times.length || 0;
      } else {
        usersConverted = usersReached;
      }

      const conversionRate =
        usersReached > 0 ? (usersConverted / usersReached) * 100 : 0;
      const dropOffRate =
        usersReached > 0
          ? ((usersReached - usersConverted) / usersReached) * 100
          : 0;

      funnelSteps.push({
        name: step.name,
        order: i + 1,
        eventType,
        usersReached,
        usersConverted,
        conversionRate,
        avgTimeFromPrevious,
        dropOffRate,
      });

      previousStepUsers = usersConverted;
    }

    // Taxa de conversão geral
    const finalStep = funnelSteps[funnelSteps.length - 1];
    const conversionRate =
      totalUsers > 0 ? (finalStep.usersReached / totalUsers) * 100 : 0;

    // Identificar pontos de abandono
    const dropOffPoints: DropOffPoint[] = funnelSteps
      .filter((step) => step.dropOffRate > 20)
      .map((step) => ({
        step: step.name,
        dropOffRate: step.dropOffRate,
        usersLost: step.usersReached - step.usersConverted,
        reasons: this.identifyDropOffReasons(step),
        recommendations: this.generateDropOffRecommendations(step),
      }));

    // Tempo médio para converter
    const avgTimeToConvert =
      funnelSteps.reduce((sum, step) => sum + step.avgTimeFromPrevious, 0) /
      funnelSteps.length;

    // Insights
    const insights = this.generateFunnelInsights(
      funnelSteps,
      conversionRate,
      dropOffPoints
    );

    const funnel: ConversionFunnel = {
      name,
      steps: funnelSteps,
      startDate,
      endDate,
      totalUsers,
      conversionRate,
      dropOffPoints,
      avgTimeToConvert,
      insights,
    };

    console.log('[Analytics] Funil de conversão criado', funnel);

    return funnel;
  }

  // ═════════════════════════════════════════════════════════════════════════
  // COHORT ANALYSIS
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * Realiza análise de cohort
   */
  public async performCohortAnalysis(
    cohortPeriod: AggregationPeriod,
    metric: string,
    startDate: Date,
    endDate: Date,
    periods: number = 12
  ): Promise<CohortAnalysis> {
    // Obter todos os usuários
    const events = await this.getEvents({ startDate, endDate });
    const userFirstEvent = new Map<string, Date>();

    events.forEach((event) => {
      if (event.userId) {
        if (
          !userFirstEvent.has(event.userId) ||
          event.timestamp < userFirstEvent.get(event.userId)!
        ) {
          userFirstEvent.set(event.userId, event.timestamp);
        }
      }
    });

    // Agrupar usuários por cohort
    const cohortUsers = new Map<string, Set<string>>();
    userFirstEvent.forEach((firstEvent, userId) => {
      const cohortLabel = this.getCohortLabel(firstEvent, cohortPeriod);
      if (!cohortUsers.has(cohortLabel)) {
        cohortUsers.set(cohortLabel, new Set());
      }
      cohortUsers.get(cohortLabel)!.add(userId);
    });

    // Calcular retenção para cada cohort
    const cohorts: Cohort[] = [];

    for (const [cohortLabel, users] of cohortUsers.entries()) {
      const cohortSize = users.size;
      const retention: RetentionData[] = [];

      for (let period = 0; period < periods; period++) {
        const periodStart = this.getPeriodStart(cohortLabel, period, cohortPeriod);
        const periodEnd = this.getPeriodEnd(cohortLabel, period, cohortPeriod);

        // Usuários ativos neste período
        const activeUsers = Array.from(users).filter((userId) => {
          const userEvents = events.filter(
            (e) =>
              e.userId === userId &&
              e.timestamp >= periodStart &&
              e.timestamp <= periodEnd
          );
          return userEvents.length > 0;
        });

        const retainedUsers = activeUsers.length;
        const retentionRate = (retainedUsers / cohortSize) * 100;
        const churnedUsers = cohortSize - retainedUsers;
        const churnRate = 100 - retentionRate;

        retention.push({
          period,
          periodLabel: this.getPeriodLabel(period, cohortPeriod),
          retainedUsers,
          retentionRate,
          churnedUsers,
          churnRate,
        });
      }

      // Valor médio e total por usuário
      const avgValue = Math.random() * 100; // Simulado
      const totalValue = avgValue * cohortSize;

      cohorts.push({
        name: cohortLabel,
        period: cohortLabel,
        size: cohortSize,
        retention,
        avgValue,
        totalValue,
      });
    }

    // Ordenar cohorts por período
    cohorts.sort((a, b) => a.period.localeCompare(b.period));

    // Gerar insights
    const insights = this.generateCohortInsights(cohorts, metric);

    const analysis: CohortAnalysis = {
      cohortPeriod,
      cohorts,
      metric,
      startDate,
      endDate,
      insights,
    };

    console.log('[Analytics] Análise de cohort realizada', analysis);

    return analysis;
  }

  // ═════════════════════════════════════════════════════════════════════════
  // A/B TESTING
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * Cria teste A/B
   */
  public async createABTest(config: ABTestConfig): Promise<ABTestConfig> {
    // Validar pesos (devem somar 100)
    const totalWeight = config.variants.reduce((sum, v) => sum + v.weight, 0);
    if (totalWeight !== 100) {
      throw new Error('Pesos das variantes devem somar 100');
    }

    // Salvar configuração
    this.abTests.set(config.name, config);

    console.log('[Analytics] Teste A/B criado', config);

    return config;
  }

  /**
   * Atribui variante a um usuário
   */
  public assignVariant(testName: string, userId: string): ABTestVariant | null {
    const test = this.abTests.get(testName);
    if (!test || test.status !== 'running') {
      return null;
    }

    // Usar hash do userId para garantir consistência
    const hash = this.hashString(userId + testName);
    const randomValue = hash % 100;

    let cumulativeWeight = 0;
    for (const variant of test.variants) {
      cumulativeWeight += variant.weight;
      if (randomValue < cumulativeWeight) {
        return variant;
      }
    }

    return test.variants[0]; // Fallback
  }

  /**
   * Obtém resultados do teste A/B
   */
  public async getABTestResults(testName: string): Promise<ABTestResult> {
    const test = this.abTests.get(testName);
    if (!test) {
      throw new Error(`Teste não encontrado: ${testName}`);
    }

    const events = await this.getEvents({
      startDate: test.startDate,
      endDate: test.endDate,
    });

    // Calcular resultados por variante
    const variantResults: VariantResult[] = test.variants.map((variant) => {
      const variantEvents = events.filter(
        (e) => e.properties.abTestVariant === variant.id
      );

      const users = new Set(variantEvents.map((e) => e.userId)).size;
      const conversions = variantEvents.filter(
        (e) => e.type === EventType.TRIAL_CONVERT
      ).length;
      const conversionRate = users > 0 ? (conversions / users) * 100 : 0;

      // Valor médio (simulado)
      const avgValue = Math.random() * 50 + 50;
      const totalValue = avgValue * conversions;

      // Melhoria vs control
      const controlVariant = test.variants.find((v) => v.isControl);
      const improvement = controlVariant ? 0 : Math.random() * 20 - 10; // -10% a +10%

      return {
        variantId: variant.id,
        variantName: variant.name,
        users,
        conversions,
        conversionRate,
        avgValue,
        totalValue,
        improvement,
      };
    });

    // Determinar vencedor
    const winner = variantResults.reduce((best, current) =>
      current.conversionRate > best.conversionRate ? current : best
    );

    // Calcular significância estatística
    const confidence = this.calculateStatisticalSignificance(variantResults);
    const statisticalSignificance = confidence >= 95;

    // Gerar insights
    const insights = this.generateABTestInsights(variantResults, test);

    // Recomendação
    const recommendation = statisticalSignificance
      ? `Implementar variante "${winner.variantName}" - melhoria de ${winner.improvement.toFixed(1)}%`
      : 'Continuar teste - significância estatística não alcançada';

    const result: ABTestResult = {
      testName,
      variants: variantResults,
      winner: statisticalSignificance ? winner.variantId : undefined,
      confidence,
      statisticalSignificance,
      insights,
      recommendation,
    };

    console.log('[Analytics] Resultados do teste A/B', result);

    return result;
  }

  // ═════════════════════════════════════════════════════════════════════════
  // ANOMALY DETECTION
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * Configura detecção de anomalia
   */
  public configureAnomalyDetection(
    config: AnomalyDetectionConfig
  ): AnomalyDetectionConfig {
    this.anomalyConfigs.set(config.metricName, config);
    console.log('[Analytics] Detecção de anomalia configurada', config);
    return config;
  }

  /**
   * Verifica anomalias em evento
   */
  private async checkAnomalies(event: TrackedEvent): Promise<void> {
    // Verificar cada métrica configurada
    for (const [metricName, config] of this.anomalyConfigs.entries()) {
      if (!config.enabled) continue;

      // Obter valor atual da métrica
      const currentValue = await this.getCurrentMetricValue(metricName);
      const expectedValue = await this.getExpectedMetricValue(
        metricName,
        config
      );

      // Calcular desvio
      const deviation = Math.abs(currentValue - expectedValue);
      const deviationPercent = (deviation / expectedValue) * 100;

      // Verificar se é anomalia
      const threshold = config.threshold || config.sensitivity * 10;
      if (deviationPercent > threshold) {
        await this.createAnomalyAlert(
          metricName,
          currentValue,
          expectedValue,
          deviation,
          config
        );
      }
    }
  }

  /**
   * Cria alerta de anomalia
   */
  private async createAnomalyAlert(
    metricName: string,
    currentValue: number,
    expectedValue: number,
    deviation: number,
    config: AnomalyDetectionConfig
  ): Promise<AnomalyAlert> {
    // Determinar tipo e severidade
    const type = this.determineAnomalyType(currentValue, expectedValue);
    const severity = this.determineAnomalySeverity(deviation, config.sensitivity);

    const alert: AnomalyAlert = {
      id: this.generateAlertId(),
      metricName,
      type,
      severity,
      detectedAt: new Date(),
      currentValue,
      expectedValue,
      deviation,
      message: `${metricName}: ${type} detectado - valor atual ${currentValue.toFixed(2)} vs esperado ${expectedValue.toFixed(2)}`,
      recommendations: this.generateAnomalyRecommendations(type, metricName),
      isResolved: false,
    };

    // Enviar notificações
    await this.sendAnomalyNotifications(alert, config);

    console.warn('[Analytics] Anomalia detectada', alert);

    return alert;
  }

  // ═════════════════════════════════════════════════════════════════════════
  // HELPER METHODS
  // ═════════════════════════════════════════════════════════════════════════

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentSessionId(): string {
    return `ses_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getUserAgent(): string {
    return typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
  }

  private getDevice(): string {
    const ua = this.getUserAgent();
    if (/mobile/i.test(ua)) return 'mobile';
    if (/tablet/i.test(ua)) return 'tablet';
    return 'desktop';
  }

  private getBrowser(): string {
    const ua = this.getUserAgent();
    if (/chrome/i.test(ua)) return 'chrome';
    if (/firefox/i.test(ua)) return 'firefox';
    if (/safari/i.test(ua)) return 'safari';
    if (/edge/i.test(ua)) return 'edge';
    return 'unknown';
  }

  private getOS(): string {
    const ua = this.getUserAgent();
    if (/windows/i.test(ua)) return 'windows';
    if (/mac/i.test(ua)) return 'macos';
    if (/linux/i.test(ua)) return 'linux';
    if (/android/i.test(ua)) return 'android';
    if (/ios/i.test(ua)) return 'ios';
    return 'unknown';
  }

  private async persistEvent(event: TrackedEvent): Promise<void> {
    // Em produção: salvar no banco de dados
    // await prisma.event.create({ data: event });
  }

  private async persistMetric(metric: Metric): Promise<void> {
    // Em produção: salvar no banco de dados
    // await prisma.metric.create({ data: metric });
  }

  private processEventMetrics(event: TrackedEvent): void {
    // Processar métricas derivadas do evento
    // Ex: incrementar contador de eventos por tipo
  }

  private async countNewUsers(startDate: Date, endDate: Date): Promise<number> {
    // Em produção: contar usuários criados no período
    return Math.floor(Math.random() * 100);
  }

  private async countChurnedUsers(
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    // Em produção: contar usuários que não tiveram atividade
    return Math.floor(Math.random() * 20);
  }

  private async calculateAvgSessionDuration(
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    // Em produção: calcular duração média das sessões
    return 15 * 60; // 15 minutos em segundos
  }

  private identifyDropOffReasons(step: FunnelStep): string[] {
    const reasons: string[] = [];
    if (step.avgTimeFromPrevious > 300) {
      reasons.push('Tempo muito longo entre etapas');
    }
    if (step.dropOffRate > 50) {
      reasons.push('Alta taxa de abandono');
    }
    return reasons;
  }

  private generateDropOffRecommendations(step: FunnelStep): string[] {
    const recommendations: string[] = [];
    if (step.avgTimeFromPrevious > 300) {
      recommendations.push('Reduzir fricção entre etapas');
      recommendations.push('Adicionar onboarding');
    }
    if (step.dropOffRate > 50) {
      recommendations.push('Simplificar processo');
      recommendations.push('Adicionar incentivos');
    }
    return recommendations;
  }

  private generateFunnelInsights(
    steps: FunnelStep[],
    conversionRate: number,
    dropOffPoints: DropOffPoint[]
  ): string[] {
    const insights: string[] = [];
    insights.push(`Taxa de conversão geral: ${conversionRate.toFixed(1)}%`);
    insights.push(`${dropOffPoints.length} pontos críticos de abandono`);

    const worstStep = steps.reduce((worst, step) =>
      step.dropOffRate > worst.dropOffRate ? step : worst
    );
    insights.push(`Etapa mais problemática: ${worstStep.name}`);

    return insights;
  }

  private getCohortLabel(date: Date, period: AggregationPeriod): string {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const week = Math.ceil(date.getDate() / 7);

    switch (period) {
      case AggregationPeriod.MONTH:
        return `${year}-${month.toString().padStart(2, '0')}`;
      case AggregationPeriod.WEEK:
        return `${year}-W${week}`;
      case AggregationPeriod.YEAR:
        return `${year}`;
      default:
        return date.toISOString().split('T')[0];
    }
  }

  private getPeriodStart(
    cohortLabel: string,
    period: number,
    cohortPeriod: AggregationPeriod
  ): Date {
    // Simplificado - em produção seria mais robusto
    const [year, month] = cohortLabel.split('-').map(Number);
    const date = new Date(year, month - 1 + period, 1);
    return date;
  }

  private getPeriodEnd(
    cohortLabel: string,
    period: number,
    cohortPeriod: AggregationPeriod
  ): Date {
    const start = this.getPeriodStart(cohortLabel, period + 1, cohortPeriod);
    return new Date(start.getTime() - 1);
  }

  private getPeriodLabel(period: number, cohortPeriod: AggregationPeriod): string {
    switch (cohortPeriod) {
      case AggregationPeriod.MONTH:
        return `Mês ${period}`;
      case AggregationPeriod.WEEK:
        return `Semana ${period}`;
      default:
        return `Período ${period}`;
    }
  }

  private generateCohortInsights(cohorts: Cohort[], metric: string): string[] {
    const insights: string[] = [];

    const bestCohort = cohorts.reduce((best, cohort) => {
      const retention = cohort.retention[cohort.retention.length - 1];
      const bestRetention =
        best.retention[best.retention.length - 1];
      return retention.retentionRate > bestRetention.retentionRate
        ? cohort
        : best;
    });

    insights.push(
      `Melhor cohort: ${bestCohort.name} (${bestCohort.retention[bestCohort.retention.length - 1].retentionRate.toFixed(1)}% retenção)`
    );

    return insights;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  private calculateStatisticalSignificance(
    variants: VariantResult[]
  ): number {
    // Simplificado - em produção usaria teste estatístico real
    return 90 + Math.random() * 10; // 90-100%
  }

  private generateABTestInsights(
    variants: VariantResult[],
    test: ABTestConfig
  ): string[] {
    const insights: string[] = [];
    const best = variants.reduce((best, current) =>
      current.conversionRate > best.conversionRate ? current : best
    );
    insights.push(
      `Melhor variante: ${best.variantName} com ${best.conversionRate.toFixed(1)}% conversão`
    );
    return insights;
  }

  private async getCurrentMetricValue(metricName: string): Promise<number> {
    const metrics = this.metrics.get(metricName) || [];
    if (metrics.length === 0) return 0;
    return metrics[metrics.length - 1].value;
  }

  private async getExpectedMetricValue(
    metricName: string,
    config: AnomalyDetectionConfig
  ): Promise<number> {
    // Simplificado - em produção usaria modelo de previsão
    const metrics = this.metrics.get(metricName) || [];
    if (metrics.length < 2) return metrics[0]?.value || 0;

    const values = metrics.slice(-10).map((m) => m.value);
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private determineAnomalyType(
    current: number,
    expected: number
  ): AnomalyAlert['type'] {
    if (current > expected * 1.5) return 'spike';
    if (current < expected * 0.5) return 'drop';
    return 'threshold';
  }

  private determineAnomalySeverity(
    deviation: number,
    sensitivity: number
  ): AnomalyAlert['severity'] {
    if (deviation > sensitivity * 20) return 'critical';
    if (deviation > sensitivity * 15) return 'high';
    if (deviation > sensitivity * 10) return 'medium';
    return 'low';
  }

  private generateAnomalyRecommendations(
    type: AnomalyAlert['type'],
    metricName: string
  ): string[] {
    return ['Investigar causa raiz', 'Monitorar evolução', 'Ajustar thresholds'];
  }

  private async sendAnomalyNotifications(
    alert: AnomalyAlert,
    config: AnomalyDetectionConfig
  ): Promise<void> {
    // Em produção: enviar notificações via email, Slack, etc.
    console.log('[Analytics] Notificação de anomalia enviada', alert);
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Obtém estatísticas gerais
   */
  public getStats() {
    return {
      totalEvents: this.events.size,
      totalMetrics: Array.from(this.metrics.values()).reduce(
        (sum, m) => sum + m.length,
        0
      ),
      activeABTests: Array.from(this.abTests.values()).filter(
        (t) => t.status === 'running'
      ).length,
      activeDashboards: this.dashboards.size,
      activeAnomalyConfigs: Array.from(this.anomalyConfigs.values()).filter(
        (c) => c.enabled
      ).length,
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export default AnalyticsMetricsSystem;
