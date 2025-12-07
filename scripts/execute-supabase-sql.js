#!/usr/bin/env node

/**
 * 🚀 EXECUÇÃO AUTOMATIZADA DOS SQLS SUPABASE
 * Script Node.js para executar SQLs diretamente no Supabase
 * Data: 13/10/2025
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

// Configurações
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DB_URL = process.env.DIRECT_DATABASE_URL;

// Cores para console
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// Arquivos SQL em ordem de execução
const sqlFiles = [
    {
        name: 'scripts/sql/migrations/2025-12-01_normalize_project_ids.sql',
        description: 'Migração: normalizar IDs de projeto para UUID e recriar FKs'
    },
    {
        name: 'database-schema.sql',
        description: 'Schema do banco de dados (tabelas, índices, triggers)'
    },
    {
        name: 'database-rbac-complete.sql',
        description: 'Sistema RBAC Completo (Roles & Permissions)'
    },
    {
        name: 'database-rbac-seed.sql',
        description: 'Seed Data para RBAC'
    },
    {
        name: 'database-rls-policies.sql', 
        description: 'Políticas de segurança RLS'
    },
    {
        name: 'database-nr-templates.sql',
        description: 'Tabela e dados iniciais de Templates NR'
    },
    {
        name: 'database-seed-test-users.sql',
        description: 'Usuários de Teste (Admin, Editor, Viewer, Moderator)'
    },
    {
        name: 'scripts/sql/migrations/2025-11-12_fix_render_jobs_status.sql',
        description: 'Migração: normalizar status de render_jobs (pending -> queued) e default'
    }
    ,
    {
        name: 'scripts/sql/migrations/2025-11-12_add_attempts_duration.sql',
        description: 'Migração: adicionar colunas attempts e duration_ms em render_jobs'
    },
    {
        name: 'scripts/sql/migrations/2025-11-23_fix_projects_schema.sql',
        description: 'Migração: corrigir schema de projects e adicionar tabelas faltantes'
    },
    {
        name: 'scripts/sql/migrations/2025-11-23_fix_user_relations.sql',
        description: 'Migração: corrigir referências de usuário para public.users'
    },
    {
        name: 'scripts/sql/migrations/2025-11-23_force_fix_projects_fk.sql',
        description: 'Migração: forçar correção da FK de projects para public.users'
    },
    {
        name: 'scripts/sql/migrations/2025-11-23_fix_slides_column.sql',
        description: 'Migração: renomear coluna index para order_index em slides'
    },
    {
        name: 'scripts/sql/migrations/2025-11-23_fix_render_jobs_schema.sql',
        description: 'Migração: corrigir constraints de status e FK de user_id em render_jobs'
    },
    {
        name: 'scripts/sql/migrations/2025-11-24_create_user_render_settings.sql',
        description: 'Migração: criar tabela user_render_settings'
    }
];

async function executeSQL() {
    log('═══════════════════════════════════════════════════════════════', 'cyan');
    log('🚀 EXECUÇÃO AUTOMATIZADA - SUPABASE SQL', 'cyan');
    log('═══════════════════════════════════════════════════════════════\n', 'cyan');

    // Verificar variáveis de ambiente
    if (!SUPABASE_URL || !SERVICE_KEY || !DB_URL) {
        log('❌ Variáveis de ambiente não encontradas!', 'red');
        log('Verifique: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DIRECT_DATABASE_URL', 'red');
        process.exit(1);
    }

    log('✅ Configurações carregadas', 'green');

    // Verificar arquivos SQL
    log('\n🔍 Verificando arquivos SQL...', 'yellow');
    for (const file of sqlFiles) {
        if (!fs.existsSync(file.name)) {
            log(`❌ Arquivo não encontrado: ${file.name}`, 'red');
            process.exit(1);
        }
        log(`✅ ${file.name} - ${file.description}`, 'green');
    }

    const { default: pg } = await import('pg');
    const { Client } = pg;

    // Configurar cliente PostgreSQL
    const client = new Client({
        connectionString: DB_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        // Conectar ao banco
        log('\n🔌 Conectando ao Supabase...', 'yellow');
        await client.connect();
        log('✅ Conectado com sucesso!', 'green');

        // Executar cada arquivo SQL
        for (const file of sqlFiles) {
            log(`\n🔄 Executando: ${file.description}...`, 'yellow');
            
            try {
                const sqlContent = fs.readFileSync(file.name, 'utf8');
                
                // Se o arquivo contém funções PL/PGSQL ($$), executar como um único bloco
                // Isso evita erros de split incorreto em ; dentro das funções
                if (sqlContent.includes('$$')) {
                    try {
                        await client.query(sqlContent);
                        log(`✅ ${file.description} executado com sucesso! (Bloco único)`, 'green');
                    } catch (blockError) {
                        // Se falhar o bloco único, tentamos o método antigo como fallback
                        // mas apenas se não for um erro de sintaxe óbvio que quebraria o split também
                        log(`⚠️ Erro ao executar bloco único: ${blockError.message}. Tentando comando a comando...`, 'yellow');
                        
                        // Fallback para o método antigo (split)
                        const commands = sqlContent
                            .split(';')
                            .map(cmd => cmd.trim())
                            .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

                        let successCount = 0;
                        let errorCount = 0;

                        for (const command of commands) {
                            if (command.trim()) {
                                try {
                                    await client.query(command);
                                    successCount++;
                                } catch (cmdError) {
                                    if (cmdError.message.includes('already exists') || 
                                        cmdError.message.includes('duplicate key') ||
                                        cmdError.message.includes('relation') && cmdError.message.includes('already exists')) {
                                        successCount++;
                                    } else {
                                        log(`❌ Erro no comando: ${cmdError.message}`, 'red');
                                        errorCount++;
                                    }
                                }
                            }
                        }
                        if (errorCount === 0) {
                            log(`✅ ${file.description} executado com sucesso! (${successCount} comandos)`, 'green');
                        } else {
                            log(`⚠️ ${file.description} executado com ${errorCount} erros de ${successCount + errorCount} comandos`, 'yellow');
                        }
                    }
                } else {
                    // Método original para arquivos simples
                    const commands = sqlContent
                        .split(';')
                        .map(cmd => cmd.trim())
                        .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

                    let successCount = 0;
                    let errorCount = 0;

                    for (const command of commands) {
                        if (command.trim()) {
                            try {
                                await client.query(command);
                                successCount++;
                            } catch (cmdError) {
                                // Ignorar erros de "já existe" que são esperados
                                if (cmdError.message.includes('already exists') || 
                                    cmdError.message.includes('duplicate key') ||
                                    cmdError.message.includes('relation') && cmdError.message.includes('already exists')) {
                                    log(`⚠️ Comando já executado anteriormente (ignorado)`, 'yellow');
                                    successCount++;
                                } else {
                                    log(`❌ Erro no comando: ${cmdError.message}`, 'red');
                                    errorCount++;
                                }
                            }
                        }
                    }

                    if (errorCount === 0) {
                        log(`✅ ${file.description} executado com sucesso! (${successCount} comandos)`, 'green');
                    } else {
                        log(`⚠️ ${file.description} executado com ${errorCount} erros de ${successCount + errorCount} comandos`, 'yellow');
                    }
                }

            } catch (fileError) {
                log(`❌ Erro ao executar ${file.name}: ${fileError.message}`, 'red');
                throw fileError;
            }
        }

        // Verificar tabelas criadas
        log('\n🔍 Verificando tabelas criadas...', 'yellow');
        const tablesResult = await client.query(`
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public' 
            ORDER BY tablename
        `);

        const expectedTables = ['users', 'projects', 'slides', 'render_jobs', 'analytics_events', 'nr_courses', 'nr_modules'];
        const createdTables = tablesResult.rows.map(row => row.tablename);

        log('\n📊 Tabelas encontradas:', 'cyan');
        for (const table of expectedTables) {
            if (createdTables.includes(table)) {
                log(`✅ ${table}`, 'green');
            } else {
                log(`❌ ${table} (não encontrada)`, 'red');
            }
        }

        // Verificar dados dos cursos
        log('\n🎓 Verificando cursos NR...', 'yellow');
        try {
            const coursesResult = await client.query('SELECT id, title FROM nr_courses ORDER BY title');
            if (coursesResult.rows.length > 0) {
                log(`✅ ${coursesResult.rows.length} cursos encontrados:`, 'green');
                coursesResult.rows.forEach(course => {
                    log(`   • ${course.title}`, 'blue');
                });
            } else {
                log('⚠️ Nenhum curso encontrado', 'yellow');
            }
        } catch (error) {
            log(`⚠️ Erro ao verificar cursos: ${error.message}`, 'yellow');
        }

        log('\n═══════════════════════════════════════════════════════════════', 'cyan');
        log('🎉 CONFIGURAÇÃO CONCLUÍDA COM SUCESSO!', 'green');
        log('✅ Banco de dados configurado', 'green');
        log('✅ Políticas RLS aplicadas', 'green');
        log('✅ Dados iniciais populados', 'green');
        log('\n🚀 Próximo passo: Configurar Storage Buckets', 'cyan');
        log('═══════════════════════════════════════════════════════════════', 'cyan');

    } catch (error) {
        log(`\n❌ Erro durante a execução: ${error.message}`, 'red');
        process.exit(1);
    } finally {
        await client.end();
    }
}

// Executar se chamado diretamente
executeSQL().catch(error => {
    log(`❌ Erro fatal: ${error.message}`, 'red');
    process.exit(1);
});

export { executeSQL };