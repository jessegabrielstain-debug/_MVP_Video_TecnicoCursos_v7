
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Client } = pg;

const client = new Client({
    connectionString: process.env.DIRECT_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function diagnose() {
    try {
        await client.connect();
        console.log('Connected to DB');

        // Get columns
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'render_jobs';
        `);
        console.log('Render Jobs table columns:', res.rows);

        // Get constraints
        const constraints = await client.query(`
            SELECT conname, pg_get_constraintdef(c.oid)
            FROM pg_constraint c
            JOIN pg_namespace n ON n.oid = c.connamespace
            WHERE conrelid = 'public.render_jobs'::regclass;
        `);
        console.log('Constraints:', constraints.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

diagnose();
