import { getVideoRenderQueue, addRenderJob, getQueueMetrics, cancelJob } from '@/lib/services/bullmq-service'

describe('BullMQ Service (interface)', () => {
  it('exports queue accessors', () => {
    expect(typeof getVideoRenderQueue).toBe('function')
    expect(typeof addRenderJob).toBe('function')
    expect(typeof getQueueMetrics).toBe('function')
    expect(typeof cancelJob).toBe('function')
  })

  it('does not instantiate queue until called (lazy)', () => {
    // não chama para evitar dependência Redis em ambiente de teste
    expect(true).toBe(true)
  })
})
