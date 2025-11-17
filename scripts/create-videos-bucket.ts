/**
 * Script para criar o bucket 'videos' com configurações corretas
 */

import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Carregar .env
function loadEnv() {
  let envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    envPath = path.join(process.cwd(), '..', '.env');
  }
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      line = line.trim();
      if (!line || line.startsWith('#')) return;
      const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/i);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    });
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

type GenericTable<Row extends Record<string, Json>> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
};

type Database = {
  public: {
    Tables: {
      users: GenericTable<{ id: string }>;
      projects: GenericTable<Record<string, Json>>;
      slides: GenericTable<Record<string, Json>>;
      render_jobs: GenericTable<Record<string, Json>>;
      analytics_events: GenericTable<Record<string, Json>>;
      nr_courses: GenericTable<Record<string, Json>>;
      nr_modules: GenericTable<Record<string, Json>>;
    };
    Views: Record<string, never>;
    Functions: Record<string, unknown>;
    Enums: Record<string, unknown>;
    CompositeTypes: Record<string, unknown>;
  };
};

const supabase: SupabaseClient<Database> = createClient<Database>(supabaseUrl, supabaseKey);

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === 'string') {
      return maybeMessage;
    }
  }

  return 'Unknown error';
}

async function createVideosBucket() {
  console.log('\n📦 Criando bucket "videos"...\n');
  
  // Tentar com limite de 100MB ao invés de 500MB
  const { error } = await supabase.storage.createBucket('videos', {
    public: false,
    fileSizeLimit: 104857600, // 100 MB em bytes
    allowedMimeTypes: ['video/mp4', 'video/webm', 'video/quicktime']
  });

  if (error) {
    if (getErrorMessage(error).includes('already exists')) {
      console.log('✅ Bucket "videos" já existe!\n');
      return true;
    } else {
      console.log('❌ Erro ao criar bucket:', getErrorMessage(error));
      console.log('\n💡 Tentando criar sem limitações...\n');
      
      // Tentar sem especificar limitações
      const { error: error2 } = await supabase.storage.createBucket('videos', {
        public: false
      });
      
      if (error2) {
        console.log('❌ Falhou novamente:', getErrorMessage(error2));
        console.log('\n📝 SOLUÇÃO MANUAL NECESSÁRIA:');
        console.log('   1. Abra: https://supabase.com/dashboard/project/ofhzrdiadxigrvmrhaiz/storage/buckets');
        console.log('   2. Clique "New bucket"');
        console.log('   3. Nome: videos');
        console.log('   4. Público: NO');
        console.log('   5. File size limit: 100 MB');
        console.log('   6. Clique "Create bucket"\n');
        return false;
      } else {
        console.log('✅ Bucket "videos" criado com sucesso (sem limitações)!\n');
        return true;
      }
    }
  } else {
    console.log('✅ Bucket "videos" criado com sucesso!\n');
    return true;
  }
}

async function verifyAllBuckets() {
  console.log('📋 Verificando todos os buckets...\n');
  
  const { data: buckets, error } = await supabase.storage.listBuckets();
  
  if (error) {
    console.log('❌ Erro ao listar buckets:', getErrorMessage(error));
    return;
  }
  
  const expectedBuckets = ['videos', 'avatars', 'thumbnails', 'assets'];
  const foundBuckets = buckets?.map(bucket => bucket.name) ?? [];
  
  console.log(`Total: ${foundBuckets.length}/${expectedBuckets.length}\n`);
  
  expectedBuckets.forEach(name => {
    const found = foundBuckets.includes(name);
    console.log(`${found ? '✅' : '❌'} ${name}`);
  });
  
  console.log('\n');
  
  if (foundBuckets.length === expectedBuckets.length) {
    console.log('🎉 Todos os 4 buckets estão criados!\n');
    console.log('✅ SETUP SUPABASE 100% COMPLETO!\n');
    return true;
  } else {
    console.log(`⚠️  ${expectedBuckets.length - foundBuckets.length} bucket(s) faltando\n`);
    return false;
  }
}

async function main() {
  const success = await createVideosBucket();
  await verifyAllBuckets();
  
  if (success) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

main().catch(console.error);
