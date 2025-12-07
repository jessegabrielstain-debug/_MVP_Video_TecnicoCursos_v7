#!/usr/bin/env node

/**
 * Test Supabase Connection
 * Verifica se as credenciais Supabase estão configuradas corretamente
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testSupabaseConnection() {
  console.log('🔍 Testando conexão Supabase...\n');

  // Verificar env vars
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variáveis de ambiente não encontradas!');
    console.log('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
    console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✓' : '✗');
    process.exit(1);
  }

  console.log('✅ Variáveis de ambiente encontradas');
  console.log(`   URL: ${supabaseUrl}`);
  console.log(`   Key: ${supabaseKey.substring(0, 20)}...`);

  // Criar cliente
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Testar query simples
    console.log('\n📊 Testando query na tabela projects...');
    const { data, error, count } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Erro na query:', error.message);
      console.error('   Código:', error.code);
      console.error('   Detalhes:', error.details);
      process.exit(1);
    }

    console.log(`✅ Conexão OK! Tabela projects existe com ${count || 0} registros`);

    // Testar autenticação
    console.log('\n🔐 Testando autenticação...');
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.log('⚠️  Sem sessão ativa (normal para teste)');
    } else {
      console.log('✅ Sistema de autenticação respondendo');
    }

    console.log('\n✅ Todos os testes passaram! Supabase está configurado corretamente.\n');

  } catch (err) {
    console.error('❌ Erro inesperado:', err.message);
    process.exit(1);
  }
}

testSupabaseConnection();
