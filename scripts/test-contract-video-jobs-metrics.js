#!/usr/bin/env node
import fetch from 'node-fetch';
import http from 'node:http';

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

function validateSchema(data) {
    const hasRateLimitHits = typeof data.rate_limit_hits === 'number';
    const hasErrorsTotal = typeof data.errors_total === 'number';
    const hasErrorsByCode = typeof data.errors_by_code === 'object' && data.errors_by_code !== null;
    const hasUptime = typeof data.uptime_ms === 'number';

    if (!hasRateLimitHits) throw new Error('Schema validation failed: missing or invalid rate_limit_hits');
    if (!hasErrorsTotal) throw new Error('Schema validation failed: missing or invalid errors_total');
    if (!hasErrorsByCode) throw new Error('Schema validation failed: missing or invalid errors_by_code');
    if (!hasUptime) throw new Error('Schema validation failed: missing or invalid uptime_ms');
}

async function main() {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const token = process.env.TEST_ACCESS_TOKEN || process.env.ACCESS_TOKEN || '';
  const url = `${baseUrl}/api/v1/video-jobs/metrics`;

  const alive = await serverIsAlive(baseUrl);
  if (!alive) {
    console.log('[contract] video-jobs-metrics: SKIP (server not running)');
    process.exit(0);
  }

  if (!token) {
    console.log('[contract] video-jobs-metrics: SKIP (no auth token)');
    process.exit(0);
  }

  const headers = { authorization: `Bearer ${token}` };

  const res = await fetch(url, { headers });

  if (res.status === 401) {
    console.log('[contract] video-jobs-metrics: SKIP (invalid auth token)');
    process.exit(0);
  }
  
  if (res.status === 403) {
    console.log('[contract] video-jobs-metrics: OK (Forbidden as expected for non-admin)');
    process.exit(0);
  }

  if (res.status !== 200) {
    console.error(`[contract] video-jobs-metrics: FAIL - Expected status 200 or 403, but got ${res.status}`);
    process.exit(1);
  }

  const data = await res.json();
  
  try {
    validateSchema(data);
  } catch (err) {
    console.error(`[contract] video-jobs-metrics: FAIL - ${err.message}`);
    console.error('Received data:', JSON.stringify(data, null, 2));
    process.exit(1);
  }

  console.log('[contract] video-jobs-metrics: OK');
}

main().catch(err => {
  console.error('[contract] video-jobs-metrics: ERROR', err?.message);
  process.exit(1);
});
