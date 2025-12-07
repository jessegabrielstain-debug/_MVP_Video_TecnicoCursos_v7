
import dotenv from 'dotenv';
import pg from 'pg';
dotenv.config();

const { Client } = pg;

const client = new Client({
    connectionString: process.env.DIRECT_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function fixConstraint() {
    try {
        await client.connect();
        console.log('Connected to DB');

        console.log('Dropping old constraint...');
        await client.query('ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_user_id_fkey');
        
        console.log('Adding new constraint referencing public.users...');
        await client.query(`
            ALTER TABLE public.projects 
            ADD CONSTRAINT projects_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
        `);
        
        console.log('✅ Constraint fixed successfully!');

    } catch (err) {
        console.error('❌ Error fixing constraint:', err);
    } finally {
        await client.end();
    }
}

fixConstraint();
