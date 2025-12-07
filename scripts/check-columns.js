
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Client } = pg;

const client = new Client({
    connectionString: process.env.DIRECT_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkColumns() {
    try {
        await client.connect();
        console.log('Connected to DB');

        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'render_jobs';
        `);

        console.log('Columns in render_jobs:');
        res.rows.forEach(row => {
            console.log(`- ${row.column_name} (${row.data_type})`);
        });

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

checkColumns();
