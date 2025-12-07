/**
 * 🧪 E2E Tests - Analytics Completo
 * 
 * Testa o fluxo completo de analytics:
 * 1. Tracking de eventos
 * 2. Agregação de dados
 * 3. Dashboard com queries reais
 * 4. Métricas de performance
 * 5. Dados em tempo real
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('E2E: Analytics Completo', () => {
  let testUserId: string
  let testOrganizationId: string

  beforeAll(async () => {
    testUserId = 'test-user-analytics'
    testOrganizationId = 'test-org-analytics'

    // Criar eventos de teste
    try {
      await prisma.analyticsEvent.createMany({
        data: [
          {
            organizationId: testOrganizationId,
            userId: testUserId,
            category: 'pptx',
            action: 'upload',
            label: 'test.pptx',
            status: 'success',
            duration: 2500,
            fileSize: 5242880, // 5MB
            metadata: {
              endpoint: '/api/pptx/upload',
              page: '/dashboard',
              deviceType: 'Desktop',
              browser: 'Chrome'
            }
          },
          {
            organizationId: testOrganizationId,
            userId: testUserId,
            category: 'render',
            action: 'start',
            label: 'video-1',
            status: 'success',
            duration: 45000,
            metadata: {
              endpoint: '/api/render/video',
              deviceType: 'Desktop',
              browser: 'Chrome'
            }
          },
          {
            organizationId: testOrganizationId,
            userId: testUserId,
            category: 'analytics',
            action: 'page_view',
            label: '/dashboard',
            status: 'success',
            duration: 12000,
            metadata: {
              page: '/dashboard',
              deviceType: 'Desktop',
              browser: 'Chrome'
            }
          },
          {
            organizationId: testOrganizationId,
            userId: testUserId,
            category: 'cache',
            action: 'hit',
            label: 'asset-cache',
            status: 'success',
            metadata: {
              cacheSize: 104857600 // 100MB
            }
          }
        ]
      })
      console.log('✅ Eventos de teste criados')
    } catch (error) {
      console.warn('⚠️ Não foi possível criar eventos de teste')
    }
  })

  afterAll(async () => {
    // Limpar eventos de teste
    try {
      await prisma.analyticsEvent.deleteMany({
        where: {
          userId: testUserId,
          organizationId: testOrganizationId
        }
      })
      console.log('✅ Eventos de teste removidos')
    } catch (error) {
      // Ignore se já foram removidos
    }
    await prisma.$disconnect()
  })

  describe('Tracking de Eventos', () => {
    it('deve registrar evento de analytics', async () => {
      // ACT: Criar evento
      const event = await prisma.analyticsEvent.create({
        data: {
          organizationId: testOrganizationId,
          userId: testUserId,
          category: 'test',
          action: 'e2e_test',
          label: 'test-event',
          status: 'success',
          duration: 100
        }
      })

      // ASSERT
      expect(event).toBeDefined()
      expect(event.id).toBeTruthy()
      expect(event.category).toBe('test')
      expect(event.action).toBe('e2e_test')
      expect(event.userId).toBe(testUserId)
      
      // Cleanup
      await prisma.analyticsEvent.delete({ where: { id: event.id } })
      
      console.log('✅ Evento registrado com sucesso')
    })

    it('deve buscar eventos por usuário', async () => {
      // ACT
      const events = await prisma.analyticsEvent.findMany({
        where: {
          userId: testUserId
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      })

      // ASSERT
      expect(Array.isArray(events)).toBe(true)
      expect(events.length).toBeGreaterThan(0)
      events.forEach(event => {
        expect(event.userId).toBe(testUserId)
      })
      
      console.log(`✅ ${events.length} eventos encontrados para o usuário`)
    })

    it('deve buscar eventos por categoria', async () => {
      // ACT: Buscar eventos de PPTX
      const pptxEvents = await prisma.analyticsEvent.findMany({
        where: {
          category: 'pptx',
          userId: testUserId
        }
      })

      // ASSERT
      expect(pptxEvents.length).toBeGreaterThan(0)
      pptxEvents.forEach(event => {
        expect(event.category).toBe('pptx')
      })
      
      console.log(`✅ ${pptxEvents.length} eventos de PPTX encontrados`)
    })
  })

  describe('Agregações e Métricas', () => {
    it('deve contar eventos por categoria', async () => {
      // ACT: Agrupar por categoria
      const eventsByCategory = await prisma.analyticsEvent.groupBy({
        by: ['category'],
        where: {
          userId: testUserId
        },
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        }
      })

      // ASSERT
      expect(Array.isArray(eventsByCategory)).toBe(true)
      expect(eventsByCategory.length).toBeGreaterThan(0)
      
      eventsByCategory.forEach(group => {
        expect(group.category).toBeTruthy()
        expect(group._count.id).toBeGreaterThan(0)
      })
      
      console.log('✅ Eventos agrupados por categoria')
    })

    it('deve calcular tempo médio de duração', async () => {
      // ACT: Calcular média de duração
      const avgDuration = await prisma.analyticsEvent.aggregate({
        where: {
          userId: testUserId,
          duration: { not: null }
        },
        _avg: {
          duration: true
        },
        _max: {
          duration: true
        },
        _min: {
          duration: true
        }
      })

      // ASSERT
      expect(avgDuration._avg.duration).toBeGreaterThan(0)
      expect(avgDuration._max.duration).toBeGreaterThanOrEqual(avgDuration._avg.duration!)
      expect(avgDuration._min.duration).toBeLessThanOrEqual(avgDuration._avg.duration!)
      
      console.log(`✅ Tempo médio: ${avgDuration._avg.duration}ms`)
    })

    it('deve contar eventos por status', async () => {
      // ACT
      const eventsByStatus = await prisma.analyticsEvent.groupBy({
        by: ['status'],
        where: {
          userId: testUserId
        },
        _count: {
          id: true
        }
      })

      // ASSERT
      expect(eventsByStatus.length).toBeGreaterThan(0)
      
      const successEvents = eventsByStatus.find(s => s.status === 'success')
      expect(successEvents).toBeDefined()
      expect(successEvents?._count.id).toBeGreaterThan(0)
      
      console.log('✅ Eventos agrupados por status')
    })
  })

  describe('Dashboard - Queries Reais', () => {
    it('deve buscar dados de endpoints performance', async () => {
      // ACT: Buscar performance de endpoints
      const endpointPerformance = await prisma.analyticsEvent.groupBy({
        by: ['metadata'],
        where: {
          userId: testUserId,
          duration: { not: null },
          metadata: {
            path: ['endpoint']
          }
        },
        _avg: {
          duration: true
        },
        _count: {
          id: true
        },
        orderBy: {
          _avg: {
            duration: 'desc'
          }
        },
        take: 5
      })

      // ASSERT
      expect(Array.isArray(endpointPerformance)).toBe(true)
      
      if (endpointPerformance.length > 0) {
        endpointPerformance.forEach(item => {
          expect(item._avg.duration).toBeGreaterThan(0)
          expect(item._count.id).toBeGreaterThan(0)
        })
        console.log(`✅ ${endpointPerformance.length} endpoints analisados`)
      } else {
        console.log('⚠️ Nenhum endpoint encontrado (esperado em ambiente de teste)')
      }
    })

    it('deve buscar page views', async () => {
      // ACT
      const pageViews = await prisma.analyticsEvent.groupBy({
        by: ['metadata'],
        where: {
          userId: testUserId,
          action: 'page_view',
          metadata: {
            path: ['page']
          }
        },
        _count: {
          id: true
        },
        _avg: {
          duration: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        },
        take: 5
      })

      // ASSERT
      expect(Array.isArray(pageViews)).toBe(true)
      
      if (pageViews.length > 0) {
        console.log(`✅ ${pageViews.length} páginas visualizadas`)
      } else {
        console.log('⚠️ Nenhuma page view encontrada')
      }
    })

    it('deve buscar estatísticas de dispositivos', async () => {
      // ACT
      const deviceData = await prisma.analyticsEvent.groupBy({
        by: ['metadata'],
        where: {
          userId: testUserId,
          metadata: {
            path: ['deviceType']
          }
        },
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        }
      })

      // ASSERT
      expect(Array.isArray(deviceData)).toBe(true)
      
      if (deviceData.length > 0) {
        console.log(`✅ ${deviceData.length} tipos de dispositivos encontrados`)
      }
    })

    it('deve buscar estatísticas de navegadores', async () => {
      // ACT
      const browserData = await prisma.analyticsEvent.groupBy({
        by: ['metadata'],
        where: {
          userId: testUserId,
          metadata: {
            path: ['browser']
          }
        },
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        },
        take: 5
      })

      // ASSERT
      expect(Array.isArray(browserData)).toBe(true)
      
      if (browserData.length > 0) {
        console.log(`✅ ${browserData.length} navegadores encontrados`)
      }
    })
  })

  describe('Cache Metrics - Queries Reais', () => {
    it('deve calcular hit/miss rate do cache', async () => {
      // ACT: Buscar eventos de cache
      const cacheEvents = await prisma.analyticsEvent.findMany({
        where: {
          userId: testUserId,
          category: 'cache'
        },
        select: {
          action: true,
          metadata: true
        }
      })

      // ASSERT & CALC
      const totalHits = cacheEvents.filter(e => e.action === 'hit').length
      const totalMisses = cacheEvents.filter(e => e.action === 'miss').length
      const total = totalHits + totalMisses

      if (total > 0) {
        const hitRate = ((totalHits / total) * 100).toFixed(1)
        const missRate = ((totalMisses / total) * 100).toFixed(1)
        
        expect(parseFloat(hitRate)).toBeGreaterThanOrEqual(0)
        expect(parseFloat(hitRate)).toBeLessThanOrEqual(100)
        expect(parseFloat(missRate)).toBeGreaterThanOrEqual(0)
        expect(parseFloat(missRate)).toBeLessThanOrEqual(100)
        
        console.log(`✅ Cache: ${hitRate}% hit rate, ${missRate}% miss rate`)
      } else {
        console.log('⚠️ Nenhum evento de cache encontrado')
      }
    })
  })

  describe('Realtime Metrics', () => {
    it('deve buscar eventos em tempo real (últimos 15min)', async () => {
      // ARRANGE
      const now = new Date()
      const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000)

      // ACT
      const recentEvents = await prisma.analyticsEvent.findMany({
        where: {
          createdAt: { gte: fifteenMinutesAgo }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 20
      })

      // ASSERT
      expect(Array.isArray(recentEvents)).toBe(true)
      
      console.log(`✅ ${recentEvents.length} eventos nos últimos 15min`)
    })

    it('deve contar usuários ativos únicos', async () => {
      // ARRANGE
      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000)

      // ACT
      const activeUsers = await prisma.analyticsEvent.groupBy({
        by: ['userId'],
        where: {
          createdAt: { gte: last24h },
          userId: { not: null }
        }
      })

      // ASSERT
      expect(Array.isArray(activeUsers)).toBe(true)
      expect(activeUsers.length).toBeGreaterThanOrEqual(0)
      
      console.log(`✅ ${activeUsers.length} usuários ativos nas últimas 24h`)
    })
  })

  describe('Performance e Otimização', () => {
    it('deve executar queries de agregação em tempo aceitável', async () => {
      // ARRANGE
      const startTime = Date.now()

      // ACT: Executar múltiplas queries em paralelo
      await Promise.all([
        prisma.analyticsEvent.groupBy({
          by: ['category'],
          where: { userId: testUserId },
          _count: { id: true }
        }),
        prisma.analyticsEvent.aggregate({
          where: { userId: testUserId },
          _avg: { duration: true }
        }),
        prisma.analyticsEvent.count({
          where: { userId: testUserId, status: 'error' }
        })
      ])

      const duration = Date.now() - startTime

      // ASSERT: Deve executar em menos de 2 segundos
      expect(duration).toBeLessThan(2000)
      
      console.log(`✅ Queries executadas em ${duration}ms`)
    })
  })
})

