import { captureError, captureException, addBreadcrumb, recordMetric } from '@/lib/services/monitoring-service'

describe('Monitoring Service (Sentry Stub)', () => {
  beforeAll(() => {
    // garante ambiente sem DSN para testar fallback seguro
    delete process.env.SENTRY_DSN
  })

  it('recordMetric não lança erro sem DSN', () => {
    recordMetric({ name: 'unit_test_metric', value: 1 })
    expect(true).toBe(true)
  })

  it('captureError executa sem Sentry', () => {
    captureError(new Error('erro-teste'), { user: { id: 'u1' } })
    expect(true).toBe(true)
  })

  it('captureException executa em vários níveis', () => {
    captureException(new Error('fatal-teste'), 'fatal')
    captureException(new Error('warn-teste'), 'warning')
    expect(true).toBe(true)
  })

  it('addBreadcrumb funciona sem Sentry', () => {
    addBreadcrumb('unit breadcrumb', 'test')
    expect(true).toBe(true)
  })
})
