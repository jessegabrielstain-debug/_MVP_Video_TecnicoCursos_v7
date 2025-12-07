/**
 * Script de Teste E2E Simplificado
 * 
 * Testa as principais rotas da aplicação via HTTP
 * 
 * Uso: npx tsx scripts/test-routes.ts
 */

const ROUTES_TO_TEST = [
  { path: '/', name: 'Home', expectedStatus: [200, 302, 307] },
  { path: '/login', name: 'Login', expectedStatus: [200] },
  { path: '/signup', name: 'Signup', expectedStatus: [200] },
  { path: '/dashboard', name: 'Dashboard', expectedStatus: [200, 302, 307] },
  { path: '/editor', name: 'Editor', expectedStatus: [200, 302, 307] },
  { path: '/pptx', name: 'PPTX Upload', expectedStatus: [200, 302, 307] },
  { path: '/templates', name: 'Templates', expectedStatus: [200, 302, 307] },
  { path: '/projects', name: 'Projects', expectedStatus: [200, 302, 307] },
  // APIs
  { path: '/api/health', name: 'API Health', expectedStatus: [200, 404] },
  { path: '/api/heygen/credits', name: 'HeyGen Credits API', expectedStatus: [200, 401, 500] },
  { path: '/api/render/jobs', name: 'Render Jobs API', expectedStatus: [200, 401] },
]

interface TestResult {
  route: string
  name: string
  status: number
  success: boolean
  error?: string
  time: number
}

async function testRoute(baseUrl: string, route: typeof ROUTES_TO_TEST[0]): Promise<TestResult> {
  const start = Date.now()
  
  try {
    const response = await fetch(`${baseUrl}${route.path}`, {
      redirect: 'manual', // Don't follow redirects automatically
      headers: {
        'Accept': 'text/html,application/json',
        'User-Agent': 'TestBot/1.0'
      }
    })
    
    const time = Date.now() - start
    const success = route.expectedStatus.includes(response.status)
    
    return {
      route: route.path,
      name: route.name,
      status: response.status,
      success,
      time,
      error: success ? undefined : `Expected ${route.expectedStatus.join('|')}, got ${response.status}`
    }
  } catch (err) {
    return {
      route: route.path,
      name: route.name,
      status: 0,
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
      time: Date.now() - start
    }
  }
}

async function runTests() {
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000'
  
  console.log('🧪 Iniciando testes de rotas...\n')
  console.log(`Base URL: ${baseUrl}\n`)
  console.log('─'.repeat(60))
  
  const results: TestResult[] = []
  
  for (const route of ROUTES_TO_TEST) {
    const result = await testRoute(baseUrl, route)
    results.push(result)
    
    const icon = result.success ? '✅' : '❌'
    const statusStr = result.status === 0 ? 'ERR' : result.status.toString()
    console.log(`${icon} ${result.name.padEnd(20)} ${statusStr.padStart(4)} ${result.time.toString().padStart(5)}ms  ${route.path}`)
    
    if (result.error) {
      console.log(`   └─ ${result.error}`)
    }
  }
  
  console.log('─'.repeat(60))
  
  const passed = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length
  const avgTime = Math.round(results.reduce((sum, r) => sum + r.time, 0) / results.length)
  
  console.log(`\n📊 Resumo: ${passed} passou, ${failed} falhou (tempo médio: ${avgTime}ms)`)
  
  if (failed > 0) {
    console.log('\n❌ Rotas com problemas:')
    results.filter(r => !r.success).forEach(r => {
      console.log(`   • ${r.name} (${r.route}): ${r.error}`)
    })
    process.exit(1)
  } else {
    console.log('\n✅ Todos os testes passaram!')
    process.exit(0)
  }
}

// Wait for server to be ready
async function waitForServer(baseUrl: string, maxRetries = 10): Promise<boolean> {
  console.log('⏳ Aguardando servidor...')
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      await fetch(baseUrl, { method: 'HEAD' })
      console.log('✅ Servidor pronto!\n')
      return true
    } catch {
      await new Promise(r => setTimeout(r, 1000))
    }
  }
  
  console.error('❌ Servidor não respondeu após', maxRetries, 'tentativas')
  return false
}

// Main
const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000'
waitForServer(baseUrl).then(ready => {
  if (ready) {
    runTests()
  } else {
    process.exit(1)
  }
})
