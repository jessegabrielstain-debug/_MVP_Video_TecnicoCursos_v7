import 'dotenv/config';
import fs from 'fs/promises';
import pg from 'pg';

const filePath = process.argv[2];

if (!filePath) {
  console.error('Usage: node run-sql-file.mjs <path-to-sql>');
  process.exit(1);
}

const client = new pg.Client({
  connectionString: process.env.DIRECT_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const run = async () => {
  try {
    const sql = await fs.readFile(filePath, 'utf8');
    await client.connect();
    await client.query(sql);
    console.log(`✔ Executed ${filePath}`);
  } catch (error) {
    console.error(`✖ Failed executing ${filePath}`);
    console.error(error);
  } finally {
    await client.end();
  }
};

run();
