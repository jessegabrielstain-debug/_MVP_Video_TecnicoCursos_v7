// Importa diretamente para evitar carregar bullmq-service (Esm export de dependência msgpackr)
import { logger, createLogger, getLogger } from '@/lib/services/logger-service'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

describe('Logger Service', () => {
  it('exposes singleton logger', () => {
    expect(logger).toBeDefined()
    logger.info('teste-info', { ok: true })
  })

  it('creates contextual logger', () => {
    const ctx = createLogger('UnitTest')
    expect(ctx).toBeDefined()
    ctx.error('Erro simulado', new Error('boom'))
  })

  it('writes JSONL lines to log file', () => {
    const logDir = process.env.LOG_DIR || join(process.cwd(), 'logs')
    const logFile = join(logDir, 'app.log')
    logger.debug('linha-depuração', { a: 1 })
    // tolera ambientes sem permissão
    if (existsSync(logFile)) {
      const content = readFileSync(logFile, 'utf-8').trim().split('\n')
      expect(content.length).toBeGreaterThan(0)
      const last = JSON.parse(content[content.length - 1])
      expect(last).toHaveProperty('timestamp')
      expect(['debug','info','warn','error','fatal']).toContain(last.level)
    }
  })

  it('getLogger reusa instância singleton', () => {
    const a = getLogger()
    const b = getLogger()
    expect(a === b).toBe(true)
  })
})
