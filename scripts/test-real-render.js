
import dotenv from 'dotenv';
import pg from 'pg';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';

dotenv.config();

const { Client } = pg;
const execPromise = util.promisify(exec);

const client = new Client({
    connectionString: process.env.DIRECT_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function runTest() {
    console.log('🧪 Iniciando Teste de Renderização Real...');

    try {
        await client.connect();
        
        // 1. Setup Test Data
        const userEmail = 'test_render_real@example.com';
        
        // Ensure User
        let userRes = await client.query("SELECT id FROM auth.users WHERE email = $1", [userEmail]);
        let userId;
        if (userRes.rows.length === 0) {
            console.log('   👤 Criando usuário de teste...');
            // Note: Inserting into auth.users directly is tricky due to Supabase auth schema.
            // We will try to use a known user ID if possible or insert a dummy one if RLS allows (it usually doesn't for auth.users).
            // BETTER APPROACH: Use the seed user if available, or just pick the first user.
            const anyUser = await client.query("SELECT id FROM auth.users LIMIT 1");
            if (anyUser.rows.length > 0) {
                userId = anyUser.rows[0].id;
                console.log(`   👤 Usando usuário existente: ${userId}`);
            } else {
                throw new Error("Nenhum usuário encontrado no banco. Execute o seed primeiro.");
            }
        } else {
            userId = userRes.rows[0].id;
        }

        // Create Project
        console.log('   📁 Criando projeto de teste...');
        const projRes = await client.query(`
            INSERT INTO public.projects (id, user_id, name, description, status)
            VALUES (gen_random_uuid(), $1, 'Projeto Teste Real Render', 'Teste automatizado de renderização', 'draft')
            RETURNING id
        `, [userId]);
        const projectId = projRes.rows[0].id;

        // Create Slides
        console.log('   📄 Criando slides...');
        await client.query(`
            INSERT INTO public.slides (id, project_id, title, content, order_index)
            VALUES 
            (gen_random_uuid(), $1, 'Slide 1: Introdução', 'Bem-vindo ao teste de renderização real. Este é o primeiro slide.', 0),
            (gen_random_uuid(), $1, 'Slide 2: Conteúdo', 'Aqui testamos a geração de áudio e vídeo com Remotion e Edge TTS.', 1)
        `, [projectId]);

        // Create Render Job
        console.log('   🎬 Criando Render Job...');
        const jobRes = await client.query(`
            INSERT INTO public.render_jobs (id, project_id, user_id, status, progress)
            VALUES (gen_random_uuid(), $1, $2, 'queued', 0)
            RETURNING id
        `, [projectId, userId]);
        const jobId = jobRes.rows[0].id;
        console.log(`   ✅ Job criado: ${jobId}`);

        await client.end(); // Close DB connection to allow worker to run cleanly if needed (though pg handles multiple connections)

        // 2. Run Worker
        console.log('   👷 Executando Worker (Run Once)...');
        const workerPath = path.join(process.cwd(), 'scripts', 'render-worker.js');
        
        // We run the worker and pipe output to console
        const { stdout, stderr } = await execPromise(`node "${workerPath}" --once`);
        console.log('   --- Worker Output ---');
        console.log(stdout);
        if (stderr) console.error('   --- Worker Errors ---', stderr);
        console.log('   ---------------------');

        // 3. Verify Output
        const videoPath = path.join(process.cwd(), 'estudio_ia_videos', 'public', 'videos', `${jobId}.mp4`);
        if (fs.existsSync(videoPath)) {
            const stats = fs.statSync(videoPath);
            console.log(`   ✅ VÍDEO GERADO COM SUCESSO!`);
            console.log(`      Caminho: ${videoPath}`);
            console.log(`      Tamanho: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
        } else {
            console.error(`   ❌ VÍDEO NÃO ENCONTRADO em: ${videoPath}`);
            process.exit(1);
        }

    } catch (err) {
        console.error('❌ Falha no teste:', err);
        process.exit(1);
    }
}

runTest();
