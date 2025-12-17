/**
 * 🔧 Script de Migração: Corrigir Padrão do Logger
 * 
 * Problema: logger.error('msg', { component: 'X', error: err })
 * Correto:  logger.error('msg', err, { component: 'X' })
 * 
 * Execução: npx tsx scripts/fix-logger-pattern.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

const API_DIR = path.join(__dirname, '../estudio_ia_videos/app/api');
const LIB_DIR = path.join(__dirname, '../estudio_ia_videos/app/lib');

// Padrão 1: logger.error('msg', { component: 'X', error: errorVar })
// Transforma em: logger.error('msg', errorVar, { component: 'X' })
const PATTERN_1 = /logger\.error\(\s*(['"`][^'"`]+['"`])\s*,\s*\{\s*component:\s*(['"`][^'"`]+['"`])\s*,\s*error:\s*([^}]+)\s*\}\s*\)/g;

// Padrão 2: logger.error('msg', { error: errorVar, component: 'X' })
const PATTERN_2 = /logger\.error\(\s*(['"`][^'"`]+['"`])\s*,\s*\{\s*error:\s*([^,}]+),\s*component:\s*(['"`][^'"`]+['"`])\s*\}\s*\)/g;

// Padrão 3: Apenas { component: 'X' } sem error (erro genérico)
const PATTERN_3 = /logger\.error\(\s*(['"`][^'"`]+['"`])\s*,\s*\{\s*component:\s*(['"`][^'"`]+['"`])\s*\}\s*\)/g;

interface FixResult {
  file: string;
  fixes: number;
  errors: string[];
}

function fixLoggerPattern(content: string): { fixed: string; count: number } {
  let count = 0;
  let fixed = content;

  // Fix Pattern 1: { component: 'X', error: err }
  fixed = fixed.replace(PATTERN_1, (match, msg, component, errorVar) => {
    count++;
    const trimmedError = errorVar.trim();
    return `logger.error(${msg}, ${trimmedError}, { component: ${component} })`;
  });

  // Fix Pattern 2: { error: err, component: 'X' }
  fixed = fixed.replace(PATTERN_2, (match, msg, errorVar, component) => {
    count++;
    const trimmedError = errorVar.trim();
    return `logger.error(${msg}, ${trimmedError}, { component: ${component} })`;
  });

  // Fix Pattern 3: { component: 'X' } without error - add undefined as error
  fixed = fixed.replace(PATTERN_3, (match, msg, component) => {
    count++;
    return `logger.error(${msg}, undefined, { component: ${component} })`;
  });

  return { fixed, count };
}

async function processFile(filePath: string): Promise<FixResult> {
  const result: FixResult = { file: filePath, fixes: 0, errors: [] };

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    if (!content.includes('logger.error')) {
      return result;
    }

    const { fixed, count } = fixLoggerPattern(content);
    
    if (count > 0) {
      fs.writeFileSync(filePath, fixed, 'utf-8');
      result.fixes = count;
      console.log(`✅ ${filePath}: ${count} fixes applied`);
    }
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : String(error));
    console.error(`❌ ${filePath}: ${result.errors[0]}`);
  }

  return result;
}

async function main() {
  console.log('🔧 Starting Logger Pattern Fix Migration...\n');

  const apiFiles = glob.sync('**/*.ts', { cwd: API_DIR, absolute: true });
  const libFiles = glob.sync('**/*.ts', { cwd: LIB_DIR, absolute: true });
  const allFiles = [...apiFiles, ...libFiles];

  console.log(`📁 Found ${allFiles.length} TypeScript files to process\n`);

  let totalFixes = 0;
  let filesFixed = 0;

  for (const file of allFiles) {
    const result = await processFile(file);
    if (result.fixes > 0) {
      totalFixes += result.fixes;
      filesFixed++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   Files processed: ${allFiles.length}`);
  console.log(`   Files fixed: ${filesFixed}`);
  console.log(`   Total fixes: ${totalFixes}`);
  console.log('\n✅ Migration complete! Run `npm run type-check` to verify.');
}

main().catch(console.error);
