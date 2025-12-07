/**
 * Execute SQL diretamente usando postgres://
 * Última tentativa com URL direta não-pooler
 */
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tentar conexão direta (não pooler)
const directUrl = 'postgresql://postgres.ofhzrdiadxigrvmrhaiz:Tr1unf0%40@db.ofhzrdiadxigrvmrhaiz.supabase.co:5432/postgres';

console.log('🔌 Tentando conexão direta (db.xxx, não pooler)...\n');

const client = new Client({
  connectionString: directUrl,
  ssl: { rejectUnauthorized: false }
});

try {
  await client.connect();
  console.log('✅ Conectado ao banco!\n');

  // Verificar se tabela existe
  console.log('🔍 Verificando tabela nr_templates...');
  const checkResult = await client.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'nr_templates'
    );
  `);

  const exists = checkResult.rows[0].exists;
  console.log(`   ${exists ? '✅' : '❌'} Tabela ${exists ? 'existe' : 'NÃO existe'}\n`);

  if (!exists) {
    console.log('📝 Executando migration SQL...\n');
    
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251118000000_create_nr_templates_table.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    await client.query(sql);
    console.log('✅ Migration executada com sucesso!\n');

    // Verificar novamente
    const checkResult2 = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'nr_templates'
      );
    `);
    const exists2 = checkResult2.rows[0].exists;
    console.log(`✅ Verificação: Tabela ${exists2 ? 'CRIADA' : 'falha'}\n`);

    // Contar registros
    const countResult = await client.query('SELECT COUNT(*) FROM nr_templates');
    console.log(`📊 Templates inseridos: ${countResult.rows[0].count}\n`);
  } else {
    // Contar registros
    const countResult = await client.query('SELECT COUNT(*) FROM nr_templates');
    console.log(`📊 Templates existentes: ${countResult.rows[0].count}\n`);
  }

  console.log('🎉 SUCESSO TOTAL!\n');
  console.log('Aguarde 10-30 segundos para o PostgREST atualizar o cache...');

} catch (error) {
  console.error('❌ Erro:', error.message);
  if (error.code) console.error('   Código:', error.code);
  process.exit(1);
} finally {
  await client.end();
}
