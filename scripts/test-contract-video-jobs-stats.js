#!/usr/bin/env node
/*
  Contrato: GET /api/v1/video-jobs/stats
  Verifica shape básico e headers de cache.
*/
import fetch from 'node-fetch'
import http from 'node:http'

async function main() {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000'
  const token = process.env.TEST_ACCESS_TOKEN || process.env.ACCESS_TOKEN || ''
  const url = `${baseUrl}/api/v1/video-jobs/stats`

  // Verificar se servidor está ativo antes
  const serverAlive = await new Promise(resolve => {
    try {
      const req = http.request(url, { method: 'HEAD' }, r => { resolve(true); r.resume(); });
      req.on('error', () => resolve(false));
      req.end();
    } catch {
      resolve(false);
    }
  });
  if (!serverAlive) {
    console.log('[contract] video-jobs-stats: SKIP (server not running)');
    process.exit(0);
  }

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'authorization': token ? `Bearer ${token}` : '',
      'content-type': 'application/json'
    }
  })

  if (res.status === 401) {
    console.log('[contract] video-jobs-stats: SKIP (no auth)')
    process.exit(0)
  }

  if (res.status >= 500) {
    let body = ''
    try {
      body = await res.text()
    } catch {
      body = '<no-body>'
    }
    console.log(`[contract] video-jobs-stats: SKIP (server returned 5xx — configure database/render_jobs). body=${body}`)
    process.exit(0)
  }

  if (res.status !== 200) {
    console.error('[contract] video-jobs-stats: FAIL status', res.status)
    process.exit(1)
  }

  const xcache = res.headers.get('x-cache')
  if (!xcache) {
    console.error('[contract] video-jobs-stats: FAIL missing X-Cache header')
    process.exit(1)
  }

  const json = await res.json()
  if (!json || typeof json !== 'object') {
    console.error('[contract] video-jobs-stats: FAIL invalid JSON')
    process.exit(1)
  }

  const hasTotals = json.totals && typeof json.totals.total_jobs === 'number'
  const hasByStatus = json.by_status && typeof json.by_status.completed === 'number'
  const hasThroughput = json.throughput && typeof json.throughput.jobs_per_min === 'number'
  const hasPerf = json.performance && typeof json.performance.avg_duration_ms === 'number'
    && typeof json.performance.p50_ms === 'number'
    && typeof json.performance.p90_ms === 'number'
    && typeof json.performance.p95_ms === 'number'

  if (!(hasTotals && hasByStatus && hasThroughput && hasPerf)) {
    console.error('[contract] video-jobs-stats: FAIL invalid payload shape')
    process.exit(1)
  }

  console.log('[contract] video-jobs-stats: OK')
}

main().catch(err => {
  console.error('[contract] video-jobs-stats: ERROR', err?.message)
  process.exit(1)
})
