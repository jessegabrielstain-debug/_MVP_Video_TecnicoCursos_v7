#!/usr/bin/env node
/**
 * Script para corrigir logger.warn que foram erroneamente convertidos para 3 argumentos
 * 
 * O padrão incorreto (após conversão errada) é:
 *   logger.warn('msg', errorObj, { component: 'X' })
 * 
 * O padrão correto para warn é (sem Error separado):
 *   logger.warn('msg', { component: 'X' })  
 *   
 * Nota: Se precisarmos logar o erro, devemos usar logger.error
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
 * Corrige os padrões de logger.warn que foram erroneamente convertidos para 3 args
 */
function fixLoggerWarn(content) {
  let modified = content;
  
  // Padrão: logger.warn('msg', error, { component: 'X' })
  // Converter para: logger.warn('msg', { component: 'X' })
  // (ignora o error - se precisar logar erro, use logger.error)
  const pattern = /logger\.warn\(([^,]+),\s*([^,]+),\s*(\{[^}]+\})\s*\)/g;
  
  modified = modified.replace(pattern, (match, msg, errorArg, contextObj) => {
    // Apenas se o terceiro arg parece ser um objeto de contexto
    if (contextObj.includes('component:')) {
      return `logger.warn(${msg}, ${contextObj})`;
    }
    return match;
  });
  
  return modified;
}

/**
 * Main
 */
function main() {
  console.log('🔧 Corrigindo logger.warn com 3 argumentos...\n');
  
  const files = getAllTsFiles(BASE_DIR);
  console.log(`📁 Encontrados ${files.length} arquivos .ts\n`);
  
  let fixedCount = 0;
  const fixedFiles = [];
  
  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    const fixed = fixLoggerWarn(content);
    
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
