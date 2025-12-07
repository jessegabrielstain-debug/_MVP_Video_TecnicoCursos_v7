import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function check() {
    console.log('Checking tables...');
    const { data, error } = await supabase.from('render_jobs').select('count').limit(1);
    
    if (error) {
        console.error('❌ Error accessing render_jobs:', error.message);
    } else {
        console.log('✅ render_jobs table exists!');
    }
}

check();
