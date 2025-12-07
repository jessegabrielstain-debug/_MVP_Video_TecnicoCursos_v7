import fs from 'fs';
import path from 'path';

/**
 * Logger para scripts de automação e workers.
 * Mantém compatibilidade com o formato JSON estruturado do app principal.
 */

class ScriptLogger {
  constructor(namespace = 'script') {
    this.namespace = namespace;
    this.logFile = path.join(process.cwd(), 'logs', 'worker.log');
    
    // Ensure log directory exists
    if (!fs.existsSync(path.dirname(this.logFile))) {
      fs.mkdirSync(path.dirname(this.logFile), { recursive: true });
    }
  }

  format(entry) {
    // Sempre usar JSON para fácil parsing em logs de produção/CI
    if (process.env.NODE_ENV === 'production' || process.env.CI) {
      return JSON.stringify({
        level: entry.level,
        message: entry.message,
        timestamp: entry.timestamp,
        namespace: this.namespace,
        ...entry.context,
        ...(entry.error ? {
          error: {
            message: entry.error.message,
            stack: entry.error.stack,
            name: entry.error.name
          }
        } : {})
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

  log(level, message, context, error) {
    const entry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error
    };

    const output = this.format(entry);

    // Console output
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

    try {
        fs.appendFileSync(this.logFile, output + '\n');
    } catch (e) {
        console.error('Failed to write to log file:', e);
    }
  }

  info(message, context) {
    this.log('info', message, context);
  }

  warn(message, context) {
    this.log('warn', message, context);
  }

  error(message, error, context) {
    this.log('error', message, context, error);
  }

  debug(message, context) {
    this.log('debug', message, context);
  }
}

export const logger = new ScriptLogger('worker');
export const createLogger = (namespace) => new ScriptLogger(namespace);
