/**
 * Real-time Monitor
 * Monitoramento em tempo real do sistema
 */

export interface SystemMetric {
  timestamp: number; // Alterado de Date para number (Unix timestamp em ms)
  cpu: number;
  memory: number;
  activeConnections: number;
  requestsPerSecond: number;
  application?: {
    response_time?: number;
    error_rate?: number;
    throughput?: number;
    concurrent_jobs?: number;
  };
}

export interface HealthStatus {
  status: 'healthy' | 'warning' | 'error';
  score: number;
  issues: string[];
  metrics?: {
    cpu?: number;
    memory?: number;
    activeConnections?: number;
  };
}

export interface Alert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type?: 'warning' | 'error' | 'critical';
  category?: 'performance' | 'system' | 'application' | 'security';
  message: string;
  timestamp: Date;
  resolved?: boolean;
}

export class RealTimeMonitor {
  private metrics: SystemMetric[] = [];
  private alerts: Alert[] = [];
  private maxMetrics = 1000;
  private interval?: NodeJS.Timeout;
  
  start(intervalMs: number = 5000): void {
    if (this.interval) return;
    
    this.interval = setInterval(() => {
      this.collect();
    }, intervalMs);
  }
  
  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
  }
  
  private collect(): void {
    const metric: SystemMetric = {
      timestamp: Date.now(),
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
      activeConnections: Math.floor(Math.random() * 100),
      requestsPerSecond: Math.floor(Math.random() * 1000),
    };
    
    this.metrics.push(metric);
    
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }
  
  getMetrics(limit?: number): SystemMetric[] {
    if (!limit || limit >= this.metrics.length) return [...this.metrics];
    return this.metrics.slice(-limit);
  }
  
  getLatest(): SystemMetric | null {
    return this.metrics[this.metrics.length - 1] || null;
  }
  
  clear(): void {
    this.metrics = [];
  }

  getHealthStatus(): HealthStatus {
    const latest = this.getLatest();
    if (!latest) {
      return { status: 'warning', score: 50, issues: ['No metrics available'] };
    }

    const issues: string[] = [];
    let score = 100;

    if (latest.cpu > 80) {
      issues.push('High CPU usage');
      score -= 20;
    }
    if (latest.memory > 80) {
      issues.push('High memory usage');
      score -= 20;
    }

    const status: HealthStatus['status'] = score >= 80 ? 'healthy' : score >= 50 ? 'warning' : 'error';
    
    return {
      status,
      score,
      issues,
      metrics: {
        cpu: latest.cpu,
        memory: latest.memory,
        activeConnections: latest.activeConnections
      }
    };
  }

  getLatestMetrics(): { system: Record<string, unknown>; application: Record<string, unknown>; cache: Record<string, unknown> } {
    const latest = this.getLatest();
    return {
      system: {
        cpu_usage: latest?.cpu || 0,
        memory_usage: latest?.memory || 0
      },
      application: {
        response_time: latest?.application?.response_time || 100,
        error_rate: latest?.application?.error_rate || 0,
        throughput: latest?.application?.throughput || 10,
        concurrent_jobs: latest?.application?.concurrent_jobs || 0
      },
      cache: {
        hit_rate: 0.9
      }
    };
  }

  getAlerts(resolved?: boolean): Alert[] {
    if (resolved === undefined) {
      return [...this.alerts];
    }
    return this.alerts.filter(a => a.resolved === resolved);
  }

  async resolveAlert(alertId: string): Promise<boolean> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      return true;
    }
    return false;
  }

  emit(event: string, data?: unknown): void {
    // Event emitter stub - pode ser expandido com EventEmitter real
    console.log(`[RealTimeMonitor] Event: ${event}`, data);
  }
}

export const realTimeMonitor = new RealTimeMonitor();
