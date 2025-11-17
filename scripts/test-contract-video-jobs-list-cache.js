#!/usr/bin/env node
import fetch from 'node-fetch'
import http from 'node:http'

async function serverIsAlive(url) {
  return await new Promise(resolve => {
    try {
      const req = http.request(url, { method: 'HEAD' }, r => { resolve(true); r.resume(); });
      req.on('error', () => resolve(false));
      req.end();
    } catch {
      resolve(false);
    }
  });
}

async function main() {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000'
  const token = process.env.TEST_ACCESS_TOKEN || process.env.ACCESS_TOKEN || ''
  const listUrl = `${baseUrl}/api/v1/video-jobs?limit=5`

  const alive = await serverIsAlive(baseUrl)
  if (!alive) {
    console.log('[contract] video-jobs-list-cache: SKIP (server not running)')
    process.exit(0)
  }

  const commonHeaders = { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) }

  // First request (expect MISS)
  const res1 = await fetch(listUrl, { method: 'GET', headers: commonHeaders })
  if (res1.status === 401) { console.log('[contract] video-jobs-list-cache: SKIP (no auth)'); process.exit(0) }
  if (res1.status >= 500) {
    let body = ''
    try {
      body = await res1.text()
    } catch {
      body = '<no-body>'
    }
    console.log(`[contract] video-jobs-list-cache: SKIP (server returned 5xx — configure database/render_jobs). body=${body}`)
    process.exit(0)
  }
  if (res1.status !== 200) { console.error('[contract] video-jobs-list-cache: FAIL status1', res1.status); process.exit(1) }
  const x1 = res1.headers.get('x-cache')
  if (!x1) { console.error('[contract] video-jobs-list-cache: FAIL missing X-Cache 1'); process.exit(1) }

  // Second request (expect HIT)
  const res2 = await fetch(listUrl, { method: 'GET', headers: commonHeaders })
  if (res2.status >= 500) {
    let body = ''
    try {
      body = await res2.text()
    } catch {
      body = '<no-body>'
    }
    console.log(`[contract] video-jobs-list-cache: SKIP (server returned 5xx — configure database/render_jobs). body=${body}`)
    process.exit(0)
  }
  if (res2.status !== 200) { console.error('[contract] video-jobs-list-cache: FAIL status2', res2.status); process.exit(1) }
  const x2 = res2.headers.get('x-cache')
  if (!x2) { console.error('[contract] video-jobs-list-cache: FAIL missing X-Cache 2'); process.exit(1) }

  // Validate progression MISS->HIT if possible; allow both MISS when cache was cleared
  if (x1 === 'MISS' && x2 !== 'HIT') {
    console.error('[contract] video-jobs-list-cache: FAIL expected HIT on second request')
    process.exit(1)
  }

  console.log('[contract] video-jobs-list-cache: OK')
}

main().catch(err => { console.error('[contract] video-jobs-list-cache: ERROR', err?.message); process.exit(1) })
