export interface PerformanceMetrics {
  cpu?: { usage: number; threads: number };
  memory?: { percentage: number; used: number; total: number; heap?: { used: number } };
  network?: { avgLatency: number; requests: number; errors: number };
  performance?: { fps: number; domNodes: number; renderTime: number };
  apis?: Record<string, { calls: number; avgResponseTime: number; errors: number; lastCall: number }>;
  timestamp?: number;
}

export interface AlertThresholds {
  cpu: number;
  memory: number;
  latency: number;
  errorRate: number;
}

type Listener = (data: unknown) => void;

export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {};
  private history: PerformanceMetrics[] = [];
  private thresholds: AlertThresholds = {
    cpu: 80,
    memory: 85,
    latency: 2000,
    errorRate: 10
  };
  private intervalId: NodeJS.Timeout | null = null;
  private listeners: Record<string, Listener[]> = {};

  on(event: string, listener: Listener) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(listener);
  }

  off(event: string, listener: Listener) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(l => l !== listener);
  }

  emit(event: string, data: unknown) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(l => l(data));
  }

  start() {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => {
      this.collectMetrics();
    }, 1000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  collectMetrics() {
    // Mock data collection
    const newMetrics: PerformanceMetrics = {
      timestamp: Date.now(),
      cpu: { usage: Math.random() * 100, threads: 4 },
      memory: { percentage: Math.random() * 100, used: 1024 * 1024 * 500, total: 1024 * 1024 * 1024 * 16, heap: { used: 1024 * 1024 * 200 } },
      network: { avgLatency: Math.random() * 100, requests: Math.floor(Math.random() * 100), errors: 0 },
      performance: { fps: 60, domNodes: 1000, renderTime: 16 },
      apis: {}
    };
    this.metrics = newMetrics;
    this.history.push(newMetrics);
    this.emit('metrics', newMetrics);
    
    // Check alerts
    const alerts = [];
    if ((newMetrics.cpu?.usage || 0) > this.thresholds.cpu) {
      alerts.push({ type: 'cpu', message: 'High CPU Usage', severity: 'high' });
    }
    if (alerts.length > 0) {
      this.emit('alerts', alerts);
    }
  }

  clearHistory() {
    this.history = [];
  }

  setThresholds(thresholds: AlertThresholds) {
    this.thresholds = thresholds;
  }

  exportMetrics() {
    return this.history;
  }
}

export const performanceMonitor = new PerformanceMonitor();
