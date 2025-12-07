/**
 * Validação Final - Fase 9 = 100%
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

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('               🎯 VALIDAÇÃO FINAL - FASE 9                     ');
console.log('═══════════════════════════════════════════════════════════════\n');

const checks = [];

// 1. Verificar tabela existe
console.log('1️⃣  Verificando tabela nr_templates...');
try {
  const { data, error } = await supabase
    .from('nr_templates')
    .select('count');
  
  if (error) {
    console.log(`   ❌ Tabela não existe: ${error.message}`);
    checks.push({ name: 'Tabela nr_templates', status: false });
  } else {
    console.log('   ✅ Tabela existe');
    checks.push({ name: 'Tabela nr_templates', status: true });
  }
} catch (err) {
  console.log(`   ❌ Erro: ${err.message}`);
  checks.push({ name: 'Tabela nr_templates', status: false });
}

// 2. Verificar contagem de templates
console.log('\n2️⃣  Verificando templates inseridos...');
try {
  const { data, error } = await supabase
    .from('nr_templates')
    .select('nr_number, title');
  
  if (error) {
    console.log(`   ❌ Erro: ${error.message}`);
    checks.push({ name: '10 Templates NR', status: false });
  } else {
    console.log(`   ✅ ${data.length} templates encontrados`);
    data.forEach(t => console.log(`      - ${t.nr_number}: ${t.title.substring(0, 50)}...`));
    checks.push({ name: '10 Templates NR', status: data.length === 10 });
  }
} catch (err) {
  console.log(`   ❌ Erro: ${err.message}`);
  checks.push({ name: '10 Templates NR', status: false });
}

// 3. Verificar campos JSONB
console.log('\n3️⃣  Verificando estrutura template_config...');
try {
  const { data, error } = await supabase
    .from('nr_templates')
    .select('nr_number, template_config')
    .limit(1)
    .single();
  
  if (error) {
    console.log(`   ❌ Erro: ${error.message}`);
    checks.push({ name: 'Template Config JSONB', status: false });
  } else {
    const config = data.template_config;
    const hasRequiredFields = config.primary_color && config.topics && Array.isArray(config.topics);
    console.log(`   ✅ Estrutura válida: ${hasRequiredFields ? 'SIM' : 'NÃO'}`);
    console.log(`      primary_color: ${config.primary_color}`);
    console.log(`      topics: ${config.topics.length} itens`);
    checks.push({ name: 'Template Config JSONB', status: hasRequiredFields });
  }
} catch (err) {
  console.log(`   ❌ Erro: ${err.message}`);
  checks.push({ name: 'Template Config JSONB', status: false });
}

// 4. Verificar RLS políticas
console.log('\n4️⃣  Verificando RLS (leitura pública)...');
try {
  // Criar cliente anon (sem autenticação)
  const anonClient = createClient(
    envVars.NEXT_PUBLIC_SUPABASE_URL,
    envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  const { data, error } = await anonClient
    .from('nr_templates')
    .select('count')
    .limit(1);
  
  if (error) {
    console.log(`   ❌ RLS bloqueou acesso público: ${error.message}`);
    checks.push({ name: 'RLS Leitura Pública', status: false });
  } else {
    console.log('   ✅ Leitura pública permitida (RLS correto)');
    checks.push({ name: 'RLS Leitura Pública', status: true });
  }
} catch (err) {
  console.log(`   ❌ Erro: ${err.message}`);
  checks.push({ name: 'RLS Leitura Pública', status: false });
}

// 5. Verificar variáveis ambiente
console.log('\n5️⃣  Verificando variáveis de ambiente...');
const envVarsRequired = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'DIRECT_DATABASE_URL'
];

let envOk = true;
envVarsRequired.forEach(varName => {
  const exists = !!envVars[varName];
  console.log(`   ${exists ? '✅' : '❌'} ${varName}`);
  if (!exists) envOk = false;
});
checks.push({ name: 'Variáveis Ambiente', status: envOk });

// RESULTADO FINAL
console.log('\n═══════════════════════════════════════════════════════════════');
console.log('                     📊 RESULTADO FINAL                        ');
console.log('═══════════════════════════════════════════════════════════════\n');

const passed = checks.filter(c => c.status).length;
const total = checks.length;
const percentage = Math.round((passed / total) * 100);

checks.forEach(check => {
  console.log(`${check.status ? '✅' : '❌'} ${check.name}`);
});

console.log(`\n${'█'.repeat(Math.floor(percentage / 2))}${'░'.repeat(50 - Math.floor(percentage / 2))} ${percentage}%`);

if (percentage === 100) {
  console.log('\n🎉 FASE 9 = 100% COMPLETA! 🎉\n');
  console.log('✅ Todos os requisitos atendidos');
  console.log('✅ Tabela nr_templates criada');
  console.log('✅ 10 templates NR inseridos');
  console.log('✅ RLS configurado corretamente');
  console.log('✅ Ambiente 100% configurado');
  
  // Atualizar arquivo de status
  const statusUpdate = `
🎯 FASE 9 - STATUS ATUALIZADO
Data: ${new Date().toISOString()}
Status: 100% ✅ COMPLETO

Validações:
${checks.map(c => `${c.status ? '✅' : '❌'} ${c.name}`).join('\n')}

Sistema pronto para produção! 🚀
`;
  
  fs.writeFileSync(
    path.join(__dirname, '..', 'FASE_9_COMPLETA.txt'),
    statusUpdate
  );
  
  console.log('\n📄 Relatório salvo em: FASE_9_COMPLETA.txt');
} else {
  console.log(`\n⚠️  FASE 9 = ${percentage}% (Pendências: ${total - passed})`);
  console.log('\n📋 Itens pendentes:');
  checks.filter(c => !c.status).forEach(c => {
    console.log(`   ❌ ${c.name}`);
  });
}

console.log('\n═══════════════════════════════════════════════════════════════\n');
