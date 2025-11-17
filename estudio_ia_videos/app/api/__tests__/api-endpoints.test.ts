/**
 * 🧪 Testes de API - Endpoints de Geração de Fala e Monitoramento
 * Validação completa dos endpoints da API
 */

import { NextRequest } from 'next/server'
import { POST as generateSpeechPOST, GET as generateSpeechGET } from '../avatars/generate-speech/route'
import { GET as monitoringGET, POST as monitoringPOST } from '../monitoring/route'

// Mock dos serviços
jest.mock('../../lib/avatar-3d-pipeline')
jest.mock('../../lib/tts/tts-service')
jest.mock('../../lib/services/monitoring-service')

describe('API Endpoints Tests', () => {
  describe('/api/avatars/generate-speech', () => {
    describe('POST - Generate Speech', () => {
      it('deve gerar fala com parâmetros válidos', async () => {
        const requestBody = {
          text: 'Olá, como você está?',
          voice: 'pt-BR-female-1',
          speed: 1.0,
          pitch: 0.0,
          emotion: 'neutral',
          outputFormat: 'mp3',
          quality: 'high',
          enablePhonemes: true,
          lipSyncPrecision: 'high',
          unified: false
        }

        const request = new NextRequest('http://localhost:3000/api/avatars/generate-speech', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        })

        const response = await generateSpeechPOST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data).toHaveProperty('success', true)
        expect(data).toHaveProperty('audioUrl')
        expect(data).toHaveProperty('phonemes')
        expect(data).toHaveProperty('lipSyncData')
        expect(data).toHaveProperty('metadata')
        expect(data.metadata).toHaveProperty('duration')
        expect(data.metadata).toHaveProperty('provider')
      })

      it('deve processar com pipeline unificado quando solicitado', async () => {
        const requestBody = {
          text: 'Teste com pipeline unificado',
          voice: 'pt-BR-female-1',
          unified: true,
          avatarConfig: {
            model: 'realistic-female',
            background: 'office',
            lighting: 'natural',
            camera: 'medium-shot'
          },
          outputFormat: 'mp4',
          quality: 'high'
        }

        const request = new NextRequest('http://localhost:3000/api/avatars/generate-speech', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        })

        const response = await generateSpeechPOST(request)
        const data = await response.json()

        expect(response.status).toBe(202) // Accepted for async processing
        expect(data).toHaveProperty('success', true)
        expect(data).toHaveProperty('jobId')
        expect(data).toHaveProperty('status', 'processing')
        expect(data).toHaveProperty('estimatedDuration')
      })

      it('deve validar parâmetros obrigatórios', async () => {
        const invalidRequests = [
          {}, // Sem texto
          { text: '' }, // Texto vazio
          { text: 'a'.repeat(5001) }, // Texto muito longo
          { text: 'Teste', voice: 'invalid-voice' }, // Voz inválida
          { text: 'Teste', speed: 3.0 }, // Velocidade inválida
          { text: 'Teste', pitch: 2.0 }, // Pitch inválido
          { text: 'Teste', emotion: 'invalid-emotion' }, // Emoção inválida
          { text: 'Teste', outputFormat: 'invalid-format' }, // Formato inválido
          { text: 'Teste', quality: 'invalid-quality' }, // Qualidade inválida
          { text: 'Teste', lipSyncPrecision: 'invalid-precision' } // Precisão inválida
        ]

        for (const body of invalidRequests) {
          const request = new NextRequest('http://localhost:3000/api/avatars/generate-speech', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(body)
          })

          const response = await generateSpeechPOST(request)
          expect(response.status).toBe(400)
          
          const data = await response.json()
          expect(data).toHaveProperty('success', false)
          expect(data).toHaveProperty('error')
        }
      })

      it('deve tratar erro de método não permitido', async () => {
        const request = new NextRequest('http://localhost:3000/api/avatars/generate-speech', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: 'Teste' })
        })

        const response = await generateSpeechPOST(request)
        expect(response.status).toBe(405)
        
        const data = await response.json()
        expect(data).toHaveProperty('success', false)
        expect(data.error).toContain('Method not allowed')
      })

      it('deve tratar erro de JSON inválido', async () => {
        const request = new NextRequest('http://localhost:3000/api/avatars/generate-speech', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: 'invalid json'
        })

        const response = await generateSpeechPOST(request)
        expect(response.status).toBe(400)
        
        const data = await response.json()
        expect(data).toHaveProperty('success', false)
        expect(data.error).toContain('Invalid JSON')
      })

      it('deve estimar duração corretamente', async () => {
        const testCases = [
          { text: 'Olá', expectedMin: 0.5, expectedMax: 2 },
          { text: 'Este é um texto médio para teste', expectedMin: 2, expectedMax: 6 },
          { text: 'Este é um texto muito longo que deve levar mais tempo para ser processado e sintetizado em áudio de alta qualidade', expectedMin: 8, expectedMax: 15 }
        ]

        for (const { text, expectedMin, expectedMax } of testCases) {
          const requestBody = {
            text,
            voice: 'pt-BR-female-1',
            unified: true
          }

          const request = new NextRequest('http://localhost:3000/api/avatars/generate-speech', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
          })

          const response = await generateSpeechPOST(request)
          const data = await response.json()

          expect(response.status).toBe(202)
          expect(data.estimatedDuration).toBeGreaterThanOrEqual(expectedMin)
          expect(data.estimatedDuration).toBeLessThanOrEqual(expectedMax)
        }
      })
    })

    describe('GET - Job Status', () => {
      it('deve retornar status de job válido', async () => {
        const jobId = 'test-job-123'
        const request = new NextRequest(`http://localhost:3000/api/avatars/generate-speech?jobId=${jobId}`)

        const response = await generateSpeechGET(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data).toHaveProperty('success', true)
        expect(data).toHaveProperty('jobId', jobId)
        expect(data).toHaveProperty('status')
        expect(['pending', 'processing', 'completed', 'failed']).toContain(data.status)
      })

      it('deve retornar erro para job inexistente', async () => {
        const jobId = 'nonexistent-job'
        const request = new NextRequest(`http://localhost:3000/api/avatars/generate-speech?jobId=${jobId}`)

        const response = await generateSpeechGET(request)
        const data = await response.json()

        expect(response.status).toBe(404)
        expect(data).toHaveProperty('success', false)
        expect(data.error).toContain('Job not found')
      })

      it('deve retornar erro para jobId inválido', async () => {
        const request = new NextRequest('http://localhost:3000/api/avatars/generate-speech?jobId=')

        const response = await generateSpeechGET(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data).toHaveProperty('success', false)
        expect(data.error).toContain('Job ID is required')
      })

      it('deve incluir progresso para job em processamento', async () => {
        const jobId = 'processing-job-123'
        const request = new NextRequest(`http://localhost:3000/api/avatars/generate-speech?jobId=${jobId}`)

        const response = await generateSpeechGET(request)
        const data = await response.json()

        if (data.status === 'processing') {
          expect(data).toHaveProperty('progress')
          expect(data.progress).toBeGreaterThanOrEqual(0)
          expect(data.progress).toBeLessThanOrEqual(1)
        }
      })

      it('deve incluir resultado para job completo', async () => {
        const jobId = 'completed-job-123'
        const request = new NextRequest(`http://localhost:3000/api/avatars/generate-speech?jobId=${jobId}`)

        const response = await generateSpeechGET(request)
        const data = await response.json()

        if (data.status === 'completed') {
          expect(data).toHaveProperty('result')
          expect(data.result).toHaveProperty('videoUrl')
          expect(data.result).toHaveProperty('audioUrl')
          expect(data.result).toHaveProperty('lipSyncData')
        }
      })
    })
  })

  describe('/api/monitoring', () => {
    describe('GET - Monitoring Data', () => {
      it('deve retornar relatório de saúde', async () => {
        const request = new NextRequest('http://localhost:3000/api/monitoring?type=health')

        const response = await monitoringGET(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data).toHaveProperty('success', true)
        expect(data).toHaveProperty('data')
        expect(data.data).toHaveProperty('status')
        expect(data.data).toHaveProperty('services')
        expect(data.data).toHaveProperty('metrics')
        expect(data.data).toHaveProperty('alerts')
        expect(['healthy', 'degraded', 'unhealthy']).toContain(data.data.status)
      })

      it('deve retornar métricas atuais', async () => {
        const request = new NextRequest('http://localhost:3000/api/monitoring?type=metrics')

        const response = await monitoringGET(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data).toHaveProperty('success', true)
        expect(data).toHaveProperty('data')
        expect(data.data).toHaveProperty('tts')
        expect(data.data).toHaveProperty('lipSync')
        expect(data.data).toHaveProperty('rendering')
        expect(data.data).toHaveProperty('pipeline')
        expect(data.data).toHaveProperty('system')
        expect(data.data).toHaveProperty('cache')
      })

      it('deve retornar histórico de métricas', async () => {
        const request = new NextRequest('http://localhost:3000/api/monitoring?type=history&hours=24')

        const response = await monitoringGET(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data).toHaveProperty('success', true)
        expect(data).toHaveProperty('data')
        expect(Array.isArray(data.data)).toBe(true)
        
        if (data.data.length > 0) {
          expect(data.data[0]).toHaveProperty('timestamp')
          expect(data.data[0]).toHaveProperty('metrics')
        }
      })

      it('deve retornar logs com filtros', async () => {
        const request = new NextRequest('http://localhost:3000/api/monitoring?type=logs&level=error&limit=50')

        const response = await monitoringGET(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data).toHaveProperty('success', true)
        expect(data).toHaveProperty('data')
        expect(Array.isArray(data.data)).toBe(true)
        expect(data.data.length).toBeLessThanOrEqual(50)
        
        data.data.forEach((log: any) => {
          expect(log).toHaveProperty('timestamp')
          expect(log).toHaveProperty('level')
          expect(log).toHaveProperty('message')
          expect(log.level).toBe('error')
        })
      })

      it('deve retornar alertas ativos', async () => {
        const request = new NextRequest('http://localhost:3000/api/monitoring?type=alerts')

        const response = await monitoringGET(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data).toHaveProperty('success', true)
        expect(data).toHaveProperty('data')
        expect(Array.isArray(data.data)).toBe(true)
        
        data.data.forEach((alert: any) => {
          expect(alert).toHaveProperty('id')
          expect(alert).toHaveProperty('type')
          expect(alert).toHaveProperty('severity')
          expect(alert).toHaveProperty('message')
          expect(alert).toHaveProperty('timestamp')
          expect(['low', 'medium', 'high', 'critical']).toContain(alert.severity)
        })
      })

      it('deve retornar estatísticas resumidas', async () => {
        const request = new NextRequest('http://localhost:3000/api/monitoring?type=summary')

        const response = await monitoringGET(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data).toHaveProperty('success', true)
        expect(data).toHaveProperty('data')
        expect(data.data).toHaveProperty('totalRequests')
        expect(data.data).toHaveProperty('successRate')
        expect(data.data).toHaveProperty('averageLatency')
        expect(data.data).toHaveProperty('activeJobs')
        expect(data.data).toHaveProperty('systemHealth')
      })

      it('deve validar parâmetros de consulta', async () => {
        const invalidRequests = [
          'http://localhost:3000/api/monitoring?type=invalid',
          'http://localhost:3000/api/monitoring?type=history&hours=invalid',
          'http://localhost:3000/api/monitoring?type=logs&level=invalid',
          'http://localhost:3000/api/monitoring?type=logs&limit=invalid'
        ]

        for (const url of invalidRequests) {
          const request = new NextRequest(url)
          const response = await monitoringGET(request)
          
          expect(response.status).toBe(400)
          
          const data = await response.json()
          expect(data).toHaveProperty('success', false)
          expect(data).toHaveProperty('error')
        }
      })
    })

    describe('POST - Monitoring Actions', () => {
      it('deve resolver alerta', async () => {
        const requestBody = {
          action: 'resolve_alert',
          alertId: 'alert-123',
          reason: 'Issue resolved manually'
        }

        const request = new NextRequest('http://localhost:3000/api/monitoring', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        })

        const response = await monitoringPOST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data).toHaveProperty('success', true)
        expect(data).toHaveProperty('message')
        expect(data.message).toContain('resolved')
      })

      it('deve limpar dados antigos', async () => {
        const requestBody = {
          action: 'cleanup',
          olderThan: '7d'
        }

        const request = new NextRequest('http://localhost:3000/api/monitoring', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        })

        const response = await monitoringPOST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data).toHaveProperty('success', true)
        expect(data).toHaveProperty('message')
        expect(data).toHaveProperty('deletedCount')
        expect(typeof data.deletedCount).toBe('number')
      })

      it('deve atualizar configuração', async () => {
        const requestBody = {
          action: 'update_config',
          config: {
            logLevel: 'debug',
            metricsRetention: '30d',
            alertThresholds: {
              errorRate: 0.05,
              latency: 5000
            }
          }
        }

        const request = new NextRequest('http://localhost:3000/api/monitoring', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        })

        const response = await monitoringPOST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data).toHaveProperty('success', true)
        expect(data).toHaveProperty('message')
        expect(data.message).toContain('updated')
      })

      it('deve registrar evento customizado', async () => {
        const requestBody = {
          action: 'log_event',
          event: {
            type: 'custom_event',
            level: 'info',
            message: 'Custom test event',
            metadata: {
              source: 'api_test',
              category: 'testing'
            }
          }
        }

        const request = new NextRequest('http://localhost:3000/api/monitoring', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        })

        const response = await monitoringPOST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data).toHaveProperty('success', true)
        expect(data).toHaveProperty('message')
        expect(data.message).toContain('logged')
      })

      it('deve validar ações', async () => {
        const invalidRequests = [
          {}, // Sem ação
          { action: 'invalid_action' }, // Ação inválida
          { action: 'resolve_alert' }, // Sem alertId
          { action: 'cleanup', olderThan: 'invalid' }, // Período inválido
          { action: 'update_config' }, // Sem config
          { action: 'log_event' } // Sem event
        ]

        for (const body of invalidRequests) {
          const request = new NextRequest('http://localhost:3000/api/monitoring', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(body)
          })

          const response = await monitoringPOST(request)
          expect(response.status).toBe(400)
          
          const data = await response.json()
          expect(data).toHaveProperty('success', false)
          expect(data).toHaveProperty('error')
        }
      })
    })
  })

  describe('Error Handling', () => {
    it('deve tratar erros internos graciosamente', async () => {
      // Simular erro interno mockando uma falha
      const originalConsoleError = console.error
      console.error = jest.fn()

      // Mock que força erro
      jest.doMock('../../lib/enhanced-tts-service', () => {
        throw new Error('Internal service error')
      })

      const request = new NextRequest('http://localhost:3000/api/avatars/generate-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: 'Teste de erro',
          voice: 'pt-BR-female-1'
        })
      })

      const response = await generateSpeechPOST(request)
      expect(response.status).toBe(500)
      
      const data = await response.json()
      expect(data).toHaveProperty('success', false)
      expect(data).toHaveProperty('error')

      console.error = originalConsoleError
    })

    it('deve incluir headers CORS apropriados', async () => {
      const request = new NextRequest('http://localhost:3000/api/monitoring?type=health')

      const response = await monitoringGET(request)

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET')
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST')
    })

    it('deve limitar taxa de requisições', async () => {
      // Simular muitas requisições rapidamente
      const requests = Array.from({ length: 100 }, () => 
        new NextRequest('http://localhost:3000/api/avatars/generate-speech', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: 'Teste de rate limit',
            voice: 'pt-BR-female-1'
          })
        })
      )

      const responses = await Promise.all(
        requests.map(request => generateSpeechPOST(request))
      )

      // Algumas requisições devem ser limitadas
      const rateLimitedResponses = responses.filter(response => response.status === 429)
      expect(rateLimitedResponses.length).toBeGreaterThan(0)
    })
  })

  describe('Performance', () => {
    it('deve responder rapidamente para requisições simples', async () => {
      const request = new NextRequest('http://localhost:3000/api/monitoring?type=health')

      const startTime = Date.now()
      const response = await monitoringGET(request)
      const endTime = Date.now()

      expect(response.status).toBe(200)
      expect(endTime - startTime).toBeLessThan(1000) // Menos de 1 segundo
    })

    it('deve comprimir respostas grandes', async () => {
      const request = new NextRequest('http://localhost:3000/api/monitoring?type=history&hours=168') // 1 semana

      const response = await monitoringGET(request)
      
      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Encoding')).toBe('gzip')
    })
  })
})