
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Client } = pg;

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function fixColumn() {
    try {
        console.log('Connecting to DB...');
        await client.connect();
        console.log('Connected.');

        console.log('Attempting to add render_settings column...');
        await client.query(`
            ALTER TABLE public.render_jobs 
            ADD COLUMN IF NOT EXISTS render_settings JSONB DEFAULT '{}'::jsonb;
        `);
        console.log('✅ Column render_settings ensured.');

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await client.end();
    }
}

fixColumn();
