
import { Client } from 'pg';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('Missing DATABASE_URL');
  process.exit(1);
}

const client = new Client({
  connectionString,
});

async function run() {
  await client.connect();
  
  const sqlFile = process.argv[2] || 'scripts/sql/fix-schema.sql';
  console.log(`Executing SQL from ${sqlFile}...`);
  const sql = fs.readFileSync(sqlFile, 'utf8');
  
  try {
    await client.query(sql);
    console.log('SQL executed successfully');
  } catch (err) {
    console.error('Error executing SQL:', err);
  } finally {
    await client.end();
  }
}

run();
