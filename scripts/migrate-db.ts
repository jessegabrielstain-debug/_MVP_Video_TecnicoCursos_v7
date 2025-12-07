import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
function loadEnv() {
  let envPath = path.join(process.cwd(), 'estudio_ia_videos', '.env.local');
  if (!fs.existsSync(envPath)) {
    envPath = path.join(process.cwd(), '.env');
  }
  
  if (fs.existsSync(envPath)) {
    console.log(`Loading env from ${envPath}`);
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) process.env[key] = value;
      }
    });
  }
}

loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function execSql(sql: string) {
  // Try via RPC client first
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
  
  if (error) {
    // If client fails (e.g. schema cache), try direct fetch
    console.warn('RPC client failed, trying direct fetch...', error.message);
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY!,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sql_query: sql })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Fetch failed: ${response.status} ${text}`);
    }
    
    return await response.json();
  }
  
  return data;
}

async function ensureMigrationsTable() {
  console.log('Checking _migrations table...');
  const sql = `
    CREATE TABLE IF NOT EXISTS public._migrations (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await execSql(sql);
}

async function getAppliedMigrations() {
  const { data, error } = await supabase.from('_migrations').select('name');
  if (error) throw error;
  return (data || []).map(m => m.name);
}

async function applyMigration(name: string, filePath: string) {
  console.log(`Applying migration: ${name}...`);
  const sql = fs.readFileSync(filePath, 'utf-8');
  
  // Split by semicolon to execute statements individually if needed, 
  // but exec_sql usually handles blocks. 
  // However, for safety and better error reporting, we might want to run the whole file.
  // If the file contains transactions (BEGIN; ... COMMIT;), it should be run as one block.
  
  try {
    await execSql(sql);
    await supabase.from('_migrations').insert({ name });
    console.log(`✅ Applied ${name}`);
  } catch (e: any) {
    console.error(`❌ Failed to apply ${name}:`, e.message);
    process.exit(1);
  }
}

async function main() {
  try {
    await ensureMigrationsTable();
    
    const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      console.log('No migrations directory found.');
      return;
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort(); // Ensure chronological order

    const applied = await getAppliedMigrations();
    const pending = files.filter(f => !applied.includes(f));

    if (pending.length === 0) {
      console.log('Database is up to date.');
      return;
    }

    console.log(`Found ${pending.length} pending migrations.`);

    for (const file of pending) {
      await applyMigration(file, path.join(migrationsDir, file));
    }

    console.log('All migrations applied successfully.');
  } catch (e: any) {
    console.error('Migration failed:', e.message);
    process.exit(1);
  }
}

main();
