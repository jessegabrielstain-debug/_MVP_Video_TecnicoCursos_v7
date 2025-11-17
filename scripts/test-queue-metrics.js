/**
 * Teste simples para /api/queue/metrics
 */
const http = require('http')

function request(path) {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: 'localhost', port: 3000, path, method: 'GET' }, res => {
      let data = ''
      res.on('data', c => (data += c))
      res.on('end', () => resolve({ status: res.statusCode, body: data }))
    })
    req.on('error', reject)
    req.setTimeout(5000, () => { req.destroy(); reject(new Error('timeout')) })
    req.end()
  })
}

;(async () => {
  const r = await request('/api/queue/metrics')
  console.log('Status:', r.status)
  try {
    const j = JSON.parse(r.body)
    console.log('Metrics:', j.metrics)
    if (!j.metrics) process.exit(1)
    process.exit(0)
  } catch (e) {
    console.error('Invalid JSON')
    process.exit(1)
  }
})()
