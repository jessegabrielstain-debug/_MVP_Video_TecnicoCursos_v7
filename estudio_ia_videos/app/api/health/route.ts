/**
 * Health Check API
 * Verifica a saúde de todos os serviços críticos
 */

import { NextResponse } from 'next/server';
import { getSupabaseForRequest } from '@/lib/services';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    database: ServiceHealth;
    redis?: ServiceHealth;
    storage: ServiceHealth;
    tts: ServiceHealth;
    websocket: ServiceHealth;
  };
  metrics: {
    memory: MemoryMetrics;
    cpu?: CPUMetrics;
  };
}

interface ServiceHealth {
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  message?: string;
  lastCheck: string;
}

interface MemoryMetrics {
  used: number;
  total: number;
  percentage: number;
}

interface CPUMetrics {
  usage: number;
}

export async function GET(req: Request) {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  try {
    // Verificar status de cada serviço
    const services = await checkAllServices(req);
    
    // Coletar métricas do sistema
    const metrics = collectSystemMetrics();
    
    // Determinar status geral
    const overallStatus = determineOverallStatus(services);
    
    const health: HealthStatus = {
      status: overallStatus,
      timestamp,
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      services,
      metrics
    };
    
    // Status code baseado no health
    const statusCode = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503;
    
    return NextResponse.json(health, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Response-Time': `${Date.now() - startTime}ms`
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp,
      error: error instanceof Error ? error.message : 'Unknown error',
      uptime: process.uptime()
    }, { status: 503 });
  }
}

async function checkAllServices(req: Request) {
  const [database, storage, tts, websocket] = await Promise.allSettled([
    checkDatabase(req),
    checkStorage(req),
    checkTTS(),
    checkWebSocket()
  ]);
  
  return {
    database: database.status === 'fulfilled' ? database.value : createFailedHealth('Database check failed'),
    storage: storage.status === 'fulfilled' ? storage.value : createFailedHealth('Storage check failed'),
    tts: tts.status === 'fulfilled' ? tts.value : createFailedHealth('TTS check failed'),
    websocket: websocket.status === 'fulfilled' ? websocket.value : createFailedHealth('WebSocket check failed')
  };
}

async function checkDatabase(req: Request): Promise<ServiceHealth> {
  const start = Date.now();
  
  try {
    const supabase = getSupabaseForRequest(req);
    
    // Teste simples de conexão
    const { error } = await supabase.from('projects').select('id').limit(1);
    
    if (error) {
      return {
        status: 'down',
        responseTime: Date.now() - start,
        message: `Database error: ${error.message}`,
        lastCheck: new Date().toISOString()
      };
    }
    
    const responseTime = Date.now() - start;
    
    return {
      status: responseTime < 1000 ? 'up' : 'degraded',
      responseTime,
      message: responseTime > 1000 ? 'Slow response time' : 'OK',
      lastCheck: new Date().toISOString()
    };
    
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - start,
      message: error instanceof Error ? error.message : 'Unknown error',
      lastCheck: new Date().toISOString()
    };
  }
}

async function checkStorage(req: Request): Promise<ServiceHealth> {
  const start = Date.now();
  
  try {
    const supabase = getSupabaseForRequest(req);
    
    // Verificar se consegue listar buckets
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      return {
        status: 'down',
        responseTime: Date.now() - start,
        message: `Storage error: ${error.message}`,
        lastCheck: new Date().toISOString()
      };
    }
    
    const responseTime = Date.now() - start;
    
    return {
      status: 'up',
      responseTime,
      message: `${data?.length || 0} buckets available`,
      lastCheck: new Date().toISOString()
    };
    
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - start,
      message: error instanceof Error ? error.message : 'Unknown error',
      lastCheck: new Date().toISOString()
    };
  }
}

async function checkTTS(): Promise<ServiceHealth> {
  const start = Date.now();
  
  try {
    // Verificar se API key está configurada
    const hasElevenLabsKey = !!process.env.ELEVENLABS_API_KEY;
    const hasAzureKey = !!process.env.AZURE_SPEECH_KEY;
    const hasGoogleKey = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;
    
    const availableProviders = [
      hasElevenLabsKey && 'ElevenLabs',
      hasAzureKey && 'Azure',
      hasGoogleKey && 'Google'
    ].filter(Boolean);
    
    if (availableProviders.length === 0) {
      return {
        status: 'down',
        responseTime: Date.now() - start,
        message: 'No TTS provider configured',
        lastCheck: new Date().toISOString()
      };
    }
    
    return {
      status: 'up',
      responseTime: Date.now() - start,
      message: `Providers: ${availableProviders.join(', ')}`,
      lastCheck: new Date().toISOString()
    };
    
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - start,
      message: error instanceof Error ? error.message : 'Unknown error',
      lastCheck: new Date().toISOString()
    };
  }
}

async function checkWebSocket(): Promise<ServiceHealth> {
  const start = Date.now();
  
  try {
    const { getWebSocketServer } = await import('@/lib/notifications/websocket-server');
    const wsServer = getWebSocketServer();
    
    const connectionCount = wsServer.getConnectionCount();
    
    return {
      status: 'up',
      responseTime: Date.now() - start,
      message: `${connectionCount} active connections`,
      lastCheck: new Date().toISOString()
    };
    
  } catch (error) {
    return {
      status: 'degraded',
      responseTime: Date.now() - start,
      message: 'WebSocket server not initialized',
      lastCheck: new Date().toISOString()
    };
  }
}

function createFailedHealth(message: string): ServiceHealth {
  return {
    status: 'down',
    message,
    lastCheck: new Date().toISOString()
  };
}

function collectSystemMetrics() {
  const memUsage = process.memoryUsage();
  
  return {
    memory: {
      used: memUsage.heapUsed,
      total: memUsage.heapTotal,
      percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
    }
  };
}

function determineOverallStatus(services: HealthStatus['services']): 'healthy' | 'degraded' | 'unhealthy' {
  const statuses = Object.values(services).map(s => s.status);
  
  // Se algum serviço crítico está down
  if (services.database.status === 'down') {
    return 'unhealthy';
  }
  
  // Se algum serviço está down
  if (statuses.includes('down')) {
    return 'degraded';
  }
  
  // Se algum serviço está degraded
  if (statuses.includes('degraded')) {
    return 'degraded';
  }
  
  return 'healthy';
}
