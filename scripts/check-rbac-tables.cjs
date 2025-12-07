const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Load environment variables
const APP_ROOT = path.join(__dirname, '..', 'estudio_ia_videos');
const envPath = path.join(APP_ROOT, '.env.local');

if (fs.existsSync(envPath)) {
  const envConfig = require('dotenv').parse(fs.readFileSync(envPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log('Checking RBAC tables...');
  const tables = ['roles', 'permissions', 'role_permissions', 'user_roles'];
  let missing = [];

  for (const table of tables) {
    const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
    if (error) {
      console.log(`Table '${table}' check failed: ${error.message}`);
      missing.push(table);
    } else {
      console.log(`Table '${table}' exists.`);
    }
  }

  if (missing.length > 0) {
    console.log('Missing tables:', missing.join(', '));
    process.exit(1);
  } else {
    console.log('All RBAC tables exist.');
    process.exit(0);
  }
}

checkTables();
