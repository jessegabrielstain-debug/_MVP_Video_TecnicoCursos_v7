/**
 * Real-time Collector
 * Coleta métricas analytics em tempo real
 */

export interface RealtimeMetric {
  name: string;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
}

export class RealTimeCollector {
  private metrics: RealtimeMetric[] = [];
  private maxSize = 1000;
  
  collect(metric: Omit<RealtimeMetric, 'timestamp'>): void {
    this.metrics.push({
      ...metric,
      timestamp: new Date(),
    });
    
    // Limitar tamanho do buffer
    if (this.metrics.length > this.maxSize) {
      this.metrics = this.metrics.slice(-this.maxSize);
    }
  }
  
  getRecent(seconds: number = 60): RealtimeMetric[] {
    const cutoff = new Date(Date.now() - seconds * 1000);
    return this.metrics.filter(m => m.timestamp >= cutoff);
  }
  
  getAll(): RealtimeMetric[] {
    return [...this.metrics];
  }
  
  clear(): void {
    this.metrics = [];
  }
}

export const realtimeCollector = new RealTimeCollector();
export const analyticsCollector = realtimeCollector;
