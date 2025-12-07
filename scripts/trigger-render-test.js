import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: 'scripts/.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('🔍 Inspecting render_jobs table...');

    try {
        const { data: jobs, error } = await supabase
            .from('render_jobs')
            .select('*')
            .limit(1);

        if (error) {
            console.error('❌ Error fetching jobs:', error);
            return;
        }

        if (jobs && jobs.length > 0) {
            console.log('✅ Found job:', jobs[0]);
            console.log('📋 Columns:', Object.keys(jobs[0]));
        } else {
            console.log('⚠️ No jobs found.');
        }

    } catch (err) {
        console.error('❌ Unexpected error:', err);
    }
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
