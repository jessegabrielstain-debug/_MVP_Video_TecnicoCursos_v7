/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 🏥 SISTEMA DE HEALTH CHECK COMPLETO
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Verifica integridade de todos os componentes do sistema
 * Versão: 1.0
 * Data: 10/10/2025
 * 
 * Funcionalidades:
 * - Verificação de banco de dados
 * - Verificação de storage
 * - Verificação de APIs externas
 * - Verificação de variáveis de ambiente
 * - Relatório detalhado de saúde
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

interface HealthCheckResult {
  component: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  details?: DetailRecord;
  responseTime?: number;
}

interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: HealthCheckResult[];
  score: number;
  summary: {
    healthy: number;
    degraded: number;
    unhealthy: number;
  };
}

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

type DetailRecord = Record<string, Json>;

type GenericTable<Row extends Record<string, Json>> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
};

type Database = {
  public: {
    Tables: {
      users: GenericTable<{ id: string }>;
      projects: GenericTable<Record<string, Json>>;
      slides: GenericTable<Record<string, Json>>;
      render_jobs: GenericTable<Record<string, Json>>;
      analytics_events: GenericTable<Record<string, Json>>;
      nr_courses: GenericTable<{ id: string; code: string; title: string }>;
      nr_modules: GenericTable<{ id: string; course_id: string; title: string }>;
    };
    Views: Record<string, never>;
    Functions: Record<string, unknown>;
    Enums: Record<string, unknown>;
    CompositeTypes: Record<string, unknown>;
  };
};

class HealthCheckSystem {
  private supabase: SupabaseClient<Database> | null = null;
  private results: HealthCheckResult[] = [];

  constructor() {
    this.loadEnv();
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient<Database>(supabaseUrl, supabaseKey);
    }
  }

  private loadEnv() {
    let envPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) {
      envPath = path.join(process.cwd(), '..', '.env');
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
  // CHECK 1: VARIÁVEIS DE AMBIENTE
  // ═══════════════════════════════════════════════════════════════════════

  async checkEnvironmentVariables(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    const requiredVars = {
      'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
      'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY,
      'DATABASE_URL': process.env.DATABASE_URL
    };

    const optionalVars = {
      'REDIS_URL': process.env.REDIS_URL,
      'NEXTAUTH_SECRET': process.env.NEXTAUTH_SECRET,
      'NEXTAUTH_URL': process.env.NEXTAUTH_URL
    };

    const missing = Object.entries(requiredVars)
      .filter(([_, value]) => !value)
      .map(([key, _]) => key);

    const missingOptional = Object.entries(optionalVars)
      .filter(([_, value]) => !value)
      .map(([key, _]) => key);

    const responseTime = Date.now() - startTime;

    if (missing.length === 0) {
      return {
        component: 'Environment Variables',
        status: missingOptional.length > 0 ? 'degraded' : 'healthy',
        message: missingOptional.length > 0 
          ? `Todas as variáveis críticas OK. ${missingOptional.length} variáveis opcionais faltando.`
          : 'Todas as variáveis de ambiente configuradas',
        details: {
          required: Object.keys(requiredVars).length,
          configured: Object.keys(requiredVars).length - missing.length,
          missingOptional: missingOptional
        },
        responseTime
      };
    } else {
      return {
        component: 'Environment Variables',
        status: 'unhealthy',
        message: `${missing.length} variáveis críticas faltando: ${missing.join(', ')}`,
        details: { missing },
        responseTime
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CHECK 2: CONEXÃO COM BANCO DE DADOS
  // ═══════════════════════════════════════════════════════════════════════

  async checkDatabaseConnection(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    if (!this.supabase) {
      return {
        component: 'Database Connection',
        status: 'unhealthy',
        message: 'Supabase client não inicializado',
        responseTime: Date.now() - startTime
      };
    }

    try {
      // Tentar query simples
      const { data, error } = await this.supabase
        .from('users')
        .select('count', { count: 'exact', head: true });

      const responseTime = Date.now() - startTime;

      if (error) {
        // Se tabela não existe no cache mas foi criada, considerar degraded
        if (error.message.includes('schema cache')) {
          return {
            component: 'Database Connection',
            status: 'degraded',
            message: 'Conexão OK mas cache desatualizado (aguardar 5 min)',
            details: { error: error.message },
            responseTime
          };
        }

        return {
          component: 'Database Connection',
          status: 'unhealthy',
          message: `Erro na conexão: ${error.message}`,
          details: { error: error.message },
          responseTime
        };
      }

      // Verificar latência
      let status: 'healthy' | 'degraded' = 'healthy';
      if (responseTime > 2000) status = 'degraded';

      return {
        component: 'Database Connection',
        status,
        message: status === 'healthy' 
          ? `Conexão OK (${responseTime}ms)` 
          : `Conexão lenta (${responseTime}ms)`,
        details: { latency: responseTime },
        responseTime
      };
    } catch (error: unknown) {
      return {
        component: 'Database Connection',
        status: 'unhealthy',
        message: `Exceção: ${this.getErrorMessage(error)}`,
        details: { error: this.getErrorMessage(error) },
        responseTime: Date.now() - startTime
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CHECK 3: TABELAS DO BANCO
  // ═══════════════════════════════════════════════════════════════════════

  async checkDatabaseTables(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    if (!this.supabase) {
      return {
        component: 'Database Tables',
        status: 'unhealthy',
        message: 'Supabase client não inicializado',
        responseTime: Date.now() - startTime
      };
    }

    const expectedTables = [
      'users', 
      'projects', 
      'slides', 
      'render_jobs', 
      'analytics_events', 
      'nr_courses', 
      'nr_modules'
    ];

    let tablesFound = 0;
    const tableStatus: Record<string, boolean> = {};

    for (const tableName of expectedTables) {
      try {
        const { error } = await this.supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        const exists = !error || error.message.includes('schema cache');
        if (exists) tablesFound++;
        tableStatus[tableName] = exists;
      } catch {
        tableStatus[tableName] = false;
      }
    }

    const responseTime = Date.now() - startTime;
    const percentage = Math.round((tablesFound / expectedTables.length) * 100);

    if (tablesFound === expectedTables.length) {
      return {
        component: 'Database Tables',
        status: 'healthy',
        message: `Todas as ${expectedTables.length} tabelas encontradas`,
        details: { tables: tableStatus, percentage },
        responseTime
      };
    } else if (tablesFound > 0) {
      return {
        component: 'Database Tables',
        status: 'degraded',
        message: `${tablesFound}/${expectedTables.length} tabelas encontradas (${percentage}%)`,
        details: { tables: tableStatus, percentage },
        responseTime
      };
    } else {
      return {
        component: 'Database Tables',
        status: 'unhealthy',
        message: 'Nenhuma tabela encontrada',
        details: { tables: tableStatus, percentage },
        responseTime
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CHECK 4: STORAGE BUCKETS
  // ═══════════════════════════════════════════════════════════════════════

  async checkStorageBuckets(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    if (!this.supabase) {
      return {
        component: 'Storage Buckets',
        status: 'unhealthy',
        message: 'Supabase client não inicializado',
        responseTime: Date.now() - startTime
      };
    }

    try {
      const { data: buckets, error } = await this.supabase.storage.listBuckets();

      const responseTime = Date.now() - startTime;

      if (error) {
        return {
          component: 'Storage Buckets',
          status: 'unhealthy',
          message: `Erro ao listar buckets: ${error.message}`,
          details: { error: error.message },
          responseTime
        };
      }

      const expectedBuckets = ['videos', 'avatars', 'thumbnails', 'assets'];
      const foundBuckets = buckets?.map(bucket => bucket.name) ?? [];
      const bucketsFound = expectedBuckets.filter(name => foundBuckets.includes(name)).length;
      const percentage = Math.round((bucketsFound / expectedBuckets.length) * 100);

      if (bucketsFound === expectedBuckets.length) {
        return {
          component: 'Storage Buckets',
          status: 'healthy',
          message: `Todos os ${expectedBuckets.length} buckets configurados`,
          details: { 
            buckets: foundBuckets,
            expected: expectedBuckets,
            percentage 
          },
          responseTime
        };
      } else if (bucketsFound > 0) {
        return {
          component: 'Storage Buckets',
          status: 'degraded',
          message: `${bucketsFound}/${expectedBuckets.length} buckets encontrados (${percentage}%)`,
          details: { 
            buckets: foundBuckets,
            expected: expectedBuckets,
            missing: expectedBuckets.filter(name => !foundBuckets.includes(name)),
            percentage 
          },
          responseTime
        };
      } else {
        return {
          component: 'Storage Buckets',
          status: 'unhealthy',
          message: 'Nenhum bucket encontrado',
          details: { 
            buckets: foundBuckets,
            expected: expectedBuckets,
            percentage 
          },
          responseTime
        };
      }
    } catch (error: unknown) {
      return {
        component: 'Storage Buckets',
        status: 'unhealthy',
        message: `Exceção: ${this.getErrorMessage(error)}`,
        details: { error: this.getErrorMessage(error) },
        responseTime: Date.now() - startTime
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CHECK 5: DADOS SEED
  // ═══════════════════════════════════════════════════════════════════════

  async checkSeedData(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    if (!this.supabase) {
      return {
        component: 'Seed Data',
        status: 'unhealthy',
        message: 'Supabase client não inicializado',
        responseTime: Date.now() - startTime
      };
    }

    try {
      const { data: courses, error, count } = await this.supabase
        .from('nr_courses')
        .select('code, title', { count: 'exact' });

      const responseTime = Date.now() - startTime;

      if (error) {
        // Se erro de cache, considerar degraded
        if (error.message.includes('schema cache')) {
          return {
            component: 'Seed Data',
            status: 'degraded',
            message: 'Tabela existe mas cache desatualizado',
            details: { error: error.message },
            responseTime
          };
        }

        return {
          component: 'Seed Data',
          status: 'unhealthy',
          message: `Erro ao buscar cursos: ${error.message}`,
          details: { error: error.message },
          responseTime
        };
      }

      const coursesCount = count || 0;

      if (coursesCount >= 3) {
        return {
          component: 'Seed Data',
          status: 'healthy',
          message: `${coursesCount} cursos NR encontrados`,
          details: { 
            count: coursesCount,
            courses: courses?.map(course => course.code) ?? []
          },
          responseTime
        };
      } else if (coursesCount > 0) {
        return {
          component: 'Seed Data',
          status: 'degraded',
          message: `Apenas ${coursesCount} cursos encontrados (esperado: 3)`,
          details: { 
            count: coursesCount,
            courses: courses?.map(course => course.code) ?? []
          },
          responseTime
        };
      } else {
        return {
          component: 'Seed Data',
          status: 'unhealthy',
          message: 'Nenhum curso NR encontrado',
          details: { count: 0 },
          responseTime
        };
      }
    } catch (error: unknown) {
      return {
        component: 'Seed Data',
        status: 'unhealthy',
        message: `Exceção: ${this.getErrorMessage(error)}`,
        details: { error: this.getErrorMessage(error) },
        responseTime: Date.now() - startTime
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CHECK 6: ARQUIVOS DO SISTEMA
  // ═══════════════════════════════════════════════════════════════════════

  async checkSystemFiles(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    const criticalFiles = [
      'database-schema.sql',
      'database-rls-policies.sql',
      'seed-nr-courses.sql',
      '.env'
    ];

    const projectRoot = path.join(process.cwd(), '..');
    const filesFound: string[] = [];
    const filesMissing: string[] = [];

    for (const file of criticalFiles) {
      const filePath = path.join(projectRoot, file);
      if (fs.existsSync(filePath)) {
        filesFound.push(file);
      } else {
        filesMissing.push(file);
      }
    }

    const responseTime = Date.now() - startTime;
    const percentage = Math.round((filesFound.length / criticalFiles.length) * 100);

    if (filesMissing.length === 0) {
      return {
        component: 'System Files',
        status: 'healthy',
        message: `Todos os ${criticalFiles.length} arquivos críticos presentes`,
        details: { files: filesFound, percentage },
        responseTime
      };
    } else if (filesFound.length > 0) {
      return {
        component: 'System Files',
        status: 'degraded',
        message: `${filesFound.length}/${criticalFiles.length} arquivos encontrados`,
        details: { 
          found: filesFound, 
          missing: filesMissing,
          percentage 
        },
        responseTime
      };
    } else {
      return {
        component: 'System Files',
        status: 'unhealthy',
        message: 'Arquivos críticos não encontrados',
        details: { missing: filesMissing, percentage },
        responseTime
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // EXECUÇÃO COMPLETA
  // ═══════════════════════════════════════════════════════════════════════

  async runAllChecks(): Promise<SystemHealth> {
    this.log('\n╔═══════════════════════════════════════════════════════════════════╗', 'info');
    this.log('║                                                                   ║', 'info');
    this.log('║           🏥 HEALTH CHECK SYSTEM v1.0                            ║', 'info');
    this.log('║                                                                   ║', 'info');
    this.log('╚═══════════════════════════════════════════════════════════════════╝\n', 'info');

    const checks = [
      { name: 'Environment Variables', fn: () => this.checkEnvironmentVariables() },
      { name: 'Database Connection', fn: () => this.checkDatabaseConnection() },
      { name: 'Database Tables', fn: () => this.checkDatabaseTables() },
      { name: 'Storage Buckets', fn: () => this.checkStorageBuckets() },
      { name: 'Seed Data', fn: () => this.checkSeedData() },
      { name: 'System Files', fn: () => this.checkSystemFiles() }
    ];

    this.results = [];

    for (const check of checks) {
      this.log(`\n🔍 Verificando: ${check.name}...`, 'info');
      const result = await check.fn();
      this.results.push(result);

      const icon = result.status === 'healthy' ? '✅' : 
                   result.status === 'degraded' ? '⚠️' : '❌';
      const level = result.status === 'healthy' ? 'success' : 
                    result.status === 'degraded' ? 'warning' : 'error';
      
      this.log(`${icon} ${result.component}: ${result.message}`, level);
      if (result.responseTime) {
        this.log(`   ⏱️  Tempo de resposta: ${result.responseTime}ms`, 'info');
      }
    }

    // Calcular saúde geral
    const summary = {
      healthy: this.results.filter(r => r.status === 'healthy').length,
      degraded: this.results.filter(r => r.status === 'degraded').length,
      unhealthy: this.results.filter(r => r.status === 'unhealthy').length
    };

    const score = Math.round(
      ((summary.healthy * 100) + (summary.degraded * 50)) / this.results.length
    );

    const overall: 'healthy' | 'degraded' | 'unhealthy' = 
      summary.unhealthy > 0 ? 'unhealthy' :
      summary.degraded > 0 ? 'degraded' : 'healthy';

    return {
      overall,
      timestamp: new Date().toISOString(),
      checks: this.results,
      score,
      summary
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // RELATÓRIO FINAL
  // ═══════════════════════════════════════════════════════════════════════

  printReport(health: SystemHealth) {
    this.log('\n╔═══════════════════════════════════════════════════════════════════╗', 'info');
    this.log('║                    📊 RELATÓRIO DE SAÚDE                         ║', 'info');
    this.log('╚═══════════════════════════════════════════════════════════════════╝\n', 'info');

    // Status geral
    const overallIcon = health.overall === 'healthy' ? '🟢' : 
                        health.overall === 'degraded' ? '🟡' : '🔴';
    const overallText = health.overall === 'healthy' ? 'SAUDÁVEL' : 
                        health.overall === 'degraded' ? 'DEGRADADO' : 'CRÍTICO';
    
    this.log(`${overallIcon} Status Geral: ${overallText}`, 
             health.overall === 'healthy' ? 'success' : 
             health.overall === 'degraded' ? 'warning' : 'error');
    
    this.log(`📊 Score de Saúde: ${health.score}/100`, 'info');
    this.log(`⏰ Timestamp: ${health.timestamp}\n`, 'info');

    // Resumo
    this.log('📋 Resumo dos Componentes:\n', 'info');
    this.log(`   ✅ Saudáveis: ${health.summary.healthy}/${health.checks.length}`, 'success');
    this.log(`   ⚠️  Degradados: ${health.summary.degraded}/${health.checks.length}`, 'warning');
    this.log(`   ❌ Críticos: ${health.summary.unhealthy}/${health.checks.length}\n`, 'error');

    // Detalhes de componentes problemáticos
    const problems = health.checks.filter(c => c.status !== 'healthy');
    if (problems.length > 0) {
      this.log('⚠️  Componentes que Requerem Atenção:\n', 'warning');
      problems.forEach(problem => {
        const icon = problem.status === 'degraded' ? '⚠️' : '❌';
        this.log(`   ${icon} ${problem.component}:`, problem.status === 'degraded' ? 'warning' : 'error');
        this.log(`      ${problem.message}`, 'info');
        if (problem.details) {
          this.log(`      Detalhes: ${JSON.stringify(problem.details, null, 2)}`, 'info');
        }
      });
    } else {
      this.log('🎉 Todos os componentes estão saudáveis!\n', 'success');
    }

    // Recomendações
    this.log('\n💡 Recomendações:\n', 'info');
    
    if (health.overall === 'healthy') {
      this.log('   ✅ Sistema pronto para produção!', 'success');
      this.log('   ✅ Todos os componentes operacionais', 'success');
      this.log('   ✅ Performance dentro dos padrões', 'success');
    } else if (health.overall === 'degraded') {
      this.log('   ⚠️  Sistema funcional mas com ressalvas', 'warning');
      this.log('   ⚠️  Monitorar componentes degradados', 'warning');
      this.log('   ⚠️  Considerar manutenção preventiva', 'warning');
    } else {
      this.log('   ❌ Ação imediata necessária!', 'error');
      this.log('   ❌ Componentes críticos falhando', 'error');
      this.log('   ❌ Sistema pode não funcionar corretamente', 'error');
    }

    this.log('\n');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXECUÇÃO
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  const healthCheck = new HealthCheckSystem();
  const health = await healthCheck.runAllChecks();
  healthCheck.printReport(health);

  // Exit code baseado na saúde
  if (health.overall === 'healthy') {
    process.exit(0);
  } else if (health.overall === 'degraded') {
    process.exit(1);
  } else {
    process.exit(2);
  }
}

main().catch(console.error);
