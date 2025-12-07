import { test, expect } from '@playwright/test'

test.describe('Healthcheck Endpoint', () => {
  test('returns 200 and healthy status', async ({ request }) => {
    const response = await request.get('/api/health')
    
    expect(response.status()).toBe(200)
    
    const body = await response.json()
    expect(body.status).toBe('healthy')
    expect(body).toHaveProperty('timestamp')
    expect(body).toHaveProperty('checks')
  })

  test('includes database check', async ({ request }) => {
    const response = await request.get('/api/health')
    const body = await response.json()
    
    expect(body.checks.database).toHaveProperty('status')
    expect(body.checks.database).toHaveProperty('latency_ms')
    expect(['ok', 'warning', 'error']).toContain(body.checks.database.status)
  })

  test('includes redis check', async ({ request }) => {
    const response = await request.get('/api/health')
    const body = await response.json()
    
    expect(body.checks.redis).toHaveProperty('status')
    expect(body.checks.redis).toHaveProperty('latency_ms')
    expect(['ok', 'warning', 'error']).toContain(body.checks.redis.status)
  })

  test('includes queue check', async ({ request }) => {
    const response = await request.get('/api/health')
    const body = await response.json()
    
    expect(body.checks.queue).toHaveProperty('status')
    expect(body.checks.queue).toHaveProperty('waiting')
    expect(body.checks.queue).toHaveProperty('active')
  })

  test('response has no-cache headers', async ({ request }) => {
    const response = await request.get('/api/health')
    
    const cacheControl = response.headers()['cache-control']
    expect(cacheControl).toContain('no-store')
    expect(cacheControl).toContain('no-cache')
    expect(cacheControl).toContain('must-revalidate')
  })

  test('response latency is acceptable', async ({ request }) => {
    const start = Date.now()
    const response = await request.get('/api/health')
    const latency = Date.now() - start
    
    expect(response.status()).toBe(200)
    expect(latency).toBeLessThan(1000) // Should respond in under 1 second
  })
})
