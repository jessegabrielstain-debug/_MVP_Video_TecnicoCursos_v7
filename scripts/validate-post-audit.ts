#!/usr/bin/env node

/**
 * Validação Rápida do Sistema
 * 
 * Verifica se as correções da varredura foram aplicadas corretamente
 */

import chalk from 'chalk';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

interface ValidationResult {
  category: string;
  checks: Array<{
    name: string;
    status: 'pass' | 'fail' | 'warning';
    message: string;
  }>;
}

const results: ValidationResult[] = [];

console.log(chalk.cyan('\n═══════════════════════════════════════════════════'));
console.log(chalk.cyan('🔍 VALIDAÇÃO PÓS-VARREDURA'));
console.log(chalk.cyan('═══════════════════════════════════════════════════\n'));

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1. VALIDAR CREDENCIAIS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const envChecks: ValidationResult['checks'] = [];

try {
  const rootEnvPath = join(process.cwd(), '.env.local');
  const appEnvPath = join(process.cwd(), 'estudio_ia_videos', 'app', '.env.local');

  // Verificar arquivo raiz
  if (existsSync(rootEnvPath)) {
    const content = readFileSync(rootEnvPath, 'utf-8');
    
    if (content.includes('COLOQUE_A_ANON_KEY_AQUI') || content.includes('COLOQUE_A_SERVICE_ROLE_KEY_AQUI')) {
      envChecks.push({
        name: 'Credenciais Raiz',
        status: 'fail',
        message: 'Credenciais placeholder ainda presentes em /.env.local'
      });
    } else if (content.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')) {
      envChecks.push({
        name: 'Credenciais Raiz',
        status: 'pass',
        message: 'Credenciais válidas configuradas'
      });
    } else {
      envChecks.push({
        name: 'Credenciais Raiz',
        status: 'warning',
        message: 'Formato de credenciais não reconhecido'
      });
    }
  } else {
    envChecks.push({
      name: 'Credenciais Raiz',
      status: 'warning',
      message: 'Arquivo .env.local não encontrado na raiz'
    });
  }

  // Verificar arquivo app
  if (existsSync(appEnvPath)) {
    const content = readFileSync(appEnvPath, 'utf-8');
    
    if (content.includes('your_aws_access_key') || content.includes('your_azure_speech_key')) {
      envChecks.push({
        name: 'Credenciais App',
        status: 'warning',
        message: 'Alguns serviços opcionais não configurados'
      });
    } else {
      envChecks.push({
        name: 'Credenciais App',
        status: 'pass',
        message: 'Arquivo encontrado e configurado'
      });
    }
  } else {
    envChecks.push({
      name: 'Credenciais App',
      status: 'fail',
      message: 'Arquivo .env.local não encontrado em /app/'
    });
  }

} catch (error) {
  envChecks.push({
    name: 'Validação Ambiente',
    status: 'fail',
    message: `Erro: ${(error as Error).message}`
  });
}

results.push({
  category: 'Configurações de Ambiente',
  checks: envChecks
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2. VALIDAR JEST CONFIG
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const jestChecks: ValidationResult['checks'] = [];

try {
  const jestConfigPath = join(process.cwd(), 'jest.config.cjs');
  
  if (existsSync(jestConfigPath)) {
    const content = readFileSync(jestConfigPath, 'utf-8');
    
    const hasSupabaseTransform = content.includes('@supabase/auth-helpers');
    const hasBullMQTransform = content.includes('bullmq');
    const hasJoseTransform = content.includes('jose');
    
    if (hasSupabaseTransform && hasBullMQTransform && hasJoseTransform) {
      jestChecks.push({
        name: 'Transform Ignore Patterns',
        status: 'pass',
        message: 'Módulos ESM configurados para transformação'
      });
    } else {
      const missing = [];
      if (!hasSupabaseTransform) missing.push('@supabase/auth-helpers');
      if (!hasBullMQTransform) missing.push('bullmq');
      if (!hasJoseTransform) missing.push('jose');
      
      jestChecks.push({
        name: 'Transform Ignore Patterns',
        status: 'warning',
        message: `Módulos faltando: ${missing.join(', ')}`
      });
    }
  } else {
    jestChecks.push({
      name: 'Jest Config',
      status: 'fail',
      message: 'jest.config.cjs não encontrado'
    });
  }
} catch (error) {
  jestChecks.push({
    name: 'Validação Jest',
    status: 'fail',
    message: `Erro: ${(error as Error).message}`
  });
}

results.push({
  category: 'Configuração de Testes',
  checks: jestChecks
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3. VALIDAR TYPESCRIPT CONFIG
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const tsChecks: ValidationResult['checks'] = [];

try {
  const tsconfigPath = join(process.cwd(), 'tsconfig.json');
  
  if (existsSync(tsconfigPath)) {
    const content = readFileSync(tsconfigPath, 'utf-8');
    
    if (content.includes('ignoreDeprecations')) {
      tsChecks.push({
        name: 'Deprecation Warnings',
        status: 'pass',
        message: 'ignoreDeprecations configurado'
      });
    } else {
      tsChecks.push({
        name: 'Deprecation Warnings',
        status: 'warning',
        message: 'ignoreDeprecations não configurado (warnings do baseUrl)'
      });
    }
  }
} catch (error) {
  tsChecks.push({
    name: 'Validação TypeScript',
    status: 'fail',
    message: `Erro: ${(error as Error).message}`
  });
}

results.push({
  category: 'Configuração TypeScript',
  checks: tsChecks
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 4. VALIDAR ESTRUTURA DE ARQUIVOS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const fileChecks: ValidationResult['checks'] = [];

const criticalFiles = [
  { path: 'database-schema.sql', name: 'Database Schema' },
  { path: 'database-rls-policies.sql', name: 'RLS Policies' },
  { path: 'estudio_ia_videos/app/lib/pptx-processor.ts', name: 'PPTX Processor' },
  { path: 'estudio_ia_videos/app/lib/pptx/pptx-parser.ts', name: 'PPTX Parser' },
  { path: 'scripts/health-check.ts', name: 'Health Check Script' },
  { path: 'scripts/setup-supabase-auto.ts', name: 'Supabase Setup Script' }
];

criticalFiles.forEach(({ path, name }) => {
  const fullPath = join(process.cwd(), path);
  if (existsSync(fullPath)) {
    fileChecks.push({
      name,
      status: 'pass',
      message: 'Arquivo presente'
    });
  } else {
    fileChecks.push({
      name,
      status: 'fail',
      message: 'Arquivo não encontrado'
    });
  }
});

results.push({
  category: 'Estrutura de Arquivos',
  checks: fileChecks
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EXIBIR RESULTADOS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let totalPass = 0;
let totalFail = 0;
let totalWarning = 0;

results.forEach(({ category, checks }) => {
  console.log(chalk.bold(`\n${category}:`));
  console.log(chalk.gray('─'.repeat(50)));
  
  checks.forEach(({ name, status, message }) => {
    let icon, color;
    
    switch (status) {
      case 'pass':
        icon = '✅';
        color = chalk.green;
        totalPass++;
        break;
      case 'fail':
        icon = '❌';
        color = chalk.red;
        totalFail++;
        break;
      case 'warning':
        icon = '⚠️';
        color = chalk.yellow;
        totalWarning++;
        break;
    }
    
    console.log(`${icon} ${chalk.bold(name)}`);
    console.log(`   ${color(message)}`);
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SUMÁRIO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
console.log(chalk.cyan('\n═══════════════════════════════════════════════════'));
console.log(chalk.cyan('📊 SUMÁRIO'));
console.log(chalk.cyan('═══════════════════════════════════════════════════\n'));

console.log(`${chalk.green('✅ Aprovado:')} ${totalPass}`);
console.log(`${chalk.yellow('⚠️  Avisos:')} ${totalWarning}`);
console.log(`${chalk.red('❌ Falhas:')} ${totalFail}`);

const total = totalPass + totalWarning + totalFail;
const score = ((totalPass / total) * 100).toFixed(1);

console.log(`\n${chalk.bold('Score:')} ${score}%`);

if (totalFail === 0 && totalWarning === 0) {
  console.log(chalk.green('\n✨ Sistema 100% validado! ✨\n'));
  process.exit(0);
} else if (totalFail === 0) {
  console.log(chalk.yellow('\n⚠️  Sistema validado com avisos.\n'));
  process.exit(0);
} else {
  console.log(chalk.red('\n❌ Correções necessárias.\n'));
  process.exit(1);
}
