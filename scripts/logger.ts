/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 📝 SISTEMA DE LOGGING ESTRUTURADO
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Sistema de logging profissional com níveis, rotação e análise
 * Versão: 1.0
 * Data: 10/10/2025
 * 
 * Funcionalidades:
 * - Múltiplos níveis de log (DEBUG, INFO, WARN, ERROR, FATAL)
 * - Rotação automática de arquivos
 * - Formatação estruturada (JSON)
 * - Análise de logs
 * - Filtragem e busca
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import fs from 'fs';
import path from 'path';

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  component: string;
  message: string;
  data?: unknown;
  stack?: string;
}

interface LogAnalysis {
  totalLogs: number;
  byLevel: Record<LogLevel, number>;
  byComponent: Record<string, number>;
  errors: LogEntry[];
  warnings: LogEntry[];
  timeRange: {
    start: string;
    end: string;
  };
}

class Logger {
  private static instance: Logger;
  private logDir: string;
  private currentLogFile: string;
  private maxFileSize: number = 10 * 1024 * 1024; // 10MB
  private maxFiles: number = 5;

  private constructor() {
    // Criar diretório de logs
    this.logDir = path.join(process.cwd(), '..', 'logs');
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }

    // Arquivo de log atual
    this.currentLogFile = path.join(
      this.logDir, 
      `app-${this.getDateString()}.log`
    );
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private getDateString(): string {
    const now = new Date();
    return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  }

  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private formatConsole(entry: LogEntry): string {
    const colors = {
      DEBUG: '\x1b[36m',   // Cyan
      INFO: '\x1b[37m',    // White
      WARN: '\x1b[33m',    // Yellow
      ERROR: '\x1b[31m',   // Red
      FATAL: '\x1b[35m',   // Magenta
      RESET: '\x1b[0m'
    };

    const icons = {
      DEBUG: '🔍',
      INFO: 'ℹ️',
      WARN: '⚠️',
      ERROR: '❌',
      FATAL: '💀'
    };

    const color = colors[entry.level];
    const icon = icons[entry.level];
    
    let output = `${color}[${entry.timestamp}] ${icon} ${entry.level} [${entry.component}] ${entry.message}${colors.RESET}`;
    
    if (entry.data) {
      output += `\n${color}   Data: ${JSON.stringify(entry.data, null, 2)}${colors.RESET}`;
    }
    
    if (entry.stack) {
      output += `\n${color}   Stack: ${entry.stack}${colors.RESET}`;
    }

    return output;
  }

  private writeToFile(entry: LogEntry) {
    try {
      // Verificar se precisa rotacionar
      this.rotateIfNeeded();

      // Escrever log (JSON Lines format)
      const logLine = JSON.stringify(entry) + '\n';
      fs.appendFileSync(this.currentLogFile, logLine, 'utf-8');
    } catch (error) {
      console.error('Erro ao escrever log:', error);
    }
  }

  private rotateIfNeeded() {
    try {
      // Verificar se arquivo existe e seu tamanho
      if (fs.existsSync(this.currentLogFile)) {
        const stats = fs.statSync(this.currentLogFile);
        
        if (stats.size >= this.maxFileSize) {
          // Rotacionar arquivo
          const timestamp = Date.now();
          const rotatedFile = this.currentLogFile.replace('.log', `-${timestamp}.log`);
          fs.renameSync(this.currentLogFile, rotatedFile);

          // Limpar arquivos antigos
          this.cleanOldLogs();
        }
      }
    } catch (error) {
      console.error('Erro ao rotacionar logs:', error);
    }
  }

  private cleanOldLogs() {
    try {
      const files = fs.readdirSync(this.logDir)
        .filter(f => f.endsWith('.log'))
        .map(f => ({
          name: f,
          path: path.join(this.logDir, f),
          time: fs.statSync(path.join(this.logDir, f)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time);

      // Manter apenas os N arquivos mais recentes
      if (files.length > this.maxFiles) {
        files.slice(this.maxFiles).forEach(file => {
          fs.unlinkSync(file.path);
        });
      }
    } catch (error) {
      console.error('Erro ao limpar logs antigos:', error);
    }
  }

  private log(level: LogLevel, component: string, message: string, data?: unknown, error?: Error) {
    const entry: LogEntry = {
      timestamp: this.getTimestamp(),
      level,
      component,
      message,
      data
    };

    if (error) {
      entry.stack = error.stack;
    }

    // Console output
    console.log(this.formatConsole(entry));

    // File output
    this.writeToFile(entry);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // MÉTODOS PÚBLICOS
  // ═══════════════════════════════════════════════════════════════════════

  debug(component: string, message: string, data?: unknown) {
    this.log('DEBUG', component, message, data);
  }

  info(component: string, message: string, data?: unknown) {
    this.log('INFO', component, message, data);
  }

  warn(component: string, message: string, data?: unknown) {
    this.log('WARN', component, message, data);
  }

  error(component: string, message: string, error?: Error, data?: unknown) {
    this.log('ERROR', component, message, data, error);
  }

  fatal(component: string, message: string, error?: Error, data?: unknown) {
    this.log('FATAL', component, message, data, error);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ANÁLISE DE LOGS
  // ═══════════════════════════════════════════════════════════════════════

  analyzeLogs(filePath?: string): LogAnalysis {
    const targetFile = filePath || this.currentLogFile;

    if (!fs.existsSync(targetFile)) {
      throw new Error(`Arquivo de log não encontrado: ${targetFile}`);
    }

    const content = fs.readFileSync(targetFile, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    
    const logs: LogEntry[] = lines
      .map(line => {
        try {
          return JSON.parse(line) as LogEntry;
        } catch {
          return null;
        }
      })
      .filter((log): log is LogEntry => log !== null);

    const analysis: LogAnalysis = {
      totalLogs: logs.length,
      byLevel: {
        DEBUG: logs.filter(l => l.level === 'DEBUG').length,
        INFO: logs.filter(l => l.level === 'INFO').length,
        WARN: logs.filter(l => l.level === 'WARN').length,
        ERROR: logs.filter(l => l.level === 'ERROR').length,
        FATAL: logs.filter(l => l.level === 'FATAL').length
      },
      byComponent: {},
      errors: logs.filter(l => l.level === 'ERROR' || l.level === 'FATAL'),
      warnings: logs.filter(l => l.level === 'WARN'),
      timeRange: {
        start: logs[0]?.timestamp || '',
        end: logs[logs.length - 1]?.timestamp || ''
      }
    };

    // Contar por componente
    logs.forEach(log => {
      if (!analysis.byComponent[log.component]) {
        analysis.byComponent[log.component] = 0;
      }
      analysis.byComponent[log.component]++;
    });

    return analysis;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // BUSCA E FILTRAGEM
  // ═══════════════════════════════════════════════════════════════════════

  searchLogs(
    query: string, 
    level?: LogLevel, 
    component?: string,
    filePath?: string
  ): LogEntry[] {
    const targetFile = filePath || this.currentLogFile;

    if (!fs.existsSync(targetFile)) {
      return [];
    }

    const content = fs.readFileSync(targetFile, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    
    const logs: LogEntry[] = lines
      .map(line => {
        try {
          return JSON.parse(line) as LogEntry;
        } catch {
          return null;
        }
      })
      .filter((log): log is LogEntry => log !== null);

    return logs.filter(log => {
      // Filtro de nível
      if (level && log.level !== level) return false;
      
      // Filtro de componente
      if (component && log.component !== component) return false;
      
      // Filtro de busca
      if (query) {
        const searchString = JSON.stringify(log).toLowerCase();
        return searchString.includes(query.toLowerCase());
      }
      
      return true;
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // RELATÓRIO
  // ═══════════════════════════════════════════════════════════════════════

  printAnalysis(analysis: LogAnalysis) {
    console.log('\n╔═══════════════════════════════════════════════════════════════════╗');
    console.log('║                    📊 ANÁLISE DE LOGS                            ║');
    console.log('╚═══════════════════════════════════════════════════════════════════╝\n');

    console.log(`📋 Total de Logs: ${analysis.totalLogs}`);
    console.log(`⏰ Período: ${analysis.timeRange.start} → ${analysis.timeRange.end}\n`);

    console.log('📊 Por Nível:');
    console.log(`   🔍 DEBUG: ${analysis.byLevel.DEBUG}`);
    console.log(`   ℹ️  INFO:  ${analysis.byLevel.INFO}`);
    console.log(`   ⚠️  WARN:  ${analysis.byLevel.WARN}`);
    console.log(`   ❌ ERROR: ${analysis.byLevel.ERROR}`);
    console.log(`   💀 FATAL: ${analysis.byLevel.FATAL}\n`);

    console.log('📦 Por Componente:');
    Object.entries(analysis.byComponent)
      .sort(([, a], [, b]) => b - a)
      .forEach(([component, count]) => {
        console.log(`   - ${component}: ${count}`);
      });

    if (analysis.errors.length > 0) {
      console.log(`\n❌ Erros Recentes (${analysis.errors.length}):`);
      analysis.errors.slice(-5).forEach(error => {
        console.log(`   [${error.timestamp}] ${error.component}: ${error.message}`);
      });
    }

    if (analysis.warnings.length > 0) {
      console.log(`\n⚠️  Avisos Recentes (${analysis.warnings.length}):`);
      analysis.warnings.slice(-5).forEach(warning => {
        console.log(`   [${warning.timestamp}] ${warning.component}: ${warning.message}`);
      });
    }

    console.log('\n');
  }

  // ═══════════════════════════════════════════════════════════════════════
  // UTILITÁRIOS
  // ═══════════════════════════════════════════════════════════════════════

  getLogFiles(): string[] {
    return fs.readdirSync(this.logDir)
      .filter(f => f.endsWith('.log'))
      .map(f => path.join(this.logDir, f));
  }

  clearLogs() {
    const files = this.getLogFiles();
    files.forEach(file => fs.unlinkSync(file));
    console.log(`✅ ${files.length} arquivos de log removidos`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export const logger = Logger.getInstance();
export type { LogEntry, LogAnalysis, LogLevel };

