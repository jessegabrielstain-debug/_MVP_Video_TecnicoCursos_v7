#!/usr/bin/env node
/**
 * Script para corrigir padrões logger.error/warn em massa
 * 
 * O padrão incorreto é:
 *   logger.error('msg', { component: 'X', error: errObj })
 *   logger.error('msg', { error: errObj, component: 'X' })
 * 
 * O padrão correto é:
 *   logger.error('msg', errObj, { component: 'X' })
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const BASE_DIR = 'c:/xampp/htdocs/_MVP_Video_TecnicoCursos_v7/estudio_ia_videos/app/api';

/**
 * Recursivamente lista todos os arquivos .ts em um diretório
 */
function getAllTsFiles(dir) {
  const files = [];
  const entries = readdirSync(dir);
  
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...getAllTsFiles(fullPath));
    } else if (extname(entry) === '.ts') {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * Corrige os padrões de logger.error/warn em um arquivo
 */
function fixLoggerPatterns(content) {
  let modified = content;
  
  // Padrão 1: logger.error/warn('msg', { component: 'X', error: ... })
  // Captura: $1=error/warn, $2=mensagem, $3=component value, $4=error value
  const pattern1 = /logger\.(error|warn)\(([^,]+),\s*\{\s*component:\s*('[^']+'),\s*error:\s*([^}]+)\s*\}\s*\)/g;
  modified = modified.replace(pattern1, (match, level, msg, component, errorVal) => {
    const trimmedError = errorVal.trim();
    return `logger.${level}(${msg}, ${trimmedError}, { component: ${component} })`;
  });
  
  // Padrão 2: logger.error/warn('msg', { error: ..., component: 'X' })
  const pattern2 = /logger\.(error|warn)\(([^,]+),\s*\{\s*error:\s*([^,}]+),\s*component:\s*('[^']+(?:[^']*')?)\s*\}\s*\)/g;
  modified = modified.replace(pattern2, (match, level, msg, errorVal, component) => {
    const trimmedError = errorVal.trim();
    return `logger.${level}(${msg}, ${trimmedError}, { component: ${component} })`;
  });
  
  // Padrão 3: Com context adicional - logger.error('msg', { component: 'X', context: {...}, error: ... })
  const pattern3 = /logger\.(error|warn)\(([^,]+),\s*\{\s*component:\s*('[^']+'),\s*context:\s*(\{[^}]+\}),\s*error:\s*([^}]+)\s*\}\s*\)/g;
  modified = modified.replace(pattern3, (match, level, msg, component, context, errorVal) => {
    const trimmedError = errorVal.trim();
    return `logger.${level}(${msg}, ${trimmedError}, { component: ${component}, context: ${context} })`;
  });
  
  return modified;
}

/**
 * Main
 */
function main() {
  console.log('🔧 Iniciando correção de padrões logger.error/warn...\n');
  
  const files = getAllTsFiles(BASE_DIR);
  console.log(`📁 Encontrados ${files.length} arquivos .ts\n`);
  
  let fixedCount = 0;
  const fixedFiles = [];
  
  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    const fixed = fixLoggerPatterns(content);
    
    if (fixed !== content) {
      writeFileSync(file, fixed, 'utf-8');
      fixedCount++;
      const shortPath = file.replace(BASE_DIR, '').replace(/\\/g, '/');
      fixedFiles.push(shortPath);
      console.log(`✅ Fixed: ${shortPath}`);
    }
  }
  
  console.log(`\n🎉 Correção concluída!`);
  console.log(`   Total de arquivos: ${files.length}`);
  console.log(`   Arquivos corrigidos: ${fixedCount}`);
  
  if (fixedFiles.length > 0) {
    console.log('\n📝 Arquivos modificados:');
    fixedFiles.forEach(f => console.log(`   - ${f}`));
  }
}

main();
