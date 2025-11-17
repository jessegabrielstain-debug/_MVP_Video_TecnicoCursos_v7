import { spawn, spawnSync } from 'node:child_process'
import { performance } from 'node:perf_hooks'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const repoRoot = dirname(__dirname)

const tests = [
  { name: 'video-jobs', script: 'test-contract-video-jobs.js', description: 'Validação do payload de criação de vídeo' },
  { name: 'video-jobs-query', script: 'test-contract-video-jobs-query.js', description: 'Consultas e filtros' },
  { name: 'video-jobs-cancel', script: 'test-contract-video-jobs-cancel.js', description: 'Cancelamento de jobs' },
  { name: 'video-jobs-progress', script: 'test-contract-video-jobs-progress.js', description: 'Atualização de progresso' },
  { name: 'video-jobs-requeue', script: 'test-contract-video-jobs-requeue.js', description: 'Reenfileirar jobs' },
  { name: 'video-jobs-id', script: 'test-contract-video-jobs-id.js', description: 'Busca por ID' },
  { name: 'video-jobs-status', script: 'test-contract-video-jobs-status.js', description: 'Consulta de status' },
  { name: 'video-jobs-response', script: 'test-contract-video-jobs-response.js', description: 'Estrutura da resposta' },
  { name: 'video-jobs-stats', script: 'test-contract-video-jobs-stats.js', description: 'Estatísticas agregadas (requer servidor)' },
  { name: 'video-jobs-list-cache', script: 'test-contract-video-jobs-list-cache.js', description: 'Cache de listagem (requer servidor)' },
  { name: 'video-jobs-rate-limit', script: 'test-contract-video-jobs-rate-limit.js', description: 'Rate limiting (requer servidor)' },
  { name: 'video-jobs-metrics', script: 'test-contract-video-jobs-metrics.js', description: 'Métricas detalhadas (requer servidor)' },
]

const evidenceDir = join(repoRoot, 'evidencias', 'fase-2')
const jsonPath = join(evidenceDir, 'contract-suite-result.json')
const markdownPath = join(evidenceDir, 'contract-report.md')
const nextAppDir = join(repoRoot, 'estudio_ia_videos')
const isWindows = process.platform === 'win32'
const npmCommand = isWindows ? 'cmd.exe' : 'npm'

if (!existsSync(evidenceDir)) {
  mkdirSync(evidenceDir, { recursive: true })
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const waitForServer = async (url, timeoutMs) => {
  const startedAt = Date.now()
  const limit = timeoutMs ?? 90_000
  while (Date.now() - startedAt < limit) {
    try {
      const res = await fetch(url, { method: 'GET' })
      if (res.ok || res.status >= 400) {
        return true
      }
    } catch {
      // ignore while waiting
    }
    await sleep(1_000)
  }
  throw new Error(`Next.js server não ficou pronto em ${Math.round(limit / 1000)}s (${url}).`)
}

const startNextServer = async ({ port, timeoutMs }) => {
  if (!existsSync(nextAppDir)) {
    throw new Error(`Diretório do app Next.js não encontrado: ${nextAppDir}`)
  }

  const baseUrl = `http://127.0.0.1:${port}`
  const args = isWindows
    ? ['/c', 'npm', 'run', 'dev', '--', '-p', String(port), '-H', '127.0.0.1']
    : ['run', 'dev', '--', '-p', String(port), '-H', '127.0.0.1']
  console.log(`[contract] Iniciando servidor Next.js em ${baseUrl}`)

  const server = spawn(npmCommand, args, {
    cwd: nextAppDir,
    env: {
      ...process.env,
      PORT: String(port),
      NEXT_TELEMETRY_DISABLED: '1',
      USE_MOCK_RENDER_JOBS: process.env.USE_MOCK_RENDER_JOBS ?? 'true',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  const logStdout = process.env.CONTRACT_SERVER_LOGS === 'true'
  if (logStdout) {
    server.stdout.on('data', (data) => {
      process.stdout.write(`[next] ${data}`)
    })
  }
  server.stderr.on('data', (data) => {
    process.stderr.write(`[next:err] ${data}`)
  })

  let serverExited = false
  let earlyExitHandler
  const exitPromise = new Promise((_, reject) => {
    earlyExitHandler = (code) => {
      serverExited = true
      reject(new Error(`Servidor Next.js finalizou antes do tempo (code=${code ?? 'unknown'})`))
    }
    server.once('exit', earlyExitHandler)
  })

  await Promise.race([waitForServer(baseUrl, timeoutMs), exitPromise]).catch((err) => {
    server.kill('SIGKILL')
    throw err
  })
  if (earlyExitHandler) {
    server.off('exit', earlyExitHandler)
  }

  let stopped = false
  const stop = async () => {
    if (stopped || serverExited) return
    stopped = true
    await new Promise((resolve) => {
      const timeout = setTimeout(() => {
        if (!server.killed) {
          server.kill('SIGKILL')
        }
      }, 5_000)
      server.once('exit', () => {
        serverExited = true
        clearTimeout(timeout)
        resolve()
      })
      server.kill('SIGINT')
    })
  }

  console.log('[contract] Servidor Next.js pronto para os testes de contrato')

  return { stop, baseUrl }
}

const runTest = (test, env) => {
  const start = performance.now()
  const result = spawnSync(process.execPath, ['--no-warnings', join(repoRoot, 'scripts', test.script)], {
    encoding: 'utf-8',
    env,
  })

  if (result.stdout) {
    process.stdout.write(result.stdout)
  }
  if (result.stderr) {
    process.stderr.write(result.stderr)
  }

  const durationMs = Math.round(performance.now() - start)
  const output = `${result.stdout}${result.stderr}`
  let status = 'ok'

  if (result.status !== 0) {
    status = 'fail'
  } else if (/SKIP/i.test(output)) {
    status = 'skip'
  }

  return {
    name: test.name,
    description: test.description,
    status,
    durationMs,
    output: output.trim(),
  }
}

async function main() {
  const preferRemoteBaseUrl = process.env.BASE_URL && !/localhost|127\.0\.0\.1/.test(process.env.BASE_URL)
  const skipLocalServer = process.env.CONTRACT_SKIP_SERVER === 'true'
  const shouldStartServer = !preferRemoteBaseUrl && !skipLocalServer
  const port = Number(process.env.CONTRACT_SERVER_PORT || 3310)
  const serverTimeout = Number(process.env.CONTRACT_SERVER_TIMEOUT_MS || 90_000)

  let serverController
  let effectiveBaseUrl = process.env.BASE_URL

  try {
    if (shouldStartServer) {
      serverController = await startNextServer({ port, timeoutMs: serverTimeout })
      effectiveBaseUrl = serverController.baseUrl
      process.env.BASE_URL = effectiveBaseUrl
    }

    const baseEnv = { ...process.env }
    if (effectiveBaseUrl) {
      baseEnv.BASE_URL = effectiveBaseUrl
    }

    const results = tests.map((test) => runTest(test, baseEnv))
    const totals = results.reduce(
      (acc, item) => {
        acc.total += 1
        if (item.status === 'ok') acc.passed += 1
        if (item.status === 'skip') acc.skipped += 1
        if (item.status === 'fail') acc.failed += 1
        return acc
      },
      { total: 0, passed: 0, skipped: 0, failed: 0 },
    )

    const summary = {
      command: 'npm run test:contract',
      executed_at: new Date().toISOString(),
      totals,
      results,
      base_url: effectiveBaseUrl || null,
      server_started: Boolean(serverController),
    }

    writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`)

    const renderStatus = (status) => {
      if (status === 'ok') return '✅ OK'
      if (status === 'skip') return '⏭️ SKIP'
      return '❌ FAIL'
    }

    const markdownRows = results
      .map((item) => `| \`${item.name}\` | ${renderStatus(item.status)} | ${item.description} | ${item.durationMs} ms |`)
      .join('\n')

    const markdownSections = [
      '# Relatório dos Testes de Contrato da API Video Jobs',
      '',
      `- **Data de execução:** ${new Date(summary.executed_at).toLocaleString('pt-BR')}`,
      '- **Comando:** `npm run test:contract`',
      `- **Resumo:** ${totals.passed}/${totals.total} testes passaram; ${totals.skipped} foram marcados como SKIP.`,
      `- **Servidor local:** ${summary.server_started ? `ativo em ${summary.base_url}` : 'não iniciado automaticamente'}`,
      '- **Fonte:** `evidencias/fase-2/contract-suite-result.json`',
      '',
      '| Teste | Status | Contexto | Tempo |',
      '| --- | --- | --- | --- |',
      markdownRows,
      '',
      '## Observações',
      summary.server_started
        ? '- Esta execução inicializou o servidor Next.js automaticamente para habilitar os cenários dependentes de API.'
        : '- Testes marcados como SKIP dependem de um servidor Next.js ativo durante a execução.',
      '- Configure um ambiente com servidor (`npm run dev`) para validar cenários completos de cache, rate limiting e métricas.',
    ]

    writeFileSync(markdownPath, `${markdownSections.join('\n')}\n`)

    if (totals.failed > 0) {
      process.exit(1)
    }
  } finally {
    if (serverController) {
      await serverController.stop()
    }
  }
}

main().catch((err) => {
  console.error('[contract] Falha ao executar a suíte de contrato:', err.message)
  process.exit(1)
})
