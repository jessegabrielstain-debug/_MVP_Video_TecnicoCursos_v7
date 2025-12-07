import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();
// We need a valid user token or we need to bypass auth for this test.
// Since we are running locally, we might need to mock the auth or use a test user.
// However, the API routes check for `supabase.auth.getUser()`.
// This is tricky for a CLI script without a real session.

// ALTERNATIVE: We can use the database directly to create the user context or use a service role key if the API allows it.
// But the API uses `createServerSupabaseClient` which usually looks at cookies.

// STRATEGY:
// Instead of hitting the Next.js API (which requires Auth Cookies), 
// we will simulate the API logic by interacting with the Database directly using the Service Role Key,
// BUT we want to test the Worker.
// So we can:
// 1. Create Project & Slides directly in DB (simulating the API).
// 2. Create Render Job directly in DB (simulating the API).
// 3. Run the Worker.
// 4. Check DB for completion.

// Wait, the user wants to test the "Real Implementation".
// If I bypass the API, I'm not testing the API.
// But testing Next.js Auth protected routes from a script is hard without a valid session cookie.

// Let's try to use the `scripts/render-worker.js` which we know works with the DB.
// We can create a script that inserts the necessary data into the DB to simulate a "Saved Project".
// Then we trigger the worker.

import pg from 'pg';
const { Client } = pg;

const client = new Client({
    connectionString: process.env.DIRECT_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

import { spawn } from 'child_process';

async function runE2ETest() {
    console.log('🚀 Starting End-to-End Test (Database -> Worker -> Output)');

    try {
        await client.connect();
        
        // 1. Get a Test User
        const userRes = await client.query("SELECT id FROM auth.users LIMIT 1");
        if (userRes.rows.length === 0) throw new Error("No users found in auth.users");
        const userId = userRes.rows[0].id;
        console.log(`👤 Using User ID: ${userId}`);

        // 2. Create a Project
        const projectId = crypto.randomUUID();
        console.log(`📁 Creating Project: ${projectId}`);
        const renderSettings = JSON.stringify({
            width: 1920,
            height: 1080,
            fps: 30,
            duration: 10
        });
        
        await client.query(`
            INSERT INTO public.projects (id, name, user_id, render_settings)
            VALUES ($1, 'E2E Test Project', $2, $3)
        `, [projectId, userId, renderSettings]);

        // 3. Create Slides (The Worker reads from public.slides)
        console.log('📄 Creating Slides...');
        await client.query(`
            INSERT INTO public.slides (id, project_id, order_index, title, content, duration)
            VALUES 
            ($1, $2, 0, 'Slide 1', 'Olá, este é um teste automatizado de renderização.', 5),
            ($3, $2, 1, 'Slide 2', 'Se você ouvir isso, o worker funcionou corretamente.', 5)
        `, [crypto.randomUUID(), projectId, crypto.randomUUID()]);

        // 4. Create Render Job
        console.log('🎬 Creating Render Job...');
        const jobId = crypto.randomUUID();
        await client.query(`
            INSERT INTO public.render_jobs (id, project_id, user_id, status, progress, render_settings)
            VALUES ($1, $2, $3, 'queued', 0, $4)
        `, [jobId, projectId, userId, JSON.stringify({ type: 'video' })]);

        console.log(`✅ Job Queued: ${jobId}`);
        
        // 4.5 Spawn the Worker
        console.log('👷 Spawning Worker Process...');
        const worker = spawn('node', ['scripts/render-worker.js', '--once'], {
            stdio: 'inherit',
            shell: true
        });

        worker.on('close', (code) => {
            console.log(`Worker exited with code ${code}`);
        });

        console.log('⏳ Waiting for Worker to process...');

        // 5. Poll for completion
        let attempts = 0;
        while (attempts < 60) { // Wait up to 2 minutes
            const res = await client.query("SELECT status, progress, error_message, output_url FROM public.render_jobs WHERE id = $1", [jobId]);
            const job = res.rows[0];

            process.stdout.write(`\r   Status: ${job.status} | Progress: ${job.progress}%`);

            if (job.status === 'completed') {
                console.log('\n\n🎉 SUCCESS! Video Rendered.');
                console.log(`🔗 Output URL: ${job.output_url}`);
                break;
            }

            if (job.status === 'failed') {
                console.log('\n\n❌ FAILED! Worker reported error.');
                console.log(`Error: ${job.error_message}`);
                break;
            }

            await new Promise(r => setTimeout(r, 2000));
            attempts++;
        }

        if (attempts >= 60) {
            console.log('\n\n⏰ Timeout waiting for job completion.');
        }

    } catch (err) {
        console.error('\n❌ Test Failed:', err);
    } finally {
        await client.end();
        // Force exit to kill any hanging handles
        process.exit(0);
    }
}

runE2ETest();
