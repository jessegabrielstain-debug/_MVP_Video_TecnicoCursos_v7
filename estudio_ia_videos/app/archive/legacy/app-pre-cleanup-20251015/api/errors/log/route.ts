
/**
 * 📊 API ENDPOINT PARA LOGS DE ERRO
 * Endpoint para receber e processar logs de erro do frontend
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface ErrorLog {
  id: string;
  timestamp: number;
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  context?: Record<string, unknown>;
  userId?: string;
  sessionId: string;
  url: string;
  userAgent: string;
  handled: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { logs } = body as { logs: ErrorLog[] };

    if (!logs || !Array.isArray(logs)) {
      return NextResponse.json(
        { error: 'Invalid logs format' },
        { status: 400 }
      );
    }

    // Processar logs em batch
    const processedLogs = [];
    const criticalErrors = [];

    for (const log of logs) {
      try {
        // Validar estrutura do log
        if (!log.id || !log.timestamp || !log.level || !log.message) {
          console.warn('Invalid log entry:', log);
          continue;
        }

        // Preparar dados para o banco
        const logData = {
          id: log.id,
          level: log.level,
          message: log.message.slice(0, 1000), // Limitar tamanho
          errorName: log.error?.name,
          errorMessage: log.error?.message?.slice(0, 1000),
          errorStack: log.error?.stack?.slice(0, 5000),
          context: log.context ? JSON.stringify(log.context) : null,
          userId: log.userId,
          sessionId: log.sessionId,
          url: log.url?.slice(0, 500),
          userAgent: log.userAgent?.slice(0, 500),
          timestamp: new Date(log.timestamp),
          handled: log.handled,
        };

        processedLogs.push(logData);

        // Identificar erros críticos
        if (log.level === 'error' && !log.handled) {
          criticalErrors.push(log);
        }

      } catch (error) {
        console.error('Error processing log entry:', error);
      }
    }

    // Salvar logs no banco (opcional - comentado para evitar dependência do Prisma)
    /*
    try {
      await prisma.errorLog.createMany({
        data: processedLogs,
        skipDuplicates: true,
      });
    } catch (dbError) {
      console.error('Failed to save logs to database:', dbError);
      // Não falhar a requisição se o banco falhar
    }
    */

    // Log no console em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.group('📝 Error Logs Received');
      processedLogs.forEach(log => {
        const level = log.level === 'error' ? 'error' : 
                     log.level === 'warn' ? 'warn' : 'log';
        console[level](`[${log.level.toUpperCase()}] ${log.message}`, {
          context: log.context,
          error: log.errorName && log.errorMessage ? {
            name: log.errorName,
            message: log.errorMessage
          } : undefined
        });
      });
      console.groupEnd();
    }

    // Processar erros críticos
    if (criticalErrors.length > 0) {
      await handleCriticalErrors(criticalErrors);
    }

    // Análise de padrões de erro
    const errorStats = analyzeErrorPatterns(processedLogs);

    return NextResponse.json({
      success: true,
      processed: processedLogs.length,
      critical: criticalErrors.length,
      stats: errorStats,
      message: `Processed ${processedLogs.length} logs successfully`
    });

  } catch (error) {
    console.error('Error processing logs:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process logs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Função para lidar com erros críticos
async function handleCriticalErrors(criticalErrors: ErrorLog[]) {
  try {
    // Filtrar erros de recursos externos opcionais que não são críticos
    const nonCriticalPatterns = [
      'cloudflareinsights.com',
      'static.cloudflare',
      'beacon.min.js',
      'Resource Error: https://static',
    ];

    const trueCriticalErrors = criticalErrors.filter(error => {
      const message = error.message?.toLowerCase() || '';
      const errorMsg = error.error?.message?.toLowerCase() || '';
      const fullMessage = `${message} ${errorMsg}`;
      
      // Ignorar se matches em algum padrão não-crítico
      return !nonCriticalPatterns.some(pattern => 
        fullMessage.includes(pattern.toLowerCase())
      );
    });

    // Se não há erros verdadeiramente críticos, retornar
    if (trueCriticalErrors.length === 0) {
      console.log('ℹ️ All critical errors were from optional external resources - ignored');
      return;
    }

    // Em produção, aqui poderia enviar alertas para Slack, email, etc.
    console.error(`🚨 ${trueCriticalErrors.length} critical errors detected:`, 
      trueCriticalErrors.map(e => ({
        message: e.message,
        url: e.url,
        timestamp: new Date(e.timestamp).toISOString()
      }))
    );

    // Verificar se há muitos erros da mesma origem
    const errorsByUrl = new Map<string, number>();
    trueCriticalErrors.forEach(error => {
      const url = error.url || 'unknown';
      errorsByUrl.set(url, (errorsByUrl.get(url) || 0) + 1);
    });

    // Alertar se uma página tem muitos erros
    for (const [url, count] of errorsByUrl.entries()) {
      if (count >= 5) {
        console.error(`⚠️ High error rate detected on ${url}: ${count} errors`);
        // Aqui poderia disparar alertas automatizados
      }
    }

  } catch (error) {
    console.error('Failed to handle critical errors:', error);
  }
}

// Função para analisar padrões de erro
function analyzeErrorPatterns(logs: any[]): {
  errorsByLevel: Record<string, number>;
  errorsByType: Record<string, number>;
  errorsByUrl: Record<string, number>;
  timeRange: { start: string; end: string };
} {
  const errorsByLevel: Record<string, number> = {};
  const errorsByType: Record<string, number> = {};
  const errorsByUrl: Record<string, number> = {};
  
  let minTimestamp = Date.now();
  let maxTimestamp = 0;

  logs.forEach(log => {
    // Contar por nível
    errorsByLevel[log.level] = (errorsByLevel[log.level] || 0) + 1;
    
    // Contar por tipo de erro
    const errorType = log.errorName || 'Unknown';
    errorsByType[errorType] = (errorsByType[errorType] || 0) + 1;
    
    // Contar por URL
    const url = log.url || 'Unknown';
    errorsByUrl[url] = (errorsByUrl[url] || 0) + 1;
    
    // Rastrear intervalo de tempo
    const timestamp = new Date(log.timestamp).getTime();
    minTimestamp = Math.min(minTimestamp, timestamp);
    maxTimestamp = Math.max(maxTimestamp, timestamp);
  });

  return {
    errorsByLevel,
    errorsByType,
    errorsByUrl,
    timeRange: {
      start: new Date(minTimestamp).toISOString(),
      end: new Date(maxTimestamp).toISOString()
    }
  };
}

// Endpoint para obter estatísticas de erro (GET)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hours = parseInt(searchParams.get('hours') || '24');
    const level = searchParams.get('level');

    // Em produção, consultar banco de dados
    // Por ora, retornar dados mockados
    const mockStats = {
      totalErrors: 0,
      errorsByLevel: {
        error: 0,
        warn: 0,
        info: 0,
        debug: 0
      },
      errorsByType: {},
      recentErrors: [],
      timeRange: {
        start: new Date(Date.now() - hours * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString()
      }
    };

    return NextResponse.json({
      success: true,
      data: mockStats
    });

  } catch (error) {
    console.error('Error fetching error stats:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch error statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
