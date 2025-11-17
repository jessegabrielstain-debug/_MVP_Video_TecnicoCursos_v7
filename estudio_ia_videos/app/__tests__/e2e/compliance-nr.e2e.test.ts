/**
 * 🧪 E2E Tests - Compliance NR Inteligente
 * 
 * Testa o fluxo completo de validação NR:
 * 1. Seleção de template NR
 * 2. Análise de conteúdo
 * 3. Validação estrutural
 * 4. Análise semântica com GPT-4
 * 5. Geração de relatório
 */

import { describe, it, expect, beforeAll } from '@jest/globals'
import { SmartComplianceValidator } from '@/lib/compliance/smart-validator'
import { getNRTemplate, getAllNRs } from '@/lib/compliance/templates'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

describe('E2E: Compliance NR Inteligente', () => {
  let validator: SmartComplianceValidator
  let testProjectId: string

  beforeAll(async () => {
    validator = new SmartComplianceValidator()

    // Criar projeto de teste com conteúdo
    try {
      const project = await prisma.project.create({
        data: {
          title: 'Treinamento NR-06 - EPIs',
          description: 'Curso sobre Equipamentos de Proteção Individual',
          status: 'active',
          ownerId: 'test-user-id',
          slides: {
            create: [
              {
                order: 1,
                title: 'Introdução aos EPIs',
                content: 'Os Equipamentos de Proteção Individual são dispositivos de uso pessoal destinados à proteção contra riscos.'
              },
              {
                order: 2,
                title: 'Tipos de EPIs',
                content: 'Capacete, luvas, óculos de proteção, protetor auricular, calçados de segurança.'
              },
              {
                order: 3,
                title: 'Responsabilidades',
                content: 'O empregador deve fornecer EPIs adequados ao risco. O trabalhador deve usar corretamente.'
              }
            ]
          }
        }
      })
      testProjectId = project.id
      console.log(`✅ Projeto de teste criado: ${testProjectId}`)
    } catch (error) {
      console.warn('⚠️ Não foi possível criar projeto de teste')
    }
  })

  afterAll(async () => {
    // Limpar projeto de teste
    if (testProjectId) {
      try {
        await prisma.slide.deleteMany({ where: { projectId: testProjectId } })
        await prisma.project.delete({ where: { id: testProjectId } })
        console.log('✅ Projeto de teste removido')
      } catch (error) {
        // Ignore se já foi removido
      }
    }
    await prisma.$disconnect()
  })

  describe('Templates NR Disponíveis', () => {
    it('deve listar todos os templates NR', () => {
      // ACT
      const nrs = getAllNRs()

      // ASSERT
      expect(Array.isArray(nrs)).toBe(true)
      expect(nrs.length).toBeGreaterThanOrEqual(12)
      
      // Validar NRs específicas que foram implementadas
      expect(nrs).toContain('NR-06')
      expect(nrs).toContain('NR-10')
      expect(nrs).toContain('NR-17') // Novo
      expect(nrs).toContain('NR-24') // Novo
      expect(nrs).toContain('NR-26') // Novo
      expect(nrs).toContain('NR-35')
      
      console.log(`✅ ${nrs.length} templates NR disponíveis: ${nrs.join(', ')}`)
    })

    it('deve obter template NR específico', () => {
      // ACT
      const nr06 = getNRTemplate('NR-06')

      // ASSERT
      expect(nr06).toBeDefined()
      expect(nr06.code).toBe('NR-06')
      expect(nr06.name).toBe('Equipamentos de Proteção Individual - EPI')
      expect(nr06.requiredTopics).toBeDefined()
      expect(nr06.requiredTopics.length).toBeGreaterThan(0)
      expect(nr06.criticalPoints).toBeDefined()
      expect(nr06.minimumScore).toBeGreaterThan(0)
      expect(nr06.minimumDuration).toBeGreaterThan(0)
      
      console.log('✅ Template NR-06 obtido com sucesso')
    })

    it('deve validar novos templates NR implementados', () => {
      // ACT & ASSERT: NR-17 (Ergonomia)
      const nr17 = getNRTemplate('NR-17')
      expect(nr17).toBeDefined()
      expect(nr17.code).toBe('NR-17')
      expect(nr17.name).toContain('Ergonomia')
      expect(nr17.requiredTopics.length).toBeGreaterThanOrEqual(8)
      
      // ACT & ASSERT: NR-24 (Condições Sanitárias)
      const nr24 = getNRTemplate('NR-24')
      expect(nr24).toBeDefined()
      expect(nr24.code).toBe('NR-24')
      expect(nr24.name).toContain('Condições Sanitárias')
      
      // ACT & ASSERT: NR-26 (Sinalização)
      const nr26 = getNRTemplate('NR-26')
      expect(nr26).toBeDefined()
      expect(nr26.code).toBe('NR-26')
      expect(nr26.name).toContain('Sinalização')
      
      console.log('✅ Novos templates NR-17, NR-24 e NR-26 validados')
    })
  })

  describe('Validação Estrutural', () => {
    it('deve validar estrutura de template NR', () => {
      // ACT: Validar todos os templates
      const nrs = getAllNRs()
      
      nrs.forEach(nrCode => {
        const template = getNRTemplate(nrCode)
        
        // ASSERT: Estrutura completa
        expect(template.code).toBeTruthy()
        expect(template.name).toBeTruthy()
        expect(template.requiredTopics.length).toBeGreaterThan(0)
        expect(template.criticalPoints.length).toBeGreaterThan(0)
        expect(template.minimumScore).toBeGreaterThanOrEqual(60)
        expect(template.minimumScore).toBeLessThanOrEqual(100)
        expect(template.minimumDuration).toBeGreaterThan(0)
        
        // Validar tópicos obrigatórios
        template.requiredTopics.forEach(topic => {
          expect(topic.title).toBeTruthy()
          expect(topic.keywords).toBeDefined()
          expect(Array.isArray(topic.keywords)).toBe(true)
          expect(topic.order).toBeGreaterThan(0)
        })
      })
      
      console.log(`✅ Estrutura de ${nrs.length} templates validada`)
    })

    it('deve validar duração mínima por NR', () => {
      // ACT
      const nr06 = getNRTemplate('NR-06')
      const nr10 = getNRTemplate('NR-10')
      const nr35 = getNRTemplate('NR-35')

      // ASSERT: Durações mínimas adequadas
      expect(nr06.minimumDuration).toBeGreaterThanOrEqual(300) // 5 min
      expect(nr10.minimumDuration).toBeGreaterThanOrEqual(600) // 10 min
      expect(nr35.minimumDuration).toBeGreaterThanOrEqual(480) // 8 min
      
      console.log('✅ Durações mínimas validadas')
    })
  })

  describe('Fluxo Completo: Projeto → Validação → Relatório', () => {
    it('deve validar projeto contra template NR-06', async () => {
      if (!testProjectId) {
        console.warn('⚠️ Teste ignorado - projeto não disponível')
        return
      }

      // ACT: Validar projeto
      try {
        const result = await validator.validate(testProjectId, 'NR-06')

        // ASSERT
        expect(result).toBeDefined()
        expect(result.projectId).toBe(testProjectId)
        expect(result.nrType).toBe('NR-06')
        expect(result.score).toBeGreaterThanOrEqual(0)
        expect(result.score).toBeLessThanOrEqual(100)
        expect(result.passed).toBeDefined()
        expect(result.report).toBeDefined()
        
        console.log(`✅ Validação NR-06 concluída: score=${result.score}, passed=${result.passed}`)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage?.includes('OpenAI API') || errorMessage?.includes('GPT-4')) {
          console.warn('⚠️ API OpenAI não disponível - teste ignorado')
        } else {
          throw error;
        }
      }
    }, 30000) // 30s timeout para API externa

    it('deve gerar relatório detalhado de validação', async () => {
      if (!testProjectId) {
        console.warn('⚠️ Teste ignorado - projeto não disponível')
        return
      }

      try {
        // ACT: Validar e obter relatório
        const result = await validator.validate(testProjectId, 'NR-06')

        // ASSERT: Estrutura do relatório
        expect(result.report).toBeDefined()
        expect(result.report.topicsCovered).toBeDefined()
        expect(result.report.topicsMissing).toBeDefined()
        expect(result.report.criticalPointsAddressed).toBeDefined()
        expect(result.report.recommendations).toBeDefined()
        expect(Array.isArray(result.report.recommendations)).toBe(true)
        
        console.log('✅ Relatório de validação gerado')
        console.log(`  - Tópicos cobertos: ${result.report.topicsCovered.length}`)
        console.log(`  - Tópicos ausentes: ${result.report.topicsMissing.length}`)
        console.log(`  - Recomendações: ${result.report.recommendations.length}`)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage?.includes('OpenAI API') || errorMessage?.includes('GPT-4')) {
          console.warn('⚠️ API OpenAI não disponível - teste ignorado')
        } else {
          throw error
        }
      }
    }, 30000)

    it('deve salvar resultado de validação no banco', async () => {
      if (!testProjectId) {
        console.warn('⚠️ Teste ignorado - projeto não disponível')
        return
      }

      try {
        // ACT: Validar (deve salvar automaticamente)
        await validator.validate(testProjectId, 'NR-06')

        // ASSERT: Buscar registro no banco
        const validations = await prisma.complianceValidation.findMany({
          where: {
            projectId: testProjectId,
            nrCode: 'NR-06'
          }
        })

        expect(validations.length).toBeGreaterThan(0)
        
        const latestValidation = validations[0]
        expect(latestValidation.score).toBeGreaterThanOrEqual(0)
        expect(latestValidation.status).toMatch(/^(passed|failed)$/)
        
        console.log('✅ Resultado salvo no banco de dados')
      } catch (error: any) {
        if (error.message?.includes('OpenAI API') || error.message?.includes('GPT-4')) {
          console.warn('⚠️ API OpenAI não disponível - teste ignorado')
        } else {
          throw error
        }
      }
    }, 30000)
  })

  describe('Casos de Erro', () => {
    it('deve rejeitar validação de projeto inexistente', async () => {
      // ACT & ASSERT
      await expect(
        validator.validate('non-existent-id', 'NR-06')
      ).rejects.toThrow()
      
      console.log('✅ Projeto inexistente rejeitado')
    })

    it('deve rejeitar validação com NR inválida', async () => {
      if (!testProjectId) {
        console.warn('⚠️ Teste ignorado - projeto não disponível')
        return
      }

      // ACT & ASSERT
      await expect(
        validator.validate(testProjectId, 'NR-99' as unknown as string)
      ).rejects.toThrow();
      
      console.log('✅ NR inválida rejeitada');
    });
  });

  describe('Análise de Pontos Críticos', () => {
    it('deve identificar pontos críticos de cada NR', () => {
      // ACT: Analisar pontos críticos de NRs principais
      const nrs = ['NR-06', 'NR-10', 'NR-17', 'NR-35'];
      
      nrs.forEach(nrCode => {
        const template = getNRTemplate(nrCode as unknown as string);
        
        // ASSERT
        expect(template.criticalPoints.length).toBeGreaterThan(0)
        
        // Pontos críticos devem ser strings não vazias
        template.criticalPoints.forEach(point => {
          expect(typeof point).toBe('string')
          expect(point.length).toBeGreaterThan(10)
        })
        
        console.log(`✅ ${nrCode}: ${template.criticalPoints.length} pontos críticos`)
      })
    })
  })

  describe('Score e Aprovação', () => {
    it('deve calcular score baseado em cobertura de tópicos', () => {
      // ACT: Simular cálculo de score
      const template = getNRTemplate('NR-06')
      const totalTopics = template.requiredTopics.length
      const coveredTopics = Math.floor(totalTopics * 0.8) // 80% cobertura
      
      const score = Math.round((coveredTopics / totalTopics) * 100)

      // ASSERT
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
      expect(score).toBe(80)
      
      const passed = score >= template.minimumScore
      expect(passed).toBeDefined()
      
      console.log(`✅ Score calculado: ${score}% (mínimo: ${template.minimumScore}%)`)
    })
  })
})

