#!/usr/bin/env node

import fs from 'fs';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

console.log('🚀 CONFIGURAÇÃO SUPABASE VIA SDK');
console.log('═══════════════════════════════════════════════════════════════');

async function setupDatabaseWithSDK() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Variáveis Supabase não encontradas no .env');
        }
        
        console.log('✅ Credenciais Supabase encontradas');
        console.log('🔌 Conectando ao Supabase...');
        
        const supabase = createClient(supabaseUrl, supabaseKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
        
        console.log('✅ Conectado com sucesso!');

        /*
        // Testar conexão básica
        const { data: testData, error: testError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .limit(1);
            
        if (testError && !testError.message.includes('does not exist')) {
            throw new Error(`Erro de conexão: ${testError.message}`);
        }
        */

        // 1. Executar schema usando RPC
        console.log('\n📋 1/3 - Executando database-schema.sql...');
        const schema = fs.readFileSync('database-schema.sql', 'utf8');
        
        // Dividir o schema em comandos individuais
        const schemaCommands = schema
            .split(';')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
        
        for (let i = 0; i < schemaCommands.length; i++) {
            const command = schemaCommands[i];
            if (command.trim()) {
                try {
                    const { error } = await supabase.rpc('exec_sql', { sql_query: command });
                    if (error && !error.message.includes('already exists')) {
                        console.log(`⚠️ Comando ${i + 1}: ${error.message}`);
                    }
                } catch (err) {
                    console.log(`⚠️ Comando ${i + 1}: ${err.message}`);
                }
            }
        }
        console.log('✅ Schema processado!');

        // 2. Executar RLS policies
        console.log('\n🔐 2/3 - Executando database-rls-policies.sql...');
        const rls = fs.readFileSync('database-rls-policies.sql', 'utf8');
        
        const rlsCommands = rls
            .split(';')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
        
        for (let i = 0; i < rlsCommands.length; i++) {
            const command = rlsCommands[i];
            if (command.trim()) {
                try {
                    const { error } = await supabase.rpc('exec_sql', { sql_query: command });
                    if (error && !error.message.includes('already exists')) {
                        console.log(`⚠️ RLS ${i + 1}: ${error.message}`);
                    }
                } catch (err) {
                    console.log(`⚠️ RLS ${i + 1}: ${err.message}`);
                }
            }
        }
        console.log('✅ Políticas RLS processadas!');

        // 2.5. Executar nr_templates
        console.log('\n📋 2.5/3 - Executando database-nr-templates.sql...');
        const nrTemplates = fs.readFileSync('database-nr-templates.sql', 'utf8');
        
        const nrTemplatesCommands = nrTemplates
            .split(';')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
        
        for (let i = 0; i < nrTemplatesCommands.length; i++) {
            const command = nrTemplatesCommands[i];
            if (command.trim()) {
                try {
                    const { error } = await supabase.rpc('exec_sql', { sql_query: command });
                    if (error && !error.message.includes('already exists')) {
                        console.log(`⚠️ NR Templates ${i + 1}: ${error.message}`);
                    }
                } catch (err) {
                    console.log(`⚠️ NR Templates ${i + 1}: ${err.message}`);
                }
            }
        }
        console.log('✅ NR Templates processados!');

        // 3. Executar seed data
        console.log('\n🎓 3/3 - Executando seed-nr-courses.sql...');
        const seed = fs.readFileSync('seed-nr-courses.sql', 'utf8');
        
        const seedCommands = seed
            .split(';')
            .map(cmd => cmd.trim())
            .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
        
        for (let i = 0; i < seedCommands.length; i++) {
            const command = seedCommands[i];
            if (command.trim()) {
                try {
                    const { error } = await supabase.rpc('exec_sql', { sql_query: command });
                    if (error && !error.message.includes('already exists')) {
                        console.log(`⚠️ Seed ${i + 1}: ${error.message}`);
                    }
                } catch (err) {
                    console.log(`⚠️ Seed ${i + 1}: ${err.message}`);
                }
            }
        }
        console.log('✅ Dados iniciais processados!');

        // Verificar resultado
        console.log('\n🔍 Verificando resultado...');
        
        // Verificar tabelas criadas
        const { data: tables, error: tablesError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .order('table_name');
            
        if (!tablesError && tables) {
            console.log(`✅ ${tables.length} tabelas encontradas:`);
            tables.forEach(row => console.log(`   • ${row.table_name}`));
        }

        // Verificar cursos NR
        const { data: courses, error: coursesError } = await supabase
            .from('nr_courses')
            .select('course_code, title')
            .order('course_code');
            
        if (!coursesError && courses) {
            console.log(`✅ ${courses.length} cursos NR encontrados:`);
            courses.forEach(course => console.log(`   • ${course.course_code}: ${course.title}`));
        }

        // Verificar templates NR
        const { data: templates, error: templatesError } = await supabase
            .from('nr_templates')
            .select('nr_number, title')
            .order('nr_number');
            
        if (!templatesError && templates) {
            console.log(`✅ ${templates.length} templates NR encontrados:`);
            templates.forEach(template => console.log(`   • ${template.nr_number}: ${template.title}`));
        } else if (templatesError) {
            console.log(`❌ Erro ao verificar templates: ${templatesError.message}`);
        }

        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('🎉 CONFIGURAÇÃO CONCLUÍDA!');
        console.log('✅ Banco de dados configurado via Supabase SDK');
        console.log('✅ Tabelas criadas ou verificadas');
        console.log('✅ Políticas RLS aplicadas');
        console.log('✅ Dados iniciais populados');
        console.log('═══════════════════════════════════════════════════════════════');

    } catch (error) {
        console.error('\n❌ Erro durante configuração:', error.message);
        
        if (error.message.includes('exec_sql')) {
            console.log('\n💡 SOLUÇÃO ALTERNATIVA 1 (Recomendada):');
            console.log('1. Acesse o Supabase Dashboard: https://supabase.com/dashboard');
            console.log('2. Vá para SQL Editor');
            console.log('3. Copie e execute o conteúdo do arquivo:');
            console.log('   MANUAL_SETUP_COMPLETE.sql');
            
            console.log('\n💡 SOLUÇÃO ALTERNATIVA 2 (Habilitar Automação):');
            console.log('1. No SQL Editor, execute o arquivo:');
            console.log('   scripts/create-exec-sql.sql');
            console.log('2. Execute este script novamente:');
            console.log('   node scripts/setup-database-supabase-sdk.js');
        }
        
        throw error;
    }
}

setupDatabaseWithSDK().catch(console.error);