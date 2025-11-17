/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🔐 SISTEMA DE VALIDAÇÃO DE AMBIENTE
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Valida e verifica todas as configurações necessárias
 * Versão: 1.0
 * Data: 10/10/2025
 * 
 * Funcionalidades:
 * - Validação de variáveis de ambiente
 * - Verificação de dependências
 * - Teste de conexões externas
 * - Geração de relatório completo
 * - Sugestões de correção
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

interface ValidationRule {
  name: string;
  required: boolean;
  validate: () => Promise<ValidationResult>;
}

interface ValidationResult {
  passed: boolean;
  message: string;
  details?: Record<string, unknown>;
  fix?: string;
}

interface EnvironmentReport {
  overall: 'pass' | 'fail' | 'warning';
  timestamp: string;
  results: Array<ValidationResult & { rule: string; required: boolean }>;
  score: number;
  summary: {
    passed: number;
    failed: number;
    warnings: number;
  };
}

class EnvironmentValidator {
  private envVars: Record<string, string | undefined> = {};
  private projectRoot: string;

  constructor() {
    this.projectRoot = path.join(process.cwd(), '..');
    this.loadEnv();
  }

  private loadEnv() {
    let envPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) {
      envPath = path.join(this.projectRoot, '.env');
    }
    
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      envContent.split('\n').forEach(line => {
        line = line.trim();
        if (!line || line.startsWith('#')) return;
        const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/i);
        if (match) {
          const key = match[1].trim();
          let value = match[2].trim();
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          this.envVars[key] = value;
          process.env[key] = value;
        }
      });
    }
  }

  private log(message: string, level: 'info' | 'success' | 'error' | 'warning' = 'info') {
    const icons = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      warning: '⚠️'
    };

    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      error: '\x1b[31m',
      warning: '\x1b[33m',
      reset: '\x1b[0m'
    };

    console.log(`${colors[level]}${icons[level]} ${message}${colors.reset}`);
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'object' && error !== null && 'message' in error) {
      const maybeMessage = (error as { message?: unknown }).message;
      if (typeof maybeMessage === 'string') {
        return maybeMessage;
      }
    }

    return 'Unknown error';
  }

  // ═══════════════════════════════════════════════════════════════════════
  // REGRAS DE VALIDAÇÃO
  // ═══════════════════════════════════════════════════════════════════════

  private rules: ValidationRule[] = [
    {
      name: 'Variável NEXT_PUBLIC_SUPABASE_URL',
      required: true,
      validate: async () => {
        const value = this.envVars.NEXT_PUBLIC_SUPABASE_URL;
        if (!value) {
          return {
            passed: false,
            message: 'Variável não configurada',
            fix: 'Adicione NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co ao .env'
          };
        }
        if (!value.includes('supabase.co')) {
          return {
            passed: false,
            message: 'URL inválida',
            details: { value },
            fix: 'URL deve ser do formato: https://xxx.supabase.co'
          };
        }
        return {
          passed: true,
          message: 'URL configurada corretamente',
          details: { value }
        };
      }
    },

    {
      name: 'Variável SUPABASE_SERVICE_ROLE_KEY',
      required: true,
      validate: async () => {
        const value = this.envVars.SUPABASE_SERVICE_ROLE_KEY;
        if (!value) {
          return {
            passed: false,
            message: 'Service role key não configurada',
            fix: 'Adicione SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... ao .env'
          };
        }
        if (!value.startsWith('eyJ')) {
          return {
            passed: false,
            message: 'Service role key inválida (deve começar com eyJ)',
            fix: 'Verifique a chave no dashboard do Supabase'
          };
        }
        return {
          passed: true,
          message: 'Service role key configurada',
          details: { length: value.length }
        };
      }
    },

    {
      name: 'Variável DATABASE_URL',
      required: true,
      validate: async () => {
        const value = this.envVars.DATABASE_URL;
        if (!value) {
          return {
            passed: false,
            message: 'DATABASE_URL não configurada',
            fix: 'Adicione DATABASE_URL=postgresql://... ao .env'
          };
        }
        if (!value.startsWith('postgresql://')) {
          return {
            passed: false,
            message: 'DATABASE_URL inválida (deve começar com postgresql://)',
            fix: 'Formato: postgresql://usuario:senha@host:5432/database'
          };
        }
        return {
          passed: true,
          message: 'DATABASE_URL configurada',
          details: { protocol: 'postgresql' }
        };
      }
    },

    {
      name: 'Variável NEXTAUTH_SECRET',
      required: false,
      validate: async () => {
        const value = this.envVars.NEXTAUTH_SECRET;
        if (!value) {
          return {
            passed: false,
            message: 'NEXTAUTH_SECRET não configurada (opcional)',
            fix: 'Gere com: openssl rand -base64 32'
          };
        }
        if (value.length < 32) {
          return {
            passed: false,
            message: 'NEXTAUTH_SECRET muito curta (mínimo 32 caracteres)',
            fix: 'Gere uma chave mais forte: openssl rand -base64 32'
          };
        }
        return {
          passed: true,
          message: 'NEXTAUTH_SECRET configurada',
          details: { length: value.length }
        };
      }
    },

    {
      name: 'Variável NEXTAUTH_URL',
      required: false,
      validate: async () => {
        const value = this.envVars.NEXTAUTH_URL;
        if (!value) {
          return {
            passed: false,
            message: 'NEXTAUTH_URL não configurada (opcional)',
            fix: 'Adicione NEXTAUTH_URL=https://seu-dominio.com'
          };
        }
        if (!value.startsWith('http')) {
          return {
            passed: false,
            message: 'NEXTAUTH_URL inválida (deve começar com http)',
            fix: 'Use https://seu-dominio.com ou http://localhost:3000'
          };
        }
        return {
          passed: true,
          message: 'NEXTAUTH_URL configurada',
          details: { value }
        };
      }
    },

    {
      name: 'Arquivo database-schema.sql',
      required: true,
      validate: async () => {
        const filePath = path.join(this.projectRoot, 'database-schema.sql');
        if (!fs.existsSync(filePath)) {
          return {
            passed: false,
            message: 'Arquivo não encontrado',
            fix: 'Arquivo database-schema.sql deve estar na raiz do projeto'
          };
        }
        const content = fs.readFileSync(filePath, 'utf-8');
        const hasCreateTable = content.includes('CREATE TABLE');
        if (!hasCreateTable) {
          return {
            passed: false,
            message: 'Arquivo inválido (sem CREATE TABLE)',
            fix: 'Verifique o conteúdo do arquivo SQL'
          };
        }
        return {
          passed: true,
          message: 'Arquivo válido',
          details: { size: content.length }
        };
      }
    },

    {
      name: 'Arquivo database-rls-policies.sql',
      required: true,
      validate: async () => {
        const filePath = path.join(this.projectRoot, 'database-rls-policies.sql');
        if (!fs.existsSync(filePath)) {
          return {
            passed: false,
            message: 'Arquivo não encontrado',
            fix: 'Arquivo database-rls-policies.sql deve estar na raiz do projeto'
          };
        }
        const content = fs.readFileSync(filePath, 'utf-8');
        const hasPolicy = content.includes('CREATE POLICY') || content.includes('ALTER TABLE');
        if (!hasPolicy) {
          return {
            passed: false,
            message: 'Arquivo inválido (sem policies)',
            fix: 'Verifique o conteúdo do arquivo SQL'
          };
        }
        return {
          passed: true,
          message: 'Arquivo válido',
          details: { size: content.length }
        };
      }
    },

    {
      name: 'Conexão com Supabase',
      required: true,
      validate: async () => {
        const url = this.envVars.NEXT_PUBLIC_SUPABASE_URL;
        const key = this.envVars.SUPABASE_SERVICE_ROLE_KEY;

        if (!url || !key) {
          return {
            passed: false,
            message: 'Credenciais não configuradas',
            fix: 'Configure as variáveis NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY'
          };
        }

        try {
          const supabase = createClient(url, key);
          const { error } = await supabase
            .from('users')
            .select('count', { count: 'exact', head: true });

          if (error && !error.message.includes('schema cache')) {
            return {
              passed: false,
              message: `Erro na conexão: ${error.message}`,
              fix: 'Verifique as credenciais no dashboard do Supabase'
            };
          }

          return {
            passed: true,
            message: 'Conexão estabelecida com sucesso'
          };
        } catch (error: unknown) {
          return {
            passed: false,
            message: `Exceção: ${this.getErrorMessage(error)}`,
            fix: 'Verifique sua conexão de internet e as credenciais'
          };
        }
      }
    },

    {
      name: 'Node.js versão',
      required: true,
      validate: async () => {
        const version = process.version;
        const major = parseInt(version.slice(1).split('.')[0]);
        
        if (major < 18) {
          return {
            passed: false,
            message: `Node.js ${version} muito antigo (mínimo: 18.x)`,
            fix: 'Atualize o Node.js para a versão 18 ou superior'
          };
        }

        return {
          passed: true,
          message: `Node.js ${version} OK`,
          details: { version }
        };
      }
    },

    {
      name: 'Diretório node_modules',
      required: true,
      validate: async () => {
        const modulesPath = path.join(this.projectRoot, 'scripts', 'node_modules');
        if (!fs.existsSync(modulesPath)) {
          return {
            passed: false,
            message: 'node_modules não encontrado',
            fix: 'Execute: cd scripts && npm install'
          };
        }

        // Verificar dependências específicas
        const requiredPackages = ['@supabase/supabase-js', 'tsx', 'typescript'];
        const missing: string[] = [];

        for (const pkg of requiredPackages) {
          const pkgPath = path.join(modulesPath, pkg);
          if (!fs.existsSync(pkgPath)) {
            missing.push(pkg);
          }
        }

        if (missing.length > 0) {
          return {
            passed: false,
            message: `Pacotes faltando: ${missing.join(', ')}`,
            fix: 'Execute: cd scripts && npm install'
          };
        }

        return {
          passed: true,
          message: 'Dependências instaladas',
          details: { packages: requiredPackages.length }
        };
      }
    }
  ];

  // ═══════════════════════════════════════════════════════════════════════
  // EXECUÇÃO DA VALIDAÇÃO
  // ═══════════════════════════════════════════════════════════════════════

  async validate(): Promise<EnvironmentReport> {
    this.log('\n╔═══════════════════════════════════════════════════════════════════╗', 'info');
    this.log('║                                                                   ║', 'info');
    this.log('║           🔐 VALIDAÇÃO DE AMBIENTE v1.0                          ║', 'info');
    this.log('║                                                                   ║', 'info');
    this.log('╚═══════════════════════════════════════════════════════════════════╝\n', 'info');

    const results: Array<ValidationResult & { rule: string; required: boolean }> = [];

    for (const rule of this.rules) {
      this.log(`\n🔍 Validando: ${rule.name}...`, 'info');
      
      try {
        const result = await rule.validate();
        results.push({
          ...result,
          rule: rule.name,
          required: rule.required
        });

        const icon = result.passed ? '✅' : '❌';
        const level = result.passed ? 'success' : rule.required ? 'error' : 'warning';
        this.log(`${icon} ${result.message}`, level);

        if (!result.passed && result.fix) {
          this.log(`   💡 Solução: ${result.fix}`, 'info');
        }
      } catch (error: unknown) {
        results.push({
          passed: false,
          message: `Erro ao validar: ${this.getErrorMessage(error)}`,
          rule: rule.name,
          required: rule.required
        });
        this.log(`❌ Erro ao validar: ${this.getErrorMessage(error)}`, 'error');
      }
    }

    // Calcular estatísticas
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed && r.required).length;
    const warnings = results.filter(r => !r.passed && !r.required).length;

    const score = Math.round((passed / results.length) * 100);
    const overall: 'pass' | 'fail' | 'warning' = 
      failed > 0 ? 'fail' : warnings > 0 ? 'warning' : 'pass';

    return {
      overall,
      timestamp: new Date().toISOString(),
      results,
      score,
      summary: { passed, failed, warnings }
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // RELATÓRIO
  // ═══════════════════════════════════════════════════════════════════════

  printReport(report: EnvironmentReport) {
    this.log('\n╔═══════════════════════════════════════════════════════════════════╗', 'info');
    this.log('║                    📊 RELATÓRIO DE VALIDAÇÃO                     ║', 'info');
    this.log('╚═══════════════════════════════════════════════════════════════════╝\n', 'info');

    // Status geral
    const overallIcon = report.overall === 'pass' ? '🟢' : 
                        report.overall === 'warning' ? '🟡' : '🔴';
    const overallText = report.overall === 'pass' ? 'APROVADO' : 
                        report.overall === 'warning' ? 'APROVADO COM RESSALVAS' : 'REPROVADO';
    
    this.log(`${overallIcon} Status Geral: ${overallText}`, 
             report.overall === 'pass' ? 'success' : 
             report.overall === 'warning' ? 'warning' : 'error');
    
    this.log(`📊 Score: ${report.score}/100`, 'info');
    this.log(`⏰ Timestamp: ${report.timestamp}\n`, 'info');

    // Resumo
    this.log('📋 Resumo:\n', 'info');
    this.log(`   ✅ Aprovados: ${report.summary.passed}/${report.results.length}`, 'success');
    this.log(`   ❌ Reprovados (Críticos): ${report.summary.failed}/${report.results.length}`, 'error');
    this.log(`   ⚠️  Avisos (Opcionais): ${report.summary.warnings}/${report.results.length}\n`, 'warning');

    // Problemas críticos
    const criticalIssues = report.results.filter(r => !r.passed && r.required);
    if (criticalIssues.length > 0) {
      this.log('🚨 Problemas Críticos que Impedem o Funcionamento:\n', 'error');
      criticalIssues.forEach((issue, index) => {
        this.log(`   ${index + 1}. ${issue.rule}:`, 'error');
        this.log(`      Erro: ${issue.message}`, 'error');
        if (issue.fix) {
          this.log(`      💡 Solução: ${issue.fix}`, 'info');
        }
      });
      this.log('', 'info');
    }

    // Avisos
    const warningIssues = report.results.filter(r => !r.passed && !r.required);
    if (warningIssues.length > 0) {
      this.log('⚠️  Itens Opcionais Não Configurados:\n', 'warning');
      warningIssues.forEach((issue, index) => {
        this.log(`   ${index + 1}. ${issue.rule}:`, 'warning');
        this.log(`      Aviso: ${issue.message}`, 'warning');
        if (issue.fix) {
          this.log(`      💡 Solução: ${issue.fix}`, 'info');
        }
      });
      this.log('', 'info');
    }

    // Recomendações finais
    this.log('💡 Recomendações:\n', 'info');
    
    if (report.overall === 'pass') {
      this.log('   ✅ Ambiente completamente configurado!', 'success');
      this.log('   ✅ Pronto para desenvolvimento e produção', 'success');
      this.log('   ✅ Todas as validações passaram', 'success');
    } else if (report.overall === 'warning') {
      this.log('   ⚠️  Ambiente funcional mas não otimizado', 'warning');
      this.log('   ⚠️  Configure itens opcionais para melhor experiência', 'warning');
      this.log('   ✅ Sistema pode ser usado normalmente', 'success');
    } else {
      this.log('   ❌ Ambiente não está pronto!', 'error');
      this.log('   ❌ Corrija os problemas críticos acima', 'error');
      this.log('   ❌ Sistema pode não funcionar corretamente', 'error');
    }

    this.log('\n');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXECUÇÃO
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  const validator = new EnvironmentValidator();
  const report = await validator.validate();
  validator.printReport(report);

  // Exit code baseado no resultado
  if (report.overall === 'pass') {
    process.exit(0);
  } else if (report.overall === 'warning') {
    process.exit(0); // Avisos não impedem execução
  } else {
    process.exit(1); // Falhas críticas impedem execução
  }
}

main().catch(console.error);
