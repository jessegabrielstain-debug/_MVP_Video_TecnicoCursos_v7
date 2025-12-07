/**
 * Execute migration via PostgreSQL driver
 */
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function executeMigration() {
  const client = new Client({
    host: 'aws-1-us-east-2.pooler.supabase.com',
    port: 6543,
    user: 'postgres.ofhzrdiadxigrvmrhaiz',
    password: 'Tr1unf0@',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Conectando ao banco...');
    await client.connect();
    console.log('✅ Conectado!\n');

    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251118000000_create_nr_templates_table.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Executando migração...');
    await client.query(sql);
    console.log('✅ Migração executada com sucesso!\n');

    // Verificar tabela criada
    const result = await client.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'nr_templates' 
      ORDER BY ordinal_position
    `);

    console.log('📊 Tabela nr_templates:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

    // Verificar seed data
    const countResult = await client.query('SELECT COUNT(*) FROM nr_templates');
    console.log(`\n✅ ${countResult.rows[0].count} templates inseridos`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
    if (error.code) console.error('Código:', error.code);
    process.exit(1);
  } finally {
    await client.end();
  }
}

executeMigration();
