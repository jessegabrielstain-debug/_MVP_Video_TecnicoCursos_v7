// ============================================
// 🧪 TESTE SIMPLES DE CONEXÃO SUPABASE
// ============================================
// Script para testar conexão com Supabase
// Uso: node test-supabase-simple.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('\n════════════════════════════════════════════');
console.log('🧪 TESTE DE CONEXÃO SUPABASE');
console.log('════════════════════════════════════════════\n');

// Verificar se as variáveis estão configuradas
if (!supabaseUrl || !supabaseKey) {
  console.log('❌ ERRO: Variáveis de ambiente não configuradas!');
  console.log('\nVerifique no arquivo .env:');
  console.log('  - NEXT_PUBLIC_SUPABASE_URL');
  console.log('  - NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

console.log('✅ Variáveis de ambiente encontradas');
console.log(`   URL: ${supabaseUrl}`);
console.log(`   Key: ${supabaseKey.substring(0, 20)}...`);

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('\n🔍 Testando conexão com banco de dados...');

    // Teste 1: Verificar se consegue fazer uma query simples
    const { error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      // Se erro é "relation does not exist", significa que tabela não foi criada
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log('\n⚠️  ATENÇÃO: Conexão OK mas tabelas NÃO foram criadas!');
        console.log('\n   Você precisa executar os SQLs no Supabase:');
        console.log('   1. Abrir: https://supabase.com/dashboard/project/ofhzrdiadxigrvmrhaiz/sql');
        console.log('   2. Executar: database-schema.sql');
        console.log('   3. Executar: database-rls-policies.sql');
        console.log('   4. Executar: seed-nr-courses.sql');
        console.log('\n   Ou executar: .\\setup-supabase-complete.ps1\n');
        return false;
      }

      console.log('❌ ERRO ao conectar:', error.message);
      return false;
    }

    console.log('✅ Conexão com banco de dados: OK!');
    console.log('✅ Tabela "users" encontrada!');

    // Teste 2: Verificar outras tabelas
    console.log('\n🔍 Verificando tabelas do sistema...');

    const tables = [
      'users',
      'projects',
      'slides',
      'render_jobs',
      'analytics_events',
      'nr_courses',
      'nr_modules'
    ];

    let allTablesExist = true;

    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .select('count')
        .limit(1);

      if (error) {
        console.log(`   ❌ Tabela "${table}" não encontrada`);
        allTablesExist = false;
      } else {
        console.log(`   ✅ Tabela "${table}" OK`);
      }
    }

    if (!allTablesExist) {
      console.log('\n⚠️  Algumas tabelas não foram encontradas.');
      console.log('   Execute o setup: .\\setup-supabase-complete.ps1\n');
      return false;
    }

    // Teste 3: Verificar cursos NR
    console.log('\n🔍 Verificando cursos NR populados...');

    const { data: courses, error: coursesError } = await supabase
      .from('nr_courses')
      .select('course_code, title');

    if (coursesError) {
      console.log('   ❌ Erro ao buscar cursos:', coursesError.message);
    } else if (!courses || courses.length === 0) {
      console.log('   ⚠️  Nenhum curso encontrado. Execute: seed-nr-courses.sql');
    } else {
      console.log(`   ✅ Encontrados ${courses.length} cursos:`);
      courses.forEach(course => {
        console.log(`      • ${course.course_code}: ${course.title}`);
      });
    }

    // Teste 4: Verificar Storage Buckets
    console.log('\n🔍 Verificando Storage Buckets...');

    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();

    if (bucketsError) {
      console.log('   ❌ Erro ao buscar buckets:', bucketsError.message);
    } else if (!buckets || buckets.length === 0) {
      console.log('   ⚠️  Nenhum bucket encontrado. Crie os buckets:');
      console.log('      • videos (privado, 500MB limit)');
      console.log('      • avatars (privado, 50MB limit)');
      console.log('      • thumbnails (público, 10MB limit)');
      console.log('      • assets (público, 20MB limit)');
    } else {
      console.log(`   ✅ Encontrados ${buckets.length} buckets:`);
      buckets.forEach(bucket => {
        console.log(`      • ${bucket.name} (${bucket.public ? 'público' : 'privado'})`);
      });
    }

    console.log('\n════════════════════════════════════════════');
    console.log('✅ TESTE COMPLETO!');
    console.log('════════════════════════════════════════════\n');

    if (allTablesExist && courses && courses.length > 0) {
      console.log('🎉 Sistema 100% configurado e pronto para uso!\n');
      console.log('Próximos passos:');
      console.log('  1. Acesse: http://localhost:3000');
      console.log('  2. Crie uma conta ou faça login');
      console.log('  3. Teste o upload de PPTX\n');
      return true;
    } else {
      console.log('⚠️  Configuração incompleta. Siga os passos acima.\n');
      return false;
    }

  } catch (error) {
    console.log('\n❌ ERRO INESPERADO:', error.message);
    console.log('\nDetalhes:', error);
    return false;
  }
}

// Executar teste
testConnection()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ ERRO:', error);
    process.exit(1);
  });
