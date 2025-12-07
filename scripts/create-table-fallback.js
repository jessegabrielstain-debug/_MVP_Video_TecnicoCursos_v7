/**
 * FALLBACK FINAL: Create table usando SQL Runner do Supabase
 * Usa endpoint undocumented /rest/v1/rpc/ com função do sistema
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

async function createTableDirectly() {
  console.log('🚨 TENTATIVA FINAL - SQL Direto via Supabase API\n');

  // DDL completo em uma única string
  const ddl = `
-- Create table
CREATE TABLE IF NOT EXISTS nr_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nr_number VARCHAR(10) NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  slide_count INTEGER NOT NULL DEFAULT 5,
  duration_seconds INTEGER NOT NULL DEFAULT 300,
  template_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_nr_templates_nr_number ON nr_templates(nr_number);
CREATE INDEX IF NOT EXISTS idx_nr_templates_created_at ON nr_templates(created_at DESC);

-- Trigger function
CREATE OR REPLACE FUNCTION update_nr_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS trigger_update_nr_templates_updated_at ON nr_templates;
CREATE TRIGGER trigger_update_nr_templates_updated_at
  BEFORE UPDATE ON nr_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_nr_templates_updated_at();

-- RLS
ALTER TABLE nr_templates ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Allow public read access" ON nr_templates;
CREATE POLICY "Allow public read access" ON nr_templates FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert" ON nr_templates;
CREATE POLICY "Allow authenticated insert" ON nr_templates FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated update" ON nr_templates;
CREATE POLICY "Allow authenticated update" ON nr_templates FOR UPDATE 
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated delete" ON nr_templates;
CREATE POLICY "Allow authenticated delete" ON nr_templates FOR DELETE 
  USING (auth.role() = 'authenticated');
  `.trim();

  // Tentar via SQL query endpoint (não RPC)
  console.log('📝 Tentando criar tabela via query SQL...');
  
  try {
    const response = await fetch(`${PROJECT_URL}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ query: ddl })
    });

    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Response:', text);

    if (response.ok) {
      console.log('\n✅ Tabela criada com sucesso!');
    } else {
      console.log('\n❌ Falhou. Solução: ACAO_MANUAL_DASHBOARD.md');
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.log('\n❌ Todas as tentativas automáticas falharam.');
    console.log('📋 Solução: Abrir ACAO_MANUAL_DASHBOARD.md');
  }
}

createTableDirectly();
