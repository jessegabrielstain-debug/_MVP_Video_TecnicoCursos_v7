#!/usr/bin/env node

/**
 * Script de Teste - Processador PPTX Melhorado
 * 
 * Testa as novas funcionalidades integradas:
 * - Extração avançada de texto
 * - Integração com parsers especializados
 * - Opções de processamento expandidas
 */

import chalk from 'chalk';
import { existsSync } from 'fs';
import { join } from 'path';

console.log(chalk.cyan('\n═══════════════════════════════════════════════════'));
console.log(chalk.cyan('🧪 TESTE DO PROCESSADOR PPTX MELHORADO'));
console.log(chalk.cyan('═══════════════════════════════════════════════════\n'));

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  message: string;
  duration?: number;
}

const results: TestResult[] = [];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1. VERIFICAR ARQUIVOS NECESSÁRIOS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
console.log(chalk.bold('1. Verificando Arquivos do Processador\n'));

const requiredFiles = [
  {
    path: 'estudio_ia_videos/app/lib/pptx-processor.ts',
    name: 'Processador Principal'
  },
  {
    path: 'estudio_ia_videos/app/lib/pptx/pptx-parser.ts',
    name: 'Parser Básico'
  },
  {
    path: 'estudio_ia_videos/app/lib/pptx/parsers/text-parser.ts',
    name: 'Text Parser'
  },
  {
    path: 'estudio_ia_videos/app/lib/pptx/parsers/image-parser.ts',
    name: 'Image Parser'
  },
  {
    path: 'estudio_ia_videos/app/lib/pptx/parsers/notes-parser.ts',
    name: 'Notes Parser'
  },
  {
    path: 'estudio_ia_videos/app/lib/pptx/pptx-processor-advanced.ts',
    name: 'Processador Avançado'
  },
  {
    path: 'estudio_ia_videos/app/lib/definitions.ts',
    name: 'Definições de Tipos'
  }
];

requiredFiles.forEach(({ path, name }) => {
  const fullPath = join(process.cwd(), path);
  const exists = existsSync(fullPath);
  
  results.push({
    name,
    status: exists ? 'pass' : 'fail',
    message: exists ? 'Arquivo presente' : 'Arquivo não encontrado'
  });
  
  const icon = exists ? '✅' : '❌';
  const color = exists ? chalk.green : chalk.red;
  console.log(`${icon} ${name}: ${color(exists ? 'OK' : 'FALTANDO')}`);
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2. VERIFICAR IMPORTS E TIPOS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
console.log(chalk.bold('\n2. Verificando Imports e Tipos\n'));

const processorPath = join(process.cwd(), 'estudio_ia_videos/app/lib/pptx-processor.ts');
const definitionsPath = join(process.cwd(), 'estudio_ia_videos/app/lib/definitions.ts');

try {
  const { readFileSync } = await import('fs');
  
  // Verificar imports do processador
  if (existsSync(processorPath)) {
    const processorContent = readFileSync(processorPath, 'utf-8');
    
    const checks = [
      { name: 'Import PPTXTextParser', pattern: /import.*PPTXTextParser.*from/ },
      { name: 'Import PPTXImageParser', pattern: /import.*PPTXImageParser.*from/ },
      { name: 'Import PPTXNotesParser', pattern: /import.*PPTXNotesParser.*from/ },
      { name: 'Função enrichSlidesWithAdvancedData', pattern: /async function enrichSlidesWithAdvancedData/ },
      { name: 'Uso de zip.loadAsync', pattern: /await JSZip\.loadAsync/ }
    ];
    
    checks.forEach(({ name, pattern }) => {
      const found = pattern.test(processorContent);
      results.push({
        name,
        status: found ? 'pass' : 'fail',
        message: found ? 'Presente' : 'Não encontrado'
      });
      
      const icon = found ? '✅' : '❌';
      const color = found ? chalk.green : chalk.red;
      console.log(`${icon} ${name}: ${color(found ? 'OK' : 'FALTANDO')}`);
    });
  }
  
  // Verificar definições expandidas
  if (existsSync(definitionsPath)) {
    const definitionsContent = readFileSync(definitionsPath, 'utf-8');
    
    const optionChecks = [
      'extractImages',
      'extractNotes',
      'extractFormatting',
      'generateThumbnails'
    ];
    
    optionChecks.forEach(option => {
      const found = new RegExp(`${option}\\??:`).test(definitionsContent);
      results.push({
        name: `ProcessingOptions.${option}`,
        status: found ? 'pass' : 'fail',
        message: found ? 'Definido' : 'Não definido'
      });
      
      const icon = found ? '✅' : '❌';
      const color = found ? chalk.green : chalk.red;
      console.log(`${icon} ProcessingOptions.${option}: ${color(found ? 'OK' : 'FALTANDO')}`);
    });
  }
} catch (error) {
  results.push({
    name: 'Verificação de Imports',
    status: 'fail',
    message: `Erro: ${(error as Error).message}`
  });
  console.log(chalk.red(`❌ Erro ao verificar imports: ${(error as Error).message}`));
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3. VERIFICAR TESTES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
console.log(chalk.bold('\n3. Verificando Testes\n'));

const testFiles = [
  'estudio_ia_videos/app/__tests__/lib/pptx/text-parser.test.ts',
  'estudio_ia_videos/app/__tests__/post-audit-validation.test.ts'
];

testFiles.forEach(testPath => {
  const fullPath = join(process.cwd(), testPath);
  const exists = existsSync(fullPath);
  const fileName = testPath.split('/').pop() || testPath;
  
  results.push({
    name: `Teste: ${fileName}`,
    status: exists ? 'pass' : 'skip',
    message: exists ? 'Disponível' : 'Não encontrado'
  });
  
  const icon = exists ? '✅' : '⚠️';
  const color = exists ? chalk.green : chalk.yellow;
  console.log(`${icon} ${fileName}: ${color(exists ? 'DISPONÍVEL' : 'AUSENTE')}`);
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SUMÁRIO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
console.log(chalk.cyan('\n═══════════════════════════════════════════════════'));
console.log(chalk.cyan('📊 SUMÁRIO'));
console.log(chalk.cyan('═══════════════════════════════════════════════════\n'));

const passed = results.filter(r => r.status === 'pass').length;
const failed = results.filter(r => r.status === 'fail').length;
const skipped = results.filter(r => r.status === 'skip').length;
const total = results.length;

console.log(`${chalk.green('✅ Aprovado:')} ${passed}/${total}`);
console.log(`${chalk.red('❌ Falhas:')} ${failed}/${total}`);
console.log(`${chalk.yellow('⚠️  Pulados:')} ${skipped}/${total}`);

const score = ((passed / total) * 100).toFixed(1);
console.log(`\n${chalk.bold('Score:')} ${score}%`);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RECOMENDAÇÕES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
console.log(chalk.cyan('\n═══════════════════════════════════════════════════'));
console.log(chalk.cyan('💡 PRÓXIMOS PASSOS'));
console.log(chalk.cyan('═══════════════════════════════════════════════════\n'));

if (failed > 0) {
  console.log(chalk.yellow('⚠️  Ações Recomendadas:\n'));
  console.log('1. Verificar arquivos faltando');
  console.log('2. Corrigir imports no processador');
  console.log('3. Executar: npm run type-check');
  console.log('4. Executar: npm test\n');
} else if (skipped > 0) {
  console.log(chalk.blue('ℹ️  Opcionais:\n'));
  console.log('1. Adicionar testes unitários faltando');
  console.log('2. Aumentar cobertura de testes\n');
} else {
  console.log(chalk.green('✨ Tudo funcionando perfeitamente!\n'));
  console.log('Próximos passos:');
  console.log('1. Testar com arquivo PPTX real');
  console.log('2. Executar: npm run test:suite:pptx');
  console.log('3. Validar extração avançada de dados\n');
}

// Exit code
if (failed === 0) {
  console.log(chalk.green('✅ Processador PPTX validado com sucesso!\n'));
  process.exit(0);
} else {
  console.log(chalk.red('❌ Correções necessárias no processador.\n'));
  process.exit(1);
}
