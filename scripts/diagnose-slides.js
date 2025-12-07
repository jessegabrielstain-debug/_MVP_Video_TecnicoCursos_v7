
import dotenv from 'dotenv';
import pg from 'pg';
dotenv.config();

const { Client } = pg;

const client = new Client({
    connectionString: process.env.DIRECT_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function diagnoseSlides() {
    try {
        await client.connect();
        console.log('Connected to DB');

        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'slides';
        `);
        console.log('Slides table columns:', res.rows);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

diagnoseSlides();
