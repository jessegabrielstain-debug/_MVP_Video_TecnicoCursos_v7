import { NextResponse } from 'next/server'
import { isRedisConnected, getRedisClient } from '@/lib/services/redis-service'
import { detectSlowQueries } from '@/lib/monitoring/slow-queries-detector'
import { prisma } from '@/lib/prisma'

function checkStorage() {
  const provider = (process.env.STORAGE_PROVIDER || 'local').toLowerCase()
  if (provider === 's3') {
    return Boolean(process.env.AWS_S3_BUCKET && process.env.AWS_REGION)
  }
  if (provider === 'supabase') {
    return Boolean((process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) && process.env.SUPABASE_SERVICE_ROLE_KEY)
  }
  return true
}

async function checkRedis() {
  try {
    const connected = await isRedisConnected()
    if (!connected) {
      return {
        status: 'unavailable',
        latency: null,
        memory: null,
        connections: null,
        error: 'Redis não está conectado'
      }
    }

    const redis = getRedisClient()
    const start = Date.now()
    
    // Ping Redis para medir latência
    await redis.ping()
    const latency = Date.now() - start

    // Obter informações do servidor
    const info = await redis.info('server')
    const memoryInfo = await redis.info('memory')
    const clientsInfo = await redis.info('clients')
    
    // Extrair métricas
    const uptimeMatch = info.match(/uptime_in_seconds:(\d+)/)
    const usedMemoryMatch = memoryInfo.match(/used_memory_human:(.+)/)
    const connectedClientsMatch = clientsInfo.match(/connected_clients:(\d+)/)
    
    const uptime = uptimeMatch ? parseInt(uptimeMatch[1], 10) : null
    const usedMemory = usedMemoryMatch ? usedMemoryMatch[1].trim() : null
    const connectedClients = connectedClientsMatch ? parseInt(connectedClientsMatch[1], 10) : null

    return {
      status: 'healthy',
      latency,
      memory: usedMemory,
      connections: connectedClients,
      uptime,
      error: null
    }
  } catch (error) {
    return {
      status: 'error',
      latency: null,
      memory: null,
      connections: null,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao verificar Redis'
    }
  }
}

async function checkDatabase() {
  try {
    const start = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const latency = Date.now() - start
    
    // Detectar slow queries
    const slowQueries = await detectSlowQueries(1000)
    
    return {
      status: 'ok',
      latency,
      slowQueries,
      error: null
    }
  } catch (error) {
    return {
      status: 'error',
      latency: null,
      slowQueries: 0,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao verificar database'
    }
  }
}

export async function GET() {
  const [storageReady, redisCheck, databaseCheck] = await Promise.all([
    Promise.resolve(checkStorage()),
    checkRedis().catch(() => ({ status: 'unavailable', latency: null, memory: null, connections: null, error: 'Redis não configurado' })),
    checkDatabase().catch(() => ({ status: 'error', latency: null, slowQueries: 0, error: 'Erro ao verificar database' }))
  ])

  const status = {
    app: 'ok',
    storageProvider: (process.env.STORAGE_PROVIDER || 'local').toLowerCase(),
    storageReady,
    nodeVersion: process.version,
    uptimeSeconds: Math.floor(process.uptime()),
    redis: redisCheck,
    database: databaseCheck
  }
  
  const code = status.storageReady && databaseCheck.status === 'ok' ? 200 : 503
  return NextResponse.json(status, { status: code })
}

