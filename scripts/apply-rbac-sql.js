import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Client } = pg;
const DB_URL = process.env.DIRECT_DATABASE_URL;

if (!DB_URL) {
    console.error('❌ DIRECT_DATABASE_URL not found in environment variables.');
    process.exit(1);
}

const sqlFile = 'database-rbac-rls.sql';

async function applyRbac() {
    console.log(`🚀 Applying RBAC policies from ${sqlFile}...`);

    if (!fs.existsSync(sqlFile)) {
        console.error(`❌ File ${sqlFile} not found.`);
        process.exit(1);
    }

    const client = new Client({
        connectionString: DB_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✅ Connected to database.');

        const sqlContent = fs.readFileSync(sqlFile, 'utf8');
        // Split by semicolon, but be careful with function bodies.
        // Simple split might break $$ blocks.
        // However, the previous script used simple split.
        // Let's try to execute the whole file at once if possible, or split carefully.
        // The pg client can execute multiple statements in one query usually.
        
        try {
            await client.query(sqlContent);
            console.log('✅ RBAC policies applied successfully.');
        } catch (e) {
            console.error(`❌ Error applying RBAC policies: ${e.message}`);
            // If it fails, maybe try splitting?
            // But "CREATE FUNCTION" with $$ bodies breaks with simple split.
        }

    } catch (err) {
        console.error(`❌ Connection error: ${err.message}`);
    } finally {
        await client.end();
    }
}

applyRbac();
