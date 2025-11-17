#!/usr/bin/env ts-node
import { spawn } from 'child_process';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const urls = [
  process.env.LH_URL_DASHBOARD || 'http://localhost:3000',
  process.env.LH_URL_JOB_DETAIL || 'http://localhost:3000/jobs/demo'
];

async function run() {
  mkdirSync('evidencias/fase-3', { recursive: true });
  for (const url of urls) {
    await new Promise<void>((resolve) => {
      const proc = spawn('npx', ['lighthouse', url, '--quiet', '--output=json', '--output=html', '--chrome-flags="--headless"'], { stdio: ['ignore', 'pipe', 'pipe'] });
      let out = '';
      proc.stdout.on('data', d => { out += d.toString(); });
      proc.stderr.on('data', d => { out += d.toString(); });
      proc.on('close', (code) => {
        const safe = url.replace(/https?:\/\//, '').replace(/[^a-z0-9]/gi, '_');
        writeFileSync(join('evidencias/fase-3', `lighthouse-${safe}.log`), out);
        resolve();
      });
    });
  }
  console.log('Relatórios Lighthouse gerados em evidencias/fase-3/');
}

run().catch(e => { console.error(e); process.exit(1); });