import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Client } = pg;
const DB_URL = process.env.DIRECT_DATABASE_URL;

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function executeWebhooksSQL() {
    log('🚀 Executing Webhooks SQL...', 'cyan');

    if (!DB_URL) {
        log('❌ DIRECT_DATABASE_URL not found in .env', 'red');
        process.exit(1);
    }

    const sqlFile = 'database-webhooks.sql';
    if (!fs.existsSync(sqlFile)) {
        log(`❌ File not found: ${sqlFile}`, 'red');
        process.exit(1);
    }

    const client = new Client({
        connectionString: DB_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        log('✅ Connected to database', 'green');

        const sqlContent = fs.readFileSync(sqlFile, 'utf8');
        
        // Execute as a single block if possible, or split
        try {
            await client.query(sqlContent);
            log('✅ Webhooks SQL executed successfully!', 'green');
        } catch (error) {
            log(`⚠️ Error executing block: ${error.message}. Trying command by command...`, 'yellow');
            const commands = sqlContent.split(';').map(c => c.trim()).filter(c => c.length > 0);
            for (const cmd of commands) {
                try {
                    await client.query(cmd);
                } catch (err) {
                    if (!err.message.includes('already exists')) {
                        log(`❌ Error in command: ${err.message}`, 'red');
                    }
                }
            }
        }

    } catch (error) {
        log(`❌ Fatal error: ${error.message}`, 'red');
    } finally {
        await client.end();
    }
}

executeWebhooksSQL();
