import { checkStorage } from '../api/health/route'

describe('health check', () => {
  it('local storage is ready by default', () => {
    delete process.env.STORAGE_PROVIDER
    expect(checkStorage()).toBe(true)
  })
})

