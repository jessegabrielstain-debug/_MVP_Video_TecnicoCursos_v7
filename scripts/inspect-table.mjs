import dotenv from 'dotenv';
import path from 'path';
import pg from 'pg';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const { Client } = pg;

const client = new Client({
  connectionString: process.env.DIRECT_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function inspect() {
  const tableName = process.argv[2] || 'render_jobs';
  await client.connect();
  const res = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position`, [tableName]);
  console.log(res.rows);
  await client.end();
}

inspect().catch(err => {
  console.error(err);
  process.exit(1);
});
