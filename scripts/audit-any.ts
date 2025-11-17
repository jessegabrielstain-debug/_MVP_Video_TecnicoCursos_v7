#!/usr/bin/env node
/**
 * Script: audit-any.ts
 * Objetivo: listar ocorrências de 'any' e arquivos com '// @ts-nocheck' para relatório de profissionalização.
 * Saída: JSON em stdout + arquivo opcional evidencias/fase-1/any-report.json (se pasta existir).
 */
import { promises as fs } from 'fs';
import path from 'path';

interface Finding { file: string; line: number; snippet: string; type: 'any' | 'ts-nocheck'; }

const ROOT = process.cwd();
const INCLUDE_EXT = new Set(['.ts', '.tsx']);
const EXCLUDE_DIRS = ['node_modules', 'archive', 'legacy', '__tests__', 'tests', 'backups_'];

async function walk(dir: string, acc: string[] = []): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (EXCLUDE_DIRS.some(ex => full.includes(ex))) continue;
      await walk(full, acc);
    } else if (e.isFile()) {
      const ext = path.extname(e.name);
      if (INCLUDE_EXT.has(ext)) acc.push(full);
    }
  }
  return acc;
}

async function scanFile(file: string): Promise<Finding[]> {
  const content = await fs.readFile(file, 'utf8');
  const lines = content.split(/\r?\n/);
  const findings: Finding[] = [];
  lines.forEach((line, idx) => {
    if (/\/\/\s*@ts-nocheck/.test(line)) {
      findings.push({ file, line: idx + 1, snippet: line.trim(), type: 'ts-nocheck' });
    }
    // crude 'any' detection not part of a word like 'many'
    if (/\bany\b/.test(line) && !/\/\/\s*@deprecated-any/.test(line)) {
      findings.push({ file, line: idx + 1, snippet: line.trim().slice(0, 140), type: 'any' });
    }
  });
  return findings;
}

async function main() {
  const args = process.argv.slice(2);
  const failOnFindings = args.includes('--fail-on-findings');
  const files = await walk(ROOT);
  const all: Finding[] = [];
  for (const f of files) {
    const fFindings = await scanFile(f);
    all.push(...fFindings);
  }
  const summary = {
    generatedAt: new Date().toISOString(),
    totalFilesScanned: files.length,
    totalFindings: all.length,
    anyCount: all.filter(f => f.type === 'any').length,
    tsNoCheckCount: all.filter(f => f.type === 'ts-nocheck').length,
    findings: all,
  };
  const json = JSON.stringify(summary, null, 2);
  console.log(json);
  // Persist if evidencias folder exists
  const evidenceDir = path.join(ROOT, 'evidencias', 'fase-1');
  try {
    await fs.mkdir(evidenceDir, { recursive: true });
    await fs.writeFile(path.join(evidenceDir, 'any-report.json'), json, 'utf8');
  } catch (e) {
    console.error('Falha ao salvar evidencias:', (e as Error).message);
  }
  if (failOnFindings && summary.anyCount > 0) {
    console.error(`Encontradas ${summary.anyCount} ocorrências de 'any'. Falhando conforme --fail-on-findings.`);
    process.exit(2);
  }
}

main().catch(err => {
  console.error('Erro audit-any:', err);
  process.exit(1);
});
