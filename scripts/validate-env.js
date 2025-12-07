/**
 * Script de Validação de Variáveis de Ambiente
 * Verifica se todas as credenciais necessárias estão configuradas
 */

import 'dotenv/config';

const envVars = [
  // Supabase (obrigatório)
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    required: true,
    present: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    value: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Configurado' : undefined,
    feature: 'Supabase Database + Auth + Storage'
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    required: true,
    present: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...` : undefined,
    feature: 'Supabase Client Auth'
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    required: true,
    present: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    value: process.env.SUPABASE_SERVICE_ROLE_KEY ? `${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...` : undefined,
    feature: 'Supabase Admin Operations'
  },
  {
    name: 'DIRECT_DATABASE_URL',
    required: true,
    present: !!process.env.DIRECT_DATABASE_URL,
    value: process.env.DIRECT_DATABASE_URL ? 'postgresql://postgres:***@***' : undefined,
    feature: 'Provisioning SQL Scripts'
  },
  
  // ElevenLabs (TTS)
  {
    name: 'ELEVENLABS_API_KEY',
    required: false,
    present: !!process.env.ELEVENLABS_API_KEY,
    value: process.env.ELEVENLABS_API_KEY ? `${process.env.ELEVENLABS_API_KEY.substring(0, 10)}...` : undefined,
    feature: 'TTS + Voice Cloning'
  },
  
  // D-ID (Avatares)
  {
    name: 'DID_API_KEY',
    required: false,
    present: !!process.env.DID_API_KEY,
    value: process.env.DID_API_KEY ? `${process.env.DID_API_KEY.substring(0, 10)}...` : undefined,
    feature: 'Talking Heads + Lip Sync'
  },
  
  // Synthesia (Avatares AI)
  {
    name: 'SYNTHESIA_API_KEY',
    required: false,
    present: !!process.env.SYNTHESIA_API_KEY,
    value: process.env.SYNTHESIA_API_KEY ? `${process.env.SYNTHESIA_API_KEY.substring(0, 10)}...` : undefined,
    feature: 'AI Avatars Professional'
  },
  
  // Redis (Filas)
  {
    name: 'REDIS_HOST',
    required: false,
    present: !!process.env.REDIS_HOST,
    value: process.env.REDIS_HOST || 'localhost',
    feature: 'BullMQ Queue System'
  },
  {
    name: 'REDIS_PORT',
    required: false,
    present: !!process.env.REDIS_PORT,
    value: process.env.REDIS_PORT || '6379',
    feature: 'BullMQ Queue System'
  }
];

console.log('═══════════════════════════════════════════════════════════════');
console.log('🔐 VALIDAÇÃO DE VARIÁVEIS DE AMBIENTE - FASE 9');
console.log('═══════════════════════════════════════════════════════════════\n');

// Variáveis obrigatórias
console.log('📌 OBRIGATÓRIAS (Core):\n');
const required = envVars.filter(v => v.required);
const requiredOk = required.filter(v => v.present).length;

required.forEach(v => {
  const status = v.present ? '✅' : '❌';
  const value = v.value || '❌ Não configurado';
  console.log(`${status} ${v.name}`);
  console.log(`   Feature: ${v.feature}`);
  console.log(`   Valor: ${value}\n`);
});

console.log(`Resultado: ${requiredOk}/${required.length} configuradas\n`);

// Variáveis opcionais
console.log('─────────────────────────────────────────────────────────────\n');
console.log('🔧 OPCIONAIS (Features Avançadas):\n');

const optional = envVars.filter(v => !v.required);
const optionalOk = optional.filter(v => v.present).length;

optional.forEach(v => {
  const status = v.present ? '✅' : '⚠️';
  const value = v.value || '⚠️ Não configurado (feature desabilitada)';
  console.log(`${status} ${v.name}`);
  console.log(`   Feature: ${v.feature}`);
  console.log(`   Valor: ${value}\n`);
});

console.log(`Resultado: ${optionalOk}/${optional.length} configuradas\n`);

// Resumo final
console.log('═══════════════════════════════════════════════════════════════');
console.log('📊 RESUMO FINAL\n');

const allOk = requiredOk === required.length;
const totalOk = requiredOk + optionalOk;
const total = envVars.length;

console.log(`Total: ${totalOk}/${total} variáveis configuradas`);
console.log(`Obrigatórias: ${requiredOk}/${required.length} ${allOk ? '✅' : '❌'}`);
console.log(`Opcionais: ${optionalOk}/${optional.length}\n`);

if (allOk) {
  console.log('✅ SISTEMA PRONTO PARA PRODUÇÃO');
  console.log('   Todas as variáveis obrigatórias estão configuradas.\n');
  
  if (optionalOk < optional.length) {
    console.log('💡 DICA: Configure as variáveis opcionais para habilitar:');
    optional.filter(v => !v.present).forEach(v => {
      console.log(`   - ${v.feature} (${v.name})`);
    });
    console.log('');
  }
} else {
  console.log('❌ SISTEMA INCOMPLETO');
  console.log('   Configure as seguintes variáveis obrigatórias:\n');
  required.filter(v => !v.present).forEach(v => {
    console.log(`   ❌ ${v.name} - ${v.feature}`);
  });
  console.log('\n   Consulte: GUIA_SETUP_ENV_FASE_9.md\n');
  process.exit(1);
}

// Features habilitadas
console.log('─────────────────────────────────────────────────────────────');
console.log('🎯 FEATURES HABILITADAS:\n');

const features = [
  { name: 'Upload PPTX + Editor', enabled: true },
  { name: 'Supabase DB + Storage', enabled: requiredOk === required.length },
  { name: 'TTS ElevenLabs', enabled: !!process.env.ELEVENLABS_API_KEY },
  { name: 'Voice Cloning', enabled: !!process.env.ELEVENLABS_API_KEY },
  { name: 'D-ID Lip Sync', enabled: !!process.env.DID_API_KEY },
  { name: 'Synthesia Avatars', enabled: !!process.env.SYNTHESIA_API_KEY },
  { name: 'BullMQ Queue', enabled: !!process.env.REDIS_HOST },
  { name: 'Templates NR (10)', enabled: requiredOk === required.length },
  { name: 'CRUD Admin', enabled: requiredOk === required.length }
];

features.forEach(f => {
  const status = f.enabled ? '✅ Habilitado' : '⚠️ Desabilitado';
  console.log(`${status.padEnd(15)} - ${f.name}`);
});

console.log('\n═══════════════════════════════════════════════════════════════\n');

// Próximos passos
if (allOk) {
  console.log('🚀 PRÓXIMOS PASSOS:\n');
  console.log('1. Provisionar banco de dados:');
  console.log('   node scripts/execute-supabase-sql.js database-nr-templates.sql\n');
  console.log('2. Iniciar servidor de desenvolvimento:');
  console.log('   cd estudio_ia_videos && npm run dev\n');
  console.log('3. Acessar dashboards:');
  console.log('   - Queue: http://localhost:3000/dashboard/admin/queues');
  console.log('   - Templates: http://localhost:3000/dashboard/admin/nr-templates\n');
  console.log('4. Testar APIs:');
  console.log('   curl http://localhost:3000/api/lip-sync/validate\n');
}

process.exit(allOk ? 0 : 1);
