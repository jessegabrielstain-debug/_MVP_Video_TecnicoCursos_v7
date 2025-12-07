#!/usr/bin/env node

/**
 * Executa SQL via Supabase REST API
 * Alternativa quando a conexão direta PostgreSQL falha
 */

import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('❌ Variáveis NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
    process.exit(1);
}

const sqlFile = process.argv[2] || 'database-nr-templates.sql';

console.log(`\n🚀 Executando ${sqlFile} via Supabase REST API...\n`);

try {
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`
        },
        body: JSON.stringify({
            query: sqlContent
        })
    });

    if (response.ok) {
        console.log('✅ SQL executado com sucesso!');
        const result = await response.json();
        console.log('Resultado:', result);
    } else {
        console.error('❌ Erro na execução:',await response.text());
        process.exit(1);
    }

} catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
}
