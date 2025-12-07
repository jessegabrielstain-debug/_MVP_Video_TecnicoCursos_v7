#!/usr/bin/env tsx
/**
 * Validação Consolidada Final - Sistema PPTX
 * 
 * Executa todas as validações críticas em sequência e gera
 * relatório consolidado do estado do sistema.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

interface ValidationResult {
  name: string;
  command: string;
  success: boolean;
  score?: number;
  output?: string;
  error?: string;
  duration: number;
}

const VALIDATIONS = [
  {
    name: 'Validação Pós-Audit',
    command: 'npm run validate:post-audit',
    critical: true,
  },
  {
    name: 'Processador PPTX',
    command: 'npm run test:pptx-processor',
    critical: true,
  },
  {
    name: 'Health Check',
    command: 'npm run health',
    critical: false,
  },
];

function printHeader() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║     VALIDAÇÃO CONSOLIDADA FINAL - SISTEMA PPTX    ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');
}

function printValidationStart(name: string) {
  console.log(`\n┌─────────────────────────────────────────────────┐`);
  console.log(`│ 🔍 ${name.padEnd(46)}│`);
  console.log(`└─────────────────────────────────────────────────┘\n`);
}

function extractScore(output: string): number | undefined {
  const scoreMatch = output.match(/Score:\s*(\d+\.?\d*)%/);
  if (scoreMatch) {
    return parseFloat(scoreMatch[1]);
  }
  return undefined;
}

function runValidation(validation: typeof VALIDATIONS[0]): ValidationResult {
  const startTime = Date.now();
  
  try {
    printValidationStart(validation.name);
    
    const output = execSync(validation.command, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    
    const duration = Date.now() - startTime;
    const score = extractScore(output);
    
    console.log(output);
    
    return {
      name: validation.name,
      command: validation.command,
      success: true,
      score,
      output,
      duration,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    const output = error.stdout?.toString() || '';
    const errorMsg = error.stderr?.toString() || error.message;
    
    console.log(output);
    console.error('❌ Erro:', errorMsg);
    
    return {
      name: validation.name,
      command: validation.command,
      success: false,
      error: errorMsg,
      output,
      duration,
    };
  }
}

function printSummary(results: ValidationResult[]) {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║                 SUMÁRIO CONSOLIDADO                ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  const avgScore = results
    .filter(r => r.score !== undefined)
    .reduce((sum, r) => sum + (r.score || 0), 0) / 
    results.filter(r => r.score !== undefined).length;

  console.log('📊 Estatísticas Gerais');
  console.log('─'.repeat(50));
  console.log(`Total de validações: ${results.length}`);
  console.log(`✅ Sucessos: ${successful}`);
  console.log(`❌ Falhas: ${failed}`);
  console.log(`⏱️  Tempo total: ${(totalDuration / 1000).toFixed(2)}s`);
  console.log(`📈 Score médio: ${avgScore.toFixed(1)}%\n`);

  console.log('📋 Detalhamento por Validação');
  console.log('─'.repeat(50));
  
  results.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    const scoreText = result.score !== undefined ? ` (${result.score}%)` : '';
    const timeText = `${(result.duration / 1000).toFixed(2)}s`;
    
    console.log(`${icon} ${result.name}${scoreText}`);
    console.log(`   Tempo: ${timeText}`);
    console.log(`   Comando: ${result.command}`);
    
    if (result.error) {
      console.log(`   Erro: ${result.error.substring(0, 100)}...`);
    }
    console.log('');
  });

  // Status final
  console.log('─'.repeat(50));
  const criticalResults = results.filter((r, i) => VALIDATIONS[i].critical);
  const allCriticalPass = criticalResults.every(r => r.success);
  
  if (allCriticalPass) {
    console.log('\n✅ SISTEMA VALIDADO COM SUCESSO!\n');
    console.log('Todas as validações críticas passaram.');
    console.log('Sistema pronto para uso.\n');
  } else {
    console.log('\n❌ FALHAS CRÍTICAS DETECTADAS!\n');
    console.log('Algumas validações críticas falharam.');
    console.log('Sistema necessita correções.\n');
  }

  // Recomendações
  console.log('💡 Recomendações');
  console.log('─'.repeat(50));
  
  if (avgScore >= 95) {
    console.log('✨ Sistema em excelente estado!');
    console.log('   - Considere executar testes de carga');
    console.log('   - Testar com arquivos PPTX reais');
  } else if (avgScore >= 80) {
    console.log('👍 Sistema em bom estado.');
    console.log('   - Revisar avisos não críticos');
    console.log('   - Configurar serviços opcionais');
  } else {
    console.log('⚠️  Sistema precisa de atenção.');
    console.log('   - Revisar erros críticos');
    console.log('   - Executar validações individuais');
  }
  console.log('');

  return allCriticalPass;
}

function saveReport(results: ValidationResult[]) {
  const reportPath = path.join(process.cwd(), 'validation-report.json');
  
  const report = {
    timestamp: new Date().toISOString(),
    results,
    summary: {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      avgScore: results
        .filter(r => r.score !== undefined)
        .reduce((sum, r) => sum + (r.score || 0), 0) / 
        results.filter(r => r.score !== undefined).length,
    },
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📄 Relatório salvo em: ${reportPath}\n`);
}

async function main() {
  printHeader();

  const results: ValidationResult[] = [];

  console.log('🚀 Iniciando validações...\n');

  for (const validation of VALIDATIONS) {
    const result = runValidation(validation);
    results.push(result);
    
    // Pausa entre validações
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  const allCriticalPass = printSummary(results);
  saveReport(results);

  // Exit code
  process.exit(allCriticalPass ? 0 : 1);
}

main().catch(error => {
  console.error('\n💥 Erro fatal na validação:', error);
  process.exit(1);
});
