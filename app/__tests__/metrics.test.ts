import { renderPrometheus } from '../lib/metrics'

describe('Prometheus metrics', () => {
  it('renders counters and gauges', () => {
    const out = renderPrometheus()
    expect(out).toContain('app_uptime_seconds')
    expect(out).toContain('app_upload_requests_total')
    expect(out).toContain('app_upload_errors_total')
  })
})

