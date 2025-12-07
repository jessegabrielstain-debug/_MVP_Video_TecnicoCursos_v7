#!/usr/bin/env node

/**
 * 🗄️ CONFIGURAÇÃO AUTOMÁTICA DOS BUCKETS DE STORAGE SUPABASE
 * Script para criar e configurar buckets de storage
 * Data: 13/10/2025
 */

import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

dotenv.config();

// Configurações
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Cores para console
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// Configuração dos buckets
const buckets = [
    {
        id: 'videos',
        name: 'videos',
        public: false,
        file_size_limit: 500 * 1024 * 1024, // 500MB
        allowed_mime_types: ['video/mp4', 'video/webm', 'video/avi', 'video/mov'],
        description: 'Vídeos finais renderizados'
    },
    {
        id: 'avatars',
        name: 'avatars',
        public: false,
        file_size_limit: 50 * 1024 * 1024, // 50MB
        allowed_mime_types: ['video/mp4', 'video/webm', 'image/png', 'image/jpg', 'image/jpeg'],
        description: 'Vídeos e imagens de avatares 3D'
    },
    {
        id: 'thumbnails',
        name: 'thumbnails',
        public: true,
        file_size_limit: 10 * 1024 * 1024, // 10MB
        allowed_mime_types: ['image/png', 'image/jpg', 'image/jpeg', 'image/webp'],
        description: 'Miniaturas dos vídeos (público)'
    },
    {
        id: 'assets',
        name: 'assets',
        public: true,
        file_size_limit: 20 * 1024 * 1024, // 20MB
        allowed_mime_types: ['image/png', 'image/jpg', 'image/jpeg', 'audio/mp3', 'audio/wav'],
        description: 'Imagens e áudios dos slides (público)'
    }
];

async function makeRequest(endpoint, method = 'GET', body = null) {
    const url = `${SUPABASE_URL}/storage/v1${endpoint}`;
    const headers = {
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY
    };

    const options = {
        method,
        headers
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(url, options);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${data.message || data.error || 'Unknown error'}`);
        }
        
        return data;
    } catch (error) {
        throw new Error(`Request failed: ${error.message}`);
    }
}

async function createBucket(bucket) {
    try {
        log(`\n🔄 Criando bucket: ${bucket.name}...`, 'yellow');
        
        const bucketData = {
            id: bucket.id,
            name: bucket.name,
            public: bucket.public,
            file_size_limit: bucket.file_size_limit,
            allowed_mime_types: bucket.allowed_mime_types
        };

        await makeRequest('/bucket', 'POST', bucketData);
        log(`✅ Bucket '${bucket.name}' criado com sucesso!`, 'green');
        log(`   • Tipo: ${bucket.public ? 'Público' : 'Privado'}`, 'blue');
        log(`   • Tamanho máximo: ${Math.round(bucket.file_size_limit / 1024 / 1024)}MB`, 'blue');
        log(`   • Tipos permitidos: ${bucket.allowed_mime_types.join(', ')}`, 'blue');
        log(`   • Descrição: ${bucket.description}`, 'blue');
        
        return true;
    } catch (error) {
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
            log(`⚠️ Bucket '${bucket.name}' já existe`, 'yellow');
            return true;
        } else {
            log(`❌ Erro ao criar bucket '${bucket.name}': ${error.message}`, 'red');
            return false;
        }
    }
}

async function listBuckets() {
    try {
        const buckets = await makeRequest('/bucket');
        return buckets;
    } catch (error) {
        log(`❌ Erro ao listar buckets: ${error.message}`, 'red');
        return [];
    }
}

async function configureStorage() {
    log('═══════════════════════════════════════════════════════════════', 'cyan');
    log('🗄️ CONFIGURAÇÃO AUTOMÁTICA - SUPABASE STORAGE', 'cyan');
    log('═══════════════════════════════════════════════════════════════\n', 'cyan');

    // Verificar variáveis de ambiente
    if (!SUPABASE_URL || !SERVICE_KEY) {
        log('❌ Variáveis de ambiente não encontradas!', 'red');
        log('Verifique: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY', 'red');
        process.exit(1);
    }

    log('✅ Configurações carregadas', 'green');

    // Verificar se fetch está disponível (Node.js 18+)
    if (typeof fetch === 'undefined') {
        log('📦 Instalando node-fetch...', 'yellow');
        try {
            execSync('npm install node-fetch', { stdio: 'inherit' });
            // Dynamic import for node-fetch in ESM
            const nodeFetch = await import('node-fetch');
            global.fetch = nodeFetch.default;
            log('✅ node-fetch instalado', 'green');
        } catch (error) {
            log('❌ Erro ao instalar node-fetch. Use Node.js 18+ ou instale manualmente.', 'red');
            process.exit(1);
        }
    }

    // Listar buckets existentes
    log('\n🔍 Verificando buckets existentes...', 'yellow');
    const existingBuckets = await listBuckets();
    
    if (existingBuckets.length > 0) {
        log(`📊 ${existingBuckets.length} buckets encontrados:`, 'blue');
        existingBuckets.forEach(bucket => {
            log(`   • ${bucket.name} (${bucket.public ? 'público' : 'privado'})`, 'blue');
        });
    } else {
        log('📊 Nenhum bucket encontrado', 'blue');
    }

    // Criar buckets necessários
    log('\n🚀 Criando buckets necessários...', 'cyan');
    let successCount = 0;
    
    for (const bucket of buckets) {
        const success = await createBucket(bucket);
        if (success) successCount++;
    }

    // Verificar resultado final
    log('\n🔍 Verificando configuração final...', 'yellow');
    const finalBuckets = await listBuckets();
    
    log('\n📊 Buckets configurados:', 'cyan');
    buckets.forEach(bucket => {
        const exists = finalBuckets.some(b => b.name === bucket.name);
        if (exists) {
            log(`✅ ${bucket.name} - ${bucket.description}`, 'green');
        } else {
            log(`❌ ${bucket.name} - NÃO ENCONTRADO`, 'red');
        }
    });

    // Resultado final
    log('\n═══════════════════════════════════════════════════════════════', 'cyan');
    if (successCount === buckets.length) {
        log('🎉 STORAGE CONFIGURADO COM SUCESSO!', 'green');
        log('✅ Todos os buckets foram criados', 'green');
        log('✅ Configurações aplicadas corretamente', 'green');
        log('\n🚀 Próximo passo: Configurar credenciais TTS', 'cyan');
    } else {
        log('⚠️ STORAGE PARCIALMENTE CONFIGURADO', 'yellow');
        log(`✅ ${successCount}/${buckets.length} buckets criados`, 'yellow');
        log('Verifique os erros acima e execute novamente se necessário.', 'yellow');
    }
    log('═══════════════════════════════════════════════════════════════', 'cyan');
}

// Executar se chamado diretamente
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    configureStorage().catch(error => {
        log(`❌ Erro fatal: ${error.message}`, 'red');
        process.exit(1);
    });
}

export { configureStorage };