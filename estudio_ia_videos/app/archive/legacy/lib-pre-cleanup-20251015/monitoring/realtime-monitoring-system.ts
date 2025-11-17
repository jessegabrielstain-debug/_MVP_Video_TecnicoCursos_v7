import { EventEmitter } from 'events';
import { MonitoringService } from './monitoring-service';

// Interfaces para o sistema de monitoramento em tempo real
export interface RealTimeConfig {
  metrics: {
    enabled: boolean;
    interval: number; // ms
    retention: number; // segundos
    aggregation: 'avg' | 'sum' | 'max' | 'min' | 'count';
  };
  alerts: {
    enabled: boolean;
    thresholds: AlertThresholds;
    cooldown: number; // ms
    channels: AlertChannel[];
  };
  dashboard: {
    enabled: boolean;
    refreshRate: number; // ms
    maxDataPoints: number;
    charts: ChartConfig[];
  };
  websocket: {
    enabled: boolean;
    port: number;
    path: string;
    heartbeat: number; // ms
  };
}

export interface AlertThresholds {
  system: {
    cpuUsage: number; // %
    memoryUsage: number; // %
    diskUsage: number; // %
    responseTime: number; // ms
  };
  pipeline: {
    queueSize: number;
    failureRate: number; // %
    avgProcessingTime: number; // ms
    concurrentJobs: number;
  };
  tts: {
    errorRate: number; // %
    avgLatency: number; // ms
    quotaUsage: number; // %
  };
  cache: {
    hitRate: number; // %
    memoryUsage: number; // %
    evictionRate: number; // per minute
  };
}

export interface AlertChannel {
  type: 'email' | 'webhook' | 'slack' | 'discord' | 'console';
  config: {
    url?: string;
    token?: string;
    channel?: string;
    email?: string;
  };
  enabled: boolean;
}

export interface ChartConfig {
  id: string;
  title: string;
  type: 'line' | 'bar' | 'pie' | 'gauge' | 'heatmap';
  metrics: string[];
  timeRange: number; // segundos
  refreshRate: number; // ms
  position: { x: number; y: number; width: number; height: number };
}

export interface MetricPoint {
  timestamp: Date;
  value: number;
  metadata?: Record<string, unknown>;
}

export interface MetricSeries {
  name: string;
  unit: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  data: MetricPoint[];
  aggregated?: {
    avg: number;
    min: number;
    max: number;
    sum: number;
    count: number;
  };
}

export interface Alert {
  id: string;
  type: 'warning' | 'error' | 'critical';
  metric: string;
  threshold: number;
  currentValue: number;
  message: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  duration?: number;
}

export interface DashboardData {
  timestamp: Date;
  system: {
    cpu: number;
    memory: number;
    disk: number;
    network: { in: number; out: number };
  };
  pipeline: {
    queueSize: number;
    activeJobs: number;
    completedJobs: number;
    failedJobs: number;
    avgProcessingTime: number;
  };
  tts: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    avgLatency: number;
    engineStatus: Record<string, boolean>;
  };
  cache: {
    hitRate: number;
    memoryUsage: number;
    totalEntries: number;
    evictions: number;
  };
  alerts: Alert[];
}

// Configuração padrão
const DEFAULT_CONFIG: RealTimeConfig = {
  metrics: {
    enabled: true,
    interval: 5000, // 5 segundos
    retention: 3600, // 1 hora
    aggregation: 'avg'
  },
  alerts: {
    enabled: true,
    thresholds: {
      system: {
        cpuUsage: 80,
        memoryUsage: 85,
        diskUsage: 90,
        responseTime: 5000
      },
      pipeline: {
        queueSize: 100,
        failureRate: 10,
        avgProcessingTime: 30000,
        concurrentJobs: 50
      },
      tts: {
        errorRate: 5,
        avgLatency: 3000,
        quotaUsage: 90
      },
      cache: {
        hitRate: 70,
        memoryUsage: 80,
        evictionRate: 100
      }
    },
    cooldown: 300000, // 5 minutos
    channels: [
      {
        type: 'console',
        config: {},
        enabled: true
      }
    ]
  },
  dashboard: {
    enabled: true,
    refreshRate: 2000, // 2 segundos
    maxDataPoints: 100,
    charts: [
      {
        id: 'system-overview',
        title: 'System Overview',
        type: 'line',
        metrics: ['cpu', 'memory', 'disk'],
        timeRange: 300, // 5 minutos
        refreshRate: 5000,
        position: { x: 0, y: 0, width: 6, height: 4 }
      },
      {
        id: 'pipeline-status',
        title: 'Pipeline Status',
        type: 'bar',
        metrics: ['queueSize', 'activeJobs'],
        timeRange: 600, // 10 minutos
        refreshRate: 3000,
        position: { x: 6, y: 0, width: 6, height: 4 }
      }
    ]
  },
  websocket: {
    enabled: true,
    port: 3001,
    path: '/monitoring',
    heartbeat: 30000 // 30 segundos
  }
};

export class RealTimeMonitoringSystem extends EventEmitter {
  private static instance: RealTimeMonitoringSystem;
  private config: RealTimeConfig;
  private monitoring: MonitoringService;
  
  // Armazenamento de métricas
  private metrics: Map<string, MetricSeries> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private activeAlerts: Set<string> = new Set();
  private alertCooldowns: Map<string, number> = new Map();
  
  // Timers e intervalos
  private metricsInterval?: NodeJS.Timeout;
  private dashboardInterval?: NodeJS.Timeout;
  private cleanupInterval?: NodeJS.Timeout;
  
  // WebSocket connections (simulado)
  private wsConnections: Set<string> = new Set();
  
  // Cache de dados do dashboard
  private dashboardCache: DashboardData | null = null;
  private lastDashboardUpdate: Date = new Date();

  private constructor(config: Partial<RealTimeConfig> = {}) {
    super();
    this.config = this.mergeConfig(config);
    this.monitoring = MonitoringService.getInstance();
    this.initializeSystem();
  }

  public static getInstance(config?: Partial<RealTimeConfig>): RealTimeMonitoringSystem {
    if (!RealTimeMonitoringSystem.instance) {
      RealTimeMonitoringSystem.instance = new RealTimeMonitoringSystem(config);
    }
    return RealTimeMonitoringSystem.instance;
  }

  // Inicializar o sistema
  private initializeSystem(): void {
    if (this.config.metrics.enabled) {
      this.startMetricsCollection();
    }

    if (this.config.dashboard.enabled) {
      this.startDashboardUpdates();
    }

    if (this.config.websocket.enabled) {
      this.initializeWebSocket();
    }

    this.startCleanupProcess();
    this.setupEventListeners();
  }

  // Coletar métricas do sistema
  public recordMetric(
    name: string,
    value: number,
    unit: string = '',
    type: MetricSeries['type'] = 'gauge',
    metadata?: Record<string, unknown>
  ): void {
    const point: MetricPoint = {
      timestamp: new Date(),
      value,
      metadata
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, {
        name,
        unit,
        type,
        data: []
      });
    }

    const series = this.metrics.get(name)!;
    series.data.push(point);

    // Limitar pontos de dados
    const maxPoints = this.config.dashboard.maxDataPoints;
    if (series.data.length > maxPoints) {
      series.data = series.data.slice(-maxPoints);
    }

    // Calcular agregações
    this.updateAggregations(series);

    // Verificar alertas
    this.checkAlerts(name, value);

    // Emitir evento
    this.emit('metricRecorded', { name, value, unit, metadata });
  }

  // Obter métricas
  public getMetrics(names?: string[]): Map<string, MetricSeries> {
    if (!names) {
      return new Map(this.metrics);
    }

    const filtered = new Map<string, MetricSeries>();
    for (const name of names) {
      if (this.metrics.has(name)) {
        filtered.set(name, this.metrics.get(name)!);
      }
    }
    return filtered;
  }

  // Obter dados do dashboard
  public getDashboardData(): DashboardData {
    if (this.dashboardCache && 
        Date.now() - this.lastDashboardUpdate.getTime() < this.config.dashboard.refreshRate) {
      return this.dashboardCache;
    }

    this.dashboardCache = this.generateDashboardData();
    this.lastDashboardUpdate = new Date();
    return this.dashboardCache;
  }

  // Obter alertas ativos
  public getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }

  // Obter todos os alertas
  public getAllAlerts(): Alert[] {
    return Array.from(this.alerts.values());
  }

  // Resolver alerta
  public resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert || alert.resolved) {
      return false;
    }

    alert.resolved = true;
    alert.resolvedAt = new Date();
    alert.duration = alert.resolvedAt.getTime() - alert.timestamp.getTime();

    this.activeAlerts.delete(alertId);
    this.emit('alertResolved', alert);
    
    return true;
  }

  // Configurar thresholds de alerta
  public updateAlertThresholds(thresholds: Partial<AlertThresholds>): void {
    this.config.alerts.thresholds = {
      ...this.config.alerts.thresholds,
      ...thresholds
    };
    this.emit('thresholdsUpdated', this.config.alerts.thresholds);
  }

  // Adicionar canal de alerta
  public addAlertChannel(channel: AlertChannel): void {
    this.config.alerts.channels.push(channel);
    this.emit('channelAdded', channel);
  }

  // Remover canal de alerta
  public removeAlertChannel(type: AlertChannel['type']): boolean {
    const index = this.config.alerts.channels.findIndex(c => c.type === type);
    if (index === -1) return false;

    this.config.alerts.channels.splice(index, 1);
    this.emit('channelRemoved', type);
    return true;
  }

  // Obter estatísticas do sistema
  public getSystemStats(): {
    metricsCount: number;
    alertsCount: number;
    activeAlertsCount: number;
    wsConnections: number;
    uptime: number;
  } {
    return {
      metricsCount: this.metrics.size,
      alertsCount: this.alerts.size,
      activeAlertsCount: this.activeAlerts.size,
      wsConnections: this.wsConnections.size,
      uptime: process.uptime()
    };
  }

  // Métodos privados
  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, this.config.metrics.interval);
  }

  private startDashboardUpdates(): void {
    this.dashboardInterval = setInterval(() => {
      const data = this.generateDashboardData();
      this.broadcastToWebSockets('dashboardUpdate', data);
    }, this.config.dashboard.refreshRate);
  }

  private startCleanupProcess(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldData();
    }, 60000); // A cada minuto
  }

  private collectSystemMetrics(): void {
    // Simular coleta de métricas do sistema
    const cpuUsage = Math.random() * 100;
    const memoryUsage = Math.random() * 100;
    const diskUsage = Math.random() * 100;

    this.recordMetric('system.cpu', cpuUsage, '%', 'gauge');
    this.recordMetric('system.memory', memoryUsage, '%', 'gauge');
    this.recordMetric('system.disk', diskUsage, '%', 'gauge');

    // Métricas de rede
    this.recordMetric('system.network.in', Math.random() * 1000, 'MB/s', 'gauge');
    this.recordMetric('system.network.out', Math.random() * 500, 'MB/s', 'gauge');

    // Métricas de pipeline (simuladas)
    this.recordMetric('pipeline.queue_size', Math.floor(Math.random() * 50), 'jobs', 'gauge');
    this.recordMetric('pipeline.active_jobs', Math.floor(Math.random() * 10), 'jobs', 'gauge');
    this.recordMetric('pipeline.processing_time', Math.random() * 30000, 'ms', 'gauge');

    // Métricas de TTS (simuladas)
    this.recordMetric('tts.requests_total', Math.floor(Math.random() * 100), 'requests', 'counter');
    this.recordMetric('tts.latency', Math.random() * 2000, 'ms', 'gauge');
    this.recordMetric('tts.error_rate', Math.random() * 5, '%', 'gauge');

    // Métricas de cache (simuladas)
    this.recordMetric('cache.hit_rate', 70 + Math.random() * 25, '%', 'gauge');
    this.recordMetric('cache.memory_usage', Math.random() * 80, '%', 'gauge');
    this.recordMetric('cache.evictions', Math.floor(Math.random() * 10), 'evictions/min', 'gauge');
  }

  private generateDashboardData(): DashboardData {
    const now = new Date();
    
    return {
      timestamp: now,
      system: {
        cpu: this.getLatestMetricValue('system.cpu') || 0,
        memory: this.getLatestMetricValue('system.memory') || 0,
        disk: this.getLatestMetricValue('system.disk') || 0,
        network: {
          in: this.getLatestMetricValue('system.network.in') || 0,
          out: this.getLatestMetricValue('system.network.out') || 0
        }
      },
      pipeline: {
        queueSize: this.getLatestMetricValue('pipeline.queue_size') || 0,
        activeJobs: this.getLatestMetricValue('pipeline.active_jobs') || 0,
        completedJobs: this.getLatestMetricValue('pipeline.completed_jobs') || 0,
        failedJobs: this.getLatestMetricValue('pipeline.failed_jobs') || 0,
        avgProcessingTime: this.getLatestMetricValue('pipeline.processing_time') || 0
      },
      tts: {
        totalRequests: this.getLatestMetricValue('tts.requests_total') || 0,
        successfulRequests: this.getLatestMetricValue('tts.successful_requests') || 0,
        failedRequests: this.getLatestMetricValue('tts.failed_requests') || 0,
        avgLatency: this.getLatestMetricValue('tts.latency') || 0,
        engineStatus: {
          elevenlabs: true,
          azure: true,
          google: true,
          aws: false
        }
      },
      cache: {
        hitRate: this.getLatestMetricValue('cache.hit_rate') || 0,
        memoryUsage: this.getLatestMetricValue('cache.memory_usage') || 0,
        totalEntries: this.getLatestMetricValue('cache.total_entries') || 0,
        evictions: this.getLatestMetricValue('cache.evictions') || 0
      },
      alerts: this.getActiveAlerts()
    };
  }

  private getLatestMetricValue(name: string): number | null {
    const series = this.metrics.get(name);
    if (!series || series.data.length === 0) {
      return null;
    }
    return series.data[series.data.length - 1].value;
  }

  private updateAggregations(series: MetricSeries): void {
    if (series.data.length === 0) return;

    const values = series.data.map(point => point.value);
    
    series.aggregated = {
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      sum: values.reduce((a, b) => a + b, 0),
      count: values.length
    };
  }

  private checkAlerts(metricName: string, value: number): void {
    if (!this.config.alerts.enabled) return;

    const thresholds = this.config.alerts.thresholds;
    let threshold: number | undefined;
    let alertType: Alert['type'] = 'warning';

    // Verificar thresholds do sistema
    if (metricName === 'system.cpu' && value > thresholds.system.cpuUsage) {
      threshold = thresholds.system.cpuUsage;
      alertType = value > 90 ? 'critical' : 'warning';
    } else if (metricName === 'system.memory' && value > thresholds.system.memoryUsage) {
      threshold = thresholds.system.memoryUsage;
      alertType = value > 95 ? 'critical' : 'warning';
    } else if (metricName === 'pipeline.queue_size' && value > thresholds.pipeline.queueSize) {
      threshold = thresholds.pipeline.queueSize;
      alertType = value > 200 ? 'critical' : 'warning';
    } else if (metricName === 'tts.error_rate' && value > thresholds.tts.errorRate) {
      threshold = thresholds.tts.errorRate;
      alertType = value > 15 ? 'critical' : 'error';
    } else if (metricName === 'cache.hit_rate' && value < thresholds.cache.hitRate) {
      threshold = thresholds.cache.hitRate;
      alertType = value < 50 ? 'critical' : 'warning';
    }

    if (threshold !== undefined) {
      this.createAlert(metricName, value, threshold, alertType);
    }
  }

  private createAlert(
    metric: string,
    currentValue: number,
    threshold: number,
    type: Alert['type']
  ): void {
    const alertKey = `${metric}_${type}`;
    
    // Verificar cooldown
    const lastAlert = this.alertCooldowns.get(alertKey);
    if (lastAlert && Date.now() - lastAlert < this.config.alerts.cooldown) {
      return;
    }

    const alert: Alert = {
      id: this.generateAlertId(),
      type,
      metric,
      threshold,
      currentValue,
      message: this.generateAlertMessage(metric, currentValue, threshold, type),
      timestamp: new Date(),
      resolved: false
    };

    this.alerts.set(alert.id, alert);
    this.activeAlerts.add(alert.id);
    this.alertCooldowns.set(alertKey, Date.now());

    // Enviar alerta
    this.sendAlert(alert);
    this.emit('alertCreated', alert);
  }

  private generateAlertMessage(
    metric: string,
    value: number,
    threshold: number,
    type: Alert['type']
  ): string {
    const metricDisplay = metric.replace(/\./g, ' ').toUpperCase();
    const comparison = metric.includes('hit_rate') ? 'below' : 'above';
    
    return `${type.toUpperCase()}: ${metricDisplay} is ${comparison} threshold (${value.toFixed(2)} vs ${threshold})`;
  }

  private sendAlert(alert: Alert): void {
    for (const channel of this.config.alerts.channels) {
      if (!channel.enabled) continue;

      switch (channel.type) {
        case 'console':
          console.warn(`[ALERT] ${alert.message}`);
          break;
        case 'webhook':
          this.sendWebhookAlert(alert, channel);
          break;
        case 'email':
          this.sendEmailAlert(alert, channel);
          break;
        // Outros canais podem ser implementados aqui
      }
    }

    // Broadcast via WebSocket
    this.broadcastToWebSockets('alert', alert);
  }

  private async sendWebhookAlert(alert: Alert, channel: AlertChannel): Promise<void> {
    // Implementação simulada
    console.log(`Sending webhook alert to ${channel.config.url}:`, alert.message);
  }

  private async sendEmailAlert(alert: Alert, channel: AlertChannel): Promise<void> {
    // Implementação simulada
    console.log(`Sending email alert to ${channel.config.email}:`, alert.message);
  }

  private cleanupOldData(): void {
    const cutoff = new Date(Date.now() - this.config.metrics.retention * 1000);

    // Limpar métricas antigas
    for (const series of this.metrics.values()) {
      series.data = series.data.filter(point => point.timestamp > cutoff);
    }

    // Limpar alertas resolvidos antigos
    const oldAlerts = Array.from(this.alerts.entries())
      .filter(([_, alert]) => alert.resolved && alert.resolvedAt! < cutoff)
      .map(([id]) => id);

    for (const id of oldAlerts) {
      this.alerts.delete(id);
    }
  }

  private setupEventListeners(): void {
    // Escutar eventos do MonitoringService
    this.monitoring.on('event', (event) => {
      this.recordMetric(`events.${event.type}`, 1, 'count', 'counter', event.data);
    });

    // Auto-resolver alertas quando métricas voltam ao normal
    this.on('metricRecorded', ({ name, value }) => {
      this.checkAlertResolution(name, value);
    });
  }

  private checkAlertResolution(metricName: string, value: number): void {
    const activeAlertIds = Array.from(this.activeAlerts);
    
    for (const alertId of activeAlertIds) {
      const alert = this.alerts.get(alertId);
      if (!alert || alert.metric !== metricName) continue;

      let shouldResolve = false;

      // Verificar se a métrica voltou ao normal
      if (metricName.includes('hit_rate')) {
        shouldResolve = value >= alert.threshold;
      } else {
        shouldResolve = value <= alert.threshold;
      }

      if (shouldResolve) {
        this.resolveAlert(alertId);
      }
    }
  }

  private initializeWebSocket(): void {
    // Simulação de WebSocket server
    console.log(`WebSocket server initialized on port ${this.config.websocket.port}`);
    
    // Simular conexões
    setInterval(() => {
      const connectionId = `ws_${Date.now()}_${Math.random()}`;
      this.wsConnections.add(connectionId);
      
      // Simular desconexão após um tempo
      setTimeout(() => {
        this.wsConnections.delete(connectionId);
      }, 30000 + Math.random() * 60000);
    }, 10000);
  }

  private broadcastToWebSockets(event: string, data: any): void {
    // Simulação de broadcast
    if (this.wsConnections.size > 0) {
      console.log(`Broadcasting ${event} to ${this.wsConnections.size} connections`);
    }
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private mergeConfig(config: Partial<RealTimeConfig>): RealTimeConfig {
    return {
      metrics: { ...DEFAULT_CONFIG.metrics, ...config.metrics },
      alerts: {
        ...DEFAULT_CONFIG.alerts,
        ...config.alerts,
        thresholds: { ...DEFAULT_CONFIG.alerts.thresholds, ...config.alerts?.thresholds }
      },
      dashboard: { ...DEFAULT_CONFIG.dashboard, ...config.dashboard },
      websocket: { ...DEFAULT_CONFIG.websocket, ...config.websocket }
    };
  }

  // Cleanup ao destruir a instância
  public destroy(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    if (this.dashboardInterval) {
      clearInterval(this.dashboardInterval);
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    this.removeAllListeners();
  }
}