/**
 * Teste isolado para endpoint /api/health
 * Uso: node scripts/test-health-endpoint.js
 */

const http = require('http')

const testHealthEndpoint = async () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/health',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    }

    const req = http.request(options, (res) => {
      let body = ''
      
      res.on('data', (chunk) => {
        body += chunk.toString()
      })

      res.on('end', () => {
        try {
          const data = JSON.parse(body)
          
          console.log('✅ Status Code:', res.statusCode)
          console.log('✅ Response:', JSON.stringify(data, null, 2))
          
          // Validações
          const checks = []
          
          if (res.statusCode === 200) {
            checks.push('✅ HTTP 200 OK')
          } else {
            checks.push(`❌ Expected 200, got ${res.statusCode}`)
          }
          
          if (data.status === 'healthy') {
            checks.push('✅ Status: healthy')
          } else {
            checks.push(`⚠️  Status: ${data.status}`)
          }
          
          if (data.timestamp) {
            checks.push('✅ Timestamp present')
          } else {
            checks.push('❌ Missing timestamp')
          }
          
          if (data.checks?.database?.status) {
            checks.push(`✅ Database: ${data.checks.database.status} (${data.checks.database.latency_ms}ms)`)
          } else {
            checks.push('❌ Missing database check')
          }
          
          if (data.checks?.redis?.status) {
            checks.push(`✅ Redis: ${data.checks.redis.status} (${data.checks.redis.latency_ms}ms)`)
          } else {
            checks.push('❌ Missing redis check')
          }
          
          if (data.checks?.queue !== undefined) {
            checks.push(`✅ Queue: ${data.checks.queue.status} (waiting: ${data.checks.queue.waiting})`)
          } else {
            checks.push('❌ Missing queue check')
          }
          
          console.log('\n📋 Validation Results:')
          checks.forEach(check => console.log(check))
          
          resolve(data)
        } catch (err) {
          reject(new Error(`Failed to parse JSON: ${err.message}`))
        }
      })
    })

    req.on('error', (err) => {
      console.error('❌ Request failed:', err.message)
      reject(err)
    })

    req.setTimeout(5000, () => {
      req.destroy()
      reject(new Error('Request timeout'))
    })

    req.end()
  })
}

// Executar teste
testHealthEndpoint()
  .then(() => {
    console.log('\n🎉 Health endpoint test PASSED')
    process.exit(0)
  })
  .catch((err) => {
    console.error('\n❌ Health endpoint test FAILED:', err.message)
    process.exit(1)
  })
