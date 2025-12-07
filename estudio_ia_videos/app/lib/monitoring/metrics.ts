/**
 * Metrics System
 * Sistema de métricas de monitoramento
 */

import os from "os";

export interface Metric {
  name: string;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
}

interface MetricSummary {
  name: string;
  count: number;
  average: number;
  lastValue: number;
}

export class MetricsSystem {
  private metrics: Metric[] = [];

  record(name: string, value: number, tags?: Record<string, string>): void {
    this.metrics.push({
      name,
      value,
      timestamp: new Date(),
      tags,
    });
  }

  getMetrics(name?: string): Metric[] {
    if (!name) return [...this.metrics];
    return this.metrics.filter((metric) => metric.name === name);
  }

  getSystemMetrics() {
    const memoryUsage = process.memoryUsage();
    const totalHeap = memoryUsage.heapTotal || 1;
    const loadAverage = os.loadavg?.()[0] ?? 0;

    return {
      memory: {
        used: memoryUsage.heapUsed,
        total: totalHeap,
        percentage: Number(((memoryUsage.heapUsed / totalHeap) * 100).toFixed(2)),
      },
      cpu: {
        load: Number(loadAverage.toFixed(2)),
        cores: os.cpus().length,
        uptime: os.uptime(),
      },
      requests: {
        total: this.metrics.filter((metric) => metric.name.startsWith("request_")).length,
        lastMinute: this.metrics.filter((metric) => metric.timestamp.getTime() >= Date.now() - 60_000).length,
      },
    };
  }

  getSummary() {
    const grouped = this.metrics.reduce<Record<string, MetricSummary>>((acc, metric) => {
      const entry = acc[metric.name] ?? {
        name: metric.name,
        count: 0,
        average: 0,
        lastValue: 0,
      };

      entry.count += 1;
      entry.average += metric.value;
      entry.lastValue = metric.value;
      acc[metric.name] = entry;
      return acc;
    }, {});

    const summaries = Object.values(grouped).map((group) => ({
      name: group.name,
      count: group.count,
      average: Number((group.average / group.count).toFixed(2)),
      lastValue: group.lastValue,
    }));

    return {
      totalMetrics: this.metrics.length,
      lastUpdated: this.metrics.at(-1)?.timestamp ?? null,
      metrics: summaries,
    };
  }

  clear(): void {
    this.metrics = [];
  }
}

export const metricsCollector = new MetricsSystem();
export const metrics = metricsCollector;
