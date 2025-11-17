#!/usr/bin/env node
/**
 * Script de aplicação dos SQLs de RBAC no Supabase
 * Executa database-rbac-seed.sql e database-rbac-rls.sql usando conexão direta PostgreSQL
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import chalk from 'chalk';
import pg from 'pg';

const { Client } = pg;

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(process.cwd(), 'estudio_ia_videos', 'app', '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config();

const directDatabaseUrl = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;

if (!directDatabaseUrl) {
  console.error(chalk.red('❌ Erro: DIRECT_DATABASE_URL ou DATABASE_URL é obrigatória'));
  console.error(chalk.yellow('   Configure em estudio_ia_videos/app/.env.local'));
  process.exit(1);
}

console.log(chalk.gray('🔗 Usando DATABASE_URL para conexão direta PostgreSQL\n'));

interface SQLFile {
  name: string;
  path: string;
  description: string;
}

const sqlFiles: SQLFile[] = [
  {
    name: 'database-rbac-seed.sql',
    path: path.join(process.cwd(), 'database-rbac-seed.sql'),
    description: 'Seeds de roles e permissões'
  },
  {
    name: 'database-rbac-rls.sql',
    path: path.join(process.cwd(), 'database-rbac-rls.sql'),
    description: 'Políticas RLS para RBAC'
  }
];

async function executeSQLFile(file: SQLFile, client: pg.Client): Promise<boolean> {
  console.log(chalk.cyan(`\n📄 Processando: ${file.name}`));
  console.log(chalk.gray(`   ${file.description}`));

  // Verificar se arquivo existe
  if (!fs.existsSync(file.path)) {
    console.log(chalk.red(`   ❌ Arquivo não encontrado: ${file.path}`));
    return false;
  }

  try {
    // Ler conteúdo do arquivo
    const sqlContent = fs.readFileSync(file.path, 'utf-8');
    
    console.log(chalk.gray(`   📊 Executando SQL completo...`));

    try {
      // Executar SQL completo (PostgreSQL suporta múltiplos statements)
      await client.query(sqlContent);
      console.log(chalk.green(`   ✅ SQL executado com sucesso`));
      return true;
    } catch (err) {
      const error = err as Error;
      
      // Checar se é erro de "já existe"
      if (error.message.includes('already exists') || 
          error.message.includes('duplicate key')) {
        console.log(chalk.yellow(`   ⏭️  Recursos já existem, continuando...`));
        return true;
      }
      
      console.log(chalk.red(`   ❌ Erro ao executar SQL: ${error.message}`));
      return false;
    }

  } catch (error) {
    console.log(chalk.red(`   ❌ Erro ao processar arquivo: ${error instanceof Error ? error.message : 'Unknown'}`));
    return false;
  }
}

async function applyRBACSchema() {
  console.log(chalk.bold.cyan('\n🔐 Aplicação de Schema RBAC no Supabase\n'));
  console.log(chalk.gray('═'.repeat(60)));

  const client = new Client({
    connectionString: directDatabaseUrl,
  });

  try {
    console.log(chalk.cyan('📡 Conectando ao PostgreSQL...'));
    await client.connect();
    console.log(chalk.green('✅ Conectado com sucesso\n'));

    const results: { file: string; success: boolean }[] = [];

    for (const file of sqlFiles) {
      const success = await executeSQLFile(file, client);
      results.push({ file: file.name, success });
    }

    console.log(chalk.gray('\n' + '═'.repeat(60)));
    console.log(chalk.bold('\n📊 Resumo:\n'));

    results.forEach(result => {
      const icon = result.success ? '✅' : '❌';
      const color = result.success ? chalk.green : chalk.red;
      console.log(color(`${icon} ${result.file}: ${result.success ? 'SUCESSO' : 'FALHOU'}`));
    });

    const allSuccess = results.every(r => r.success);

    if (allSuccess) {
      console.log(chalk.green.bold('\n✨ Todos os arquivos aplicados com sucesso!\n'));
      console.log(chalk.cyan('📌 Próximos passos:'));
      console.log(chalk.gray('   1. Verifique as tabelas: roles, permissions, role_permissions, user_roles'));
      console.log(chalk.gray('   2. Teste a atribuição de roles em /dashboard/admin/roles'));
      console.log(chalk.gray('   3. Valide as políticas RLS com diferentes usuários\n'));
      process.exit(0);
    } else {
      console.log(chalk.red.bold('\n⚠️  Alguns arquivos falharam. Revise os erros acima.\n'));
      console.log(chalk.yellow('💡 Dica: Você pode aplicar os SQLs manualmente no Supabase SQL Editor:'));
      console.log(chalk.gray('   https://supabase.com/dashboard/project/SEU_PROJECT/sql\n'));
      process.exit(1);
    }

  } catch (error) {
    console.error(chalk.red('\n❌ Erro na conexão PostgreSQL:'), error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Executar
applyRBACSchema().catch(error => {
  console.error(chalk.red('\n❌ Erro fatal:'), error);
  process.exit(1);
});
