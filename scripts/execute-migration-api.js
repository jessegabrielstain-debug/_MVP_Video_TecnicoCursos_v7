/**
 * Execute migration via Supabase REST API (Direct SQL)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar .env
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
  }
});

const SERVICE_ROLE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY;
const PROJECT_URL = envVars.NEXT_PUBLIC_SUPABASE_URL;

async function executeMigrationViaAPI() {
  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251118000000_create_nr_templates_table.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  // Split SQL into individual statements (remove empty)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'));

  console.log(`📝 Executando ${statements.length} statements...\n`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i] + ';';
    console.log(`[${i+1}/${statements.length}] ${stmt.substring(0, 80)}...`);
    
    try {
      const response = await fetch(`${PROJECT_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ query: stmt })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`❌ Erro no statement ${i+1}:`, error);
      } else {
        console.log(`✅ Statement ${i+1} executado`);
      }
    } catch (error) {
      console.error(`❌ Erro ao executar statement ${i+1}:`, error.message);
    }
  }

  console.log('\n✅ Migração concluída!');
}

executeMigrationViaAPI().catch(console.error);
