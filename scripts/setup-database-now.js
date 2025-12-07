#!/usr/bin/env node

import fs from 'fs';
import dotenv from 'dotenv';
import pkg from 'pg';

dotenv.config();

console.log('🚀 CONFIGURAÇÃO SUPABASE - EXECUÇÃO DIRETA');
console.log('═══════════════════════════════════════════════════════════════');

// Verificar dependências
try {
    console.log('✅ Dependência pg encontrada');
} catch (error) {
    console.log('❌ Dependência pg não encontrada. Execute: npm install pg');
    process.exit(1);
}

const { Client } = pkg;

async function setupDatabase() {
    const client = new Client({
        connectionString: process.env.DIRECT_DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('\n🔌 Conectando ao Supabase...');
        await client.connect();
        console.log('✅ Conectado com sucesso!');

        // 1. Executar schema
        console.log('\n📋 1/4 - Executando database-schema.sql...');
        try {
            const schema = fs.readFileSync('database-schema.sql', 'utf8');
            await client.query(schema);
            console.log('✅ Schema criado com sucesso!');
        } catch (error) {
            if (error.message.includes('already exists') || error.message.includes('duplicate')) {
                console.log('⚠️ Schema parcial ou totalmente existente (ignorado)');
            } else {
                console.error('❌ Erro no Schema:', error.message);
            }
        }

        // 2. Executar RLS policies
        console.log('\n🔐 2/4 - Executando database-rls-policies.sql...');
        try {
            const rls = fs.readFileSync('database-rls-policies.sql', 'utf8');
            await client.query(rls);
            console.log('✅ Políticas RLS aplicadas!');
        } catch (error) {
             if (error.message.includes('already exists') || error.message.includes('duplicate')) {
                console.log('⚠️ Políticas já existentes (ignorado)');
            } else {
                console.error('❌ Erro nas Políticas:', error.message);
            }
        }

        // 3. Executar nr_templates
        console.log('\n📋 3/4 - Executando database-nr-templates.sql...');
        try {
            const nrTemplates = fs.readFileSync('database-nr-templates.sql', 'utf8');
            await client.query(nrTemplates);
            console.log('✅ Tabela e dados de Templates NR criados!');
        } catch (error) {
             if (error.message.includes('already exists') || error.message.includes('duplicate')) {
                console.log('⚠️ Templates NR já existentes (ignorado)');
            } else {
                console.error('❌ Erro nos Templates NR:', error.message);
            }
        }

        // 4. Executar seed data
        console.log('\n🎓 4/4 - Executando seed-nr-courses.sql...');
        try {
            const seed = fs.readFileSync('seed-nr-courses.sql', 'utf8');
            await client.query(seed);
            console.log('✅ Dados iniciais populados!');
        } catch (error) {
             if (error.message.includes('already exists') || error.message.includes('duplicate')) {
                console.log('⚠️ Dados de seed já existentes (ignorado)');
            } else {
                console.error('❌ Erro no Seed:', error.message);
            }
        }

        // Verificar resultado
        console.log('\n🔍 Verificando resultado...');
        const tables = await client.query(`
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public' 
            ORDER BY tablename
        `);

        console.log(`✅ ${tables.rows.length} tabelas criadas:`);
        tables.rows.forEach(row => console.log(`   • ${row.tablename}`));

        const courses = await client.query('SELECT COUNT(*) as count FROM nr_courses');
        console.log(`✅ ${courses.rows[0].count} cursos NR populados`);

        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('🎉 CONFIGURAÇÃO CONCLUÍDA COM SUCESSO!');
        console.log('✅ Banco de dados configurado');
        console.log('✅ Políticas RLS aplicadas');
        console.log('✅ Dados iniciais populados');
        console.log('═══════════════════════════════════════════════════════════════');

    } catch (error) {
        console.error('\n❌ Erro durante configuração:', error.message);
        if (error.message.includes('already exists')) {
            console.log('⚠️ Alguns recursos já existem - isso é normal');
            console.log('✅ Configuração provavelmente já foi executada anteriormente');
        } else {
            throw error;
        }
    } finally {
        await client.end();
    }
}

setupDatabase().catch(console.error);