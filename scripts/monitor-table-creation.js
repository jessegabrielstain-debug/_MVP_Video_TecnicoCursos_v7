/**
 * Monitor - Detecta quando tabela nr_templates for criada
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
  }
});

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
);

console.log('👀 Monitorando criação da tabela nr_templates...');
console.log('⏱️  Verificando a cada 3 segundos...\n');

let attempts = 0;
const maxAttempts = 60; // 3 minutos

const checkTable = async () => {
  attempts++;
  
  try {
    const { data, error } = await supabase
      .from('nr_templates')
      .select('count')
      .limit(1);
    
    if (!error) {
      console.log('\n✅ TABELA DETECTADA!\n');
      console.log('🚀 Executando provisioning automático...\n');
      
      // Executar script de provisioning
      const { exec } = await import('child_process');
      exec('node scripts/force-insert-templates.js', (error, stdout, stderr) => {
        console.log(stdout);
        if (error) console.error(stderr);
        process.exit(0);
      });
      
      return true;
    }
    
    if (error.code === 'PGRST205') {
      process.stdout.write(`\r⏳ Tentativa ${attempts}/${maxAttempts} - Tabela ainda não existe...`);
      return false;
    }
    
    console.log(`\n⚠️  Erro inesperado: ${error.message}`);
    return false;
    
  } catch (err) {
    process.stdout.write(`\r⏳ Tentativa ${attempts}/${maxAttempts} - Aguardando...`);
    return false;
  }
};

const monitor = setInterval(async () => {
  const found = await checkTable();
  
  if (found) {
    clearInterval(monitor);
  }
  
  if (attempts >= maxAttempts) {
    console.log('\n\n⏱️  Timeout (3 minutos)');
    console.log('❌ Tabela não foi criada');
    console.log('\n📋 Verifique se executou o SQL no Dashboard');
    clearInterval(monitor);
    process.exit(1);
  }
}, 3000);

// Verificação inicial imediata
checkTable().then(found => {
  if (found) clearInterval(monitor);
});
