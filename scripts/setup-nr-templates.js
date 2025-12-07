#!/usr/bin/env node

/**
 * Cria tabela nr_templates usando abordagem híbrida:
 * 1. Tenta via Supabase Management API
 * 2. Se falhar, fornece instruções claras
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('❌ Variáveis NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
    process.exit(1);
}

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('🔧 SETUP AUTOMÁTICO DA TABELA NR_TEMPLATES');
console.log('═══════════════════════════════════════════════════════════════\n');

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function setupTable() {
    console.log('📋 Verificando se a tabela já existe...\n');
    
    // Tentar fazer uma query simples para verificar se a tabela existe
    const { data, error } = await supabase
        .from('nr_templates')
        .select('count')
        .limit(1);

    if (!error) {
        console.log('✅ Tabela nr_templates já existe!');
        console.log('   Registros encontrados:', data?.length || 0);
        console.log('\n🚀 Agora execute:');
        console.log('   node scripts/provision-nr-templates.js\n');
        return true;
    }

    if (error.code === '42P01') {
        console.log('⚠️ Tabela não existe. Vou tentar criar...\n');
        
        // Tentar criar usando uma função auxiliar
        // Primeiro, vamos criar um template vazio para forçar a criação do schema
        console.log('💡 Estratégia: Criar via aplicação Next.js\n');
        console.log('📝 INSTRUÇÕES MANUAIS (5 minutos):');
        console.log('');
        console.log('1. Abra o Supabase Dashboard:');
        console.log('   https://supabase.com/dashboard/project/' + SUPABASE_URL.match(/\/\/([^.]+)/)?.[1] + '/editor');
        console.log('');
        console.log('2. Clique em "SQL Editor" → "New Query"');
        console.log('');
        console.log('3. Cole este SQL:');
        console.log('');
        console.log('─────────────────────────────────────────────────────────────');
        console.log(`
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
        `);
        console.log('─────────────────────────────────────────────────────────────');
        console.log('');
        console.log('4. Clique em "Run" (ou pressione Ctrl+Enter)');
        console.log('');
        console.log('5. Aguarde a mensagem "Success. No rows returned"');
        console.log('');
        console.log('6. Execute: node scripts/provision-nr-templates.js');
        console.log('');
        console.log('═══════════════════════════════════════════════════════════════\n');
        
        return false;
    }

    console.error('❌ Erro desconhecido:', error);
    return false;
}

setupTable().then(success => {
    if (success) {
        console.log('✅ Setup completo!');
        process.exit(0);
    } else {
        console.log('⚠️ Ação manual necessária.');
        process.exit(1);
    }
}).catch(err => {
    console.error('❌ Erro:', err.message);
    process.exit(1);
});
