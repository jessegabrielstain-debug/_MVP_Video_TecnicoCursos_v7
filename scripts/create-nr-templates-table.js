#!/usr/bin/env node

/**
 * Cria tabela nr_templates via Supabase SQL Editor API
 */

import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('❌ Variáveis NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
    process.exit(1);
}

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('🔧 CRIANDO TABELA NR_TEMPLATES');
console.log('═══════════════════════════════════════════════════════════════\n');

const createTableSQL = `
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

CREATE INDEX IF NOT EXISTS idx_nr_templates_nr_number ON nr_templates(nr_number);
CREATE INDEX IF NOT EXISTS idx_nr_templates_created_at ON nr_templates(created_at DESC);

CREATE OR REPLACE FUNCTION update_nr_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_nr_templates_updated_at ON nr_templates;
CREATE TRIGGER trigger_update_nr_templates_updated_at
  BEFORE UPDATE ON nr_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_nr_templates_updated_at();

-- RLS Policies
ALTER TABLE nr_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON nr_templates;
CREATE POLICY "Allow public read access" 
  ON nr_templates FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert" ON nr_templates;
CREATE POLICY "Allow authenticated insert" 
  ON nr_templates FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated update" ON nr_templates;
CREATE POLICY "Allow authenticated update" 
  ON nr_templates FOR UPDATE 
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated delete" ON nr_templates;
CREATE POLICY "Allow authenticated delete" 
  ON nr_templates FOR DELETE 
  USING (auth.role() = 'authenticated');
`;

try {
    // Usar SQL Editor API do Supabase
    const projectRef = SUPABASE_URL.match(/\/\/([^.]+)/)[1];
    const apiUrl = `${SUPABASE_URL}/rest/v1/rpc/exec_sql`;
    
    console.log('📝 Executando SQL...\n');
    
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
            query: createTableSQL
        })
    });

    if (!response.ok) {
        // Tentar método alternativo: usar a API de admin SQL
        console.log('⚠️ Método REST falhou, tentando método alternativo...\n');
        
        // Usar pg client via REST proxy não é possível diretamente
        // Vamos criar usando a interface de management
        throw new Error(`API REST não suporta exec_sql genérico. Status: ${response.status}`);
    }

    console.log('✅ Tabela nr_templates criada com sucesso!');
    console.log('\n🚀 Agora execute:');
    console.log('   node scripts/provision-nr-templates.js\n');
    
    process.exit(0);

} catch (error) {
    console.error('\n❌ Erro:', error.message);
    console.log('\n💡 ALTERNATIVA: Execute o SQL manualmente no Supabase Dashboard');
    console.log('   1. Acesse: https://supabase.com/dashboard/project/' + SUPABASE_URL.match(/\/\/([^.]+)/)[1] + '/editor');
    console.log('   2. Clique em "New Query"');
    console.log('   3. Cole o conteúdo de: database-nr-templates.sql');
    console.log('   4. Clique em "Run"\n');
    process.exit(1);
}
