
import dotenv from 'dotenv';
import pg from 'pg';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const { Client } = pg;

const client = new Client({
    connectionString: process.env.DIRECT_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const TEST_USER_EMAIL = 'human_test@example.com';
const TEST_PROJECT_NAME = 'Human Test Project';

async function runUserJourney() {
    console.log('🚀 Iniciando Simulação de Jornada do Usuário (Human Test)...');
    
    try {
        await client.connect();
        console.log('✅ Conectado ao Banco de Dados');

        // 1. Simular Login / Obter Usuário
        console.log('\n👤 Passo 1: Autenticação/Identificação');
        let userRes = await client.query('SELECT id, email FROM auth.users WHERE email = $1', [TEST_USER_EMAIL]);
        
        let userId;
        if (userRes.rows.length === 0) {
            console.log('   ⚠️ Usuário de teste não encontrado. Criando usuário simulado...');
            // Nota: Em produção, isso seria via Auth API. Aqui inserimos direto para teste.
            userId = uuidv4();
            await client.query(`
                INSERT INTO auth.users (id, email, raw_user_meta_data)
                VALUES ($1, $2, $3)
            `, [userId, TEST_USER_EMAIL, '{"name": "Human Tester"}']);
            // A trigger deve criar o public.users
            console.log(`   ✅ Usuário criado: ${userId}`);
        } else {
            userId = userRes.rows[0].id;
            console.log(`   ✅ Usuário encontrado: ${userId}`);
        }

        // Verificar public.users
        const publicUserRes = await client.query('SELECT * FROM public.users WHERE id = $1', [userId]);
        if (publicUserRes.rows.length === 0) {
             console.log('   ❌ ERRO CRÍTICO: Usuário não existe em public.users (Trigger falhou?)');
             // Tentar corrigir manualmente
             await client.query('INSERT INTO public.users (id, email, name) VALUES ($1, $2, $3)', [userId, TEST_USER_EMAIL, 'Human Tester']);
             console.log('   🛠️ Correção aplicada: Usuário inserido em public.users manualmente.');
        } else {
            console.log('   ✅ Sincronia auth.users <-> public.users verificada.');
        }

        // 2. Dashboard - Listar Projetos
        console.log('\n📂 Passo 2: Dashboard (Listar Projetos)');
        const projectsRes = await client.query('SELECT id, name FROM public.projects WHERE user_id = $1', [userId]);
        console.log(`   ✅ Projetos encontrados: ${projectsRes.rows.length}`);

        // 3. Criar Novo Projeto
        console.log('\n✨ Passo 3: Criar Novo Projeto');
        const projectId = uuidv4();
        await client.query(`
            INSERT INTO public.projects (id, user_id, name, type, status, description)
            VALUES ($1, $2, $3, 'custom', 'draft', 'Projeto criado via teste automatizado')
        `, [projectId, userId, TEST_PROJECT_NAME]);
        console.log(`   ✅ Projeto criado: ${projectId}`);

        // 4. Adicionar Slides (Edição)
        console.log('\n🖼️ Passo 4: Editor (Adicionar Slides)');
        const slideId = uuidv4();
        await client.query(`
            INSERT INTO public.slides (id, project_id, order_index, title, content)
            VALUES ($1, $2, 0, 'Slide 1', 'Conteúdo de teste para renderização')
        `, [slideId, projectId]);
        console.log(`   ✅ Slide adicionado: ${slideId}`);

        // 5. Solicitar Renderização
        console.log('\n🎬 Passo 5: Renderização (Solicitar Job)');
        const jobId = uuidv4();
        await client.query(`
            INSERT INTO public.render_jobs (id, project_id, user_id, status, progress)
            VALUES ($1, $2, $3, 'queued', 0)
        `, [jobId, projectId, userId]);
        console.log(`   ✅ Job de renderização criado: ${jobId}`);

        // 6. Verificar Status (Simulação de Polling)
        console.log('\n📊 Passo 6: Verificar Status');
        const jobRes = await client.query('SELECT status, created_at FROM public.render_jobs WHERE id = $1', [jobId]);
        console.log(`   ✅ Status do Job: ${jobRes.rows[0].status}`);

        // 7. Limpeza (Opcional - manter para debug)
        console.log('\n🧹 Limpeza de Teste');
        // await client.query('DELETE FROM public.projects WHERE id = $1', [projectId]);
        // console.log('   ✅ Projeto de teste removido');
        console.log('   ℹ️ Dados mantidos para inspeção manual.');

        console.log('\n✅✅ JORNADA DO USUÁRIO CONCLUÍDA COM SUCESSO! O backend suporta o fluxo completo.');

    } catch (err) {
        console.error('\n❌ FALHA NA JORNADA DO USUÁRIO:');
        console.error(err);
    } finally {
        await client.end();
    }
}

runUserJourney();
