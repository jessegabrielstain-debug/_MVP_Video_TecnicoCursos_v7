#!/usr/bin/env ts-node
/**
 * Script: deps-audit.ts
 * Executa `npm audit --json` e persiste resultado em evidencias/fase-2/deps-audit.json.
 * Saída simplificada com contagem por severidade.
 */
import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

function runAudit(): Promise<any> {
  return new Promise((resolve, reject) => {
    exec('npm audit --json', { maxBuffer: 10 * 1024 * 1024 }, (err, stdout) => {
      if (err && !stdout) return reject(err);
      try { resolve(JSON.parse(stdout)); } catch (e) { reject(e); }
    });
  });
}

async function main() {
  const raw = await runAudit();
  const advisories = raw.advisories || raw.vulnerabilities || {};
  // npm v7+ structure has vulnerabilities summary
  let summary;
  if (raw.vulnerabilities) {
    summary = raw.vulnerabilities; // has keys info, low, moderate, high, critical
  } else if (raw.metadata && raw.metadata.vulnerabilities) {
    summary = raw.metadata.vulnerabilities;
  } else {
    summary = {};
  }
  const output = {
    generatedAt: new Date().toISOString(),
    summary,
    total: typeof raw.metadata?.totalDependencies === 'number' ? raw.metadata.totalDependencies : undefined,
  };
  console.log(JSON.stringify(output, null, 2));
  const dir = path.join(process.cwd(), 'evidencias', 'fase-2');
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, 'deps-audit.json'), JSON.stringify(output, null, 2), 'utf8');
}

main().catch(err => {
  console.error('Falha deps-audit:', err);
  process.exit(1);
});
