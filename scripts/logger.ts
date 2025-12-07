/**
 * Logger para scripts de automação e workers.
 * Mantém compatibilidade com o formato JSON estruturado do app principal.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: Error;
}

class ScriptLogger {
  private namespace: string;

  constructor(namespace: string = 'script') {
    this.namespace = namespace;
  }

  private format(entry: LogEntry): string {
    // Sempre usar JSON para fácil parsing em logs de produção/CI
    if (process.env.NODE_ENV === 'production' || process.env.CI) {
      return JSON.stringify({
        level: entry.level,
        message: entry.message,
        timestamp: entry.timestamp,
        namespace: this.namespace,
        ...entry.context,
        ...entry.error ? {
          error: {
            message: entry.error.message,
            stack: entry.error.stack,
            name: entry.error.name
          }
        } : {}
      });
    }

    // Formato legível para dev local
    const time = entry.timestamp.split('T')[1].split('.')[0];
    let line = `[${time}] [${entry.level.toUpperCase()}] [${this.namespace}] ${entry.message}`;
    
    if (entry.context && Object.keys(entry.context).length > 0) {
      line += `\n${JSON.stringify(entry.context, null, 2)}`;
    }
    
    if (entry.error) {
      line += `\n❌ ${entry.error.message}`;
      if (entry.error.stack) {
        line += `\n${entry.error.stack}`;
      }
    }
    
    return line;
  }

  log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error
    };

    const output = this.format(entry);

    switch (level) {
      case 'error':
        console.error(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      default:
        console.log(output);
    }
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: Record<string, unknown>) {
    this.log('error', message, context, error);
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log('debug', message, context);
  }
}

export const logger = new ScriptLogger('automation');
export const createLogger = (namespace: string) => new ScriptLogger(namespace);
