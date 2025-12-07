/**
 * Force PostgREST schema cache reload
 */
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

const SERVICE_ROLE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY;
const PROJECT_URL = envVars.NEXT_PUBLIC_SUPABASE_URL;

console.log('🔄 Forçando reload do schema cache do PostgREST...\n');

// O PostgREST recarrega o schema automaticamente após operações DDL,
// mas podemos forçar enviando um NOTIFY para o canal pgrst
try {
  // Enviar requisição vazia para forçar o PostgREST a verificar mudanças
  const response = await fetch(`${PROJECT_URL}/rest/v1/`, {
    method: 'HEAD',
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    }
  });

  console.log(`Status: ${response.status}`);
  console.log(`Headers: ${JSON.stringify(Object.fromEntries(response.headers))}\n`);

  // Aguardar 3 segundos para o cache atualizar
  console.log('⏳ Aguardando 3 segundos...\n');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Tentar acessar a tabela
  console.log('🔍 Verificando acesso à tabela nr_templates...\n');
  const testResponse = await fetch(`${PROJECT_URL}/rest/v1/nr_templates?limit=1`, {
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    }
  });

  if (testResponse.ok) {
    const data = await testResponse.json();
    console.log('✅ SUCESSO! Tabela acessível via API');
    console.log(`📊 Registros encontrados: ${data.length}\n`);
    
    if (data.length > 0) {
      console.log('📋 Primeiro registro:');
      console.log(JSON.stringify(data[0], null, 2));
    }
  } else {
    const error = await testResponse.text();
    console.log('❌ Ainda não acessível:', error);
    console.log('\n💡 Solução: Aguardar mais tempo ou reiniciar instância PostgREST no Dashboard');
  }

} catch (error) {
  console.error('❌ Erro:', error.message);
}
