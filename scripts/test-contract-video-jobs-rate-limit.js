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
  const url = `${baseUrl}/api/v1/video-jobs`

  const alive = await serverIsAlive(baseUrl)
  if (!alive) {
    console.log('[contract] video-jobs-rate-limit: SKIP (server not running)')
    process.exit(0)
  }

  const headers = { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) }

  // Valid payload
  const payload = {
    project_id: '00000000-0000-4000-8000-000000000000',
    slides: [{ title: 'Test', content: 'Test', order_index: 0 }],
    quality: 'low'
  }

  // Hit rate limit by making 31 rapid requests
  let hitLimit = false
  for (let i = 0; i < 31; i++) {
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) })
    if (res.status === 401) { console.log('[contract] video-jobs-rate-limit: SKIP (no auth)'); process.exit(0) }
    if (res.status === 429) {
      const retryAfter = res.headers.get('retry-after')
      if (!retryAfter) { console.error('[contract] video-jobs-rate-limit: FAIL missing Retry-After header'); process.exit(1) }
      const val = parseInt(retryAfter, 10)
      if (isNaN(val) || val < 0) { console.error('[contract] video-jobs-rate-limit: FAIL invalid Retry-After value'); process.exit(1) }
      hitLimit = true
      break
    }
  }

  if (!hitLimit) {
    console.error('[contract] video-jobs-rate-limit: FAIL did not hit rate limit in 31 requests (limit should be 30)')
    process.exit(1)
  }

  console.log('[contract] video-jobs-rate-limit: OK')
}

main().catch(err => { console.error('[contract] video-jobs-rate-limit: ERROR', err?.message); process.exit(1) })
