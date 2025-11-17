
/**
 * SPRINT 34 - ELK STACK INTEGRATION
 * Logstash Configuration for Log Aggregation
 */

export interface LogstashConfig {
  host: string;
  port: number;
  protocol: 'tcp' | 'udp' | 'http';
  environment: 'development' | 'staging' | 'production';
  maxRetries: number;
  retryDelay: number;
}

export interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  service: string;
  environment: string;
  userId?: string;
  projectId?: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
  stack?: string;
}

class LogstashClient {
  private config: LogstashConfig;
  private buffer: LogEntry[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  constructor(config?: Partial<LogstashConfig>) {
    this.config = {
      host: process.env.LOGSTASH_HOST || 'localhost',
      port: parseInt(process.env.LOGSTASH_PORT || '5044'),
      protocol: (process.env.LOGSTASH_PROTOCOL as any) || 'tcp',
      environment: (process.env.NODE_ENV as any) || 'development',
      maxRetries: 3,
      retryDelay: 1000,
      ...config,
    };

    this.startFlushInterval();
  }

  async log(entry: Omit<LogEntry, 'timestamp' | 'environment'>): Promise<void> {
    const logEntry: LogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
      environment: this.config.environment,
    };

    this.buffer.push(logEntry);

    // Flush immediately for error and fatal logs
    if (entry.level === 'error' || entry.level === 'fatal') {
      await this.flush();
    }

    // Flush if buffer is getting large
    if (this.buffer.length >= 100) {
      await this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const logs = [...this.buffer];
    this.buffer = [];

    try {
      await this.sendToLogstash(logs);
    } catch (error) {
      console.error('Failed to send logs to Logstash:', error);
      // Re-add logs to buffer for retry
      this.buffer.unshift(...logs);
    }
  }

  private async sendToLogstash(logs: LogEntry[]): Promise<void> {
    // In production, this would send to Logstash via TCP/UDP/HTTP
    // For now, we'll use the Elasticsearch API directly
    
    const elasticsearchUrl = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';
    const indexName = `logs-${this.config.environment}-${new Date().toISOString().split('T')[0]}`;

    try {
      const response = await fetch(`${elasticsearchUrl}/${indexName}/_bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-ndjson',
        },
        body: logs
          .map((log) => {
            const index = JSON.stringify({ index: { _index: indexName } });
            const doc = JSON.stringify(log);
            return `${index}\n${doc}`;
          })
          .join('\n') + '\n',
      });

      if (!response.ok) {
        throw new Error(`Elasticsearch responded with ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to send logs to Elasticsearch:', error);
      throw error;
    }
  }

  private startFlushInterval(): void {
    // Flush logs every 5 seconds
    this.flushInterval = setInterval(() => {
      this.flush().catch(console.error);
    }, 5000);
  }

  async close(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    await this.flush();
  }
}

// Global singleton instance
let logstashClient: LogstashClient | null = null;

export function getLogstashClient(): LogstashClient {
  if (!logstashClient) {
    logstashClient = new LogstashClient();
  }
  return logstashClient;
}

// Helper functions for structured logging
export const logger = {
  debug: (message: string, metadata?: Record<string, unknown>) =>
    getLogstashClient().log({
      level: 'debug',
      message,
      service: 'estudio-ia-videos',
      metadata,
    }),

  info: (message: string, metadata?: Record<string, unknown>) =>
    getLogstashClient().log({
      level: 'info',
      message,
      service: 'estudio-ia-videos',
      metadata,
    }),

  warn: (message: string, metadata?: Record<string, unknown>) =>
    getLogstashClient().log({
      level: 'warn',
      message,
      service: 'estudio-ia-videos',
      metadata,
    }),

  error: (message: string, error?: Error, metadata?: Record<string, unknown>) =>
    getLogstashClient().log({
      level: 'error',
      message,
      service: 'estudio-ia-videos',
      metadata,
      stack: error?.stack,
    }),

  fatal: (message: string, error?: Error, metadata?: Record<string, unknown>) =>
    getLogstashClient().log({
      level: 'fatal',
      message,
      service: 'estudio-ia-videos',
      metadata,
      stack: error?.stack,
    }),
};
