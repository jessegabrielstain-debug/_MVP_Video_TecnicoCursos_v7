
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRef = 'ofhzrdiadxigrvmrhaiz';
const password = 'Tr1unf0@'; // Decoded from Tr1unf0%40
const encodedPassword = encodeURIComponent(password);

// Options to try
const connectionStrings = [
    // Option 1: Direct DB, user postgres
    `postgresql://postgres:${encodedPassword}@db.${projectRef}.supabase.co:5432/postgres`,
    // Option 2: Pooler (guessing region us-east-1)
    `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`,
    // Option 3: Pooler (guessing region sa-east-1 - Brazil)
    `postgresql://postgres.${projectRef}:${encodedPassword}@aws-0-sa-east-1.pooler.supabase.com:6543/postgres`,
     // Option 4: Direct DB, user postgres.[ref] (sometimes used)
    `postgresql://postgres.${projectRef}:${encodedPassword}@db.${projectRef}.supabase.co:5432/postgres`
];

async function tryConnect(url, index) {
    console.log(`\n🔌 Tentativa ${index + 1}: ${url.replace(password, '*****')}...`);
    const client = new Client({
        connectionString: url,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000
    });

    try {
        await client.connect();
        console.log('✅ CONECTADO COM SUCESSO!');
        return client;
    } catch (error) {
        console.log(`❌ Falha: ${error.message}`);
        await client.end();
        return null;
    }
}

async function run() {
    let client = null;

    for (let i = 0; i < connectionStrings.length; i++) {
        client = await tryConnect(connectionStrings[i], i);
        if (client) break;
    }

    if (!client) {
        console.error('\n❌ TODAS AS TENTATIVAS DE CONEXÃO FALHARAM.');
        console.error('   Verifique a senha ou o status do banco.');
        process.exit(1);
    }

    try {
        // Verificar se tabela existe
        console.log('\n🔍 Verificando tabela nr_templates...');
        const checkResult = await client.query(`
            SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'nr_templates'
            );
        `);

        const exists = checkResult.rows[0].exists;
        console.log(`   ${exists ? '✅' : '❌'} Tabela ${exists ? 'existe' : 'NÃO existe'}\n`);

        if (!exists) {
            console.log('📝 Executando migration SQL...');
            
            // Read the migration file
            // We need to find the file. Assuming it's in supabase/migrations
            const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251118000000_create_nr_templates_table.sql');
            
            if (!fs.existsSync(migrationPath)) {
                 console.error(`❌ Arquivo de migração não encontrado: ${migrationPath}`);
                 // Fallback: Use the content directly if file missing
                 const sql = `
                    CREATE TABLE IF NOT EXISTS public.nr_templates (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        nr_number VARCHAR(10) NOT NULL UNIQUE,
                        title TEXT NOT NULL,
                        description TEXT,
                        slide_count INTEGER NOT NULL DEFAULT 5,
                        duration_seconds INTEGER NOT NULL DEFAULT 300,
                        template_config JSONB DEFAULT '{}'::jsonb,
                        created_at TIMESTAMPTZ DEFAULT NOW(),
                        updated_at TIMESTAMPTZ DEFAULT NOW()
                    );
                    ALTER TABLE public.nr_templates ENABLE ROW LEVEL SECURITY;
                    CREATE POLICY "Todos podem ver templates NR" ON public.nr_templates FOR SELECT USING (true);
                    CREATE POLICY "Administradores podem gerenciar templates NR" ON public.nr_templates FOR ALL USING (auth.role() = 'service_role' OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
                 `;
                 console.log('   Usando SQL fallback...');
                 await client.query(sql);
            } else {
                const sql = fs.readFileSync(migrationPath, 'utf8');
                await client.query(sql);
            }

            console.log('✅ Migration executada com sucesso!');

            // Insert seed data
            console.log('🌱 Inserindo dados de exemplo...');
            await client.query(`
                INSERT INTO public.nr_templates (nr_number, title, description, slide_count, duration_seconds, template_config)
                VALUES 
                ('NR-35', 'Trabalho em Altura', 'Template padrão para cursos de NR-35 com foco em segurança e procedimentos.', 12, 600, '{"theme": "safety-red", "modules": ["intro", "equipamentos", "procedimentos"]}'::jsonb),
                ('NR-10', 'Segurança em Instalações Elétricas', 'Template para cursos de NR-10 cobrindo riscos elétricos e medidas de controle.', 15, 900, '{"theme": "electric-blue", "modules": ["riscos", "medidas", "primeiros-socorros"]}'::jsonb)
                ON CONFLICT (nr_number) DO NOTHING;
            `);
            console.log('✅ Dados inseridos!');

        } else {
            console.log('✅ Tabela já existe. Nenhuma ação necessária.');
        }

        // Create exec_sql function for future use
        console.log('\n🔓 Criando função exec_sql para automação futura...');
        await client.query(`
            CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
            RETURNS void
            LANGUAGE plpgsql
            SECURITY DEFINER
            AS $$
            BEGIN
            EXECUTE sql;
            END;
            $$;
        `);
        console.log('✅ Função exec_sql criada/atualizada!');

    } catch (error) {
        console.error('❌ Erro durante execução:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

run();
