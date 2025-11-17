#!/usr/bin/env ts-node
/**
 * Script: create-release.ts
 * Gera manifesto de release com commit, coverage e métricas de qualidade.
 * Uso: ts-node scripts/release/create-release.ts [--tag vX.Y.Z]
 */
import { promises as fs } from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface ReleaseManifest {
  id: string; // timestamp id
  tag?: string;
  createdAt: string;
  commit: string;
  coverageStatementsPct?: number;
  anyRemaining?: number;
  files: string[]; // artefatos relevantes
}

function getCommit(): string {
  try { return execSync('git rev-parse HEAD').toString().trim(); } catch { return 'UNKNOWN'; }
}

async function readJSON<T>(p: string): Promise<T | undefined> {
  try { return JSON.parse(await fs.readFile(p, 'utf8')) as T; } catch { return undefined; }
}

async function main() {
  const args = process.argv.slice(2);
  const tagArg = args.find(a => a.startsWith('--tag='));
  const tag = tagArg ? tagArg.split('=')[1] : undefined;
  const id = new Date().toISOString().replace(/[:.]/g, '-');
  const coveragePaths = [
    path.join(process.cwd(),'estudio_ia_videos','app','coverage','coverage-summary.json'),
    path.join(process.cwd(),'coverage','coverage-summary.json'),
    path.join(process.cwd(),'jest-coverage-app','coverage-summary.json')
  ];
  let coveragePct: number | undefined;
  for (const c of coveragePaths) {
    const cov = await readJSON<any>(c);
    if (cov?.total?.statements?.pct != null) { coveragePct = cov.total.statements.pct; break; }
  }
  const anyReport = await readJSON<any>(path.join(process.cwd(),'evidencias','fase-1','any-report.json'));
  const anyRemaining = anyReport?.anyCount;
  const manifest: ReleaseManifest = {
    id,
    tag,
    createdAt: new Date().toISOString(),
    commit: getCommit(),
    coverageStatementsPct: coveragePct,
    anyRemaining,
    files: [coveragePct ? 'coverage-summary.json' : '', anyRemaining != null ? 'any-report.json' : ''].filter(Boolean)
  };
  const dir = path.join(process.cwd(),'releases');
  await fs.mkdir(dir,{recursive:true});
  const filePath = path.join(dir, `release-${id}.json`);
  await fs.writeFile(filePath, JSON.stringify(manifest,null,2),'utf8');
  console.log(JSON.stringify({ manifest:filePath },null,2));
}

main().catch(err => { console.error('Falha create-release:', err); process.exit(1); });
