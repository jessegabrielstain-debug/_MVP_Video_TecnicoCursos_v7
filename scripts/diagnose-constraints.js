
import dotenv from 'dotenv';
import pg from 'pg';
dotenv.config();

const { Client } = pg;

const client = new Client({
    connectionString: process.env.DIRECT_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function diagnoseConstraints() {
    try {
        await client.connect();
        console.log('Connected to DB');

        // Check Constraints on projects table
        const constraintsRes = await client.query(`
            SELECT conname, contype, pg_get_constraintdef(oid)
            FROM pg_constraint
            WHERE conrelid = 'public.projects'::regclass;
        `);
        console.log('Projects constraints:', constraintsRes.rows);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

diagnoseConstraints();
