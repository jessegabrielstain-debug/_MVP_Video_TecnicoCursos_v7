import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function deploy() {
    console.log('🚀 Deploying RPC function...');
    const sqlPath = path.join(process.cwd(), 'scripts', 'sql', 'migrations', '2025-11-26_create_get_next_job_rpc.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
        // Fallback to REST call if exec_sql RPC is not available (it usually is if setup-supabase-auto ran)
        console.log('⚠️ RPC exec_sql failed, trying direct REST call...');
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
                'apikey': SERVICE_KEY,
                'Authorization': `Bearer ${SERVICE_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sql_query: sql })
        });

        if (!response.ok) {
            console.error('❌ Failed to deploy RPC:', await response.text());
            process.exit(1);
        }
    }

    console.log('✅ RPC function deployed successfully!');
}

deploy();
