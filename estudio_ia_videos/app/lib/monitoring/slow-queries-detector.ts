/**
 * Slow Queries Detector
 * Detecta queries lentas no PostgreSQL usando pg_stat_statements
 */

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { getRedisClient } from '@/lib/services/redis-service'

export interface SlowQuery {
  queryId: string
  query: string
  calls: number
  avgTime: number
  maxTime: number
  totalTime: number
  timestamp: string
}

/**
 * Detecta queries lentas no PostgreSQL
 * @param thresholdMs Limite em milissegundos para considerar uma query lenta (padrão: 1000ms)
 * @returns Número de queries lentas detectadas
 */
export async function detectSlowQueries(thresholdMs: number = 1000): Promise<number> {
  try {
    // Verificar se pg_stat_statements está habilitado
    const extensionCheck = await prisma.$queryRaw<Array<{ extname: string }>>`
      SELECT extname FROM pg_extension WHERE extname = 'pg_stat_statements'
    `

    if (extensionCheck.length === 0) {
      // Tentar habilitar a extensão
      try {
        await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS pg_stat_statements`
        logger.info('Extensão pg_stat_statements habilitada', { component: 'SlowQueriesDetector' })
      } catch (error) {
        logger.warn('Não foi possível habilitar pg_stat_statements', error as Error, {
          component: 'SlowQueriesDetector',
          message: 'pg_stat_statements pode não estar disponível ou requer privilégios de superusuário'
        })
        return 0
      }
    }

    // Buscar queries com tempo médio > thresholdMs
    const slowQueries = await prisma.$queryRaw<Array<{
      queryid: bigint
      query: string
      calls: bigint
      mean_exec_time: number
      max_exec_time: number
      total_exec_time: number
    }>>`
      SELECT 
        queryid,
        query,
        calls,
        mean_exec_time,
        max_exec_time,
        total_exec_time
      FROM pg_stat_statements
      WHERE mean_exec_time > ${thresholdMs}
      ORDER BY mean_exec_time DESC
      LIMIT 10
    `

    // Armazenar queries lentas no Redis para análise
    if (slowQueries.length > 0) {
      const cacheKey = 'monitoring:slow_queries'
      const queriesData: SlowQuery[] = slowQueries.map(q => ({
        queryId: q.queryid?.toString() || 'unknown',
        query: q.query?.substring(0, 200) || '', // Limitar tamanho
        calls: Number(q.calls),
        avgTime: Math.round(q.mean_exec_time),
        maxTime: Math.round(q.max_exec_time),
        totalTime: Math.round(q.total_exec_time),
        timestamp: new Date().toISOString(),
      }))

      try {
        const redis = getRedisClient()
        await redis.setex(cacheKey, 3600, JSON.stringify(queriesData)) // Cache de 1 hora
      } catch (redisError) {
        // Redis não disponível, continuar sem cache
        logger.info('Não foi possível cachear slow queries no Redis', { component: 'SlowQueriesDetector' })
      }

      // Registrar alerta se houver muitas queries lentas
      if (slowQueries.length >= 5) {
        logger.warn(`Detectadas ${slowQueries.length} queries lentas`, new Error('Slow queries detected'), {
          component: 'SlowQueriesDetector',
          count: slowQueries.length,
          threshold: thresholdMs
        })
      }

      logger.info(`Slow queries detectadas: ${slowQueries.length}`, {
        component: 'SlowQueriesDetector',
        count: slowQueries.length,
        threshold: thresholdMs
      })
    }

    return slowQueries.length
  } catch (error) {
    logger.error('Erro ao detectar slow queries', error as Error, { component: 'SlowQueriesDetector' })
    return 0
  }
}

/**
 * Obtém as queries lentas armazenadas no cache
 * @returns Lista de queries lentas ou array vazio
 */
export async function getCachedSlowQueries(): Promise<SlowQuery[]> {
  try {
    const redis = getRedisClient()
    const cacheKey = 'monitoring:slow_queries'
    const cached = await redis.get(cacheKey)
    
    if (cached) {
      return JSON.parse(cached) as SlowQuery[]
    }
    
    return []
  } catch (error) {
    logger.error('Erro ao obter slow queries do cache', error as Error, { component: 'SlowQueriesDetector' })
    return []
  }
}
